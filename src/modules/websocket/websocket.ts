import {
    createServer,
    Server as HttpServer
}                              from 'http';
import { listen }              from 'socket.io';
import { FactoryElement }      from '../factory';
import { WebsocketConnection } from './connection';

export interface WebsocketCfg {
    port: number;
    connection: new (socket: SocketIO.Socket) => WebsocketConnection;
}

export class Websocket extends FactoryElement<WebsocketCfg> {

    private _httpServer: HttpServer;
    private _io: SocketIO.Server;
    private _connections: WebsocketConnection[] = [];

    init() {
        this._httpServer = createServer();
        this._httpServer.listen(this._cfg.port);

        this._io = listen(this._httpServer);

        const adr = this._httpServer.address();

        this._logger.info(`listening on ${adr.address}:${adr.port}`);

        this._io.on('connection', (socket: SocketIO.Socket) => {
            const connection = new this._cfg.connection(socket);
            this._connections.push(connection);
            this._logger.debug(`+ on  ${socket.id} (${this._connections.length} connections)`);
            socket.on('disconnect', () => {
                connection.destroy();
                this._connections = this._connections
                                        .filter(connectionEl => connectionEl !== connection);
                this._logger.debug(`- off ${socket.id} (${this._connections.length} connections)`);
            });
        });
    }
}