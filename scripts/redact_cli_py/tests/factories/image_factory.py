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
