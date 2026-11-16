package setup

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func testPluginZip(t *testing.T, agent string) []byte {
	t.Helper()
	var b bytes.Buffer
	z := zip.NewWriter(&b)
	files := map[string]string{"plugins/teamkb/.mcp.json": `{"mcpServers":{"teamkb":{"command":"template","args":["mcp"]}}}`, "plugins/teamkb/skills/team-knowledge/SKILL.md": "---\nname: team-knowledge\ndescription: test\n---\nKnowledge workflow.\n"}
	marker := ".agents/plugins/marketplace.json"
	if agent == "claudecode" {
		marker = ".claude-plugin/marketplace.json"
	}
	files[marker] = `{"name":"teamkb-native","plugins":[]}`
	for n, v := range files {
		f, e := z.Create(n)
		if e != nil {
			t.Fatal(e)
		}
		f.Write([]byte(v))
	}
	z.Close()
	return b.Bytes()
}
func TestPluginInstallPreservesInstructionsAndScopes(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("fixture executable uses POSIX shell")
	}
	for _, agent := range []string{"codex", "claudecode"} {
		t.Run(agent, func(t *testing.T) {
			home := t.TempDir()
			t.Setenv("HOME", home)
			t.Setenv("USERPROFILE", home)
			tools := filepath.Join(home, "bin")
			os.MkdirAll(tools, 0700)
			name := agent
			if name == "claudecode" {
				name = "claude"
			}
			script := "#!/bin/sh\nprintf '%s\\n' \"$@\" >> \"$HOME/registration\"\n"
			os.WriteFile(filepath.Join(tools, name), []byte(script), 0700)
			t.Setenv("PATH", tools+string(os.PathListSeparator)+os.Getenv("PATH"))
			os.MkdirAll(filepath.Join(home, ".teamkb"), 0700)
			for _, n := range []string{"AGENTS.md", "CLAUDE.md"} {
				os.WriteFile(filepath.Join(home, n), []byte("keep my rules"), 0600)
			}
			scope := "user"
			project := ""
			if agent == "claudecode" {
				scope = "project"
				project = t.TempDir()
			}
			data := testPluginZip(t, agent)
			if e := installPlugin(context.Background(), data, agent, scope, project, "/actual/teamkb", false); e != nil {
				t.Fatal(e)
			}
			root := filepath.Join(home, ".teamkb", "plugins", agent, scope)
			if project != "" {
				root = filepath.Join(root, projectID(project))
			}
			b, e := os.ReadFile(filepath.Join(root, "plugins/teamkb/.mcp.json"))
			if e != nil {
				t.Fatal(e)
			}
			var cfg struct {
				Servers map[string]struct {
					Command string   `json:"command"`
					Args    []string `json:"args"`
				} `json:"mcpServers"`
			}
			if json.Unmarshal(b, &cfg) != nil || cfg.Servers["teamkb"].Command != "/actual/teamkb" {
				t.Fatal(string(b))
			}
			if scope == "project" && strings.Join(cfg.Servers["teamkb"].Args, " ") != "--project "+project+" mcp" {
				t.Fatal(cfg)
			}
			skill, _ := os.ReadFile(filepath.Join(root, "plugins/teamkb/skills/team-knowledge/SKILL.md"))
			if !strings.Contains(string(skill), "contribution is disabled") {
				t.Fatal(string(skill))
			}
			for _, n := range []string{"AGENTS.md", "CLAUDE.md"} {
				b, _ := os.ReadFile(filepath.Join(home, n))
				if string(b) != "keep my rules" {
					t.Fatal("instructions changed")
				}
			}
			b, _ = os.ReadFile(filepath.Join(home, "registration"))
			if !strings.Contains(string(b), "marketplace\nadd") || !strings.Contains(string(b), "teamkb@teamkb-native") {
				t.Fatal(string(b))
			}
			if scope == "project" && !strings.Contains(string(b), "--scope\nproject") {
				t.Fatal("scope lost")
			}
			if e := installPlugin(context.Background(), data, agent, scope, project, "/actual/teamkb", true); e != nil {
				t.Fatal("reinstall", e)
			}
		})
	}
}
func TestPluginRejectsTraversalBeforeWriting(t *testing.T) {
	for _, name := range []string{"plugins/teamkb/../../../outside", "plugins/teamkb/../../inside", "plugins/teamkb/C:/bad", "plugins/teamkb/a\\bad"} {
		var b bytes.Buffer
		z := zip.NewWriter(&b)
		f, _ := z.Create(name)
		f.Write([]byte("bad"))
		z.Close()
		dest := t.TempDir()
		if ExtractPlugin(b.Bytes(), dest) == nil {
			t.Fatal("accepted", name)
		}
		entries, _ := os.ReadDir(dest)
		if len(entries) != 0 {
			t.Fatal("partially extracted unsafe zip")
		}
	}
}
func TestCodexProjectPluginRejectedBeforeMutation(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)
	e := Run(context.Background(), map[string]string{"agent": "codex", "mode": "plugin", "scope": "project"}, true)
	if e == nil || !strings.Contains(e.Error(), "项目") {
		t.Fatal(e)
	}
	entries, _ := os.ReadDir(home)
	if len(entries) != 0 {
		t.Fatal("mutated on unsupported scope")
	}
}
