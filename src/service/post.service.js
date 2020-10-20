import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import Utils from "./common/utils";
import _ from 'lodash';
import fs from "fs";
import path from 'path';
import {FirebaseController} from "../controller/firebase.controller";
import {log} from "./common/logger.service";

export class PostService {
    constructor() {
        this.firebaseController = new FirebaseController();
    }

    async createPost(post) {
        const query = QueryBuilderService.getInsertQuery(table.post, post);
        return SqlService.executeQuery(query);
    }

    async getTotalPostCount(req) {
        let c1 = '';
        let c2 = '';
        if (req.user.roleId === 2) {
            c1 = `and p.userId = ${req.user.id}`;
        }
        if (req.user.roleId === 3) {
            c2 = `and p.isPublished = 1`;
        }
        if (req.body.futurePost) {
            c2 = `and p.isPublished = 0`;
        }
        const query = `select count("id") count
	    				from ${table.post} p
	    				join user u on u.id = p.userId
	    				where p.isDeleted = 0
	    				    ${c1} ${c2}
                            and p.latitude is not null and p.longitude is not null
                            and p.isPostUpload = 1;`;
        return SqlService.getSingle(query);
    }

    async getAllPosts(req) {
        // new SqlService();
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let c1 = ``;
        let c2 = ``;
        let c3 = ``;
        let c4 = '';
        let c5 = '';
        let c6 = 'and p.isPublished = 1';
        let c7 = '';
        let distanceQuery = ``;
        let havingCondition = ``;

        if (req.languageCode) {
            c4 = `and p.languageCode = '${req.languageCode}'`;
        }
        if (req.postByUserId > 0) {
            c2 = `and p.userId = ${req.postByUserId}`;
            c4 = '';
        }
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                c3 = `and p.moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.roleId === 2) {
            c5 = `and p.userId = ${req.userId}`;
        }

        if (req.roleId === 1) {
            c6 = ``;
        }

        if (req.futurePost) {
            c6 = `and p.isPublished = 0`;
        }

        if (req.categoryId) {
            c7 = `and m.categoryId = ${req.categoryId}`;
        }

        if (req.latitude && req.longitude && req.radiusInMeter) {
            havingCondition = `having (distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)} or isGeneric = 1)`;
            distanceQuery = `, SQRT(
                                POW(69.1 * (p.latitude - ${reqCoordinate.latitude}), 2) +
                                POW(69.1 * (${reqCoordinate.longitude} - p.longitude) * COS(p.latitude / 57.3), 2)
                            ) AS distance`
        }

        if (req.locations && req.radiusInMeter) {
            try {
                const locations = JSON.parse(req.locations);
                if (!_.isEmpty(req.locations) && Array.isArray(locations)) {
                    havingCondition = `having (`;
                    for (let i = 0; i < locations.length; i++) {
                        const {longitude, latitude} = locations[i];
                        havingCondition += `distance${i + 1} <= ${Utils.getDistanceInMiles(req.radiusInMeter)} or `
                        distanceQuery += `, SQRT(
                                POW(69.1 * (p.latitude - ${latitude}), 2) +
                                POW(69.1 * (${longitude} - p.longitude) * COS(p.latitude / 57.3), 2)
                            ) AS distance${i + 1}`;
                    }

                    havingCondition += `isGeneric = 1)`;
                }
            } catch (e) {
                log.e('failed parsing locations', req.locations, typeof req.locations);
            }
        }
        const query = `select p.id, p.createdAt, p.description, p.source, p.isOriginalContest,
                            p.latitude, p.longitude, p.address, l.name language, p.languageCode,
                            0 'respects', 0 'comments',
                            p.type 'postType', p.isPublished, p.publishDate, p.isGeneric,
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
                            and p.isPostUpload = 1
                            ${c1} ${c2} ${c3} ${c4} ${c5} ${c6} ${c7}
                            ${havingCondition}
                        order by p.id desc
                        limit ${req.postCount} offset ${req.offset}
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getPostData(req) {
        const query = `select p.id, p.createdAt, p.description, p.source, p.latitude, p.longitude, p.address, p.language,
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl
                        from post p 
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
                        where 
                            p.isDeleted = 0
                            and p.id = ${req.postId}
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getAllPostTypes() {
        return SqlService.getTable(table.postType, 0);
    }

    async updatePost(reqBody) {
        const post = {
            id: reqBody.id,
            languageCode: reqBody.languageCode,
            moodId: reqBody.moodId,
            description: reqBody.description,
            publishDate: reqBody.publishDate,
        }
        const condition = `where id = ${post.id}`;
        const query = QueryBuilderService.getUpdateQuery(table.post, post, condition);
        return SqlService.executeQuery(query);
    }

    async getComments(postIds) {
        const query = `select pc.*, u.name, u.imageUrl, u.id userId, pm.url, pm.type
                        from ${table.postComment} pc
                            left join user u on u.id = pc.userId
                            left join ${table.postMedia} pm on pm.commentId = pc.id
                        where 
                            pc.isDeleted = 0
                            and pc.postId in ${Utils.getRange(postIds)};`;
        return SqlService.executeQuery(query);
    }

    async getSubMoodByPostId(postIds) {
        const query = `select psm.id, sm.moodId ,psm.postId, sm.name
                        from ${table.postSubMood} psm
                        left join ${table.subMood} sm on psm.subMoodId = sm.id
                        where 
                           psm.postId in ${Utils.getRange(postIds)} `;
        return SqlService.executeQuery(query);
    }

    async deletePost(model) {
        const query = `update ${table.post} 
                        set isDeleted = 1 
                        where id = ${model.postId};`;
        return SqlService.executeQuery(query);
    }

    async updatePostUpload(postId) {
        const query = `update ${table.post} 
                        set isPostUpload = 1 
                        where id = ${postId};`;
        return SqlService.executeQuery(query);
    }

    async updatePostDescription(model) {
        const query = `update ${table.post} 
                        set description = '${model.description}'
                        where id = ${model.postId};`;
        return SqlService.executeQuery(query);
    }

    async createPostComment(comment) {
        const query = QueryBuilderService.getInsertQuery(table.postComment, comment);
        return SqlService.executeQuery(query);
    }

    async votePost(req) {
        const reqBody = req.body;
        let query = `select id, type from ${table.postTrust} 
                        where reactedBy = ${req.user.id} 
                            and postId = ${reqBody.postId} 
                        limit 1;`;
        let result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            if (result.type === reqBody.type) {
                return this.deleteVote(req);
            }
            query = `update ${table.postTrust} 
                        set type = '${reqBody.type}'
                        where id = ${result.id};`;
            return SqlService.executeQuery(query);
        }
        const postReaction = {
            postId: reqBody.postId,
            reactedBy: req.user.id,
            reactedAt: 'utc_timestamp()',
            type: reqBody.type,
        };
        query = QueryBuilderService.getInsertQuery(table.postTrust, postReaction);
        return SqlService.executeQuery(query);
    }

    async reactOnPost(req) {
        const reqBody = req.body;
        let query = `select id, type from ${table.postReaction} 
                        where reactedBy = ${req.user.id} 
                            and postId = ${reqBody.postId} 
                        limit 1;`;
        let result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            if (result.type === reqBody.type) {
                return this.deleteReaction(req);
            }
            query = `update ${table.postReaction} 
                        set type = '${reqBody.type}'
                        where id = ${result.id};`;
            return SqlService.executeQuery(query);
        }
        const postReaction = {
            postId: reqBody.postId,
            reactedBy: req.user.id,
            reactedAt: 'utc_timestamp()',
            type: reqBody.type,
        };
        query = QueryBuilderService.getInsertQuery(table.postReaction, postReaction);

        let query1 = `select count("id") totalReaction from ${table.postReaction} 
                        where postId = ${reqBody.postId}`;
        let postReactioncount = await SqlService.getSingle(query1);
        if((postReactioncount.totalReaction % 10) === 0){
            this.firebaseController.sendNotificationForReaction(reqBody, postReactioncount.totalReaction);
        }
        return SqlService.executeQuery(query);
    }

    async deleteVote(req) {
        const query = `delete from ${table.postTrust}
                            where reactedBy = ${req.user.id} 
                            and postId = ${req.body.postId};`;
        return SqlService.executeQuery(query);
    }

    async addPostView(req) {
        const model = {
            userId: req.user.id,
            postId: req.body.postId,
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
        let query = QueryBuilderService.getInsertQuery(table.postView, model);
        await SqlService.executeQuery(query);
        return "User view added for this post";
    }

    async deleteReaction(req) {
        const query = `delete from ${table.postReaction}
                            where reactedBy = ${req.user.id} 
                            and postId = ${req.body.postId};`;
        return SqlService.executeQuery(query);
    }

    async getRespects() {
        const query = `select * from ${table.respect}`;
        return SqlService.executeQuery(query);
    }

    async getPostReactions(postIds) {
        const query = `select * from ${table.postReaction} 
                        where postId in ${Utils.getRange(postIds)}`;
        return SqlService.executeQuery(query);
    }

    async getPostTrust(postIds) {
        const query = `select * from ${table.postTrust} 
                        where type in ('vote_up', 'no_vote', 'vote_down')
                        and postId in ${Utils.getRange(postIds)}`;
        return SqlService.executeQuery(query);
    }

    async getPostMedia(postIds) {
        const query = `select pm.postId, pm.type, pm.url, pm.thumbnailUrl, pm.commentId from ${table.postMedia}  pm
                        where postId in ${Utils.getRange(postIds)}`;
        return SqlService.executeQuery(query);
    }

    async getPostViews(postIds) {
        const query = `select pv.*, u.name userName, u.imageUrl userImageUrl, u.id userId from 
                        ${table.postView} pv 
                            inner join user u on u.id = pv.userId 
                        where postId in ${Utils.getRange(postIds)};`;
        return SqlService.executeQuery(query);
    }

    async getPostPolls(postIds) {
        const query = `select p.*, pa.answerNumber, pa.userId
                        from ${table.poll} p 
                            join ${table.poll_answer} pa on p.id = pa.pollId
                        where postId in ${Utils.getRange(postIds)};`;
        const result = await SqlService.executeQuery(query);
        if (_.isEmpty(result)) {
            return [];
        }
        const grouped = _.groupBy(result, (p) => p.id);
        let pollsGroupByPost = {};
        for (const pollId in grouped) {
            const polls = grouped[pollId] || [];
            const p = polls[0];
            const model = {
                id: p.id,
                option1: p.option1,
                option2: p.option2,
                option3: p.option3,
                option4: p.option4,
                option5: p.option5
            }
            model.answers = polls.map((a) => ({
                userId: a.userId,
                answerNumber: a.answerNumber
            }))
            pollsGroupByPost[p.postId] = model;
        }
        return pollsGroupByPost;
    }

    async streamVideo(req, res) {
        //let res;
        const _path = path.resolve('assets/video', 'how_great_leaders_inspire_action.mp4');
        console.log(_path);
        const stat = fs.statSync(_path);
        const fileSize = stat.size;
        console.log('stat', stat);
        const range = req.headers.range;
        console.log('range', range);
        if(range) {
            const  parts = range.replace(/bytes=/,"").split("_");
            console.log('parts', parts);
            const start = parseInt(parts[0], 10);
            console.log('start', start);
            const end = parts[1] ? parseInt(parts[1],10) : fileSize -1;
            console.log('end', end);
            const chunkSize = (end - start) + 1;
            console.log('chunkSize', chunkSize);
            const file = fs.createReadStream(_path, {start, end});
            const head = {
                'Content-Range' : `bytes ${start} - ${end} / ${fileSize}`,
                'Accept-Ranges' : `bytes`,
                'Content-Length' : chunkSize,
                'Content-Type' : 'video/mp4'
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length' : fileSize,
                'Content-Type' : 'video/mp4'
            };
            res.writeHead(200, head);
            console.log('pipe(res) else', fs.createReadStream(_path).pipe(res));
            fs.createReadStream(_path).pipe(res);
        }
        console.log('end post service for video stream');
    }

    async getTrustOnPost(req) {
        const query = `select pr.id, pr.type as trustType, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.postTrust} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId};`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostVoteUp(req) {
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.postTrust} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'vote_up';`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostVoteDown(req) {
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl ,u.bgImageUrl
                        from ${table.postTrust} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'vote_down';`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostNoVote(req) {
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.postTrust} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'no_vote';`;
        return SqlService.executeQuery(query);
    }

    async createSubMoods(subMoodsData) {
        const query = QueryBuilderService.getMultiInsertQuery(table.subMood, subMoodsData);
        return SqlService.executeQuery(query);
    }

    async createPostSubMoods(postSubMoodData) {
        const query = QueryBuilderService.getMultiInsertQuery(table.postSubMood, postSubMoodData);
        return SqlService.executeQuery(query);
    }

    async getSubMoodByName(name) {
        const query = `select * from ${table.subMood} where name = '${name}';`;
        return await SqlService.getSingle(query);
    }

    async getSubMoodByNames(names) {
        const query = `select * from ${table.subMood} 
                        where trim(lower(name)) in ${Utils.getRange(names)};`;
        return await SqlService.executeQuery(query);
    }

    async deletePostComment(model) {
        const query = `update ${table.postComment} 
                        set isDeleted = 1 
                        where id = ${model.commentId};`;
        return SqlService.executeQuery(query);
    }

    async publishPost(postId) {
        let c1 = ``;
        if (postId > 0) {
            c1 = `and id = ${postId}`
        }
        const query = `update ${table.post} 
                        set isPublished = 1 
                        where publishDate is not null
                        ${c1};`;
        return SqlService.executeQuery(query);
    }

    async submitPollAnswer(req) {
        let query;
        const model = {
            userId: req.body.userId || req.user.id,
            pollId: req.body.pollId,
            answerNumber: req.body.answerNumber
        }
        query = QueryBuilderService.getInsertQuery(table.poll_answer, model)
            .replace(';', ` ON DUPLICATE KEY UPDATE answerNumber = ${model.answerNumber};`);
        return SqlService.executeQuery(query);
    }
}
