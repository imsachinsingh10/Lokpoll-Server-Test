import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import {MinIOService} from "../service/minio.server";
import _ from 'lodash';

const router = express();

export class PostRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/post', router);

        this.postService = new PostService();
        this.minioService = new MinIOService();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const post = req.body;
                console.log(req);
                await this.postService.createPost(post);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getUsers', async (req, res) => {
            try {
                let user = await this.postService.getAllUsers(req.body);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/create', this.minioService.uploadMiddleware('multiple'), async (req, res) => {
            try {
                const result = await this.postService.createPost(req.body);
                console.log('new post created with id', result.insertId);

                const promises = [];
                _.forEach(req.files, file => {
                    const filePromise = this.minioService.uploadFile(file);
                    promises.push(filePromise);
                });
                let docs = await Promise.all(promises);
                docs = docs.map(doc => {return {...doc, firmId: req.body.firmId, fundId: insertId};});
                const query = QueryBuilderService.getMultiInsertQuery(table.docs, docs);
                await this.sqlService.executeQuery(query);
                return res.status(httpCodes.ok).json({newFundId: insertId});
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(httpCodes.bad_request).send(e.message);
                }
                return res.sendStatus(httpCodes.internal_server_error);
            }
        });

    }
}
