# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import pytest

from redact.redaction.ocr_result_redaction import OcrResultRedaction
from redact.redaction.ocr_result_redaction_v2 import OcrResultRedactionV2
from redact.redaction.ocr_result_redaction_v3 import OcrResultRedactionV3
from redact.types.api_version import ApiVersion
from tests.factories.ocr_result_factory import OcrResultFactory
from tests.factories.annotation_factory import AnnotationFactory


class TestOcrResultRedaction:
    @pytest.mark.parametrize(
        "api_version",
        [
            ApiVersion.V2_0,
            ApiVersion.V2_1,
        ],
    )
    def test_redact_v2(self, api_version) -> None:
        ocr_result = OcrResultFactory.build()
        annotations = AnnotationFactory.build_annotations()
        ocr_result_redaction = OcrResultRedaction(
            ocr_result,
            annotations,
            api_version,
        )
        ocr_result_redaction.redact()

        v2 = OcrResultRedactionV2(
            ocr_result,
            annotations,
        )
        v2.redact()

        assert ocr_result_redaction.ocr_result == v2.ocr_result

    @pytest.mark.parametrize(
        "api_version",
        [
            ApiVersion.V3_0,
        ],
    )
    def test_redact_v3(self, api_version) -> None:
        ocr_result = OcrResultFactory.build_2021_09_30_preview()
        annotations = AnnotationFactory.build_annotations()
        ocr_result_redaction = OcrResultRedaction(
            ocr_result,
            annotations,
            api_version,
        )
        ocr_result_redaction.redact()

        v3 = OcrResultRedactionV3(
            ocr_result,
            annotations,
        )
        v3.redact()

        assert ocr_result_redaction.ocr_result == v3.ocr_result
