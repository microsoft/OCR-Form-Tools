# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List
from pathlib import Path
import shutil

from redact.types.file_bundle import FileBundle
from redact.types.file_bundle import FileType


class LocalReader():
    def __init__(self, input_path: str):
        self.input_path = Path(input_path)

    def copy_bundles(self, to: str, mode=FileType.IMAGE_ONLY) -> List[FileBundle]:
        file_names = [path.name for path in self.input_path.glob('**/*')]
        file_bundles = FileBundle.from_names(file_names, mode)

        for bundle in file_bundles:
            image_input_path = Path(self.input_path, bundle.image_file_name)
            fott_input_path = Path(self.input_path, bundle.fott_file_name)
            ocr_input_path = Path(self.input_path, bundle.ocr_file_name)

            image_path = Path(to, bundle.image_file_name)
            fott_path = Path(to, bundle.fott_file_name)
            ocr_path = Path(to, bundle.ocr_file_name)

            shutil.copy2(image_input_path, image_path)
            shutil.copy2(fott_input_path, fott_path)
            shutil.copy2(ocr_input_path, ocr_path)

        return file_bundles
