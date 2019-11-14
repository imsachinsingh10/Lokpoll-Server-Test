import {Config} from '../config'
import * as mysql from 'mysql';
import {Environment} from "../enum/common";

const db = Config.env === Environment.dev ? Config.dbDev : Config.dbProd;
const pool = mysql.createPool(db);
console.log('mysql pool created');

export class SqlService {

    static executeQuery(query) {
        // console.log('query', query);
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    connection.query(query, (err1, rows) => {
                        if (err1) {
                            connection.release();
                            reject(err1);
                            return;
                        }
                        const str = JSON.stringify(rows);
                        const result = JSON.parse(str);
                        connection.release();
                        resolve(result);
                    });
                }
            });
        });
    }

    static getSingle(query) {
        // console.log('query', query);
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    connection.query(query, (err1, rows) => {
                        if (err1) {
                            connection.release();
                            reject(err1);
                            return;
                        }

                        const str = JSON.stringify(rows);
                        let result = JSON.parse(str);
                        if (result && result.length > 0) {
                            result = result[0];
                        } else {
                            result = {};
                        }
                        connection.release();
                        resolve(result);
                    });
                }
            });
        });
    }

    static getTable(tableName, recordCount = 1) {
        const query = `select * from ${tableName};`;
        if (recordCount === 1) {
            return this.getSingle(query);
        } else {
            return this.executeQuery(query);
        }
    }
}
//
// pool.on('connection', function (connection) {
//     connection.query('SET SESSION auto_increment_increment=1')
// });
