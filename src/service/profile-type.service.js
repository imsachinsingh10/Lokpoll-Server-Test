import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class ProfileTypeService {
    constructor() {
    }

    async getAllProfileTypes() {
        return SqlService.getTable(table.profileType, 0);
    }
}
