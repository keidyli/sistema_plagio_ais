const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const main = require('../models/principal');

/*
const { getConnection } = require("../data/db");  // Asegúrate de la ruta correcta

// Ruta de prueba para verificar la conexión
router.get("/test-db", async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT 1 + 1 AS solution");
        connection.end();  // Cerramos la conexión después de la consulta
        res.json({ message: "✅ Conexión exitosa", resultado: result });
    } catch (error) {
        res.status(500).json({ message: "❌ Error en la conexión", error: error.message });
    }
});

*/

// Ruta para mostrar la vista de login
router.get('/', (req, res) => {
  res.render('index'); // Renderiza index.ejs desde la carpeta views
});

// Ruta para procesar el login y manejar la logica
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validar credenciales desde variables de entorno
  if (username === process.env.NAME_USER && password === process.env.PASSWORD)
  {
    const token= jwt.sign({username}, process.env.JWT_SECRET, { expiresIn: '1h'}); // Credenciales correctas, genera un token
    res.cookie('jwt', token, {httpOnly: true}); // Guarda el token en una cookie
    return res.status(200).redirect('/principal');// Redirige a vista principal después del login
     
  }
  res.status(401).send('Credenciales incorrectas');
});

// Middleware para proteger rutas
const protectRoute = (req, res, next) => {
  const token = req.cookies.jwt; //obtiene el token de la cookie

  if (!token) {
    return res.redirect('/')
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET); //verificar la validez del token
    next();
  } catch (err) {
    res.redirect('/'); // si no es valido, devuelve vista login
  }
};

// Mostrando Ruta protegida 
// ✅ Correcto
router.get('/principal', protectRoute, (req, res) => {
  main.mostrarProyecto()
    .then(datos => {
      res.render('principal', { datos: datos });
    })
    .catch(err => {
      console.error("Error al obtener proyectos:", err); // 👁️ ¡Agrega logs para debuggear!
      res.render('principal', { datos: {} });
    });
});

router.get('/add', protectRoute, (req, res) => {
  res.render('add');
});

router.post('/add', (req, res) => {
  const {cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor} = req.body;
  main
    .nuevoProyecto(cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor)
    .then(() => {
      res.redirect('/principal')
    })
    .catch(err => {
      console.error("Error en nuevoProyecto:", err); // Mejorar el logging del error
      res.status(500).send("Error al agregar el proyecto"); // Enviar una respuesta de error al cliente
    });
}); 


//Mostrando vista de editar
router.get('/editar/:id', protectRoute, (req, res) => {
  const id = req.params.id;
  main
    .mostrarProyectoPorID(id)
    .then(datos => {
      res.render('editar', {datos:datos});
    })
    .catch(err => {
      res.render('editar', {datos:{}});
    });
});


//Obteniendo datos de la vista editar
router.post('/editar', (req, res) => {
  const {id, cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor} = req.body;
  console.log(id, cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor)
  main
    .actualizarProyecto(id, cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor)
    .then(() => {
      res.redirect('/principal')
    })
    .catch(err => {
      res.send(err);
    });
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  res.clearCookie('jwt'); // Eliminar cookie
  res.redirect('/'); // Redirige al login
  console.log("Cerro sesion, el token fue eliminado");
});

module.exports = router;