# Utilisation d'une image Node.js officielle LTS
FROM node:18-alpine

# Métadonnées
LABEL maintainer="Sam050803"
LABEL description="Serveur MCP Thaïs - Gestion Hôtelière"
LABEL version="1.0.0"

# Installation des dépendances système
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Création de l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installation des dépendances en mode production
RUN npm ci --only=production && \
    npm cache clean --force

# Copie du code source
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Suppression des sources TypeScript (sécurité)
RUN rm -rf src/ tsconfig.json

# Création du dossier de logs
RUN mkdir -p /app/logs && \
    chown -R mcp:nodejs /app

# Changement vers utilisateur non-root
USER mcp

# Exposition du port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Point d'entrée avec dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Commande par défaut
CMD ["node", "build/index.js", "--http"]