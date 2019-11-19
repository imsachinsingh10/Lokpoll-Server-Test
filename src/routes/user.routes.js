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
import {validateAuthToken} from "../middleware/auth.middleware";

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
                let roles = await SqlService.getTable(table.userRole, 0);
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
    }
}

