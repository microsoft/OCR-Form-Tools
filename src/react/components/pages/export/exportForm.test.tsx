import React from "react";
import ExportForm, { IExportFormProps, IExportFormState } from "./exportForm";
import { mount } from "enzyme";
import { IExportFormat } from "../../../../models/applicationState";
import { ExportAssetState } from "../../../../providers/export/exportProvider";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../providers/export/exportProviderFactory");
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";
import { IVottJsonExportProviderOptions } from "../../../../providers/export/vottJson";

describe("Export Form Component", () => {
    const exportProviderRegistrations = MockFactory.createExportProviderRegistrations();

    function createComponent(props: IExportFormProps) {
        return mount(
            <ExportForm {...props} />,
        );
    }

    beforeAll(() => {
        Object.defineProperty(ExportProviderFactory, "providers", {
            get: jest.fn(() => exportProviderRegistrations),
        });
        Object.defineProperty(ExportProviderFactory, "defaultProvider", {
            get: jest.fn(() => exportProviderRegistrations[0]),
        });
    });

    const onSubmitHandler = jest.fn();

    it("State is initialized without export settings", () => {
        const defaultExportType = "vottJson";
        const props: IExportFormProps = {
            settings: null,
            onSubmit: onSubmitHandler,
        };

        const wrapper = createComponent(props);
        expect(wrapper.find(ExportForm).exists()).toBe(true);

        const state = wrapper.find(ExportForm).state() as IExportFormState;
        expect(state.providerName).toEqual(defaultExportType);
        expect(state.formData).not.toBeNull();
        expect(state.formSchema).not.toBeNull();
        expect(state.uiSchema).not.toBeNull();
    });

    it("State is initialized with export settings", () => {
        const props: IExportFormProps = {
            settings: {
                providerType: "vottJson",
                providerOptions: {
                    assetState: ExportAssetState.Tagged,
                    includeImages: true,
                },
            },
            onSubmit: onSubmitHandler,
        };

        const wrapper = createComponent(props);
        expect(wrapper.find(ExportForm).exists()).toBe(true);

        const state = wrapper.find(ExportForm).state() as IExportFormState;
        expect(state.providerName).toEqual(props.settings.providerType);
        expect(state.formData).toEqual(props.settings);
        expect(state.formSchema).not.toBeNull();
        expect(state.uiSchema).not.toBeNull();
    });

    it("Form renders correctly", () => {
        const props: IExportFormProps = {
            settings: {
                providerType: "vottJson",
                providerOptions: {
                    assetState: ExportAssetState.Tagged,
                },
            },
            onSubmit: onSubmitHandler,
        };

        const wrapper = createComponent(props);

        expect(wrapper.find("form").exists()).toBe(true);
        expect(wrapper.find("select").exists()).toBe(true);
        expect(wrapper.find(`button[type="submit"]`).exists()).toBe(true);
    });

    it("Calls submit handler when form is submitted", (done) => {
        const jsonExportProviderOptions: IVottJsonExportProviderOptions = {
            assetState: ExportAssetState.Visited,
            includeImages: true,
        };

        const defaultExportSettings: IExportFormat = {
            providerType: "vottJson",
            providerOptions: jsonExportProviderOptions,
        };

        const props: IExportFormProps = {
            settings: null,
            onSubmit: onSubmitHandler,
        };

        const wrapper = createComponent(props);
        wrapper.find("form").simulate("submit");

        setImmediate(() => {
            expect(onSubmitHandler).toBeCalledWith(defaultExportSettings);
            done();
        });
    });
});
