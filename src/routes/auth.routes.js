import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";

const router = express();

export class AuthRoutes {
    constructor(app) {
        app.use('/auth', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.initRoutes();
    }

    initRoutes() {
        router.post('/token', async (req, res) => {
            try {
                let user = req.body;
                user = await this.userService.validateUser(user);
                console.log('user', user);
                await this.userService.updateLoginHistory(req, user);
                const token = jwt.sign(
                    user,
                    Config.auth.secretKey,
                    {expiresIn: Config.auth.expiryInSeconds}
                );
                return res.status(HttpCodes.ok).json({
                    token
                });
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/register', async (req, res) => {
            try {
                try {
                    const user = req.body;
                    await this.userController.validateAndCheckIfUserRegisteredByPhone(user);
                    user.roleId = 3;
                    const result = await this.userService.createUser(user);
                    const token = jwt.sign(
                        {id: result.insertId, roleId: 3},
                        Config.auth.secretKey,
                        {expiresIn: Config.auth.expiryInSeconds}
                    );
                    return res.json({
                        token
                    });
                } catch (e) {
                    console.error(`${req.method}: ${req.url}`, e);
                    if (e.code === ErrorCode.duplicate_entity || e.code === ErrorCode.invalid_phone) {
                        return res.status(HttpCodes.bad_request).json(e);
                    }
                    return res.sendStatus(HttpCodes.internal_server_error);
                }
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

