/* ============================================================
   KARAKTERLER — statlar, hamle zincirleri, skiller, yüz konfigleri
   ============================================================ */
export const CHARS=[
  {
    id:'golge',name:'GÖLGE',lw:2.2,
    speed:270,hp:88,punch:6,kick:9,
    specName:'Gölge Geçişi',specDesc:'Rakibin içinden geçer, arkasından vurur',
    specCd:3.5,tagline:'Hızlı · kırılgan · acımasız',
    fatalName:'GÖLGE SÖKÜMÜ',
    hair:'long',mood:'smirk',
    moves:{
      p:[
        {name:'Jab',anim:'jab',dur:.22,t0:.06,t1:.13,range:60,dmg:4,kb:60,ky:-58},
        {name:'Kroşe',anim:'cross',dur:.26,t0:.08,t1:.16,range:66,dmg:5,kb:90,ky:-56},
        {name:'Ters Yumruk',anim:'backfist',dur:.4,t0:.16,t1:.26,range:74,dmg:9,kb:230,ky:-60,lunge:130}
      ],
      k:[
        {name:'Ön Tekme',anim:'front',dur:.34,t0:.12,t1:.2,range:78,dmg:7,kb:150,ky:-40},
        {name:'Topuk Kesme',anim:'sweep',dur:.45,t0:.18,t1:.3,range:82,dmg:8,kb:140,ky:-10}
      ],
      cp:{name:'Yükselen Gölge',anim:'upper',dur:.38,t0:.12,t1:.22,range:56,dmg:9,kb:60,ky:-80,launch:520},
      ck:{name:'Alçak Tekme',anim:'lowkick',dur:.3,t0:.1,t1:.18,range:70,dmg:6,kb:90,ky:-14},
      jp:{name:'Hava Yumruğu',anim:'airpunch',dur:.3,t0:.08,t1:.2,range:58,dmg:7,kb:120,ky:-40},
      jk:{name:'Dalış Tekmesi',anim:'flykick',dur:.5,t0:.1,t1:.4,range:66,dmg:10,kb:200,ky:-40,airlunge:300}
    }
  },
  {
    id:'beton',name:'BETON',lw:3,
    speed:150,hp:130,punch:12,kick:16,
    specName:'Deprem Yumruğu',specDesc:'Yere vurur, şok dalgası yayar',
    specCd:5,tagline:'Yavaş · dayanıklı · ezici',
    fatalName:'BETON MEZARI',
    hair:'flat',mood:'frown',
    moves:{
      p:[
        {name:'Kanca',anim:'hook',dur:.38,t0:.14,t1:.24,range:64,dmg:10,kb:150,ky:-60},
        {name:'Balyoz',anim:'hay',dur:.6,t0:.3,t1:.42,range:72,dmg:15,kb:300,ky:-70,lunge:60}
      ],
      k:[
        {name:'Diz',anim:'knee',dur:.3,t0:.1,t1:.18,range:52,dmg:11,kb:120,ky:-40},
        {name:'Omuz Şarjı',anim:'shoulder',dur:.55,t0:.2,t1:.4,range:70,dmg:16,kb:340,ky:-30,lunge:280}
      ],
      cp:{name:'Yer Kancası',anim:'upper',dur:.5,t0:.2,t1:.32,range:58,dmg:13,kb:80,ky:-80,launch:600},
      ck:{name:'Bacak Ezici',anim:'lowkick',dur:.4,t0:.14,t1:.24,range:72,dmg:10,kb:130,ky:-12},
      jp:{name:'Örs Yumruk',anim:'airpunch',dur:.36,t0:.1,t1:.24,range:60,dmg:12,kb:180,ky:-30},
      jk:{name:'Gövde Dalışı',anim:'flykick',dur:.55,t0:.12,t1:.45,range:70,dmg:14,kb:260,ky:-30,airlunge:220}
    }
  },
  {
    id:'volt',name:'VOLT',lw:2.4,
    speed:210,hp:100,punch:8,kick:11,
    specName:'Yıldırım Zinciri',specDesc:'3 şimşek üst üste çarpar',
    specCd:4.5,tagline:'Dengeli · elektrikli · şok edici',
    fatalName:'RÖNTGEN ÇARPMASI',
    hair:'spiky',mood:'grin',
    moves:{
      p:[
        {name:'Jab',anim:'jab',dur:.2,t0:.05,t1:.12,range:62,dmg:6,kb:70,ky:-58},
        {name:'Şok Avucu',anim:'palm',dur:.3,t0:.1,t1:.18,range:66,dmg:8,kb:160,ky:-56,stun:.35}
      ],
      k:[
        {name:'Yan Tekme',anim:'side',dur:.32,t0:.12,t1:.2,range:82,dmg:9,kb:180,ky:-42},
        {name:'Dönen Tekme',anim:'round',dur:.42,t0:.16,t1:.28,range:88,dmg:12,kb:220,ky:-64},
        {name:'Balta',anim:'axe',dur:.5,t0:.26,t1:.36,range:70,dmg:14,kb:120,ky:-90}
      ],
      cp:{name:'Volt Yükselişi',anim:'upper',dur:.4,t0:.14,t1:.24,range:56,dmg:10,kb:60,ky:-85,launch:560,stun:.2},
      ck:{name:'Süpürme',anim:'lowkick',dur:.32,t0:.1,t1:.2,range:76,dmg:8,kb:110,ky:-12},
      jp:{name:'Şimşek Yumruk',anim:'airpunch',dur:.28,t0:.08,t1:.18,range:58,dmg:8,kb:130,ky:-40},
      jk:{name:'Uçan Tekme',anim:'flykick',dur:.5,t0:.1,t1:.4,range:70,dmg:12,kb:240,ky:-46,airlunge:340}
    }
  }
];
