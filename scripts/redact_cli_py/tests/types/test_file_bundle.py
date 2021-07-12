# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.types.file_bundle import FileBundle


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

        actual = FileBundle.from_names(names)

        assert actual == expected
