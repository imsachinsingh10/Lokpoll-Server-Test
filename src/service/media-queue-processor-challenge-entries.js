import Utils from "./common/utils";
import {extractThumbnailsMiddleware} from "../middleware/thumbnail.middleware";
import {ChallengeController} from "../controller/challenge.controller";

process.on('message', async (res) => {
    let {files, challengeEntryId, productTags, userId, commentId} = JSON.parse(res);
    const challengeController = new ChallengeController();

    if (files.video || files.image) {
        files = await extractThumbnailsMiddleware(files);
    }
   // await productService.addTags(productTags);
    await challengeController.uploadChallengeEntriesMedia(files, challengeEntryId, commentId);
    //await ChallengeController.notifyUser(userId, challengeEntryId);
    process.disconnect();
});

process.on('uncaughtException', function (err) {
    log.e("Error happened: " + err.message + "\n" + err.stack + ".\n");
    log.e("Gracefully finish the routine.");
});
