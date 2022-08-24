# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path
from typing import List

from redact.types.file_bundle import FileBundle
from redact.utils.file_name import get_page_file_name, is_pdf, is_tiff
from redact.preprocess.pdf_renderer import PdfRenderer
from redact.preprocess.tiff_renderer import TiffRenderer
from redact.preprocess.multi_page import extract_page_label, extract_page_ocr


def preprocess_multi_page_bundle(
    fb: FileBundle,
    pre_folder: str,
    in_folder: str,
    target_pdf_render_dpi: int = 300,
) -> List[FileBundle]:
    if is_pdf(fb.image_file_name):
        renderer = PdfRenderer()
    elif is_tiff(fb.image_file_name):
        renderer = TiffRenderer()
    else:
        raise ValueError("File should be PDF or TIFF.")

    ret = []
    page_count = renderer.get_page_count(
        Path(pre_folder, fb.image_file_name),
    )
    for page in range(1, page_count + 1):
        # Render raw image per page.
        page_image_name = get_page_file_name(
            fb.image_file_name,
            page,
            ".rendered.png",
        )
        if is_pdf(fb.image_file_name):
            renderer.render_pdf_and_save(
                Path(pre_folder, fb.image_file_name),
                Path(in_folder, page_image_name),
                target_pdf_render_dpi,
                page_number=page,
            )
        elif is_tiff(fb.image_file_name):
            renderer.render_tiff_and_save(
                Path(pre_folder, fb.image_file_name),
                Path(in_folder, page_image_name),
                page_number=page,
            )
        else:
            raise ValueError("File should be PDF or TIFF.")

        # Extract raw FOTT file per page.
        page_fott_file_name = get_page_file_name(
            fb.image_file_name,
            page,
            ".rendered.png.labels.json",
        )
        extract_page_label(
            Path(pre_folder, fb.fott_file_name),
            Path(in_folder, page_fott_file_name),
            page,
        )

        # Extract raw OCR file per page.
        page_ocr_file_name = get_page_file_name(
            fb.image_file_name,
            page,
            ".rendered.png.ocr.json",
        )
        extract_page_ocr(
            Path(pre_folder, fb.ocr_file_name),
            Path(in_folder, page_ocr_file_name),
            page,
        )

        ret.append(
            FileBundle(
                image_file_name=page_image_name,
                fott_file_name=page_fott_file_name,
                ocr_file_name=page_ocr_file_name,
            )
        )
    return ret
