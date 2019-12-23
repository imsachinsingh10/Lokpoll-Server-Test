import * as _ from 'lodash';
import {PostService} from "../service/post.service";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {MinIOService} from "../service/common/minio.service";
import {PostReaction} from "../enum/common.enum";
import {AppCode} from "../enum/app-code";

export class PostController {
    constructor() {
        this.postService = new PostService();
        this.minioService = new MinIOService();
    }

    async createPost(req) {
        const reqBody = req.body;
        const post = {
            description: reqBody.description,
            userId: reqBody.userId,
            creatorId: req.user.id,
            createdAt: 'utc_timestamp()',
            type: reqBody.type,
            profileType: reqBody.profileType,
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
        if (_.isEmpty(rawPosts)) {
            return [];
        }
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
        const final = [];
        while(!_.isEmpty(comments)) {
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
                profileType: post.profileType || "Personal",
                imageUrl: post.imageUrl,
                bgImageUrl: post.bgImageUrl,
            },
            location: {
                latitude: post.latitude,
                longitude: post.longitude
            }
        }
    }

    async uploadPostMedia(req, postId) {
        const promises = [];
        if (req.files.image && req.files.image.length > 0) {
            _.forEach(req.files.image, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'image');
                promises.push(filePromise);
            });
        }
        if (req.files.video && req.files.video.length > 0) {
            _.forEach(req.files.video, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'video');
                promises.push(filePromise);
            });
        }
        if (req.files.thumbnail && req.files.thumbnail.length > 0) {
            _.forEach(req.files.thumbnail, file => {
                const filePromise = this.minioService.uploadPostMedia(file, 'thumbnail');
                promises.push(filePromise);
            });
        }
        if (promises.length > 0) {
            let mediaFiles = await Promise.all(promises);
            const thumbnails = _.filter(mediaFiles, file => file.type === 'thumbnail');
            mediaFiles = _.filter(mediaFiles, file => file.type !== 'thumbnail');
            const postMedia = mediaFiles.map(file => ({
                postId: postId,
                url: file.url,
                type: file.type
            }));
            const query = QueryBuilderService.getMultiInsertQuery(table.postMedia, postMedia);
            return SqlService.executeQuery(query);
        }
    }

    getReactionTypes() {
        return PostReaction
    }

    async createPostComment(req) {
        const reqBody = req.body;
        const post = {
            postId: reqBody.postId,
            userId: reqBody.userId,
            createdAt: 'utc_timestamp()',
            comment: reqBody.comment,
        };
        if (reqBody.replyToCommentId !== null && reqBody.replyToCommentId !== '') {
            post.replyToCommentId = reqBody.replyToCommentId;
        }
        const result = await this.postService.createPostComment(post);
        return result.insertId;
    }


}
