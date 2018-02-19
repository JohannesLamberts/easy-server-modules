export abstract class WebsocketConnection {
    constructor(private _socket: SocketIO.Socket) {
    }

    public destroy() {
        return;
    }
}