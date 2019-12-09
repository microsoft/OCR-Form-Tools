import React from "react";
import { IAssetProps } from "./assetPreview";
import { loadImageToCanvas } from "../../../../common/utils";
import { constants } from "../../../../common/constants";

interface IImageAssetState {
    imageUri: string;
}

/**
 * ImageAsset component used to render all image assets
 */
export class ImageAsset extends React.Component<IAssetProps, IImageAssetState> {
    public state: IImageAssetState = { imageUri: null };
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    public async componentDidMount() {
        if (this.props.asset != null) {
            const canvas = await loadImageToCanvas(this.props.asset.path);
            this.setState({ 
                imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedThumbnailQuality),
            });
        }
    }

    public render() {
        return (
            <img ref={this.image}
                src={this.state.imageUri}
                alt={this.props.asset.name}
                onLoad={this.onLoad}
                onError={(e) => {
                    console.log(e);
                    this.props.onError(e)
                }}
                crossOrigin="anonymous" />);
    }

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.image.current);
        }
        if (this.props.onActivated) {
            this.props.onActivated(this.image.current);
        }
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.image.current);
        }
    }
}
