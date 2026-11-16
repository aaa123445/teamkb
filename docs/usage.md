# TeamKB 使用说明

## 一键接入（Go 原生客户端）

本地 CLI / MCP 已迁移到 Go 单文件客户端 0.6.0。macOS、Linux、Windows 均提供 amd64 / arm64 包，不需要 Python、pip、venv、Node 或本机 Go 编译环境。服务端仍运行原 Python 服务，知识、账号、审核与日志保持兼容。

在「一键接入」选择 Codex / Claude Code、CLI / MCP / Skill 和全局 / 项目范围。其他 Agent 使用安装提示词；DeepSeek Harness 继续使用原生插件。

macOS / Linux，Codex CLI：

```bash
curl --http1.1 --retry 3 --retry-all-errors --connect-timeout 15 -fsSL https://www.ljc.monster/install.sh -o teamkb-install.sh && bash teamkb-install.sh codex cli user && export PATH="$HOME/.local/bin:$PATH" && hash -r
wb stats
```

Claude Code 将 `codex` 换成 `claudecode`；MCP + Skill 将 `cli` 换成 `recommended`；项目接入将 `user` 换成 `project`，按提示填写真实项目路径。仅 MCP 使用 `mcp`，仅 Skill 使用 `skill`。可追加 `--project /absolute/project`、`--no-contribute`，或 `--check-only` 仅检测系统、Agent 和连通性。

Windows PowerShell：

```powershell
Invoke-WebRequest -UseBasicParsing https://www.ljc.monster/install.ps1 -OutFile teamkb-install.ps1
& ./teamkb-install.ps1 -Agent codex -Mode cli -Scope user
wb stats
```

Windows 对应参数为 `-Agent claudecode`、`-Mode recommended`、`-Scope project`、`-Project 'C:\your-project'`、`-NoContribute` 和 `-CheckOnly`。若组织执行策略禁止本地脚本，请按组织规定执行，不要全局关闭安全策略。

安装器检测系统、架构、curl / SHA-256 工具（Shell）、Agent CLI（MCP 需要）和网络。所有包只从本站域名下载，并验证 SHA-256；不匹配立即停止。安装过程中在终端隐藏输入个人 Key，先调用 stats 验证后才写入配置。没有 Key 请先注册账号，待管理员批准后在个人账号页创建。Key 不出现在安装命令或 shell 历史中。

CLI 模式自动合并 Agent 指令：Codex 的 AGENTS.md（存在 AGENTS.override.md 时使用覆盖文件）或 Claude Code 的 CLAUDE.md。保留原有内容、先备份、仅替换 TeamKB 管理区块。MCP / MCP + Skill 不写入系统提示词。Skill 指引工作流，不是必定执行的自动 Hook。重新打开 Agent 会话后确认工具／Skill 被发现。

安装位置：macOS / Linux `~/.local/bin/teamkb` 和 `~/.local/bin/wb`；Windows `%LOCALAPPDATA%\TeamKB\bin`。安装命令末尾刷新当前终端 PATH，脚本子进程无法直接修改父级 Shell 环境。旧虚拟环境已经激活时，请先 `deactivate`，再执行上面的 PATH 刷新；`command -v wb` 和 `wb --version` 可确认是否仍调用旧客户端。

## 连接配置与初始化

一键安装已经完成初始化。手动下载二进制后，须执行：

```bash
wb init --scope user
# 或
wb init --scope project --project /absolute/path/to/project
```

全局连接保存到 `~/.teamkb/client.json`；项目连接保存到 `PROJECT_ROOT/.teamkb/client.json`，自动加入项目 .gitignore。个人 Key 配置仅当前用户读写，不提交仓库。

连接优先级：显式 `--url / --key` > `TEAMKB_URL / TEAMKB_KEY`（兼容 V8WB_*）> 最近的项目连接 > 用户连接。项目地址与 Key 成对覆盖全局；指定新地址时不借用另一站点保存的 Key。指定 `--project` 的项目必须已初始化。普通全局检索和提交不要求项目初始化。

```bash
wb health
wb stats
wb categories
wb --json search "开发" -n 3
wb --project /absolute/project stats
```

health 仅证明连通；stats / categories 成功才证明鉴权通过。所有 CLI 查询输出结构化 JSON，兼容 `--json`。

## CLI 日常查询和知识沉淀

```bash
wb search "数据库连接" --category-id CATEGORY_ID -n 8
wb read DOCUMENT_ID
wb read DOCUMENT_ID --offset 10000
wb read DOCUMENT_ID --raw
wb standards
wb graph DOCUMENT_ID --depth 1 --scenario troubleshoot
wb ask "如何处理这个问题？"
wb contributions
wb contributions CONTRIBUTION_ID
wb propose /absolute/path/to/candidate.json
wb queue list
# 先核对服务端是否收到，再明确重试，避免重复提交
wb queue retry QUEUE_ID --reset
wb queue remove QUEUE_ID
```

从 search / categories 返回值读取真实 ID，不编造文档 ID。文档 truncated 时按 next_offset 分段读取。云端问答需要管理员配置模型。读请求遇到暂时断连或 502/503/504 会有限退避重试；写入不自动重试。propose 的候选先进入本地私有队列，不存 Key；服务端确认成功才移除。失败时用 contributions 核对结果，避免重试导致重复贡献。队列最多 100 条、每轮最多 5 次；权限或参数错误需要先修复。

候选 JSON 格式见 Skill 的 references/candidate.json。必须填写标题、分类、完整 Markdown、problem、solution、verification、limitations，并且 verified / reusable 真实为 true。内容至少 80 字符，问题至少 10、解法至少 20、验证至少 10、限制至少 5 字符；不得捏造证据，不得包含凭据、客户敏感数据、完整会话或仓库。更新建议填写 target_doc_id 和原文的 base_version。默认 pending 是待审核，不等于发布成功；writer 才能提交。

CLI 指令中启用沉淀后，Agent 可在任务结束时按需提交经过验证、脱敏、可复用且非重复的知识，不要求 `wb agent init`、项目路径或项目 Hook。没有新知识、未验证或 reader 权限时跳过。安装时使用 `--no-contribute` 关闭自主沉淀，用户明确要求时才上传。

## MCP

默认是本地 stdio，由 Agent 启动原生二进制；网站没有远程 `/mcp` HTTP 端点。工具保持：kb_stats、kb_categories、kb_search、kb_read、kb_rules、kb_graph、kb_ask、kb_contributions、kb_propose。

Codex 全局配置示意（通过安装器或 `codex mcp add` 合并，保留其他 MCP）：

```toml
[mcp_servers.teamkb]
command = "/absolute/path/to/.local/bin/teamkb"
args = ["mcp"]
```

项目配置在受信任的 `PROJECT_ROOT/.codex/config.toml`，使用：

```toml
[mcp_servers.teamkb]
command = "/absolute/path/to/.local/bin/teamkb"
args = ["--project", "/absolute/path/to/project", "mcp"]
```

Claude Code：

```bash
claude mcp add --transport stdio --scope user teamkb -- /absolute/path/to/.local/bin/teamkb mcp
# 项目范围在对应项目中执行
claude mcp add --transport stdio --scope project teamkb -- /absolute/path/to/.local/bin/teamkb --project /absolute/path/to/project mcp
```

Key 从已初始化的私有连接文件读取，不内联到共享 MCP 配置。切换后重启 Agent，检查工具列表并调用 kb_categories；仅写好配置不能声称 MCP 已连接。不要同时保留同名的旧 Python MCP 进程。新客户端不含 `mcp --local` 离线服务。

## Skill 与其他 Agent

选择 `recommended` 安装 MCP + Skill，或 `skill` 安装 CLI + Skill。原生版 Skill ZIP：本站 `/static/downloads/team-knowledge-0.6.0.zip`；校验值在 `/static/downloads/go-manifest.json`。安装器验证 SHA-256 并安全解压，Codex 使用所选范围的 `.agents/skills/team-knowledge`，Claude Code 使用 `.claude/skills/team-knowledge`。

其他 Agent 在一键接入页选择「其他智能体」，复制安装提示词，让本地 Agent 识别系统、下载并校验对应二进制、初始化连接，并合并真实支持的 MCP / Skill / 自定义指令入口。无法确认持久化入口时交付可复制的指令文件，不猜路径、不扩大接入范围。新原生客户端不安装 Python completion_hook；现有旧 Hook 可在旧 Python 环境中继续运行，但不要与直接 propose 重复上传。

## DeepSeek Harness 原生插件

Desktop / Web 插件独立于 CLI/MCP，仍无需 Python。Harness「Plugins → Add plugin」粘贴：

```text
https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.3.tgz
```

或：

```bash
dsh plugin --profile desktop add https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.3.tgz
dsh plugin --profile web add https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.3.tgz
```

选择实际使用的 profile，打开 TeamKB 插件设置填写服务地址和个人 Key。包含侧栏工作台、分类、规范、检索、阅读、知识链、调用日志与提交。支持官方预览版 0.2.2 rc 系列；重装后重启宿主。配置入口、凭据及兼容范围见仓库 plugins/dsh-teamkb/README.md。

## 故障与兼容

- `wb: command not found`：macOS/Linux 执行 `export PATH="$HOME/.local/bin:$PATH"; hash -r` 或重新打开终端；Windows 重开 PowerShell。
- 仍显示旧版本：退出旧虚拟环境，检查 `command -v wb` / `Get-Command wb`；新版本为 `teamkb 0.6.0`。
- TLS / curl 35：确认系统时间、证书、代理与域名线路；客户端有限重试，不关闭证书校验。持续失败不等同于后端宕机。
- 401：Key 无效或被吊销；403：账号未审批或权限不足；400/404 文档不存在：重新检索真实 ID；429：额度耗尽。
- SHA 不一致：停止安装；核对本站清单与文件。新原生发布包按版本保持不可变，不用旧校验值验证新包。
- 本次迁移只替换本地客户端和安装链路。服务端管理命令、批量导入、旧 `wb agent` 项目 Hook、离线 MCP 暂用旧 Python 环境；后端尚未宣称迁移完成。Python 0.5.6 历史下载保留，不自动删除本机旧虚拟环境。


## 平台使用：分类、审核与版本

- 「团队知识库」按分类树浏览，点击标签可筛选；「知识检索」支持分类（包括子分类）内的全文检索。
- writer / admin 在「经验沉淀」保存草稿或提交审核。「我的贡献」可查看审核进度和意见，草稿与待审核内容不会出现在共享检索中。
- 管理员在「贡献审核」检查方案正文、验证材料、相似知识和适用限制，可发布、退回修改或拒绝。人工贡献不要求填写 Agent 的结构字段，由审核者判断质量。
- 修正已有知识时，从文档页「建议更新」发起。它关联目标文档的当前版本，审核时若版本已变化会拒绝覆盖，需退回后重新核对并提交。
- 文档页「版本历史」可以查看历史快照。管理员恢复历史版本时会新建一个版本，保留原有历史。
- 「分类管理」可维护分类层级；「团队规范」可编辑分类对应的规范、检查清单和参考文档，供网页与 `kb_rules` 共用。
- 语雀仍是已配置外部知识的同步来源；后续同步可能更新其正文，同时保留版本快照。需要独立维护的团队经验应创建新知识并引用原文。
- 个人调用日志会记录检索、阅读、提交、审核和回滚等调用的状态与结果，仍按账号隔离并执行保留期限。


## 1. 开通账号与个人 Key

1. 在工作台右上角选择「登录 / 注册」，进入「注册入网」。填写姓名、用户名和至少 10 个字符的密码。
2. 注册后自动登录个人中心，账号状态为「待审批」。此时只能查看自己的状态、修改密码和阅读使用说明，不能查询知识库或创建 Key。
3. 联系管理员核实身份。管理员在「工作台管理 → 账号审批与管理」中选择角色，点击「批准入网」。注册不会自动获得管理员权限。
4. 在个人中心刷新状态，获批后即可直接使用网页，无需配置 API Key。
5. 在「个人中心 → 我的 API Key」输入名称、选择权限并创建。新建个人 Key 可在列表中反复查看、隐藏和复制，刷新后仍可操作。旧版仅保存哈希的 Key 无法还原，需要重新创建；旧 Key 的调用不受影响。建议每台电脑或每个 Agent 单独使用一个 Key。

| 角色 | 检索与阅读 | 提交经验 | 审批与全局管理 |
| --- | --- | --- | --- |
| reader / 只读成员 | 支持 | 不支持 | 不支持 |
| writer / 读写成员 | 支持 | 支持 | 不支持 |
| admin / 管理员 | 支持 | 支持 | 支持 |

个人 Key 权限不能超过账号权限，每个账号最多启用 20 个 Key。账号被降级后，已有 Key 的有效权限也会随之降低。账号被拒绝或停用时，个人 Key 全部吊销；重新批准账号不会复活旧 Key，需要重新创建。

浏览器登录与客户端 Key 是两种凭据：密码用于登录网页，Key 用于 MCP、CLI 等客户端。不要把密码填进 `V8WB_KEY`。修改密码会使所有浏览器登录会话退出；如 Key 泄露，还需在个人中心单独吊销。


## 6. 管理员操作与迁移

既有部署的管理员 Key 仍有效，可在「登录 / 注册 → 使用已有 API Key」中连接。随后在「工作台管理 → 账号审批与管理」审批注册申请。为本人创建管理员账号时，先正常注册并退出新账号，再在登录页使用原管理员 Key，将该账号批准为 admin；不会把首个注册者自动设为管理员。

审批时可选择 reader、writer 或 admin，填写可选的审批说明。不要给仅需检索或提交经验的成员分配 admin。被拒绝或停用的账号可以由管理员重新批准。

「我的 API Key」只显示本人 Key；「工作台管理 → API Key 管理」是管理员的全局列表，包含归属账号和旧版系统 Key。新管理员账号通过全局页面创建的 Key 也会归属自己；原有无归属 Key 保持兼容，不会自动转给任意注册者。

账号密码使用带随机盐的 PBKDF2 哈希保存；浏览器会话通过 HttpOnly Cookie 保存。登录会话有效期 7 天；退出或改密码会撤销会话。HTTPS 访问时 Cookie 设置 Secure。个人 Key 仅保存哈希。

管理员不能停用或降级当前管理员账号，也不能移除最后一个已批准的管理员账号。保留原部署管理员 Key，直到你确认新管理员账号可正常登录、审批和管理。

部署升级前备份 SQLite 数据库。新增账号表、会话表、审批记录和 Key 归属字段由启动时自动迁移；升级时使用 `deploy/update.sh`，不要重跑首次安装脚本来更新现有站点。


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

个人 Key 的可查看副本加密保存在数据库中，加密文件为数据目录下 `personal-key-encryption.key`（权限 600），备份和迁移时需一并保留。只有登录后的本人能查看未吊销的个人 Key，列表默认不返回完整 Key。

DeepSeek Harness 插件还提供 TeamKB 侧栏工作台，可进行统计、分类查询、文档检索、正文阅读和个人调用日志查看；所有 TeamKB HTTP 请求由 Harness 宿主执行，浏览器端不直接持有 API Key。
