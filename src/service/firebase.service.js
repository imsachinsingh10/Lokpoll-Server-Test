import * as admin from "firebase-admin";
import path from 'path';

const gcm = require('node-gcm');
const credFilePath = path.resolve('localbol-c5fed-firebase-adminsdk-xe0k3-adf63d7aae.json');
const serviceAccount = require(credFilePath);
import {log} from "./common/logger.service";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://localbol-c5fed.firebaseio.com"
});

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender('AAAAOwz4hOo:APA91bEsyXZCu5KYJY8a5A-EXwLbievInaRaZgzerOBCbp4Dv1yubTtYAUaLBXv7eHTmkf5QB2WObs3ptx-TAZpkSiecJHSR-Z_dKERBUsm15Scrb157mLmVRrlSqcPRqqAZiRUpIMS0');

// Specify which registration IDs to deliver the message to
const regTokens = [
    'd2l21wikn8g:APA91bHiMlY8z947ZaIJvB9iGY23HaIJtkrBYnVeM4abc2nneKZcQoOyGtFyjVhG0NRI8NS3dXwUiLpA1K-V5Irp6GPnsmNjWQm2sMiEn4CGmwEkciJOiU1ZhFDhUC3LLrDSgRctMHNf',
];
// Prepare a message to be sent
const message = {
    data: {key1: 'comment'},
    notification: {
        title: 'Test',
        body: 'Testing Notifications',
    },
    tokens: regTokens
};



export const sendTestMessage = () => {
    admin.messaging().sendMulticast(message)
        .then((response) => {
            log.i('Successfully sent firebase message:', response);
        })
        .catch((error) => {
            log.e('Error sending firebase message:', error);
        });
};

export default class FirebaseService {
    static sendMessage = (message) => {
        return new Promise((resolve, reject) => {
            admin.messaging().sendMulticast(message)
                .then((response) => {
                    log.i('Successfully sent firebase message:', message, response);
                    resolve(true);
                })
                .catch((error) => {
                    log.e('sending error', error);
                    reject(false);
                });
        })
    };
}
export class FirebaseMessage {
    static get PostCreated() {
        return new gcm.Message({
            data: {key1: 'msg1'},
            notification: {
                title: 'Post published',
                body: 'Your post has been published',
                icon: 'icon-gray.jpg'
            }
        })
    }
}

