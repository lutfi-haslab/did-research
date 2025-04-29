import Elysia, { t } from 'elysia';
import { v4 as uuid } from 'uuid';
import { agent } from '../agent';
import { fabric } from '../lib/fabric';
import { decodeJwt, encodeJwt } from '../utils/jwtUtil';

const app = new Elysia({ prefix: '/credential' });


app.post('/verify', async ({ body: { credential } }) => {
    const vcJwt = credential.proof.jwt;
    const status = await fabric.checkStatus(vcJwt);

    if (!status.exists) {
        return { verified: false, reason: 'Credential not found in ledger' };
    }
    if (status.revoked) {
        return { verified: false, reason: 'Credential revoked' };
    }

    const result = await agent.verifyCredential({ credential: credential as any });
    return { credential, verified: result.verified, issuer: status.issuedBy };
}, {
    body: t.Object({
        credential: t.Object({
            id: t.Nullable(t.Any()),
            proof: t.Object({
                jwt: t.String()
            })
        })
    })
});

app.post('/revoke', async ({ body: { credentialJwt } }) => {
    const revoked = await fabric.revokeCredential(credentialJwt);
    return { success: revoked.revoked };
}, {
    body: t.Object({
        credentialJwt: t.String()
    })
});

export default app;