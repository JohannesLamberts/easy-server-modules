import { exec }                   from 'child_process';
import {
    MongoClient,
    MongoClientOptions
}                                 from 'mongodb';
import * as path                  from 'path';
import { FactoryElement }         from '../factory';
import { ELoggerPackageIds }      from '../logger/ids';
import { MongoDbDatabaseWrapper } from './database';

export interface MongoDbConnectionCfg {
    port?: number;
    host?: string;
    auth?: {
        database?: string;
        user: string;
        password: string;
    };
    options?: MongoClientOptions;
}

export class MongoDbConnection extends FactoryElement<MongoDbConnectionCfg> {

    private _connectString = 'mongodb://';
    private _client: MongoClient;

    private _dbCache: Record<string, MongoDbDatabaseWrapper>;

    init() {
        const { auth, host, port } = this._cfg;
        if (auth) {
            this._connectString += auth.user + ':' + auth.password;
        }
        this._connectString += (host || 'localhost') + ':' + (port || 27017);
        if (auth && auth.database) {
            this._connectString += '/' + auth.database;
        }
        this._logger.extendName(` @${host}:${port}`);
    }

    connect() {
        this._logger.info('... Connecting');
        return MongoClient
            .connect(this._connectString, this._cfg.options)
            .then(mongo => {
                this._logger.info('Connected');
                this._client = mongo;
                // this._db = mongo.db(this._dbName);
            });
    }

    database(name: string): MongoDbDatabaseWrapper {
        if (!this._dbCache[name]) {
            this._dbCache[name] = new MongoDbDatabaseWrapper(this._client.db(name),
                                                             this._logger.spawn(name,
                                                                                ELoggerPackageIds.eMongoDbDatabase));
        }
        return this._dbCache[name];
    }

    databaseDump(name: string, toPath: string): Promise<string> {

        const args = [`--db ${name}`,
                      `--out ${toPath}`,
                      `--gzip`];

        if (this._cfg.auth) {
            args.push(`--username ${this._cfg.auth.user}`,
                      `--password ${this._cfg.auth.password}`);
            if (this._cfg.auth.database) {
                args.push(`--authenticationDatabase ${this._cfg.auth.database}`);
            }
        }

        const cmd = `mongodump ${args.join(' ')}`;

        this._logger.info(`Executing mongodump for ${name} to ${toPath}`);

        return new Promise<string>((resolve, reject) => {
            exec(cmd, (err, stdout) => {
                if (err) {
                    this._logger.error(`mongodump for ${name} to ${toPath} failed`, err);
                    return reject(err);
                }
                resolve(stdout);
            });
        });
    }

    databaseRestore(name: string, fromPath: string, dropBefore: boolean = false): Promise<string> {

        return (dropBefore
            ? (this._client
                   .db(name)
                   .dropDatabase()
                   .catch(e => {
                       this._logger.error(`databaseRestore for ${name} failed: couldn't drop datbase`);
                       throw e;
                   }))
            : Promise.resolve())

            .then(() => {

                const args = [`--db ${name} ${path.join(fromPath, name)}`,
                              `--gzip`];

                if (this._cfg.auth) {
                    args.push(`--username ${this._cfg.auth.user}`,
                              `--password ${this._cfg.auth.password}`);
                    if (this._cfg.auth.database) {
                        args.push(`--authenticationDatabase ${this._cfg.auth.database}`);
                    }
                }

                const cmd = `mongorestore ${args.join(' ')}`;

                this._logger.info(`Executing mongorestore for ${name} from ${fromPath}`);

                return new Promise<string>((resolve, reject) => {
                    exec(cmd, (err, stdout) => {
                        if (err) {
                            this._logger.error(`mongorestore for ${name} from ${fromPath} failed`, err);
                            return reject(err);
                        }
                        return resolve(stdout);
                    });
                });
            });
    }
}