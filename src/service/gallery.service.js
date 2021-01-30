import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import _ from 'lodash';

export class GalleryService {
    
    
    async addGalleryData(galleryData) {
        const query = QueryBuilderService.getInsertQuery(table.gallery, galleryData);
        return SqlService.executeQuery(query);
    }

    async getGalleryData(body) {
        let columns = 'g.*';
        let c1 = `and g.status="Active"`;
        if (body.status) {
            c1 = `and g.status = '${body.status}'`;
        }

        const query = `select ${columns}
	    				from ${table.gallery} g
	    				where id > 0
	    				${c1}
                        order by g.id desc`;
                        // console.log(query);
                        // return false;
        return SqlService.executeQuery(query);
    }

    async updateGalleryData(galleryData) {
        const condition = `where id = ${galleryData.id}`;
        const query = QueryBuilderService.getUpdateQuery(table.gallery, galleryData, condition);
        return SqlService.executeQuery(query);
    }

//------------using get--------------------

    async deleteGalleryData(galleryId) {
        const query = `delete from ${table.gallery} where id = ${galleryId};`;
        // console.log(query);
        // return false;
        return SqlService.executeQuery(query);
    }

// ---------------------using post-------------- 


//     async deleteGalleryData(galleryData) {
//         const query = `delete from ${table.gallery} where id = ${galleryData.id};`;
//         // console.log(query);
//         // return false;
//         return SqlService.executeQuery(query);
//     }
 }