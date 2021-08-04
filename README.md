
# Form OCR Testing Tool

Help us improve Form Recognizer. [Take our survey!](https://aka.ms/FR-HaTS-Survey)

## Features Preview

[![Build Status](https://dev.azure.com/msazure/Cognitive%20Services/_apis/build/status/microsoft.OCR-Form-Tools?branchName=master)](https://dev.azure.com/msazure/Cognitive%20Services/_build/latest?definitionId=118293&branchName=master)

An open source labeling tool for [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/), part of the Form OCR Test Toolset (FOTT).

This is a `MAIN` branch of the Tool. It contains all the newest features available. This is **NOT** the most stable version since this is a preview.

The purpose of this repo is to allow customers to test the latest tools available when working with Microsoft Forms and OCR services.  Currently, Labeling tool is the first tool we present here.  Users could provide feedback, and make customer-specific changes to meet their unique needs.  Microsoft Azure Form Recognizer team will update the source code periodically.  If you would like to contribute, please check the contributing section.

**If you want to checkout our latest GA  version of the tool, please follow this [link](https://github.com/microsoft/OCR-Form-Tools/tree/v2.0-General-Availability-Release).**
___

FOTT's Labeling Tool is a React + Redux Web application, written in [TypeScript](https://github.com/Microsoft/TypeScript). This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Current Features of Labeling Tool: (you can view a short demo [here](https://youtu.be/GRGs18lZJ1E?t=462))

* **Label** forms in PDF, JPEG or TIFF formats.
* **Train** model with labeled data through [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/)
* **Predict/Analyze** a single form with the trained model, to extract key-value predictions/analyses for the form.

## Getting Started

### Build and run from source

Form Labeling Tool requires [NodeJS (>= 10.x, Dubnium) and NPM](https://github.com/nodejs/Release)

   ```bash
    git clone https://github.com/Microsoft/OCR-Form-Tools.git
    cd OCR-Form-Tools
    yarn install
    yarn build
    yarn start
   ```

### Set up this tool with Docker

Please see instructions [here](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/quickstarts/label-tool#set-up-the-sample-labeling-tool), and view our docker hub repository [here](https://hub.docker.com/_/microsoft-azure-cognitive-services-custom-form-labeltool?tab=description) for the latest container image info.
- `latest` docker image tags track the general availability releases of FOTT.
- `latest-preview`, docker image tags track the preview releases of FOTT.
- `latest-preview-private`, docker image tags track the private preview releases of FOTT.

### Run as web application

Using a modern Web browser, FOTT can be run directly at: 
- https://fott-2-1.azurewebsites.net/

**Note: these web app are for testing purpose only. HTTPS is required, unless it's for localhost.**

### Run as desktop application

FOTT can be run as a desktop application after initial set up.

   ```bash
    yarn electron-start
   ```

The desktop application has additional features, such as:
- Support for local file system as provider storage
- Support for cross-domain resource requests

### Release as desktop application

FOTT can be released as a distributable desktop application.

   ```bash
    yarn release
   ```
The distributable will saved in the releases folder of the cloned repository.



## Using labeling tool

### Set up input data

To go thru a complete label-train-analyze scenario, you need a set of at least six forms of the same type. You will label five forms to train a model and one form to test the model.  You could upload the [sample files](https://go.microsoft.com/fwlink/?linkid=2090451) to the root of a blob storage container in an Azure Storage account. You can use [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/) to upload data.   For advanced scenarios where there are forms in quite different formats, you could organize them into subfolders based on similar format. When you set up your project to train a model from one format, you need to specify a subfolder in the project setting page.

#### Configure cross-domain resource sharing (CORS)

Enable CORS on your storage account. Select your storage account in the Azure portal and click the **CORS** tab on the left pane. On the bottom line, fill in the following values. Then click **Save** at the top.

* Allowed origins = *
* Allowed methods = [select all]
* Allowed headers = *
* Exposed headers = *
* Max age = 200

![alt text](docs/images/cors-setup.png "CORS setup")

### Create Connections

Form OCR Testing Tool is a 'Bring Your Own data' (BYOD) application. In this tool, connections are used to configure and manage source (the assets to label) and target (the location where labels should be exported). The source and target are the same location in Form OCR Testing Tool. Eventually, they together will be inputs to [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/).
Connections can be set up and shared across projects. They use an extensible provider model, so new source/target providers can easily be added.

Currently, both this labeling tool and [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/) only support [Azure blob storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

To create a new connection, click the `New Connections` (plug) icon, in the left hand navigation bar.

Fill in the fields with the following values:

* **Display Name** - The connection display name.
* **Description** - Your project description.
* **SAS URL** - The shared access signature (SAS) URL of your Azure blob storage container. To retrieve the SAS URL, open the Microsoft Azure Storage Explorer, right-click your container (note: not the parent storage node, not the URL in your Azure portal), and select Get shared access signature. Set the expiry time to some time after you'll have used the service. Make sure the Read, Write, Delete, and List permissions are checked, and click Create. Then copy the value in the URL section. It should have such format: https://&lt;storage account&gt;.blob.core.windows.net/&lt;container name&gt;?&lt;SAS value&gt;.

![alt text](docs/images/new-connection.png "New Connection")

![alt_text](docs/images/get-sas.PNG "Get SAS URL")

### Create a new project

In this labeling tool, a project is used to store your configurations and settings. Create a new project and fill in the fields with the following values:

* **Display Name** - the project display name
* **Security Token** - Some project settings can include sensitive values, such as API keys or other shared secrets. Each project will generate a security token that can be used to encrypt/decrypt sensitive project settings. You can find security tokens in the Application Settings by clicking the gear icon in the lower corner of the left navigation bar.
* **Source Connection** - The Azure blob storage container connection you created in the previous step that you would like to use for this project.
* **Folder Path** - Optional - If your source forms are located in a sub-folder on the blob container, specify the folder name here
* **Form Recognizer Service Uri** - Your Form Recognizer endpoint URL.  It should have such format: https://&lt;your-name&gt;.cognitiveservcices.azure.com.
* **API Key** - Your Form Recognizer subscription key.
* **Description** - Optional - Project description

![alt text](docs/images/new-project.png "New Project")

### Label your forms

When you create or open a project, the main tag editor window opens. The tag editor consists of three parts:

* A preview pane that contains a scrollable list of forms from the source connection.
* The main editor pane that allows you to label text by applying tags.
* The tags editor pane that allows users to modify, reorder, and delete tags.

#### Identify text elements and tables

Click **Run OCR on all files** on the left pane to get the text layout information for each document. The labeling tool will draw bounding boxes around each text element and display an icon at the top left corner of each table. You can click a table's icon to display that table's identified borders

#### Apply labels to text

Next, you'll create labels and apply them to the text elements that you want the model to recognize.  There are many key-value pairs in a document you would like to train a model to extract,  the first step is to label the value of the key-value pair.  For example, you see text `Charge: 1002.00` in a form, and you would like to label the value (1002.00),  so that AI model could be trained to extract such information on similar forms.

1. First, use the tags editor pane to create the tags (labels) you'd like to identify, e.g, "Cost".

2. In the main editor, click and drag to select one or multiple words from the highlighted text elements. e.g., "1002.00". Note: You cannot currently select text that spans across multiple pages.

3. Click on the tag you want to apply, or press corresponding keyboard key (e.g., key '1' for the first tag). You can only apply one tag to each selected text element, and each tag can only be applied once per page.

Follow the above steps to label five of your forms, and then move on to the next step.

![alt text](docs/images/apply-labels.png "Apply Labels")

#### Specify tag type and format

You can specify tag type and format with tag contextual menu. The type and format information will be stored in fields.json in the source location. The information will be used in post-processing to get better result.

![alt text](docs/images/specify-tag-type-format.png "Specify Tag Type and Format")

#### Train a custom model

Click the Train icon on the left pane to open the Training page. Then click the **Train** button to begin training the model. Once the training process completes, you'll see the following information:

* **Model ID** - The ID of the model that was created and trained. Each training call creates a new model with its own ID. Copy this string to a secure location; you'll need it if you want to do prediction/analysis calls through the REST API.
* **Average Accuracy** - The model's average accuracy. You can improve model accuracy by labeling additional forms and training again to create a new model. We recommend starting by labeling five forms and adding more forms as needed.
* The list of tags, and the estimated accuracy per tag.

![alt text](docs/images/train-model.png "Train Model")

After training finishes, examine the **Average Accuracy** value. If it's low, you should add more input documents and repeat the steps above. The documents you've already labeled will remain in the project index.

Tip: You can also run the training process with a REST API call. To learn how to do this, see [Train with labels using Python](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/quickstarts/python-labeled-data).

#### Analyze a form ####

Click on the Analyze icon on the left pane to open the Analyze page. Upload a form document that you haven't used in the training process. Then click the **Analyze** button on the right to get key-value predictions/analyses for the form. The tool will highlight fields and its bounding boxes and will report the confidence of each value.

![alt text](docs/images/analyze-form.png "Analyze Form")

Tip: You can also run the Analyze API with a REST call. To learn how to do this, see [Train with labels using Python](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/quickstarts/python-labeled-data).

#### Compose a model ####
Click the Compose icon on the left pane to open the Compose page. FoTT will display the first page of your models—by decending order of Model ID—in a list. Select multiple models you want to compose into one model and click the **Compose** button. Once the new model has been composed, it's ready to analyze with.

![alt text](docs/images/compose.png "Compose")

To load more of your models, click the **Load next page** button at the bottom of the list. This will load the next page of your models by decending order of model ID.

You can sort the currently loaded models by clicking the column headers at the top of the list. Only the currently loaded models will be sorted. You will need to load all pages of your models first and then sort to view the complete sorted list of your models.  

#### Save a project and resume later ####

To resume your project at another time or in another browser, you need to save your project's security token and reenter it later.

##### Get project credentials #####

Go to your project settings page (document setting icon) and take note of the security token name. Then go to your application settings (gear icon), which shows all of the security tokens in your current browser instance. Find your project's security token and copy its name and key value to a secure location.

##### Restore project credentials #####

When you want to resume your project, you first need to create a connection to the same blob storage container. Repeat the steps above to do this. Then, go to the application settings page (gear icon) and see if your project's security token is there. If it isn't, add a new security token and copy over your token name and key from the previous step. Then click Save Settings.

##### Resume a project #####

Finally, go to the main page (house icon) and click Open Cloud Project. Then select the blob storage connection, and select your project's .proj file. The application will load all of the project's settings because it has the security token.

##### Share a project

FoTT allow sharing of projects with somebody who use the tool too and share access to same Azure Blob Storage container where a project is located.
In order to share project follow these steps:

###### On the sending side:

1. Open the project you want to share in the tool. In the right top corner find and click "share" icon ![alt text](docs/images/share-icon.png "Share project menu icon").
You should see a message pop-up saying that your share string been saved in your clipboard.
2. Share the string in you clipboard via any convenient way for you.

###### On the receiving side:

1. Go to the "Home Page", and click on "Open Cloud Project".
2. Insert shared string to appropriate field in the pop-up.
3. Click okay.

#### Keyboard Shortcuts and useful tips ####

Labeling tool allows a number of keyboard shortcuts to support accessibility and also sometimes make labeling easier and faster. You can view them by clicking the following icon on the right side of the title bar:\
![alt text](docs/images/keyboard-shortcuts-icon.png "Keyboard shortcuts menu icon")

Hotkeys of 1 through 0 and all letters are assigned to first 36 tags, after you selected one or multiple words from the highlighted text elements, by pressing these hotkeys, you can label the selected words.

'[' and ']' keys can be used move the selection to the previous or the next word.

'<' and '>' keys can be used go to the previous or the next page in multi-pages documents.

'-', '+' and '/' keys can be used to zoom in/out and reset zoom of editing page.

Hold Alt key and click on tag name, user can change the tag's name.

To delete all labels for a tag - select all labels for a tag on document then press 'delete' key.

## Collaborators

This project is cloned and modified from [VoTT](https://github.com/microsoft/VoTT) project.

## Contributing

There are many ways to contribute to Form OCR Testing Tool -- please review our [contribution guidelines](CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.

* [简体中文](README.zh-cn.md)
* [日本語](README.ja-jp.md)
