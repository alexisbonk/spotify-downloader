const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logToFile = require('../utils/logToFile');

router.post('/validate-path', (req, res) => {
  const { path: pathToValidate } = req.body;
  
  if (!pathToValidate) {
    logToFile('[VALIDATE-PATH] ❌ Aucun chemin fourni', 'red');
    return res.status(400).json({ valid: false, error: 'Chemin non fourni' });
  }

  try {
    const absolutePath = path.normalize(pathToValidate);

    if (!fs.existsSync(absolutePath)) {
      logToFile(`[VALIDATE-PATH] ❌ Chemin non trouvé: ${absolutePath}`, 'red');
      return res.status(200).json({ 
        valid: false, 
        error: 'Chemin non trouvé',
        path: absolutePath
      });
    }

    try {
      const testFile = path.join(absolutePath, '.writetest');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      logToFile(`[VALIDATE-PATH] ✅ Chemin valide: ${absolutePath}`, 'green');
      return res.status(200).json({ 
        valid: true, 
        path: absolutePath 
      });
    } catch (err) {
      logToFile(`[VALIDATE-PATH] ❌ Erreur d'écriture: ${absolutePath}`, 'red');
      return res.status(200).json({ 
        valid: false, 
        error: 'Pas de permission en écriture',
        path: absolutePath
      });
    }
  } catch (err) {
    logToFile(`[VALIDATE-PATH] ❌ Erreur de validation: ${err.message}`, 'red');
    return res.status(500).json({ 
      valid: false, 
      error: 'Erreur lors de la validation du chemin',
      details: err.message
    });
  }
});

module.exports = router;
