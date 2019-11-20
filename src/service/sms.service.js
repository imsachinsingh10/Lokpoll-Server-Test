import axios from 'axios';
import {Config} from "../config";
import {Environment} from "../enum/common";

export class SMSService {

	static sendSMS = async (phone, otp) => {
		if (Config.env === Environment.dev) {
			return true;
		}
		const msg = `${otp} is the OTP to verify your mobile number and it is valid for 15 mins.`;
		const userId = '2000187956';
		const password = 'Y3JXJpz0w';
		const url = `https://enterprise.smsgupshup.com/GatewayAPI/rest?method=SendMessage&send_to=${phone}&msg=${msg}&msg_type=TEXT&userid=${userId}&auth_scheme=plain&password=${password}&v=1.1&format=text`;
		try {
			const result = await axios.get(url);
			console.log(' +++++++ sms result +++++++++ ', result);
			return true;
		} catch (e) {
			console.log('error while sending message', e);
			return false;
		}
	};

}
