# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.utils.bounding_box_mapping import similar


class TestBoundingBoxMapping:
    def test_similar_true(self) -> None:
        a = [1.0, 1.0, 2.0, 1.0, 2.0, 2.0, 1.0, 2.0]
        b = [1.0, 1.0, 2.0, 1.0, 2.0, 2.0, 1.0, 2.0]
        assert similar(a, b)

    def test_similar_false(self) -> None:
        a = [1.0, 1.0, 2.0, 1.0, 2.0, 2.0, 1.0, 2.0]
        b = [2.0, 1.0, 3.0, 1.0, 3.0, 2.0, 2.0, 2.0]
        assert not similar(a, b)
