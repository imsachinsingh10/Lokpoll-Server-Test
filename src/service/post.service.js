import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import Utils from "./common/utils";
import geolib from 'geolib';
// const geolib = require('geolib');
import _ from 'lodash';
import {AppCode} from "../enum/app-code";

export class PostService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async createPost(post) {
        const query = QueryBuilderService.getInsertQuery(table.post, post);
        return SqlService.executeQuery(query);
    }

    async getTotalPosts(data) {
        const query = `select count("id") totalPosts
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
        const query = `select 
                            id, latitude, longitude 
                       from post
                       where 
                        latitude is not null and longitude is not null
                        ${condition1}
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
            qualifiedPostIds = qualifiedPostIds.slice(0, req.postCount);
        }
        return qualifiedPostIds;
    }

    async getAllPosts(postIds) {
        const query = `select p.id, p.createdAt, p.description, p.latitude, p.longitude, p.address, 
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.name userName, u.imageUrl, u.bgImageUrl,
                            pm.type, pm.url, pm.thumbnailUrl,
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
        const query = `select pc.*, u.name, u.imageUrl
                        from ${table.postComment} pc
                            join user u on u.id = pc.userId
                        where 
                            postId in ${Utils.getRange(postIds)} 
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
        let query = `select id from ${table.postReaction} 
                        where reactedBy = ${req.user.id} 
                            and postId = ${reqBody.postId} 
                        limit 1;`;
        let result = await SqlService.getSingle(query);
        if (!_.isEmpty(result)) {
            query = `update ${table.postReaction} 
                        set type = '${req.type}'
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

}

