# ÇİZGİ DÖVÜŞÜ

Siyah-beyaz karikatür stilinde, canvas tabanlı çöp adam dövüş oyunu (Türkçe arayüz).
Saf HTML/CSS/JS + ES modülleri; derleme adımı yok. Giriş noktası `index.html`,
kod `js/` altında modüllere bölünmüş (yapı listesi README.md'de). Sesler
`js/audio.js` içinde Web Audio API ile prosedürel üretilir; AudioContext mobil
autoplay engeli nedeniyle ilk kullanıcı dokunuşunda başlatılır.
`cizgi-dovusu.html` eski tek dosyalık sürümdür, yedek olarak durur — düzenleme oraya değil modüllere yapılır.

## Ortam notları

- Bu makinede Node.js YOK; yerel sunucu için Python kullanılır:
  `python -m http.server 8000` → http://localhost:8000
- ES modülleri yüzünden `index.html` çift tıklayarak açılmaz, sunucu şart.
- Kullanıcı programcı değildir: her adım Türkçe ve tek cümleyle açıklanır.

## Yol haritası — dövüş sistemi (detaylar: docs/dovus-sistemi.md)

Sıra önemli: sistem önce, içerik sonra, animasyon cilası en sona.

- **FAZ A (Görev 4) — TAMAMLANDI:** yükseklik sistemi (high/mid/low + blok
  tablosu + çömelik blok), vuruş tepkileri (flinch/stagger/crumple/knockdown/
  launch), yerden kalkma + 0.4sn dokunulmazlık, yerdeki rakibe en fazla 1 vuruş,
  LOW iz çizgisi / HIGH ıskalama görsel dili, AI'ın çömelik blok + alçak tekme
  öğrenmesi, seçim ekranında yükseklik etiketleri.
- **FAZ B (Görev 5) — TAMAMLANDI:** fırlatma (yakında YUM+TEK, 80ms tuş
  toleransı, throw break penceresi ~0.2sn, karaktere özel 3 fırlatma:
  Gölge arkaya savurur/yön değişir, Beton yere çakar, Volt şoklar+iter) +
  counter hit (saldırı hazırlık/aktif karesinde vurulan rakibe ×1.3 hasar,
  "KARŞI!", counterReaction alanıyla tepki yükseltme — Kanca counter'da çökertir).
- **FAZ C (Görev 6):** teknik genişletme — Bölüm 3'teki YENİ hamleler (Bıçak El,
  Gövde Çengeli, Dönen Topuk, İtme Tekmesi, Kayma Tekmesi, Ay Tekmesi),
  poke/ağır ayrımı, zincirlerin yeniden düzenlenmesi.
- **FAZ D (Görev 7):** animasyon cilası — hazırlık→vuruş→geri çekme aşamaları,
  ağırlık aktarımı, vuruş anında "tık" duruşu, tepki animasyonu inceltme.
- Araya serpiştirilebilir: arena sistemi, KALEM karakteri (moral görevleri).

## Uzaktan test — hangi durumda hangi yöntem?

**1. Telefondan HEMEN denemek (kod bilgisayarda, henüz push'lanmadı):**
`start-tunnel.bat` dosyasına çift tıkla. Betik yerel sunucuyu + Cloudflare hızlı
tünelini başlatır ve `https://....trycloudflare.com` adresini gösterip panoya
kopyalar. Adres GEÇİCİDİR: her başlatmada değişir, pencere kapanınca ölür,
bilgisayar açık kalmalıdır. cloudflared gerekir
(`winget install --id Cloudflare.cloudflared`).

**2. Kalıcı link / başkalarıyla paylaşmak / bilgisayar kapalıyken oynamak:**
GitHub Pages. `git push` yeterli — `.github/workflows/pages.yml` her push'ta
oyunu otomatik yayınlar (1-2 dk sürer). Adres sabittir:
https://yorulmaz91.github.io/cizgi-dovusu/ (GitHub kullanıcısı: yorulmaz91).
Push'lanmamış değişiklikler burada GÖRÜNMEZ; anlık deneme için 1. yöntemi kullan.

**3. Sadece bu bilgisayarda test:** `python -m http.server 8000` →
http://localhost:8000 (telefon aynı Wi-Fi'deyse `http://<PC-IP>:8000` de olur,
ama güvenlik duvarı sorabilir; tünel yöntemi daha sorunsuzdur).
