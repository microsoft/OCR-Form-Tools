# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.
from typing import List

from redact.types.fott_label import FottLabel
from redact.utils.redact_policy import first_char


class FottLabelRedaction:
    def __init__(self, fott_label: FottLabel,  labels_to_redact: List[str] = []):
        self.fott_label = fott_label
        self.labels_to_redact = labels_to_redact

    def redact(self):
        for label in self.fott_label.labels:
            if len(self.labels_to_redact) == 0 or label.label in self.labels_to_redact:
                for entity in label.value:
                    entity.text = first_char(entity.text)
