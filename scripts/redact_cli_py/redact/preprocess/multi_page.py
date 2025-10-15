from pathlib import Path
import json

from dacite import from_dict

from redact.types.fott_label import FottLabel


def extract_page_label(fott_label_path: str, output_path: str, page_number: int):
    with open(fott_label_path, encoding="utf-8-sig") as fott_label_json:
        fott_label_dict = json.load(fott_label_json)
        fott_label = from_dict(data_class=FottLabel, data=fott_label_dict)

        selected_labels = []

        for label in fott_label.labels:
            selected_entities = []
            for entity in label.value:
                if entity.page == page_number:
                    entity.page = 1
                    selected_entities.append(entity)
            if len(selected_entities) > 0:
                selected_labels.append(label)

        fott_label.labels = selected_labels

        # Custom dumper because default JSON serializer
        # does not support FottLabel.
        def dumper(obj):
            try:
                return obj.toJSON()
            except AttributeError:
                return obj.__dict__

        Path(output_path).write_text(
            json.dumps(fott_label, default=dumper), encoding="utf-8"
        )


def extract_page_ocr(ocr_result_path: str, output_path: str, page_number: int):
    with open(ocr_result_path, encoding="utf-8-sig") as ocr_result_json:
        ocr_result = json.load(ocr_result_json)

        new_read_results = [ocr_result["analyzeResult"]["readResults"][page_number - 1]]
        new_read_results[0]["page"] = 1
        ocr_result["analyzeResult"]["readResults"] = new_read_results

        Path(output_path).write_text(json.dumps(ocr_result), encoding="utf-8")
