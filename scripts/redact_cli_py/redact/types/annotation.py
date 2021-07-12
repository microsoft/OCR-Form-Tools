# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from dataclasses import dataclass
from typing import List


@dataclass
class Annotation:
    bounding_box: List[float]
    field: str
    text: str
