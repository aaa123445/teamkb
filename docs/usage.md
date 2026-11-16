# TeamKB 团队知识共享平台使用说明

TeamKB 统一提供分类知识管理、团队规范、贡献审核和 Agent 经验沉淀。原有致远 V8 内容保留在「技术平台 / 致远 V8」分类，原文 ID 保持不变，工具统一使用通用的 `kb_*` 命名。网页面向日常操作；CLI 面向终端和脚本；MCP 让 Agent 调用工具；Skill 定义查规范、读文档、写代码和沉淀经验的工作流程。MCP 与 Skill 可以配合使用，CLI 也可以单独使用。

本文命令以 macOS / Linux 的 Bash 或 Zsh 为例。服务地址示例为 `https://www.ljc.monster`；自行部署时换成你的实际域名。所有 `YOUR_PERSONAL_KEY` 均为占位符，不是可用凭据。

## 一键接入本地 Agent

在工作台左侧选择「一键接入」，先选择 **Codex**、**Claude Code** 或 **其他智能体（含 dsh）**。Codex 和 Claude Code 各自生成可直接在本机终端执行的一键安装命令（macOS / Linux 为 Shell，Windows 为 Python），选择 macOS / Linux 或 Windows PowerShell；其他智能体继续复制安装提示词交给本地 Agent。

Shell 入口会先检查操作系统与架构、curl、Python 3.11+、venv / ensurepip / TLS、Agent 命令和域名下载服务；缺失时明确指出解决方式。检查通过后才请求个人 Key、创建独立虚拟环境并安装客户端。可追加 `--check-only` 仅检测环境，不读取凭据或改写配置。CLI 模式不强制要求 Agent 命令存在，MCP 则要求所选 Agent CLI 已安装。安装期间在终端隐藏输入个人 API Key；项目接入还会询问已有项目路径。Key 不出现在安装命令或 shell 历史中。安装器会验证凭据、完成用户／项目连接初始化，不需要再让 Agent 执行安装提示词。

- **CLI 模式**：安装器自动备份并合并 Codex `AGENTS.md`（已有 override 时使用生效文件）或 Claude Code `CLAUDE.md`，只替换 TeamKB 管理区块。默认写入任务完成后按需提交已验证知识的规则，可关闭沉淀。
- **MCP 模式（包括 MCP + Skill）**：注册所选范围的 MCP，不写入、不修改系统提示词或指令文件。MCP + Skill 额外安装 Skill。重复安装更新同名配置，保留其他服务；安装后重启 Agent，并验证实际工具调用。
- **仅 Skill 模式**：安装 CLI 依赖与 Skill，并合并所选 Agent 的指令。
- **其他 Agent**：保留提示词安装，支持在本机填写 Key；若选择 MCP，同样不允许写入系统提示词。CLI 模式由 Agent 检查支持的持久化入口，无法确定时提供可复制的规则文本。

示例（macOS / Linux，以下为简版命令；接入页生成的版本还会在运行前校验安装器 SHA-256）：

```bash
# Codex：CLI 安装并写入指令
curl --http1.1 --retry 3 --retry-all-errors --connect-timeout 15 -fsSL https://www.ljc.monster/install.sh -o teamkb-install.sh && bash teamkb-install.sh codex cli user && source "$HOME/.teamkb-venv/bin/activate"
# Claude Code：把 codex 改成 claudecode
# MCP：把 cli 改成 mcp；不修改系统提示词
# 项目范围：把 user 改成 project；安装时询问项目路径
# 仅环境检测：在 bash 的参数后加 --check-only，并去掉末尾 source
```

安装命令会在成功后通过 `source "$HOME/.teamkb-venv/bin/activate"` 刷新当前终端，随后可直接执行 `wb stats`。必须在当前终端执行这个外层 `source`；单独运行 Bash 子进程无法修改父级 zsh 的环境。

所有下载均走本站域名，完整安装命令请从接入页按 Agent、接入方式、范围和系统复制。项目范围只用于连接隔离；提交知识不要求项目候选初始化。个人中心可以创建并吊销 Key，writer 才能提交知识；默认贡献仍待管理员审核。使用独立 Key，避免提交到仓库或共享聊天。

## 平台使用：分类、审核与版本

- 「团队知识库」按分类树浏览，点击标签可筛选；「知识检索」支持分类（包括子分类）内的全文检索。
- writer / admin 在「经验沉淀」保存草稿或提交审核。「我的贡献」可查看审核进度和意见，草稿与待审核内容不会出现在共享检索中。
- 管理员在「贡献审核」检查方案正文、验证材料、相似知识和适用限制，可发布、退回修改或拒绝。人工贡献不要求填写 Agent 的结构字段，由审核者判断质量。
- 修正已有知识时，从文档页「建议更新」发起。它关联目标文档的当前版本，审核时若版本已变化会拒绝覆盖，需退回后重新核对并提交。
- 文档页「版本历史」可以查看历史快照。管理员恢复历史版本时会新建一个版本，保留原有历史。
- 「分类管理」可维护分类层级；「团队规范」可编辑分类对应的规范、检查清单和参考文档，供网页与 `kb_rules` 共用。
- 语雀仍是已配置外部知识的同步来源；后续同步可能更新其正文，同时保留版本快照。需要独立维护的团队经验应创建新知识并引用原文。
- 个人调用日志会记录检索、阅读、提交、审核和回滚等调用的状态与结果，仍按账号隔离并执行保留期限。

## Agent 自动沉淀：直接提交与可选项目 Hook

CLI / 仅 Skill 安装会将知识工作流写入本地 Agent 的持久化指令（MCP 模式不写入）：Codex 全局使用实际 `CODEX_HOME/AGENTS.md`（默认 `~/.codex/AGENTS.md`），项目使用 `AGENTS.md`；Claude Code 全局使用 `~/.claude/CLAUDE.md`，项目使用 `CLAUDE.md`。先检查覆盖设置并确认实际加载。dsh 先检查本机帮助和配置以核实系统提示词入口，不假设路径。其他 Agent 无法确认持久化入口时，安装者交付可复制的提示词，由用户粘贴到自定义指令入口；仅会话有效的方式需在新会话重新粘贴。安装者保留已有规则、备份文件，只替换 `TEAMKB:BEGIN` / `TEAMKB:END` 区块，不写入 Key。完整模板见仓库 `skill/team-knowledge/references/agent-instructions.md`。

**提交知识不要求项目初始化。** 先完成用户级连接 `wb init --scope user`，然后可在任意目录使用 `kb_propose` 或 `wb propose /absolute/path/to/candidate.json`。候选文件可存放在用户私有目录，无需项目根路径、`wb agent init` 或 `.teamkb/config.json`。连接配置用于地址和鉴权，项目 Hook 开关只是另一种可选的任务完成触发方式。

启用沉淀后，Agent 完成任务应判断是否有新的排障解法、团队规范经验或适用限制；有真实验证和复用价值时先检索去重、分类、脱敏，再直接提交，不逐次要求确认。无新知识、未验证、重复或只有 reader 权限时跳过；用户在当前任务禁止上传时遵守该限制。MCP、CLI 和 Hook 只选一种提交渠道，不能重复提交。关闭沉淀时仅在用户明确要求后提交。Skill / 提示词引导模型判断，不能保证每次任务完成都触发。

直接提交示例（候选按 Skill 模板整理，不能直接提交示例内容）：

```bash
wb propose "$HOME/.teamkb/candidates/verified-solution.json"
wb contributions
```

### 可选：项目候选与任务完成 Hook

只有需要项目候选文件或确定性的任务完成 Hook 时才进行以下设置；普通知识提交跳过本节。

先安装下文 CLI 并执行 `wb init` 完成知识访问初始化；自动沉淀需要 writer Key。临时环境方式也可在客户端设置 `TEAMKB_URL` 与 `TEAMKB_KEY`（或继续使用兼容的 `V8WB_URL` / `V8WB_KEY`）。新版客户端需要本次更新后的代码；已安装的旧客户端应重新安装本站发布的客户端包。以下命令在开发项目中执行：

```bash
export TEAMKB_URL="https://www.ljc.monster"
export TEAMKB_KEY="YOUR_PERSONAL_KEY"
wb agent init --project /absolute/path/to/project
```

命令创建 `.teamkb/config.json`，内容为 `{"enabled": true, "candidate_file": ".teamkb/candidate.json"}`。只对该项目启用；停用时将 `enabled` 改为 `false`。建议把 `.teamkb/candidate.json`、`.teamkb/submitted.json` 加入项目 `.gitignore`，不要把 Key 写进项目配置。

把下载并安装的 `team-knowledge/references/candidate.json` 复制为项目候选文件，再由 Agent 根据实际任务填写。模板故意将 `verified` 与 `reusable` 设为 false，不能直接提交。Agent 材料要求：问题至少 10 字符、解法至少 20 字符、真实验证说明至少 10 字符、限制至少 5 字符、正文至少 80 字符，并明确 `verified: true`、`reusable: true`。这些是完整性门槛，不代表系统已替你验证方案正确性。

```bash
# 人工触发一次任务完成处理：只读取候选文件，不扫描仓库或会话
wb agent complete --project /absolute/path/to/project
# 显式提交一个经过验证的方案
wb propose /absolute/path/to/candidate.json
# 材料尚未验证时，只保存草稿
wb propose /absolute/path/to/candidate.json --draft
wb contributions
wb contributions CONTRIBUTION_ID
```

默认结果是 `pending`（待审核），审核后才共享。同一候选重复执行会去重；修正已有文档请设置 `target_doc_id` 和 `base_version`（来自读取结果的 `knowledge_version`）。新 MCP 工具为 `kb_categories`、`kb_search`、`kb_read`、`kb_rules`、`kb_propose`、`kb_contributions`，传参及返回结构可在 API 文档中查看。`v8_*` MCP 工具已弃用并移除，请更新客户端后使用 `kb_*`；`wb push` 提交仍进入人工审核，不直接发布。

MCP 在 `local` 离线模式下只操作本地库，候选不会发送给团队服务器，也不会自动发布。需要团队共享请使用默认 proxy 模式。

## 失败重试与任务完成 Hook

网络失败、HTTP 429 或 5xx 时，`wb propose` / `wb agent complete` 会将候选保存在 `~/.teamkb/queue`（目录 700、文件 600），不保存 Key。单次最多保存 100 条，按服务地址隔离。重试使用当前环境中的 Key，请保持原来的账号身份。

```bash
wb queue list
wb queue retry
# 修复凭据或材料错误后，手动重置 blocked / exhausted 项再重试
wb queue retry --reset
# 无效或过时材料：移除旧队列条目，修改候选文件后重新提交
wb queue remove QUEUE_ID
```

重试最多 5 次，指数退避，尊重数值 Retry-After；401/403 等不可重试错误会变为 `blocked`，达到次数上限变为 `exhausted`。`retry` 只处理已到重试时间的条目，调度由你的任务完成脚本或定时任务调用，本工具不会自行常驻。成功后删除队列条目；本地成功状态用于防止同一候选重复提交。长时间离线后请检查候选是否仍有效。

通用完成命令为 `wb agent complete --project PROJECT_ROOT`。任何支持任务完成事件的 Agent 都可在该事件中执行此命令，项目未开启或没有候选文件时会跳过。Skill 只是工作流程指导，不能保证每个 Agent 在每次退出时都运行；需要确定性触发时配置 Hook。

下载的 Skill 包提供 `team-knowledge/scripts/completion_hook.py`：从标准输入读取带 `cwd` 的 JSON，只在这个目录明确启用时运行；不读 transcript、不执行候选中的命令，错误不会阻断主任务。必须用安装了客户端的虚拟环境 Python 运行。

Claude Code 项目 `.claude/settings.json` 的示例（合并到已有配置，不要覆盖其他 Hook）：

```json
{
  "hooks": {
    "Stop": [{"hooks": [{
      "type": "command",
      "command": "/absolute/path/to/.teamkb-venv/bin/python /absolute/path/to/installed/team-knowledge/scripts/completion_hook.py",
      "timeout": 90
    }]}]
  }
}
```

Hook 用事件 `cwd` 找项目配置，子目录启动时需要在该目录启用，或改用固定项目根目录的完成命令。不要同时通过 MCP 和 Hook 提交同一方案。

管理员可以在「工作台管理」对指定 writer/admin Key 授权自动发布。仅限该 Key 提交的 Agent 材料满足全部完整性条件、没有相似已发布知识时才自动发布，并记录审核事件；普通人工提交和更新建议仍按审核流程处理。相似度仅为标题与内容指纹的启发式检查，不是语义查重。默认所有 Key 都关闭此权限，个人账号不能自行开启。

凭据模式检测只是一层辅助检查，不能识别所有敏感数据；Agent 应在本地先删除密码、Token、客户信息与无关代码。队列只存已经整理的候选，不应包含原始会话。

## 1. 开通账号与个人 Key

1. 在工作台右上角选择「登录 / 注册」，进入「注册入网」。填写姓名、用户名和至少 10 个字符的密码。
2. 注册后自动登录个人中心，账号状态为「待审批」。此时只能查看自己的状态、修改密码和阅读使用说明，不能查询知识库或创建 Key。
3. 联系管理员核实身份。管理员在「工作台管理 → 账号审批与管理」中选择角色，点击「批准入网」。注册不会自动获得管理员权限。
4. 在个人中心刷新状态，获批后即可直接使用网页，无需配置 API Key。
5. 在「个人中心 → 我的 API Key」输入名称、选择权限并创建。完整 Key 只显示一次，请立即保存。建议每台电脑或每个 Agent 单独使用一个 Key。

| 角色 | 检索与阅读 | 提交经验 | 审批与全局管理 |
| --- | --- | --- | --- |
| reader / 只读成员 | 支持 | 不支持 | 不支持 |
| writer / 读写成员 | 支持 | 支持 | 不支持 |
| admin / 管理员 | 支持 | 支持 | 支持 |

个人 Key 权限不能超过账号权限，每个账号最多启用 20 个 Key。账号被降级后，已有 Key 的有效权限也会随之降低。账号被拒绝或停用时，个人 Key 全部吊销；重新批准账号不会复活旧 Key，需要重新创建。

浏览器登录与客户端 Key 是两种凭据：密码用于登录网页，Key 用于 MCP、CLI 等客户端。不要把密码填进 `V8WB_KEY`。修改密码会使所有浏览器登录会话退出；如 Key 泄露，还需在个人中心单独吊销。

## 2. 安装 CLI 与公共环境

客户端需要 **Python 3.11+** 和能访问工作台域名的网络。CLI、MCP 共用下面的客户端 wheel；Skill 使用同一域名发布的 ZIP。安装和升级均从本站域名下载，无需克隆源码仓库。

在开发电脑创建独立环境并安装：

```bash
python3 -m venv ~/.teamkb-venv
source ~/.teamkb-venv/bin/activate
python -m pip install --upgrade --force-reinstall --no-cache-dir "https://www.ljc.monster/static/downloads/v8_workbench-0.5.6-py3-none-any.whl"
wb --help
```

- 客户端 wheel：[下载 CLI / MCP 客户端](https://www.ljc.monster/static/downloads/v8_workbench-0.5.6-py3-none-any.whl)。
- Skill ZIP：[下载 team-knowledge](https://www.ljc.monster/static/downloads/team-knowledge-0.5.6.zip)。
- SHA-256 清单：[核对下载文件](https://www.ljc.monster/static/downloads/manifest.json)。下载后应与清单中的哈希一致，不一致时重新下载并停止安装。

后续打开终端时，先执行 `source ~/.teamkb-venv/bin/activate`，或使用 `~/.teamkb-venv/bin/wb` 的绝对路径。Windows PowerShell 用 `py -m venv "$HOME/.teamkb-venv"` 创建环境、`& "$HOME/.teamkb-venv/Scripts/Activate.ps1"` 激活；wb 路径为 `$HOME/.teamkb-venv/Scripts/wb.exe`。随后使用同一域名的 wheel 安装命令。

### 先初始化，再使用 CLI 或 MCP

新版客户端增加 `wb init`，CLI 和 `wb mcp` 共用初始化配置。先执行 `wb init --help`；若提示没有该命令，请更新客户端。下载包仍为 0.5.6 时也需加 `--force-reinstall --no-cache-dir` 重装，以服务器当前 SHA-256 清单为准。

| 范围 | 初始化命令 | 保存位置 | 后续使用 |
| --- | --- | --- | --- |
| 全局接入 | `wb init --scope user` | `~/.teamkb/client.json` | 当前用户在任意目录使用，项目配置可覆盖它 |
| 项目接入 | `wb --project /absolute/path/to/project init --scope project` | `PROJECT_ROOT/.teamkb/client.json` | 在该项目或子目录使用；从别处启动时传 `--project` |

以下先临时提供服务地址，Key 由终端隐藏输入，不放到命令行历史中：

```bash
export TEAMKB_URL="https://www.ljc.monster"
# 全局接入（不必给每个项目重复初始化）
wb init --scope user
# 或选择项目接入；先把路径换成真实项目根目录
wb --project /absolute/path/to/project init --scope project
```

如已通过本机安全方式设置 `TEAMKB_KEY`，初始化会读取它；兼容 `V8WB_URL` / `V8WB_KEY`。不要把 `YOUR_PERSONAL_KEY` 占位符作为真实凭据。Windows PowerShell 使用 `$env:TEAMKB_URL = "https://www.ljc.monster"`，其余 `wb` 初始化参数相同；目录中有空格时给路径加引号。

全局配置存在当前用户目录；项目配置自动追加到项目 `.gitignore`，不提交凭据。POSIX 配置文件权限为 600，Windows 应限制为当前用户可读写。重新执行同范围初始化会更新该连接配置，保留其他字段；不覆盖其他 MCP 或 Skill。

**配置优先级：**命令行 `--url` / `--key` > `TEAMKB_*`（兼容 `V8WB_*`）环境变量 > 当前项目或其祖先目录的 `.teamkb/client.json` > 用户 `~/.teamkb/client.json`。项目配置整体覆盖全局连接，不把全局 Key 自动套到项目的另一个服务地址。显式切换到不同 URL 时，需要为该 URL 提供匹配的 Key。环境变量仍优先生效，旧变量可能覆盖新初始化的配置。

初始化后开一个没有临时连接变量的新进程验证；如果在当前终端测试，先清除本次临时设置（不要删除自己原有持久配置）：

```bash
unset TEAMKB_URL TEAMKB_KEY V8WB_URL V8WB_KEY
# 全局接入可在任意目录执行；项目接入先 cd 到项目或使用下方显式路径
wb health
wb stats
wb categories
wb --json search "开发" -n 3
# 从项目外部调用
wb --project /absolute/path/to/project stats
```

PowerShell 清除本次临时环境变量可用 `Remove-Item Env:TEAMKB_URL,Env:TEAMKB_KEY,Env:V8WB_URL,Env:V8WB_KEY -ErrorAction SilentlyContinue`。

`health` 免鉴权，只验证连通；`stats`、`categories` 和检索成功才表示地址与 Key 可用。初始化不会自动开启贡献或上传：`wb agent init --project PROJECT_ROOT` 仅是经验候选提交开关，不能替代 `wb init`。普通知识检索无需执行 `wb agent init`。

升级客户端：激活原虚拟环境，重新从本站安装。即使版本号未变，也应使用强制重装和禁用缓存，避免继续使用旧客户端：

```bash
python -m pip install --upgrade --force-reinstall --no-cache-dir "https://www.ljc.monster/static/downloads/v8_workbench-0.5.6-py3-none-any.whl"
wb init --help
```

升级后重启 Agent / MCP 会话；已有初始化配置不受影响。重新使用一键接入可更新持久化指令中的沉淀策略。

### 已安装却无法接入时

- `wb: command not found`：新安装器会配置终端 PATH，请新开终端；zsh 可执行 `source ~/.zshrc`。旧安装可先执行 `source ~/.teamkb-venv/bin/activate`，或直接使用 `~/.teamkb-venv/bin/wb stats`。
- 仍连接 `127.0.0.1:8770`：没有可用的接入配置；先执行对应范围的 `wb init`。
- 终端可用而 MCP 失败：确认 MCP 使用同一虚拟环境的 wb；项目模式加 `--project` 绝对路径。IDE 不一定继承终端环境。
- 切换项目后失败：当前项目可能覆盖用户配置；检查项目初始化及残留 `TEAMKB_*` / `V8WB_*` 环境变量。
- 401/403：Key 失效、账号待审核或权限不够，检查个人中心，不用网页登录密码代替 Key。
- MCP 无工具或 Skill 未出现：确认所选用户 / 项目注册范围，信任项目并重启 Agent 会话，再实际调用工具。


## 3. MCP 安装与接入

本项目目前提供 **本地 stdio MCP 代理**：Agent 启动本机的 `wb mcp`，由它调用工作台 HTTPS API。不要把网站地址直接当作远程 MCP URL；本项目没有对外提供 `/mcp` HTTP 服务，也不使用 OAuth 登录。

先完成上一节 CLI 安装与 `wb init` 初始化，并确认在没有临时环境变量的新进程中 `wb stats` 成功。以下路径必须换成你开发电脑上的绝对路径。

### Codex：全局或项目接入

全局接入先执行 `wb init --scope user`，再在当前用户的 `~/.codex/config.toml` 合并：

```toml
[mcp_servers.teamkb]
command = "/absolute/path/to/.teamkb-venv/bin/wb"
args = ["mcp"]
startup_timeout_sec = 20
tool_timeout_sec = 90
```

项目接入先执行 `wb --project /absolute/path/to/project init --scope project`。在受信任项目的 `.codex/config.toml` 中合并：

```toml
[mcp_servers.teamkb]
command = "/absolute/path/to/.teamkb-venv/bin/wb"
args = ["--project", "/absolute/path/to/project", "mcp"]
startup_timeout_sec = 20
tool_timeout_sec = 90
```

配置中不需要放 Key；`wb` 会读取相应范围的私有配置。项目目录必须是绝对路径，不能依赖 Agent 的启动目录。Codex 仅对受信任项目加载项目配置；以本机 `codex --help`、现有设置和官方文档核实当前版本的支持情况。

已有配置如果使用 `env_vars` 转发或 `[mcp_servers.teamkb.env]` 固定 `V8WB_URL` / `V8WB_KEY`，这些变量仍优先于初始化配置。切换到新初始化方式时只移除 TeamKB 条目里失效的变量，不动其他服务。不要同时注册同一连接的 `v8-workbench` 与 `teamkb`。

```bash
codex mcp list
```

重新开启会话，通过 `/mcp` 检查 teamkb，再实际调用 `kb_categories` 或 `kb_search`，不能只检查配置文件已写入。

### Claude Code：全局或项目接入

全局接入完成用户初始化后执行：

```bash
claude mcp add --transport stdio --scope user teamkb -- /absolute/path/to/.teamkb-venv/bin/wb mcp
```

项目接入先初始化项目，再在**实际开发项目根目录**执行：

```bash
claude mcp add --transport stdio --scope project teamkb -- /absolute/path/to/.teamkb-venv/bin/wb --project /absolute/path/to/project mcp
claude mcp list
```

项目 MCP 注册写入 `.mcp.json`，其中只放命令、路径及参数，不放 Key；个人访问凭据由 `.teamkb/client.json` 提供。项目配置可能需要信任或授权，重新开启 Claude Code，通过 `/mcp` 核实工具列表并实际检索。

### 其他支持 stdio 的 MCP 客户端

先查客户端支持的用户 / 工作区配置范围。下面是项目接入的常见 `mcpServers` 配置；`command` 替换为虚拟环境中的 wb 绝对路径：

```json
{
  "mcpServers": {
    "teamkb": {
      "command": "/absolute/path/to/.teamkb-venv/bin/wb",
      "args": ["--project", "/absolute/path/to/project", "mcp"]
    }
  }
}
```

全局接入则使用用户级配置、先执行用户初始化，并改成 `"args": ["mcp"]`。Windows 使用虚拟环境的 `Scripts\wb.exe`，JSON 中反斜杠需要转义。配置路径和注册格式以当前客户端帮助为准；客户端不支持项目范围时明确说明限制，不静默扩大为全局接入。

### 可用工具与验证任务

| MCP 工具 | 用途 |
| --- | --- |
| `kb_stats` | 检查团队知识库规模与连接 |
| `kb_categories` | 列出全部知识分类和文档数量 |
| `kb_rules` | 按分类获取团队规范 |
| `kb_search` | 按关键词、分类与标签检索知识 |
| `kb_read` | 读取正文与版本；长文按 next_offset 续读 |
| `kb_graph` | 查看知识引用和关联链 |
| `kb_ask` | 基于知识库问答，需要管理员配置模型 |
| `kb_propose` | 提交经过验证的方案，默认待管理员审核 |
| `kb_contributions` | 查看自己的贡献状态及审核意见 |

验证提示词：“请先用 kb_categories 查看团队知识分类，再用 kb_rules 获取相关规范，检索与当前任务有关的知识，用 kb_read 核对原文并列出实现依据。”

升级后重启本地 Agent / MCP 会话以刷新工具列表。旧配置中对 `v8_*` 的工具白名单、工作流引用需改为上表对应的 `kb_*` 工具；检索 V8 知识时同样使用分类筛选。

`wb mcp` 启动后安静等待输入是正常现象，它不是交互式终端程序。只有需要本机离线知识库时才使用 `wb mcp --local`；该模式不连接线上，也不会自动下载线上文档。

## 4. Skill 安装与使用

Skill 从本站的 [team-knowledge ZIP](https://www.ljc.monster/static/downloads/team-knowledge-0.5.6.zip) 下载，解压后得到 `team-knowledge/` 目录，包含 `SKILL.md`、`references/` 和 `scripts/`。请复制整个目录，不能只复制 `SKILL.md`。Skill 约定工作流程，本身不携带知识库；仍然需要已经可用的 MCP 或 `wb` CLI。

先完成所选范围的 `wb init` 和 CLI 鉴权验证。下载并解压本站 ZIP，以下命令以 macOS / Linux 为例：

```bash
mkdir -p "$HOME/.teamkb/downloads/skill"
curl -fL "https://www.ljc.monster/static/downloads/team-knowledge-0.5.6.zip" -o "$HOME/.teamkb/downloads/team-knowledge.zip"
curl -fL "https://www.ljc.monster/static/downloads/manifest.json" -o "$HOME/.teamkb/downloads/manifest.json"
# 解压前核对 ZIP 的 SHA-256 与清单一致
python -c 'import hashlib,json,pathlib; p=pathlib.Path.home()/".teamkb/downloads"; actual=hashlib.sha256((p/"team-knowledge.zip").read_bytes()).hexdigest(); expected=json.loads((p/"manifest.json").read_text())["sha256"]["team-knowledge-0.5.6.zip"]; assert actual==expected,"SHA-256 不匹配，停止安装"'
python -m zipfile -e "$HOME/.teamkb/downloads/team-knowledge.zip" "$HOME/.teamkb/downloads/skill"
```

Windows 可用浏览器下载同域名 ZIP 和校验清单，再用 PowerShell `Get-FileHash -Algorithm SHA256` 核对、`Expand-Archive` 解压。全局接入放用户 Skill 目录，项目接入放该开发项目 Skill 目录，不能只装工作流而漏掉初始化。

### Codex：用户级安装

```bash
mkdir -p "$HOME/.agents/skills"
cp -R "$HOME/.teamkb/downloads/skill/team-knowledge" "$HOME/.agents/skills/"
```

也可在你实际开发的项目根目录创建 `.agents/skills/`，把同一目录放进去，作为项目级 Skill。确认目标文件是 `.agents/skills/team-knowledge/SKILL.md`，不要多嵌套一层同名目录。

重新开启 Agent 会话，确认能发现 `team-knowledge`。示例：“请使用 team-knowledge skill，帮我规划一个 V8 SPI 扩展，先查规范与文档再给方案。”

### Claude Code：用户级安装

```bash
mkdir -p "$HOME/.claude/skills"
cp -R "$HOME/.teamkb/downloads/skill/team-knowledge" "$HOME/.claude/skills/"
```

项目级安装则放到实际开发项目的 `.claude/skills/team-knowledge/`。重新开启会话后，可通过 `/team-knowledge` 或明确要求使用这个 Skill 启动工作流程。

### 推荐使用顺序

1. 识别任务所属分类，用 `kb_categories` 与 `kb_rules` 或 `wb categories` 与 `wb standards` 获取分类和规范。
2. 用 `kb_search` 或 `wb search` 检索，再用 `kb_read` 或 `wb read` 读取相关原文。
3. 基于文档与项目版本实施代码，完成提交前自查。
4. 如果发现可复用的新经验，用 `kb_propose` 或 `wb propose` 提交审核。提交前移除客户敏感数据和密钥。

升级 Skill：重新从本站域名下载 ZIP、核对最新 SHA-256，解压到新的临时目录后更新已安装的完整 `team-knowledge/` 文件夹；保留其他 Skill 不变，避免重复嵌套同名目录。重启 Agent 会话加载更新。

## 5. CLI 常用命令

以下命令依赖前面已设置的 `V8WB_URL` 与 `V8WB_KEY`。全局参数如 `--json`、`--timeout` 要放在子命令之前。

```bash
# 连通性和凭据验证
wb health
wb stats

# 查领域与规范
wb domains
wb rules spi
wb rules integration --docs

# 检索，限制返回数量或知识领域
wb search "组织同步 中间表" -n 5
wb search "SPI 扩展" -d "扩展能力"
wb --json search "UDC 页面"

# 用实际搜索结果中的文档 id 读取
wb read "yuque:实际文档ID"
wb read "yuque:实际文档ID" --offset 6000 --max-chars 6000
wb read --title "实际文档标题"

# 沉淀单篇或整个目录，需要 writer/admin
wb push ./notes/example.md --project "脱敏项目名" --tags "UDC,前端"
wb push ./notes --project "脱敏项目名" -y
```

人工贡献正文至少 20 个字符，提交后由管理员审核。`wb push` 默认会展示待上传条目并要求确认，`-y` 用于已审核的脚本场景。重复内容会去重；请先在本地检查文件内容，不要误传整个项目。

个人 Key 的创建与吊销在网页「个人中心」完成。下面的 CLI 管理命令属于全局管理员功能，普通账号的 Key 不能使用：

```bash
wb key list
wb key create local-agent --role writer --rpm 60 --daily 5000
wb key revoke --prefix wr_实际前缀
wb --timeout 600 sync
```

## 6. 管理员操作与迁移

既有部署的管理员 Key 仍有效，可在「登录 / 注册 → 使用已有 API Key」中连接。随后在「工作台管理 → 账号审批与管理」审批注册申请。为本人创建管理员账号时，先正常注册并退出新账号，再在登录页使用原管理员 Key，将该账号批准为 admin；不会把首个注册者自动设为管理员。

审批时可选择 reader、writer 或 admin，填写可选的审批说明。不要给仅需检索或提交经验的成员分配 admin。被拒绝或停用的账号可以由管理员重新批准。

「我的 API Key」只显示本人 Key；「工作台管理 → API Key 管理」是管理员的全局列表，包含归属账号和旧版系统 Key。新管理员账号通过全局页面创建的 Key 也会归属自己；原有无归属 Key 保持兼容，不会自动转给任意注册者。

账号密码使用带随机盐的 PBKDF2 哈希保存；浏览器会话通过 HttpOnly Cookie 保存。登录会话有效期 7 天；退出或改密码会撤销会话。HTTPS 访问时 Cookie 设置 Secure。个人 Key 仅保存哈希。

管理员不能停用或降级当前管理员账号，也不能移除最后一个已批准的管理员账号。保留原部署管理员 Key，直到你确认新管理员账号可正常登录、审批和管理。

部署升级前备份 SQLite 数据库。新增账号表、会话表、审批记录和 Key 归属字段由启动时自动迁移；升级时使用 `deploy/update.sh`，不要重跑首次安装脚本来更新现有站点。

## 7. 常见问题与排查

| 现象 | 排查方式 |
| --- | --- |
| 已注册但看不到知识或不能创建 Key | 登录个人中心查看审批状态；待审批、拒绝和停用状态均不可使用 |
| 无法创建 writer/admin Key | Key 角色不可高于账号角色；需要更高权限请联系管理员 |
| 401 / 凭据无效 | 网页重新登录；客户端检查 V8WB_KEY、Key 是否吊销、账号是否被停用 |
| 403 / 权限不足 | 检查账号审批状态以及 Key 角色；writer 才能提交经验，admin 才能审批或同步 |
| 429 | 达到调用额度或登录限流，按提示等待；不要让脚本无限重试 |
| MCP 找不到 wb | 使用虚拟环境内 wb 的绝对路径；Windows 指向 wb.exe |
| MCP 连上但没有查到内容 | 先调 kb_stats 验证连接，再用更短的平台术语检索 |
| Agent 看不到环境变量 | 从设置好环境变量的终端启动，或在本机客户端配置中设置 env；重启 Agent |
| Skill 未出现 | 确认目录下有 SKILL.md，整个目录已复制；检查安装位置与客户端支持，重新打开会话 |
| CLI health 成功但 stats 失败 | health 不检查凭据；检查个人 Key 和批准状态 |
| 长文未读完 | 根据 next_offset 继续读取，CLI 使用 --offset |
| 找不回完整 Key | 无法重新查看；吊销旧 Key 后创建新 Key，再更新各客户端 |
| 忘记账号密码 | 联系管理员核实身份；当前版本未实现邮件找回，不能靠 Key 直接查询或重置密码 |

先运行 `wb --help` 与 `wb stats`，再排查 MCP／Skill。工作台网站的网页 Cookie 不会自动传给 MCP 或 CLI，客户端始终需要个人 Key。

## 8. 配置参考

客户端配置参照以下官方文档，并与本仓库的 `cli/wb.py`、`server/api/mcp_server.py` 和 `skill/team-knowledge/` 实现核对。不同客户端版本的界面可能不同。

- [OpenAI 官方 MCP 配置说明](https://developers.openai.com/codex/mcp/)
- [OpenAI 官方 Skills 目录与使用说明](https://developers.openai.com/codex/skills/)
- [Claude Code MCP 配置说明](https://code.claude.com/docs/en/mcp)
- [Claude Code Skills 使用说明](https://code.claude.com/docs/en/skills)

## 9. 个人调用日志

从侧栏「我的调用日志」或「个人中心 → 我的调用日志」进入。账号登录时，可以查看自己的网页调用及全部个人 Key 的历史；通过 API Key 连接时，只能查看当前 Key 的调用，管理员 Key 也没有查询其他账号日志的特殊入口。

记录知识检索、文档读取、规范、领域、统计、最近更新、知识提交、批量提交、删除、语雀同步与索引重建。每条日志包含调用开始时间、操作、来源、Key 前缀与名称、HTTP 状态、成功/失败/部分成功、耗时、请求参数和返回结果。筛选支持关键词、类型、来源、Key、状态与日期，并支持分页。点击「查看」可切换请求和结果快照、复制当前内容。

登录、密码、Key 管理及日志查询接口不保存调用快照；查询日志不会递归记日志或占用调用额度。认证失败、无法确认归属的请求不会写入个人历史。账号必须已批准，才能查看账号日志。

- 日志从本次功能上线后开始记录。旧用量记录没有保存结果，不能补录。
- 默认保留最近 **30 天、每个账号最多 2,000 条**，未绑定账号的旧 Key 按当前 Key 限额保留。新调用写入时清理过期与超额记录；查询仅展示保留期内的记录。
- 请求快照最多 **16 KiB**，返回快照最多 **64 KiB**；较长内容会截断并标记。极大或无法解析的 JSON 正文不保存原文。读取长文时，只记录本次返回的分段。
- 密码、Token、Cookie、完整工作台 Key 等敏感字段会隐藏；详情显示的是脱敏快照。凭据请求头不采集。
- Key 吊销后，其历史仍归原账号所有，可以通过账号登录查看；被吊销的 Key 本身无法再查询日志。
- 网页、更新后的 MCP 和 CLI 客户端分别标记为 web、mcp、cli；旧客户端可能显示为 API。Skill 的调用按其实际使用的 MCP 或 CLI 记录，本地离线 `wb mcp --local` 不经过服务器，不产生线上个人日志。

管理员可通过环境变量 `V8WB_CALL_LOG_RETENTION_DAYS`（默认 30）和 `V8WB_CALL_LOG_MAX_ENTRIES`（默认 2000）调整保留策略。详细日志清理与调用配额统计分开，不会因历史被清理而重置当日额度。

任务完成事件格式参考 [Claude Code 官方 Hooks 文档](https://code.claude.com/docs/en/hooks)。

## 知识链、智能分类与云端问答

「知识链」从一篇文档开始查看一跳或两跳关联。文档页有「知识链」入口，右侧会显示关联知识；在正文写 `[[文档标题]]`、`[[文档ID]]` 或站内文档链接会自动识别正向与反向引用。标题重复时请使用文档 ID；代码块中的示例不应作为引用。分类范围会同时限制节点和关联目标。

writer / admin 可建立相关知识、前置知识、问题与解法、应用示例、对比方案五种人工关系，并填写说明。箭头从当前文档指向目标；「前置知识」表示先读目标再学习当前文档。作者或管理员可删除人工关系，正文引用随正文变更更新。“可能相关”依据关键词检索，默认收起，仅作为阅读线索，不画成图谱连线。只有正文明确引用或人工确认的关系才进入知识链；没有这些关系时显示独立阅读，不要求每一篇文档都连接。知识链展示使用 MIT 许可的 relation-graph Vue 组件，支持拖拽移动、缩放、适应视图与重新布局。

选择排障溯源、开发实施、方案对比或学习路线时，会优先展示对应关系及建议阅读顺序。图谱为当前文档周边的有界视图，最多 24 个节点，不是全库无限展开。可切换中心继续探索。

「经验沉淀」的「智能推荐分类」依据已发布知识检索匹配给出分类和参考例子；点击采用才会改变编辑中的分类，不自动批量移动知识。匹配占比不是模型校准后的准确率，仍需人工确认。

「云端智能体」提供基于已发布知识的只读问答。管理员先在「工作台管理 → 云端智能体」点击配置模型服务，填写兼容 OpenAI Chat Completions 协议的 API 根地址（例如 `https://provider.example/v1`）、模型 ID 与模型服务 Key，再明确启用。API 根地址不包含 `/chat/completions`。保存配置不代表网络已验证，实际连通性通过问答测试确认。

模型 Key 保存在服务器数据目录 `agent-settings.json`，文件权限 600，不回传给浏览器。Key 留空保留原值，清除时同时关闭问答。也可通过服务器环境变量 `TEAMKB_AI_KEY` 提供 Key，此时网页无法修改它；`TEAMKB_AI_BASE_URL`、`TEAMKB_AI_MODEL` 是未保存配置时的默认值。备份数据目录时需按密钥资料管理该文件，不要提交到 Git。

问答支持自动判断场景、手动分类检索和知识链模式。排障、开发、对比、学习场景默认沿已确认关系和正文引用补充资料，保留分类限制；明确指定 V5 或 V8 时限制到该平台，同时比较两者时保留两边资料。云端问答将问题和有限长度的相关知识片段发送给配置的模型服务，请确认其适合处理团队资料。

回答附带数字引用、资料节选与文档版本，可打开原文或知识链核验。没有资料时不调用模型；模型没有提供有效编号引用时不采纳回答。引用编号可校验并不证明每个事实正确，仍需确认版本和上下文。智能体不能执行代码、修改项目或自动发布知识。问答与知识关系操作会进入个人调用日志。为限制资源占用，模型请求最多并发 3 个，遇到繁忙、额度或服务错误时应稍后重试。

新版 MCP 客户端增加 `kb_graph(doc_id, category_id, depth, scenario)` 和 `kb_ask(question, category_id, scenario, mode)`。`kb_graph` 在本地离线模式可查看本地知识链；`kb_ask` 仅支持 proxy 模式。使用前更新客户端并重启 MCP 会话；云端问答较长时，可把客户端工具超时调整为 90 秒以上。


### 智能体连续对话

云端智能体使用对话界面，可连续追问，最近的对话会随问题发送给管理员配置的模型服务。每轮回答的引用编号对应本轮资料，可展开查看原文版本和知识链。Enter 发送，Shift+Enter 换行；请求失败可重试，等待期间可停止。对话按账号保存到服务器，刷新或重新登录后可恢复最近对话。点击“新对话”开始新的上下文，已有对话保留在左侧历史中，可随时切换继续。账号之间的对话相互隔离。

模型 API 根地址支持 HTTP 和 HTTPS，填写到 `/v1` 等根路径，不包含 `/chat/completions`。如果服务方拒绝服务器地区访问，会显示拒绝原因，需要更换允许服务器访问的端点。
