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

    input_file = fb.image_file_name
    if is_pdf(input_file):
        renderer = PdfRenderer(input_file, dpi=target_pdf_render_dpi)
    elif is_tiff(input_file):
        renderer = TiffRenderer(input_file)
    else:
        raise ValueError("File should be PDF or TIFF.")

    file_bundles = []
    
    for index, image in enumerate(renderer.render_doc()):
        
        page_num = index + 1
        
        # Render raw image per page.
        page_image_name = get_page_file_name(
            fb.image_file_name,
            page_num,
            ".rendered.png",
        )
        image.save( Path(in_folder, page_image_name) )

        # Extract raw FOTT file per page.
        page_fott_file_name = get_page_file_name(
            fb.image_file_name,
            page_num,
            ".rendered.png.labels.json",
        )
        extract_page_label(
            Path(pre_folder, fb.fott_file_name),
            Path(in_folder, page_fott_file_name),
            page_num,
        )

        # Extract raw OCR file per page.
        page_ocr_file_name = get_page_file_name(
            fb.image_file_name,
            page_num,
            ".rendered.png.ocr.json",
        )
        extract_page_ocr(
            Path(pre_folder, fb.ocr_file_name),
            Path(in_folder, page_ocr_file_name),
            page_num,
        )

        file_bundles.append(
            FileBundle(
                image_file_name=page_image_name,
                fott_file_name=page_fott_file_name,
                ocr_file_name=page_ocr_file_name,
            )
        )
    
    renderer.close()
    
    return file_bundles
