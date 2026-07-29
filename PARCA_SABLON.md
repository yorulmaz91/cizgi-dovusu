# PARCA_SABLON.md — İskelet Kaplama Parça Şablonu (v2: gerçek sayfa)

Kaplama parçaları Gemini parça sayfalarından kesilir:
parca_pro.jpg + parca_normal.jpg (kökte; JPG'ler bilinen hat kuralıyla
jpg-temizle'den geçer). Frankenstein dönemi (tek-kare kesim) kapandı;
eski parçalar assets/arsiv/parca-frankenstein/ altında.

## Sözleşme

- Her parça kemik ekseni DİKEY (eklem-1 üstte) rektifiye kesilir.
- Çapa noktası = (eksenX, pay1): parçanın eklem-1'e oturduğu piksel.
- pay1/pay2: eklemlerin ötesine örtüşme payı (eklemde boşluk yok).
- Çalışma anında parça kemik uzunluğuna TEK TİP ölçeklenir
  (k = oyunKemik / kemikArt) ve kemik açısıyla döner.
- KİMLİK KARARI: sabitK kafa büyütmesi YOK — kafa da kemik ölçeğiyle,
  gerçekçi oran (kimlik_v1.png esas).
- Arka uzuvlar ön uzuv görsellerini paylaşır (gövde altında çizilir).

## Mevcut parçalar (ölçülmüş)

| Parça | Kaynak | Piksel boyutu | Çapa (eksenX, pay1) | Kemik boyu (art px) | Oyun kemiği |
|---|---|---|---|---|---|
| kafa | parca_normal | 66×89 | (33, 5.7) | 78.7 | boyun→tepe (20) |
| govde | parca_pro | 84×213 | (41.8, 58.3) | 144.1 | kalça→omuz (~26) |
| ust_kol | parca_pro | 44×118 | (22, 3.5) | 111.3 | omuz→dirsek (18) |
| on_kol | parca_pro | 37×145 | (18.7, 5.5) | 76 | dirsek→bilek (17, bant+yumruk dahil) |
| uyluk | parca_normal | 55×168 | (27.5, 2.2) | 162.9 | kalça→diz (22) |
| incik | parca_normal | 46×147 | (13.2, 2.2) | 117.2 | diz→ayak (20, ayak dahil) |

## Z-ORDER (çizim sırası — bakış yönüne göre aynalanır)

arka uyluk → arka incik → arka üst kol → arka ön kol →
GÖVDE → ön uyluk → ön incik → KAFA → ön üst kol → ön ön kol

## Yeni sayfa istenirse (Gemini)

- Image A = kimlik_v1.png (resmî kimlik), saf beyaz zemin
- Parçalar birbirine DEĞMESİN, uç halkası/soket işareti OLMASIN
  (varsa araçta beyazDoldur/sınır dışı bırakma ile temizlenir)
- Eklem kesişimleri düz, efekt çizgisi yok, çizgi kalınlığı tutarlı
