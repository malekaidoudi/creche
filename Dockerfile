# Dockerfile pour déployer le backend sur Railway
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json du backend
COPY backend/package*.json ./

# Installer les dépendances (toutes pour éviter les problèmes)
RUN npm ci

# Copier le code source du backend
COPY backend/ ./

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage
CMD ["npm", "start"]
