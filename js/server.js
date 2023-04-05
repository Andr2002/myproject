//  type = commonjs
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

app.set('view engine', 'ejs'); //  for ejs

const urlencodedParser = express.urlencoded({ extended: false }); // чтобы брать данные из форм

app.use(express.static(__dirname.slice(0, -3))); //  для того, чтобы отображались стили (каталог, где находимся, когда загружается страницы)
app.use(express.json()); //  для того, чтобы парсить json, который будет прилетать в запросах
app.use(cookieParser()); //  для того, чтобы парсить куки

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}));

//  ПЕРЕВЕСТИ ВСЕ НА ejs

app.use(passport.initialize()); //  for passport
app.use(passport.session()); //  for passport

app.use(flash());

app.get('/', (request, response) => {
    response.render('index', { user: 'andrey' }); // название_файла.ejs
});

app.get('/login', (request, response) => {
    // response.sendFile(__dirname.slice(0, -3) + "/html/login.html");
    response.render('login'); // название_файла.ejs
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
//     if (!request.body) return response.sendStatus(400); //  если данных нет

//     let login = request.body.login.trim(); //  логин из формы
//     let password = request.body.password.trim(); //  пароль из формы

//     let userExistData = await userExist(login, password); //  проверка на существование user

//     if (userExistData.exist) { //  если юзер есть
//         let user = await getUser(userExistData.user_id);

//         console.log(await existSessionId(user.id));

//         await saveSessionId(user.id, request.sessionID);

//         request.flash('success');
//         response.redirect(301, `/me?id=${user.id}`); //  переадресация и передача данных
//     } else console.log('user does not exist');
// });

// app.get('/me', async(request, response) => {
//     let user = await getUser(request.query.id);
//     let role = await getRoleById(request.query.id);
//     let dept = await getDeptById(user.id_dept);

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

// запрос на добавление в таблицу employee
//insert into employee(id, surname, "name", patronymic, post, phone, email, archive,id_dept) 
//values(550040, 'Скляров','Андрей','Эльшанович','техник','3-19-79','saye@docs.mayak.ru',false, 1)