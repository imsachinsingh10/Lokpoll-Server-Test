import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";

export class MoodService {
    constructor() {
        this.queryBuilderService = new QueryBuilderService();
    }

    async getMoodByName(mood) {
        const query = `select * from ${table.mood} where en = '${mood.en}';`;
        return await SqlService.getSingle(query);
    }

    async createMood(mood) {
        const query = QueryBuilderService.getInsertQuery(table.mood, mood);
        return SqlService.executeQuery(query);
    }

    async createSubMoods(subMoodsData) {
        const query = QueryBuilderService.getMultiInsertQuery(table.subMood, subMoodsData);
        return SqlService.executeQuery(query);
    }

    async getAllMoods(body) {
        let columns = 'm.*';
        if (body.languageCode) {
             columns = `m.id, m.imageUrl, m.${body.languageCode} name, m.color`;
        }
        const query = `select ${columns}
	    				from ${table.mood} m
	    				order by id desc`;
        return SqlService.executeQuery(query);
    }

    async getSubMoodsByMoodId(data) {
        console.log(data);
        const query = `select m.name ,m.id ,m.moodId
	    				from ${table.subMood} m
	    				where moodId = ${data.moodId}
	    				order by id desc`;
        return SqlService.executeQuery(query);
    }

    async updateMood(mood) {
        console.log('mood', mood);
        const condition = `where id = ${mood.id}`;

        const query = QueryBuilderService.getUpdateQuery(table.mood, mood, condition);
        return SqlService.executeQuery(query);
    }

    async deleteMood(moodId) {
        const query = `delete from ${table.mood} where id = ${moodId};`;
        return SqlService.executeQuery(query);
    }

    async getTotalMoods(data) {
        const query = `select count("id") totalMoods
	    				from ${table.mood} u`;
        return SqlService.getSingle(query);
    }
}
