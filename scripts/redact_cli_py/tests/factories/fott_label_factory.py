# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import json

from dacite import from_dict

from redact.types.fott_label import FottLabel


class FottLabelFactory:

    @staticmethod
    def build() -> FottLabel:
        fott_label_path = "testdata/testdata.jpg.labels.json"

        with open(fott_label_path, encoding='utf-8-sig') as fott_label_json:
            fott_label_dict = json.load(fott_label_json)
            fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)
            return fott_label

    @staticmethod
    def build_redacted() -> FottLabel:
        fott_label_path = "testdata/testdata.redacted.labels.json"

        with open(fott_label_path, encoding='utf-8-sig') as fott_label_json:
            fott_label_dict = json.load(fott_label_json)
            fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)
            return fott_label

    @staticmethod
    def build_partial() -> FottLabel:
        fott_label_path = "testdata/testdata-partial.jpg.labels.json"

        with open(fott_label_path, encoding='utf-8-sig') as fott_label_json:
            fott_label_dict = json.load(fott_label_json)
            fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)
            return fott_label

    @staticmethod
    def build_redacted_partial() -> FottLabel:
        fott_label_path = "testdata/testdata-partial.redacted.labels.json"

        with open(fott_label_path, encoding='utf-8-sig') as fott_label_json:
            fott_label_dict = json.load(fott_label_json)
            fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)
            return fott_label
