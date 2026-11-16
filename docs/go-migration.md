# Python → Go 分阶段迁移

第一阶段已经落地：`client-go/` 是独立 Go module，CLI、MCP、环境检测和安装器共用连接与 HTTP 层。用户下载预编译二进制即可，无需 Python 或 Go。Vue 前端与 DSH 原生插件继续保留。

当前边界：

```text
Agent / 用户
  ├─ Go CLI：teamkb / wb
  ├─ Go stdio MCP：teamkb mcp → 9 个 kb_* 工具
  └─ DSH 原生插件
           ↓ 既有 /api/v1 HTTP 协议
  Python API → 认证 / 审核 / 知识 / 搜索 / 图谱 / 模型 / SQLite
```

Go 客户端模块：`internal/client` 负责成对连接解析、鉴权、错误映射、只读重试、贡献队列及官方 MCP SDK；`internal/setup` 负责私有配置、SHA-256 下载验证、平台安装、Agent 配置合并和安全 Skill 解压；`cmd/teamkb` 作为 CLI 入口。不复制服务端索引或数据库逻辑。

构建与验证（仅开发／构建服务器需要 Go）：

```bash
cd client-go
go test ./...
go vet ./...
go build ./cmd/teamkb
cd ..
bash deploy/build-go-client.sh
```

发布生成六个平台二进制、原生 Skill 和安装脚本，以及 `go-manifest.json`；主 manifest 兼容旧下载。所有客户端运行时下载均走本站域名。版本文件已发布后不允许同名覆盖为不同内容，必须递增原生版本；构建脚本会检查。旧 Python 安装器和 0.5.6 下载保留。

客户端支持查询、图谱、问答、规范、贡献及持久队列；暂未迁移服务器 `serve`、离线 `mcp --local`、管理员批量导入与旧项目自动 Hook，仍可使用旧 Python 环境。日常贡献直接 `wb propose`，不要求旧项目 Hook。安装到用户目录不会删除旧环境；若旧环境已激活，应先退出再检查 PATH。

第二阶段建议先把后端 HTTP 契约固定为可重复的接口对照测试，再建立 Go 服务的配置、身份验证、审计、SQLite 访问和迁移框架。优先迁移 health、分类、文档读取、检索等只读接口，以路由分流逐个替换；每个接口比较权限、状态码、分页、内容和调用日志。避免同时运行两套会自动修改同一数据库 schema 的服务。

第三阶段迁移写入和后台任务：贡献／审核／版本，账号／Key／配额，语雀同步与抓取，知识链，最后迁移模型对话和流式响应。明确事务、幂等、任务状态与超时行为。每个模块迁移前备份数据库与配置，提供对应路由回退；验证完成后才替换 systemd 入口和去掉生产 Python 依赖。前端 API 路径与客户端协议尽量保持稳定。

本次没有替换线上 Python 后端、数据库结构或知识内容，也没有宣称已经完成全架构 Go 化。

独立端到端验证使用临时 HOME 和本地 fixture 服务，不需要生产 Key：

```bash
python3 tests/native_client_integration.py /path/to/teamkb-0.6.2-linux-arm64
```

此处 Python 仅为仓库测试驱动；安装器与已安装客户端运行时不依赖 Python。macOS / Windows 发布包经过交叉编译，仍需在对应真机验证系统策略、Agent CLI 与终端集成。


插件包只分发 MCP/Skill 元数据，不携带个人 Key；安装器会替换本机真实 teamkb 路径。Codex 项目范围使用项目 MCP + Skill。
