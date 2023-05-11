# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from PIL import Image

import ctypes
import pypdfium as pdfium

WHITE = 0xFFFFFFFF


class PdfRenderer:
    def __init__(self):
        # Initiate PDFium - This only needs to happen once
        pdfium.FPDF_InitLibraryWithConfig(pdfium.FPDF_LIBRARY_CONFIG(2, None, None, 0))

    def get_page_count(self, input_file: str):
        doc = pdfium.FPDF_LoadDocument(str(input_file), None)
        page_count = pdfium.FPDF_GetPageCount(doc)
        pdfium.FPDF_CloseDocument(doc)
        return page_count

    def render_pdf(
        self, input_file: str, render_target_dpi: int, page_number: int = 1
    ) -> Image:
        """
        This renders a PDF page into an Image.

        :param input_file: a path points to the PDF.
        :param render_target_dpi: the target DPI for rendering the image.
        :param page_number: an **1-based** page index for the to-be-rendered page.
        :returns: an Image of the PDF page with the target DPI.
        """
        doc = pdfium.FPDF_LoadDocument(str(input_file), None)

        page = pdfium.FPDF_LoadPage(doc, page_number - 1)

        # Page dimensions are measured in points. One point is 1/72 inch (around 0.3528 mm).
        width = int(pdfium.FPDF_GetPageWidthF(page) + 0.5)
        height = int(pdfium.FPDF_GetPageHeightF(page) + 0.5)

        # Converting to page
        render_width = int(width / 72 * render_target_dpi)
        render_height = int(height / 72 * render_target_dpi)

        # render to bitmap
        bitmap = pdfium.FPDFBitmap_Create(render_width, render_height, 0)
        pdfium.FPDFBitmap_FillRect(
            bitmap, 0, 0, render_width, render_height, 0xFFFFFFFF
        )
        pdfium.FPDF_RenderPageBitmap(
            bitmap,
            page,
            0,
            0,
            render_width,
            render_height,
            0,
            pdfium.FPDF_LCD_TEXT | pdfium.FPDF_ANNOT,
        )

        # retrieve data from bitmap
        buffer = pdfium.FPDFBitmap_GetBuffer(bitmap)
        buffer_ = ctypes.cast(
            buffer, ctypes.POINTER(ctypes.c_ubyte * (render_width * render_height * 4))
        )

        img = Image.frombuffer(
            "RGBA", (render_width, render_height), buffer_.contents, "raw", "BGRA", 0, 1
        )

        if bitmap is not None:
            pdfium.FPDFBitmap_Destroy(bitmap)
        pdfium.FPDF_ClosePage(page)

        pdfium.FPDF_CloseDocument(doc)

        return img

    def render_pdf_and_save(
        self,
        input_file: str,
        output_file: str,
        render_target_dpi: int,
        page_number: int = 1,
    ):
        img = self.render_pdf(input_file, render_target_dpi, page_number)
        img.save(output_file)
        img.close()
