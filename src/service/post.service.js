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

export class PostService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
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
        if (req.lastPostId > 0) {
            condition1 = `and id < ${req.lastPostId}`;
        }
        let condition2 = ``;
        if (req.postByUserId > 0) {
            condition2 = `and userId = ${req.postByUserId}`;
        }
        let condition3 = ``;
        try {
            const moodIds = JSON.parse(req.moodIds);
            if (!_.isEmpty(req.moodIds) && Array.isArray(moodIds)) {
                condition3 = `and moodId in ${Utils.getRange(moodIds)}`
            }
        } catch (e) {

        }

        const query = `select 
                            id, latitude, longitude 
                       from post
                       where 
                        latitude is not null and longitude is not null
                        ${condition1} ${condition2} ${condition3}
                       -- limit ${req.postCount * 5}
                       ;`;
        let posts = await SqlService.executeQuery(query);
        // console.log('posts', posts);
        const postCoordinates = posts.map(p => {
            return {
                latitude: p.latitude,
                longitude: p.longitude
            }
        });
        let distance = geolib.orderByDistance(reqCoordinate, postCoordinates);
        // console.log('distance', distance);
        distance = distance.filter((d) => d.distance <= req.radiusInMeter);
        // console.log('filtered distance', distance);
        let qualifiedPostIds = [];
        _.each(distance, d => {
            qualifiedPostIds.push(posts[d['key']].id)
        });
        if (qualifiedPostIds.length > 0) {
            qualifiedPostIds.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            qualifiedPostIds.reverse();
            if (req.postCount > 0) {
                qualifiedPostIds = qualifiedPostIds.slice(0, req.postCount);
            }
        }
        return qualifiedPostIds;
    }

    async getAllPosts(postIds) {
        const query = `select p.id, p.createdAt, p.description, p.latitude, p.longitude, p.address, 
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.id userId, u.name userName, u.imageUrl, u.bgImageUrl,
                            pm.type, pm.url, pm.thumbnailUrl, pm.commentId,
                            m.name 'mood'
                        from post p 
                            left join post_media pm on pm.postId = p.id
                            join user u on u.id = p.userId
                            left join mood m on m.id = p.moodId
                            left join profile pro on pro.type = p.profileType and pro.userId = u.id
                        where p.id in ${Utils.getRange(postIds)}    
                        order by p.id desc
                        ;`;
        return SqlService.executeQuery(query);
    }

    async getAllPostTypes() {
        return SqlService.getTable(table.postType, 0);
    }

    async getComments(postIds, levels = [0, 1]) {
        const query = `select pc.*, u.name, u.imageUrl, pm.url, pm.type
                        from ${table.postComment} pc
                            left join user u on u.id = pc.userId
                            left join ${table.postMedia} pm on pm.commentId = pc.id
                        where 
                            pc.postId in ${Utils.getRange(postIds)} 
                            and level in ${Utils.getRange(levels)};`;
        return SqlService.executeQuery(query);
    }

    async deletePost(model) {
        const query = `update ${table.post} 
                        set isDeleted = 1 
                        where id = ${model.postId};`;
        return SqlService.executeQuery(query);
    }


    async createPostComment(comment) {
        const query = QueryBuilderService.getInsertQuery(table.postComment, comment);
        return SqlService.executeQuery(query);
    }

    async votePost(req) {
        const reqBody = req.body;
        let query = `select id, type from ${table.postReaction} 
                        where reactedBy = ${req.user.id} 
                            and postId = ${reqBody.postId} 
                        limit 1;`;
        let result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            if (result.type === reqBody.type) {
                return this.deleteVote(req);
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
        const query = `delete from ${table.postReaction}
                            where reactedBy = ${req.user.id} 
                            and postId = ${req.body.postId};`;
        return SqlService.executeQuery(query);
    }

    async getRespects() {
        const query = `select * from ${table.respect}`;
        return SqlService.executeQuery(query);
    }

    async getPostReactions() {
        const query = `select * from ${table.postReaction} where type in ('vote_up', 'no_vote', 'vote_down');`;
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
                        from ${table.postReaction} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId};`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostVoteUp(req) {
        console.log(req.postId);
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.postReaction} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'vote_up';`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostVoteDown(req) {
        console.log(req.postId);
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl ,u.bgImageUrl
                        from ${table.postReaction} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'vote_down';`;
        return SqlService.executeQuery(query);
    }

    async getTrustOnPostNoVote(req) {
        console.log(req.postId);
        const query = `select pr.id, u.id as userId,u.name, u.imageUrl, u.bgImageUrl
                        from ${table.postReaction} pr
                            left join user u on u.id = pr.reactedBy
                        where 
                           postId = ${req.postId}
                           and type = 'no_vote';`;
        return SqlService.executeQuery(query);
    }
}

