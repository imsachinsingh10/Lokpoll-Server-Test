import * as _ from 'lodash';

import {Config} from '../config'
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {table} from "../enum/table";
import {QueryBuilderService} from "../service/querybuilder.service";
import {SqlService} from "../service/sql.service";

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
            moodId: reqBody.moodId,
            createdAt: 'utc_timestamp()'
        };
        const result = await this.postService.createPost(post);
        return result.insertId;
    }

    formatPosts(result) {
        const postIds = _.map(result, r => r.postId);
        const uniqPostIds = _.uniq(postIds);
        const posts = [];
        _.forEach(uniqPostIds, id => {
            posts.push(this.getPost(id, result))
        });
        return posts;
    }

    getPost(postId, result) {
        const filteredPosts = _.filter(result, result => result.postId === postId);
        const _p = _.omit(filteredPosts[0], ['url', 'type']);
        const media = result
            .filter(result => result.postId === postId && result.url !== null)
            .map(p => ({
                type: p.type,
                url: p.url
            }));
        return {
            ..._p,
            media
        }
    }
}
