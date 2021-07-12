# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path
import shutil


class LocalWriter():
    def __init__(self, output_path: str):
        self.output_path = Path(output_path)
        Path(self.output_path).mkdir(parents=True, exist_ok=True)

    def copy_files(self, folder: str):
        shutil.copytree(folder, self.output_path, dirs_exist_ok=True)
