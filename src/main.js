const { parseArgs, validateArgs } = require('./args');
const { resolveExecutablePath } = require('./browser');
const { readDefaultCss, readCustomCss } = require('./css');
const {
  buildLaunchOptions,
  buildPdfOptions,
  ensureDirectoryForFile,
  generatePdf,
} = require('./pdf');

/**
 * 主流程：解析参数 -> 校验 -> 查找浏览器 -> 生成 PDF
 */
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

  const { filename, size } = await generatePdf({
    inputPath,
    outputPath,
    baseDir,
    css: defaultCss + customCss,
    launchOptions,
    pdfOptions,
  });

  console.log(`PDF 生成成功：${filename} (${size} 字节)`);
}

module.exports = { main };
