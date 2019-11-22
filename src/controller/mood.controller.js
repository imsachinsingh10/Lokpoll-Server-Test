import * as _ from 'lodash';

import {Config} from '../config'
import {ErrorCode} from "../enum/error-codes";
import {MoodService} from "../service/mood.service";
import {table} from "../enum/table";

export class MoodController {
    constructor() {
        this.MoodService = new MoodService();
    }

    async checkIfMoodRegistered(mood) {
        const _moods = await this.MoodService.getMoodByName(mood);
        if (!_.isEmpty(_moods)) {
            throw {
                message: `mood already registered with name ${mood.name}`,
                code: ErrorCode.duplicate_entity
            }
        }
    }

}
