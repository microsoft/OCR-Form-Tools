# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path
import sys
import shutil
from typing import List
from uuid import uuid4

from redact import redact_image, redact_fott_label, redact_ocr_result
from redact.io.blob_reader import BlobReader
from redact.io.blob_writer import BlobWriter
from redact.io.local_reader import LocalReader
from redact.io.local_writer import LocalWriter
from redact.utils.file_name import get_redacted_file_name, valid_url
from redact.utils.pdf_renderer import PdfRenderer
from redact.types.file_bundle import FileType, FileBundle
from redact.types.pre_processing_bundle import PdfPreProcessingBundle


# Strong Assumption: assume all valid URLs are Azure Blob URL.
def is_blob_url(url: str) -> bool:
    return valid_url(url)


def process_pdf_bundle(file_bundles: List[FileBundle], fields_to_redact: List[str]):
    renderer = PdfRenderer()

    for file_bundle in file_bundles:
        pdf_pre_processing_bundle = PdfPreProcessingBundle.from_file_bundle(file_bundle)

        redacted_image_name = get_redacted_file_name(pdf_pre_processing_bundle.rendered_file_name)
        redacted_fott_name = get_redacted_file_name(file_bundle.fott_file_name)
        redacted_ocr_name = get_redacted_file_name(file_bundle.ocr_file_name)

        # Render PDF
        renderer.render_pdf_and_save(
            Path(build_pre_processing_folder, file_bundle.image_file_name),
            Path(build_pre_processing_folder, pdf_pre_processing_bundle.rendered_file_name),
            target_pdf_render_dpi)

        # Follow the regular redaction process with taking files from slightly different source folders
        redact_image(
            Path(build_pre_processing_folder, pdf_pre_processing_bundle.rendered_file_name),
            Path(build_pre_processing_folder, file_bundle.fott_file_name),
            Path(build_output_folder, redacted_image_name),
            fields_to_redact)
        redact_fott_label(
            Path(build_pre_processing_folder, file_bundle.fott_file_name),
            Path(build_output_folder, redacted_fott_name),
            fields_to_redact)
        redact_ocr_result(
            Path(build_pre_processing_folder, file_bundle.ocr_file_name),
            Path(build_pre_processing_folder, file_bundle.fott_file_name),
            Path(build_output_folder, redacted_ocr_name),
            fields_to_redact)

if __name__ == '__main__':
    input_container = sys.argv[1]
    input_path = sys.argv[2]
    output_container = sys.argv[3]
    output_path = sys.argv[4]
    target_pdf_render_dpi = 300
    fields_to_redact = []

    if len(sys.argv) >= 6:
        fields_to_redact = (sys.argv[5].split(','))

    # Random generated UUID in the build folder name for preventing collapse.
    build_path = Path(f'build-{uuid4()}/')
    build_pre_processing_folder = Path(build_path, "pre/")
    build_input_folder = Path(build_path, "in/")
    build_output_folder = Path(build_path, "out/")
    Path(build_pre_processing_folder).mkdir(parents=True, exist_ok=True)
    Path(build_input_folder).mkdir(parents=True, exist_ok=True)
    Path(build_output_folder).mkdir(parents=True, exist_ok=True)
    try:
        file_bundle_list = None
        pdf_file_bundle_list = None
        if is_blob_url(input_container):
            reader = BlobReader(input_container, input_path)
            pdf_file_bundle_list = reader.download_bundles(to=build_pre_processing_folder, mode=FileType.PDF_ONLY)
            file_bundle_list = reader.download_bundles(to=build_input_folder)
        else:
            reader = LocalReader(input_path)
            pdf_file_bundle_list = reader.copy_bundles(to=build_pre_processing_folder, mode=FileType.PDF_ONLY)
            file_bundle_list = reader.copy_bundles(to=build_input_folder)

        for fb in file_bundle_list:
            redacted_image_name = get_redacted_file_name(fb.image_file_name)
            redacted_fott_name = get_redacted_file_name(fb.fott_file_name)
            redacted_ocr_name = get_redacted_file_name(fb.ocr_file_name)

            redact_image(
                Path(build_input_folder, fb.image_file_name),
                Path(build_input_folder, fb.fott_file_name),
                Path(build_output_folder, redacted_image_name),
                fields_to_redact)
            redact_fott_label(
                Path(build_input_folder, fb.fott_file_name),
                Path(build_output_folder, redacted_fott_name),
                fields_to_redact)
            redact_ocr_result(
                Path(build_input_folder, fb.ocr_file_name),
                Path(build_input_folder, fb.fott_file_name),
                Path(build_output_folder, redacted_ocr_name),
                fields_to_redact)

        # Render and process PDF files if any
        if pdf_file_bundle_list is not None:
            process_pdf_bundle(pdf_file_bundle_list, fields_to_redact)

        if is_blob_url(output_container):
            writer = BlobWriter(output_container, output_path)
            writer.upload_files(build_output_folder)
        else:
            writer = LocalWriter(output_path)
            writer.copy_files(build_output_folder)
    finally:
        shutil.rmtree(build_path)
