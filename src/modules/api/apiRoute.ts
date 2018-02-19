import {
    Request,
    Response,
    Router
}                            from 'express';
import { ServerEnvironment } from '../../serverEnvironment';
import { Logger }            from '../logger/_interface';
import { ELoggerPackageIds } from '../logger/ids';

export type ApiCallback<TBodyParams, TRouteParams, TSearchParams>
    = (req: Request & {
           body: TBodyParams,
           params: TRouteParams,
           query: TSearchParams
       },
       res: Response) => void;

type ApiMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export class ApiRoute<TRouteParams> {

    private _logger: Logger;
    private _requestHandler: Partial<Record<ApiMethod, ApiCallback<any, any, any>>> = {};
    private _frozen = false;

    constructor(private _path: string, env: ServerEnvironment) {
        this._logger = env.logger.spawn(`ApiRoute`, ELoggerPackageIds.eApi);
    }

    get<TSearchParams = {}>
    (fn: ApiCallback<{}, TRouteParams, TSearchParams>): this {
        this._setMethod('get', fn);
        return this;
    }

    post<TBodyParams = {}, TSearchParams = {}>
    (fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>): this {
        this._setMethod('post', fn);
        return this;
    }

    delete<TBodyParams = {}, TSearchParams = {}>
    (fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>): this {
        this._setMethod('delete', fn);
        return this;
    }

    patch<TBodyParams = {}, TSearchParams = {}>
    (fn: ApiCallback<TBodyParams, TRouteParams, TSearchParams>): this {
        this._setMethod('patch', fn);
        return this;
    }

    public registerOn(target: Router, prevPath: string): void {

        const routeMethods = Object.keys(this._requestHandler) as ApiMethod[];

        const methodString = routeMethods.map(method => method.toUpperCase())
                                         .join(' | ');

        this._logger.info(`Register: ${prevPath}${this._path} ( ${methodString} )`);

        for (const method of routeMethods) {
            const handler = this._requestHandler[method]!;
            target[method](this._path,
                           (req, res) => {
                               try {
                                   handler(req, res);
                               } catch (e) {
                                   this._logger.warn(
                                       `Error on ${method.toUpperCase()} ${prevPath}${this._path}`, e);
                                   throw e;
                               }
                           });
        }
    }

    private _setMethod(method: ApiMethod, fn: ApiCallback<any, any, any>) {
        if (this._requestHandler[method]) {
            throw this._logger.error(`Method already registered: ${method}`);
        }
        if (this._frozen) {
            throw this._logger.error(`already frozen`);
        }
        this._requestHandler[method] = fn;
    }
}