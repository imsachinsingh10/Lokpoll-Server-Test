import {Config} from '../config'
import {QueryBuilderService} from "./base/querybuilder.service";
import {SqlService} from "./base/sql.service";
import * as _ from 'lodash';
import {AppCode} from "../enum/app-code";
import {table, dbview} from "../enum/table";

export class ProfileTypeService {
    constructor() {
    }

    async getAllProfileTypes() {
        return SqlService.getTable(table.profileType, 0);
    }
}
