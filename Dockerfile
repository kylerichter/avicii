# ---- Base Image ----
FROM node:21-alpine AS base

WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies

COPY package.json package-lock.json prisma ./
RUN apk add --no-cache --update python3 make g++ \
    && ln -sf python3 /usr/bin/python \
    && npm install

# ---- Copy Files & Build ----
FROM dependencies AS build

COPY . .
RUN npm run build && rm -rf ./src

# ---- Remove devDependencies ----
FROM build AS pre-release

RUN rm -rf ./node_modules && npm install --production

# ---- Release ----
FROM base AS release

RUN apk add --no-cache --update python3 \
    && ln -sf python3 /usr/bin/python

COPY --from=pre-release /app .

ENV NODE_ENV=production

CMD ["npm", "start"]
