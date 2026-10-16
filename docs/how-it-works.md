# 工作原理

本项目是一个围绕 [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf) 的轻量封装，专门用于把 Markdown 文件转换成排版良好的 PDF。

## 整体流程

```text
build-pdf.js
    │
    ▼
src/main.js           orchestrates the whole process
    │
    ├──▶ src/args.js      parse and validate CLI arguments
    ├──▶ src/browser.js   find the best available browser
    ├──▶ src/css.js       load default + custom CSS
    └──▶ src/pdf.js       call md-to-pdf and verify output
```

## 各模块职责

### `src/args.js`

- 解析 `--input`、`-i`、`--output`、`-o`、`--css`、`-c`、`--executable-path`、`--basedir`、`--no-footer`、`-h`/`--help` 等参数。
- 支持位置参数：`build-pdf.js input.md output.pdf`。
- 校验输入文件是否存在、输出路径是否合法、基础目录是否存在。

### `src/browser.js`

按以下顺序查找可用的 Chromium/Chrome/Edge：

1. Puppeteer 缓存目录中的最新版本
2. 环境变量：`PUPPETEER_EXECUTABLE_PATH`、`CHROME_BIN`、`CHROME_PATH`
3. 系统安装的 Google Chrome
4. 系统安装的 Microsoft Edge
5. 回退：让 Puppeteer 自动下载

### `src/css.js`

- 读取 `build-pdf.css` 作为默认中文排版样式。
- 读取用户通过 `--css` 指定的外部 CSS 文件并追加到默认样式之后。

### `src/pdf.js`

- 构造 Puppeteer `launch_options`（重点：使用 `headless: true` 兼容 Puppeteer v23+）。
- 构造 PDF `pdf_options`（A4、边距、页眉页脚等）。
- 调用 `mdToPdf()`，生成后校验输出文件是否存在。

### `build-pdf.js`

入口文件，仅负责调用 `src/main.js` 并在出错时退出进程。

## 为什么这样拆分？

- **可读性**：每个文件只负责一件事，便于初学者理解。
- **可测试性**：可以单独测试参数解析、浏览器发现、CSS 加载等逻辑。
- **可扩展性**：未来增加 watch 模式、批量转换、配置文件时，只需扩展对应模块。
