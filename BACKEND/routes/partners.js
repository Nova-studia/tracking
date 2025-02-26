const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const auth = require('../middleware/auth');

// Middleware para verificar que el usuario es un admin principal
const checkMainAdmin = (req, res, next) => {
  if (!req.user.isMainAdmin) {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requiere ser administrador principal.' 
    });
  }
  next();
};

// Ruta para obtener todos los socios (solo accesible para admin principal)
router.get('/', auth, checkMainAdmin, async (req, res) => {
  try {
    const partners = await authService.getPartners();
    res.json(partners);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para crear un nuevo socio (solo accesible para admin principal)
router.post('/', auth, checkMainAdmin, async (req, res) => {
  try {
    const partner = await authService.createPartner(req.body);
    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para cambiar el estado de un socio (activar/desactivar)
router.patch('/:partnerId/status', auth, checkMainAdmin, async (req, res) => {
  try {
    const partner = await authService.togglePartnerStatus(req.params.partnerId);
    res.json(partner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para actualizar información de un socio
router.patch('/:partnerId', auth, checkMainAdmin, async (req, res) => {
  try {
    const partner = await authService.updatePartner(req.params.partnerId, req.body);
    res.json(partner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para eliminar un socio
router.delete('/:partnerId', auth, checkMainAdmin, async (req, res) => {
  try {
    const result = await authService.deletePartner(req.params.partnerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;