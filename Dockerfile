# ---- Base Image ----
FROM node:21-alpine AS base

WORKDIR /app

RUN apk add --no-cache --update python3 make g++ \
    && ln -sf python3 /usr/bin/python

# ---- Dependencies ----
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm install

# ---- Copy Files & Build ----
FROM dependencies AS build

COPY . .
RUN npm run build && rm -rf ./src

# ---- Remove devDependencies ----
FROM build as pre-release

RUN rm -rf ./node_modules && npm install --production --ignore-scripts --prefer-offline

# ---- Release ----
FROM base AS release

COPY --from=pre-release /app .

ENV NODE_ENV production

CMD ["npm", "start"]
