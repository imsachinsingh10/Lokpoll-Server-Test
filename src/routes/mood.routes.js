import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
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
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.duplicate_entity) {
                    return res.status(HttpCodes.bad_request).send(e);
                }
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/getMoods', async (req, res) => {
            try {
                let moods = await this.moodService.getAllMoods(req.body);
                return await res.json(moods);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/update', async (req, res) => {
            try {
                const mood = req.body;
                if (_.isEmpty(mood.id)) {
                    mood.id = mood.id;
                }
                await this.moodService.updateMood(mood);
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.get('/delete/:moodId', async (req, res) => {
            try {
                await this.moodService.deleteMood(req.params.moodId);
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

    }
}
