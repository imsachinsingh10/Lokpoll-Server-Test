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
                let result = await this.postService.getAllPosts();
                result = await this.postController.formatPosts(result);
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
                let result = await this.postService.getAllPostTypes();
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
