import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {SqlService} from "../service/sql/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {
    MinIOService,
    uploadPostMediaMiddleware,
} from "../service/common/minio.service";
import _ from 'lodash';
import {PostController} from "../controller/post.controller";
import {QueryBuilderService} from "../service/sql/querybuilder.service";
import {ProductService} from "../service/product.service";
import {PostType} from "../enum/common.enum";

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

        router.post('/create', uploadPostMediaMiddleware, async (req, res) => {
            try {
                const postId = await this.postController.createPost(req);
                await this.postController.uploadPostMedia(req, postId);
                await this.productService.addTags(req.body.productTags);
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
                const request = {
                    "latitude": req.body.latitude || 21.251385,
                    "longitude": req.body.longitude || 81.629639,
                    "type": req.body.type || 'normal',
                    "radiusInMeter": req.body.radiusInMeter || 10000000000,
                    "lastPostId": req.body.lastPostId,
                    "postCount": req.body.postCount || 40
                };
                let qualifiedPostIds = await this.postService.getQualifiedPostIdsByLocation(request);
                let result = [];
                if (qualifiedPostIds.length > 0) {
                    result = await this.postService.getAllPosts(qualifiedPostIds);
                    result = await this.postController.formatPosts(result);
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
                console.log(req.body);
                await this.postService.deletePost(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/createComment', async (req, res) => {
            try {
                const postCommentId = await this.postController.createPostComment(req);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/upDownVote', async (req, res) => {
            try {
               await this.postService.createUpDownVote(req.body);
                return res.sendStatus(HttpCode.ok);
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
