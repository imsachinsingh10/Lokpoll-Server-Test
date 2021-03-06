import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import Utils from "../service/common/utils";
import {SMSService} from "../service/common/sms.service";
import * as _ from "lodash";
import {ErrorModel, SuccessModel} from "../model/common.model";
import {PostService} from "../service/post.service";
import {PostController} from "../controller/post.controller";
import {log} from "../service/common/logger.service";

const router = express();

export class AuthRoutes {
    constructor(app) {
        app.use('/', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.postService = new PostService();
        this.postController = new PostController();
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
                let otp = Utils.getRandomNumber(1000, 9999);
                const isOTPSent = await SMSService.sendSMS(phone, otp);
                if (isOTPSent) {
                    await this.userService.saveOTP(otp, phone);
                    return res.status(HttpCode.ok).json(new SuccessModel(AppCode.success, "OTP sent"));
                }
                return res.status(HttpCode.bad_request).json(new ErrorModel(AppCode.failure, "OTP not sent."))
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
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
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/post/getById/:postId', async (req, res) => {
            try {
                let result = await this.postService.getPostData({postId: req.params.postId});
                result = await this.postController.formatPosts(req, result);
                return res.status(HttpCode.ok).json(result[0]);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}

