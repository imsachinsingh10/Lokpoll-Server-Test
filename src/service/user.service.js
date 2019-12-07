import {QueryBuilderService} from "./base/querybuilder.service";
import {SqlService} from "./base/sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {AppCode} from "../enum/app-code";
import {ErrorModel} from "../model/common.model";
import {Message} from "../enum/common";
import Validator from "./validator.service";

export class UserService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async getUserByEmail(user) {
        const query = `select * from ${table.user} where email = '${user.email}';`;
        return await SqlService.getSingle(query);
    }

    async getUserByPhone(phone) {
        const query = `select * from ${table.user} where phone = '${phone}';`;
        return await SqlService.getSingle(query);
    }

    async createUser(user) {
        user.avatarBG = Utils.getRandomColor();
        user.password = '1234';
        const query = QueryBuilderService.getInsertQuery(table.user, user);
        return SqlService.executeQuery(query);
    }

    async getAllUsers(data) {
        const condition1 = ` and u.roleId = 3`;
        const condition2 = ` and u.name LIKE '%${data.body.searchText}%'
                            or u.email LIKE '%${data.body.searchText}%'`;
        const query = `select u.*, ur.name role
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where u.roleId <> 1
	    				   ${(data.user.roleId == 2) ? condition1 : ''}
	    				    ${!_.isEmpty(data.body.searchText) ? condition2 : ''}
	    				order by id desc
	    				LIMIT ${data.body.limit} OFFSET ${data.body.offset}`;
        return SqlService.executeQuery(query);
    }

    async getAgeRanges() {
        const query = `select * from ${table.ageRange}`;
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

    async updateUser($user) {
        const user = _.clone($user);
        const condition = `where id = ${user.id}`;
        user.id = undefined;
        const query = QueryBuilderService.getUpdateQuery(table.user, user, condition);
        return SqlService.executeQuery(query);
    }

    async getUserById(id) {
        const query = `select u.id, u.name, u.email, u.phone, 
                                u.gender, u.imageUrl, u.bgImageUrl, u.address, u.ageRangeId, 
                                u.profession, u.company, u.latitude, u.longitude,
                        ur.name role 
						from ${table.user} u
		 					left join ${table.userRole} ur on u.roleId = ur.id
						where
		  					u.id = ${id} limit 1;`;
        return SqlService.getSingle(query);
    }

    async getHobbiesByUserId(id) {
        const query = `select hobby from ${table.hobby} where userId = ${id};`;
        const result = await SqlService.executeQuery(query);
        return result.map((r) => r.hobby);
    }

    async updateHobbies(hobbies, userId) {
        const query1 = `delete from ${table.hobby} where userId = ${userId};`;

        const model = hobbies.map(hobby => {
            return {
                hobby, userId
            }
        });
        const query2 = QueryBuilderService.getMultiInsertQuery(table.hobby, model);
        return SqlService.executeMultipleQueries([query1, query2]);
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

    async loginUserByPhone(user) {
        const query = `select u.id, u.roleId, v.verifiedAt
						from ${table.user} u
						join ${table.verification} v on v.phone = u.phone
                        where u.phone = '${user.phone}' 
                        and v.otp = '${user.otp}';`;
        const _user = await SqlService.getSingle(query);
        if (_.isEmpty(_user)) {
            throw new ErrorModel(AppCode.invalid_creds, Message.phoneOrOtpIncorrect)
        }
        if (_user.verifiedAt !== null) {
            throw new ErrorModel(AppCode.otp_expired, Message.otpExpired)
        }
        return _user;
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
        const query1 = QueryBuilderService.getInsertQuery(table.loginHistory, loginDetails);
        let query2 = ``;
        if (Validator.isPhoneValid(req.body.phone, false) && Validator.isOTPValid(req.body.otp, false)) {
            query2 = `update ${table.verification} set verifiedAt = utc_timestamp() where phone = '${req.body.phone}';`
        }
        return SqlService.executeMultipleQueries([query1, query2]);
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
        let query = `select id from ${table.verification} where phone = '${phone}';`;
        let result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            query = QueryBuilderService.getInsertQuery(table.verification, model);
        } else {
            query = `update ${table.verification} 
                                set otp = '${otp}', phone = '${phone}', sentAt = utc_timestamp(), verifiedAt = null
                                where phone = '${phone}'`;
        }
        return await SqlService.executeQuery(query);
    }

    async verifyOTP(otp, phone, saveVerificationDate = false) {
        let query = `select id, verifiedAt from ${table.verification} 
						where phone = '${phone}'
							and otp = '${otp}'
							-- and TIMESTAMPDIFF(MINUTE, sentAt, utc_timestamp()) <= 15
							;`;
        let verification = await SqlService.getSingle(query);
        if (_.isEmpty(verification)) {
            throw new ErrorModel(AppCode.invalid_creds, Message.incorrectOtp);
        }
        if (!_.isEmpty(verification.verifiedAt)) {
            throw new ErrorModel(AppCode.otp_expired, Message.otpExpired);
        }
        if (saveVerificationDate) {
            query = `update ${table.verification} set verifiedAt = utc_timestamp() where id = ${verification.id}`;
            await SqlService.executeQuery(query);
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
            throw {
                code: AppCode.invalid_creds,
                message: "Email not verified"
            };
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
        return SqlService.executeQuery(query);
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
                            and u.name LIKE '%${searchData}%'
                            or u.email LIKE '%${searchData}%'
                        order by id desc;`;
        return SqlService.executeQuery(query);
    }

    async getTotalUsers(data) {
        const condition2 = ` and u.name LIKE '%${data.searchText}%'
                            or u.email LIKE '%${data.searchText}%'`;
        const query = `select count("id") totalUsers
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where u.roleId <> 1
	    				${!_.isEmpty(data.searchText) ? condition2 : ''}`;
        return SqlService.getSingle(query);
    }

    async isUserRegisteredByPhone(phone) {
        const query = `select 1 from user where phone = '${phone}'`;
        const user = await SqlService.getSingle(query);
        return !_.isEmpty(user);
    }

    async createAnonymousAndBusinessProfiles(userId) {
        const profiles = [];
        const profileTypes = await SqlService.getTable(table.profileType, 0);
        profileTypes.forEach((pt) => {
            if (pt.id > 1) {
                const profile = {
                    profileTypeId: pt.id,
                    userId,
                    name: Utils.getRandomStringV2(16, {capitalLetters: true, numbers: true})
                };
                profiles.push(profile);
            }
        });
        const query = QueryBuilderService.getMultiInsertQuery(table.userProfile, profiles);
        return SqlService.executeQuery(query);
    }
}
