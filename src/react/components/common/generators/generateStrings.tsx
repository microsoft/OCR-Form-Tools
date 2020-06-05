// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import * as RandExp from "randexp";

import { IGenerator, FieldFormat, FieldType } from "../../../../models/applicationState";

export const generateString: (g: IGenerator, maxLength?: number) => string = (generator) => {
    // TODO incorporate max length
    const fieldType = generator.type;
    const fieldFormat = generator.format;
    let regex = regexDict[FieldType.String][FieldFormat.NotSpecified];
    if (fieldType in regexDict && fieldFormat in regexDict[fieldType]) {
        regex = regexDict[fieldType][fieldFormat];
    }
    // @ts-ignore - something is messed up with this import, satisfying it in lint breaks on runtime
    const randexp = new RandExp(regex);
    randexp.max = 15; // char limit
    return randexp.gen();
}

const low = 2;
const high = 6;
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
