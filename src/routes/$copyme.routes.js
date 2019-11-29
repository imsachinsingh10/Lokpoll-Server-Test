import _ from 'lodash';
import {HttpCode} from "../enum/http-code";
import {FirmService} from "../service/firm.service";
import {AppCode} from "../enum/app-code";
import {FirmController} from "../controller/firm.controller";

export class CopyMeRoute {

    constructor(app) {
        this.app = app;
        this.firmService = new FirmService();
        this.firmController = new FirmController();
        this.initRoutes();
    }

    initRoutes() {

        this.app.post('/copy-me', async (req, res) => {
            try {
                await this.firmService.inviteFirms(req.body);
                res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}
