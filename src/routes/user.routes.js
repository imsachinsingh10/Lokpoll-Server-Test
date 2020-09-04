import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {UserController} from "../controller/user.controller";
import {SqlService} from "../service/sql/sql.service";
import {table} from "../enum/table";
import AppOverrides from "../service/common/app.overrides";
import {ErrorModel} from "../model/common.model";
import {validateAuthToken} from "../middleware/auth.middleware";
import _ from 'lodash';
import {MinIOService, uploadProfilePictures} from "../service/common/minio.service";
import {ProfileType} from "../enum/common.enum";
import {FirebaseController} from "../controller/firebase.controller";

const router = express();

export class UserRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        this.userService = new UserService();
        this.userController = new UserController();
        this.minioService = new MinIOService();
        this.firebaseController = new FirebaseController();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/getProfile', async (req, res) => {
            try {
                const user = await this.userController.getUserDetails(req.user.id);
                return await res.json(user);
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
                const result = await this.userService.createUser(user);
                if (user.roleId === 3) {
                    await this.userService.createAnonymousAndBusinessProfiles(result.insertId);
                }
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

        router.get('/getFormattedUsers', async (req, res) => {
            try {
                let user = await this.userService.getFormattedUsers(req.query);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e.message);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getAgeRanges', async (req, res) => {
            try {
                let ageRanges = this.userController.getAgeRanges();
                return await res.json(ageRanges);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/getProfileTypes', async (req, res) => {
            try {
                return await res.json(ProfileType);
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
                let user = req.body;
                if (user.id === undefined || !(user.id > 0)) {
                    user.id = req.user.id;
                    user.workingStatus = 'active';
                }
                await this.userController.checkIfUserRegistered(user);
                await this.userController.updateUser(user);
                await this.userController.updateHobbies(user.hobbies, user.id);
                user = await this.userController.getUserDetails(user.id);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:userId', async (req, res) => {
            try {
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

        router.post('/updateProfilePics', uploadProfilePictures, async (req, res) => {
            try {
                const promises = [];
                if (req.files.image && req.files.image[0]) {
                    promises.push(this.minioService.uploadProfilePicture(req.files.image[0], 'image'));
                }
                if (req.files.bgImage && req.files.bgImage[0]) {
                    promises.push(this.minioService.uploadProfilePicture(req.files.bgImage[0], 'bgImage'))
                }

                if (req.files.audio && req.files.audio[0]) {
                    promises.push(this.minioService.uploadProfilePicture(req.files.audio[0], 'audio'))
                }
                if (promises.length === 0) {
                    throw new ErrorModel(AppCode.invalid_request, 'Please select files, no files to upload');
                }
                const result = await Promise.all(promises);
                const user = Object.assign({id: req.user.id}, result[0], result[1], result[2]);
                await this.userService.updateUser(user);
                return await res.json(_.omit(user, ['id']));
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error || e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

        router.post('/respect', async (req, res) => {
            try {
                const model = {
                    createdAt: 'utc_timestamp()',
                    respectFor: req.body.respectFor,
                    respectBy: req.user.id
                };

                let result = await this.userService.updateRespect(model);
                this.firebaseController.sendRespectUserMessage(model);
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getWhoRespectingMe', async (req, res) => {
            try {
                let result = await this.userController.getFormattedWhoRespectingMe(req);
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getWhoRespectedByMe', async (req, res) => {
            try {
                let result = await this.userController.getFormattedWhoRespectedByMe(req);
                return await res.json(result);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getProfileByUserId', async (req, res) => {
            try {
                const user = await this.userController.getUserDetails(req.body.userId, req.user.id);
                return await res.json(user);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/saveToken', async (req, res) => {
            try {
                await this.userService.saveToken(req.body);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/addReferralCode', async (req, res) => {
            try {
                const user = {
                    id: req.user.id,
                }
                if (req.body.referralKey) {
                    user.parentReferralCode = await this.userService.validateReferralCode(req.body.referralKey);
                    await this.userService.updateUser(user);
                }
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_request) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });
    }
}

