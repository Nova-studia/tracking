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

// Ruta para obtener todos los administradores (solo accesible para admin principal)
router.get('/', auth, checkMainAdmin, async (req, res) => {
  try {
    const admins = await authService.getAdmins();
    res.json(admins);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para crear un nuevo admin (solo accesible para admin principal)
router.post('/', auth, checkMainAdmin, async (req, res) => {
  try {
    const admin = await authService.createAdmin(req.body);
    res.status(201).json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para cambiar el estado de un admin (activar/desactivar)
router.patch('/:adminId/status', auth, checkMainAdmin, async (req, res) => {
  try {
    const admin = await authService.toggleAdminStatus(req.params.adminId);
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para actualizar información de un admin
router.patch('/:adminId', auth, checkMainAdmin, async (req, res) => {
  try {
    const admin = await authService.updateAdmin(req.params.adminId, req.body);
    res.json(admin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para eliminar un admin
router.delete('/:adminId', auth, checkMainAdmin, async (req, res) => {
  try {
    const result = await authService.deleteAdmin(req.params.adminId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;