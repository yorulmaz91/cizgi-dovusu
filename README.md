# ÇİZGİ DÖVÜŞÜ — Karikatür

Siyah-beyaz karikatür stilinde, tuval (canvas) tabanlı çöp adam dövüş oyunu.
3 karakter (GÖLGE / BETON / VOLT), Tekken tarzı vuruş zincirleri, zıplama/çömelme,
launcher+juggle, AI rakip, fatality sahneleri ve çizgi roman efektleri içerir.

## Nasıl çalıştırılır?

Oyun ES modülleri kullandığı için `index.html` dosyasına **çift tıklayarak açmak çalışmaz**;
küçük bir yerel sunucu gerekir. İki kolay yol:

**1. Python yüklüyse** (bu bilgisayarda hazır):

```
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000` adresini aç.

**2. Node.js yüklüyse:**

```
npm start
```

Ardından tarayıcıda açılan adresi (genelde `http://localhost:3000`) ziyaret et.

> Not: `cizgi-dovusu.html` orijinal tek dosyalık sürümdür, yedek olarak duruyor;
> oyunun güncel hali `index.html` + `css/` + `js/` klasörlerindedir.

## Telefondan / uzaktan test

- **Anlık deneme:** `start-tunnel.bat`'a çift tıkla → çıkan geçici
  `https://....trycloudflare.com` adresini telefonda aç (cloudflared gerekir:
  `winget install --id Cloudflare.cloudflared`).
- **Kalıcı adres:** proje GitHub'a push'lanınca `.github/workflows/pages.yml`
  oyunu GitHub Pages'te otomatik yayınlar:
  https://yorulmaz91.github.io/cizgi-dovusu/ (repo adı `cizgi-dovusu` olmalı)
- Hangi durumda hangisi: bkz. `CLAUDE.md` → "Uzaktan test" bölümü.

## Kontroller

| Eylem   | Klavye | Dokunmatik |
|---------|--------|------------|
| Hareket | ← → (veya A/D) | D-pad ◀ ▶ |
| Zıpla   | ↑ (veya W) | ▲ |
| Çömel   | ↓ (veya S) | ▼ |
| Yumruk  | Z | YUM |
| Tekme   | X | TEK |
| Blok    | C | BLK |
| Çömelik blok | ▼ + C | ▼ + BLK |
| Fırlatma | Z + X birlikte | YUM + TEK birlikte |
| Skil    | V | SKİL |

- Karakter seçiminden sonra zorluk seçilir (KOLAY/NORMAL/ZOR); tercih hatırlanır.
- Yumruk/tekmeye art arda basınca vuruş zinciri (kombo) çıkar.
- Vuruşların yüksekliği vardır: ayakta blok ÜST+ORTA'yı keser ama ALÇAK yer;
  çömelmek ÜST vuruşları ıskalatır; çömelik blok ALÇAK'ı keser ama ORTA yer.
- Süpürme gibi hamleler yere yıkar; yerdeki rakip en fazla 1 vuruş yer ve
  kalkarken kısa süre dokunulmazdır.
- Fırlatma (yakın mesafede YUM+TEK, iki tuşa 80ms içinde basmak yeterli):
  blok İŞLEMEZ — blok yapan rakibe cevaptır. Fırlatılan taraf ilk anda
  kendi YUM+TEK'ine basarsa fırlatmayı kırar. Her karakterin fırlatması farklı.
- Counter hit: rakip saldırı animasyonundayken vurursan ×1.3 hasar + "KARŞI!"
  (bazı hamleler counter'da daha ağır tepki verir, örn. Beton'un Kancası çökertir).
- ▼ + Yumruk: rakibi havaya fırlatan launcher; havada juggle yapılabilir.
- Rakibin canı bitince "BİTİR ONU!" yazısında SKİL'e basarsan fatality izlersin.

## Ses

Tüm sesler Web Audio API ile kodun içinde üretilir (harici ses dosyası yok):
vuruşlar ağırlığa göre pes/tiz, savurma "whoosh", blok "tink", launcher'da
yükselen ton, K.O. patlaması, fatality'de bas drop + kalp atışı.

- Sağ üstteki 🔊 düğmesiyle sesi aç/kapa (tercih hatırlanır).
- Mobil tarayıcıların autoplay engeli yüzünden ses, ekrana ilk dokunuşta /
  ilk tuş basımında başlar.

## Dosya yapısı

```
index.html          iskelet: tuval + kontrol butonları
css/style.css       tüm görsel stiller
js/main.js          oyun döngüsü + sahne yönetimi (game nesnesi)
js/input.js         klavye + dokunmatik + tam ekran düğmesi
js/fighter.js       Fighter sınıfı: fizik, vuruş zincirleri, skiller, AI
js/characters.js    karakter verileri (statlar, hamleler, yüzler)
js/poses.js         animasyon pozları (iskelet açıları)
js/render.js        tuval kurulumu + çöp adam/kafa/el/arka plan çizimi
js/effects.js       parçacıklar, patlamalar, hayaletler, mürekkep modu
js/audio.js         prosedürel ses sistemi (Web Audio API)
js/fatality.js      fatality sahneleri
js/ui.js            HUD + seçim/VS/sonuç ekranları
js/utils.js         ortak matematik yardımcıları (clamp/lerp/rnd)
```
