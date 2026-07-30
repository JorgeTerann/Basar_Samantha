const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

exports.registrarVenta = async (req, res) => {
  try {
    const { metodo_pago, detalles, total } = req.body;
    const usuario_id = req.usuario.id;

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ msg: 'La venta debe tener al menos un detalle' });
    }

    for (const detalle of detalles) {
      if (detalle.producto_id) {
        const producto = await Producto.findById(detalle.producto_id);
        if (!producto) {
          return res.status(400).json({ msg: `Producto no encontrado: ${detalle.producto_id}` });
        }
        if (producto.stock_actual < detalle.cantidad) {
          return res.status(400).json({ msg: `Stock insuficiente para: ${producto.nombre}` });
        }
      }
    }

    for (const detalle of detalles) {
      if (detalle.producto_id) {
        await Producto.findByIdAndUpdate(detalle.producto_id, {
          $inc: { stock_actual: -detalle.cantidad }
        });
      }
    }

    const venta = new Venta({ total, usuario_id, metodo_pago, detalles });
    await venta.save();
    res.status(201).json(venta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
