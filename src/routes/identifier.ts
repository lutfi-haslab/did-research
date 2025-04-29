import Elysia, { t } from 'elysia';
import { agent } from '../agent';

const identifierRoute = new Elysia({ prefix: '/identifier' });

identifierRoute.post('/create', async ({ body: { alias } }) => {
  const identifier = await agent.didManagerCreate({ alias });
  return identifier;
}, {
  body: t.Object({
    alias: t.String()
  })
});

identifierRoute.get('/list', async () => {
  const identifiers = await agent.didManagerFind();
  return identifiers;
});

identifierRoute.get('/find/:alias', async ({ params }) => {
  const identifier = await agent.didManagerFind({ alias: params.alias });
  return identifier;
});

export default identifierRoute;