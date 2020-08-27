import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {MinIOService, uploadFile} from "../service/common/minio.service";
import {MoodCategoryService} from "../service/mood-category.service";
import {MoodCategoryController} from "../controller/mood-category.controller";
import _ from 'lodash';

const router = express();

export class MoodCategoryRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/mood-category', router);

        this.categoryService = new MoodCategoryService();
        this.minioService = new MinIOService();
        this.categoryController = new MoodCategoryController();
        this.initRoutes();
    }

    initRoutes() {
       router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const category = {
                    name_en: req.body.name_en,
                    name_hi: req.body.name_hi,
                    name_or: req.body.name_or,
                    name_ta: req.body.name_ta,
                    description_en: req.body.description_en,
                    description_hi: req.body.description_hi,
                    description_or: req.body.description_or,
                    description_ta: req.body.description_ta,
                    createdBy: req.user.id,
                    createdAt: 'utc_timestamp()',
                    position: req.body.position,
                    isActive: req.body.isActive,
                };
                await this.categoryController.checkIfCategoryRegistered(category);
                await this.categoryService.createMoodCategory(category);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getAll', async (req, res) => {
            try {
                let categories = await this.categoryController.getAllMoodCategories(req.body);
                return await res.json(categories);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/update', async (req, res) => {
            try {
                const category = _.omit(req.body, 'createdAt', 'createdBy', 'moods');
                await this.categoryService.updateMoodCategory(category);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:categoryId', async (req, res) => {
            try {
                await this.categoryService.deleteMoodCategory(req.params.categoryId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/totalCategories', async (req, res) => {
            try {
                let result = await this.categoryService.getTotalMoodCategories(req.body);
                return await res.json(result.count);
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
