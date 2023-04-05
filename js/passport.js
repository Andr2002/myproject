const localStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD
});

function initialize(passport) {
    const authenticateUser = (login, password, done) => {

        let sql = `select * from "user" where login='${login}' and "password"='${password}'`;

        pool.query(sql, (err, result) => {
            if (err) throw (err);

            if (result.rows[0] > 0) {
                return done(null, user);
            } else return done(null, false, { message: 'Неправильный пароль или имя пользователя' });
        });
    }

    passport.use(
        new localStrategy({
            usernameField: 'login',
            passwordField: 'password'
        }, authenticateUser)
    );

    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        let sql = `select * from "user" where id=${id}`;

        pool.query(sql, (err, result) => {
            if (err) throw err;

            return done(null, result.rows[0]);
        });
    });
}

module.exports = { initialize };
