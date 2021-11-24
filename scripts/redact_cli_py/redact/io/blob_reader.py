# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List
from pathlib import Path

from azure.storage.blob import ContainerClient

from redact.types.file_bundle import FileBundle
from redact.types.file_bundle import FileType


class BlobReader():
    def __init__(self, container_url: str, prefix: str):
        self.container_client = ContainerClient.from_container_url(
            container_url)
        self.prefix = prefix

    def download_bundles(self, to: str, mode=FileType.IMAGE_ONLY) -> List[FileBundle]:
        blobs = self.container_client.list_blobs(name_starts_with=self.prefix)
        all_file_name_list = [Path(blob.name).name for blob in blobs]
        file_bundles = FileBundle.from_names(all_file_name_list, mode)

        for bundle in file_bundles:
            image_blob_path = self.prefix + bundle.image_file_name
            fott_blob_path = self.prefix + bundle.fott_file_name
            ocr_blob_path = self.prefix + bundle.ocr_file_name

            image_path = Path(to, bundle.image_file_name)
            fott_path = Path(to, bundle.fott_file_name)
            ocr_path = Path(to, bundle.ocr_file_name)

            with open(image_path, 'wb') as image_file, \
                    open(fott_path, 'wb') as fott_file, \
                    open(ocr_path, 'wb') as ocr_file:

                image_file.write(
                    self.container_client.
                    download_blob(image_blob_path).readall())
                fott_file.write(
                    self.container_client.
                    download_blob(fott_blob_path).readall())
                ocr_file.write(
                    self.container_client.
                    download_blob(ocr_blob_path).readall())

        return file_bundles
