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
        },
        openCloudProject: {
            title: "Open Cloud Project",
            selectConnection: "Select a Connection",
            pasteSharedUri: "Please paste shared project string here",
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
        labelFolderTitle: "Label folder URI",
        defaultLabelFolderURL: "https://example.com/folder",
        title: "Train",
        training: "Training",
        pleaseWait: "Please wait",
        notTrainedYet: "Not trained yet",
        backEndNotAvailable: "Checkbox feature will work in future version of Form Recognizer service, please stay tuned.",
        addName: "Add a model name...",
    },
    modelCompose: {
        title: "Model compose",
        columnAria: {
            icon: "Model with icon is a new composed model",
        },
        loading: "Loading models...",
        composing: "Model is composing, please wait...",
        column: {
            icon: {
                name:"Composed Icon",
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
            lastupdated: {
                headerName: "Last Updated",
                fieldName: "lastUpdated",
            },
        },
        modelView: {
            titleAria: "Compose Model View",
            addComposeModelName: "Add compose model name...",
            NotEnoughModels: " Should have at least more than one selected model to compose a new model",
            modelsCannotBeIncluded: "Warning: These models will not be included in composed model!",
            modelCannotBeIncluded: "Warning: This model will not be included in composed model!"
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
    },
    recentModelsView:{
        header: "Select a model to analyze with",
        checkboxAriaLabel: "Select model checkbox"
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
            notCompatibleTagType: "Tag type is not compatible with this feature",
            checkboxPerTagLimit: "Cannot assign more than one checkbox per tag",
        },
        toolbar: {
            add: "Add new tag",
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
                invalidSASMessage: "\"${project.sourceConnection.name}\" has no storage account. Please check it's SAS token in the Connections page",
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
                invalidFolderMessage: "\"${project.sourceConnection.name}\" has an invalid folder. Please check it's selected folder in the Connections page",
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
                            selectionMarks: "Selection Marks (Preview)",
                            labels: "Labels"
                        },
                    }
                },
                farItems: {
                    share: "Share Project",
                    zoom: {
                        zoomOut: "Zoom out",
                        zoomIn: "Zoom in",
                    },
                    additionalActions: {
                        text: "Additional actions",
                        subIMenuItems: {
                            runOcrOnCurrentDocument: "Run OCR on current document",
                            runOcrOnAllDocuments: "Run OCR on all documents",
                        }
                    }
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
        tips: {
            quickLabeling: {
                name: "Quick labeling",
            description: "Hotkeys 1 through 0 and all letters are assigned to first 36 tags. After selecting one or multiple words, press tag's assigned hotkey.",
            },
            renameTag: {
                name: "Rename tag",
                description: "Hold Alt key and click on tag name.",
            },
            multipleWordSelection: {
                name: "Select multiple words",
                description: "Click and hold on word. Then, hover over additional words.",
            },
            deleteAllLabelsForTag: {
                name: "Delete all labels for a tag",
                description: "Select all labels for a tag on document and press 'delete' key"
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
            message: "An error occured while rendering the application. Please try again",
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

        }
    },
    shareProject: {
        errors: {
            cannotDecodeString: "Cannot decode shared string! Please, check if your string has been modified.",
            connectionNotFound: "Connection not found. Add shared project's connection to your connections.",
            noConnections: "Connection is required for project sharing",
            tokenNameExist: "Warning! You already have token with same name as in shared project. Please create a new token, and update the existing project which uses ''${sharedTokenName}'' with new token name."
        },
        copy: {
            success: "String for sharing your project has been saved to clipboard. In order to use it, paste it in appropriate section of the 'Open Cloud Project' popup.",
        }
    },
};

/*eslint-enable no-template-curly-in-string, no-multi-str*/
