[DEVİR NOTU v4 — VİDEO HATTI ÇAĞI]
(v1-v43ü geçersiz kılar. Sprite ve iskelet çağlarının dersleri
korundu, üretim yöntemi tamamen değişti.)

═══ BÜYÜK KARARLAR (değişmez) ═══
- Karakter: Tekvandocu, GÖLGE'nin yerine geçti, oyunun ASIL
  karakteri. Çöp adam görünümü GÖLGE için emekli.
- Kimlik: kimlik_v1.png — GERÇEKÇİ oran (koca-kafa mirası
  kapandı, sabitK normalleştirildi). Zayıf-atletik erkek,
  çıplak üst beden, bol beyaz pantolon KUŞAKTAN BAŞLAR
  (ceket eteği YASAK — 3 kez sızdı, her denetimin İLK maddesi),
  siyah kuşak, siyah bilek bantları, yalın ayak. Comic-ink,
  saf S/B, tarama gölge, orta düzey kas belirginliği.
  kimlik_v1 bundan sonraki TÜM görsel üretimlerin Image A'sı.
- Üretim yöntemi: VİDEO HATTI (aşağıda). Sprite tek-kare
  üretimi ve iskelet/parça kaplama emekli.

═══ MİMARİ: VİDEO HATTI ═══
Akış: Gemini (Omni/Veo) video üretir → Claude (sanat yönetmeni)
denetler → tools/video-kes.mjs kareleri seçip temizler ve
hizalar → mevcut sprite hattı bağlar → tarayıcı QA → TELEFON
ONAYI.

Araç: tools/video-kes.mjs --mod=<walk|idle|punch|...> --kare=N
- Çevrim sinyalleri moda göre: walk = bbox genişliği
  otokorelasyonu, idle = bbox yüksekliği (nefes),
  punch = sağ uç maxX (yumruk ucu — bbox genişliği YANLIŞ
  sinyal, geri çekişte dirsek soldan genişletir)
- Keskinlik puanı (kenar yoğunluğu) hız bulanık kareleri eler
- Temizlik: fon eşiği AYRI ve TOLERANSLI (kenardan flood-fill;
  fon eşiğini beyazlatmak konturu yakar), gri taban temizliği,
  JPG girdiler PNG'ye çevrilir
- Hizalama: 354×244 tuval, taban çizgisi, ayak-merkezi + kare
  bazlı drawOffset pivot (PNG'lere dokunulmaz, ofsetler
  sprites.js'te)

Video üretim kalıbı (Gemini, kimlik_v1 Image A olarak ekli):
"Animate this black-and-white comic book illustration: [EYLEM].
He stays in place, seen from the side, facing right. Single
continuous take, no cuts. His trousers start directly at the
black belt — NO jacket, NO fabric flaps over or under the belt,
bare torso above the belt. Moderately defined musculature
exactly as in the illustration. Plain white background, no
camera movement, no background elements. Keep the original ink
drawing style of the illustration, pure black and white, no
color."

═══ CANLIDA (bağlı, telefon onaylı) ═══
- walk8_1..8: video kaynaklı 8 kare, yol-tabanlı seçici,
  YURU_OFSET iki fazlı, YURU_YOL_PER_KARE = 27 (KÖPRÜ DEĞER)
- idle6_1..6: video kaynaklı, ~4sn nefes çevrimi, yapay bob yok
  (yeni video, kuşak altı düz, commit b223003; eski set
  assets/arsiv/idle6-v1/)
- punch6_1..6: video kaynaklı, hitbox-kare kuralı (aktif
  pencere [t0,t1] tamamen IMPACT karesinde, kanıtlı),
  YUMRUK_OFSET ölçülmüş sıfır
- Eski nesiller assets/arsiv/ altında (silinmedi):
  yuru3/, bekleme3/, punch3/, parca-frankenstein/

═══ KUYRUK (sıradaki işler) ═══
1. WALK GENİŞLETME (tempo sorununun KALICI çözümü):
   onaylı segmentten (kare 172-189 çevrimi) 8 yerine 14 kare
   kesilecek, YURU_OFSET 14'e yeniden türetilecek, çevrim
   süresi VİDEO KAYNAĞINA eşitlenecek (his kademesi arayışı
   biter, referans video). Kullanıcı bulgusu: 8 karede kalça
   salınımı ve arka bacak ara fazları kayboluyor.
2. KICK KESİMİ: video_kick1.mp4 (kökte). ÖLÇÜLDÜ: 240 kare,
   5 tekme olayı (kare 41/105/161/205/217), gard duraklamaları
   sağlam (49-97 arası ~2sn sabit). Ön tekme = kare 29-53
   (uzanım 183px, gövde dik), yan tekme = kare 93-121
   (uzanım 169px, gövde geriye yatıyor, yükseklik 162'ye
   düşüyor). DİKKAT: bu videonun fonu GRİ (183-216, saf beyaz
   yok) — toleranslı eşik şart.
3. DEFANS KESİMİ: video_defense.mp4 (kökte). ÖLÇÜLDÜ: fon
   temiz beyaz (253). Darbe alma = kare 22-50 (genişlik
   72→170), blok = kare 110-135 (yükseklik 165→155),
   çömelme = kare 168-208 (tutulan bölüm 177-201, yükseklik
   169→125). BEKLETİLİYOR: blok kolları düzeltilecek (aşağıda).
4. Kalan hamleler: dönerek tekme (dollyo), süpürme, hava seti,
   yere yıkılma ailesi.

═══ AÇIK KARARLAR (kullanıcı verecek) ═══
A) BAKIŞ AÇISI: tam profil mi, 3/4 açı mı? Kullanıcı 3/4'ün
   daha iyi durabileceğini düşünüyor (Street Fighter/Shadow
   Fight konvansiyonu: göğüs, iki kol, yüz görünür).
   Maliyeti: walk/idle/punch yeniden üretilip kesilecek + her
   video ayrı üretim olduğu için AÇI TUTARLILIĞI yeni bir
   sapma riski. Test promptu hazır (3/4 idle üretimi), karar
   testten sonra. KARAR VERİLMEDEN defans yeniden üretilmesin
   (iki kez üretim olur).
B) BLOK KOLLARI: çapraz (X) yerine YAN YANA dikey önkol —
   sanat yönetmeni katılıyor (X şekli oyun ölçeğinde görsel
   gürültü, silüet okunmaz). Defans videosu bu düzeltmeyle
   VE seçilen açıyla tek seferde yeniden üretilecek.

═══ DERSLER (deneyle doğrulanmış) ═══
1. Video modeli 10 SANİYE tavanı: tek videoya en fazla 2-3
   teknik sığar. Fazlası olursa gard duraklamaları erir,
   çevrim sınırları kaybolur (kata denemesiyle kanıtlandı).
   Her teknik arasına "hold the guard for a full second"
   şart.
2. Kimlik sapması üretimler ARASINDA olur: kas belirginliği
   idle ile walk arasında farklı çıktı. Prompta kas düzeyi
   kilidi girdi.
3. "Feet planted" talimatı hizalamayı bedavaya çözüyor
   (punch ofsetleri ölçülmüş sıfır çıktı).
4. Modelin metin iddiası ile görselin gerçeği ayrı: Gemini
   "düzelttim" der ama piksel yalanlar. Hüküm hep pikselde.
5. Kaynak videonun akıcılığı, kare sayısı yetersizse ekrana
   taşınmıyor — 8 kare bir insan yürüyüşüne yetmiyor.
6. Sinyal seçimi kritik: yanlış metrik yanlış kareyi seçer
   (punch'ta bbox genişliği tuzağı, walk'ta "en stabil
   pencere" = ısınma bölümü tuzağı).

═══ ARAÇ VE SÜREÇ ═══
- Dosya adlandırma: video_<eylem>.mp4, proje köküne.
  Gemini indirmelerinde ad çakışır (hep
  "Animate_this_black_and_white_c.mp4") — indirir indirmez
  yeniden adlandır.
- Tarayıcı QA (Claude, Chrome eklentisi): her testin İLK adımı
  ekran görüntüsünden SAHNE DOĞRULAMASI. Erişilebilirlik ağacı
  bu oyunda yanıltıcı (dokunmatik butonlar her ekranda DOM'da).
- Telefon onayı olmadan yeni göreve geçilmez.
- Claude Code otonom değil: "kabuk döndüğünde devam edeceğim"
  derse kullanıcının dürtmesi gerekir.
- Bilinen araç çözümleri: filigran üst-bant beyazlama, ayak
  hizası neşter kesiği, en-yakın-mürekkep kırıntı iliştirme,
  esitle ölçek normalizasyonu, süperörnekleme (büyük sayfadan
  küçük kesimde kontur hayaleti önler).

═══ EMEKLİ / ARŞİV ═══
- Sprite tek-kare üretimi (Copilot/Gemini şerit promptları)
- İskelet animasyon katmanı: js/iskelet.js ÇALIŞIR ama
  kullanılmıyor — kemikler çöp adam oranlı, pozlar çöp adam
  için yazılmış, sonuç "korkuluk". GÖRÜNÜM menüsünde seçenek
  olarak duruyor.
- Mixamo FBX hattı: tools/fbx-cevir.mjs ÇALIŞIR (retargeting,
  sagital izdüşüm, translation eğrisi desteği). İskelet yolu
  canlanırsa hazır. Şu an kullanılmıyor.
- KALEM/erasedLimb notu: sprite yolu erasedLimb okumuyor,
  silinen uzuv görünmeye devam eder (kozmetik).

═══ DEĞİŞMEYEN KURALLAR ═══
- Telefonda test edilmeden yeni göreve geçilmez
- Commit mesajları Türkçe; her görev sonrası commit+push
- Denetimde "kurtarılabilir kusur" ile "yeniden üretim" ayrımı
  açıkça yazılır; onay için gevşetme yok
- 5 stil planı: Taekwondo (bu karakter), Karate, Kung Fu,
  Tai Chi, Jiu-jitsu/Judo. %80 baskın + %20 aksan
- Karakter isimlendirmesi ertelenmiş
