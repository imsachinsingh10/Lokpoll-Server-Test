import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";
import {UserController} from "./src/controller/user.controller";

main();

async function main() {
    const array = [1, 2, 4];
    const filtered = array.filter(a => a === 5)[0];
    console.log('filtered', filtered);
}


/*



* */
