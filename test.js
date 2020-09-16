import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";

main();

async function main() {
    const network = await new UserService().getNetwork(34);
    console.log('network', network);
}


/*



* */
