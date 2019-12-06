import {QueryBuilderService} from "./base/querybuilder.service";
import {SqlService} from "./base/sql.service";
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
        const query = `select p.id, p.createdAt, p.description, p.latitude, p.longitude , 
                        0 'respects', 0 'comments',
                        pst.name 'postType',
                        prt.name 'profileType',
                        pro.name 'displayName', 
                        u.name userName, 
                        pm.type, pm.url,
                        m.name 'mood'
                        from post p 
                        left join post_media pm on pm.postId = p.id
                        join user u on u.id = p.userId
                        left join mood m on m.id = p.moodId
                        join profile_type prt on prt.id = p.profileTypeId
                        join post_type pst on pst.id = p.postTypeId
                        left join profile pro on pro.profileTypeId = prt.id and pro.userId = u.id
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getAllPostTypes() {
        return SqlService.getTable(table.postType, 0);
    }
}

