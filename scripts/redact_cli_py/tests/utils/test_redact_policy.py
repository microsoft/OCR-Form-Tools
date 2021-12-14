# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.utils.redact_policy import first_char, remove_diacritics


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

    def test_first_char_diacritics(self) -> None:
        text = "Anaïs, Noël, Sørina, François, Mátyás, Agnès, Fañch, Reiß"
        actual = first_char(text)
        assert "Aaaaa, Aaaa, Aaaaaa, Aaaaaaaa, Aaaaaa, Aaaaa, Aaaaa, Aaaa" == actual

    def test_remove_diacritics_empty(self) -> None:
        text = ""
        actual = remove_diacritics(text)
        assert "" == actual

    def test_remove_diacritics_with_diacritics(self) -> None:
        text = "Português, Lô-má-jī"
        actual = remove_diacritics(text)
        assert "Portugues, Lo-ma-ji" == actual

    def test_remove_diacritics_french_letters(self) -> None:
        text = "çéâêîôûàèìòùëïü"
        actual = remove_diacritics(text)
        assert "ceaeiouaeioueiu" == actual

    def test_remove_diacritics_typographical_ligature(self) -> None:
        text = "ﬀﬃﬄﬁﬂﬆﬅ"
        actual = remove_diacritics(text)
        assert "ffffifflfiflstst" == actual

    def test_remove_diacritics_linguistic_ligature(self) -> None:
        text = "ꜳæꬱꜵꜷꜹꜻꜽ🙰ꭁƕỻœꝏßꜩꝡ"
        actual = remove_diacritics(text)
        assert text == actual

    def test_remove_diacritics_boeuf_a_la_bourguignonne(self) -> None:
        text = "bœuf à la Bourguignonne"
        actual = remove_diacritics(text)
        assert "bœuf a la Bourguignonne" == actual
