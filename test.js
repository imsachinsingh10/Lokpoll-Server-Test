import {SMSService} from "./src/service/common/sms.service";
import path from 'path';

const text = '[{"latitude":25.6093011,"longitude":85.18454659999999},{"latitude":28.55385279999999,"longitude":77.295553}]';
console.log('parsed', JSON.parse(text));
