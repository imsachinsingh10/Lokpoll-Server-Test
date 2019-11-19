import * as _ from 'lodash';

import {Config} from '../config'
import {ErrorCode} from "../enum/error-codes";
import {UserService} from "../service/user.service";
import {table} from "../enum/table";

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

    async validateAndCheckIfUserRegisteredByPhone(user) {
        const phone = user.phone;
        if (_.isEmpty(phone) || phone.length !== 10) {
            throw {
                message: `Please enter valid phone number of 10 digits.`,
                code: ErrorCode.invalid_phone
            }
        }
        const _users = await this.userService.getUserByPhone(user.phone);
        if (!_.isEmpty(_users)) {
            throw {
                message: `User already registered with phone ${user.phone}.`,
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

    async updatePassword(user) {
        const _user = await this.userService.getUserById(user.id);
        if (user.oldPassword !== _user.password) {
            throw {
                message: 'Please enter correct password!',
                code: ErrorCode.invalid_creds
            }
        }
        user.oldPassword = undefined;
        return this.userService.updateUser(user)
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

}
