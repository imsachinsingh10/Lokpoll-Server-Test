import * as _ from 'lodash';

import {Config} from '../config'
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import Validator from "../service/common/validator.service";
import jwt from "jsonwebtoken";
import {HttpCode} from "../enum/http-code";
import {table} from "../enum/table";
import {SqlService} from "../service/sql/sql.service";
import {AgeRange} from "../enum/common.enum";

export class UserController {
    constructor() {
        this.userService = new UserService();
    }

    async checkIfUserRegistered(user) {
        const _users = await this.userService.getUserByEmail(user);
        if (!_.isEmpty(_users)) {
            throw {
                message: `user already registered with email ${user.email}`,
                code: AppCode.duplicate_entity
            }
        }
    }

    async validateAndCheckIfUserRegisteredByPhone(phone) {
        if (_.isEmpty(phone) || phone.length !== 10) {
            throw {
                message: `Please enter valid phone number of 10 digits.`,
                code: AppCode.invalid_phone
            }
        }
        const _users = await this.userService.getUserByPhone(phone);
        if (!_.isEmpty(_users)) {
            throw {
                message: `User already registered with phone ${phone}.`,
                code: AppCode.duplicate_entity
            }
        }
    }

    async searchUsers(searchCriteria) {
        const _searchCriteria = {
            limit: 200,
            offset: 0,
            firmId: searchCriteria.firmId,
            roleId: searchCriteria.roleId,
            workingStatus: searchCriteria.workingStatus,
        };

        if (searchCriteria.limit)
            _searchCriteria.limit = searchCriteria.limit;
        if (searchCriteria.offset)
            _searchCriteria.offset = searchCriteria.offset;

        return this.userService.searchUsers(_searchCriteria);
    }

    async getLoginHistory(searchCriteria) {
        const _searchCriteria = {
            limit: 200,
            offset: 0,
        };

        if (searchCriteria.limit)
            _searchCriteria.limit = searchCriteria.limit;
        if (searchCriteria.offset)
            _searchCriteria.offset = searchCriteria.offset;

        return this.userService.getLoginHistory(_searchCriteria);
    }

    async updateUser(user) {
        const _user = {
            id: user.id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            address: user.address,
            latitude: user.latitude,
            longitude: user.longitude,
            profession: user.profession,
            company: user.company,
            ageRangeId: user.ageRangeId,
            appLanguage: user.appLanguage,
            contentLanguage: user.contentLanguage,
            // phone: user.phone
        };
        return this.userService.updateUser(_user);
    }

    async updateHobbies(hobbies, userId) {
        if (_.isEmpty(hobbies)) {
            return
        }
        await this.userService.updateHobbies(hobbies, userId)
    }

    async loginAndroid(req, res) {
        try {
            Validator.isPhoneValid(req.body.phone);
            Validator.isOTPValid(req.body.otp);
            const isUserRegistered = await this.userService.isUserRegisteredByPhone(req.body.phone);
            if (!isUserRegistered) {
                return this.registerAndroidUser(req, res);
            }
            let user = await this.userService.loginUserByPhone(req.body);
            user = await this.getUserDetails(user.id);
            await this.userService.updateLoginHistory(req, user);
            const token = jwt.sign(
                user,
                Config.auth.secretKey,
                {expiresIn: Config.auth.expiryInSeconds}
            );
            return res.status(HttpCode.ok).json({
                token,
                user,
                isNewUser: false
            });
        } catch (e) {
            console.error(`${req.method}: ${req.url}`, e);
            if (e.code === AppCode.invalid_phone || e.code === AppCode.invalid_otp || e.code === AppCode.otp_expired) {
                return res.status(HttpCode.bad_request).send(e);
            } else if (e.code === AppCode.invalid_creds) {
                return res.status(HttpCode.unauthorized).send(e);
            }
            res.status(HttpCode.internal_server_error).json(e);
        }
    }

    async registerAndroidUser(req, res) {
        try {
            try {
                let user = req.body;
                await this.userService.verifyOTP(user.otp, user.phone, true);
                user = {
                    phone: user.phone, roleId: 3, regDate: 'utc_timestamp()'
                };
                const result = await this.userService.createUser(user);
                await this.userService.createAnonymousAndBusinessProfiles(result.insertId);
                user = await this.getUserDetails(result.insertId);
                const token = jwt.sign(
                    {id: result.insertId, roleId: 3},
                    Config.auth.secretKey,
                    {expiresIn: Config.auth.expiryInSeconds}
                );
                return await res.json({
                    token,
                    user,
                    isNewUser: true
                });
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.otp_expired || e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).json(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        } catch (e) {
            console.error(`${req.method}: ${req.url}`, e);
            if (e.code === AppCode.invalid_creds) {
                return res.status(HttpCode.unauthorized).send(e);
            }
            res.sendStatus(HttpCode.internal_server_error);
        }
    }

    async loginWeb(req, res) {
        try {
            let user = req.body;
            user = await this.userService.validateUserByEmail(user);
            await this.userService.updateLoginHistory(req, user);
            const token = jwt.sign(
                user,
                Config.auth.secretKey,
                {expiresIn: Config.auth.expiryInSeconds}
            );
            return res.status(HttpCode.ok).json({
                token,
                user
            });
        } catch (e) {
            console.error(`${req.method}: ${req.url}`, e);
            if (e.code === AppCode.invalid_platform) {
                return res.status(HttpCode.bad_request).send(e);
            }
            if (e.code === AppCode.invalid_creds) {
                return res.status(HttpCode.unauthorized).send(e);
            }
            res.sendStatus(HttpCode.internal_server_error);
        }
    }

    async getUserDetails(userId, callerId = 0) {
        // const userId = req.body.userId;
        // const callerId = req.user.id;
        const user = await this.userService.getUserById(userId);
        const hobbies = await this.userService.getHobbiesByUserId(userId);
        const basicDetails = _.omit(user, ['latitude', 'longitude', 'address']);
        const respects = await this.userService.getRespects();
        const groupedRespectFor = _.groupBy(respects, 'respectFor');
        const groupedRespectBy = _.groupBy(respects, 'respectBy');
        const respectedByMe = await this.userService.getRespectByUserId(callerId, userId);
        const respectCountForUser = groupedRespectFor[userId] ? groupedRespectFor[userId].length : 0;
        const respectCountByUser = groupedRespectBy[userId] ? groupedRespectBy[userId].length : 0;
        return {
            ...basicDetails,
            respectCountForUser,
            respectCountByUser,
            respectedByMe: !_.isEmpty(respectedByMe),
            hobbies,
            location: {
                latitude: user.latitude ? +user.latitude : null,
                longitude: user.longitude ? +user.longitude : null,
                address: user.address,
            }
        }
    }

    getAgeRanges() {
        return AgeRange;
    }

    async getFormattedWhoRespectingMe(req) {
        let rawArray =  await this.userService.getWhoRespectingMe(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };

    async getFormattedWhoRespectedByMe(req) {
        let rawArray =  await this.userService.getWhoRespectedByMe(req);
        return rawArray.map((obj) => {
            return {
                id: obj.id,
                user: {
                    id: obj.userId,
                    name: obj.name,
                    imageUrl: obj.imageUrl,
                    bgImageUrl: obj.bgImageUrl,
                }
            }
        })
    };
}
