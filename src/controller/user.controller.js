import * as _ from 'lodash';

import {Config} from '../config'
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {table} from "../enum/table";
import Validator from "../service/validator.service";
import jwt from "jsonwebtoken";
import {HttpCodes} from "../enum/http-codes";

export class UserController {
    constructor() {
        this.userService = new UserService();
    }

    async checkIfUserRegistered(user) {
        const _users = await this.userService.getUserByEmail(user);
        if (!_.isEmpty(_users)) {
            throw {
                message: `user already registered with email ${user.email}`,
                code: ErrorCode.duplicate_entity
            }
        }
    }

    async validateAndCheckIfUserRegisteredByPhone(phone) {
        if (_.isEmpty(phone) || phone.length !== 10) {
            throw {
                message: `Please enter valid phone number of 10 digits.`,
                code: ErrorCode.invalid_phone
            }
        }
        const _users = await this.userService.getUserByPhone(phone);
        if (!_.isEmpty(_users)) {
            throw {
                message: `User already registered with phone ${phone}.`,
                code: ErrorCode.duplicate_entity
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

    validateUserDetails(firm) {
        if (_.isEmpty(firm.phone)) {
            throw {
                code: ErrorCode.no_phone,
                message: `Phone can not be empty.`
            };
        }
    }

    async updateUser(user) {
        const _user = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            alternateEmail: user.alternateEmail,
            country: user.country,
            phone: user.phone,
            residentialAddress: user.residentialAddress,
            roleId: user.roleId,
            workingStatus: user.workingStatus
        };
        return await this.userService.updateUser(_user);
    }

    async loginAndroid(req, res) {
        try {
            Validator.isPhoneValid(req.body.phone);
            Validator.isOTPValid(req.body.otp);
            const isUserRegistered = await this.userService.isUserRegisteredByPhone(req.body.phone);
            if (!isUserRegistered) {
                return this.registerAndroid(req, res);
            }
            let user = await this.userService.loginUserByPhone(req.body);
            user = {
                id: user.id,
                roleId: user.roleId
            };
            await this.userService.updateLoginHistory(req, user);
            const token = jwt.sign(
                user,
                Config.auth.secretKey,
                {expiresIn: Config.auth.expiryInSeconds}
            );
            return res.status(HttpCodes.ok).json({
                token,
                user,
                isNewUser: false
            });
        } catch (e) {
            console.error(`${req.method}: ${req.url}`, e);
            if (e.code === ErrorCode.invalid_phone || e.code === ErrorCode.invalid_otp || e.code === ErrorCode.otp_expired) {
                return res.status(HttpCodes.bad_request).send(e);
            }
            res.sendStatus(HttpCodes.internal_server_error);
        }
    }

    async registerAndroid(req, res) {
        try {
            try {
                const user = req.body;
                await this.userService.verifyOTP(user.otp, user.phone, true);
                const result = await this.userService.createUser({phone: user.phone, roleId: 3});
                const token = jwt.sign(
                    {id: result.insertId, roleId: 3},
                    Config.auth.secretKey,
                    {expiresIn: Config.auth.expiryInSeconds}
                );
                return await res.json({
                    token,
                    user: {
                        id: result.insertId, roleId: 3
                    },
                    isNewUser: true
                });
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === ErrorCode.otp_expired || e.code === ErrorCode.invalid_creds) {
                    return res.status(HttpCodes.unauthorized).json(e);
                }
                return res.sendStatus(HttpCodes.internal_server_error);
            }
        } catch (e) {
            console.error(`${req.method}: ${req.url}`, e);
            if (e.code === ErrorCode.invalid_creds) {
                return res.status(HttpCodes.unauthorized).send(e);
            }
            res.sendStatus(HttpCodes.internal_server_error);
        }
    }
}
