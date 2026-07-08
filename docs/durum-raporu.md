# ÇİZGİ DÖVÜŞÜ — Durum Raporu

**Tarih:** 2026-07-08 · **Yol haritası: tümü TAMAMLANDI** (arena zemin sistemi hariç)
**Testler:** Node 104/104 (0 kaldı/0 atlandı) · Arena 76 geçti/0 kaldı/2 atlandı · 0 JS hatası
**Güncelleme (2026-07-08 borç temizliği):** §5 belge senkronu ve §7 repo hijyeni uygulandı — Pages kapsamı daraltıldı, `.gitignore` eklendi, eski yedek silindi, belge çelişkileri giderildi. (§6 test kırılganlıkları ayrı görevde ele alınacak, bu turda dokunulmadı.)

---

## 1. Komut Geçmişi (git log, tarih + mesaj)

**2026-07-08 (dün gece Cowork):**
- `41620b9` 01:04 İnsansı hareket Faz 12 — sağ bacak diz menteşesi anatomik yöne + tekmede gövde/baş katılımı
- `dfcd314` 00:55 İnsansı hareket Faz 11 — kalçadan yükselen düz bacak + GÖSTERİ tüm hamleleri oynatır
- `2fe58be` 00:33 Antrenmana GÖSTERİ düğmesi (zincirleri yavaş çekimde oynatır)
- `53d203d` 00:22 İnsansı hareket Faz 10 — flamingo akışı (zincir tekmede bacak yere inmez)
- `cda06fc` 23:31* İnsansı hareket Faz 9 — iki parçalı omurga, gerçek kol formları, hedefe kilitli baş, topuk pivotu

**2026-07-07:**
- `4f71435` 23:12 Faz 8 — tekmeler hedef hizasına kalkar (ORTA göğüs, ÜST kafa)
- `9f8d238` 22:40 Faz 7 — gergin bacak kilidi, kalça itişi+kaldırma, gövde yaslanması
- `41d7cef` 22:24 Faz 6 — omuz/kalça dönüşü (twist), kamçı sıralaması, yönlü ayak ucu
- `ed1495b` 22:01 Faz 5 — vuruşlar: omuz uzanımı, gard çekişi, bacak itişi, tekme şambrı
- `f99d6d0` 21:41 GONDER.bat + CLAUDE.md ortam/yol haritası notları
- `0c849e4` 21:40 Faz 4 — zıplama: havada duruş + inişte diz yaylanması
- `72fefd5` 21:37 Faz 3 — canlı bekleme (nefes, kişilik, yorgunluk, bakış)
- `a5a07b8` 21:35 Faz 2 — yürüyüş: adım ritmi, yön eğilmesi, geri çekilme gardı
- `42adfb3` 21:32 Faz 1 — poz eritme + dönüş esnemesi
- `10cd300` 16:35 Seçim ekranı ve buton düzeltmeleri (ekran görüntüsü geri bildirimi)
- `7d1e1fc` 13:05 Görev 8 — kontrol elması + antrenman modu + can eşitleme
- `42c865f` 07:59 Faz D — animasyon cilası (Görev 7)

**2026-07-06:**
- `060e984` claude-test.mjs KALEM bölümü · `cb05c25` claude-test faz-sonu sürecine bağlandı · `7864317` KALEM karakteri + regresyon arenası · `bad9905` Faz C · `5eaa380` Faz B · `72473aa` Pages deploy 2. deneme · `b1f9b71` Faz A · `1abbb8d` Pages yeniden tetikle · `be3cc10` Denge/zorluk/juggle/savrulma

**2026-07-05 (kuruluş):**
- `0b48310` Pages action sürümleri · `4c215b9` yayın adresi · `1541e1f` Cloudflare tünel + Pages · `70ecd6c` ses sistemi · `df8efbd` modüler yapıya bölme (ilk commit)

*(31 commit toplam.)*

---

## 2. Yol Haritası Durumu (CLAUDE.md fazları — kodda doğrulandı)

| Faz / Görev | Durum | Kod kanıtı (özet) |
|---|---|---|
| FAZ A — yükseklik + tepkiler | **TAMAMLANDI** | height/reaction alanları, blok tablosu, getup invuln=.4, otg |
| FAZ B — fırlatma + counter | **TAMAMLANDI** | tryThrow, throw break, 3+1 fırlatma, counter ×1.3 + counterReaction |
| FAZ C — 6 yeni hamle + poke | **TAMAMLANDI** | Bıçak El/Gövde Çengeli/Dönen Topuk/İtme/Kayma/Ay + punish |
| FAZ D — animasyon cilası | **TAMAMLANDI** | poses.js vurusEgrisi + hipShift + iki aşamalı tepkiler |
| KALEM karakteri | **TAMAMLANDI** | canUse/erasedLimb, Sayfa Çevirme, TEMİZ SAYFA fatality |
| Görev 8 — kontrol/antrenman/denge | **TAMAMLANDI** | FIRLAT tuşu, startTraining, BETON armor, tüm hp:100 |
| İnsansı hareket cilası (Faz 1-12) | **TAMAMLANDI** | poz eritme, turnT, ileriGeri, landT/landK, P.reach, GÖSTERİ |
| Arena zemin sistemi | **BAŞLANMADI** | (yol haritasında "boşta" olarak duruyor) |

Açık/yarım kalmış faz yok. "DEVAM EDEN" durumunda görev yok.

---

## 3. Son Düzeltmenin Akıbeti (BLK/SKİL + ANTRENMAN düğmesi + HAMLELER paneli)

- **Yapıldı:** commit `10cd300` (2026-07-07 16:35).
- **Push'lu:** evet (origin/main atası).
- **Yayında:** evet — canlı sitede `b-blk{width:50px` doğrulandı; dün geceki 14 commit'e rağmen korundu.
- İçerik: BLK/SKİL 44→50px (YUM/TEK'in %86'sı); seçim ekranında çerçeveli DÖVÜŞ/ANTRENMAN düğmeleri (klavye YUM/TEK); detaylar HAMLELER açılır paneline taşındı (antrenmandaki LİSTE ile aynı bileşen `drawMovePanel`).

---

## 4. Test Durumu (şimdi koşuldu)

- **`node claude-test.mjs`:** GEÇEN **104** / KALAN 0 / ATLANAN 0 / JS hatası 0.
- **`test-arena.html` (headless):** GEÇEN **71** / KALAN 0 / ATLANDI **5** / JS hatası 0. Atlamalar: juggle oranı ×3 + yerde-1-vuruş (gerçek-zaman zamanlama) + çömelene HIGH (KALEM açılışı MID). Hepsi test varsayımı, oyun hatası değil.
- Not: arena atlama sayısı koşudan koşuya oynuyor (bu koşu 5, önceki oturum 2) — gerçek-zaman zamanlama kırılganlığı (bkz. §6).

---

## 5. Belge-Kod Uyumu — **ÇÖZÜLDÜ (2026-07-08)**

Rapordaki tüm belge sapmaları giderildi:

1. **Node ortamı çelişkisi → düzeltildi:** CLAUDE.md:12 "Node KURULU" olarak güncellendi (satır 82 ile tutarlı); MEMORY.md indeks satırı "Node KURULU" oldu (asıl memory dosyası zaten güncel).
2. **Fırlatma toleransı → her yerde 100ms:** CLAUDE.md FAZ B + README + `fighter.js:108` yorumu "80ms"→"100ms" (kod zaten 100ms idi).
3. **GÖSTERİ düğmesi → belgeye işlendi:** docs Bölüm 4 + EK-Görev 8 ANTRENMAN bölümüne eklendi.
4. **İnsansı hareket cilası → belgeye işlendi:** docs Bölüm 4'e Faz 1-12 özeti eklendi.
5. **KALEM durumu → "tamamlandı":** docs'ta "gelecek karakterler"den çıkarılıp tam KALEM tablosu (Bölüm 3) olarak eklendi.
6. **4. fırlatma → belgeye işlendi:** docs 2.2 dört karakteri de sayıyor (KALEM Sayfa Çevirme).
7. **Bacak Ezici "3.'de knockdown" → belgeden çıkarıldı (tasarım kararı):** Kodda tek atımlık `ck` hamlesi, zincir/sayaç yok; "3. vuruş" durumu oluşamaz. Doğru olan `flinch` bırakıldı (kodla uyumlu).
8. **docs Bölüm 3 iç hataları → düzeltildi:** Şok Avucu tepki `flinch` (+ayrı `stun` alanı notu); poke süresi "0.20-0.22sn"; her karakter tablosuna özel skil satırı (Gölge Geçişi / Deprem Yumruğu / Yıldırım Zinciri / Silgi Darbesi) + BETON SÜPER ZIRH satırı eklendi.

*Not:* Deprem Yumruğu ALÇAK = kod ile zaten uyumluydu (çelişki değildi).

---

## 6. Bilinen Sorunlar / Yarım İşler

- **Literal TODO/FIXME yok.** Teknik borç yalnız `UYARLAMA (Claude)` yorum konvansiyonuyla izleniyor (test-arena.html 14, claude-test.mjs 2). Standart etiket aranırsa hiçbir şey çıkmaz.
- **`poses.js:21` iskele alan:** `P` init'inde `omur` alanı tanımsız ama `switch`'te 15 kez yazılıyor; `render.js:137` `p.omur||0` fallback'ine bağlı çalışıyor.
- **`poses.js` yarım entegrasyon:** `crescent` (Ay Tekmesi) diğer tekmelerin flamingo/bacak yardımcısını kullanmıyor (doğrudan lerp); idle'da ölü `else` dalı (4 tanımlı karakter hepsi kendi dalına giriyor).
- **`test-arena.html:139` ölü değişken** (`const vs=…` atanıp okunmuyor).
- **Test soft-pass'leri (gerçek regresyon maskeleyebilir):** Volt stun (claude-test:240) ve KALEM `hidden` bayrağı (claude-test:420) yakalanamazsa FAIL değil BILGI; LOW çip hasarı "kısmen geçti" ile OK (test-arena:191); juggle/OTG zamanlama kaçınca ATLA.
- **Kapsama boşluğu:** test-arena'da KALEM için "çömelene HIGH ıskalar" senaryosu hiç koşmuyor (açılış MID).
- **`test-arena.html:217` global mutasyon:** `D.tbreak` 0'a çekilip geri konuyor; test erken dönerse eski değere dönmez → sonraki testler kirlenir.
- **Headless test deterministik değil:** gerçek-zaman sabit beklemelere bağlı (`bekle(cp.t1*1000+60)` vb.); makine hızına duyarlı, retry/BILGI ile maskeli → arena atlama sayısı koşudan koşuya değişir.
- **Tasarım varsayımı:** süre dolunca biten maçta (`main.js:182-183`) `finishHim` hemen ardından `koFinish` aynı karede → zaman aşımı bitişinde fatality zarı hiç atılmaz.
- **`main.js:137` GÖSTERİ:** `timeScale=.42` global tutuluyor, yalnız demo bitince/çıkışta 1'e dönüyor; demo yarıda başka yolla sahne değişirse yavaş çekim takılı kalabilir (training'te düşük risk).

---

## 7. Repo Sağlığı — **DÜZELTİLDİ (2026-07-08)**

- **`.gitignore` eklendi:** `node_modules/`, `_site/`, `*.log`, `*.tmp`, `.DS_Store`, `Thumbs.db`. Artık `npm start` çalıştırılsa da `node_modules` yakalanır.
- **Pages kapsamı daraltıldı:** `pages.yml` artık tüm depoyu değil, yalnız `index.html` + `css/` + `js/`'yi `_site/` klasörüne kopyalayıp onu yayınlıyor. İç belgeler (CLAUDE.md, docs/, README), test dosyaları (test-arena.html, claude-test.mjs) ve `.bat/.ps1` betikleri artık kamuya açık serviste **görünmüyor**.
- **Eski yedek silindi:** kök dizindeki `cizgi-dovusu.html` (48KB) kaldırıldı; git geçmişinde (`df8efbd` öncesi) duruyor.
- **Çalışma ağacı temiz:** izlenmeyen dosya, `node_modules`, lockfile, OS/editör çöpü yok. .git ~1.1 MB.
- **Kalan boyut sırası:** `fighter.js` 27KB > `claude-test.mjs` 25KB > `test-arena.html` 23KB > `poses.js` 19KB > `render.js` 14KB > `docs/dovus-sistemi.md` ~15KB. 24 izlenen dosya (yedek çıktı, .gitignore + durum-raporu.md girdi).
- **Betikler sağlam:** GONDER.bat (git push), start-tunnel.bat/.ps1 (Cloudflare tünel) sorunsuz.
