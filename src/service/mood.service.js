import {QueryBuilderService} from "./querybuilder.service";
import {SqlService} from "./sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {ErrorCode} from "../enum/error-codes";

export class MoodService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async getMoodByName(mood) {
        const query = `select * from ${table.mood} where name = '${mood.name}';`;
        return await SqlService.getSingle(query);
    }

    async createMood(mood) {
        const query = QueryBuilderService.getInsertQuery(table.mood, mood);
        return SqlService.executeQuery(query);
    }

    async getAllMoods(data) {

        const condition2 = ` where u.name LIKE '%${data.searchText}%'`;
        const query = `select u.*
	    				from ${table.mood} u
	    				${!_.isEmpty(data.searchText) ? condition2 : ''}
	    				order by id desc`;
        return SqlService.executeQuery(query);
    }

    async updateMood(mood) {
        const condition = `where id = ${mood.id}`;

        const query = QueryBuilderService.getUpdateQuery(table.mood, mood, condition);
        return SqlService.executeQuery(query);
    }

    async deleteMood(moodId) {
        const query = `delete from ${table.mood} where id = ${moodId};`;
        return SqlService.executeQuery(query);
    }
}
