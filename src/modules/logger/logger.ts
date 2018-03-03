import {
    Logger,
    LoggerStream,
    LogLevel
} from './_interface';
import { LoggerTarget } from './target';

export class LoggerDefault implements Logger {

    constructor(private _name: string,
                private _id: number,
                private _target: LoggerTarget) {
    }

    extendName(name: string) {
        this._name += name;
    }

    error(message: string, meta?: Object, id?: number): Error {
        this.log('error', message, meta, id);
        return new Error(message);
    }

    warn(message: string, meta?: Object, id?: number): Error {
        this.log('warn', message, meta, id);
        return new Error(message);
    }

    info(message: string, meta?: Object, id?: number): void {
        this.log('info', message, meta, id);
    }

    verbose(message: string, meta?: Object, id?: number): void {
        this.log('verbose', message, meta, id);
    }

    debug(message: string, meta?: Object, id?: number): void {
        this.log('debug', message, meta, id);
    }

    silly(message: string, meta?: Object, id?: number): void {
        this.log('silly', message, meta, id);
    }

    log(level: LogLevel, message: string, meta: Object | undefined, id?: number): void {
        this._target
            .log(level, `${this._name} :: ${message}`, meta, id === undefined ? this._id : id);
    }

    stream(level: LogLevel): LoggerStream {
        return {
            write: (message: string) => this.log(level, message, undefined)
        };
    }

    spawn(name: string, id?: number): LoggerDefault {
        const nextName = this._name ? this._name + '/' + name : name;
        return new LoggerDefault(nextName, id || 0, this._target);
    }
}