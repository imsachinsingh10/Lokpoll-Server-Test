import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {uploadPostMediaMiddleware,} from "../service/common/minio.service";
import {PostController} from "../controller/post.controller";
import {ProductService} from "../service/product.service";
import {Environment, PostType} from "../enum/common.enum";
import path from "path";
import childProcess from 'child_process';
import {Config} from "../config";

const router = express();

export class PostRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/post', router);

        this.postService = new PostService();
        this.productService = new ProductService();
        this.postController = new PostController();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/create',
            uploadPostMediaMiddleware,
            async (req, res) => {
                try {
                    const {id, userId} = await this.postController.createPost(req);
                    const processorPath = path.resolve(Config.env === Environment.dev ? 'src' : '', 'service', 'media-queue-processor.js');
                    const taskProcessor = childProcess.fork(processorPath, null, {serialization: "json"});
                    const isAudio   =   'false';
                    taskProcessor.on('disconnect', function (msg) {
                        this.kill();
                    });

                    taskProcessor.send(JSON.stringify({
                        files: req.files, postId: id, productTags: req.body.productTags, userId ,isAudio:isAudio
                    }));
                    return res.status(HttpCode.ok).json({postId: id});
                } catch (e) {
                    console.error(`${req.method}: ${req.url}`, e);
                    if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
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
                const request = {
                    "latitude": req.body.latitude || 21.251385,
                    "longitude": req.body.longitude || 81.629639,
                    "type": req.body.type || 'normal',
                    "radiusInMeter": req.body.radiusInMeter || 10000000000,
                    "lastPostId": req.body.lastPostId,
                    "postCount": req.body.postCount,
                    "postByUserId": req.body.postByUserId,
                };
                let qualifiedPostIds = await this.postService.getQualifiedPostIdsByLocation(request);
                let result = [];
                if (qualifiedPostIds.length > 0) {
                    result = await this.postService.getAllPosts(qualifiedPostIds);
                    result = await this.postController.formatPosts(req, result);
                }
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getAllTypes', async (req, res) => {
            try {
                return await res.json(PostType);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getReactionTypes', async (req, res) => {
            try {
                let result = this.postController.getReactionTypes();
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/delete', async (req, res) => {
            try {
                await this.postService.deletePost(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/comment', uploadPostMediaMiddleware, async (req, res) => {
            try {
                const {id,postId ,userId} = await this.postController.commentOnPost(req);
                const processorPath = path.resolve(Config.env === Environment.dev ? 'src' : '', 'service', 'media-queue-processor.js');
                const taskProcessor = childProcess.fork(processorPath, null, {serialization: "json"});
                const isAudio   =   'false';
                taskProcessor.on('disconnect', function (msg) {
                    this.kill();
                });

                taskProcessor.send(JSON.stringify({
                    files: req.files, postId: postId, productTags: req.body.productTags, userId ,commentId:id, isAudio:isAudio
                }));
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/vote', async (req, res) => {
            try {
                await this.postController.votePost(req);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.get('/videoStream', async (req, res) => {
            try {
                console.log("In Video Stream");
                await this.postService.streamVideo(req, res);
                console.log("In Video HttpCode.ok");
                //return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });
    }
}
