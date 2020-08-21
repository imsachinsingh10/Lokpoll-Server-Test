import * as _ from 'lodash';
import {AppCode} from "../enum/app-code";
import {MoodCategoryService} from "../service/mood-category.service";
import {MoodService} from "../service/mood.service";

export class MoodCategoryController {
    constructor() {
        this.moodCategoryService = new MoodCategoryService();
        this.moodService = new MoodService();
    }

    async checkIfCategoryRegistered(category) {
        const _categories = await this.moodCategoryService.getMoodCategoryByName(category);
        if (!_.isEmpty(_categories)) {
            throw {
                message: `mood category already added with name ${category.name_en}`,
                code: AppCode.duplicate_entity
            }
        }
    }

    async getAllMoodCategories(reqBody) {
        const categories = await this.moodCategoryService.getAllMoodCategories(reqBody);
        const moods = await this.moodService.getAllMoods({});
        const moodGrouped = _.groupBy(moods, 'categoryId');
        // const result = [];
        // for (const cId in moodGrouped) {
        //     const category = categories.filter(c => c.id === cId);
        //     category.moods = moodGrouped[cId];
        //     result.push({category})
        // }
        //
        categories.forEach((category) => {
            // category.moods = moodGrouped[category.id];
        })
        return categories;
    }

}
