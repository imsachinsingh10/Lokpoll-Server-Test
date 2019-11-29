import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {PostService} from "../service/post.service";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';

const router = express();

export class PostRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/post', router);

        this.postService = new PostService();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const post = req.body;
                console.log(req);
                await this.postService.createPost(post);
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.duplicate_entity) {
                    return res.status(HttpCodes.bad_request).send(e.message);
                }
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });


        router.post('/getUsers', async (req, res) => {
            try {
                let user = await this.postService.getAllUsers(req.body);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });




    }
}
