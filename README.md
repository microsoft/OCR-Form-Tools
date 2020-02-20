# OCR Form Labeling Tool

[![Build Status](https://dev.azure.com/msazure/Cognitive%20Services/_apis/build/status/microsoft.OCR-Form-Tools?branchName=master)](https://dev.azure.com/msazure/Cognitive%20Services/_build/latest?definitionId=118293&branchName=master)

An open source labeling tool for [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/)

The purpose of this repo is to allow customers to better understand our labeling tool,  provide feedback, and make customer-specific changes to meet their unique needs.  Microsoft Azure Form Recognizer team will update the source code periodically.  If you would like to contribute, please check the contributing section.

OCR Form Labeling Tool is a React + Redux Web application, write in [TypeScript](https://github.com/Microsoft/TypeScript). This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Features include:

* The ability to label forms in PDF, JPEG or TIFF formats
* Train model with labeled data through [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/)
* Predict a single form with the trained model

## Getting Started

### Build and run from source

Form Labeling Tool requires [NodeJS (>= 10.x, Dubnium) and NPM](https://github.com/nodejs/Release)

   ```bash
    git clone https://github.com/Microsoft/OCR-Form-Tools.git
    cd OCR-Form-Tools
    npm run build
    npm run react-start
   ```
## Using VoTT

OCR Form Labeling Tool is a 'Bring Your Own data' (BYOD) application. In this tool, connections are used to configure and manage source (the assets to label) and target (the location to which labels should be exported). The source and target are the same location in OCR Form Labeling Tool. Eventually, they together will be inputs to [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/).
Connections can be set up and shared across projects. They use an extensible provider model, so new source/target providers can easily be added.

Currently, both this labeling tool and [Form Recognizer](https://docs.microsoft.com/en-us/azure/cognitive-services/form-recognizer/) only support [Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

To create a new connection, click the `New Connections` (plug) icon, in the left hand navigation bar:

## Collaborators

This project is cloned and modified from [VoTT](https://github.com/microsoft/VoTT) project.

## Contributing

There are many ways to contribute to OCR Form Labeling Tool -- please review our [contribution guidelines](CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.
