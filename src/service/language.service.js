import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class LanguageService {
    constructor() {
    }

    async getLanguages() {
        const query = `select id, name, code, translation from ${table.language} where isActive = 1;`;
        return SqlService.executeQuery(query);
    }

}
