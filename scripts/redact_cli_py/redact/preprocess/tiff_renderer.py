# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from PIL import Image


class TiffRenderer:
    def get_page_count(self, input_file: str):
        tiffstack = Image.open(input_file)
        tiffstack.load()
        return tiffstack.n_frames

    def render_tiff_and_save(
        self, input_file: str, output_file: str, page_number: int = 1
    ):
        tiffstack = Image.open(input_file)
        tiffstack.load()

        tiffstack.seek(page_number - 1)

        tiffstack.save(output_file)
        tiffstack.close()
