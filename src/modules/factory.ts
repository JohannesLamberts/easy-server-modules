import { ServerEnvironment } from '../serverEnvironment';
import { Logger }            from './logger/_interface';

export abstract class FactoryElement<TCfg extends Object> {

    get id(): number {
        return this._id;
    }

    constructor(protected _cfg: TCfg,
                readonly _id: number,
                protected _logger: Logger) {
    }

    abstract init(): void;
}

export type FactoryElementCTOR<TCfg extends Object, TElement extends FactoryElement<{}>>
    = new (cfg: TCfg, id: number, logger: Logger) => TElement;

export class Factory<TCfg extends Object = {}, TElement extends FactoryElement<{}> = FactoryElement<{}>> {

    private _idIncrement = 0;
    private _elements: TElement[] = [];

    private _logger: Logger;

    constructor(private _ident: string,
                private _ctor: FactoryElementCTOR<TCfg, TElement>,
                private _logID: number,
                private _env: ServerEnvironment) {

        this._logger = this._env.logger.spawn('Factory', this._logID);

    }

    create(cfg: TCfg): TElement {
        const id = this._idIncrement++;
        const element = new this._ctor(cfg,
                                       id,
                                       this._logger.spawn(this._ident + `[${id}]`, this._logID));
        element.init();
        this._elements.push(element);
        return element;
    }

    remove(element: TElement) {
        this._elements = this._elements.filter(el => el !== element);
    }
}