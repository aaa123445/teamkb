package setup

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/aaa123445/teamkb/client-go/internal/client"
)

const PluginVersion = "0.1.1"

// ExtractPlugin validates the complete archive before writing any file.
func ExtractPlugin(data []byte, dest string) error {
	r, e := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if e != nil {
		return e
	}
	var total uint64
	for _, f := range r.File {
		name := f.Name
		clean := filepath.Clean(filepath.FromSlash(name))
		allowed := strings.HasPrefix(name, "plugins/teamkb/") || name == ".agents/plugins/marketplace.json" || name == ".claude-plugin/marketplace.json"
		if strings.Contains("/"+name+"/", "/../") || !allowed || filepath.IsAbs(clean) || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) || strings.ContainsAny(name, "\\:") || f.Mode()&os.ModeSymlink != 0 {
			return errors.New("插件 ZIP 含不安全路径")
		}
		total += f.UncompressedSize64
		if total > 16<<20 {
			return errors.New("插件 ZIP 解压后过大")
		}
	}
	for _, f := range r.File {
		path := filepath.Join(dest, filepath.FromSlash(f.Name))
		if f.FileInfo().IsDir() {
			if e = os.MkdirAll(path, 0700); e != nil {
				return e
			}
			continue
		}
		rd, e := f.Open()
		if e != nil {
			return e
		}
		b, e := io.ReadAll(io.LimitReader(rd, 16<<20))
		rd.Close()
		if e != nil {
			return e
		}
		if e = client.WritePrivate(path, b); e != nil {
			return e
		}
	}
	return nil
}

func pluginBundle(ctx context.Context, base, agent string) ([]byte, error) {
	kind := "codex"
	if agent == "claudecode" {
		kind = "claude"
	}
	name := "teamkb-" + kind + "-plugin-" + PluginVersion + ".zip"
	raw, e := fetch(ctx, base+"/static/downloads/plugin-manifest.json", 1<<20)
	if e != nil {
		return nil, e
	}
	var mf manifest
	if json.Unmarshal(raw, &mf) != nil || mf.Version != PluginVersion {
		return nil, errors.New("插件版本与站点清单不一致")
	}
	return Download(ctx, base, name, mf.SHA256[name])
}

func installPlugin(ctx context.Context, data []byte, agent, scope, project, binary string, autoSubmit bool) error {
	root := filepath.Join(client.UserDir(), "plugins", agent, scope)
	// A project-specific marketplace name prevents one project replacing another's registration.
	marketName := "teamkb-native"
	if scope == "project" {
		sum := projectID(project)
		root = filepath.Join(root, sum)
		marketName += "-" + sum
	}
	stage, e := os.MkdirTemp(client.UserDir(), ".plugin-stage-*")
	if e != nil {
		return e
	}
	defer os.RemoveAll(stage)
	if e = ExtractPlugin(data, stage); e != nil {
		return e
	}
	args := []string{"mcp"}
	if scope == "project" {
		args = []string{"--project", project, "mcp"}
	}
	cfg := map[string]any{"mcpServers": map[string]any{"teamkb": map[string]any{"command": binary, "args": args}}}
	raw, _ := json.MarshalIndent(cfg, "", "  ")
	if e = client.WritePrivate(filepath.Join(stage, "plugins", "teamkb", ".mcp.json"), raw); e != nil {
		return e
	}
	// Set a per-install contribution policy in the packaged Skill, never in global instructions.
	if e = configurePluginPolicy(stage, autoSubmit); e != nil {
		return e
	}
	marker := filepath.Join(".agents", "plugins", "marketplace.json")
	if agent == "claudecode" {
		marker = filepath.Join(".claude-plugin", "marketplace.json")
	}
	b, e := os.ReadFile(filepath.Join(stage, marker))
	if e != nil {
		return e
	}
	var market map[string]any
	if json.Unmarshal(b, &market) != nil {
		return errors.New("插件目录清单无效")
	}
	market["name"] = marketName
	b, _ = json.MarshalIndent(market, "", "  ")
	if e = client.WritePrivate(filepath.Join(stage, marker), b); e != nil {
		return e
	}
	// Keep the previous installation as a rollback backup.
	if _, e = os.Stat(root); e == nil {
		old := root + ".previous-" + time.Now().Format("20060102T150405.000000000")
		if e = os.Rename(root, old); e != nil {
			return e
		}
	}
	if e = os.MkdirAll(filepath.Dir(root), 0700); e != nil {
		return e
	}
	if e = os.Rename(stage, root); e != nil {
		return e
	}
	exe := "codex"
	if agent == "claudecode" {
		exe = "claude"
	}
	run := func(args ...string) error {
		cmd := exec.CommandContext(ctx, exe, args...)
		if scope == "project" {
			cmd.Dir = project
		}
		cmd.Stdout = os.Stderr
		cmd.Stderr = os.Stderr
		return cmd.Run()
	}
	if e = run("plugin", "marketplace", "add", root); e != nil {
		return fmt.Errorf("插件已准备好，但注册目录失败；请检查 Agent 插件版本：%w", e)
	}
	selector := "teamkb@" + marketName
	if agent == "codex" {
		if scope == "project" {
			return errors.New("当前 Codex CLI 插件安装命令不支持项目 scope，未扩大到全局；请改用项目 MCP + Skill")
		}
		e = run("plugin", "add", selector)
	} else {
		e = run("plugin", "install", selector, "--scope", scope)
	}
	if e != nil {
		return fmt.Errorf("插件目录已注册，但安装未完成：%w", e)
	}
	fmt.Fprintln(os.Stderr, "TeamKB 插件已安装："+root+"；新开 Agent 会话后检查 9 个 kb_* 工具和 team-knowledge Skill。未修改 AGENTS.md / CLAUDE.md。")
	return nil
}

func projectID(project string) string {
	sum := sha256.Sum256([]byte(project))
	return hex.EncodeToString(sum[:])[:12]
}
func configurePluginPolicy(root string, enabled bool) error {
	path := filepath.Join(root, "plugins", "teamkb", "skills", "team-knowledge", "SKILL.md")
	b, e := os.ReadFile(path)
	if e != nil {
		return e
	}
	policy := "Task-end contribution is enabled for this plugin. Submit only truly verified, reusable, sanitized, nonduplicate knowledge, default pending review; follow current-task restrictions."
	if !enabled {
		policy = "Task-end contribution is disabled. Only submit knowledge when the user explicitly requests it."
	}
	return client.WritePrivate(path, append(b, []byte("\n\n## Installation contribution policy\n\n"+policy+"\n")...))
}
