import * as _ from 'lodash';
import {Config} from "../../config";

import vash from 'vash';
import fs from 'fs';
import path from 'path';
import moment from "moment";

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

    static getRandomStringV2(maxChars = 100, config = {
        smallLetters: false,
        capitalLetters: false,
        numbers: false,
        symbols: false
    }) {
        let numbers = '0123456789';
        let smallLetters = 'abcdefghijklmnopqrstuvwxyz';
        let capitalLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let symbols = '@!#$%^&)(_^';
        let chars = '';
        if (config.smallLetters) {
            chars += smallLetters;
        }
        if (config.capitalLetters) {
            chars += capitalLetters;
        }
        if (config.numbers) {
            chars += numbers;
        }
        if (config.symbols) {
            chars += symbols;
        }
        let string = '';
        if (chars === '') {
            return '';
        }
        for (let i = 0; i < maxChars; i++) {
            string += chars[Math.floor(Math.random() * chars.length)];
        }
        return string;
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static getRange(arr) {
        return JSON.stringify(arr)
            .replace('[', '(')
            .replace(']', ')')
            .replace(/"/g, '\'');
    }

    static getDistanceInMiles(distanceInMeters) {
        return +distanceInMeters * 0.000621371;
    }

    static getDistanceInMeters(distanceInMiles) {
        return +distanceInMiles / 0.000621371;
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
        } else if (mimeType.startsWith('video/')) {
            return 'video';
        }
    }

    static getNumericDate(date = '2019-12-09T09:50:13.000Z') {
        const _date = new Date(date);
        const time = _date.getTime();
        return time;
    }

    static wait(seconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000 * seconds);
        })
    }

    static getCompiledHtml = async (post) => {
        return new Promise((resolve, reject) => {
            let _path = path.resolve(__dirname, `../../../assets/view/download-app.html`);
            fs.readFile(_path, async (err, data) => {
                if (err) {
                    return reject({
                        code: 'no_template_found'
                    })
                }
                const tpl = vash.compile(data.toString());
                let title = 'Download Localbol app to remain upto date with local talent';
                if (!_.isEmpty(post.description)) {
                    title = `${post.description}`;
                }
                let mediaLink = `${Config.serverUrl.base}/assets/image/logo.png`;
                post.media.forEach((m) => {
                    if (m.type === 'image') {
                        mediaLink = m.thumbnailUrl;
                    }
                })
                const compiledHtml = tpl({title, mediaLink});
                resolve(compiledHtml);
            });
        })
    };

    static getUTCDate(date) {
        const momentUTC = moment(date).utc();
        return momentUTC.format('YYYY-MM-DD HH:mm:ss');
    }
}
