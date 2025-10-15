# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2022-08-11
### Changed
- Refactor code styles with flake8/black and their extensions.

## [0.3.1] - 2022-08-02
### Added
- Support to multi page PDFs and TIFFs in batch redact CLI (`batch_redact.py`)

## [0.3.0] - 2022-01-06
### Added
- Support to FormRecognizer OCR Result v3.0 format while still maintaining the backward compatibility to v2.0 and v2.1.

### Changed
- The default API version of OCR result redaction has changed from v2.x to v3.x schema.
- You now need to specified which version of the OCR result you want to redact in `redact.py` and `batch_redact.py`.
  - Before:

  ``` bash
  python redact.py ocr <ocr_result_path> <fott_label_path> <output_path>
  python batch_redact.py <input_container> <input_folder_path> <output_container> <output_folder_path>
  ```

  - After:

  ``` bash
  python redact.py ocr <ocr_result_path> <fott_label_path> <output_path> <api_version>
  python batch_redact.py <input_container> <input_folder_path> <output_container> <output_folder_path> <api_version>
  ```

  Where API Version is one of the following:
  - v2.0
  - v2.1
  - v3.0

## [0.2.3] - 2021-12-13
### Added
- Support to redact some Latin ligature letters and letters with diacritics.

## [0.2.2] - 2021-11-17
### Added
- Support to only redact specific labels.
- Add support for one page pdfs in batch redact CLI (`batch_redact.py`)

## [0.2.1] - 2021-08-05
### Added
- Support to image modes other than 'RGB' and 'RGBA'. E.g. image mode '1'.

## [0.2.0] - 2021-07-09
### Added
- Support Microsoft Azure Blob Storage as IO by `azure-storage-blob` package.
- Add batch redact CLI (`batch_redact.py`), assuming the folder structure follows FOTT blob storage folder.
    - input: from local folder or from Blob Storage folder
    - output: to local folder or to Blob Storage folder

### Changed
- Extract `redact_image()`, `redact_fott_label()`, and `redact_ocr_result()` function to `redact` namespace for both `redact.py` and `batch_redact.py` to use.
- Change default redact color from black to white.

## [0.1.0] - 2021-06-25
### Added
- Add image redaction.
- Add FOTT label redaction.
- Add OCR result redaction.
- Add simple CLI wrap (`redact.py`) to redact image / FOTT label / OCR result file.
