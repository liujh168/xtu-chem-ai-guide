const fs = require('fs');
const path = require('path');

/**
 * 在 Puppeteer 缓存目录中查找最新版 Chromium（Windows）
 * @returns {string|null} chrome.exe 绝对路径
 */
function findPuppeteerChrome() {
  const homeDir = process.env.LOCALAPPDATA || process.env.HOME || '';
  if (!homeDir) return null;

  const chromeRoot = path.join(homeDir, '.cache', 'puppeteer', 'chrome');
  if (!fs.existsSync(chromeRoot)) return null;

  const entries = fs.readdirSync(chromeRoot, { withFileTypes: true });

  // 新版缓存结构：chrome/win64-<build>/chrome-win64/chrome.exe
  const candidates = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('win64-'))
    .flatMap((e) => [
      path.join(chromeRoot, e.name, 'chrome-win64', 'chrome.exe'),
      path.join(chromeRoot, e.name, 'chrome.exe'),
    ])
    .filter((p) => fs.existsSync(p));

  if (candidates.length === 0) return null;

  // 按目录名（包含 build 号）降序，取最新
  const sorted = candidates
    .map((p) => ({ path: p, dir: path.basename(path.dirname(p)) }))
    .sort((a, b) => b.dir.localeCompare(a.dir));

  return sorted[0].path;
}

/**
 * 查找系统已安装的 Chrome / Edge
 * @returns {string|null} 浏览器可执行文件绝对路径
 */
function findSystemChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * 确定最终使用的浏览器可执行路径
 * @param {string|null} explicitPath - 用户通过 --executable-path 指定的路径
 * @returns {string|undefined} 绝对路径；若返回 undefined，则交给 Puppeteer 自动处理
 */
function resolveExecutablePath(explicitPath) {
  if (explicitPath) {
    const abs = path.resolve(explicitPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`指定的 Chromium 路径不存在：${abs}`);
    }
    return abs;
  }

  const cached = findPuppeteerChrome();
  if (cached) return cached;

  const system = findSystemChrome();
  if (system) return system;

  // 让 puppeteer 自己尝试去找（如果已全局安装浏览器）
  return undefined;
}

module.exports = {
  findPuppeteerChrome,
  findSystemChrome,
  resolveExecutablePath,
};
