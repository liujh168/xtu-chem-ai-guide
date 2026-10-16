const fs = require('fs');
const path = require('path');
const { DEFAULT_CSS_PATH } = require('./paths');

/**
 * 读取默认 CSS 文件内容
 * @returns {string} CSS 字符串
 */
function readDefaultCss() {
  try {
    return fs.readFileSync(DEFAULT_CSS_PATH, 'utf-8');
  } catch (err) {
    console.warn(`警告：未能读取默认 CSS 文件 ${DEFAULT_CSS_PATH}，将使用空样式：${err.message}`);
    return '';
  }
}

/**
 * 读取并拼接用户指定的自定义 CSS 文件
 * @param {string[]} cssFiles - CSS 文件路径列表
 * @returns {string} 拼接后的 CSS 字符串
 */
function readCustomCss(cssFiles) {
  let customCss = '';
  for (const cssFile of cssFiles) {
    const cssPath = path.resolve(cssFile);
    if (!fs.existsSync(cssPath)) {
      throw new Error(`CSS 文件不存在：${cssPath}`);
    }
    const stat = fs.statSync(cssPath);
    if (!stat.isFile()) {
      throw new Error(`CSS 路径不是文件：${cssPath}`);
    }
    customCss += `\n/* ${cssFile} */\n` + fs.readFileSync(cssPath, 'utf-8');
  }
  return customCss;
}

module.exports = {
  readDefaultCss,
  readCustomCss,
};
