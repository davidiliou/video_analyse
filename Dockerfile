# —— Build SPA (sans Electron) ——
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

# Retire Electron et plugins associés (inutiles / trop lourds pour l’image Docker).
RUN npm pkg delete \
      devDependencies.electron \
      devDependencies.electron-builder \
      devDependencies.vite-plugin-electron \
      devDependencies.vite-plugin-electron-renderer \
    && npm install

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src

ENV WEB_ONLY=1
RUN npm run build:web

# —— API + fichiers statiques ——
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8087
ENV DATA_DIR=/data
ENV STATIC_DIR=/app/dist

RUN npm init -y >/dev/null && npm install --omit=dev express@4.21.2

COPY --from=build /app/dist ./dist
COPY server ./server

VOLUME ["/data"]
EXPOSE 8087

CMD ["node", "server/index.mjs"]
