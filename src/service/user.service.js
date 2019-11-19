import {QueryBuilderService} from "./querybuilder.service";
import {SqlService} from "./sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {ErrorCode} from "../enum/error-codes";

export class UserService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async getUserByEmail(user) {
        const query = `select * from ${table.user} where email = '${user.email}';`;
        return await SqlService.getSingle(query);
    }

	async createUser(user) {
		user.avatarBG = Utils.getRandomColor();
		const query = QueryBuilderService.getInsertQuery(table.user, user);
		return SqlService.executeQuery(query);
	}

    async getAllUsers() {
        const query = `select u.*, ur.name role
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where u.roleId <> 1
	    				order by id desc;`;
        return SqlService.executeQuery(query);
    }

    async getUsersByRole(roleId) {
        const query = `select * from ${table.user} where roleId = ${roleId};`;
        return SqlService.executeQuery(query);
    }

    async getUsersByWorkingStatus(status) {
        const query = `select * from ${table.user} where workingStatus = '${status}';`;
        return SqlService.executeQuery(query);
    }

    async searchUsers(searchCriteria) {
        let condition1 = ``;
        if (Array.isArray(searchCriteria.roleId)) {
            condition1 = `and roleId in ${Utils.getRange(searchCriteria.roleId)}`;
        } else if (searchCriteria.roleId > 0) {
            condition1 = `and roleId = '${searchCriteria.roleId}'`;
        }
        const condition2 = `and u.workingStatus = '${searchCriteria.workingStatus}'`;
        const condition3 = `and u.firmId = '${searchCriteria.firmId}'`;
        const query = `select u.*, ur.name role, ll.loginTime
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id
	    					left join ${dbview.lastLoginAudit} ll on ll.userId = u.id
                        where 
                        	u.id > 0 ${condition1}
							${!_.isEmpty(searchCriteria.workingStatus) ? condition2 : ''}
                        order by u.id desc
                        limit ${searchCriteria.limit} 
                        offset ${searchCriteria.offset};`;
        console.log(query);
        return SqlService.executeQuery(query);
    }

    async getLoginHistory(searchCriteria) {
        const query = `select 
							concat(u.firstName, ' ', u.lastName) userName, ur.name 'role',
							lh.operatingSystem os, lh.ip, lh.logTime, lh.loginStatus, '1 hr(s)' sessionDuration 
						from ${table.loginHistory} lh
							join ${table.user} u on u.id = lh.userId
							join ${table.userRole} ur on ur.id = u.roleId
						order by lh.logTime desc
						limit ${searchCriteria.limit} 
                        offset ${searchCriteria.offset}`;
        return SqlService.executeQuery(query);
    }

    async getUsersCount(searchCriteria) {
        let condition1 = ``;
        if (Array.isArray(searchCriteria.roleId)) {
            condition1 = `and roleId in ${Utils.getRange(searchCriteria.roleId)}`;
        } else if (searchCriteria.roleId > 0) {
            condition1 = `and roleId = '${searchCriteria.roleId}'`;
        }
        const condition2 = `and workingStatus = '${searchCriteria.workingStatus}'`;
        const query = `select count(1) count from ${table.user}
						where 
						    id > 0
                        	${condition1}
							${!_.isEmpty(searchCriteria.workingStatus) ? condition2 : ''};`;
        return SqlService.getSingle(query);
    }

    async updateWorkingStatus(model) {
        const query = `update ${table.user} 
                        set workingStatus = '${model.workingStatus}' 
                        where id = ${model.userId};`;
        return SqlService.executeQuery(query);
    }

    async deleteUser(userId) {
        const query = `delete from ${table.user} where id = ${userId};`;
        return SqlService.executeQuery(query);
    }

    async updateUser(user) {
        const condition = `where id = ${user.id}`;
        user.id = undefined;
        const query = QueryBuilderService.getUpdateQuery(table.user, user, condition);
        return SqlService.executeQuery(query);
    }

    async getUserById(id) {
        const query = `select u.*, ur.name role 
						from ${table.user} u
		 					left join ${table.userRole} ur on u.roleId = ur.id
						where
		  					u.id = ${id} limit 1;`;
        return await SqlService.getSingle(query);
    }

    async validateUser(user) {
        const query = `select u.id, ur.id roleId 
						from ${table.user} u
							left join ${table.userRole} ur on ur.id = u.roleId 
                        where u.email = '${user.email}' 
                        and u.password = '${user.password}';`;
        const u = await SqlService.getSingle(query);
        if (_.isEmpty(u)) {
            throw {
                code: ErrorCode.invalid_creds,
                message: "Email or password is incorrect"
            };
        }
        return u;
    }

    async updateLoginHistory(req, user) {
        const loginDetails = {
            userId: user.id,
            ip: req.ip,
            operatingSystem: req.body.operatingSystem,
            browser: req.body.browser,
            logTime: 'utc_timestamp()',
			loginStatus: 'login'
        };
        const query = QueryBuilderService.getInsertQuery(table.loginHistory, loginDetails);
        return SqlService.executeQuery(query);
    }

    async getLastLogin(userId, loginStatus = 'login') {

		const query = `select * from ${table.loginHistory} lh 
						where userId = ${userId} 
							and loginStatus = '${loginStatus}'
						order by id desc`;
		return await SqlService.getSingle(query);
	}

    async getAllUserRoles() {
        const query = `select * from ${table.userRole};`;
        return SqlService.executeQuery(query);
    }

    async saveOTP(otp, phone) {
        const model = {
            otp, phone, sentAt: 'utc_timestamp()'
        };
        let query = `select id from ${table.verification} where phone = ${phone};`;
        let result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            query = QueryBuilderService.getInsertQuery(table.verification, model);
        } else {
            const condition = `where phone = ${phone}`;
            query = QueryBuilderService.getUpdateQuery(table.verification, model, condition);
        }
        return await SqlService.executeQuery(query);
    }

    async verifyOTP(otp, phone) {
        let query = `select id from ${table.verification} 
						where phone = ${phone} 
							and otp = ${otp} 
							and TIMESTAMPDIFF(MINUTE, sentAt, utc_timestamp()) <= 15;`;
        let result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            throw 'otp not verified';
        }
        return true;
    }

    async verifyEmail(otp, userId) {
        let query = `select id from ${table.verification} 
						where userId = ${userId} 
							and otp = ${otp} 
							-- and TIMESTAMPDIFF(MINUTE, sentAt, utc_timestamp()) <= 15
						order by id desc;`;
        let result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            throw 'email not verified';
        }
        return true;
    }

    async updateDocs(docs) {
        const condition = `where id = ${docs.id}`;
        docs.id = undefined;
        const query = QueryBuilderService.getUpdateQuery(table.docs, docs, condition);
        return SqlService.executeQuery(query);
    }

	async getDocsByUserId(userId) {
		const query = `select * from ${table.docs} where userId = ${userId};`;
		return  SqlService.executeQuery(query);
	}

	async resetPassword(model) {
    	const password = _.isEmpty(model.newPassword) ? Utils.getRandomString(10) : model.newPassword;
		const query = `update ${table.user} set password = '${password}' where id = ${model.userId}`;
		await SqlService.executeQuery(query);
		return password;
	}

    async getSearchUsers(searchData) {
        const query = `select u.*, ur.name role
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where u.roleId <> 1
                            and u.firstName LIKE '%${searchData}%'
                            or u.lastName LIKE '%${searchData}%'
                            or u.email LIKE '%${searchData}%'
                        order by id desc;`;
        return SqlService.executeQuery(query);
    }
}
