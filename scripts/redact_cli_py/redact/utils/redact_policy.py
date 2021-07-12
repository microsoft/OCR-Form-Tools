# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import re


def first_char(item: str) -> str:
    # This replace every uppercase to 'A', lowercase to 'a', digit to '0'.
    # As known as the "Aa0" policy.
    ret = re.sub('[A-Z]', 'A', item)
    ret = re.sub('[a-z]', 'a', ret)
    ret = re.sub('[0-9]', '0', ret)
    return ret
