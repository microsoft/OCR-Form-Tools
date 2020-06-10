// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";

import { IGenerator, FieldFormat, FieldType } from "../../../../models/applicationState";
import { randomIntInRange } from "../../../../common/utils";


export interface IGeneratedInfo {
    text: string,
    boundingBoxes: [number[]]
}

// TODO seeding
export const generate:(g: IGenerator, limits: number[][]) => IGeneratedInfo = (generator, limits) => {
    /**
     * generator: Generator region
     * limits: Canvas-calibrated width limit () and line limit
     * TODO determine multiline
     * TODO can we find text dimensions?
     * Since generator is responsible for font sizing, this should be in char limit
     */
    // Should be in charge of providing everything the training pipeline needs, in addition to something for generation
    const text = generateString(generator, limits);
    const boundingBoxes = generateBoundingBoxes(generator, text);
    return { text, boundingBoxes };
}

const generateBoundingBoxes: (g: IGenerator, text: string) => [number[]] = (generator, text) => {
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

const low = 2;
const high = 6;

