/**
 * @description 替换app.config.js 文件
 */

export default (content: String, filePath: String) => {
  try {
    const contentStr = content
      .replace(/export default|\n/g, "")
      .replace(/pages\:/g, 'pages:"');
    // console.log(contentStr);
    const textJson = JSON.parse(contentStr);
    console.log(textJson);
  } catch (err) {
    console.error(err);
  }
};
