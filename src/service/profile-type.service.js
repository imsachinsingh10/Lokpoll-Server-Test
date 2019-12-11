import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import {ProfileType} from "../enum/common.enum";

export class ProfileTypeService {
    constructor() {
    }

    getAllProfileTypes() {
        return ProfileType
    }
}
