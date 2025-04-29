export type Identifier = {
    did: string;
    controllerKeyId: string;
    provider: string;
    services: any[];
    keys: Key[];
    alias: string;
};

export type Key = {
    kid: string;
    type: string;
    kms: string;
    publicKeyHex: string;
    meta: Meta;
};

export type Meta = {
    algorithms: string[];
};
