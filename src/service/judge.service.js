import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./common/utils";
import {AppCode} from "../enum/app-code";
import {ErrorModel} from "../model/common.model";
import {Message, ProfileType} from "../enum/common.enum";
import Validator from "./common/validator.service";
import {FirebaseController} from "../controller/firebase.controller";

export class JudgeService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
        this.firebaseController = new FirebaseController();
    }

    async getJudgeByEmail(user) {
        const query = `select * from ${table.judge} where email = '${user.judge}';`;
        return await SqlService.getSingle(query);
    }


    async createJudge(judge) {
        judge.password = '1234';
        const query = QueryBuilderService.getInsertQuery(table.judge, judge);
        return SqlService.executeQuery(query);
    }

    async getAllJudges() {
        const query = `select j.*
	    				from ${table.judge} j 
                        order by id desc;`;
        return SqlService.executeQuery(query);
    }




    async getLoginHistory(searchCriteria) {
        const query = `select 
							u.name userName, ur.name 'role',
							lh.operatingSystem os, lh.ip, lh.logTime, lh.loginStatus, '1 hr(s)' sessionDuration 
						from ${table.loginHistory} lh
							join ${table.user} u on u.id = lh.userId
							join ${table.userRole} ur on ur.id = u.roleId
						order by lh.logTime desc
						limit ${searchCriteria.limit} 
                        offset ${searchCriteria.offset}`;
        return SqlService.executeQuery(query);
    }

    async deleteJudge(judgeId) {
        const query = `delete from ${table.judge} where id = ${judgeId};`;
        return SqlService.executeQuery(query);
    }

    async updateJudge($judge) {
        const judge = _.clone($judge);
        const condition = `where id = ${judge.id}`;
        judge.id = undefined;
        const query = QueryBuilderService.getUpdateQuery(table.judge, judge, condition);
        return SqlService.executeQuery(query);
    }
    async validateUserByEmail(user) {
        if (_.isEmpty(user) || _.isEmpty(user.email) || _.isEmpty(user.password)) {
            throw {
                code: AppCode.invalid_creds,
                message: "Email or password is missing"
            };
        }
        const query = `select u.id, ur.id roleId 
						from ${table.user} u
							left join ${table.userRole} ur on ur.id = u.roleId 
                        where u.email = '${user.email}' 
                        and u.password = '${user.password}';`;
        const u = await SqlService.getSingle(query);
        if (_.isEmpty(u)) {
            throw {
                code: AppCode.invalid_creds,
                message: "Email or password is incorrect"
            };
        }
        return u;
    }

}
