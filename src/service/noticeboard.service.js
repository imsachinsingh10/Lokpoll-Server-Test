import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class NoticeboardService {
    constructor() {
    }

    async createNoticeboard(noticeboard) {
        const query = QueryBuilderService.getInsertQuery(table.noticeboard, noticeboard);
        return SqlService.executeQuery(query);
    }


    async updateNoticeboard(noticeboard) {
        const condition = `where id = ${noticeboard.id}`;
        const query = QueryBuilderService.getUpdateQuery(table.noticeboard, noticeboard, condition);
        return SqlService.executeQuery(query);
    }

    async deleteNoticeboard(noticeboardId) {
        const query = `delete from ${table.noticeboard} where id = ${noticeboardId};`;
        return SqlService.executeQuery(query);
    }

    async getAllNoticeboards(data) {
        const query = `select n.*
	    				from ${table.noticeboard} n
	    				 group by n.id
                         LIMIT ${data.body.limit} OFFSET ${data.body.offset}`;
        return SqlService.executeQuery(query);
    }

    async getTotalNoticeboardCount(data) {
        const query = `select count("id") count
	    				from ${table.noticeboard} n ;`;
        return SqlService.getSingle(query);
    }



}
