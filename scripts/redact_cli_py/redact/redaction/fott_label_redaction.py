# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.types.fott_label import FottLabel
from redact.utils.redact_policy import first_char


class FottLabelRedaction:
    def __init__(self, fott_label: FottLabel):
        self.fott_label = fott_label

    def redact(self):
        for label in self.fott_label.labels:
            for entity in label.value:
                entity.text = first_char(entity.text)
