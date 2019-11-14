import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";

const router = express();

export class UserRoutes {
    constructor(app) {
        app.use('/user', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.initRoutes();
    }

    initRoutes() {
        router.use((req, res, next) => {
            const token = req.body.token || req.query.token || req.headers.token;
            if (!token) {
                return res.json('token missing');
            }
            jwt.verify(token, Config.auth.secretKey, function (err, decoded) {
                if (err) {
                    return res.json('token not verified');
                } else {
                    console.log('user verified', decoded);
                    req.user = decoded;
                    next();
                }
            });
        });

        router.get('/', async (req, res) => {
            try {
                return res.status(HttpCodes.ok).json({
                    user: req.user
                });
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

