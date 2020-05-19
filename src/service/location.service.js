import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class LocationService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async addLocation(location) {
        const query = QueryBuilderService.getInsertQuery(table.location, location);
        return SqlService.executeQuery(query);
    }

    async getAllLocations() {
        const query = `select * from ${table.location};`;
        return SqlService.executeQuery(query);
    }

    async updateLocation(location) {
        const condition = `where id = ${location.id}`;
        const query = QueryBuilderService.getUpdateQuery(table.location, location, condition);
        return SqlService.executeQuery(query);
    }

    async deleteLocation(locationId) {
        const query = `delete from ${table.location} where id = ${locationId};`;
        return SqlService.executeQuery(query);
    }

    async getLocationCount() {
        const query = `select count(1) count from ${table.location};`;
        return SqlService.getSingle(query);
    }
}
