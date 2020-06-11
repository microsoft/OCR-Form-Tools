// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";

import { IGenerator, FieldFormat, FieldType, ILabel } from "../../../../models/applicationState";
import { randomIntInRange } from "../../../../common/utils";
import { ShimmerLineBase } from "office-ui-fabric-react";


export interface IGeneratedInfo {
    name: string,
    text: string,
    boundingBoxes: GeneratedBboxInfo,
    format: GeneratorTextStyle,
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
    font: string,
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

const defaultStyle: GeneratorTextStyle = {
    text: "SAMPLE",
    font: '100 14px/1.1 san-serif',
    // font: '${style.weight} ${style.size}px/${style.lineHeight} ${style.fontFamily}',
    align: "left",
    baseline: "center", // we can probably do better somehow
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

// the generation step formatting should be done when calibrating the text to display
interface LimitsAndFormat {
    format: Partial<GeneratorTextStyle>,
    // should include as much as possible
    limits: number[][]
}

// TODO seeding
export const generate:(g: IGenerator, ocr: any) => IGeneratedInfo = (generator, ocr) => {
    /**
     * generator: Generator region
     * ocr: ocr read results
     */
    const limitsAndFormat = getStringLimitsAndFormat(generator);
    const text = generateString(generator, limitsAndFormat.limits);
    // Should be in charge of providing everything the training pipeline needs, in addition to something for generation
    // * TODO can we find text dimensions?
    const format = { ...defaultStyle, ...limitsAndFormat.format, text };
    const boundingBoxes = generateBoundingBoxes(generator, format, ocr);
    return {
        name: generator.name,
        text,
        boundingBoxes,
        format
    };
}

/**
 * Define bounding boxes for a given sampled format on a generator.
 * @param generator generator information
 * @param format sampled format
 * @param ocr ocr read results for page
 * TODO support multiline
 * TODO check height scale
 * TODO support offsetY (don't forget inversion - real is TL, canvas is BL)
 */
const generateBoundingBoxes: (g: IGenerator, format: GeneratorTextStyle, ocr: any) => GeneratedBboxInfo =
    (generator, format, ocr) => {
    const text = format.text;
    const full = generator.bbox;
    const center = [(full[0] + full[2]) / 2, (full[1] + full[5]) / 2];
    const mapOffsetX = format.offsetX;
    const mapOffsetY = format.offsetY;
    // real per map unit
    const widthScale = generator.bbox[0] / generator.canvasBbox[0];
    const heightScale = (generator.bbox[5] - generator.bbox[1]) / (generator.canvasBbox[1] - generator.canvasBbox[5]);

    // track all words (for labels)
    let words: WordLevelBbox[] = [];
    const lines: OCRLine[] = [];
    const lineStrings = text.split("\n");
    lineStrings.forEach(lineString => {
        const wordStrings = lineString.split(" ");
        let accumulatedString = "";
        const mapTextOffsetY = 0; // TODO multiline
        const lineWords: WordLevelBbox[] = [];
        wordStrings.forEach(wordString => {
            // Calculate current word base offset
            const withoutMetrics = getTextMetrics(accumulatedString, format.font);
            accumulatedString += wordString + " ";
            const wordMetrics = getTextMetrics(wordString, format.font);
            const mapTextOffsetX = withoutMetrics.width * generator.resolution;
            const mapWordWidth = wordMetrics.width * generator.resolution;
            const mapWordHeight = (wordMetrics.actualBoundingBoxAscent - wordMetrics.actualBoundingBoxDescent) * generator.resolution;

            const imageOffsetX = (mapOffsetX + mapTextOffsetX) * widthScale;
            const imageOffsetY = (mapOffsetY + mapTextOffsetY) * heightScale * 1.1;

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

const GEN_CONSTANTS = {
    weight: 100,
    weightJitter: 50,
    height: 1,
    heightJitter: .2,
    size: 14,
    sizeJitter: 2,
    offsetX: 10,
    offsetXJitter: 10,
    offsetY: 0,
    offsetYJitter: 5,
    width_low: 0.3,
    width_high: 1.05,
    height_low: 0.2,
    height_high: 1,
}

const getStringLimitsAndFormat: (g: IGenerator) => LimitsAndFormat = (generator) => {
    // from allocated space, we should be able to determine lower and upper bound on used space, for width and height
    // TODO better than linear lower bound (super long fields shouldn't have multiple)

    // determine map units per character (MUpC)
    // TODO extract from other characters in ocr
    // ocr gives inches, which we can convert to mapUnits
    // Map units per character - currently hard coded
    const mapWidthPerChar = 18; // map units per character - what's needed to calculate this?
    const mapHeightPerChar = 24; // map units per character - what's needed to calculate this?
    // probably resolution and that's it right
    // b. looking at map units per character elsewhere in ocr

    const mapWidth = generator.canvasBbox[2] - generator.canvasBbox[0];
    const mapHeight = generator.canvasBbox[1] - generator.canvasBbox[5];

    const charWidthLow = Math.round(mapWidth * GEN_CONSTANTS.width_low / mapWidthPerChar);
    const charWidthHigh = Math.round(mapWidth * GEN_CONSTANTS.width_high / mapWidthPerChar);
    const charHeightLow = Math.max(1, Math.round(mapHeight * GEN_CONSTANTS.height_low / mapHeightPerChar));
    const charHeightHigh = Math.round(mapHeight * GEN_CONSTANTS.height_high / mapHeightPerChar);
    // * We'll run into trouble once we use OCR. Given fixed map width conversion, we're fine.

    // Map Units to Font size
    // TODO calculate font size and font weight
    // Note that this "fontSize" translates to a proper fontSize in OL text formatting

    // determine font size that uses MUpC (on avg) - assigning that to our generated text
    // TODO search for the correct font size - the one that matches our MUpC assumption
    const size = GEN_CONSTANTS.size + jitter(GEN_CONSTANTS.sizeJitter, true);
    const weight = GEN_CONSTANTS.weight + jitter(GEN_CONSTANTS.weightJitter, true);
    const height = GEN_CONSTANTS.height + jitter(GEN_CONSTANTS.heightJitter, true);
    const font = `${weight} ${size}px/${height} sans-serif`;

    // Positioning
    const mapCenter = (generator.canvasBbox[2] + generator.canvasBbox[0]) / 2;
    const mapLeft = generator.canvasBbox[0];
    const offsetX = mapLeft - mapCenter + GEN_CONSTANTS.offsetX + jitter(GEN_CONSTANTS.offsetXJitter);
    const offsetY = GEN_CONSTANTS.offsetY + jitter(GEN_CONSTANTS.offsetYJitter);
    return {
        limits: [[charWidthLow, charWidthHigh], [charHeightLow, charHeightHigh]],
        format: {
            font,
            offsetX,
            offsetY,
        },
    };
}

const jitter = (max: number, round: boolean = false) => {
    const val = (Math.random() * 2 - 1) * max;
    return round ? Math.round(val) : val;
}

export const getTextMetrics = (text, font) => {
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
                page: 1, // TODO anchor page
                text: generatedInfo.text,
                boundingBoxes: [w.boundingBoxPercentage],
        }))
    };
}
