// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";
import * as randomWords from "random-words";
import _ from "lodash";

import { IGenerator, FieldFormat, FieldType, ILabel, IGeneratorTagInfo } from "../../../../models/applicationState";
import { randomIntInRange } from "../../../../common/utils";

// Debugging controls
const DO_JITTER = true;
const USE_RANDOM_WORDS = true;

// Note - for selectionMarks, text will indicate selection state (as used by labels)
// We'll need to format appropriately for OCR
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
    offsetY: number, // returned with down = positive
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

// TODO expose these in control panel
const GEN_CONSTANTS = {
    weight: 100,
    weightJitter: 25,
    lineHeight: 1,
    lineHeightJitter: .2,
    widthScale: 1,
    widthScaleJitter: .05,
    heightScale: 1,
    heightScaleJitter: .05,
    digitWidthScale: 1.3, // digits are a little wider, accommodate
    // https://stackoverflow.com/questions/14061228/remove-white-space-above-and-below-large-text-in-an-inline-block-element
    leadingLineHeightScale: 1.25, // account for the font-to-full height discrepancy with our default font
    sizeJitter: 1,
    offsetX: .05, // ratio offset
    offsetXJitter: .05,
    offsetY: .05,
    offsetYJitter: .1, // ratio offset
    // Char limits
    // TODO better than linear lower bound (super long fields shouldn't have multiple)
    width_low: 0.2,
    width_high: .95,
    height_low: 0.2,
    height_high: 0.95, // try not to bleed past the box due to scaling inaccs
    sizing_samples: 12, // sample count for line sampling
    sizing_string: 'abcdefghiklmnorstuvwxzABCDEFGHIJKLMNOPQRSTUVWXYZ', // we drop the baselines so we can be a little bigger
    sizing_range: [4, 100] // search range for font sizing
}

// the generation step formatting should be done when calibrating the text to display
interface LimitsAndFormat {
    format: Partial<GeneratorTextStyle>,
    // should include as much as possible
    limits: number[][]
}

// TODO seeding
export const generate:(g: IGenerator, ocr: any, resolution?: any) => IGeneratedInfo = (generator, ocr, resolution=1) => {
    /**
     * Generation step - provides all generation info. From generator + context (ocr) to generated data.
     * generator: Generator region
     * ocr: ocr read results
     */
    // This still isn't pixel perfect, I can't figure out how OL does the font size calculations internally (just a workaround atm)
    // But actually this is a magic number designed to match css pixels to image units
    // There's no way to actually deal with this because we have no API to measure ^
    const adjustedResolution = 1/66; // resolution * 1.2;
    // Make smaller to make font size smaller
     // Calculate a sizing first pass
    const ocrUnitsPerChar = getOcrUnitsPerChar(generator, ocr);

    // Translate to rough character bounds and format
    const limitsAndFormat = getStringLimitsAndFormat(generator, ocrUnitsPerChar, ocr, adjustedResolution);
    // Generate string from bounds
    const text = generateString(generator, limitsAndFormat.limits);
    // if (generator.tag.type === FieldType.SelectionMark) {
    //     console.log(text);
    // }
    const format = { ...defaultStyle, ...limitsAndFormat.format, text };
    // Translate string into precise OCR boxes
    const boundingBoxes = generateBoundingBoxes(generator, format, ocr, ocrUnitsPerChar, adjustedResolution);
    // If we wanted to be more careful about existing characters, we'd need to merge the last two steps
    return {
        name: generator.tag.name,
        text,
        boundingBoxes,
        format,
        page: generator.page,
    };
}


const getOcrUnitsPerChar: (g: IGenerator, ocr: any) => number[] = (generator, ocr) => {
    // "font size" approximated by replaced OCR line or median font size of doc
    if (generator.tag.type === FieldType.SelectionMark) return [1, 1];

    let sampledLines = [];
    if (generator.containsText) {
        sampledLines = sampledLines.concat(generator.ocrLines.map(ln => ocr.lines[ln]));
    } else {
        for (let i = 0; i < GEN_CONSTANTS.sizing_samples; i++) {
            sampledLines.push(ocr.lines[randomIntInRange(0, ocr.lines.length)]);
        }
    }
    const sampledNestedWords = sampledLines.map(l => l.words);
    let sampledWords = [].concat.apply([], sampledNestedWords);
    if (generator.containsText) {
        // filter out only the words that are truly inside the generator - ocr can combine chunks with multiple sizes
        sampledWords = sampledWords.filter(w => isBoxCenterInBbox(w.boundingBox, generator.bbox));
    }
    const widths = [];
    const heights = [];
    sampledWords.forEach(w => {
        // one character text is typically anomalous (i.e. non-standard char) (this may need revision outside of english)
        widths.push((w.boundingBox[2] - w.boundingBox[0]) / w.text.length);
        heights.push((w.boundingBox[5] - w.boundingBox[1]));
    });

    // - scale to map units, which we can convert to pixels
    const widthPerChar = median(widths);
    const heightPerChar = Math.max(...heights); // better hope we get the spread somewhere in the line
    const scaledWidth = widthPerChar * GEN_CONSTANTS.widthScale * (1 + jitter(GEN_CONSTANTS.widthScaleJitter));
    const scaledHeight = heightPerChar * GEN_CONSTANTS.heightScale * (1 + jitter(GEN_CONSTANTS.heightScaleJitter));
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

/**
 * Define bounding boxes for a given sampled format on a generator.
 * @param generator generator information
 * @param format sampled format
 * @param ocr ocr read results for page
 * @param unitsPerChar ocr units per character
 * @param resolution scaling magic number
 */
const generateBoundingBoxes: (g: IGenerator, format: GeneratorTextStyle, ocr: any, unitsPerChar: number[], resolution?: number) => GeneratedBboxInfo =
    (generator, format, ocr, unitsPerChar, resolution=1) => {

    const text = format.text;
    const full = generator.bbox;
    if (generator.tag.type === FieldType.SelectionMark) {
        // return a single "word" that is the original bbox for label
        const selectionWord = {
            boundingBox: full,
            boundingBoxPercentage: scaleBbox(full, 1/ocr.width, 1/ocr.height),
            text,
        };
        return {
            full,
            lines: [], // omit ocr lines - we'll use what's given without edits
            words: [selectionWord]
        }
    }

    const center = [(full[0] + full[2]) / 2, (full[1] + full[5]) / 2];
    const offsetX = format.offsetX;
    const offsetY = format.offsetY; // center + map offset y should get y of top box
    // negative due to map -> image/canvas inversion
    // doing center displacement to match rendering flow

    // For true text metrics, we can measure mapWidth, but we can't measure height. (Without div hack)
    // We can use the same heuristic used to calculate font format
    const [ widthPerChar, heightPerChar ] = unitsPerChar;

    // track all words (for labels)
    let words: WordLevelBbox[] = [];
    const lines: OCRLine[] = [];
    const lineStrings = text.split("\n");
    let textOffsetY = 0;
    lineStrings.forEach(lineString => {
        const wordStrings = lineString.split(" ");
        let accumulatedString = "";
        const lineWords: WordLevelBbox[] = [];
        wordStrings.forEach(wordString => {
            // Calculate current word base offset (in pixels)
            const withoutMetrics = getTextMetrics(accumulatedString, styleToFont(format));
            accumulatedString += wordString + " ";
            const wordMetrics = getTextMetrics(wordString, styleToFont(format));
            // resolution is map units per pixel
            const textOffsetX = withoutMetrics.width * resolution;
            const imageWordWidth = wordMetrics.width * resolution;
            // measure again since it's a diff word than the standard string
            const imageWordHeight = (wordMetrics.actualBoundingBoxAscent + wordMetrics.actualBoundingBoxDescent) * resolution;
            // Align top is alignment with top of font (rendering obeys font baseilene)
            // Thus, if we're short (as indicated by measured height), we'll need to offset by the difference
            const alignmentMeasure = getTextMetrics("M", styleToFont(format));
            const alignmentHeight =  (alignmentMeasure.actualBoundingBoxAscent - wordMetrics.actualBoundingBoxAscent) * resolution;

            const imageOffsetX = offsetX + textOffsetX;
            const imageOffsetY = offsetY + textOffsetY + alignmentHeight;

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

        textOffsetY += heightPerChar * format.lineHeight * GEN_CONSTANTS.leadingLineHeightScale;

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


const generateString: (g: IGenerator, l: number[][], sampledLines?: string[]) => string = (generator, limits, sampledLines) => {

    // heuristic algorithm, with an attempt at reflecting underlying distribution if existing


    const [ widthLimit, heightLimit ] = limits;
    const [ low, high ] = widthLimit;
    const [ heightLow, heightHigh ] = heightLimit;
    const linesUsed = randomIntInRange(heightLow, heightHigh);

    const defaultRegex = `^[a-zA-Z ]{${low},${high}}$`; // `^.{${low},${high}}$`;
    const dd = "(0[1-9]|[12][0-9]|3[01])";
    const mm = "(0[1-9]|1[012])";
    const yy = "(19|20)\\d\\d";
    const regexDict = {
        [FieldType.String]: {
            [FieldFormat.NotSpecified]: defaultRegex,
            [FieldFormat.Alphanumeric]: `^[a-zA-Z ]{${low},${high}}$`,
            // [FieldFormat.Alphanumeric]: `^[a-zA-Z0-9 ]{${low},${high}}$`,
            [FieldFormat.NoWhiteSpaces]: `^[a-zA-Z0-9]{${low},${high}}$`,
        },
        [FieldType.Number]: {
            [FieldFormat.NotSpecified]: `^\\d{${low},${high}}$`,
            // [FieldFormat.Currency]: `^\\$?((([1-9][0-9]){1,2},){${Math.round(low/5)},${Math.round(high/5)}}[0-9]{3}|[0-9]{${low},${high}})(\\.[0-9][0-9])?$`,
            // While generating actual currency is nice, regular numbers are much more stable
            [FieldFormat.Currency]: `^\\$?([0-9]{${low},${high-2}})(\\.[0-9][0-9])?$`,
        },
        [FieldType.Date]: {
            [FieldFormat.NotSpecified]: `^\\d\\d([- /.])\\d\\d\\1\\d{2,4}$
            `,
            [FieldFormat.DMY]: `^${dd}([- /.])${mm}\\2${yy}$`,
            [FieldFormat.MDY]: `^${mm}([- /.])${dd}\\2${yy}$`,
            [FieldFormat.YMD]: `^${yy}([- /.])${mm}\\2${dd}$`,
        },
        [FieldType.Time]: {
            [FieldFormat.NotSpecified]: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
        },
        [FieldType.Integer]: {
            [FieldFormat.NotSpecified]: `^\\d{${low},${high}}$`,
        },
        [FieldType.SelectionMark]: {
            [FieldFormat.NotSpecified]: `^selected|unselected$`,
        },
    }

    const fieldType = generator.tag.type;
    const fieldFormat = generator.tag.format;
    let instanceGenerator = () => {
        let regex = regexDict[FieldType.String][FieldFormat.NotSpecified];
        if (fieldType in regexDict && fieldFormat in regexDict[fieldType]) {
            regex = regexDict[fieldType][fieldFormat];
        }
        // @ts-ignore - something is messed up with this import, satisfying it in lint breaks on runtime
        const randexp = new RandExp(regex);
        return randexp.gen();
    }

    if (USE_RANDOM_WORDS && fieldType === FieldType.String && [FieldFormat.NotSpecified, FieldFormat.Alphanumeric].includes(fieldFormat)) {
        instanceGenerator = () => {
            // low, high
            const maxLength = 12; // there's a weird balance to strike here...
            const formatter = (word, index)=> {
                return Math.random() < 0.3 ? word.slice(0,1).toUpperCase().concat(word.slice(1)) : word;
            }
            return randomWords({
                min: Math.max(Math.round(low / maxLength), 1),
                max: Math.round(high / 8), // Assume average length is 4.7, buff for the min (should do a reroll if too long)
                maxLength,
                minLength: 6,
                join: " ",
                formatter,
            });
        };
    }

    const lineStrings = [];
    // Best effort for multiline atm - just do multiple newlines
    for (let i = 0; i < linesUsed; i++) {
        lineStrings.push(instanceGenerator());
    }
    return lineStrings.join("\n");
}

/**
 * Returns string limits as determined by absolute units, and format, as determined by current canvas resolution
 * @param generator generator to use
 * @param unitsPerChar absolute scaling in OCR units
 * @param ocr used as reference for font sizing
 * @param resolution current canvas resolution (omitted on training gen)
 */
const getStringLimitsAndFormat: (g: IGenerator, unitsPerChar: number[], ocr: any, resolution?: number) => LimitsAndFormat =
    (generator, unitsPerChar, ocr, resolution = 1) => {
    if (generator.tag.type === FieldType.SelectionMark) {
        return {
            format: {},
            limits: [[0, 0], [1, 2]]
        }
    }

    const fontWeight = GEN_CONSTANTS.weight + jitter(GEN_CONSTANTS.weightJitter, true);
    const lineHeight = GEN_CONSTANTS.lineHeight + jitter(GEN_CONSTANTS.lineHeightJitter, true);

    // Map Units to Font size - Search for the right size by measuring canvas
    let [ widthPerChar, heightPerChar ] = unitsPerChar;
    if ([FieldType.Number, FieldType.Integer, FieldType.Date, FieldType.Time].includes(generator.tag.type)) {
        widthPerChar *= GEN_CONSTANTS.digitWidthScale;
    }

    const boxWidth = generator.bbox[2] - generator.bbox[0];
    const boxHeight = generator.bbox[5] - generator.bbox[1];
    const effectiveLineHeight = heightPerChar * lineHeight * GEN_CONSTANTS.leadingLineHeightScale;

    const charWidthLow = Math.max(1, Math.round(boxWidth * GEN_CONSTANTS.width_low / widthPerChar));
    const charWidthHigh = Math.round(boxWidth * GEN_CONSTANTS.width_high / widthPerChar) + 1;

    const charHeightLow = 1; // Math.max(1, Math.round(boxHeight * GEN_CONSTANTS.height_low / effectiveLineHeight));
    let charHeightHigh = Math.floor(boxHeight * GEN_CONSTANTS.height_high / effectiveLineHeight) + 1; // +1 for exlcusive, floor for pessimistic
    if (charHeightHigh < 4 && (!generator.ocrLines || generator.ocrLines.length <= 1)) { // unless we know it's multiline, be passive
        charHeightHigh = 2;
    }
    // Using height since that's more important for visual fit
    let bestSize = GEN_CONSTANTS.sizing_range[0];
    let bestDistance = 1000;
    let curSize = bestSize;
    // ! The target pixel height shouldn't change wrt the zoom the generator was created at
    // So - map units correspond in a fixed way with OCR, which is good
    // We introduce pixels because we need it to measure rendered text to calculate bboxes and size things (actually just for the preview)
    // The pixel metrics of the text we measure is on an arbitrary canvas
    // But pixels are constant across canvases, so it's effectively the pixel metrics on our canvas
    // Which we can validate as the proper pixel metrics we expect given current resolution
    // But pixels AREN'T constant across canvases,
    // As on this canvas, font size doesn't have a fixed pixel height!
    // So the actual conversion from pixels to image units is arbitrary,
    // but the important bit is that it's consistent between when we set it
    // we'll probably need to add an adjustment factor for different screens
    // TODO deal with this ^
    // and when we use it for measuring boxes later
    // This is all captured in the resolution factor
    const targetPixelHeight = heightPerChar / resolution;
    while (curSize < GEN_CONSTANTS.sizing_range[1]) {
        const font = `${fontWeight} ${curSize}px/${lineHeight} sans-serif`;
        let sizingString = GEN_CONSTANTS.sizing_string;
        if (generator.containsText) {
            // TODO filter out actual text (not super important)
            sizingString = generator.ocrLines.map(ln => ocr.lines[ln]).join("");
        }
        const metrics = getTextMetrics(sizingString, font);
        const newHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const newDistance = Math.abs(newHeight - targetPixelHeight);
        if (newDistance <= bestDistance) {
            bestDistance = newDistance;
            bestSize = curSize;
            curSize += 1;
            // linear search best search
        } else {
            break;
        }
    }

    const fontSize = `${bestSize + jitter(GEN_CONSTANTS.sizeJitter)}px`;

    // Positioning - offset is in OCR Units

    const centerWidth = (generator.bbox[2] + generator.bbox[0]) / 2;
    const left = generator.bbox[0];
    const centerHeight = (generator.bbox[1] + generator.bbox[5]) / 2;
    const top = generator.bbox[1];
    const ratioOffsetX = GEN_CONSTANTS.offsetX + jitter(GEN_CONSTANTS.offsetXJitter);
    const randomOffsetX = (generator.bbox[2] - generator.bbox[0]) * ratioOffsetX;

    const offsetX = (left - centerWidth + randomOffsetX);

    // OffsetY - passively represents positive distance from top to center (positive due to map coords)
    // Thus if you add it, you move your point from the center to the top
    let ratioOffsetY = GEN_CONSTANTS.offsetY + jitter(GEN_CONSTANTS.offsetYJitter);
    if (charHeightHigh > 4) {
        // if free-response, reduce offsetY ratio
        ratioOffsetY /= 2;
    }
    const randomOffsetY = (generator.bbox[5] - generator.bbox[1]) * ratioOffsetY;
    let offsetY = (top - centerHeight) + randomOffsetY;

    if (charHeightHigh <= 2 || generator.tag.type !== FieldType.String) { // Assume no multi-line dates
        // center text if not multiline - ignore fixed offset (just use jitter)
        offsetY = -1 * (heightPerChar / 2) + jitter(0.4) * (generator.bbox[5] - generator.bbox[1]);
        charHeightHigh = 2;
    }

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
    if (!DO_JITTER) return 0;
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

/**
 *
 * @param bbox ratio bbox (label)
 * @param pageOcr
 * @param text
 */
export const matchBboxToOcr: (bbox: number[], pageOcr: any, text?: string) => IGeneratorTagInfo = (bbox, pageOcr, text) => {
    const numberFlags = ["#", "number", "num.", "phone", "amount"];

    let name = "";
    let type = FieldType.String;
    let format = FieldFormat.Alphanumeric;
    const ocrLines = [];
    let ocrLine = -1; // closest
    // A few quality of life heuristics
    let containsText = false;
    if (pageOcr) {
        // Find the closest text
        let closestDist = 1; // at most half an inch away
        const refLoc = [bbox[0], bbox[1]];
        const ocrRead = pageOcr;
        ocrRead.lines.forEach((line, index) => {
            if (isBoxCenterInBbox(line.boundingBox, bbox) || isBoxCenterInBbox(bbox, line.boundingBox)) {
                ocrLines.push(index);
                containsText = true;
            }
            if (!containsText) {
                line.words.forEach(word => {
                    const loc = [word.boundingBox[0], word.boundingBox[1]]; // TL
                    const dist = Math.hypot(loc[0] - refLoc[0], loc[1] - refLoc[1]);
                    if (dist < closestDist) {
                        if (line.text.length > 20) {
                            name = _.camelCase(word.text);
                        } else {
                            name = _.camelCase(line.text);
                        }

                        if (numberFlags.some(flag => line.text.toLowerCase().includes(flag))) {
                            type = FieldType.Number;
                            format = FieldFormat.NotSpecified;
                        } else {
                            type = FieldType.String;
                            format = FieldFormat.Alphanumeric;
                        }
                        closestDist = dist;
                        // Also, capture the line on the generator so we can match statistics
                        // do this here rather than on generation for convenience
                        ocrLine = index;
                    }
                });
            }
        });
    };
    if (ocrLine !== -1 && !containsText) {
        ocrLines.push(ocrLine);
    }
    const tagProposal = { name, type, format };
    return { tagProposal, ocrLines, containsText };
}


// Bbox utils
/**
 * Returns whether box1 center is in box2
 * @param box1 contained box
 * @param box2 containing box
 */
export const isBoxCenterInBbox = (box1: number[], box2: number[]) => {
    const centerX = (box1[0] + box1[2]) / 2;
    const centerY = (box1[1] + box1[5]) / 2;
    return centerX > box2[0] && centerX < box2[2] && centerY > box2[1] && centerY < box2[5];
}

export const fuzzyScaledBboxEqual = (ocrReadResults: any, labelBox: number[], ocrBox: number[]) => {
    const ocrBoxScaled = ocrBox.map((coord, i) => i % 2 === 0 ? coord / ocrReadResults.width : coord / ocrReadResults.height);
    return fuzzyBboxEqual(ocrBoxScaled, labelBox);
}

export const fuzzyBboxEqual = (box1: number[], box2: number[], threshold = 0.01) => {
    return box1.every((coord, i) => Math.abs(coord - box2[i]) < threshold);
}

export const unionBbox = (boxes: number[][]) => {
    const boxXCoords = boxes.map(b => b.filter((_, i) => i % 2 === 0));
    const boxYCoords = boxes.map(b => b.filter((_, i) => i % 2 === 1));
    const flatXCoords = flattenOne(boxXCoords);
    const flatYCoords = flattenOne(boxYCoords);
    const minX = Math.min(...flatXCoords);
    const maxX = Math.max(...flatXCoords);
    const minY = Math.min(...flatYCoords);
    const maxY = Math.max(...flatYCoords);
    return [minX, minY, maxX, minY, maxX, maxY, minX, maxY];
}

export const padBbox = (bbox: number[], xRatio, yRatio) => {
    let x1 = bbox[0];
    let x2 = bbox[2];
    let y1 = bbox[1];
    let y2 = bbox[5];
    const width = x2 - x1;
    const height = y2 - y1;
    const xPad = height * xRatio;
    const yPad = width * yRatio;
    x1 -= xPad;
    x2 += xPad;
    y1 -= yPad;
    y2 += yPad;
    return [x1, y1, x2, y1, x2, y2, x1, y2];
}

export const scaleBbox = (bbox: number[], xRatio, yRatio) => {
    return bbox.map((c, i) => i % 2 ? c * yRatio: c * xRatio);
}

const isFuzzyContained = (container: number[], contained: number[], threshold=0.05) => {
    return contained[0] > container[0] - threshold
        && contained[1] > container[1] - threshold
        && contained[2] < container[2] + threshold
        && contained[5] < container[5] + threshold;
}

// Left right assumption (will fail on vertical texts... - but so will multiline assumptions)
const EXPAND_LIMITS = {
    "right": 1.5,
    "left": 1.5,
    "top": 0.1, // only expand a little - don't expand to multiline extents
    "bottom": 0.1,
    "padding": 0.1,
}

const getExtent = (bbox: number[]) => {
    return {
        "left": bbox[0],
        "right": bbox[2],
        "top": bbox[1],
        "bottom": bbox[5],  // higher than top
    }
}

const getBbox = (extent: any) => {
    return [extent.left, extent.top,
        extent.right, extent.top,
        extent.right, extent.bottom,
        extent.left, extent.bottom,
    ];
}

export const expandBbox = (bbox: number[], allBoxes: number[][]) => {
    // Basic algorithm
    // For each direction - cast a ray
    // Stop the box at the earliest collision, or corresponding EXPAND_LIMIT
    // However, if no collision, crop at margins of page

    // We check to make sure drop boxes that are essentially contained (i.e. our source labels)
    const boxes = allBoxes.filter(b => !isFuzzyContained(bbox, b));

    // naive margins - this will fail to extend free-text at the edge of the page
    const extents: any = {}
    const boxExtent = getExtent(bbox);
    const boxesExtents = boxes.map(getExtent);
    extents.left = Math.min(...boxesExtents.map(b => b.left));
    extents.top = Math.min(...boxesExtents.map(b => b.top));
    extents.right = Math.max(...boxesExtents.map(b => b.right));
    extents.bottom = Math.max(...boxesExtents.map(b => b.bottom));

    extents.left = Math.max(extents.left, boxExtent.left - EXPAND_LIMITS.left);
    extents.top = Math.max(extents.top, boxExtent.top - EXPAND_LIMITS.top);
    extents.right = Math.min(extents.right, boxExtent.right + EXPAND_LIMITS.right);
    extents.bottom = Math.min(extents.bottom, boxExtent.bottom + EXPAND_LIMITS.bottom);

    const toLeft = boxesExtents.filter(e => (e.right < boxExtent.right
        && (e.bottom > boxExtent.top && e.top < boxExtent.bottom)))
            .map(e => e.right + EXPAND_LIMITS.padding);
    extents.left = Math.max(extents.left, ...toLeft);
    extents.left = Math.min(boxExtent.left, extents.left); // don't regress the GT

    const toRight = boxesExtents.filter(e => (e.left > boxExtent.left
        && (e.bottom > boxExtent.top && e.top < boxExtent.bottom)))
            .map(e => e.left - EXPAND_LIMITS.padding);
    extents.right = Math.min(extents.right, ...toRight);
    extents.right = Math.max(boxExtent.right, extents.right); // don't regress the GT

    // Corner resolution - do horizontal first

    const toTop = boxesExtents.filter(e => (e.bottom < boxExtent.bottom
        && (e.right > extents.left && e.left < extents.right)))
        // && (e.right > boxExtent.left && e.left < boxExtent.right)))
            .map(e => e.bottom + EXPAND_LIMITS.padding);
    extents.top = Math.max(extents.top, ...toTop);
    extents.top = Math.min(boxExtent.top, extents.top); // don't regress the GT

    const toBottom = boxesExtents.filter(e => (e.top > boxExtent.top
        && (e.right > extents.left && e.left < extents.right)))
            .map(e => e.top - EXPAND_LIMITS.padding);
    extents.bottom = Math.min(extents.bottom, ...toBottom);
    extents.bottom = Math.max(boxExtent.bottom, extents.bottom); // don't regress the GT

    return getBbox(extents);
}

export const selectSomeWhenMultiple: (generators: IGenerator[]) => IGenerator[] = (generators) => {
    const tagGroups: {[tag: string]: IGenerator[]} = {};
    generators.forEach(g => {
        if (g.tag.name in tagGroups) {
            tagGroups[g.tag.name].push(g);
        } else {
            tagGroups[g.tag.name] = [g];
        }
    });
    const nestedGens = Object.keys(tagGroups).map(tag => {
        const tagGens = tagGroups[tag];
        const guaranteedIndex = randomIntInRange(0, tagGens.length); // at least one
        return tagGens.filter((g, i) => i === guaranteedIndex || Math.random() < 0.5); // rare drops
    });
    return flattenOne(nestedGens);
}

export const mergeLabels: (labels: ILabel[]) => ILabel[] = (labels) => {
    // merge keys and values under a shared label
    const tagGroups: {[tag: string]: ILabel[]} = {};
    labels.forEach(l => {
        if (l.label in tagGroups) {
            tagGroups[l.label].push(l);
        } else {
            tagGroups[l.label] = [l];
        }
    });
    return Object.keys(tagGroups).map(label => {
        const tagLabels = tagGroups[label];
        const key = tagLabels.map(l => l.key).filter(k => !!k);

        return {
            label,
            key: key.length > 0 ? flattenOne(key) : null,
            value: flattenOne(tagLabels.map(l => l.value))
        }
    });
}

export const flattenOne: (nestedList: any[][]) => any[] = (nestedList) => {
    return [].concat.apply([], nestedList);
}
