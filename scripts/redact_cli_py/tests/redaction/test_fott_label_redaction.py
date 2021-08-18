# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from redact.redaction.fott_label_redaction import FottLabelRedaction
from tests.factories.fott_label_factory import FottLabelFactory
from tests.test_helpers.redact_policy_helper import RedactPolicyHelper


class TestFottLabelRedaction:
    def test_ctor(self) -> None:
        fott_label = FottLabelFactory.build()
        fott_label_redaction = FottLabelRedaction(fott_label)

        assert fott_label_redaction.fott_label == fott_label

    def test_redact(self) -> None:
        fott_label = FottLabelFactory.build()
        expected = FottLabelFactory.build_redacted()
        fott_label_redaction = FottLabelRedaction(fott_label)

        fott_label_redaction.redact()

        actual = fott_label_redaction.fott_label
        assert actual == expected

    def test_redact_partial(self) -> None:
        fott_label = FottLabelFactory.build_partial()
        expected = FottLabelFactory.build_redacted_partial()
        fott_label_redaction = FottLabelRedaction(fott_label, ["Name", "Date"])

        fott_label_redaction.redact()

        actual = fott_label_redaction.fott_label
        assert actual == expected

    def test_redact_first_char(self) -> None:
        fott_label = FottLabelFactory.build()
        fott_label_redaction = FottLabelRedaction(fott_label)

        fott_label_redaction.redact()

        for label in fott_label_redaction.fott_label.labels:
            for entity in label.value:
                assert RedactPolicyHelper.is_first_char(entity.text)
