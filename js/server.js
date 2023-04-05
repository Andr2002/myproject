require('dotenv').config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const { userExist, getUser, saveSessionId, existSessionId, getRoleById, getDeptById } = require('../js/database.js');
const passport = require('passport');

const { initialize } = require('./passport.js');
initialize(passport);

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs'); 

const urlencodedParser = express.urlencoded({ extended: false }); 

app.use(express.static(__dirname.slice(0, -3)));
app.use(express.json()); 
app.use(cookieParser()); 

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}));

app.use(passport.initialize()); 
app.use(passport.session()); 

app.use(flash());

app.get('/', (request, response) => {
    response.render('index', { user: 'andrey' }); 
});

app.get('/login', (request, response) => {
    // response.sendFile(__dirname.slice(0, -3) + "/html/login.html");
    response.render('login'); 
});

app.post('/login', passport.authenticate('local', {
        successRedirect: '/me',
        failureRedirect: '/login',
        failureFlash: true
    }),
    (request, response) => {
        response.redirect('/me');
    });

app.get('/me', (request, response) => {
    response.render('me', { user: 'sasha' });
});

// app.post('/login', urlencodedParser, async(request, response) => {
//     if (!request.body) return response.sendStatus(400); 

//     let login = request.body.login.trim(); 
//     let password = request.body.password.trim();

//     let userExistData = await userExist(login, password); 

//     if (userExistData.exist) { 
//         let user = await getUser(userExistData.user_id);

//         console.log(await existSessionId(user.id));

//         await saveSessionId(user.id, request.sessionID);

//         request.flash('success');
//         response.redirect(301, `/me?id=${user.id}`);
//     } else console.log('user does not exist');
// });

// app.get('/me', async(request, response) => {
//     response.send(
//         `<h3>User</h3>` +
//         `<p>Role: ${role}</p>` +
//         `<p>ID: ${user.id}</p>` +
//         `<p>ФИО: ${user.surname} ${user.name} ${user.patronymic}</p>` +
//         `<p>Должность: ${user.post}</p>` +
//         `<p>Телефон: ${user.phone}</p>` +
//         `<p>email: ${user.email}</p>` +
//         `<p>Подразлеление: ${dept}</p>`
//     );
// });

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`[server] started on port ${port}`);
});
