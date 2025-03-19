//Administrar base de datos

//Importando la conexión
const db = require("../data/db");

//Creando las consultas dentro de un objeto
const consultas = {
    
    mostrar_proyecto : "SELECT * FROM data_one",

    nuevo_proyecto: "INSERT INTO data_one(cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor) VALUES (?, ?, ?, ?, ?, ?);",

    mostrar_proyecto_por_id: "SELECT * FROM data_one WHERE id = ?",

    obtener_titulos: "SELECT id, title_project, name_estu, cdi_estu FROM data_one",
    
    actualizar_proyecto: `UPDATE data_one SET 
                            cdi_estu = ?,
                            name_estu = ?,
                            title_project = ?,
                            periodo = ?,
                            name_tutor = ?,
                            contact_tutor = ?

                            WHERE id = ?;`,
    
    eliminar_proyecto: "DELETE FROM data_one WHERE id = ?;"

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

    mostrarProyectoPorID(id){
        return new Promise((resolve, reject) => {
            db.query(consultas.mostrar_proyecto_por_id, [id],(err, data) => {
                if(err) reject(err);
                resolve(data);
            });
        });
    },

    obtenerTitulos(){
        return new Promise((resolve, reject) => {
            db.query(consultas.obtener_titulos, (err, data) => {
                if(err) reject(err);
                resolve(data);
            });
        });
    },

    actualizarProyecto(id, cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor){
        return new Promise((resolve, reject) => {
            db.query(consultas.actualizar_proyecto, [cdi_estu, name_estu, title_project, periodo, name_tutor, contact_tutor, id], (err) => {
                if(err) reject(err);
                resolve();
            });
        })
    },

    eliminarProyecto(id){
        return new Promise((resolve, reject)=>{
            db.query(consultas.eliminar_proyecto, [id], (err) => {
                if(err) reject(err);
                resolve();
            })
        });
    }

   
}