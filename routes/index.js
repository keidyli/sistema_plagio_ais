const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const main = require('../models/principal');
const db = require("../data/db");

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
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).send('Usuario y contraseña son requeridos');
    }

    // Validar credenciales desde variables de entorno
    if (username === process.env.NAME_USER && password === process.env.PASSWORD) {
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Credenciales correctas, genera un token
      res.cookie('jwt', token, {httpOnly: true}); // Guarda el token en una cookie
      return res.status(200).redirect('/principal'); // Redirige a vista principal después del login
    }

    res.status(401).send('Credenciales incorrectas');
  } catch (error) {
    console.error('Error durante el login:', error);
    res.status(500).send('Error interno del servidor');
  }
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
      console.log("mostrando vista principal");
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
      res.redirect('/principal?action=add&success=true'); // Redirigir con acción de agregar
    })
    .catch(err => {
      console.error("Error en nuevoProyecto:", err); // Mejorar el logging del error
      res.redirect('/principal?action=add&error=1'); // Redirigir con acción de agregar y error
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


router.get('/delete/:id', (req, res) => {
  const id = req.params.id;
  main
    .eliminarProyecto(id)
    .then(() => {
      res.redirect('/principal?action=delete&success=true'); // Redirigir con acción de eliminar
    })
    .catch(err => {
      res.redirect('/principal?action=delete&error=1'); // Redirigir con acción de eliminar y error
    });
}); 


router.post('/search', protectRoute, (req, res) => {
  const buscar = req.body.buscar || '';
  const limit = 30;
  let query = 'SELECT * FROM data_one WHERE 1=1';
  let queryParams = [];

  if (buscar.trim() !== '') {
    // Si se manda un término de búsqueda, se agregan las condiciones
    query += ' AND (cdi_estu LIKE ? OR name_estu LIKE ? OR title_project LIKE ? OR periodo LIKE ? OR name_tutor LIKE ? OR contact_tutor LIKE ?)';
    queryParams.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  } else {
    // Si el campo de búsqueda está vacío, se agrega el LIMIT
    query += ' LIMIT ?';
    queryParams.push(limit);
  }

  db.query(query, queryParams, (err, row) => {
    if (err) {
      return res.status(500).send("Error en la consulta");
    }

    res.render('principal', {
      datos: row
    });
  });
});


// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  res.clearCookie('jwt'); // Eliminar cookie
  res.redirect('/'); // Redirige al login
  console.log("Cerro sesion, el token fue eliminado");
});

module.exports = router;