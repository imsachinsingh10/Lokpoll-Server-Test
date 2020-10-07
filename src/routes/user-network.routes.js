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

        router.post('/getProfile', async (req, res) => {
            try {

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

