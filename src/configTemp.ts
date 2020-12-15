export default <String>`let config = {};
    if(process.env.TARO_ENV==='weapp'){
        config = {

        }
    }
    if(process.env.TARO_ENV==='alipay'){
        config = {

        }
    }
    export default config`;
