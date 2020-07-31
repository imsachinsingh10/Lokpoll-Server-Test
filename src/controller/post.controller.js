import * as _ from 'lodash';
import {PostService} from "../service/post.service";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {MinIOService} from "../service/common/minio.service";
import {LanguageCode, PostReaction, PostVoteOption, ProfileType} from "../enum/common.enum";
import {AppCode} from "../enum/app-code";
import Validator from "../service/common/validator.service";
import {ErrorModel} from "../model/common.model";
import Utils from "../service/common/utils";
import fs from 'fs';
import {FirebaseController} from "./firebase.controller";
import {Config} from "../config";

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
            languageCode: reqBody.languageCode,
            challengeId: reqBody.challengeId || 0,
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

    async createContentPost(req) {
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
            languageCode: reqBody.languageCode,
            challengeId: reqBody.challengeId || 0,
            isPostUpload: 1,
        };

        post.moodId = reqBody.moodId > 0 ? reqBody.moodId : undefined;
        const result = await this.postService.createPost(post);
        await this.insertPostMediaUrl(reqBody, result.insertId);
        delete post.createdAt;
        return {id: result.insertId, ...post};
    }

    async insertPostMediaUrl(reqBody, postId) {
        const postMedia = {
            postId: postId,
            commentId: 0,
            url: reqBody.posterUrl,
            type: "image",
            thumbnailUrl: reqBody.posterUrl || null
        }
        const query = QueryBuilderService.getInsertQuery(table.postMedia, postMedia);
        return SqlService.executeQuery(query);
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
        const [comments, subMoods, respects, reactions, trusts, mediaList, postViews] = await Promise.all([
            this.postService.getComments(uniqPostIds),
            this.postService.getSubMoodByPostId(uniqPostIds),
            this.postService.getRespects(uniqPostIds),
            this.postService.getPostReactions(uniqPostIds),
            this.postService.getPostTrust(uniqPostIds),
            this.postService.getPostMedia(uniqPostIds),
            this.postService.getPostViews(uniqPostIds),
        ])

        const posts = [];
        _.forEach(rawPosts, (post) => {
            const _post = this.getPost(
                {userId: req.user ? req.user.id : 0, post, comments, postViews, subMoods, respects, reactions, trusts, mediaList}
            );
            posts.push(_post);
        });
        return posts;
    }

    getPost({userId, post, comments, postViews, subMoods, respects, reactions, trusts, mediaList}) {
        const postViewFiltered = postViews.filter(postView => postView.postId === post.id);

        let viewCount = 0;
        let viewedByUsers = [];
        if (postViewFiltered.length > 0) {
            viewCount = postViewFiltered.length;
            viewedByUsers = postViewFiltered.map(p => {
                return {
                    id: p.userId,
                    name: p.userName,
                    imageUrl: p.userImageUrl,
                }
            })
        }

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

    getBasicPostDetails(userId, post, respects) {
        const respectedByMe = _.find(respects, (r) => {
            return userId === r.respectBy && post.userId === r.respectFor;
        });
        let linkToShare = this.getLinkToShare(post);
        return {
            id: post.id,
            distanceInMeters: Utils.getDistanceInMeters(post.distance),
            createdAt: Utils.getNumericDate(post.createdAt),
            description: post.description,
            type: post.postType,
            mood: post.mood,
            source: post.source,
            language: post.language,
            languageCode: post.languageCode,
            linkToShare,
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

    getLinkToShare(post) {
        let linkToShare = `http://www.localbol.com/post/#/${post.id}`;
        if (!_.isEmpty(post.description)) {
            if (post.description.length > 200) {
                const shortDesc = post.description.substr(0, 200) + '...';
                linkToShare = `${shortDesc}\n\n ${linkToShare}`;
            } else {
                linkToShare = `${post.description}\n\n ${linkToShare}`;
            }
        }
        switch (post.languageCode) {
            case LanguageCode.English:
                linkToShare += '\n\n Download India\'s own local app LocalBol now to get news, updates, hear directly from local talent, causes, business from your preferred location in your local language.'
                break;
            case LanguageCode.Hindi:
                linkToShare += '\n\n अपनी स्थानीय भाषा में अपने पसंदीदा स्थान से स्थानीय समाचार, सामाजिक कार्य, व्यवसाय से सीधे अपडेट प्राप्त करने के लिए भारत का अपना स्थानीय ऐप LocalBol डाउनलोड करें.';
                break;
            case LanguageCode.Odia:
                linkToShare += '\n\n LocalBol app ଡାଉନଲୋଡ୍ଯୋ କରନ୍ତୁ ଜୋଉଥିରେ କି ନିଜ ଜାଗାର କିମ୍ବା ଆଖ ପାଖ ଅଂଚଳ ର ଖବର ହେଉ କି କାହାଣୀ ହେଉ ସବୁ ନିଜ ସ୍ଥାନ, ନିଜ ଲୋକଙ୍କର ସମ୍ବନ୍ଧରେ ଅଥବା ନିଜ ଭାଷା ରେ  ଦେଖି ପାରିବେ. ଖାଲି ତାହା ନୁହଁ, ଆପଣ ଚାହିଁଲେ ଅନ୍ୟ Location ରେ କଣ ଚାଲିଛି ତାହା ମଧ୍ୟ୍ୟ ଦେଖୀ ପାରିବେ.';
                break;
            case LanguageCode.Sambalpuri:
                linkToShare += '\n\n ପହେଲା ଥର, ଆମର ଭାଷା ରେ  APP କେ ଚଲାବାର ମଜା ଅଲଗା ଲାଗବା !! ନିଜର ଜାଗା, ନିଜର ଲୋକ ଆଉ ନିଜର ଭାଷା ଲାଗିର ବନା ହୋଇଛେ. \n\n Link ଦିଆହେଇଛେ ନିଜେ download କରୁନ ଆଉ ସମକୁ forward କରୁନ.';
                break;
        }
        linkToShare += '\n\n https://play.google.com/store/apps/details?id=com.aeon.lokpoll'
        return linkToShare;
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
            userId: req.user.id,
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
