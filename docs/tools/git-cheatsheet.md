---
title: Git 指令速查
---

# Git 指令速查

日常开发常用的 Git 命令，按场景分类。打印友好，随时查阅。

## 1. 配置与初始化

```bash
git config --global user.name "你的名字"     # 设置提交者姓名
git config --global user.email "你的邮箱"    # 设置提交者邮箱
git config --list                            # 查看全部配置
git init                                     # 把当前目录变成 git 仓库
git clone <仓库地址>                          # 克隆远程仓库到本地
```

## 2. 日常开发循环（最常用）

```bash
git status                   # 看当前状态：改了哪些文件、什么分支
git diff                     # 看具体改了什么（未暂存的部分）
git add <文件名>             # 把改动加入暂存区
git add .                    # 暂存所有改动
git commit -m "说明文字"      # 提交（生成一个版本快照）
git push origin main         # 推送到远程仓库 main 分支
git pull                     # 拉取远程最新代码并合并
```

### 工作区 → 暂存区 → 仓库 的关系

```text
工作区          暂存区(stage)        本地仓库          远程仓库
  │   git add      │   git commit     │    git push    │
  │ ───────────▶   │ ─────────────▶   │ ────────────▶  │
  │                │                  │                │
  │                │                  │  ◀──────────── │
  │                │                  │    git pull    │
```

## 3. 分支操作

```bash
git branch                   # 列出本地分支
git branch <分支名>          # 创建分支
git checkout <分支名>        # 切换分支
git checkout -b <分支名>     # 创建并切换（一步到位）
git merge <分支名>           # 把指定分支合并到当前分支
git branch -d <分支名>       # 删除分支（已合并）
git switch <分支名>          # 新版切换分支（等价 checkout）
```

## 4. 查看历史与对比

```bash
git log --oneline            # 一行一条看提交历史
git log --graph --oneline    # 图形化看分支合并历史
git show <commit哈希>        # 看某次提交的详细改动
git diff <commit1> <commit2> # 对比两个提交的差异
git blame <文件名>           # 看每一行是谁、哪次提交改的
git show --stat <哈希>       # 看某次提交改了哪些文件
git log -S "关键词" --oneline # 搜某行代码什么时候引入
```

## 5. 撤销与回退（⚠️ 谨慎操作）

```bash
git checkout -- <文件名>     # 丢弃工作区改动（恢复到最后一次 add/commit）
git reset HEAD <文件名>      # 取消暂存（unstage），改动保留
git reset --soft HEAD~1      # 撤销上一次 commit，改动保留在暂存区
git reset --hard HEAD~1      # 撤销上一次 commit，改动全部丢弃（危险）
git revert <commit哈希>      # 安全地"撤销"某次提交（生成一个新提交反转它）
```

::: warning reset --hard 的危险性
`reset --hard` 会**永久丢弃**未提交的改动，不可恢复。除非确定不要了，否则优先用 `revert` 或 `--soft`。
:::

## 6. 远程仓库

```bash
git remote -v                # 查看远程仓库地址
git remote add origin <地址> # 关联远程仓库
git fetch                    # 拉取远程更新但不合并（安全）
git pull --rebase            # 拉取并把本地提交"重放"到最新之上（历史更干净）
git push -u origin main      # 首次推送并设置默认上游
```

## 7. 临时保存（stash）

```bash
git stash                    # 把当前改动"藏起来"（不提交，先去做别的事）
git stash pop                # 取回之前藏起来的改动
git stash list               # 查看所有 stash
git stash drop               # 丢弃某个 stash
```

## 8. 标签（发版本用）

```bash
git tag                      # 列出所有标签
git tag v1.0.0               # 打标签
git push origin v1.0.0       # 推送标签到远程
```

## 9. 常见场景速查表

| 场景 | 指令 |
|------|------|
| 改错文件了 | `git checkout -- 文件名` |
| commit 信息写错了 | `git commit --amend -m "新说明"` |
| 忘了 add 就 commit 了 | `git add 漏掉的文件` 然后 `git commit --amend --no-edit` |
| 合并冲突 | `git status` 找冲突文件 → 手动改 → `git add` → `git commit` |
| 想放弃本地一切改动回到远程 | `git fetch` 然后 `git reset --hard origin/main` ⚠️ |
| 看某次提交改了哪些文件 | `git show --stat <哈希>` |
| 搜某行代码什么时候引入 | `git log -S "关键词" --oneline` |
| 看当前分支和远程差几个提交 | `git status -sb` |

## 10. 合并冲突处理流程

```bash
# 1. 冲突发生后，先看哪些文件冲突
git status

# 2. 打开冲突文件，找冲突标记：
#    <<<<<<< HEAD        ← 你的改动
#    =======             ← 分隔线
#    >>>>>>> 分支名       ← 对方的改动
#    手动决定保留什么，删掉标记行

# 3. 标记为已解决并提交
git add 冲突文件
git commit -m "解决合并冲突"
```

## 相关链接

- [Git 官方文档](https://git-scm.com/doc)
- [Git Cheat Sheet（官方速查表）](https://training.github.com/downloads/zh_CN/github-git-cheat-sheet/)
- [Pro Git 中文版（免费书）](https://git-scm.com/book/zh/v2)
