# Test Runbook

 ## Fix: support model selection for analyzing

> ### Feature description ###
- track the five most recent trained or composed models  
- display currently selected model in the analyze page right pane header  
- display no models message when user has no recent models in the analyze page right pane header  
- display button for selecting model in the analyze page right pane header  
- display pop-up for selecting a model from a list of the five most recenet models  
- support analyzing with selected model  

> ### Use Case ###

**As** a user  
**I want** to be able to select a model to analyze with    
**So** I can use that model to analyze with    

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've not trained or composed a model for my current project  
**When** I go to the analyze page  
**Then** I should see a message letting me know I don't have any recenet models  

#### Scenario Two ####

**Given** I've trained or composed a model for my current project    
**When**  I got to the analyze page  
**Then** I should see my most recent model in the right pane header  

#### Scenario Three ####

**Given** I've trained or composed a model before pulling this change  
**When** I pull this change and go to the analyze page  
**Then** I should see my most recent model in the right pane header

#### Scenario Four ####

**Given** I've selected a different model  
**When** I go to another page for this project and then click on the analyze page  
**Then** I should still see the same selected project  

#### Scenario Five ####

**Given** I've opened the model selection pop-up  
**When** I deselect all models from the list  
**Then** I should not be able to click apply  

#### Scenario Six ####

**Given**  I've selected a different model  
**When** I run an analysis on a document  
**Then** I should see results for the selected model  

#### Scenario Seven ####

**Given** I've trained or composed at least one model  
**When** I train or compose another model, go to the analyze page, and click the choose model button  
**Then** I should see the top five most recently change models (since pulling this change)  

___

 ## Fix: check invalid connection provider options before project actions

> ### Feature description ###
- check connection provider options are valid before creating a project
- check connection provider options are valid before opening a recent project 

> ### Use Case ###

**As** a user  
**I want** a notification when I try to open or create a project with invalid provider options  
**So** I know how to fix invalid provider options issue  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've created a connection with invalid provider options (e.g. invalid SAS token for Azure provider).  
**When** I try to create a new project with that connection.  
**Then** a notification will be displayed telling me my connection is invalid.

#### Scenario Two ####

**Given** I've created a connection with invalid provider options (e.g. invalid SAS token for Azure provider).  
**When** I try to open a recent project that now has an invalid connection provider options (e.g. the Azure container was deleted)  
**Then** a notification will be displayed telling me my connection is invalid.

___

 ## Feat: support distributable releasing

> ### Feature description ###
- Support distributable releasing for Windows, Mac, and Linux

> ### Use Case ###

**As** a user  
**I want** to release my project as a distributable  
**So** I can easily set up FOTT

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've updated dependencies.  
**When** I run `yarn release`.  
**Then** a distributable installer should be created in the releases folder.

#### Scenario Two ####

**Given** I've created a distributable installer.  
**When** I execute the installer.  
**Then** a the FOTT desktop application should install and run as expected.

___

## Feat: support document management

> ### Feature description ###
- Add menu item to canvas command bar for deleting documents

> ### Use Case ###

**As** a user  
**I want** to delete a document and it's files through FOTT  
**So** I don't have to delete the document through a storage provider

#### Scenario One ####

**Given** I've selected a document in the editor page.  
**When** I click the overflow menu item on the canvas command bar and then click "Delete document."  
**Then** FoTT should delete the document in the storage provider, remove it from FOTT's current project, and select the project's first document.  

___

## Feat: support Electron for on premise solution

> ### Feature description ###
- Support FoTT's existing features in Electon
- Support local file system provider in Electron

> ### Use Case ###

**As** a user  
**I want** to use FoTT's existing features through a desktop app  
**So** I don't have to use a browser to use FoTT

**As** a user  
**I want** to use files in my local file system  
**So** I can keep all files on premise

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've installed new dependencies and started FoTT in Electron.  
**When** I click a command item in the title bar.  
**Then** FoTT should perform the command as expected.  

#### Scenario Two ####

**Given** I've installed new dependencies and started FoTT in Electron.  
**When** I perform an action for any existing feature.  
**Then** FoTT should perform as expected (the same as through a browser).  

#### Scenario Three ####

**Given** I've installed new dependencies and started FoTT in Electron.  
**When** I create a new connection with local file system as the provider.  
**Then** I should be able to create a project with the created connection.  

#### Scenario Four ####

**Given** I've installed new dependencies and started FoTT in Electron. And, I have an existing project in my local file system.  
**When** I click "Open local project" on the home page and select the existing project.  
**Then** FoTT should load the project as expected.  

___

## Fix: enable to reorder tags quickly

> ### Feature description ###

Enable reordering tags quickly

> ### Use Case ###

**As** a user  
**I want** to be able to move though tags list quickly  
**So** I can reorder long list of tags faster

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents with long tags list.  
**When** I clicking fast on tags buttons 'Move tag up' or 'Move tag down'  
**Then** it moves without visible jittering.

___

## Enable rerun OCR for current or all documents

> ### Feature description ###
Adding the following buttons to the canvas command bar:

- "Run OCR on current document"
- "Run OCR on all documents"

> ### Use Case ###

**As** a user  
**I want** to rerun OCR on documents  
**So** I can update OCR results

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents and I'm on the Tag Editor page.  
**When** I click "Run OCR on current document" in the canvas command bar  
**Then** I should see "Running OCR..." for the current docucment. When running OCR finishes, I should be able to view the document's updated OCR JSON file.

#### Scenario Two ####

**Given** I've opened a project containing documents and I'm on the Tag Editor page.  
**When** I click "Run OCR on all documents" in the canvas command bar  
**Then** I should see "Running OCR..." for all documents. When running OCR finishes for each document, I should be ale to view each document's updated OCR JSON file.

___

## Feat: enable compose model and add model name when training a new model

> ### Feature description ###
- Add model name imput field on train page to add model name when training a new model
- Add model compose page in order to compose a new model with existing models

> ### Use Case ###

**As** a user  
**I want** to give the new train model a customerized name  
**So** I can type the name in input field in train page before click train button.  

**As** a user  
**I want** to generate a new mode through existing model   
**So** I can use model compose 

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents and I'm on the Train page.  
**When** I type customerized name in input field and click train button  
**Then** I should see typed name shows in Train Record after record shows up.

#### Scenario Two ####

**Given** I've opened a project containing documents and I'm on the Model Compose page. There are enough existing models in modelList.  
**When** I select more than one models then click compose button  
**Then** I should see a pop up modal with a list contains selected models and a input field.  
**When** I type customerized model name in input field and click compose button on modal  
**Then** I should see "Model is composing, please wait...". After that the list shows up again, new composed model with given name will be on the top of the list. The new composed model also has a "combine" icon. 

#### Scenario Three ####

**Given** I've opened a project containing documents and I'm on the Model Compose page.  
**When** I click the header of a column  
**Then** I should see the column becomes sorted in either ascending or discending order.  
**When** I type some text inside the fliter field on top right  
**Then** I should see items whose id or name contains the text be filtered out.
 