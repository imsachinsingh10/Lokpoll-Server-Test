import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import Utils from "./common/utils";
import geolib from 'geolib';
// const geolib = require('geolib');
import _ from 'lodash';
import {AppCode} from "../enum/app-code";
import fs from "fs";
import path from 'path';
import {LanguageCode} from "../enum/common.enum";

export class PostService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
        this.sqlService = new SqlService();
    }

    async createPost(post) {
        const query = QueryBuilderService.getInsertQuery(table.post, post);
        return SqlService.executeQuery(query);
    }

    async getTotalPostCount(data) {
        const query = `select count("id") count
	    				from ${table.post} p
	    				join user u on u.id = p.userId;`;
        return SqlService.getSingle(query);
    }

    async getQualifiedPostIdsByLocation(req) {
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let condition1 = ``;
        let condition2 = ``;
        let condition3 = ``;
        let condition4 = ``;

        if (req.lastPostId > 0) {
            condition1 = `and id < ${req.lastPostId}`;
        }
        if (req.postByUserId > 0) {
            condition2 = `and userId = ${req.postByUserId}`;
        }
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.radiusInMeter) {
            condition4 = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)}`
        }

        const query = `select 
                            id, latitude, longitude, SQRT(
                            POW(69.1 * (latitude - ${reqCoordinate.latitude}), 2) +
                            POW(69.1 * (${reqCoordinate.longitude} - longitude) * COS(latitude / 57.3), 2)) AS distance
                       from post
                       where 
                       isDeleted = 0 
                        and latitude is not null and longitude is not null
                        ${condition1} ${condition2} ${condition3} ${condition4}
                        -- order by id desc
                        order by distance desc, id desc
                       limit ${req.postCount}
                       ;`;
        let posts = await SqlService.executeQuery(query);
        console.log('qualified posts', posts.length);
        let qualifiedPostIds = [];
        qualifiedPostIds = posts.map(p => p.id);
        qualifiedPostIds.sort((a, b) => b - a);
        console.log('qualifiedPostIds', qualifiedPostIds.length, qualifiedPostIds);
        return qualifiedPostIds;
    }

    async getAllPosts(req) {
        new SqlService();
        const reqCoordinate = {
            latitude: req.latitude,
            longitude: req.longitude,
        };
        let condition1 = ``;
        let condition2 = ``;
        let condition3 = ``;
        let condition4 = '';
        let havingCondition = ``;

        if (req.language) {
            condition4 = `and trim(lower(p.language)) = '${req.language.toLowerCase().trim()}'`;
        }
        if (req.postByUserId > 0) {
            condition2 = `and p.userId = ${req.postByUserId}`;
            condition4 = '';
        }
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and p.moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        if (req.radiusInMeter) {
            havingCondition = `having distance <= ${Utils.getDistanceInMiles(req.radiusInMeter)}`
        }
        const query = `select p.id, p.createdAt, p.description, p.source, p.latitude, p.longitude, p.address, p.language,
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl, u.audioUrl,
                            m.${LanguageCode[req.language] || 'en'} 'mood',
                            SQRT(
                            POW(69.1 * (p.latitude - ${reqCoordinate.latitude}), 2) +
                            POW(69.1 * (${reqCoordinate.longitude} - p.longitude) * COS(p.latitude / 57.3), 2)) AS distance
                        from post p 
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
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

    async getAllPostTypes() {
        return SqlService.getTable(table.postType, 0);
    }

    async getComments(postIds) {
        const query = `select pc.*, u.name, u.imageUrl, pm.url, pm.type
                        from ${table.postComment} pc
                            left join user u on u.id = pc.userId
                            left join ${table.postMedia} pm on pm.commentId = pc.id
                        where 
                            pc.postId in ${Utils.getRange(postIds)};`;
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
        console.log(model);
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
        return SqlService.executeQuery(query);
    }

    async deleteVote(req) {
        const query = `delete from ${table.postTrust}
                            where reactedBy = ${req.user.id} 
                            and postId = ${req.body.postId};`;
        return SqlService.executeQuery(query);
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
        console.log(req.postId);
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
}
