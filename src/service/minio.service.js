import multer from "multer";

const Minio = require('minio');
const fs = require('fs');
import {Config} from '../config'
import _ from "underscore";
import Utils from "./utils";
import {ErrorModel} from "../model/error.model";
import {AppCode} from "../enum/app-code";

const bucketConfig = Config.minioBucket;
const policy = JSON.stringify({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [`arn:aws:s3:::${bucketConfig.bucket.root}/*`]
        }
    ]
});

const getFileName = (req, file, cb) => {
    cb(null, Utils.getRandomString(8, {specialChars: true}) + '-' + new Date().getTime() + '-' + file.originalname);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
        cb(null, './uploads');
    },
    filename: getFileName
});

const uploadSingleFileMiddleware = multer({storage: storage}).single('file');
const uploadMultipleFilesMiddleware = multer({storage: storage}).array('file', 50);

export const uploadPostMediaMiddleware = multer({storage: storage})
    .fields([
        {name: 'image', maxCount: 50},
        {name: 'video', maxCount: 50},
        {name: 'thumbnail', maxCount: 50},
    ]);
export const uploadProfilePictures = multer({storage})
    .fields([
        {name: 'image', maxCount: 1},
        {name: 'bgImage', maxCount: 1},
    ]);

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

    async uploadPostMedia(file, mediaType) {
        return new Promise(async (resolve) => {
            if (!file) {
                return resolve({
                    url: null,
                    type: mediaType,
                })
            }

            await this.createBucket(bucketConfig.bucket.root);
            let bucketPath = this.getBucketPath(mediaType);
            const fileUrl = await this.uploadFileToMinio(bucketPath, file.filename, file.path);

            await fs.unlink(file.path, console.log);
            return resolve({
                url: fileUrl,
                type: mediaType,
                originalName: file.originalName
            });
        })
    }

    async uploadProfilePicture(file, type) {
        return new Promise(async (resolve) => {
            if (!file) {
                return resolve({url: null, type})
            }

            await this.createBucket(bucketConfig.bucket.root);
            const url = await this.uploadFileToMinio(bucketConfig.bucket.user, file.filename, file.path);

            await fs.unlink(file.path, console.log);
            if (type === 'image') {
                return resolve({imageUrl: url});
            } else if (type === 'bgImage') {
                return resolve({bgImageUrl: url});
            }
        })
    }

    async uploadFileToMinio(bucketPath, fileName, filePath) {
        const bucketName = bucketConfig.bucket.root;
        return new Promise((resolve, reject) => {
            this.minioClient.fPutObject(bucketName, bucketPath + fileName, filePath, function (error, etag) {
                if (error) {
                    console.log('+++++++ s3 error ++++++', error);
                    return reject(new ErrorModel(AppCode.s3_error, error.S3Error));
                }
                const fileUrl = `${bucketConfig.baseUrl}/${bucketName}/${bucketPath + fileName}`;
                return resolve(fileUrl)
            });
        })
    }

    async createBucket(bucketName) {
        return new Promise((resolve, reject) => {
            this.minioClient.bucketExists(bucketName, (error, exists) => {
                if (error) {
                    console.log('+++++++ check if bucket exists ++++++', error);
                    throw new ErrorModel(AppCode.s3_error, error.S3Error);
                }
                if (exists) {
                    return resolve(new ErrorModel(AppCode.bucket_exists))
                }
                this.minioClient.makeBucket(bucketName, 'in-west-1', (err) => {
                    if (err && err.code !== 'BucketAlreadyOwnedByYou') {
                        console.log('+++++++ create bucket ++++++', err);
                        throw new ErrorModel(AppCode.s3_error, err.S3Error);
                    }
                    this.minioClient.setBucketPolicy(bucketName, policy, (err1, result) => {
                        if (err1) {
                            console.log('error while setting bucket policy', err1);
                            throw new ErrorModel(AppCode.s3_error, err1.S3Error);
                        }
                        return resolve(new ErrorModel(AppCode.bucket_exists))
                    });
                })
            })
        })
    }

    getBucketPath(mediaType) {
        if (mediaType === 'image') {
            return bucketConfig.bucket.postImages;
        } else if (mediaType === 'video') {
            return bucketConfig.bucket.postVideos;
        } else if (mediaType === 'thumbnail') {
            return bucketConfig.bucket.postThumbnails
        }
    }

}
