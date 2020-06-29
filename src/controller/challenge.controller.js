import * as _ from 'lodash';
import {PostService} from "../service/post.service";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {PostReaction, PostVoteOption, ProfileType} from "../enum/common.enum";
import {AppCode} from "../enum/app-code";
import Validator from "../service/common/validator.service";
import {ErrorModel} from "../model/common.model";
import Utils from "../service/common/utils";
import {ChallengeService} from "../service/challenge.service";

export class ChallengeController {
    constructor() {
        this.challengeService = new ChallengeService();
        this.postService = new PostService();
    }


    async getAllChallenges(req) {

        const activeChallenges = await this.challengeService.getActiveChallenges(req);
        const pastChallenges = await this.challengeService.getPastChallenges(req);
        const noticeBoardChallenges = await this.challengeService.getNoticeChallenges(req);

        return {
            active: activeChallenges,
            past: pastChallenges,
            notice: noticeBoardChallenges
        }
    }

    async createChallengeEntries(req) {
        const reqBody = req.body;
        const files = req.files;
        const entries = {
            description: reqBody.description,
            userId: reqBody.userId || req.user.id,
            creatorId: req.user.id,
            createdAt: 'utc_timestamp()',
            type: reqBody.type,
            profileType: reqBody.profileType,
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            address: reqBody.address,
            source: reqBody.source,
            languageCode: reqBody.languageCode,
        };
        if (files.image || files.video || files.audio) {
            entries.isPostUpload = '0';
        } else {
            entries.isPostUpload = '1';
        }
        entries.moodId = reqBody.moodId > 0 ? reqBody.moodId : undefined;
        Validator.validateRequiredFields(entries);

        const result = await this.challengeService.createChallengeEntries(entries);
        await this.insertSubMoods(reqBody, result.insertId);
        delete entries.createdAt;
        return {id: result.insertId, ...entries};
    }

    async insertSubMoods(reqBody, postId) {
        let subMoodNames = [];
        let subMoodNamesOriginal = [];
        try {
            subMoodNames = JSON.parse(reqBody.subMoodData);
            subMoodNamesOriginal = JSON.parse(reqBody.subMoodData);
        } catch (e) {
            console.log('e', e);
        }
        if (_.isEmpty(subMoodNames)) {
            return;
        }
        let subMoodNamesLower = subMoodNames.map(n => n.toLowerCase());
        const subMoods = await this.postService.getSubMoodByNames(subMoodNamesLower);
        if (!_.isEmpty(subMoods)) {
            const _subMoodNames = subMoods.map(subMood => subMood.name);
            subMoodNames = subMoodNames.filter((name) => {
                return _subMoodNames.indexOf(name) === -1;
            })
        }
        let newSubMoodsToInsert = subMoodNames.map((name) => ({
            name,
            moodId: reqBody.moodId,
            createdAt: 'utc_timestamp()',
        }))
        if (!_.isEmpty(newSubMoodsToInsert)) {
            await this.postService.createSubMoods(newSubMoodsToInsert);
        }
        await this.insertPostSubMoodMapping(postId, subMoodNamesOriginal);
        return subMoodNames;
    }

    async insertPostSubMoodMapping(postId, subMoodNames) {
        const subMoods = await this.postService.getSubMoodByNames(subMoodNames);
        const newSubMoods = subMoods.map(subMood => ({
            subMoodId: subMood.id,
            postId
        }))
        await this.postService.createPostSubMoods(newSubMoods);
    }

    async uploadChallengeEntriesMedia(files, challengeEntryId, commentId) {
        const promises = [];
        if (files.image && files.image.length > 0) {
            _.forEach(files.image, file => {
                const filePromise = this.minioService.uploadChallengeEntriesMedia(file, 'image');
                promises.push(filePromise);
            });
        }
        if (files.video && files.video.length > 0) {
            _.forEach(files.video, file => {
                const filePromise = this.minioService.uploadChallengeEntriesMedia(file, 'video');
                promises.push(filePromise);
            });
        }

        if (files.audio && files.audio.length > 0) {
            _.forEach(files.audio, file => {
                const filePromise = this.minioService.uploadChallengeEntriesMedia(file, 'audio');
                promises.push(filePromise);
            });
        }
        if (promises.length > 0) {
            let mediaFiles = await Promise.all(promises);
            const challengeEntriesMedia = mediaFiles.map(file => ({
                challengeEntryId: challengeEntryId,
                commentId: commentId,
                url: file.url,
                type: file.type,
                thumbnailUrl: file.thumbnailUrl || null
            }));
            const query = QueryBuilderService.getMultiInsertQuery(table.challengeEntriesMedia, challengeEntriesMedia);
            await this.challengeServiceService.updateChallengeEntriesUpload(challengeEntryId);
            return SqlService.executeQuery(query);
        }
    }
}
