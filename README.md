# Avicii

Avicii Discord music bot, utilizing [Discord.js](https://discord.js.org/) and [TypeScript](https://www.typescriptlang.org/).

## Running Locally

1. Set the environment variables listed in `config.requiredEnv`
2. Install dependencies with `npm install`
3. Build the TypeScript code by running `npm run build`
4. Start and run the Discord bot with `npm start`

## Updating Secrets

Base64 encoding values:

```shell
echo -n "<value>" | base64
```

SOPS encrypting files:

```shell
cd kubernetes/secrets
sops --encrypt <file-name>.yml > <file-name>.enc.yml
```

# Prisma ORM

- `npx prisma init` - initialize Prisma
- `npx prisma migrate dev --name <migration-name>` - create schema migration
- `npx prisma migrate deploy` - deploy schema changes
- `npx prisma generate` - generate Prisma Client
- `npx prisma studio` - browse data
