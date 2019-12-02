import {QueryBuilderService} from "./querybuilder.service";
import {SqlService} from "./sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {AppCode} from "../enum/app-code";

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
	    				where u.roleId <> 1
	    				order by id desc`;
        return SqlService.executeQuery(query);
    }

    async getTotalPosts(data) {
        const query = `select count("id") totalPosts
	    				from ${table.post} u`;
        return SqlService.getSingle(query);
    }

    async getAllPosts() {
        const query = `select p.id postId, p.createdAt, p.description,
                            u.firstName, u.lastName,
                            pm.type, pm.url,
                            m.name 'mood'
                        from post p 
                            left join post_media pm on pm.postId = p.id
                            join user u on u.id = p.userId
                            join mood m on m.id = p.moodId;`;
        return SqlService.executeQuery(query);
    }

}
