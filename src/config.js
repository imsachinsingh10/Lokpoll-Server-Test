import {Environment} from "./enum/common.enum";

export class Config {

    static env = Environment.dev;

    static dbProd = {
        host: `node23483-asa-server.cloudjiffy.net`,
        user: `root`,
        password: `16hstpssZz`,
        database: `lokpoll`,
        port: 3306,
        multipleStatements: true
    };

    static dbDev = {
        host: `127.0.0.1`,
        user: `root`,
        // password: `root`,
        database: `lokpoll`,
        multipleStatements: true
    };

    static clientApp = {
        baseUrlProd: 'http://test-asa.cloudjiffy.net/#',
        baseUrlDev: 'http://localhost:3000/#',
    };

    static server = {
        baseUrlProd: 'http://asa-server.cloudjiffy.net',
        baseUrlDev: 'http://localhost:9000',
    };

    static minioBucket = {
        baseUrl: 'http://test-storage.cloudjiffy.net',
        bucket: {
            root: 'lokpoll',
            postImages: 'post/images/',
            postVideos: 'post/videos/',
            postThumbnails: 'post/thumbnails/',
            user: 'user/images/',
        }
    };

    static auth = {
        secretKey: '2c56a05a-da7f-4842-a992-cbce9de1d6ae',
        expiryInSeconds: 1000 * 60
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

    static minio = {
        port: 80,
        // endPoint: 'aeon-storage.cloudjiffy.net',
        //         // accessKey: 'BVLC6pGAY6',
        //         // secretKey: 'RLUjMTvwJ4',
        endPoint: 'test-storage.cloudjiffy.net',
        accessKey: 'Vu2RLOswP3',
        secretKey: 'WiJNdwX750'
    };

    static version = {
        majorRevision: 7,  // (new UI, lots of new features, conceptual change, etc.)
        minorRevision: 11,  // (maybe a change to a search box, 1 feature added, collection of bug fixes)
        bugFixes: 15,  // (Only bug fixes not new feature)
    };
}
