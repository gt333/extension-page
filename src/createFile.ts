import * as vscode from "vscode";
import { BigIntStats } from "fs";
import ConfigTemplete from "./configTemp";
import PageTemplete from "./pageTemp";
import Ast from "./ast";
import { format } from "./prettier";

const fs = require("fs");

const APP_CONFIG = "app.config.js";

const IS_FILE: String = "IS_FILE";

const IS_DIRECTORY: String = "IS_DIRECTORY";

// 没有文件
const IS_NOFILE: String = "IS_NOFILE";

/**
 * @description 创建文件
 * @param path
 * @param content
 */
const writeFile = (path: String, content: String): Promise<Boolean> =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, content, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });

/**
 *
 * @param path
 * @param content
 */
const writeFormateFile = async (
  path: String,
  content: String
): Promise<Boolean> => {
  try {
    const formatText = await format(path, content);
    const result = await writeFile(path, formatText);
    console.log(result);
    return true;
  } catch (err) {
    console.error("write:", err);
  }
  return false;
};

/**
 * @description 判断当前路径是文件还是文件夹
 * @param path
 * @returns  IS_DIRECTORY:文件夹 IS_FILE:文件 IS_NOFILE: 文件不存在
 */
const judgeFile = (path: String) =>
  new Promise<String>((resolve, reject) => {
    fs.stat(`${path}`, (err: Error, states: BigIntStats) => {
      try {
        if (err) {
          resolve(IS_NOFILE);
        }
        if (states) {
          console.log(states);
          if (states.isDirectory()) {
            resolve(IS_DIRECTORY);
          }
          if (states.isFile()) {
            resolve(IS_FILE);
          }
        }
      } catch (e: any) {
        reject(e);
      }
    });
  });

const readFile = (path: String) => {};

const writeAppConfig = (path: String, filePath: String) => {
  console.log("path:", path);
  fs.readFile(path, "utf-8", (err: Error, data: String) => {
    const newFiles = Ast(data, filePath);
    writeFormateFile(path, newFiles).then((res) => {
      if (res) {
      }
    });
  });
};

function recursedVaild(path: String) {
  judgeFile(path).then((dirType) => {
    if (dirType === IS_NOFILE) {
    }
  });
}

/**
 * @description 判断文件是否存在
 *
 */
function createFile(
  activeDir: String,
  fileName: String,
  appConfigPath: String,
  pagePath: String
) {
  const newPath = `${activeDir}/${fileName}`;
  if (fileName.indexOf("/") > -1) {
    // 递归判断文件夹是否存在
    recursedVaild(newPath);
  } else {
    judgeFile(newPath).then((dirType) => {
      if (dirType === IS_NOFILE) {
        const componentName =
          fileName.substring(0, 1).toUpperCase() + fileName.substr(1);
        writeFormateFile(`${newPath}.config.js`, ConfigTemplete);
        writeFormateFile(`${newPath}.jsx`, PageTemplete(componentName))
          .then((res) => {
            // 读取app.config.js 并写入page
            if (res) {
              writeAppConfig(appConfigPath, `${pagePath}/${fileName}`);
            }
          })
          .catch((err) => {});
      } else {
        vscode.window.showErrorMessage("当前目录已存在相同文件");
      }
    });
  }
}

export default async (path: String, pageName: String) => {
  try {
    // 判断用户选中的文件夹是否正常
    if (path.indexOf("src") < 0) {
      vscode.window.showErrorMessage("请在src目录下对应的pages目录创建文件");
      return;
    }
    // 获取app.config.js
    // 递归查找app.config.js (小程序不允许存在两个 app.config.js 文件)
    const srcSplit = path.split("src/");
    const appConfigPath = `${srcSplit[0]}src/${APP_CONFIG}`;
    const hasAppConfig = await judgeFile(appConfigPath);
    if (hasAppConfig !== IS_FILE) {
      vscode.window.showErrorMessage("未找到对应的app.config.js文件");
      return;
    }
    const pagePath = path.replace(`${srcSplit[0]}src/`, "");

    const activeContextType = await judgeFile(path);
    console.log("activeContextType:", activeContextType);

    if (activeContextType === IS_FILE) {
      // 用户激活的是个文件,获取上级文件夹
      const activeDir = path.substring(0, path.lastIndexOf("/"));
      // 判断当前目录是否存在对应文件
      const dirType: String = await judgeFile(`${activeDir}/${pageName}`);
      if (activeContextType === IS_DIRECTORY) {
        createFile(activeDir, pageName, appConfigPath, pagePath);
      }
    }

    if (activeContextType === IS_DIRECTORY) {
      createFile(path, pageName, appConfigPath, pagePath);
    }
  } catch (err) {}
};
