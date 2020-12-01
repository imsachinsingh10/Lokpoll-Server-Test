import _ from 'lodash';
import {AppCode} from '../enum/app-code';
import {SMPlatform} from '../enum/common.enum';
import {PostContentType} from '../enum/post-content-type';
import {ErrorModel} from '../model/common.model';

export class RequestValidator {
    static externalShare(req) {
        if (_.isEmpty(req.body)) {
            throw {
                message: `req body is empty`,
                code: AppCode.invalid_request
            }
        }
        const {postId, platform} = req.body;
        if (!(postId > 0) || _.isEmpty(platform)) {
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

    static validateAddPostRequest(req) {
        const reqBody = req.body;
        let message = ''
        const requiredFields = ['contentType', 'moodId']
        if (_.isEmpty(reqBody.contentType)) {
            message = 'contentType is missing'
        } else if (reqBody.contentType === PostContentType.CustomText && _.isEmpty(reqBody.customText)) {
            message = 'text is missing'
        } else if (_.isEmpty(reqBody.description) &&
            _.isEmpty(reqBody.link) &&
            _.isEmpty(req.files) &&
            _.isEmpty(reqBody.poll) &&
            reqBody.contentType !== PostContentType.CustomText) {
            message = 'At least one of these is required [description|link|files|poll]'
        }
        let parsedCustomText;
        try {
            parsedCustomText = JSON.parse(reqBody.customText);
        } catch (e) {
            message = 'customText is not valid'
        }
        const colorRegEx = /^#[a-fA-F0-9]{6}$/;
        if (parsedCustomText.textColor) {
            if (!colorRegEx.test(parsedCustomText.textColor)) {
                message = 'textColor is invalid'
            }
        }
        if (parsedCustomText.textBgColor) {
            if (!colorRegEx.test(parsedCustomText.textBgColor)) {
                message = 'textBgColor is invalid'
            }
        }
        if (!_.isEmpty(message)) {
            throw new ErrorModel(AppCode.invalid_request, message);
        }
    }
}
