import _ from 'lodash';
import {HttpCodes} from "../enum/http-codes";
import {FirmService} from "../service/firm.service";
import {ErrorCode} from "../enum/error-codes";
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
                res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });
    }
}
