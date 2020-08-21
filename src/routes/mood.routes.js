import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {MoodService} from "../service/mood.service";
import {MoodController} from "../controller/mood.controller";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';
import {MinIOService, uploadFile} from "../service/common/minio.service";

const router = express();

export class MoodRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/mood', router);

        this.moodService = new MoodService();
        this.minioService = new MinIOService();
        this.moodController = new MoodController();
        this.initRoutes();
    }

    initRoutes() {
       router.use(validateAuthToken);

        router.post('/add', uploadFile, async (req, res) => {
            try {
                const mood = {
                    color: req.body.color,
                    createdBy: req.user.id,
                    en: req.body.en,
                    hi: req.body.hi,
                    or: req.body.or,
                    ta: req.body.ta,
                    createdAt: 'utc_timestamp()',
                    position: req.body.position,
                    categoryId: req.body.categoryId,
                    isActive: req.body.isActive,
                };
                if (req.file) {
                    const file = await this.minioService.uploadFile(req.file);
                    mood.imageUrl = file.url;
                }
                await this.moodController.checkIfMoodRegistered(mood);
                const result = await this.moodService.createMood(mood);
                if (req.body.subMood) {
                    const subMoods = req.body.subMood.split(',');
                    const subMoodsData = subMoods
                        .map(p => ({
                            name: p,
                            moodId: result.insertId,
                        }));
                    await this.moodService.createSubMoods(subMoodsData);
                }
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getMoods', async (req, res) => {
            try {
                let moods = await this.moodService.getAllMoods(req.body);
                return await res.json(moods);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getSubMoodsByMoodId', async (req, res) => {
            try {
                console.log(req.body);
                let subMoods = await this.moodService.getSubMoodsByMoodId(req.body);
                return await res.json(subMoods);
            } catch (e) {
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/update', uploadFile, async (req, res) => {
            try {
                const mood = req.body;
                if (req.file) {
                    const file = await this.minioService.uploadFile(req.file);
                    mood.imageUrl = file.url;
                }
                await this.moodService.updateMood(mood);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:moodId', async (req, res) => {
            try {
                await this.moodService.deleteMood(req.params.moodId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/totalMoods', async (req, res) => {
            try {
                let result = await this.moodService.getTotalMoods(req.body);
                return await res.json(result.totalMoods);
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
