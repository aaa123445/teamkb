# TeamKB 团队知识库

检索分类知识、团队规范、文档正文与知识链，并按需贡献已经验证的解决方案。无需 Python、MCP 或项目路径初始化。

## 配置

在本插件详情页直接填写服务地址和个人 API Key，点击「保存设置」。也可打开 teamkb 行配置。服务默认 https://www.ljc.monster。Key 留空保留原值，勾选清除才删除；宿主也支持 TEAMKB_KEY 环境变量。

需要任务后沉淀时开启贡献开关并使用 writer Key，默认关闭。贡献需先检索去重、分类、脱敏，默认待管理员审核。

## 验证

保存后新建会话，让 Agent 调用 kb_stats 验证真实连接，再用 kb_categories、kb_search 和 kb_read。保存成功不等于联网成功。

## 升级与入口

0.1.1 补齐显示元数据，并增加插件详情页的直接配置表单。更新包后重启对应 Desktop 或 Web 服务；浏览器刷新即可加载新客户端。Web 与 Desktop 使用各自 profile，请安装到实际使用的 profile。若组件关闭，先启用插件。

凭据由 Harness profile 管理；不要让多人共用一个 profile 的 Key。完整说明见 https://www.ljc.monster/#/guide 。

## Sidebar workbench / 侧栏工作台

Open TeamKB 知识库 from the sidebar for search, document reading, connection settings and call logs. 侧栏支持连接测试、分类查询、文档检索和续读、当前个人 Key 的调用日志分页与脱敏结果详情；点击连接配置可保存设置。
