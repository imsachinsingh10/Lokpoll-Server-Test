import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";
import {UserNetworkService} from "./src/service/user-network.service";
import {UserController} from "./src/controller/user.controller";

main();

async function main() {
    const totalCoins = await new UserNetworkService().getTotalCoins();
    console.log('filtered', totalCoins.sum);
}


/*



* */
