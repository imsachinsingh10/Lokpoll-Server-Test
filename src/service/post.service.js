import {QueryBuilderService} from "./querybuilder.service";
import {SqlService} from "./sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {ErrorCode} from "../enum/error-codes";

export class PostService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async createPost(post) {
        const query = QueryBuilderService.getInsertQuery(table.post, post);
        return SqlService.executeQuery(query);
    }

    async getAllUsers(data) {


        const query = `select u.*
	    				from ${table.user} u
	    				where u.roleId = 3
	    				order by id desc`;
        return SqlService.executeQuery(query);
    }
}
