---
title: AI ④ Transformer 深度理解
---

# Transformer 深度理解

AI 基础专题第四课 · 基于微软课程第 18 课

::: tip 本课目标
Transformer 是**所有现代 LLM 的底座**（GPT/BERT/Claude 全是它）。这一课讲清楚：
RNN 为什么被取代、注意力是什么、位置编码和多头自注意力怎么工作。
学完你就理解了 Pi 专题里那些模型"内部在干什么"。
:::

## 为什么需要 Transformer：RNN 的两个死穴

RNN（循环神经网络）处理序列的方式是**逐个词吞、状态往下传**：

```text
RNN: w1 → w2 → w3 → ... → wn   （必须按顺序，w3 要等 w2 算完）
```

微软课指出两个问题：
1. **长句失忆**：encoder 的最终状态记不住句子开头（"信息衰减"）
2. **难以并行**：循环结构必须串行，训练没法用 GPU 并行加速 → 模型做不大

2017 年论文《Attention is All You Need》提出 Transformer，**完全抛弃循环**，用注意力机制捕获词间关系。

## 先理解注意力（Attention）

翻译长句时，不是每个词都同等重要。注意力机制回答：**生成输出词 y_t 时，该看重输入的哪些词？**

```text
翻译 "The cat sat on the mat"
生成 "猫" 时，注意力权重最大的是 "cat"
生成 "垫子" 时，注意力权重最大的是 "mat"

注意力矩阵 α[i,j]：输出第 i 个词，受输入第 j 个词多大的影响
```

RNN 版注意力（Bahdanau 2015）是在 encoder/decoder 间加"捷径"；Transformer 走得更远：**自注意力（self-attention）**——序列内部的词互相看：

```text
句子: The animal didn't cross the street because it was too tired
                                      ↑
                          "it" 通过自注意力知道 = "animal"
（核心指代消解，Google Blog 的经典例子）
```

## Transformer 两大发明

### ① 位置编码（Positional Encoding）

RNN 天然知道顺序（逐个处理）；Transformer 并行处理，词序信息丢了。解法：**给每个位置一个编码，和词向量相加**：

```text
词向量 "cat"  [0.5, -0.2, ...]
+ 位置编码 pos1 [0.01, 0.99, ...]   ← 位置 1 的编码
= 最终输入向量（词义 + 位置）

两种做法：
- 可训练的位置 embedding（微软课演示这个）
- 固定函数（原论文用正弦/余弦）
```

### ② 多头自注意力（Multi-Head Self-Attention）

"多头"= 多组注意力**并行**，每组学**不同类型的关系**：

```text
头 1：学"指代关系"（it → animal）
头 2：学"语法关系"（动词-宾语）
头 3：学"长距离依赖"（段落首尾呼应）
...

多个头并行 → 每头专注一种模式 → 合并
```

## 编码器-解码器架构

```text
            输入序列
               │
        [位置编码 + 嵌入]
               │
        ┌─ Encoder ─┐
        │ 自注意力     │ ← 捕获输入内部的模式
        │ 前馈网络     │
        │ （×N 层）   │
        └────────────┘
               │
        ┌─ Decoder ─┐
        │ 自注意力     │
        │ 编码器-解码器注意力 │ ← 翻译时"看"encoder 输出
        │ 前馈网络     │
        │ （×N 层）   │
        └────────────┘
               │
            输出序列（逐词生成）
```

注意力用在两处：
1. **encoder 内**：捕获输入文本自身的模式（自注意力）
2. **encoder→decoder 间**：翻译对齐（传统注意力）

## 为什么这带来革命

```text
RNN 时代：串行 → 模型小 → 效果有限
Transformer：并行 → 可以堆超大模型 + 海量数据 → 效果质变
```

**并行化**让"scaling"成为可能——GPT-3/4 的千亿参数、万亿 token 预训练，全靠这个架构属性。

## 之后的演化

| 架构 | 特点 | 代表 |
| ---- | ---- | ---- |
| **BERT** | 只用 Encoder，双向看上下文，预训练任务=预测被遮住的词 | BERT、RoBERTa |
| **GPT** | 只用 Decoder，单向（从左到右），预训练任务=预测下一个词 | GPT-3/4、你天天用的 |
| **T5/BART** | 完整 Encoder-Decoder | 翻译、摘要 |

微软课的重点：**迁移学习**——BERT 先在海量文本上预训练（学会语言），再针对具体任务微调（分类/NER）。这正是"预训练 + 微调"范式，也是 embedding（第 ③ 课末尾的上下文嵌入）的来源。

## 与本站专题的关系

```text
本课 Transformer
  ├─▶ Pi ②：pi-ai 调的每个模型（GPT/Claude/Qwen）都是 Transformer 家族
  ├─▶ RAG：LLM 的"生成"就是 decoder 逐词预测；上下文嵌入源于 BERT 路线
  └─▶ AI ⑤：语言模型课会继续展开 GPT 式生成
```

## 自测

::: details 测验 · 点击展开

**1. Transformer 取代 RNN 的核心原因是？**
- ✅ **RNN 串行难并行、长句失忆；Transformer 并行可规模化**
- ❌ RNN 太贵
- ❌ Transformer 更简单
- ❌ RNN 不能处理文本

**2. 自注意力（self-attention）做什么？**
- ✅ **让序列内部词互相关照，捕获上下文关系（如指代消解）**
- ❌ 翻译两种语言
- ❌ 压缩句子
- ❌ 给词排序

**3. 位置编码解决什么问题？**
- ✅ **Transformer 并行处理丢掉了词序信息，位置编码补回来**
- ❌ 加密数据
- ❌ 加速计算
- ❌ 减少内存

**4. "多头"注意力中"多头"的意义是？**
- ✅ **多组注意力并行，每组学不同类型的关系（指代/语法/长依赖）**
- ❌ 一个模型多个输出
- ❌ 多个模型投票
- ❌ 只是名字好听

**5. BERT 和 GPT 的核心区别是？**
- ✅ **BERT 用 Encoder 双向看上下文；GPT 用 Decoder 从左到右逐词生成**
- ❌ 完全相同
- ❌ BERT 更新
- ❌ GPT 不能生成文本

:::

## 小结

- Transformer = **位置编码 + 多头自注意力**，抛弃 RNN 的串行
- 注意力：生成每个词时**有权重地看所有输入词**；多头 = 多类关系并行
- 并行化 → 可堆超大模型 → GPT/BERT 革命
- 之后分化：BERT（双向理解）vs GPT（逐词生成），都是本课的子孙

---

**推荐阅读**：[Attention is All You Need 论文](https://arxiv.org/abs/1706.03762) · [微软课程第 18 课](https://github.com/microsoft/AI-For-Beginners/tree/main/lessons/5-NLP/18-Transformers)

**下一课**：[⑤ 从语言模型到 RAG](/ai/05-llm-to-rag)
