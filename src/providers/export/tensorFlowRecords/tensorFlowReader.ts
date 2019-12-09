import Guard from "../../../common/guard";
import { TFRecordsImageMessage } from "./tensorFlowRecordsProtoBuf_pb";
import { crc32c, maskCrc, textDecode, readInt64 } from "./tensorFlowHelpers";
import { FeatureType } from "./tensorFlowBuilder";

/**
 * @name - TFRecords Read Class
 * @description - Read a TFRecords object
 */
export class TFRecordsReader {
    private imageMessages: TFRecordsImageMessage[];

    constructor(tfrecords: Buffer) {
        Guard.null(tfrecords);

        this.imageMessages = [];
        let position = 0;

        while (position < tfrecords.length) {
            const lengthBuffer = tfrecords.slice(position, position + 8);
            const dataLength = readInt64(lengthBuffer);
            const lengthCrc = maskCrc(crc32c(lengthBuffer));
            position += 8;

            const expectedLengthCrc = tfrecords.readUInt32LE(position);
            position += 4;

            if (lengthCrc !== expectedLengthCrc) {
                console.log("Wrong Length CRC");
                break;
            }

            const dataBuffer = tfrecords.slice(position, position + dataLength);
            const dataCrc = maskCrc(crc32c(dataBuffer));
            position += dataLength;

            const expectedDataCrc = tfrecords.readUInt32LE(position);
            position += 4;

            if (dataCrc !== expectedDataCrc) {
                console.log("Wrong Data CRC");
                break;
            }

            // Deserialize TFRecord from dataBuffer
            const imageMessage: TFRecordsImageMessage = TFRecordsImageMessage.deserializeBinary(dataBuffer);

            this.imageMessages.push(imageMessage);
        }
    }

    /**
     * @description - Return the number of TFRecords read
     */
    get length(): number {
        return this.imageMessages.length;
    }

    /**
     * @description - Return the TFRecords in a JSON Object Array format
     */
    public toArray(): object[] {
        return this.imageMessages.map((imageMessage) => imageMessage.toObject());
    }

    /**
     * @recordPos - Record Position
     * @key - Feature Key
     * @type - Feature Type
     * @description - Get a Int64 | Float | String | Binary value
     */
    public getFeature(recordPos: number, key: string, type: FeatureType): string | number | Uint8Array {
        const message = this.imageMessages[recordPos];
        const feature = message.getContext().getFeatureMap().get(key);

        switch (type) {
            case FeatureType.String:
                return textDecode(feature.getBytesList().array[0][0]);
            case FeatureType.Binary:
                return feature.getBytesList().array[0][0];
            case FeatureType.Int64:
                return feature.getInt64List().array[0][0];
            case FeatureType.Float:
                return feature.getFloatList().array[0][0];
        }
    }

    /**
     * @recordPos - Record Position
     * @key - Feature Key
     * @type - Feature Type
     * @description - Get an array of Int64 | Float | String | Binary value
     */
    public getArrayFeature(recordPos: number, key: string, type: FeatureType): string[] | number[] | Uint8Array[] {
        const message = this.imageMessages[recordPos];
        const feature = message.getContext().getFeatureMap().get(key);

        switch (type) {
            case FeatureType.String:
                return feature.getBytesList().array[0].map((buffer) => textDecode(buffer));
            case FeatureType.Binary:
                return feature.getBytesList().array[0];
            case FeatureType.Int64:
                return feature.getInt64List().array[0];
            case FeatureType.Float:
                return feature.getFloatList().array[0];
        }
    }
}
