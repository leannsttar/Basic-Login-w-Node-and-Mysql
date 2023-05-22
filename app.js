//1. Invoking express
const express = require('express');
const app = express();



//2. 
//middleware de express para poder acceder a los datos post (este caso form) de manera más fácil, por ejemplo un objeto de js
app.use(express.urlencoded( { extended: false } ))
// middleware para analizar el cuerpo de solicitudes JSON
app.use(express.json())




//3. Invoking dotenv
const dotenv = require('dotenv');
//Decimos que en el archivo .env van a estar definidas las variables de entorno
dotenv.config({path:'./env/.env'})



//4. Public directory
//Configuramos middleware para archivos estáticos como estilos, imágenes, js

//config el middle para poner los files estáticos en la carpeta public, pero en el navegador estos archivos se accederán a través de la carpeta '/resources/. Osea si tengo un archivo output.css en la carpeta public, este archivo podrá ser accedido desde la URL como '/resources/output.css
app.use('/resources', express.static('public'));
//Aquí usamos la var __dirname para obtener la ruta absoluta del directorio, esto sirve cuando cambiamos de computador y queremos usar el proyecto, osea usamos la ruta absoluta (__dirname) y luego le añadimos el public. Porque en diferentes computadoras no vas a tener las mismas carpetas 
app.use('/resources', express.static(__dirname + '/public'))


//5. setting up the template engine
app.set('view engine', 'ejs');

//6. Invoking bcrypt in order to hash the passwords
const bcryptjs = require('bcryptjs');

//7. Setting up session variables
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

//8. Invocamos al módulo de conexión de la DB
const connection = require('./database/db');


//9. Setting up the routes

    app.get('/login', (req, res) => {
        res.render('login')
    })

    app.get('/register', (req, res) => {
        res.render('register')
    })


//10. Registración
app.post('/register', async (req, res) => {
    //Guardamos los valores del formulario en constantes
    const user = req.body.user;
    const name = req.body.name;
    const role = req.body.role;
    const pass = req.body.pass;
    //Hasheamos la password 8 veces
    let passwordHaash = await bcryptjs.hash(pass, 8);
    //Realizamos la inserción a la DB
    connection.query('INSERT INTO users SET ?', {user:user, name:name, role:role, pass:passwordHaash}, async(error, results) => {
        if (error) {
            console.log(error)
        } else {
            //Si no hay un error, en el /register nos va a mostrar una alerta, aquí le estamos pasando los parámetros que usará la alerta, en registration.ejs traemos esos datos y configuramos la alerta
            res.render('register', {
                alert: true,
                alertTitle: "Registration",
                alertMessage: "Registration Succesful!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                //Aquí la ruta está vacia, ya que queremos que nos redireccione al index osea '/'
                ruta: ''
            })
        }
    })
})


//11. Autenticación
app.post('/auth', async (req, res) => {
    //Traemos los datos ingresados en el formulario del login
    const user = req.body.user;
    const pass = req.body.pass;
    //Hasheamos la password de nuevo
    let passwordHaash = await bcryptjs.hash(pass, 8);
    //Validación del usuario y contraseña
    if (user && pass){
        //Hacemos una consulta del usuario ingresado y validamos los resultados o el error
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
            //Una condición si el numero de resultados es 0 osea, no encontró usuarios o si la contraseña hasheada no coincide con la contraseña de la DB
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                //Renederiza de nuevo el login, enviamos los datos de la alerta, y al cerrar la alerta manda al login por la "ruta"
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario o password incorrectos",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: '',
                    ruta: 'login'
                });
            } else {
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión exitosa",
                    alertMessage: "Log in Correcto",
                    alertIcon: "success",
                    showConfirmButton: '',
                    timer: 1500,
                    ruta: ''
                });
            }
        }) 
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "Por favor ingrese un usuario y una contraseña",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: '',
            ruta: 'login'
        })
    }
})


//12. Auth pages
app.get('/', (req, res) => {
    //Condición si ya ha iniciado sesión
    if (req.session.loggedin) {
        res.render('index', {
            //enviamos los datos de si el login es true y el nombre del usuario loggeado
            login: true,
            name: req.session.name
        })
    } else {
        res.render('index', {
            //Si no está loggeado enviamos que el login es false y el nombre es una advertencia de que debe iniciar sesión
            login: false,
            name: 'Debe iniciar sesión'
        })
    }
})


//13. Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
})


app.listen(3000, (req, res) => {
    console.log('Server running on port 3000')
})