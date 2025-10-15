# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path
import sys
import shutil
from typing import List
from uuid import uuid4

from redact import redact_fott_label, redact_ocr_result, redact_file_bundle
from redact.io.blob_reader import BlobReader
from redact.io.blob_writer import BlobWriter
from redact.io.local_reader import LocalReader
from redact.io.local_writer import LocalWriter
from redact.utils.file_name import get_redacted_file_name, valid_url
from redact.types.file_bundle import FileType, FileBundle
from redact.preprocess import preprocess_multi_page_bundle


# Strong Assumption: assume all valid URLs are Azure Blob URL.
def is_blob_url(url: str) -> bool:
    return valid_url(url)


if __name__ == "__main__":
    input_container = sys.argv[1]
    input_path = sys.argv[2]
    output_container = sys.argv[3]
    output_path = sys.argv[4]
    api_version = sys.argv[5]
    target_pdf_render_dpi = 300
    fields_to_redact = tuple()

    if len(sys.argv) >= 7:
        fields_to_redact = sys.argv[6].split(",")

    # Random generated UUID in the build folder name for preventing collapse.
    build_path = Path(f"build-{uuid4()}/")
    build_pre_folder = Path(build_path, "pre/")
    build_input_folder = Path(build_path, "in/")
    build_output_folder = Path(build_path, "out/")
    Path(build_pre_folder).mkdir(parents=True, exist_ok=True)
    Path(build_input_folder).mkdir(parents=True, exist_ok=True)
    Path(build_output_folder).mkdir(parents=True, exist_ok=True)

    try:
        file_bundle_list = None
        multi_page_bundle_list = None
        if is_blob_url(input_container):
            reader = BlobReader(input_container, input_path)
            multi_page_bundle_list = reader.download_bundles(
                to=build_pre_folder, mode=FileType.MULTI_PAGE
            )
            file_bundle_list = reader.download_bundles(to=build_input_folder)
        else:
            reader = LocalReader(input_path)
            multi_page_bundle_list = reader.copy_bundles(
                to=build_pre_folder, mode=FileType.MULTI_PAGE
            )
            file_bundle_list = reader.copy_bundles(to=build_input_folder)

        per_page_bundle_list: List[FileBundle] = []

        # Render and process PDF/TIFF files if any.
        if multi_page_bundle_list is not None:
            for fb in multi_page_bundle_list:
                bundle_list = preprocess_multi_page_bundle(
                    fb, build_pre_folder, build_input_folder, target_pdf_render_dpi
                )
                per_page_bundle_list.extend(bundle_list)

                # Short path: preprocess folder -> output folder.
                # We still need to redact the full label file.
                redact_fott_label(
                    Path(build_pre_folder, fb.fott_file_name),
                    Path(
                        build_output_folder, get_redacted_file_name(fb.fott_file_name)
                    ),
                    fields_to_redact,
                )

                # We still need to redact the full ocr file.
                redact_ocr_result(
                    Path(build_pre_folder, fb.ocr_file_name),
                    Path(build_pre_folder, fb.fott_file_name),
                    Path(build_output_folder, get_redacted_file_name(fb.ocr_file_name)),
                    api_version,
                    fields_to_redact,
                )

        # Process images and per page result from multi-page documents.
        file_bundle_list.extend(per_page_bundle_list)
        for fb in file_bundle_list:
            redact_file_bundle(
                fb,
                build_input_folder,
                build_output_folder,
                api_version,
                fields_to_redact,
            )

        if is_blob_url(output_container):
            writer = BlobWriter(output_container, output_path)
            writer.upload_files(build_output_folder)
        else:
            writer = LocalWriter(output_path)
            writer.copy_files(build_output_folder)
    finally:
        shutil.rmtree(build_path)
