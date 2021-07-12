# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List

from PIL import Image, ImageDraw

from redact.types.annotation import Annotation


class ImageRedaction:
    # White color in RGBA for redaction.
    COLOR = (255, 255, 255, 0)

    def __init__(self, image: Image, annotations: List[Annotation]):
        self.image = image
        self.anntations = annotations

    def redact(self):
        draw = ImageDraw.Draw(self.image)
        for annotation in self.anntations:
            draw.polygon(annotation.bounding_box,
                         fill=self.COLOR, outline=self.COLOR)
