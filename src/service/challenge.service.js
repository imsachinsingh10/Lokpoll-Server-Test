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


}
