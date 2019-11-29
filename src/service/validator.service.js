import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {ErrorModel} from "../model/error.model";

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
}
