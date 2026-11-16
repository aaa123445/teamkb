"""MCP 入口。

两种运行模式：

  proxy  （默认，推荐）本地 stdio 进程，每个工具调用转发到云端 HTTP。
         好处：云端集中管知识、管 key、管配额；本地只装一个薄壳。
         配置：V8WB_URL + V8WB_KEY 环境变量。

  local  直接读本地 data 目录，完全离线。
         适合没网/想先试用的场景，配置 V8WB_DATA_DIR。

工具设计原则：
  - 描述里写清"什么时候用"，不只写"是什么"。模型靠描述决定是否调用。
  - 返回结构化短文本 + 明确下一步指引，减少模型瞎猜。
  - 仅提供 kb_* 通用知识工具，不绑定特定技术平台。
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

try:
    # MCP SDK 2.x 把 FastMCP 改名成 MCPServer；1.x 兼容走 FastMCP
    from mcp.server.mcpserver import MCPServer
except ImportError:  # pragma: no cover
    try:
        from mcp.server.fastmcp import FastMCP as MCPServer  # type: ignore
    except ImportError:
        print("需要安装 mcp 包：pip install 'mcp>=1.2'", file=sys.stderr)
        raise

MODE = os.environ.get("V8WB_MODE", "proxy").strip().lower()
BASE_URL = (
    os.environ.get("TEAMKB_URL") or os.environ.get("V8WB_URL", "http://127.0.0.1:8770")
).rstrip("/")
API_KEY = os.environ.get("TEAMKB_KEY") or os.environ.get("V8WB_KEY", "")

INSTRUCTIONS = """团队知识库：开始任务时用 kb_categories / kb_rules 找到分类与团队规范，
用 kb_search 检索，再用 kb_read 核对原文。完成任务后，只提交经过实际验证、
具有复用价值且已经脱敏的解决方案，使用 kb_propose 进入审核。
更新已有知识时传 target_doc_id。不要上传完整会话、仓库或凭据。"""

mcp = MCPServer(
    "team-knowledge",
    instructions=INSTRUCTIONS,
    version="0.5.2",
)


# ---------------- 后端抽象 ----------------


def _remote(path: str, payload: dict | None = None, *, method: str = "POST") -> Any:
    import httpx

    headers = {"Content-Type": "application/json", "X-V8WB-Client": "mcp"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"
    url = f"{BASE_URL}{path}"
    try:
        with httpx.Client(
            timeout=90.0 if path == "/api/v1/assistant/ask" else 60.0
        ) as client:
            r = client.request(method, url, json=payload, headers=headers)
    except httpx.ConnectError as e:
        raise RuntimeError(
            f"连不上工作台 {BASE_URL}。请确认服务器已启动，或检查 TEAMKB_URL 初始化配置。详情：{e}"
        ) from e
    if r.status_code == 401:
        raise RuntimeError("API Key 无效或已过期，请检查个人 Key 或 TEAMKB_KEY 配置")
    if r.status_code == 429:
        raise RuntimeError(f"调用额度超限：{r.text[:200]}")
    if r.status_code >= 400:
        raise RuntimeError(f"工作台返回 {r.status_code}：{r.text[:300]}")
    return r.json()


def _local():
    from server.core.container import get_container
    from server.core.service import WorkbenchService

    return WorkbenchService(get_container())


def _call(
    path: str,
    payload: dict | None = None,
    *,
    method: str = "POST",
    local_fn: str | None = None,
    local_args: dict | None = None,
) -> Any:
    if MODE == "local":
        svc = _local()
        fn = getattr(svc, local_fn or path.strip("/").split("/")[-1])
        return fn(**(local_args if local_args is not None else (payload or {})))
    return _remote(path, payload, method=method)


# ---------------- 工具 ----------------


# Generic tools return structured JSON and use the same review pipeline.
def _generic(path, payload=None, method="POST"):
    if MODE != "local":
        return _remote(path, payload, method=method)
    from server.core.auth import Principal

    k = _local().c.knowledge
    if path == "/api/v1/categories":
        return {"categories": k.categories()}
    if path == "/api/v1/standards":
        return {"standards": k.standards((payload or {}).get("category_id", ""))}
    if path == "/api/v1/contributions":
        p = Principal("local-agent", "Offline agent", "writer", 100000, 100000)
        return k.propose(p, payload)
    raise RuntimeError("此工具仅支持 proxy 模式")


@mcp.tool()
def kb_stats() -> str:
    """查看团队知识库规模、来源和分类统计，验证连接与访问权限。"""
    return json.dumps(
        _call("/api/v1/stats", {}, method="GET", local_fn="stats"),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_categories() -> str:
    """列出团队知识分类树、分类 ID 和文档数量。检索或提交前用于确定分类。"""
    return json.dumps(_generic("/api/v1/categories", method="GET"), ensure_ascii=False)


@mcp.tool()
def kb_search(query: str, category_id: str = "", tag: str = "", limit: int = 8) -> str:
    """按关键词、分类（包含子分类）和标签检索已发布知识。结果需用 kb_read 核对。"""
    return json.dumps(
        _call(
            "/api/v1/search",
            {"query": query, "category_id": category_id, "tag": tag, "limit": limit},
            local_fn="search",
        ),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_read(doc_id: str, offset: int = 0) -> str:
    """读取已发布文档，包含分类和版本。truncated 时用 next_offset 继续读取。"""
    return json.dumps(
        _call(
            "/api/v1/read",
            {"id": doc_id, "offset": offset},
            local_fn="read",
            local_args={"doc_id": doc_id, "offset": offset},
        ),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_rules(category_id: str = "") -> str:
    """获取管理员配置的团队规范清单和关联文档 ID。开始任务时调用。"""
    if MODE == "local":
        return json.dumps(
            {"standards": _local().c.knowledge.standards(category_id)},
            ensure_ascii=False,
        )
    from urllib.parse import urlencode

    return json.dumps(
        _remote(
            "/api/v1/standards?" + urlencode({"category_id": category_id}), method="GET"
        ),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_graph(
    doc_id: str, category_id: str = "", depth: int = 1, scenario: str = "explore"
) -> str:
    """查看已发布知识的双向引用、人工关系和推荐关联。排障或学习时沿链读原文；推荐关联不代表确认关系。"""
    if depth not in (1, 2) or scenario not in {
        "explore",
        "troubleshoot",
        "develop",
        "compare",
        "learn",
    }:
        raise ValueError(
            "depth 仅支持 1/2，scenario 需为 explore/troubleshoot/develop/compare/learn"
        )
    if MODE == "local":
        from ..core.graph import GraphService

        return json.dumps(
            GraphService(_local().c).neighborhood(doc_id, category_id, depth, scenario),
            ensure_ascii=False,
        )
    from urllib.parse import urlencode

    return json.dumps(
        _remote(
            "/api/v1/graph?"
            + urlencode(
                {
                    "doc_id": doc_id,
                    "category_id": category_id,
                    "depth": depth,
                    "scenario": scenario,
                }
            ),
            method="GET",
        ),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_ask(
    question: str, category_id: str = "", scenario: str = "auto", mode: str = "auto"
) -> str:
    """请求云端只读智能体基于知识库问答，返回来源、文档版本和知识链。需要管理员配置模型；无依据不生成结论。"""
    if MODE == "local":
        raise RuntimeError("云端问答仅支持 proxy 模式，本地模式请自行检索原文分析")
    return json.dumps(
        _remote(
            "/api/v1/assistant/ask",
            {
                "question": question,
                "category_id": category_id,
                "scenario": scenario,
                "mode": mode,
            },
        ),
        ensure_ascii=False,
    )


@mcp.tool()
def kb_propose(
    title: str,
    content: str,
    category_id: str,
    problem: str,
    solution: str,
    verification: str,
    limitations: str,
    verified: bool = False,
    reusable: bool = False,
    tags: list[str] | None = None,
    target_doc_id: str = "",
    base_version: int | None = None,
) -> str:
    """提交已实际验证且可复用的脱敏方案，默认待管理员审核。
    必须说明问题、具体解法、真实验证证据和适用限制。未验证时不要编造证据。
    先搜索避免重复；修正现有文档传 target_doc_id 和读取时的 knowledge_version 作为 base_version。不会直接覆盖线上文档。
    """
    payload = dict(
        title=title,
        content=content,
        category_id=category_id,
        problem=problem,
        solution=solution,
        verification=verification,
        limitations=limitations,
        verified=verified,
        reusable=reusable,
        tags=tags or [],
        target_doc_id=target_doc_id,
        base_version=base_version,
        source="agent",
    )
    return json.dumps(_generic("/api/v1/contributions", payload), ensure_ascii=False)


@mcp.tool()
def kb_contributions(contribution_id: str = "") -> str:
    """查看自己的贡献状态和审核意见；传贡献 ID 获取详情。"""
    if MODE == "local":
        raise RuntimeError("请在本地网页查看离线候选；团队审核需要 proxy 模式")
    from urllib.parse import quote

    return json.dumps(
        _remote(
            "/api/v1/contributions"
            + ("/" + quote(contribution_id, safe="") if contribution_id else ""),
            method="GET",
        ),
        ensure_ascii=False,
    )


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
