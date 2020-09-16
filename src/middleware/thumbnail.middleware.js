import path from 'path';
const ffmpeg = require('hs-node-ffmpeg');
import _ from 'lodash';
import jimp from "jimp";

export const extractThumbnailsMiddleware = async (files, res, next) => {
    if (!_.isEmpty(files) && !_.isEmpty(files.video)) {
        const length = files.video.length;
        for (let i = 0; i < length; i++) {
            const file = files.video[i];
            const thumbnail = await extractThumbnailFromVideo(file);
            files.video[i] = {...file, thumbnail};
        }
    }

    if (!_.isEmpty(files) && !_.isEmpty(files.image)) {
        const length = files.image.length;
        for (let i = 0; i < length; i++) {
            const file = files.image[i];
            const thumbnail = await extractThumbnailFromImage(file);
            files.image[i] = {...file, thumbnail};
        }
    }
    return files;
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
        log.e('', e);
    }
};

export const extractThumbnailFromImage = async (file) => {
    // console.log(file);
    const destination = path.resolve('uploads', 'thumbnails', file.filename);
    try {
        const image = await jimp.read(file.path);
        // console.log('image height', image.bitmap.data.length);
        image.resize(420, jimp.AUTO);
        image.quality(60);
        await image.writeAsync(destination);
        return {
            filename: file.filename,
            path: destination
        };
    } catch (e) {
        log.e('thumbnail error', e);
    }
};
