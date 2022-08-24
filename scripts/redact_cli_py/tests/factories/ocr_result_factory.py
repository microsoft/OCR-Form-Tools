# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import json


class OcrResultFactory:
    @staticmethod
    def build() -> dict:
        ocr_result_path = "testdata/testdata.jpg.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)

    @staticmethod
    def build_redacted() -> dict:
        ocr_result_path = "testdata/testdata.redacted.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)

    @staticmethod
    def build_partial() -> dict:
        ocr_result_path = "testdata/testdata-partial.jpg.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)

    @staticmethod
    def build_redacted_partial() -> dict:
        ocr_result_path = "testdata/testdata-partial.redacted.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)

    @staticmethod
    def build_2021_09_30_preview() -> dict:
        ocr_result_path = "testdata/testdata.jpg.2021-09-30-preview.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)

    @staticmethod
    def build_redacted_2021_09_30_preview() -> dict:
        ocr_result_path = "testdata/testdata.jpg.2021-09-30-preview.redacted.ocr.json"

        with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
            return json.load(ocr_result_json)
