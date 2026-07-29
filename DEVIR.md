[DEVİR NOTU v3 — PROJE + SANAT YÖNETİMİ]
(v1 ve v2'yi geçersiz kılar. v2'nin sanat bulguları korundu,
durum bilgisi bu hattın gerisindeydi, güncellendi.)

═══ BÜYÜK KARARLAR (değişmez) ═══
- Sprite karakter (Tekvandocu) GÖLGE'nin yerine geçti ve
  ASIL karakterdir. Çöp adam görünümü GÖLGE için emeklidir;
  diğer 3 karakter vektör kalır.
- SPRITE görünümü globaldir (tüm modlar), localStorage ile
  kalıcıdır (anahtar: cd-sprite), varsayılan AÇIK.
- Görsel araç: Gemini (Nano Banana 2 Lite, ücretsiz).
  Copilot bırakıldı. Nano Banana Pro ALINMAYACAK (719,99
  TL/ay; çözdüğü kimlik sorunu tek-üretim kuralıyla bedava
  çözülüyor, poz sorununu zaten çözmüyor).
- Karakter kimliği: zayıf-atletik erkek, çıplak üst beden,
  bol beyaz pantolon, siyah kuşak, SİYAH BİLEK BANTLARI,
  yalın ayak. Comic-ink, saf S/B, tarama gölge.
  (İstisna: walk şeridinde bilek bandı yok — bilinen eksik,
  oyun ölçeğinde batmazsa dokunulmayacak.)

═══ KİMLİK KARARI (2026-07-29, tescil) ═══
- Karakter oranı: GERÇEKÇİ — koca-kafa mirası KAPANDI. İskelet
  kaplamasındaki sabitK=0.9 kafa ölçeği, parça entegrasyonunda
  gerçekçi orana normalleştirilecek.
- Resmî kimlik kartı: kimlik_v1.png (saf profil, JPEG artıkları
  eşiklemeyle temizlenmiş). Bundan sonraki TÜM görsel üretimlerin
  Image A'sı BUDUR. (refA_identity.png = eski Banana 2 kimliği,
  arşiv değeri.)
- Soyağacı: Nano Banana 2 stil tabanı + Pro profil düzeltmesi.
- KALICI HAT KURALI: girdi JPG gelirse tools/jpg-temizle.mjs'ten
  geçer (gri tonlama + beyaz eşiği 240 / siyah eşiği 64 — kimlik_v1
  ölçümüyle kalibre); hat her zaman PNG işler; sprite-kes.mjs .jpg
  kaynakları bu adımdan otomatik okur.

═══ ENTEGRE DURUM (canlıda, telefonda kısmen onaylı) ═══
Ortak standart: 354×244 tuval, ayak-merkezi kesim +
sprites.js'te kare bazlı drawOffset pivot sistemi, şeffaf
zemin, taban çizgisi hizalı.
- idle: 3 kare nefes döngüsü
- yürüme: 3 kare shuffle (1→2→3→1), YOL-TABANLI kare seçimi
  (YURU_YOL_PER_KARE = 72, kullanıcı onaylı); geri yürüyüş
  otomatik ters; duvarda yerinde yürüme yok; pivot = basılı
  ayak (YURU_OFSET)
- yumruk: 3 kare (gard/coil/impact), dizilim 1→2→3→2→1,
  gard-referanslı ofset (bekleme→yumruk sıçraması yok),
  hitbox aktifken impact karesi ekranda; yer zinciri eşli,
  aparkat bilinçli hariç
- darbe alma: 2 kare (impact/stagger), hitstun %60/%40;
  yalnız yer durumları
- blok: 2 kare (brace/absorb); blockstun sayacı YOK —
  emilim penceresi = kvx sönmesi (~0.2sn, hamle gücüyle
  ölçeklenir). BİLİNÇLİ TASARIM KARARI: geri itiş değerleri
  değişirse blok animasyon süresi de değişir.
- yan tekme: 4 kare (eski onaylı şerit)
Eşlenmemiş durumlar (çömelme, hava/juggle, fırlatma, özel
hamleler, fatality, çömelik blok) VEKTÖRE düşer — bilinçli:
durum okunabilirliği > stil tutarlılığı. Tek ilaç: seti
tamamlamak.

═══ DENEYLE DOĞRULANAN BULGULAR (v2'den, geçerli) ═══
1. Kimlik sapması üretimler ARASINDA olur, içinde olmaz →
   bir animasyonun tüm kareleri TEK üretimde istenir.
   Kareler asla tek tek üretilmez.
2. POZ METİNDEN GELMEZ, GÖRSELDEN GELİR. Model bilmediği
   vücut konfigürasyonunu metinden kuramaz (naeryo chagi
   3 kez denendi, olmadı). Yeni/karmaşık her hamle için
   çift referans ZORUNLU:
   - Görsel A: kimlik/stil (tek temiz figür; aday: punch_1)
   - Görsel B: biyomekanik aşama diyagramı (yan profil)
   Görsel B üretime girmeden sanat yönetmeni (Claude)
   denetiminden geçer.
3. Kostüm ve çizgi kalınlığı promptta kilitlenmezse model
   varsayılana kayar → kimlik satırları her prompta girer.
4. (Bu hattan) Basit/bilinen hamleler (yürüme, yumruk, hit,
   blok) kare kare metin tarifiyle üretilebildi — çift
   referans şartı özellikle yeni konfigürasyonlar için.
5. (Bu hattan) Üretim modelleri son kareyi ilk karenin
   kopyası yapmaya eğilimli → son kareyi atıp 1→2→3→2→1
   gibi ping-pong dizilimle çözülür.

═══ ARAÇ VE SÜREÇ ═══
- Akış: Kullanıcı Gemini'den şerit üretir → bu Claude
  (sanat yönetmeni) denetler → [CLAUDE CODE] paketiyle
  entegrasyon → Claude Code raporu → Claude rapor denetimi
  → tarayıcı QA (Claude, Chrome eklentisiyle) → TELEFON
  ONAYI (kullanıcı) → sonraki görev. Telefon onayı olmadan
  yeni şerit yok.
- Dosya adlandırma: eylem İngilizce + _raw.png, proje
  köküne (walk_raw, punch_raw, hit_raw, block_raw...).
  Claude Code kesilmiş kareleri _1,_2,_3 türetir.
- Araçtaki kalıcı çözümler: filigran üst-bant beyazlama,
  ayak-hizası neşter kesiği, en-yakın-mürekkep kırıntı
  iliştirme (kopuk hız çizgilerini doğru kareye verir),
  esitle ölçek normalizasyonu, zemin çizgisi temizliği.
- Tarayıcı QA kuralı: her testin ilk adımı EKRAN
  GÖRÜNTÜSÜNDEN sahne doğrulaması. Erişilebilirlik ağacı
  bu oyunda yanıltıcı (dokunmatik butonlar her ekranda
  DOM'da) — güvenilir tek tanık piksel.
- STIL.md (ölçülmüş sayılar) + denetci.mjs (zemin/boy/
  siluet/palet/sıçrama kontrolü): görev atandı, rapor
  bekleniyor.

═══ ÜRETİM SIRASI (kilitli) ═══
1. [BEKLEMEDE] TEK zinciri teşhisi: art arda tekmede
   vektöre düşüş — Topuk Kesme mi (bilinen eksik sınıfı),
   bağlama hatası mı? Rapor bekleniyor. + Tam state
   envanteri (resmi eksik listesi olacak).
2. Çömelik set: çöm-idle + alçak süpürme (Topuk Kesme
   teşhise göre kapsama girebilir). Görsel B gerekli.
3. Dönerek tekme (dollyo chagi) — imza ağır vuruş.
   Görsel B gerekli.
4. Hava seti: zıplama yayı + uçan yan tekme. Hava YUMRUĞU
   YOK (kimlik kararı: hava seti tekme ağırlıklı).
   DİKKAT: havada taban referansı yok — hizalama ağırlık
   merkezi/kalçadan yapılmalı, raster araçlarına yeni mod
   gerekecek.
5. Düşme/kalkma + kalan boşluklar (envantere göre).
Prensip: her turda BİR şerit; toplu üretimde (4-5 şerit)
kontakt sayfasıyla yan yana değerlendirme.

═══ AÇIK KONULAR ═══
- TEK zinciri teşhis raporu (yukarıda)
- Naeryo chagi: uygun Görsel B bulunana kadar ertelendi
- Karakter isimlendirmesi ertelenmiş
- Arena testindeki tekrarlayan zamanlama kırılganlığı:
  test-tarafı yarış olarak teşhisli, temizlik turunda
- Vektöre düşüş anlarının rahatsızlık düzeyi telefonda
  izleniyor (set tamamlandıkça kapanacak)
- walk bilek bandı eksiği (yukarıda)

═══ DEĞİŞMEYEN KURALLAR ═══
- Telefonda test edilmeden yeni göreve geçilmez
- Commit mesajları Türkçe; her görev sonrası commit+push
- 5 stil planı: Taekwondo (bu karakter), Karate, Kung Fu,
  Tai Chi, Jiu-jitsu/Judo. %80 baskın + %20 aksan.
- Claude asla "olmuş" demek için denetim gevşetmez;
  kurtarılabilir kusur ile yeniden üretim ayrımı her
  denetimde açıkça yazılır.
