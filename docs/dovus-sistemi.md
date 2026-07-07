

## BÖLÜM 1 — MK ve Tekken'i "gerçek" hissettiren nedir?

Önce dürüst bir tespit: iki oyunda da dövüşü gerçekçi kılan şey hamle sayısı
değil, **her hamlenin bir sorunun cevabı olması**. Sistemleri ayrıştıralım:

### Tekken'in temeli: gerçek dövüş sanatları + yükseklik katmanları
- Her karakter **gerçek bir dövüş stilinin** karikatürüdür: Mishima'lar karate,
  Hwoarang/Baek taekwondo, Law Jeet Kune Do (Bruce Lee), King lucha libre
  (Meksika güreşi), Eddy capoeira, Paul judo temelli sokak dövüşü, Steve boks
  (hiç tekmesi yoktur!). Stil = kimlik.
- **Yükseklik sistemi (high/mid/low):** her vuruş üst/orta/alt seviyeden gelir.
  Ayakta blok üstü ve ortayı keser ama alçağı yer; çömelme alçağı keser ama
  ortaya karşı savunmasızdır. Bu üçlü, dövüşü taş-kağıt-makas'a çevirir —
  gerçekçiliğin asıl kaynağı budur, animasyon değil.
- **String'ler + delay:** zincirler var ama iyi oyuncu zinciri yarıda kesip
  şaşırtır. Zincirin her basışı garantili değildir.
- **Launcher → juggle → yerde bitirme (okizeme):** dövüşün ritmi budur.
- **Counter hit:** rakip saldırırken vurursan ekstra ödül (daha çok hasar,
  özel sersemleme). Saldırganlığın riski/ödülü.
- **Poke'lar:** hızlı, az hasarlı, güvenli dürtmeler (Tekken'in meşhur d/f+1'i).
  Dövüşün %60'ı bu küçük dürtme savaşıdır.

### Mortal Kombat'ın temeli: okunabilirlik + sinema
- Vuruş çeşitleri nettir ve okunur: herkes uppercut'ı, sweep'i, roundhouse'u
  tanır. MK1-MK3 döneminin evrensel hamleleri: **uppercut (çömelik yumruk),
  sweep (çömelik geri tekme), roundhouse, leg sweep, jump kick, ducking punch**.
- **Fırlatma (throw):** yakın mesafede blok işlemez; blok kaplumbağalarına
  cevaptır. Gerçek dövüşteki clinch/güreş anını temsil eder.
- **Special'lar hikâye anlatır:** Scorpion'ın zıpkını "gel buraya", Sub-Zero'nun
  buzu "dur orada" der. Her special bir cümledir.
- **Vuruş tepkileri çeşitlidir:** normal sarsılma, sersemleme (stagger),
  havaya fırlama, yere yıkılma (knockdown), duvara çarpma. Aynı "hit"
  animasyonunu her vuruşta görmek yapaylığın bir numaralı sebebidir.

### Bizim oyunda eksik olan katmanlar (öncelik sırasıyla)
1. **Yükseklik sistemi yok** → blok her şeyi kesiyor, çömelmenin savunma anlamı yok
2. **Fırlatma yok** → blok yapan rakibe cevap yok
3. **Vuruş tepkisi tek tip** → her vuruşta aynı "hit" pozu
4. **Counter hit yok** → saldırı zamanlamasının ödülü yok
5. **Poke/ağır ayrımı zayıf** → her hamle benzer riskte
6. Teknik çeşitliliği ve animasyon kalitesi (bunlar 1-5'in ÜZERİNE gelir)

---

## BÖLÜM 2 — Benimseyeceğimiz çekirdek mekanikler

### 2.1 Yükseklik sistemi (EN ÖNEMLİ ADIM)
Her hamleye `height: 'high' | 'mid' | 'low'` alanı eklenir.

| Savunma durumu | HIGH vuruş | MID vuruş | LOW vuruş |
|---|---|---|---|
| Ayakta blok | BLOKLANIR | BLOKLANIR | **YER** |
| Çömelme (bloksuz) | **ISKALAR** (üstünden geçer) | YER | YER |
| Çömelik blok | ISKALAR | **YER** | BLOKLANIR |

Kurallar basit ama sonuçları derin: alçak tekme spam'ine karşı çömelik blok,
çömelik bloğa karşı orta seviye diz/uppercut, kaplumbağaya karşı fırlatma.
Taş-kağıt-makas tamamlandı.

Görsel dil: LOW hamleler zeminde küçük bir çizgi izi bırakır, HIGH iskalar
çömelmiş rakibin kafasının üstünden whoosh yayıyla geçer — oyuncu sistemi
gözle öğrenir.

### 2.2 Fırlatma (throw)
- Yakın mesafede (≤48px) YUM+TEK aynı anda = fırlatma.
- Blok İŞLEMEZ; kaçış: rakip ilk 10 karede kendi YUM+TEK'ine basarsa
  fırlatma kırılır (throw break), iki karakter itişip ayrılır.
- Karaktere özel: GÖLGE ensesinden kavrayıp arkasına savurur (yön değişir!),
  BETON belden kapıp yere çakar (büyük hasar + yerde bırakır),
  VOLT tutarken elektrik verir (hasar + kısa stun).

### 2.3 Vuruş tepkisi çeşitliliği
Hamleye `reaction` alanı: 
- `flinch` (hafif sarsılma — mevcut hit)
- `stagger` (geriye sendeleme, 2-3 adım — ağır yumruklar)
- `crumple` (dizleri çözülüp çöker — counter hit uppercut, güçlü orta)
- `knockdown` (sırtüstü yere — sweep, ağır tekmeler; yerden kalkma animasyonu)
- `launch` (havaya — mevcut launcher)
Sweep artık cidden yere düşürür; Balyoz sendeletir; her vuruş farklı hikâye
anlatır. Yerdeki rakibe tek "yerde vuruş" hakkı (okizeme'nin basit hali),
sonra kalkarken kısa dokunulmazlık.

### 2.4 Counter hit
Rakip saldırı animasyonundayken (startup/aktif karelerinde) vurursan:
- Hasar ×1.3, ekranda "KARŞI!" yazısı, vuruş sesi daha tok
- Bazı hamleler counter hit'te tepki yükseltir (örn. Kanca normalde flinch,
  counter'da crumple) → Tekken'in derinlik hilesi aynen bizde.

### 2.5 Poke / ağır hamle ayrımı
Her karaktere 1-2 "poke" tanımlanır: çok hızlı (0.15-0.18sn), az hasarlı,
bloklanınca bile güvenli. Ağır hamleler ise bloklanınca cezalandırılabilir
(recovery uzun). AI zorluğu da buna bağlanır: ZOR AI bloklanan ağır hamleni
cezalandırır.

---

## BÖLÜM 3 — Karakterlere gerçek dövüş stilleri

Her karaktere GERÇEK bir stil atıyoruz; yeni teknikler o stilden geliyor.
(Mevcut hamleler korunur, yeniden adlandırılıp stile oturtulur.)

### GÖLGE — Jeet Kune Do / Ninjutsu karışımı (hız ve aldatma)
Felsefe: en kısa yol, minimum hareket, vur-kaç.
| Teknik | Gerçek karşılığı | Yükseklik | Tepki | Not |
|---|---|---|---|---|
| Jab | JKD straight lead | HIGH | flinch | Poke, çok güvenli |
| Kroşe | cross | HIGH | flinch | |
| Ters Yumruk | spinning backfist | HIGH | stagger | Zincir bitirici |
| Bıçak El | knife-hand (shuto) boyuna | MID | counter'da crumple | YENİ |
| Ön Tekme | snap kick | MID | flinch | |
| Topuk Kesme | leg sweep | **LOW** | **knockdown** | Artık cidden düşürür |
| Kayma Tekmesi | slide kick (zeminde kayarak) | LOW | knockdown | YENİ — çömelikten ileri |
| Yükselen Gölge | rising uppercut | MID | launch | |
| Fırlatma: Gölge Savurması | ense kavrama + arkaya atış | — | knockdown | Yön değiştirir |

### BETON — Boks + Judo (ağırlık ve kavrama)
Felsefe: yaklaş, ez, yere göm. Steve Fox + Paul Phoenix ruhu.
| Teknik | Gerçek karşılığı | Yükseklik | Tepki | Not |
|---|---|---|---|---|
| Dürtme | boxing jab | HIGH | flinch | YENİ poke (Beton'un tek hızlısı) |
| Kanca | hook | HIGH | counter'da crumple | |
| Balyoz | overhand/haymaker | **MID** | **stagger** | Çömelik bloğu kırar! |
| Gövde Çengeli | body hook (karaciğer!) | MID | crumple | YENİ — boksun en acı vuruşu |
| Diz | muay thai knee | MID | flinch | |
| Omuz Şarjı | shoulder tackle | MID | knockdown | |
| Bacak Ezici | low kick (calf kick) | LOW | flinch, 3.'de knockdown | |
| Yer Kancası | rising uppercut | MID | launch | |
| Fırlatma: Beton Çakması | judo harai goshi (kalça atışı) | — | knockdown | En yüksek fırlatma hasarı |

### VOLT — Taekwondo (bacak sanatı)
Felsefe: mesafe kontrolü, gösterişli döner tekmeler. Hwoarang/Baek ruhu.
Volt'un yumrukları zayıf kalır (stil gereği!), tekme ağacı zenginleşir:
| Teknik | Gerçek karşılığı | Yükseklik | Tepki | Not |
|---|---|---|---|---|
| Jab | — | HIGH | flinch | |
| Şok Avucu | palm strike | MID | stun | |
| İtme Tekmesi | push kick (teep) | MID | stagger (uzağa iter) | YENİ — mesafe açıcı poke |
| Yan Tekme | side kick | MID | stagger | Mevcut, tepkisi güçlendi |
| Dönen Tekme | roundhouse | HIGH | flinch | |
| Dönen Topuk | spinning hook kick | **HIGH** | **crumple** | YENİ — TKD'nin yıldızı |
| Balta | axe kick | MID | knockdown | Çömelik bloğu kırar |
| Süpürme | sweep | LOW | knockdown | |
| Ay Tekmesi | crescent kick (havada) | HIGH | flinch | YENİ — hava hamlesi çeşidi |
| Volt Yükselişi | rising kick | MID | launch+stun | |
| Fırlatma: Şok Kavraması | yaka tutma + elektrik | — | stun+itme | En az hasarlı ama stun verir |

### Gelecek karakterler için stil bankası (not olarak dursun)
- **KALEM** → "stil dışı" meta-karakter (planlandığı gibi)
- Capoeira karakteri → sürekli hareket, ters dönüşlü tekmeler (Eddy ruhu)
- Lucha libre güreşçisi → fırlatma ustası, komutlu kapışlar (King ruhu)
- Muay Thai → dirsek+diz, clinch (yeni mekanik fırsatı)
- Aikido/savunma karakteri → az saldırı, güçlü counter'lar (yeni arketip)

---

## BÖLÜM 4 — Uygulama fazları (her faz = bir Claude Code görevi)

Sıra önemli: sistem önce, içerik sonra. Animasyon cilası en sona.

**FAZ A (Görev 4): Yükseklik sistemi + vuruş tepkileri**
Hamlelere height/reaction alanları, blok tablosu, çömelik blok, knockdown +
yerden kalkma, stagger/crumple animasyon pozları, LOW/HIGH görsel dili.
AI'ın çömelik blok ve alçak tekme kullanmayı öğrenmesi.

**FAZ B (Görev 5): Fırlatma + counter hit**
YUM+TEK fırlatma, throw break penceresi, 3 karaktere özel fırlatma animasyonu,
counter hit tespiti + "KARŞI!" + ödül tablosu.

**FAZ C (Görev 6): Teknik genişletme**
Bölüm 3 tablolarındaki YENİ hamleler (Bıçak El, Gövde Çengeli, Dönen Topuk,
İtme Tekmesi, Kayma Tekmesi, Ay Tekmesi) + poke ayarları + zincirlerin
yeniden düzenlenmesi.

**FAZ D (Görev 7): Animasyon cilası**
İki aşamalı hamle animasyonları (hazırlık→vuruş→geri çekme belirgin),
ağırlık aktarımı (kalça dönüşü), vuruş anında uzuv "tık" duruşu,
tepki animasyonlarının inceltilmesi.

> Arena sistemi ve KALEM, Faz B ile C arasına da alınabilir — moral için
> araya "eğlenceli" görev serpiştirmek iyidir.

---

## BÖLÜM 5 — Görev 4 için hazır prompt (Görev 3 onaylandıktan sonra gönder)

```
GÖREV 4 — Yükseklik sistemi ve vuruş tepkileri
(docs/dovus-sistemi.md Bölüm 2.1 ve 2.3'ü referans al)

1. Her hamleye height ('high'|'mid'|'low') ve reaction
   ('flinch'|'stagger'|'crumple'|'knockdown'|'launch') alanı ekle.
   Mevcut hamlelere belgedeki Bölüm 3 tablolarına göre değer ata.
2. Blok tablosunu uygula: ayakta blok high+mid keser, low yer;
   çömelme high'ı ıskalatır; çömelik blok (▼+C veya çömelirken C)
   low keser ama mid yer.
3. Tepki animasyonları: stagger (2-3 adım geri sendeleme),
   crumple (dizler çözülüp çökme), knockdown (sırtüstü düşme +
   yerden kalkma animasyonu + kalkarken 0.4sn dokunulmazlık).
   Yerdeki rakibe en fazla 1 vuruş geçsin.
4. Görsel dil: low hamleler zeminde iz çizgisi bıraksın; high hamle
   çömelmiş rakibi ıskalayınca kafasının üstünden whoosh geçsin.
5. AI güncellemesi: zorluğa göre çömelik blok kullansın ve alçak
   tekme atsın (KOLAY nadiren, ZOR akıllıca).
6. Seçim ekranındaki hamle listelerine yükseklik etiketi ekle
   (örn. "Topuk Kesme [ALÇAK]").
Bitince commit+push, test senaryolarını yaz: özellikle
"ayakta bloklayan rakibe süpürme → düşmeli" ve "çömelen rakibe
jab → ıskalamalı" durumlarını nasıl test edeceğimi göster.
```

---

## EK — Görev 8: denge ve kontrol güncellemesi (uygulandı)

- **Can eşitleme:** dört karakterin canı da 100. Kimlik artık statlarla
  (güç/hız/menzil) ve mekaniklerle taşınıyor, can farkıyla değil.
- **BETON süper zırhı:** Balyoz ve Omuz Şarjı'nın hazırlık+aktif karelerinde
  BETON hasar yer ama flinch/stagger olmaz, hamleyi tamamlar; launch,
  knockdown ve crumple zırhı DELER. Görsel: gövde çizgisi kalınlaşır +
  "ZIRH!" yazısı; itilme de çok azalır. Toparlanma kareleri zırhsızdır —
  2.5'teki "bloklanan ağır hamle cezalandırılır" dengesi korunur.
- **Dokunmatik kontrol (Tasarım A):** sağda başparmak yayına oturan elmas —
  YUM/TEK büyük altta, BLK/SKİL küçük üstte; elmasın solunda orta boy
  FIRLAT tuşu (tek dokunuş fırlatma; fırlatılırken basılırsa throw break).
  Klavyede YUM+TEK (~100ms tolerans) aynen geçerli.
- **ANTRENMAN modu:** karakter seçiminde TEK ile girilir. Kukla AI'sızdır;
  düğmeyle SERBEST → AYAKTA BLOK → ÇÖMELİK BLOK → ÇÖMELME duruşlarına
  sokulur (yükseklik sistemini öğrenme aracı). Canlar boşalınca ~1 sn sonra
  tazelenir, K.O./fatality tetiklenmez; seçili karakterin tam hamle listesi
  paneli açılıp kapanabilir.

## Kapanış notu
"Gerçekçilik" hedefinde çıta şu: bir taekwondocu Volt'u izlediğinde
"bu dönen topuk tekmesi, ağırlık aktarımı bile doğru" demeli; bir boksör
Beton'un gövde çengelini tanımalı. Çizgi karakter + doğru dövüş = bu oyunun
imzası olacak kontrast zaten bu.