const fs = require('fs');
const path = require('path');

/**
 * 打印命令行帮助信息
 */
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

/**
 * 解析命令行参数
 * @param {string[]} argv - process.argv
 * @returns {object} 解析后的参数对象
 */
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

/**
 * 校验参数并解析为绝对路径
 * @param {object} args - parseArgs 返回的参数对象
 * @returns {object} 输入/输出/基础目录的绝对路径
 */
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

  return {
    inputPath,
    outputPath: path.resolve(args.output),
    baseDir,
  };
}

module.exports = {
  printHelp,
  parseArgs,
  validateArgs,
};
