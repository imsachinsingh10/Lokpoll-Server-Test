import axios from 'axios';
import {Config} from "../../config";
import {Environment} from "../../enum/common.enum";
import * as _ from "lodash";
import {AppCode} from "../../enum/app-code";

export class SMSService {

	static sendTestSMS = () => {
		this.sendSMS('8630694779', '1234')
	}

	static sendSMS = async (phone, otp) => {
		if (_.isEmpty(phone) || phone.length !== 10) {
			throw {
				message: `Please enter valid phone number of 10 digits.`,
				code: AppCode.invalid_phone
			}
		}
		const msg = `${otp} is the OTP to verify your mobile number and it is valid for 15 Mins. LICN Info: FwXZu6s1yHK`;
		const apiKey = '9hcbNtCJ79c-Ystk844Ss6ApaLSUJZ7cPqvEQOvVgE';
		const sender = 'LOCLBL';
		const url = `https://api.textlocal.in/send/?apiKey=${apiKey}&sender=${sender}&numbers=${phone}&message=${msg}`;
		try {
			const result = await axios.get(url);
			log.i('sms result', result.data);
			return true;
		} catch (e) {
			log.e('error while sending message', e);
			return false;
		}
	};

}
