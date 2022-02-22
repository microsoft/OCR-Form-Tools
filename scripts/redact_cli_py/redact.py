# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import sys
from redact import redact_image, redact_fott_label, redact_ocr_result


if __name__ == '__main__':
    operator = sys.argv[1]

    if operator == 'image':
        labels_to_redact = [] if len(sys.argv) < 6 else sys.argv[5].split(',')
        redact_image(
            image_path=sys.argv[2],
            fott_label_path=sys.argv[3],
            output_path=sys.argv[4],
            labels_to_redact=labels_to_redact)

    elif operator == 'fott':
        labels_to_redact = [] if len(sys.argv) < 5 else sys.argv[4].split(',')
        redact_fott_label(fott_label_path=sys.argv[2],
                          output_path=sys.argv[3],
                          labels_to_redact=labels_to_redact)

    elif operator == 'ocr':
        labels_to_redact = [] if len(sys.argv) < 6 else sys.argv[5].split(',')
        redact_ocr_result(
            ocr_result_path=sys.argv[2],
            fott_label_path=sys.argv[3],
            output_path=sys.argv[4],
            labels_to_redact=labels_to_redact)

    else:
        raise NameError()
