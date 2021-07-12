# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path

from azure.storage.blob import ContainerClient


class BlobWriter():
    def __init__(self, container_url: str, prefix: str):
        self.container_client = ContainerClient.from_container_url(
            container_url)
        self.prefix = prefix

    def upload_files(self, folder: str):
        for child in Path(folder).iterdir():
            with open(child, "rb") as data:
                self.container_client.upload_blob(
                    name=self.prefix + child.name,
                    data=data,
                    overwrite=True)
