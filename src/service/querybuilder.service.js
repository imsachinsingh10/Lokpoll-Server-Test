import * as _ from 'lodash';

export class QueryBuilderService {

    static getInsertQuery(tableName, model) {
        let query = `insert into ${tableName} (`;
        for (const prop in model) {
            const value = model[prop];
            if (value !== undefined) {
                query += prop + ', '
            }
        }
        query = query.slice(0, -2);
        query += ') values (';
        for (const prop in model) {
            const value = model[prop];
            if (value === undefined) {
                continue;
            }
            if (typeof value === 'number' || value === null || value.indexOf('(') > -1) {
                query += `${value}, `;
            } else {
                query += `'${value}', `;
            }
        }
        query = query.slice(0, -2);
        query += ');';
        // console.log('query', query);
        return query;
    }

    static getUpdateQuery(tableName, model, condition) {
        let query = `update ${tableName} set `;
        for (const prop in model) {
            const value = model[prop];
            if (value === undefined || value === 'null') {
                continue;
            }
            if (value === '') {
                query += `${prop} = '', `
            } else if (typeof value === 'number' || value === null || value.indexOf('(') > -1) {
                query += `${prop} = ${value}, `;
            } else {
                query += `${prop} = '${value}', `;
            }
        }
        query = query.slice(0, -2);
        query += ` ${condition};`;
        // console.log('update query', query);
        return query;
    }

    static getMultiInsertQuery(tableName, modelArray) {
        const model = modelArray[0];
        let query = `insert into ${tableName} (`;
        for (const prop in model) {
            const value = model[prop];
            if (value !== undefined) {
                query += prop + ', '
            }
        }
        query = query.slice(0, -2);
        query += ') values ';
        _.each(modelArray, model => {
            query += this.getRowValues(model) + ', ';
        });
        query = query.slice(0, -2);
        query += ';';
        console.log('query', query);
        return query;
    }

    static getRowValues(row) {
        let rowString = '(';
        for (const field in row) {
            const value = row[field];
            if (value === undefined) {
                continue;
            }
            if (value !== "" && !isNaN(value) || value.indexOf('(') > -1) {
                rowString += `${value}, `;
            } else {
                rowString += `'${value}', `;
            }
        }
        rowString = rowString.slice(0, -2);
        rowString += ')';
        return rowString;
    }
}
