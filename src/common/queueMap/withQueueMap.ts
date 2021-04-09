import { IStorageProvider } from "../../providers/storage/storageProviderFactory";
import { constants } from "../constants";
import { queueMap } from "./queueMap";

// tslint:disable-next-line
export function withQueueMap<T extends { new(...args: any[]): IStorageProvider }>(constructor: T) {
    return class extends constructor {
        isQueuedFile = (filePath: string = ""): boolean => {
            return filePath.endsWith(constants.labelFileExtension);
        }

        writeText = async (filePath: string, contents: string): Promise<void> => {
            const parentWriteText = super.writeText.bind(this);
            if (this.isQueuedFile(filePath)) {
                queueMap.enque(filePath, [filePath, contents]);
                queueMap.on(filePath, parentWriteText);
                return;
            }
            return await parentWriteText(filePath, contents);
        }

        readText = async (filePath: string, ignoreNotFound?: boolean): Promise<string> => {
            const parentReadText = super.readText.bind(this);
            if (this.isQueuedFile(filePath)) {
                const args = queueMap.getLast(filePath);
                if (args.length >= 2) {
                    const contents = args[1] || "";
                    return (async () => contents)()
                }
            }
            return parentReadText(filePath, ignoreNotFound);
        }

        deleteFile = async (filePath: string, ignoreNotFound?: boolean, ignoreForbidden?: boolean) => {
            // Expect this function is not called too often or may cause race with readText.
            const parentDeleteFile = super.deleteFile.bind(this);
            if (this.isQueuedFile(filePath)) {
                await queueMap.callAfterLoop(filePath, parentDeleteFile, [filePath, ignoreNotFound, ignoreForbidden])
                return;
            }
            parentDeleteFile(filePath, ignoreNotFound, ignoreForbidden);
        }
    }
}
