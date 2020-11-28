import _ from 'lodash';
import {AppCode} from '../enum/app-code';
import {SMPlatform} from '../enum/common.enum';

export class RequestValidator {
    static externalShare = (req) => {
        if (_.isEmpty(req.body)) {
            throw {
                message: `req body is empty`,
                code: AppCode.invalid_request
            }
        }
        const {postId, platform} = req.body;
        if (_.isEmpty(postId) || _.isEmpty(platform)) {
            throw {
                message: `postId or platform is missing`,
                code: AppCode.invalid_request
            }
        }
        if (![SMPlatform.Facebook, SMPlatform.Whatsapp].includes(platform)) {
            throw {
                message: `platform is invalid use [facebook|whatsapp]`,
                code: AppCode.invalid_request
            }
        }
    }
}
