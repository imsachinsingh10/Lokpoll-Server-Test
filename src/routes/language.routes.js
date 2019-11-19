import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import {LanguageService} from "../service/language.service";

const router = express();

export class LanguageRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/app', router);

        this.languageService = new LanguageService();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.get('/getLanguages', async (req, res) => {
            try {
                let languages = await this.languageService.getLanguages();
                return await res.json(languages);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });
    }
}

