# STIL.md — Sprite Stil Standardı (ölçülmüş)

Kaynak: `assets/sprites/k1` içindeki 17 onaylı kare (2026-07-28'de ölçüldü;
ölçüm/denetim aracı: `tools/denetci.mjs`). Tahmin yok — her sayının yanında
hangi kareden ölçüldüğü yazılıdır. (Devir notundaki "15 kare" sayısı eski;
güncel envanter 17: 3 bekleme + 4 tekme + 3 walk + 3 punch + 2 hit + 2 block.)

## Tuval ve yerleşim

- **Tuval:** 354×244 px, şeffaf zemin — 17/17 karede birebir.
- **Taban çizgisi:** en alt opak satır **y=241** (tuval altından 2px pay) —
  17/17 karede birebir aynı satır.
- **Ayak çapası:** kesimde taban bandının (alt %5) alfa-ağırlıklı merkezi
  tuval ortasına (x=177) konur; kare-arası pivot düzeltmeleri OYUNDA,
  `sprites.js`'teki kare bazlı ofsetlerle yapılır (PNG'lere gömülmez):
  - `YURU_OFSET=[-89,14,75]` — pivot=basılı ayak (ölçüm: 248.3/151.4/85.1)
  - `YUMRUK_OFSET=[0,-13,37]` — pivot=arka ayak (ölçüm: 125.6/139.1/88.4)
  - `HIT_OFSET=[0,0]`, `BLOK_OFSET=[0,1]` — arka topuk 123.0-123.9 (şeritler
    kendiliğinden hizalı geldi)

## Karakter ölçüleri

- **Boy (gard duruşu): 240px** — bekleme-0/1/2, tekme-0, punch_1, hit_1,
  hit_2, block_1'de birebir 240; yürüme duruşları bilinçli **238**
  (walk_1/walk_3). Aksiyon pozları poz gereği 207-239 (walk_2 ve block_2
  toplanmış pozlar: 207).
- **Baş-vücut oranı: ≈7.3 baş** — bekleme-0'da baş yüksekliği ≈33px (figür
  tepesi y=2 → omuz genişlemesinin başladığı y≈35), 240/33≈7.27.
- **Dış kontur kalınlığı: 2-3px** — bekleme-0'da medyan 2px (123 kenar
  örneği), punch_1'de medyan 3px (110 örnek). Yeni şeritte hedef bu bant;
  3px üstü "kalın", 1px "kırılgan" sayılır.
- **Kafa genişliği (ölçek tanısı): 40-44px** — bekleme 41/40/41,
  walk 41/43/42, punch 44/44/44. ±3 bandı normal; dışına çıkan kare
  ölçek hatasına işaret eder (kesimde `esitle` ile düzeltilir).

## Palet

- **Saf siyah-beyaz + tarama gölge + şeffaf zemin.** 17 karenin opak
  (alfa>200) 275.597 pikselinde: %26 siyah (<60), %49 beyaz (>215),
  %25 ara gri (tarama dokusundan — mikro ölçekte gri okunur, bası doğru).
- **Renk sapması:** punch/walk kaynak şeritlerinde beyazlarda hafif leylak,
  siyahlarda sıcak ton kayması ölçüldü (kanal farkı Δ≈10 — örn. punch_3'te
  rgb(245,239,249)) — gözle algılanamaz, kaynak karakteristiği, tolere
  edilir. Denetçi eşiği Δ>14: gerçek renk kaçağını yakalar, bu tonu geçirir.
- **Ara alfa:** görünür piksellerin %7'si 0<a<255 bandında (küçültme
  kaynaklı yumuşak kenar — normal ve istenen).

## Bilinen kesim artefaktı — SOLUK İÇERİK

Çok ince ve izole ham çizgiler (1-2px) güçlü küçültmede (≈×0.34) alfa
10-30 bandına düşer ve fiilen GÖRÜNMEZ olur. Ölçülen örnekler: block_2'nin
kıvılcım izleri ve saç ucu (222×240'lık gerçek içeriğin sağ/üst bölgesi
yalnız alfa≤30'da var; alfa>60'ta görünen kısım 162×207). Oyunda blok
emiliminde motorun kendi kıvılcım efekti çizdiği için fark edilmiyor.
**Kural:** yeni şeritlerde efekt çizgileri ham görselde ≥4px istenmeli;
`denetci.mjs`'in "soluk içerik" uyarısı bu durumu otomatik yakalar.

## Kesim standartları (özet)

- Şerit ölçeği: gard karesi hedefi 240px (yürüme şeridinde 238); kaynakta
  farklı boyda çizilmiş kareler `esitle` ile kendi kutusundan hedefe.
- Şeffaflık: kenardan flood-fill (iç beyazlar opak kalır, eşik 245).
- Temizlikler: filigran üst-bant beyazlama, ayak-hizası yatay neşter +
  altiAt (kısa zemin çizgisi), dikey neşter (değen figürler),
  en-yakın-mürekkep kırıntı iliştirme (kopuk hız çizgileri doğru kareye).
