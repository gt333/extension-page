export default (name: String) =>
  `import React from 'react';
    import {View} from '@tarojs/components';

    class ${name} extends React.Component{

        componentDidShow(){

        }

        render(){
            return <View>This is a Page</View>
        } 
    }
    export default ${name}`;
