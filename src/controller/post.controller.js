import * as _ from 'lodash';

import {Config} from '../config'
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {table} from "../enum/table";
import {QueryBuilderService} from "../service/base/querybuilder.service";
import {SqlService} from "../service/base/sql.service";

export class PostController {
    constructor() {
        this.postService = new PostService();
    }

    async createPost(req) {
        const reqBody = req.body;
        const post = {
            description: reqBody.description,
            userId: reqBody.userId,
            creatorId: req.user.id,
            createdAt: 'utc_timestamp()',
            postTypeId: reqBody.postTypeId,
            profileTypeId: reqBody.profileTypeId,
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
        };
        if (reqBody.moodId > 0) {
            post.moodId = reqBody.moodId;
        }
        const result = await this.postService.createPost(post);
        return result.insertId;
    }

    async formatPosts(rawPosts) {
        const postIds = _.map(rawPosts, r => r.id);
        const uniqPostIds = _.uniq(postIds);
        const comments = await this.postService.getComments(postIds, [0, 1, 2, 3, 4]);
        const posts = [];
        _.forEach(uniqPostIds, id => {
            const postComments = comments.filter(comment => comment.postId === id);
            posts.push(this.getPost(id, rawPosts, postComments))
        });
        return posts;
    }

    getPost(postId, posts, postComments) {
        const filteredPosts = _.filter(posts, post => post.id === postId);
        const basicDetails = this.getBasicPostDetails(filteredPosts[0]);
        const media = posts
            .filter(result => result.id === postId && result.url !== null)
            .map(p => ({
                type: p.type,
                url: p.url
            }));
        return {
            ...basicDetails,
            media,
            comments: this.getFormattedComments(postComments)
        }
    }

    getFormattedComments(comments) {
        console.log('comments', comments);
        const final = {};
        const levels = _.uniq(comments.map(c => c.level));
        comments.forEach((c) => {

        });
        return comments;
    }

    getBasicPostDetails(post) {
        return {
            id: post.id,
            createdAt: post.createdAt,
            description: post.description,
            type: post.postType,
            respects: 100,
            comments: 250,
            mood: post.mood,
            user: {
                displayName: post.displayName || post.userName,
                profileType: post.profileType,
                imageUrl: post.imageUrl,
                bgImageUrl: post.bgImageUrl,
            },
            location: {
                latitude: post.latitude,
                longitude: post.longitude
            }
        }
    }
}
