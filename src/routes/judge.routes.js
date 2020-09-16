import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {SqlService} from "../service/sql/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/common/app.overrides";
import {ErrorModel} from "../model/common.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';
import {MinIOService, uploadProfilePictures} from "../service/common/minio.service";
import {ProfileType} from "../enum/common.enum";
import {FirebaseController} from "../controller/firebase.controller";
import {JudgeService} from "../service/judge.service";
import {JudgeController} from "../controller/judge.controller";

const router = express();

export class JudgeRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/judge', router);

        this.judgeService = new JudgeService();
        this.judgeController = new JudgeController();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);



        router.post('/add', async (req, res) => {
            try {
                const judge = req.body;
                await this.judgeController.checkIfJudgeRegistered(judge);
                const result = await this.judgeService.createJudge(judge);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getUsers', async (req, res) => {
            try {
                let users = await this.judgeService.getAllUsers(req);
                return await res.json(users);
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
                let judge = req.body;

                await this.judgeController.checkIfJudgeRegistered(judge);
                await this.judgeService.updateJudge(judge);
                return await res.json(judge);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:judgeId', async (req, res) => {
            try {
                await this.judgeService.deleteJudge(req.params.judgeId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/list', async (req, res) => {
            try {
                let judges = await this.judgeService.getAllJudges();
                return await res.json(judges);
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

