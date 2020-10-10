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
import Utils from "../service/common/utils";
import {UserNetworkService} from "../service/user-network.service";

export class UserNetworkController {
    constructor() {
        this.userNetworkService = new UserNetworkService();
    }

    async getNetwork(userId) {
        let descendants = await this.userNetworkService.getDescendants(userId);
        const firstDownLine = descendants[0];
        if (firstDownLine && firstDownLine.level > 1) {
            let x = firstDownLine.level - 1;
            descendants = descendants.map(n => ({...n, level: n.level - x}))
        }
        let ancestors = await this.userNetworkService.getAncestors(userId);
        let network = [...ancestors ,...descendants];
        if (_.isEmpty(network)) {
            return [];
        }
        network.sort((a, b) => {
            if (a.level < b.level) {
                return -1;
            }
            if (a.level > b.level) {
                return 1;
            }
            return 0;
        })
        network = await this.attachMyRespectInNetwork(userId, network);
        return network;
    }

    async attachMyRespectInNetwork(userId, network) {
        const userIds = network.map(u => u.id);
        const q = `select * from ${table.respect} r 
                    where respectBy = ${userId} and respectFor in ${Utils.getRange(userIds)}`;
        const respects = await SqlService.executeQuery(q);
        if (_.isEmpty(respects)) {
            return network.map(u => ({...u, respectedByMe: false}));
        }

        network.forEach((user) => {
            const respectedByMe = _.find(respects, r => user.id === r.respectFor);
            user.respectedByMe = !_.isEmpty(respectedByMe)
        })

        return network;
    }

    async getCoinSummaryByUser(req) {
        const userId = req.user.id;
        const result = {
            frontLineCount: 0,
            downLineCount: 0,
            currentBalance: 0,
            lifetimeEarning: 0,
            lifetimeBurns: 0,
            lifetimeWinnings: 0,
        };

        const coins = await this.userNetworkService.getTotalCoins(userId);
        result.currentBalance = coins.sum;
        result.lifetimeEarning = coins.sum;
        result.lifetimeBurns = 0;
        result.lifetimeWinnings = 0;

        const network = await this.getNetwork(userId);
        if (!_.isEmpty(network)) {
            const frontLine = network.filter(__ => __.level === 1);
            result.frontLineCount = frontLine.length;

            const downLine = network.filter(__ => __.level === 2);
            result.downLineCount = downLine.length;
        }

        return result;
    }

}
