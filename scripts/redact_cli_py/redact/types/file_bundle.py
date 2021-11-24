# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from dataclasses import dataclass
import re
from typing import List, Any
from enum import Enum

class FileType(Enum):
    IMAGE_ONLY = ".+(\\.jpeg|\\.jpg|\\.tif|\\.tiff|\\.png|\\.bmp)$"
    PDF_ONLY = ".+(\\.pdf)$"

@dataclass
class FileBundle:
    image_file_name: str
    fott_file_name: str
    ocr_file_name: str

    @staticmethod
    def from_names(names: List[str], mode: FileType) -> List[Any]:
        label_suffix = ".labels.json"
        ocr_suffix = ".ocr.json"

        img_pattern = re.compile(mode.value)
        img_files = [n for n in names if img_pattern.match(n)]

        ret = list()
        for img_file in img_files:
            label_file = img_file + label_suffix
            ocr_file = img_file + ocr_suffix

            if label_file in names and ocr_file in names:
                ret.append(FileBundle(
                    image_file_name=img_file,
                    fott_file_name=label_file,
                     ocr_file_name=ocr_file))

        return ret
