import _ from "lodash";
import { ExportProvider, ExportAssetState, IExportResults } from "./exportProvider";
import Guard from "../../common/guard";
import {
    IProject, IExportFormat, IAssetMetadata,
    IBoundingBox, ISize, IExportProviderOptions,
} from "../../models/applicationState";
import {
    AzureCustomVisionService, IAzureCustomVisionServiceOptions, IAzureCustomVisionProject,
    IAzureCustomVisionTag, IAzureCustomVisionRegion,
} from "./azureCustomVision/azureCustomVisionService";
import HtmlFileReader from "../../common/htmlFileReader";

/**
 * Options for Azure Custom Vision Service
 */
export interface IAzureCustomVisionExportOptions extends IExportProviderOptions {
    assetState: ExportAssetState;
    newOrExisting: NewOrExisting;
    region: AzureRegion;
    apiKey: string;
    projectId?: string;
    name?: string;
    description?: string;
    projectType?: string;
    classificationType?: string;
    domainId?: string;
}

/**
 * Enum for new or existing Custom Vision projects
 */
export interface ITagList {
    [index: string]: IAzureCustomVisionTag;
}

export enum NewOrExisting {
    New = "new",
    Existing = "existing",
}

/**
 * Azure regions
 */
export enum AzureRegion {
    EastUS = "eastus",
    EastUS2 = "eastus2",
    NorthCentralUS = "northcentralus",
    SouthCentralUS = "southcentralus",
    WestUS2 = "westus2",
    WestEurope = "westeurope",
    NorthEurope = "northeurope",
    SoutheastAsia = "southeastasia",
    AustraliaEast = "australiaeast",
    CentralIndia = "centralindia",
    UKSouth = "uksouth",
    JapanEast = "japaneast",
}

/**
 * @name - Azure Custom Vision Provider
 * @description - Exports a VoTT project into an Azure custom vision project
 */
export class AzureCustomVisionProvider extends ExportProvider<IAzureCustomVisionExportOptions> {
    private customVisionService: AzureCustomVisionService;

    constructor(project: IProject, options: IAzureCustomVisionExportOptions) {
        super(project, options);
        Guard.null(options);

        if (!options.region) {
            options.region = AzureRegion.SouthCentralUS;
        }

        const cusomVisionServiceOptions: IAzureCustomVisionServiceOptions = {
            apiKey: options.apiKey,
            baseUrl: `https://${options.region}.api.cognitive.microsoft.com/customvision/v2.2/Training`,
        };
        this.customVisionService = new AzureCustomVisionService(cusomVisionServiceOptions);
    }

    /**
     * Exports the configured assets to the Azure Custom Vision service
     * @returns The upload results
     */
    public async export(): Promise<IExportResults> {
        const customVisionTags = await this.syncTags();
        const assetsToExport = await this.getAssetsForExport();
        const tagMap = _.keyBy(customVisionTags, "name");

        const results = await assetsToExport.mapAsync(async (asset) => {
            try {
                await this.uploadAsset(asset, tagMap);
                return {
                    asset,
                    success: true,
                };
            } catch (e) {
                return {
                    asset,
                    success: false,
                    error: e,
                };
            }
        });

        return {
            completed: results.filter((r) => r.success),
            errors: results.filter((r) => !r.success),
            count: results.length,
        };
    }

    /**
     * Creates a new azure custom vision project if a new project has been configured
     * @param exportFormat - The export configuration options
     */
    public async save(exportFormat: IExportFormat): Promise<IAzureCustomVisionExportOptions> {
        const customVisionOptions = exportFormat.providerOptions as IAzureCustomVisionExportOptions;

        if (customVisionOptions.newOrExisting === NewOrExisting.Existing) {
            return Promise.resolve(customVisionOptions);
        }

        let customVisionProject: IAzureCustomVisionProject = {
            name: customVisionOptions.name,
            description: customVisionOptions.description,
            classificationType: customVisionOptions.classificationType,
            domainId: customVisionOptions.domainId,
            projectType: customVisionOptions.projectType,
        };

        customVisionProject = await this.customVisionService.create(customVisionProject);

        return {
            assetState: customVisionOptions.assetState,
            region: customVisionOptions.region,
            apiKey: customVisionOptions.apiKey,
            projectId: customVisionProject.id,
            newOrExisting: NewOrExisting.Existing,
        };
    }

    /**
     * Creates any new tags not already defined within the custom vision project
     * @returns All tags from the custom vision project
     */
    private async syncTags(): Promise<IAzureCustomVisionTag[]> {
        const customVisionOptions = this.project.exportFormat.providerOptions as IAzureCustomVisionExportOptions;
        const customVisionTags = await this.customVisionService.getProjectTags(customVisionOptions.projectId);
        const customVisionTagNames = _.keyBy(customVisionTags, "name");

        const createTagTasks = await this.project.tags
            .filter((projectTag) => {
                return !customVisionTagNames[projectTag.name];
            }).map((projectTag) => {
                const newTag: IAzureCustomVisionTag = {
                    name: projectTag.name,
                };
                return this.customVisionService.createTag(customVisionOptions.projectId, newTag);
            });

        const newTags = await Promise.all(createTagTasks);
        return customVisionTags.concat(newTags);
    }

    /**
     * Uploads the asset binary to azure custom vision service and configured tagged regions
     * @param assetMetadata - The asset to upload
     * @param tags - The global tag list from custom vision service
     */
    private async uploadAsset(assetMetadata: IAssetMetadata, tags: ITagList): Promise<void> {
        const blob = await HtmlFileReader.getAssetBlob(assetMetadata.asset);

        // Upload new image to the custom vision service
        const newImage = await this.customVisionService.createImage(this.options.projectId, blob);

        if (!newImage) {
            return Promise.reject(`Error uploading asset binary with id "${assetMetadata.asset.id}"`);
        }

        const allRegions: IAzureCustomVisionRegion[] = [];

        // Generate the regions for Azure Custom Vision
        assetMetadata.regions.forEach((region) => {
            if (region.boundingBox) {
                region.tags.forEach((tagName) => {
                    const customVisionTag = tags[tagName];
                    if (customVisionTag) {
                        const boundingBox = this.getBoundingBoxValue(assetMetadata.asset.size, region.boundingBox);
                        const newRegion: IAzureCustomVisionRegion = {
                            imageId: newImage.id,
                            tagId: customVisionTag.id,
                            ...boundingBox,
                        };
                        allRegions.push(newRegion);
                    }
                });
            }
        });

        // Associate regions with newly uploaded image
        // Azure custom vision service API is smart enough to detect that an image already exists with the same binary
        if (allRegions.length > 0) {
            await this.customVisionService.createRegions(this.options.projectId, allRegions);
        }
    }

    /**
     * Converts absolute bounding box values to relative bounding box values
     * @param size The actual size of the asset
     * @param boundingBox The actual bounding box coordinates
     */
    private getBoundingBoxValue(size: ISize, boundingBox: IBoundingBox): IBoundingBox {
        return {
            left: boundingBox.left / size.width,
            top: boundingBox.top / size.height,
            width: boundingBox.width / size.width,
            height: boundingBox.height / size.height,
        };
    }
}
