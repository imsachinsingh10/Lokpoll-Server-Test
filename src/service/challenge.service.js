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
        this.queryBuilderService = new QueryBuilderService();
        this.sqlService = new SqlService();
        this.firebaseController = new FirebaseController();
    }

    async createChallenge(challenge) {
        const query = QueryBuilderService.getInsertQuery(table.challenge, challenge);
        return SqlService.executeQuery(query);
    }

    async updateChallenge(reqBody) {
        const challenge = {
            id: reqBody.id,
            languageCode: reqBody.languageCode,
            moodId: reqBody.moodId,
            description: reqBody.description,
            startDate: reqBody.startDate,
            resultAnnounceDate: reqBody.resultAnnounceDate,
            deadlineDate: reqBody.deadlineDate,
        }
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

    async getAllChallenges(data) {
        const condition1 = ` c.topic LIKE '%${data.body.searchText}%'`;
        const query = `select c.*, m.${'en'} 'moodName'
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
                        order by id desc
                         LIMIT ${data.body.limit} OFFSET ${data.body.offset}`;
        return SqlService.executeQuery(query);
    }

    async getActiveChallenges(req) {
        const datetime = new Date();
        const todayDate = datetime.toISOString().slice(0,10);
        const query = `select c.*, m.${LanguageCode[req.language] || 'en'} 'moodName'
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				WHERE DATE_FORMAT(c.startDate, "%Y-%m-%d") <= '${todayDate}'
	    				and DATE_FORMAT(c.deadlineDate, "%Y-%m-%d") >= '${todayDate};'`;
        return SqlService.executeQuery(query);
    }

    async getPastChallenges(req) {
        const datetime = new Date();
        const todayDate = datetime.toISOString().slice(0,10);
        const query = `select c.*, m.${LanguageCode[req.language] || 'en'} 'moodName'
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId
	    				WHERE DATE_FORMAT(c.deadlineDate, "%Y-%m-%d") < '${todayDate}'`;
        return SqlService.executeQuery(query);
    }

    async getNoticeChallenges(req) {
        const query = `select c.*, m.${LanguageCode[req.language] || 'en'} 'moodName'
	    				from ${table.challenge} c
	    				left join mood m on m.id = c.moodId`;
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
            condition4 = `and ce.languageCode = '${req.languageCode}'`;
        }
        if (req.entryByUserId > 0) {
            condition2 = `and ce.userId = ${req.entryByUserId}`;
            condition4 = '';
        }
        if (req.challengeId) {
            condition4 = `and ce.challengeId = '${req.challengeId}'`;
        }
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and ce.moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)}`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (ce.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - ce.longitude) * COS(ce.latitude / 57.3), 2)
                            ) AS distance`
        }
        const query = `select ce.id, ce.createdAt, ce.description, ce.source, 
                            ce.latitude, ce.longitude, ce.address, l.name language, ce.languageCode,
                            0 'respects', 0 'comments',
                            ce.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl,
                            m.${req.languageCode || 'en'} 'mood'
                            ${distanceQuery}
                        from ${table.challengeEntries} ce 
                            join user u on u.id = ce.userId
                            left join mood m on m.id = ce.moodId
                            left join profile pro on pro.type = ce.profileType and pro.userId = u.id
                            left join language l on l.code = ce.languageCode
                        where 
                            ce.isDeleted = 0
                            and ce.latitude is not null and ce.longitude is not null
                            and ce.isPostUpload = 1 
                            ${condition1} ${condition2} ${condition3} ${condition4}
                            ${havingCondition}
                        order by ce.id desc
                        limit ${req.postCount} offset ${req.offset}
                        ;`;
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
        const query = `select pm.challengeEntryId, pm.type, pm.url, pm.thumbnailUrl, pm.commentId from ${table.challengeEntriesMedia}  pm
                        where challengeEntryId in ${Utils.getRange(uniqChallengeEntryIds)}`;
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
        console.log("request",req);
        const query = `select r.id, r.marks,r.rank, u.id as userId , u.name, u.imageUrl, u.bgImageUrl
                        from ${table.result} r
                            left join user u on u.id = r.userId
                        where 
                            r.challengeId = ${req.body.challengeId};`;
        return SqlService.executeQuery(query);
    }

}
