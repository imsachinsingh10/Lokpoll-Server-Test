import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class MoodCategoryService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async createMoodCategory(category) {
        const query = QueryBuilderService.getInsertQuery(table.moodCategory, category);
        return SqlService.executeQuery(query);
    }

    async getMoodCategoryByName(category) {
        const query = `select * from ${table.moodCategory} where name_en = '${category.name_en}';`;
        return await SqlService.getSingle(query);
    }

    async getAllMoodCategories(body) {
        let columns = 'm.*';
        let condition = '';
        if (body.languageCode) {
            columns = `m.id, m.imageUrl, m.name_${body.languageCode} name
                        , m.description_${body.languageCode} description`;
            condition = 'where isActive = 1';
        }
        const query = `select ${columns}
	    				from ${table.moodCategory} m
	    				${condition}
	    				order by m.position asc`;
        return SqlService.executeQuery(query);
    }

    async updateMoodCategory(category) {
        const condition = `where id = ${category.id}`;

        const query = QueryBuilderService.getUpdateQuery(table.moodCategory, category, condition);
        return SqlService.executeQuery(query);
    }

    async deleteMoodCategory(categoryId) {
        const q1 = `delete from ${table.moodCategory} where id = ${categoryId};`;
        const q2 = `delete from ${table.mood} where categoryId = ${categoryId};`;
        return SqlService.executeMultipleQueries([q1, q2]);
    }

    async getTotalMoodCategories(data) {
        const query = `select count("id") count
	    				from ${table.moodCategory} u`;
        return SqlService.getSingle(query);
    }
}
