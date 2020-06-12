import _ from 'underscore';
import {table} from "../enum/table";
import FirebaseService from "../service/firebase.service";
import {SqlService} from "../service/sql/sql.service";
import Utils from "../service/common/utils";

export class FirebaseController {
    constructor() {
    }

    async sendRespectUserMessage(model) {
        const query = `select name
                        from ${table.user} 
                        where id = ${model.respectBy} limit 1;`;
        const user = await SqlService.getSingle(query);
        const receiverIds = [model.respectFor];
        const notification = notificationModel(
            {
                title: `Respect`,
                description: `${user.name} giving respect`,
                type: 'success',
                receiverIds
            }
        );
        return this.sendAndLogNotification(receiverIds, notification);
    }

    async sendMessageForNewCommentOnPost(comment) {
        const query = `select pc.userId
                        from ${table.postComment} pc
                        where pc.postId = ${comment.postId};`;
        const commentData = await SqlService.executeQuery(query);
        let receiverIds = Object.values(commentData);
        receiverIds = receiverIds.filter(r => r !== comment.senderId);
        if (!(comment.senderId === 1 || receiverIds.indexOf(1) > -1)) {
            receiverIds = receiverIds.concat(1);
        }

        console.log("comment Data",receiverIds);
        const notification = notificationModel(
            {
                ...Notification.NewFundMessage,
                title: `${audit.fundName}`,
                description: comment.message,
                type: NotificationType.success,
                receiverIds
            }
        );
        // console.log('notification', notification);
        return this.sendNotifications(receiverIds, notification, comment);
    }

    async sendAndLogNotification(receiverIds, notification) {
        this.sendNotifications(receiverIds, notification);
    }


    async sendNotifications(receiverIds, notification, payload) {
        receiverIds = receiverIds.filter(id => id > 0);
        if (_.isEmpty(receiverIds) || _.isEmpty(notification)) {
            return;
        }
        let query = `select id, deviceToken from ${table.user} 
                        where deviceToken is not null and id in ${Utils.getRange(receiverIds)};`;
        let tokens = await SqlService.executeQuery(query);
        if (_.isEmpty(tokens)) {
            console.log('no tokens found');
            return;
        }
        const _tokens = tokens.map(t => t.deviceToken);
        const n = notification;
        const message = {
            notification: {
                title: n.title,
                body: n.description,
                // icon: 'icon-gray.jpg'
            },
            data: {
                id: n.title
            },
            tokens: _tokens
        };
        if (payload) {
            message.data = {
                ...message.data,
                ...payload,
                id: payload.id + '',
                senderId: payload.senderId + '',
            }
        }
        console.log('message obj', message);
        console.log(`${_tokens.length} users notified, tokens`, _tokens);
        return FirebaseService.sendMessage(message);
    }
}

function notificationModel({title, description, type, receiverIds, name, ...rest}) {
    const notification = {
        title: title,
        description: description,
        createdAt: 'utc_timestamp()',
        type: type,
        receiverIds: ',',
        name: name
    };
    receiverIds = receiverIds.filter(id => id > 0);
    receiverIds.forEach(receiverId => {
        notification.receiverIds += `${receiverId},`
    });
    return notification;
}

