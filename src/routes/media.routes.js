import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import _ from 'lodash';
import AppOverrides from "../service/common/app.overrides";
import {MediaController} from "../controller/media.controller";
import {validateAuthToken} from "../middleware/auth.middleware";

const router = express();

export class MediaRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/media', router);

        this.mediaController = new MediaController();
        this.initRoutes();
    }

    initRoutes() {
        // router.use(validateAuthToken);

        router.get('/play', async (req, res) => {
            try {
                await this.mediaController.mediaPlay(req,res);
                // return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}
