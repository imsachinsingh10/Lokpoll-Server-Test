import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";

const router = express();

export class UserRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.initRoutes();
    }

    initRoutes() {
        router.use((req, res, next) => {
            if (req.method === 'OPTIONS') {
                return res.send();
            }
            const token = req.body.token || req.query.token || req.headers.token;
            console.log('token', token);
            if (!token) {
                return res.status(HttpCodes.unauthorized).json(
                    new ErrorModel('no_token', 'Please add token')
                );
            }
            jwt.verify(token, Config.auth.secretKey, function (err, decoded) {
                if (err) {
                    console.log('invalid_token', err);
                    return res.status(HttpCodes.unauthorized).json(
                        new ErrorModel('invalid_token', 'Token not verified')
                    );
                } else {
                    // console.log('user verified', decoded);
                    delete req.body.token;
                    delete decoded.iat;
                    delete decoded.exp;
                    req.user = decoded;
                    next();
                }
            });
        });

        router.post('/', async (req, res) => {
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

        router.post('/getRoles', async (req, res) => {
            try {
                let roles = await SqlService.getTable(table.userrole, 0);
                roles = roles.filter((r) => r.id !== 1);
                return await res.json(roles);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/add', async (req, res) => {
            try {
                const user = req.body;
                await this.userController.checkIfUserRegistered(user);
                await this.userService.createUser(user);
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
                let users = await this.userService.getAllUsers();
                return await res.json(users);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/update', async (req, res) => {
            try {
                const user = req.body;
                await this.userService.updateUser(user);
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.get('/delete/:userId', async (req, res) => {
            try {
                console.log('user to delete', req.params.userId);
                await this.userService.deleteUser(req.params.userId);
                return res.sendStatus(HttpCodes.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/searchUser', async (req, res) => {
            try {
                const searchData = req.body.searchText;
                let users = await this.userService.getSearchUsers(searchData);
                return await res.json(users);
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

