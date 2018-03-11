import {
    ChangeStream,
    Collection,
    ObjectID
}                                 from 'mongodb';
import { WebsocketConnectorBase } from './connection';

export const websocketConnectorMongoDbWatch = (props: {
    getCollection: (collectionName: string) => Collection
}): WebsocketConnectorBase => {

    const { getCollection } = props;

    return class extends WebsocketConnectorBase {

        private _changeStreams: Record<string, ChangeStream> = {};
        private _subscriptions: Record<string, Function> = {};

        public init(): this {

            this.on('db.subscribe', (collections: string[]) => {
                for (const collectionName of collections) {
                    if (!this._subscriptions[collectionName]) {
                        const cb = (update: {
                            operationType: string;
                            documentKey: {
                                _id: ObjectID
                            }
                        }) => {
                            this.emit('db.next', {
                                collection: collectionName,
                                operationType: update.operationType,
                                _id: update.documentKey._id
                            });
                        };
                        this._changeStream(collectionName).on('change', cb);
                        this._subscriptions[collectionName] = cb;
                    }
                }
            });

            return this;
        }

        public destroy() {
            this._dbUnsubscribe(Object.keys(this._subscriptions));
            return;
        }

        private _changeStream(collectionName: string): ChangeStream {
            if (!this._changeStreams[collectionName]) {
                this._changeStreams[collectionName] = getCollection(collectionName).watch();
            }
            return this._changeStreams[collectionName];
        }

        private _dbUnsubscribe(collectionNames: string[]) {
            for (const collectionName of collectionNames) {
                const cb = this._subscriptions[collectionName];
                if (cb) {
                    this._changeStream(collectionName).removeListener('change', cb as () => void);
                    delete this._subscriptions[collectionName];
                }
            }
        }
    } as any;
};