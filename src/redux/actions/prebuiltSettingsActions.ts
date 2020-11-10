import {Dispatch} from "redux";
import {IPrebuiltSettings} from "../../models/applicationState";
import {createPayloadAction, IPayloadAction} from "./actionCreators";
import {ActionTypes} from "./actionTypes";


export default interface IAppPrebuiltSettingsActions {
    update(setting: IPrebuiltSettings): void;
}

export function update(setting: IPrebuiltSettings): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(updatePrebuiltSettingsAction(setting));
    }
}

export interface IUpdatePrebuiltSettingsAction extends IPayloadAction<string, IPrebuiltSettings> {
    type: ActionTypes.UPDATE_PREBUILT_SETTINGS;
}

const updatePrebuiltSettingsAction = createPayloadAction<IUpdatePrebuiltSettingsAction>(ActionTypes.UPDATE_PREBUILT_SETTINGS);
