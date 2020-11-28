import * as _ from 'lodash';
import {PostService} from "../service/post.service";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {MinIOService} from "../service/common/minio.service";
import {Environment, LanguageCode, PostReaction, PostVoteOption, ProfileType} from "../enum/common.enum";
import {AppCode} from "../enum/app-code";
import Validator from "../service/common/validator.service";
import {ErrorModel} from "../model/common.model";
import Utils from "../service/common/utils";
import {FirebaseController} from "./firebase.controller";
import {Config} from "../config";
import FirebaseService, {FirebaseMessage} from "../service/firebase.service";
import {log} from "../service/common/logger.service";
import moment from "moment";
import {UserNetworkService} from '../service/user-network.service';
import {PostContentType} from '../enum/post-content-type';
import {CoinActivity} from '../enum/coin-activity';

export class PostController {
    constructor() {
        this.postService = new PostService();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
        this.userNetworkService = new UserNetworkService();
    }

    async createPost(req) {
        const reqBody = req.body;
        const files = req.files;
        const post = {
            contentType: reqBody.contentType,
            description: reqBody.description,
            text: reqBody.text,
            textColor: reqBody.textColor,
            textBgColor: reqBody.textBgColor,
            userId: reqBody.userId || req.user.id,
            creatorId: req.user.id,
            createdAt: 'utc_timestamp()',
            type: reqBody.type,
            profileType: reqBody.profileType,
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            address: reqBody.address,
            source: reqBody.source,
            link: reqBody.link,
            languageCode: reqBody.languageCode,
            challengeId: reqBody.challengeId || 0,
            isPublished: 1,
            isGeneric: 0,
        };
        if (files.image || files.video || files.audio || files.textBgImage) {
            post.isPostUpload = '0';
        } else {
            post.isPostUpload = '1';
        }
        if (reqBody.publishDate && reqBody.publishDate !== 'null') {
            post.isPublished = 0;
            post.publishDate = reqBody.publishDate;
        }
        if (!post.latitude && !post.longitude) {
            post.latitude = 0;
            post.address = '';
            post.longitude = 0;
            post.isGeneric = 1
        }
        post.moodId = reqBody.moodId > 0 ? reqBody.moodId : undefined;

        const result = await this.postService.createPost(post);
        await this.insertSubMoods(reqBody, result.insertId);
        await this.insertPoll(reqBody, result.insertId);
        delete post.createdAt;
        return {id: result.insertId, ...post};
    }

    async creditCoinsByAddPost(postId, userId) {
        let activity, frontLineActivity, downLineActivity;

        switch (req.body.contentType) {
            case PostContentType.Description:
                activity = CoinActivity.addPost;
                frontLineActivity = CoinActivity.frontLineAddPost;
                downLineActivity = CoinActivity.downLineAddPost;
                break;
            case PostContentType.CustomText:
                activity = CoinActivity.addPostWithCustomText;
                frontLineActivity = CoinActivity.frontLineAddPostWithCustomText;
                downLineActivity = CoinActivity.downLineAddPostWithCustomText;
                break;
            case PostContentType.Audio:
                activity = CoinActivity.addPostWithAudio;
                frontLineActivity = CoinActivity.frontLineAddPostWithAudio;
                downLineActivity = CoinActivity.downLineAddPostWithAudio;
                break;
            case PostContentType.Video:
                activity = CoinActivity.addPostWithVideo;
                frontLineActivity = CoinActivity.frontLineAddPostWithVideo;
                downLineActivity = CoinActivity.downLineAddPostWithVideo;
                break;
            case PostContentType.Link:
                activity = CoinActivity.addPostWithLink;
                frontLineActivity = CoinActivity.frontLineAddPostWithLink;
                downLineActivity = CoinActivity.downLineAddPostWithLink;
                break;
            case PostContentType.Photo:
                activity = CoinActivity.addPostWithPhoto;
                frontLineActivity = CoinActivity.frontLineAddPostWithPhoto;
                downLineActivity = CoinActivity.downLineAddPostWithPhoto;
                break;
            case PostContentType.Poll:
                activity = CoinActivity.addPostWithPoll;
                frontLineActivity = CoinActivity.frontLineAddPostWithPoll;
                downLineActivity = CoinActivity.downLineAddPostWithPoll;
                break;
        }
        await this.userNetworkService.logAddPostActivity({
            userId,
            postId,
            activity,
            frontLineActivity,
            downLineActivity,
        });
    }

    async creditCoinsOnRePost(postId, userId) {
        const reqBody = req.body;
        const files = req.files;
        if (_.isEmpty(req.body.contentType)) {
            return
        }
        await this.userNetworkService.logAddPostActivity({
            userId,
            postId,
            activity: CoinActivity.repost,
            frontLineActivity: CoinActivity.frontLineRepost,
            downLineActivity: CoinActivity.downLineRepost,
        });
    }

    async creditCoinsOnSharePostExternally({postId, userId, platform}) {
        await this.userNetworkService.logAddPostActivity({
            userId,
            postId,
            platform,
            activity: CoinActivity.sharePost,
            frontLineActivity: CoinActivity.frontLineSharePost,
            downLineActivity: CoinActivity.downLineSharePost,
        });
    }

    async shareInternally(req) {
        const reqBody = req.body;
        const postOriginal = await SqlService.getSingle(`select * from post where id = ${reqBody.postId}`);
        if (_.isEmpty(postOriginal)) {
            throw new ErrorModel(AppCode.invalid_request, `no post found with id ${reqBody.postId}`);
        }
        const polls = await SqlService.executeQuery(
            `select 1 from ${table.poll} where postId = ${postOriginal.id};`
        )
        if (!_.isEmpty(polls)) {
            throw new ErrorModel(AppCode.invalid_request, `post with polls cannot be shared`);
        }
        const post = {
            ...postOriginal,
            description: reqBody.description,
            descriptionOld: postOriginal.description,
            userId: reqBody.userId || req.user.id,
            createdAt: 'utc_timestamp()',
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            address: reqBody.address,
            source: 'Reposted',
            isGeneric: 0,
            postIdParent: postOriginal.id
        };
        if (!post.latitude && !post.longitude) {
            post.latitude = 0;
            post.address = '';
            post.longitude = 0;
            post.isGeneric = 1
        }
        delete post.id;
        const result = await this.postService.createPost(post);
        let postMedia = await SqlService.executeQuery(
            `select * from ${table.postMedia} where postId = ${postOriginal.id};`
        );
        if (!_.isEmpty(postMedia)) {
            postMedia = postMedia.map((pm) => ({...pm, postId: result.insertId}));
            const query = QueryBuilderService.getMultiInsertQuery(table.postMedia, postMedia);
            await SqlService.executeMultipleQueries(query);
        }
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
            isOriginalContest: reqBody.isOriginalContest || 0
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
            log.e('', e);
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

    async insertPoll(reqBody, postId) {
        if (_.isEmpty(reqBody.poll)) {
            return;
        }
        let poll;
        try {
            poll = JSON.parse(reqBody.poll);
        } catch (e) {
            throw new ErrorModel(AppCode.invalid_request, `poll is not valid`);
        }
        const expiryDate = moment.utc()
            .add('days', poll.expiryInDays)
            .format('YYYY-MM-DD HH:mm:ss');
        const model = {
            postId,
            question: poll.question,
            expiryDate
        }
        poll.options.forEach((option, index) => {
            model['option' + (index + 1)] = option
        });
        const q = QueryBuilderService.getInsertQuery(table.poll, model);
        return SqlService.executeQuery(q);
    }

    async formatPosts(req, rawPosts) {
        if (_.isEmpty(rawPosts)) {
            return [];
        }
        const postIds = _.map(rawPosts, r => r.id);
        const uniqPostIds = _.uniq(postIds);
        if (postIds.length !== uniqPostIds.length) {
            log.e('+++++++++ alert +++, if someone see this log tell himanshu immediately');
        }
        const [comments, subMoods, respects, reactions, trusts, mediaList, postViews, postPolls] = await Promise.all([
            this.postService.getComments(uniqPostIds),
            this.postService.getSubMoodByPostId(uniqPostIds),
            this.postService.getRespects(uniqPostIds),
            this.postService.getPostReactions(uniqPostIds),
            this.postService.getPostTrust(uniqPostIds),
            this.postService.getPostMedia(uniqPostIds),
            this.postService.getPostViews(uniqPostIds),
            this.postService.getPostPolls(uniqPostIds),
        ])

        const posts = [];
        _.forEach(rawPosts, (post) => {
            const _post = this.getPost(
                {user: req.user, post, comments, postViews, subMoods, respects, reactions, trusts, mediaList, postPolls}
            );
            posts.push(_post);
        });
        return posts;
    }

    getPost({user, post, comments, postViews, subMoods, respects, reactions, trusts, mediaList, postPolls}) {
        let referralCode;
        let userId = 0;

        if (user) {
            referralCode = user.referralCode
            userId = user.id;
        }

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
        const basicDetails = this.getBasicPostDetails(userId, referralCode, post, respects);
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
            commentCount: formattedComments.length,
            poll: postPolls[post.id] || null
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

    getBasicPostDetails(userId, referralCode, post, respects) {
        const respectedByMe = _.find(respects, (r) => {
            return userId === r.respectBy && post.userId === r.respectFor;
        });
        let linkToShare = this.getLinkToShare(post, referralCode);
        return {
            id: post.id,
            link: post.link,
            descriptionOld: post.descriptionOld,
            postIdParent: post.postIdParent,
            distanceInMeters: Utils.getDistanceInMeters(post.distance),
            createdAt: Utils.getNumericDate(post.createdAt),
            description: post.description,
            isPublished: post.isPublished,
            publishDate: post.publishDate,
            isGeneric: post.isGeneric,
            type: post.postType,
            mood: post.mood,
            source: post.source,
            language: post.language,
            languageCode: post.languageCode,
            isOriginalContest: post.isOriginalContest,
            topic: post.contestTopic,
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

    getLinkToShare(post, code) {
        let playStoreLink = `https://localbol.page.link?amv=1&apn=com.aeon.lokpoll&link=https%3A%2F%2Fwww.localbol.com%2Fpost%3Fid%3D${post.id}`
        let linkToShare = `http://www.localbol.com/post-test/#/${post.id}`;
        if (process.env.NODE_ENV === Environment.prod) {
            linkToShare = `http://www.localbol.com/post/#/${post.id}`;
        }
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
                linkToShare += `\n\n Download India\'s own local app LocalBol now to get news, updates, hear directly from local talent, causes and business from your preferred locations in your local languages.`;
                linkToShare += `\n\n ${playStoreLink}`
                if (code) {
                    linkToShare += `\n\n Please use my Referral code ${code} or my Mobile number while signing up for LocalBol`
                }
                break;
            case LanguageCode.Hindi:
                linkToShare += `\n\n अपनी स्थानीय भाषा में अपने पसंदीदा स्थान से स्थानीय समाचार, सामाजिक कार्य, व्यवसाय से सीधे अपडेट प्राप्त करने के लिए भारत का अपना स्थानीय ऐप LocalBol डाउनलोड करें.`;
                linkToShare += `\n\n ${playStoreLink}`
                if (code) {
                    linkToShare += `\n\n जब आप LocalBol के लिए साइन अप करते हैं तो कृपया मेरे रेफरल कोड ${code} या मेरे मोबाइल नंबर का उपयोग करें`
                }
                break;
            case LanguageCode.Odia:
                linkToShare += `\n\n LocalBol app ଡାଉନଲୋଡ କରନ୍ତୁ ଜୋଉଥିରେ କି ନିଜ ଜାଗାର କିମ୍ବା ଆଖ ପାଖ ଅଂଚଳ ର ଖବର ହେଉ କି କାହାଣୀ ହେଉ ସବୁ ନିଜ ସ୍ଥାନ, ନିଜ ଲୋକଙ୍କର ସମ୍ବନ୍ଧରେ ଅଥବା ନିଜ ଭାଷା ରେ  ଦେଖି ପାରିବେ I ଖାଲି ତାହା ନୁହଁ, ଆପଣ ଚାହିଁଲେ ଅନ୍ୟ Location ରେ କଣ ଚାଲିଛି ତାହା ମଧ୍ୟ୍ୟ ଦେଖୀ ପାରିବେ.`;
                linkToShare += `\n\n ${playStoreLink}`
                if (code) {
                    linkToShare += `\n\n ଯେତେବେଳେ ଆପଣ ଲୋକାଲ୍ ବୋଲ୍ ପାଇଁ ସାଇନ୍ ଅପ୍ କରନ୍ତି ଦୟାକରି ମୋର ରେଫରାଲ୍ କୋଡ୍ ${code} କିମ୍ବା ମୋ ମୋବାଇଲ୍ ନମ୍ବର ବ୍ୟବହାର କରନ୍ତୁ |`
                }
                break;
            case LanguageCode.Sambalpuri:
                linkToShare += `\n\n ପହେଲା ଥର, ଆମର ଭାଷା ରେ  APP କେ ଚଲାବାର ମଜା ଅଲଗା ଲାଗବା !! ନିଜର ଜାଗା, ନିଜର ଲୋକ ଆଉ ନିଜର ଭାଷା ଲାଗିର ବନା ହୋଇଛେ I Link ଦିଆହେଇଛେ ନିଜେ ଡାଉନଲୋଡ କରୁନ ଆଉ ସମକୁ forward କରୁନ.`;
                linkToShare += `\n\n ${playStoreLink}`
                if (code) {
                    linkToShare += `\n\n LocalBol ରେ ସାଇନ୍ ଅପ୍ କଲା ବେଲେ ଦୟାକରି ମୋର ରେଫେର୍ରାଲ କୋଡ଼ ${code} ନାଇଁହେଲେ ମୋର ମୋବାଇଲ ନମ୍ବର add କରୁନ |`
                }
                break;
        }
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
        if (files.textBgImage && files.textBgImage.length > 0) {
            _.forEach(files.textBgImage, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'textBgImage');
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
            return log.i('no user found to notify');
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

    validateAddPostRequest(req) {
        const reqBody = req.body;
        let message = ''
        const requiredFields = ['contentType', 'moodId']
        if (_.isEmpty(reqBody.contentType)) {
            message = 'contentType is missing'
        } else if (reqBody.contentType === PostContentType.CustomText && _.isEmpty(reqBody.text)) {
            message = 'text is missing'
        } else if (_.isEmpty(reqBody.description) &&
            _.isEmpty(reqBody.link) &&
            _.isEmpty(req.files) &&
            _.isEmpty(reqBody.poll) &&
            reqBody.contentType !== PostContentType.CustomText) {
            message = 'At least one of these is required [description|link|files|poll]'
        }
        if (!_.isEmpty(message)) {
            throw new ErrorModel(AppCode.invalid_request, message);
        }
    }
}
