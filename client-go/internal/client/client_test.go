package client

import (
	"context"
	"encoding/json"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestConnectionIsolation(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)
	t.Setenv("TEAMKB_URL", "")
	t.Setenv("TEAMKB_KEY", "")
	t.Setenv("V8WB_URL", "")
	t.Setenv("V8WB_KEY", "")
	_, e := SaveConnection(Connection{"https://one.example", "private-test-key"}, "user", "")
	if e != nil {
		t.Fatal(e)
	}
	c, e := Resolve("https://two.example", "", "")
	if e != nil || c.Key != "" {
		t.Fatalf("cross-server key reuse: %+v %v", c, e)
	}
	c, e = Resolve("", "", "")
	if e != nil || c.Key != "private-test-key" {
		t.Fatal(c, e)
	}
	project := t.TempDir()
	_, e = SaveConnection(Connection{"https://project.example", "project-key"}, "project", project)
	if e != nil {
		t.Fatal(e)
	}
	c, e = Resolve("", "", project)
	if e != nil || c.Key != "project-key" {
		t.Fatal(c, e)
	}
	if _, e = Resolve("", "", t.TempDir()); e == nil {
		t.Fatal("missing explicit project accepted")
	}
	stat, _ := os.Stat(UserConfig())
	if stat.Mode().Perm() != 0600 {
		t.Fatal("unsafe key permissions")
	}
	b, _ := os.ReadFile(filepath.Join(project, ".gitignore"))
	if !strings.Contains(string(b), "/.teamkb/client.json") {
		t.Fatal("missing ignore")
	}
	if Expand("~") != home {
		t.Fatal("tilde expansion")
	}
}
func TestRetriesAndErrors(t *testing.T) {
	calls := 0
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.Header.Get("Authorization") != "Bearer private-key" {
			t.Error("missing authorization")
		}
		w.WriteHeader(502)
		w.Write([]byte(`{"detail":"private-key"}`))
	}))
	defer s.Close()
	c := New(Connection{s.URL, "private-key"}, "cli", time.Second)
	c.Delay = 0
	_, e := c.Call(context.Background(), "GET", "/api/v1/stats", nil)
	if calls != 4 || e == nil || strings.Contains(e.Error(), "private-key") {
		t.Fatal(calls, e)
	}
	calls = 0
	_, e = c.Call(context.Background(), "POST", "/api/v1/contributions", map[string]string{"title": "test"})
	if calls != 1 {
		t.Fatal("unsafe write retry", calls)
	}
	e = safeHTTPError(400, []byte(`{"error":"not_found"}`), "/api/v1/read")
	if !strings.Contains(e.Error(), "文档 ID 不存在") {
		t.Fatal(e)
	}
}
func TestMCPRoundTrip(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-V8WB-Client") != "mcp" {
			t.Error("wrong client kind")
		}
		switch r.URL.Path {
		case "/api/v1/read":
			w.WriteHeader(400)
			w.Write([]byte(`{"error":"not_found"}`))
		case "/api/v1/stats":
			w.Write([]byte(`{"documents":1398}`))
		default:
			w.Write([]byte(`{"categories":[]}`))
		}
	}))
	defer s.Close()
	c := New(Connection{s.URL, "test-key"}, "mcp", time.Second)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	st, ct := mcp.NewInMemoryTransports()
	server, err := c.MCP().Connect(ctx, st, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()
	session, err := mcp.NewClient(&mcp.Implementation{Name: "test", Version: "1"}, nil).Connect(ctx, ct, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	list, e := session.ListTools(ctx, nil)
	if e != nil || len(list.Tools) != 9 {
		t.Fatal(list, e)
	}
	res, e := session.CallTool(ctx, &mcp.CallToolParams{Name: "kb_stats", Arguments: map[string]any{}})
	if e != nil || res.IsError {
		t.Fatal(res, e)
	}
	b, _ := json.Marshal(res)
	if !strings.Contains(string(b), "1398") {
		t.Fatal(string(b))
	}
	res, e = session.CallTool(ctx, &mcp.CallToolParams{Name: "kb_read", Arguments: map[string]any{"doc_id": "missing"}})
	if e != nil || !res.IsError {
		t.Fatal(res, e)
	}
	b, _ = json.Marshal(res)
	if !strings.Contains(string(b), "文档 ID 不存在") {
		t.Fatal(string(b))
	}
	res, e = session.CallTool(ctx, &mcp.CallToolParams{Name: "kb_propose", Arguments: map[string]any{"title": "x"}})
	if e != nil || !res.IsError {
		t.Fatal("invalid proposal was accepted", res, e)
	}
}
func candidate() Proposal {
	return Proposal{Title: "Verified solution", CategoryID: "test", Content: strings.Repeat("A verified reusable solution. ", 5), Problem: "A real reproducible problem", Solution: "Steps that were actually executed and verified", Verification: "Test run succeeded with actual evidence", Limitations: "Only tested on Linux", Verified: true, Reusable: true}
}
func TestQueueKeepsAmbiguousWriteWithoutCredentials(t *testing.T) {
	t.Setenv("TEAMKB_QUEUE_DIR", t.TempDir())
	calls := 0
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls++; w.WriteHeader(502); w.Write([]byte(`{}`)) }))
	defer s.Close()
	c := New(Connection{s.URL, "super-private-key"}, "cli", time.Second)
	_, e := c.Deliver(context.Background(), candidate())
	if e == nil || calls != 1 {
		t.Fatal(e, calls)
	}
	q, e := QueueList()
	if e != nil || len(q) != 1 || q[0].Attempts != 1 {
		t.Fatal(q, e)
	}
	path, _ := queuePath(q[0].ID)
	b, _ := os.ReadFile(path)
	if strings.Contains(string(b), "super-private-key") {
		t.Fatal("credential persisted")
	}
	other := New(Connection{"https://different.example", "other-key"}, "cli", time.Second)
	if _, e = other.Retry(context.Background(), q[0].ID, true); e == nil {
		t.Fatal("cross-server queue retry allowed")
	}
	if _, e = c.Deliver(context.Background(), candidate()); e == nil || calls != 1 {
		t.Fatal("duplicate immediately retried", e, calls)
	}
}
