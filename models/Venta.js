const mongoose = require('mongoose');

const detalleVentaSchema = new mongoose.Schema({
  producto_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', default: null },
  servicio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', default: null },
  cantidad: { type: Number, required: true },
  precio_unitario: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const ventaSchema = new mongoose.Schema({
  fecha_hora: { type: Date, default: Date.now },
  total: { type: Number, required: true },
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  metodo_pago: { type: String, enum: ['Efectivo', 'Tarjeta', 'Transferencia'], required: true },
  detalles: [detalleVentaSchema]
}, { timestamps: true });

module.exports = mongoose.model('Venta', ventaSchema);
