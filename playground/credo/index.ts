import { Agent, ConsoleLogger, LogLevel, HttpOutboundTransport } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { AskarModule } from '@credo-ts/askar'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { IndyVdrAnonCredsRegistry, IndyVdrModule } from '@credo-ts/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'

// 1. Agent Configuration
const config = {
  label: 'CredoDemoAgent',
  walletConfig: { id: 'credo-demo-wallet', key: 'secretwalletkey' },
  logger: new ConsoleLogger(LogLevel.debug),
}

// 2. Initialize the Agent
const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ ariesAskar }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          id: 'sandbox',
          genesisTransactions: '<YOUR_GENESIS_FILE_CONTENT_HERE>',
          indyNamespace: 'sandbox',
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
      anoncreds,
    }),
  },
})

async function runDemo() {
  try {
    await agent.initialize()
    console.log('Agent initialized!')

    // 3. Create an Indy DID
    const issuerDid = await agent.dids.create({
      method: 'indy',
      options: {
        network: 'sandbox', // match your indyVdr config
        keyType: 'ed25519',
      },
    })
    console.log('Issuer DID:', issuerDid.did)

    // 4. Create a Schema
    const schemaResult = await agent.modules.anoncreds.registerSchema({
      schema: {
        attrNames: ['name', 'age', 'role'],
        issuerId: issuerDid.did,
        name: 'EmployeeID',
        version: '1.0',
      },
      options: {},
    })
    console.log('Schema ID:', schemaResult.schemaId)

    // 5. Create a Credential Definition
    const credDefResult = await agent.modules.anoncreds.registerCredentialDefinition({
      credentialDefinition: {
        issuerId: issuerDid.did,
        schemaId: schemaResult.schemaId,
        tag: 'default',
      },
      options: {},
    })
    console.log('Credential Definition ID:', credDefResult.credentialDefinitionId)

    // 6. (Optional) Create holder DID (you could skip this if issuing directly)
    const holderDid = await agent.dids.create({
      method: 'key', // Local DID; simpler for demos
      options: { keyType: 'ed25519' },
    })
    console.log('Holder DID:', holderDid.did)

    // 7. Issue Credential Offer/Request/Credential manually (Real issuing flows need Presentation Exchange, Protocols)
    console.log('Credential issuance skipped (needs full protocol setup).')

    // 8. List all DIDs
    const dids = await agent.dids.getAll()
    console.log('Wallet DIDs:', dids.map(d => d.did))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await agent.shutdown()
    // await agent.wallet.delete() -- careful! Only delete if needed.
  }
}

runDemo()