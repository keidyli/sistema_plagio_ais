//Administrar base de datos

//Importando la conexión
const db = require("../data/db");

//Creando las consultas dentro de un objeto
const consultas = {
    
    mostrar_proyecto : "SELECT * FROM data_one",

    nuevo_proyecto: "INSERT INTO data_one(cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor) VALUES (?, ?, ?, ?, ?, ?);"

};

//Exportando los métodos necesarios para manipular la tabla clientes y productos
module.exports = {
    
    nuevoProyecto(cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor){
        return new Promise((resolve, reject)=>{
            db.query(consultas.nuevo_proyecto, [cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor], (err)=> {
                if(err) reject(err);
                resolve()
            })
        });
    },

    mostrarProyecto(){
        return new Promise((resolve, reject) => {
            db.query(consultas.mostrar_proyecto, (err, data) => {
                if(err) reject(err);
                resolve(data);
            });
        });
    },

   
}