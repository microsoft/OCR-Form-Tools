# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List

from PIL import Image, ImageDraw

from redact.types.annotation import Annotation


class ImageRedaction:
    # White color in HEX string for redaction.
    # (255, 255, 255, 255) format will cause exception in
    # non-RGBA mode. HEX string format works well.
    COLOR = "#FFFFFF"
    COLOR_WITH_ALPHA = "#FFFFFFFF"

    def __init__(self, image: Image, annotations: List[Annotation], labels_to_redact: List[str] = []):
        self.image = image
        self.anntations = annotations
        self.labels_to_redact = labels_to_redact

    def redact(self):
        draw = ImageDraw.Draw(self.image)
        for annotation in self.anntations:
            if len(self.labels_to_redact) == 0 or annotation.field in self.labels_to_redact:
                if self.with_alpha_channel(self.image.mode):
                    draw.polygon(annotation.bounding_box,
                                 fill=self.COLOR_WITH_ALPHA,
                                 outline=self.COLOR_WITH_ALPHA)
                else:
                    draw.polygon(annotation.bounding_box,
                                 fill=self.COLOR, outline=self.COLOR)

    def with_alpha_channel(self, mode):
        """See https://github.com/python-pillow/Pillow/blob/affa059e959280bf7826ec1a023a64cb8f111b6d/Tests/test_image_access.py#L185
        for basic modes.

        See https://pillow.readthedocs.io/en/stable/handbook/concepts.html#modes
        for image mode concepts.
        """

        if mode in (
            "1",
            "L",
            "I;16",
            "I;16B",
            "F",
            "P",
            "RGB",
            "RGBX",
            "CMYK",
            "YCbCr",
        ):
            return False
        elif mode in (
            "LA",
            "PA",
            "RGBA"
        ):
            return True
        else:
            raise Exception(f"Image mode \"{mode}\" is not supported.")
