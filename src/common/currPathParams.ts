import { matchPath } from "react-router-dom";


export const getPathParams = (path: string, param: string) => {
    const matchUrl = matchPath(path, {
      path: `/projects/:${param}`,
    });
    return (matchUrl && matchUrl.params) || {};
}
