# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List, Collection

from redact.redaction.ocr_result_redaction_v2 import OcrResultRedactionV2
from redact.redaction.ocr_result_redaction_v3 import OcrResultRedactionV3
from redact.types.annotation import Annotation
from redact.types.api_version import ApiVersion


class OcrResultRedaction:
    def __init__(
        self,
        ocr_result: dict,
        annotations: List[Annotation],
        api_version: ApiVersion = ApiVersion.V3_0,
        labels_to_redact: Collection[str] = tuple(),
    ):
        self.ocr_result = ocr_result
        self.annotations = annotations
        self.labels_to_redact = labels_to_redact
        self.api_version = api_version

    def redact(self):
        if ApiVersion(self.api_version) in [
            ApiVersion.V2_0,
            ApiVersion.V2_1,
        ]:
            redaction = OcrResultRedactionV2(
                self.ocr_result,
                self.annotations,
                self.labels_to_redact,
            )
            redaction.redact()
        elif ApiVersion(self.api_version) in [
            ApiVersion.V3_0,
        ]:
            redaction = OcrResultRedactionV3(
                self.ocr_result,
                self.annotations,
                self.labels_to_redact,
            )
            redaction.redact()
