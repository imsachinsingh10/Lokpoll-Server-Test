import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import {
    MinIOService,
    uploadPostMediaMiddleware,
} from "../service/minio.server";
import _ from 'lodash';
import {PostController} from "../controller/post.controller";
import {QueryBuilderService} from "../service/querybuilder.service";

const router = express();

export class PostRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/post', router);

        this.postService = new PostService();
        this.minioService = new MinIOService();
        this.postController = new PostController();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const post = req.body;
                console.log(req);
                await this.postService.createPost(post);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getUsers', async (req, res) => {
            try {
                let user = await this.postService.getAllUsers(req.body);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/create', uploadPostMediaMiddleware, async (req, res) => {
            try {
                const postId = await this.postController.createPost(req);
                const promises = [];
                console.log('post images', req.files.image);
                console.log('post videos', req.files.video);
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
                    console.log('thumbnails', thumbnails);
                    mediaFiles = _.filter(mediaFiles, file => file.type !== 'thumbnail');
                    console.log('mediaFiles', mediaFiles);
                    const postMedia = mediaFiles.map(file => ({
                        postId: postId,
                        url: file.url,
                        type: file.type
                    }));
                    console.log('postMedia after mapping', postMedia);
                    const query = QueryBuilderService.getMultiInsertQuery(table.post_media, postMedia);
                    await SqlService.executeQuery(query);
                }
                return res.status(HttpCode.ok).json({postId});
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/totalPosts', async (req, res) => {
            try {
                let result = await this.postService.getTotalPosts(req.body);
                return await res.json(result.totalPosts);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getAll', async (req, res) => {
            try {
                let result = await this.postService.getAllPosts();
                result = this.postController.formatPosts(result);
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

    }
}
