# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.types.file_bundle import FileBundle
from redact.types.file_bundle import FileType


class TestFileBundle:
    def test_from_names(self) -> None:
        names = [
            "a.jpg",
            "a.jpg.labels.json",
            "dummy_file.jpg",
            "a.jpg.ocr.json"]
        expected = [FileBundle(
            image_file_name="a.jpg",
            fott_file_name="a.jpg.labels.json",
            ocr_file_name="a.jpg.ocr.json")]

        actual = FileBundle.from_names(names, FileType.IMAGE_ONLY)

        assert actual == expected

    def test_from_names_pdf(self) -> None:
        names = [
            "a.pdf",
            "a.pdf.labels.json",
            "dummy_file.jpg",
            "a.jpg",
            "a.jpg.labels.json",
            "dummy_file.pdf",
            "a.pdf.ocr.json"]
        expected = [FileBundle(
            image_file_name="a.pdf",
            fott_file_name="a.pdf.labels.json",
            ocr_file_name="a.pdf.ocr.json")]

        actual = FileBundle.from_names(names, FileType.PDF_ONLY)

        assert actual == expected
