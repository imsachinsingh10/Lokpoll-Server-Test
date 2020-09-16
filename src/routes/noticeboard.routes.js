import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {MinIOService, uploadFile} from "../service/common/minio.service";
import {PostController} from "../controller/post.controller";
import {NoticeboardService} from "../service/noticeboard.service";
import {NoticeboardController} from "../controller/noticeboard.controller";
import {log} from "../service/common/logger.service";

const router = express();

export class NoticeboardRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/noticeboard', router);

        this.noticeboardService = new NoticeboardService();
        this.minioService = new MinIOService();
        this.noticeboardController = new NoticeboardController();
        this.postController = new PostController()
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', uploadFile, async (req, res) => {
            try {
                const noticeboard = {
                    languageCode: req.body.languageCode,
                    topic: req.body.topic,
                    description: req.body.description,
                    startDate: req.body.startDate,
                    deadlineDate: req.body.deadlineDate,
                    createdAt: 'utc_timestamp()',
                };
                if (req.file) {
                    const file = await this.minioService.uploadFile(req.file);
                    noticeboard.posterUrl = file.url;
                }
                const result = await this.noticeboardService.createNoticeboard(noticeboard);

                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/update', uploadFile, async (req, res) => {
            try {
                const noticeboard = req.body;
                if (req.file) {
                    const file = await this.minioService.uploadFile(req.file);
                    noticeboard.posterUrl = file.url;
                }
                await this.noticeboardService.updateNoticeboard(noticeboard);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.get('/deleteNoticeboard/:noticeboardId', async (req, res) => {
            try {
                await this.noticeboardService.deleteNoticeboard(req.params.noticeboardId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/totalNoticeboards', async (req, res) => {
            try {
                let result = await this.noticeboardService.getTotalNoticeboardCount(req);
                return await res.json(result.count);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
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
                    latitude: req.body.latitude,
                    longitude: req.body.longitude,
                    languageCode: req.body.languageCode,
                    radiusInMeter: req.body.radiusInMeter,
                };
                result = await this.challengeController.getAllChallenges(request);
                // return await res.json({result, processingTime: end / 1000 + ' seconds'});
                return await res.json(result);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getNoticeboards', async (req, res) => {
            let result;
            try {
                result = await this.noticeboardService.getAllNoticeboards(req);
                return await res.json(result);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}
