# Utiliser Node.js 18 LTS
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer le répertoire uploads
RUN mkdir -p uploads

# Exposer le port
EXPOSE 3003

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3003

# Commande de démarrage
CMD ["npm", "start"]
