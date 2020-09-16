import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./common/utils";
import {AppCode} from "../enum/app-code";
import {ErrorModel} from "../model/common.model";
import {Environment, Message, ProfileType} from "../enum/common.enum";
import Validator from "./common/validator.service";
import {FirebaseController} from "../controller/firebase.controller";
import {Config} from "../config";

export class UserService {
    constructor() {
        this.firebaseController = new FirebaseController();
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
        if (!user.password) {
            user.password = user.password || Config.env === Environment.prod ? Utils.getRandomStringV2(8, {
                smallLetters: true,
                capitalLetters: true,
                numbers: true,
                symbols: true
            }) : '1234';
        }
        const query = QueryBuilderService.getInsertQuery(table.user, user);
        return SqlService.executeQuery(query);
    }

    async getAllUsers(data) {
        let c1 = ``;
        let c2 = ``;
        let c3 = `u.roleId = 3`;
        if (data.body.isTestUser) {
            c1 = `and u.isTestUser = 1`;
        }
        if (!_.isEmpty(data.body.searchText)) {
            c2 = `and u.name LIKE '%${data.body.searchText}%'
                            or u.email LIKE '%${data.body.searchText}%'`;
        }
        if (data.body.roleId) {
            c3 = `u.roleId = ${data.body.roleId}`;
        }

        const query = `select u.*, ur.name role
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where ${c3} ${c1} ${c2}
	    				order by id desc
	    				LIMIT ${data.body.limit || 0} 
	    				OFFSET ${data.body.offset || 0}`;
        return SqlService.executeQuery(query);
    }

    async getFormattedUsers(params) {
        let c1 = ''
        if (params && params.isTestUser) {
            c1 = `where isTestUser = 1`;
        }
        const query = `select u.id, u.name, p.name anonymousName 
                        from ${table.user} u 
                        join profile p on p.userId = u.id and p.type = 'anonymous'
                        ${c1}
                        order by u.id desc
                        ;`;
        const users = await SqlService.executeQuery(query);
        return users.map(u => {
            return {
                id: u.id,
                name: u.name || u.anonymousName
            }
        })
    }

    async searchUsers(searchCriteria) {
        let c1 = ``;
        if (Array.isArray(searchCriteria.roleId)) {
            c1 = `and roleId in ${Utils.getRange(searchCriteria.roleId)}`;
        } else if (searchCriteria.roleId > 0) {
            c1 = `and roleId = '${searchCriteria.roleId}'`;
        }
        const c2 = `and u.workingStatus = '${searchCriteria.workingStatus}'`;
        const query = `select u.*, ur.name role, ll.loginTime
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id
	    					left join ${dbview.lastLoginAudit} ll on ll.userId = u.id
                        where 
                        	u.id > 0 ${c1}
							${!_.isEmpty(searchCriteria.workingStatus) ? c2 : ''}
                        order by u.id desc
                        limit ${searchCriteria.limit} 
                        offset ${searchCriteria.offset};`;
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
                                u.gender, u.imageUrl, u.bgImageUrl, u.audioUrl, u.address, u.ageRangeId, 
                                u.profession, u.company, u.latitude, u.longitude, u.appLanguage, u.contentLanguage,
                        ur.name role, u.referralCode, parent.referralCode parentReferralCode, u.roleId
						from ${table.user} u
		 					left join ${table.userRole} ur on u.roleId = ur.id
		 					left join ${table.user} parent on parent.id = u.parentId
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
        let query = `select u.id, ur.id roleId 
						from ${table.user} u
							left join ${table.userRole} ur on ur.id = u.roleId 
                        where u.email = '${user.username}' 
                        and u.password = '${user.password}'
                        and (u.roleId in (1, 2, 4) or (u.roleId = 3 and u.isCreator = 1));`;
        const u = await SqlService.getSingle(query);
        if (!_.isEmpty(u)) {
            return u;
        }

        query = `select j.id, 4 roleId
						from ${table.judge} j
                        where j.email = '${user.username}' 
                        and j.password = '${user.password}';`;
        const judge = await SqlService.getSingle(query);
        if (!_.isEmpty(judge)) {
            return judge;
        }

        throw {
            code: AppCode.invalid_creds,
            message: "Email or password is incorrect"
        };
    }

    async validateUserByPhone(user) {
        let query = `select u.id, ur.id roleId 
						from ${table.user} u
							left join ${table.userRole} ur on ur.id = u.roleId 
                        where u.phone = '${user.username}' 
                        and u.password = '${user.password}'
                        and (u.roleId in (1, 2, 4) or (u.roleId = 3 and u.isCreator = 1));`;
        const u = await SqlService.getSingle(query);
        if (!_.isEmpty(u)) {
            return u;
        }

        throw {
            code: AppCode.invalid_creds,
            message: "Email or password is incorrect"
        };
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
            throw new ErrorModel(AppCode.invalid_request, Message.incorrectOtp);
        }
        if (!_.isEmpty(verification.verifiedAt)) {
            throw new ErrorModel(AppCode.invalid_request, Message.otpExpired);
        }
        if (saveVerificationDate) {
            query = `update ${table.verification} set verifiedAt = utc_timestamp() where id = ${verification.id}`;
            await SqlService.executeQuery(query);
        }
        return true;
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

    async  getTotalUsers(data) {
        let c0 = `u.roleId = 3`;
        let c1 = ``;
        if (data.isTestUser) {
            c1 = `and u.isTestUser = 1`;
        }
        if (data.roleId) {
            c0 = `u.roleId = ${data.roleId}`;
        }
        const c2 = ` and u.name LIKE '%${data.searchText}%'
                            or u.email LIKE '%${data.searchText}%'`;
        const query = `select count("id") totalUsers
	    				from ${table.user} u 
	    					left join ${table.userRole} ur on u.roleId = ur.id 
	    				where ${c0} ${c1}
	    				${!_.isEmpty(data.searchText) ? c2 : ''}`;
        return SqlService.getSingle(query);
    }

    async isUserRegisteredByPhone(phone) {
        const query = `select 1 from user where phone = '${phone}'`;
        const user = await SqlService.getSingle(query);
        return !_.isEmpty(user);
    }

    async createAnonymousAndBusinessProfiles(userId) {
        const profiles = [{
            type: ProfileType.business,
            userId,
            name: 'Business@' + Utils.getRandomStringV2(8, {capitalLetters: true, numbers: true})
        }, {
            type: ProfileType.anonymous,
            userId,
            name: 'Anonymous@' + Utils.getRandomStringV2(8, {capitalLetters: true, numbers: true})
        }];
        const query = QueryBuilderService.getMultiInsertQuery(table.profile, profiles);
        return SqlService.executeQuery(query);
    }

    async updateRespect(model) {
        let q = `select * from ${table.respect} 
                        where respectFor = ${model.respectFor} 
                                and respectBy = ${model.respectBy}
                        limit 1;`;
        const respect = await SqlService.getSingle(q);
        let status = '';
        if (_.isEmpty(respect)) {
            q = QueryBuilderService.getInsertQuery(table.respect, model);
            status = 'Respect added';
            this.firebaseController.sendRespectUserMessage(model);
        } else {
            q = `delete from ${table.respect} where id = ${respect.id};`;
            status = 'Respect removed';
        }
        await SqlService.executeQuery(q);
        return {status}
    }

    async getWhoRespectingMe(req) {
        const query = `select r.id, u.id as userId , u.name, u.imageUrl, u.bgImageUrl
                        from ${table.respect} r
                            left join user u on u.id = r.respectBy
                        where 
                            r.respectFor = ${req.user.id};`;
        return SqlService.executeQuery(query);
    }

    async getWhoRespectedByMe(req) {
        const query = `select r.id, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.respect} r
                            left join user u on u.id = r.respectFor
                        where 
                            r.respectBy = ${req.user.id};`;
        return SqlService.executeQuery(query);
    }

    async getRespects() {
        const query = `select * from ${table.respect}`;
        return SqlService.executeQuery(query);
    }

    async getRespectByUserId(respectBy, respectFor) {
        const query = `select 1 from ${table.respect} 
                        where respectBy = ${respectBy} and respectFor = ${respectFor}`;
        return SqlService.executeQuery(query);
    }

    async saveToken(model) {
        const query = `update ${table.user} set deviceToken = '${model.deviceToken}' where id = ${model.userId};`;
        return SqlService.executeQuery(query);
    }

    async validateReferralCode(user, key) {
        const query = `select id from user where referralCode = '${key}' and id <> ${user.id} limit 1;`;
        const result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            return result.id;
        }
        return await this.validateReferralPhone(user, key);
    }

    async validateReferralPhone(user, phone) {
        const query = `select id from user where phone = '${phone}' and id <> ${user.id} limit 1;`;
        const result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            throw new ErrorModel(AppCode.invalid_request, Message.invalidReferralCode);
        }
        return result.id;
    }

    async getNetwork(userId) {
        const query = `SELECT T2.id, T2.name, lvl
                            FROM ( 
                                SELECT 
                                    @r AS _id, 
                                    (SELECT @r := parentId FROM user WHERE id = _id) AS parentId, 
                                    @l := @l + 1 AS lvl 
                                FROM 
                                    (SELECT @r := 5, @l := 0) vars, 
                                    user h 
                                WHERE @r <> 0) T1 
                            JOIN user T2 
                            ON T1._id = T2.id 
                            ORDER BY T1.lvl DESC;`;
        const result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            throw new ErrorModel(AppCode.invalid_request, Message.invalidReferralCode);
        }
        return result.id;
    }
}
