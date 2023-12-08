require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD
});

class pomayak {
    async userExist(login, password) {
        return new Promise((resolve, reject) => { //  возврат промиса
                let sql = `select * from "user" where login='${login}' and "password"='${password}'`; //  запрос на получение данных из БД

                pool.query(sql, (err, res) => { //  подключение к БД
                    if (err) reject('[userExist] error in: ' + err.message); //  если ошибка, то возврат сообщения и прекращение выполнения метода
                    resolve(res); // если ошибок нет, то возврат result
                });
            })
            .then((res) => { //  если ошибок нет, то выполняется этот метод
                if (res.rowCount > 0) //  если количество записей по выполняемому выше запросу больше 0, то
                {
                    return { // возврат объекта со статусом true и  необходимой информацией
                        exist: true,
                        user_id: res.rows[0].id,
                        role: res.rows[0].role
                    };
                } else return { exist: false }; //  иначе возврат объекта со статусом false
            })
            .catch((err) => { console.log(err); }); //  если какая-то ошибка, то в консоль выводится сообщение о конкретной ошибке
    }

    async getUser(id) {
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
            .catch((err) => { console.log(err); });
    }

    async getRoleById(id) {
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

    async getDeptById(id_dept) {
        return new Promise((resolve, reject) => {
                let sql = `select * from department where id=${id_dept}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getDeptById] error in: ' + err.message);

                    resolve(result.rows[0]);
                });
            })
            .then((res) => { return res; })
            .catch((err) => { console.log(err); });
    }

    async saveSession(user_id, session_id) {
        return new Promise((resolve, reject) => {
                let sql = `insert into "session"(id_emp, id_session, date) values(${user_id}, '${session_id}', current_timestamp)`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[saveSession] error in: ' + err.message);
                    resolve(`[saveSession] user_id = ${user_id} | session_id = ${session_id}`);
                });
            })
            .then((res) => { console.log(res); })
            .catch((err) => { console.log(err); });
    }

    async checkSession(session_id, user_id) {
        return new Promise((resolve, reject) => {
                let sql = `select * from "session" where id_emp=${user_id} and id_session='${session_id}'`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[checkSession] error in: ' + err.message);

                    if (result.rowCount > 0) { //  если поле в таблице есть, то сессия существует
                        let current_date = Date.now(); //  текущая дата
                        let session_date = result.rows[0].date; //  дата из таблицы

                        if ((convertDateToUnix(current_date) - convertDateToUnix(session_date)) > 60 * 60 * 1000) //  ограничение по времени (1 час)
                        {
                            this.deleteSession(user_id); //  удаление сессии
                            resolve(false);

                        } else resolve(true);
                    } else resolve(false);
                });
            })
            .then((res) => { return res; })
            .catch((err) => { console.log(err); });

        function convertDateToUnix(date) {
            return Math.floor(new Date(date).getTime());
        }
    }

    async existSessionId(user_id) {
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

    async deleteSession(user_id) {
        return new Promise((resolve, reject) => {
                let sql = `delete from "session" where id_emp=${user_id}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[deleteSession] error in: ' + err.message);

                    if (result.rowCount > 0) {
                        resolve(`[deleteSession] user_id = ${user_id}`);
                        return;
                    }

                    resolve(`[deleteSession] no session`);
                });
            })
            .then((res) => { console.log(res); })
            .catch((err) => { console.log(err); });
    }

    async getAllRequests(year) { //  for admin
        return new Promise((resolve, reject) => {
                let sql = `select * from request where "year"=${year}`;

                let requests = [];

                pool.query(sql, (err, result) => {
                    if (err) reject('[getAllRequests] error in: ' + err.message);

                    if (result.rowCount == 0) {
                        resolve({ status: 0 });
                        return;
                    }

                    let data = result.rows;

                    for (let i in data) {
                        requests.push({
                            id: data[i].id,
                            id_emp: data[i].id_emp,
                            id_dept: data[i].id_dept,
                            reg_number: data[i].reg_number,
                            reg_date: data[i].reg_date,
                            year: data[i].year,
                            status: data[i].status,
                            type: data[i].type,
                            total_price: data[i].total_price,
                            file_name: data[i].file_name,
                            file_path: data[i].file_path,
                            note: data[i].note,
                        });

                        resolve(requests);
                    }
                });
            })
            .then((requests) => { return requests; })
            .catch((err) => { console.log(err); });
    }

    async getRequests(id_emp) { //  for user
        return new Promise((resolve, reject) => {
                let sql = `select * from request where id_emp=${id_emp}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getRequests] error in: ' + err.message);
                    if (result.rowCount > 0) resolve(result.rows);
                    else resolve({ status: 0 });
                })
            })
            .then((requests) => { return requests; })
            .catch((err) => console.log(err));
    }

    async getRequestById(user_id) {
        return new Promise((resolve, reject) => {
                let sql = `select * from request where id_emp=${user_id}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getRequestById] error in: ' + err.message);

                    if (result.rowCount === 0) {
                        resolve({ status: 0, message: 'Заявок нет' });
                        return;
                    }

                    resolve(result.rows);
                });
            })
            .then((requests) => { return requests; })
            .catch((err) => console.log(err));
    }

    async getFullUserData(user_id) {
        let user = await this.getUser(user_id);
        let dept = await this.getDeptById(user.id_dept);
        let role = await this.getRoleById(user_id);

        return {
            id: user.id,
            surname: user.surname,
            name: user.name,
            patronymic: user.patronymic,
            phone: user.phone,
            post: user.post,
            email: user.email,
            role: role,
            archive: user.archive,
            dept: {
                id: user.id_dept,
                short_name: dept.short_name,
                full_name: dept.full_name,
                archive: dept.archive
            }
        };
    }

    async saveReqFile(file) {
        return new Promise((resolve, reject) => {
                let sql = ``;

                pool.query(sql, (err, result) => {
                    if (err) reject('[saveReqFile] error in: ' + err.message);

                    resolve('[saveReqFile] success');
                });
            })
            .then((res) => { console.log(res); })
            .catch((err) => { console.log(err) });
    }

    async saveRequest(req) {
        return new Promise((resolve, reject) => {
                let sql = `
                insert into request
                (id_emp, id_dept, reg_number, reg_date, "year", status, "type", total_price, file_name, file_path, note)
                values
                (${req.id_emp}, ${req.id_dept}, '${req.reg_number}', '${req.reg_date}', ${req.year}, '${req.status}', '${req.type}', ${req.total_price}, '${req.file_name}', '${req.file_path}', '${req.note}')
                `;

                pool.query(sql, (err, result) => {
                    if (err) reject('[saveRequest] error in: ' + err.message);

                    resolve('[saveRequest] success');
                });
            })
            .then((res) => { console.log(res); })
            .catch((err) => { console.log(err); });
    }

    async getReqByRegNumber(reg_number) {
        return new Promise((resolve, reject) => {
                let sql = `select * from request where reg_number='${reg_number}'`;
                // let sql = `select * from request where id_emp=${id_emp} and reg_number='${reg_number}'`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getReqByRegNumber] error in: ' + err.message);

                    resolve(result.rows[0]);
                });
            })
            .then((res) => { return res; })
            .catch((err) => console.log(err));
    }

    async saveRequestPositions(id_req, positions) {
        return new Promise((resolve, reject) => {
                for (let i in positions) {
                    let sql = `
                        insert into request_position
                        (id_req, company, model, "version", count, price, category, note, count_r, refusal, id)
                        values 
                        (${id_req}, '${positions[i].company}', '${positions[i].model}', '${positions[i].version}', ${positions[i].count}, ${positions[i].price}, ${positions[i].category}, '${positions[i].note}', 0, false, ${Number(i) + 1})
                    `;

                    pool.query(sql, (err, result) => {
                        if (err) reject('[saveRequestPositions] error in: ' + err.message);

                        resolve('[saveRequestPositions] success');
                    });
                }
            })
            .then((res) => { console.log(res); })
            .catch((err) => { console.log(err); });
    }

    async getSessionId(id_emp) {
        return new Promise((resolve, reject) => {
                let sql = `select * from "session" where id_emp=${id_emp}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getSessionId] error in: ' + err.message);

                    if (result.rowCount > 0) {
                        resolve({
                            status: 1,
                            id: result.rows[0].id_session,
                            date: result.rows[0].date
                        });
                    } else resolve({ status: 0 });
                });
            })
            .then((session_id) => { return session_id; })
            .catch((err) => { console.log(err); });
    }

    async getRequestPositions(id_req) {
        return new Promise((resolve, reject) => {

                let sql = `select * from request_position where id_req=${id_req}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getRequestPositions] error in: ' + err.message);

                    if (result.rowCount > 0) {
                        resolve({
                            status: 1,
                            positions: result.rows
                        });

                        return;
                    }

                    resolve({ status: 0 });
                });
            })
            .then((request_positions) => { return request_positions; })
            .catch((err) => console.log(err));
    }

    async getReqByReqId(id_req) {
        return new Promise((resolve, reject) => {
                let sql = `select * from request where id=${id_req}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getReqByReqId] error in: ' + err.message);

                    resolve(result.rows[0]);
                });
            })
            .then((request) => { return request; })
            .catch((err) => console.log(err));
    }

    async getAllCategories() {
        return new Promise((resolve, reject) => {
                let sql = `select * from category`;

                let categories = [];

                pool.query(sql, (err, result) => {
                    if (err) reject('[getAllCategories] error in: ' + err.message);

                    for (let i in result.rows) {
                        categories.push(result.rows[i].category);
                    }

                    resolve(categories);
                });
            })
            .then((categories) => { return categories; })
            .catch((err) => { console.log(err); });
    }

    async getCategoryById(id) {
        return new Promise((resolve, reject) => {
                let sql = `select * from category where id=${id}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getCategoryById] error in: ' + err.message);

                    resolve(result.rows[0]);
                });
            })
            .then((category) => { return category; })
            .catch((err) => { console.log(err); });
    }

    async updateStatusAndNote(reg_number, status, note) {
        return new Promise((resolve, reject) => {
                let sql = `
                update request 
                set status='${status}', note='${note}'
                where reg_number='${reg_number}'
                `;

                pool.query(sql, (err, result) => {
                    if (err) reject('[updateStatusAndNote] error in: ' + err.message);

                    resolve('[updateStatusAndNote] success');
                });
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
    }

    async updatePositions(id_req, data) {
        return new Promise((resolve, reject) => {
                for (let i in data.positions) {
                    let sql = `
                    UPDATE request_position 
                    SET company='${data.positions[i].company}', model='${data.positions[i].model}', version='${data.positions[i].version}', count=${data.positions[i].count}, count_r=${data.positions[i].count_r}, price=${data.positions[i].price}, category=${data.positions[i].category}, note='${data.positions[i].note}', refusal=${data.positions[i].refusal}
                    WHERE id_req=${id_req} and id=${data.positions[i].id}
                    `;

                    pool.query(sql, (err, result) => {
                        if (err) reject('[updatePositions] error in: ' + err.message);

                        resolve('[updatePositions] success');
                    });
                }
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
    }

    async getTotalPrice(id_req) {
        return new Promise((resolve, reject) => {
                let sql = `select * from request_position where id_req=${id_req}`;
                // let sql = `select count_r, price from request_position where id_req=${id_req}`;

                let total_price = 0;

                pool.query(sql, (err, result) => {
                    if (err) reject('[getTotalPrice] error in: ' + err.message);

                    for (let i in result.rows) {
                        total_price += parseFloat(result.rows[i].count_r) * parseFloat(result.rows[i].price);
                    }

                    resolve(total_price);
                });
            })
            .then((total_price) => { return total_price })
            .catch((err) => console.log(err));
    }

    async saveTotalPrice(id_req, total_price) {
        return new Promise((resolve, reject) => {
                let sql = `
                update request 
                set total_price=${total_price}
                where id=${id_req}
                `;

                pool.query(sql, (err, result) => {
                    if (err) reject('[saveTotalPrice] error in: ' + err.message);

                    resolve('[saveTotalPrice] success');
                });
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
    }

    async deleteAllRequestPositions(id_req) {
        return new Promise((resolve, reject) => {
                let sql = `delete from request_position where id_req=${id_req}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[deleteAllRequestPositions] error in: ' + err.message);

                    resolve('[deleteAllRequestPositions] success');
                });
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
    }

    async deleteRequest(id_req) {
        return new Promise((resolve, reject) => {
                let sql = `delete from request where id=${id_req}`;

                pool.query(sql, (err, result) => {
                    if (err) reject('[deleteRequest] error in: ' + err.message);

                    resolve('[deleteRequest] success');
                });
            })
            .then((res) => console.log(res))
            .catch((err) => console.log(err));
    }
}

module.exports = pomayak;