const moment = require("moment");

export default class AppOverrides {
    constructor(app) {
        this.app = app;
        this.addResponseHeaders();
        this.overrideJSONSerializer();
        this.overrideJSONDeserializer();

        global.log = {
            i: (info) => {
                // console.log(info)
            }
        }
    }

    addResponseHeaders() {
        this.app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
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
}