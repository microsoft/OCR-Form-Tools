// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { initializeIcons } from "office-ui-fabric-react";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.css";
import "./assets/css/bootstrap-theme-slate.css";
import "./index.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import createReduxStore from "./redux/store/store";
import initialState from "./redux/store/initialState";
import { IApplicationState } from "./models/applicationState";
import registerProviders from "./registerProviders";
import registerMixins from "./registerMixins";

registerMixins();
registerProviders();
const defaultState: IApplicationState = initialState;
const store = createReduxStore(defaultState, true);

let noFocusOutline = true;
document.body.classList.add("no-focus-outline");

document.body.addEventListener("mousedown", () => {
    if (!noFocusOutline) {
        noFocusOutline = true;
        document.body.classList.add("no-focus-outline");
    }
});

document.body.addEventListener("keydown", (event) => {
    if (event.keyCode === 9 && noFocusOutline) {
        noFocusOutline = false;
        document.body.classList.remove("no-focus-outline");
    }
});

initializeIcons();

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>
    , document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
