// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";

import { IGenerator, FieldFormat, FieldType, ILabel } from "../../../../models/applicationState";
import { randomIntInRange } from "../../../../common/utils";

export interface IGeneratedInfo {
    name: string,
    text: string,
    boundingBoxes: GeneratedBboxInfo,
    format: GeneratorTextStyle,
    page: number,
}
interface WordLevelBbox {
    boundingBox: number[],
    boundingBoxPercentage: number[],
    text: string
}

interface GeneratedBboxInfo {
    full: number[], // drawn
    lines: OCRLine[], // taut to words, line bbox
    words: WordLevelBbox[], // bbox for each word
}

interface OCRWord {
    boundingBox: number[],
    text: string,
    confidence: number,
}

export interface OCRLine {
    boundingBox: number[],
    text: string,
    words: OCRWord[]
}

export interface GeneratorTextStyle {
    text: string,
    fontWeight: number,
    fontSize: string, // e.g. 14px
    lineHeight: number,
    fontFamily: string, // e.g. sans-serif
    align: string,
    baseline: string,
    offsetX: number,
    offsetY: number,
    placement: any,
    maxAngle: any,
    overflow: any,
    rotation: number,
    fill: any,
    outlineColor: any,
    outlineWidth: number,
}

// Top of text generates at center
// Note this is only for rendered text - the actual OCR generation is separate, but should align with this
const defaultStyle: GeneratorTextStyle = {
    text: "SAMPLE",
    fontWeight: 100,
    fontSize: '14px',
    lineHeight: 1,
    fontFamily: 'sans-serif',
    align: "left",
    baseline: "top", // kinda arbitrary reference but easier to think about
    offsetX: 0,
    offsetY: 0,
    placement: "point",
    maxAngle: undefined,
    overflow: "true",
    rotation: 0,
    fill: "#000",
    outlineColor: "#E00",
    outlineWidth: 0,
};

const GEN_CONSTANTS = {
    weight: 100,
    weightJitter: 50,
    height: 1,
    heightJitter: .2,
    widthScale: 2,
    widthScaleJitter: 1.2,
    heightScale: 1.5,
    heightScaleJitter: 1.2,
    sizeJitter: 2,
    offsetX: 10, // offset in canvas orientation, from center (rendering point)
    offsetXJitter: 10,
    offsetY: 0, // offset
    offsetYJitter: 5,
    // TODO better than linear lower bound (super long fields shouldn't have multiple)
    width_low: 0.3,
    width_high: 1.05,
    height_low: 0.2,
    height_high: 1,
    sizing_samples: 10, // sample count for line sampling
    sizing_string: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    sizing_range: [10, 30] // search range for font sizing
}

// the generation step formatting should be done when calibrating the text to display
interface LimitsAndFormat {
    format: Partial<GeneratorTextStyle>,
    // should include as much as possible
    limits: number[][]
}

// TODO seeding
export const generate:(g: IGenerator, ocr: any) => IGeneratedInfo = (generator, ocr) => {
    /**
     * Generation step - provides all generation info. From generator + context (ocr) to generated data.
     * generator: Generator region
     * ocr: ocr read results
     */
    const mapUnitsPerChar = getMapUnitsPerChar(generator, ocr);
    const limitsAndFormat = getStringLimitsAndFormat(generator, mapUnitsPerChar);
    const text = generateString(generator, limitsAndFormat.limits);
    const format = { ...defaultStyle, ...limitsAndFormat.format, text };
    const boundingBoxes = generateBoundingBoxes(generator, format, ocr, mapUnitsPerChar);
    return {
        name: generator.name,
        text,
        boundingBoxes,
        format,
        page: generator.page,
    };
}


const getMapUnitsPerChar: (g: IGenerator, ocr: any) => number[] = (generator, ocr) => {
    // ! With this current alg, we should only need to do once per page, not per generator
    // "font size" approximated by the median font size of the document
    // can probably be elaborated, i.e. font long strings of text or closest form elements...
    const sampledLines = [];
    for (let i = 0; i < GEN_CONSTANTS.sizing_samples; i++) {
        sampledLines.push(ocr.lines[randomIntInRange(0, ocr.lines.length)]);
    }
    const sampledWords = sampledLines.map(l => l.words[0]);
    const widths = [];
    const heights = [];
    sampledWords.forEach(w => {
        widths.push((w.boundingBox[2] - w.boundingBox[0]) / w.text.length);
        heights.push((w.boundingBox[5] - w.boundingBox[1]));
    });
    const [ widthScale, heightScale ] = getImagePerMapUnit(generator);
    const mapWidthPerChar = median(widths) / widthScale ;
    const mapHeightPerChar = median(heights) / heightScale;
    const scaledWidth = mapWidthPerChar * GEN_CONSTANTS.widthScale * GEN_CONSTANTS.widthScaleJitter;
    const scaledHeight = mapHeightPerChar * GEN_CONSTANTS.heightScale * GEN_CONSTANTS.heightScaleJitter;

    return [ scaledWidth, scaledHeight ];
}

const median: (a: number[]) => number = (rawArray) => {
    const array = rawArray.sort();
    if (array.length % 2 === 0) { // array with even number elements
        return (array[array.length/2] + array[(array.length / 2) - 1]) / 2;
    }
    else {
        return array[(array.length - 1) / 2]; // array with odd number elements
    }
};

const getImagePerMapUnit: (g: IGenerator) => number[] = (generator) => {
    const widthScale = generator.bbox[0] / generator.canvasBbox[0];
    const heightScale = (generator.bbox[5] - generator.bbox[1]) / (generator.canvasBbox[1] - generator.canvasBbox[5]);
    return [widthScale, heightScale];
}
/**
 * Define bounding boxes for a given sampled format on a generator.
 * @param generator generator information
 * @param format sampled format
 * @param ocr ocr read results for page
 */
const generateBoundingBoxes: (g: IGenerator, format: GeneratorTextStyle, ocr: any, mapUnitsPerChar: number[]) => GeneratedBboxInfo =
    (generator, format, ocr, mapUnitsPerChar) => {
    const text = format.text;
    const full = generator.bbox;
    const center = [(full[0] + full[2]) / 2, (full[1] + full[5]) / 2];
    const mapOffsetX = format.offsetX;
    const mapOffsetY = -format.offsetY; // center + map offset y should get y of top box
    // negative due to map -> image/canvas inversion
    // doing center displacement to match rendering flow

    // For true text metrics, we can measure mapWidth, but we can't measure height. (Without div hack)
    // We can use the heuristic used to calculate font to render
    const [ mapWidthPerChar, mapHeightPerChar ] = mapUnitsPerChar;

    // real per map unit
    const [ widthScale, heightScale ] = getImagePerMapUnit(generator);

    // track all words (for labels)
    let words: WordLevelBbox[] = [];
    const lines: OCRLine[] = [];
    const lineStrings = text.split("\n");
    let mapTextOffsetY = 0;
    lineStrings.forEach(lineString => {
        const wordStrings = lineString.split(" ");
        let accumulatedString = "";
        const lineWords: WordLevelBbox[] = [];
        wordStrings.forEach(wordString => {
            // Calculate current word base offset
            const withoutMetrics = getTextMetrics(accumulatedString, styleToFont(format));
            accumulatedString += wordString + " ";
            const wordMetrics = getTextMetrics(wordString, styleToFont(format));
            const mapTextOffsetX = withoutMetrics.width * generator.resolution;
            const mapWordWidth = wordMetrics.width * generator.resolution;
            const mapWordHeight = (wordMetrics.actualBoundingBoxAscent - wordMetrics.actualBoundingBoxDescent) * generator.resolution;

            const imageOffsetX = (mapOffsetX + mapTextOffsetX) * widthScale;
            const imageOffsetY = (mapOffsetY + mapTextOffsetY) * heightScale;

            // make box
            const imageWordHeight = mapWordHeight * heightScale;
            const imageWordWidth = mapWordWidth * widthScale;
            // * start from bbox TOP LEFT (smallest coords)
            // since origin is TL, TL does not include the word height, we include it as we go down
            const wordTl = [
                center[0] + imageOffsetX,
                center[1] + imageOffsetY
            ];
            const wordTr = [
                center[0] + imageOffsetX + imageWordWidth,
                center[1] + imageOffsetY
            ];
            const wordBr = [
                center[0] + imageOffsetX + imageWordWidth,
                center[1] + imageOffsetY + imageWordHeight];
            const wordBl = [
                center[0] + imageOffsetX,
                center[1] + imageOffsetY + imageWordHeight
            ];

            const boundingBox = [].concat.apply([], [wordTl, wordTr, wordBr, wordBl]);;
            const boundingBoxPercentage = boundingBox.map((el, index) => {
                if (index % 2 === 0) {
                    return el / ocr.width;
                }
                return el / ocr.height;
            });

            lineWords.push({
                boundingBox,
                boundingBoxPercentage,
                text: wordString,
            });
        });

        mapTextOffsetY += mapHeightPerChar * format.lineHeight;

        // get line extent from first and last words
        const tl = lineWords[0].boundingBox.slice(0, 2);
        const br = lineWords.slice(-1)[0].boundingBox.slice(4, 6);
        const lineBBox = [
            tl[0], tl[1],
            br[0], tl[1],
            br[0], br[1],
            tl[0], br[1],
        ];
        words = words.concat(lineWords);
        lines.push({
            boundingBox: lineBBox,
            text: lineString,
            words: lineWords.map(completeOCRWord),
        });
    });

    return {
        full,
        lines,
        words
    };
}


const generateString: (g: IGenerator, l: number[][]) => string = (generator, limits) => {
    const [ widthLimit, heightLimit ] = limits;
    const [ low, high ] = widthLimit;
    const [ heightLow, heightHigh ] = heightLimit;
    const linesUsed = randomIntInRange(heightLow, heightHigh);
    const defaultRegex = `^.{${low},${high}}$`;
    const dd = "(0[1-9]|[12][0-9]|3[01])";
    const mm = "(0[1-9]|1[012])";
    const yy = "(19|20)\\d\\d";
    const regexDict = {
        [FieldType.String]: {
            [FieldFormat.NotSpecified]: defaultRegex,
            [FieldFormat.Alphanumeric]: `^[a-zA-Z0-9 ]{${low},${high}}$`,
            [FieldFormat.NoWhiteSpaces]: `^[a-zA-Z0-9]{${low},${high}}$`,
        },
        [FieldType.Number]: {
            [FieldFormat.NotSpecified]: `^\\d{${low},${high}}$`,
            [FieldFormat.Currency]: `^\\$?((([1-9][0-9]){2},){${Math.round(low/4)},${Math.round(high/4)}}[0-9]{3}|[0-9]{${low},${high}})(\\.[0-9][0-9])?$`,
        },
        [FieldType.Date]: {
            [FieldFormat.NotSpecified]: `^\\d\\d([- /.])\\d\\d\\1\\d{2,4}$
            `,
            [FieldFormat.DMY]: `^${dd}([- /.])${mm}\\1${yy}$`,
            [FieldFormat.MDY]: `^${mm}([- /.])${dd}\\1${yy}$`,
            [FieldFormat.YMD]: `^${yy}([- /.])${mm}\\1${dd}$`,
        },
        [FieldType.Time]: {
            [FieldFormat.NotSpecified]: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
        },
        [FieldType.Integer]: {
            [FieldFormat.NotSpecified]: `^\\d{${low},${high}}$`,
        },
        [FieldType.SelectionMark]: {
            // no support
        },
    }

    const fieldType = generator.type;
    const fieldFormat = generator.format;
    let regex = regexDict[FieldType.String][FieldFormat.NotSpecified];
    if (fieldType in regexDict && fieldFormat in regexDict[fieldType]) {
        regex = regexDict[fieldType][fieldFormat];
    }
    // @ts-ignore - something is messed up with this import, satisfying it in lint breaks on runtime
    const randexp = new RandExp(regex);
    // Best effort for multiline atm - just do multiple newlines
    const lineStrings = [];
    for (let i = 0; i < linesUsed; i++) {
        lineStrings.push(randexp.gen());
    }
    return lineStrings.join("\n");
}

const getStringLimitsAndFormat: (g: IGenerator, mapUnitsPerChar: number[]) => LimitsAndFormat = (generator, mapUnitsPerChar) => {
    const [ mapWidthPerChar, mapHeightPerChar ] = mapUnitsPerChar;

    const mapWidth = generator.canvasBbox[2] - generator.canvasBbox[0];
    const mapHeight = generator.canvasBbox[1] - generator.canvasBbox[5];

    const charWidthLow = Math.round(mapWidth * GEN_CONSTANTS.width_low / mapWidthPerChar);
    const charWidthHigh = Math.round(mapWidth * GEN_CONSTANTS.width_high / mapWidthPerChar);
    const charHeightLow = Math.max(1, Math.round(mapHeight * GEN_CONSTANTS.height_low / mapHeightPerChar));
    const charHeightHigh = Math.round(mapHeight * GEN_CONSTANTS.height_high / mapHeightPerChar);

    const fontWeight = GEN_CONSTANTS.weight + jitter(GEN_CONSTANTS.weightJitter, true);
    const lineHeight = GEN_CONSTANTS.height + jitter(GEN_CONSTANTS.heightJitter, true);
    // Map Units to Font size - Search for the right size by measuring canvas
    // Using height since that's more important for visual fit
    let bestSize = GEN_CONSTANTS.sizing_range[0];
    let bestDistance = 1000;
    let curSize = bestSize;
    const targetPixelHeight = mapHeightPerChar * generator.resolution;
    while (curSize < GEN_CONSTANTS.sizing_range[1]) {
        const font = `${fontWeight} ${curSize}px/${lineHeight} sans-serif`;
        const metrics = getTextMetrics(GEN_CONSTANTS.sizing_string, font);
        const newHeight = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent;
        const newDistance = Math.abs(newHeight - targetPixelHeight);
        if (newDistance < bestDistance) {
            bestDistance = newDistance;
            bestSize = curSize;
            curSize += 1;
            // linear search best search
        } else {
            break;
        }
    }

    const fontSize = `${bestSize + GEN_CONSTANTS.sizeJitter}px`;

    // Positioning - offset is in MAP UNITS
    const mapCenterWidth = (generator.canvasBbox[2] + generator.canvasBbox[0]) / 2;
    const mapLeft = generator.canvasBbox[0];
    const mapCenterHeight = (generator.canvasBbox[1] + generator.canvasBbox[5]) / 2;
    const mapTop = generator.canvasBbox[1];
    const offsetX = (mapLeft - mapCenterWidth + GEN_CONSTANTS.offsetX + jitter(GEN_CONSTANTS.offsetXJitter));
    const offsetY = (mapTop - mapCenterHeight + GEN_CONSTANTS.offsetY + jitter(GEN_CONSTANTS.offsetYJitter));
    return {
        limits: [[charWidthLow, charWidthHigh], [charHeightLow, charHeightHigh]],
        format: {
            fontSize,
            fontWeight,
            lineHeight,
            offsetX,
            offsetY,
        },
    };
}

const jitter = (max: number, round: boolean = false) => {
    const val = (Math.random() * 2 - 1) * max;
    return round ? Math.round(val) : val;
}

export const styleToFont = (style: GeneratorTextStyle) => `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;

const getTextMetrics = (text, font) => {
    // re-use canvas object for better performance
    const canvas = document.createElement("canvas");
    // const canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text)
    return metrics;
}

export const generatorInfoToOCRLines: (g: IGeneratedInfo) => OCRLine[] = (generatedInfo) => {
    return generatedInfo.boundingBoxes.lines;
}

const completeOCRWord: (wordInfo: any) => OCRWord = (wordInfo) => {
    return {
        boundingBox: wordInfo.boundingBox,
        text: wordInfo.text,
        confidence: 1.0
    };
}

export const generatorInfoToLabel: (g: IGeneratedInfo) => ILabel = (generatedInfo) => {
    return {
        label: generatedInfo.name,
        key: null,
        value: generatedInfo.boundingBoxes.words.map(w => ({
                page: generatedInfo.page,
                text: w.text,
                boundingBoxes: [w.boundingBoxPercentage],
        }))
    };
}
