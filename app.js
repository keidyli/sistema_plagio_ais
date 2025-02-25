var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.set("port", 5000);//Asignando Puerto
app.listen(app.get('port'));//Escuchando las comunicaciones
console.log("escuchando comunicaciones del puerto", app.set("port"));


//Configuracion del Servidor
app.set('view engine', 'ejs');//definimos el motor de plantilla con archivos ejs
app.set('views', path.join(__dirname, 'views'));//definimos la ruta del motor de plantilla

// Servir archivos estáticos desde "node_modules/sweetalert2/dist"
app.use('/sweetalert2', express.static(path.join(__dirname, 'node_modules', 'sweetalert2', 'dist')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Rutas
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
