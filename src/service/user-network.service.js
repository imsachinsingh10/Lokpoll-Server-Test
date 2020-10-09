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

        const ancestors = await this.userService.getAncestors(userId);
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

        const ancestors = await this.userService.getAncestors(userId);
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

        const ancestors = await this.userService.getAncestors(userId);
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

        const ancestors = await this.userService.getAncestors(userId);
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
        const q = `select * from ${table.coin_activity_log} c where userId = ${userId};`
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

}
