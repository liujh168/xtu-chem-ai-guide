const path = require('path');

// 脚本所在目录，用于定位相对资源（如默认 CSS）
const SCRIPT_DIR = path.resolve(__dirname, '..');

// 默认样式文件路径
const DEFAULT_CSS_PATH = path.join(SCRIPT_DIR, 'build-pdf.css');

module.exports = {
  SCRIPT_DIR,
  DEFAULT_CSS_PATH,
};
