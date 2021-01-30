import {QueryBuilderService} from "./sql/querybuilder.service";
import {SqlService} from "./sql/sql.service";
import {table} from "../enum/table";
import _ from 'lodash';

export class EmployeeService {
    
    
    async saveEmployeeDetails(employeeDetails) {
        const query = QueryBuilderService.getInsertQuery(table.employee, employeeDetails);
        return SqlService.executeQuery(query);
    }
}