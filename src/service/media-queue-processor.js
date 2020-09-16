import {PostController} from "../controller/post.controller";
import {ProductService} from "./product.service";
import {extractThumbnailsMiddleware} from "../middleware/thumbnail.middleware";
import {log} from "./common/logger.service";

process.on('message', async (res) => {
    // log.i('processor started');
    let {files, postId, productTags, userId, commentId} = JSON.parse(res);
    const postController = new PostController();
    const productService = new ProductService();

    if (files.video || files.image) {
        files = await extractThumbnailsMiddleware(files);
    }
    await productService.addTags(productTags);
    await postController.uploadPostMedia(files, postId, commentId);
    await postController.notifyUser(userId, postId);
    process.disconnect();
});

process.on('uncaughtException', function (err) {
    log.e("Error happened: " + err.message + "\n" + err.stack + ".\n");
    log.e("Gracefully finish the routine.");
});
