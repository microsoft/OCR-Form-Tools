import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

/**
 * return a middleware that send custom event to AppInsights tracking redux action
 */
export function createAppInsightsLogger(): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: any) => {
        return next(action);
    };
}
