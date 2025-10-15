# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List, Collection

from dacite import from_dict

from redact.types.annotation import Annotation
from redact.types.span import Span
from redact.utils.bounding_box_mapping import similar
from redact.utils.redact_policy import first_char


class OcrResultRedactionV3:
    WORD_OVERLAP_THRESHOLD = 0.98

    def __init__(
        self,
        ocr_result: dict,
        annotations: List[Annotation],
        labels_to_redact: Collection[str] = tuple(),
    ):
        self.ocr_result = ocr_result
        self.annotations = annotations
        self.labels_to_redact = labels_to_redact

    def redact(self):
        words_to_redact = self.find_words_to_redact()
        self.redact_words(words_to_redact)
        spans = [
            from_dict(data_class=Span, data=word["span"]) for word in words_to_redact
        ]
        self.redact_lines(spans)
        self.redact_content(spans)
        self.redact_table(spans)

    def find_words_to_redact(self):
        words_to_redact = []

        pages = self.ocr_result["analyzeResult"]["pages"]
        for page in pages:
            for annot in self.annotations:
                if (
                    len(self.labels_to_redact) == 0
                    or annot.field in self.labels_to_redact
                ):
                    words = page["words"]
                    for word in words:
                        if similar(
                            annot.bounding_box,
                            word["boundingBox"],
                            self.WORD_OVERLAP_THRESHOLD,
                        ):
                            words_to_redact.append(word)
                            break
        return words_to_redact

    def redact_words(self, words_to_redact):
        for word in words_to_redact:
            word["content"] = first_char(word["content"])

    def redact_lines(self, spans: List[Span]):
        pages = self.ocr_result["analyzeResult"]["pages"]
        for redact_span in spans:
            line_to_redact = self.get_line_to_redact(pages, redact_span)
            if line_to_redact is not None:
                line_spans = Span.from_dict_list(line_to_redact["spans"])
                relative_span = redact_span.relative_to(line_spans)
                line_to_redact["content"] = self.redact_text(
                    line_to_redact["content"], relative_span
                )

    def redact_content(self, spans: List[Span]):
        content = self.ocr_result["analyzeResult"]["content"]
        for span in spans:
            content = self.redact_text(content, span)
        self.ocr_result["analyzeResult"]["content"] = content

    def redact_table(self, spans: List[Span]):
        tables = self.ocr_result["analyzeResult"]["tables"]
        for span in spans:
            cell_to_redact = self.get_cell_to_redact(tables, span)
            if cell_to_redact is not None:
                cell_spans = Span.from_dict_list(cell_to_redact["spans"])
                relative_span = span.relative_to(cell_spans)
                cell_to_redact["content"] = self.redact_text(
                    cell_to_redact["content"], relative_span
                )

    def get_line_to_redact(self, pages, redact_span: Span):
        for page in pages:
            for line in page["lines"]:
                line_spans = Span.from_dict_list(line["spans"])
                if redact_span.inside(line_spans):
                    return line
        return None

    def get_cell_to_redact(self, tables, span: Span):
        for table in tables:
            for cell in table["cells"]:
                cell_spans = Span.from_dict_list(cell["spans"])
                if span.inside(cell_spans):
                    return cell
        return None

    @staticmethod
    def redact_text(content: str, span: Span) -> str:
        left = span.offset
        right = span.offset + span.length

        pre = content[:left]
        text_to_redact = content[left:right]
        post = content[right:]

        redacted_text = first_char(text_to_redact)
        return pre + redacted_text + post
