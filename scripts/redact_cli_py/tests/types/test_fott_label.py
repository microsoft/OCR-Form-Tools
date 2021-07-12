# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from tests.factories.annotation_factory import AnnotationFactory
from tests.factories.fott_label_factory import FottLabelFactory


class TestFottLabel:
    def test_to_annotations(self) -> None:
        fott_label = FottLabelFactory.build()
        annotations = AnnotationFactory.build_annotations()

        actual = fott_label.to_annotations(page_size={1: (2481, 3509)})

        assert actual == annotations

    # Modify the first label to be on a 10-times large page.
    def test_to_annotations_multi_page(self) -> None:
        fott_label = FottLabelFactory.build()
        fott_label.labels[0].value[0].page = 2

        annotations = AnnotationFactory.build_annotations()
        bbox = annotations[0].bounding_box
        for i, element in enumerate(bbox):
            bbox[i] = element * 10

        actual = fott_label.to_annotations(
            page_size={1: (2481, 3509), 2: (24810, 35090)})

        assert actual == annotations
