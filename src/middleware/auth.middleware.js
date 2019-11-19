import {HttpCodes} from "../enum/http-codes";
import {ErrorModel} from "../model/error.model";
import jwt from "jsonwebtoken";
import {Config} from "../config";

export function validateAuthToken(req, res, next) {
    if (req.method === 'OPTIONS') {
        return res.send();
    }
    const token = req.body.token || req.query.token || req.headers.token;
    console.log('token', token);
    if (!token) {
        return res.status(HttpCodes.unauthorized).json(
            new ErrorModel('no_token', 'Please add token')
        );
    }
    jwt.verify(token, Config.auth.secretKey, function (err, decoded) {
        if (err) {
            console.log('invalid_token', err);
            return res.status(HttpCodes.unauthorized).json(
                new ErrorModel('invalid_token', 'Token not verified')
            );
        } else {
            // console.log('user verified', decoded);
            delete req.body.token;
            delete decoded.iat;
            delete decoded.exp;
            req.user = decoded;
            next();
        }
    });
};
