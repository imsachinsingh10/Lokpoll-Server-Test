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

        global.log = {
            i: (tag, info1 = '', info2 = '') => {
                console.log(`\n++++++ info ++++++ @ ${new Date()}\n`, tag, info1, info2);
            },
            e: (tag, error1, error2) => {
                console.log(`\nxxxxxx error xxxxxx @ ${new Date()}\n`, tag, error1, error2);
            },
            sql: (query) => {
                console.log(`\n****** sql ****** @ ${new Date()}\n`, query);
            }
        }

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

/*
`name_hi` varchar(100) DEFAULT NULL,
`name_en` varchar(100) DEFAULT NULL,
`name_or` varchar(100) DEFAULT NULL,
`name_ta` varchar(100) DEFAULT NULL,
`description_hi` varchar(100) DEFAULT NULL,
`description_en` varchar(100) DEFAULT NULL,
`description_or` varchar(100) DEFAULT NULL,
`description_ta` varchar(100) DEFAULT NULL,
* */
