<#
 ÇİZGİ DÖVÜŞÜ — telefondan test: yerel sunucu + Cloudflare hızlı tüneli
 Kullanım: start-tunnel.bat dosyasına çift tıkla (o bu dosyayı çalıştırır).
 Verilen https adresi GEÇİCİDİR: her başlatmada değişir, pencere kapanınca ölür.
#>
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$proje = $PSScriptRoot
$port  = 8000

function Yaz($msg, $renk = 'Gray') { Write-Host $msg -ForegroundColor $renk }

# ---- 1) cloudflared'i bul (önce proje klasörü, sonra PATH) ----
$cf = Join-Path $proje 'cloudflared.exe'
if (-not (Test-Path $cf)) {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { $cf = $cmd.Source } else { $cf = $null }
}
if (-not $cf) {
  Yaz ''
  Yaz 'cloudflared bulunamadi!' 'Red'
  Yaz ''
  Yaz 'Kurmak icin: Baslat menusunden "PowerShell" ac ve su komutu yapistir:' 'Yellow'
  Yaz ''
  Yaz '    winget install --id Cloudflare.cloudflared' 'White'
  Yaz ''
  Yaz 'Kurulum bitince bu pencereyi kapat ve start-tunnel.bat''a tekrar cift tikla.'
  exit 1
}

# ---- 2) Python'u bul ----
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) {
  Yaz 'Python bulunamadi! (oyunun yerel sunucusu icin gerekli)' 'Red'
  exit 1
}

# ---- 3) yerel sunucu (port doluysa mevcut sunucu kullanilir) ----
$srv = $null
$dolu = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($dolu) {
  Yaz "Port $port zaten acik - mevcut sunucu kullanilacak."
} else {
  $srv = Start-Process -FilePath $py.Source -ArgumentList '-m','http.server',"$port",'--bind','127.0.0.1' -WorkingDirectory $proje -WindowStyle Hidden -PassThru
  Yaz "Yerel sunucu basladi (http://localhost:$port)."
}

# ---- 4) tunel: https adresi yakalaninca buyuk puntoyla goster ----
Yaz 'Cloudflare tuneli aciliyor, https adresi bekleniyor...' 'Cyan'
$script:url = $null
try {
  & $cf tunnel --url "http://127.0.0.1:$port" 2>&1 | ForEach-Object {
    $satir = "$_"
    if (-not $script:url -and $satir -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
      $script:url = $Matches[0]
      try { Set-Clipboard -Value $script:url } catch {}
      Yaz ''
      Yaz '  ==============================================================' 'Green'
      Yaz "   TELEFONDAN AC:  $($script:url)" 'Green'
      Yaz '  ==============================================================' 'Green'
      Yaz '   Adres panoya kopyalandi; telefona WhatsApp vb. ile gonderebilirsin.'
      Yaz '   GECICIDIR: her baslatmada degisir, bu pencere kapaninca olur.'
      Yaz '   Bitirmek icin bu pencereyi kapat (veya Ctrl+C).'
      Yaz ''
    }
    elseif (-not $script:url -and $satir -match 'ERR|error|failed') {
      Yaz $satir 'DarkRed'
    }
  }
} finally {
  if ($srv) { Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue }
  if (-not $script:url) {
    Yaz 'Tunel adresi alinamadi - internet baglantisini kontrol edip tekrar dene.' 'Red'
  } else {
    Yaz 'Tunel kapandi, yerel sunucu durduruldu.' 'Yellow'
  }
}
