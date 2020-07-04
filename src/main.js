import express from 'express';
import BodyParser from 'body-parser';
import {InitRoutes} from './routes/$init.routes';
import AppOverrides from "./service/common/app.overrides";
import AppEventHandler from "./service/common/app.eventHandler";
import path from "path";

const app = express();

app.use(BodyParser.urlencoded({extended: false}));
app.use(BodyParser.json());
app.use('/assets', express.static(path.resolve('assets')));

new AppEventHandler();
new AppOverrides(app);
new InitRoutes(app);

const port = process.env.PORT || 9003;
app.listen(port, () => {
    console.log('Server listening at port', port);
});
