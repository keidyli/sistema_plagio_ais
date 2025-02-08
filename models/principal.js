//Administrar base de datos

//Importando la conexión
const db = require("../data/db");

//Creando las consultas dentro de un objeto
const consultas = {
    
    mostrar_proyecto : "SELECT * FROM data_one"

};

//Exportando los métodos necesarios para manipular la tabla clientes y productos
module.exports = {
    

    mostrarProyecto(){
        return new Promise((resolve, reject) => {
            db.query(consultas.mostrar_proyecto, (err, data) => {
                if(err) reject(err);
                resolve(data);
            });
        });
    },

   
}