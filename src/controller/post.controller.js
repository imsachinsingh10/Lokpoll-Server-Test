import * as _ from 'lodash';

import {Config} from '../config'
import {AppCode} from "../enum/app-code";
import {PostService} from "../service/post.service";
import {table} from "../enum/table";

export class PostController {
    constructor() {
        this.MoodService = new PostService();
    }

}
