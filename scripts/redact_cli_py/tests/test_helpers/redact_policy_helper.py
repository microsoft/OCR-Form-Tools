# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import re


class RedactPolicyHelper:
    @staticmethod
    def is_first_char(text: str) -> bool:
        # There is no alphanumeric char except Aa0.
        return re.match("^[b-zB-Z1-9]*$", text) is None
