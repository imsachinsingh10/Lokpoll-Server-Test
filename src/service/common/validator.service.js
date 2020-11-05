import {AppCode} from "../../enum/app-code";
import {ErrorModel} from "../../model/common.model";
import {PostReaction, PostVoteOption} from "../../enum/common.enum";

export default class Validator {
    static isPhoneValid(phone, throwException = true) {
        const reg = /^\d{10}$/;
        if (reg.test(phone)) {
            return true;
        }
        if (throwException) {
            throw new ErrorModel(AppCode.invalid_phone, 'Please enter valid phone')
        }
        return false;
    }

    static isOTPValid(otp, throwException = true) {
        const reg = /^\d{4}$/;
        if (reg.test(otp)) {
            return true;
        }
        if (throwException) {
            throw new ErrorModel(AppCode.invalid_otp, 'Please enter valid OTP')
        }
        return false;
    }

    static isValidPostVoteType(type) {
        for (let key in PostVoteOption) {
            if (PostVoteOption[key] === type) {
                return true;
            }
        }
        return false
    }

    static isValidPostReactionType(type) {
        for (let key in PostReaction) {
            if (PostReaction[key] === type) {
                return true;
            }
        }
        return false
    }

    static validateRequiredFields(reqBody, req) {
        for (let key in reqBody) {
            const value = reqBody[key];
            if (req && req.user.roleId !== 2)  { // 2 === 'content creator'
                if (key === 'latitude' || key === 'longitude' || key === 'address') {
                    continue;
                }
            }
            if (value === undefined) {
                throw new ErrorModel(AppCode.invalid_request, `${key} is not valid`);
            }
        }
    }
}
