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
    const postService = new PostService();
    const polls = await postService.getPostPolls([1075]);
    process.exit(0)
}
