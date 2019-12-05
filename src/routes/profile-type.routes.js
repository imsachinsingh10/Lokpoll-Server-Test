import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {Config} from "../config";
import {SqlService} from "../service/base/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import {
    MinIOService,
    uploadPostMediaMiddleware,
} from "../service/minio.service";
import _ from 'lodash';
import {PostController} from "../controller/post.controller";
import {QueryBuilderService} from "../service/base/querybuilder.service";
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
                let result = await this.profileTypeService.getAllProfileTypes();
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
