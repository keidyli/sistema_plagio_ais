const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const main = require('../models/principal');
const db = require("../data/db");
const { cosineSimilarity, tensorToMatrix, averageEmbeddings, normalizarTexto, loadModelOnce } = require('../utils/similitud');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const imagePath = path.join(__dirname, '../public/images/ais.jpg'); // Ajusta el path si está en otra carpeta
const imageData = fs.readFileSync(imagePath);
const base64Image = imageData.toString('base64');
const imageSrc = `data:image/jpeg;base64,${base64Image}`;

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
router.get('/principal', protectRoute, (req, res) => {
  main.mostrarProyecto()
    .then(datos => {
      res.render('principal', { datos: datos });
      console.log("mostrando vista principal");
    })
    .catch(err => {
      console.error("Error al obtener proyectos:", err);
      res.render('principal', { datos: {} });
    });
});

router.get('/add', protectRoute, (req, res) => {
  res.render('add');
});

router.post('/add', (req, res) => {
  console.log("Datos recibidos en POST /add:", req.body);
  const {cdi_estu, name_estu, title_project, lineamiento, periodo, name_tutor, contact_tutor} = req.body;
  main
    .nuevoProyecto(cdi_estu, name_estu, title_project, lineamiento,  periodo, name_tutor, contact_tutor)
    .then(() => {
      console.log("Redirigiendo con éxito");
      res.redirect('/principal?action=add&success=true'); // Redirigir con acción de agregar
    })
    .catch(err => {
      console.error("Error en nuevoProyecto:", err); // Mejorar el logging del error

      // Detectar error de clave duplicada (MySQL)
      if (err.code === 'ER_DUP_ENTRY') {
        // Redirigir con error de duplicado
        return res.redirect('/principal?action=add&error=duplicate');
      }
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
  const {id, cdi_estu, name_estu, title_project,lineamiento, periodo, name_tutor, contact_tutor} = req.body;
  console.log(id, cdi_estu, name_estu, title_project, lineamiento, periodo, name_tutor, contact_tutor)
  main
    .actualizarProyecto(id, cdi_estu, name_estu, title_project, lineamiento,  periodo, name_tutor, contact_tutor)
    .then(() => {
      res.redirect('/principal?action=editar&success=true')
    })
    .catch(err => {
      res.redirect('/principal?action=editar&error=1')
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
      console.error("Error en nuevoProyecto:", err); // Mejorar el logging del error
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
    query += ' AND (cdi_estu LIKE ? OR name_estu LIKE ? OR title_project LIKE ? OR lineamiento LIKE ? OR periodo LIKE ? OR name_tutor LIKE ? OR contact_tutor LIKE ?)';
    queryParams.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
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


// Muestra la vista de búsqueda
router.get('/busqueda', protectRoute, (req, res) => {
  res.render('antiPlagio');
});

// Manejando lógica de comparación de títulos
function clasificarSimilitud(score) {
  if (score >= 90) return "✨ Casi idéntico";
  if (score >= 80) return "✅ Muy similar";
  if (score >= 70) return "⚠️ Similar parcial / coincidencia temática";
  return "❌ No similar";
}

router.post('/busqueda', protectRoute, async (req, res) => {
  const tituloBusqueda = req.body.titulo;

  try {
    const proyectos = await main.obtenerTitulos();

    const extractor = await loadModelOnce(); // carga única del modelo

    const textoInput = normalizarTexto(tituloBusqueda);
    const embInput = await extractor(textoInput);
    const matrixInput = tensorToMatrix(embInput);
    const avgInput = averageEmbeddings(matrixInput);

    const resultados = await Promise.all(
      proyectos.map(async (proyecto) => {
        const textoDB = normalizarTexto(proyecto.title_project);
        const embDB = await extractor(textoDB);
        const matrixDB = tensorToMatrix(embDB);
        const avgDB = averageEmbeddings(matrixDB);

        const similitud = cosineSimilarity(avgInput, avgDB) * 100;
       
        let nivel_riesgo = "Bajo";

        if (similitud >= 90) nivel_riesgo = "Alto";
        else if (similitud >= 80) nivel_riesgo = "Medio";

        const clasificacion = clasificarSimilitud(similitud);

        const fecha_analisis = new Date(); 

        // Guarda en la tabla resultados_antiplagio
        await main.guardarResultadosSimilitud(
          proyecto.id, // id_data
          similitud.toFixed(2),
          clasificacion,
          nivel_riesgo,
          fecha_analisis
        );

        if (similitud >= 70) {
          return {
            titulo: proyecto.title_project,
            estudiante: proyecto.name_estu,
            cedula: proyecto.cdi_estu,
            similitud: similitud.toFixed(2),
            clasificacion: clasificarSimilitud(similitud)
          };
        }

        return null;
      })
    );

    const resultadosFiltrados = resultados.filter(res => res);

    res.render('antiPlagio', {
      resultados: resultadosFiltrados,
      titulo: tituloBusqueda
    });

  } catch (error) {
    console.error('Error al procesar similitudes:', error);
    res.status(500).send('Error interno del servidor');
  }
});


router.get('/reporte-pdf', protectRoute, async (req, res) => {
  const tituloBusqueda = req.query.titulo;

  if (!tituloBusqueda || tituloBusqueda.trim() === '') {
    return res.status(400).send('Debe proporcionar un título para buscar similitudes.');
  }

  try {
    const proyectos = await main.obtenerTitulos();
    const extractor = await loadModelOnce();

    const textoInput = normalizarTexto(tituloBusqueda);
    const embInput = await extractor(textoInput);
    const matrixInput = tensorToMatrix(embInput);
    const avgInput = averageEmbeddings(matrixInput);

    const resultados = await Promise.all(
      proyectos.map(async (proyecto) => {
        const textoDB = normalizarTexto(proyecto.title_project);
        const embDB = await extractor(textoDB);
        const matrixDB = tensorToMatrix(embDB);
        const avgDB = averageEmbeddings(matrixDB);

        const similitud = cosineSimilarity(avgInput, avgDB) * 100;

        if (similitud >= 70) {
          return {
            titulo: proyecto.title_project,
            estudiante: proyecto.name_estu,
            cedula: proyecto.cdi_estu,
            similitud: similitud.toFixed(2),
            clasificacion: clasificarSimilitud(similitud)
          };
        }

        return null;
      })
    );

    const resultadosFiltrados = resultados.filter(r => r);

    const fechaActual = new Date().toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const html = `
      <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          .header {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
          }
          .header-text {
            text-align: center;
          }
          h2 { margin: 5px 0; }
          p { text-align: center; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #999; padding: 8px; text-align: center; }
          th { background: #007BFF; color: black; }
          img.logo { width: 100px; height: auto; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${imageSrc}" alt="Logo AIS" class="logo">
          <div class="header-text">
            <h2>Reporte de Similitud</h2>
            <h2>Sistema de Gestión de Trabajos Académicos con Detección de Plagio</h2>
          </div>
        </div>
        <p><strong>Fecha del reporte:</strong> ${fechaActual}</p>
        <p><strong>Título analizado:</strong> ${tituloBusqueda}</p>
        <table>
          <tr>
            <th>Título del proyecto</th>
            <th>Estudiante</th>
            <th>Cédula</th>
            <th>Similitud</th>
            <th>Interpretación</th>
          </tr>
          ${resultadosFiltrados.map(r => `
            <tr>
              <td>${r.titulo}</td>
              <td>${r.estudiante}</td>
              <td>${r.cedula}</td>
              <td>${r.similitud}%</td>
              <td>${r.clasificacion}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_similitud.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (error) {
    console.error('Error generando el PDF:', error);
    res.status(500).send('Error interno al generar PDF');
  }
});


// Muestra la vista de formulario para generar reportes
router.get('/reportes-Plagio', protectRoute, async (req, res) => {
  res.render('reportesPlagio', {
    mes: null,
    anio: null,
    nivel: null,
    datosGrafico: null
  });
});


// Ruta para generar el reporte de plagio por mes y año
router.post('/reportes-Plagio', protectRoute, async (req, res) => {
  const { mes, anio, nivel } = req.body;

  try {
    const mesFormateado = mes.toString().padStart(2, '0');

    let bajo = 0, medio = 0, alto = 0;

    if (nivel === 'Todos') {
      const [resBajo, resMedio, resAlto] = await Promise.all([
        main.obtenerPlagiosBajosPorMesYAnio(anio, mes),
        main.obtenerPlagiosMediosPorMesYAnio(anio, mes),
        main.obtenerPlagiosAltosPorMesYAnio(anio, mes)
      ]);
      bajo = resBajo[0]?.total_plagios || 0;
      medio = resMedio[0]?.total_plagios || 0;
      alto = resAlto[0]?.total_plagios || 0;

    } else if (nivel === 'Bajo') {
      const res = await main.obtenerPlagiosBajosPorMesYAnio(anio, mes);
      bajo = res[0]?.total_plagios || 0;

    } else if (nivel === 'Medio') {
      const res = await main.obtenerPlagiosMediosPorMesYAnio(anio, mes);
      medio = res[0]?.total_plagios || 0;

    } else if (nivel === 'Alto') {
      const res = await main.obtenerPlagiosAltosPorMesYAnio(anio, mes);
      alto = res[0]?.total_plagios || 0;
    }

    res.render('reportesPlagio', {
      mes: mesFormateado,
      anio,
      nivel, // puedes usarlo en la vista si quieres mostrar qué seleccionó el usuario
      datosGrafico: { bajo, medio, alto }
    });
     
    console.log('📊 datosGrafico:', { bajo, medio, alto });

  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).send('Error al generar reporte');
  }
});


// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  res.clearCookie('jwt'); // Eliminar cookie
  res.redirect('/'); // Redirige al login
  console.log("Cerro sesion, el token fue eliminado");
});

module.exports = router;