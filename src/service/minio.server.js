import multer from "multer";
const Minio = require('minio');
const fs = require('fs');
import {Config} from '../config'
import _ from "underscore";
import Utils from "./utils";
import {ErrorModel} from "../model/error.model";
import {AppCode} from "../enum/app-code";

const bucketConfig = Config.minioBucket;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('./uploads')){
            fs.mkdirSync('./uploads');
        }
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        console.log('file', file);
        cb(null, Utils.getRandomString(8, {specialChars: false}) + '-' + new Date().getTime() + '-' + file.originalname);
    }
});

const uploadSingleFileMiddleware = multer({ storage: storage }).single('file');
const uploadMultipleFilesMiddleware = multer({ storage: storage }).array('file', 50);
const uploadImageMiddleware = multer({ storage: storage }).array('image', 50);
const uploadVideoMiddleware = multer({ storage: storage }).array('image', 50);

export class MinIOService {
    constructor() {
        this.minioClient = new Minio.Client({
            ...Config.minio,
            useSSL: false,
        });
    }

    uploadMiddleware(type) {
        return type === 'single' ? uploadSingleFileMiddleware : uploadMultipleFilesMiddleware;
    }

    async uploadFile(file) {
        console.log('file to upload ++++++++ ', file);
        return new Promise((resolve) => {
            if (!file) {
                return resolve({
                    url: null
                })
            }
            const path = './uploads/' + file.filename;
            this.minioClient.fPutObject(bucketConfig.bucket.Asa, file.filename, path, function (error, etag) {
                if (error) {
                    console.log('error', error);
                    return resolve(error);
                }
                console.log('file.path to delete', file.path);
                fs.unlink(file.path, (err) => {});
                const fileUrl = `${bucketConfig.baseUrl}/${bucketConfig.bucket.Asa}/${file.filename}`;
                return resolve({
                    url: fileUrl,
                    type: Utils.getMediaType(file.mimetype)
                })
            });
        })
    }

    async uploadFiles(req) {
        const promises = [];
        _.forEach(req.files, file => {
            const p = this.uploadFile({name: file.originalname, path: file.path});
            promises.push(p);
        });
        return await Promise.all(promises);
    }
}
