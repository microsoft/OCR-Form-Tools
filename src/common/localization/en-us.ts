// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IAppStrings } from "../strings";

/*eslint-disable no-template-curly-in-string, no-multi-str*/

/**
 * App Strings for English language
 */
export const english: IAppStrings = {
    appName: "Form OCR Testing Tool",
    common: {
        displayName: "Display name",
        description: "Description",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        provider: "Provider",
        homePage: "Home Page",
        reload: "Reload",
        skipToMainContent: "Skip to main content",
        skipToSidebar: "Skip to sidebar",
    },
    projectService: {
        existingLabelFiles: "existing label files",
    },
    titleBar: {
        help: "Help",
        minimize: "Minimize",
        maximize: "Maximize",
        restore: "Restore",
        close: "Close",
    },
    homePage: {
        title: "Home",
        newProject: "New Project",
        openLocalProject: {
            title: "Open Local Project",
            description: "Open Local Project",
        },
        openCloudProject: {
            title: "Open Cloud Project",
            selectConnection: "Open cloud project",
            pasteSharedUri: "Paste shared project token here",
        },
        recentProjects: "Recent Projects",
        deleteProject: {
            title: "Delete Project",
            confirmation: "Are you sure you want to delete project",
        },
        importProject: {
            title: "Import Project",
            confirmation: "Are you sure you want to convert project ${project.file.name} project settings " +
                "to v2 format? We recommend you backup the project file first.",
        },
        messages: {
            deleteSuccess: "Successfully deleted ${project.name}",
        },
        homeProjectView: {
            title: "Use Custom to train a model with labels and get key value pairs"
        },
        prebuiltPredict: {
            title: "Use prebuilt model to get data",
            description: "Start with a pre-built model to extract data from your forms – Invoices, Receipts, Business cards and more. Submit your data and get results right away."
        },
        layoutPredict: {
            title: "Use Layout to get text, tables and selection marks",
            description: "Try out the Form Recognizer Layout service to extract text, tables, selection marks and the structure of your document."
        },
        trainWithLabels: {
            title: "Use Custom to train a model with labels and get key value pairs",
            description: "You provide your own training data and do the learning. The model you create can train to your industry-specific forms."
        },
        quickStartGuide: "Quick start guide",
    },
    appSettings: {
        title: "Application Settings",
        storageTitle: "Storage Settings",
        uiHelp: "Where your settings are stored",
        save: "Save Settings",
        securityToken: {
            name: {
                title: "Name",
            },
            key: {
                title: "Key",
            },
            duplicateNameErrorMessage: "Token name must be unique for all tokens",
        },
        securityTokens: {
            title: "Security Tokens",
            description: "Security tokens are used to encrypt sensitive data within your project configuration",
        },
        version: {
            description: "Version:",
        },
        commit: "Commit SHA",
        devTools: {
            description: "Open application developer tools to help diagnose issues",
            button: "Toggle Developer Tools",
        },
        reload: {
            description: "Reload the app discarding all current changes",
            button: "Refresh Application",
        },
        messages: {
            saveSuccess: "Successfully saved application settings",
        },
    },
    projectSettings: {
        title: "Project Settings",
        securityToken: {
            title: "Security token",
            description: "Used to encrypt sensitive data within project files",
        },
        save: "Save Project",
        sourceConnection: {
            title: "Source connection",
            description: "Where to load assets from",
        },
        targetConnection: {
            title: "Target Connection",
            description: "Where to save the project and exported data",
        },
        videoSettings: {
            title: "Video Settings",
            description: "The rate at which frames are extracted for tagging.",
            frameExtractionRate: "Frame Extraction Rate (frames per a video second)",
        },
        addConnection: "Add Connection",
        messages: {
            saveSuccess: "Successfully saved ${project.name} project settings",
            projectExisted: "A project with name ${project.name} already exists, please use another name.",
        },
    },
    train: {
        modelNameTitle: "Model name",
        labelFolderTitle: "Source",
        defaultLabelFolderURL: "/shared",
        title: "Train",
        training: "Training",
        pleaseWait: "Please wait",
        notTrainedYet: "Not trained yet",
        backEndNotAvailable: "Checkbox feature will work in future version of Form Recognizer service, please stay tuned.",
        addName: "Add a model name...",
        downloadJson: "Download JSON file",
        trainConfirm: {
            title: "Labels not revised yet",
            message: "There are newly auto-labeled files not yet revised by you, do you want to train with those files?"
        },
        errors: {
            electron: {
                cantAccessFiles: "Cannot access files in '${folderUri}' for training. Please check if specified folder URI is correct."
            }
        }

    },
    modelCompose: {
        title: "Model compose",
        columnAria: {
            icon: "Model with icon is a new composed model",
        },
        loading: "Loading models...",
        composing: "Model is composing, please wait...",
        limitQuantityComposedModel:"Form Recognizer free resource supports up to 5 models in a composed model. Please upgrade to a paid resource",
        column: {
            icon: {
                name: "Composed Icon",
            },
            id: {
                headerName: "Model Id",
                fieldName: "modelId",
            },
            name: {
                headerName: "Model Name",
                fieldName: "modelName",
            },
            status: {
                headerName: "Status",
                fieldName: "status",
            },
            created: {
                headerName: "Created",
                fieldName: "created",
            },
            lastUpdated: {
                headerName: "Last Updated",
                fieldName: "lastUpdated",
            },
        },
        modelView: {
            titleAria: "Compose Model View",
            addComposeModelName: "Add compose model name...",
            NotEnoughModels: " Should have at least more than one selected model to compose a new model",
            modelsCannotBeIncluded: "Warning: These models will not be included in composed model!",
            modelCannotBeIncluded: "Warning: This model will not be included in composed model!",
            addModelToRecentModels: "Model [${modelID}] added to recent models",
            recentModelsAlreadyContainsModel: "Recent models already contains model [${modelID}]",
            loadingDetails: "Loading model details..."
        },
        commandBar: {
            ariaLabel: "Please use command bar to compose models",
            composeAria: "Compose Model",
            refreshAria: "Refresh the list",
            filter: "Filter by name...",
            filterAria: "Filter by name input area",
        },
        modelsList: {
            headerAria: "List of models header",
            checkButtonAria: "Select model check button",
            checkAllButtonAria: "Select all models check button",

        },
        errors: {
            failedCompose: "Something went wrong composed model was not created!",
            noInfoAboutModel: "ℹ️ Original model not found. No information available.",
        }
    },
    predict: {
        title: "Analyze",
        uploadFile: "Choose an image to analyze with",
        inProgress: "Analysis in progress...",
        noRecentModels: "This project doesn't have any recent models. Please train or compose a new model to analyze with.",
        selectModelHeader: "Model to analyze with",
        modelIDPrefix: "Model ID: ",
        modelNamePrefix: "Model name: ",
        downloadScript: "Analyze with python script",
        defaultLocalFileInput: "Browse for a file...",
        defaultURLInput: "Paste or type URL...",
        editAndUploadToTrainingSet: "Edit & upload to training set",
        editAndUploadToTrainingSetNotify: "by clicking on this button, this form will be added to this project, where you can edit these labels.",
        editAndUploadToTrainingSetNotify2: "We are adding this file to your training set, where you can edit the labels and re-train the model.",
        uploadInPrgoress: "Upload in progress...",
        analysis: "Analysis",
        runAnalysis: "Run analysis",
        confirmDuplicatedAssetName: {
            title: "Asset name exists",
            message: "Asset with name '${name}' exists in project, override?"
        }
    },
    pageRange: {
        title: "Page range:",
        tooltip: "Specify page number or range of page numbers to process, e.g: 1, 5, 7, 9-10"
    },
    prebuiltPredict: {
        title: "Prebuilt analyze",
        defaultLocalFileInput: "Browse for a file...",
        defaultURLInput: "Paste or type URL...",
        uploadFile: "Choose an image to analyze with",
        inProgress: "Analysis in progress...",
        anlayWithPrebuiltModels: "Analyze ${name}",
        locale: "Locale",
        formTypeTitle: "Form Type",
        selectFileAndRunAnalysis: "Upload file and run analysis",
        analysis: "Analysis",
        runAnalysis: "Run analysis",
        noFieldCanBeExtracted: "No field can be extracted.",
        pdfPageNumberLimit: 'Free Tier Form Recognizer resource processes only first 2 pages from PDF'
    },
    prebuiltSetting: {
        serviceConfigurationTitle: "Service configuration",
        serviceEndpointTitle: "Form recognizer service endpoint",
        apiKeyTitle: "API key",
        endpointTooltip: "e.g: https://xxx.cognitiveservices.azure.com/",
        endpointPlaceholder: "need endpoint",
        apiKeyTooltip: "get key info from Azure Subscription Resource Keys & Endpoint page",
        apiKeyPlaceholder: "need apikey",
    },
    documentFilePicker: {
        source: "Source",
        localFile: "Local file",
        url: "URL",
    },
    layoutPredict: {
        layout: "Layout",
        title: "Layout analyze",
        inProgress: "Analysis in progress...",
        selectFileAndRunLayout: "Select file and run layout",
        analysis: "Analysis",
        runLayout: "Run Layout",
        download: "Download",
        layoutResults: "Layout results",
    },
    recentModelsView: {
        header: "Select a model to analyze with",
        checkboxAriaLabel: "Select model checkbox",
        addToRecentModels: "Select to analyze with",
    },
    projectMetrics: {
        title: "Project Metrics",
        assetsSectionTitle: "Assets",
        totalAssetCount: "Total Assets",
        visitedAssets: "Visited Assets (${count})",
        taggedAssets: "Tagged Assets (${count})",
        nonTaggedAssets: "Not Tagged Assets (${count})",
        nonVisitedAssets: "Not Visited Assets (${count})",
        tagsSectionTitle: "Tags & Labels",
        totalRegionCount: "Total Tagged Regions",
        totalTagCount: "Total Tags",
        avgTagCountPerAsset: "Average tags per asset",
    },
    tags: {
        title: "Tags",
        placeholder: "Add new tag",
        editor: "Tags Editor",
        modal: {
            name: "Tag Name",
            color: "Tag Color",
        },
        colors: {
            white: "White",
            gray: "Gray",
            red: "Red",
            maroon: "Maroon",
            yellow: "Yellow",
            olive: "Olive",
            lime: "Lime",
            green: "Green",
            aqua: "Aqua",
            teal: "Teal",
            blue: "Blue",
            navy: "Navy",
            fuschia: "Fuschia",
            purple: "Purple",
        },
        warnings: {
            existingName: "Tag name already exists. Choose another name",
            emptyName: "Cannot have an empty tag name",
            unknownTagName: "Unknown",
            notCompatibleTagType: "Tag type is not compatible with this feature. If you want to change type of this tag, please remove or reassign all labels which using this tag in your project.",
            checkboxPerTagLimit: "Cannot assign more than one checkbox per tag",
            notCompatibleWithDrawnRegionTag: "Drawn regions and ${otherCategory} values cannot both be assigned to the same document's tag",
            replaceAllExitingLabels: "Are you sure you want to replace selected tag's labels?",
            replaceAllExitingLabelsTitle: "Replace tag's labels",
        },
        preText: {
            autoLabel: "Auto-labeled: ",
            revised: "Revised: ",
        },
        regionTableTags: {
            configureTag: {
                errors: {
                    atLeastOneColumn: "Please assign at least one column.",
                    atLeastOneRow: "Please assign at least one row.",
                    checkFields: "Please check if you filled out all required fields correctly.",
                    assignTagName: "Tag name cannot be empty",
                    notUniqueTagName: "Tag name should be unique",
                    emptyTagName: "Please assign name for your table tag.",
                    emptyName: "Name cannot be empty",
                    notUniqueName: "Name should be unique",
                    notCompatibleTableColOrRowType: "${kind} type is not compatible with this type. If you want to change type of this ${kind} please remove or assign all labels which using this ${kind} in your project.",
                }
            },
            tableLabeling: {
                title: "Label table",
                tableName: "Table name",
                description: {
                    title: "To start labeling your table:",
                    stepOne: "Select the words on the document you want to label",
                    stepTwo: "Click the table cell you want to label selected words to",
                },
                buttons: {
                    done: "Done",
                    reconfigureTable: "Reconfigure table",
                    addRow: "Add row"
                },
            },
            confirm: {
                reconfigure: {
                    title: "Reconfigure tag",
                    message: "Are you sure you want to reconfigure this tag? \n It will be reconfigured for all documents.",
                }
            }
        },
        toolbar: {
            addTable: "Add new table tag",
            add: "Add new tag",
            onlyShowCurrentPageTags: "Only show tags used in current page",
            showAllTags: "Show all tags",
            showOriginLabels: "Show origin labels",
            hideOriginLabels: "Hide origin labels",
            contextualMenu: "Contextual Menu",
            delete: "Delete tag",
            edit: "Edit tag",
            format: "Select format",
            moveDown: "Move tag down",
            moveUp: "Move tag up",
            lock: "Lock tag",
            rename: "Rename tag",
            search: "Search tags",
            type: "Select type",
            vertiline: "Vertical line",
        },
    },
    connections: {
        title: "Connections",
        details: "Connection Details",
        settings: "Connection Settings",
        instructions: "Please select a connection to edit",
        new: "New Connection",
        save: "Save Connection",
        genericInvalid: "\"${project.sourceConnection.name}\" is an invalid connection. Please check it in the Connections page",
        messages: {
            saveSuccess: "Successfully saved ${connection.name}",
            deleteSuccess: "Successfully deleted ${connection.name}",
            doNotAllowDuplicateNames: "Connection with name \"${connection.name}\" already exists. Please, use another name"
        },
        imageCorsWarning: "Warning: When using VoTT in a Web browser, some assets from Bing Image \
                          Search may not export correctly due to CORS (Cross Origin Resource Sharing) restrictions.",
        blobCorsWarning: "Warning: CORS (Cross Domain Resource Sharing) must be enabled on the Azure Blob Storage \
                          account, in order to use it as a source or target connection. More information on \
                          enabling CORS can be found in the {0}",
        azDocLinkText: "Azure Documentation.",
        providers: {
            azureBlob: {
                title: "Azure blob container",
                description: "",
                accountName: {
                    title: "Account Name",
                    description: "",
                },
                containerName: {
                    title: "Container Name",
                    description: "",
                },
                sas: {
                    title: "SAS URI",
                    description: "Shared access signature URI to the blob container",
                },
                createContainer: {
                    title: "Create Container",
                    description: "Creates the blob container if it does not already exist",
                },
                invalidSASMessage: "Please check if you have unexpired read/write/list/delete permission to blob container/blob.",
            },
            bing: {
                title: "Bing Image Search",
                options: "Bing Image Search Options",
                apiKey: "API Key",
                query: "Query",
                aspectRatio: {
                    title: "Aspect Ratio",
                    all: "All",
                    square: "Square",
                    wide: "Wide",
                    tall: "Tall",
                },
            },
            local: {
                title: "Local file system",
                folderPath: "Folder",
                browse: "Browse",
                selectFolder: "Select folder",
                chooseFolder: "Choose folder",
                invalidFolderMessage: "Connection [${project.sourceConnection.providerOptions.folderPath}] and/or project folder [${project.folderPath}] are invalid. Please check the specified folders in the Connection and Project Settings pages",
            },
        },
    },
    editorPage: {
        title: "Editor",
        width: "Width",
        height: "Height",
        tagged: "Tagged",
        visited: "Visited",
        toolbar: {
            select: "Select (V)",
            pan: "Pan",
            drawRectangle: "Draw Rectangle",
            drawPolygon: "Draw Polygon",
            copyRectangle: "Copy Rectangle",
            copy: "Copy Regions",
            cut: "Cut Regions",
            paste: "Paste Regions",
            removeAllRegions: "Remove All Regions",
            previousAsset: "Previous Asset",
            nextAsset: "Next Asset",
            saveProject: "Save Project",
            exportProject: "Export Project",
            activeLearning: "Active Learning",
        },
        videoPlayer: {
            previousTaggedFrame: {
                tooltip: "Previous Tagged Frame",
            },
            nextTaggedFrame: {
                tooltip: "Next Tagged Frame",
            },
            previousExpectedFrame: {
                tooltip: "Previous Frame",
            },
            nextExpectedFrame: {
                tooltip: "Next Frame",
            },
        },
        asset: {
            delete: {
                title: "Delete document",
                confirmation: "Are you sure you want to delete ",
            }
        },
        help: {
            title: "Toggle Help Menu",
            escape: "Escape Help Menu",
        },
        assetWarning: {
            incorrectFileExtension: {
                attention: "Attention!",
                text: "- extension of this file doesn't correspond MIME type. Please check file:",
                failedToFetch: "Failed to fetch ${fileName} for mime type validation",
            },
        },
        assetError: "Unable to load asset",
        tags: {
            hotKey: {
                apply: "Apply Tag with Hot Key",
                lock: "Lock Tag with Hot Key",
            },
            rename: {
                title: "Rename Tag",
                confirmation: "Are you sure you want to rename this tag? It will be renamed throughout all assets",
            },
            delete: {
                title: "Delete Tag",
                confirmation: "Are you sure you want to delete this tag? It will be deleted throughout all assets \
                and any regions where this is the only tag will also be deleted",
            },
        },
        canvas: {
            removeAllRegions: {
                title: "Remove All Regions",
                confirmation: "Are you sure you want to remove all regions?",
            },
            canvasCommandBar: {
                items: {
                    layers: {
                        text: "Layers",
                        subMenuItems: {
                            text: "Text",
                            tables: "Tables",
                            selectionMarks: "Selection marks",
                            drawnRegions: "Drawn regions",
                            labels: "Labels"
                        },
                    },
                    drawRegion: "Draw region",
                },
                farItems: {
                    rotate: {
                        clockwise: "Rotate image clockwise 90°",
                        counterClockwise: "Rotate image counterclockwise 90°",
                    },
                    zoom: {
                        zoomOut: "Zoom out",
                        zoomIn: "Zoom in",
                    },
                    additionalActions: {
                        text: "Additional actions",
                        subIMenuItems: {
                            runOcrOnCurrentDocument: "Run Layout on current document",
                            runOcrOnAllDocuments: "Run Layout on all documents",
                            runAutoLabelingCurrentDocument: "Auto-label the current document",
                            runAutoLabelingOnMultipleUnlabeledDocuments: "Auto-label multiple unlabeled documents",
                            noPredictModelOnProject: "Predict model not available, please train the model first.",
                            costWarningMessage: "This feature will incur usage to your account for custom analyze",
                        }
                    }
                },
                warings: {
                    drawRegionUnsupportedAPIVersion: "Region labeling is not supported with API ${apiVersion}. It will be supported with the release of v2.1",
                }
            }
        },
        messages: {
            enforceTaggedRegions: {
                title: "Invalid region(s) detected",
                description: "1 or more regions have not been tagged.  Ensure all regions are tagged before \
                    continuing to next asset.",
            },
        },
        warningMessage: {
            PreventLeavingWhileRunningOCR: "An Layout operation is currently in progress, are you sure you want to leave?",
            PreventLeavingRunningAutoLabeling: "Auto-labeling is currently in progress, are you sure you want to leave?",
        }
    },
    profile: {
        settings: "Profile Settings",
    },
    shortcuts: {
        squareBrackets: {
            keys: {
                leftBracket: "[",
                rightBracket: "]",
            },
            description: {
                prevWord: "Select previous word",
                nextWord: "Select next word",
            },
        },
        greaterAndLessThan: {
            keys: {
                lessThan: "<",
                greaterThan: ">",
            },
            description: {
                prevPage: "Go to previous page",
                nextPage: "Go to next page",
            },
        },
        zoomKeys: {
            keys: {
                minus: "-",
                plus: "=",
                slash: "/",
            },
            description: {
                in: "Zoom in",
                out: "Zoom out",
                reset: "Reset zoom",
            },
        },
        deleteAndBackspace: {
            keys: {
                delete: "Delete",
                backSpace: "Backspace",
            },
            description: {
                delete: "Remove selection and delete labels of selected words",
                backSpace: "Remove selection and delete labels of selected words",
            },
        },
        drawnRegions: {
            keys: {
                escape: "Escape",
                alt: "Alt",
                backSpace: "Backspace",
            },
            description: {
                deleteSelectedDrawnRegions: "Delete selected drawn regions",
                cancelDrawOrReshape: "Cancel drawing or reshaping of regions",
            }
        },
        tips: {
            quickLabeling: {
                name: "Label with hot keys",
                description: "Hotkeys 1 through 0 and all letters are assigned to first 36 tags. After selecting one or multiple words, press tag's assigned hotkey.",
            },
            renameTag: {
                name: "Rename tag",
                description: "Hold Alt key and click on tag name.",
            },
            multipleWordSelection: {
                name: "Select multiple words by dragging pointer across words",
                description: "Click and hold on a word. Then, hover over additional words with pointer.",
            },
            deleteAllLabelsForTag: {
                name: "Delete all labels for a tag",
                description: "Select all labels for a tag on document and press 'delete' key"
            },
            groupSelect: {
                name: "Select multiple words by drawing a bounding box around encompassed words",
                description: "Press and hold the shift key. Then, click and hold left mouse button. Then, drag the pointer to draw the bounding box around encompassed words"
            }
        },
        headers: {
            keyboardShortcuts: "Keyboard shortcuts",
            otherTips: "Other tips",
        },
        iconTitle: "Keyboard shortcuts and useful tips"
    },
    errors: {
        unknown: {
            title: "Unknown Error",
            message: "The app encountered an unknown error. Please try again.",
        },
        projectUploadError: {
            title: "Error Uploading File",
            message: `There was an error uploading the file.
                Please verify the file is of the correct format and try again.`,
        },
        genericRenderError: {
            title: "Error Loading Application",
            message: "An error occurred while rendering the application. Please try again",
        },
        projectInvalidSecurityToken: {
            title: "Error loading project file",
            message: `The security token referenced by the project is invalid.
                Verify that the security token for the project has been set correctly within your application settings`,
        },
        projectInvalidJson: {
            title: "Error parsing project file",
            message: "The selected project files does not contain valid JSON. Please check the file any try again.",
        },
        projectDeleteError: {
            title: "Error deleting project",
            message: `An error occured while deleting the project.
                Validate the project file and security token exist and try again`,
        },
        projectDeleteErrorSecurityTokenNotFound: {
            title: "Security token not found when delete project",
            message: "Security Token Not Found. Project [${project.name}] has been removed from FoTT tool."
        },
        projectNotFound: {
            title: "Error loading project",
            message: "We couldn't find the project file ${file} at the target blob container ${container}.\
             The project file might have been removed from the container, \
             or the connection settings associated with this project might have changed to a new container where this project doesn't exist.",
        },
        securityTokenNotFound: {
            title: "Error loading project file",
            message: `The security token referenced by the project cannot be found in your current application settings.
                Verify the security token exists and try to reload the project.`,
        },
        canvasError: {
            title: "Error loading canvas",
            message: "There was an error loading the canvas, check the project's assets and try again.",
        },
        importError: {
            title: "Error importing V1 project",
            message: "There was an error importing the V1 project. Check the project file and try again",
        },
        pasteRegionTooBigError: {
            title: "Error pasting region",
            message: "Region too big for this asset. Try copying another region",
        },
        exportFormatNotFound: {
            title: "Error exporting project",
            message: "Project is missing export format.  Please select an export format in the export setting page.",
        },
        activeLearningPredictionError: {
            title: "Active Learning Error",
            message: "An error occurred while predicting regions in the current asset. \
                Please verify your active learning configuration and try again",
        },
        blobContainerIONotFound: {
            title: "Cannot find blob container/blob",
            message: "Check if blob container/blob exists in storage account.",
        },
        blobContainerIOForbidden: {
            title: "Cannot access blob container/blob",
            message: "Check if you have unexpired read/write/list/delete permission to blob container/blob.",
        },
        projectDeleteForbidden: {
            title: "Error deleting project",
            message: "Cannot remove ${file} from your Azure storage blob container due to missing delete permission in SAS URI.",
        },
        projectDeleteNotFound: {
            title: "Error deleting project",
            message: "Cannot find ${file} in your Azure storage blob container. Please check if it's already removed.",
        },
        predictWithoutTrainForbidden: {
            title: "Prediction Error",
            message: "We couldn't find a trained model. Please go to the \"Train\" tab and ensure a model is trained.",
        },
        missingRequiredFieldInLabelFile: {
            title: "Error loading label file",
            message: "Label visualization disabled. Please ensure that both 'document' and 'labels' fields exist and are not empty in label file ${labelFileName}.",
        },
        noLabelInLabelFile: {
            title: "Error loading label file",
            message: "Label visualization disabled. There are no labels in label file ${labelFileName}. This label file cannot be used for training. Consider adding labels for this document.",
        },
        duplicateFieldKeyInLabelsFile: {
            title: "Error loading label file",
            message: "Label visualization disabled. There are duplicate label names in ${labelFileName}. Please correct your label file in Azure storage and ensure all names are unique when trimmed and converted to lower case.",
        },
        invalidJSONFormat: {
            title: "Error loading label file",
            message: "Label visualization disabled. Invalid JSON format in ${labelFileName}. Please correct your label file in Azure storage.",
        },
        sameLabelInDifferentPageError: {
            title: "Error loading label file",
            message: "Label visualization disabled. There are cross-page regions with the same tag ${tagName}. Please correct your label file in Azure storage.",
        },
        duplicateBoxInLabelFile: {
            title: "Error loading label file",
            message: "Label visualization disabled. There are duplicate bounding boxes on page ${page}. Please correct your label file in Azure storage.",
        },
        endpointConnectionError: {
            title: "Error connecting to endpoint",
            message: "Cannot connect to ${endpoint}. Please make sure the network connection is good and specified endpoint is correct.",
        },
        tooManyRequests: {
            title: "Too many requests",
            message: "We've got too many requests in a short period of time. Please try again later.",
        },
        modelCountLimitExceeded: {
            title: "Too many models",
            message: "The number of models associated with the given API key has exceeded the maximum allowed value.",
        },
        requestSendError: {
            title: "Request send error",
            message: "Failed to send request to Azure Blob Container. Common issues: \n • SAS URI not valid \n • Cross-Origin Resource Sharing (CORS) is not configured server-side \n • Network error",

        },
        modelNotFound: {
            title: "Model not found",
            message: "Model \"${modelID}\" not found. Please use another model.",
        },
        connectionNotExistError: {
            title: "Connection doesn't exist",
            message: "Connection doesn't exist."
        },
        getOcrError: {
            title: "Cannot load OCR file",
            message: "Failed to load from OCR file. Please check your connection or network settings.",
        }
    },
    shareProject: {
        name: "Share Project",
        errors: {
            cannotDecodeString: "Cannot decode shared token. Check if shared token has been modified.",
            connectionNotFound: "Connection not found. Add shared project's connection to your connections.",
            connectionRequirement: "Shared project's connection must be added before opening it",
            tokenNameExist: "Warning! You already have token with same name as in shared project. Please create a new token, and update the existing project which uses ''${sharedTokenName}'' with new token name."
        },
        copy: {
            success: "Project token copied to clipboard and ready to share. Receiver of project token can click 'Open Cloud Project' from the Home page to use shared token.",
        }
    },
    appSurveyText: "Help us improve Form Recognizer. Take our survey!"
};

/*eslint-enable no-template-curly-in-string, no-multi-str*/
