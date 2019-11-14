const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const dirname = "scripts";

fs.readdir(`${__dirname}/${dirname}` , async function (err, fileNames) {
    if (err) {
        console.log('err', err);
        return;
    }

    let fullSql = "";
    const fileLength = fileNames.length;
    for (let i = 0; i < fileLength; i++) {
        const response = await readFile(path.resolve(__dirname, dirname, fileNames[i]));
        fullSql = fullSql + response + "\r\n\n";
    }
    await writeFile("database/full-db.sql", fullSql);
});