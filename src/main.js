import express from 'express';
import BodyParser from 'body-parser';
import {InitRoutes} from './routes/$init.routes';

import * as dotenv from 'dotenv';
import AppOverrides from "./service/common/app.overrides";
import AppEventHandler from "./service/common/app.eventHandler";
import path from "path";
import {PostScheduler} from "./service/post-schedular";
import {Config} from "./config";
import {Environment} from "./enum/common.enum";
import {log} from "./service/common/logger.service";

dotenv.config();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

const app = express();

app.use(BodyParser.urlencoded({extended: false}));
app.use(BodyParser.json());
app.use('/assets', express.static(path.resolve('assets')));

swaggerDocument.host = Config.host;
if (process.env.NODE_ENV !== Environment.dev) {
    swaggerDocument.schemes[0] = 'https';
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

new AppEventHandler();
new AppOverrides(app);
new InitRoutes(app);
if (process.env.NODE_ENV !== Environment.dev) {
    new PostScheduler().start();
}

const port = process.env.PORT || 9003;
app.listen(port, () => {
    log.i(`Server listening on port ${port}`);
    log.i(`Access server at ${Config.serverUrl.base}`);
    log.i(`Access API docs at ${Config.serverUrl.base}/api-docs`);
});
