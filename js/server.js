require('dotenv').config(); //  импорт необходимого фреймворка
const express = require('express'); //  импорт необходимого фреймворка
const http = require('http');
const cookieParser = require('cookie-parser'); //  импорт необходимого фреймворка
const bodyParser = require('body-parser');
const session = require('express-session'); //  импорт необходимого фреймворка
const alert = require('alert'); //  импорт необходимого фреймворка
const fileUpload = require('express-fileupload'); //  импорт необходимого фреймворка
const pomayak = require('../js/database.js'); //  импорт класса

let mayak = new pomayak(); //  определение класса

const app = express(); // подключение express

const port = process.env.PORT || 3000; // импорт порта из enx-файла

app.set('view engine', 'ejs'); //  установка настроек для работы с ejs-файлами

const urlencodedParser = express.urlencoded({ extended: false }); // установка настроек для сбора данных из форм

app.use(fileUpload()); // использование middleware express для загрузки файлов
app.use(express.static(__dirname.slice(0, -3))); //  использование middleware express для отображения стилей 
app.use(express.json()); //использование middleware express для отправки и получения json
app.use(cookieParser(process.env.SESSION_KEY)); //  использование middleware express для работы с cookies
app.use(session({ //  определение настроек сессии
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: false,
    cookie: {
        path: '/',
        secure: true,
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 1 час
    }
}));

app.get('/', async(request, response) => {
    response.redirect('login');
});

app.get('/login', urlencodedParser, (request, response) => {
    response.render('login');
});

app.post('/login', urlencodedParser, async(request, response) => { //  отправка post-запроса на сервер 
    if (!request.body) return response.sendStatus(400); //  если проблема с запросом, то отправляется ошибка с кодом 400

    let login = request.body.login.trim(); //  логин из формы
    let password = request.body.password.trim(); //  пароль из формы
    let userExistData = await mayak.userExist(login, password); //  получение данных о существовании user

    if (userExistData.exist) { //  если user существует
        let user = await mayak.getUser(userExistData.user_id); //  получение данных о пользователе
        let role = await mayak.getRoleById(user.id); //  получение данных о роли пользователя

        response.cookie('user_id', `${user.id}`, { signed: true }); //  создание cookies и вложение туда user_id

        if (await mayak.checkSession(request.sessionID, user.id)) { //  если данные о сессии в БД есть
            role === 'admin' ? response.redirect(301, `/all-requests?session_id=${request.sessionID}`) : // если admin, то перенаправление на страницу для админа
                response.redirect(301, `/my-requests?session_id=${request.sessionID}`); //  иначе на страницу для обычного пользователя и передача параметром session_id
        } else { //  если сессии нет
            await mayak.deleteSession(user.id); //  удаление сессии

            await mayak.saveSession(user.id, request.sessionID); //  сохранение новой сессии

            role === 'admin' ? response.redirect(301, `/select-year?session_id=${request.sessionID}`) : // если admin, то перенаправление на страницу для админа
                response.redirect(301, `/my-requests?session_id=${request.sessionID}`); //  иначе на страницу для обычного пользователя и передача параметром session_id
        }

    } else { //  если user не существует
        alert('Неправильный пароль или имя пользователя!');
        response.redirect('/login'); //  перенаправление на страницу авторизации
    }
});

app.get('/select-year', urlencodedParser, async(request, response) => {
    if (!await mayak.checkSession(request.query.session_id, request.signedCookies.user_id)) {
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    let admin = await mayak.getFullUserData(request.signedCookies.user_id);

    response.render('select-year', { user: admin });
});

app.get('/all-requests', async(request, response) => { //  admin page
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куках нет
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    if (!await mayak.checkSession(request.query.session_id, request.signedCookies.user_id)) { //  если user_id и session_id не совпадают
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    const admin = await mayak.getFullUserData(request.signedCookies.user_id);

    if (admin.role == 'user') {
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    let requests = await mayak.getAllRequests(request.query.year);

    if (requests.hasOwnProperty('status')) {
        if (requests.status == 0) response.render('admin', { request: requests, user: admin });
    } else {
        for (let i in requests) {
            let user = await mayak.getUser(requests[i].id_emp);
            let dept = await mayak.getDeptById(requests[i].id_dept);

            requests[i].dept_short_name = dept.short_name;
            requests[i].emp_surname = user.surname;
            requests[i].emp_name = user.name;
            requests[i].emp_patronymic = user.patronymic;
            requests[i].emp_phone = user.phone;
            requests[i].total_price = correctData(requests[i].total_price);
        }

        response.render('admin', { request: requests, user: admin });
    }

    function correctData(number) {
        let float = `${number.toFixed(2)}`.split('.')[1];

        if (Number(number) < 1000) return number;

        let ost = 0; //  остаток
        let thousands = 0; //  тысячи
        let millions = 0; //  миллионы

        if (parseInt(number) > 1000 && parseInt(number) < Math.pow(10, 6)) {
            thousands = parseInt(number / 1000);
            ost = parseInt(number - thousands * 1000);
            return `${thousands} ${correctReturn(ost) + ', ' + float}`;
        }

        if (parseInt(number) > Math.pow(10, 6)) {
            millions = parseInt(number / Math.pow(10, 6));
            thousands = parseInt(number / 1000 % 1000);
            ost = parseInt(number - millions * Math.pow(10, 6) - thousands * 1000);
            return `${millions} ${correctReturn(thousands)} ${correctReturn(ost) + ', ' + float}`;
        }

        function correctReturn(number) {
            if (Number(number) < 10) return '00' + number;
            if (Number(number) >= 10 && Number(number) < 100) return '0' + number;
            else return number;
        }
    }
});

app.get('/my-requests', async(request, response) => { //  user page
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куках нет
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    if (!await mayak.checkSession(request.query.session_id, request.signedCookies.user_id)) { //  если user_id и session_id не совпадают
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    const user = await mayak.getFullUserData(request.signedCookies.user_id);

    if (user.role == 'admin') {
        alert('Сессия завершена!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    let requests = await mayak.getRequestById(request.signedCookies.user_id);

    response.render('user', { user: user, request: requests });
});

app.get('/create-request', urlencodedParser, async(request, response) => {
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куки нет
        alert('Сессия завершена!');
        response.redirect('/login');
        return;
    }

    response.render(`create-request`);
});

app.post('/create-request', urlencodedParser, async(request, response, next) => { //  создание заявки
    const user = await mayak.getFullUserData(request.signedCookies.user_id);

    const file = request.files.file;
    const folder = 'request_files';
    const file_name = `${user.id}_${request.body.number}.${file.name.split('.')[1]}`;

    const path = `${__dirname.slice(0, -3)}/${folder}/${file_name}`;

    file.mv(path, (err) => {
        if (err) throw (err);
        console.log('[file] saved');
    });

    let requestData = {
        id_emp: user.id, //  или request.signedCookies.user_id
        id_dept: user.dept.id,
        reg_number: request.body.number,
        reg_date: request.body.date,
        year: request.body.year,
        status: 'новая',
        type: request.body.type,
        total_price: 0, //  изначально 0, потом прописать метод, который вычисляет (напр. select SUM(price) as sum from request_position where id_req=1)
        file_name: file_name,
        file_path: `/${folder}/${file_name}`,
        note: request.body.note
    };

    await mayak.saveRequest(requestData);

    let positions = [];

    //  тут должна быть проверка на правильное заполнение полей

    if (typeof(request.body.category) == 'string') { //  одна позиция
        positions.push({
            company: request.body.company,
            model: request.body.model,
            version: excludeUndefined(request.body.version),
            count: convertToInt(request.body.count),
            price: convertToInt(request.body.price),
            category: request.body.category,
            note: excludeUndefined(request.body.position_note)
        });
    }

    if (typeof(request.body.category) == 'object') { //  больше одной позиции
        for (let i in request.body.category) {
            positions.push({
                company: request.body.company[i],
                model: request.body.model[i],
                version: excludeUndefined(request.body.version[i]),
                count: convertToInt(request.body.count[i]),
                price: convertToInt(request.body.price[i]),
                category: request.body.category[i],
                note: excludeUndefined(request.body.position_note[i])
            });
        }
    }

    let id_req = await mayak.getReqByRegNumber(requestData.reg_number);

    await mayak.saveRequestPositions(id_req.id, positions);

    let session = await mayak.getSessionId(request.signedCookies.user_id);

    if (user.role == 'admin') response.redirect(`/select-year?session_id=${session.id}`);
    else response.redirect(`/my-requests?session_id=${session.id}`);

    function convertToInt(data) {
        if (!Number(data) || data === undefined) return 0;
        else if (Number(data) < 0) return Math.abs(data);
        else return data;
    }

    function excludeUndefined(data) { //  исключение/замена undefined
        if (data === undefined) return '';
        else return data;
    }
});

app.get('/get-categories', urlencodedParser, async(request, response) => {
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куки нет
        // alert('Вам нужно авторизоваться! /get-categories');
        response.redirect('/login');
        return;
    }

    // let role = await mayak.getRoleById(request.signedCookies.user_id);

    // if (role != 'admin') {
    //     alert('Ошибка доступа!');
    //     console.log('/get-categories');
    //     await mayak.deleteSession(request.signedCookies.user_id);
    //     response.redirect('/login');
    //     return;
    // }

    let categories = await mayak.getAllCategories();

    response.send(categories);
});

app.get('/back', async(request, response) => {
    let user = await mayak.getFullUserData(request.signedCookies.user_id);
    let session = await mayak.getSessionId(user.id);

    if (session.status == 0) {
        alert('Сессия завершена!');
        response.redirect('/login');
        return;
    }

    user.role == 'admin' ? response.redirect(`select-year?session_id=${session.id}`) : response.redirect(`my-requests?session_id=${session.id}`);
});

app.get('/get-request', async(request, response) => {
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куки нет
        alert('Вам нужно авторизоваться! /get-request');
        response.redirect('/login');
        return;
    }

    let role = await mayak.getRoleById(request.signedCookies.user_id);

    if (role != 'admin' || Object.keys(request.query).length == 0) {
        alert('Ошибка доступа!');
        console.log('/get-request');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    let id_req = await mayak.getReqByRegNumber(request.query.reg_number); //  id заявки
    let positions = await mayak.getRequestPositions(id_req.id); //  позиции заявки
    let req = await mayak.getReqByReqId(id_req.id); //  данные о заявке
    let responsible = await mayak.getFullUserData(req.id_emp); //  данные об ответственном
    let categories = await mayak.getAllCategories();
    let edit_positions = (positions, categories) => {
        for (let i = 0; i < positions.length; i++) {
            positions[i].category = categories[positions[i].category - 1];
        }

        return positions;
    }

    let requestData = {
        status: 1,
        responsible: responsible,
        request: req,
        positions: edit_positions(positions.positions, categories),
        categories: categories
    };

    response.send(requestData);
});

app.post('/update-req-pos', urlencodedParser, async(request, response) => { //  сохранение позиций заявки
    let req = await mayak.getReqByRegNumber(request.body.reg_number);

    let id_req = req.id;

    await mayak.updatePositions(id_req, request.body);

    await mayak.updateStatusAndNote(request.body.reg_number, request.body.status, request.body.note);

    let total_price = await mayak.getTotalPrice(id_req);

    await mayak.saveTotalPrice(id_req, total_price);
});

app.post('/delete-request', async(request, response) => {
    let req = await mayak.getReqByRegNumber(request.body.reg_number);

    await mayak.deleteAllRequestPositions(req.id);

    await mayak.deleteRequest(req.id);
});

app.get('/get-session-id', urlencodedParser, async(request, response) => {
    if (request.signedCookies['user_id'] == undefined) { //  если user_id в куки нет
        response.redirect('/login');
        return;
    }

    let role = await mayak.getRoleById(request.signedCookies.user_id);

    if (role != 'admin') {
        console.log('/get-session-id');
        alert('Ошибка доступа!');
        await mayak.deleteSession(request.signedCookies.user_id);
        response.redirect('/login');
        return;
    }

    let session = await mayak.getSessionId(request.signedCookies.user_id);
    let year = request.query.year;

    response.redirect(`/all-requests?session_id=${session.id}&year=${year}`);
});

app.get('/exit', urlencodedParser, async(request, response) => {
    await mayak.deleteSession(request.signedCookies.user_id);
    response.clearCookie('user_id'); //  очищаем cookie
    response.redirect('/login');
});

// const server = http.createServer(app);

app.listen(port, () => {
    console.log(`[server] started on port ${port}`);
});