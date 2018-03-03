<h1 align="center">server-modules</h1>

[![CircleCI](https://img.shields.io/circleci/project/github/JohannesLamberts/server-modules/master.svg)](https://circleci.com/gh/JohannesLamberts/server-modules/tree/master)

# Features
This packages provides some easy-to-use utilities to setup a server with node.js.

- Logging (stdout, file and mail)
- MongoDB connector
- Express wrapper 
- Websocket wrapper
- API creator

# How to use

## Create a new ServerEnvironment

```typescript
import { ServerEnvironment } from 'server-modules';

// check /modules/logger/_interface.d.ts for additional options
const Server = new ServerEnvironment(
    {
        ident: 'Example-Server',
        logger: {
            console: {
                level: 'silly'
            },
            file: {
                path: './logs',
                levels: ['info', 'warn', 'error']
            }
        }
    }
);
```

## Logger

```typescript
const logger = Server.logger.spawn('my-module');
logger.info(`Logger created`);
```

## Express

```typescript
Server
    .createExpress({
        port: 8080,
        init: app => {
            /* 
            * setup app
            * this will be applied after
            * cookieParser() / bodyParser.json() / compression() / morgan()
            * the server will send a 404 status message if no route was found
            */
        }
    });
```

## API

```typescript
import { ApiSegment } from 'server-modules';

export const MyAPISegment = new ApiSegment('api');

MyAPISegment
    .addRoute<{txt:string}>('echo/:txt')
    .get((req, res) => {
        const { params } = req;
        res.send(params.txt);
    });

Server
    .createExpress({
        port: 8081,
        init: [MyAPISegment]
    });

Server
    .createExpress({
        port: 8082,
        init: app => {
            MyAPISegment.registerOn(Server.logger, app);
        }
    });
```

## Websocket

```typescript
Server
    .createWebsocket(
        {
            port: 3001,
            connection: MyWebsocketConnection
        });
```

```typescript
import { WebsocketConnection } from 'server-modules';

export class MyWebsocketConnection extends WebsocketConnection {
    init() {
        /* register event listeners */
        this._socket.on('ping', () => {
            this._socket.emit('pong');
        });
    }
}
```

## MongoDB

```typescript
const Client = Server.connectMongoDb({ auth });
Client.connect(db => {
    /* work on database or save reference to db */
});
```

```typescript
interface MongoDbConnectionCfg {
    port?: number;          // default: 27017
    host?: string;          // default: localhost
    auth?: {                // default: undefined
        database?: string;  // default: admin
        user: string;
        password: string;
    };
    options?: MongoClientOptions;   // default: {}
}
```
