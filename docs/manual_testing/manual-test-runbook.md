Test Runbook
======
* Feature by page
  * Home and Project Setting and Connections
    * [support project sharing via string](#project-sharing)  
    * [Fix: check invalid connection provider options before project actions](#check-connection-provider)
  * Tag Editor
    * [support group selection tool](#group-selection)
    * [Table Label](#table-label)
    * [Enable rerun OCR for current or all documents](#rerun-ocr)
    * [support region labeling](#region-label)
    * [support document management](#document-management)
    * [Fix: enable to reorder tags quickly](#reorder-tags)
  * Train and Model Compose and Analyze
    * [support adding models to project's recent models from the model compose page](#sort-trained-models)
    * [add composedNames popup for each model](#composed-name-popup)
    * [Sort project models by clicking the column headers.](#sort-models)
    * [support model selection for analyzing](#model-selection)
    * [enable compose model and add model name when training a new model](#compose-model)
    * [support download JSON for trained model](#download-model-json)
  * Prebuilt analyze
    * [Prebuilt analyze](#prebuilt-analyze)
    * [Table "Items" field](#table-items)
    * [Compose API request](#compose-api-request)
  * Layout analyze
    * [Layout analyze](#layout-analyze)

* Backword Compatibility
  * [Update schema URI](#update-schema-uri)
  * [Update tag color](#update-tag-color)
* Release
  * [support distributable releasing](#distributable-releasing)
  * [support Electron for on premise solution](#electron-for-on-premise-solution)

## <h2 id="download-model-json">support download JSON for trained model</h2>

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
**Then** I should be able to download JSON for that newly trained model by clicking on 'Download JSON file' button  

#### Scenario Two ####

**Given** I opened an existed project  
**When**  I go to train page  
**Then** I should be able to download the last train model by clicking on 'Download JSON file' button  

------
## <h2 id="table-label">Table Label</h2>

> ### Feature description ###
> Edit table labels with preview.

#### Scenario One ####
**Given** I'm on the edit page and loaded images.
**When** I click the "add new table tag" icon button
**Then** I should see a new "Configure table tag" sidebar on the right side of the screen.

## Configure fixed-sized table

#### Scenario Two ####
**Given** I'm on the edit page and open the "configure table tag".  
**When** I select type "fixed-sized" and format "column fields".  
**When** I click a "column fields" textarea and type "column1".  
**When** I click the "+Add column" button and see a new textarea , then type "column2".  
**When** I click the "+Add column" button and see a new textarea , then type "column3".  
**When** I click a "row fields" textarea and type "row1".  
**When** I click the "+Add row" button and see a new textarea, then type "row2".  
**Then** I should see a "Preview" table as below.  

|      | column1 | column2 | column3 |
| -----|-------- | ------- | ------- |
| row1 |         |         |         |
| row2 |         |         |         |

#### Scenario Three ####
**Given** I'm on the edit page and open the "configure table tag" and have multiple columns fields and row fields as scenario two.  
**When** I select the "column3" field and click the "move down" button twice.  
**When** I select the "column1" field and click the "delete column" button.  
**When** I select the "row2" field and click the "move up" button.  
**When** I select the "row2" field and click the "move up" button.  
**Then** I should see a "Preview" table as below.  

|      | column3 | column2 |
| -----|-------- | ------- |
| row2 |         |         |
| row1 |         |         |

#### Scenario Four ####
**Given** I'm on the edit page and open the "configure table tag" and have multiple columns fields and row fields.  
**When** I click the "save" button.  
**Then** I should see a new tag with the "click to assign labels" button. And a new object field was added into the fields.json file.  

## Assign labels to a table tag

#### Scenario Seven ####
**Given** I'm on the edit page and have a table tag.  
**When** I click the "click to assign labels" button.  
**Then** I should see a label table.  

#### Scenario Eight ####
**Given** I'm on the edit page and opened a label table.  
**When** I click a bounding box and click a cell in the label table.  
**Then** I should see the text in the bounding box written into the cell. And the bounding box is rounded with the tag color. And the label is added to the labels.json file.  

#### Scenario Nine ####
**Given** I'm on the edit page and have multiple labels in the label table.  
**When** I click "Reconfigure table" and delete a field.  
**Then** I should see the field and related label have been removed.  
 
#### Scenario Ten ####
**Given** I'm on the edit page and assigned a bounding box into a cell of the label table.  
**When** I click the bounding box and click a different cell.  
**Then** I should see the text in the origin cell is removed and added into the new assigned cell.  

#### Scenario Eleven ####
**Given** I'm on the edit page and opened a "row dynamic" label table.  
**When** I click a bounding box and click a cell in the label table.  
**Then** I should see the text in the bounding box written into the cell. And the bounding box is rounded with the tag color. And the label is added to the labels.json file.  

## Dynamic sized table

#### Scenario Twelve ####
**Given** I'm on the edit page and opened the "configure table tag".  
**When** I switch to the "row dynamic" type and add multiple fields.  
**Then** I should see the fields displayed on the preview table in the position from row 0 and column 0..n in order.  

#### Scenario Thirteen ####
**Given** I created a row dynamic label table and clicked "click to assign labels".  
**When** I clicked "+Add row" button.  
**Then** I should see the row grow.  

--------------
## <h2 id="region-label">support region labeling</h2>

> ### Feature description ###
- Add a draw region button to the canvas command bar on the editor page  

> ### Use Case ###

**As** a user  
**I want** draw regions to label on the editor page  
**So** I can label regions that are not recognized by OCR  

> ### Acceptance criteria ###

#### Scenario One ####
**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I hover the pointer over the current document image  
**Then** I should see the cursor change to a crosshair  

#### Scenario Two ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click the layer button on the canvas command bar  
**Then** I should see the drawn regions layer disabled in the canvas command bar  

#### Scenario Three ####

**Given** I'm on the editor page  
**When**  I click the layer button on the canvas command bar  
**Then** I should see the drawn regions layer enabled in the canvas command bar  

#### Scenario Four ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click and drag on the document image  
**Then** I should see a region being drawn  

#### Scenario Five ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click and drag outside of the document image  
**Then** I should see the document panned  

#### Scenario Six ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click and drag on the document image to the outside of the document image  
**Then** I should see a region being drawn and then canceled  

#### Scenario Seven ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I finish drawing a region  
**Then** I should see a drawn region that is selected  

#### Scenario Eight ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click on the draw region button again  
**Then** I should see the cursor return to a pointer while hovering the document image  

#### Scenario Nine ####

**Given** I've drawn regions  
**When**  I hover a region's vertex  
**Then** I should see a move icon appear on the vertex and the cursor change to grab  

#### Scenario Ten ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, and hold  
**Then** I should see the cursor change to grabbing, and the vertex should move with the cursor  

#### Scenario Eleven ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, hold, and drag outside of the document image  
**Then** I should see the vertex return to it's original position  

#### Scenario Twelve ####

**Given** I've drawn regions  
**When**  I hover a region's vertex, click, hold, drag, and click the Escape or Backspace key  
**Then** I should see the vertex return to it's original position  

#### Scenario Thirteen ####

**Given** I'm on the editor page and click the draw region button on the canvas command bar  
**When**  I click on the document image, hold, drag, and click the Escape or Backspace key  
**Then** I should see the drawing canceled  

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
**When**  I click an empty tag or a tag with only drawn region values already applied or press its hotkey  
**Then** I should see the drawn region applied as a label for the tag  

#### Scenario Seventeen ####

**Given** I've selected drawn regions  
**When**  I click a tag with text or checkbox values or press its hotkey  
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

-----------------------------------------
## <h2 id="sort-trained-models">support adding models to project's recent models from the model compose page<h2> 

> ### Feature description ###
- add a "add to recent models" button in the model information view after double clicking a model  

> ### Use Case ###

**As** a user  
**I want** add a model from the model compose page to myrecent models  
**So** that I can analyze with that model  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I'm on the model compose page  
**When** I double click on any model that has a ready status  
**Then** I should see its model information and a "select to analyze with" button  

#### Scenario Two ####

**Given** I'm on the model compose page and have double-clicked on a model  
**When** I click the "select to analyze with"  button and then go to the analyze page  
**Then** I should see the added model as the current model to analyze with  

#### Scenario Three ####

**Given** I'm on the model compose page and have double-clicked on a model  
**When** I click the "select to analyze with"  button, then go to the analyze page and analyze a document  
**Then** I should see the analysis results using the model added  

#### Scenario Four ####

**Given** I've added multiple models to my projects recent models from the model compose page  
**When** I go the analyze page and click change model  
**Then** I should see up to the 5 most recent models  

------------------------------------------------------------
## <h2 id="composed-name-popup">add composedNames popup for each model</h2>

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

-----------------------------------------------------------
<h2 id="group-selection"> support group selection tool</h2>

> ### Feature description ###

- support tool for selection of multiple words on the editor page

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

------------------------------------------------
<h2 id="sort-models"> Sort project models by clicking the column headers.</h2>

> ### Feature description ###

- Show current project's recent models at the top of model compose page's list of models when landing on the page

> ### Use Case ###

**As** a user  
**I want** to have my project's recent models at the top of the model compose page's list of models   
**So** I click the header of the "Created" column. 

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I have a list of models
**When** I go to the model compose page and toggle "Created" button.  
**Then** I should see models sorted by created time in descending order.  
**When** I toggle "Created" button.  
**Then** I should see models sorted by created time in ascending order.
#### Scenario Two ####

**Given** I have a list of models  
**When** I go to the model compose page and toggle "Last Updated" button.  
**Then** I should see models sorted by last updated time in descending order.  
**When** I toggle "Last Updated" button.  
**Then** I should see models sorted by last updated time in ascending order.

___

<h2 id="model-selection">support model selection for analyzing</h2>

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

**Given**  I've selected a different model  
**When** I run an analysis on a document  
**Then** I should see results for the selected model  

#### Scenario Six ####

**Given** I've trained or composed at least one model  
**When** I train or compose another model, go to the analyze page and click the choose model button  
**Then** I should see the top five most recently change models   

___

<h2 id="project-sharing"> support project sharing via string </h2>

> ### Feature description ###

- Support project sharing between users who have access to the same storage container

> ### Use Case ###

**As** a user  
**I want** to be able to share to a project via shared string  
**So** receiving user don't have to manually copy-paste project info into app settings  

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project.  
**When** I click "Share Project" in Canvas Commandbar. I should see tha message that shared string been saved to my clipboard.  
**Then** I can paste the string from clipboard.  

#### Scenario Two ####

**Given** I've received the string with a project.  
**When** I go to the connection page. Click "New connection" button. Type the same name "Diaplay name" and "SAS URI" with the shared project. Then click the "Save Connection" button.  
**When** I click the "Application Settings" icon button. Click the "Add Security Tokens" button. Type the same "Name" and "Key" with the shared project. Then click the "Save Settings" button.  
**When** I go to the home page of the FOTT and click on "Open Cloud Project" icon, I can paste the string to the input field and click "OK".  
**Then** FOTT should open the shared project as expected.  

___

<h2 id="check-connection-provider"> Fix: check invalid connection provider options before project actions</h2>

> ### Feature description ###
- check connection provider options are valid before creating a project
- check connection provider options are valid before opening a recent project

> ### Use Case ###

**As** a user  
**I want** a notification when I try to open or create a project with invalid provider options  
**So** I know how to fix invalid provider options issue

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've created a connection with invalid provider options (e.g., invalid SAS token for Azure provider).  
**When** I try to create a new project with that connection.  
**Then** a notification will be displayed telling me my connection is invalid.

#### Scenario Two ####

**Given** I've created a connection with invalid provider options (e.g., invalid SAS token for Azure provider).  
**When** I try to open a recent project that now has invalid connection provider options (e.g., the Azure container was deleted)  
**Then** a notification will be displayed telling me my connection is invalid.

___

<h2 id="distributable-releasing"> support distributable releasing</h2>

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
**Then** the FOTT desktop application should install and run as expected.

___

<h2 id="document-management">support document management</h2>

> ### Feature description ###
- Add menu item to canvas command bar for deleting documents

> ### Use Case ###

**As** a user  
**I want** to delete a document and it's files through FOTT  
**So** I don't have to delete the document through a storage provider

#### Scenario One ####

**Given** I've selected a document on the editor page.  
**When** I click the overflow menu item on the canvas command bar and then click "Delete document."  
**Then** FoTT should delete the document in the storage provider, remove it from FOTT's current project, and select the project's first document.

___

<h2 id="electron-for-on-premise-solution"> support Electron for on premise solution</h2>

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
**When** I create a new connection with the local file system as the provider.  
**Then** I should be able to create a project with the created connection.

#### Scenario Four ####

**Given** I've installed new dependencies and started FoTT in Electron. And I have an existing project in my local file system.  
**When** I click "Open local project" on the home page and select the existing project.  
**Then** FoTT should load the project as expected.

___

<h2 id="reorder-tags"> Fix: enable to reorder tags quickly</h2>

> ### Feature description ###

Enable reordering tags quickly

> ### Use Case ###

**As** a user  
**I want** to be able to move throughtags list quickly  
**So** I can reorder long list of tags faster

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents with long tags list.  
**When** I clicking fast on tags buttons 'Move tag up' or 'Move tag down'  
**Then** it moves without visible jittering.

___

<h2 id="rerun-ocr">Enable rerun OCR for current or all documents</h2>

> ### Feature description ###
Adding the following buttons to the canvas command bar:

- "Run OCR on current document"
- "Run OCR on all documents"s

> ### Use Case ###

**As** a user  
**I want** to rerun OCR on documents  
**So** I can update OCR results

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I've opened a project containing documents, and I'm on the Tag Editor page.  
**When** I click "Run Layout on current document" in the canvas command bar  
**Then** I should see "Running Layout..." for the current document. When running OCR finishes, I should be able to view the document's updated OCR JSON file.

#### Scenario Two ####

**Given** I've opened a project containing documents, and I'm on the Tag Editor page.  
**When** I click "Run Layout on all documents" in the canvas command bar  
**Then** I should see "Running Layout..." for all documents. When running OCR finishes for each document, I should be able to view each document's updated OCR JSON file.

___

<h2 id="compose-model">enable compose model and add model name when training a new model</h2>

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

------------
## <h2 id="prebuilt-analyze">Prebuilt analyze</h2>

#### Scenario One ####

**Given** I opened the prebuilts-analyze page.  
**When** I click the "run analysis" button.  
**Then** No reaction.  

#### Scenario Two ####

**Given** I opened the prebuilts-analyze page.  
**When** I click the "Browse for a file..." button. And select a supported file.  
**Then** The text "Browse for a file..." change into the uploaded file name.  

#### Scenario Three ####

**Given** I opened the prebuilts-analyze page. And uploaded a file.  
**When** I type in the "Form recognizer service endpoint" field and "API key" field.  
**When** I type om the "API key" field.  
**When** I click the "Run analysis" button.  
**Then** I can see "analyzing in progress..." then see the analyze result. 

---------
## <h2 id="update-schema-uri">Update schema URI</h2>

#### Scenario One ####

**Given** An existed project.  
**When** I use a new version FOTT with updated "fieldsSchema" URI.  
**Then** The "$schema" field in the "field.json" files is corresponding to the new "fieldsSchema" URI.  

#### Scenario Two ####

**Given** An existed project.  
**When** I use a new version FOTT with updated "labelsSchema" URI.  
**Then** The "$schema" field in the "label.json" files is corresponding to the new "labelsSchema" URI.

#### Scenario Three ####

**Given** A new version FOTT with updated "labelsSchema" URI.  
**When** I create a new project and add a few labels.  
**Then** I should see "$schema" field in the "label.json" files corresponding to the updated "labelsSchema" URI.  

#### Scenario Four ####

**Given** A new version FOTT with updated "fieldsSchema" URI.  
**When** I create a new project.  
**Then** I should see the "$schema" field in the "fields.json" file corresponding to the new "fieldsSchema" URI.  

-------

<h2 id="table-items">Table "Items" field.</h2>

> ### Feature description ###
- Add a table display result to the invoice type "Items" field.

> ### Acceptance criteria ###

#### Scenario One ####

**Given** I am on the "prebuilt analyze" page, uploaded an invoice type file with "Items" field.  
**When** I clicked the "Run analysis" button.  
**Then** I should see an "Items" field with "Click to view analyzed table"  

#### Scenario Two ####

**Given** I am on the "prebuilt analyze" page, analyzed an invoice type file with "Items" field.  
**When** I clicked the "Click to view analyzed table."  
**Then** I should see a modal table pop up with the content of the "Items"  

#### Scenario Three ####

**Given** I am on the "prebuilt analyze" page, analyzed an invoice type file with "Items" field, and open the table modal.  
**When** I hover to a cell of the modal table.  
**Then** I should see a tooltip with "confidence" of the cell.   

-------

<h2 id="update-tag-color">Update Tag Color</h2>

> ### Feature description ###
- Update undefined tag color to a supported tag color.

#### Scenario One: Shared by open a new project ####

**Given** I have blob storage with a field.json file that has more than 248 fields.  
**When**  I open a new project with the "v2.1-Preview.3" version.  
**Then**  I can see n-248 gray tags at the end of the tags field.  
**When**  I open a new project with the current testing version.  
**Then**  I can see n-248 tags at the end of the tags field with different colors.  

#### Scenario Two: Shared by open cloud project ####

**Given** I have blob storage with a field.json file that has more than 248 fields.  
**When**  I open a new project with the "v2.1-Preview.3" version.  
**Then**  I can see n-248 gray tags at the end of the tags field.  
**When**  I copy the shared token from the current project.  
**When**  I open a new website with the current testing version.  
**When**  I create a new connection with the same "Display name" and "SAS URI". 
**When**  I click "Open Cloud Project", paste the shared project token, then click the "Open" button.
**Then**  I can see n-248 tags at the end of the tags field with different colors.  


-------

<h2 id="compose-api-request">Compose API request</h2>

> ### Feature description ###
- Update compose api.
  
**Given** I open the prebuilt analyze page.  
**When**  I click the "Browse for a file..." then selecte a supported file.  
**When**  I change the composed API value to "/formrecognizer/v2.1/prebuilt/invoice/analyze?".  
**When**  I open a browser inspector, then click the "Run analysis" button.  
**Then**  I can see the request URI in the browser inspector is equal to "/formrecognizer/v2.1/prebuilt/invoice/analyze?".  
**When**  I click the "Page range" checkbox, then type in "1".  
**Then**  I can see the composed API request is equal to "/formrecognizer/v2.1/prebuilt/invoice/analyze?pages=1".  
**When**  I click the "Form Type" list and selected "Business card".     
**When**  I click the "Locale" list and selected "en-CA".  
**When**  I click the "Run analysis" button.  
**Then**   I can see the request URI in the browser inspector is equal to "/formrecognizer/v2.1/prebuilt/businessCard/analyze?pages=1&locale=en-CA".  

------------
## <h2 id="layout-analyze">Layout analyze</h2>

#### Scenario One ####

**Given** I opened the layout-analyze page.
**When** I click the "Run Layout" button.
**Then** No reaction.

#### Scenario Two ####

**Given** I opened the layout-analyze page.
**When** I click the "Browse for a file..." button and select a supported file.
**Then** The text "Browse for a file..." change into the uploaded file name.

#### Scenario Three ####

**Given** I opened the layout-analyze page and uploaded a file.
**When** I type in the "Form recognizer service endpoint" field and "API key" fields.
**When** I click the "Run analysis" button.
**Then** I can see "analyzing in progress..." then see the analyze result.

#### Scenario Four ####

**Given** I saw the analyze result on the layout-analyza page.
**When** I click the "Table" icon on the UI.
**Then** I can see a table visulization popped up on the UI, when table styles, 1) merged cells, 2) collumn or row headers.

---------

