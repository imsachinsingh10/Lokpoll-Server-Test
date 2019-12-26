import {AppCode} from "../../enum/app-code";
import {ErrorModel} from "../../model/common.model";
import {PostReaction} from "../../enum/common.enum";

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

    static isValidPostReactionType(type) {
        for (let key in PostReaction) {
            if (PostReaction[key] === type) {
                return true;
            }
        }
        return false
    }
}
