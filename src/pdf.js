const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

/**
 * 构建 Puppeteer 启动选项
 * @param {string|undefined} executablePath - 浏览器可执行路径
 * @returns {object} launch options
 */
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

/**
 * 构建 PDF 生成选项
 * @param {object} args - 解析后的命令行参数
 * @returns {object} pdf options
 */
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

/**
 * 确保输出文件所在目录存在
 * @param {string} filePath - 输出文件路径
 */
function ensureDirectoryForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 调用 md-to-pdf 生成 PDF，并校验输出文件
 * @param {object} options - 生成所需参数
 * @returns {Promise<string>} 生成的 PDF 文件绝对路径
 */
async function generatePdf({ inputPath, outputPath, baseDir, css, launchOptions, pdfOptions }) {
  let pdf;
  try {
    pdf = await mdToPdf(
      { path: inputPath },
      {
        basedir: baseDir,
        dest: outputPath,
        launch_options: launchOptions,
        pdf_options: pdfOptions,
        css,
      }
    );
  } catch (err) {
    throw new Error(`PDF 生成失败：${err.message || err}`);
  }

  if (pdf && pdf.filename && fs.existsSync(pdf.filename)) {
    const stats = fs.statSync(pdf.filename);
    return { filename: pdf.filename, size: stats.size };
  }

  throw new Error('PDF 生成失败：未检测到输出文件。');
}

module.exports = {
  buildLaunchOptions,
  buildPdfOptions,
  ensureDirectoryForFile,
  generatePdf,
};
