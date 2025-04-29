// This only mean to Emulate Chaincode Hyperledger Fabric

import { Database } from "bun:sqlite";
import { createHash } from 'crypto';

const db = new Database('fabric-sim.db');

type CredentialRecord = {
    hash: string
    revoked: number
    issuedBy: string
    issuedAt: string
}


// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS issuers (
    did TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS credentials (
    hash TEXT PRIMARY KEY,
    revoked INTEGER DEFAULT 0,
    issuedBy TEXT,
    issuedAt TEXT
  );
`);

// Helpers
const sha256 = (input: string) =>
    createHash('sha256').update(input).digest('hex');

export const fabric = {
    registerIssuer: (did: string, name: string) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO issuers VALUES (?, ?)');
        stmt.run(did, name);
        return { success: true };
    },

    anchorCredential: (vcJwt: string, issuerDid: string) => {
        const hash = sha256(vcJwt);
        const exists = db.prepare('SELECT * FROM issuers WHERE did = ?').get(issuerDid);
        if (!exists) throw new Error('Issuer not registered');

        const stmt = db.prepare(
            'INSERT OR IGNORE INTO credentials (hash, issuedBy, issuedAt) VALUES (?, ?, ?)'
        );
        stmt.run(hash, issuerDid, new Date().toISOString());
        return { hash };
    },

    revokeCredential: (vcJwt: string) => {
        const hash = sha256(vcJwt);
        const stmt = db.prepare('UPDATE credentials SET revoked = 1 WHERE hash = ?');
        const result = stmt.run(hash);
        return { hash, revoked: result.changes > 0 };
    },

    checkStatus: (vcJwt: string) => {
        const hash = sha256(vcJwt);
        const cred = db.prepare('SELECT * FROM credentials WHERE hash = ?').get(hash) as CredentialRecord | undefined;;
        if (!cred) return { exists: false };
        return { exists: true, revoked: !!cred.revoked, issuedBy: cred.issuedBy };
    }
};