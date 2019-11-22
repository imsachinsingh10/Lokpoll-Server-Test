import express from 'express';
import jwt from 'jsonwebtoken';
import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";
import Utils from "../service/utils";
import {SMSService} from "../service/sms.service";
import {Environment} from "../enum/common";

const router = express();

export class AuthRoutes {
    constructor(app) {
        app.use('/', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.initRoutes();
    }

    initRoutes() {
        router.post('/user/login', async (req, res) => {
            if (req.body.platform === 'android') {
                return res.redirect(307, '/user/login-android')
            }
            try {
                let user = req.body;
                user = await this.userService.validateUserByEmail(user);
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

        router.post('/user/login-android', async (req, res) => {
            console.log('working', req.body);
            try {
                let user = req.body;
                user = await this.userService.validateUserByPhone(user);
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

        router.post('/user/register', async (req, res) => {
            try {
                try {
                    const user = req.body;
                    await this.userController.validateAndCheckIfUserRegisteredByPhone(user);
                    await this.userService.verifyOTP(user.otp, user.phone, true);
                    user.roleId = 3;
                    delete user.otp;
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
                    if (e.code === ErrorCode.duplicate_entity || e.code === ErrorCode.invalid_phone || e.code === ErrorCode.invalid_creds) {
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

        router.post('/sendOTP', async (req, res) => {
            try {
                const {phone} = req.body;
                // const otp = Config.env === Environment.prod ? Utils.getRandomNumber(1000, 9999) : 8888;
                const otp = 8888;
                const isOTPSent = await SMSService.sendSMS(phone, otp);
                if (isOTPSent) {
                    await this.userService.saveOTP(otp, phone);
                    return res.status(HttpCodes.ok).json("OTP sent");
                }
                return res.status(HttpCodes.bad_request).json("OTP not sent")
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.duplicate_entity) {
                    return res.status(HttpCodes.bad_request).send(e.message);
                }
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });

        router.post('/verifyOTP', async (req, res) => {
            try {
                const {phone, otp} = req.body;
                await this.userService.verifyOTP(otp, phone, true);
                return res.status(HttpCodes.ok).json("Phone verified");
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.bad_request).send(e.message);
                }
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        });
    }
}

