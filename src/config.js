import {Environment} from "./enum/common.enum";

export class Config {

    static env = Environment.test;

    static version = {
        majorRevision: 4,  // (new UI, lots of new features, conceptual change, etc.)
        minorRevision: 1,  // (maybe a change to a search box, 1 feature added, collection of bug fixes)
        bugFixes: 1,  // (Only bug fixes not new feature)
    };

    static dbProd = {
        host: `node39278-localbol-prod.cloudjiffy.net`,
        user: `root`,
        password: `ZDGhxq62647`,
        database: `lokpoll`,
        port: 3306,
        multipleStatements: true
    };

    static dbTest = {
        host: `node39278-localbol-prod.cloudjiffy.net`,
        user: `root`,
        password: `ZDGhxq62647`,
        database: `lokpoll_test`,
        port: 3306,
        multipleStatements: true
    };

    static dbDev = {
        host: `127.0.0.1`,
        user: `root`,
        password: ``,
        database: `lokpoll`,
        multipleStatements: true
    };

    static clientApp = {
        baseUrlProd: 'https://localbol-admin-web.cloudjiffy.net/#',
        baseUrlDev: 'http://test-asa.cloudjiffy.net/#',
        baseUrlLocal: 'http://localhost:3000/#',
    };

    static serverUrl = {
        prod: 'https://localbol-prod.cloudjiffy.net',
        test: 'https://lokpoll-server.cloudjiffy.net',
        dev: 'http://localhost:9003',
        base: ''
    };

    static minio = {
        baseUrlProd: 'https://localbol.cloudjiffy.net',
        baseUrlTest: 'https://common-storage.cloudjiffy.net',
        configProd: {
            port: 80,
            endPoint: 'localbol.cloudjiffy.net',
            accessKey: 'gIHGMfk4z5',
            secretKey: 'zesYt5ZVE0'
        },
        configTest: {
            port: 80,
            endPoint: 'common-storage.cloudjiffy.net',
            accessKey: 'I7hkcdR8S8',
            secretKey: 'ijrvX7CWe0'
        },
        bucket: {
            root: 'lokpoll',
            postImages: 'post/images/',
            postVideos: 'post/videos/',
            postThumbnails: 'post/thumbnails/',
            user: 'user/images/',
            other: 'post/others/',
            moodIcons: 'mood_icons'
        }
    };

    static auth = {
        secretKey: '2c56a05a-da7f-4842-a992-cbce9de1d6ae',
        expiryInSeconds: 3.154e+7
    };

    static sendMail = {
        email: 'projects.aeon@gmail.com',
        password: 'aeonprojects@123'
    };

    static mailSettings = {
        transport: {
            service: 'gmail',
            auth: {
                type: 'oauth2',
                user: 'projects.aeon@gmail.com',
                clientId: '327848032352-rol43hoqb9jds2ppalgnbicaa9ksb21t.apps.googleusercontent.com',
                clientSecret: 'Xr4EI0DhihlutA79oZSKcG-Y',
                accessToken: "ya29.Il-bB53R--AjMM37TN5s6cPTfm8CcNSq6kYlK31wBzgInk8wzHx6vIuPoJXjEp7rPuep3gpXXp6-h1OXdUczGy66w_wskNG79lp3cMufYJ7jiUPu_Deg8pp4L1KMRu2Viw",
                // "scope": "https://mail.google.com/",
                // "token_type": "Bearer",
                // "expires_in": 3600,
                refreshToken: "1//04zRBQM8Qt32VCgYIARAAGAQSNwF-L9IrUN6nBtqAk0Cesj-6UaDb10HE9hOxpOenkJe9M33JHRP-97Ya_QotLdKdVpmsZ2ivhbc"
            },
        }
    };

    static firebase = {
        serverKey: 'AAAAOwz4hOo:APA91bEXIOPMCjB-1r8UumEuGG9z7xHUJLI7FnJfgOaimi8kLO-AGoikhyGjZswyg_P12sbj1AkpkUPjg0zMb3KW_zcWy6m0kt1EncAcFVvk5dt7lof1Ze7eY3dfEcOxhrTowgrxs4h5'
    }
}
