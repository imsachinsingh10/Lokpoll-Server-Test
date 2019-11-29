import {QueryBuilderService} from "./querybuilder.service";
import {SqlService} from "./sql.service";
import {dbview, table} from "../enum/table";
import * as _ from 'lodash';
import Utils from "./utils";
import {AppCode} from "../enum/app-code";

export class LanguageService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async getLanguages() {
        const query = `select id, name, code, translation from ${table.language} where isActive = 1;`;
        return SqlService.executeQuery(query);
    }

}
