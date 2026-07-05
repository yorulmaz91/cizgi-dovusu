/* ============================================================
   ARAYÜZ — HUD (can/skil/skor), seçim / VS / sonuç ekranları
   ============================================================ */
import {CHARS} from './characters.js';
import {Fighter} from './fighter.js';
import {keys} from './input.js';
import {INK} from './effects.js';
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
  g.fillText(Math.ceil(game.timer),VW/2,y+22);
}
export function centerText(g,txt,size,y,sub){
  g.textAlign='center';
  g.font='700 '+size+'px Space Grotesk';
  g.fillStyle=INK;
  g.fillText(txt,VW/2,y||VH*0.4);
  if(sub){g.font='500 14px Space Grotesk';g.globalAlpha=.55;g.fillText(sub,VW/2,(y||VH*0.4)+34);g.globalAlpha=1;}
}

/* ---------------- sahneler ---------------- */
export function drawSelect(g,dt){
  drawBG(g);
  centerText(g,'ÇİZGİ DÖVÜŞÜ',34,VH*0.13,'dövüşçünü seç');
  game.selCd-=dt;
  if(game.selCd<=0){
    if(keys.left){game.selIdx=(game.selIdx+CHARS.length-1)%CHARS.length;game.selCd=.25;}
    if(keys.right){game.selIdx=(game.selIdx+1)%CHARS.length;game.selCd=.25;}
    if(keys.punch||keys.special){game.start(game.selIdx);keys.punch=keys.special=0;}
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
      g.font='500 13px Space Grotesk';g.fillStyle=INK;g.textAlign='center';
      g.globalAlpha=.55;
      g.fillText(c.tagline,VW/2,VH*0.66+26);
      g.globalAlpha=1;
      g.fillText('SKİL: '+c.specName+' — '+c.specDesc,VW/2,VH*0.66+48);
      g.fillText('YUMRUK: '+c.moves.p.map(m=>m.name).join(' → ')+'   ·   TEKME: '+c.moves.k.map(m=>m.name).join(' → '),VW/2,VH*0.66+68);
      g.fillText('▼+YUM: '+c.moves.cp.name+' (fırlatır!)   ·   ▲+TEK: '+c.moves.jk.name,VW/2,VH*0.66+88);
      g.font='700 13px Space Grotesk';
      g.fillText('FATALITY: '+c.fatalName,VW/2,VH*0.66+108);
    }
  });
  g.font='500 12px Space Grotesk';g.fillStyle=INK;g.globalAlpha=.4;g.textAlign='center';
  g.fillText('◀ ▶ seç · YUM ile başla',VW/2,VH*0.92);
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
