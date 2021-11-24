# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from PIL import Image


class ImageFactory:

    @staticmethod
    def build() -> Image:
        image_path = "testdata/testdata.jpg"
        return Image.open(image_path)

    @staticmethod
    def build_redacted() -> Image:
        image_path = "testdata/testdata.redacted.jpg"
        return Image.open(image_path)

    @staticmethod
    def build_partial() -> Image:
        image_path = "testdata/testdata-partial.jpg"
        return Image.open(image_path)

    @staticmethod
    def build_redacted_partial() -> Image:
        image_path = "testdata/testdata-partial.redacted.jpg"
        return Image.open(image_path)

    @staticmethod
    def build_mode_1() -> Image:
        image_path = "testdata/testdata-mode-1.tiff"
        return Image.open(image_path)

    @staticmethod
    def build_redacted_mode_1() -> Image:
        image_path = "testdata/testdata-mode-1.redacted.tiff"
        return Image.open(image_path)

    @staticmethod
    def build_rendered_pdf() -> Image:
        image_path = "testdata/testdata.pdf.rendered.png"
        return Image.open(image_path)
