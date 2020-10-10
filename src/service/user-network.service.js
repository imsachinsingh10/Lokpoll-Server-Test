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
import {Activity} from "../model/activity.model";
import {UserService} from "./user.service";

export class UserNetworkService {
    constructor() {
        this.firebaseController = new FirebaseController();
        this.userService = new UserService();
    }

    async getCoinsByActivityName(activity) {
        const q = `select coins from ${table.coin_activity} where activity = '${activity}' limit 1;`;
        const result = await SqlService.getSingle(q);
        if (_.isEmpty(result)) {
            return 0;
        }
        return result.coins;
    }

    async logSignupActivity(userId) {
        let coins = await this.getCoinsByActivityName(Activity.signup);
        await this.logActivity({userId, activity: Activity.signup, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(Activity.frontLineSignup);
            await this.logActivity({userId: parent.id, activity: Activity.frontLineSignup, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(Activity.downLineSignup);
            await this.logActivity({userId: gParent.id, activity: Activity.downLineSignup, coins});
        }
    }

    async logSigninActivity(userId) {
        let coins = await this.getCoinsByActivityName(Activity.login);
        await this.logActivity({userId, activity: Activity.login, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(Activity.frontLineLogin);
            await this.logActivity({userId: parent.id, activity: Activity.frontLineLogin, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(Activity.downLineLogin);
            await this.logActivity({userId: gParent.id, activity: Activity.downLineLogin, coins});
        }
    }

    async logAddPostActivity({userId, postId}) {
        let coins = await this.getCoinsByActivityName(Activity.addPost);
        await this.logActivity({userId, postId, activity: Activity.addPost, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(Activity.frontLineAddPost);
            await this.logActivity({userId: parent.id, postId, activity: Activity.frontLineAddPost, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(Activity.downLineAddPost);
            await this.logActivity({userId: gParent.id, postId, activity: Activity.downLineAddPost, coins});
        }
    }

    async logAddContestPostActivity({userId, contestPostId}) {
        let coins = await this.getCoinsByActivityName(Activity.addContestPost);
        await this.logActivity({userId, contestPostId, activity: Activity.addContestPost, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(Activity.frontLineAddContestPost);
            await this.logActivity({userId: parent.id, contestPostId, activity: Activity.frontLineAddContestPost, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(Activity.downLineAddContestPost);
            await this.logActivity({userId: gParent.id, contestPostId, activity: Activity.downLineAddContestPost, coins});
        }
    }

    async logActivity(activity) {
        const _activity = {
            logTime: 'utc_timestamp()',
            ...activity,
        }
        const query1 = QueryBuilderService.getInsertQuery(table.coin_activity_log, _activity);
        const query2 = `update user set coins = coins + ${activity.coins} where id = ${activity.userId};`
        return SqlService.executeMultipleQueries([query1, query2]);
    }

    async getCoinLogs(userId) {
        const q = `select * from ${table.coin_activity_log} c where userId = ${userId} order by id desc;`
        return SqlService.executeQuery(q);
    }

    async addCoinActivity(req) {
        const __ = req.body;
        const model = {
            createdOn: 'utc_timestamp()',
            activity: __['activity'],
            description: __['description'],
            coins: __['coins'],
        }
        const q = QueryBuilderService.getInsertQuery(table.coin_activity, model);
        const result = await SqlService.executeQuery(q);
        return result.insertId;
    }

    async getAllCoinActivities() {
        const q = `select * from ${table.coin_activity};`
        return SqlService.executeQuery(q);
    }

    async updateCoinActivity(activity) {
        const q = `update ${table.coin_activity} 
                    set coins = ${activity.coins}, 
                        updatedOn = utc_timestamp()
                    where id = ${activity.id};`;
        return SqlService.executeQuery(q);
    }

    async validateReferralCode(user, key) {
        const query = `select user.id, user.level, parent.id parentId from user 
                            left join user parent on parent.id = user.parentId
                        where referralCode = '${key}' 
                        and id <> ${user.id} limit 1;`;
        const result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            return result;
        }
        return await this.validateReferralPhone(user, key);
    }

    async validateReferralPhone(user, phone) {
        const query = `select id, level from user where phone = '${phone}' and id <> ${user.id} limit 1;`;
        const result = await SqlService.getSingle(query);
        if (_.isEmpty(result)) {
            throw new ErrorModel(AppCode.invalid_request, Message.invalidReferralCode);
        }
        return result;
    }

    async getDescendants(userId) {
        let query = `WITH RECURSIVE resultSet AS
                        (
                            SELECT user1.id, user1.name, user1.parentId, user1.level, user1.avatarBG,
                                    user1.email, user1.phone, user1.imageUrl, user1.referralCode
                                FROM user AS user1 
                                WHERE user1.parentId=${userId}
                            UNION
                            SELECT user2.id, user2.name, user2.parentId, user2.level, user2.avatarBG,
                                    user2.email, user2.phone, user2.imageUrl, user2.referralCode
                                FROM resultSet 	
                                INNER JOIN user AS user2 ON resultSet.id = user2.parentId
                        ) SELECT * FROM resultSet;`;
        return await SqlService.executeQuery(query);
    }

    async getAncestors(userId) {
        let query = `SELECT parent.id id1, parent.name name1, parent.avatarBG avatarBG1, parent.parentId parentId1, parent.referralCode referralCode1,
                            parent.email email1, parent.phone phone1, parent.imageUrl imageUrl1,
                            gParent.id id2, gParent.name name2, gParent.avatarBG avatarBG2, gParent.parentId parentId2, gParent.referralCode referralCode2,
                            gParent.email email2, gParent.phone phone2, gParent.imageUrl imageUrl2
                        FROM user u 
                            left join user parent on parent.id = u.parentId
                            left join user gParent on gParent.id = parent.parentId
                        WHERE u.id=${userId} limit 1;`;
        const ancestors = await SqlService.getSingle(query);
        if (_.isEmpty(ancestors)) {
            return [];
        }
        const parent = {
            level: -1
        };
        const gParent = {
            level: -2
        };
        for (const key in ancestors) {
            const value = ancestors[key];
            if (key.endsWith('1')) {
                parent[key.slice(0, -1)] = value;
            } else {
                gParent[key.slice(0, -1)] = value;
            }
        }
        const result = [];
        if (parent.id) {
            result.push(parent);
        }
        if (gParent.id) {
            result.push(gParent);
        }
        return result;
    }

    async getTotalCoins(userId) {
        let q = `select sum(coins) sum from ${table.user}`;
        if (userId) {
            q += ` where id = ${userId}`
        }
        return SqlService.getSingle(q);
    }

}
