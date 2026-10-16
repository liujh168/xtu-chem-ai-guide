# 示例文档

这是一份用于演示 `build-pdf.js` 转换能力的示例 Markdown。

## 二级标题

Markdown 支持多种排版元素：

- **粗体** 和 *斜体*
- `行内代码`
- [外部链接](https://github.com)

### 三级标题：代码块

```javascript
function hello(name) {
  console.log(`你好，${name}！`);
}
hello('世界');
```

### 三级标题：表格

| 功能 | 说明 | 状态 |
|------|------|------|
| Markdown 转 PDF | 基于 md-to-pdf | ✅ |
| 中文排版优化 | 内置 CSS | ✅ |
| 自定义样式 | `--css` 参数 | ✅ |

### 三级标题：引用

> 学而时习之，不亦说乎？
> ——《论语》

---

## 本地图片示例

如果当前目录下存在图片，可以使用相对路径引用：

```markdown
![示例图片](./assets/demo.png)
```

> 注意：图片需要配合 `--basedir` 参数才能被正确加载。
