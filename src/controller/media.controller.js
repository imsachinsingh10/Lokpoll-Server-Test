import {promisify} from 'util';
import {log} from "../service/common/logger.service";

const fs = require('fs');
const path = require('path');
const readFile = promisify(fs.readFile);

export class MediaController {

    async mediaPlay(req, res) {
        const file_name = 'a.mp4';

        try {
            const file_data = await readFile(path.resolve('uploads', file_name));
            this.streamVideoFile(req, res, file_data);
        } catch (e) {
            return res.status(404).json({
                error: 'No such file found'
            });
        }
    }

    async getFile(file_name, callback) {

        fs.readFile(path.resolve('uploads', file_name), callback);
    }

    async streamVideoFile(req, res, video_file) {
        const path = 'uploads/a.mp4';
        const total = video_file.length;

        //const range = req.headers.range;
        const range = "bytes=48431104- 49615886";
        if (range) {
            const positions = range.replace(/bytes=/, "").split("-");
            const start = parseInt(positions[0], 10);
            const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            const chunksize = (end - start) + 1;
            // res.writeHead(206, {
            //     "Content-Range": "bytes " + start + "-" + end + "/" + total,
            //     "Accept-Ranges": "bytes",
            //     "Content-Length": chunksize,
            //     "Content-Type": "video/mp4"
            // });
            //const video = (video_file.slice(0));
            const file = fs.createReadStream(path, {start: start, end: end});
            res.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + total);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Content-Length", String(chunksize));
            res.setHeader("Content-Type", "video/mp4");
           // res.end(video_file.slice(start, end + 1), "binary");
            console.log("video chunk",start);
          // res.send(video);
            file.pipe(res);
        } else {
           // res.writeHead(200, {'Content-Length': total, 'Content-Type': 'video/mp4'});
            res.setHeader("Content-Range", total);
            res.setHeader("Content-Type", "video/mp4");
            fs.createReadStream(path).pipe(res);
        }

    }

}
