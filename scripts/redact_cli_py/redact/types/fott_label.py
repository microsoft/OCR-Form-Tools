# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from dataclasses import dataclass
from typing import List, Dict, Tuple

from redact.types.annotation import Annotation


@dataclass
class Entity:
    page: int
    text: str
    # camelCase instead of snake_case for aligning with the JSON schema.
    boundingBoxes: List[List[float]]


@dataclass
class Label:
    label: str
    value: List[Entity]


@dataclass
class FottLabel:
    labels: List[Label]

    def to_annotations(self, page_size: Dict[int, Tuple[float, float]] = {1: (1.0, 1.0)}) -> List[Annotation]:
        def to_pixel(page: int, bounding_box: List[float]) -> List[float]:
            width = page_size[page][0]
            height = page_size[page][1]
            ret = []
            for i, elem in enumerate(bounding_box):
                if i % 2 == 0:
                    ret.append(elem * width)
                else:
                    ret.append(elem * height)
            return ret

        annotations = []

        for label in self.labels:
            for entity in label.value:
                for bounding_box in entity.boundingBoxes:
                    annot = Annotation(
                        bounding_box=to_pixel(entity.page, bounding_box), field=label.label, text=entity.text)
                    annotations.append(annot)

        return annotations
