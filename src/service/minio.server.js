import multer from "multer";
const Minio = require('minio');
const fs = require('fs');
import {Config} from '../config'
import _ from "underscore";
import Utils from "./utils";

const bucketConfig = Config.minioBucket;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('./uploads')){
            fs.mkdirSync('./uploads');
        }
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const uploadSingleFileMiddleware = multer({ storage: storage }).single('file');
const uploadMultipleFilesMiddleware = multer({ storage: storage }).array('file', 50);

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
        return new Promise((resolve) => {
            const fileName = Utils.getRandomString(8) + '-' + new Date().getTime() + '-' + file.originalname;
            this.minioClient.fPutObject(bucketConfig.bucket.Asa, fileName, file.path, function (error, etag) {
                if (error) {
                    console.log('error', error);
                    return resolve(error);
                }
                console.log('file.path to delete', file.path);
                fs.unlink(file.path, (err) => {});
                const fileUrl = `${bucketConfig.baseUrl}/${bucketConfig.bucket.Asa}/${fileName}`;
                return resolve({
                    url: fileUrl,
                    name: file.originalname
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
