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

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Railway fournit automatiquement la variable PORT
# Exposer le port (Railway l'assigne dynamiquement)
EXPOSE $PORT

# Commande de démarrage
CMD ["npm", "start"]
