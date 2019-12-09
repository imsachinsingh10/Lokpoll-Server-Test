export default class AppEventHandler {
    constructor() {
        this.bindEventListeners();
    }

    bindEventListeners() {
        process.on('exit', (code) => {
            console.log('server stopped', code);
            // TODO: handle if server stopped
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.log('promise unhandled', reason, promise);
            // TODO: handle if rejected promise not handled
        });
    }
}