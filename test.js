import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";
import {UserNetworkService} from "./src/service/user-network.service";
import {UserController} from "./src/controller/user.controller";
import moment from "moment";

main();

async function main() {
    // const totalCoins = await new UserNetworkService().getTotalCoins();
    console.log('filtered', moment.utc().format('YYYY-MM-DD'));
    bingo().then(null);
    // process.exit(0);
}

async function bingo() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('ohh yes');
            console.log('ohh yes')
        }, 1000);
    })
}
