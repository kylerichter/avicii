# Avicii

Avicii Discord music bot, utilizing [Discord.js](https://discord.js.org/) and [TypeScript](https://www.typescriptlang.org/).

## Running Locally

1. Set the environment variable `DISCORD_TOKEN` to your bot token
2. Install dependencies by running `npm install`
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
