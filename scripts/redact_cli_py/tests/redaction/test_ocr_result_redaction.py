# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.redaction.ocr_result_redaction import OcrResultRedaction
from tests.factories.ocr_result_factory import OcrResultFactory
from tests.factories.annotation_factory import AnnotationFactory


class TestOcrResultRedaction:
    def test_ctor(self) -> None:
        ocr_result = OcrResultFactory.build()
        annotations = AnnotationFactory.build_annotations()
        ocr_result_redacton = OcrResultRedaction(ocr_result, annotations)

        assert ocr_result_redacton.ocr_result == ocr_result

    def test_redact(self) -> None:
        ocr_result = OcrResultFactory.build()
        expected = OcrResultFactory.build_redacted()
        annotations = AnnotationFactory.build_annotations()

        ocr_result_redacton = OcrResultRedaction(ocr_result, annotations)
        ocr_result_redacton.redact()

        actual = ocr_result_redacton.ocr_result
        assert actual == expected
