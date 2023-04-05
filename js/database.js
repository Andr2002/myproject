require('dotenv').config();
const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production'; //  чтобы .env-файл не был виден на сервере
const connectionString = `postgresql://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT}/${process.env.DATABASE}`; //  для проверки, если в продакшне, то брать данные из env, иначе подклбчается по этому запросу

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD
});

// const pool = new Pool({
//     connectionString: isProduction ? process.env.DATABASE_URL : connectionString
// })

async function userExist(login, password) {
    return new Promise((resolve, reject) => {
            let sql = `select * from "user" where login='${login}' and "password"='${password}'`; //  получаем строку из бд

            pool.query(sql, (err, res) => {
                if (err) reject('[userExist] error in: ' + err.message);
                resolve(res); //  возвращаем result
            });
        })
        .then((res) => {
            if (res.rowCount > 0) //  если запись в бд есть
            {
                return {
                    exist: true,
                    user_id: res.rows[0].id,
                    role: res.rows[0].role
                };
            } else return { exist: false };
        })
        .catch((err) => {
            console.log(err);
        });
}

async function getUser(id) {
    return new Promise((resolve, reject) => {
            let sql = `select * from employee where id=${id}`;

            pool.query(sql, (err, res) => {
                if (err) reject('[getUser] error in: ' + err.message);

                resolve(res.rows[0]);
            });
        })
        .then((res) => {
            return res;
        })
        .catch((err) => {
            console.log(err);
        });
}

async function saveSessionId(user_id, session_id, response) {
    return new Promise((resolve, reject) => {
            let sql = `insert into "session"(id_emp, id_session) values(${user_id}, '${session_id}')`;

            pool.query(sql, (err, result) => {
                if (err && err.code == '23505') reject('[saveSessionId] пользователь уже вошел в систему'); //  код повторяющегося значения в базе

                if (err) reject('[saveSessionId] error in: ' + err.message);

                resolve(`[saveSessionId] status: success | user_id = ${user_id} | session_id = ${session_id}`);
            });
        })
        .then((res) => { console.log(res); })
        .catch((err) => { console.log(err); });
}

async function existSessionId(user_id) {
    return new Promise((resolve, reject) => {
            let sql = `select * from "session" where id_emp=${user_id}`;

            pool.query(sql, (err, result) => {
                if (err) reject('[existSessionId] error in: ' + err.message);

                resolve(result.rowCount !== 0); // если > 0, значит запись есть
            });
        })
        .then((res) => { return res; })
        .catch((err) => { console.log(err); });
}

async function getRoleById(id) {
    return new Promise((resolve, reject) => {
            let sql = `select "role" from "user" where id=${id}`;

            pool.query(sql, (err, result) => {
                if (err) reject('[getRoleById] error in: ' + err.message);

                resolve(result.rows[0].role);
            })
        })
        .then((res) => { return res; })
        .catch((err) => { console.log(err); });
}

async function getDeptById(id_dept) {
    return new Promise((resolve, reject) => {
            let sql = `select short_name from department where id=${id_dept}`;

            pool.query(sql, (err, result) => {
                if (err) reject('[getDeptById] error in: ' + err.message);

                resolve(result.rows[0].short_name);
            });
        })
        .then((res) => { return res; })
        .catch((err) => { console.log(res); })
}

module.exports = { userExist, getUser, saveSessionId, existSessionId, getRoleById, getDeptById };