import * as _ from 'lodash';

export default class Utils {
    static formData = {remember: ''};
    static getRandomString(maxChars = 100) {
        const chars = _.shuffle('0123456789abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ@!#$%^&)(_@!#$%^&)(_').join('');
        let link = '';
        for (let i = 0; i < maxChars; i++) {
            link += chars[Math.floor(Math.random() * 82)];
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
}
