import {Config} from "../../config";

const moment = require("moment");
import fs from 'fs';
import {Environment} from "../../enum/common.enum";

export default class AppOverrides {
    constructor(app) {
        this.app = app;
        this.addResponseHeaders();
        this.overrideJSONSerializer();
        this.overrideJSONDeserializer();
        this.updateConfig();

        if (!fs.existsSync('./uploads')){
            fs.mkdirSync('./uploads');
        }
    }

    addResponseHeaders() {
        this.app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization, token');
            res.setHeader('Access-Control-Allow-Credentials', true);

            next();
        });
    }

    overrideJSONSerializer() {
        Date.prototype.toISOString = function () {
            return moment(this).format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
        };
    }

    overrideJSONDeserializer() {
        Date.prototype.toJSON = function() {
            return moment(this).format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
        };
    }

    updateConfig() {
        if (Config.env === Environment.prod) {
            Config.serverUrl.base = Config.serverUrl.prod
        } else if (Config.env === Environment.test) {
            Config.serverUrl.base = Config.serverUrl.test
        } else {
            Config.serverUrl.base = Config.serverUrl.dev
        }
    }
}
