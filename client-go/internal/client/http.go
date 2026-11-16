package client

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string { return fmt.Sprintf("TeamKB HTTP %d：%s", e.Status, e.Message) }

type Client struct {
	Connection
	HTTP    *http.Client
	Kind    string
	Retries int
	Delay   time.Duration
}

func New(c Connection, kind string, timeout time.Duration) *Client {
	tr := http.DefaultTransport.(*http.Transport).Clone()
	tr.ForceAttemptHTTP2 = false
	tr.TLSNextProto = map[string]func(string, *tls.Conn) http.RoundTripper{}
	tr.TLSClientConfig = &tls.Config{NextProtos: []string{"http/1.1"}, CurvePreferences: []tls.CurveID{tls.X25519, tls.CurveP256, tls.CurveP384}}
	protocols := new(http.Protocols)
	protocols.SetHTTP1(true)
	tr.Protocols = protocols
	tr.MaxConnsPerHost = 8
	return &Client{c, &http.Client{Timeout: timeout, Transport: tr, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}, kind, 3, time.Second}
}
func ReadOnly(method, path string) bool {
	if method == "GET" {
		return true
	}
	for _, p := range []string{"/api/v1/search", "/api/v1/read", "/api/v1/rules"} {
		if path == p {
			return true
		}
	}
	return false
}
func (c *Client) Call(ctx context.Context, method, path string, payload any) (json.RawMessage, error) {
	data, e := json.Marshal(payload)
	if e != nil {
		return nil, e
	}
	for attempt := 0; attempt <= c.Retries; attempt++ {
		var body io.Reader
		if payload != nil {
			body = bytes.NewReader(data)
		}
		req, e := http.NewRequestWithContext(ctx, method, c.URL+path, body)
		if e != nil {
			return nil, errors.New("请求地址无效")
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-V8WB-Client", c.Kind)
		req.Header.Set("User-Agent", "TeamKB-Go/"+Version)
		if c.Key != "" {
			req.Header.Set("Authorization", "Bearer "+c.Key)
		}
		resp, e := c.HTTP.Do(req)
		retry := false
		if e != nil {
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			var cert x509.CertificateInvalidError
			var unknown x509.UnknownAuthorityError
			if errors.As(e, &cert) || errors.As(e, &unknown) {
				return nil, errors.New("TLS 证书校验失败，请修复系统证书或代理；未关闭 TLS 校验")
			}
			retry = true
		} else {
			retry = resp.StatusCode == 502 || resp.StatusCode == 503 || resp.StatusCode == 504
		}
		if retry && ReadOnly(method, path) && attempt < c.Retries {
			if resp != nil {
				resp.Body.Close()
			}
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(c.Delay * time.Duration(1<<attempt)):
			}
			continue
		}
		if e != nil {
			if !ReadOnly(method, path) {
				return nil, errors.New("提交结果未确认；请先用 wb contributions 核对，再决定是否重试，避免重复提交")
			}
			return nil, errors.New("连接失败，已完成有限重试；请检查网络、代理和 TLS 证书")
		}
		raw, e := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
		resp.Body.Close()
		if e != nil {
			return nil, errors.New("响应接收中断，请重新查询；写入操作请先核对结果")
		}
		if resp.StatusCode >= 300 {
			return nil, safeHTTPError(resp.StatusCode, raw, path)
		}
		if !json.Valid(raw) {
			return nil, errors.New("服务端返回了无效 JSON")
		}
		return raw, nil
	}
	return nil, errors.New("请求失败")
}
func safeHTTPError(status int, raw []byte, path string) error {
	hint := map[int]string{400: "请求参数无效，请检查输入内容", 401: "个人 Key 无效或已吊销", 403: "账号尚未批准或权限不足", 404: "记录不存在或无权访问", 409: "版本冲突，请重新读取原文", 422: "字段格式不完整，请检查输入", 429: "调用额度已用尽，请稍后重试", 502: "上游服务暂不可用", 503: "服务繁忙，请稍后重试", 504: "服务响应超时"}[status]
	var out map[string]any
	_ = json.Unmarshal(raw, &out)
	if status == 400 && path == "/api/v1/read" && out["error"] == "not_found" {
		hint = "文档 ID 不存在，请先用 wb search / kb_search 获取有效 ID"
	}
	if hint == "" {
		hint = "服务请求失败，请检查服务状态"
	}
	return &APIError{status, strings.TrimSpace(hint)}
}
