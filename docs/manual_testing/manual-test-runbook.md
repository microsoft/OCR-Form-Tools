# Test Runbook
## **Feat: support download JSON for trained model**

> ### Feature description ###
- Add a 'Download JSON file' button to train page  

> ### Use Case ###  

**As** a user  
**I want** to be able to download JSON file of my trained model  
**So** I can see raw JSON result of training  

> ### Acceptance criteria ###

#### Scenario One ####
**Given** I'm open new project, label, then train  
**When**  I train a model  
**Then** I should be able to download JSON for that new trained model by clicking on 'Download JSON file' button  

#### Scenario Two ####

**Given** I'm open existing project  
**When**  I go to train page  
**Then** I should be able to download last train model by clicking on 'Download JSON file' button  


## **Feat: support region labeling**

> ### Feature description ###
- Add a draw region button to the canvas commandbar in the editor page  

> ### Use Case ###

**As** a user  
**I want** draw regions to label in the editor page  
**So** I can label regions that are not recognized by OCR  

> ### Acceptance criteria ###

#### Scenario One ####
**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I hover the pointer over the current document image  
**Then** I should see the cursor change to a crosshair  

#### Scenario Two ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click the layer botton on the canvas commandbar  
**Then** I should see the drawn regions layer disabled in the canvas commandbar  

#### Scenario Three ####

**Given** I'm on the editor page  
**When**  I click the layer botton on the canvas commandbar  
**Then** I should see the drawn regions layer enabled in the canvas commandbar  

#### Scenario Four ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click and drag on the document image  
**Then** I should see a region being drawn  

#### Scenario Five ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click and drag outside of the document image  
**Then** I should see the document panned  

#### Scenario Six ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click and drag on the document image to outside of the document image  
**Then** I should see a region being drawn and then cancelled  

#### Scenario Seven ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I finish drawing a region  
**Then** I should see a drawn region that is selected  

#### Scenario Eight ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click on the draw region button again  
**Then** I should see the cursor return to a pointer while hovering the document image  

#### Scenario Nine ####

**Given** I've drawn regions  
**When**  I hover a region's vertex  
**Then** I should see a move icon apear on the vertex and the cursor change to grab  

#### Scenario Ten ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, and hold  
**Then** I should see the cursor change to grabbing and the vertex should move with cursor  

#### Scenario Eleven ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, hold, and drag outside of the document image  
**Then** I should see the vertex return to it's original position  

#### Scenario Twelve ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, hold, drag, and click the Escape or Backspace key  
**Then** I should see the vertex return to it's original position  

#### Scenario Thirteen ####

**Given** I'm on the editor page and click the draw region botton on the canvas commandbar  
**When**  I click on the document image, hold, drag, and click the Escape or Backspace key  
**Then** I should see the drawing cancelled  

#### Scenario Fourteen ####

**Given** I've drawn regions  
**When**  I exit draw region mode and click drawn regions  
**Then** I should see the drawn regions toggle between selected and unselected  

#### Scenario Fifteen ####

**Given** I've drawn regions  
**When**  I exit draw region mode  
**Then** I should see the drawn regions still be reshapable  

#### Scenario Sixteen ####

**Given** I've selected drawn regions  
**When**  I click an empty tag or a tag with only drawn region values already applied or press it's hot key  
**Then** I should see the drawn region applied as a label for the tag  

#### Scenario Seventeen ####

**Given** I've selected drawn regions  
**When**  I click a tag with text or checkbox values or press it's hot key  
**Then** I should see a message letting me know I can't apply the drawn region to the tag  

#### Scenario Eighteen ####

**Given** I've labeled drawn regions    
**When**  I view the label json file    
**Then** I should see the drawn region labeled with a clockwise bounding box

#### Scenario Nineteen ####

**Given** I've labeled drawn regions  
**When**  I hover the cursor over a label vertex  
**Then** I should see the vertex should be movable  

#### Scenario Twenty ####

**Given** I've labeled drawn regions  
**When**  I hover the cursor over a label vertex  
**Then** I should see the vertex should be movable  

#### Scenario Twentyone ####

**Given** I've labeled drawn regions  
**When**  I hover the cursor over a label vertex and move it  
**Then** I should see the label reshaped in the document image and the json file  

#### Scenario Twentytwo ####

**Given** I've selected drawn regions  
**When**  I press alt-backspace  
**Then** I should see the selected regions should be deleted 

## **Feat: support adding models to project's recent models from the model compose page**  

> ### Feature description ###
- add a "add to recent models" button in the model information view after double clicking a model  

> ### Use Case ###

**As** a user  
**I want** add a model from the model compose page to myu recent models  
**So** that I can anaylze with that model  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I'm on the model compose page  
**When** I double click on any model that has a ready status  
**Then** I should see it's model information and an add to recent projects button  

#### Scenario Two ####

**Given** I'm on the model compose page and have double clicked on a model  
**When** I click the add to recent projects button and then go to the analyze page  
**Then** I should see the added model as the current model to analyze with  

#### Scenario Three ####

**Given** I'm on the model compose page and have double clicked on a model  
**When** I click the add to recent projects button, then go to the analyze page, and analyze a document  
**Then** I should see the analysis results using the model added  

#### Scenario Four ####

**Given** I've added multiple models to my projects recent models from the model compose page  
**When** I go the analyze page and click change model  
**Then** I should see up to the 5 most recent models  

## **Feat: add composedNames popup for each model**

> ### Feature description ###
- On compose model page add popup for composed models to show which models been used for the composition of this model  

> ### Use Case ###

**As** a user  
**I want** I want to know the models been used to compose a model  
**So** I can double click that model to invoke the pop up and checkout models been used   

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents and I'm on the Model Compose page  
**When`** I double click a row with composed model  
**Then** I should see a pop up, which it shows all models we used to compose in the list. Beside, there is also a filter field in the top to filter a specific model out of the list  

## Feat: support group selection tool

> ### Feature description ###

- support tool for selection of multiple words in the editor page

> ### Use Case ###

**As** a user  
**I want** select encompassing words by drawing a bounding box  
**So** I can easily select multiple words  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I'm on the editor page  
**When** I hold shift, click, and drag  
**Then** I should see a bounding box drawn on the form  

#### Scenario Two ####

**Given** I'm on the editor page  
**When** I hold shift, click, drag over encompassing words, and release click  
**Then** I should see the encompassing words selected  

#### Scenario Three ####

**Given** I'm on the editor page  
**When** I hold shift, click, drag over encompassing words have already been selected, and release click  
**Then** I should see the selected words remain selected  

#### Scenario Four ####

**Given** I'm on the editor page  
**When** I hold shift, click, drag over encompassing words and checkboxes, and release click  
**Then** I should see only the words selected  

#### Scenario Five ####

**Given** I'm on the analyze page  
**When** I hold shift  
**Then** I should not see the selection tool cursor  

#### Scenario Six ####

**Given** I'm on the editor page and have selected words with the group select tool  
**When** I apply the selected words to a tag  
**Then** I should see the selected words applied to the tag in the UI and in the label JSON file   

___

## Feat: show project's recent models at top of model compose page's list of models

> ### Feature description ###

- Show current project's recent models at the top of model compose page's list of models when landing on the page

> ### Use Case ###

**As** a user  
**I want** have my project's recent models at the top of the model compose page's list of models   
**So** I don't have to search for my project's recent models

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project with recent models  
**When** I go to the model compose page  
**Then** I should see my recent models at the top of the list of models

#### Scenario Two ####

**Given** I've opened a project with recent models, but one or more of the recent models have been deleted  
**When** I go to the model compose page  
**Then** I should see only the recent models that have not been deleted at the top of the list of models

___

 ## Feat: support model selection for analyzing

> ### Feature description ###
- track the five most recent trained or composed models  
- display currently selected model in the analyze page right pane header  
- display no models message when user has no recent models in the analyze page right pane header  
- display button for selecting model in the analyze page right pane header  
- display pop-up for selecting a model from a list of the five most recent models  
- support analyzing with selected model  

> ### Use Case ###

**As** a user  
**I want** to be able to select a model to analyze with  
**So** I can use that model to analyze with  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've not trained or composed a model for my current project  
**When** I go to the analyze page  
**Then** I should see a message letting me know I don't have any recent models  

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

## Feat: support project sharing via string

> ### Feature description ###

- Support project sharing bettween users who have access to same storage container

> ### Use Case ###

**As** a user  
**I want** to be able to share to a project via shared string  
**So** receiving user don't have to manually copy-paste project info into app settings

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project, clicked on "..." dropdow in Canvas Commandbar  
**When** I click "Share Project" I should see tha message that shared string been saved to my clipboard  
**Then** I can paste the string from clipboard

#### Scenario Two ####

**Given** I've received the string with a project  
**When** I open the home page of the FOTT and click on "Open Cloud Project" icon, I can paste the string to the input field and click "OK"    
**Then** FOTT should open the shared project as expected.

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
- Support FoTT's existing features in Electron
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
**Then** I should see "Running OCR..." for the current document. When running OCR finishes, I should be able to view the document's updated OCR JSON file.

#### Scenario Two ####

**Given** I've opened a project containing documents and I'm on the Tag Editor page.  
**When** I click "Run OCR on all documents" in the canvas command bar  
**Then** I should see "Running OCR..." for all documents. When running OCR finishes for each document, I should be ale to view each document's updated OCR JSON file.

___

## Feat: enable compose model and add model name when training a new model

> ### Feature description ###
- Add model name input field on train page to add model name when training a new model
- Add model compose page in order to compose a new model with existing models

> ### Use Case ###

**As** a user  
**I want** to give the new train model a customized name  
**So** I can type the name in input field in train page before click train button.  

**As** a user  
**I want** to generate a new mode through existing model  
**So** I can use model compose 

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents and I'm on the Train page.  
**When** I type customized name in input field and click train button  
**Then** I should see typed name shows in Train Record after record shows up.

#### Scenario Two ####

**Given** I've opened a project containing documents and I'm on the Model Compose page. There are enough existing models in modelList.  
**When** I select more than one models then click compose button  
**Then** I should see a pop up modal with a list contains selected models and a input field.  
**When** I type customerized model name in input field and click compose button on modal  
**Then** I should see "Model is composing, please wait...". After that the list shows up again, new composed model with given name will be on the top of the list. The new composed model also has a "Merge" icon. 


#### Scenario Three ####

**Given** I've opened a project containing documents and I'm on the Model Compose page.  
**When** I click the header of a column  
**Then** I should see the column becomes sorted in either ascending or descending order.  
**When** I type some text inside the filter field on top right  
**Then** I should see items whose id or name contains the text be filtered out.
