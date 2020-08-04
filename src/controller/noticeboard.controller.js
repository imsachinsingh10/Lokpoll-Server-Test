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
import {MinIOService} from "../service/common/minio.service";
import {NoticeboardService} from "../service/noticeboard.service";

export class NoticeboardController {
    constructor() {
        this.noticeboardService = new NoticeboardService();
        this.minioService = new MinIOService();
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

    async checkIfJudgeAlreadyAssign(challenge) {
        const _challenge = await this.challengeService.checkAlreadyAssign(challenge);
        if (
            (!challenge.id && !_.isEmpty(_challenge))
            || (challenge.id && !_.isEmpty(_challenge) && challenge.id !== _challenge.id)
        ) {
            throw {
                message: `Judge is already assigned on this contest.`,
                code: AppCode.duplicate_entity
            }
        }
    }

    async createChallengeEntries(req) {
        const reqBody = req.body;
        const files = req.files;
        const entries = {
            description: reqBody.description,
            challengeId: reqBody.challengeId,
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
            await this.challengeService.updateChallengeEntriesUpload(challengeEntryId);
            return SqlService.executeQuery(query);
        }
    }

    async formatChallengeEntries(req, rawEntries) {
        if (_.isEmpty(rawEntries)) {
            return [];
        }
        const challengeEntryIds = _.map(rawPosts, r => r.id);
        const uniqChallengeEntryIds = _.uniq(challengeEntryIds);
        if (challengeEntryIds.length !== uniqChallengeEntryIds.length) {
            console.log('+++++++++ alert +++, if someone see this log tell himanshu immediately');
        }
        const [comments, subMoods, respects, reactions, trusts, mediaList, challengeEntriesViews] = await Promise.all([
            this.challengeService.getComments(uniqChallengeEntryIds),
            this.postService.getSubMoodByPostId(uniqChallengeEntryIds),
            this.postService.getRespects(uniqChallengeEntryIds),
            this.postService.getPostReactions(uniqChallengeEntryIds),
            this.postService.getPostTrust(uniqChallengeEntryIds),
            this.challengeService.getChallengeEntryMedia(uniqChallengeEntryIds),
            this.challengeService.getChallengeEntriesViews(uniqChallengeEntryIds),
        ])

        const challengeEntries = [];
        _.forEach(rawEntries, (entries) => {
            const _entries = this.getChallengeEntries(
                {userId: req.user ? req.user.id : 0, entries, comments, challengeEntriesViews, subMoods, respects, reactions, trusts, mediaList}
            );
            challengeEntries.push(_entries);
        });
        return challengeEntries;
    }

    async formatChallengeEntriesForAdmin(req, rawEntries) {
        if (_.isEmpty(rawEntries)) {
            return [];
        }
        const challengeEntryIds = _.map(rawEntries, r => r.id);
        const uniqChallengeEntryIds = _.uniq(challengeEntryIds);
        if (challengeEntryIds.length !== uniqChallengeEntryIds.length) {
            console.log('+++++++++ alert +++, if someone see this log tell himanshu immediately');
        }
        const [mediaList] = await Promise.all([

            this.postService.getPostMedia(uniqChallengeEntryIds)
        ])

        const challengeEntries = [];
        _.forEach(rawEntries, (entries) => {
            const _entries = this.getChallengeEntriesForAdmin(
                {userId: req.user.id, entries ,mediaList}
            );
            challengeEntries.push(_entries);
        });
        return challengeEntries;
    }

    getChallengeEntriesForAdmin({userId, entries, mediaList}) {


        const basicDetails = this.getBasicChallengeEntriesDetailsForAdmin(userId, entries);
        const media = mediaList
            .filter(m => m.postId === entries.id && m.url !== null && m.commentId === 0)
            .map(p => ({
                type: p.type,
                url: p.url,
                thumbnailUrl: p.thumbnailUrl
            }));
        return {
            ...basicDetails,
            media
        }
    }

    getBasicChallengeEntriesDetailsForAdmin(userId, entries) {

        return {
            id: entries.id,
            distanceInMeters: Utils.getDistanceInMeters(entries.distance),
            createdAt: Utils.getNumericDate(entries.createdAt),
            description: entries.description,
            remark: entries.remark,
            type: entries.postType,
            mood: entries.mood,
            source: entries.source,
            language: entries.language,
            languageCode: entries.languageCode,
            linkToShare: "https://www.socialmediatoday.com",
            user: {
                id: entries.userId,
                displayName: entries.displayName || entries.userName,
                profileType: entries.profileType || ProfileType.personal,
                imageUrl: entries.imageUrl,
                bgImageUrl: entries.bgImageUrl,
                audioUrl: entries.audioUrl
            },
            location: {
                latitude: entries.latitude,
                longitude: entries.longitude,
                address: entries.address
            }
        }
    }

    getChallengeEntries({userId, entries, comments, challengeEntriesViews, subMoods, respects, reactions, trusts, mediaList}) {
        const challengeEntriesViewFiltered = challengeEntriesViews.filter(challengeEntriesViews => challengeEntriesViews.challengeEntryId === entries.id);

        let viewCount = 0;
        let viewedByUsers = [];
        if (challengeEntriesViewFiltered.length > 0) {
            viewCount = challengeEntriesViewFiltered.length;
            viewedByUsers = challengeEntriesViewFiltered.map(p => {
                return {
                    id: p.userId,
                    name: p.userName,
                    imageUrl: p.userImageUrl,
                }
            })
        }

        const postComments = comments.filter(comment => comment.postId === entries.id);
        const subMoodData = subMoods.filter(subMood => subMood.postId === entries.id);
        const basicDetails = this.getBasicChallengeEntriesDetails(userId, entries, respects);
        const media = mediaList
            .filter(m => m.challengeEntryId === entries.id && m.url !== null && m.commentId === 0)
            .map(p => ({
                type: p.type,
                url: p.url,
                thumbnailUrl: p.thumbnailUrl
            }));
        const formattedComments = this.getFormattedComments(postComments);

        const {
            reaction, loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
            trust, voteUpCount, voteDownCount, noVoteCount,
        } = this.getReactionsWithCount(userId, entries, reactions, trusts);
        return {
            ...basicDetails,
            viewCount,
            viewedByUsers,
            subMood: subMoodData,
            media,
            trustMeter: {
                voteUpCount, voteDownCount, noVoteCount,
                trustByMe: _.isEmpty(trust) ? null : trust.type,
            },
            reactions: {
                loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
                reactionByMe: _.isEmpty(reaction) ? null : reaction.type,
            },
            comments: formattedComments,
            commentCount: formattedComments.length
        }
    }

    getBasicChallengeEntriesDetails(userId, entries, respects) {
        const respectedByMe = _.find(respects, (r) => {
            return userId === r.respectBy && entries.userId === r.respectFor;
        });
        return {
            id: entries.id,
            distanceInMeters: Utils.getDistanceInMeters(entries.distance),
            createdAt: Utils.getNumericDate(entries.createdAt),
            description: entries.description,
            type: entries.postType,
            mood: entries.mood,
            source: entries.source,
            language: entries.language,
            languageCode: entries.languageCode,
            linkToShare: "https://www.socialmediatoday.com",
            user: {
                id: entries.userId,
                displayName: entries.displayName || entries.userName,
                profileType: entries.profileType || ProfileType.personal,
                imageUrl: entries.imageUrl,
                bgImageUrl: entries.bgImageUrl,
                audioUrl: entries.audioUrl,
                respectedByMe: !_.isEmpty(respectedByMe),
            },
            location: {
                latitude: entries.latitude,
                longitude: entries.longitude,
                address: entries.address
            }
        }
    }

    getFormattedComments(comments) {
        const final = [];
        while (!_.isEmpty(comments)) {
            const consumedCommentIds = [];
            final.push(this.getFormattedComment(comments[0], comments, consumedCommentIds));
            comments = comments.filter(c => consumedCommentIds.indexOf(c.id) < 0)
        }
        return final;
    }

    getFormattedComment(comment, allComments, consumedCommentIds) {
        consumedCommentIds.push(comment.id);
        return {
            id: comment.id,
            comment: comment.comment,
            media: {
                type: comment.type,
                url: comment.url
            },
            user: {
                name: comment.name,
                imageUrl: comment.imageUrl,
                id: comment.userId
            },
            replies: this.getCommentReplies(comment.id, allComments, consumedCommentIds)
        };
    }

    getCommentReplies(commentId, allComments, consumedCommentIds) {
        const comments = allComments.filter(c => c.replyToCommentId === commentId);
        return comments.map(c => {
            return this.getFormattedComment(c, allComments, consumedCommentIds)
        })
    }

    getReactionsWithCount(userId, post, reactions, trusts) {
        const trust = _.find(trusts, (r) => {
            return userId === r.reactedBy && post.id === r.postId;
        });
        const voteUpCount = _.filter(trusts, (r) => {
            return r.postId === post.id && r.type === PostVoteOption.voteUp;
        }).length;
        const voteDownCount = _.filter(trusts, (r) => {
            return r.postId === post.id && r.type === PostVoteOption.voteDown;
        }).length;
        const noVoteCount = _.filter(trusts, (r) => {
            return r.postId === post.id && r.type === PostVoteOption.noVote;
        }).length;

        const reaction = _.find(reactions, (r) => {
            return userId === r.reactedBy && post.id === r.postId;
        });
        const loveCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.love;
        }).length;
        const angryCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.angry;
        }).length;
        const enjoyCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.enjoy;
        }).length;
        const lolCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.lol;
        }).length;
        const wowCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.wow;
        }).length;
        const sadCount = _.filter(reactions, (r) => {
            return r.postId === post.id && r.type === PostReaction.sad;
        }).length;
        return {
            reaction, loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
            trust, voteUpCount, voteDownCount, noVoteCount,
        };
    }

    async reactOnChallengeEntries(req) {
        if (!Validator.isValidPostReactionType(req.body.type)) {
            throw new ErrorModel(AppCode.invalid_request, `Invalid post react type ${req.body.type}`);
        }
        return this.challengeService.reactOnChallengeEntries(req);
    }

    async commentOnChallengeEntries(req) {
        const reqBody = req.body;
        const post = {
            challengeEntryId: reqBody.postId,
            userId: req.user.id,
            createdAt: 'utc_timestamp()',
            comment: reqBody.comment,
            replyToCommentId: reqBody.replyToCommentId > 0 ? reqBody.replyToCommentId : undefined
        };
        const result = await this.challengeService.createChallengeEntriesComment(post);
        await this.firebaseController.sendMessageForNewCommentOnChallengeEntry(post);
        return {id: result.insertId, ...post}
    }


    async getFormattedWinnerDetails(req) {
        let rawArray = await this.challengeService.getWinnerDetails(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                marks: obj.marks,
                rank: obj.rank,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };
}
