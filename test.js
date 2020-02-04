import Utils from "./src/service/common/utils";
import {extractThumbnailFromImage} from "./src/middleware/thumbnail.middleware";
import path from 'path';

const file = {
    filename: 'abcd.jpeg',
    path: path.resolve('uploads', 'abcd.jpeg')
};

extractThumbnailFromImage(file).then(result => {
    console.log('result', result);
});

console.log(Utils.getNumericDate());
