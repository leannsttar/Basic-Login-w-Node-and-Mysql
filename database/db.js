const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
})

connection.connect((error)=>{
    if (error) {
        console.log('Error de conexión : '+error)
        return;
    }
    console.log('Conectado a la DB!')
})

module.exports = connection;