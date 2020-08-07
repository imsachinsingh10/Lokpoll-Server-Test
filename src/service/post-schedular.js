import cron from 'node-cron';

export class PostSchedular {
    start() {
        cron.schedule("* * * * *", function() {
            console.log("running a task every minute");
        });
    }
}
