import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {MoodService} from "../service/mood.service";
import {MoodController} from "../controller/mood.controller";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';

const router = express();

export class MoodRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/mood', router);

        this.moodService = new MoodService();
        this.moodController = new MoodController();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const mood = req.body;
                mood.createdBy = req.user.id;
                await this.moodController.checkIfMoodRegistered(mood);
                await this.moodService.createMood(mood);
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

        router.post('/update', async (req, res) => {
            try {
                const mood = req.body;
                if (_.isEmpty(mood.id)) {
                    mood.id = mood.id;
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