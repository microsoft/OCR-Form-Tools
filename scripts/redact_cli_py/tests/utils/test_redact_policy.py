# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.utils.redact_policy import first_char


class TestRedactPolicy:
    def test_first_char_empty(self) -> None:
        text = ""
        actual = first_char(text)
        assert "" == actual

    def test_first_char_Apple(self) -> None:
        text = "Apple"
        actual = first_char(text)
        assert "Aaaaa" == actual

    def test_first_char_date(self) -> None:
        text = "1900/01/01"
        actual = first_char(text)
        assert "0000/00/00" == actual

    def test_first_char_price(self) -> None:
        text = "$3000.00"
        actual = first_char(text)
        assert "$0000.00" == actual
