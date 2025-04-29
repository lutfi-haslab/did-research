import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import credentialRoute from "./routes/credential";
import holder from "./routes/holder";
import identifierRoute from "./routes/identifier";
import issuer from "./routes/issuer";



const app = new Elysia();

// plugin
app.use(
  swagger({
    documentation: {
      info: {
        title: "DID Documentation",
        version: "0.1.0",
      },
    },
  })
);

// routes
app.use(identifierRoute);
app.use(credentialRoute);
app.use(issuer);
app.use(holder);

app.listen(7500, ({ hostname, port }) => {
  console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  console.log(
    `🦊 Open http://${hostname}:${port}/swagger to see the API documentation`
  );
});
