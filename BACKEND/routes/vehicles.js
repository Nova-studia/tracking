const express = require('express');
const router = express.Router();
const vehicleService = require('../services/vehicleService');
const auth = require('../middleware/auth');

// Obtener todos los vehículos
router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Crear nuevo vehículo
router.post('/', auth, async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar estado del vehículo
router.patch('/:vehicleId/status', auth, async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(
      req.params.vehicleId, 
      req.body.status
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Asignar conductor
router.patch('/:vehicleId/driver', auth, async (req, res) => {
  try {
    const vehicle = await vehicleService.assignDriver(
      req.params.vehicleId, 
      req.body.driverId
    );
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para subir fotos
router.post('/:vehicleId/photos', 
  auth, 
  vehicleService.uploadMiddleware,
  async (req, res) => {
    try {
      const vehicle = await vehicleService.uploadVehiclePhotos(
        req.params.vehicleId, 
        req.files
      );
      res.json(vehicle);
    } catch (error) {
      console.error('Error in upload route:', error);
      res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;