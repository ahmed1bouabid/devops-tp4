import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();  // Charge les variables d'environnement à partir d'un fichier .env

const app = express();

// Middleware pour autoriser les requêtes cross-origin
app.use(cors());

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Connexion à MongoDB avec la variable d'environnement MONGO_URI
// (définie dans docker-compose.yml). Valeur par défaut : le conteneur mongodb.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/mern';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connecté à MongoDB : ' + MONGO_URI))
  .catch((err) => console.error('Erreur de connexion à MongoDB :', err.message));

// Exemple de route API
app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});

// Route pour vérifier la connexion à MongoDB (1 = connecté)
app.get('/api/db', (req, res) => {
  res.json({ mongo_uri: MONGO_URI, etat_connexion: mongoose.connection.readyState });
});

// Démarrer le serveur sur le port 9000
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
