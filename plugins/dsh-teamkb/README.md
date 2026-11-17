# TeamKB for DeepSeek Harness

原生 Harness Cordis bundle，适配官方预览版 Desktop（GUI）与 Web。直接在宿主调用 TeamKB HTTP API，不依赖 Python、wb、MCP 或项目路径初始化。当前接口按官方 `0.2.2-rc.1` npm 包及仓库 `39163dd3` 检查；预览版后续接口变化需重新验证，支持范围为 `>=0.2.2-rc.1 <0.2.3-0`。

## 安装

在 Harness 的 **Plugins / 插件 → 添加插件** 中输入域名下载地址：

```text
https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.6.tgz
```

也可通过 CLI 安装到实际使用的 profile：

```bash
dsh plugin --profile web add https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.6.tgz
dsh plugin --profile desktop add https://www.ljc.monster/static/downloads/dsh-teamkb-0.1.6.tgz
```

只安装到正在使用的 profile，无需两条都运行。界面显示 `restart-required` 时重启对应 Web 服务或 Desktop；新建会话后测试。安装包包含可直接加载的 JavaScript，无 prepare/build 脚本，用户不需要下载 GitHub 源码。不要修改 profile 中其他 bundle。

## 配置与验证

在插件列表打开 TeamKB，直接在插件详情页配置（也可进入 `teamkb` 插件行的配置页），填写服务地址、个人 API Key，并按需开启“任务完成后允许提交”。Key 使用 Harness `role('secret')` 字段，远端读取会脱敏；实际持久化由宿主 profile 管理，并不意味着系统钥匙串加密。清空输入框保留已有 Key；勾选“清除”才会删除。也可让运行 Web / Desktop 的宿主进程读取 `TEAMKB_KEY` 环境变量。macOS 从 Dock 启动时可能不继承终端环境，优先使用配置页。

请确保有账号访问权限并持有 reader / writer 个人 Key；网页登录密码不能用于 API。保存后新建会话，要求 Agent：

> 调用 kb_stats 验证连接，然后 kb_categories 查看分类，kb_search 检索，kb_read 核对正文。

工具有通用 GUI 卡片，Desktop 和 Web 使用同一份浏览器端设置。插件通过运行时的 systemPrompt section 注入工作流，卸载时自动清理；不改 AGENTS.md / CLAUDE.md 或本地文件规则。它是原生插件，不属于 MCP 模式。

## 能力与提交

`kb_stats`、`kb_categories`、`kb_rules`、`kb_search`、`kb_read`、`kb_graph`、`kb_contributions`、`kb_propose`。

开启知识贡献且 Key 有 writer 权限时，Agent 完成任务后可判断是否有经验证、可复用的新知识，先检索去重、分类、脱敏，再直接提交，无需项目初始化。默认提交待审核，管理员授权的自动发布仍遵守服务器策略。不开启时只检索阅读。不会扫描或自动上传完整对话、仓库，也不声称能保证每次任务完成都触发；运行时提示词和工具由模型选择使用。

只读网络请求最多重试三次，重试间隔 1、2、4 秒；提交不自动重试，避免断线后重复写入。任务取消会停止当前 HTTP 请求和退避等待。Key 保留在宿主，工具参数、模型结果和错误不包含它。Web 浏览器不直接访问 TeamKB，无跨域配置要求。远程 Web 应使用独立用户 profile；共享 profile 会共享服务器凭据和权限。

## 开发

```bash
npm install --ignore-scripts
npm test
npm run build
npm pack --ignore-scripts
```

工具由官方 `defineTool` 做参数验证，配置使用 Schemastery volatile 字段；设置通过官方 `plugins.row.config` slot 的表单与 revision 写入。客户端源码修改后执行 `npm run build` 更新预构建文件；安装时无需构建或 Electron 专用接口。

官方接口参考：[插件打包与安装](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/publish.md)、[工具开发](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/basic/tool.md)、[设置服务](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/settings.md)。

## 0.1.2 升级

补齐中英文显示名称、图标和详情文档；插件详情页直接显示配置表单，同时保留行配置入口。使用上方新版包地址安装到原 profile，重启对应应用。已安装本地 `0.1.0-local.1` 的用户也可用上述地址替换依赖，不需要先卸载；不要手工删除 profile 或凭据。

0.1.2 新增侧栏「TeamKB 知识库」，提供连接测试、统计、分类筛选、关键词检索、正文续读、当前 Key 的调用日志及结果详情；连接配置也可在侧栏打开。不存在的文档 ID 会明确提示先用 kb_search 获取有效 ID。请求通过 Harness owner-only RPC 在宿主执行，不把 API Key 交给浏览器。

## 0.1.3 界面更新

统一自适应工作台宽度；可搜索的独立分类目录替代标签堆叠，日志改为紧凑列表，配置改为分组表单。跟随 Harness 深浅主题，支持窄窗口布局、键盘焦点和减少动画偏好。


## 0.1.4 宿主样式兼容

参考 Harness 官方 ui-plugin-manager、client-ui-stats、client-ui-forge 的页面组织、主题变量和滚动约定，重构 React 视图与插件独立样式。修复旧预览版缺少 card-fill 变量导致深色界面出现浅色卡片的问题；标题、按钮、分类列表不再随宿主基础样式挤压换行。分类首次自动加载，目录限制高度并独立滚动，窄窗口自动改为上下布局；阅读可返回搜索结果，日志分页与详情保留。

参考源码（MIT，仅参考布局约定；本插件界面独立实现）：

- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/ui-plugin-manager
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/experimental/client-ui-stats
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/experimental/client-ui-forge

在真实 Harness Web 0.2.2-rc.1 中验证 Host RPC、配置保存、分类、搜索、阅读返回、日志详情和深浅主题，覆盖 1440 / 850 / 600 像素窗口。Desktop 共用前端模块，尚未在 macOS Desktop 真机验证。升级后重启对应宿主，不能只刷新旧会话。


## 0.1.5 调用详情弹窗

调用日志详情改为居中模态窗口，长结果在弹窗内滚动，不再追加到列表底部。支持关闭按钮、Esc 和点击遮罩关闭，并恢复原日志焦点与列表位置。已在真实 Harness Web 的桌面和 600px 窗口验证。升级后重启宿主。


## 0.1.6 贡献状态复核

再次汇报旧贡献前按 ID 实时查询 kb_contributions；返回 checked_at、status_label、in_review_queue，并保留审核意见与事件。rejected 表示已拒绝且不在待审核队列，不能继续沿用最初提交的 pending。禁止为插件自检、开关或权限测试创建真实贡献。更新并重启后，新会话加载新工作流；旧会话中的旧结论应重新查询纠正。
