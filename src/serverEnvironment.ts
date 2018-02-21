import {
    Express,
    ExpressCfg
}                            from './modules/express/express';
import { Factory }           from './modules/factory';
import {
    Logger,
    LoggerCfg
}                            from './modules/logger/_interface';
import { ELoggerPackageIds } from './modules/logger/ids';
import { LoggerDefault }     from './modules/logger/logger';
import { LoggerTarget }      from './modules/logger/target';
import {
    MongoDbConnection,
    MongoDbConnectionCfg
}                            from './modules/mongodb/connection';
import {
    Websocket,
    WebsocketCfg
}                            from './modules/websocket/websocket';

export interface ServerCfg {
    ident: string;
    logger: LoggerCfg;
}

const defaultCfg: ServerCfg = {
    ident: '',
    logger: {
        console: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'silly'
        }
    }
};

export class ServerEnvironment {

    private _cfg: ServerCfg;
    private _factories: {
        expressApp: Factory<ExpressCfg, Express>,
        mongoDb: Factory<MongoDbConnectionCfg, MongoDbConnection>,
        websocket: Factory<WebsocketCfg, Websocket>
    };

    private _logger: Logger;

    get logger() {
        return this._logger;
    }

    constructor(cfg?: Partial<ServerCfg>) {
        this._cfg = Object.assign({},
                                  defaultCfg,
                                  cfg);

        const rootLogger = this._cfg.logger.rootLogger || new LoggerDefault('',
                                                                            ELoggerPackageIds.eRoot,
                                                                            new LoggerTarget(this._cfg.logger));

        this._logger = rootLogger.spawn(this._cfg.ident, ELoggerPackageIds.eServerEnvironment);

        this._factories = {
            expressApp:
                new Factory('Express',
                            Express,
                            ELoggerPackageIds.eExpress,
                            this),
            mongoDb:
                new Factory('MongoDb',
                            MongoDbConnection,
                            ELoggerPackageIds.eMongoDb,
                            this),
            websocket:
                new Factory('Websocket',
                            Websocket,
                            ELoggerPackageIds.eWebsocket,
                            this)
        };
    }

    createExpress(cfg: ExpressCfg): Express {
        return this._factories.expressApp.create(cfg);
    }

    createMongoDb(cfg: MongoDbConnectionCfg = {}): MongoDbConnection {
        return this._factories.mongoDb.create(cfg);
    }

    createWebsocket(cfg: WebsocketCfg): Websocket {
        return this._factories.websocket.create(cfg);
    }
}