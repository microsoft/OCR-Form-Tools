# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import re
import unicodedata


def first_char(item: str) -> str:
    # This replace every uppercase to 'A', lowercase to 'a', digit to '0'.
    # As known as the "Aa0" policy.

    # First remove all diacritics and break typographical ligatures.
    ret = remove_diacritics(item)

    # This also takes care of other common letter in Europe languages (Ø) and
    # linguistic ligatures (Œ) instead of just A-Z.
    ret = re.sub('[A-ZØÞŁꜲÆꜴꜶꜸꜺꜼǶŒꝎẞꜨꝠ]', 'A', ret)
    ret = re.sub('[a-zøþıłꜳæꬱꜵꜷꜹꜻꜽ🙰ꭁƕỻœꝏßꜩꝡ]', 'a', ret)
    ret = re.sub('[0-9]', '0', ret)
    return ret


def remove_diacritics(input_str: str) -> str:
    """Remove diacritics and typographical ligatures from the string.

    - All diacritics (i.e. accents) will be removed.
    - Typographical ligatures (e.g. ﬃ) are broken into separated characters.
    - True linguistic ligatures (e.g. œ) will remain.
    - Non-latin scripts will remain.

    Args:
        input_str (str): The original string with diacritics and ligatures.

    Returns:
        str: The string without diacritics and typographical ligatures.
    """
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
