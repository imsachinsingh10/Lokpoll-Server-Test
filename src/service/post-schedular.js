import cron from 'node-cron';
import moment from 'moment';
import {SqlService} from "./sql/sql.service";
import Utils from "./common/utils";
import _ from 'lodash';
import {log} from "./common/logger.service";

export class PostScheduler {

    static task;

    constructor() {
        PostScheduler.task = cron.schedule("0 * * * *", async () => {
            const postIds = await this.getEligiblePostToPublish();
            if (_.isEmpty(postIds)) {
                log.i('No Post To Publish');
                return;
            }
            const result = await this.publishPost(postIds);
            log.i('Post Published', postIds);
        }, {
            scheduled: false
        });
    }

    start() {
        log.i('Post Scheduler Started')
        PostScheduler.task.start();
    }

    stop() {
        PostScheduler.task.stop();
    }

    async getEligiblePostToPublish() {
        const today = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        const query = `select id, description, publishDate from post where publishDate <= '${today}' and isPublished = 0;`;
        const posts = await SqlService.executeQuery(query);
        const postIds = posts.map(p => p.id);
        return postIds;
    }

    async publishPost(postIds) {
        const query = `update post set isPublished = 1 where id in ${Utils.getRange(postIds)}`
        return SqlService.executeQuery(query);
    }

    validate() {
        console.log(cron.validate('59 * * * *'))
    }
}

// new PostScheduler().getEligiblePostToPublish().then((postIds) => {
//     console.log('postIds', postIds);
// });
