import instructionTemplate from "../../../skill/team-knowledge/references/agent-instructions.md?raw";

export const clientFile = "teamkb-0.6.2-linux-arm64";
export const skillFile = "team-knowledge-0.6.2.zip";
export const installerFile = "install-teamkb-0.6.2.sh";
export const modes = [
  {
    id: "plugin",
    title: "原生插件",
    description: "将 MCP 与知识工作流作为一个插件安装和管理。",
  },
  {
    id: "recommended",
    title: "MCP + Skill",
    description: "工具调用与知识工作流一起接入，推荐使用。",
  },
  {
    id: "mcp",
    title: "仅 MCP",
    description: "让 Agent 通过工具检索、阅读团队知识。",
  },
  {
    id: "skill",
    title: "仅 Skill",
    description: "安装知识工作流，同时配置其依赖的 CLI。",
  },
  { id: "cli", title: "仅 CLI", description: "通过终端命令与脚本访问知识库。" },
];

export const scopes = [
  {
    id: "user",
    title: "全局接入",
    description: "当前用户的所有项目共用，可在任意目录使用 CLI。",
  },
  {
    id: "project",
    title: "项目接入",
    description: "仅为指定项目配置，适合不同项目使用不同团队知识库。",
  },
];

export const nativeVersion = "0.6.2";
const nativeFiles = [
  "linux-arm64",
  "linux-amd64",
  "darwin-arm64",
  "darwin-amd64",
  "windows-arm64.exe",
  "windows-amd64.exe",
].map((p) => `teamkb-${nativeVersion}-${p}`);
export function connectionPrompt({
  origin,
  mode,
  manifest,
  key = "",
  autoSubmit = true,
  scope = "user",
}) {
  if (!["user", "project"].includes(scope))
    throw new Error("请选择有效的接入范围");
  if (
    !nativeFiles.every((f) =>
      /^[a-f0-9]{64}$/i.test(manifest?.sha256?.[f] || ""),
    )
  )
    throw new Error("原生客户端校验信息尚未就绪，请重试加载。");
  const project = scope === "project";
  const mcp = ["mcp", "recommended"].includes(mode);
  const skill = ["skill", "recommended"].includes(mode);
  if (skill && !/^[a-f0-9]{64}$/i.test(manifest?.sha256?.[skillFile] || ""))
    throw new Error("Skill 校验信息尚未就绪");
  const instructions = instructionTemplate
    .replaceAll("{{TEAMKB_URL}}", origin)
    .replaceAll(
      "{{TEAMKB_COMMAND}}",
      project
        ? "<teamkb绝对路径> --project <项目绝对路径>"
        : "<teamkb绝对路径>",
    )
    .replaceAll(
      "{{TEAMKB_CONTRIBUTION_POLICY}}",
      autoSubmit
        ? "已启用：任务后按需提交经过验证且脱敏的可复用知识，默认待审核"
        : "已关闭：只检索，用户明确要求时才提交",
    );
  return `请在当前本地 Agent 中实际安装并接入 TeamKB；不要部署服务器。
接入方式：${modes.find((x) => x.id === mode)?.title || "CLI"}
范围：${project ? "项目接入：先确定真实项目绝对路径，不在下载目录初始化" : "全局接入：当前用户所有项目"}
服务地址：${origin}
个人 Key：${key ? JSON.stringify(key) : "先安全读取 TEAMKB_KEY / 已有配置；没有时让我在本机隐藏输入，不能使用占位符"}

1. 检测操作系统和 CPU。客户端为 Go 单文件可执行程序，不需要 Python、pip、venv、Node 或 Go 编译环境。所有包只从本站域名下载，不从 GitHub、源码仓库或镜像下载。保留其他 Agent 配置；修改前备份；重装只更新 TeamKB 管理项。
2. 从以下列表选取匹配平台的可执行文件，先验证 SHA-256；不匹配立即停止：
${nativeFiles.map((f) => `- ${origin}/static/downloads/${f}?sha256=${manifest.sha256[f]}\n  SHA-256: ${manifest.sha256[f]}`).join("\n")}
macOS/Linux 安装到 ~/.local/bin/teamkb，并创建 wb 兼容命令、设置可执行权限和用户 PATH；Windows 安装到用户目录并更新用户 PATH。不要要求 sudo，不关闭 TLS 校验。
3. 使用真实地址和 Key 执行 teamkb init --scope ${scope}${project ? " --project PROJECT_ROOT" : ""}；凭据只保存到${project ? "PROJECT_ROOT/.teamkb/client.json，并加入 .gitignore" : "~/.teamkb/client.json"}，权限仅当前用户，不写入仓库、MCP 共享文件或提示词。显式参数 > 环境变量 > 项目配置 > 用户配置；不得把另一站点的 Key 混用。
${mcp ? `4. 核实当前 Agent 的 MCP 注册方式，在所选范围注册 teamkb，command 使用 teamkb 的绝对路径，args=${project ? '["--project","PROJECT_ROOT","mcp"]' : '["mcp"]'}。它是本地 stdio MCP，网站没有远程 /mcp 端点。保留其他 MCP，移除同名配置的过期 Key 环境变量。MCP 模式不写入、不修改 Agent 系统提示词或持久化指令文件。` : `4. 按所选范围把以下管理区块合并到当前 Agent 实际加载的系统提示词／持久化指令文件，先备份，保留其他内容；重复安装只替换这一个区块。用真实可执行文件绝对路径替换命令，不写 Key。无法确认入口时保存为 Markdown，并给我可粘贴的完整区块，不声称已自动生效。\n\n${instructions}`}
${skill ? `5. 从本站下载 ${origin}/static/downloads/${skillFile}，SHA-256: ${manifest.sha256[skillFile]}；验证后安全解压到当前 Agent 实际支持的${project ? "项目级" : "用户级"} Skill 目录，保留其他 Skill。安装完整 team-knowledge 文件夹并读取 SKILL.md；新客户端不安装旧 Python Hook。` : ""}

知识沉淀：${mcp ? "仅 MCP 不安装自动任务后提示词；MCP + Skill 按 Skill 工作流执行。" : autoSubmit ? "任务结束后只有真实验证、可复用、脱敏且非重复的知识才提交；用 kb_propose 或 wb propose FILE.json，不要求项目路径初始化或 wb agent init，默认待审核。" : "仅检索；用户明确要求后才上传。"}
网络或 502 错误只对读取有限重试；提交结果未知时先用 wb contributions 核对，避免重复。CLI 候选保存在本地队列；用 wb queue list 查看，核实后再 wb queue retry ID --reset。
验证：在不依赖本次临时环境变量的新进程中用 wb health、wb stats、wb categories 和 wb --json search "开发" -n 3；health 成功不能证明 Key 有效。${mcp ? "检查 MCP 工具列表并实际调用 kb_categories；需要重启 Agent 时如实说明。" : ""}${skill ? "确认 Agent 可发现 Skill。" : ""}不创建测试贡献，不泄露 Key，不声称待审核等于发布成功。最后报告安装路径、所选范围、已修改文件、鉴权及工具验证结果和剩余步骤。
使用说明：${origin}/#/guide`;
}
export function installationCommand({
  origin,
  agent,
  scope,
  mode,
  autoSubmit,
  manifest,
  platform = "posix",
}) {
  if (mode === "plugin" && agent === "codex" && scope === "project")
    throw new Error("Codex 插件仅支持全局接入；项目范围请选择 MCP + Skill。");
  if (mode === "plugin") {
    const kind = agent === "codex" ? "codex" : "claude";
    if (
      !/^[a-f0-9]{64}$/i.test(
        manifest?.sha256?.[`teamkb-${kind}-plugin-0.1.1.zip`] || "",
      )
    )
      throw new Error("插件校验信息尚未就绪，请重试加载。");
  }
  const file =
    platform === "windows"
      ? "install-teamkb-0.6.2.ps1"
      : "install-teamkb-0.6.2.sh";
  if (!/^[a-f0-9]{64}$/i.test(manifest?.sha256?.[file] || ""))
    throw new Error("安装器校验信息尚未就绪，请重试加载。");
  const quote = (v) => "'" + v.replaceAll("'", "'\"'\"'") + "'";
  if (platform === "windows") {
    const ps = (v) => "'" + v.replaceAll("'", "''") + "'";
    return `Invoke-WebRequest -UseBasicParsing ${ps(origin + "/install.ps1")} -OutFile teamkb-install.ps1; if ($?) { & ./teamkb-install.ps1 -Agent ${agent} -Mode ${mode} -Scope ${scope} -Url ${ps(origin)}${autoSubmit ? "" : " -NoContribute"} }`;
  }
  const customOrigin =
    origin === "https://www.ljc.monster" ? "" : ` --url ${quote(origin)}`;
  return `curl --http1.1 --retry 3 --retry-all-errors --connect-timeout 15 -fsSL ${quote(origin + "/install.sh")} -o teamkb-install.sh && bash teamkb-install.sh ${agent} ${mode} ${scope}${customOrigin}${autoSubmit ? "" : " --no-contribute"} && export PATH="$HOME/.local/bin:$PATH" && hash -r`;
}
