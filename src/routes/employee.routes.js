import express from 'express';
import {validateAuthToken} from "../middleware/auth.middleware";
import {EmployeeService} from "../service/employee.service";
import AppOverrides from "../service/common/app.overrides";
import {log} from "../service/common/logger.service";
import {AppCode} from "../enum/app-code";
import {HttpCode} from "../enum/http-code";

const router = express();

export class EmployeeRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/user', router);

        this.EmployeeService = new EmployeeService();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/addEmployee', async (req, res) => {
            try {
                let employeeDetails = {
                    name: req.body.name,
                    salary: req.body.salary,
                    position: req.body.position,
                    mobile: req.body.mobile
                };
                await this.EmployeeService.saveEmployeeDetails(employeeDetails);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });

    }

}