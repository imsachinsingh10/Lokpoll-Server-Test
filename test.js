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
    const obj =  {
        "text" : "Hello World!!!",
        "textHAlign" : "center",
        "textVAlign" : "center",
        "textWeight" : "normal",
        "fontFamily" : "Roboto",
        "textSize" : "20",
        "textColor" : "#ffffff",
        "textBgColor" : "#ffffff"
    }
    console.log('sf', JSON.stringify(obj))
    process.exit(0)
}
