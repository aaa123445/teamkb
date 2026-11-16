// Package setup installs the native client without a Python/Node runtime.
package setup

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/aaa123445/teamkb/client-go/internal/client"
	"github.com/pelletier/go-toml/v2"
	"golang.org/x/term"
)

const skillFile = "team-knowledge-0.6.0.zip"
const instructionFile = "agent-instructions-0.6.0.md"

type manifest struct {
	Version string            `json:"version"`
	SHA256  map[string]string `json:"sha256"`
}
type prompt struct{ reader *bufio.Reader }

func (p *prompt) text(label, def string) (string, error) {
	fmt.Fprintf(os.Stderr, "%s [%s]：", label, def)
	s, e := p.reader.ReadString('\n')
	if e != nil && e != io.EOF {
		return "", e
	}
	s = strings.TrimSpace(s)
	if s == "" {
		s = def
	}
	return s, nil
}
func (p *prompt) key() (string, error) {
	fmt.Fprint(os.Stderr, "个人 Key（隐藏输入）：")
	if term.IsTerminal(int(os.Stdin.Fd())) {
		b, e := term.ReadPassword(int(os.Stdin.Fd()))
		fmt.Fprintln(os.Stderr)
		return strings.TrimSpace(string(b)), e
	}
	s, e := p.reader.ReadString('\n')
	if e != nil && e != io.EOF {
		return "", e
	}
	return strings.TrimSpace(s), nil
}
func backup(path string) error {
	b, e := os.ReadFile(path)
	if os.IsNotExist(e) {
		return nil
	}
	if e != nil {
		return e
	}
	return client.WritePrivate(path+".teamkb-backup-"+time.Now().Format("20060102T150405.000000000"), b)
}
func MergeBlock(original, block, begin, end string) (string, error) {
	a, b := strings.Index(original, begin), strings.Index(original, end)
	if a < 0 && b < 0 {
		return strings.TrimRight(original, "\r\n") + "\n\n" + strings.TrimSpace(block) + "\n", nil
	}
	if a < 0 || b < a || strings.Count(original, begin) != 1 || strings.Count(original, end) != 1 {
		return "", errors.New("已有 TeamKB 标记不完整或重复，请先手动核对，未覆盖指令")
	}
	return original[:a] + strings.TrimSpace(block) + original[b+len(end):], nil
}
func mergeFile(path, block, begin, end string) error {
	b, e := os.ReadFile(path)
	if e != nil && !os.IsNotExist(e) {
		return e
	}
	out, e := MergeBlock(string(b), block, begin, end)
	if e != nil {
		return e
	}
	if out == string(b) {
		return nil
	}
	if e = backup(path); e != nil {
		return e
	}
	return client.WritePrivate(path, []byte(out))
}
func quote(s string) string { return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'" }
func Download(ctx context.Context, base, name, expected string) ([]byte, error) {
	if len(expected) != 64 {
		return nil, errors.New("下载校验信息缺失")
	}
	if _, e := hex.DecodeString(expected); e != nil {
		return nil, errors.New("下载校验信息无效")
	}
	b, e := fetch(ctx, base+"/static/downloads/"+name+"?sha256="+expected, 24<<20)
	if e != nil {
		return nil, e
	}
	sum := sha256.Sum256(b)
	if hex.EncodeToString(sum[:]) != strings.ToLower(expected) {
		return nil, fmt.Errorf("%s SHA-256 不匹配，已停止安装", name)
	}
	return b, nil
}
func fetch(ctx context.Context, address string, maxBytes int64) ([]byte, error) {
	c := client.New(client.Connection{}, "installer", 60*time.Second)
	var last error
	for attempt := 0; attempt < 4; attempt++ {
		req, e := http.NewRequestWithContext(ctx, "GET", address, nil)
		if e != nil {
			return nil, e
		}
		req.Header.Set("User-Agent", "TeamKB-Go-Installer/"+client.Version)
		r, e := c.HTTP.Do(req)
		if e == nil {
			if r.StatusCode == 200 {
				b, err := io.ReadAll(io.LimitReader(r.Body, maxBytes+1))
				r.Body.Close()
				if err == nil && int64(len(b)) <= maxBytes {
					return b, nil
				}
				if int64(len(b)) > maxBytes {
					return nil, errors.New("下载文件过大")
				}
				last = errors.New("下载被中断")
			} else {
				r.Body.Close()
				if r.StatusCode < 500 && r.StatusCode != 429 {
					return nil, fmt.Errorf("下载返回 HTTP %d", r.StatusCode)
				}
				last = fmt.Errorf("下载返回 HTTP %d", r.StatusCode)
			}
		} else {
			last = errors.New("下载连接失败，请检查代理与系统 TLS 证书")
		}
		if attempt < 3 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(time.Duration(1<<attempt) * time.Second):
			}
		}
	}
	return nil, last
}
func installBinary() (string, error) {
	home, e := os.UserHomeDir()
	if e != nil {
		return "", e
	}
	dir := filepath.Join(home, ".local", "bin")
	ext := ""
	if runtime.GOOS == "windows" {
		base := os.Getenv("LOCALAPPDATA")
		if base == "" {
			return "", errors.New("缺少 LOCALAPPDATA")
		}
		dir = filepath.Join(base, "TeamKB", "bin")
		ext = ".exe"
	}
	src, e := os.Executable()
	if e != nil {
		return "", e
	}
	data, e := os.ReadFile(src)
	if e != nil {
		return "", e
	}
	if e = os.MkdirAll(dir, 0700); e != nil {
		return "", e
	}
	for _, name := range []string{"teamkb", "wb"} {
		dest := filepath.Join(dir, name+ext)
		if e = backup(dest); e != nil {
			return "", e
		}
		f, e := os.CreateTemp(dir, ".teamkb-install-*")
		if e != nil {
			return "", e
		}
		tmp := f.Name()
		_, e = f.Write(data)
		ce := f.Close()
		if e == nil {
			e = ce
		}
		if e == nil {
			e = os.Chmod(tmp, 0755)
		}
		if e == nil {
			// Windows cannot replace an executable held open by MCP.
			// Leave the old binary intact when it is still running.
			e = os.Rename(tmp, dest)
		}
		_ = os.Remove(tmp)
		if e != nil {
			return "", fmt.Errorf("无法更新 %s；请先退出旧的 MCP 进程再重试：%w", dest, e)
		}
	}
	return filepath.Join(dir, "teamkb"+ext), nil
}
func installPATH(binary string) error {
	dir := filepath.Dir(binary)
	if runtime.GOOS == "windows" {
		literal := "'" + strings.ReplaceAll(dir, "'", "''") + "'"
		cmd := `$d=` + literal + `; $p=[Environment]::GetEnvironmentVariable('Path','User'); if (@($p -split ';') -notcontains $d) { [Environment]::SetEnvironmentVariable('Path', ($d+';'+$p), 'User') }`
		c := exec.Command("powershell.exe", "-NoProfile", "-Command", cmd)
		if e := c.Run(); e != nil {
			return errors.New("无法更新用户 PATH，请手动添加 " + dir)
		}
		return nil
	}
	home, _ := os.UserHomeDir()
	begin, end := "# TEAMKB_PATH_BEGIN", "# TEAMKB_PATH_END"
	block := begin + "\nexport PATH=\"$HOME/.local/bin:$PATH\"\n" + end
	paths := []string{filepath.Join(home, ".bashrc"), filepath.Join(home, ".profile")}
	if strings.Contains(os.Getenv("SHELL"), "zsh") {
		zd := os.Getenv("ZDOTDIR")
		if zd == "" {
			zd = home
		}
		paths = append(paths, filepath.Join(zd, ".zshrc"))
	}
	for _, p := range paths {
		if e := mergeFile(p, block, begin, end); e != nil {
			return e
		}
	}
	return nil
}
func ExtractSkill(data []byte, dest string) error {
	r, e := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if e != nil {
		return e
	}
	total := uint64(0)
	for _, f := range r.File {
		if !strings.HasPrefix(f.Name, "team-knowledge/") {
			return errors.New("Skill ZIP 目录结构错误")
		}
		rel := strings.TrimPrefix(f.Name, "team-knowledge/")
		if rel == "" {
			continue
		}
		clean := filepath.Clean(filepath.FromSlash(rel))
		if filepath.IsAbs(clean) || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) || strings.Contains(rel, "\\") || strings.Contains(rel, ":") || f.Mode()&os.ModeSymlink != 0 {
			return errors.New("Skill ZIP 含不安全路径")
		}
		total += f.UncompressedSize64
		if total > 16<<20 {
			return errors.New("Skill ZIP 解压后过大")
		}
	}
	for _, f := range r.File {
		rel := strings.TrimPrefix(f.Name, "team-knowledge/")
		if rel == "" {
			continue
		}
		p := filepath.Join(dest, filepath.FromSlash(rel))
		if f.FileInfo().IsDir() {
			if e = os.MkdirAll(p, 0700); e != nil {
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
		if e = backup(p); e != nil {
			return e
		}
		if e = client.WritePrivate(p, b); e != nil {
			return e
		}
	}
	return nil
}

// Codex project TOML is merged textually after parsing: unrelated settings and comments survive.
func MergeCodex(data []byte, binary string, args []string) ([]byte, error) {
	var cfg map[string]any
	if e := toml.Unmarshal(data, &cfg); e != nil {
		return nil, errors.New("现有 Codex TOML 无效，未修改")
	}
	lines := strings.Split(string(data), "\n")
	kept := []string{}
	skip := false
	for _, line := range lines {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "[") {
			header := strings.TrimSpace(strings.SplitN(t, "#", 2)[0])
			skip = header == "[mcp_servers.teamkb]" || header == "[mcp_servers.\"teamkb\"]" || header == "[mcp_servers.'teamkb']" || strings.HasPrefix(header, "[mcp_servers.teamkb.") || strings.HasPrefix(header, "[mcp_servers.\"teamkb\".") || strings.HasPrefix(header, "[mcp_servers.'teamkb'.")
		}
		if !skip {
			kept = append(kept, line)
		}
	}
	b, e := toml.Marshal(map[string]any{"mcp_servers": map[string]any{"teamkb": map[string]any{"command": binary, "args": args}}})
	if e != nil {
		return nil, e
	}
	out := []byte(strings.TrimRight(strings.Join(kept, "\n"), "\n") + "\n\n" + string(b))
	var check map[string]any
	if toml.Unmarshal(out, &check) != nil {
		return nil, errors.New("无法安全合并 Codex MCP 配置，未修改")
	}
	return out, nil
}
func registerMCP(agent, scope, project, binary string) error {
	args := []string{"mcp"}
	if scope == "project" {
		args = []string{"--project", project, "mcp"}
	}
	if agent == "codex" && scope == "project" {
		path := filepath.Join(project, ".codex", "config.toml")
		b, e := os.ReadFile(path)
		if e != nil && !os.IsNotExist(e) {
			return e
		}
		out, e := MergeCodex(b, binary, args)
		if e != nil {
			return e
		}
		if e = backup(path); e != nil {
			return e
		}
		return client.WritePrivate(path, out)
	}
	exe := "codex"
	if agent == "claudecode" {
		exe = "claude"
	}
	if _, e := exec.LookPath(exe); e != nil {
		return fmt.Errorf("找不到 %s 命令，请先安装 Agent 客户端", exe)
	}
	var a []string
	if agent == "codex" {
		home, _ := os.UserHomeDir()
		ch := os.Getenv("CODEX_HOME")
		if ch == "" {
			ch = filepath.Join(home, ".codex")
		}
		if e := backup(filepath.Join(ch, "config.toml")); e != nil {
			return e
		}
		a = []string{"mcp", "add", "teamkb", "--", binary}
	} else {
		config := filepath.Join(homeDir(), ".claude.json")
		if scope == "project" {
			config = filepath.Join(project, ".mcp.json")
		}
		if e := backup(config); e != nil {
			return e
		}
		rm := exec.Command(exe, "mcp", "remove", "--scope", scope, "teamkb")
		if scope == "project" {
			rm.Dir = project
		}
		_ = rm.Run()
		a = []string{"mcp", "add", "--transport", "stdio", "--scope", scope, "teamkb", "--", binary}
	}
	a = append(a, args...)
	cmd := exec.Command(exe, a...)
	if scope == "project" {
		cmd.Dir = project
	}
	cmd.Stdout = os.Stderr
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
func Run(ctx context.Context, o map[string]string, install bool) error {
	p := prompt{bufio.NewReader(os.Stdin)}
	agent, mode, scope := o["agent"], o["mode"], o["scope"]
	if agent == "claude" {
		agent = "claudecode"
	}
	if mode == "" {
		mode = "cli"
	}
	if scope == "" {
		scope = "user"
	}
	if scope != "user" && scope != "project" {
		return errors.New("scope 须为 user 或 project")
	}
	if install && agent != "codex" && agent != "claudecode" && agent != "other" {
		return errors.New("agent 须为 codex、claudecode 或 other")
	}
	if mode != "cli" && mode != "mcp" && mode != "recommended" && mode != "skill" {
		return errors.New("不支持的接入模式")
	}
	fmt.Fprintf(os.Stderr, "[环境检测] %s/%s；TeamKB %s 原生客户端，无需 Python 或 Node\n", runtime.GOOS, runtime.GOARCH, client.Version)
	mcpMode := mode == "mcp" || mode == "recommended"
	if install && mcpMode && agent != "other" {
		exe := "codex"
		if agent == "claudecode" {
			exe = "claude"
		}
		if _, e := exec.LookPath(exe); e != nil {
			return fmt.Errorf("未检测到 %s，请先安装 Agent 客户端", exe)
		}
	}
	cfg, e := client.Resolve(o["url"], o["key"], "")
	if e != nil {
		return e
	}
	if o["check-only"] != "" {
		_, e := fetch(ctx, cfg.URL+"/health", 1<<20)
		if e != nil {
			return e
		}
		fmt.Fprintln(os.Stderr, "[环境检测] 连通性正常；未修改连接、凭据或 Agent 配置")
		return nil
	}
	project := o["project"]
	if scope == "project" {
		if project == "" {
			project, e = p.text("项目绝对路径", "")
			if e != nil {
				return e
			}
			if project == "" {
				return errors.New("项目接入须提供真实项目路径")
			}
		}
		project, e = filepath.Abs(client.Expand(project))
		if e != nil {
			return e
		}
		st, e := os.Stat(project)
		if e != nil || !st.IsDir() {
			return errors.New("项目目录不存在")
		}
		if saved, err := client.ReadConfig(filepath.Join(project, ".teamkb", "client.json")); err != nil {
			return err
		} else if saved.URL == cfg.URL && cfg.Key == "" {
			cfg.Key = saved.Key
		}
	}
	if o["url"] == "" && client.Env("TEAMKB_URL", "V8WB_URL") == "" {
		previousURL := cfg.URL
		cfg.URL, e = p.text("知识库地址", cfg.URL)
		if strings.TrimRight(cfg.URL, "/") != previousURL && o["key"] == "" && client.Env("TEAMKB_KEY", "V8WB_KEY") == "" {
			cfg.Key = ""
		}
		if e != nil {
			return e
		}
	}
	cfg.URL, e = client.ValidateURL(cfg.URL)
	if e != nil {
		return e
	}
	if cfg.Key == "" {
		cfg.Key, e = p.key()
		if e != nil {
			return e
		}
	}
	if cfg.Key == "" {
		return errors.New("个人 Key 不能为空")
	}
	c := client.New(cfg, "installer", 60*time.Second)
	if _, e = c.Call(ctx, "GET", "/api/v1/stats", nil); e != nil {
		return fmt.Errorf("个人 Key 验证失败，尚未修改配置：%w", e)
	}
	var skill, instructions []byte
	skillMode := mode == "skill" || mode == "recommended"
	if install {
		b, e := fetch(ctx, cfg.URL+"/static/downloads/go-manifest.json", 1<<20)
		if e != nil {
			return e
		}
		var mf manifest
		if json.Unmarshal(b, &mf) != nil || mf.Version != client.Version {
			return errors.New("原生客户端版本与站点校验清单不一致，请重新下载安装器")
		}
		if skillMode {
			skill, e = Download(ctx, cfg.URL, skillFile, mf.SHA256[skillFile])
			if e != nil {
				return e
			}
		}
		if !mcpMode {
			instructions, e = Download(ctx, cfg.URL, instructionFile, mf.SHA256[instructionFile])
			if e != nil {
				return e
			}
		}
	}
	binary := ""
	if install {
		binary, e = installBinary()
		if e != nil {
			return e
		}
		if e = installPATH(binary); e != nil {
			return e
		}
	}
	configPath := client.UserConfig()
	if scope == "project" {
		configPath = filepath.Join(project, ".teamkb", "client.json")
	}
	if e = backup(configPath); e != nil {
		return e
	}
	configPath, e = client.SaveConnection(cfg, scope, project)
	if e != nil {
		return e
	}
	fmt.Fprintln(os.Stderr, "连接已验证，配置已保存："+configPath+"（个人 Key 已隐藏）")
	if !install {
		return nil
	}
	home, _ := os.UserHomeDir()
	base := home
	if scope == "project" {
		base = project
	}
	if skillMode {
		folder := ".agents"
		if agent == "claudecode" {
			folder = ".claude"
		}
		target := filepath.Join(base, folder, "skills", "team-knowledge")
		if e = ExtractSkill(skill, target); e != nil {
			return e
		}
		fmt.Fprintln(os.Stderr, "Skill 已安装："+target)
	}
	if mcpMode {
		if agent == "other" {
			fmt.Fprintf(os.Stderr, "请在 Agent 中注册 stdio MCP：command=%q，args=%q；范围=%s\n", binary, func() []string {
				if scope == "project" {
					return []string{"--project", project, "mcp"}
				}
				return []string{"mcp"}
			}(), scope)
		} else if e = registerMCP(agent, scope, project, binary); e != nil {
			return fmt.Errorf("CLI 已安装，但 MCP 注册未完成，请修复后重新运行安装：%w", e)
		}
		fmt.Fprintln(os.Stderr, "MCP 模式未修改系统提示词；请重启 Agent 会话后检查 kb_* 工具。")
	} else {
		command := quote(binary)
		if runtime.GOOS == "windows" {
			command = "\"" + binary + "\""
		}
		if scope == "project" {
			command += " --project " + quote(project)
		}
		policy := "已启用：任务完成后按需提交经过验证且脱敏的可复用知识，默认待审核"
		if o["no-contribute"] != "" {
			policy = "已关闭：仅在用户明确要求时上传"
		}
		block := strings.NewReplacer("{{TEAMKB_URL}}", cfg.URL, "{{TEAMKB_COMMAND}}", command, "{{TEAMKB_CONTRIBUTION_POLICY}}", policy).Replace(string(instructions))
		path := filepath.Join(base, "TEAMKB-AGENT-INSTRUCTIONS.md")
		if agent == "codex" {
			if scope == "user" {
				base = os.Getenv("CODEX_HOME")
				if base == "" {
					base = filepath.Join(home, ".codex")
				}
			}
			path = filepath.Join(base, "AGENTS.md")
			if _, e := os.Stat(filepath.Join(base, "AGENTS.override.md")); e == nil {
				path = filepath.Join(base, "AGENTS.override.md")
			}
		}
		if agent == "claudecode" {
			if scope == "user" {
				base = filepath.Join(home, ".claude")
			}
			path = filepath.Join(base, "CLAUDE.md")
		}
		if e = mergeFile(path, block, "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->"); e != nil {
			return e
		}
		fmt.Fprintln(os.Stderr, "Agent 指令已合并（不含 Key）："+path)
		if agent == "other" {
			fmt.Fprintln(os.Stderr, "请将此文件的内容放入当前 Agent 实际支持的系统提示词入口；尚未声称自动生效。")
		}
	}
	fmt.Fprintln(os.Stderr, "安装完成："+binary+"；兼容命令 wb。重新打开终端或执行 export PATH=\"$HOME/.local/bin:$PATH\"，然后 wb stats。")
	return nil
}

func homeDir() string { h, _ := os.UserHomeDir(); return h }
