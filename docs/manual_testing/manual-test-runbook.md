# Manual Tests Runbook

## Branch:  alex-krasn/feature-regenerate-OCR-for-file-#256
**on issue https://github.com/microsoft/OCR-Form-Tools/issues/256**

> `Feature description:`
>In some cases user may want to rerun OCR for singe document in the project or for all the documents in project.\
>This feature will enable this.

## Proposed Tests

#### Part One #####

1. Open an existing project or create the new one.
2. In case of new project - the app will offer you to **Run OCR** for all document (green button on the top of documents preview sidebar).
3. After running OCR for new project or opening existing project - choose the current document on which you want to **rerun OCR**.
4. In left top corner of  `canvasCommandBar` click on '```...```' icon and chose **re-run OCR for current document**
5. You should see **Running OCR** spinner.
6. Check in Azure Blob Container that indeed `documentName.ocr.json` file has changed. (check timestamp for example).

#### Part Two #####

1. Repeat steps `1` and `2` from **Part One**.
2. After running OCR for new project or opening existing project in left top corner of  `canvasCommandBar` click on '```...```' icon and chose **re-run OCR for all documents**
3. You should see **Running OCR** spinner on the canvas and on all documents in the documents preview sidebar.
4. Check in Azure Blob Container that indeed `documentName.ocr.json` files has changed for all documents in the project. (check timestamp for example). You should see the changes.
