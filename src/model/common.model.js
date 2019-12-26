export class ErrorModel {
    code;
    message;
    description;

    constructor(code, message, description) {
        this.code = code;
        this.message = message;
        this.description = description
    }
}

export class SuccessModel {
    code;
    message;

    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
