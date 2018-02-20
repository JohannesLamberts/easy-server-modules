import {
    Application,
    Router
}                            from 'express';
import { ServerEnvironment } from '../../serverEnvironment';
import { Logger }            from '../logger/_interface';
import { ELoggerPackageIds } from '../logger/ids';
import { ApiRoute }          from './apiRoute';

export class ApiSegment {

    private _routes: string[];
    private _apiRoutes: ApiRoute<any>[];
    private _subSegments: ApiSegment[];
    private _frozen = false;

    get baseID() {
        return this._baseID;
    }

    constructor(protected _baseID: string) {
    }

    public addRoute<TRouteParams = {}>(route: string): ApiRoute<TRouteParams> {
        this._checkRegister(route);
        const newRoute = new ApiRoute<TRouteParams>(route);
        this._apiRoutes.push(newRoute);
        return newRoute;
    }

    public addSegment(segment: ApiSegment): void {
        this._checkRegister(segment.baseID);
        this._subSegments.push(segment);
    }

    public freeze() {
        this._frozen = true;
    }

    public registerOn(parentLogger: Logger, target: Application) {
        return this._registerOn(target, '', parentLogger.spawn('API', ELoggerPackageIds.eApi));
    }

    private _registerOn(target: Router,
                        prevPath: string,
                        logger: Logger): void {

        this.freeze();

        const router   = Router(),
              nextPath = prevPath + '/' + this.baseID;

        for (const segment of this._subSegments) {
            segment._registerOn(router,
                                nextPath,
                                logger.spawn(segment.baseID, ELoggerPackageIds.eApi));
        }

        for (const route of this._apiRoutes) {
            route.registerOn(router,
                             nextPath,
                             logger.spawn(route.path, ELoggerPackageIds.eApi));
        }

        target.use(
            `/${this._baseID}`,
            (req, res, next) => {
                res.header('Cache-Control', 'no-cache, no-store');
                next();
            },
            router
        );
    }

    private _checkRegister(route: string) {
        if (this._frozen) {
            throw new Error(`API is frozen`);
        }
        if (this._routes.indexOf(route) !== -1) {
            throw new Error(`Route exists: ${route}`);
        }
        this._routes.push(route);
    }
}