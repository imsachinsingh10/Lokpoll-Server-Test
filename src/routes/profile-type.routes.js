import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {ProfileTypeService} from "../service/profile-type.service";

const router = express();

export class ProfileTypeRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/profile-type', router);

        this.profileTypeService = new ProfileTypeService();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.get('/getAll', async (req, res) => {
            try {
                let result = this.profileTypeService.getAllProfileTypes();
                return await res.json(result);
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
