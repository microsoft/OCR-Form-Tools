# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import PIL.Image
from typing import Iterator


class TiffRenderer:
    
    def __init__(self, input_file: str):
        self.input_file = input_file
        self.tiffstack = PIL.Image.open(input_file)
        self.tiffstack.load()
    
    def __len__(self):
        return self.tiffstack.n_frames
    
    def render_page(self, index: int) -> PIL.Image.Image:
        self.tiffstack.seek(index)
        return self.tiffstack
    
    def render_doc(self) -> Iterator[PIL.Image.Image]:
        for i in range(len(self)):
            yield self.render_page(i)
    
    def close(self):
        self.tiffstack.close()
