# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

import sys
from redact import redact_image, redact_fott_label, redact_ocr_result


if __name__ == '__main__':
    operator = sys.argv[1]

    if operator == 'image':
        redact_image(
            image_path=sys.argv[2],
            fott_label_path=sys.argv[3],
            output_path=sys.argv[4])

    elif operator == 'fott':
        redact_fott_label(fott_label_path=sys.argv[2], output_path=sys.argv[3])

    elif operator == 'ocr':
        redact_ocr_result(
            ocr_result_path=sys.argv[2],
            fott_label_path=sys.argv[3],
            output_path=sys.argv[4])

    else:
        raise NameError()
