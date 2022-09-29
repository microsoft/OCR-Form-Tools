# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import PIL.Image
import pypdfium2 as pdfium
from typing import Optional, Sequence, Iterator


class PdfRenderer:
    
    def __init__(self, input_file: str, dpi: int):
        self.input_file = input_file
        self.dpi = dpi
        self.pdf = pdfium.PdfDocument(self.input_file)
    
    def __len__(self):
        return len(self.pdf)
    
    def render_page(self, index: int) -> PIL.Image.Image:
        page = self.pdf.get_page(index)
        image = page.render_to(
            pdfium.BitmapConv.pil_image,
            scale = self.dpi / 72,
        )
        page.close()
        return image
    
    def render_doc(self, page_indices: Optional[Sequence[int]] = None) -> Iterator[PIL.Image.Image]:
        # using pypdfium2's multi-page renderer, which is backed by a process pool
        # this is faster than iterating over the page indices and calling render_page()
        yield from self.pdf.render_to(
            pdfium.BitmapConv.pil_image,
            scale = self.dpi / 72,
            page_indices = page_indices
        )
    
    def close(self):
        self.pdf.close()
