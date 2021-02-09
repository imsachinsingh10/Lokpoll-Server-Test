import express from 'express';
import {HttpCode} from "../enum/http-code";
import AppOverrides from "../service/common/app.overrides";
import {LanguageService} from "../service/language.service";
import {log} from "../service/common/logger.service";

const router = express();

export class LanguageRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/', router);

        this.languageService = new LanguageService();
        this.initRoutes();
    }

    initRoutes() {
        // router.use(validateAuthToken);

        router.get('/getLanguages', async (req, res) => {
            try {
                let languages = await this.languageService.getLanguages();
                return await res.json(languages);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}

