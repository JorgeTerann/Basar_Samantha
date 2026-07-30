const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true },
  clave_hash: { type: String, required: true },
  rol: { type: String, enum: ['Administrador', 'Cajero'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
