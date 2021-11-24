# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from PIL import ImageChops, ImageStat, Image

from redact.utils.pdf_renderer import PdfRenderer
from tests.factories.image_factory import ImageFactory

class TestPdfRendering:

    def test_rendering(self) -> None:
        # A small tolerance epsilon because of the jpg compression loss.
        epsilon = 0.1
        renderer = PdfRenderer()

        expected_image = ImageFactory.build_rendered_pdf()
        actual_image = renderer.render_pdf("testdata/testdata.pdf", 300)

        diff = ImageChops.difference(actual_image, expected_image)
        stat = ImageStat.Stat(diff)
        # stat.mean is a 3-tuple representing the mean value of [r, g, b].
        for channel in stat.mean:
            assert channel < epsilon
