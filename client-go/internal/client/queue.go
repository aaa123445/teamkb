package client

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type QueueEntry struct {
	ID          string   `json:"id"`
	URL         string   `json:"url"`
	Payload     Proposal `json:"payload"`
	Status      string   `json:"status"`
	Attempts    int      `json:"attempts"`
	NextRetryAt int64    `json:"next_retry_at"`
	CreatedAt   int64    `json:"created_at"`
	LastError   string   `json:"last_error,omitempty"`
}

func QueueDir() string {
	if p := os.Getenv("TEAMKB_QUEUE_DIR"); p != "" {
		return Expand(p)
	}
	return filepath.Join(UserDir(), "queue")
}
func QueueList() ([]QueueEntry, error) {
	paths, e := filepath.Glob(filepath.Join(QueueDir(), "*.json"))
	if e != nil {
		return nil, e
	}
	out := []QueueEntry{}
	for _, p := range paths {
		b, e := os.ReadFile(p)
		if e != nil {
			return nil, e
		}
		var q QueueEntry
		if e = json.Unmarshal(b, &q); e != nil {
			return nil, errors.New("队列文件损坏，请手动核对")
		}
		out = append(out, q)
	}
	return out, nil
}
func queuePath(id string) (string, error) {
	b, e := hex.DecodeString(id)
	if e != nil || len(b) != 32 {
		return "", errors.New("无效的队列 ID")
	}
	return filepath.Join(QueueDir(), id+".json"), nil
}
func QueueRemove(id string) error {
	p, e := queuePath(id)
	if e != nil {
		return e
	}
	return os.Remove(p)
}
func saveQueue(q QueueEntry) error {
	p, e := queuePath(q.ID)
	if e != nil {
		return e
	}
	b, e := json.MarshalIndent(q, "", "  ")
	if e != nil {
		return e
	}
	return WritePrivate(p, append(b, '\n'))
}
func (c *Client) Deliver(ctx context.Context, p Proposal) (json.RawMessage, error) {
	if e := p.Validate(); e != nil {
		return nil, e
	}
	p.Source = "agent"
	b, _ := json.Marshal(p)
	sum := sha256.Sum256(append([]byte(c.URL+"\n"), b...))
	id := hex.EncodeToString(sum[:])
	path, _ := queuePath(id)
	q := QueueEntry{ID: id, URL: c.URL, Payload: p, Status: "queued", CreatedAt: time.Now().Unix()}
	if old, e := os.ReadFile(path); e == nil {
		if json.Unmarshal(old, &q) != nil {
			return nil, errors.New("队列文件损坏")
		}
		if q.Status != "queued" || q.NextRetryAt > time.Now().Unix() {
			return nil, errors.New("候选已在队列；请使用 wb queue list 核对，必要时 wb queue retry ID --reset")
		}
	} else if !os.IsNotExist(e) {
		return nil, e
	} else {
		all, e := QueueList()
		if e != nil {
			return nil, e
		}
		if len(all) >= 100 {
			return nil, errors.New("队列已达 100 条，请先处理")
		}
	}
	return c.deliverEntry(ctx, q)
}
func (c *Client) deliverEntry(ctx context.Context, q QueueEntry) (json.RawMessage, error) {
	if q.URL != c.URL {
		return nil, errors.New("队列的服务地址与当前连接不同，拒绝混用凭据")
	}
	q.Attempts++
	q.NextRetryAt = time.Now().Add(time.Duration(30*(1<<min(q.Attempts, 10))) * time.Second).Unix()
	if q.Attempts >= 5 {
		q.Status = "exhausted"
	}
	if e := saveQueue(q); e != nil {
		return nil, e
	}
	out, e := c.Call(ctx, "POST", "/api/v1/contributions", q.Payload)
	if e == nil {
		return out, QueueRemove(q.ID)
	}
	q.LastError = "network_or_response_error"
	var api *APIError
	if errors.As(e, &api) {
		q.LastError = api.Error()
		if api.Status != 429 && api.Status < 500 {
			q.Status = "blocked"
		}
	}
	if se := saveQueue(q); se != nil {
		return nil, se
	}
	return nil, errors.New(e.Error() + "；候选已保存在本地队列（不含 Key），请先核对 wb contributions，避免重复提交")
}
func (c *Client) Retry(ctx context.Context, id string, reset bool) (json.RawMessage, error) {
	path, e := queuePath(id)
	if e != nil {
		return nil, e
	}
	b, e := os.ReadFile(path)
	if e != nil {
		return nil, e
	}
	var q QueueEntry
	if json.Unmarshal(b, &q) != nil {
		return nil, errors.New("队列文件损坏")
	}
	if !reset && (q.Status != "queued" || q.NextRetryAt > time.Now().Unix()) {
		return nil, errors.New("候选暂不可重试；核对服务端无重复记录后，可加 --reset")
	}
	if reset {
		q.Status = "queued"
		q.Attempts = 0
	}
	if e = q.Payload.Validate(); e != nil {
		return nil, e
	}
	return c.deliverEntry(ctx, q)
}
func ReadProposal(path string) (Proposal, error) {
	var p Proposal
	b, e := os.ReadFile(Expand(path))
	if e != nil {
		return p, e
	}
	if len(b) > 240000 {
		return p, errors.New("候选文件最多 240 KB")
	}
	dec := json.NewDecoder(strings.NewReader(string(b)))
	dec.DisallowUnknownFields()
	if e = dec.Decode(&p); e != nil {
		return p, errors.New("候选 JSON 格式或字段不正确")
	}
	return p, p.Validate()
}
