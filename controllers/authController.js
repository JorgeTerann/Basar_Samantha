const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.login = async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    if (!usuario || !clave) {
      return res.status(400).json({ msg: 'Usuario y clave son requeridos' });
    }

    const user = await Usuario.findOne({ usuario });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    const isMatch = await bcrypt.compare(clave, user.clave_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    const payload = { id: user._id, usuario: user.usuario, rol: user.rol, nombre: user.nombre };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, usuario: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
