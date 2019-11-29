import * as _ from 'lodash';
import {Config} from '../config'
import {AppCode} from "../enum/app-code";
import {UserService} from "../service/user.service";
import {table, dbview} from "../enum/table";
import {CopyMeService} from "../service/$copyme.service";

export class CopyMeController {
    constructor() {
        this.copyMeService = new CopyMeService();
    }

    async test() {

    }
}
