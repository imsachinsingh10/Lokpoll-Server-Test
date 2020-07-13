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
import {JudgeService} from "../service/judge.service";

export class JudgeController {
    constructor() {
        this.judgeService = new JudgeService();
    }

    async checkIfJudgeRegistered(judege) {
        const _judege = await this.judgeService.getJudgeByEmail(judege);
        if (
            (!judege.id && !_.isEmpty(_judege))
            || (judege.id && !_.isEmpty(_judege) && judege.id !== _judege.id)
        ) {
            throw {
                message: `judge already registered with email ${judege.email}`,
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
        if (user.subscribed === 'true' || user.subscribed === true) {
            _user.subscribed = true;
        } else if (user.subscribed === 'false' || user.subscribed === false) {
            _user.subscribed = false;
        }
        return this.userService.updateUser(_user);
    }

    async updateHobbies(hobbies, userId) {
        if (_.isEmpty(hobbies)) {
            return
        }
        await this.userService.updateHobbies(hobbies, userId)
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



}
