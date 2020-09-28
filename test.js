import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";
import {UserController} from "./src/controller/user.controller";

main();

async function main() {
    const network = await new UserController().getNetwork(41);
    console.log('network', network);
}


/*



* */
