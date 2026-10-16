> 说明：本 README 已根据当前目录实际脚本 `build-pdf.js` 重新整理。原 `jqxq-engine` 相关内容已移除，如有需要请从历史备份中恢复。

# Markdown to PDF Builder

一个简洁的 **Markdown 转 PDF** 命令行工具，基于 Node.js 与 [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf) 构建，内置适合中文文档的排版样式。

## 特性

- 📝 将 Markdown 文件一键转换为 PDF
- 🀄 内置中文优化 CSS（微软雅黑/苹方/黑体回退、合适行距、表格分页等）
- 🎨 支持通过 `--css` 追加自定义样式
- 🔧 支持指定 Chromium/Chrome/Edge 可执行路径
- 📄 支持页脚页码开关
- 🖼️ 支持本地图片等静态资源（通过 `--basedir`）

## 环境要求

- Node.js >= 16
- 已安装 Chromium / Google Chrome / Microsoft Edge 任一浏览器（脚本会自动查找）

## 安装依赖

```bash
npm install
```

## 快速开始

```bash
# 将 README.md 转为同名 PDF
npm run build:pdf -- README.md

# 指定输出文件名
npm run build:pdf -- README.md output.pdf

# 追加自定义 CSS
npm run build:pdf -- README.md output.pdf --css custom.css

# 不显示页脚页码
npm run build:pdf -- README.md --no-footer

# 指定浏览器路径
npm run build:pdf -- README.md --executable-path "C:/Program Files/Google/Chrome/Application/chrome.exe"
```

## 项目结构

```text
.
├── build-pdf.css      # 默认中文排版样式
├── build-pdf.js       # 主脚本：参数解析 + PDF 生成
├── package.json       # 项目配置与 npm 脚本
├── README.md          # 本说明文档
└── README.pdf         # 由本工具生成的示例 PDF
```

## 命令行参数

| 参数 | 简写 | 说明 |
|------|------|------|
| `--input <文件>` | `-i` | 输入 Markdown 文件 |
| `--output <文件>` | `-o` | 输出 PDF 文件（默认与输入同名） |
| `--css <文件>` | `-c` | 追加外部 CSS（可多次使用） |
| `--executable-path <路径>` | - | 指定浏览器可执行文件 |
| `--basedir <目录>` | - | 本地资源基础目录（默认当前目录） |
| `--no-footer` | - | 关闭页脚页码 |
| `--help` | `-h` | 显示帮助信息 |

## 自定义样式

直接修改 `build-pdf.css`，或在运行时叠加自己的 CSS 文件：

```bash
npm run build:pdf -- README.md --css theme.css
```

## 浏览器查找顺序

当未指定 `--executable-path` 时，脚本按以下顺序查找浏览器：

1. Puppeteer 下载的 Chromium 缓存
2. 环境变量 `PUPPETEER_EXECUTABLE_PATH` / `CHROME_BIN` / `CHROME_PATH`
3. 系统安装的 Google Chrome
4. 系统安装的 Microsoft Edge
5. 让 Puppeteer 自动下载/解析

## 常见问题

### PDF 生成失败，提示找不到 Chromium

- 确认已安装 Chrome 或 Edge
- 使用 `--executable-path` 显式指定浏览器路径
- 或设置环境变量：`set PUPPETEER_EXECUTABLE_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe`

### 中文字体显示异常

确保目标系统安装有 `Microsoft YaHei`（微软雅黑）或 `PingFang SC`（苹方）等中文字体。可在 `build-pdf.css` 中调整 `font-family` 回退顺序。

## 许可证

MIT
