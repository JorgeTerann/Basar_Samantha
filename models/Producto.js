const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  codigo_barras: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  precio_costo: { type: Number, required: true },
  precio_venta: { type: Number, required: true },
  stock_actual: { type: Number, required: true, default: 0 },
  stock_minimo: { type: Number, required: true, default: 0 },
  categoria: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);
