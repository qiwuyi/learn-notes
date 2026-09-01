---
title: Pi ⑥ TUI 库：终端 UI 引擎
---

# pi-tui：终端 UI 引擎

Pi 专题第六课 · 深入拆解 `packages/tui`

::: tip 本课目标
Pi 不依赖 Ink 等第三方 TUI 框架，而是**自己写了一个终端 UI 引擎**。这一课拆解它的核心：
组件系统、布局树、差分渲染、渲染调度——学完你也能理解"终端里那个漂亮的界面"是怎么画出来的。
:::

## 为什么自己写 TUI

TUI（Terminal User Interface）库的难题：终端本质是**字符网格 + ANSI 转义序列**，要做出"窗口、滚动、输入框、Markdown 渲染"，全要自己造。

Pi 选择自研，注释写得很直白：

```ts
/**
 * Minimal TUI implementation with differential rendering
 */
```

关键词：**Minimal（最小化）+ differential rendering（差分渲染）**。这是 TUI 引擎的两大设计支柱。

## 核心抽象：Component 组件树

`tui.ts` 里定义了整个引擎的基石：

```ts
export interface Component {
  render(width: number): string[]      // 渲染成字符串行（核心）
  handleInput?(data: string): void     // 可选：有焦点时接收键盘输入
  wantsKeyRelease?: boolean            // 是否要 key release 事件（Kitty 协议）
  invalidate(): void                   // 清缓存，标记需重绘
}
```

**关键：组件渲染成 `string[]`**——每个元素是一行（含 ANSI 颜色码）。这就是 TUI 的"绘制单元"：所有组件最终输出字符行。

组件有专门目录 `components/`：

| 组件 | 作用 |
| ---- | ---- |
| `text.ts` / `box.ts` | 基础文本/框 |
| `stack.ts` / `v-stack.ts` / `h-stack.ts` | 布局容器（纵/横排列） |
| `scroll-view.ts` | 滚动视图 |
| `input.ts` / `editor.ts` | 输入框（366 行）/ 编辑器（**2008 行**） |
| `markdown.ts` | Markdown 渲染（887 行） |
| `select-list.ts` / `settings-list.ts` | 选择列表 |
| `image.ts` | 终端图片（Kitty 协议） |
| `loader.ts` / `cancellable-loader.ts` | 加载动画 |

`editor.ts` 2008 行——是组件里最大的，因为编辑器要处理光标、选区、语法高亮、多光标等。

## 布局系统：LayoutBox 树

`layout.ts` 把组件树翻译成"屏幕上的矩形"：

```ts
interface LayoutBox {
  component: Component
  rect: LayoutRect        // 这个组件占哪块（x, y, width, height）
  clip: LayoutRect        // 裁剪区（子组件不能画出去）
  children: LayoutBox[]   // 子布局
  scrollView?: ScrollView // 如果有滚动
  layer: number           // 叠放层
}
```

**布局算法**：
1. 递归 `measureHeight/measureWidth`——先问子组件"给你宽度 W 你多高"（**测量**）
2. 计算每个组件的 `rect`（**定位**）
3. `updateClips` 沿树向下裁剪（**裁剪**）

```text
Container(width=80)
├─ Text("标题")      → rect{y:0, height:1}
├─ ScrollView        → rect{y:1, height:20}  ← 剩余空间
│   └─ Markdown(长文) → 内容比 rect 高 → scrollView 记录可滚动
└─ Input("提示符>")   → rect{y:21, height:1}
```

还有**渲染缓存**（`renderCache: Map<Component, Map<width, lines>>`）——同一个组件在同一宽度下渲染结果缓存，避免每次重绘都全量计算。

## 差分渲染（differential rendering）

TUI 引擎的经典性能优化：**只重画变化的部分**。`tui-main-screen.ts` 的 `doRender` 流程：

```ts
protected doRender(): void {
  // ① 渲染所有组件得新行
  let newLines = this.render(width)
  // ② 合成 overlays（弹层）
  if (hasOverlay) newLines = compositeOverlays(newLines, ...)

  // ③ 和上次的 previousLines 对比
  //    → 找到从哪行开始变了
  //    → 只对变化区域发 ANSI 移动光标 + 重写

  // 特殊情况：宽度变了 → 全量重绘（换行会全变）
  if (widthChanged) { fullRender(true); return }
  // 高度变了 → 全量重绘
  if (heightChanged) { fullRender(true); return }
  // 首次渲染 → 直接输出
  // 内容缩水 → 清空多余行
}
```

差分算法思想（在 findDifferentialRange 附近）：
```text
previousLines: [line1, line2, line3, line4]
newLines:      [line1, line2, line3', line4']

对比发现 line3 起不同 → 光标移到第 3 行 → 重写 line3'、line4
不变的行完全不碰 → 输出量最小
```

**为什么这是必须的？** 终端重绘 = 发一堆 ANSI 码。全量重绘 50 行 × 每秒 60 帧会闪烁；差分后每次只发几行的更新，流畅不闪。

## 渲染调度：16ms 节流

`TuiBase` 的调度逻辑（`requestRender`/`scheduleRender`）：

```ts
private static readonly MIN_RENDER_INTERVAL_MS = 16;  // ≈ 60 FPS

requestRender(force = false): void {
  // 非 force：合并请求 → process.nextTick → scheduleRender
  // scheduleRender：计算距上次渲染的时间差，补足到 16ms
  const elapsed = performance.now() - this.lastRenderAt;
  const delay = Math.max(0, 16 - elapsed);
  setTimeout(() => this.doRender(), delay);
}
```

设计：**多次 requestRender 合并成一次**（renderRequested 标志去重），且**最多 60 帧/秒**（16ms 间隔）。
另外用户输入走 `requestImmediateRender`（nextTick 优先）——**按键必须立刻响应，不能被节流**。

## 高级特性

### Kitty 键盘协议协商
`terminal.ts` 里和终端协商键盘协议，获得更精确的按键信息（key down/up 分开、修饰键）：

```ts
const KITTY_KEYBOARD_PROTOCOL_QUERY = `\x1b[>7u\x1b[?u\x1b[c`
```

这是主流终端（Kitty/WezTerm/iTerm2）支持的高级协议，让 TUI 能用上 Ctrl/Alt/Shift 组合键。

### 硬件光标与 IME 支持
`CURSOR_MARKER`（`\x1b_pi:c\x07`，零宽 APC 序列）：

```ts
// 组件渲染时在光标处发标记，TUI 找到后把硬件光标定位过去
// 意义：中文输入法（IME）候选窗要跟着光标位置走
```

细节见功力：没有硬件光标定位，中文输入法的候选窗口会飘在错误位置。

### Overlay 弹层
`OverlayAnchor`（center/top-left/…）+ 百分比尺寸（`"50%"`），支持模态弹层叠在界面上。

### 同步输出（Synchronized Output）
```ts
output.append("\x1b[?2026h")  // 开始同步输出
// ...写所有行...
output.append("\x1b[?2026l")  // 结束
```
避免终端在绘制过程中闪烁（中途刷新）。

## 自测

::: details 测验 · 点击展开

**1. Pi TUI 组件渲染的"绘制单元"是什么？**
- ✅ **字符串数组（string[]），每个元素一行（含 ANSI 码）**
- ❌ HTML DOM
- ❌ Canvas 像素
- ❌ JSON 对象

**2. LayoutBox 树做哪三件事？**
- ✅ **测量（measure）→ 定位（rect）→ 裁剪（clip）**
- ❌ 读取→写入→删除
- ❌ 编译→运行→测试
- ❌ 上传→下载→缓存

**3. 差分渲染的核心思想是？**
- ✅ **对比新旧行，只重写变化的部分，最小化终端输出**
- ❌ 每帧全量重绘
- ❌ 用缓存完全避免渲染
- ❌ 只渲染可见行（那叫虚拟化，不同概念）

**4. 渲染节流 16ms 的意义是？**
- ✅ **限制约 60 FPS，且合并多次请求，避免过度输出**
- ❌ 让界面更慢
- ❌ 16 秒渲染一次
- ❌ 没有任何意义

**5. CURSOR_MARKER 机制解决什么问题？**
- ✅ **让硬件光标跟着组件光标走，中文输入法候选窗定位正确**
- ❌ 加密光标位置
- ❌ 隐藏光标
- ❌ 加快渲染

:::

## 小结

- Pi 自研 **Minimal + 差分渲染** TUI 引擎
- 组件 = `render(width): string[]`；组件树 + LayoutBox 布局树（测量/定位/裁剪）
- **差分渲染**：对比 previousLines 只写变化行；尺寸变化才全量重绘
- **调度**：16ms 节流合并渲染，输入走 nextTick 优先
- 细节：Kitty 键盘协议、硬件光标（IME）、Overlay、同步输出

---

**推荐阅读**：Pi 源码 `packages/tui/src/tui.ts`（组件契约）· `tui-main-screen.ts`（差分渲染）· `layout.ts`（布局）

**下一课**：[⑦ 用 Pi 构建 RAG 应用](/pi/07-pi-rag-app)
