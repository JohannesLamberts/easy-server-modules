import * as SocketIO from 'socket.io';

export abstract class WebsocketConnectorBase {

    constructor(private _socket: SocketIO.Socket) {
        this.init();
    }

    abstract init(): void;

    public destroy() {
        return;
    }

    protected on(event: string | symbol, listener: (...args: any[]) => void): this {
        this._socket.on(event, listener);
        return this;
    }

    protected emit(event: string | symbol, ...args: any[]): boolean {
        return this._socket.emit(event, ...args);
    }
}

export type WebsocketConnectorCTOR = new (socket: SocketIO.Socket) => WebsocketConnectorBase;