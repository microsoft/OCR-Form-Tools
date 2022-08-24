# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.redaction.ocr_result_redaction_v3 import OcrResultRedactionV3
from tests.factories.ocr_result_factory import OcrResultFactory
from tests.factories.annotation_factory import AnnotationFactory


class TestOcrResultRedactionV3:
    def test_ctor(self) -> None:
        ocr_result = OcrResultFactory.build_2021_09_30_preview()
        annotations = AnnotationFactory.build_annotations()
        ocr_result_redaction = OcrResultRedactionV3(ocr_result, annotations)

        assert ocr_result_redaction.ocr_result == ocr_result

    def test_redact(self) -> None:
        ocr_result = OcrResultFactory.build_2021_09_30_preview()
        expected = OcrResultFactory.build_redacted_2021_09_30_preview()
        annotations = AnnotationFactory.build_annotations()

        ocr_result_redaction = OcrResultRedactionV3(
            ocr_result,
            annotations,
        )
        ocr_result_redaction.redact()

        actual = ocr_result_redaction.ocr_result
        assert actual == expected
