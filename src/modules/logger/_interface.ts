export type LogLevel = 'off' | 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error';
export const LogLevels: LogLevel[] = ['off', 'silly', 'debug', 'verbose', 'info', 'warn', 'error'];

export interface LoggerTranspotMailCfg {
    level: LogLevel;
    from: string;
    subject: string;
    targets: {
        level: LogLevel;
        to: string[];
        ids?: number[];
        subject?: string;
    }[];
    transport: {
        auth: {
            user: string;
            pass: string;
        },
        host: string;
        port: number;
        secure: boolean;
    }
}

export interface LoggerStream {
    write: (message: string) => void;
}

export interface LoggerCfg {
    rootLogger?: Logger,
    console: {
        level: LogLevel
    },
    file?: {
        path: string;
        levels: LogLevel[]
    },
    filter?: {
        mode: 'include' | 'exclude'
        ids: Array<number | { threshold: LogLevel; id: number; }>
    }
    mail?: LoggerTranspotMailCfg
}

export interface Logger {
    extendName: (name: string) => void;
    error: (message: string, meta?: Object, id?: number) => Error;
    warn: (message: string, meta?: Object, id?: number) => Error;
    info: (message: string, meta?: Object, id?: number) => void;
    verbose: (message: string, meta?: Object, id?: number) => void;
    debug: (message: string, meta?: Object, id?: number) => void;
    silly: (message: string, meta?: Object, id?: number) => void;
    log: (level: LogLevel, message: string, meta?: Object, id?: number) => void;
    stream: (level: LogLevel) => LoggerStream
    spawn: (name: string, id: number) => Logger
}