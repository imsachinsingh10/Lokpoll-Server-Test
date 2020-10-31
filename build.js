import fs from 'fs';
import path from "path";
import {spawn} from 'child_process';

const dir = path.resolve('dist');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const cmd = spawn('npm', ['run', 'copyAndCompile'], {stdio: 'inherit'});
cmd.on('error', function (err) {
    console.error(err);
    process.exit(1);
});
