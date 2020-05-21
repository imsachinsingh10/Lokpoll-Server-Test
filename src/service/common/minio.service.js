import multer from "multer";
import {Config} from '../../config'
import Utils from "./utils";
import {ErrorModel} from "../../model/common.model";
import {AppCode} from "../../enum/app-code";
import {promisify} from 'util';
import {Environment} from "../../enum/common.enum";

const Minio = require('minio');
const fs = require('fs');
const unlink = promisify(fs.unlink);

const bucket = Config.minio.bucket;
let minioConfig = Config.minio.configTest;
let minioBaseUrl = Config.minio.baseUrlTest;
if (Config.env === Environment.prod) {
    minioConfig = Config.minio.configProd;
    minioBaseUrl = Config.minio.baseUrlProd;
}
const policy = JSON.stringify({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [`arn:aws:s3:::${bucket.root}/*`]
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

export const uploadFile = multer({storage: storage}).single('file');
const uploadFiles = multer({storage: storage}).array('file', 50);

export const uploadPostMediaMiddleware = multer({storage: storage})
    .fields([
        {name: 'image', maxCount: 50},
        {name: 'video', maxCount: 50},
        {name: 'audio', maxCount: 50},
    ]);

export const uploadProfilePictures = multer({storage})
    .fields([
        {name: 'image', maxCount: 1},
        {name: 'bgImage', maxCount: 1},
        {name: 'audio', maxCount: 1},
    ]);

// export const uploadFile = multer({storage})
//     .fields([
//         {name: 'file', maxCount: 1}
//     ]);

export class MinIOService {
    constructor() {
        this.minioClient = new Minio.Client({
            ...minioConfig,
            useSSL: false,
        });
    }

    uploadMiddleware(type) {
        return type === 'single' ? uploadFile : uploadFiles;
    }

    async uploadFile(file) {
        console.log('uploading file', file);
        return new Promise(async (resolve) => {
            if (!file) {
                return resolve({
                    url: null,
                })
            }

            await this.createBucket(bucket.root);
            let bucketPath = bucket.moodIcons;
            const fileUrl = await this.uploadFileToMinio(bucketPath, file.filename, file.path);
            unlink(file.path);

            return resolve({
                url: fileUrl,
                originalName: file.originalName,
            });
        })
    }

    async uploadPostMedia(file, mediaType) {
        return new Promise(async (resolve) => {
            if (!file) {
                return resolve({
                    url: null,
                    type: mediaType,
                })
            }

            await this.createBucket(bucket.root);
            let bucketPath = this.getBucketPath(mediaType);
            const fileUrl = await this.uploadFileToMinio(bucketPath, file.filename, file.path);
            unlink(file.path);

            let thumbnailUrl;
            if (file.thumbnail) {
                const thumbnail = file.thumbnail;
                bucketPath = this.getBucketPath('thumbnail');
                thumbnailUrl = await this.uploadFileToMinio(bucketPath, thumbnail.filename, thumbnail.path);
                unlink(thumbnail.path);
            }

            return resolve({
                url: fileUrl,
                type: mediaType,
                originalName: file.originalName,
                thumbnailUrl
            });
        })
    }

    async uploadProfilePicture(file, type) {
        return new Promise(async (resolve) => {
            if (!file) {
                return resolve({url: null, type})
            }

            await this.createBucket(bucket.root);
            const url = await this.uploadFileToMinio(bucket.user, file.filename, file.path);

            unlink(file.path);
            if (type === 'image') {
                return resolve({imageUrl: url});
            } else if (type === 'bgImage') {
                return resolve({bgImageUrl: url});
            } else if (type === 'audio') {
                return resolve({audioUrl: url});
            }
        })
    }

    async uploadFileToMinio(bucketPath, fileName, filePath) {
        const bucketName = bucket.root;
        return new Promise((resolve, reject) => {
            this.minioClient.fPutObject(bucketName, bucketPath + fileName, filePath, function (error, etag) {
                if (error) {
                    console.log('+++++++ s3 error ++++++', error);
                    return reject(new ErrorModel(AppCode.s3_error, error.S3Error));
                }
                const fileUrl = `${minioBaseUrl}/${bucketName}/${bucketPath + fileName}`;
                return resolve(fileUrl)
            });
        })
    }

    async createBucket(bucketName) {
        return new Promise((resolve, reject) => {
            this.minioClient.bucketExists(bucketName, (error, exists) => {
                if (error && error.code !== "UnknownError") {
                    console.log('+++++++ check if bucket exists ++++++', error);
                    return reject(new ErrorModel(AppCode.s3_error, error.code));
                }
                if (exists) {
                    return resolve(new ErrorModel(AppCode.bucket_exists))
                }
                this.minioClient.makeBucket(bucketName, 'in-west-1', (err) => {
                    if (err && err.code !== 'BucketAlreadyOwnedByYou') {
                        console.log('+++++++ create bucket ++++++', err);
                        return reject(new ErrorModel(AppCode.s3_error, err.S3Error));
                    }
                    this.minioClient.setBucketPolicy(bucketName, policy, (err1, result) => {
                        if (err1) {
                            console.log('error while setting bucket policy', err1);
                            return reject(new ErrorModel(AppCode.s3_error, err1.S3Error));
                        }
                        return resolve(new ErrorModel(AppCode.bucket_exists))
                    });
                })
            })
        })
    }

    getBucketPath(mediaType) {
        if (mediaType === 'image') {
            return bucket.postImages;
        } else if (mediaType === 'video') {
            return bucket.postVideos;
        } else if (mediaType === 'thumbnail') {
            return bucket.postThumbnails
        } else {
            return bucket.other
        }
    }

}
