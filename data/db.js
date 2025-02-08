/*Creando conexión al servidor de la base de datos mysql usando el paquete mysql.
*Las credenciales están en variables de entorno usando el paquete dotenv
*/

const mysql = require('mysql');     //Importando el paquete
require('dotenv').config();         //Importando dotevn y la configuración

//Creando la conexión y exportandolo como un módulo

module.exports = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE
});

