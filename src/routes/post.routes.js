import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {uploadPostMediaMiddleware,} from "../service/common/minio.service";
import {PostController} from "../controller/post.controller";
import {ProductService} from "../service/product.service";
import {PostType} from "../enum/common.enum";
import path from "path";
import childProcess from 'child_process';
import {ChallengeController} from "../controller/challenge.controller";
import {log} from "../service/common/logger.service";
import {UserNetworkService} from "../service/user-network.service";
import {RequestValidator} from '../service/request-validator';

const router = express();

export class PostRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/post', router);

        this.postService = new PostService();
        this.productService = new ProductService();
        this.postController = new PostController();
        this.challengeController = new ChallengeController();
        this.userNetworkService = new UserNetworkService();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/create', uploadPostMediaMiddleware, async (req, res) => {
            try {
                log.i('create new post body', req.body);
                RequestValidator.validateAddPostRequest(req);
                const {id, userId} = await this.postController.createPost(req);

                const processorPath = path.resolve(__dirname, '../service', 'media-queue-processor.js');
                const taskProcessor = childProcess.fork(processorPath, null, {serialization: "json"});
                taskProcessor.on('disconnect', function (msg) {
                    this.kill();
                });

                taskProcessor.send(JSON.stringify({
                    files: req.files,
                    postId: id,
                    productTags: req.body.productTags,
                    userId
                }));
                this.postController.creditCoinsByAddPost(id, userId);
                return res.status(HttpCode.ok).json({postId: id});
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/repost', async (req, res) => {
            try {
                const {id, userId} = await this.postController.shareInternally(req);
                this.postController.creditCoinsOnRePost(id, userId);
                return res.status(HttpCode.ok).json({postId: id, message: 'Post shared internally'});
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/creditCoinsOnSharePostExternally', async (req, res) => {
            try {
                RequestValidator.externalShare(req);
                await this.postController.creditCoinsOnSharePostExternally({...req.body, userId: req.user.id});
                return res.status(HttpCode.ok).json({message: 'Coins credited for sharing post externally'});
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/createContentPost', uploadPostMediaMiddleware, async (req, res) => {
            try {
                const {id} = await this.postController.createContentPost(req);
                return res.status(HttpCode.ok).json({postId: id});
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/update', uploadPostMediaMiddleware, async (req, res) => {
            try {
                await this.postService.updatePost(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/totalPosts', async (req, res) => {
            try {
                let result = await this.postService.getTotalPostCount(req);
                return await res.json(result.count);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getAll', async (req, res) => {
            const start = new Date();

            try {
                const request = {
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    type: req.body.type || 'normal',
                    radiusInMeter: req.body.radiusInMeter,
                    lastPostId: req.body.lastPostId,
                    postCount: req.body.postCount || 20,
                    postByUserId: req.body.postByUserId,
                    moodIds: req.body.moodIds,
                    offset: req.body.offset || 0,
                    languageCode: req.body.languageCode,
                    roleId: req.user.roleId,
                    userId: req.user.id,
                    futurePost: req.body.futurePost,
                    locations: req.body.locations,
                    categoryId: req.body.categoryId,
                };
                // let qualifiedPostIds = await this.postService.getQualifiedPostIdsByLocation(request);
                let result = await this.postService.getAllPosts(request);
                result = await this.postController.formatPosts(req, result);
                this.userNetworkService.logDailyVisitActivity(request.userId);
                // result = await this.challengeController.formatChallengeEntries(req, result);
                // result = result.map(r => ({id: r.id, distanceInMeters: r.distanceInMeters}));
                // result = result.map(r => r.id);
                const end = new Date() - start;
                log.i('get all post response', {processingTime: end / 1000 + ' Seconds'})
                // return await res.json({result, processingTime: end / 1000 + ' seconds'});
                return await res.json(result);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getpostByPostId', async (req, res) => {
            try {
                const request = {
                    "postId": req.body.postId
                };
                let result = await this.postService.getPostData(request);
                result = await this.postController.formatPosts(req, result);
                return await res.json(result);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getAllTypes', async (req, res) => {
            // sendTestMessage();
            try {
                return await res.json(PostType);
            } catch (e) {

                log.e(`${req.method}: ${req.url}`, e);
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
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/deletePost', async (req, res) => {
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

        router.post('/updatePostDescription', async (req, res) => {
            try {
                await this.postService.updatePostDescription(req.body);
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
                const {id, postId, userId} = await this.postController.commentOnPost(req);
                const processorPath = path.resolve(__dirname, '../service', 'media-queue-processor.js');
                const taskProcessor = childProcess.fork(processorPath, null, {serialization: "json"});
                taskProcessor.on('disconnect', function (msg) {
                    this.kill();
                });

                taskProcessor.send(JSON.stringify({
                    files: req.files,
                    postId: postId,
                    userId,
                    commentId: id
                }));
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
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
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/react', async (req, res) => {
            try {
                await this.postController.reactOnPost(req);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/addView', async (req, res) => {
            try {
                const result = await this.postService.addPostView(req);
                return res.json(result);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.get('/videoStream', async (req, res) => {
            try {
                await this.postService.streamVideo(req, res);
                //return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/getTrustOnPost', async (req, res) => {
            try {

                let result = await this.postController.getFormattedTrustData(req.body);

                return await res.json(result);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getTrustOnPostVoteUp', async (req, res) => {
            try {
                let result = await this.postController.getFormattedTrustDataVoteUp(req.body);
                return await res.json(result);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getTrustOnPostVoteDown', async (req, res) => {
            try {
                let result = await this.postController.getFormattedTrustDataVoteDown(req.body);
                return await res.json(result);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getTrustOnPostNoVote', async (req, res) => {
            try {
                let result = await this.postController.getFormattedTrustDataNoVote(req.body);
                return await res.json(result);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/deletePostComment', async (req, res) => {
            try {
                await this.postService.deletePostComment(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/publishPost/:postId', async (req, res) => {
            try {
                await this.postService.publishPost(req.params.postId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/submitPollAnswer', async (req, res) => {
            try {
                await this.postService.submitPollAnswer(req);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(HttpCode.bad_request).json("no poll or user found with this id");
                }
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}
