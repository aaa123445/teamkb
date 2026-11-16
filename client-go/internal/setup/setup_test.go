package setup

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestManagedMergePreservesUserInstructions(t *testing.T) {
	old := "# User rule\nNever remove this.\n"
	block := "<!-- TEAMKB:BEGIN -->\nhello\n<!-- TEAMKB:END -->"
	first, e := MergeBlock(old, block, "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->")
	if e != nil {
		t.Fatal(e)
	}
	second, e := MergeBlock(first, strings.ReplaceAll(block, "hello", "updated"), "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->")
	if e != nil || !strings.Contains(second, "Never remove this") || strings.Count(second, "TEAMKB:BEGIN") != 1 || strings.Contains(second, "hello") {
		t.Fatal(second, e)
	}
	if _, e = MergeBlock("<!-- TEAMKB:BEGIN -->", block, "<!-- TEAMKB:BEGIN -->", "<!-- TEAMKB:END -->"); e == nil {
		t.Fatal("corrupt marker overwritten")
	}
}
func TestCodexMerge(t *testing.T) {
	old := []byte("# keep comment\nmodel = 'test'\n[mcp_servers.other]\ncommand='other'\n[mcp_servers.teamkb]\ncommand='old'\n[mcp_servers.teamkb.env]\nTEAMKB_KEY='stale'\n[other]\nenabled=true\n")
	out, e := MergeCodex(old, "/new/teamkb", []string{"--project", "/my/project", "mcp"})
	if e != nil {
		t.Fatal(e)
	}
	for _, s := range []string{"keep comment", "command='other'", "enabled=true", "/new/teamkb", "/my/project"} {
		if !strings.Contains(string(out), s) {
			t.Fatal(string(out))
		}
	}
	if strings.Contains(string(out), "stale") {
		t.Fatal("stale key retained")
	}
	if _, e = MergeCodex([]byte("invalid=["), "x", nil); e == nil {
		t.Fatal("invalid TOML accepted")
	}
}
func TestSkillTraversal(t *testing.T) {
	for _, name := range []string{"team-knowledge/../../outside", "team-knowledge/a/../../../outside", "team-knowledge/C:/evil", "team-knowledge/a\\evil", "other/SKILL.md"} {
		var b bytes.Buffer
		z := zip.NewWriter(&b)
		f, _ := z.Create(name)
		f.Write([]byte("bad"))
		z.Close()
		if e := ExtractSkill(b.Bytes(), t.TempDir()); e == nil {
			t.Fatal("accepted", name)
		}
	}
}
func TestDownloadVerification(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("verified artifact")) }))
	defer s.Close()
	sum := sha256.Sum256([]byte("verified artifact"))
	_, e := Download(context.Background(), s.URL, "test.zip", hex.EncodeToString(sum[:]))
	if e != nil {
		t.Fatal(e)
	}
	if _, e = Download(context.Background(), s.URL, "test.zip", strings.Repeat("0", 64)); e == nil {
		t.Fatal("tampered artifact accepted")
	}
}
func TestCheckOnlyDoesNotMutate(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(`{"status":"ok"}`)) }))
	defer s.Close()
	if e := Run(context.Background(), map[string]string{"agent": "other", "mode": "cli", "scope": "user", "url": s.URL, "check-only": "true"}, true); e != nil {
		t.Fatal(e)
	}
	if _, e := os.Stat(filepath.Join(home, ".teamkb")); !os.IsNotExist(e) {
		t.Fatal("check-only modified home")
	}
}
