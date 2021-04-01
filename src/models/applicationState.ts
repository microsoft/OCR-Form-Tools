// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ITrainRecordProps } from "../react/components/pages/train/trainRecord";

/**
 * @name - Application State
 * @description - Defines the root level application state
 * @member appSettings - Application wide settings
 * @member connections - Global list of connections available to application
 * @member recentProjects - List of recently used projects
 * @member currentProject - The active project being edited
 * @member appError - error in the app if any
 */
export interface IApplicationState {
    prebuiltSettings?: IPrebuiltSettings;
    appSettings: IAppSettings,
    connections: IConnection[],
    recentProjects: IProject[],
    currentProject: IProject,
    appError?: IAppError,
    appTitle?: string,
}

/**
 * @name - Application Error
 * @description - Defines error detail
 * @member title - title of the error to display
 * @member message - message of the error to display
 * @member errorCode - error category
 */
export interface IAppError {
    errorCode: ErrorCode,
    message: any,
    title?: string,
}

/**
 * Base application error
 */
export class AppError extends Error implements IAppError {
    public errorCode: ErrorCode;
    public message: string;
    public title?: string;

    constructor(errorCode: ErrorCode, message: string, title: string = null) {
        super(message);
        this.errorCode = errorCode;
        this.message = message;
        this.title = title;
    }
}

/**
 * @name - Provider Options
 * @description - Property map of key values used within a export / asset / storage provider
 */
export interface IProviderOptions {
    [key: string]: any,
}

/**
 * @name - Application settings
 * @description - Defines the root level configuration options for the application
 * @member devToolsEnabled - Whether dev tools are current open and enabled
 * @member securityTokens - Token used to encrypt sensitive project settings
 */
export interface IAppSettings {
    securityTokens: ISecurityToken[],
    thumbnailSize?: ISize,
    hideUploadingOption?: boolean;
}

/**
 * @name - Project
 * @description - Defines the structure of a tagging project
 * @member id - Unique identifier
 * @member name - User defined name
 * @member securityToken - The Base64 encoded token used to encrypt sensitive project data
 * @member description - User defined description
 * @member tags - User defined list of tags
 * @member targetConnection - Full source connection details
 * @member assets - Map of assets within a project
 */
export interface IProject {
    id: string,
    name: string,
    version: string,
    securityToken: string,
    description?: string,
    tags: ITag[],
    sourceConnection: IConnection,
    assets?: { [index: string]: IAsset },
    lastVisitedAssetId?: string,
    apiUriBase: string,
    apiKey?: string | ISecureString,
    apiVersion?: string;
    folderPath: string,
    trainRecord: ITrainRecordProps,
    recentModelRecords: IRecentModel[],
    predictModelId: string,
}

/**
 * @name - FileInfo
 * @description - Defines the file information and content for V1 projects
 * @member content - The content of a file (JSON string)
 * @member file - The File object point to the V1 project file
 */
export interface IFileInfo {
    content: string | ArrayBuffer,
    file: File,
}

/**
 * @name - Tag
 * @description - Defines the structure of a tag
 * @member name - User defined name
 * @member color - User editable color associated to tag
 */
export interface ITag {
    name: string;
    color: string;
    type: FieldType;
    format: FieldFormat;
    documentCount?: number;
}

export interface ITableTag extends ITag {
    fields?: ITableField[];
    itemType?: string;
    definition?: ITableDefinition,
    visualizationHint?: TableVisualizationHint,
}

export enum TableHeaderTypeAndFormat {
    Rows = "rows",
    Columns = "columns"
}

export enum TableVisualizationHint {
    Horizontal = "horizontal",
    Vertical = "vertical",
}

/**
 * @name - Connection
 * @description - Defines a reusable data source definition for projects
 * @member id - Unique identifier for connection
 * @member name - User defined name
 * @member description - User defined short description
 * @member providerType - The underlying storage type (Local File System, Azure Blob Storage, etc)
 * @member providerOptions - Provider specific options used to connect to the data source
 */
export interface IConnection {
    id: string,
    name: string,
    description?: string,
    providerType: string,
    providerOptions: IProviderOptions | ISecureString,
}

/**
 * @name - Asset
 * @description - Defines an asset within a project
 * @member id - Unique identifier for asset
 * @member type - Type of asset (Image, Video, etc)
 * @member name - Generated name for asset
 * @member path - Relative path to asset within the underlying data source
 * @member size - Size / dimensions of asset
 * @member format - The asset format (jpg, png, mp4, etc)
 */
export interface IAsset {
    id: string,
    type: AssetType,
    state: AssetState,
    labelingState?: AssetLabelingState,
    name: string,
    path: string,
    size: ISize,
    format?: string,
    timestamp?: number,
    predicted?: boolean,
    ocr?: any,
    isRunningOCR?: boolean,
    isRunningAutoLabeling?: boolean,
    cachedImage?: string,
    mimeType?: string,
    schema?: string
}

export interface IPrebuiltSettings{
    serviceURI: string;
    apiKey: string;
}

/**
 * @name - Asset Metadata
 * @description - Format to store asset metadata for each asset within a project
 * @member asset - References an asset within the project
 * @member regions - The list of regions drawn on the asset
 */
export interface IAssetMetadata {
    asset: IAsset,
    regions: IRegion[],
    version: string,
    labelData: ILabelData,
}

/**
 * @name - Size
 * @description - Defines the size and/or diminsion for an asset
 * @member width - The actual width of an asset
 * @member height - The actual height of an asset
 */
export interface ISize {
    width: number,
    height: number,
}

/**
 * @name - Region
 * @description - Defines a region within an asset
 * @member id - Unique identifier for this region
 * @member type - Defines the type of region
 * @member tags - Defines a list of tags applied to a region
 * @member points - Defines a list of points that define a region
 */
export interface IRegion {
    id: string,
    type: RegionType,
    category: FeatureCategory,
    tags: string[],
    points?: IPoint[],
    boundingBox?: IBoundingBox,
    value?: string,
    pageNumber: number,
    isTableRegion?: boolean,
    changed?: boolean,

}

export interface ITableRegion extends IRegion {
    rowKey: string,
    columnKey: string,
}

/**
 * @name - ILabelData
 * @description - Defines a label data correspond to an asset
 */
export interface ILabelData {
    document: string,
    labelingState?: AssetLabelingState;
    labels: ILabel[],
    tableLabels?: ITableLabel[],
    $schema?: string,
}

/**
 * @name - ILabel
 * @description - Defines a label
 */
export interface ILabel {
    label: string,
    key?: IFormRegion[],
    value: IFormRegion[],
    originValue?: IFormRegion[],
    labelType?: string,
    confidence?: number,
    revised?: boolean;
}

export interface ITableLabel {
    tableKey: string,
    labels: ITableCellLabel[],
}

export interface ITableCellLabel {
    rowKey: string,
    columnKey: string,
    value: IFormRegion[],
    revised?: boolean;
}

/**
 * @name - IFormRegion
 * @description - Defines a region which consumed by FormRecognizer
 */
export interface IFormRegion {
    page: number,
    text: string,
    boundingBoxes: [number[]],
}

/**
 * @name - Bounding Box
 * @description - Defines the tag usage within a bounding box region
 * @member left - Defines the left x boundary for the start of the bounding box
 * @member top - Defines the top y boundary for the start of the boudning box
 * @member width - Defines the width of the bounding box
 * @member height - Defines the height of the bounding box
 */
export interface IBoundingBox {
    left: number,
    top: number,
    width: number,
    height: number,
}

/**
 * @name - Point
 * @description - Defines a point / coordinate within a region
 * @member x - The x value relative to the asset
 * @member y - The y value relative to the asset
 */
export interface IPoint {
    x: number,
    y: number,
}

export interface ISecureString {
    encrypted: string,
}

export interface ISecurityToken {
    name: string,
    key: string,
}

export interface IField {
    fieldKey: string;
    fieldType: FieldType;
    fieldFormat: FieldFormat;
}

export interface ITableKeyField extends IField {
    documentCount?: number;
}

export interface ITableField extends IField {
    itemType?: string;
    fields?: ITableField[];
    visualizationHint?: TableVisualizationHint;
}

export interface ITableDefinition extends IField {
    itemType?: string;
    fields?: ITableField[];
}

export interface ITableConfigItem {
    name: string,
    format: string,
    type: string;
    originalName?: string;
    originalFormat?: string,
    originalType?: string;
}

export interface IFieldInfo {
    schema?: string,
    fields: IField[],
    definitions?: any,
}

export interface IRecentModel {
    readonly composedTrainResults?: object,
    readonly accuracies?: object,
    readonly averageAccuracy?: number,
    readonly modelInfo: {
        readonly isComposed: boolean,
        readonly modelId: string,
        readonly createdDateTime: string,
        readonly modelName: string,
    },
}

/**
 * Enum of supported error codes
 */
export enum ErrorCode {
    // Note that the value of the enum is in camelCase while
    // the enum key is in Pascal casing
    Unknown = "unknown",
    GenericRenderError = "genericRenderError",
    ProjectInvalidJson = "projectInvalidJson",
    ProjectInvalidSecurityToken = "projectInvalidSecurityToken",
    ProjectDuplicateName = "projectDuplicateName",
    SecurityTokenNotFound = "securityTokenNotFound",
    OverloadedKeyBinding = "overloadedKeyBinding",
    BlobContainerIONotFound = "blobContainerIONotFound",
    BlobContainerIOForbidden = "blobContainerIOForbidden",
    PredictWithoutTrainForbidden = "predictWithoutTrainForbidden",
    ModelNotFound = "modelNotFound",
    ModelCountLimitExceeded = "modelCountLimitExceeded",
    HttpStatusUnauthorized = "unauthorized",
    HttpStatusNotFound = "notFound",
    HttpStatusTooManyRequests = "tooManyRequests",
    RequestSendError = "requestSendError",
    ProjectUploadError = "ProjectUploadError",
}

export enum APIVersionPatches {
    patch1 = "v2.1-preview.1",
    patch2 = "v2.1-preview.2",
    patch3 = "v2.1-preview.3",
    patch4 = "v2.1",
}

/**
 * @enum LOCAL - Local storage type
 * @enum CLOUD - Cloud storage type
 * @enum OTHER - Any other storage type
 */
export enum StorageType {
    Local = "local",
    Cloud = "cloud",
    Other = "other",
}

/**
 * @name - Asset Type
 * @description - Defines the type of asset within a project
 * @member Image - Specifies an asset as an image
 * @member PDF - Specifies an asset as a PDF
 * @member TIFF - Specifies an asset as a TIFF image
 */
export enum AssetType {
    Unknown = 0,
    Image = 1,
    PDF = 5,
    TIFF = 6,
}

export enum AssetMimeType {
    PDF = "application/pdf",
    TIFF = "image/tiff",
    JPG = "image/jpg",
    PNG = "image/png",
    BMP = "image/bmp",
}

/**
 * @name - Asset State
 * @description - Defines the state of the asset with regard to the tagging process
 * @member NotVisited - Specifies as asset that has not yet been visited or tagged
 * @member Visited - Specifies an asset has been visited, but not yet tagged
 * @member Tagged - Specifies an asset has been visited and tagged
 */
export enum AssetState {
    NotVisited = 0,
    Visited = 1,
    Tagged = 2,
}
/**
 * @name - Asset Labeling State
 * @description - Defines the labeling state for the asset
 * @member ManualLabeling - Specifies as an asset that has manual labeling the tags
 * @member Training - Specifies as an asset tagged data has been used for training model
 * @member AutoLabeling - Specifies as an asset that has run auto-labeling
 * @member AutoLabeledAndAdjusted -specifies as an asset that has run auto-labeling and tags manual adjusted
 */
export enum AssetLabelingState {
    ManuallyLabeled = 1,
    Trained = 2,
    AutoLabeled = 3,
    AutoLabeledAndAdjusted = 4,
}

/**
 * @name - Region Type
 * @description - Defines the region type within the asset metadata
 * @member Square - Specifies a region as a square
 * @member Rectangle - Specifies a region as a rectangle
 * @member Polygon - Specifies a region as a multi-point polygon
 */
export enum RegionType {
    Polyline = "POLYLINE",
    Point = "POINT",
    Rectangle = "RECTANGLE",
    Polygon = "POLYGON",
    Square = "SQUARE",
}

export enum EditorMode {
    Rectangle = "RECT",
    Polygon = "POLYGON",
    Polyline = "POLYLINE",
    Point = "POINT",
    Select = "SELECT",
    CopyRect = "COPYRECT",
    None = "NONE",
}

export enum FieldType {
    String = "string",
    Number = "number",
    Date = "date",
    Time = "time",
    Integer = "integer",
    SelectionMark = "selectionMark",
    Array = "array",
    Object = "object",
}

export enum LabelType {
    DrawnRegion = "region"
}

export enum TableElements {
    rows = "rows",
    row = "row",
    columns = "columns",
    column = "column",
}

export enum FieldFormat {
    NotSpecified = "not-specified",
    Currency = "currency",
    Decimal = "decimal",
    DecimalCommaSeparated = "decimal-comma-seperated",
    NoWhiteSpaces = "no-whitespaces",
    Alphanumeric = "alphanumeric",
    DMY = "dmy",
    MDY = "mdy",
    YMD = "ymd",
}

export enum FeatureCategory {
    Text = "text",
    Checkbox = "checkbox",
    Label = "label",
    DrawnRegion = "region"
}

export enum ImageMapParent {
    Predict = "predict",
    Editor = "editor",
}

export enum TagInputMode {
    Basic = "basic",
    ConfigureTable = "configureTable",
    LabelTable = "labelTable",
}

export enum AnalyzedTagsMode {
    default = "default",
    LoadingRecentModel = "loadingRecentModel",
    ViewTable = "viewTable",
}
