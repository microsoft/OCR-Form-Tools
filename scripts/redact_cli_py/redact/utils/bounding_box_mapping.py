# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List, Tuple

from shapely.geometry import Polygon

OVERLAP_THRESHOLD = 0.5


def similar(bounding_box_a: List[float], bounding_box_b: List[float], threshold=OVERLAP_THRESHOLD) -> bool:
    a = Polygon(pairwise(bounding_box_a))
    b = Polygon(pairwise(bounding_box_b))
    base_area = min(a.area, b.area)
    intersect_area = a.intersection(b).area
    return intersect_area / base_area > threshold


def pairwise(elements: List[float]) -> List[Tuple[float, float]]:
    ret = []
    for i in range(0, len(elements), 2):
        pair = tuple([elements[i], elements[i+1]])
        ret.append(pair)
    return ret
