param(
  [ValidateSet('codex','claudecode','other')][string]$Agent='codex',
  [ValidateSet('cli','mcp','recommended','skill')][string]$Mode='cli',
  [ValidateSet('user','project')][string]$Scope='user',
  [string]$Url='https://www.ljc.monster',
  [string]$Project='',
  [switch]$NoContribute,
  [switch]$CheckOnly
)
$ErrorActionPreference='Stop'
$version='0.6.0'
$Url=$Url.TrimEnd('/')
if ($Url -notmatch '^https?://') { throw '无效的服务地址' }
$cpu=if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } elseif ($env:PROCESSOR_ARCHITECTURE -eq 'AMD64') { 'amd64' } else { throw '暂不支持此 CPU 架构' }
Write-Host "[环境检测] windows/$cpu；原生客户端，无需 Python / Node"
function Download([string]$Address,[string]$File) {
  for($attempt=0; $attempt -lt 4; $attempt++) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $Address -OutFile $File -TimeoutSec 180; return }
    catch { if($attempt -eq 3) { throw }; Start-Sleep -Seconds ($attempt+1) }
  }
}
$tmp=Join-Path ([IO.Path]::GetTempPath()) ('teamkb-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $mf=Join-Path $tmp 'manifest.json'
  Download "$Url/static/downloads/go-manifest.json" $mf
  $manifest=Get-Content -Raw $mf | ConvertFrom-Json
  $name="teamkb-$version-windows-$cpu.exe"
  $sha=$manifest.sha256.$name
  if ($sha -notmatch '^[a-f0-9]{64}$') { throw '缺少原生客户端 SHA-256 校验信息' }
  $exe=Join-Path $tmp 'teamkb.exe'
  Download "$Url/static/downloads/${name}?sha256=$sha" $exe
  if ((Get-FileHash -Algorithm SHA256 $exe).Hash.ToLowerInvariant() -ne $sha) { throw 'SHA-256 不匹配，已停止，未写入凭据或 Agent 配置' }
  $installArgs=@('setup','--agent',$Agent,'--mode',$Mode,'--scope',$Scope,'--url',$Url)
  if($Project) { $installArgs+=@('--project',$Project) }
  if($NoContribute) { $installArgs+='--no-contribute' }
  if($CheckOnly) { $installArgs+='--check-only' }
  & $exe @installArgs
  if($LASTEXITCODE -ne 0) { throw '安装未完成，请查看上面的具体错误' }
  if(-not $CheckOnly) { $env:Path=(Join-Path $env:LOCALAPPDATA 'TeamKB\bin')+';'+$env:Path }
} finally { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
