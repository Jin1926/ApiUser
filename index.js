const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

    app.post('/api/register', async (req, res) => {
  const { nombre, correo, password, fecha_nacimiento } = req.body;

  // Validación de campos vacíos
  if (!nombre || !correo || !password || !fecha_nacimiento) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en la base de datos
    await pool.query(
      'INSERT INTO usuarios (username, email, password, fecha_nacimiento) VALUES ($1, $2, $3, $4)',
      [nombre, correo, hashedPassword, fecha_nacimiento]
    );

    // Éxito
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: { nombre, correo, fecha_nacimiento }
    });

  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login
    app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [correo]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    console.log("Contraseña enviada:", password);
    console.log("Contraseña en base de datos:", usuario.password);

    const esValida = await bcrypt.compare(password, usuario.password);

    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    res.status(200).json({
        message: 'Inicio de sesión exitoso',
        usuario: {
            id: usuario.id,
            nombre: usuario.username,
            correo: usuario.email,
            fecha_nacimiento: usuario.fecha_nacimiento
        }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


// Ruta para solicitar un cómic
app.post('/api/solicitar-comic', async (req, res) => {
    const { user_id, comic } = req.body;

  // Validaciones simples
    if (!user_id || !comic) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const result = await pool.query(
        'INSERT INTO solicitudes (user_id, comic) VALUES ($1, $2) RETURNING *',
        [user_id, comic]
        );
        res.status(201).json({
        message: 'Solicitud registrada exitosamente',
        solicitud: result.rows[0],
        });
    } catch (err) {
        console.error('Error al registrar solicitud:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});
// Obtener usuario por correo
app.post('/api/user', async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: 'El correo es requerido' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [correo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    res.status(200).json({
      message: 'Usuario encontrado',
      usuario: {
        id: usuario.id,
        nombre: usuario.username,
        correo: usuario.email,
        fecha_nacimiento: usuario.fecha_nacimiento
      }
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});