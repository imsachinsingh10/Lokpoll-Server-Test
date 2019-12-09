import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {MoodController} from "../controller/mood.controller";
import AppOverrides from "../service/common/app.overrides";
import {ErrorModel} from "../model/common.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';
import {ProductService} from "../service/product.service";

const router = express();

export class ProductRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/product', router);

        this.productService = new ProductService();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.get('/getTags', async (req, res) => {
            try {
                const tags = await this.productService.getTags();
                return await res.json(tags);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/addTags', async (req, res) => {
            try {
                await this.productService.addTags(req.body);
                return await res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

    }
}
