import {UserRoutes} from './user.routes';
import {LanguageRoutes} from "./language.routes";
import {MoodRoutes} from "./mood.routes";
import {PostRoutes} from "./post.routes";
import {HttpCodes} from "../enum/http-codes";
import jwt from 'jsonwebtoken';
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {AuthRoutes} from "./auth.routes";
import _ from 'underscore'
import {MinIOService} from "../service/minio.server";
import Utils from "../service/utils";
import {SMSService} from "../service/sms.service";
import {ErrorCode} from "../enum/error-codes";

export class InitRoutes {

    constructor(app) {
        this.init(app);
    }

    init(app) {
        new SqlService();

        this.initTestApi(app);
        new AuthRoutes(app);
        new UserRoutes(app);
        new LanguageRoutes(app);
        new MoodRoutes(app);
        new PostRoutes(app);
    }

    initTestApi(app) {
        app.get('/', async (req, res) => {
            return res.json({
                version: Utils.getVersion(),
                system_time: new Date()
            });
        });

        app.get('/db', async (req, res) => {
            try {
                await SqlService.getTable('user');
                return res.json({
                    message: 'database working'
                });
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.status(HttpCodes.internal_server_error).json(e);
            }
        });

    }
}
