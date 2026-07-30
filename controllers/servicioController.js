const Servicio = require('../models/Servicio');

exports.obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find().sort({ tipo_servicio: 1 });
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
