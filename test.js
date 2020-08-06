import {SMSService} from "./src/service/common/sms.service";
import path from 'path';

const text = 'j;alsdf j;l https://youtu.be/atcqKyQgmVo his f';
if (text.indexOf('www.youtube.com') > -1 || text.indexOf('youtu.be') > -1) {
    const parts = text.split(' ');
    console.log('parts', parts);
    for (let part of parts) {

    }
}
