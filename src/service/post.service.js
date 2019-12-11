import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import Utils from "./common/utils";
import geolib from 'geolib';
// const geolib = require('geolib');
import _ from 'lodash';

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
	    				from ${table.post} u`;
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
                        id > 0
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
        const query = `select p.id, p.createdAt, p.description, p.latitude, p.longitude , 
                            0 'respects', 0 'comments',
                            p.type 'postType',
                            pro.name 'displayName', pro.type 'profileType',
                            u.name userName, u.imageUrl, u.bgImageUrl,
                            pm.type, pm.url,
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
}

