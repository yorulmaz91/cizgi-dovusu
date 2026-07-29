# PARCA_SABLON.md — İskelet Kaplama Parça Şablonu

Geçici kaplama punch_1 (gard) karesinden kesildi; kalıcısı Gemini'nin
A-POSE PARÇA SAYFASINDAN gelecek. Bu şablon o sayfanın sözleşmesidir:
aynı adlar, aynı çapa mantığı — sayfa gelince tools/parca-kes.mjs
koordinatları güncellenip yeniden kesilir, oyun kodu DEĞİŞMEZ.

## Sözleşme

- Her parça kemik ekseni DİKEY (eklem-1 üstte) rektifiye kesilir.
- Çapa noktası = (eksenX, pay1): parçanın eklem-1'e oturduğu piksel.
- pay1/pay2: eklemlerin ötesine örtüşme payı (eklemde boşluk görünmesin).
- Çalışma anında parça, kemik uzunluğuna TEK TİP ölçeklenir
  (k = oyunKemik / kemikArt) ve kemik açısıyla döner.
- Arka uzuvlar (geçici kaplamada) ön uzuv görsellerini paylaşır;
  A-pose sayfasında ayrı arka parçalar gelirse adlar: ust_kol_arka,
  on_kol_arka, uyluk_arka, incik_arka.

## Mevcut parçalar (punch_1 kesimi, ölçülmüş)

| Parça | Piksel boyutu | Çapa (eksenX, pay1) | Kemik boyu (art px) | Oyun kemiği |
|---|---|---|---|---|
| kafa | 56×49 | (28, 8) | 35.2 | boyun→tepe (20) |
| govde | 56×95 | (34, 16) | 73.2 | kalça→omuz (~26) |
| ust_kol | 28×63 | (14, 12) | 43.3 | omuz→dirsek (18) |
| on_kol | 32×61 | (16, 8) | 29.1 | dirsek→bilek (17, el dahil) |
| uyluk | 36×91 | (18, 14) | 66.7 | kalça→diz (22) |
| incik | 56×85 | (22, 10) | 55.1 | diz→ayak (20, ayak dahil) |

## Z-ORDER (çizim sırası — bakış yönüne göre aynalanır)

arka incik → arka uyluk → arka üst kol → arka ön kol →
GÖVDE → ön uyluk → ön incik → KAFA → ön üst kol → ön ön kol

## A-pose sayfası için istek listesi (Gemini)

- Tek sayfa, saf beyaz zemin, karakter kimliği (STIL.md) birebir
- A-pose: kollar ~45° açık, bacaklar omuz genişliğinde — uzuvlar
  gövdeyi KAPATMASIN (temiz kesim için)
- Parça sınırlarında (dirsek/diz/omuz/kalça) düz kesişim, kıvrım yok
- Efekt çizgisi yok, gölge yok; çizgi kalınlığı 2-3px (354 ölçeğinde)
