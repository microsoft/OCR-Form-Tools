// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";

import { IGenerator, FieldFormat, FieldType } from "../../../../models/applicationState";
import { randomIntInRange } from "../../../../common/utils";


export interface IGeneratedInfo {
    name: string,
    text: string,
    boundingBoxes: [number[]],
    format: GeneratorTextStyle, // todo stricter
}

// TODO seeding
export const generate:(g: IGenerator) => IGeneratedInfo = (generator) => {
    /**
     * generator: Generator region
     */
    const limitsAndFormat = getStringLimitsAndFormat(generator);
    const text = generateString(generator, limitsAndFormat.limits);
    // Should be in charge of providing everything the training pipeline needs, in addition to something for generation
    // * TODO can we find text dimensions?
    const format = { ...defaultStyle, ...limitsAndFormat.format, text };
    const boundingBoxes = generateBoundingBoxes(generator, text);
    return {
        name: generator.name,
        text,
        boundingBoxes,
        format
    };
}

const generateBoundingBoxes: (g: IGenerator, text: string) => [number[]] = (generator, text) => {
    // TODO This is the full bbox - update with the partial one
    return [generator.bbox];
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
            [FieldFormat.Currency]: `^\\$?([0-9]{1,3},([0-9]{3},){${low},${3}}[0-9]{3}|[0-9]{${low},${3}})(\\.[0-9][0-9])?$`,
        },
        [FieldType.Date]: {
            [FieldFormat.NotSpecified]: `^\\d\\d[- /.]\\d\\d[- /.]\\d{2,4}$
            `,
            [FieldFormat.DMY]: `^${dd}[- /.]${mm}[- /.]${yy}$`,
            [FieldFormat.MDY]: `^${mm}[- /.]${dd}[- /.]${yy}$`,
            [FieldFormat.YMD]: `^${yy}[- /.]${mm}[- /.]${dd}$`,
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
    randexp.min = low;
    randexp.max = high; // char limit
    const lineStrings = [];
    for (let i = 0; i < linesUsed; i++) {
        lineStrings.push(randexp.gen());
    }
    return lineStrings.join("\n");
}

const getStringLimitsAndFormat: (g: IGenerator) => LimitsAndFormat = (generator) => {
    // from allocated space, we should be able to determine lower and upper bound on used space, for width and height
    // upper bound exclusive, lower inclusive
    // TODO better than linear lower bound (super long fields shouldn't have multiple)
    const LOW_WIDTH_SCALE = 0.4; // heuristic lower bound on width gvien space
    const LOW_HEIGHT_SCALE = 0.2; // heuristic lower bound on height given space
    const HIGH_WIDTH_SCALE = 1.1; // heuristic upper bound on width given space
    const HIGH_HEIGHT_SCALE = 1; // heuristic lower bound on width given space

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

    const charWidthLow = Math.round(mapWidth * LOW_WIDTH_SCALE / mapWidthPerChar);
    const charWidthHigh = Math.round(mapWidth * HIGH_WIDTH_SCALE / mapWidthPerChar);
    const charHeightLow = Math.round(mapHeight * LOW_HEIGHT_SCALE / mapHeightPerChar);
    const charHeightHigh = Math.round(mapHeight * HIGH_HEIGHT_SCALE / mapHeightPerChar);
    // * We'll run into trouble once we use OCR. Given fixed map width conversion, we're fine.

    // Map Units to Font size
    // TODO calculate font size and font weight
    // Note that this "fontSize" translates to a proper fontSize in OL text formatting

    // determine font size that uses MUpC (on avg) - assigning that to our generated text
    // TODO search for the correct font size - the one that matches our MUpC assumption
    const properSize = 14; // hardcoded
    const properWeight = 100;
    const properHeight = 1.1;
    const font = `${properWeight} ${properSize}px/${properHeight} sans-serif`;
    const sampleText = 'abcdefghijklmnopqrstuvwxyzABCDEFHIJKILMNOPQRSTUVWXYZ'; // 52 letters
    // TODO when we actually construct bbox for ocr
    const metrics = getTextMetrics(sampleText, font);

    // pixel height occupied by font - we want to render with the right font, so we measure
    const fontWidth = metrics.width / sampleText.length;
    const fontHeight = metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent;
    const bboxWidth = metrics.actualBoundingBoxRight; // since we're left aligned this is the whole width
    // ultimately to make ocr we're gonna want to have the true inches from canvas coordinates

    // TODO Implement styling
    return {
        limits: [[charWidthLow, charWidthHigh], [charHeightLow, charHeightHigh]],
        format: {
            font,
        },
    };
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
