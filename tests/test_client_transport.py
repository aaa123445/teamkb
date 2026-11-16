import httpx
import pytest
from cli import transport


@pytest.mark.parametrize('method,path,retry', [('GET','/api/v1/stats',True),('POST','/api/v1/search',True),('POST','/api/v1/contributions',False)])
def test_ambiguous_failure_only_retries_reads(monkeypatch, method, path, retry):
    calls=[]
    class Client:
        def __init__(self, **kw): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def request(self,*args,**kw):
            calls.append(1)
            if len(calls)==1: raise httpx.ReadError('lost response')
            return httpx.Response(200)
    monkeypatch.setattr(transport.httpx,'Client',Client)
    monkeypatch.setattr(transport.time,'sleep',lambda _:None)
    if retry:
        assert transport.request(method,'https://team.example'+path).status_code==200
        assert len(calls)==2
    else:
        with pytest.raises(httpx.ReadError): transport.request(method,'https://team.example'+path)
        assert len(calls)==1


def test_connect_failure_retries_are_bounded(monkeypatch):
    calls=[]
    class Client:
        def __init__(self,**kw):pass
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def request(self,*args,**kw):
            calls.append(1)
            raise httpx.ConnectError('handshake failed')
    monkeypatch.setattr(transport.httpx,'Client',Client)
    monkeypatch.setattr(transport.time,'sleep',lambda _:None)
    with pytest.raises(httpx.ConnectError):transport.request('GET','https://team.example/stats')
    assert len(calls)==4
