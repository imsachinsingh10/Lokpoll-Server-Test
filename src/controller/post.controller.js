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

export class PostController {
    constructor() {
        this.postService = new PostService();
        this.minioService = new MinIOService();
    }

    async createPost(req) {
        const reqBody = req.body;
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
            isPostUpload: '0',
        };
        post.moodId = reqBody.moodId > 0 ? reqBody.moodId : undefined;
        Validator.validateRequiredFields(post);

        const result = await this.postService.createPost(post);
        const subMoodData = [];
        if (!_.isEmpty(reqBody.subMoodData)) {
            for (const obj of JSON.parse(reqBody.subMoodData)) {
                const submoods = await this.postService.getSubMoodByName(obj);
                if (_.isEmpty(submoods)) {
                    subMoodData.push({
                        name: obj,
                        moodId: reqBody.moodId,
                        createdAt: 'utc_timestamp()',
                    })
                }
            }
        }
        if (!_.isEmpty(subMoodData)) {
            await this.postService.createSubMoods(subMoodData);
        }
        const postSubMoodData = [];
        if (!_.isEmpty(reqBody.subMoodData)) {
            for (const obj of JSON.parse(reqBody.subMoodData)) {
                const submoods = await this.postService.getSubMoodByName(obj);
                postSubMoodData.push({
                    subMoodId: submoods.id,
                    postId: result.insertId
                })
            }
        }
        if (!_.isEmpty(postSubMoodData)) {
            await this.postService.createPostSubMoods(postSubMoodData);
        }
        delete post.createdAt;
        return {id: result.insertId, ...post};
    }

    async formatPosts(req, rawPosts) {
        if (_.isEmpty(rawPosts)) {
            return [];
        }
        // if (!_.isEmpty(rawPosts)) {
        //     return rawPosts;
        // }
        // console.log('rawPosts', rawPosts);
        const postIds = _.map(rawPosts, r => r.id);
        const uniqPostIds = _.uniq(postIds);
        if (postIds.length !== uniqPostIds.length) {
            console.log('+++++++++ alert +++, if someone see this log tell himanshu immediately');
        }
        // uniqPostIds.sort((a, b) => b - a);
        console.log('postIds', uniqPostIds);
        const [comments, subMoods, respects, reactions, trusts, mediaList] = await Promise.all([
            this.postService.getComments(uniqPostIds),
            this.postService.getSubMoodByPostId(uniqPostIds),
            this.postService.getRespects(uniqPostIds),
            this.postService.getPostReactions(uniqPostIds),
            this.postService.getPostTrust(uniqPostIds),
            this.postService.getPostMedia(uniqPostIds),
        ])

        const respectForGrouped = _.groupBy(respects, 'respectFor');
        const respectByGrouped = _.groupBy(respects, 'respectBy');
        const posts = [];
        _.forEach(uniqPostIds, (postId) => {
            const postComments = comments.filter(comment => comment.postId === postId);
            const subMoodData = subMoods.filter(subMood => subMood.postId === postId);
            const _post = this.getPost(req, postId, rawPosts, postComments, respects, respectForGrouped, respectByGrouped, reactions, subMoodData, trusts, mediaList);
            posts.push(_post);
        });
        return posts;
    }

    getPost(req, postId, posts, postComments, respects, respectForGrouped, respectByGrouped, reactions, subMood, trusts, mediaList) {
        const filteredPosts = _.filter(posts, post => post.id === postId);
        const basicDetails = this.getBasicPostDetails(req, filteredPosts[0], respects, respectForGrouped, respectByGrouped, reactions, trusts);
        const media = mediaList
            .filter(m => m.postId === postId && m.url !== null && m.commentId === 0)
            .map(p => ({
                type: p.type,
                url: p.url,
                thumbnailUrl: p.thumbnailUrl
            }));

        const comments = this.getFormattedComments(postComments);

        return {
            ...basicDetails,
            subMood,
            media,
            comments,
            commentCount: comments.length
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

    getBasicPostDetails(req, post, respects, respectForGrouped, respectByGrouped, reactions, trusts) {
        const {
            respectedByMe,
            reaction, loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
            trust, voteUpCount, voteDownCount, noVoteCount,
            respectCountOnPostUserProfile,
            respectCountGivenByPostUserToOthers
        } = this.getReactionsWithCount(req, post, respects, reactions, trusts, respectForGrouped, respectByGrouped)
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
            trustMeter: {
                voteUpCount, voteDownCount, noVoteCount,
                trustByMe: _.isEmpty(trust) ? null : trust.type,
            },
            reactions: {
                loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
                reactionByMe: _.isEmpty(reaction) ? null : reaction.type,
            },
            user: {
                id: post.userId,
                displayName: post.displayName || post.userName,
                profileType: post.profileType || ProfileType.personal,
                imageUrl: post.imageUrl,
                bgImageUrl: post.bgImageUrl,
                audioUrl: post.audioUrl,
                respectCountOnPostUserProfile,
                respectCountGivenByPostUserToOthers,
                respectedByMe: !_.isEmpty(respectedByMe),
            },
            location: {
                latitude: post.latitude,
                longitude: post.longitude,
                address: post.address
            }
        }
    }

    getReactionsWithCount(req, post, respects, reactions, trusts, respectForGrouped, respectByGrouped) {
        const respectedByMe = _.find(respects, (r) => {
            return req.user.id === r.respectBy && post.userId === r.respectFor;
        });
        // console.log('respects', respects.filter(r => r.respectFor === post.userId));
        // console.log('respectedByMe', respectedByMe);
        // console.log(`myId: %d, postUserId: %d`, req.user.id, post.userId);
        const trust = _.find(trusts, (r) => {
            return req.user.id === r.reactedBy && post.id === r.postId;
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
            return req.user.id === r.reactedBy && post.id === r.postId;
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
        const respectCountOnPostUserProfile = respectForGrouped[post.userId] ? respectForGrouped[post.userId].length : 0;
        const respectCountGivenByPostUserToOthers = respectByGrouped[post.userId] ? respectByGrouped[post.userId].length : 0;
        return {
            respectedByMe,
            reaction, loveCount, angryCount, enjoyCount, lolCount, wowCount, sadCount,
            trust, voteUpCount, voteDownCount, noVoteCount,
            respectCountOnPostUserProfile,
            respectCountGivenByPostUserToOthers
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
            userId: req.user.id,
            createdAt: 'utc_timestamp()',
            comment: reqBody.comment,
            replyToCommentId: reqBody.replyToCommentId > 0 ? reqBody.replyToCommentId : undefined
        };
        const result = await this.postService.createPostComment(post);

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
