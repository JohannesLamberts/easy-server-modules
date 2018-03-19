import {
    createServer,
    Server as HttpServer
}                         from 'http';
import { FactoryElement } from '../factory';
import {
    WebsocketConnectorBase,
    WebsocketConnectorCTOR
}                         from './connection';
import * as SocketIO from 'socket.io';

export interface WebsocketCfg {
    port: number;
    connection: WebsocketConnectorCTOR | WebsocketConnectorCTOR[];
}

function makeArray<T>(val: T | T[]): T[] {
    return Array.isArray(val)
        ? val
        : [val];
}

export class Websocket extends FactoryElement<WebsocketCfg> {

    private _httpServer: HttpServer;
    private _io: SocketIO.Server;
    private _connections: WebsocketConnectorBase[] = [];

    init() {
        this._httpServer = createServer();
        this._httpServer.listen(this._cfg.port);

        this._io = SocketIO.listen(this._httpServer);

        const adr = this._httpServer.address();

        this._logger.info(`listening on ${adr.address}:${adr.port}`);

        this._io.on('connection', (socket: SocketIO.Socket) => {
            const connectionArr = makeArray(this._cfg.connection).map(ctor => new ctor(socket));
            this._connections.push(...connectionArr);
            this._logger.debug(`+ on  ${socket.id} (${this._connections.length} connections)`);
            socket.on('disconnect', () => {
                connectionArr.forEach(connection => connection.destroy());
                this._connections = this._connections
                                        .filter(connectionEl => connectionArr.indexOf(connectionEl) === -1);
                this._logger.debug(`- off ${socket.id} (${this._connections.length} connections)`);
            });
        });
    }
}