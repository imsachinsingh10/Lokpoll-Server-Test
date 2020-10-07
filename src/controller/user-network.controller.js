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

export class UserNetworkController {
    constructor() {
        this.userService = new UserService();
    }

    async checkIfUserRegistered(user) {
        const _user = await this.userService.getUserByEmail(user);
        if (
            (!user.id && !_.isEmpty(_user))
            || (user.id && !_.isEmpty(_user) && user.id !== _user.id)
        ) {
            throw {
                message: `user already registered with email ${user.email}`,
                code: AppCode.duplicate_entity
            }
        }
    }

}
