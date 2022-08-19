# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project
# root for license information.

from pathlib import Path
import json
from typing import List, Collection

from PIL import Image, ImageOps
from dacite import from_dict

from redact.redaction.image_redaction import ImageRedaction
from redact.redaction.ocr_result_redaction import OcrResultRedaction
from redact.redaction.fott_label_redaction import FottLabelRedaction
from redact.types.api_version import ApiVersion
from redact.types.fott_label import FottLabel
from redact.types.file_bundle import FileBundle
from redact.utils.file_name import get_redacted_file_name


def redact_image(
    image_path: str,
    fott_label_path: str,
    output_path: str,
    labels_to_redact: Collection[str] = tuple(),
):
    with Image.open(image_path) as image, open(
        fott_label_path, encoding="utf-8-sig"
    ) as fott_label_json:

        # Transpose the image based on EXIF orientation tag.
        image = ImageOps.exif_transpose(image)

        fott_label_dict = json.load(fott_label_json)
        fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)

        # page_size = {page: (width, height)}
        annots = fott_label.to_annotations(page_size={1: (image.width, image.height)})

        redaction = ImageRedaction(
            image=image, annotations=annots, labels_to_redact=labels_to_redact
        )
        redaction.redact()

        redaction.image.save(output_path)


def redact_fott_label(
    fott_label_path: str,
    output_path: str,
    labels_to_redact: Collection[str] = tuple(),
):
    with open(fott_label_path, encoding="utf-8-sig") as fott_label_json:
        fott_label_dict = json.load(fott_label_json)
        fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)

        redaction = FottLabelRedaction(fott_label, labels_to_redact=labels_to_redact)
        redaction.redact()

        # Custom dumper because default JSON serializer
        # does not support FottLabel.
        def dumper(obj):
            try:
                return obj.toJSON()
            except AttributeError:
                return obj.__dict__

        Path(output_path).write_text(
            json.dumps(redaction.fott_label, default=dumper), encoding="utf-8"
        )


def redact_ocr_result(
    ocr_result_path: str,
    fott_label_path: str,
    output_path: str,
    api_version: ApiVersion,
    labels_to_redact: Collection[str] = tuple(),
):
    with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json, open(
        fott_label_path, encoding="utf-8-sig"
    ) as fott_label_json:
        fott_label_dict = json.load(fott_label_json)
        fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)

        ocr_result = json.load(ocr_result_json)

        # page_size = {page: (width, height)}
        page_size = {}
        if ApiVersion(api_version) in [
            ApiVersion.V2_0,
            ApiVersion.V2_1,
        ]:
            for read_result in ocr_result["analyzeResult"]["readResults"]:
                page_size[read_result["page"]] = (
                    read_result["width"],
                    read_result["height"],
                )
        elif ApiVersion(api_version) in [
            ApiVersion.V3_0,
        ]:
            pages = ocr_result["analyzeResult"]["pages"]
            for page in pages:
                page_number = page["pageNumber"]
                page_size[page_number] = (page["width"], page["height"])

        annots = fott_label.to_annotations(page_size=page_size)

        redaction = OcrResultRedaction(
            ocr_result,
            annots,
            api_version,
            labels_to_redact,
        )

        redaction.redact()

        Path(output_path).write_text(json.dumps(redaction.ocr_result), encoding="utf-8")


def redact_file_bundle(
    fb: FileBundle,
    in_folder: str,
    out_folder: str,
    api_version: ApiVersion,
    labels_to_redact: Collection[str] = tuple(),
):
    redacted_image_name = get_redacted_file_name(fb.image_file_name)
    redacted_fott_name = get_redacted_file_name(fb.fott_file_name)
    redacted_ocr_name = get_redacted_file_name(fb.ocr_file_name)

    redact_image(
        Path(in_folder, fb.image_file_name),
        Path(in_folder, fb.fott_file_name),
        Path(out_folder, redacted_image_name),
        labels_to_redact=labels_to_redact,
    )
    redact_fott_label(
        Path(in_folder, fb.fott_file_name),
        Path(out_folder, redacted_fott_name),
        labels_to_redact,
    )
    redact_ocr_result(
        Path(in_folder, fb.ocr_file_name),
        Path(in_folder, fb.fott_file_name),
        Path(out_folder, redacted_ocr_name),
        api_version,
        labels_to_redact,
    )
