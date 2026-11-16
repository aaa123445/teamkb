package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/aaa123445/teamkb/client-go/internal/client"
	"github.com/aaa123445/teamkb/client-go/internal/setup"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"time"
)

var flags = map[string]bool{"json": true, "raw": true, "reset": true, "no-contribute": true, "check-only": true, "help": true, "version": true, "force": true, "docs": true, "local": true}
var values = map[string]bool{"url": true, "key": true, "project": true, "scope": true, "agent": true, "mode": true, "timeout": true, "limit": true, "domain": true, "tag": true, "category-id": true, "offset": true, "max-chars": true, "depth": true, "scenario": true}

func parse(args []string) (map[string]string, []string, error) {
	o := map[string]string{}
	p := []string{}
	for i := 0; i < len(args); i++ {
		a := args[i]
		if a == "--" {
			p = append(p, args[i+1:]...)
			break
		}
		aliases := map[string]string{"-n": "--limit", "-d": "--domain", "-t": "--tag", "-h": "--help", "-v": "--version"}
		if v := aliases[a]; v != "" {
			a = v
		}
		if !strings.HasPrefix(a, "-") {
			p = append(p, a)
			continue
		}
		key := strings.TrimPrefix(a, "--")
		v := ""
		if j := strings.Index(key, "="); j >= 0 {
			v = key[j+1:]
			key = key[:j]
		}
		if flags[key] {
			o[key] = "true"
			continue
		}
		if !values[key] {
			return nil, nil, fmt.Errorf("不支持的选项 %s（wb --help 查看原生命令）", a)
		}
		if v == "" {
			i++
			if i >= len(args) {
				return nil, nil, fmt.Errorf("%s 缺少值", a)
			}
			v = args[i]
		}
		o[key] = v
	}
	return o, p, nil
}
func number(o map[string]string, k string, d int) (int, error) {
	if o[k] == "" {
		return d, nil
	}
	n, e := strconv.Atoi(o[k])
	if e != nil || n < 0 {
		return 0, fmt.Errorf("--%s 须为非负整数", k)
	}
	return n, nil
}
func help() {
	fmt.Println(`TeamKB 0.6.2 · 原生 Go 客户端（无需 Python）
用法：teamkb / wb [--url URL] [--project DIR] [--json] COMMAND
  setup --agent codex|claudecode --mode cli|mcp|recommended|skill|plugin --scope user|project
  init --scope user|project          初始化连接（交互填写个人 Key）
  health | stats | categories | domains | standards
  search QUERY [-n 8] [--category-id ID] [--tag TAG]
  read ID [--offset 0] [--raw]       阅读文档与版本
  graph ID [--depth 1] [--scenario explore]
  ask QUESTION                      云端知识问答
  contributions [ID]                当前账号的贡献及审核结果
  propose FILE.json                 脱敏且已验证的知识，不要求项目初始化
  queue list|retry ID [--reset]|remove ID
  rules [TASK] [--docs]              兼容旧规则查询
  mcp                               启动 stdio MCP（9 个 kb_* 工具）
环境变量：TEAMKB_URL / TEAMKB_KEY（兼容 V8WB_*）。配置保存在 ~/.teamkb/client.json。
服务端仍使用原 Python 架构；serve、离线 MCP、旧项目 Hook 和管理员批量导入暂用旧版。`)
}
func run(ctx context.Context, args []string) error {
	o, p, e := parse(args)
	if e != nil {
		return e
	}
	if o["version"] != "" {
		fmt.Println("teamkb " + client.Version)
		return nil
	}
	if len(p) == 0 || o["help"] != "" {
		help()
		return nil
	}
	cmd := p[0]
	arg := func(i int) string {
		if len(p) > i {
			return p[i]
		}
		return ""
	}
	if cmd == "setup" {
		return setup.Run(ctx, o, true)
	}
	if cmd == "init" {
		return setup.Run(ctx, o, false)
	}
	if cmd == "serve" || cmd == "agent" || o["local"] != "" {
		return errors.New("此功能属于服务端或旧项目 Hook，本次 Go 客户端不包含；现有 Python 服务端保持兼容")
	}
	cfg, e := client.Resolve(o["url"], o["key"], o["project"])
	if e != nil {
		return e
	}
	seconds, e := number(o, "timeout", 90)
	if e != nil || seconds == 0 {
		return errors.New("--timeout 须为正整数秒")
	}
	kind := "cli"
	if cmd == "mcp" {
		kind = "mcp"
	}
	c := client.New(cfg, kind, time.Duration(seconds)*time.Second)
	if cmd == "mcp" {
		return c.MCP().Run(ctx, &mcp.StdioTransport{})
	}
	if cfg.Key == "" && cmd != "health" && cmd != "queue" {
		return errors.New("尚未配置个人 Key；请执行 wb init，或设置 TEAMKB_KEY")
	}
	var out json.RawMessage
	switch cmd {
	case "health":
		out, e = c.Call(ctx, "GET", "/health", nil)
	case "stats", "categories", "domains", "standards":
		path := "/api/v1/" + cmd
		if cmd == "standards" {
			path += "?category_id=" + url.QueryEscape(o["category-id"])
		}
		out, e = c.Call(ctx, "GET", path, nil)
	case "search":
		n, err := number(o, "limit", 8)
		if err != nil {
			return err
		}
		if o["domain"] != "" {
			out, e = c.Call(ctx, "POST", "/api/v1/search", map[string]any{"query": arg(1), "limit": n, "domain": o["domain"], "category_id": o["category-id"], "tag": o["tag"]})
		} else {
			out, e = c.Search(ctx, client.SearchInput{Query: arg(1), CategoryID: o["category-id"], Tag: o["tag"], Limit: n})
		}
	case "read":
		n, err := number(o, "offset", 0)
		if err != nil {
			return err
		}
		out, e = c.Read(ctx, client.ReadInput{DocID: arg(1), Offset: n})
		if e == nil && o["raw"] != "" {
			var d map[string]any
			_ = json.Unmarshal(out, &d)
			if s, ok := d["content"].(string); ok {
				fmt.Println(s)
				return nil
			}
		}
	case "graph":
		n, err := number(o, "depth", 1)
		if err != nil {
			return err
		}
		out, e = c.Graph(ctx, client.GraphInput{DocID: arg(1), CategoryID: o["category-id"], Depth: n, Scenario: o["scenario"]})
	case "ask":
		if arg(1) == "" {
			return errors.New("请提供问题")
		}
		out, e = c.Call(ctx, "POST", "/api/v1/assistant/ask", client.AskInput{Question: arg(1), CategoryID: o["category-id"], Mode: "auto", Scenario: "auto"})
	case "rules":
		out, e = c.Call(ctx, "POST", "/api/v1/rules", map[string]any{"task": arg(1), "include_docs": o["docs"] != ""})
	case "contributions":
		path := "/api/v1/contributions"
		if arg(1) != "" {
			path += "/" + url.PathEscape(arg(1))
		}
		out, e = c.Call(ctx, "GET", path, nil)
	case "propose":
		candidate, err := client.ReadProposal(arg(1))
		if err != nil {
			return err
		}
		out, e = c.Deliver(ctx, candidate)
	case "queue":
		switch arg(1) {
		case "list":
			q, err := client.QueueList()
			if err != nil {
				return err
			}
			out, e = json.Marshal(q)
		case "retry":
			out, e = c.Retry(ctx, arg(2), o["reset"] != "")
		case "remove":
			e = client.QueueRemove(arg(2))
			out = json.RawMessage(`{"removed":true}`)
		default:
			return errors.New("请使用 queue list / retry ID / remove ID")
		}
	default:
		return fmt.Errorf("未知或暂未迁移的命令 %s；wb --help 查看支持范围", cmd)
	}
	if e != nil {
		return e
	}
	var v any
	if e = json.Unmarshal(out, &v); e != nil {
		return e
	}
	formatted, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println(string(formatted))
	return nil
}
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	if e := run(ctx, os.Args[1:]); e != nil {
		fmt.Fprintln(os.Stderr, "错误：", e)
		os.Exit(1)
	}
}
