export abstract class WebsocketConnection {

    constructor(protected _socket: SocketIO.Socket) {
        this.init();
    }

    abstract init(): void;

    public destroy() {
        return;
    }
}