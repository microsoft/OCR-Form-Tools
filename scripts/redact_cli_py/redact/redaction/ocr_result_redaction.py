# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from typing import List, Set

from jsonpointer import resolve_pointer, set_pointer

from redact.types.annotation import Annotation
from redact.utils.bounding_box_mapping import similar
from redact.utils.redact_policy import first_char


class OcrResultRedaction:
    LINE_OVERLAP_THRESHOLD = 0.1
    WORD_OVERLAP_THRESHOLD = 0.98

    def __init__(self, ocr_result: dict, annotations: List[Annotation], labels_to_redact: List[str] = []):
        self.ocr_result = ocr_result
        self.annotations = annotations
        self.labels_to_redact = labels_to_redact

    def redact(self):
        refs = []
        for annot in self.annotations:
            if len(self.labels_to_redact) == 0 or annot.field in self.labels_to_redact:
                refs.extend(self.find_mapped_refs(annot))
        self.redact_words(refs)
        self.redact_lines(refs)
        # Set is faster than List in this case.
        self.redact_page_results(set(refs))

    def find_mapped_refs(self, annot: Annotation):
        refs = []
        read_results = self.ocr_result["analyzeResult"]["readResults"]
        for read_id, read_result in enumerate(read_results):
            lines: List[dict] = read_result["lines"]
            for line_id, line in enumerate(lines):
                # Early rejection.
                if not similar(annot.bounding_box, line["boundingBox"], self.LINE_OVERLAP_THRESHOLD):
                    continue

                words: List[dict] = line["words"]
                for word_id, word in enumerate(words):
                    if similar(annot.bounding_box, word["boundingBox"], self.WORD_OVERLAP_THRESHOLD):
                        refs.append(self.build_ref(read_id, line_id, word_id))
        return refs

    def redact_words(self, refs: List[str]):
        def word_path(ref: str) -> str:
            # Remove leading '#'.
            return ref[1:]

        for ref in refs:
            r = word_path(ref)
            word = resolve_pointer(self.ocr_result, r)
            word["text"] = first_char(word["text"])
            set_pointer(self.ocr_result, r, word)

    def redact_lines(self, refs: List[str]):
        def line_path(ref: str) -> str:
            end = ref.find("/word")
            # Remove leading '#' and trailing word path.
            return ref[1:end]

        for ref in refs:
            r = line_path(ref)
            line = resolve_pointer(self.ocr_result, r)

            tokens = line["text"].split(' ')
            word_id = int(ref.split('/')[-1])
            tokens[word_id] = first_char(tokens[word_id])
            line["text"] = ' '.join(tokens)

            set_pointer(self.ocr_result, r, line)

    def redact_page_results(self, refs: Set[str]):
        def add_analyze_layer(elem: str) -> str:
            return elem.replace('#/', '#/analyzeResult/')

        page_results = self.ocr_result["analyzeResult"]["pageResults"]
        for page_result in page_results:
            tables: List[dict] = page_result["tables"]
            for table in tables:
                cells: List[dict] = table["cells"]
                for cell in cells:
                    elements: List[str] = cell["elements"]
                    for elem_id, element in enumerate(elements):
                        full_elem = add_analyze_layer(element)
                        if full_elem in refs:
                            tokens = cell["text"].split(' ')
                            tokens[elem_id] = first_char(tokens[elem_id])
                            cell["text"] = ' '.join(tokens)

    @ staticmethod
    def build_ref(read_id: int, line_id: int, word_id: int) -> str:
        return f'#/analyzeResult/readResults/{read_id}/lines/{line_id}/words/{word_id}'
