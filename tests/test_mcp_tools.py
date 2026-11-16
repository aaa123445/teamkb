"""The published MCP surface is platform independent."""

import asyncio
import json

from server.api import mcp_server


def test_public_tools_are_generic():
    names = {tool.name for tool in asyncio.run(mcp_server.mcp.list_tools())}
    assert names == {
        "kb_stats", "kb_categories", "kb_search", "kb_read", "kb_rules",
        "kb_graph", "kb_ask", "kb_propose", "kb_contributions",
    }


def test_stats_uses_authenticated_shared_backend(monkeypatch):
    calls = []

    def remote(path, payload=None, *, method="POST"):
        calls.append((path, method))
        return {"documents": 3, "by_source": {"manual": 3}}

    monkeypatch.setattr(mcp_server, "MODE", "proxy")
    monkeypatch.setattr(mcp_server, "_remote", remote)
    assert json.loads(mcp_server.kb_stats())["documents"] == 3
    assert calls == [("/api/v1/stats", "GET")]
