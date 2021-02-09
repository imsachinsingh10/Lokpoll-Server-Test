export const log = {
    i: (tag, info1 = '', info2 = '') => {
        console.log(`\n++++++ info ++++++ @ ${new Date()}\n`, tag, info1, info2);
    },
    e: (tag, error1, error2) => {
        console.log(`\nxxxxxx error xxxxxx @ ${new Date()}\n`, tag, error1, error2);
    },
    sql: (query) => {
        console.log(`\n****** sql ****** @ ${new Date()}\n`, query);
    }
}
