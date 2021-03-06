import {UserRoutes} from './user.routes';
import {LanguageRoutes} from "./language.routes";
import {MoodRoutes} from "./mood.routes";
import {MediaRoutes} from "./media.routes";
import {PostRoutes} from "./post.routes";
import {HttpCode} from "../enum/http-code";
import {SqlService} from "../service/sql/sql.service";
import {AuthRoutes} from "./auth.routes";
import Utils from "../service/common/utils";
import {ProfileTypeRoutes} from "./profile-type.routes";
import {ProductRoutes} from "./product.routes";
import {LocationRoutes} from "./location.routes";
import {ChallengeRoutes} from "./challenge.routes";
import {JudgeRoutes} from "./judge.routes";
import {NoticeboardRoutes} from "./noticeboard.routes";
import {MoodCategoryRoutes} from "./mood-category.routes";
import {Config} from "../config";
import {log} from "../service/common/logger.service";
import {UserNetworkRoutes} from "./user-network.routes";

export class InitRoutes {

    constructor(app) {
        new SqlService();

        this.initTestApi(app);
        this.initRoutes(app);
    }

    initTestApi(app) {
        app.get('/', async (req, res) => {
            return res.json({
                version: Utils.getVersion(),
                system_time: new Date(),
                env: process.env.NODE_ENV
            });
        });

        app.get('/db', async (req, res) => {
            try {
                await SqlService.getTable('user');
                return res.json({
                    message: 'database working'
                });
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                return res.status(HttpCode.internal_server_error).json(e);
            }
        });

    }

    initRoutes(app) {
        new AuthRoutes(app);
        new UserRoutes(app);
        new LanguageRoutes(app);
        new MoodRoutes(app);
        new MoodCategoryRoutes(app);
        new PostRoutes(app);
        new ProfileTypeRoutes(app);
        new ProductRoutes(app);
        new MediaRoutes(app);
        new LocationRoutes(app);
        new ChallengeRoutes(app);
        new JudgeRoutes(app);
        new NoticeboardRoutes(app);
        new UserNetworkRoutes(app);
    }
}
