import { createTransport }               from 'nodemailer';
import * as Mail                         from 'nodemailer/lib/mailer';
import { debounce }                      from 'throttle-debounce';
import { Transport as WinstonTransport } from 'winston';
import {
    LoggerTranspotMailCfg,
    LogLevel
}                                        from './_interface';

export class LoggerTransportMail extends WinstonTransport {

    private _buffer: {
        level: LogLevel;
        message: string;
        id?: number;
    }[] = [];

    private _mailer: Mail;

    constructor(private _cfg: LoggerTranspotMailCfg, debounceTime: number | false = 60000) {
        super({
                  name: 'logger-mail',
                  level: _cfg.level
              });

        this._mailer = createTransport(this._cfg.transport);

        if (debounceTime) {
            this.sendDebounced = debounce(debounceTime,
                                          false,
                                          this.sendDebounced.bind(this));
        }
    }

    log(level: LogLevel, message: string) {

        const searchID = message.match(/^\[(\d+)] ~ /); // finds 123 in '[123] ~ MESSAGE'
        const ID = searchID ? parseInt(searchID[1], 10) : undefined;

        this._buffer
            .push({
                      level: level,
                      message: `${new Date().toISOString()} - ${level}: ${message}`,
                      id: ID
                  });

        this.sendDebounced();
    }

    sendDebounced() {

        const bufferCopy = this._buffer.slice();

        Promise
            .all(this._cfg.targets.map(target => {

                const lines: string[]
                          = this._buffer
                                .filter(el => {
                                    if (!target.ids) {
                                        return true;
                                    }
                                    if (!el.id) {
                                        return false;
                                    }
                                    return target.ids.indexOf(el.id) !== -1;
                                })
                                .map(value => value.message);

                return this._mailer
                           .sendMail(
                               {
                                   from: this._cfg.from,
                                   bcc: target.to.join(', '),
                                   subject: target.subject || this._cfg.subject,
                                   text: lines.join('\n')
                               });
            }))
            .then(() => {
                // delete all elements that have been sent
                this._buffer = this._buffer
                                   .filter(el => bufferCopy.indexOf(el) === -1);
            })
            .catch(() => {
                throw new Error(`Logger couldn't send mail. Please check your configuration`);
            });
    }
}