import Utils from "./src/service/common/utils";
import {extractThumbnailFromImage} from "./src/middleware/thumbnail.middleware";
import path from 'path';
const { exec } = require('child_process');

const ls = exec('ipconfig', function (error, stdout, stderr) {
    if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+stdout);
    console.log('Child Process STDERR: '+stderr);
});

ls.on('exit', function (code) {
    console.log('Child process exited with exit code '+code);
});
