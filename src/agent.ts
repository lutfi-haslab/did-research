// agent.ts
import {
    createAgent,
    type ICredentialPlugin,
    type IDataStore,
    type IDataStoreORM,
    type IDIDManager,
    type IKeyManager,
    type IResolver,
} from '@veramo/core'
import { DataStore, DataStoreORM } from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { KeyDIDProvider } from '@veramo/did-provider-key'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getResolver as keyDidResolver } from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DataSource } from 'typeorm'
import {
    KeyStore,
    DIDStore,
    PrivateKeyStore,
    migrations,
    Entities,
} from '@veramo/data-store'
import type { AgentRouterOptions } from '@veramo/remote-server'

const KMS_SECRET_KEY = 'd596709c76fabeaf5d5ee75dc806692bef88b80211e0c0db8b051dd01c047994'

export const dbConnection = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: false,
    migrations,
    migrationsRun: true,
    logging: ['error', 'info', 'warn'],
    entities: Entities,
})

await dbConnection.initialize()

export const agent = createAgent<
    IDIDManager & IKeyManager & IDataStore & IDataStoreORM & ICredentialPlugin & IResolver & AgentRouterOptions
>({
    plugins: [
        new KeyManager({
            store: new KeyStore(dbConnection),
            kms: {
                local: new KeyManagementSystem(
                    new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY)),
                ),
            },
        }),
        new DIDManager({
            store: new DIDStore(dbConnection),
            defaultProvider: 'did:key',
            providers: {
                'did:key': new KeyDIDProvider({
                    defaultKms: 'local',
                }),
            },
        }),
        new CredentialPlugin(),
        new DIDResolverPlugin({
            resolver: new Resolver({
                ...keyDidResolver(),
            }),
        }),
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
    ],
})