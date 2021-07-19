// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import LocalizedStrings, {LocalizedStringsMethods} from "react-localization";
import {english} from "./localization/en-us";
import {spanish} from "./localization/es-cl";

/**
 * Interface for all required strings in application
 * Language must add all strings to be compliant for localization
 */
export interface IAppStrings {
    appName: string,
    common: {
        displayName: string,
        description: string,
        submit: string,
        cancel: string,
        save: string,
        delete: string,
        provider: string,
        homePage: string,
        reload: string,
        skipToMainContent: string,
        skipToSidebar: string,
    };
    projectService: {
        existingLabelFiles: string,
    };
    titleBar: {
        help: string,
        minimize: string,
        maximize: string,
        restore: string,
        close: string,
    };
    homePage: {
        title: string,
        newProject: string,
        openLocalProject: {
            title: string,
            description: string,
        },
        openCloudProject: {
            title: string,
            selectConnection: string,
            pasteSharedUri: string,
        },
        deleteProject: {
            title: string,
            confirmation: string,
        },
        importProject: {
            title: string,
            confirmation: string,
        },
        recentProjects: string,
        messages: {
            deleteSuccess: string,
        },
        homeProjectView: {
            title: string,
        },
        prebuiltPredict: {
            title: string;
            description: string;
        }
        layoutPredict: {
            title: string;
            description: string;
        }
        trainWithLabels: {
            title: string;
            description: string;
        }
        quickStartGuide: string;
    };
    appSettings: {
        title: string,
        storageTitle: string,
        uiHelp: string,
        save: string,
        securityToken: {
            name: {
                title: string,
            },
            key: {
                title: string,
            },
            duplicateNameErrorMessage: string,
        },
        securityTokens: {
            title: string,
            description: string,
        },
        version: {
            description: string,
        },
        commit: string,
        devTools: {
            description: string,
            button: string,
        },
        reload: {
            description: string,
            button: string,
        },
        messages: {
            saveSuccess: string,
        },
    };
    projectSettings: {
        title: string,
        securityToken: {
            title: string,
            description: string,
        },
        save: string,
        sourceConnection: {
            title: string,
            description: string,
        },
        targetConnection: {
            title: string,
            description: string,
        },
        videoSettings: {
            title: string,
            description: string,
            frameExtractionRate: string,
        },
        addConnection: string,
        messages: {
            saveSuccess: string,
            projectExisted: string,
        },
    };
    train: {
        modelNameTitle: string,
        labelFolderTitle: string,
        defaultLabelFolderURL: string,
        title: string,
        training: string,
        pleaseWait: string,
        notTrainedYet: string,
        backEndNotAvailable: string,
        addName: string,
        downloadJson: string;
        trainConfirm: {
            title: string;
            message: string;
        },
        errors: {
            electron: {
                cantAccessFiles: string;
            }
        }
    };
    modelCompose: {
        title: string,
        columnAria: {
            icon: string,
        }
        loading: string,
        composing: string,
        limitQuantityComposedModel:string,
        column: {
            icon: {
                name: string,
            }
            id: {
                headerName: string,
                fieldName: string,
            }
            name: {
                headerName: string,
                fieldName: string,
            }
            status: {
                headerName: string,
                fieldName: string,
            }
            created: {
                headerName: string,
                fieldName: string,
            }
            lastUpdated: {
                headerName: string,
                fieldName: string,
            }
        }
        modelView: {
            titleAria: string;
            addComposeModelName: string;
            NotEnoughModels: string;
            modelsCannotBeIncluded: string;
            modelCannotBeIncluded: string;
            addModelToRecentModels: string,
            recentModelsAlreadyContainsModel: string,
            loadingDetails: string;
        }
        commandBar: {
            ariaLabel: string,
            composeAria: string,
            refreshAria: string,
            filter: string,
            filterAria: string,
        },
        modelsList: {
            headerAria: string,
            checkButtonAria: string,
            checkAllButtonAria: string,
        },
        errors: {
            failedCompose: string,
            noInfoAboutModel: string,
        }
    }
    predict: {
        title: string,
        uploadFile: string,
        inProgress: string,
        noRecentModels: string,
        selectModelHeader: string,
        modelIDPrefix: string,
        modelNamePrefix: string,
        downloadScript: string,
        defaultLocalFileInput: string,
        defaultURLInput: string,
        editAndUploadToTrainingSet: string,
        editAndUploadToTrainingSetNotify: string,
        editAndUploadToTrainingSetNotify2: string,
        uploadInPrgoress: string,
        analysis: string;
        runAnalysis: string;
        confirmDuplicatedAssetName: {
            title: string,
            message: string
        },
    };
    pageRange: {
        title: string;
        tooltip: string;
    };
    prebuiltPredict: {
        title: string;
        defaultLocalFileInput: string;
        defaultURLInput: string;
        uploadFile: string;
        inProgress: string;
        anlayWithPrebuiltModels: string;
        locale: string;
        formTypeTitle: string;
        selectFileAndRunAnalysis: string;
        analysis: string;
        runAnalysis: string;
        noFieldCanBeExtracted: string;
        pdfPageNumberLimit:string;
    };
    prebuiltSetting: {
        serviceConfigurationTitle: string;
        serviceEndpointTitle: string;
        apiKeyTitle: string;
        endpointTooltip: string;
        endpointPlaceholder: string;
        apiKeyTooltip: string;
        apiKeyPlaceholder: string;
    };
    documentFilePicker: {
        source: string;
        localFile: string;
        url: string;
    };
    layoutPredict: {
        layout: string;
        title: string;
        inProgress: string;
        selectFileAndRunLayout: string;
        analysis: string;
        runLayout: string;
        download: string;
        layoutResults: string;
    };
    recentModelsView: {
        header: string;
        checkboxAriaLabel: string;
        addToRecentModels: string;
    };
    projectMetrics: {
        title: string,
        assetsSectionTitle: string,
        totalAssetCount: string,
        visitedAssets: string,
        taggedAssets: string,
        nonVisitedAssets: string,
        nonTaggedAssets: string,
        tagsSectionTitle: string,
        totalRegionCount: string,
        totalTagCount: string,
        avgTagCountPerAsset: string,
    };
    tags: {
        title: string,
        placeholder: string,
        editor: string,
        modal: {
            name: string,
            color: string,
        }
        toolbar: {
            add: string;
            addTable: string;
            contextualMenu: string;
            delete: string;
            edit: string;
            format: string;
            lock: string;
            moveDown: string;
            moveUp: string;
            rename: string;
            search: string;
            type: string;
            vertiline: string;
            onlyShowCurrentPageTags:string,
            showAllTags:string,
            showOriginLabels: string
            hideOriginLabels: string,
        }
        colors: {
            white: string,
            gray: string,
            red: string,
            maroon: string,
            yellow: string,
            olive: string,
            lime: string,
            green: string,
            aqua: string,
            teal: string,
            blue: string,
            navy: string,
            fuschia: string,
            purple: string,
        }
        warnings: {
            existingName: string,
            emptyName: string,
            unknownTagName: string,
            notCompatibleTagType: string,
            checkboxPerTagLimit: string,
            notCompatibleWithDrawnRegionTag: string,
            replaceAllExitingLabels:string,
            replaceAllExitingLabelsTitle:string,
        },
        preText:{
            autoLabel:string,
            revised:string,
        }
        regionTableTags: {
            configureTag: {
                errors: {
                    atLeastOneColumn: string,
                    atLeastOneRow: string,
                    checkFields: string,
                    assignTagName: string,
                    notUniqueTagName: string,
                    emptyTagName: string,
                    emptyName: string,
                    notUniqueName: string,
                    notCompatibleTableColOrRowType: string;
                },
            },
            tableLabeling: {
                title: string,
                description: {
                    title: string,
                    stepOne: string,
                    stepTwo: string,
                },
                tableName: string,
                buttons: {
                    done: string,
                    reconfigureTable: string,
                    addRow: string,
                }
            },
            confirm: {
                reconfigure: {
                    title: string,
                    message: string,
                }
            }
        }
    };
    connections: {
        title: string,
        details: string,
        settings: string,
        instructions: string,
        new: string,
        save: string,
        genericInvalid: string,
        messages: {
            saveSuccess: string,
            deleteSuccess: string,
            doNotAllowDuplicateNames: string,
        },
        imageCorsWarning: string,
        blobCorsWarning: string,
        azDocLinkText: string,
        providers: {
            azureBlob: {
                title: string,
                description: string,
                accountName: {
                    title: string,
                    description: string,
                },
                containerName: {
                    title: string,
                    description: string,
                },
                sas: {
                    title: string,
                    description: string,
                },
                createContainer: {
                    title: string,
                    description: string,
                },
                invalidSASMessage: string,
            },
            bing: {
                title: string,
                options: string,
                apiKey: string,
                query: string,
                aspectRatio: {
                    title: string,
                    all: string,
                    square: string,
                    wide: string,
                    tall: string,
                }
            },
            local: {
                title: string,
                folderPath: string,
                browse: string,
                selectFolder: string,
                chooseFolder: string,
                invalidFolderMessage: string,
            },
        }
    };
    editorPage: {
        title: string,
        width: string,
        height: string,
        tagged: string,
        visited: string,
        toolbar: {
            select: string,
            pan: string,
            drawRectangle: string,
            drawPolygon: string,
            copyRectangle: string,
            copy: string,
            cut: string,
            paste: string,
            removeAllRegions: string,
            previousAsset: string,
            nextAsset: string,
            saveProject: string,
            exportProject: string,
            activeLearning: string,
        }
        videoPlayer: {
            nextTaggedFrame: {
                tooltip: string,
            },
            previousTaggedFrame: {
                tooltip: string,
            },
            nextExpectedFrame: {
                tooltip: string,
            },
            previousExpectedFrame: {
                tooltip: string,
            },
        }
        help: {
            title: string,
            escape: string,
        },
        asset: {
            delete: {
                title: string,
                confirmation: string,
            }
        },
        assetWarning: {
            incorrectFileExtension: {
                attention: string,
                text: string,
                failedToFetch: string,
            },
        }
        ,
        assetError: string,
        tags: {
            hotKey: {
                apply: string,
                lock: string,
            },
            rename: {
                title: string,
                confirmation: string,
            },
            delete: {
                title: string,
                confirmation: string,
            },
        }
        canvas: {
            removeAllRegions: {
                title: string,
                confirmation: string,
            },
            canvasCommandBar: {
                items: {
                    layers: {
                        text: string,
                        subMenuItems: {
                            text: string,
                            tables: string,
                            selectionMarks: string,
                            drawnRegions: string,
                            labels: string,
                        }
                    },
                    drawRegion: string,
                },
                farItems: {
                    rotate: {
                        counterClockwise: string,
                        clockwise: string,
                    },
                    zoom: {
                        zoomOut: string,
                        zoomIn: string,
                    },
                    additionalActions: {
                        text: string,
                        subIMenuItems: {
                            runOcrOnCurrentDocument: string,
                            runOcrOnAllDocuments: string,
                            runAutoLabelingCurrentDocument: string,
                            runAutoLabelingOnMultipleUnlabeledDocuments: string,
                            noPredictModelOnProject: string,
                            costWarningMessage: string
                        }
                    }
                },
                warings: {
                    drawRegionUnsupportedAPIVersion: string,
                }
            },
        },
        messages: {
            enforceTaggedRegions: {
                title: string,
                description: string,
            },
        },
        warningMessage: {
            PreventLeavingWhileRunningOCR: string,
            PreventLeavingRunningAutoLabeling: string,
        }
    };
    profile: {
        settings: string,
    };
    shortcuts: {
        squareBrackets: {
            keys: {
                leftBracket: string,
                rightBracket: string,
            },
            description: {
                prevWord: string,
                nextWord: string,
            },
        },
        greaterAndLessThan: {
            keys: {
                lessThan: string,
                greaterThan: string,
            },
            description: {
                prevPage: string,
                nextPage: string,
            },
        },
        zoomKeys: {
            keys: {
                minus: string,
                plus: string,
                slash: string,
            },
            description: {
                in: string,
                out: string,
                reset: string,
            },
        },
        deleteAndBackspace: {
            keys: {
                delete: string,
                backSpace: string,
            },
            description: {
                delete: string,
                backSpace: string,
            },
        },
        drawnRegions: {
            keys: {
                escape: string,
                alt: string,
                backSpace: string,
            },
            description: {
                deleteSelectedDrawnRegions: string,
                cancelDrawOrReshape: string,
            }
        },
        tips: {
            quickLabeling: {
                name: string,
                description: string,
            },
            renameTag: {
                name: string,
                description: string,
            },
            multipleWordSelection: {
                name: string,
                description: string,
            },
            deleteAllLabelsForTag: {
                name: string,
                description: string,
            },
            groupSelect: {
                name: string,
                description: string,
            }
        },
        headers: {
            keyboardShortcuts: string,
            otherTips: string,
        },
        iconTitle: string,
    };
    errors: {
        unknown: IErrorMetadata,
        projectInvalidJson: IErrorMetadata,
        projectInvalidSecurityToken: IErrorMetadata,
        projectUploadError: IErrorMetadata,
        projectDeleteError: IErrorMetadata,
        projectDeleteErrorSecurityTokenNotFound: IErrorMetadata,
        projectNotFound: IErrorMetadata,
        genericRenderError: IErrorMetadata,
        securityTokenNotFound: IErrorMetadata,
        canvasError: IErrorMetadata,
        importError: IErrorMetadata,
        pasteRegionTooBigError: IErrorMetadata,
        exportFormatNotFound: IErrorMetadata,
        activeLearningPredictionError: IErrorMetadata,
        blobContainerIONotFound: IErrorMetadata,
        blobContainerIOForbidden: IErrorMetadata,
        projectDeleteForbidden: IErrorMetadata,
        projectDeleteNotFound: IErrorMetadata,
        predictWithoutTrainForbidden: IErrorMetadata,
        missingRequiredFieldInLabelFile: IErrorMetadata,
        noLabelInLabelFile: IErrorMetadata,
        duplicateFieldKeyInLabelsFile: IErrorMetadata,
        invalidJSONFormat: IErrorMetadata,
        sameLabelInDifferentPageError: IErrorMetadata,
        duplicateBoxInLabelFile: IErrorMetadata,
        endpointConnectionError: IErrorMetadata,
        tooManyRequests: IErrorMetadata,
        modelCountLimitExceeded: IErrorMetadata,
        requestSendError: IErrorMetadata,
        modelNotFound: IErrorMetadata,
        connectionNotExistError: IErrorMetadata,
        getOcrError: IErrorMetadata,
    };
    shareProject: {
        name: string,
        errors: {
            cannotDecodeString: string,
            connectionNotFound: string,
            connectionRequirement: string,
            tokenNameExist: string,
        },
        copy: {
            success: string,
        }
    };
    appSurveyText: string;
}

interface IErrorMetadata {
    title: string,
    message: string,
}

interface IStrings extends LocalizedStringsMethods, IAppStrings {}

export const strings: IStrings = new LocalizedStrings({
    en: english,
    es: spanish,
});

/**
 * Add localization values to JSON object. Substitutes value
 * of variable placeholders with value of currently set language
 * Example variable: ${strings.profile.settings}
 * @param json JSON object containing variable placeholders
 */
export function addLocValues(json: any) {
    return interpolateJson(json, {strings});
}

/**
 * Stringifies the JSON and substitutes values from params
 * @param json JSON object
 * @param params Parameters for substitution
 */
export function interpolateJson(json: any, params: any) {
    const template = JSON.stringify(json);
    const outputJson = interpolate(template, params);
    return JSON.parse(outputJson);
}

/**
 * Makes substitution of values in string
 * @param template String containing variables
 * @param params Params containing substitution values
 */
export function interpolate(template: string, params: any) {
    const names = Object.keys(params);
    const vals = Object["values"](params);

    // eslint-disable-next-line
    return new Function(...names, `return \`${template}\`;`)(...vals);
}
