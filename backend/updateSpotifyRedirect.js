const axios = require('axios');
const os = require('os');

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const localIP = getLocalIP();
const PORT = process.env.PORT || 4420;
const newRedirectUri = `http://${localIP}:${PORT}/callback`;

async function updateSettings() {
  try {
    await axios.post('http://localhost:4420/settings', {
      spotifyRedirectUri: newRedirectUri
    });
    
    console.log('✅ Configuration mise à jour avec succès !');
    console.log(`Nouvelle URL de redirection : ${newRedirectUri}`);
    console.log('\nVotre application est maintenant configurée pour fonctionner sur le réseau local.');
    console.log(`URL d'accès depuis d'autres appareils : http://${localIP}:${PORT}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la configuration :', error.message);
    if (error.response) {
      console.error('Détails de l\'erreur :', error.response.data);
    }
  }
}

updateSettings();
