import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import * as _ from 'lodash';

export class ProductService {

    async getTags() {
        const query = `select * from ${table.productTag};`;
        const tags = await SqlService.executeQuery(query);
        if (_.isEmpty(tags)) {
            return [];
        }
        return tags.map((tag) => tag.name);
    }

    async addTags(tags) {
        if (_.isEmpty(tags)) {
            return;
        }
        const _tags = tags.map(tag => ({name: tag}));
        let query = QueryBuilderService.getMultiInsertQuery(table.productTag, _tags);
        query = query.replace(/;/, ` on duplicate key update name = name;`);
        return SqlService.executeQuery(query);
    }

}
