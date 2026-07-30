const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  tipo_servicio: { type: String, required: true },
  tarifa_pagina: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Servicio', servicioSchema);
