import { Options } from "prettier";

const prettier = require("prettier");

export default (filePath: String, content: String): Promise<string> =>
  new Promise((resolve, reject) => {
    prettier
      .resolveConfig(filePath)
      .then((options: Options) => {
        const formateText = prettier.format(content, options);
        resolve(formateText);
      })
      .catch((err: Error) => {
        reject(err);
      });
  });
