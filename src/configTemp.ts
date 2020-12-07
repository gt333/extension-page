export default<String>
    `const config = {};
    if(process.env.TARO_ENV==='weapp'){
        config = {

        }
    }
    if(process.env.TARO_ENV==='alipay'){
        config = {

        }
    }
    export default config`
