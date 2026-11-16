package client

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const Version = "0.6.2"
const DefaultURL = "https://www.ljc.monster"

type Connection struct {
	URL string `json:"url"`
	Key string `json:"key"`
}

func UserDir() string    { h, _ := os.UserHomeDir(); return filepath.Join(h, ".teamkb") }
func UserConfig() string { return filepath.Join(UserDir(), "client.json") }
func Expand(p string) string {
	if p == "~" || strings.HasPrefix(p, "~/") {
		h, _ := os.UserHomeDir()
		if p == "~" {
			return h
		}
		return filepath.Join(h, strings.TrimPrefix(p, "~/"))
	}
	return p
}
func ValidateURL(value string) (string, error) {
	u, e := url.Parse(strings.TrimRight(strings.TrimSpace(value), "/"))
	if e != nil || u.Hostname() == "" || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		return "", errors.New("服务地址必须是不含凭据、查询参数和片段的 HTTP(S) URL")
	}
	return u.String(), nil
}
func ReadConfig(path string) (Connection, error) {
	var c Connection
	b, e := os.ReadFile(path)
	if os.IsNotExist(e) {
		return c, nil
	}
	if e != nil {
		return c, fmt.Errorf("无法读取配置 %s", path)
	}
	if json.Unmarshal(b, &c) != nil {
		return c, fmt.Errorf("配置 %s 格式错误，请重新运行 wb init", path)
	}
	return c, nil
}
func Env(names ...string) string {
	for _, n := range names {
		if v := os.Getenv(n); v != "" {
			return v
		}
	}
	return ""
}
func Resolve(explicitURL, explicitKey, project string) (Connection, error) {
	path := UserConfig()
	if project != "" {
		root, e := filepath.Abs(Expand(project))
		if e != nil {
			return Connection{}, e
		}
		path = filepath.Join(root, ".teamkb", "client.json")
		if _, e = os.Stat(path); e != nil {
			return Connection{}, errors.New("项目尚未初始化，请执行 wb --project PROJECT_ROOT init --scope project")
		}
	} else {
		root, _ := os.Getwd()
		for {
			p := filepath.Join(root, ".teamkb", "client.json")
			if _, e := os.Stat(p); e == nil {
				path = p
				break
			}
			parent := filepath.Dir(root)
			if parent == root {
				break
			}
			root = parent
		}
	}
	saved, e := ReadConfig(path)
	if e != nil {
		return saved, e
	}
	target := explicitURL
	if target == "" {
		target = Env("TEAMKB_URL", "V8WB_URL")
	}
	if target == "" {
		target = saved.URL
	}
	if target == "" {
		target = DefaultURL
	}
	target, e = ValidateURL(target)
	if e != nil {
		return Connection{}, e
	}
	key := explicitKey
	if key == "" {
		key = Env("TEAMKB_KEY", "V8WB_KEY")
	}
	if key == "" && strings.TrimRight(saved.URL, "/") == target {
		key = saved.Key
	}
	return Connection{target, key}, nil
}
func WritePrivate(path string, data []byte) error {
	if e := os.MkdirAll(filepath.Dir(path), 0700); e != nil {
		return e
	}
	f, e := os.CreateTemp(filepath.Dir(path), ".teamkb-*")
	if e != nil {
		return e
	}
	tmp := f.Name()
	defer os.Remove(tmp)
	if e = f.Chmod(0600); e == nil {
		_, e = f.Write(data)
	}
	if ce := f.Close(); e == nil {
		e = ce
	}
	if e != nil {
		return e
	}
	return os.Rename(tmp, path)
}
func SaveConnection(c Connection, scope, project string) (string, error) {
	if scope != "user" && scope != "project" {
		return "", errors.New("接入范围须为 user 或 project")
	}
	target, e := ValidateURL(c.URL)
	if e != nil {
		return "", e
	}
	c.URL = target
	if c.Key == "" || c.Key == "YOUR_PERSONAL_KEY" || strings.ContainsAny(c.Key, "\r\n") {
		return "", errors.New("请填写真实的个人 API Key")
	}
	path := UserConfig()
	if scope == "project" {
		if project == "" {
			project = "."
		}
		root, e := filepath.Abs(Expand(project))
		if e != nil {
			return "", e
		}
		info, e := os.Stat(root)
		if e != nil || !info.IsDir() {
			return "", errors.New("项目目录不存在")
		}
		ignore := filepath.Join(root, ".gitignore")
		b, e := os.ReadFile(ignore)
		if e != nil && !os.IsNotExist(e) {
			return "", e
		}
		line := "/.teamkb/client.json"
		if !strings.Contains("\n"+string(b)+"\n", "\n"+line+"\n") {
			f, e := os.OpenFile(ignore, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
			if e != nil {
				return "", e
			}
			_, e = f.WriteString("\n" + line + "\n")
			f.Close()
			if e != nil {
				return "", e
			}
		}
		path = filepath.Join(root, ".teamkb", "client.json")
	}
	b, e := json.MarshalIndent(c, "", "  ")
	if e != nil {
		return "", e
	}
	return path, WritePrivate(path, append(b, '\n'))
}
