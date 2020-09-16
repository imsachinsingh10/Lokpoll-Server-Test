import {AppCode} from "../enum/app-code";
import {ErrorModel, SuccessModel} from "../model/common.model";
import {Config} from "../config";
import gcm from 'node-gcm';

const sender = new gcm.Sender(Config.firebase.serverKey);

const message = new gcm.Message({
    data: {key1: 'msg1'},
    notification: {
        title: 'Post published',
        body: 'Your post has been published',
        icon: 'icon-gray.jpg'
    }
});

export const sendTestMessage = () => {
    const regTokens = ['e-yn1WAZX0TYmTcxT0IW5n:APA91bGAnxCly2bYF4F-9P5m9SGJBoisIEu9XAAcEez-m97bGls307P00JIKcKmI5d3567irfWh8be-9y7ewm1C_puH3hW3ounzvPDFPyYhwVndF0FRVg9cTIpnVQt8gNXy0ln6yx1Qb'];
    sender.send(message, {registrationTokens: regTokens}, function (err, response) {
        if (err) {
            console.error('sending error', err);
        } else {
            log.e('response', response);
        }
    });
};

export default class FirebaseService {
    static sendMessage = (tokens, message) => {
        return new Promise((resolve, reject) => {
            sender.send(message, {registrationTokens: tokens}, (err, response) => {
                if (err) {
                    console.error('sending error', err);
                    reject(new SuccessModel(AppCode.sending_message_failed))
                }
                resolve(new ErrorModel(AppCode.message_sent, "", response));
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
