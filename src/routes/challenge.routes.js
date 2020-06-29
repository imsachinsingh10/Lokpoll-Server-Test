import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {Environment, PostType} from "../enum/common.enum";
import {sendTestMessage} from "../service/firebase.service";
import {ChallengeService} from "../service/challenge.service";
import {ChallengeController} from "../controller/challenge.controller";
import {MinIOService, uploadFile, uploadChallengeEntriesMediaMiddleware} from "../service/common/minio.service";
import path from "path";
import {Config} from "../config";
import childProcess from "child_process";

const router = express();

export class ChallengeRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/challenge', router);

        this.challengeService = new ChallengeService();
        this.minioService = new MinIOService();
        this.challengeController = new ChallengeController();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/addUserChallenge', async (req, res) => {
            try {
                const userChallenge = {
                    userId:  req.user.id,
                    challengeId: req.body.challengeId,
                    createdAt: 'utc_timestamp()'
                };
                await this.challengeService.saveUserChallenge(userChallenge);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/add', uploadFile, async (req, res) => {
            try {
                const challenge = {
                    moodId: req.body.moodId,
                    topic: req.body.topic,
                    description: req.body.description,
                    startDate: req.body.startDate,
                    deadlineDate: req.body.deadlineDate,
                    createdAt: 'utc_timestamp()',
                };
                if (req.file) {
                    const file = await this.minioService.uploadFile(req.file);
                    challenge.posterUrl = file.url;
                }
                const result = await this.challengeService.createChallenge(challenge);

                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getAllChallenges', async (req, res) => {
            const start = new Date();
            let result;
            try {
                const request = {
                    "userId": 2
                };
                result = await this.challengeController.getAllChallenges(request);
                // return await res.json({result, processingTime: end / 1000 + ' seconds'});
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getChallenges', async (req, res) => {
            let result;
            try {
                result = await this.challengeService.getAllChallenges(req);
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
            sendTestMessage();
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

        router.post('/createChallengeEntries', uploadChallengeEntriesMediaMiddleware, async (req, res) => {
            try {
                const {id, userId} = await this.challengeController.createChallengeEntries(req);
                const processorPath = path.resolve(Config.env === Environment.dev ? 'src' : '', 'service', 'media-queue-processor.js');
                const taskProcessor = childProcess.fork(processorPath, null, {serialization: "json"});
                taskProcessor.on('disconnect', function (msg) {
                    this.kill();
                });

                taskProcessor.send(JSON.stringify({
                    files: req.files,
                    challengeEntryId: id,
                    productTags: req.body.productTags,
                    userId
                }));
                return res.status(HttpCode.ok).json({challengeEntryId: id});
            } catch (e) {
                console.error("test Data",`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

    }
}
