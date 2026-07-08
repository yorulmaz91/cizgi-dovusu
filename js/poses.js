/* ============================================================
   POZLAR — her durum/hamle için iskelet açıları
   (f = dövüşçü nesnesi; dönen P nesnesi render.js'te çizilir)
   ============================================================ */
import {lerp} from './utils.js';

/* Faz D — vuruş eğrisi: hazırlıkta geriye kurulum (negatif değer, uzuvlar
   ters yöne gerilir), aktif pencerede patlayıcı uzanım + "tık" kilidi
   (k=1'de asılı kalır), sonra yumuşak geri çekilme. a=t0/dur, b=t1/dur. */
function vurusEgrisi(tt,a,b){
  if(tt<a){const s=tt/a;return -.28*s*s;}                       // kurulum
  if(tt<=b){                                                    // vuruş + kilit
    const s=Math.min(1,((tt-a)/Math.max(.02,b-a))/.55);
    return -.28+1.28*(1-Math.pow(1-s,3));
  }
  const r=Math.min(1,(tt-b)/Math.max(.05,1-b));                 // geri çekme
  return 1-r*r*(3-2*r);
}

export function computePose(f){
  const P={lean:0,head:0,aL:[.5,.35],aR:[-.4,.4],lL:[.15,.1],lR:[-.15,.15],dip:0,hipShift:0,reach:0,twist:0,hipTw:0,profil:0};
  const t=f.st,s=f.state;
  if(s==='idle'){ // karaktere özel canlı bekleme: ritim + nefes + kişilik
    const yor=1-(f.hp!=null&&f.maxHp?f.hp/f.maxHp:1);        // 0 dinç → 1 bitkin
    const hz=(f.ch.id==='beton'?1.7:f.ch.id==='volt'?4.4:f.ch.id==='kalem'?2.4:3)*(1+yor*.5);
    const b=Math.sin(t*hz), n=Math.sin(t*hz*.5);             // b: duruş ritmi · n: nefes
    if(f.ch.id==='golge'){        // akışkan, kedi gibi süzülen alçak gard
      P.lean=.06+b*.03;P.aL=[.55+b*.09,.5+b*.06];P.aR=[-.5-b*.09,.55+b*.06];
      P.dip=1.5+b*2;P.hipShift=b*2;
    }else if(f.ch.id==='beton'){  // ağır kaya: omuzdan derin nefes
      P.lean=.03;P.aL=[.55+n*.07,.42+Math.max(0,n)*.14];P.aR=[-.5-n*.07,.47+Math.max(0,n)*.14];
      P.dip=1+Math.max(0,n)*3.2;P.head=n*.05;
    }else if(f.ch.id==='volt'){   // parmak ucunda seken, elektrikli
      const z=Math.abs(Math.sin(t*hz));
      P.dip=3-z*4.5;P.lean=.04;
      P.aL=[.6+b*.11,.55+z*.12];P.aR=[-.55-b*.11,.6+z*.12];
      P.hipShift=b*1.4;
    }else if(f.ch.id==='kalem'){  // rahat ve meraklı; kalem tutan el sakin
      P.lean=-.02+b*.025;P.head=b*.08;
      P.aL=[.5+b*.1,.45+b*.05];P.aR=[-.35,.5];
      P.dip=1+b*1.8;
    }else{const bb=Math.sin(t*3)*.05;P.aL=[.5+bb,.4];P.aR=[-.45-bb,.45];P.dip=Math.sin(t*3)*1.5;}
    if(yor>.6){                   // bitkin: omuzlar düşer, gard iner, baş öne eğilir
      const k=(yor-.6)/.4;
      P.dip+=3*k;P.head+=.12*k;P.lean+=.05*k;
      P.aL[0]-=.18*k;P.aR[0]+=.14*k;
    }
    P.head+=(f.bakis||0);         // rakip havadaysa göz ucuyla takip
  }
  if(s==='walk'){
    const ig=f.ileriGeri||1;                       // 1 ileri · -1 geri çekilme
    const w=Math.sin(f.walkPhase);
    const genlik=ig>0?.5:.36;                      // geri adımlar daha kısa ve temkinli
    P.lL=[w*genlik,.26+Math.max(0,-w)*.55];
    P.lR=[-w*genlik,-(.26+Math.max(0,w)*.55)]; // kaval geriye katlanır (anatomik diz)
    if(ig>0){                                      // ileri yürüyüş: gövde önde, kollar adımla salınır
      P.lean=.12;
      P.aL=[-w*.5+.28,.45+Math.max(0,w)*.25];
      P.aR=[w*.5-.32,.45+Math.max(0,-w)*.25];
    }else{                                         // geri çekilme: gard önde, gövde geride
      P.lean=-.08;
      P.aL=[.85-w*.08,1.3];
      P.aR=[.55+w*.08,1.6];
    }
    P.dip=1+Math.abs(w)*2.6;                       // her basışta minik çöküş
    P.hipShift=w*2*ig;                             // ağırlık basan ayağa akar
    P.head=-.04*ig+Math.sin(f.walkPhase*2)*.035+(f.bakis||0)*.7; // adım ritmi + bakış
  }
  if(s==='attack'){
    const mv=f.mv, tt=Math.min(1,t/mv.dur);
    // hamlenin GERÇEK pencerelerinden hazırlık→vuruş→geri çekme eğrisi
    const a=Math.min(.45,Math.max(.04,mv.t0/mv.dur));
    const b=Math.min(.98,Math.max(a+.08,mv.t1/mv.dur));
    const k=vurusEgrisi(tt,a,b);
    // ağırlık aktarımı: kurulumda arka ayağa, vuruşta öne (ağır hamlede belirgin)
    const agr=Math.min(1,(mv.dmg||6)/15);
    P.hipShift=(5+8*agr)*Math.max(-.85,k);
    const kk=Math.max(0,k);                          // yalnız uzanım (0..1)
    const w=Math.min(1,tt/Math.max(.02,a)), ww=w*w*(3-2*w); // yumuşak hazırlık
    /* KAMÇI: kalça-omuz önce (k), diz-dirsek-kaval SONRA (k2) varır.
       Böylece bacak tek parça sallanmaz; diz fırlar, kaval arkadan şaklar. */
    const gec=(b-a)*.22, kilit2=Math.min(.97,b+.18);
    const k2=(tt-gec<=b)?vurusEgrisi(Math.max(0,tt-gec),a,b)
      :(tt<=kilit2)?1
      :1-(r=>r*r*(3-2*r))(Math.min(1,(tt-kilit2)/Math.max(.06,1-kilit2)));
    const kk2=Math.max(0,k2);
    /* tekme şambrı: duruş → diz katlı kalkar → uyluk hedefe döner (kk) →
       kaval kamçı gibi açılır (kk2) → geri toplanır.
       FLAMİNGO (Hwoarang): tekme zincirinin 2.+ halkasında bacak yere İNMEZ —
       hazırlık duruştan değil şambrdan başlar, tekmeden tekmeye havada akar. */
    const flamingo=(f.chainIdx||0)>0&&f.mvKind==='k';
    const bacak=(dur,sam,uzat)=>{
      const bas=flamingo?[lerp(sam[0],uzat[0],.25),lerp(sam[1],uzat[1],.2)]:dur; // zincirde: yarı toplanmış şambrdan
      /* kaval, uyluk yolun %45'indeyken TAM açılır: kalan yol düz bacakla
         KALÇADAN yükseliş (tekvando "rising kick" formu). Katlı diz havada
         gezmez, iniş de düz bacakla başlar, toplanma en altta olur. */
      const snap=Math.min(1,kk*2.2);
      return tt<a
        ?[lerp(bas[0],sam[0],ww),lerp(bas[1],sam[1],ww)]
        :[lerp(sam[0],uzat[0],kk),lerp(sam[1],uzat[1],snap)];
    };
    switch(mv.anim){
      case 'jab': // boksör jabı: omuz döner, dirsek son anda kilitlenir
        P.lean=.16*k;P.omur=.08*kk;P.head=-.14*kk;P.reach=6*kk;P.twist=.55*kk;P.hipTw=.25*kk;
        P.aR=[lerp(-.4,1.32,k),lerp(.5,.03,kk2)];
        P.aL=[lerp(.55,.95,kk),lerp(.9,1.3,kk)];
        P.lL=[lerp(.28,.38,kk),lerp(.12,.3,kk)];
        P.lR=[lerp(-.22,-.48,kk),lerp(.28,.06,kk)];break;
      case 'cross': // boksör düz vuruşu: kalça→omuz→yumruk zinciri sırayla
        P.lean=.3*k;P.omur=.14*kk;P.head=-.22*kk;P.reach=9*kk;P.twist=kk;P.hipTw=.5*kk;
        P.aR=[lerp(-.5,1.48,k),lerp(.6,.02,kk2)];
        P.aL=[lerp(.6,1.0,kk),lerp(1.0,1.35,kk)];
        P.lL=[lerp(.32,.44,kk),lerp(.15,.34,kk)];
        P.lR=[lerp(-.25,-.55,kk),lerp(.3,.04,kk)];P.dip=3*k;break;
      case 'backfist':
        P.lean=.3*k;P.head=.25*k;P.reach=8*kk;P.twist=.8*kk;P.hipTw=.4*kk;
        P.aR=[lerp(-2.2,1.7,k),lerp(.45,.1,kk2)];P.aL=[lerp(.8,-1,k),.5];
        P.lL=[lerp(.45,.55,kk),.2];P.lR=[lerp(-.45,-.62,kk),lerp(.4,.14,kk)];P.dip=-2*k;break;
      case 'hook': // kanca: gövde tam döner, dirsek bükülü kalır (kanca budur)
        P.lean=.3*k;P.omur=.12*kk;P.head=-.12*kk;P.reach=7*kk;P.twist=.85*kk;P.hipTw=.5*kk;
        P.aR=[lerp(-1.6,1.2,k),lerp(.9,.4,kk2)];
        P.aL=[lerp(.6,1.0,kk),lerp(1.0,1.3,kk)];
        P.lL=[lerp(.3,.42,kk),lerp(.15,.3,kk)];
        P.lR=[lerp(-.25,-.5,kk),lerp(.3,.08,kk)];P.dip=3*k;break;
      case 'hay':{ // balyoz: tüm beden savruluşa katılır
        const wind=Math.min(1,tt/.45), swing=Math.max(0,(tt-.45)/.55);
        P.aR=swing>0?[lerp(-2.4,1.5,swing),.1]:[lerp(-.4,-2.4,wind),.2];
        P.lean=lerp(-.18,.42,swing);P.omur=swing>0?lerp(-.25,.3,swing):-.25*wind;P.reach=9*swing;P.head=-.15*swing;P.twist=swing;P.hipTw=.5*swing;
        P.aL=[lerp(.7,1.0,swing),lerp(.9,1.2,swing)];
        P.lL=[lerp(.4,.5,swing),lerp(.25,.35,swing)];
        P.lR=[lerp(-.35,-.62,swing),lerp(.4,.1,swing)];P.dip=5*swing;break;}
      case 'palm':
        P.lean=.18*k;P.head=.06*k;P.reach=6*kk;P.twist=.6*kk;P.hipTw=.3*kk;
        P.aR=[lerp(-.3,1.25,k),lerp(.6,.1,kk2)];
        P.aL=[lerp(.6,.95,kk),lerp(.9,1.3,kk)];
        P.lL=[lerp(.28,.36,kk),lerp(.13,.28,kk)];
        P.lR=[lerp(-.22,-.45,kk),lerp(.28,.08,kk)];break;
      case 'front': // ön tekme: omurga geriye kavisli, gard çenede, baş rakibe kilitli
        P.lean=-.5*k;P.omur=-.3*kk;P.head=.7*kk;P.hipTw=.85*kk;P.twist=.35*kk;
        P.hipShift+=7*kk;                           // kalça itişi: gövde geride, kalça önde
        P.lR=bacak([-.15,.15],[.8,-1.7],[1.9,-.04]); // taban GÖĞÜS hizasına fırlar
        P.lL=[lerp(.1,.2,kk),lerp(.25,.08,kk)];     // destek bacağı dikleşir
        P.aL=[lerp(.9,.8,kk),lerp(.5,1.35,kk)];     // ön el ÇENE GARDINDA kalır
        P.aR=[lerp(-.9,-1.05,kk),lerp(.5,.45,kk)];  // arka kol alçak denge
        P.dip=-3*(tt<a?ww:1)-3*kk;break;            // gövde tekmeyle yükselir
      case 'side': // yan tekme: omurga kavisli, NİŞAN KOLU bacak hizasında hedefi gösterir
        P.lean=-.6*k;P.omur=-.36*kk;P.head=.85*kk;P.hipTw=.9*kk;P.twist=.5*kk;
        P.hipShift+=6*kk;
        P.lR=bacak([-.15,.15],[.7,-1.6],[1.95,-.03]); // topuk GÖĞÜS hizasına
        P.lL=[lerp(.15,.22,kk),lerp(.3,.08,kk)];
        P.aL=[lerp(1.1,1.5,kk),lerp(.6,.12,kk)];    // nişan kolu: tekmeyle aynı çizgide uzanır
        P.aR=[lerp(-1.1,-1.3,kk),lerp(.6,.35,kk)];  // arka kol karşı denge
        P.dip=-3*(tt<a?ww:1)-3*kk;break;
      case 'yeop':{ // YAN TEKME (yeop chagi) — Gölge'ye özel, gerçek 4 fazlı biyomekanik
        // Fazlar (tt): 0-.42 HAZIRLIK+CHAMBER · .42-.64 UZANIM · .64-.86 GERİ · .86-1 GARDA İN
        const cl=(e0,e1)=>Math.min(1,Math.max(0,(tt-e0)/(e1-e0)));
        const ss=u=>u*u*(3-2*u);
        const cham=ss(cl(0,.42));                       // diz YUKARI, kaval katlanır (topuk kalçaya)
        const extP=(u=>u*u*u)(cl(.42,.64));             // KÜBİK ease-in: chamber'da bekler, sonra PATLAR (hız impact'te zirve)
        const recP=(u=>1-(1-u)*(1-u))(cl(.64,.86));     // hızlı geri toplama (ease-out)
        const drop=ss(cl(.86,1));
        // "committed" açılım: hazırlıkta yarım, uzanımda tam, sonra geri toplanır
        const drive=tt<.42?.3*cham:tt<.64?lerp(.3,1,extP):tt<.86?lerp(1,.12,recP):.12*(1-drop);
        // TEKME BACAĞI (lR): duruş → SIKI chamber → DOĞRUSAL uzanım → chamber → duruş
        // CH: uyluk yatayın üstü (diz yukarı-hedefte), kaval yatay-geri (topuk kalçaya) · EX: bacak düz, topuk önde
        const ST=[-.15,.15], CH=[1.95,-3.5], EX=[1.5,.1];
        let th,sh;
        if(tt<.42){th=lerp(ST[0],CH[0],cham);sh=lerp(ST[1],CH[1],cham);}
        else if(tt<.64){th=lerp(CH[0],EX[0],extP);sh=lerp(CH[1],EX[1],extP);}
        else if(tt<.86){th=lerp(EX[0],CH[0],recP);sh=lerp(EX[1],CH[1],recP);}
        else{th=lerp(CH[0],ST[0],drop);sh=lerp(CH[1],ST[1],drop);}
        P.lR=[th,sh];
        P.lL=[lerp(.15,.26,drive),lerp(.28,.04,drive)]; // destek bacağı yük altında dikleşir (pivot htw'den)
        P.lean=-.72*drive;P.omur=-.46*drive;P.head=1.0*drive; // eşek-tekmesi karşı yaslanma + baş hedefe kilitli
        P.hipTw=.98*drive;P.twist=.2*drive;                   // kalça devrilir (omuz dönüşünü çoğunlukla profil yapar)
        // YÖN/PROFİL: chamber'da yana dönmeye başlar, uzanımda TAM profile döner, geri toplanınca cepheye
        P.profil=tt<.42?.5*cham:tt<.64?lerp(.5,1,extP):tt<.86?lerp(1,0,recP):0;
        P.hipShift=tt<.42?lerp(0,-5,cham):tt<.64?lerp(-5,8,extP):lerp(8,0,tt<.86?recP:drop); // ağırlık arkaya→öne akar
        P.aL=[lerp(.95,1.18,drive),lerp(1.05,1.3,drive)];   // ön gard çene hizasında, hedefe dönük
        P.aR=[lerp(-.9,-1.45,drive),lerp(.5,.3,drive)];     // arka kol dengede geriye
        P.dip=-3*drive;break;}                              // kalça itişiyle hafif yükseliş
      case 'round': // dönen tekme (tekvando): omurga yatar, kol aşağı süpürülür, gard çenede
        P.lean=-.58*k;P.omur=-.42*kk;P.head=.85*kk;P.hipTw=kk;P.twist=.6*kk;
        P.hipShift+=6*kk;
        P.lR=bacak([-.3,.15],[.55,-1.5],[2.3,-.05]); // ayak KAFA hizasına savrulur
        P.lL=[lerp(.2,.28,kk),lerp(.35,.1,kk)];
        P.aL=[lerp(.9,.6,kk),lerp(.5,1.45,kk)];     // ön el çene gardında
        P.aR=[lerp(-.9,-1.4,k),lerp(.5,.3,kk)];     // tekme tarafı kol aşağı-geri süpürülür (denge)
        P.dip=-9*k;break;
      case 'axe':{ // balta: bacak gergin yükselir, topuk kamçı gibi iner
        const up=Math.min(1,tt/.5), down=Math.max(0,(tt-.5)/.5);
        P.hipTw=.6*Math.max(up,down);
        P.lR=down>0?[lerp(2.3,.9,down),lerp(-.05,-.3,down)]
          :[lerp(flamingo?.5:-.15,2.3,up),lerp(flamingo?-.9:-.5,-.05,up)]; // zincirde şambrdan yükselir
        P.lean=down>0?.15:-.2;P.lL=[.15,.3];
        P.aL=[1.0,.6];P.aR=[-1.0,.6];P.dip=down*5;break;}
      case 'sweep': // süpürme: bacak koltuktan kamçılanır, kalça döner
        P.dip=10*k;P.lean=.2*k;P.hipTw=.8*kk;P.twist=.4*kk;
        P.lL=[.6,.9];P.lR=bacak([-.2,.1],[.3,-1.1],[1.28,-.04]);
        P.aL=[1.1,.9];P.aR=[.4,1.1];break;
      case 'knee': // diz: kalça öne fırlar, kollar rakibi içeri çeker
        P.lean=.15*k;P.reach=5*kk;P.hipTw=.6*kk;P.twist=.4*kk;
        P.lR=[lerp(-.15,1.0,k),lerp(.15,-1.35,k)];
        P.lL=[lerp(.2,.3,kk),lerp(.2,.1,kk)];
        P.aL=[lerp(1.2,.9,kk),.6];P.aR=[lerp(1.0,1.3,kk),lerp(.7,.9,kk)];P.dip=2*k;break;
      case 'shoulder':
        P.lean=.55*k;P.head=.2*k;
        P.aL=[.9,1.6];P.aR=[.8,1.7];
        P.lL=[.55,.3];P.lR=[-.55,.4];P.dip=3*k;break;
      case 'upper':{ // aparkat: bacaklardan gelen güç gövdeyi taşır
        const rise=Math.min(1,tt/((mv.t1)/mv.dur));
        P.dip=lerp(14,-5,rise);P.lean=lerp(.15,-.1,rise);P.omur=lerp(.25,-.15,rise);P.head=-.15*rise;P.reach=4*rise;
        P.twist=.7*rise;P.hipTw=.5*rise;
        P.aR=[lerp(.3,2.35,rise),lerp(1.2,.15,rise)];P.aL=[lerp(.9,1.05,rise),lerp(1.1,1.3,rise)];
        P.lL=[lerp(.8,.3,rise),lerp(1.1,.2,rise)];P.lR=[lerp(-.6,-.2,rise),lerp(-1.2,-.3,rise)];break;}
      case 'lowkick': // alçak tekme: gövde tekmenin üstüne kavislenir
        P.dip=18;P.lean=.15;P.omur=.14*kk;P.head=-.1*kk;P.hipTw=.6*kk;P.twist=.3*kk;
        P.lR=bacak([-.2,.1],[.45,-1.3],[1.38,-.05]);
        P.lL=[.7,1.3];
        P.aL=[1.0,1.0];P.aR=[lerp(.5,.2,kk),1.2];break;
      case 'flykick':
        P.lean=-.3;P.head=-.1;P.reach=4*kk;
        P.lR=[lerp(.4,1.75,Math.min(1,tt*2.2)),lerp(-.9,-.05,Math.min(1,tt*2.2))];P.lL=[-.4,1.4];
        P.aL=[1.3,.4];P.aR=[-1.2,.5];break;
      case 'airpunch':
        P.lean=.2*k;P.reach=5*kk;P.head=-.04*kk;P.twist=.6*kk;
        P.aR=[lerp(-.3,1.4,k),lerp(.5,.05,kk2)];P.aL=[lerp(.9,1.05,kk),1.2];
        P.lL=[.5,1.1];P.lR=[-.4,1.2];break;
      case 'shuto': // bıçak el: dıştan içe, boyun hizasına el kesişi
        P.lean=.18*k;P.head=.1*k;P.reach=6*kk;P.twist=.7*kk;P.hipTw=.35*kk;
        P.aR=[lerp(-1.6,1.15,k),lerp(.6,.15,kk2)];
        P.aL=[lerp(.6,.95,kk),lerp(.9,1.25,kk)];
        P.lL=[lerp(.3,.4,kk),lerp(.15,.28,kk)];
        P.lR=[lerp(-.25,-.48,kk),lerp(.3,.08,kk)];P.dip=1.5*k;break;
      case 'slide': // kayma tekmesi: geriye yatıp zeminde ileri kayış
        P.dip=26;P.lean=-.55;P.head=.15;
        P.lR=[lerp(.2,1.5,Math.min(1,tt*1.8)),-.06];P.lL=[-.7,1.2];
        P.aL=[-1.2,.5];P.aR=[-1.6,.4];break;
      case 'bodyhook': // gövde çengeli: içeri adım + bele saplanan kanca
        P.lean=.32*k;P.dip=8*k;P.omur=.22*kk;P.head=-.15*kk;P.reach=7*kk;P.twist=.8*kk;P.hipTw=.45*kk;
        P.aR=[lerp(-1.2,1.05,k),lerp(.9,.45,kk2)];
        P.aL=[lerp(.65,1.0,kk),lerp(1.0,1.25,kk)];
        P.lL=[lerp(.35,.5,kk),lerp(.2,.4,kk)];
        P.lR=[lerp(-.28,-.5,kk),lerp(.32,.1,kk)];break;
      case 'teep':{ // itme tekmesi: diz kalkar, taban göbeğe iter
        const up=Math.min(1,tt/.45), push=Math.max(0,(tt-.45)/.55);
        P.lean=-.28*k;P.omur=-.16*kk;P.head=.4*kk;
        P.lR=push>0?[lerp(.9,1.7,push),lerp(-1.2,-.08,push)]:[lerp(-.15,.9,up),lerp(.15,-1.2,up)];
        P.lL=[.12,.28];
        P.aL=[lerp(1.0,.85,kk),lerp(.55,1.25,kk)];  // gard bozulmaz (teep formu)
        P.aR=[lerp(-1.0,-.95,kk),.5];P.dip=-2*k;break;}
      case 'spinhook':{ // dönen topuk: gövde ters yöne burulur, topuk tepeden süpürür
        const wind=Math.min(1,tt/.5), spin=Math.max(0,Math.min(1,(tt-.5)/.35));
        if(spin<=0){ // burulma: kafa arkaya döner, kollar gövdeye sarılır
          P.lean=.35*wind;P.head=.85*wind;
          P.aL=[lerp(.5,1.3,wind),.9];P.aR=[lerp(-.4,.9,wind),1.1];
          P.lL=[.3,.3];P.lR=[lerp(-.15,-.7,wind),-.25];P.dip=6*wind;
        }else{ // dönüş: bacak arkadan tepeye, kollar savrulur, kafa öne çevrilir
          P.lean=lerp(.35,-.3,spin);P.head=lerp(.85,-.4,spin);
          P.lR=[lerp(-2.3,2.35,spin),-.05];P.lL=[.25,.3];
          P.aL=[lerp(1.3,-.8,spin),.5];P.aR=[lerp(.9,-.6,spin),.6];
          P.dip=lerp(6,-6,spin);
        }
        break;}
      case 'crescent': // ay tekmesi: havada yarım ay — kol karşı süpürülür, baş hedefte
        P.lean=-.15;P.omur=-.2*kk;P.head=.45*kk;P.hipTw=.7*kk;
        P.lR=[lerp(-.8,2.2,k),lerp(-.7,-.05,Math.min(1,kk*2.2))];P.lL=[.4,1.3];
        P.aL=[lerp(1.5,1.1,kk),lerp(.4,1.1,kk)];P.aR=[lerp(-1.3,-1.5,kk),.4];break;
    }
  }
  if(s==='jump'){ // yükseliş→tepe→düşüş: hıza bağlı akıcı geçiş (kasılma→açılma)
    const k=Math.min(1,Math.max(0,.5+f.vy/1100)); // 0 tam yükseliş · 1 tam düşüş
    P.lL=[lerp(.7,.35,k),lerp(1.15,.5,k)];
    P.lR=[lerp(-.55,-.3,k),lerp(-1.25,-.6,k)];
    P.aL=[lerp(1.7,.85,k),.4];P.aR=[lerp(-1.6,-.75,k),.5];
    P.head=-.1+.05*k;
    P.lean=((f.vx||0)/(f.ch.speed||220))*.12*f.facing; // sürüklenme yönüne eğilme
  }
  if(s==='crouch'){
    P.dip=22;P.lean=.12;P.head=-.05;
    P.lL=[.85,1.5];P.lR=[-.75,1.55];
    P.aL=[.9,1.4];P.aR=[.6,1.5];
  }
  if(s==='block'){P.lean=.08;P.aL=[.9,1.5];P.aR=[.7,1.7];P.lL=[.3,.2];P.lR=[-.25,.3];}
  if(s==='crouchblock'){ // çömelik blok: çömelme + önde koruma kolları
    P.dip=22;P.lean=.1;P.head=-.05;
    P.lL=[.85,1.5];P.lR=[-.75,1.55];
    P.aL=[.95,1.55];P.aR=[.75,1.7];
  }
  if(s==='hit'){ // keskin geri savrulma + ilk anlarda baş sarsıntısı, sonra oturma
    const k=Math.pow(1-Math.min(1,t/.32),1.5);
    const w=Math.sin(t*34)*k*.12;
    P.lean=-.32*k;P.omur=-.2*k;P.head=-.5*k+w;
    P.aL=[.2+.3*k,.8];P.aR=[-.6-.3*k,.8];P.dip=5*k;
  }
  if(s==='stagger'){ // geriye sendeleme: kollar savrulur, ayaklar karışır
    const k=Math.min(1,t/.45), w=Math.sin(t*16);
    P.lean=-.38*(1-k*.4);P.head=-.3*(1-k);
    P.aL=[.9-w*.3,.5];P.aR=[-1.1+w*.3,.4];
    P.lL=[w*.45-.1,.35];P.lR=[-w*.45-.1,.4];
    P.dip=3+Math.abs(w)*2;
  }
  if(s==='crumple'){ // önce dizler ANİDEN çözülür, sonra gövde süzülerek çöker
    const diz=Math.min(1,t/.16), gov=Math.max(0,Math.min(1,(t-.16)/.39));
    const g2=gov*gov*(3-2*gov);
    P.dip=8+16*diz+22*g2;
    P.lean=.12+.38*g2;P.omur=.3*g2;P.head=.12+.5*g2+.08*Math.sin(t*28)*(1-g2);
    P.lL=[.7+.5*g2,1.2+.5*diz];P.lR=[-.6-.4*g2,-(1.3+.5*diz)];
    P.aL=[.6-.4*g2,.9-.7*g2];P.aR=[-.5+.2*g2,.8-.6*g2];
  }
  if(s==='down'){ // sırtüstü yerde (inişte sönümlenen küçük sekme)
    const sek=Math.max(0,Math.sin(t*20))*3.5*Math.max(0,1-t/.3);
    P.dip=46-sek;P.lean=f.facing*-1.5;P.head=.7-sek*.04;
    P.aL=[1.3,.25];P.aR=[-1.4,.2];P.lL=[1.1,.35];P.lR=[-1.0,.25];
  }
  if(s==='getup'){ // yerden doğrulma: yumuşak ivmeli kalkış (bu sırada dokunulmaz)
    const r=Math.min(1,t/.4), k=1-r*r*(3-2*r);
    P.dip=10+36*k;P.lean=f.facing*-1.5*k+.15*(1-k);P.omur=.22*k;P.head=.5*k;
    P.lL=[.8,.3+1.2*k];P.lR=[-.7,.35+1.2*k];
    P.aL=[1.0,.3+1.0*k];P.aR=[.5,.3+1.1*k];
  }
  if(s==='special'){
    const k=Math.sin(Math.min(1,t/f.specDur())*Math.PI);
    if(f.ch.id==='golge'){P.lean=.5;P.aR=[1.4,.1];P.aL=[-.8,.5];P.lL=[.9,.3];P.lR=[-.7,.6];}
    if(f.ch.id==='beton'){P.lean=.35*k;P.aR=[lerp(-2.4,1.1,Math.min(1,t/.45)),.15];P.aL=[.6,.7];P.dip=6*k;P.lL=[.5,.4];P.lR=[-.4,.5];}
    if(f.ch.id==='volt'){P.aL=[2.6,.1];P.aR=[2.6,.1];P.head=.15;P.dip=-3;}
    if(f.ch.id==='kalem'){ // geniş silgi savuruşu: arkadan öne büyük yay
      const kk=Math.min(1,t/.62);
      P.lean=lerp(-.25,.35,kk);P.head=.1;
      P.aR=[lerp(-2.0,1.6,Math.min(1,kk*1.4)),.15];P.aL=[.9,1.0];
      P.lL=[.45,.2];P.lR=[-.4,.35];P.dip=3*Math.sin(kk*Math.PI);
    }
  }
  if(s==='throwing'){ // rakibi kavrayıp savurma
    const k=Math.min(1,t/.25);
    P.lean=.3*k;P.aL=[1.2,.3];P.aR=[1.0,.4]; // iki el önde kavrama
    P.lL=[.4,.2];P.lR=[-.35,.3];P.dip=4*k;
    if(f.ch.id==='beton'&&t>.35){P.lean=-.25;P.dip=-3;P.aL=[1.9,.2];P.aR=[1.6,.3];} // kaldırma
    if(f.ch.id==='golge'&&t>.3){P.lean=-.3;P.head=-.2;P.aL=[2.0,.2];P.aR=[-1.5,.4];} // savurma
    if(f.ch.id==='volt'&&t>.3){P.aL=[1.3,.25];P.aR=[1.1,.35];P.head=.1;} // tutup şok
  }
  if(s==='thrown'){ // kavranmış: geriye kaykılır, kollar çırpınır
    const w=Math.sin(t*14);
    P.lean=-.2;P.head=-.3;
    P.aL=[1.5+w*.2,.4];P.aR=[-1.2-w*.2,.5];
    P.lL=[.3,.5];P.lR=[-.3,.6];P.dip=6;
  }
  if(s==='ko'){P.dip=44;P.lean=f.facing*-1.4;P.head=.8;P.aL=[1.4,.2];P.aR=[-1.5,.2];P.lL=[1.2,.3];P.lR=[-1.1,.2];}
  /* iniş yaylanması: yere değince dizler düşüş şiddetine orantılı çöküp
     toparlanır (fighter.js landT/landK kurar — salt görsel, kontrolü kilitlemez) */
  if(f.landT>0&&(s==='idle'||s==='walk')){
    const k=Math.sin((f.landT/.2)*Math.PI)*(f.landK||0);
    P.dip+=12*k;P.lean+=.08*k;P.head+=.1*k;
    P.aL[0]+=.3*k;P.aR[0]-=.3*k;         // kollar denge için hafif açılır
    P.lL[0]+=.16*k;P.lL[1]+=.55*k;       // dizler bükülür, ayaklar hafif açılır
    P.lR[0]-=.14*k;P.lR[1]-=.55*k;
  }
  /* dönüş esnemesi: yön değiştirirken gövde bir an çöküp toparlanır (ayna
     çevrilmesini maskeler, ağırlık hissi verir) — fighter.js turnT kurar */
  if(f.turnT>0&&(s==='idle'||s==='walk'||s==='crouch')){
    const k=Math.sin((f.turnT/.14)*Math.PI);
    P.dip+=5*k;P.head-=.16*k;P.lean+=.09*k;
  }
  return P;
}
