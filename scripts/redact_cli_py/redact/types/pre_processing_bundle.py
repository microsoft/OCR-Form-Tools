# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from dataclasses import dataclass
from typing import Any

from redact.types.file_bundle import FileBundle

@dataclass
class PdfPreProcessingBundle:
    rendered_file_name: str
    corrected_ocr_file_name: str

    @staticmethod
    def from_file_bundle(bundle: FileBundle) -> Any:
        rendered_image_suffix = ".rendered.png"
        corrected_ocr_suffix = ".corrected.ocr.json"

        rendered_file = bundle.image_file_name + rendered_image_suffix
        corrected_ocr_file = bundle.image_file_name + corrected_ocr_suffix
        return PdfPreProcessingBundle(rendered_file_name=rendered_file,
                                      corrected_ocr_file_name=corrected_ocr_file)
