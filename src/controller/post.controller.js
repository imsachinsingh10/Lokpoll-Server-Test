import * as _ from 'lodash';
import {PostService} from "../service/post.service";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {MinIOService} from "../service/common/minio.service";
import {PostReaction, PostVoteOption, ProfileType} from "../enum/common.enum";
import {AppCode} from "../enum/app-code";
import Validator from "../service/common/validator.service";
import {ErrorModel} from "../model/common.model";
import Utils from "../service/common/utils";
import FirebaseService, {FirebaseMessage} from "../service/firebase.service";
import fs from 'fs';
import {FirebaseController} from "./firebase.controller";

export class PostController {
    constructor() {
        this.postService = new PostService();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
    }

    async createPost(req) {
        const reqBody = req.body;
        const files = req.files;
        const post = {
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
            language: reqBody.language,
        };
        if (files.image || files.video || files.audio) {
            post.isPostUpload = '0';
        } else {
            post.isPostUpload = '1';
        }
        post.moodId = reqBody.moodId > 0 ? reqBody.moodId : undefined;
        Validator.validateRequiredFields(post);

        const result = await this.postService.createPost(post);
        await this.insertSubMoods(reqBody, result.insertId);
        delete post.createdAt;
        return {id: result.insertId, ...post};
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

    async formatPosts(req, rawPosts) {
        if (_.isEmpty(rawPosts)) {
            return [];
        }
        const postIds = _.map(rawPosts, r => r.id);
        const uniqPostIds = _.uniq(postIds);
        if (postIds.length !== uniqPostIds.length) {
            console.log('+++++++++ alert +++, if someone see this log tell himanshu immediately');
        }
        const [comments, subMoods, respects, reactions, trusts, mediaList] = await Promise.all([
            this.postService.getComments(uniqPostIds),
            this.postService.getSubMoodByPostId(uniqPostIds),
            this.postService.getRespects(uniqPostIds),
            this.postService.getPostReactions(uniqPostIds),
            this.postService.getPostTrust(uniqPostIds),
            this.postService.getPostMedia(uniqPostIds),
        ])

        const posts = [];
        _.forEach(rawPosts, (post) => {
            const _post = this.getPost(
                {userId: req.user.id, post, comments, subMoods, respects, reactions, trusts, mediaList}
            );
            posts.push(_post);
        });
        return posts;
    }

    getPost({userId, post, comments, subMoods, respects, reactions, trusts, mediaList}) {
        const postComments = comments.filter(comment => comment.postId === post.id);
        const subMoodData = subMoods.filter(subMood => subMood.postId === post.id);
        const basicDetails = this.getBasicPostDetails(userId, post, respects);
        const media = mediaList
            .filter(m => m.postId === post.id && m.url !== null && m.commentId === 0)
            .map(p => ({
                type: p.type,
                url: p.url,
                thumbnailUrl: p.thumbnailUrl
            }));

        const formattedComments = this.getFormattedComments(postComments);

        const {
            reaction, loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
            trust, voteUpCount, voteDownCount, noVoteCount,
        } = this.getReactionsWithCount(userId, post, reactions, trusts);

        return {
            ...basicDetails,
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
                imageUrl: comment.imageUrl
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

    getBasicPostDetails(userId, post, respects) {
        const respectedByMe = _.find(respects, (r) => {
            return userId === r.respectBy && post.userId === r.respectFor;
        });
        return {
            id: post.id,
            distanceInMeters: Utils.getDistanceInMeters(post.distance),
            createdAt: Utils.getNumericDate(post.createdAt),
            description: post.description,
            type: post.postType,
            mood: post.mood,
            source: post.source,
            language: post.language,
            linkToShare: "https://www.socialmediatoday.com",
            user: {
                id: post.userId,
                displayName: post.displayName || post.userName,
                profileType: post.profileType || ProfileType.personal,
                imageUrl: post.imageUrl,
                bgImageUrl: post.bgImageUrl,
                audioUrl: post.audioUrl,
                respectedByMe: !_.isEmpty(respectedByMe),
            },
            location: {
                latitude: post.latitude,
                longitude: post.longitude,
                address: post.address
            }
        }
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

    async uploadPostMedia(files, postId, commentId) {
        const promises = [];
        if (files.image && files.image.length > 0) {
            _.forEach(files.image, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'image');
                promises.push(filePromise);
            });
        }
        if (files.video && files.video.length > 0) {
            _.forEach(files.video, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'video');
                promises.push(filePromise);
            });
        }

        if (files.audio && files.audio.length > 0) {
            _.forEach(files.audio, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'audio');
                promises.push(filePromise);
            });
        }
        if (promises.length > 0) {
            let mediaFiles = await Promise.all(promises);
            const postMedia = mediaFiles.map(file => ({
                postId: postId,
                commentId: commentId,
                url: file.url,
                type: file.type,
                thumbnailUrl: file.thumbnailUrl || null
            }));
            const query = QueryBuilderService.getMultiInsertQuery(table.postMedia, postMedia);
            await this.postService.updatePostUpload(postId);
            return SqlService.executeQuery(query);
        }
    }

    getReactionTypes() {
        return PostReaction
    }

    async commentOnPost(req) {
        const reqBody = req.body;
        const post = {
            postId: reqBody.postId,
            userId: 34,
            createdAt: 'utc_timestamp()',
            comment: reqBody.comment,
            replyToCommentId: reqBody.replyToCommentId > 0 ? reqBody.replyToCommentId : undefined
        };
        const result = await this.postService.createPostComment(post);
        await this.firebaseController.sendMessageForNewCommentOnPost(post);
        return {id: result.insertId, ...post}
    }

    async votePost(req) {
        if (!Validator.isValidPostVoteType(req.body.type)) {
            throw new ErrorModel(AppCode.invalid_request, `Invalid trust type ${req.body.type}`);
        }
        return this.postService.votePost(req);
    }

    async reactOnPost(req) {
        if (!Validator.isValidPostReactionType(req.body.type)) {
            throw new ErrorModel(AppCode.invalid_request, `Invalid post react type ${req.body.type}`);
        }
        return this.postService.reactOnPost(req);
    }

    async notifyUser(userId, postId) {
        const query = `select deviceToken from ${table.user} where id = ${userId};`;
        const result = await SqlService.getSingle(query);
        if (_.isEmpty(result) || _.isEmpty(result.deviceToken)) {
            return console.log('+++++ no user found to notify +++++');
        }
        return FirebaseService.sendMessage([result.deviceToken], FirebaseMessage.PostCreated)
    };

    async getFormattedTrustData(req) {
        let rawArray = await this.postService.getTrustOnPost(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                trustType: obj.trustType,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };

    async getFormattedTrustDataVoteUp(req) {
        let rawArray = await this.postService.getTrustOnPostVoteUp(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };

    async getFormattedTrustDataVoteDown(req) {
        let rawArray = await this.postService.getTrustOnPostVoteDown(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };

    async getFormattedTrustDataNoVote(req) {
        let rawArray = await this.postService.getTrustOnPostNoVote(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
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
