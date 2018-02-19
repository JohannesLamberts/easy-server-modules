import * as path               from 'path';
import {
    Logger as WinstonLogger,
    LoggerInstance,
    LoggerOptions,
    transports
}                              from 'winston';
import {
    LoggerCfg,
    LogLevel,
    LogLevels
}                              from './_interface';
import { LoggerTransportMail } from './mailer';

export class LoggerTarget {

    private _winston: LoggerInstance;

    constructor(private _cfg: LoggerCfg) {

        const opts: LoggerOptions = {};

        if (this._cfg.mail) {
            opts.transports = [
                new LoggerTransportMail(this._cfg.mail)
            ];
        }

        this._winston = new WinstonLogger(opts);

        if (this._cfg.console) {
            this._winston
                .add(transports.Console,
                     {
                         colorize: true,
                         name: 'console',
                         timestamp: true,
                         level: this._cfg.console.level
                     });
        }

        if (this._cfg.file) {
            for (const level of this._cfg.file.levels) {
                this._winston
                    .add(transports.File,
                         {
                             name: `${level}-file`,
                             filename: path.join(this._cfg.file.path, `${level}.log`),
                             json: false,
                             level: level
                         }
                    );
            }
        }
    }

    log(level: LogLevel, message: string, data: Object | undefined, logId: number): boolean {

        const { filter } = this._cfg;

        if (filter) {
            let log = filter.mode === 'exclude';
            for (let idElement of filter.ids) {
                if (typeof idElement === 'number') {
                    if (idElement === logId) {
                        log = !log; // false if mode === exclude, true if mode === include
                        break;
                    }
                } else {
                    if (idElement.id === logId) {
                        log = LogLevels.indexOf(level) >= LogLevels.indexOf(idElement.threshold);
                        break;
                    }
                }
            }
            if (!log) {
                return false;
            }
        }

        this._winston.log(level, `[${logId}] ~ ${message}`, data);
        return true;
    }
}