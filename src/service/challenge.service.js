import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import Utils from "./common/utils";
import _ from 'lodash';
import fs from "fs";
import path from 'path';
import {LanguageCode} from "../enum/common.enum";
import {FirebaseController} from "../controller/firebase.controller";

export class ChallengeService {
    constructor() {
        this.firebaseController = new FirebaseController();
    }

    async createChallenge(challenge) {
        const query = QueryBuilderService.getInsertQuery(table.challenge, challenge);
        return SqlService.executeQuery(query);
    }

    async checkAlreadyAssign(challenge) {
        const query = `select * from ${table.assignJudge} 
                            where challengeId = '${challenge.challengeId}'
                            and judgeId ='${challenge.judgeId}';`;
        return await SqlService.getSingle(query);
    }

    async updateChallenge(challenge) {
        const condition = `where id = ${challenge.id}`;
        const query = QueryBuilderService.getUpdateQuery(table.challenge, challenge, condition);
        return SqlService.executeQuery(query);
    }

    async createChallengeEntries(challengeEntries) {
        const query = QueryBuilderService.getInsertQuery(table.challengeEntries, challengeEntries);
        return SqlService.executeQuery(query);
    }

    async saveUserChallenge(userChallenge) {
        const query = QueryBuilderService.getInsertQuery(table.userChallenge, userChallenge);
        return SqlService.executeQuery(query);
    }

    async saveChallengeRemark(challengeRemark) {
        const query = QueryBuilderService.getInsertQuery(table.challengeRemark, challengeRemark);
        return SqlService.executeQuery(query);
    }

    async saveAssignJudgesOnChallenge(assignJudge) {
        const query = QueryBuilderService.getInsertQuery(table.assignJudge, assignJudge);
        return SqlService.executeQuery(query);
    }

    async deleteChallenge(challengeId) {
        const query = `delete from ${table.challenge} where id = ${challengeId};`;
        return SqlService.executeQuery(query);
    }

    async getAllChallenges(data) {
        let condition1 = ``;
        if (data.body.judgeId) {
            condition1 = `where c.id IN (SELECT challengeId FROM assign_judge WHERE judgeId = ${data.body.judgeId})`;
        }
        const query = `select c.*, m.${'en'} 'moodName' , count(ce.id) challengeEntries , count(r.id) resultCount
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				left join post ce on ce.challengeId = c.id
	    				left join result r on (r.challengeId = c.id )
	    				 ${condition1} 
	    				 group by c.id
                        order by id desc
                         LIMIT ${data.body.limit} OFFSET ${data.body.offset}`;
        return SqlService.executeQuery(query);
    }

    async getTotalChallengeCount(data) {
        let condition1 = ``;
        if (data.body.judgeId) {
            condition1 = `where c.id IN (SELECT challengeId FROM assign_judge WHERE judgeId = ${data.body.judgeId})`;
        }
        const query = `select count("id") count
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				 ${condition1} ;`;
        return SqlService.getSingle(query);
    }

    async getActiveChallenges(req) {
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let c1 = ``;
        let distanceQuery = ``;
        let havingCondition = ``;
        if (req.languageCode) {
            c1 = `and c.languageCode = '${req.languageCode}'`;
        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)} or c.latitude is null and c.longitude is null`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (c.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - c.longitude) * COS(c.latitude / 57.3), 2)
                            ) AS distance`
        }
        const datetime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const todayDate = (new Date(datetime)).toISOString().slice(0,10);
        const query = `select c.*, m.${LanguageCode[req.language] || 'en'} 'moodName'
                         ${distanceQuery}
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				WHERE DATE_FORMAT(c.startDate, "%Y-%m-%d") <= '${todayDate}'
                        and DATE_FORMAT(c.deadlineDate, "%Y-%m-%d") >= '${todayDate}'
	    				${c1} 
                        ${havingCondition}
                        order by c.id desc;`;
        return SqlService.executeQuery(query);
    }

    async getPastChallenges(req) {
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let c1 = ``;
        let distanceQuery = ``;
        let havingCondition = ``;
        if (req.languageCode) {
            c1 = `and c.languageCode = '${req.languageCode}'`;
        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)} or c.latitude is null and c.longitude is null`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (c.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - c.longitude) * COS(c.latitude / 57.3), 2)
                            ) AS distance`
        }
        /*const datetime = new Date();
        const todayDate = datetime.toISOString().slice(0,10);*/
        const datetime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const todayDate = (new Date(datetime)).toISOString().slice(0,10);
        const query = `select c.*, m.${LanguageCode[req.language] || 'en'} 'moodName'
                        ${distanceQuery}
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				WHERE DATE_FORMAT(c.deadlineDate, "%Y-%m-%d") < '${todayDate}'
	    				${c1} 
                        ${havingCondition}
                        order by c.id desc;`;
        return SqlService.executeQuery(query);
    }

    async getNoticeChallenges(req) {
        let c1 = ``;
        if (req.languageCode) {
            c1 = `and n.languageCode = '${req.languageCode}'`;
        }
        const datetime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const todayDate = (new Date(datetime)).toISOString().slice(0,10);
        const query = `select n.*
	    				from ${table.noticeboard} n
	    				WHERE DATE_FORMAT(n.startDate, "%Y-%m-%d") <= '${todayDate}'
	    				and DATE_FORMAT(n.deadlineDate, "%Y-%m-%d") >= '${todayDate}'
	    				${c1} 
	    				order by n.id desc;`;
        return SqlService.executeQuery(query);
    }

    async checkAlreadyRemark(req) {
        const query = `select c.*, j.name 'judgeName'
	    				from ${table.challengeRemark} c
	    				left join judge j on j.id = c.judgeId
	    				where entryId = ${req.entryId}`;
        return SqlService.executeQuery(query);
    }

    async updateChallengeEntriesUpload(challengeEntryId) {
        const query = `update ${table.challengeEntries} 
                        set isPostUpload = 1 
                        where id = ${challengeEntryId};`;
        return SqlService.executeQuery(query);
    }

    async getAllChallengeEntries(req) {
        // new SqlService();
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let condition1 = ``;
        let condition2 = ``;
        let condition3 = ``;
        let condition4 = '';
        let distanceQuery = ``;
        let havingCondition = ``;

        if (req.languageCode) {
            condition4 = `and p.languageCode = '${req.languageCode}'`;
        }
        if (req.entryByUserId > 0) {
            condition2 = `and p.userId = ${req.entryByUserId}`;
            condition4 = '';
        }
        if (req.challengeId) {
            condition1 = `and p.challengeId = '${req.challengeId}'`;
        }

        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and p.moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)}`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (ce.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - p.longitude) * COS(ce.latitude / 57.3), 2)
                            ) AS distance`
        }
        const query = `select p.id, p.createdAt, p.description, p.source, 
                            p.latitude, p.longitude, p.address, l.name language, p.languageCode,
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType', c.topic contestTopic,
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl,
                            m.${req.languageCode || 'en'} 'mood'
                            ${distanceQuery}
                        from post p 
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
                            left join language l on l.code = p.languageCode
                            left join challenge c on c.id = p.challengeId
                        where 
                            p.isDeleted = 0
                            and p.latitude is not null and p.longitude is not null
                            and p.isPostUpload = 1 
                            ${condition1} ${condition2} ${condition3} ${condition4}
                            ${havingCondition}
                        order by p.id desc
                        limit ${req.postCount} offset ${req.offset}
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getAllChallengeEntriesForAdmin(req) {
        // new SqlService();
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let condition1 = ``;
        let condition2 = ``;
        let condition3 = ``;
        let condition4 = '';
        let joinCondition = '';
        let remarkQuery = '';
        let distanceQuery = ``;
        let havingCondition = ``;

        if (req.languageCode) {
            condition4 = `and p.languageCode = '${req.languageCode}'`;
        }
        if (req.entryByUserId > 0) {
            condition2 = `and p.userId = ${req.entryByUserId}`;
            condition4 = '';
        }
        if (req.challengeId) {
            condition4 = `and p.challengeId = '${req.challengeId}'`;
        }

        if (req.judgeId) {
            remarkQuery = `,cr.remark`;
            joinCondition = `left join challenge_remark cr on (cr.entryId = p.id and cr.challengeId = '${req.challengeId}' and cr.judgeId = '${req.judgeId}')`;
        }
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and p.moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)}`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (ce.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - p.longitude) * COS(p.latitude / 57.3), 2)
                            ) AS distance`
        }
        const query = `select p.id, p.createdAt, p.description, p.source,
                            p.latitude, p.longitude, p.address, l.name language, p.languageCode,
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl,
                            m.${req.languageCode || 'en'} 'mood'
                            ${distanceQuery} 
                            ${remarkQuery}
                        from post p
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
                            left join language l on l.code = p.languageCode
                            ${joinCondition}
                        where 
                             p.isDeleted = 0
                             and p.latitude is not null and p.longitude is not null
                             and p.isPostUpload = 1
                            ${condition1} ${condition2} ${condition3} ${condition4}
                            ${havingCondition}
                        order by p.id desc
                        limit ${req.postCount} offset ${req.offset}
                        ;`;

        return SqlService.executeQuery(query);
    }

    async reactOnChallengeEntries(req) {
        const reqBody = req.body;
        let query = `select id, type from ${table.challengeEntriesReaction} 
                        where reactedBy = ${req.user.id} 
                            and challengeEntryId = ${reqBody.postId} 
                        limit 1;`;
        let result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            if (result.type === reqBody.type) {
                return this.deleteReaction(req);
            }
            query = `update ${table.challengeEntriesReaction} 
                        set type = '${reqBody.type}'
                        where id = ${result.id};`;
            return SqlService.executeQuery(query);
        }
        const challengeEntriesReaction = {
            challengeEntryId: reqBody.postId,
            reactedBy: req.user.id,
            reactedAt: 'utc_timestamp()',
            type: reqBody.type,
        };
        query = QueryBuilderService.getInsertQuery(table.challengeEntriesReaction, challengeEntriesReaction);

        let query1 = `select count("id") totalReaction from ${table.challengeEntriesReaction} 
                        where challengeEntryId = ${reqBody.postId}`;
        let challengeEntriesReactioncount = await SqlService.getSingle(query1);
        if((challengeEntriesReactioncount.totalReaction % 10) === 0){
            this.firebaseController.sendNotificationForReaction(reqBody, challengeEntriesReaction.totalReaction);
        }
        return SqlService.executeQuery(query);
    }

    async deleteReaction(req) {
        const query = `delete from ${table.challengeEntriesReaction}
                            where reactedBy = ${req.user.id} 
                            and challengeEntryId = ${req.body.postId};`;
        return SqlService.executeQuery(query);
    }

    async addPostView(req) {
        const model = {
            userId: req.user.id,
            challengeEntryId: req.body.postId,
            seenDate: 'utc_timestamp()'
        }
        /*  let query = `select 1 from ${table.postView}
                          where userId = ${model.userId}
                              and postId = ${model.postId}
                          limit 1`;
          const view = await SqlService.getSingle(query);
          if (!_.isEmpty(view)) {
              return "User view can't be added again! its already added for this post.";
          }*/
        let query = QueryBuilderService.getInsertQuery(table.challengeEntriesView, model);
        await SqlService.executeQuery(query);
        return "User view added for this post";
    }

    async createChallengeEntriesComment(comment) {
        const query = QueryBuilderService.getInsertQuery(table.challengeEntriesComment, comment);
        return SqlService.executeQuery(query);
    }
    

    async getComments(entryIds) {
        const query = `select pc.*, u.name, u.imageUrl, u.id userId, pm.url, pm.type
                        from ${table.challengeEntriesComment} pc
                            left join user u on u.id = pc.userId
                            left join ${table.challengeEntriesMedia} pm on pm.commentId = pc.id
                        where 
                            pc.isDeleted = 0
                            and pc.challengeEntryId in ${Utils.getRange(entryIds)};`;
        return SqlService.executeQuery(query);
    }

    async getChallengeEntryMedia(uniqChallengeEntryIds) {
        const query = `select pm.postId, pm.type, pm.url, pm.thumbnailUrl, pm.commentId from ${table.postMedia}  pm
                        where postId in ${Utils.getRange(uniqChallengeEntryIds)}`;
        return SqlService.executeQuery(query);
    }

    async getChallengeEntriesViews(uniqChallengeEntryIds) {
        const query = `select pv.*, u.name userName, u.imageUrl userImageUrl, u.id userId from 
                        ${table.challengeEntriesView} pv 
                            inner join user u on u.id = pv.userId 
                        where challengeEntryId in ${Utils.getRange(uniqChallengeEntryIds)};`;
        return SqlService.executeQuery(query);
    }

    async getChallengeEntriesData(req) {
        const query = `select p.id, p.createdAt, p.description, p.source, p.latitude, p.longitude, p.address, p.language,
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl
                        from ${table.challengeEntries} p 
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
                        where 
                            p.isDeleted = 0
                            and p.id = ${req.challengeEntryId}
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getWinnerDetails(req) {
        const query = `select r.id, r.marks,r.rank, u.id as userId , u.name, u.imageUrl, u.bgImageUrl
                        from ${table.result} r
                            left join user u on u.id = r.userId
                        where 
                            r.challengeId = ${req.body.challengeId};`;
        return SqlService.executeQuery(query);
    }

    async declareResult(req) {
        const query = `select cr.id, cr.challengeId, cr.entryId, sum(cr.remark) marks, ce.userId
                        from ${table.challengeRemark} cr
                        left join post ce on ce.id = cr.entryId
                        where cr.challengeId = ${req.body.challengeId}
                             group by cr.entryId
                            order by sum(cr.remark) desc
                             LIMIT ${req.body.winners}`;
        return SqlService.executeQuery(query);
    }

    async createResult(resulData) {
        const query = QueryBuilderService.getMultiInsertQuery(table.result, resulData);
        return SqlService.executeQuery(query);
    }

}
