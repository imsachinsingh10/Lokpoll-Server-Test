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
                type: 'respect',
                id: `${model.respectBy}`,
                receiverIds
            }
        );
        log.i('notification', notification);
        return this.sendAndLogNotification(receiverIds, notification);
    }

    async sendMessageForNewCommentOnPost(comment) {
        const query = `select pc.userId
                        from ${table.postComment} pc
                        where pc.postId = ${comment.postId};`;
        const commentData = await SqlService.executeQuery(query);
        const query1 = `select userId
                        from ${table.post} 
                        where id = ${comment.postId} limit 1;`;
        const postCreated = await SqlService.getSingle(query1);
        //let receiverIds = Object.values(commentData);
        let receiverIds = commentData.map( (e) => { return e.userId });
        receiverIds = receiverIds.filter(function(elem, index, self) {
            return index === self.indexOf(elem);
        })
        receiverIds = receiverIds.filter(r => r !== comment.userId);
        if (!(comment.userId === 1 || receiverIds.indexOf(1) > -1)) {
            receiverIds = receiverIds.concat(postCreated.userId);
        }

        const notification = notificationModel(
            {
                title: `Comment Added`,
                description: comment.comment,
                type: 'comment',
                id: `${comment.postId}`,
                receiverIds
            }
        );
         log.i('notification', notification);
        return this.sendNotifications(receiverIds, notification);
    }




    async sendNotificationForReaction(reaction, reactionCount) {
        const query = `select userId
                        from ${table.post} 
                        where id = ${reaction.postId} limit 1;`;
        const user = await SqlService.getSingle(query);
        const receiverIds = [user.userId];
        const notification = notificationModel(
            {
                title: `Reaction on post`,
                description: `${reactionCount} giving respect`,
                type: 'reaction',
                id: `${reaction.postId}`,
                receiverIds
            }
        );
        return this.sendAndLogNotification(receiverIds, notification);
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
            log.i('no tokens found');
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
                id: n.id,
                type: n.type,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            tokens: _tokens
        };
        if (payload) {
            message.data = {
                ...payload
            }
        }
        log.i('message obj', message);
        log.i(`${_tokens.length} users notified, tokens`, _tokens);
        return FirebaseService.sendMessage(message);
    }
}

function notificationModel({title, description, type ,id, receiverIds, name, ...rest}) {
    const notification = {
        title: title,
        description: description,
        createdAt: 'utc_timestamp()',
        type: type,
        receiverIds: ',',
        name: name,
        id: id
    };
    receiverIds = receiverIds.filter(id => id > 0);
    receiverIds.forEach(receiverId => {
        notification.receiverIds += `${receiverId},`
    });
    return notification;
}

