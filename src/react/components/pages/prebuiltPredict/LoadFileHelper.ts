import _ from "lodash";
import pdfjsLib from "pdfjs-dist";
import {constants} from "../../../../common/constants";
import HtmlFileReader from "../../../../common/htmlFileReader";
import {loadImageToCanvas, parseTiffData, renderTiffToCanvas} from "../../../../common/utils";

const cMapUrl = constants.pdfjsCMapUrl(pdfjsLib.version);

export interface ILoadFileResult {
    currPage: number;
    imageUri: string,
    imageWidth: number,
    imageHeight: number,

    shouldShowAlert: boolean;
    invalidFileFormat: boolean;
    alertTitle: string;
    alertMessage: string;
}
export interface ILoadFileHelper {
    currPdf: any;
    tiffImages: any[];
    loadFile(file: File): Promise<Partial<ILoadFileResult>>;
    loadTiffPage(pageNumber: number): Promise<Partial<ILoadFileResult>>;
    getPageCount(): number;
    loadPdfPage(pageNumber: number): Promise<Partial<ILoadFileResult>>;
    reset(): void;
}

export class LoadFileHelper implements ILoadFileHelper {
    currPdf: any;
    tiffImages: any[];

    async loadFile(file: File): Promise<Partial<ILoadFileResult>> {
        if (!file) {
            // no file
            return;
        }

        // determine how to load file based on MIME type of the file
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
        switch (file.type) {
            case "image/jpeg":
            case "image/png":
                return await this.loadImageFile(file);
            case "image/tiff":
                return await this.loadTiffFile(file);
            case "application/pdf":
                return await this.loadPdfFile(file);
            default:
                // un-supported file type
                return {
                    imageUri: "",
                    shouldShowAlert: true,
                    invalidFileFormat: true,
                    alertTitle: "Not supported file type",
                    alertMessage: "Sorry, we currently only support JPG/PNG/PDF files.",
                };
        }
    }
    private createObjectURL = (object: File) => {
        // generate a URL for the object
        return (window.URL) ? window.URL.createObjectURL(object) : "";
    }

    private loadImageFile = async (file: File) => {
        const imageUri = this.createObjectURL(file);
        const canvas = await loadImageToCanvas(imageUri);
        return ({
            currPage: 1,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
        });
    }

    private loadTiffFile = async (file) => {
        const fileArrayBuffer = await HtmlFileReader.readFileAsArrayBuffer(file);
        this.tiffImages = parseTiffData(fileArrayBuffer);
        return this.loadTiffPage(1);
    }

    public reset = () => {
        this.currPdf = null;
        this.tiffImages = [];
    }

    public loadTiffPage = async (pageNumber: number) => {
        const tiffImage = this.tiffImages[pageNumber - 1];
        const canvas = renderTiffToCanvas(tiffImage);
        return ({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: tiffImage.width,
            imageHeight: tiffImage.height,
        });
    }

    private loadPdfFile = async (file): Promise<Partial<ILoadFileResult>> => {
        const fileReader: FileReader = new FileReader();

        return new Promise((resolve, reject) => {
            fileReader.onload = (e: any) => {
                const typedArray = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({data: typedArray, cMapUrl, cMapPacked: true});
                loadingTask.promise.then(async (pdf) => {
                    this.currPdf = pdf;
                    resolve(await this.loadPdfPage(1));
                }, (reason) => {
                    resolve({
                        shouldShowAlert: true,
                        alertTitle: "Failed loading PDF",
                        alertMessage: reason.toString(),
                    });
                });
            };

            fileReader.readAsArrayBuffer(file);
        });
    }

    public getPageCount() {
        if (this.currPdf !== null) {
            return _.get(this.currPdf, "numPages", 1);
        } else if (this.tiffImages.length !== 0) {
            return this.tiffImages.length;
        }

        return 1;
    }
    public loadPdfPage = async (pageNumber): Promise<Partial<ILoadFileResult>> => {
        const page = await this.currPdf.getPage(pageNumber);
        const defaultScale = 2;
        const viewport = page.getViewport({scale: defaultScale});

        // Prepare canvas using PDF page dimensions
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport,
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;
        return ({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
        });
    }
}
