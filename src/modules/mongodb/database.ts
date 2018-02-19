import {
    Collection,
    Db
}                 from 'mongodb';
import { Logger } from '../logger/_interface';

export class MongoDbDatabaseWrapper {

    private _collections: Record<string, {
        mongoCollection: Collection
    }>;

    constructor(private _db: Db,
                private _logger: Logger) {
    }

    collection(name: string): Collection {
        if (!this._collections[name]) {
            this._collections[name] = {
                mongoCollection: this._db.collection(name)
            };
        }
        return this._collections[name].mongoCollection;
    }
}