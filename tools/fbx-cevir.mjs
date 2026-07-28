/* ============================================================
   MIXAMO FBX → İSKELET JSON DÖNÜŞTÜRÜCÜ
   Kullanım:
     node tools/fbx-cevir.mjs mixamo_test.fbx   → assets/anim/mixamo_test.json
     node tools/fbx-cevir.mjs --sentetik        → aynı şemada prosedürel
                                                  yürüyüş (FBX gelene kadar
                                                  hattı kanıtlamak için)
   Ne yapar: FBX'ten kemik hiyerarşisi + kare kare rotasyonları okur
   (fbx-parser, yalnız tools bağımlılığı — OYUN KODUNA FBX GİRMEZ),
   Mixamo iskeletini (~60 kemik) kuklanın eklemlerine indirger
   (kalça/diz/ayak bileği, omuz/dirsek/el bileği, omurga, boyun),
   YAN DÜZLEME İZDÜŞÜM yapar (derinlik ekseni atılır, sagital düzlem
   açıları alınır) ve bizim iskelet formatında anahtar kare dizisi
   (JSON) üretir. Oyun bu JSON'u salt VERİ olarak oynatır.
   Bilinen kayıplar: derinlik düzleşmesi (twist/hipTw/profil=0),
   omuz genişliği sabit, ayak parmak ucu yönü yaklaşık.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import {parseBinary,parseText} from 'fbx-parser';

const KOK=path.resolve(import.meta.dirname,'..');
const CIKTI=path.join(KOK,'assets','anim','mixamo_test.json');
const FPS=30;
const TICK=46186158000; // FBX zaman birimi: tik/sn

/* ---------- yardımcılar ---------- */
const D2R=Math.PI/180;
function rotMat([rx,ry,rz]){ // FBX eEulerXYZ: önce X, sonra Y, sonra Z
  const cx=Math.cos(rx*D2R),sx=Math.sin(rx*D2R);
  const cy=Math.cos(ry*D2R),sy=Math.sin(ry*D2R);
  const cz=Math.cos(rz*D2R),sz=Math.sin(rz*D2R);
  const X=[[1,0,0],[0,cx,-sx],[0,sx,cx]];
  const Y=[[cy,0,sy],[0,1,0],[-sy,0,cy]];
  const Z=[[cz,-sz,0],[sz,cz,0],[0,0,1]];
  return mul(Z,mul(Y,X));
}
function mul(A,B){
  const C=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)
    C[i][j]=A[i][0]*B[0][j]+A[i][1]*B[1][j]+A[i][2]*B[2][j];
  return C;
}
function uygula(M,v){return [
  M[0][0]*v[0]+M[0][1]*v[1]+M[0][2]*v[2],
  M[1][0]*v[0]+M[1][1]*v[1]+M[1][2]*v[2],
  M[2][0]*v[0]+M[2][1]*v[1]+M[2][2]*v[2]];}
function topla(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}

/* ---------- FBX okuma ---------- */
function fbxOku(dosya){
  const veri=fs.readFileSync(dosya);
  let agac;
  try{agac=parseBinary(veri);}catch(e){agac=parseText(veri.toString('utf8'));}
  const kok={};for(const n of agac)kok[n.name]=n;
  const nesneler=kok.Objects?.nodes||[];
  const baglar=(kok.Connections?.nodes||[]).map(n=>n.props);
  const modeller=new Map(),egriDugum=new Map(),egriler=new Map();
  for(const n of nesneler){
    const id=n.props[0];
    if(n.name==='Model'){
      const ad=String(n.props[1]).replace(/^Model::/,'').replace(/mixamorig\d*:/,'');
      const P={};
      for(const p of n.nodes?.find(x=>x.name==='Properties70')?.nodes||[]){
        if(p.props[0]==='Lcl Translation')P.t=[p.props[4],p.props[5],p.props[6]];
        if(p.props[0]==='Lcl Rotation')P.r=[p.props[4],p.props[5],p.props[6]];
        if(p.props[0]==='PreRotation')P.pre=[p.props[4],p.props[5],p.props[6]];
      }
      modeller.set(id,{id,ad,t:P.t||[0,0,0],r:P.r||[0,0,0],pre:P.pre||[0,0,0],
        ebeveyn:null,egri:{}});
    }
    if(n.name==='AnimationCurveNode')egriDugum.set(id,{id,kanal:{}});
    if(n.name==='AnimationCurve'){
      const kt=n.nodes?.find(x=>x.name==='KeyTime')?.props[0]||[];
      const kv=n.nodes?.find(x=>x.name==='KeyValueFloat')?.props[0]||[];
      egriler.set(id,{t:Array.from(kt,Number),v:Array.from(kv,Number)});
    }
  }
  for(const b of baglar){
    // OO: model→model (hiyerarşi) veya egriDugum→model değil (OP'dir)
    if(b[0]==='OO'&&modeller.has(b[1])&&modeller.has(b[2]))
      modeller.get(b[1]).ebeveyn=b[2];
    if(b[0]==='OP'&&egriDugum.has(b[1])&&modeller.has(b[2])&&String(b[3]).includes('Lcl Rotation'))
      modeller.get(b[2]).egriDugumId=b[1];
    if(b[0]==='OP'&&egriDugum.has(b[1])&&modeller.has(b[2])&&String(b[3]).includes('Lcl Translation'))
      modeller.get(b[2]).egriDugumTId=b[1]; // Mixamo kalça zıplaması buradan gelir (dip)
    if(b[0]==='OP'&&egriler.has(b[1])&&egriDugum.has(b[2])){
      const k=String(b[3]).replace('d|','');
      egriDugum.get(b[2]).kanal[k]=egriler.get(b[1]);
    }
  }
  return {modeller,egriDugum};
}
function egriDeger(e,tSn){ // doğrusal ara değerleme
  if(!e||!e.t.length)return null;
  const t=tSn*TICK;
  if(t<=e.t[0])return e.v[0];
  if(t>=e.t[e.t.length-1])return e.v[e.v.length-1];
  let i=1;while(e.t[i]<t)i++;
  const o=(t-e.t[i-1])/(e.t[i]-e.t[i-1]);
  return e.v[i-1]+(e.v[i]-e.v[i-1])*o;
}

/* dünya konumları: kemik zincirini Hips'ten aşağı çöz */
function dunyaKonumlar(modeller,egriDugum,tSn){
  const konum=new Map(),matris=new Map();
  const coz=(m)=>{
    if(konum.has(m.id))return;
    let ebeM=[[1,0,0],[0,1,0],[0,0,1]],ebeK=[0,0,0];
    if(m.ebeveyn&&modeller.has(m.ebeveyn)){
      const e=modeller.get(m.ebeveyn);coz(e);
      ebeM=matris.get(e.id);ebeK=konum.get(e.id);
    }
    let rot=m.r,cev=m.t;
    const ed=m.egriDugumId&&egriDugum.get(m.egriDugumId);
    if(ed){
      rot=[egriDeger(ed.kanal.X,tSn)??m.r[0],
           egriDeger(ed.kanal.Y,tSn)??m.r[1],
           egriDeger(ed.kanal.Z,tSn)??m.r[2]];
    }
    const edT=m.egriDugumTId&&egriDugum.get(m.egriDugumTId);
    if(edT){
      cev=[egriDeger(edT.kanal.X,tSn)??m.t[0],
           egriDeger(edT.kanal.Y,tSn)??m.t[1],
           egriDeger(edT.kanal.Z,tSn)??m.t[2]];
    }
    const R=mul(rotMat(m.pre),rotMat(rot));
    const k=topla(ebeK,uygula(ebeM,cev));
    matris.set(m.id,mul(ebeM,R));
    konum.set(m.id,k);
  };
  for(const m of modeller.values())coz(m);
  const adIle={};
  for(const m of modeller.values())adIle[m.ad]=konum.get(m.id);
  return adIle;
}

/* sagital izdüşüm + bizim formata çevirim.
   ileri=+Z, yukarı=+Y varsayılır (Mixamo standardı); --eksen=x ile değişir */
function kareUret(J,ileriEksen,olcek,refKalcaYuk){
  const F=ileriEksen==='x'?0:2, U=1;
  const v=(a,b)=>[J[b][F]-J[a][F],J[b][U]-J[a][U]]; // [ileri, yukarı]
  const aci=(a,b)=>{const d=v(a,b);return Math.atan2(d[0],-d[1]);} // 0=düz aşağı
  const yukAci=(a,b)=>{const d=v(a,b);return Math.atan2(d[0],d[1]);} // 0=düz yukarı
  const tL=aci('LeftUpLeg','LeftLeg'),sL=aci('LeftLeg','LeftFoot');
  const tR=aci('RightUpLeg','RightLeg'),sR=aci('RightLeg','RightFoot');
  const uL=aci('LeftArm','LeftForeArm'),fL=aci('LeftForeArm','LeftHand');
  const uR=aci('RightArm','RightForeArm'),fR=aci('RightForeArm','RightHand');
  const lean=yukAci('Hips','Spine2');
  const omur=yukAci('Spine2','Neck')-lean;
  const head=yukAci('Neck','Head')-lean-omur;
  return {
    lean:+lean.toFixed(3),omur:+omur.toFixed(3),head:+head.toFixed(3),
    dip:+((refKalcaYuk-J.Hips[U])*olcek).toFixed(1),
    lL:[+tL.toFixed(3),+(tL-sL).toFixed(3)],
    lR:[+tR.toFixed(3),+(sR-tR).toFixed(3)],
    aL:[+uL.toFixed(3),+(fL-uL).toFixed(3)],
    aR:[+uR.toFixed(3),+(uR-fR).toFixed(3)],
  };
}

/* ---------- sentetik yürüyüş (FBX gelene kadar hattın kanıtı) ---------- */
function sentetik(){
  const kareler=[];
  const N=24;
  for(let i=0;i<N;i++){
    const q=i/N*2*Math.PI;
    const salL=Math.sin(q),salR=Math.sin(q+Math.PI);
    const dizL=Math.max(0,Math.sin(q+2.1))*1.0;   // salınımda diz katlanır
    const dizR=Math.max(0,Math.sin(q+Math.PI+2.1))*1.0;
    kareler.push({
      lean:.10,omur:.04,head:-.05,
      dip:+(2+1.4*Math.sin(2*q)).toFixed(1),
      /* İŞARET SÖZLEŞMESİ: side=-1 uzuvlarda (lR/aR) diz/dirsek parametresi
         NEGATİF olmalı ki eklem doğal yöne kıvrılsın (render: shin=leg0-leg1*side).
         İlk sürümde pozitifti → MIXAMO TEST'te dizler ters kıvrılıyordu. */
      lL:[+(0.5*salL).toFixed(3),+dizL.toFixed(3)],
      lR:[+(0.5*salR).toFixed(3),+(-dizR).toFixed(3)],
      aL:[+(0.32*salR+0.12).toFixed(3),+(0.55+0.15*salR).toFixed(3)],
      aR:[+(0.32*salL+0.12).toFixed(3),+(-(0.55+0.15*salL)).toFixed(3)],
    });
  }
  return {kaynak:'sentetik-yuruyus',fps:FPS,kareSayisi:N,kareler};
}

/* ---------- akış ---------- */
const arg=process.argv[2];
let sonuc;
if(!arg||arg==='--sentetik'){
  sonuc=sentetik();
  console.log('SENTETİK yürüyüş üretildi ('+sonuc.kareSayisi+' kare) — gerçek FBX gelince: node tools/fbx-cevir.mjs mixamo_test.fbx');
}else{
  const dosya=path.resolve(arg);
  const {modeller,egriDugum}=fbxOku(dosya);
  console.log('kemik sayısı:',modeller.size);
  // klip süresi: en uzun eğrinin son anahtarı
  let son=0;
  for(const ed of egriDugum.values())for(const k of Object.values(ed.kanal))
    if(k.t.length)son=Math.max(son,k.t[k.t.length-1]/TICK);
  if(son<=0)throw new Error('animasyon eğrisi bulunamadı');
  // ölçek: bacak boyu (bind) → bizim 42px
  const J0=dunyaKonumlar(modeller,egriDugum,0);
  for(const gerek of ['Hips','LeftUpLeg','LeftLeg','LeftFoot','Spine2','Neck','Head'])
    if(!J0[gerek])throw new Error('kemik eksik: '+gerek+' (mixamorig önekli standart iskelet bekleniyor)');
  const bacak=Math.hypot(J0.LeftUpLeg[1]-J0.LeftLeg[1],J0.LeftUpLeg[2]-J0.LeftLeg[2])
             +Math.hypot(J0.LeftLeg[1]-J0.LeftFoot[1],J0.LeftLeg[2]-J0.LeftFoot[2]);
  const olcek=42/Math.max(1e-6,bacak);
  // referans kalça yüksekliği: klip boyunca maksimum (dip>=0 kalsın)
  let refKalca=-1e9;
  const anlar=[];
  for(let t=0;t<son;t+=1/FPS)anlar.push(t);
  const konumlar=anlar.map(t=>dunyaKonumlar(modeller,egriDugum,t));
  for(const J of konumlar)refKalca=Math.max(refKalca,J.Hips[1]);
  const kareler=konumlar.map(J=>kareUret(J,'z',olcek,refKalca));
  sonuc={kaynak:path.basename(dosya),fps:FPS,kareSayisi:kareler.length,kareler};
  console.log('klip: '+son.toFixed(2)+' sn → '+kareler.length+' kare, ölçek ×'+olcek.toFixed(4));
}
fs.mkdirSync(path.dirname(CIKTI),{recursive:true});
fs.writeFileSync(CIKTI,JSON.stringify(sonuc));
console.log('yazıldı: '+CIKTI);
