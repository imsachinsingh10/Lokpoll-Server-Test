import express from 'express';
import {validateAuthToken} from "../middleware/auth.middleware";
import {GalleryService} from "../service/gallery.service";
import AppOverrides from "../service/common/app.overrides";
import {log} from "../service/common/logger.service";
import {AppCode} from "../enum/app-code";
import {HttpCode} from "../enum/http-code";
import {MinIOService, uploadFile} from "../service/common/minio.service";


const router = express();
export class GalleryRoutes {
    constructor(app) {
        new AppOverrides(router);
        app.use('/gallery', router);

        this.GalleryService = new GalleryService();
        this.minioService = new MinIOService();
        this.initRoutes();
    }

    initRoutes() {
        router.use(validateAuthToken);

        router.post('/add',uploadFile, async (req, res) => {
           
        //    console.log(req.file);
        //    return false;
            try {
                let galleryData = {
                    name: req.body.name,
                    fileName: req.file.filename,
                    status: req.body.status,
                
                }; 
                // if (req.file) {
                //     const file = await this.minioService.uploadFile(req.file);
                //     galleryData.fileName = file.url;
                // }
                await this.GalleryService.addGalleryData(galleryData);
                return res.sendStatus(HttpCode.ok);
            } catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                if (e.code === AppCode.s3_error) {
                    return res.status(HttpCode.bad_request).send(e);
                }
                return res.status(HttpCode.internal_server_error).send(e);
            }
        });


        router.post('/images', async (req, res) => {
                try {
                    

                    let images = await this.GalleryService.getGalleryData(req.body);
                    // return res.json({'status':HttpCode.ok,'data':images});
                    return await res.json(images);
                } catch (e) {
                    log.e(`${req.method}: ${req.url}`, e);
                    if (e.code === AppCode.s3_error) {
                        return res.status(HttpCode.bad_request).send(e);
                    }
                    return res.status(HttpCode.internal_server_error).send(e);
                }
            });

        router.post('/update', uploadFile, async (req, res) => {
            try {
                const galleryData = 
                {
                    id : req.body.id,
                    name : req.body.name,
                    // fileName : req.file.filename,
                    status : req.body.status
                };
                if (req.file) {
                    galleryData.fileName =  req.file.filename;
                }
                // if (req.file) {
                //     const file = await this.minioService.uploadFile(req.file);
                //     mood.imageUrl = file.url;
                //             }
                    await this.GalleryService.updateGalleryData(galleryData);
                    return res.sendStatus(HttpCode.ok);
                } 
            catch (e) {
                log.e(`${req.method}: ${req.url}`, e);
                return res.sendStatus(HttpCode.internal_server_error);
                    }
            });

            
//------------------------using get---------------------        


            router.get('/delete/:galleryId', async (req, res) => {
                try {
                    // console.log(req.params.galleryId);
                    // return false;
                    await this.GalleryService.deleteGalleryData(req.params.galleryId);
                    return res.sendStatus(HttpCode.ok);
                } catch (e) {
                    log.e(`${req.method}: ${req.url}`, e);
                    return res.sendStatus(HttpCode.internal_server_error);
                }
            });        


//------------------using post--------------


            // router.post('/delete',uploadFile, async (req, res) => {
            //     try {
            //         const galleryData = req.body;
            //         // console.log(req.body);
            //         // return false;
            //         await this.GalleryService.deleteGalleryData(galleryData);
            //         return res.sendStatus(HttpCode.ok);
            //     } catch (e) {
            //         log.e(`${req.method}: ${req.url}`, e);
            //         return res.sendStatus(HttpCode.internal_server_error);
            //     }
            // });        

    }

}