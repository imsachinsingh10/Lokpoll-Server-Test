import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {Environment, PostType} from "../enum/common.enum";
import {sendTestMessage} from "../service/firebase.service";
import {ChallengeService} from "../service/challenge.service";
import {ChallengeController} from "../controller/challenge.controller";
import {
    MinIOService,
    uploadFile,
    uploadChallengeEntriesMediaMiddleware,
    uploadPostMediaMiddleware
} from "../service/common/minio.service";
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

        router.post('/add', uploadChallengeEntriesMediaMiddleware, async (req, res) => {
            try {
                const challenge = {
                    moodId: req.body.moodId,
                    languageCode:req.body.languageCode,
                    topic: req.body.topic,
                    winners: req.body.winners,
                    entries: req.body.entries,
                    description: req.body.description,
                    startDate: req.body.startDate,
                    resultAnnounceDate: req.body.resultAnnounceDate,
                    deadlineDate: req.body.deadlineDate,
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    location: req.body.location,
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

        router.post('/update', uploadChallengeEntriesMediaMiddleware, async (req, res) => {
            try {
                await this.challengeService.updateChallenge(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error("test Data",`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/totalChallenges', async (req, res) => {
            try {
                let result = await this.challengeService.getTotalChallengeCount(req);
                return await res.json(result.count);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
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
                const processorPath = path.resolve(Config.env === Environment.dev ? 'src' : '', 'service', 'media-queue-processor-challenge-entries.js');
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


        router.post('/getChallengeEntries', async (req, res) => {
            const start = new Date();
            try {
                const request = {

                    "postCount": req.body.postCount || 20,
                    "challengeId" : req.body.challengeId,
                };
                let result = await this.challengeService.getAllChallengeEntries(request);
                result = await this.challengeController.formatChallengeEntries(req, result);
                // result = result.map(r => ({id: r.id, distanceInMeters: r.distanceInMeters}));
                // result = result.map(r => r.id);
                const end = new Date() - start;
                console.log('get all post response', {processingTime: end / 1000 + ' Seconds'})
                // return await res.json({result, processingTime: end / 1000 + ' seconds'});
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getChallengeEntriesForAdmin', async (req, res) => {
            const start = new Date();
            try {
                const request = {
                    "latitude": req.body.latitude,
                    "longitude": req.body.longitude,
                    "type": req.body.type || 'normal',
                    "radiusInMeter": req.body.radiusInMeter,
                    "lastPostId": req.body.lastPostId,
                    "postCount": req.body.postCount || 20,
                    "entryByUserId": req.body.postByUserId,
                    "moodIds": req.body.moodIds,
                    "offset": req.body.offset || 0,
                    "languageCode": req.body.languageCode,
                    "challengeId" : req.body.challengeId,
                    "judgeId" : req.body.judgeId,
                };
                let result = await this.challengeService.getAllChallengeEntriesForAdmin(request);
                result = await this.challengeController.formatChallengeEntriesForAdmin(req, result);
                // result = result.map(r => ({id: r.id, distanceInMeters: r.distanceInMeters}));
                // result = result.map(r => r.id);
                const end = new Date() - start;
                console.log('get all post response', {processingTime: end / 1000 + ' Seconds'})
                // return await res.json({result, processingTime: end / 1000 + ' seconds'});
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getChallengeEntriesByEntriesId', async (req, res) => {
            try {
                const request = {
                    "challengeEntryId": req.challengeEntryId.postId
                };
                let result = await this.challengeService.getChallengeEntriesData(request);
                console.log('post data', result);
                result = await this.challengeController.formatChallengeEntries(req, result);
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getWinnersByChallengesId', async (req, res) => {
            try {
                const user = await this.challengeController.getFormattedWinnerDetails(req);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/assignJudge',uploadChallengeEntriesMediaMiddleware , async (req, res) => {
            try {
                const challenge = {
                    judgeId: req.body.judgeId,
                    challengeId: req.body.challengeId,
                };
                const result = await this.challengeService.saveAssignJudgesOnChallenge(challenge);

                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/addRemark', async (req, res) => {
            try {
                const challengeRemark = {
                    judgeId:  req.body.judgeId,
                    challengeId: req.body.challengeId,
                    entryId: req.body.id,
                    remark: req.body.remark
                };
                await this.challengeService.saveChallengeRemark(challengeRemark);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/checkRemark', async (req, res) => {
            try {
                const result = await this.challengeService.checkAlreadyRemark(req.body);
                return await res.json(result);
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
