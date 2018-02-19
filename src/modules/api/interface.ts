import { Router }            from 'express';
import { ServerEnvironment } from '../../serverEnvironment';
import { Logger }            from '../logger/_interface';
import { ELoggerPackageIds } from '../logger/ids';

export abstract class ApiSegment {

    protected _logger: Logger;

    get baseID() {
        return this._baseID;
    }

    constructor(protected _baseID: string,
                protected _env: ServerEnvironment) {
        this._logger = this._env.logger.spawn(`ApiSegment ${this._baseID}`, ELoggerPackageIds.eApi);
    }

    public abstract registerOn(app: Router, prevPath?: string): void;
}
