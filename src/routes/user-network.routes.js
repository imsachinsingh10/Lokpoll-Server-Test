import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {MinIOService} from "../service/common/minio.service";
import {FirebaseController} from "../controller/firebase.controller";
import {UserNetworkService} from "../service/user-network.service";

const router = express();

export class UserNetworkRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        this.userNetworkService = new UserNetworkService();
        this.userNetworkController = new UserNetworkService();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/addCoinActivity', async (req, res) => {
            try {
                await this.userNetworkService.addCoinActivity(req);
                res.json('New Coin activity added');
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/updateCoinActivity', async (req, res) => {
            try {
                await this.userNetworkService.updateCoinActivity(req);
                res.json('Coin activity updated');
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getAllCoinActivities', async (req, res) => {
            try {
                const activities = await this.userNetworkService.getAllCoinActivities();
                res.json(activities);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.put('/updateCoinActivity', async (req, res) => {
            try {
                const result = await this.userNetworkService.updateCoinActivity(req.body);
                res.json(result);
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

