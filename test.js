import {SMSService} from "./src/service/common/sms.service";
import path from 'path';
import Utils from "./src/service/common/utils";
import {UserService} from "./src/service/user.service";
import {UserNetworkService} from "./src/service/user-network.service";
import {UserController} from "./src/controller/user.controller";
import moment from "moment";
import {PostService} from "./src/service/post.service";
import {log} from "./src/service/common/logger.service";

main();

async function main() {
    const d = '2020-10-12';
    console.log('utc date', moment.utc(),
        moment.utc()
            .add('days', 7)
            .format('YYYY-MM-DD HH:mm:ss'));
    process.exit(0)
}
