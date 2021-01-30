import express from 'express';
// import {HttpCode} from "../enum/http-code";
// import {AppCode} from "../enum/app-code";
// import {UserService} from "../service/user.service";
// import {UserController} from "../controller/user.controller";
// import {SqlService} from "../service/sql/sql.service";
// import {table} from "../enum/table";
import AppOverrides from "../service/common/app.overrides";
// import {ErrorModel} from "../model/common.model";
import {validateAuthToken} from "../middleware/auth.middleware";
// import _ from 'lodash';
// import {MinIOService, uploadProfilePictures} from "../service/common/minio.service";
// import {ProfileType} from "../enum/common.enum";
// import {FirebaseController} from "../controller/firebase.controller";
// import {log} from "../service/common/logger.service";
// import {UserNetworkService} from "../service/user-network.service";

const router = express();

export class bhargavRoutes {

    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        // this.userService = new UserService();
        // this.userController = new UserController();
        // this.userController = new UserController();
        // this.minioService = new MinIOService();
        // this.firebaseController = new FirebaseController();
        // this.userNetworkService = new UserNetworkService();

        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);
       router.get('/bhargavapi',async (req,res) => {
           res.json({'msg':'Hey this Bhargav. This is my API'});
       });

    //    router.post('/getEmployeeD', async (req, res) => {
           
    //     // res.send(req.body);

    //     try {
    //         await this.employeeService.getEmployeeD(req.body);
    //         return await res.sendStatus(HttpCode.ok);
    //     } catch (e) {
    //         log.e(`${req.method}: ${req.url}`, e);
    //         if (e.code === AppCode.invalid_creds) {
    //             return res.status(HttpCode.unauthorized).send(e);
    //         }
    //         res.sendStatus(HttpCode.internal_server_error);
    //     }
    // });

    }
}

