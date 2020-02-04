import Utils from "./common/utils";
import {PostController} from "../controller/post.controller";
import {ProductService} from "./product.service";
import {extractThumbnailsMiddleware} from "../middleware/thumbnail.middleware";

process.on('message', async (res) => {
    let {files, postId, productTags, userId} = JSON.parse(res);
    const postController = new PostController();
    const productService = new ProductService();

    files = await extractThumbnailsMiddleware(files);
    await postController.uploadPostMedia(files, postId);
    await productService.addTags(productTags);
    await postController.notifyUser(userId, postId);
    process.disconnect();
});

process.on('uncaughtException', function (err) {
    console.log("Error happened: " + err.message + "\n" + err.stack + ".\n");
    console.log("Gracefully finish the routine.");
});