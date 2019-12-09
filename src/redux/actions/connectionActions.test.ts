import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import { ActionTypes } from "./actionTypes";
import * as connectionActions from "./connectionActions";
import MockFactory from "../../common/mockFactory";
import thunk from "redux-thunk";

jest.mock("../../services/connectionService");
import ConnectionService from "../../services/connectionService";

describe("Conneciton Redux Actions", () => {
    let store: MockStoreEnhanced;

    beforeEach(() => {
        const middleware = [thunk];
        store = createMockStore(middleware)();
    });
    it("Load Connection action resolves a promise and dispatches redux action", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        const result = await connectionActions.loadConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.LOAD_CONNECTION_SUCCESS,
            payload: connection,
        });
        expect(result).toEqual(connection);
    });

    it("Save Connection action resolves a promise and dispatches redux action", async () => {
        const connectionServiceMock = ConnectionService as jest.Mocked<typeof ConnectionService>;
        connectionServiceMock.prototype.save = jest.fn((connection) => Promise.resolve(connection));

        const connection = MockFactory.createTestConnection("Connection1");
        const result = await connectionActions.saveConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SAVE_CONNECTION_SUCCESS,
            payload: connection,
        });
        expect(result).toEqual(connection);
        expect(connectionServiceMock.prototype.save).toBeCalledWith(connection);
    });

    it("Delete connection action resolves an empty promise and dispatches redux action", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        await connectionActions.deleteConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.DELETE_CONNECTION_SUCCESS,
            payload: connection,
        });
    });
});
