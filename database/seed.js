const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB Atlas');

    await Usuario.deleteMany({});
    await Producto.deleteMany({});
    await Servicio.deleteMany({});

    const adminHash = await bcrypt.hash('admin123', 10);
    const cajeroHash = await bcrypt.hash('cajero123', 10);

    const admin = await Usuario.create({
      nombre: 'Administrador',
      usuario: 'admin',
      clave_hash: adminHash,
      rol: 'Administrador'
    });
    console.log(`Usuario admin creado: ${admin.usuario}`);

    const cajero = await Usuario.create({
      nombre: 'Cajero',
      usuario: 'cajero',
      clave_hash: cajeroHash,
      rol: 'Cajero'
    });
    console.log(`Usuario cajero creado: ${cajero.usuario}`);

    const productos = await Producto.insertMany([
      { codigo_barras: '7501001234567', nombre: 'Cuaderno Profesional 100h', precio_costo: 15.00, precio_venta: 25.00, stock_actual: 50, stock_minimo: 10, categoria: 'Papeleria' },
      { codigo_barras: '7501001234568', nombre: 'Lapiz HB #2', precio_costo: 2.00, precio_venta: 5.00, stock_actual: 100, stock_minimo: 20, categoria: 'Escritura' },
      { codigo_barras: '7501001234569', nombre: 'Boligrafo Azul', precio_costo: 3.00, precio_venta: 7.00, stock_actual: 80, stock_minimo: 15, categoria: 'Escritura' },
      { codigo_barras: '7501001234570', nombre: 'Resma Papel Bond T/C 500h', precio_costo: 45.00, precio_venta: 65.00, stock_actual: 20, stock_minimo: 5, categoria: 'Papeleria' },
      { codigo_barras: '7501001234571', nombre: 'Borrador de nata', precio_costo: 1.50, precio_venta: 4.00, stock_actual: 3, stock_minimo: 10, categoria: 'Escritura' }
    ]);
    console.log(`${productos.length} productos insertados`);

    const servicios = await Servicio.insertMany([
      { tipo_servicio: 'Fotocopia B/N', tarifa_pagina: 0.05 },
      { tipo_servicio: 'Fotocopia Color', tarifa_pagina: 0.15 },
      { tipo_servicio: 'Impresion B/N', tarifa_pagina: 0.10 },
      { tipo_servicio: 'Impresion Color', tarifa_pagina: 0.25 }
    ]);
    console.log(`${servicios.length} servicios insertados`);

    console.log('Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
