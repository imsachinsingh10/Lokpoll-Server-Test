import path from 'path';
const ffmpeg = require('hs-node-ffmpeg');
import _ from 'lodash';
import jimp from "jimp";

export const extractThumbnailsMiddleware = async (req, res, next) => {
    if (!_.isEmpty(req.files) && !_.isEmpty(req.files.video)) {
        const length = req.files.video.length;
        for (let i = 0; i < length; i++) {
            const file = req.files.video[i];
            const thumbnail = await extractThumbnailFromVideo(file);
            req.files.video[i] = {...file, thumbnail};
        }
    }

    if (!_.isEmpty(req.files) && !_.isEmpty(req.files.image)) {
        const length = req.files.image.length;
        for (let i = 0; i < length; i++) {
            const file = req.files.image[i];
            const thumbnail = await extractThumbnailFromImage(file);
            req.files.image[i] = {...file, thumbnail};
        }
    }
    next()
    // res.send('ok');
};

export const extractThumbnailFromVideo = async (file) => {
    // console.log(file);
    const destination = path.resolve('uploads', 'thumbnails');
    try {
        const video = await new ffmpeg(file.path);
        const dim = video.metadata.video.resolution;
        const files = await video.fnExtractFrameToJPG(destination, {
            number: 1,
            size: `${dim['w']}x${dim['h']}`,
            start_time: video.metadata.duration.seconds / 10,
            duration_time: 1
        });
        const filePath = files[0];
        return {
            filename: path.parse(filePath).base,
            path: filePath
        };
    } catch (e) {
        console.log('e', e);
    }
};

export const extractThumbnailFromImage = async (file) => {
    // console.log(file);
    const destination = path.resolve('uploads', 'thumbnails', file.filename);
    try {
        const image = await jimp.read(file.path);
        // console.log('image height', image.bitmap.height);
        image.resize(320, jimp.AUTO);
        image.quality(60);
        await image.writeAsync(destination);
        return {
            filename: file.filename,
            path: destination
        };
    } catch (e) {
        console.log('error', e);
    }
};
