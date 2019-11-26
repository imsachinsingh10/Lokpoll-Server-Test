import * as _ from 'lodash';

import {Config} from '../config'
import {ErrorCode} from "../enum/error-codes";
import {PostService} from "../service/post.service";
import {table} from "../enum/table";

export class PostController {
    constructor() {
        this.MoodService = new PostService();
    }

}
