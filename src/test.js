
async function inner1() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject("no resolve");
            // resolve(true)
        }, 2000);
    })
}

const main = async () => {
    const result = await inner1();
    console.log('result', result);
};

app();

async function app() {
    try {
        console.log('app called');
        await main();
        console.log('app finished');
    } catch (e) {
        console.log('exception caught', e);
    }
}
