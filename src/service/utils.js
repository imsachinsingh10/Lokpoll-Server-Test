import * as _ from 'lodash';
import {Config} from "../config";

export default class Utils {
    static formData = {remember: ''};
    static getRandomString(maxChars = 100, exclude) {
        let chars = _.shuffle('0123456789abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ@!#$%^&)(_@!#$%^&)(_').join('');
        if (exclude && exclude.specialChars) {
            chars = _.shuffle('0123456789abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ').join('');
        }
        let link = '';
        for (let i = 0; i < maxChars; i++) {
            link += chars[Math.floor(Math.random() * chars.length)];
        }
        return link;
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static getRange(arr) {
        return JSON.stringify(arr).replace('[', '(').replace(']', ')');
    }

    static getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    static getVersion() {
        const v = Config.version;
        return `${v.majorRevision}.${v.minorRevision}.${v.bugFixes}`
    }

    static getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'image';
        }
        else if (mimeType.startsWith('video/')) {
            return 'video';
        }
    }
}
