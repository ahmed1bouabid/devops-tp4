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
| `Jenkinsfile` | Pipeline Jenkins : build des images, scan Trivy, push sur Docker Hub |
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

## 7. Images et conteneurs du TP

Les images du TP : `mern-server` et `mern-client` (construites par Compose), `ahmedbouabid/mern-server` et `ahmedbouabid/mern-client` (construites par Jenkins pour Docker Hub), plus les images de base `mongo`, `node:lts-alpine` et `aquasec/trivy`.

```bash
docker images
docker ps -a
docker compose ps
docker network ls
```

![Images Docker](captures/20_docker_images_tp4.jpg)
![Conteneurs et réseau](captures/21_docker_conteneurs_reseau_tp4.jpg)

La même chose dans Docker Desktop : les 3 conteneurs du projet Compose (mongodb, server sur 9000, client sur 3000) et les images filtrées avec « mern ».

![Docker Desktop conteneurs](captures/22_docker_desktop_conteneurs.jpg)
![Docker Desktop images](captures/23_docker_desktop_images.jpg)

## 8. Pipeline Jenkins

J’ai repris le Jenkinsfile du TP précédent et je l’ai adapté au projet MERN. Le pipeline récupère le code depuis GitHub, construit les deux images, les scanne avec Trivy puis les pousse sur Docker Hub.

![Jenkinsfile](captures/24_jenkinsfile.jpg)

Configuration dans Jenkins : les identifiants Docker Hub sont enregistrés sous l’id `dockerhub-creds`, le job `TP4_MERN_Docker` est de type Pipeline, il vérifie le dépôt toutes les 5 minutes (Poll SCM `H/5 * * * *`) et lit le Jenkinsfile de la branche `main`.

![Credentials Docker Hub](captures/25_jenkins_credentials_dockerhub.jpg)
![Poll SCM](captures/26_jenkins_job_poll_scm.jpg)
![Pipeline from SCM](captures/27_jenkins_pipeline_from_scm.jpg)
![Branche et Jenkinsfile](captures/28_jenkins_branche_jenkinsfile.jpg)

Résultat du build : les étapes Checkout, Build Server Image, Build Client Image, Scan Server Image et Scan Client Image passent.

![Étapes du pipeline](captures/29_jenkins_pipeline_etapes.jpg)
![Résultats Trivy](captures/30_jenkins_resultats_trivy.jpg)
![Détail du scan](captures/31_jenkins_detail_scan_trivy.jpg)

L’étape Push n’est pas passée : `docker login` n’arrivait pas à joindre `auth.docker.io` (Client.Timeout). C’est un problème de connexion réseau au moment du TP et pas une erreur dans le Jenkinsfile : j’ai relancé le build (#2) et la même erreur est revenue, et un `curl` vers `auth.docker.io` depuis mon Mac ne répondait pas non plus.

![Erreur push](captures/32_jenkins_push_timeout_docker_hub.jpg)
![Builds du job](captures/33_jenkins_job_builds.jpg)
