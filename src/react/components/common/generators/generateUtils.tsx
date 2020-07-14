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
const DO_MATCH_TEXT_STATISTICS = true;
const DIGIT_DROPOUT = 0.0;
const USE_TEXT_PROB = 0.0; // probability of using word gen when text has no digits

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
    lineHeight: 1.2,
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
    defaultWidthScale: 1.2,
    offsetX: 0, // ratio offset
    offsetY: .05,
    offsetYJitter: .05, // ratio offset
    // Char limits
    width_low: 0.2,
    width_high: .95,
    height_low: 0.2,
    height_high: 0.9, // try not to bleed past the box due to scaling inaccs
    sizing_samples: 7, // sample count for line sampling (smaller => more random)
    sizeJitter: 2, // 1,
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
    const { units, sampledWords, sampledNestedWords } = getOcrUnitsPerChar(generator, ocr);

    // Translate to rough character bounds and format
    const limitsAndFormat = getStringLimitsAndFormat(generator, units, ocr, sampledNestedWords, sampledWords, adjustedResolution);
    // Generate string from bounds
    const text = generateString(generator, limitsAndFormat.limits, ocr, sampledNestedWords);

    const leftAlignedFormat = { ...defaultStyle, ...limitsAndFormat.format, text };

    const format = randomizeAlignment(limitsAndFormat.limits, leftAlignedFormat, text, units);

    // Translate string into precise OCR boxes
    const boundingBoxes = generateBoundingBoxes(generator, format, ocr, units, adjustedResolution);
    // If we wanted to be more careful about existing characters, we'd need to merge the last two steps
    return {
        name: generator.tag.name,
        text,
        boundingBoxes,
        format,
        page: generator.page,
    };
}

interface UnitsAndWords {
    units: number[],
    sampledNestedWords: any, // words, nested in arrays per ocr line
    sampledWords: any // words, flattened
}
const getOcrUnitsPerChar: (g: IGenerator, ocr: any) => UnitsAndWords = (generator, ocr) => {
    // "font size" approximated by replaced OCR line or median font size of doc
    if (generator.tag.type === FieldType.SelectionMark) return {
        units: [1, 1],
        sampledWords: [],
        sampledNestedWords: []
    }

    let sampledLines = [];
    if (generator.containsText) {
        sampledLines = sampledLines.concat(generator.ocrLines.map(ln => ocr.lines[ln]));
    } else {
        for (let i = 0; i < GEN_CONSTANTS.sizing_samples; i++) {
            // Try to sample among words that are close by. (doesn't really work on 1035)
            // const closeLines = ocr.lines.filter(l => isFuzzyContained(generator.bbox, l.boundingBox, 2.0));
            // sampledLines.push(closeLines[randomIntInRange(0, closeLines.length)]);
            sampledLines.push(ocr.lines[randomIntInRange(0, ocr.lines.length)]);
        }
    }

    let sampledNestedWords = sampledLines.map(l => l.words);
    if (generator.containsText) {
        // filter out only the words that are truly inside the generator - ocr can combine chunks with multiple sizes
        const filteredNestedWords = sampledNestedWords.map(lw => lw.filter(
            w => isBoxCenterInBbox(w.boundingBox, generator.bbox)
        ));
        if (filteredNestedWords.some(lw => lw.length > 0)) {
            sampledNestedWords = filteredNestedWords;
        } else {
            console.warn(`No words found in box. Mismatch between contained OCR word and labeled box. Check ${generator.tag.name}`);
        }
    }
    const sampledWords = [].concat.apply([], sampledNestedWords);
    const widths = [];
    const heights = [];
    sampledWords.forEach(w => {
        // one character text is typically anomalous (i.e. non-standard char) (this may need revision outside of english)
        widths.push((w.boundingBox[2] - w.boundingBox[0]) / w.text.length);
        heights.push((w.boundingBox[5] - w.boundingBox[1]));
    });

    if (widths.length === 0) {
        throw new Error("empty widths. somehow, things are still empty");
    }
    // - scale to map units, which we can convert to pixels
    const widthPerChar = median(widths);
    const heightPerChar = median(heights);
    const scaledWidth = widthPerChar * GEN_CONSTANTS.widthScale * (1 + jitter(GEN_CONSTANTS.widthScaleJitter));
    const scaledHeight = heightPerChar * GEN_CONSTANTS.heightScale * (1 + jitter(GEN_CONSTANTS.heightScaleJitter));
    return {
        units: [ scaledWidth, scaledHeight ],
        sampledWords,
        sampledNestedWords,
    };
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

const regexGenerator = (low, high, fieldType, fieldFormat) => {
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
            [FieldFormat.NotSpecified]: `^\\d\\d([- /.])\\d\\d\\1\\d{2,4}$`,
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

    let regex = regexDict[FieldType.String][FieldFormat.NotSpecified];
    if (fieldType in regexDict && fieldFormat in regexDict[fieldType]) {
        regex = regexDict[fieldType][fieldFormat];
    }
    // @ts-ignore - something is messed up with this import, satisfying it in lint breaks on runtime
    const randexp = new RandExp(regex);
    return randexp.gen();
}

const wordGenerator = (low: number, high: number, fieldType?: FieldType, fieldFormat?: FieldFormat) => {

    // if fieldType is number, forward to regex
    if (fieldType && fieldType !== FieldType.String) {
        return regexGenerator(low, high, fieldType, fieldFormat);
    }
    // low, high
    const maxWordLength = 12; // there's a weird balance to strike here...
    const formatter = (word, index)=> {
        return Math.random() < 0.3 ? word.slice(0,1).toUpperCase().concat(word.slice(1)) : word;
    }

    let tries = 0;
    let candidate = "";
    while (tries < 8) {
        candidate = randomWords({
            min: Math.max(Math.round(low / maxWordLength), 1),
            max: high / 8, // max number of words - don't make it too many
            maxLength: maxWordLength,
            minLength: 3,
            join: " ",
            formatter,
        });
        if (candidate.length < high) return candidate;
        tries += 1;
    }
    return candidate;
};

const generateString: (g: IGenerator, l: number[][], ocr: any, sampledNestedWords: any) => string
    = (generator, limits, ocr, sampledNestedWords) => {

    // Default: regex map
    const [ widthLimit, heightLimit ] = limits;
    const [ widthLow, widthHigh ] = widthLimit;
    const [ heightLow, heightHigh ] = heightLimit;
    const linesUsed = randomIntInRange(heightLow, heightHigh);
    const fieldType = generator.tag.type;
    const fieldFormat = generator.tag.format;

    const canMatchStatistics = [FieldType.String, FieldType.Number].includes(fieldType)
        && [FieldFormat.NotSpecified].includes(fieldFormat);

    const tokenGenerator = USE_RANDOM_WORDS && canMatchStatistics ? wordGenerator : regexGenerator;

    const instanceGenerator = (srcText) => {
        if (srcText.length === 1) return srcText; // hard-coded return of standalone symbols
        if (!DO_MATCH_TEXT_STATISTICS
            || !canMatchStatistics
            || srcText === ""
            || !(/(\d+)/.test(srcText))
            || Math.random() < USE_TEXT_PROB)
            return tokenGenerator(widthLow, widthHigh, fieldType, fieldFormat);
        // heuristic algorithm, with an attempt at reflecting underlying distribution
        // Split text into tokens
        const tokens = srcText.split(" ");
        let mutatedTokens = tokens.map(t => {
            // ideally we can split on recognized "language sets" (like english) and mutate.
            // let's not over-engineer, though (just doing digits for now)

            // No digits in token - generate a random word for it
            if (!/(\d+)/.test(t)) return "";
            // has digits - scramble them and return the string otherwise (should work on dates etc)
            // Extract digits
            const splitTokens = t.split(/(\d+)/).filter(st => st.length > 0);
            return splitTokens.map(st => {
                if (/(\d+)/.test(st)) {
                    if (Math.random() < DIGIT_DROPOUT) return "";
                    return regexGenerator(Math.max(st.length - 1, 1), st.length + 1, FieldType.Number, FieldFormat.NotSpecified);
                }
                return st;
            }).join("");
        });

        // generate words and randomly fill into empty slots
        const subtotal = mutatedTokens.join(" ").length;
        const budgetLow = Math.max(widthLow - subtotal, 1);
        const budgetHigh = Math.max(widthHigh - subtotal, budgetLow + 1);
        const proposals = wordGenerator(budgetLow, budgetHigh).split(" ");

        let proposalIndex = 0;
        mutatedTokens = mutatedTokens.map(t => {
            if (t.length > 0 || proposalIndex >= proposals.length) return t;
            return proposals[proposalIndex++];
        });

        return mutatedTokens.filter(t => t.length > 0).join(" ");
    };


    const lineStrings = [];
    // Treat each line independently
    for (let i = 0; i < linesUsed; i++) {
        if (!generator.containsText || !canMatchStatistics) {
            lineStrings.push(instanceGenerator(""));
        } else {
            const srcText = sampledNestedWords[randomIntInRange(0, generator.ocrLines.length)].map(w => w.text).join(" ");
            lineStrings.push(instanceGenerator(srcText));
        }
    }
    return lineStrings.join("\n");
}

const randomizeAlignment: (limits: number[][], format: GeneratorTextStyle, text: string, unitsPerChar: number[]) => GeneratorTextStyle
    = (limits, format, text, unitsPerChar) => {
    // Using the longest line (can't easily apply to separate lines)
    // randomize alignment within limits
    const widthHigh = limits[0][1];
    const lines = text.split("\n");
    // Character ratio should approximate actual length well enough for jitter
    const maxLength = Math.max(...lines.map(l => l.length));
    const charBudget = Math.max(widthHigh - maxLength, 0);
    const xBudget = charBudget * unitsPerChar[0];
    const offsetX = format.offsetX + (xBudget / 2) + jitter(xBudget / 2);
    return {
        ...format,
        offsetX,
    };
}

/**
 * Returns string limits as determined by absolute units, and format, as determined by current canvas resolution
 * @param generator generator to use
 * @param unitsPerChar absolute scaling in OCR units
 * @param ocr used as reference for font sizing
 * @param sampledWords words used to deduce ocr units
 * @param resolution current canvas resolution (omitted on training gen)
 */
const getStringLimitsAndFormat: (g: IGenerator, unitsPerChar: number[], ocr: any, sampledNestedWords: any, sampledWords: any, resolution?: number) => LimitsAndFormat =
    (generator, unitsPerChar, ocr, sampledNestedWords, sampledWords, resolution = 1) => {
    if (generator.tag.type === FieldType.SelectionMark) {
        return {
            format: {},
            limits: [[0, 0], [1, 2]]
        }
    }

    const fontWeight = GEN_CONSTANTS.weight + jitter(GEN_CONSTANTS.weightJitter, true);
    // TODO update according to source ocr
    let lineHeight = GEN_CONSTANTS.lineHeight
    if (generator.containsText && sampledNestedWords.length > 1) {
        // find distinct "lines" (non-overlapping) and measure lineHeight as
        // 1 + line dist / box height (averaged)
        const distinctLineBoxes = [];
        sampledNestedWords.forEach(lw => {
            const wordBb = lw[0].boundingBox;
            if (!distinctLineBoxes.some(dlBb => isOverlapping(dlBb, wordBb))) {
                distinctLineBoxes.push(wordBb);
            }
        });

        if (distinctLineBoxes.length > 1) {
            // sort by centers and measure distance between consecutives
            distinctLineBoxes.sort((a, b) => (a[1] + a[5]) - (b[1] + b[5]));
            const lineHeightVotes = [];
            for (let i = 0; i < distinctLineBoxes.length - 1; i++) {
                const b1 = distinctLineBoxes[i];
                const b2 = distinctLineBoxes[i + 1];
                const avgHeight = ((b2[5] - b2[1]) + (b1[5] - b1[1])) / 2;
                const diff = b2[1] - b1[5];
                lineHeightVotes.push(1 + diff / avgHeight);
            }
            lineHeight = median(lineHeightVotes);
        }
    }
    lineHeight += jitter(GEN_CONSTANTS.lineHeightJitter);
    // https://github.com/openlayers/openlayers/pull/9307 - line height doesn't preview due to openlayers
    // further - there's a diff between CSS leading and document leading
    // document leading is as anticipated here (I think), CSS uses half-leading (splits the lead on top and bottom)
    // https://joshnh.com/weblog/how-does-line-height-actually-work/

    // Map Units to Font size - Search for the right size by measuring canvas
    let [ widthPerChar, heightPerChar ] = unitsPerChar;
    if ([FieldType.Number, FieldType.Integer, FieldType.Date, FieldType.Time].includes(generator.tag.type)) {
        widthPerChar *= GEN_CONSTANTS.digitWidthScale;
    } else {
        widthPerChar *= GEN_CONSTANTS.defaultWidthScale;
    }

    const boxWidth = generator.bbox[2] - generator.bbox[0];
    const boxHeight = generator.bbox[5] - generator.bbox[1];
    const effectiveLineHeight = heightPerChar * lineHeight;

    const charWidthLow = Math.max(1, Math.round(boxWidth * GEN_CONSTANTS.width_low / widthPerChar));
    const charWidthHigh = Math.round(boxWidth * GEN_CONSTANTS.width_high / widthPerChar) + 1;

    const charHeightLow = 1; // Math.max(1, Math.round(boxHeight * GEN_CONSTANTS.height_low / effectiveLineHeight));
    let charHeightHigh = Math.floor(boxHeight * GEN_CONSTANTS.height_high / effectiveLineHeight) + 1; // +1 for exlcusive, floor for pessimistic
    if (charHeightHigh < 4 && (!generator.ocrLines || generator.ocrLines.length <= 1)) {
        // unless we know it's multiline, be pessimistic
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
    let targetPixelHeight = heightPerChar / resolution;
    if (targetPixelHeight < 10) targetPixelHeight += 2; // Not sure why things start to break down at small sizes;
    while (curSize < GEN_CONSTANTS.sizing_range[1]) {
        const font = `${fontWeight} ${curSize}px/${lineHeight} sans-serif`;
        const sizingString = sampledWords.map(w => w.text).join("");
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

    const ratioOffsetX = GEN_CONSTANTS.offsetX;
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
        // jitter such that the character doesn't nudge out of box
        // i.e. half of remaining space
        const jitterWithin = (1 - heightPerChar / (generator.bbox[5] - generator.bbox[1])) / 2;
        offsetY = -1 * (heightPerChar / 2) + jitter(jitterWithin) * (generator.bbox[5] - generator.bbox[1]);
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
            lines: [], // omit ocr lines - we'll only be overriding the text.
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

        textOffsetY += heightPerChar * format.lineHeight;

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
 * @param text when generating, make sure we text match the line we're looking for
 */
export const matchBboxToOcr: (bbox: number[], pageOcr: any, text?: string) => IGeneratorTagInfo
    = (bbox, pageOcr, text) => {
    const numberFlags = ["#", "number", "num.", "phone", "amount"];

    let name = "";
    let type = FieldType.String;
    let format = FieldFormat.Alphanumeric;
    const ocrLines = [];
    let ocrLine = -1; // closest
    // A few quality of life heuristics
    let containsText = false;
    const textGuess = text.split(/(\s+)/)[0]; // when text is brought in with whitespace, use the first one as reference
    if (pageOcr) {
        // Find the closest text
        let closestDist = 1; // at most half an inch away
        const refLoc = [bbox[0], bbox[1]];
        const ocrRead = pageOcr;
        const thresh = text ? 0.3 : 0.05;
        ocrRead.lines.forEach((line, index) => {
            // there are cases where the overlapping line contains our words, but also where it doesn't (i.e. underscores)
            if ((isFuzzyContained(bbox, line.boundingBox, thresh)
            || isFuzzyContained(line.boundingBox, bbox, thresh))
            && (!text || line.text.includes(textGuess))) {
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
    "padding": 0.15,
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

    // Corner resolution - do horizontal first

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

const containsPoint = (box: number[], point: number[], threshold=0.0) => {
    return point[0] > box[0] - threshold
        && point[1] > box[1] - threshold
        && point[0] < box[2] + threshold
        && point[1] < box[5] + threshold
}

const isOverlapping = (box1: number[], box2: number[]) => {
    // check if any of box1 corners are in box2
    const corners = [];
    for (let i = 0; i < box1.length; i += 2) {
        corners.push([box1[i], box1[i+1]]);
    }
    return corners.some(c => containsPoint(box2, c));
}
