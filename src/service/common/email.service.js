import Utils from "./utils";

const nodemailer = require('nodemailer');
import vash from 'vash';
import fs from 'fs';
import path from 'path';

import {Config} from '../../config'
import {table} from "../../enum/table";
import {QueryBuilderService} from "../sql/querybuilder.service";
import {SqlService} from "../sql/sql.service";

export class EmailService {

    static sendEmail = async (receiver, templateName) => {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve('./template', `${templateName}.html`), async (err, data) => {
                if (err) {
                    console.log('err in send mail', err);
                    return reject({
                        code: 'no_template_found'
                    })
                }
                const tpl = vash.compile(data.toString());
                const otp = Utils.getRandomNumber(1000, 9999);
                try {
                    // const query = QueryBuilderService.getInsertQuery(table.verification, {
                    //     otp,
                    //     userId: receiver.id,
                    //     email: receiver.email
                    // });
                    // await SqlService.executeQuery(query);
                } catch (e) {
                    console.log('e', e);
                    return reject({code: 'unable to add user in verification'})
                }
                console.log('receiver', receiver);
                const compiledHtml = tpl({
                    ...receiver, link: {
                        text: Utils.getRandomString(),
                        redirectTo: `${Config.clientApp.baseUrl}/${receiver.id}/${otp}`
                    }
                });
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: Config.sendMail.email,
                        pass: Config.sendMail.password
                    }
                });

                const mailOptions = {
                    from: Config.sendMail.email,
                    to: receiver.email,
                    subject: 'Verify email',
                    html: compiledHtml
                };

                transporter.sendMail(mailOptions, function (err, info) {
                    console.log(err, info);
                    if (err) {
                        return reject(false)
                    } else {
                        return resolve(true);
                    }
                });
            });
        })
    };

}
