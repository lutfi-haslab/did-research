import Elysia, { t } from "elysia";
import { agent } from "../agent";
import { decodeJwt, encodeJwt } from "../utils/jwtUtil";

const app = new Elysia({ prefix: "/holder" });


app.post('/login', async ({ body: { name }, cookie: { holderAuth } }) => {
    const holder = await agent.didManagerGetByAlias({ alias: name });
    console.log('holder', holder);
    const token = encodeJwt(holder);


    holderAuth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: '/holder',
    });

    return `Holder Sign in as ${holder.alias}:${holder.did}`;
}, {
    body: t.Object({
        name: t.String()
    })
});

app.get('/profile', async ({ cookie: { holderAuth } }) => {
    if (!holderAuth.value) {
        return 'Unauthorized';
    }

    try {
        const decoded = decodeJwt(holderAuth.value);

        return {
            identity: decoded
        }
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return 'Invalid token';
    }
});

app.get('/credentials', async ({ cookie: { holderAuth } }) => {
    if (!holderAuth.value) {
        return 'Unauthorized';
    }
    const did = decodeJwt(holderAuth.value).did;
    const credentials = await agent.dataStoreORMGetVerifiableCredentialsByClaims({
        where: [{ column: 'subject', value: [did] }]
    });
    return credentials;
});

export default app;