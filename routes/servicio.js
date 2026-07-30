const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const auth = require('../middleware/auth');

router.get('/', auth, servicioController.obtenerServicios);

module.exports = router;
