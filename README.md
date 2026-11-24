# TP4 : Docker et Docker Compose

**Introduction au DevOps, ISG de Sousse, 3ème année LIG**<br>
**Enseignante :** Zaineb SAKHRAWI<br>
**Réalisé par :** Ahmed Bouabid, 3LIG G2A

Dans ce TP j’ai conteneurisé une application MERN (MongoDB, Express, React, Node.js) avec Docker, d’abord en lançant les conteneurs à la main, puis avec Docker Compose.

Environnement : macOS, Docker Desktop (Docker 29.9.3, Docker Compose v5.7.0).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `Server/Dockerfile` | Image du serveur Express (`mern-server`) |
| `Client/Dockerfile` | Image du client React (`mern-client`) |
| `docker-compose.yml` | Lance MongoDB, le serveur et le client ensemble |
| `Server/.dockerignore`, `Client/.dockerignore` | Fichiers à ne pas copier dans les images (node_modules) |
| `captures/` | Captures d’écran de chaque étape |

## 1. Cloner le projet

```bash
git clone https://github.com/wiem-kb/MyAppReact.git
cd MyAppReact
```

Le projet contient deux dossiers : `Client` (application React avec Vite) et `Server` (API Express).

![Clone et structure](captures/01_git_clone_structure.jpg)

## 2. Créer les Dockerfiles

### a. Serveur (Express)

Le Dockerfile part de `node:lts-alpine`, définit le dossier de travail `/app`, copie `package*.json`, installe les dépendances, copie le reste du code, expose le port 9000 et démarre avec `npm start`. La variable `MONGO_URI` est définie dans `docker-compose.yml`.

![Dockerfile serveur](captures/02_dockerfile_server.jpg)

```bash
docker build -t mern-server ./server
```

![Build serveur](captures/03_build_mern_server.jpg)

### b. Client (React)

Même début que le serveur, puis `npm run build` construit l’application React dans le dossier `dist`, `serve` est installé comme petit serveur HTTP, le port 3000 est exposé et `serve` sert les fichiers du build.

![Dockerfile client](captures/04_dockerfile_client.jpg)

```bash
docker build -t mern-client ./client
```

![Build client](captures/05_build_mern_client.jpg)
![Images](captures/06_images_creees.jpg)

## 3. Créer un réseau Docker

```bash
docker network create mern-network
```

![Réseau](captures/07_reseau_mern_network.jpg)

## 4. Lancer MongoDB

```bash
docker run -d --name mongodb --network mern-network mongo
```

## 5. Lancer le serveur et le client

```bash
docker run -d --name server --network mern-network -p 9000:9000 mern-server
docker run -d --name client --network mern-network -p 3000:3000 mern-client
```

![Lancement des conteneurs](captures/08_docker_run_conteneurs.jpg)

Vérification : les 3 conteneurs tournent, le serveur affiche « Connecté à MongoDB » et l’API répond.

![Vérification](captures/09_verification_manuelle.jpg)
![Client sur le port 3000](captures/10_client_localhost_3000.jpg)
![API health](captures/11_api_health.jpg)
![Connexion MongoDB](captures/12_api_db_mongodb.jpg)

`/api/db` renvoie `etat_connexion: 1`, ce qui veut dire que le serveur est bien connecté à MongoDB.

Avant de passer à Docker Compose, j’ai arrêté et supprimé ces conteneurs et le réseau (Compose recrée des conteneurs avec les mêmes noms).

![Arrêt des conteneurs](captures/14_arret_conteneurs_manuels.jpg)

## 6. Docker Compose

Le fichier `docker-compose.yml` définit trois services :

* **mongodb** : image `mongo`, conteneur `mongodb`, réseau `mern-network`
* **server** : construit depuis `./Server`, conteneur `server`, port 9000, dépend de `mongodb`, variable `MONGO_URI=mongodb://mongodb:27017/mern`
* **client** : construit depuis `./Client`, conteneur `client`, port 3000, dépend de `server`

Le réseau `mern-network` utilise le driver `bridge`. Dans le réseau, le serveur trouve MongoDB avec le nom du service `mongodb` comme nom d’hôte.

![docker-compose.yml](captures/15_docker_compose_yml.jpg)

```bash
docker compose up --build
```

![docker compose up](captures/16_docker_compose_up_build.jpg)
![Vérification Compose](captures/17_verification_compose.jpg)
![Client avec Compose](captures/18_compose_client_3000.jpg)
![MongoDB avec Compose](captures/19_compose_api_db.jpg)

Pour arrêter : `docker compose down`.

## Remarques

* Dans le dépôt les dossiers s’appellent `Server` et `Client` avec une majuscule. La commande du TP `docker build -t mern-server ./server` marche sur Mac car le système ne fait pas la différence entre majuscules et minuscules. Dans `docker-compose.yml` j’ai écrit `./Server` et `./Client` pour que ça marche aussi sous Linux.
* L’énoncé donne `docker build -t mern-server ./client` pour le client : j’ai utilisé le nom `mern-client` demandé juste au dessus. De même `docker compose up -- build` s’écrit `docker compose up --build`.
* Le serveur du dépôt ne se connectait pas encore à MongoDB. Comme le conseille l’énoncé, j’ai ajouté la connexion avec `mongoose` et la variable `MONGO_URI` dans `Server/src/index.mjs`, plus une route `/api/db` pour vérifier la connexion.
* Le dossier `node_modules` n’est pas copié dans les images grâce au fichier `.dockerignore` : les dépendances sont installées par `npm install` dans le conteneur.
