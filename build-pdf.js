const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

const SCRIPT_DIR = __dirname;
const DEFAULT_CSS_PATH = path.join(SCRIPT_DIR, 'build-pdf.css');

function printHelp() {
  console.log(`
用法：
  node build-pdf.js [选项] [输入文件] [输出文件]

示例：
  node build-pdf.js README.md
  node build-pdf.js README.md output.pdf
  node build-pdf.js --input README.md --output output.pdf --css style.css

选项：
  --input, -i <文件>        输入 Markdown 文件
  --output, -o <文件>       输出 PDF 文件（默认：与输入文件同名，扩展名 .pdf）
  --css, -c <文件>          追加外部 CSS 文件（可多次指定）
  --executable-path <路径>  指定 Chromium/Chrome 可执行文件路径
  --basedir <目录>          本地资源（如图片）的基础目录（默认：当前目录）
  --no-footer               不显示页脚页码
  --help, -h                显示此帮助信息
`);
}

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    cssFiles: [],
    executablePath: null,
    basedir: '.',
    footer: true,
  };

  const positional = [];

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      case '--input':
      case '-i':
        args.input = next;
        i++;
        break;
      case '--output':
      case '-o':
        args.output = next;
        i++;
        break;
      case '--css':
      case '-c':
        args.cssFiles.push(next);
        i++;
        break;
      case '--executable-path':
        args.executablePath = next;
        i++;
        break;
      case '--basedir':
        args.basedir = next;
        i++;
        break;
      case '--no-footer':
        args.footer = false;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`未知选项：${arg}`);
          printHelp();
          process.exit(1);
        }
        positional.push(arg);
    }
  }

  // 位置参数：第一个为输入，第二个为输出
  if (positional[0]) args.input = positional[0];
  if (positional[1]) args.output = positional[1];

  // 未指定输出时，默认与输入同名 .pdf
  if (!args.output && args.input) {
    args.output = args.input.replace(/\.md$/i, '.pdf');
  }

  return args;
}

function readDefaultCss() {
  try {
    return fs.readFileSync(DEFAULT_CSS_PATH, 'utf-8');
  } catch (err) {
    console.warn(`警告：未能读取默认 CSS 文件 ${DEFAULT_CSS_PATH}，将使用空样式：${err.message}`);
    return '';
  }
}

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

function findPuppeteerChrome() {
  const homeDir = process.env.LOCALAPPDATA || process.env.HOME || '';
  if (!homeDir) return null;

  // 新版 Puppeteer 缓存结构：%LOCALAPPDATA%/.cache/puppeteer/chrome/win64-<build>/chrome-win64/chrome.exe
  const chromeRoot = path.join(homeDir, '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(chromeRoot)) {
    const entries = fs.readdirSync(chromeRoot, { withFileTypes: true });
    const versions = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('win64-'))
      .map((e) => ({
        dir: e.name,
        chromePath: path.join(chromeRoot, e.name, 'chrome-win64', 'chrome.exe'),
      }))
      .filter((v) => fs.existsSync(v.chromePath));

    if (versions.length > 0) {
      versions.sort((a, b) => b.dir.localeCompare(a.dir));
      return versions[0].chromePath;
    }
  }

  // 兼容旧版 Puppeteer 缓存结构：%LOCALAPPDATA%/.cache/puppeteer/chrome/win64-<build>/chrome.exe
  if (fs.existsSync(chromeRoot)) {
    const entries = fs.readdirSync(chromeRoot, { withFileTypes: true });
    const versions = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('win64-'))
      .map((e) => ({
        dir: e.name,
        chromePath: path.join(chromeRoot, e.name, 'chrome.exe'),
      }))
      .filter((v) => fs.existsSync(v.chromePath));

    if (versions.length > 0) {
      versions.sort((a, b) => b.dir.localeCompare(a.dir));
      return versions[0].chromePath;
    }
  }

  return null;
}

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

function ensureDirectoryForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function validateArgs(args) {
  if (!args.input) {
    printHelp();
    process.exit(0);
  }

  if (!args.output) {
    throw new Error('未能确定输出文件路径，请通过 --output 或位置参数指定。');
  }

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`输入文件不存在：${inputPath}`);
  }

  const stat = fs.statSync(inputPath);
  if (!stat.isFile()) {
    throw new Error(`输入路径不是文件：${inputPath}`);
  }

  if (!/\.md$/i.test(inputPath)) {
    console.warn(`警告：输入文件 ${inputPath} 不是 .md 文件，转换结果可能不符合预期。`);
  }

  const baseDir = path.resolve(args.basedir);
  if (!fs.existsSync(baseDir)) {
    throw new Error(`基础目录不存在：${baseDir}`);
  }

  return { inputPath, outputPath: path.resolve(args.output), baseDir };
}

function buildLaunchOptions(executablePath) {
  const launchOptions = {
    // Puppeteer v23+ 已弃用 headless: 'new'，使用布尔值
    headless: true,
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }
  return launchOptions;
}

function buildPdfOptions(args) {
  const pdfOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '18mm',
      bottom: '20mm',
      left: '18mm',
    },
    displayHeaderFooter: args.footer,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size: 9px; width: 100%; text-align: center; color: #666; padding: 0 20mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  };

  if (!args.footer) {
    pdfOptions.headerTemplate = '';
    pdfOptions.footerTemplate = '';
  }

  return pdfOptions;
}

async function main() {
  const args = parseArgs(process.argv);
  const { inputPath, outputPath, baseDir } = validateArgs(args);

  ensureDirectoryForFile(outputPath);

  const defaultCss = readDefaultCss();
  const customCss = readCustomCss(args.cssFiles);
  const executablePath = resolveExecutablePath(args.executablePath);
  const launchOptions = buildLaunchOptions(executablePath);
  const pdfOptions = buildPdfOptions(args);

  console.log(`输入：${inputPath}`);
  console.log(`输出：${outputPath}`);
  console.log(`基础目录：${baseDir}`);
  if (executablePath) {
    console.log(`Chromium：${executablePath}`);
  } else {
    console.log('Chromium：由 puppeteer 自动解析');
  }

  let pdf;
  try {
    pdf = await mdToPdf(
      { path: inputPath },
      {
        basedir: baseDir,
        dest: outputPath,
        launch_options: launchOptions,
        pdf_options: pdfOptions,
        css: defaultCss + customCss,
      }
    );
  } catch (err) {
    throw new Error(`PDF 生成失败：${err.message || err}`);
  }

  if (pdf && pdf.filename && fs.existsSync(pdf.filename)) {
    const stats = fs.statSync(pdf.filename);
    console.log(`PDF 生成成功：${pdf.filename} (${stats.size} 字节)`);
  } else {
    throw new Error('PDF 生成失败：未检测到输出文件。');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
