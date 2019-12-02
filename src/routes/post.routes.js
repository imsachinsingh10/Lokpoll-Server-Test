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
import {MinIOService} from "../service/minio.server";
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

        router.post('/create', this.minioService.uploadMiddleware('multiple'), async (req, res) => {
            try {
                const postId = await this.postController.createPost(req);
                const promises = [];
                _.forEach(req.files, file => {
                    const filePromise = this.minioService.uploadFile(file);
                    promises.push(filePromise);
                });
                let mediaFiles = await Promise.all(promises);
                const postMedia = mediaFiles.map(file => {
                    return {
                        ...file,
                        postId: postId
                    };
                });
                console.log('postMedia after mapping', postMedia);
                const query = QueryBuilderService.getMultiInsertQuery(table.post_media, postMedia);
                await SqlService.executeQuery(query);
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

    }
}
