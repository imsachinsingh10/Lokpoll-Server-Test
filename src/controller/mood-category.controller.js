import * as _ from 'lodash';
import {AppCode} from "../enum/app-code";
import {MoodCategoryService} from "../service/mood-category.service";
import {MoodService} from "../service/mood.service";
import {log} from "../service/common/logger.service";

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
        const moods = await this.moodService.getAllMoods(reqBody);
        const moodGrouped = _.groupBy(moods, 'categoryId');

        categories.forEach((category) => {
            category.moods = moodGrouped[category.id];
        })
        return categories;
    }

}
