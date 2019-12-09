import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {Config} from "../config";
import Utils from "../service/common/utils";
import {SMSService} from "../service/common/sms.service";
import {Environment} from "../enum/common.enum";
import * as _ from "lodash";
import {ErrorModel, SuccessModel} from "../model/common.model";

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
            if (_.isEmpty(req.body.platform)) {
                throw new ErrorModel(AppCode.invalid_platform, "Platform is required")
            }
            if (req.body.platform === 'android') {
                return this.userController.loginAndroid(req, res);
            } else if (req.body.platform === 'web') {
                return this.userController.loginWeb(req, res);
            }
        });

        router.post('/sendOTP', async (req, res) => {
            try {
                const {phone} = req.body;
                let otp = Config.env === Environment.prod ? Utils.getRandomNumber(1000, 9999) : 8888;
                otp = 8888;  //TODO: remove it after development
                const isOTPSent = await SMSService.sendSMS(phone, otp);
                if (isOTPSent) {
                    await this.userService.saveOTP(otp, phone);
                    return res.status(HttpCode.ok).json(new SuccessModel(AppCode.success, "OTP sent"));
                }
                return res.status(HttpCode.bad_request).json(new ErrorModel(AppCode.failure, "OTP not sent."))
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity || e.code === AppCode.invalid_phone) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/verifyOTP', async (req, res) => {
            try {
                const {phone, otp} = req.body;
                await this.userService.verifyOTP(otp, phone, true);
                return res.status(HttpCode.ok).json(new SuccessModel(AppCode.success, "Phone verified"));
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}

