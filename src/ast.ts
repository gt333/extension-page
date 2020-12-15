import {
  TraversalHandler,
  Node,
  StringLiteral,
  Identifier,
} from "@babel/types";

interface ASTNode {
  node: Node;
  parentPath?: ASTNode;
  listKey: String;
  key: Identifier;
}

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const babelType = require("@babel/types");
const babylon = require("babylon");

// 向上递归查找制定 name 节点
function recursed(path: any, name: String): null | ASTNode {
  // console.log(path, path.node.name);
  // console.log("parentPath:", path.parentPath);
  if (path && path.node.key && path.node.key.name === name) {
    return path.parentPath;
  }
  if (!path.parentPath || !path.parentPath.node) {
    return null;
  }
  return recursed(path.parentPath, name);
}

function recConditionalExpression(pageNode: any, filePath: String) {
  console.log("filePath:", filePath);
  const { consequent, alternate } = pageNode;
  if (babelType.isArrayExpression(consequent)) {
    consequent.elements.push(babelType.stringLiteral(filePath));
  }
  if (babelType.isArrayExpression(alternate)) {
    alternate.elements.push(babelType.stringLiteral(filePath));
  }
  // 递归
  if (babelType.isConditionalExpression(consequent)) {
    recConditionalExpression(consequent, filePath);
  }
  if (babelType.isConditionalExpression(alternate)) {
    recConditionalExpression(alternate, filePath);
  }
}

/**
 * @description 利用ast处理 js 文件
 * @returns String 新的文件
 */
export default (content: String, filePath: String): String => {
  const AST: Node = parser.parse(content, {
    // parse in strict mode and allow module declarations
    sourceType: "module",

    plugins: [
      // enable jsx and flow syntax
      "jsx",
      "flow",
      "json",
    ],
  });
  // 根据路径获取 root
  const root: String = filePath.split("/")[0];
  const nodeNew: StringLiteral = babelType.stringLiteralTypeAnnotation(
    filePath.replace(/.*?(\/.*)/, "$1").replace(/^\//, "")
  );
  traverse(AST, {
    enter(path: any, state: any) {
      try {
        if (path.node.type === "Identifier" && path.node.name === "pages") {
          const rootPath = path.parentPath.parentPath.parentPath;
          if (
            root === "pages" &&
            (babelType.isVariableDeclarator(rootPath) ||
              babelType.isExportDefaultDeclaration(rootPath))
          ) {
            const pageParentPath = path.parentPath.node;

            if (pageParentPath.value) {
              if (babelType.isArrayExpression(pageParentPath.value)) {
                pageParentPath.value.elements.push(nodeNew);
              }
              // 深度遍历 ConditionalExpression
              if (babelType.isConditionalExpression(pageParentPath.value)) {
                recConditionalExpression(pageParentPath.value, filePath);
                // const { consequent, alternate } = pageNode.value;
                console.log("pageNode.value:", pageParentPath.value);
              }
            }
          }
        }
        // 判断分包的路径
        if (path.node.type === "StringLiteral" && path.node.value === root) {
          // 判断是分包节点
          if (
            path.parentPath.node.type === "ObjectProperty" &&
            path.parentPath.node &&
            path.parentPath.node.key &&
            path.parentPath.node.key.name === "root"
          ) {
            // 分包节点属于二级节点，找到上级‘subPackages’，并判断是否是二级节点
            const subPackagesPath = recursed(path.parentPath, "subPackages");
            if (subPackagesPath) {
              if (
                subPackagesPath.parentPath &&
                subPackagesPath.parentPath.listKey === "body"
              ) {
                // 修改page
                // 依赖父节点，寻找page
                const pageParentPath = path.parentPath.parentPath.node;
                if (pageParentPath) {
                  const properties = pageParentPath.properties;
                  const pageNode = properties.find(
                    (items: ASTNode) => items.key.name === "pages"
                  );
                  if (babelType.isArrayExpression(pageNode.value)) {
                    pageNode.value.elements.push(nodeNew);
                  }
                  // 深度遍历 ConditionalExpression
                  if (babelType.isConditionalExpression(pageNode.value)) {
                    recConditionalExpression(pageNode.value, filePath);
                    // const { consequent, alternate } = pageNode.value;
                    console.log("pageNode.value:", pageNode.value);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
  });
  const result = generate(
    AST,
    {
      /* options */
      jsonCompatibleStrings: true,
      retainLines: true,
    },
    content
  );
  return result.code;
};
