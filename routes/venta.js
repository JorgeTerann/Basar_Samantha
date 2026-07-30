const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const auth = require('../middleware/auth');

router.post('/', auth, ventaController.registrarVenta);

module.exports = router;
