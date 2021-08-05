# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List

from redact.types.annotation import Annotation


class AnnotationFactory:
    def build_annotations() -> List[Annotation]:
        annotations = [
            Annotation(bounding_box=[375.0, 739.0, 517.0, 738.0, 517.0,
                       782.0, 375.0, 781.0],
                       field='Name', text='Aenean'),
            Annotation(bounding_box=[1265.0, 1091.0, 1495.0, 1090.0, 1494.0,
                       1132.0, 1267.0, 1134.0],
                       field='Date', text='1900/01/01'),
            Annotation(bounding_box=[1260.0, 1165.0, 1445.9999999999998,
                       1165.0, 1445.0, 1210.0, 1261.0, 1212.0],
                       field='Total', text='$3000.00')]

        return annotations

    def build_annotations_mode_1() -> List[Annotation]:
        annotations = [
            Annotation(bounding_box=[76, 105, 104, 105,
                       104, 111, 76, 111],
                       field='Name', text=''),
            Annotation(bounding_box=[255, 155, 301, 155,
                       301, 161, 255, 162],
                       field='Date', text=''),
            Annotation(bounding_box=[254, 166, 291, 166,
                       291, 172, 254, 173],
                       field='Total', text='')]

        return annotations
