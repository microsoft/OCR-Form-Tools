# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from __future__ import annotations

from dataclasses import dataclass
from typing import List

import dacite


@dataclass
class Span:
    offset: int
    length: int

    def includes(self, other: Span) -> bool:
        return (
            self.offset <= other.offset
            and self.offset + self.length >= other.offset + other.length
        )

    def inside(self, others: List[Span]) -> bool:
        return any(span.includes(self) for span in others)

    def relative_to(self, others: List[Span]) -> Span:
        if not self.inside(others):
            raise ValueError("Self span is not inside target span list.")

        offset = 0
        for other in others:
            if other.includes(self):
                offset += self.offset - other.offset
                break
            else:
                offset += other.length
        return Span(offset=offset, length=self.length)

    @staticmethod
    def from_dict(data: dict) -> Span:
        return dacite.from_dict(data_class=Span, data=data)

    @staticmethod
    def from_dict_list(data: List[dict]) -> List[Span]:
        return [Span.from_dict(d) for d in data]
