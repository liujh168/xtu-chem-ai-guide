const assert = require('assert');
const { parseArgs, validateArgs } = require('../src/args');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

// 1. 基本位置参数解析
test('parse positional arguments', () => {
  const args = parseArgs(['node', 'build-pdf.js', 'input.md', 'output.pdf']);
  assert.strictEqual(args.input, 'input.md');
  assert.strictEqual(args.output, 'output.pdf');
});

// 2. 命名参数解析
test('parse named arguments', () => {
  const args = parseArgs([
    'node',
    'build-pdf.js',
    '--input',
    'README.md',
    '--output',
    'README.pdf',
    '--css',
    'theme.css',
    '--no-footer',
  ]);
  assert.strictEqual(args.input, 'README.md');
  assert.strictEqual(args.output, 'README.pdf');
  assert.deepStrictEqual(args.cssFiles, ['theme.css']);
  assert.strictEqual(args.footer, false);
});

// 3. 未指定输出时默认生成同名 PDF
test('default output name', () => {
  const args = parseArgs(['node', 'build-pdf.js', 'doc.md']);
  assert.strictEqual(args.output, 'doc.pdf');
});

// 4. 多个 CSS 文件
test('multiple css files', () => {
  const args = parseArgs([
    'node',
    'build-pdf.js',
    '-i',
    'doc.md',
    '-c',
    'a.css',
    '-c',
    'b.css',
  ]);
  assert.deepStrictEqual(args.cssFiles, ['a.css', 'b.css']);
});

// 5. 校验输入文件不存在时抛出错误
test('validate throws on missing input', () => {
  assert.throws(() => {
    validateArgs({ input: 'not-exist.md', output: 'out.pdf', basedir: '.' });
  }, /输入文件不存在/);
});

// 6. 校验基础目录不存在时抛出错误
test('validate throws on missing basedir', () => {
  assert.throws(() => {
    validateArgs({ input: 'README.md', output: 'out.pdf', basedir: 'not-exist-dir' });
  }, /基础目录不存在/);
});

console.log('\n测试完成。');
