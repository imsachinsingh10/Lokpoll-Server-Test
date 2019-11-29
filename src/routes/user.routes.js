import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";
import {SqlService} from "../service/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/app.overrides";
import {ErrorModel} from "../model/error.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';

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
        router.use(validateAuthToken);

        router.post('/getProfile', async (req, res) => {
            try {
                const user = await this.userService.getUserById(req.user.id);
                return res.status(HttpCode.ok).json({user});
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getRoles', async (req, res) => {
            try {
                let roles = await SqlService.getTable(table.userRole, 0);
                roles = roles.filter((r) => r.id !== 1);
                return await res.json(roles);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/add', async (req, res) => {
            try {
                const user = req.body;
                await this.userController.checkIfUserRegistered(user);
                await this.userService.createUser(user);
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
                let users = await this.userService.getAllUsers(req);
                return await res.json(users);
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
                const user = req.body;
                if (_.isEmpty(user.id)) {
                    user.id = req.user.id;
                    user.workingStatus = 'active'
                }
                await this.userService.updateUser(user);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:userId', async (req, res) => {
            try {
                console.log('user to delete', req.params.userId);
                await this.userService.deleteUser(req.params.userId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/searchUser', async (req, res) => {
            try {
                const searchData = req.body.searchText;
                let users = await this.userService.getSearchUsers(searchData);
                return await res.json(users);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/totalUser', async (req, res) => {
            try {
                let result = await this.userService.getTotalUsers(req.body);
                return await res.json(result.totalUsers);
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

