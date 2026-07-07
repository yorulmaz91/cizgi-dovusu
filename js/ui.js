/* ============================================================
   ARAYÜZ — HUD (can/skil/skor), seçim / VS / sonuç ekranları
   ============================================================ */
import {CHARS} from './characters.js';
import {Fighter} from './fighter.js';
import {keys,tap} from './input.js';
import {INK,PAPER} from './effects.js';
import {VW,VH,drawBG} from './render.js';
import {game} from './main.js';

export function drawHUD(g){
  const bw=VW*0.36,bh=13,y=26;
  for(const[f,i]of[[game.p1,0],[game.p2,1]]){
    const x=i===0?20:VW-20-bw;
    g.strokeStyle=INK;g.lineWidth=1.6;
    g.strokeRect(x,y,bw,bh);
    const w=(bw-4)*f.hp/f.maxHp;
    g.fillStyle=INK;
    g.fillRect(i===0?x+2+(bw-4-w):x+2,y+2,w,bh-4);
    g.font='700 12px Space Grotesk';g.fillStyle=INK;
    g.textAlign=i===0?'left':'right';
    g.fillText(f.ch.name+(f.isAI?' (AI)':''),i===0?x:x+bw,y+30);
    // skil bekleme
    g.strokeStyle=INK;g.lineWidth=1;
    g.strokeRect(x,y+bh+6,bw*.4,4);
    g.fillStyle=INK;
    const cw=bw*.4*(1-f.cd/f.ch.specCd);
    g.fillRect(i===0?x:x+bw*.6+(bw*.4-cw),y+bh+6,cw,4);
    g.font='12px Space Grotesk';
    g.fillText('★'.repeat(game.wins[i])||' ',i===0?x:x+bw,y+46);
  }
  g.textAlign='center';g.font='700 26px Space Grotesk';g.fillStyle=INK;
  g.fillText(game.scene==='training'?'∞':Math.ceil(game.timer),VW/2,y+22);
}

/* ortak hamle paneli: ÜSTTEN açılan ortalanmış kart — buton alanlarına girmez
   (seçim ekranındaki HAMLELER ve antrenman LİSTE aynı bileşeni kullanır) */
export function drawMovePanel(g,c){
  const yk={high:'ÜST',mid:'ORTA',low:'ALÇAK'};
  const et=m=>m.name+' ['+(yk[m.height]||'ORTA')+']';
  const L=[
    ['700',c.name+' — HAMLELER'],
    ['500','YUM: '+c.moves.p.map(et).join(' → ')],
    ['500','TEK: '+c.moves.k.map(et).join(' → ')],
    ['500','▼+YUM: '+et(c.moves.cp)+' (fırlatır)   ·   ▼+TEK: '+et(c.moves.ck)],
    ['500','havada YUM: '+et(c.moves.jp)+'   ·   havada TEK: '+et(c.moves.jk)],
    ['500','FIRLAT (veya YUM+TEK): '+c.throwName+' — blok işlemez'],
    ['500','SKİL: '+c.specName+' — '+c.specDesc],
    ['500','FATALITY: '+c.fatalName],
    ['500','Blok: ayakta ÜST+ORTA keser · çömelik ALÇAK keser · çömelene ÜST ıskalar'],
  ];
  const satir=VH<500?14:16;
  const w=Math.min(640,VW-32), h=L.length*satir+24;
  const x0=(VW-w)/2, y0=56;
  g.save();
  g.fillStyle=INK;g.globalAlpha=.9;g.fillRect(x0+3,y0+3,w,h); // gölge
  g.globalAlpha=.96;g.fillStyle=PAPER;g.fillRect(x0,y0,w,h);
  g.globalAlpha=1;g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x0,y0,w,h);
  g.textAlign='center';g.fillStyle=INK;
  L.forEach((s,i)=>{
    g.font=s[0]+' '+(VH<500?10:11)+'px Space Grotesk';
    g.fillText(s[1],VW/2,y0+20+i*satir);
  });
  g.restore();
}
/* antrenman modu eski adıyla aynı paneli kullanır */
export function drawTrainPanel(g){drawMovePanel(g,game.p1.ch);}

/* çerçeveli tuval düğmesi; dokunulduysa true döner */
function cizButon(g,x,y,w,h,label,kucuk){
  g.save();
  g.fillStyle=INK;g.fillRect(x+2.5,y+3,w,h); // alt gölge (cbtn stili)
  g.fillStyle=PAPER;g.strokeStyle=INK;g.lineWidth=2;
  g.fillRect(x,y,w,h);g.strokeRect(x,y,w,h);
  g.fillStyle=INK;g.textAlign='center';
  g.font='700 '+(kucuk?12:15)+'px Space Grotesk';
  g.fillText(label,x+w/2,y+h/2+(kucuk?4:5));
  g.restore();
  return tap.on&&tap.x>=x&&tap.x<=x+w&&tap.y>=y&&tap.y<=y+h;
}
export function centerText(g,txt,size,y,sub){
  g.textAlign='center';
  g.font='700 '+size+'px Space Grotesk';
  g.fillStyle=INK;
  g.fillText(txt,VW/2,y||VH*0.4);
  if(sub){g.font='500 14px Space Grotesk';g.globalAlpha=.55;g.fillText(sub,VW/2,(y||VH*0.4)+34);g.globalAlpha=1;}
}

/* ---------------- sahneler ---------------- */
const ZORLUKLAR=[
  {key:'kolay', ad:'KOLAY', desc:'Rahat başlangıç: az hasar, yavaş saldırılar'},
  {key:'normal',ad:'NORMAL',desc:'Dengeli rakip'},
  {key:'zor',   ad:'ZOR',   desc:'Tam hasar, hızlı zincirler, sık blok'}
];

export function drawSelect(g,dt){
  drawBG(g);
  centerText(g,'ÇİZGİ DÖVÜŞÜ',34,VH*0.13,'dövüşçünü seç');
  game.selCd-=dt;
  if(game.selCd<=0){
    if(keys.left){game.selIdx=(game.selIdx+CHARS.length-1)%CHARS.length;game.selCd=.25;}
    if(keys.right){game.selIdx=(game.selIdx+1)%CHARS.length;game.selCd=.25;}
    if(keys.punch||keys.special){
      game.selCharIdx=game.selIdx;
      game.diffIdx=Math.max(0,ZORLUKLAR.findIndex(z=>z.key===game.difficulty));
      game.scene='difficulty';game.selCd=.3;
      keys.punch=keys.special=0;
    }
    else if(keys.kick){ // TEK: antrenman modu
      game.selCharIdx=game.selIdx;
      keys.kick=0;
      game.startTraining(game.selCharIdx);
    }
  }
  const gap=Math.min(160,VW/3.2);
  CHARS.forEach((c,i)=>{
    const x=VW/2+(i-game.selIdx)*gap, sel=i===game.selIdx;
    const dummy=new Fighter(c,x,1,false);dummy.y=VH*0.52;dummy.st=performance.now()/1000+i;
    g.save();g.globalAlpha=sel?1:.22;
    if(sel){
      g.strokeStyle=INK;g.lineWidth=2;
      g.setLineDash([6,5]);
      g.strokeRect(x-64,VH*0.52-150,128,172);
      g.setLineDash([]);
    }
    dummy.draw(g);g.restore();
    if(sel){
      centerText(g,c.name,26,VH*0.66);
      // sade kart: kimlik + yıldızlar; detaylar HAMLELER panelinde
      const oy=VH*0.66, s=VH<500?.8:1;
      g.font='500 13px Space Grotesk';g.fillStyle=INK;g.textAlign='center';
      g.globalAlpha=.55;
      g.fillText(c.tagline,VW/2,oy+20*s);
      g.globalAlpha=1;
      const yildiz=n=>'★★★'.slice(0,n)+'☆☆☆'.slice(0,3-n);
      const guc=c.punch+c.kick>=26?3:c.punch+c.kick>=18?2:1;
      const hiz=c.speed>=250?3:c.speed>=200?2:1;
      const mzl=Math.max(...c.moves.p.map(m=>m.range),...c.moves.k.map(m=>m.range));
      const men=mzl>=85?3:mzl>=78?2:1;
      g.font='700 14px Space Grotesk';
      g.fillText('GÜÇ: '+yildiz(guc)+'   HIZ: '+yildiz(hiz)+'   MENZİL: '+yildiz(men),VW/2,oy+40*s);
      // belirgin düğmeler: DÖVÜŞ · ANTRENMAN · (küçük) HAMLELER
      const bw=132*s,bh=36*s,ara=14*s,by=oy+54*s;
      const dovusTik=cizButon(g,VW/2-ara/2-bw,by,bw,bh,'DÖVÜŞ');
      const antrTik=cizButon(g,VW/2+ara/2,by,bw,bh,'ANTRENMAN');
      const hw=118*s,hh=27*s;
      const hamleTik=cizButon(g,VW/2-hw/2,by+bh+10*s,hw,hh,'HAMLELER '+(game.movePanel?'▲':'▼'),true);
      if(dovusTik){
        tap.on=false;
        game.selCharIdx=game.selIdx;
        game.diffIdx=Math.max(0,ZORLUKLAR.findIndex(z=>z.key===game.difficulty));
        game.scene='difficulty';game.selCd=.3;
      }else if(antrTik){
        tap.on=false;
        game.selCharIdx=game.selIdx;
        game.startTraining(game.selCharIdx);
      }else if(hamleTik){
        tap.on=false;
        game.movePanel=!game.movePanel;
      }
    }
  });
  if(game.movePanel)drawMovePanel(g,CHARS[game.selIdx]); // detaylar üst panelde
  g.font='500 12px Space Grotesk';g.fillStyle=INK;g.globalAlpha=.4;g.textAlign='center';
  g.fillText('◀ ▶ karakter seç',VW/2,VH*0.945);
  g.globalAlpha=1;
}
export function drawDifficulty(g,dt){
  drawBG(g);
  centerText(g,'ZORLUK SEÇ',34,VH*0.2,'AI rakibin seviyesi — tercihin hatırlanır');
  game.selCd-=dt;
  if(game.selCd<=0){
    if(keys.left){game.diffIdx=(game.diffIdx+ZORLUKLAR.length-1)%ZORLUKLAR.length;game.selCd=.25;}
    if(keys.right){game.diffIdx=(game.diffIdx+1)%ZORLUKLAR.length;game.selCd=.25;}
    if(keys.block){game.scene='select';game.selCd=.3;keys.block=0;}
    else if(keys.punch||keys.special){
      game.difficulty=ZORLUKLAR[game.diffIdx].key;
      try{localStorage.setItem('cd-zorluk',game.difficulty);}catch(e){}
      keys.punch=keys.special=0;
      game.start(game.selCharIdx);
    }
  }
  const gap=Math.min(220,VW/3.4);
  ZORLUKLAR.forEach((z,i)=>{
    const x=VW/2+(i-1)*gap, sel=i===game.diffIdx;
    g.save();g.globalAlpha=sel?1:.3;
    g.textAlign='center';g.fillStyle=INK;
    g.font=(sel?'700 30px':'500 22px')+' Space Grotesk';
    g.fillText(z.ad,x,VH*0.48);
    if(sel){
      g.strokeStyle=INK;g.lineWidth=2;g.setLineDash([6,5]);
      g.strokeRect(x-72,VH*0.48-36,144,52);g.setLineDash([]);
    }
    g.restore();
  });
  g.font='500 14px Space Grotesk';g.fillStyle=INK;g.textAlign='center';
  g.globalAlpha=.7;g.fillText(ZORLUKLAR[game.diffIdx].desc,VW/2,VH*0.62);
  g.globalAlpha=.4;g.font='500 12px Space Grotesk';
  g.fillText('◀ ▶ seç · YUM ile dövüş · BLK geri',VW/2,VH*0.92);
  g.globalAlpha=1;
}
export function drawVS(g,dt){
  drawBG(g);game.splashT+=dt;
  centerText(g,game.pCh.name,40,VH*0.35);
  centerText(g,'— VS —',20,VH*0.45);
  centerText(g,game.eCh.name,40,VH*0.55);
  if(game.splashT>1.6){game.scene='fight';game.splash='ROUND 1';game.splashT=0;}
}
export function drawResult(g){
  drawBG(g);
  const won=game.wins[0]>=2;
  centerText(g,won?'ZAFER':'YENİLGİ',48,VH*0.36,
    won?game.pCh.name+' arenanın hakimi':'AI bu sefer kazandı');
  g.font='700 15px Space Grotesk';g.fillStyle=INK;g.textAlign='center';
  g.fillText('EKRANA DOKUN / YUM → RÖVANŞ',VW/2,VH*0.6);
  g.font='500 13px Space Grotesk';g.globalAlpha=.5;
  g.fillText('BLK → karakter değiştir',VW/2,VH*0.6+26);
  g.globalAlpha=1;
  if(performance.now()-resultLock>700){
    if(keys.block||keys.kick){
      Object.keys(keys).forEach(k=>keys[k]=0);
      game.scene='select';
    }else if(keys.punch||keys.any){
      game.rematch();
    }
  }
}
let resultLock=0;
/* sonuç ekranı giriş kilidi — ana döngü orijinaldeki sırayla çağırır */
export function armResultLock(){resultLock=resultLock||performance.now();}
export function resetResultLock(){resultLock=0;}
