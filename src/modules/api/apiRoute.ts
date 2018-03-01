import {
    NextFunction,
    Request,
    Response,
    Router
}                 from 'express';
import { Logger } from '../logger/_interface';

export type ApiCallback<TBodyParams, TRouteParams, TSearchParams>
    = (req: Request & {
           body: TBodyParams,
           params: TRouteParams,
           query: TSearchParams
       },
       res: Response,
       next: NextFunction) => void;

type ApiMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export class ApiRoute<TRouteParams> {

    private _requestHandler: Partial<Record<ApiMethod, ApiCallback<any, any, any>[]>> = {};
    private _frozen = false;

    get path(): string {
        return this._path;
    }

    constructor(private _path: string) {
    }

    get<TSearchParams = {}>
    (...fn: ApiCallback<{}, TRouteParams, TSearchParams>[]): this {
        this._setMethod('get', ...fn);
        return this;
    }

    post<TBodyParams = {}, TSearchParams = {}>
    (...fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>[]): this {
        this._setMethod('post', ...fn);
        return this;
    }

    put<TBodyParams = {}, TSearchParams = {}>
    (...fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>[]): this {
        this._setMethod('put', ...fn);
        return this;
    }

    delete<TBodyParams = {}, TSearchParams = {}>
    (...fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>[]): this {
        this._setMethod('delete', ...fn);
        return this;
    }

    patch<TBodyParams = {}, TSearchParams = {}>
    (...fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>[]): this {
        this._setMethod('patch', ...fn);
        return this;
    }

    public registerOn(target: Router,
                      prevPath: string,
                      logger: Logger): void {

        const routeMethods = Object.keys(this._requestHandler) as ApiMethod[];

        const methodString = routeMethods.map(method => method.toUpperCase())
                                         .join(' | ');

        logger.info(`Register: ${prevPath}${this._path} ( ${methodString} )`);

        for (const method of routeMethods) {
            target[method](
                this._path,
                ...this._requestHandler[method]!
                    .map((handler: ApiCallback<any, any, any>) =>
                             (req: Request, res: Response, next: NextFunction) => {
                                 try {
                                     handler(req, res, next);
                                 } catch (e) {
                                     logger.warn(`Error on ${method.toUpperCase()} ${prevPath}${this._path}`,
                                                 e);
                                     throw e;
                                 }
                             }
                    ));
        }
    }

    private _setMethod(method: ApiMethod, ...fn: ApiCallback<any, any, any>[]) {
        if (this._requestHandler[method]) {
            throw new Error(`Method already registered: ${method}`);
        }
        if (this._frozen) {
            throw new Error(`already frozen`);
        }
        this._requestHandler[method] = fn;
    }
}