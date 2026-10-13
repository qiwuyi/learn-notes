---
title: Agent ② 算法 · 算力 · 数据
---

# ② 算法 · 算力 · 数据

> 底土层：应用发展到一定程度才会拥有的自建能力。
> **学习目标：理解原理。**

## 算法

算法的核心作用是：**依据过往数据找到规律，从而对未来做出预测。**

日常例子：

- 推荐算法根据你过往的浏览记录，找到未来你可能喜欢看的内容
- 股票分析算法根据历史行情数据，预测未来走势

历史上诞生过各种各样的算法——聚类、随机森林、回归……而**大语言模型的算法要完成的是：根据人类过去说的话，预测下一个单词你会说什么。**

语言模型如此变化不定，各大算法尽其所能也难以模拟人类说话，直到 2022 年大家真的看到一个和人类说话如此相似的 ChatGPT。

而大语言模型的核心算法只有一个：**神经网络的前向传播和反向传播**。某种程度上，神经网络就是在模拟人类大脑神经元的机制，所以只需要一个，就能预测下一个单词。

::: tip 给产品经理的提示
对大多数产品经理来说，**你只需了解算法的原理，而不需要实际去调算法。**
:::

### 延伸阅读

| 形式 | 资源 |
| ---- | ---- |
| 视频 | [用水管解释神经网络，我 10 秒就懂了](https://www.xiaohongshu.com/discovery/item/6881d92000000000200189ae)（小红书） |
| 漫画 | [知乎漫画文章](https://zhuanlan.zhihu.com/p/660571164) |
| 文字 | [AI 产品的基础设施：算法、数据与大语言模型](https://time.geekbang.org/column/article/809668)（极客时间） |

## 算力

**要多少算力，首先需要计算 Token。**

| 资源 | 链接 |
| ---- | ---- |
| Token 换算比例官方指导 | [OpenAI Help Center](https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them) |
| Tokenizer playground | [platform.openai.com/tokenizer](https://platform.openai.com/tokenizer) |
| 成本计算公式 | [做大模型 AI 应用一定要了解的成本计算公式](https://mp.weixin.qq.com/s?__biz=MzUyODY0MTQ4OA==&mid=2247484596&idx=1&sn=921d43e5ec227d75856eeb3cc956808b)（公众号） |

进阶（极客时间课程）：

- [算力（一）：AI 时代的"电费"怎么算？](https://time.geekbang.org/column/article/820282)
- [算力（二）：私有化部署大模型到底有多贵？](https://time.geekbang.org/column/article/821400)

## 数据

推荐先看 [百度千帆作文点评与修改案例](https://ai.baidu.com/ai-doc/WENXINWORKSHOP/5ltziipsx)——看完就能理解**数据是如何影响模型的**（模型微调）。

大多数理解到这里就可以了。如果还好奇微调的原理，结合前面的"水管神经网络原理"，可以看作者极客时间课程里[「千层饼夹酱」的比喻](https://time.geekbang.org/column/article/817895)来理解最基础的 LoRA 微调原理。

## 这一章的位置

```text
算法（原理） ──▶ 神经网络 = 预测下一个词
算力（成本） ──▶ Token → 成本公式 → 部署方式
数据（质量） ──▶ 微调 / LoRA 如何改变模型
```

- 上一篇：[① AI 产品生态层级架构](/agent/01-ecosystem-layers)
- 下一篇：[③ 模型层：三步选型法](/agent/03-model-selection)
