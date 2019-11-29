import {HttpCodes} from "../enum/http-codes";
import {ErrorCode} from "../enum/error-codes";
import {ErrorModel} from "../model/error.model";

export default class Validator {
    static isPhoneValid(phone, throwException = true) {
        const reg = /^\d{10}$/;
        if (reg.test(phone)) {
            return true;
        }
        if (throwException) {
            throw new ErrorModel(ErrorCode.invalid_phone, 'Please enter valid phone')
        }
        return false;
    }

    static isOTPValid(otp, throwException = true) {
        const reg = /^\d{4}$/;
        if (reg.test(otp)) {
            return true;
        }
        if (throwException) {
            throw new ErrorModel(ErrorCode.invalid_otp, 'Please enter valid OTP')
        }
        return false;
    }
}
