# Test Runbook

## **Fix: enable to reorder tags quickly**

> ### Feature description ###

Enable reordering tags quickly

> ### Use Case ###

**`As`** a user\
**`I want`** to be able to move though tags list quickly\
**`So`** I can reorder long list of tags faster

> ### Acceptance criteria ###

#### Scenario One ####

**`Given`** I've opened a project containing documents with long tags list.\
**`When`** I clicking fast on tags buttons `'Move tag up'` or `'Move tag down'`\
**`Then`** it moves without visible jittering.

___
___

## **Enable rerun OCR for current or all documents**

> ### Feature description ###
Adding the following buttons to the canvas command bar:

- "Run OCR on current document"
- "Run OCR on all documents"

> ### Use Case ###

**`As`** a user
**`I want`** to rerun OCR on documents
**`So`** I can update OCR results

> ### Acceptance criteria ###

#### Scenario One ####

**`Given`** I've opened a project containing documents and I'm on the Tag Editor page.\
**`When`** I click "Run OCR on current document" in the canvas command bar\
**`Then`** I should see "Running OCR..." for the current docucment. When running OCR finishes, I should be able to view the document's updated OCR JSON file.

#### **Scenario Two** ####

**`Given`** I've opened a project containing documents and I'm on the Tag Editor page.\
**`When`** I click "Run OCR on all documents" in the canvas command bar\
**`Then`** I should see "Running OCR..." for all documents. When running OCR finishes for each document, I should be ale to view each document's updated OCR JSON file.
