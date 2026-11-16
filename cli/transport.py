"""Bounded retries shared by CLI and MCP; never replay ambiguous writes."""
import ssl
import time

import httpx

READ_POSTS = {'/api/v1/search', '/api/v1/read', '/api/v1/rules'}


def request(method, url, *, payload=None, headers=None, timeout=60):
    method = method.upper()
    safe = method in {'GET', 'HEAD'} or httpx.URL(url).path in READ_POSTS
    for attempt in range(4):
        try:
            # Use system roots as well as Python's bundled roots where available.
            with httpx.Client(timeout=timeout, http2=False, verify=ssl.create_default_context()) as client:
                response = client.request(method, url, json=payload, headers=headers)
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            # TLS verification errors are persistent; retries cannot repair trust.
            if 'CERTIFICATE_VERIFY_FAILED' in str(exc) or attempt == 3:
                raise
        except (httpx.ReadError, httpx.ReadTimeout, httpx.RemoteProtocolError):
            if not safe or attempt == 3:
                raise
        else:
            if not safe or response.status_code not in {502, 503, 504} or attempt == 3:
                return response
        time.sleep(2 ** attempt)
