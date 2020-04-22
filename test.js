import {SMSService} from "./src/service/common/sms.service";

SMSService.sendSMS("8630694779", "1234").then(console.log).catch(console.log);