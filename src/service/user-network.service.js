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
import {UserService} from "./user.service";
import moment from "moment";
import {log} from "./common/logger.service";
import {CoinActivity} from '../enum/coin-activity';

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
        let coins = await this.getCoinsByActivityName(CoinActivity.signup);
        await this.logActivity({userId, activity: CoinActivity.signup, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(CoinActivity.frontLineSignup);
            await this.logActivity({userId: parent.id, activity: CoinActivity.frontLineSignup, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(CoinActivity.downLineSignup);
            await this.logActivity({userId: gParent.id, activity: CoinActivity.downLineSignup, coins});
        }
    }

    async addAppAccessLog(userId) {
        const accessLog = await this.getAppAccessLog({userId});
        let q = '';
        if (_.isEmpty(accessLog)) {
            const model = {userId, logDate: 'utc_timestamp()', activity: CoinActivity.dailyVisit,}
            q = QueryBuilderService.getInsertQuery(table.user_app_access, model);
            await SqlService.executeQuery(q);
        } else {
            const model = {logDate: 'utc_timestamp()'};
            q = QueryBuilderService.getUpdateQuery(table.user_app_access, model, `where id = ${accessLog.id}`);
            await SqlService.executeQuery(q);
        }
    }

    async getAppAccessLog({userId, date}) {
        let c1 = '';
        if (date) {
            c1 = `and date(logDate) = '${date}'`;
        }

        const q = `select * from ${table.user_app_access} 
                    where userId = ${userId} 
                        and activity = '${CoinActivity.dailyVisit}' 
                        ${c1}
                    limit 1;`
        return SqlService.getSingle(q);
    }

    async checkIfUserVisitedToday(userId) {
        const today = moment.utc().format('YYYY-MM-DD');
        const result = await this.getAppAccessLog({userId, date: today});
        return !_.isEmpty(result);
    }

    async logDailyVisitActivity(userId) {
        const hasUserVisitedToday = await this.checkIfUserVisitedToday(userId);
        if (hasUserVisitedToday) {
            return;
        }

        this.addAppAccessLog(userId).then(null);
        let coins = await this.getCoinsByActivityName(CoinActivity.dailyVisit);
        await this.logActivity({userId, activity: CoinActivity.dailyVisit, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(CoinActivity.frontLineDailyVisit);
            await this.logActivity({userId: parent.id, activity: CoinActivity.frontLineDailyVisit, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(CoinActivity.downLineDailyVisit);
            await this.logActivity({userId: gParent.id, activity: CoinActivity.downLineDailyVisit, coins});
        }
    }

    async logAddPostActivity({userId, postId, activity, frontLineActivity, downLineActivity}) {
        if (activity) {
            const coins = await this.getCoinsByActivityName(activity);
            await this.logActivity({userId, postId, activity: activity, coins});
        }

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent && downLineActivity) {
            const coins = await this.getCoinsByActivityName(CoinActivity.frontLineAddPost);
            await this.logActivity({userId: parent.id, postId, activity: frontLineActivity, coins});
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent && frontLineActivity) {
            const coins = await this.getCoinsByActivityName(CoinActivity.downLineAddPost);
            await this.logActivity({userId: gParent.id, postId, activity: downLineActivity, coins});
        }
    }

    async logAddContestPostActivity({userId, contestPostId}) {
        let coins = await this.getCoinsByActivityName(CoinActivity.addContestPost);
        await this.logActivity({userId, contestPostId, activity: CoinActivity.addContestPost, coins});

        const ancestors = await this.getAncestors(userId);
        if (_.isEmpty(ancestors)) {
            return
        }

        const parent = ancestors.filter(a => a.level === -1)[0];
        if (parent) {
            coins = await this.getCoinsByActivityName(CoinActivity.frontLineAddContestPost);
            await this.logActivity({
                userId: parent.id,
                contestPostId,
                activity: CoinActivity.frontLineAddContestPost,
                coins
            });
        }

        const gParent = ancestors.filter(a => a.level === -2)[0];
        if (gParent) {
            coins = await this.getCoinsByActivityName(CoinActivity.downLineAddContestPost);
            await this.logActivity({
                userId: gParent.id,
                contestPostId,
                activity: CoinActivity.downLineAddContestPost,
                coins
            });
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
        const q = `select * from ${table.coin_activity} order by position;`
        return SqlService.executeQuery(q);
    }

    async updateCoinActivity(activity) {
        const model = {
            coins: activity.coins,
            name: activity.name
        }
        const condition = `where activity = '${activity.activity}'`;
        const q = QueryBuilderService.getUpdateQuery(table.coin_activity, model, condition);
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
