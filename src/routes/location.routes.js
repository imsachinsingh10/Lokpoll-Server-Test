import express from 'express';
import {HttpCode} from "../enum/http-code";
import {AppCode} from "../enum/app-code";
import {LocationService} from "../service/location.service";
import AppOverrides from "../service/common/app.overrides";
import {validateAuthToken} from "../middleware/auth.middleware";
import {uploadFile} from "../service/common/minio.service";

const router = express();

export class LocationRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/location', router);

        this.locationService = new LocationService();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add', async (req, res) => {
            try {
                const {insertId} = await this.locationService.addLocation(req.body)
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.duplicate_entity) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/getAll', async (req, res) => {
            try {
                let locations = await this.locationService.getAllLocations();
                return await res.json(locations);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.invalid_creds) {
                    return res.status(HttpCode.unauthorized).send(e);
                }
                res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.post('/update', async (req, res) => {
            try {
                const location = req.body;
                await this.locationService.updateLocation(location);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

        router.get('/delete/:locationId', async (req, res) => {
            try {
                await this.locationService.deleteLocation(req.params.locationId);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                console.error(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
            }
        });

    }
}
