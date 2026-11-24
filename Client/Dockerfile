# Image de base : Node.js version LTS (légère, basée sur Alpine Linux)
FROM node:lts-alpine

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du client
COPY . .

# Construire l'application React (les fichiers sont créés dans le dossier dist)
RUN npm run build

# Installer un serveur HTTP léger pour servir les fichiers du build
RUN npm install -g serve

# Le client est accessible sur le port 3000
EXPOSE 3000

# Démarrer le serveur pour servir les fichiers du build
CMD ["serve", "-s", "dist", "-l", "3000"]
