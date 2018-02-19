import { Router }     from 'express';
import { ApiRoute }   from './apiRoute';
import { ApiSegment } from './interface';

export class ApiSegmentDefault extends ApiSegment {

    private _routes: string[];
    private _apiRoutes: ApiRoute<any>[];
    private _subSegments: ApiSegment[];

    private _frozen = false;

    public addRoute<TRouteParams = {}>(route: string): ApiRoute<TRouteParams> {
        this._checkRegister(route);
        const newRoute = new ApiRoute<TRouteParams>(route, this._env);
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

    public registerOn(target: Router, prevPath: string = ''): void {

        this.freeze();

        const router   = Router(),
              nextPath = prevPath + '/' + this.baseID;

        for (const segment of this._subSegments) {
            segment.registerOn(router, nextPath);
        }

        for (const route of this._apiRoutes) {
            route.registerOn(router, nextPath);
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
            throw this._logger.error(`API is frozen`);
        }
        if (this._routes.indexOf(route) !== -1) {
            throw this._logger.error(`Route exists: ${route}`);
        }
        this._routes.push(route);
    }
}