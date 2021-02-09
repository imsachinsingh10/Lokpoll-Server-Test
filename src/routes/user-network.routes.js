import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {MinIOService} from "../service/common/minio.service";
import {FirebaseController} from "../controller/firebase.controller";
import {UserNetworkService} from "../service/user-network.service";
import {log} from "../service/common/logger.service";
import {UserNetworkController} from "../controller/user-network.controller";

const router = express();

export class UserNetworkRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        this.userNetworkService = new UserNetworkService();
        this.userNetworkController = new UserNetworkController();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.get('/getNetwork', async (req, res) => {
            try {
                const network = await this.userNetworkController.getNetwork(req.user.id);
                return res.json({
                    userId: req.user.id,
                    children: network,
                    parents: []
                });
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

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

        router.get('/getAllCoinActivities', async (req, res) => {
            try {
                const activities = await this.userNetworkController.getGroupedCoinActivities();
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
                res.json('Coins activity updated');
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/networkCoinSummary', async (req, res) => {
            try {
                const result = await this.userNetworkService.getTotalCoins();
                res.json({
                    total: result.sum,
                    spent: 0,
                    balance: result.sum
                });
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/networkCoinSummaryByUser', async (req, res) => {
            try {
                const result = await this.userNetworkController.getCoinSummaryByUser(req);
                res.json(result)
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getCoinActivities', async (req, res) => {
            try {
                const activities = await this.userNetworkService.getCoinLogs(req.user.id);
                const coinsFromMyActivities = activities.filter(a => {
                    return !(a.activity.includes('frontLine') || a.activity.includes('downLine'))
                }).map(a => a.coins).reduce((a, b) => a + b, 0);

                const coinsFromFrontLineActivities = activities.filter(a => {
                    return a.activity.includes('frontLine')
                }).map(a => a.coins).reduce((a, b) => a + b, 0);

                const coinsFromDownLineActivities = activities.filter(a => {
                    return a.activity.includes('downLine')
                }).map(a => a.coins).reduce((a, b) => a + b, 0);

                return res.json({
                    coinsFromMyActivities,
                    coinsFromFrontLineActivities,
                    coinsFromDownLineActivities,
                    activities
                });
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}

