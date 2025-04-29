import Elysia, { t } from 'elysia';
import { v4 as uuid } from 'uuid';
import { agent } from '../agent';
import { fabric } from '../lib/fabric';
import { decodeJwt, encodeJwt } from '../utils/jwtUtil';

const app = new Elysia({ prefix: '/issuer' });

app.post('/login', async ({ body: { name }, cookie: { issuerAuth } }) => {
    const issuer = await agent.didManagerGetByAlias({ alias: name });
    console.log('issuer', issuer);
    const token = encodeJwt(issuer);


    issuerAuth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: '/issuer',
    });

    return `Issuer Sign in as ${issuer.alias}:${issuer.did}`;
}, {
    body: t.Object({
        name: t.String()
    })
});

app.get('/profile', async ({ cookie: { issuerAuth } }) => {
    if (!issuerAuth.value) {
        return 'Unauthorized';
    }

    try {
        const decoded = decodeJwt(issuerAuth.value);

        return {
            identity: decoded
        }
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return 'Invalid token';
    }
});

app.post('/issue', async ({ body: { subjectDid, name, course }, cookie: { issuerAuth } }) => {
    if (!issuerAuth.value) {
        return 'Unauthorized';
    }
    const profile = decodeJwt(issuerAuth.value);

    if (!profile) {
        return 'Invalid token';
    }

    console.log('Profile', profile);

    const credentialSubjectId = `did:document:${uuid()}`;

    const credential = await agent.createVerifiableCredential({
        credential: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: { id: profile.did },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: subjectDid,
                docId: credentialSubjectId,
                name,
                course,
            }
        },
        proofFormat: 'jwt',
    });

    await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: credential });

    // Anchor VC hash in simulated Fabric ledger
    await fabric.registerIssuer(profile.did, profile.alias);
    await fabric.anchorCredential(credential.proof.jwt, profile.did);

    return credential;
}, {
    body: t.Object({
        subjectDid: t.String(),
        name: t.String(),
        course: t.String()
    })
});


export default app;