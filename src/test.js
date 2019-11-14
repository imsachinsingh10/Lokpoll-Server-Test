import * as _ from 'lodash';
const userId = 1;
let files = [
    {name: 'name-1', url: 'url-1'},
    {name: 'name-2', url: 'url-2'},
    {name: 'name-3', url: 'url-3'},
];

files = files.map(file => {
    return {...file, userId};
});
const chars = '0123456789abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ@!#$%^&)(_';
console.log('files new', _.shuffle(chars).join(''));
