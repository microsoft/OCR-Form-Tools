# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from PIL import ImageChops, ImageStat

from tests.factories.image_factory import ImageFactory
from redact.redaction.image_redaction import ImageRedaction
from tests.factories.annotation_factory import AnnotationFactory


class TestImageRedaction:
    def test_ctor(self) -> None:
        image = ImageFactory.build()
        annotations = AnnotationFactory.build_annotations()

        image_redaction = ImageRedaction(image, annotations)

        assert image_redaction.image == image
        assert image_redaction.anntations == annotations

    def test_redact(self) -> None:
        # A small tolerance epsilon because of the jpg compression loss.
        epsilon = 0.1
        image = ImageFactory.build()
        expected_image = ImageFactory.build_redacted()
        annotations = AnnotationFactory.build_annotations()

        image_redaction = ImageRedaction(image, annotations)
        image_redaction.redact()

        diff = ImageChops.difference(image_redaction.image, expected_image)
        stat = ImageStat.Stat(diff)
        # stat.mean is a 3-tuple representing the mean value of [r, g, b].
        for channel in stat.mean:
            assert channel < epsilon

    def test_redact_partial(self) -> None:
        # A small tolerance epsilon because of the jpg compression loss.
        epsilon = 0.1
        image = ImageFactory.build_partial()
        expected_image = ImageFactory.build_redacted_partial()
        annotations = AnnotationFactory.build_annotations()

        image_redaction = ImageRedaction(image, annotations, ["Name","Date"])
        image_redaction.redact()

        diff = ImageChops.difference(image_redaction.image, expected_image)
        stat = ImageStat.Stat(diff)
        # stat.mean is a 3-tuple representing the mean value of [r, g, b].
        for channel in stat.mean:
            assert channel < epsilon

    def test_redact_mode_1(self) -> None:
        # A small tolerance epsilon
        epsilon = 0.01
        image = ImageFactory.build_mode_1()
        expected_image = ImageFactory.build_redacted_mode_1()
        annotations = AnnotationFactory.build_annotations_mode_1()

        image_redaction = ImageRedaction(image, annotations)
        image_redaction.redact()

        expected_image.save("expected.tiff")
        image_redaction.image.save("actual.tiff")

        diff = ImageChops.difference(image_redaction.image, expected_image)
        stat = ImageStat.Stat(diff)
        assert stat.mean[0] < epsilon
