// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { reducer } from "./appTitleReducer";
import { setTitleAction } from "../actions/appTitleActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("AppTitle Reducer", () => {
    let state: string;

    beforeEach(() => {
        state = "Welcome";
    });

    it("SetTitle discard previous state and return a title", () => {
        const title = "Hello";
        const action = setTitleAction(title);

        const result = reducer(state, action);
        expect(result).not.toEqual(state);
        expect(result).toEqual(title);
    });

    it("Unknown action performs noop", () => {
        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
