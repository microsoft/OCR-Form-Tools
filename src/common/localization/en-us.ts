import { IAppStrings } from "../strings";

/*eslint-disable no-template-curly-in-string, no-multi-str*/

/**
 * App Strings for English language
 */
export const english: IAppStrings = {
    appName: "Visual Object Tagging Tool",
    common: {
        displayName: "Display Name",
        description: "Description",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        provider: "Provider",
        homePage: "Home Page",
        reload: "Reload",
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
        newProject: "New Project",
        openLocalProject: {
            title: "Open Local Project",
        },
        openCloudProject: {
            title: "Open Cloud Project",
            selectConnection: "Select a Connection",
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
            title: "Security Token",
            description: "Used to encrypt sensitive data within project files",
        },
        save: "Save Project",
        sourceConnection: {
            title: "Source Connection",
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
        title: "Train",
        training: "Training",
        pleaseWait: "Please wait",
        notTrainedYet: "Not trained yet",
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
        },
        toolbar: {
            add: "Add new tag",
            search: "Search tags",
            edit: "Edit tag",
            lock: "Lock tag",
            moveUp: "Move tag up",
            moveDown: "Move tag down",
            delete: "Delete tag",
        },
    },
    connections: {
        title: "Connections",
        details: "Connection Details",
        settings: "Connection Settings",
        instructions: "Please select a connection to edit",
        save: "Save Connection",
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
                title: "Azure Blob Storage",
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
                title: "Local File System",
                folderPath: "Folder Path",
                selectFolder: "Select Folder",
                chooseFolder: "Choose Folder",
            },
        },
    },
    editorPage: {
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
        help: {
            title: "Toggle Help Menu",
            escape: "Escape Help Menu",
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
        },
        messages: {
            enforceTaggedRegions: {
                title: "Invalid region(s) detected",
                description: "1 or more regions have not been tagged.  Ensure all regions are tagged before \
                    continuing to next asset.",
            },
        },
    },
    export: {
        title: "Export",
        settings: "Export Settings",
        saveSettings: "Save Export Settings",
        providers: {
            common: {
                properties: {
                    assetState: {
                        title: "Asset State",
                        description: "Which assets to include in the export",
                        options: {
                            all: "All Assets",
                            visited: "Only Visited Assets",
                            tagged: "Only tagged Assets",
                        },
                    },
                    testTrainSplit: {
                        title: "Test / Train Split",
                        description: "The test train split to use for exported data",
                    },
                    includeImages: {
                        title: "Include Images",
                        description: "Whether or not to include binary image assets in target connection",
                    },
                },
            },
            vottJson: {
                displayName: "VoTT JSON",
            },
            azureCV: {
                displayName: "Azure Custom Vision Service",
                regions: {
                    australiaEast: "Australia East",
                    centralIndia: "Central India",
                    eastUs: "East US",
                    eastUs2: "East US 2",
                    japanEast: "Japan East",
                    northCentralUs: "North Central US",
                    northEurope: "North Europe",
                    southCentralUs: "South Central US",
                    southeastAsia: "Southeast Asia",
                    ukSouth: "UK South",
                    westUs2: "West US 2",
                    westEurope: "West Europe",
                },
                properties: {
                    apiKey: {
                        title: "API Key",
                    },
                    region: {
                        title: "Region",
                        description: "The Azure region where your service is deployed",
                    },
                    classificationType: {
                        title: "Classification Type",
                        options: {
                            multiLabel: "Multiple tags per image",
                            multiClass: "Single tag per image",
                        },
                    },
                    name: {
                        title: "Project Name",
                    },
                    description: {
                        title: "Project Description",
                    },
                    domainId: {
                        title: "Domain",
                    },
                    newOrExisting: {
                        title: "New or Existing Project",
                        options: {
                            new: "New Project",
                            existing: "Existing Project",
                        },
                    },
                    projectId: {
                        title: "Project Name",
                    },
                    projectType: {
                        title: "Project Type",
                        options: {
                            classification: "Classification",
                            objectDetection: "Object Detection",
                        },
                    },
                },
            },
            tfRecords: {
                displayName: "Tensorflow Records",
            },
            pascalVoc: {
                displayName: "Pascal VOC",
                exportUnassigned: {
                    title: "Export Unassigned",
                    description: "Whether or not to include unassigned tags in exported data",
                },
            },
            cntk: {
                displayName: "Microsoft Cognitive Toolkit (CNTK)",
            },
            csv: {
                displayName: "Comma Separated Values (CSV)",
            },
        },
        messages: {
            saveSuccess: "Successfully saved export settings",
        },
    },
    activeLearning: {
        title: "Active Learning",
        form: {
            properties: {
                modelPathType: {
                    title: "Model Provider",
                    description: "Where to load the training model from",
                    options: {
                        preTrained: "Pre-trained Coco SSD",
                        customFilePath: "Custom (File path)",
                        customWebUrl: "Custom (Url)",
                    },
                },
                autoDetect: {
                    title: "Auto Detect",
                    description: "Whether or not to automatically make predictions as you navigate between assets",
                },
                modelPath: {
                    title: "Model path",
                    description: "Select a model from your local file system",
                },
                modelUrl: {
                    title: "Model URL",
                    description: "Load your model from a public web URL",
                },
                predictTag: {
                    title: "Predict Tag",
                    description: "Whether or not to automatically include tags in predictions",
                },
            },
        },
        messages: {
            loadingModel: "Loading active learning model...",
            errorLoadModel: "Error loading active learning model",
            saveSuccess: "Successfully saved active learning settings",
        },
    },
    profile: {
        settings: "Profile Settings",
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
    },
};

/*eslint-enable no-template-curly-in-string, no-multi-str*/
