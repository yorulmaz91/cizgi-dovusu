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
- Cowork sanal ortamı GitHub'a ERİŞEMEZ: Claude commit'leri yerelde hazırlar,
  kullanıcı repo kökündeki `GONDER.bat`'a çift tıklayarak yayınlar (git push).
- Cowork'te depo dosyaları sanal ortamda bash ile yazılır/doğrulanır
  (dosya araçlarının eşitlemesinde gecikme görüldü; bash → Windows anlıktır).

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
- **FAZ C (Görev 6) — TAMAMLANDI:** 6 yeni hamle eklendi ve zincirler yeniden
  dizildi — Gölge YUM: Jab→Kroşe→Bıçak El(counter'da çökertir)→Ters Yumruk,
  ▼+TEK Kayma Tekmesi (Alçak Tekme'nin yerine); Beton YUM: Dürtme(poke)→Kanca→
  Gövde Çengeli(çökertir)→Balyoz; Volt YUM: Jab→Şok Avucu→Dönen Topuk(vitrin,
  çökertir), TEK: İtme Tekmesi(iten poke)→Yan→Dönen Tekme→Balta, havada YUM
  Ay Tekmesi (Şimşek Yumruk'un yerine). Poke'lar hızlı/güvenli; ZOR AI
  bloklanan ağır hamleyi cezalandırır (punish).
- **FAZ D (Görev 7) — TAMAMLANDI:** animasyon cilası — vuruşlara hamlenin
  gerçek t0/t1 pencerelerinden türeyen kurulum→patlama→"tık" kilidi→geri
  çekme eğrisi (poses.js vurusEgrisi; özel eğrili hamleler hariç k-tabanlı
  tüm pozlara uygulanır), hasara ölçekli ağırlık aktarımı (P.hipShift),
  tepki inceltmeleri (sarsıntılı flinch, iki aşamalı crumple, inişte sekme,
  yumuşak kalkış). Hamle süreleri (dur/t0/t1) DEĞİŞMEDİ — salt görsel.
- **KALEM karakteri — TAMAMLANDI:** stil dışı meta-karakter (bere + dev kalem);
  skili Silgi Darbesi rakibin rastgele bir uzvunu 2 sn siler (uzuv çizilmez,
  o uzuvla saldırı/fırlatma kilitli — canUse()); fatality TEMİZ SAYFA rakibi
  tepeden aşağı siler (clip ile çizim + hidden bayrağı). Yükseklik/tepki/
  fırlatma sistemlerine tam uyumlu.
- **Görev 8 — TAMAMLANDI:** kontrol elması (YUM/TEK büyük altta, BLK/SKİL
  küçük üstte, solda FIRLAT tuşu: tek dokunuş fırlatma + fırlatılırken kırma;
  klavyede Z+X toleransı aynen), ANTRENMAN modu (seçim ekranında TEK ile;
  kukla AI'sız, duruş düğmesi SERBEST/AYAKTA BLOK/ÇÖMELİK BLOK/ÇÖMELME,
  canlar ~1 sn'de tazelenir, K.O./fatality yok, hamle listesi paneli, ÇIKIŞ),
  denge: tüm canlar 100 + BETON süper zırhı.
- **İnsansı hareket cilası — TAMAMLANDI:** poz eritme katmanı (fighter.js
  pose(): çizilen poz hedefe üstel hızla erir, vuruş anları keskin kalır),
  dönüş esnemesi (turnT), hıza bağlı adım ritmi + yön eğilmesi + geri çekilme
  gardı (ileriGeri), karaktere özel canlı idle (nefes/kişilik/yorgunluk/bakis),
  hıza bağlı havada duruş + inişte diz yaylanması (landT/landK), vuruş
  insanlaştırma (omuz uzanımı P.reach + render.js desteği, gard çekişi,
  arka bacak itişi, tekmelerde diz şambrı → patlama → toplanma). Salt görsel;
  hamle süreleri/hasarlar değişmedi.
- Araya serpiştirilebilir: arena sistemi (farklı zeminler) hâlâ boşta.

## Karakter tablosu (hepsi 100 can)

| Karakter | Stil | Öne çıkan | Özel |
|---|---|---|---|
| GÖLGE | JKD/Ninjutsu | HIZ ★★★, 4'lü yumruk zinciri, yön değiştiren fırlatma | Gölge Geçişi |
| BETON | Boks+Judo | GÜÇ ★★★, **SÜPER ZIRH**: Balyoz/Omuz Şarjı hazırlık+aktifte flinch/stagger yemez (launch/knockdown/crumple DELER) | Deprem Yumruğu (ALÇAK) |
| VOLT | Taekwondo | MENZİL ★★★, 4'lü tekme zinciri, Dönen Topuk (vitrin) | Yıldırım Zinciri |
| KALEM | Stil dışı | MENZİL ★★★, kural dışı zincir açılışları (ORTA yumruk / ALÇAK tekme) | Silgi Darbesi (uzuv siler) |

## Kalıcı regresyon testleri — HER FAZIN SONUNDA İKİSİ DE KOŞULUR

**1. `claude-test.mjs` (Node, hızlı):** `node claude-test.mjs` — tarayıcıyı
Node içinde taklit eder (sanal saat + DOM/WebAudio iskeleti), deterministik
ölçümlü rapor basar. Node LTS bu makinede winget ile kuruludur.

**2. `test-arena.html` (gerçek tarayıcı):** http://localhost:8000/test-arena.html
açılır; rapor sağ panelde canlı akar, sol altta özet sayacı vardır. Headless
koşu için adrese `?log=1` eklenir: her rapor satırı yerel sunucuya
`GET /arena?m=...` olarak düşer ve sunucu günlüğünden okunur.

Her iki pakette de kuklalama "boş girdili AI" ile yapılır (dondur/pasifYap);
stun ile dondurma KULLANILMAZ (tepki sistemi stun'ı ezer). Raporlar kullanıcıya
özetlenir; kırmızılar önce "oyun hatası mı, test varsayımı mı" diye ayrıştırılır.

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
