import * as admin from "firebase-admin";
import path from 'path';

const gcm = require('node-gcm');
const credFilePath = path.resolve('localbol-c5fed-firebase-adminsdk-xe0k3-350fe21847.json');
console.log('cred file path', credFilePath);
const serviceAccount = require(credFilePath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://localbol-c5fed.firebaseio.com/"
});

// Set up the sender with your GCM/FCM API key (declare this once for multiple messages)
const sender = new gcm.Sender('AAAAOwz4hOo:APA91bEsyXZCu5KYJY8a5A-EXwLbievInaRaZgzerOBCbp4Dv1yubTtYAUaLBXv7eHTmkf5QB2WObs3ptx-TAZpkSiecJHSR-Z_dKERBUsm15Scrb157mLmVRrlSqcPRqqAZiRUpIMS0');

// Specify which registration IDs to deliver the message to
const regTokens = [
    'eOBn6-tP4SY2JPbP-RyL7R:APA91bHsZu6QCDz3qO1Kvg319Ne9IPuYisjznhPiglE8v5GlbH7K3hh_ooUjctBdJGUw2Ra4x2a01A1FZgC5efFUQZveHadDp4KNN9PInZzuT7138LsSXLNuk1MSk2ZMhvDPi17ClBvX',
];
// Prepare a message to be sent
const message = {
    data: {key1: 'msg1'},
    notification: {
        title: 'New fund created',
        body: 'Himanshu just created new fund',
    },
    tokens: regTokens
};

export const sendTestMessage = () => {
    admin.messaging().sendMulticast(message)
        .then((response) => {
            console.log('Successfully sent firebase message:', response);
        })
        .catch((error) => {
            console.log('Error sending firebase message:', error);
        });
};

export default class FirebaseService {
    static sendMessage = (message) => {
        return new Promise((resolve, reject) => {
            admin.messaging().sendMulticast(message)
                .then((response) => {
                    console.log('Successfully sent firebase message:', message, response);
                    resolve(new DataBagModel(AppCode.message_sent, "", response));
                })
                .catch((error) => {
                    console.error('sending error', error);
                    reject(new DataBagModel(AppCode.sending_message_failed))
                });
        })
    };
}
