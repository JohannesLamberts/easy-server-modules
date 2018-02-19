import * as bodyParser    from 'body-parser';
import * as compression   from 'compression';
import * as cookieParser  from 'cookie-parser';
import * as express       from 'express';
import {
    Application,
    Request,
    Response
}                         from 'express';
import * as http          from 'http';
import * as morgan        from 'morgan';
import { ApiSegment }     from '../../';
import { FactoryElement } from '../factory';
import { LogLevel }       from '../logger/_interface';
import { EHttpState }     from './httpState';

export interface ExpressCfg {
    port: number;
    init: ((app: Application) => void) | ApiSegment[];
    setup?: {
        defaultHeaders?: Record<string, string>;
        morgan?: {
            format: string | morgan.FormatFn;
            logLevel: LogLevel
        }
    }

}

const defaultSetup: ExpressCfg['setup'] = {
    defaultHeaders: {},
    morgan: {
        format: process.env.NODE_ENV === 'production' ? 'tiny' : 'dev',
        logLevel: 'verbose'
    }
};

export class Express extends FactoryElement<ExpressCfg> {

    private _app: Application = express();

    init() {
        const setup: ExpressCfg['setup']
                  = Object.assign(defaultSetup, this._cfg.setup || {});

        const { morgan: MorganSetup, defaultHeaders } = setup;

        this._app.use(cookieParser());
        this._app.use(bodyParser.json());
        this._app.use(compression());

        if (MorganSetup) {
            this._app
                .use(morgan(
                    MorganSetup.format as any,
                    {
                        stream: this._logger.stream(MorganSetup.logLevel)
                    }));
        }

        if (defaultHeaders) {
            this._app
                .use((req, res, next) => {
                    for (const header of Object.keys(defaultHeaders)) {
                        res.header(header, defaultHeaders[header]);
                    }
                    next();
                });
        }

        if (typeof this._cfg.init === 'function') {
            this._cfg.init(this._app);
        } else {
            for (const apiSegment of this._cfg.init) {
                apiSegment.registerOn(this._app);
            }
        }

        this._app
            .get('*',
                 (req: Request, res: Response) => {
                     res.sendStatus(EHttpState.eNotFound);
                 });

        const httpServer
                  = http.createServer(this._app)
                        .listen(this._cfg.port);

        const adr = httpServer.address();
        this._logger.info(`HTTP Server listening on http://${adr.address}:${adr.port}`);
    }
}