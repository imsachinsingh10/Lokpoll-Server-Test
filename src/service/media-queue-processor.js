import {PostController} from "../controller/post.controller";
import {extractThumbnailsMiddleware} from "../middleware/thumbnail.middleware";
import {log} from "./common/logger.service";

process.on('message', async (res) => {
    // log.i('processor started');
    let {files, postId, userId, commentId} = JSON.parse(res);
    const postController = new PostController();

    if (files.video || files.image) {
        files = await extractThumbnailsMiddleware(files);
    }
    await postController.uploadPostMedia(files, postId, commentId);
    await postController.notifyUser(userId, postId);
    process.disconnect();
});

process.on('uncaughtException', function (err) {
    log.e("Error happened: " + err.message + "\n" + err.stack + ".\n");
    log.e("Gracefully finish the routine.");
});
