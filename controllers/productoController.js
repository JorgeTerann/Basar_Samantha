const Producto = require('../models/Producto');

exports.obtenerProductos = async (req, res) => {
  try {
    const { q } = req.query;
    let productos;
    if (q) {
      const regex = new RegExp(q, 'i');
      productos = await Producto.find({
        $or: [{ codigo_barras: regex }, { nombre: regex }]
      }).sort({ nombre: 1 });
    } else {
      productos = await Producto.find().sort({ nombre: 1 });
    }
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const { codigo_barras, nombre, precio_costo, precio_venta, stock_actual, stock_minimo, categoria } = req.body;
    const existe = await Producto.findOne({ codigo_barras });
    if (existe) {
      return res.status(400).json({ msg: 'Ya existe un producto con ese codigo de barras' });
    }
    const producto = new Producto({ codigo_barras, nombre, precio_costo, precio_venta, stock_actual, stock_minimo, categoria });
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndDelete(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json({ msg: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
