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


___
___

## **Feat: enable compose model and add model name when training a new model**

> ### Feature description ###
- Add model name imput field on train page to add model name when training a new model
- Add model compose page in order to compose a new model with existing models

> ### Use Case ###

**`As`** a user
**`I want`** to give the new train model a customerized name 
**`So`** I can type the name in input field in train page before click train button.  

**`As`** a user
**`I want`** to generate a new mode through existing model 
**`So`** I can use model compose 

> ### Acceptance criteria ###

#### Scenario One ####

**`Given`** I've opened a project containing documents and I'm on the Train page.\
**`When`** I type customerized name in input field and click train button\
**`Then`** I should see typed name shows in Train Record after record shows up.\

#### **Scenario Two** ####

**`Given`** I've opened a project containing documents and I'm on the Model Compose page. There are enough existing models in modelList.\
**`When`** I select more than one models then click compose button\
**`Then`** I should see a pop up modal with a list contains selected models and a input field.\
**`When`** I type customerized model name in input field and click compose button on modal\
**`Then`** I should see "Model is composing, please wait...". After that the list shows up again, new composed model with given name will be on the top of the list. The new composed model also has a "combine" icon. 


#### ***Scenario Three*** ####

**`Given`** I've opened a project containing documents and I'm on the Model Compose page.\
**`When`** I click the header of a column\
**`Then`** I should see the column becomes sorted in either ascending or discending order.\
**`When`** I type some text inside the fliter field on top right\
**`Then`** I should see items whose id or name contains the text be filtered out. 