
"use strict";
/* ================= COMPAT (older browsers / Edge Legacy) ================= */
if(!String.prototype.replaceAll){String.prototype.replaceAll=function(a,b){return this.split(a).join(b)}}
(function(){try{
 var cs=window.CSS&&CSS.supports;
 var okGrid=cs&&CSS.supports("display","grid");
 var okAsp=cs&&CSS.supports("aspect-ratio","3/4");
 if(!okGrid||!okAsp){
  var w=document.createElement("div");
  w.style.cssText="background:#d64545;color:#fff;font-weight:700;font-size:13px;line-height:1.7;padding:10px 14px;text-align:center;position:relative;z-index:99";
  w.textContent="⚠ お使いのブラウザではレイアウトが崩れたり、正常に動作しない可能性があります。最新のMicrosoft Edge / Chromeで開いてください。";
  if(document.body)document.body.insertBefore(w,document.body.firstChild);
 }
}catch(e){}})();

/* ================= STATE ================= */
let S=null;
let slots=[null,null,null];
let albumUnlocked=new Set();
let META={clears:0,endings:new Set(),ach:new Set()};
/* ================= PERSISTENCE (localStorage) ================= */
const LS_KEYS={slots:"sakura-memorial-slots-v1",meta:"sakura-memorial-meta-v1",admin:"sakura-memorial-admin-v1",album:"sakura-memorial-album-v1",bgmHeard:"sakura-memorial-bgmheard-v1",videoSeen:"sakura-memorial-videoseen-v1"};
let bgmHeardSet=new Set();
function persistBgmHeard(){lsSet(LS_KEYS.bgmHeard,Array.from(bgmHeardSet))}
let videoSeenSet=new Set();
function persistVideoSeen(){lsSet(LS_KEYS.videoSeen,Array.from(videoSeenSet))}
function markVideoSeen(f){if(f&&!videoSeenSet.has(f)){videoSeenSet.add(f);persistVideoSeen();if($("album-video-list"))renderVideoList()}}
function markBgmHeard(k){if(k&&BGM_TRACKS&&BGM_TRACKS[k]&&!bgmHeardSet.has(k)){bgmHeardSet.add(k);persistBgmHeard()}}
function lsGet(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function persistSlots(){return lsSet(LS_KEYS.slots,slots)}
function persistMeta(){lsSet(LS_KEYS.meta,{clears:META.clears,endings:Array.from(META.endings),ach:Array.from(META.ach)})}
function persistAlbum(){lsSet(LS_KEYS.album,Array.from(albumUnlocked))}
function persistAdmin(){if(typeof ADMIN!=="undefined")lsSet(LS_KEYS.admin,ADMIN)}
function restorePersisted(){const sl=lsGet(LS_KEYS.slots);if(Array.isArray(sl))slots=[sl[0]||null,sl[1]||null,sl[2]||null];const mt=lsGet(LS_KEYS.meta);if(mt&&typeof mt==="object"){META.clears=typeof mt.clears==="number"?mt.clears:0;META.endings=new Set(Array.isArray(mt.endings)?mt.endings:[]);META.ach=new Set(Array.isArray(mt.ach)?mt.ach:[])}const al=lsGet(LS_KEYS.album);if(Array.isArray(al))albumUnlocked=new Set(al);const bh=lsGet(LS_KEYS.bgmHeard);if(Array.isArray(bh))bgmHeardSet=new Set(bh);const vs=lsGet(LS_KEYS.videoSeen);if(Array.isArray(vs))videoSeenSet=new Set(vs);const ad=lsGet(LS_KEYS.admin);if(ad&&typeof ad==="object"&&typeof ADMIN!=="undefined")ADMIN={bgm:ad.bgm||{},overrides:ad.overrides||{},custom:Array.isArray(ad.custom)?ad.custom:[]}}
const ENDING_LABELS={love:"恋愛成就エンド",almost:"もう少しだった春",solo:"それぞれの春",rival:"ライバルエンド",friend:"親友エンド",life_work:"人生型：仕事成功型",life_hobby:"人生型：趣味没頭型",life_friends:"人生型：友人関係充実型",life_free:"人生型：独身自由人型",life_none:"人生型：何も成し遂げられなかった型"};
let albumReturn="title";
let soundOn=true, actx=null;
function $(id){return document.getElementById(id)}
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function clamp(v){return Math.max(0,Math.min(100,Math.round(v)))}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function hero(id){return HEROINES.find(h=>h.id===id)}
/* ---------- heroine image variants ---------- */
const VARIANT_LABELS={normal:"通常・制服",smile:"笑顔",shy:"照れ・夕方の桜",date:"私服・デート",yukata:"浴衣・夏祭り",gyouji:"行事・体育祭",gym:"体操着・体育祭",club:"部活・夏服",winter:"冬服・クリスマス",ski:"スキー・雪山",pool:"プールサイド・夏",sea:"海辺・夏",sick:"看病・病気",planet:"プラネタリウム・水族館",grad:"卒業式",ending:"エンディング・桜の下"};
function heroVariants(h){return h.imgs?(h.order||Object.keys(h.imgs)):["normal"]}
function heroImgBy(h,variant){if(h.imgs&&variant&&h.imgs[variant])return h.imgs[variant];if(h.imgs&&variant==="pool"&&h.imgs.sea)return h.imgs.sea;if(h.imgs)return h.imgs.normal;return h.img}
let lastStageSrc="";
function pickVariant(hid,preferred){
 const h=hero(hid);const vars=heroVariants(h);
 if(vars.length<=1)return "normal";
 if(!S)return (preferred&&vars.includes(preferred))?preferred:"normal";
 if(!S.picCursor)S.picCursor={};
 if(preferred&&vars.includes(preferred)){S.picCursor[hid]=vars.indexOf(preferred)+1;return preferred}
 let idx=((S.picCursor[hid]||0)%vars.length+vars.length)%vars.length;
 let v=vars[idx];
 if(heroImgBy(h,v)===lastStageSrc){idx=(idx+1)%vars.length;v=vars[idx]}
 S.picCursor[hid]=idx+1;
 return v;
}
/* 2.34 場面に合わせた動きパターン（タグで判定、🎞ONの時だけ有効） */
let curPat="kb";
function imgPatternFor(tag){const t=tag||"";
 if(t.indexOf("雪")>=0||t.indexOf("スキー")>=0)return "snow";
 if(t.indexOf("の物語")>=0||t.indexOf("プロローグ")>=0||t.indexOf("断念")>=0||t.indexOf("別れ")>=0||t.indexOf("バッド")>=0)return "black";
 if(t.indexOf("回想")>=0||t.indexOf("寝込")>=0||t.indexOf("見舞い")>=0||t.indexOf("看病")>=0||t.indexOf("病気")>=0)return "fog";
 if(t.indexOf("海")>=0||t.indexOf("プール")>=0||t.indexOf("水泳")>=0||t.indexOf("川遊び")>=0)return "water";
 if(t.indexOf("卒業")>=0||t.indexOf("エンディング")>=0)return "push";
 if(t.indexOf("告白")>=0||t.indexOf("ドキドキ")>=0||t.indexOf("やきもち")>=0||t.indexOf("秘密")>=0)return "heart";
 return "kb"}
function setImgPattern(tag){curPat=imgPatternFor(tag)}
function applyImgMotion(imgEl){
 if(!imgEl)return;
 if(imgEl.dataset.patApplied!==curPat){
  imgEl.classList.remove("pat-water","pat-heart","pat-push","pat-snow");
  if(curPat==="water"||curPat==="heart"||curPat==="push"||curPat==="snow")imgEl.classList.add("pat-"+curPat);
  imgEl.dataset.patApplied=curPat;
 }
 const src=imgEl.src||"";
 if(src&&imgEl.dataset.patSrc!==src){
  imgEl.dataset.patSrc=src;
  const tr=(curPat==="black")?"trans-black":((curPat==="fog"||curPat==="snow")?"trans-fog":null);
  if(tr&&kbOn){imgEl.classList.remove("trans-black","trans-fog");void imgEl.offsetWidth;imgEl.classList.add(tr);setTimeout(()=>{imgEl.classList.remove(tr)},tr==="trans-black"?1750:2550)}
 }
}
function applyStageImg(imgEl,chipEl,hid,variant){
 const h=hero(hid);const src=heroImgBy(h,variant);
 imgEl.src=src;lastStageSrc=src;
 if(chipEl){const vars=heroVariants(h);const n=Math.max(0,vars.indexOf(variant))+1;
  chipEl.textContent=vars.length>1?("📷 "+h.short+" "+n+"/"+vars.length+"・"+(VARIANT_LABELS[variant]||variant)):("📷 "+h.short+" 1/1・通常");
  chipEl.classList.remove("hidden")}
 imgEl.classList.remove("swap");void imgEl.offsetWidth;imgEl.classList.add("swap");
 applyImgMotion(imgEl);
}
function pName(){return S?S.last+" "+S.first:"主人公"}
/* 呼び方：好感度で 苗字くん(〜39) → 名前くん(40〜79) → あだ名(80〜) と変化 */
function addrStageOf(v){return v>=80?2:v>=40?1:0}
function pCall(hid){if(!S)return "君";const st=addrStageOf(hid&&S.aff?(S.aff[hid]||0):0);if(st>=2)return S.nick||S.first;if(st>=1)return S.first+"くん";return S.last+"くん"}
function checkAddrUnlocks(){if(!S||!S.aff)return;if(!S.addrStage)S.addrStage={};HEROINES.forEach(h=>{if(!S.met[h.id])return;const now=addrStageOf(S.aff[h.id]||0);const prev=S.addrStage[h.id];if(typeof prev!=="number"){S.addrStage[h.id]=now;return}if(now!==prev){S.addrStage[h.id]=now;if(now>prev)sysNotify(now>=2?("💕 "+h.name+"が、あだ名「"+(S.nick||S.first)+"」で呼んでくれるようになった！"):("💕 "+h.name+"が、名前「"+S.first+"くん」で呼んでくれるようになった！"),1)}})}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function beep(f,d,type){if(!soundOn)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();if(bgmName&&!bgmTimer&&!bgmBlocked)bgmTimer=setTimeout(bgmTick,60);const o=actx.createOscillator(),g=actx.createGain();o.type=type||"sine";o.frequency.value=f||660;g.gain.setValueAtTime(.12,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+(d||.12));o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+(d||.12))}catch(e){}}
function chime(){beep(659,.15);setTimeout(()=>beep(784,.15),110);setTimeout(()=>beep(988,.28),220)}
/* ================= BGM（WebAudio・場面ごとに別の作曲） ================= */
/* 旋律はMIDI番号と長さ（拍数）のペアで記述。各曲は調性・旋律・リズム・伴奏パターンがすべて異なる。 */
function bgmFreq(m){return 440*Math.pow(2,(m-69)/12)}
const BGM_TRACKS={
 /* オープニング：ハ長調。ド→ミ→ソ→高いドへ跳び上がる印象的なフック、明るいアルペジオ伴奏 */
 opening:{step:195,wave:"triangle",vol:0.055,legato:0.9,bassWave:"triangle",bassVol:0.05,arpWave:"square",arpVol:0.016,
  melody:[[72,1],[76,1],[79,1],[84,2],[79,1],[81,1],[79,1],[76,1],[77,1],[81,1],[84,2],[81,1],[79,1],[76,1],[77,1],[81,1],[79,1],[76,1],[74,1],[76,1],[79,1],[81,1],[84,2],[81,1],[79,1],[76,2],[74,1],[71,1]],
  bass:[[48,2],[55,2],[53,2],[55,2],[48,2],[55,2],[53,2],[50,2],[53,2],[55,2],[48,2],[55,2],[53,2],[55,2],[48,2],[43,2]],
  arp:[[72,1],[67,1],[64,1],[67,1],[72,1],[69,1],[65,1],[69,1],[72,1],[67,1],[64,1],[67,1],[71,1],[67,1],[62,1],[67,1],[72,1],[67,1],[64,1],[67,1],[72,1],[69,1],[65,1],[69,1],[72,1],[67,1],[64,1],[67,1],[71,1],[67,1],[62,1],[67,1]]},
 /* タイトル：ヘ長調。ファから始まる叙情的な下行旋律、ハープのような分散和音 */
 title:{step:265,wave:"triangle",vol:0.05,legato:0.93,bassWave:"sine",bassVol:0.045,arpWave:"sine",arpVol:0.02,
  melody:[[77,2],[81,1],[79,1],[77,2],[76,1],[74,1],[72,2],[74,1],[76,1],[77,4],[79,2],[81,1],[79,1],[77,2],[74,1],[76,1],[74,2],[76,1],[72,1],[77,4]],
  bass:[[41,4],[46,4],[38,4],[36,4],[41,4],[46,4],[36,4],[41,4]],
  arp:[[65,1],[69,1],[72,1],[77,1],[72,1],[69,1],[65,1],[69,1],[70,1],[74,1],[77,1],[82,1],[77,1],[74,1],[70,1],[74,1],[62,1],[65,1],[69,1],[74,1],[69,1],[65,1],[62,1],[65,1],[60,1],[64,1],[67,1],[72,1],[67,1],[64,1],[60,1],[64,1]]},
 /* 通常：ト長調。低い音域をゆったり歩く穏やかな旋律、休符多め、柔らかい分散和音 */
 daily:{step:300,wave:"sine",vol:0.045,legato:0.94,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.018,
  melody:[[74,2],[71,1],[67,1],[69,2],[0,2],[71,2],[74,1],[76,1],[74,2],[71,2],[72,2],[71,1],[69,1],[67,2],[0,2],[69,2],[71,1],[69,1],[67,4]],
  bass:[[43,4],[48,4],[40,4],[50,4],[43,4],[48,4],[50,4],[43,4]],
  arp:[[55,2],[59,2],[62,2],[59,2],[55,2],[60,2],[64,2],[60,2],[52,2],[55,2],[59,2],[55,2],[57,2],[62,2],[66,2],[62,2]]},
 /* イベント：ニ長調。跳ねるシンコペーションとオクターブを跳ぶベースのにぎやかな曲 */
 event:{step:225,wave:"square",vol:0.028,legato:0.85,bassWave:"triangle",bassVol:0.05,arpWave:"square",arpVol:0.013,
  melody:[[69,1],[74,1],[78,1],[81,2],[79,1],[78,1],[76,1],[74,1],[0,1],[76,1],[78,1],[74,2],[0,2],[69,1],[74,1],[78,1],[81,2],[83,1],[81,1],[79,1],[78,1],[76,1],[74,1],[73,1],[74,4]],
  bass:[[50,1],[57,1],[50,1],[57,1],[50,1],[57,1],[50,1],[57,1],[43,1],[50,1],[43,1],[50,1],[43,1],[50,1],[43,1],[50,1],[45,1],[52,1],[45,1],[52,1],[45,1],[52,1],[45,1],[52,1],[50,1],[57,1],[50,1],[57,1],[50,1],[57,1],[50,1],[57,1]],
  arp:[[0,1],[69,1],[0,1],[66,1]]},
 /* 選択肢：イ短調。休符を挟んだ短い音のモチーフが繰り返す、考え中・ドキドキの曲 */
 choice:{step:250,wave:"sine",vol:0.05,legato:0.7,bassWave:"sine",bassVol:0.05,
  melody:[[76,1],[0,1],[72,1],[0,1],[71,1],[0,1],[72,1],[0,1],[74,1],[0,1],[72,1],[0,1],[71,1],[0,3],[76,1],[0,1],[79,1],[0,1],[76,1],[0,1],[72,1],[0,1],[71,2],[0,2],[69,4]],
  bass:[[45,1],[0,7],[41,1],[0,7],[43,1],[0,7],[40,1],[0,7]]},
 /* デート：3拍子のワルツ。高いドまで伸びてため息のように下りる甘い旋律、1・2・3のワルツ伴奏 */
 date:{step:330,wave:"sine",vol:0.05,legato:0.97,bassWave:"triangle",bassVol:0.04,
  melody:[[76,2],[79,1],[84,3],[81,2],[79,1],[76,3],[77,2],[81,1],[79,2],[76,1],[74,2],[71,1],[72,3]],
  bass:[[48,1],[55,1],[52,1],[48,1],[55,1],[52,1],[41,1],[48,1],[53,1],[45,1],[52,1],[48,1],[41,1],[48,1],[53,1],[48,1],[55,1],[52,1],[43,1],[50,1],[47,1],[48,1],[55,1],[52,1]]},
 /* 悲しい場面：イ短調（和声的短音階）。下行する旋律と長い休止、高音の残響だけが静かに残る */
 sad:{step:430,wave:"sine",vol:0.042,legato:0.95,bassWave:"sine",bassVol:0.04,arpWave:"sine",arpVol:0.014,
  melody:[[76,2],[72,1],[71,1],[69,4],[0,2],[71,2],[72,1],[71,1],[69,2],[68,2],[69,1],[71,1],[72,4],[71,2],[68,2],[69,4]],
  bass:[[45,8],[41,8],[45,8],[40,8]],
  arp:[[0,6],[81,2],[0,6],[79,2],[0,6],[76,2],[0,6],[79,2]]},
 /* エンディング：ニ長調。大きな跳躍とロングトーンで山場を作る感動的な旋律、広がるアルペジオ */
 ending:{step:295,wave:"triangle",vol:0.052,legato:0.94,bassWave:"sine",bassVol:0.046,arpWave:"triangle",arpVol:0.02,
  melody:[[78,2],[81,2],[86,3],[85,1],[83,2],[81,2],[79,2],[78,2],[76,2],[78,2],[81,2],[83,2],[86,4],[83,1],[81,1],[78,2]],
  bass:[[50,4],[47,4],[43,4],[45,4],[50,4],[47,4],[43,4],[45,4]],
  arp:[[62,2],[66,2],[69,2],[74,2],[59,2],[62,2],[66,2],[71,2],[59,2],[62,2],[67,2],[71,2],[61,2],[64,2],[69,2],[73,2]]},
 /* ほっこり：ハ長調。ゆったり歩く温かい旋律（v2で実曲化） */
 hokkori:{step:340,wave:"sine",vol:0.046,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.016,
  melody:[[72,2],[76,2],[79,2],[76,2],[81,2],[79,2],[76,4],[74,2],[72,2],[74,2],[76,2],[74,2],[72,6]],
  bass:[[48,4],[43,4],[41,4],[43,4],[48,4],[43,4],[41,4],[48,4]],
  arp:[[64,2],[67,2],[71,2],[67,2],[65,2],[69,2],[72,2],[69,2]]},
 /* 黒羽の出来事：ト長調。町を歩くような軽い足取り */
 local:{step:260,wave:"triangle",vol:0.048,legato:0.9,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.015,
  melody:[[67,2],[71,2],[74,2],[71,2],[76,2],[74,2],[71,2],[69,2],[67,2],[69,2],[71,2],[69,2],[67,4],[0,2]],
  bass:[[43,2],[50,2],[43,2],[50,2],[48,2],[55,2],[50,2],[43,2]],
  arp:[[59,1],[62,1],[59,1],[62,1],[60,1],[64,1],[60,1],[64,1]]},
 /* 句碑めぐり：イ短調系の静かな旋律。余白多め */
 kuhi:{step:400,wave:"sine",vol:0.044,legato:0.96,bassWave:"sine",bassVol:0.04,arpWave:"sine",arpVol:0.013,
  melody:[[69,3],[72,1],[74,2],[76,2],[74,4],[72,2],[69,2],[67,2],[69,6],[0,2],[74,2],[76,2],[79,2],[76,2],[74,2],[72,2],[69,6]],
  bass:[[45,6],[41,6],[43,6],[45,6]],
  arp:[[0,4],[76,2],[0,4],[79,2],[0,4],[76,2],[0,4],[74,2]]},
 /* 個別ストーリー：ニ長調。少し切ない上行旋律 */
 story:{step:300,wave:"triangle",vol:0.05,legato:0.94,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.017,
  melody:[[74,2],[78,2],[81,2],[78,2],[79,2],[78,2],[76,2],[74,2],[73,2],[74,2],[76,2],[78,2],[81,4],[79,2],[78,6]],
  bass:[[50,4],[47,4],[43,4],[45,4],[50,4],[47,4],[43,4],[45,4]],
  arp:[[66,2],[69,2],[74,2],[69,2],[62,2],[66,2],[69,2],[66,2]]},
 /* 夏祭り：ニ長調。太鼓の脈打ちベースと跳ねる旋律 */
 matsuri:{step:170,wave:"square",vol:0.026,legato:0.85,bassWave:"triangle",bassVol:0.055,arpWave:"square",arpVol:0.012,
  melody:[[74,1],[74,1],[77,1],[81,1],[79,1],[77,1],[74,1],[73,1],[74,1],[74,1],[77,1],[81,1],[84,2],[81,1],[79,1],[77,1],[76,1],[77,1],[79,1],[81,1],[79,1],[77,1],[76,1],[74,1],[73,2],[74,2]],
  bass:[[50,1],[0,1],[50,1],[0,1],[50,1],[0,1],[50,1],[0,1],[45,1],[0,1],[45,1],[0,1],[47,1],[0,1],[47,1],[0,1]],
  arp:[[69,1],[74,1],[69,1],[74,1]]},
 /* スポーツ行事：ハ長調の行進曲。元気な同音連打 */
 sports:{step:180,wave:"square",vol:0.026,legato:0.88,bassWave:"triangle",bassVol:0.05,arpWave:"square",arpVol:0.012,
  melody:[[72,1],[72,1],[72,1],[76,2],[79,2],[76,1],[79,1],[84,2],[79,1],[76,1],[74,1],[76,1],[74,1],[72,2],[0,1],[74,1],[76,1],[79,1],[76,1],[74,1],[72,1],[74,1],[71,1],[72,4]],
  bass:[[48,1],[55,1],[48,1],[55,1],[41,1],[48,1],[43,1],[50,1],[48,1],[55,1],[48,1],[55,1],[43,1],[50,1],[43,1],[48,1]],
  arp:[[64,1],[67,1],[64,1],[67,1]]},
 /* 文化祭：ヘ長調。明るく弾むポップな旋律 */
 culture:{step:230,wave:"triangle",vol:0.048,legato:0.9,bassWave:"triangle",bassVol:0.044,arpWave:"square",arpVol:0.013,
  melody:[[77,1],[81,1],[84,1],[81,1],[79,1],[77,1],[76,1],[77,1],[79,1],[81,1],[79,1],[77,1],[76,1],[74,1],[72,1],[74,1],[77,4]],
  bass:[[41,2],[48,2],[46,2],[53,2],[38,2],[46,2],[48,2],[41,2]],
  arp:[[65,1],[69,1],[65,1],[69,1],[67,1],[70,1],[67,1],[70,1]]},
 /* 海・夏：ハ長調。風のようなアルペジオと伸びやかな旋律 */
 sea:{step:280,wave:"sine",vol:0.047,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.018,
  melody:[[76,2],[79,2],[84,2],[79,2],[81,2],[79,2],[76,2],[74,2],[72,2],[74,2],[76,2],[79,2],[76,6]],
  bass:[[48,4],[55,4],[53,4],[55,4]],
  arp:[[72,1],[76,1],[79,1],[84,1],[79,1],[76,1],[72,1],[76,1],[74,1],[77,1],[81,1],[86,1],[81,1],[77,1],[74,1],[77,1]]},
 /* 雪・冬：ホ短調。まばらな高音が雪のように降る */
 snow:{step:380,wave:"sine",vol:0.044,legato:0.96,bassWave:"sine",bassVol:0.04,arpWave:"sine",arpVol:0.013,
  melody:[[83,2],[79,2],[76,4],[0,2],[81,2],[79,2],[76,2],[74,2],[71,2],[74,2],[76,6],[0,2]],
  bass:[[40,6],[43,6],[40,6],[47,6]],
  arp:[[0,3],[88,1],[0,3],[86,1],[0,3],[83,1],[0,3],[81,1]]},
 /* 通常・春：ハ長調。桜の季節の明るい通常曲 */
 daily_spring:{step:280,wave:"triangle",vol:0.048,legato:0.93,bassWave:"sine",bassVol:0.044,arpWave:"sine",arpVol:0.017,
  melody:[[76,2],[74,1],[72,1],[74,2],[0,2],[76,2],[79,1],[81,1],[79,2],[76,2],[77,2],[76,1],[74,1],[72,2],[0,2],[74,2],[76,1],[74,1],[72,4]],
  bass:[[48,4],[55,4],[53,4],[55,4],[48,4],[55,4],[53,4],[48,4]],
  arp:[[67,2],[72,2],[76,2],[72,2],[65,2],[69,2],[74,2],[69,2]]},
 /* 通常・夏：ヘ長調。蝉しぐれのような細かいアルペジオ */
 daily_summer:{step:265,wave:"triangle",vol:0.048,legato:0.92,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.016,
  melody:[[77,2],[76,1],[74,1],[76,2],[0,2],[77,2],[81,1],[84,1],[81,2],[77,2],[79,2],[77,1],[76,1],[74,2],[0,2],[76,2],[77,1],[76,1],[74,4]],
  bass:[[41,4],[48,4],[46,4],[48,4],[41,4],[48,4],[46,4],[41,4]],
  arp:[[69,1],[72,1],[77,1],[72,1],[70,1],[74,1],[79,1],[74,1]]},
 /* 通常・秋：イ短調。少し物思う通常曲 */
 daily_autumn:{step:320,wave:"sine",vol:0.046,legato:0.94,bassWave:"sine",bassVol:0.043,arpWave:"sine",arpVol:0.016,
  melody:[[76,2],[74,1],[72,1],[71,2],[0,2],[72,2],[76,1],[79,1],[76,2],[74,2],[72,2],[71,1],[69,1],[68,2],[0,2],[69,2],[71,1],[69,1],[69,4]],
  bass:[[45,4],[41,4],[43,4],[40,4],[45,4],[41,4],[43,4],[45,4]],
  arp:[[64,2],[69,2],[72,2],[69,2],[62,2],[65,2],[69,2],[65,2]]},
 /* 通常・冬：ハ長調。静かで澄んだ通常曲 */
 daily_winter:{step:350,wave:"sine",vol:0.045,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.015,
  melody:[[79,2],[76,1],[74,1],[72,2],[0,2],[74,2],[76,1],[79,1],[81,2],[79,2],[76,2],[74,1],[72,1],[71,2],[0,2],[72,4]],
  bass:[[48,4],[43,4],[41,4],[43,4]],
  arp:[[0,2],[84,2],[0,2],[83,2],[0,2],[81,2],[0,2],[79,2]]},
 /* 桜：ハ長調。花びらのように舞う旋律 */
 sakura:{step:300,wave:"triangle",vol:0.048,legato:0.94,bassWave:"sine",bassVol:0.043,arpWave:"sine",arpVol:0.017,
  melody:[[84,2],[81,1],[79,1],[76,2],[79,2],[81,2],[84,2],[86,1],[84,1],[81,2],[79,2],[76,2],[77,2],[79,4]],
  bass:[[48,4],[55,4],[53,4],[55,4]],
  arp:[[72,1],[76,1],[79,1],[76,1],[74,1],[77,1],[81,1],[77,1]]},
 /* 梅雨・雨：ト短調寄り。雨だれのようなアルペジオ */
 rain:{step:360,wave:"sine",vol:0.045,legato:0.94,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.015,
  melody:[[74,2],[70,1],[67,1],[70,2],[0,2],[72,2],[74,1],[70,1],[67,2],[65,2],[67,2],[70,2],[74,4]],
  bass:[[43,4],[46,4],[41,4],[43,4]],
  arp:[[0,1],[79,1],[0,1],[77,1],[0,1],[74,1],[0,1],[77,1]]},
 /* 七夕：ニ長調。星空に願いをかける旋律 */
 tanabata:{step:300,wave:"sine",vol:0.047,legato:0.95,bassWave:"sine",bassVol:0.043,arpWave:"sine",arpVol:0.016,
  melody:[[78,2],[81,2],[85,2],[81,2],[83,2],[81,2],[78,2],[76,2],[78,2],[81,2],[83,2],[85,4],[83,2],[81,6]],
  bass:[[50,4],[47,4],[43,4],[45,4]],
  arp:[[0,2],[90,2],[0,2],[88,2],[0,2],[85,2],[0,2],[88,2]]},
 /* クリスマス：ヘ長調。ベルのアルペジオと祝祭の旋律 */
 xmas:{step:240,wave:"triangle",vol:0.05,legato:0.92,bassWave:"triangle",bassVol:0.045,arpWave:"sine",arpVol:0.02,
  melody:[[77,1],[77,1],[77,2],[0,1],[77,1],[77,1],[77,2],[0,1],[77,1],[81,1],[74,1],[76,1],[77,6],[0,1],[79,1],[79,1],[78,1],[77,1],[76,1],[76,1],[76,1],[81,1],[79,1],[78,1],[74,1],[76,1],[77,2]],
  bass:[[41,2],[48,2],[46,2],[53,2],[41,2],[48,2],[36,2],[41,2]],
  arp:[[84,1],[81,1],[84,1],[81,1],[86,1],[84,1],[81,1],[84,1]]},
 /* イルミネーション：ハ長調。瞬く光のような高音 */
 illumination:{step:330,wave:"sine",vol:0.046,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.018,
  melody:[[84,2],[79,2],[76,2],[79,2],[81,2],[79,2],[76,4],[83,2],[79,2],[76,2],[74,2],[76,2],[72,4]],
  bass:[[48,4],[43,4],[41,4],[48,4]],
  arp:[[0,1],[88,1],[0,1],[86,1],[0,1],[84,1],[0,1],[86,1],[0,1],[88,1],[0,1],[84,1],[0,1],[83,1],[0,1],[81,1]]},
 /* 初詣・正月：イ長調寄りの和風旋律 */
 newyear:{step:300,wave:"triangle",vol:0.048,legato:0.92,bassWave:"sine",bassVol:0.043,arpWave:"triangle",arpVol:0.015,
  melody:[[69,2],[73,2],[76,2],[78,2],[81,2],[78,2],[76,2],[73,2],[74,2],[76,2],[73,2],[69,2],[68,2],[69,4]],
  bass:[[45,4],[49,4],[42,4],[45,4]],
  arp:[[64,1],[69,1],[73,1],[69,1],[66,1],[69,1],[73,1],[69,1]]},
 /* バレンタイン：ハ長調。甘く弾む旋律 */
 valentine:{step:270,wave:"sine",vol:0.048,legato:0.93,bassWave:"triangle",bassVol:0.043,arpWave:"sine",arpVol:0.017,
  melody:[[76,1],[79,1],[81,2],[79,1],[76,1],[74,1],[76,1],[79,1],[84,2],[81,1],[79,1],[81,1],[79,1],[76,1],[74,1],[72,1],[74,1],[76,4]],
  bass:[[48,2],[55,2],[53,2],[55,2],[41,2],[48,2],[43,2],[48,2]],
  arp:[[72,1],[76,1],[79,1],[76,1],[74,1],[77,1],[81,1],[77,1]]},
 /* ハロウィン：ハ短調。おどけた不気味さ */
 halloween:{step:240,wave:"square",vol:0.024,legato:0.85,bassWave:"triangle",bassVol:0.05,arpWave:"sine",arpVol:0.014,
  melody:[[72,1],[0,1],[75,1],[0,1],[74,1],[0,1],[75,1],[0,1],[72,1],[0,1],[68,1],[0,1],[71,1],[0,1],[72,4],[0,2],[70,1],[0,1],[67,1],[0,1],[72,4]],
  bass:[[36,2],[39,2],[36,2],[41,2],[36,2],[39,2],[43,2],[36,2]],
  arp:[[0,2],[79,1],[0,3],[77,1],[0,3]]},
 /* 修学旅行：ト長調。旅のわくわく */
 trip:{step:250,wave:"triangle",vol:0.049,legato:0.9,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.015,
  melody:[[67,1],[71,1],[74,1],[79,2],[76,1],[74,1],[71,1],[74,1],[76,2],[0,1],[67,1],[71,1],[74,1],[79,2],[81,1],[79,1],[76,1],[74,1],[71,1],[69,1],[67,4]],
  bass:[[43,2],[50,2],[48,2],[55,2],[43,2],[50,2],[50,2],[43,2]],
  arp:[[62,1],[67,1],[62,1],[67,1],[64,1],[69,1],[64,1],[69,1]]},
 /* コンサート：ヘ長調。ステージの華やかさ */
 concert:{step:260,wave:"triangle",vol:0.049,legato:0.92,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.016,
  melody:[[81,2],[79,1],[77,1],[76,2],[77,1],[79,1],[81,2],[84,1],[81,1],[79,2],[77,1],[76,1],[74,2],[76,1],[77,1],[79,4]],
  bass:[[41,4],[46,4],[38,4],[41,4]],
  arp:[[69,2],[72,2],[77,2],[72,2],[67,2],[70,2],[74,2],[70,2]]},
 /* テスト・受験：イ短調。時計の針のような緊張感 */
 exam:{step:280,wave:"sine",vol:0.046,legato:0.8,bassWave:"sine",bassVol:0.044,
  melody:[[69,1],[0,1],[69,1],[0,1],[72,1],[0,1],[69,1],[0,1],[68,1],[0,1],[68,1],[0,1],[71,1],[0,1],[68,1],[0,1],[69,1],[0,1],[69,1],[0,1],[72,1],[0,1],[74,1],[0,1],[76,4]],
  bass:[[45,2],[0,2],[41,2],[0,2],[43,2],[0,2],[40,2],[0,2]]},
 /* 誕生日：ハ長調。祝いの明るい旋律 */
 birthday:{step:220,wave:"triangle",vol:0.05,legato:0.9,bassWave:"triangle",bassVol:0.045,arpWave:"square",arpVol:0.013,
  melody:[[72,1],[72,1],[74,1],[72,1],[77,1],[76,3],[72,1],[72,1],[74,1],[72,1],[79,1],[77,3],[74,1],[76,1],[79,1],[81,1],[79,1],[77,1],[76,1],[74,1],[77,1],[76,1],[72,3]],
  bass:[[48,2],[55,2],[41,2],[48,2],[48,2],[55,2],[53,2],[48,2]],
  arp:[[67,1],[72,1],[67,1],[72,1],[69,1],[74,1],[69,1],[74,1]]},
 /* 夜：イ短調。夜空と電話の静けさ */
 night:{step:340,wave:"sine",vol:0.046,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.015,
  melody:[[81,2],[79,1],[76,1],[79,2],[0,2],[76,2],[74,1],[76,1],[79,2],[81,2],[79,2],[76,2],[74,2],[69,4]],
  bass:[[45,4],[41,4],[43,4],[45,4]],
  arp:[[0,2],[88,2],[0,2],[84,2],[0,2],[81,2],[0,2],[79,2]]},
 /* プール：ハ長調。水しぶきのような軽快さ */
 pool:{step:210,wave:"square",vol:0.024,legato:0.87,bassWave:"triangle",bassVol:0.048,arpWave:"square",arpVol:0.012,
  melody:[[72,1],[76,1],[79,1],[76,1],[81,1],[79,1],[76,1],[74,1],[72,1],[76,1],[79,1],[81,1],[84,1],[81,1],[79,1],[76,1],[74,1],[76,1],[74,1],[72,2]],
  bass:[[48,1],[55,1],[53,1],[55,1],[48,1],[55,1],[43,1],[48,1]],
  arp:[[79,1],[84,1],[79,1],[84,1]]},
 /* 夏休み：ヘ長調。夏の午後の明るさ */
 summer:{step:240,wave:"triangle",vol:0.049,legato:0.91,bassWave:"sine",bassVol:0.044,arpWave:"triangle",arpVol:0.015,
  melody:[[81,1],[84,1],[81,1],[79,1],[77,1],[79,1],[81,2],[0,1],[77,1],[79,1],[81,1],[84,1],[86,1],[84,1],[81,1],[79,1],[77,1],[76,1],[77,4]],
  bass:[[41,2],[48,2],[46,2],[53,2],[41,2],[48,2],[48,2],[41,2]],
  arp:[[72,1],[77,1],[72,1],[77,1],[74,1],[79,1],[74,1],[79,1]]},
 /* 屋上：ト長調。夕日の屋上の切なさ */
 rooftop:{step:310,wave:"triangle",vol:0.048,legato:0.94,bassWave:"sine",bassVol:0.043,arpWave:"sine",arpVol:0.016,
  melody:[[79,2],[83,2],[86,2],[83,2],[81,2],[79,2],[78,2],[76,2],[74,2],[76,2],[79,2],[81,2],[79,6]],
  bass:[[43,4],[48,4],[40,4],[43,4]],
  arp:[[67,2],[71,2],[74,2],[71,2],[64,2],[67,2],[71,2],[67,2]]},
 /* 看病：ハ長調。静かに寄り添う旋律 */
 sick:{step:360,wave:"sine",vol:0.045,legato:0.95,bassWave:"sine",bassVol:0.042,arpWave:"sine",arpVol:0.014,
  melody:[[76,2],[72,2],[74,2],[72,2],[71,2],[72,2],[74,4],[0,2],[76,2],[79,2],[76,2],[74,2],[72,6]],
  bass:[[48,4],[41,4],[43,4],[48,4]],
  arp:[[0,4],[79,2],[0,4],[76,2]]},
 /* 電話・メール：ハ長調。呼び出し音のような軽いモチーフ */
 phone:{step:260,wave:"sine",vol:0.047,legato:0.9,bassWave:"sine",bassVol:0.043,
  melody:[[84,1],[0,1],[84,1],[0,3],[79,1],[81,1],[79,1],[76,1],[74,1],[76,1],[79,2],[0,2],[84,1],[0,1],[84,1],[0,3],[86,1],[84,1],[81,1],[79,1],[76,4]],
  bass:[[48,2],[55,2],[53,2],[55,2],[48,2],[55,2],[43,2],[48,2]]},
 /* 回想：ヘ長調。アルバムを開く懐かしさ */
 memory:{step:320,wave:"sine",vol:0.047,legato:0.95,bassWave:"sine",bassVol:0.043,arpWave:"sine",arpVol:0.016,
  melody:[[81,2],[79,1],[77,1],[79,2],[81,2],[84,2],[81,1],[79,1],[77,2],[76,1],[74,1],[76,2],[77,4],[0,2]],
  bass:[[41,4],[46,4],[38,4],[41,4]],
  arp:[[72,2],[77,2],[81,2],[77,2],[70,2],[74,2],[77,2],[74,2]]}
};
function bgmExpand(line){const out=[];if(!line)return out;for(let i=0;i<line.length;i++){out.push({m:line[i][0],l:line[i][1]});for(let j=1;j<line[i][1];j++)out.push(null)}return out}
Object.keys(BGM_TRACKS).forEach(function(k){const tr=BGM_TRACKS[k];tr._mel=bgmExpand(tr.melody);tr._bas=bgmExpand(tr.bass);tr._arp=bgmExpand(tr.arp)});
function bgmForNovel(tag){const t=tag||"";if(t.indexOf("ほっこり")>=0)return "hokkori";if(t.indexOf("句碑")>=0)return "kuhi";if(t.indexOf("黒羽の出来事")>=0)return "local";if(t.indexOf("の物語")>=0)return "story";if(t.indexOf("プロローグ")>=0)return "opening";if(t.indexOf("寝込")>=0||t.indexOf("見舞い")>=0||t.indexOf("ケンカ")>=0||t.indexOf("病気")>=0||t.indexOf("断念")>=0||t.indexOf("別れ")>=0)return "sad";if(t.indexOf("卒業")>=0||t.indexOf("告白")>=0)return "ending";if(t.indexOf("屋上")>=0&&t.indexOf("告白")<0)return "rooftop";if(t.indexOf("看病")>=0)return "sick";if(t.indexOf("電話")>=0||t.indexOf("メール")>=0)return "phone";if(t.indexOf("デート")>=0||t.indexOf("お部屋")>=0)return "date";if(t.indexOf("やきもち")>=0||t.indexOf("誤解")>=0||t.indexOf("ライバル")>=0||t.indexOf("秘密")>=0)return "choice";if(t.indexOf("夏祭り")>=0||t.indexOf("花火")>=0)return "matsuri";if(t.indexOf("体育祭")>=0||t.indexOf("球技")>=0||t.indexOf("マラソン")>=0)return "sports";if(t.indexOf("文化祭")>=0)return "culture";if(t.indexOf("スキー")>=0||t.indexOf("雪の日")>=0)return "snow";if(t.indexOf("海の一日")>=0)return "sea";if(t.indexOf("水泳")>=0||t.indexOf("プール")>=0)return "pool";if(t.indexOf("クリスマス")>=0)return "xmas";if(t.indexOf("イルミネーション")>=0)return "illumination";if(t.indexOf("初詣")>=0||t.indexOf("合格お守り")>=0)return "newyear";if(t.indexOf("バレンタイン")>=0||t.indexOf("ホワイトデー")>=0||t.indexOf("チョコ")>=0)return "valentine";if(t.indexOf("ハロウィン")>=0)return "halloween";if(t.indexOf("七夕")>=0)return "tanabata";if(t.indexOf("修学旅行")>=0)return "trip";if(t.indexOf("コンサート")>=0)return "concert";if(t.indexOf("期末")>=0||t.indexOf("テスト")>=0||t.indexOf("勉強会")>=0)return "exam";if(t.indexOf("誕生日")>=0)return "birthday";if(t.indexOf("プラネタリウム")>=0||t.indexOf("水族館")>=0||t.indexOf("夜の電話")>=0)return "night";if(t.indexOf("夏休み")>=0)return "summer";if(t.indexOf("桜の下")>=0)return "sakura";if(t.indexOf("梅雨")>=0)return "rain";return "event"}
let bgmName=null,bgmStep=0,bgmTimer=null;
let bgmVolume=0.5;try{const __v=lsGet("sakura-memorial-vol-v1");if(typeof __v==="number"&&__v>=0&&__v<=1)bgmVolume=__v}catch(e){}
/* ==== BGMのタブ間調整：鳴らすのは常に1タブだけ。隠れたタブ・後から開いたタブは自動で止まる ==== */
let bgmBlocked=false;
const BGM_OWNER_KEY="sakura-memorial-bgm-owner";
const TAB_ID=Math.random().toString(36).slice(2)+Date.now().toString(36);
function bgmHardPause(){if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}if(typeof adminStopMp3==="function")adminStopMp3()}
function bgmResume(){if(!soundOn||!bgmName||document.hidden)return;const cur=bgmName;bgmName=null;setBGM(cur)}
function bgmOwnerRead(){try{return JSON.parse(localStorage.getItem(BGM_OWNER_KEY)||"null")}catch(e){return null}}
function bgmOwnerTick(){
 const o=bgmOwnerRead(),now=Date.now(),mine=!!o&&o.id===TAB_ID,stale=!o||(now-(o.t||0)>2500);
 if(document.hidden){if(mine){try{localStorage.removeItem(BGM_OWNER_KEY)}catch(e){}}if(!bgmBlocked){bgmBlocked=true;bgmHardPause()}return}
 if(mine||stale){try{localStorage.setItem(BGM_OWNER_KEY,JSON.stringify({id:TAB_ID,t:now}))}catch(e){}if(bgmBlocked){bgmBlocked=false;bgmResume()}}
 else if(!bgmBlocked){bgmBlocked=true;bgmHardPause();toast("🎵 BGMは別のタブで再生中のため、このタブでは停止しています")}
}
setInterval(bgmOwnerTick,1000);
document.addEventListener("visibilitychange",bgmOwnerTick);
window.addEventListener("beforeunload",()=>{const o=bgmOwnerRead();if(o&&o.id===TAB_ID){try{localStorage.removeItem(BGM_OWNER_KEY)}catch(e){}}});
function bgmNote(freq,when,dur,type,vol){
 const o=actx.createOscillator(),g=actx.createGain();
 o.type=type;o.frequency.value=freq;
 g.gain.setValueAtTime(0.0001,when);
 g.gain.exponentialRampToValueAtTime(vol*(bgmVolume/0.5),when+0.03);
 g.gain.exponentialRampToValueAtTime(0.0001,when+dur);
 o.connect(g);g.connect(actx.destination);o.start(when);o.stop(when+dur+0.05);
}
function bgmTick(){
 if(!soundOn||!bgmName||!actx)return;
 if(typeof adminBgmUrl==="function"&&adminBgmUrl(bgmName))return;
 const tr=BGM_TRACKS[bgmName];if(!tr)return;
 const now=actx.currentTime+0.06, unit=tr.step/1000;
 const mel=tr._mel[bgmStep%tr._mel.length];
 if(mel&&mel.m)bgmNote(bgmFreq(mel.m),now,unit*mel.l*(tr.legato||0.92),tr.wave,tr.vol);
 const bas=tr._bas[bgmStep%tr._bas.length];
 if(bas&&bas.m)bgmNote(bgmFreq(bas.m),now,unit*bas.l*0.95,tr.bassWave||"sine",tr.bassVol||0.045);
 if(tr._arp.length){const a=tr._arp[bgmStep%tr._arp.length];if(a&&a.m)bgmNote(bgmFreq(a.m),now,unit*a.l*0.9,tr.arpWave||"sine",tr.arpVol||0.02)}
 bgmStep++;
 bgmTimer=setTimeout(bgmTick,tr.step);
}
function setBGM(name){
 if(name==="daily"&&typeof S!=="undefined"&&S){const __m=((3+Math.floor(((S.turn-1)%48)/4))%12)+1;name=(__m>=3&&__m<=5)?"daily_spring":(__m>=6&&__m<=8)?"daily_summer":(__m>=9&&__m<=11)?"daily_autumn":"daily_winter"}
 if(bgmName===name)return;
 bgmName=name;bgmStep=0;
 if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}
 if(!soundOn||!name)return;
 if(bgmBlocked)return;
 markBgmHeard(name);
 if(adminBgmUrl(name)){adminPlayMp3(name);return}
 adminStopMp3();bgmAudio.dataset.track="";
 try{
  actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  if(actx.state==="suspended")actx.resume();
  bgmTimer=setTimeout(bgmTick,60);
 }catch(e){}
}
document.addEventListener("pointerdown",function(){
 try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();
 if(!soundOn)return;
 /* v2 fix: MP3再生中にタップしても合成BGM（ビープ音）を重ねない */
 if(openingActive)return; /* オープニング中はMP3再生中 */
 if(bgmAudio&&bgmAudio.dataset&&bgmAudio.dataset.track)return; /* MP3再生中 */
 if(bgmName&&adminBgmUrl(bgmName))return; /* MP3指定のある曲はシンセを起動しない */
 var ld=$("screen-loading");if(ld&&!ld.classList.contains("hidden"))return; /* ローディング/選択画面のタップはボタン側の処理に任せる */
 if(bgmName&&!bgmTimer&&!bgmBlocked)bgmTimer=setTimeout(bgmTick,60);
 if(!bgmName)setBGM("title");}catch(e){}
});
function bgmForScreen(id){
 if(id==="screen-loading"||id==="screen-opening")return;
 if(id!=="screen-novel")setBGM(id==="screen-game"?"daily":id==="screen-ending"?"ending":id==="screen-album"?"memory":"title");
}
function show(id){const __pg=$("page-no-badge");if(__pg&&id!=="screen-game"&&id!=="screen-novel")__pg.classList.add("hidden");const __rs=$("btn-resume");if(__rs)__rs.classList.toggle("hidden",!(id==="screen-title"&&S));["screen-loading","screen-opening","screen-title","screen-novel","screen-name","screen-game","screen-ending","screen-album","screen-pilgrim"].forEach(s=>$(s).classList.toggle("hidden",s!==id));window.scrollTo({top:0});bgmForScreen(id)}
/* petals */
(function(){const w=$("petals");for(let i=0;i<14;i++){const p=document.createElement("div");p.className="petal";const s=rnd(9,17);p.style.width=s+"px";p.style.height=s+"px";p.style.left=(Math.random()*100)+"%";p.style.animationDuration=(9+Math.random()*10)+"s";p.style.animationDelay=(-Math.random()*14)+"s";w.appendChild(p)}})();

function defaultState(last,first,nick,birth,goal,lastYomi,firstYomi,nickYomi){
return {last,first,nick,birth,goal,turn:1,
lastYomi:lastYomi||(last==="黒羽"?"くろは":last),firstYomi:firstYomi||(first==="白夜"?"びゃくや":first),nickYomi:nickYomi||nick,
stats:{tairyoku:70,gakuryoku:32,undou:32,miryoku:32,kihin:28,geijutsu:32,kansei:35,shakou:30,moral:40,stress:12},
skills:{reigi:22,bungaku:20,ongaku:18,ryouri:15,souji:20,kidate:30},
aff:{sakura:18,akari:5,yuki:5,rin:5},met:{sakura:true,akari:false,yuki:false,rin:false},
hurt:{sakura:0,akari:0,yuki:0,rin:0},story:{sakura:0,akari:0,yuki:0,rin:0},
rel:{sakura:{trust:25,close:20,jealous:0},akari:{trust:10,close:5,jealous:0},yuki:{trust:10,close:5,jealous:0},rin:{trust:10,close:5,jealous:0}},
money:3000,flags:{},history:{sakura:[],akari:[],yuki:[],rin:[]},ach:[],notices:[],sick:false,
prevAff:{sakura:18,akari:5,yuki:5,rin:5},profStage:{sakura:1,akari:0,yuki:0,rin:0},addrStage:{sakura:0,akari:0,yuki:0,rin:0},clears:0,
picCursor:{},lastStageImg:"",localSeen:[],spots:{},kuhi:[],
lastMeet:{sakura:1,akari:0,yuki:0,rin:0},dates:0,logs:[],memories:["mem_start"],ended:false,endingId:null,
birthBonus:((birth==="6月"||birth==="7月"||birth==="8月")?"undou":(birth==="9月"||birth==="10月"||birth==="11月")?"gakuryoku":(birth==="12月"||birth==="1月"||birth==="2月")?"geijutsu":"miryoku"),
nurse:{stage:0,visits:0,aff:0,saw:0,solo:0,soloImgs:[]}};
}
const TOTAL_TURNS=144; /* 高校3年間＝48週×3 */
function gradeOf(turn){return Math.min(3,1+Math.floor((turn-1)/48))}
function turnInYear(turn){return ((turn-1)%48)+1}
function isHolidayTurn(turn){const d=dateLabel(turn);const g=gradeOf(turn);
 if(d.month===8)return true;                       /* 夏休み（8月いっぱい） */
 if(d.month===7&&d.week===4)return true;           /* 夏休み入り */
 if(d.month===12&&d.week===4)return true;          /* 冬休み入り */
 if(d.month===1&&d.week<=2)return true;            /* 冬休み */
 if(d.month===3&&d.week>=3&&g<3)return true;       /* 春休み（進級前） */
 return false}
function dateLabel(turn){
const idx=turn-1, within=idx%48, grade=gradeOf(turn);
const month=((3+Math.floor(within/4))%12)+1, week=(within%4)+1;
const season=month>=3&&month<=5?"🌸 春":month>=6&&month<=8?"🌻 夏":month>=9&&month<=11?"🍂 秋":"❄️ 冬";
return {month,week,season,grade,text:grade+"年 "+month+"月 第"+week+"週"};
}
function unlockMem(id){if(S&&!S.memories.includes(id))S.memories.push(id);if(!albumUnlocked.has(id)){albumUnlocked.add(id);persistAlbum();const m=ALL_MEMORIES.find(x=>x.id===id);if(m)toast("📖 思い出「"+m.title+"」をアルバムに追加！")}}
function addLog(t){S.logs.unshift(dateLabel(S.turn).text+"："+t);S.logs=S.logs.slice(0,30)}
function affState(v){return v>=80?"大好き":v>=60?"ときめき":v>=40?"気になる":v>=20?"仲良し":"友達"}
/* 傷心度：他の子と仲良くしたり放置すると上がる。会うと下がる */
function addHurt(hid,d){if(!S.hurt)S.hurt={sakura:0,akari:0,yuki:0,rin:0};S.hurt[hid]=clamp((S.hurt[hid]||0)+d)}
function rippleHurt(exceptId,d){HEROINES.forEach(h=>{if(h.id!==exceptId&&S.met[h.id]&&S.aff[h.id]>=35)addHurt(h.id,d)});if(typeof rippleJealous==="function")rippleJealous(exceptId,Math.max(2,Math.round(d/2)))}
function hearts(v){const n=Math.round(v/20);return "♥".repeat(n)+"♡".repeat(5-n)}
function fullStatsHTML(){
 if(!S.skills)S.skills={reigi:22,bungaku:20,ongaku:18,ryouri:15,souji:20,kidate:30};
 return "<b>◆ 基本パラメータ</b>"+STAT_DEFS.map(s=>'<div class="kv"><span>'+s.name+'</span><span>'+(S.stats[s.key]||0)+"</span></div>").join("")+
 "<b>◆ 系統別評価</b>"+evalsOf(S.stats,S.skills).map(e=>'<div class="kv"><span>'+e.name+'</span><span>'+e.v+"（ランク "+rankOf(e.v)+"）</span></div>").join("")+
 "<b>◆ 細かなスキル</b>"+SKILL_DEFS.map(s=>'<div class="kv"><span>'+s.name+'</span><span>'+(S.skills[s.key]||0)+"</span></div>").join("");
}
function migrateState(st){
 const d=defaultState(st.last||"黒羽",st.first||"白夜",st.nick||"グレイ","4月","love");
 if(!st.stats||typeof st.stats!=="object")st.stats=d.stats;
 if(!st.aff||typeof st.aff!=="object")st.aff=d.aff;
 if(typeof st.lastYomi!=="string"||!st.lastYomi)st.lastYomi=d.lastYomi;
 if(typeof st.firstYomi!=="string"||!st.firstYomi)st.firstYomi=d.firstYomi;
 if(typeof st.nickYomi!=="string"||!st.nickYomi)st.nickYomi=d.nickYomi;
 ["tairyoku","gakuryoku","undou","miryoku","kihin","geijutsu","kansei","shakou","moral","stress"].forEach(k=>{if(typeof st.stats[k]!=="number")st.stats[k]=d.stats[k]});
 if(!st.skills)st.skills=d.skills;else SKILL_DEFS.forEach(sk=>{if(typeof st.skills[sk.key]!=="number")st.skills[sk.key]=d.skills[sk.key]});
 if(!st.picCursor||typeof st.picCursor!=="object")st.picCursor={};
 if(typeof st.lastStageImg!=="string")st.lastStageImg="";
 if(!st.hurt||typeof st.hurt!=="object")st.hurt={sakura:0,akari:0,yuki:0,rin:0};
 if(!st.story||typeof st.story!=="object")st.story={sakura:0,akari:0,yuki:0,rin:0};
 HEROINES.forEach(h=>{if(typeof st.hurt[h.id]!=="number")st.hurt[h.id]=0;if(typeof st.story[h.id]!=="number")st.story[h.id]=0});
 if(!st.rel||typeof st.rel!=="object")st.rel=d.rel;else HEROINES.forEach(h=>{if(!st.rel[h.id])st.rel[h.id]={trust:10,close:5,jealous:0};["trust","close","jealous"].forEach(k=>{if(typeof st.rel[h.id][k]!=="number")st.rel[h.id][k]=0})});
 if(typeof st.money!=="number")st.money=d.money;
 if(!st.flags||typeof st.flags!=="object")st.flags={};
 if(!st.history||typeof st.history!=="object")st.history=d.history;else HEROINES.forEach(h=>{if(!Array.isArray(st.history[h.id]))st.history[h.id]=[]});
 if(!Array.isArray(st.ach))st.ach=[];
 if(!Array.isArray(st.notices))st.notices=[];
 if(typeof st.sick!=="boolean")st.sick=false;
 if(!st.prevAff||typeof st.prevAff!=="object")st.prevAff={};HEROINES.forEach(h=>{if(typeof st.prevAff[h.id]!=="number")st.prevAff[h.id]=st.aff[h.id]||0});
 if(!st.profStage||typeof st.profStage!=="object")st.profStage={};HEROINES.forEach(h=>{if(typeof st.profStage[h.id]!=="number")st.profStage[h.id]=0});
 if(typeof st.clears!=="number")st.clears=0;
 if(!Array.isArray(st.localSeen))st.localSeen=[];
 if(!st.spots||typeof st.spots!=="object")st.spots={};
 if(!Array.isArray(st.kuhi))st.kuhi=[];
 if(typeof st.nick!=="string"||!st.nick)st.nick=d.nick;
 if(!st.addrStage||typeof st.addrStage!=="object")st.addrStage={};HEROINES.forEach(h=>{if(typeof st.addrStage[h.id]!=="number")st.addrStage[h.id]=addrStageOf(st.aff&&typeof st.aff[h.id]==="number"?st.aff[h.id]:0)});
 if(!st.nurse||typeof st.nurse!=="object")st.nurse={stage:0,visits:0,aff:0,saw:0,solo:0,soloImgs:[]};
 return st;
}

/* ================= NOVEL ENGINE ================= */
let novelQueue=[],novelIdx=0,novelDone=null,typeTimer=null,typeState=null;
let translateMode=false;
function typeText(el,text){clearInterval(typeTimer);typeState=null;if(translateMode){el.textContent=text;el.classList.remove("typing-cursor");return}el.textContent="";el.classList.add("typing-cursor");let i=0;typeState={el:el,text:text};typeTimer=setInterval(()=>{i++;el.textContent=text.slice(0,i);if(i>=text.length){clearInterval(typeTimer);typeState=null;el.classList.remove("typing-cursor")}},18)}
function typeComplete(){if(!typeState)return false;clearInterval(typeTimer);typeState.el.textContent=typeState.text;typeState.el.classList.remove("typing-cursor");typeState=null;return true}
/* 2.45：オープニングのスライドショー画像（op01〜op10）を本編の対応シーンでも使う。
   対象シーン列の1枚目に差し込む（op01はプロローグで使用済み、op03は那珂川イベントに直接指定、op10は卒業＝エンディング全般）。 */
const OP_STORY_IMG={"ST-SAKURA-1":"assets/op02.webp","EV-25":"assets/op05.webp","EV-35":"assets/op09.webp","EV-18":"assets/op07.webp","LC-yana":"assets/op06.webp","LC-ungan_kouyou":"assets/op08.webp","HK-hok_library":"assets/op04.webp"};
function opImgFor(no){
 if(typeof S!=="undefined"&&S&&S.ended)return "assets/op10.webp";
 return (no&&OP_STORY_IMG[no])||null;
}
function applyOpImg(scs,no){
 const img=opImgFor(no);
 if(!img||!scs||!scs.length)return scs;
 return scs.map((c,i)=>i===0?Object.assign({},c,{img:img}):c);
}
function playNovel(scenes,done,tag){
setImgPattern(tag);
if(typeof S!=="undefined"&&S&&tag)S._lastEvent=tag;
const no=scenes.__no||__adminNextNo||deriveStoryNo(tag);__adminNextNo=null;__adminCurNo=no;
const ov=ADMIN.overrides[no];
let scs=scenes;
if(ov){scs=scenes.map((sc,i)=>{const c=Object.assign({},sc);if(ov.img)c.img=ov.img;if(ov.variant&&c.hero)c.variant=ov.variant;if(ov.texts&&ov.texts[i]!=null)c.text=ov.texts[i];return c})}
scs=applyOpImg(scs,no);
show("screen-novel");novelQueue=scs;novelIdx=0;novelDone=done||null;
if(ov&&ov.fx){const d0=novelDone;novelDone=()=>{applyAdminFx(ov.fx);if(d0)d0()}}
$("novel-tag").textContent=tag||"物語";setBGM(bgmForNovel(tag));renderNovel();
}
function renderNovel(){
stopSpeak();
updateStoryBadge();
const sc=novelQueue[novelIdx];if(!sc){finishNovel();return}
const h=sc.hero?hero(sc.hero):null;
if(sc.img){$("novel-img").src=sc.img;lastStageSrc=sc.img;$("novel-img-chip").classList.add("hidden")}
else if(h){applyStageImg($("novel-img"),$("novel-img-chip"),h.id,pickVariant(h.id,sc.variant))}
else{$("novel-img").src="assets/sakura.webp";lastStageSrc="assets/sakura.webp";$("novel-img-chip").classList.add("hidden")}
const __ni=$("novel-img");__ni.classList.remove("motion-slide","motion-shake","motion-jump");if(sc.motion){void __ni.offsetWidth;__ni.classList.add("motion-"+sc.motion)}
applyImgMotion(__ni);
const whoTxt=sc.sys?"【システム】":sc.player?pName():(sc.who||(h?h.name:"　"));
$("novel-who").textContent=whoTxt;
$("novel-who").className="who"+(sc.sys?" sys":sc.player?" player":"");
autoSpeak("novel",novelIdx,sc,h);typeText($("novel-text"),(sc.text||"").replaceAll("{call}",S?pCall(h?h.id:null):"君").replaceAll("{nick}",S?(S.nick||S.first):"白夜").replaceAll("{last}",S?S.last:"黒羽").replaceAll("{first}",(h&&!sc.player&&!sc.sys&&S)?pCall(h.id):(S?S.first:"白夜")).replaceAll("{name}",S?pName():"主人公"));
const ch=$("novel-choices");ch.innerHTML="";
if(sc.choices){ch.classList.remove("hidden");$("novel-next").classList.add("hidden");
sc.choices.forEach(c=>{const b=document.createElement("button");b.textContent=c.label;b.onclick=()=>{beep(740,.1);ch.classList.add("hidden");$("novel-next").classList.remove("hidden");if(c.effect)c.effect();novelIdx++;renderNovel()};ch.appendChild(b)});
}else{ch.classList.add("hidden");$("novel-next").classList.remove("hidden")}
}
function finishNovel(){stopSpeak();const b=$("story-no-badge");if(b)b.classList.add("hidden");__adminCurNo=null;const d=novelDone;novelDone=null;if(d)d()}
$("novel-next").onclick=()=>{if(typeComplete())return;beep(520,.07);novelIdx++;renderNovel()};
$("novel-stage").addEventListener("click",e=>{if(typeComplete())return;if(e.target.closest("button")||e.target.closest(".choices"))return;if(!$("novel-choices").classList.contains("hidden"))return;novelIdx++;renderNovel()});
$("novel-skip").onclick=()=>finishNovel();
document.querySelectorAll(".btn-translate").forEach(b=>b.onclick=()=>{translateMode=!translateMode;document.querySelectorAll(".btn-translate").forEach(x=>x.textContent="⌨️ タイプモード: "+(translateMode?"OFF":"ON"));toast(translateMode?"⌨️ タイプモード: OFF（文章を一括表示します）":"⌨️ タイプモード: ON（タイプライター表示）")});
$("novel-title").onclick=()=>{resetPlayState();__adminCurNo=null;show("screen-title");toast("タイトルに戻りました。「さっきの画面にもどる」で再開できます")};
$("btn-resume").onclick=()=>{if(!S)return;beep(660,.08);if(S.ended){show("screen-ending")}else{show("screen-game");render()}};

/* ================= OPENING ================= */
function prologueScenes(){return [
{who:"　",text:"――桜の花びらが、舞っていた。",img:"assets/op01.webp"},
{who:"　",text:"私立桜丘黒羽学園。創立100年を超えるこの学園には、一つの伝説がある。"},
{who:"　",text:"「卒業式の日、校舎の屋上で告白すると、その恋は必ず実る」――そして校庭の伝説の桜は、それを見守っているという。"},
{who:"　",text:"今日から高校1年。"+pName()+"の、3年間が始まる。"},
{hero:"sakura",who:"桜井 さくら",text:"あっ！"+pCall("sakura")+"！おはよう！今年も同じクラスだね！"},
{who:"　",text:"隣の家に住む幼なじみ、桜井さくら。小さい頃からずっと一緒だった。"},
{hero:"sakura",who:"桜井 さくら",text:"ねえ、知ってる？屋上の伝説。卒業式の日に告白すると、その恋は実るんだって。…3年後なんて、まだまだ先の話だね。さ、遅刻するよ！"},
{who:"　",text:"走り出すさくらの背中を追いながら、思った。――この3年間を、絶対に無駄にしない。"},
{who:"　",text:"勉強、スポーツ、そして――。桜色の3年間が、今、始まる。"}
]}
$("btn-new").onclick=()=>{beep(660,.1);show("screen-name")};
$("btn-name-back").onclick=()=>show("screen-title");
$("btn-start-story").onclick=()=>{
const last=$("in-last").value.trim()||"黒羽",first=$("in-first").value.trim()||"白夜";
const nick=$("in-nick").value.trim()||"グレイ";
const lastYomi=$("in-last-yomi").value.trim(),firstYomi=$("in-first-yomi").value.trim(),nickYomi=$("in-nick-yomi").value.trim();
S=defaultState(last,first,nick,$("in-birth").value,$("in-goal").value,lastYomi,firstYomi,nickYomi);resetPlayState();
if(META.clears>0){const b=Math.min(META.clears,3);HEROINES.forEach(h=>{S.aff[h.id]=clamp(S.aff[h.id]+3*b);S.prevAff[h.id]=S.aff[h.id]});Object.keys(S.stats).forEach(k=>{if(k!=="stress")S.stats[k]=clamp(S.stats[k]+2*b)});S.money+=1500*b;S.clears=META.clears;setTimeout(()=>toast("🌸 周回特典："+META.clears+"周クリア済みボーナス適用（好感度・能力・所持金アップ）"),800)}
S.memories.forEach(id=>albumUnlocked.add(id));persistAlbum();chime();
unlockMem("mem_op01");
$("screen-novel").classList.add("prologue-mode");
playNovel(prologueScenes(),()=>{$("screen-novel").classList.remove("prologue-mode");startGame("新学期が始まった！コマンドを選んで1週間を過ごそう。")},"🌸 プロローグ");
};
$("btn-howto").onclick=()=>{beep(660,.08);const c=$("howto-card");c.classList.toggle("hidden");if(!c.classList.contains("hidden"))setTimeout(()=>c.scrollIntoView({behavior:"smooth",block:"start"}),40)}; /* v2 fix: 開いたら「あそびかた」の先頭まで自動スクロール */
/* ==== 組み込みドキュメント（紹介・説明）の開閉 ==== */
function showDoc(id){["doc-intro","doc-readme"].forEach(d=>{const el=$(d);if(el)el.classList.toggle("hidden",d!==id)});const t=$(id);if(t)setTimeout(()=>t.scrollIntoView({behavior:"smooth",block:"start"}),40)}
function toggleDoc(id){const el=$(id);if(!el)return;if(el.classList.contains("hidden"))showDoc(id);else el.classList.add("hidden")}
$("btn-intro-open").onclick=()=>{beep(660,.08);showDoc("doc-intro")};
document.querySelectorAll(".doc-close").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();const el=$(b.dataset.doc);if(el)el.classList.add("hidden");window.scrollTo({top:0,behavior:"smooth"})}));
document.querySelectorAll(".doc-jump").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();showDoc(b.dataset.doc)}));

/* ================= GAME RENDER ================= */
let gameBusy=false;
function render(){
if(!S)return;
const d=dateLabel(S.turn);
const __pg=$("page-no-badge");if(__pg&&$("screen-novel").classList.contains("hidden")){__pg.textContent="第"+S.turn+"週／全"+TOTAL_TURNS+"週 ・ "+d.text;__pg.classList.remove("hidden")}
$("date-chip").innerHTML=d.text+' <span class="season">'+d.season+"</span>　卒業まであと"+(TOTAL_TURNS+1-S.turn)+"週";
$("player-name-label").textContent=pName();
if(!S.skills)S.skills={reigi:22,bungaku:20,ongaku:18,ryouri:15,souji:20,kidate:30};
const prow=(name,v,cls,rank)=>'<div class="prow'+(rank?" eval":"")+'"><span class="pn">'+name+'</span><span class="pv">'+v+(rank?' <span class="rank">'+rank+'</span>':"")+'</span><span class="bar '+(cls||"")+'"><i style="width:'+v+'%"></i></span></div>';
$("stats-box").innerHTML=
 '<div class="pgroup"><h4>◆ 基本パラメータ</h4>'+STAT_DEFS.map(s=>prow(s.name,S.stats[s.key]||0,s.cls)).join("")+"</div>"+
 '<div class="pgroup"><h4>◆ 系統別評価（自動計算）</h4>'+evalsOf(S.stats,S.skills).map(e=>prow(e.name,e.v,"blue",rankOf(e.v))).join("")+"</div>"+
 '<div class="pgroup"><h4>◆ 細かなスキル</h4>'+SKILL_DEFS.map(s=>prow(s.name,S.skills[s.key]||0,s.cls)).join("")+"</div>"+'<div class="pgroup"><h4>◆ 所持金・体調</h4><div class="kv"><span>💰 所持金</span><span>'+(S.money||0)+"円</span></div>"+(S.sick?'<div class="kv"><span>🤒 体調</span><span>寝込んでいる（休養で回復）</span></div>':"")+"</div>";
$("condition-note").textContent=S.sick?"🤒 寝込んでいる…「休養する」で回復しよう。お見舞いが来るかも。":S.stats.stress>=80?"⚠ ストレスが限界に近い！休養しよう。":S.stats.stress>=55?"少し疲れ気味かも。":S.stats.tairyoku<=25?"体力が少ない。無理は禁物。":"調子は良好！";
$("heroine-box").innerHTML=HEROINES.map(h=>{
if(!S.met[h.id])return '<div class="heart-row"><img src="'+h.img+'" alt=""><div><div class="nm">？？？</div><div class="st">まだ出会っていない</div></div></div>';
const away=S.turn-S.lastMeet[h.id];const bomb=away>=9&&S.aff[h.id]>10;
const hurt=(S.hurt&&S.hurt[h.id])||0;const storyN=(S.story&&S.story[h.id])||0;
return '<div class="heart-row"><img src="'+h.img+'" alt="'+h.name+'"><div><div class="nm">'+h.name+'</div><div class="st">'+h.role+"<br>"+affState(S.aff[h.id])+"<br>💬 呼び方：「"+pCall(h.id)+"」"+(storyN>0?"<br>📖 物語 第"+storyN+"章まで":"")+"<br>信頼 "+relOf(h.id).trust+"／親密 "+relOf(h.id).close+(relOf(h.id).jealous>=25?"／💢嫉妬 "+relOf(h.id).jealous:"")+"<br>📋 プロフィール開放 Lv"+profStageOf(h.id)+"/5"+'<br><button class="btn small" data-profile="'+h.id+'" style="min-height:32px;padding:3px 10px;font-size:11px;margin-top:3px">📋 プロフィール</button></div></div><div class="hearts">'+hearts(S.aff[h.id])+(bomb?'<span class="bomb">💣 さみしがっている…</span>':"")+(hurt>=30?'<span class="bomb">💔 傷心度 '+hurt+"</span>":"")+"</div></div>"}).join("");
document.querySelectorAll("[data-profile]").forEach(b=>b.onclick=()=>openProfile(b.dataset.profile));
$("log-box").innerHTML=S.logs.length?S.logs.map(l=>"<div>"+esc(l)+"</div>").join(""):"<div>まだ何もない。</div>";
$("cmd-grid").innerHTML=COMMANDS.map(c=>'<button class="cmd'+(c.id==="date"?" date":"")+'" data-cmd="'+c.id+'"><span class="ic">'+c.icon+'</span>'+c.name+'<span class="fx">'+c.fx+'</span></button>').join("");
document.querySelectorAll("[data-cmd]").forEach(b=>b.onclick=()=>doCommand(b.dataset.cmd));
checkAddrUnlocks();
renderSys();
}
function setStage(heroId,who,text,tag,variant){
setImgPattern(tag);
const hid=heroId||"sakura";
applyStageImg($("game-img"),$("game-img-chip"),hid,pickVariant(hid,variant));
const __gi=$("game-img");__gi.classList.remove("motion-slide","motion-shake","motion-jump");void __gi.offsetWidth;__gi.classList.add("motion-slide");
$("game-who").textContent=who||"　";
$("game-who").className="who"+(who==="【システム】"?" sys":(S&&who===pName())?" player":"");
typeText($("game-text"),text);
$("game-tag").textContent=tag||"桜丘黒羽学園";
$("game-choices").classList.add("hidden");$("game-next").classList.add("hidden");
}
function startGame(msg){show("screen-game");render();
["assets/sakura-smile.webp","assets/sakura-shy.webp","assets/sakura-date.webp","assets/sakura-yukata.webp","assets/sakura-gyouji.webp","assets/sakura-club.webp","assets/sakura-winter.webp","assets/sakura-ski.webp","assets/sakura-sick.webp","assets/sakura-planet.webp","assets/sakura-grad.webp","assets/sakura-ending.webp","assets/akari-smile.webp","assets/akari-shy.webp","assets/akari-date.webp","assets/akari-yukata.webp","assets/akari-gyouji.webp","assets/akari-club.webp","assets/akari-winter.webp","assets/akari-ski.webp","assets/akari-grad.webp","assets/akari-ending.webp","assets/yuki-smile.webp","assets/yuki-shy.webp","assets/yuki-date.webp","assets/yuki-yukata.webp","assets/yuki-gyouji.webp","assets/yuki-club.webp","assets/yuki-winter.webp","assets/yuki-grad.webp","assets/yuki-ending.webp","assets/rin-smile.webp","assets/rin-shy.webp","assets/rin-date.webp","assets/rin-yukata.webp","assets/rin-gyouji.webp","assets/rin-club.webp","assets/rin-winter.webp","assets/rin-grad.webp","assets/rin-ending.webp","assets/sakura-gym.webp","assets/akari-gym.webp","assets/yuki-gym.webp","assets/rin-gym.webp","assets/akari-planet.webp","assets/yuki-planet.webp","assets/rin-planet.webp","assets/yuki-ski.webp","assets/sakura-sea.webp","assets/akari-sick.webp","assets/akari-sea.webp","assets/yuki-sick.webp","assets/yuki-sea.webp","assets/rin-ski.webp","assets/rin-sick.webp","assets/rin-sea.webp"].forEach(src=>{const im=new Image();im.src=src});
setStage("sakura","桜井 さくら",msg||"さくら「今年もよろしくね、"+pCall("sakura")+"！」","🌸 桜丘黒羽学園・教室","normal")}

/* ================= PROFILE ================= */
function openProfile(hid){
const h=hero(hid);const p=h.profile;const met=S&&S.met[hid];
const stage=met?profStageOf(hid):0;const r=met?relOf(hid):{trust:0,close:0,jealous:0};
const placeNames=h.like.map(id=>{const pl=PLACES.find(x=>x.id===id);return pl?pl.name:id}).join("、");
const kv=(k,v)=>'<div class="kv"><span>'+k+'</span><span style="text-align:right;max-width:62%">'+v+"</span></div>";
const lock=(k,need)=>'<div class="kv"><span>'+k+'</span><span style="color:var(--muted)">🔒 好感度'+need+'以上で開放</span></div>';
let rows="";
if(met){
 rows+=kv("🎂 誕生日",p.birthday+"（血液型 "+p.blood+"）")+kv("🏫 部活",p.club)+kv("🎨 趣味",p.hobby);
 rows+=kv("💗 好感度／状態",S.aff[hid]+"（"+affState(S.aff[hid])+"）")+kv("📖 二人の物語","第"+((S.story&&S.story[hid])||0)+"章／全8章");
 if(stage>=2){rows+=kv("💗 性格",p.personality)+kv("⭐ 好きな物",p.fav)+kv("💦 苦手な物",p.dislike)+kv("🤝 信頼度",r.trust)+kv("🏠 親密度",r.close)+kv("💢 嫉妬度",r.jealous)+kv("💔 傷心度",((S.hurt&&S.hurt[hid])||0))}
 else rows+=lock("💗 性格・好きな物・関係値",30);
 if(stage>=3){rows+=kv("🎁 喜ぶプレゼント",p.giftName)+kv("💌 好きなデート先",placeNames)+kv("✉️ メールアドレス",p.mail)}
 else if(stage>=2)rows+=lock("🎁 プレゼント・メールアドレス",50);
 if(stage>=4){rows+=kv("📱 電話番号",p.tel)}
 else if(stage>=3)rows+=lock("📱 電話番号",70);
 if(stage>=5||(S.flags&&S.flags["secret_"+hid])){rows+=kv("🤫 秘密の一面",p.secret)}
 if((stage>=5||(S.flags&&S.flags["secret_"+hid]))&&p.roots){rows+=kv("🏮 黒羽との縁",p.roots)}
 else if(stage>=4)rows+=lock("🤫 秘密の一面",85);
 const hist=(S.history&&S.history[hid])||[];
 if(hist.length)rows+='<div style="margin-top:8px;font-size:12.5px;font-weight:700;color:var(--muted);line-height:1.8">🕘 二人の履歴：'+hist.map(x=>esc(x.label)).join("／")+"</div>";
}
$("profile-body").innerHTML=
 '<div style="display:flex;gap:14px;flex-wrap:wrap"><img src="'+heroImgBy(h,"smile")+'" alt="'+h.name+'" style="width:130px;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:12px">'+
 '<div style="flex:1;min-width:210px"><h3 class="mincho" style="margin:0 0 2px;font-size:22px">'+h.name+'</h3><div style="font-weight:900;color:var(--pink-d);font-size:13px">'+h.role+'</div>'+
 (met?'<div style="font-weight:900;font-size:12.5px;margin-top:4px">📋 プロフィール開放度 Lv'+stage+"／5（好感度で開放）</div>":"")+
 '<p style="font-weight:500;line-height:1.8;font-size:13.5px;margin:8px 0">'+h.desc+"</p></div></div>"+
 (met?rows:'<p style="font-weight:700;color:var(--muted)">まだ出会っていない。学園生活の中で出会えるはず。</p>');
$("modal-profile").classList.remove("hidden");beep(700,.08);
}
$("profile-close").onclick=()=>$("modal-profile").classList.add("hidden");
$("modal-profile").addEventListener("click",e=>{if(e.target.id==="modal-profile")$("modal-profile").classList.add("hidden")});

/* ================= GIFT ================= */
function openGift(){
const cand=HEROINES.filter(h=>S.met[h.id]);
if(!cand.length){toast("まだプレゼントを渡せる相手がいない");return}
gameBusy=true;
setStage(null,"　","誰にプレゼントを渡そう？プロフィールで「喜ぶプレゼント」を調べるのがコツ。","🎁 プレゼント");
const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
cand.forEach(h=>{const b=document.createElement("button");b.textContent=h.name+"（好感度 "+S.aff[h.id]+"）";
b.onclick=()=>{ch.classList.add("hidden");pickGift(h)};ch.appendChild(b)});
const cancel=document.createElement("button");cancel.textContent="やっぱりやめる";cancel.onclick=()=>{ch.classList.add("hidden");gameBusy=false;setStage("sakura","　","プレゼントはまた今度にしよう。","📅 "+dateLabel(S.turn).text)};ch.appendChild(cancel);
}
function pickGift(h){
setStage(h.id,h.name,"何を渡そう？"+h.short+"の好きな物はプロフィールに書いてあったはず…。","🎁 贈り物は？");
const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
GIFTS.forEach(g=>{const b=document.createElement("button");b.textContent=g.name;
b.onclick=()=>{ch.classList.add("hidden");runGift(h,g)};ch.appendChild(b)});
}
function runGift(h,g){
const fav=h.profile.gift===g.id;
const delta=fav?12:(g.id==="flower"||g.id==="book")?6:3;
S.aff[h.id]=clamp(S.aff[h.id]+delta);S.lastMeet[h.id]=S.turn;addHurt(h.id,-15);rippleHurt(h.id,4);addRel(h.id,{trust:fav?4:2,close:fav?6:3});pushHistory(h.id,"gift",g.name+"のプレゼント");checkProfileUnlocks();
addLog(h.short+"に"+g.name+"をプレゼント（好感度+"+delta+"）");if(fav)chime();else beep(600,.1);
playNovel([
{hero:h.id,who:"　",text:g.name+"を、少し緊張しながら"+h.name+"に渡した。"},
{hero:h.id,who:h.name,variant:fav?"smile":"shy",text:fav?"え…これ、私が好きなやつ…！なんで分かったの？…ありがとう、大事にするね！":g.id==="flower"?"わあ、お花…ありがとう。教室に飾るね":"ありがとう。気持ちが嬉しいよ"},
{hero:h.id,who:"　",variant:"shy",text:fav?h.short+"は贈り物を宝物みたいに抱きしめた。プロフィールを覚えていてよかった。":"贈り物より、覚えていてくれた気持ちが伝わった気がした。"}
],()=>{show("screen-game");render();gameBusy=false;nextTurn()},"🎁 プレゼント");
}

/* ================= COMMANDS ================= */
function applyFx(fxd){
const msgs=[];
for(const k in fxd){const d=rnd(fxd[k][0],fxd[k][1]);let bonus=0;
if(S.birthBonus===k&&d>0)bonus=1;
const isSkill=!!SKILL_DEFS.find(s=>s.key===k);
const bag=isSkill?S.skills:S.stats;
const before=bag[k]||0;bag[k]=clamp(before+d+bonus);
const nm=((STAT_DEFS.find(s=>s.key===k)||SKILL_DEFS.find(s=>s.key===k)||{}).name)||k;const real=bag[k]-before;
if(real!==0)msgs.push(nm+(real>0?" +":" ")+real)}
return msgs;
}
/* ================= SECRET（レアキャラ・1〜2回だけの出会い⑫） ================= */
function secretEvent(done){
 if(!S)return false;
 const month=dateLabel(S.turn).month;
 const pool=SECRET_EVENTS.filter(e=>(!e.months||e.months.includes(month))&&((S.flags["sec_"+e.id]||0)<2));
 if(!pool.length)return false;
 const ev=pool[rnd(0,pool.length-1)];S.flags["sec_"+ev.id]=(S.flags["sec_"+ev.id]||0)+1;__adminNextNo="SC-"+ev.id;
 if(ev.id==="muscle")unlockMem("mem_ev11");
 const metIds=HEROINES.filter(h=>S.met[h.id]).map(h=>h.id);
 const hid=(ev.img&&S.met[ev.img])?ev.img:(metIds.length?metIds[rnd(0,metIds.length-1)]:"sakura");const h=hero(hid);
 S.aff[hid]=clamp(S.aff[hid]+4);S.stats.stress=clamp(S.stats.stress-5);S.lastMeet[hid]=S.turn;
 addLog("✨ レアな出会い「"+ev.title+"」（"+h.short+" 好感度+4）");
 playNovel([{hero:hid,who:h.name,variant:"normal",text:"――レアな出会い「"+ev.title+"」"},{hero:hid,who:"　",variant:"smile",text:ev.text}],()=>{show("screen-game");render();done()},"✨ レアな出会い");
 return true;
}
function doCommand(id){
if(gameBusy||!S||S.ended)return;
if(S.sick&&id!=="rest"){toast("🤒 寝込んでいる…今週は「休養する」で体を休めよう");sysNotify("🤒 寝込んでいるため行動できません。「休養する」を選んでください",1);return}
window.scrollTo(0,0); /* v2 fix: コマンドを押したら全端末で画面の一番上（日付の行）まで戻る */
if(id==="date"){openDate();return}
if(id==="gift"){openGift();return}
if(id==="contact"){openContact();return}
const cmd=COMMANDS.find(c=>c.id===id);gameBusy=true;beep(600,.08);
const msgs=applyFx(cmd.fxd);
if(id==="sport"&&typeof nurseTryInjury==="function"&&nurseTryInjury(()=>{gameBusy=false;nextTurn()}))return;
if(id==="work"){const pay=rnd(1500,2500);S.money+=pay;msgs.push("バイト代 +"+pay+"円")}
addLog(cmd.name+"（"+(msgs.join("、")||"変化なし")+"）");
/* bomb decay + hurt drift */
HEROINES.forEach(h=>{if(S.met[h.id]&&S.turn-S.lastMeet[h.id]>=9&&S.aff[h.id]>8){S.aff[h.id]=clamp(S.aff[h.id]-2);addHurt(h.id,3)}else addHurt(h.id,-1)});
if(S.stats.tairyoku<=18&&!S.sick)sysNotify("⚠ プレイヤーの体力が落ちています…放置すると病気で寝込んでしまいます",1);
/* sickness: stress max or stamina depleted */
if(!S.sick&&(S.stats.stress>=100||(S.stats.tairyoku<=6&&S.stats.stress>=60))){S.sick=true;S.stats.stress=clamp(S.stats.stress-25);
addLog("無理がたたって病気で寝込んでしまった…");sysNotify("🤒 プレイヤーが病気で寝込んでしまいました…「休養する」で回復しましょう",1);render();
playNovel([{sys:true,text:"プレイヤーの体力が限界を超えました。病気で寝込むことになりました…。休養すると回復します。"},{player:true,text:"うう…頭が重い…。まさか自分が寝込むなんて…。"},{who:"　",text:"布団の中で天井を見上げた。無理をしすぎたのかもしれない。今はしっかり休もう。"},{hero:"sakura",who:"桜井 さくら",variant:"sick",text:"（電話で）大丈夫！？…無理しちゃダメだよ。…お見舞い、行ってもいい？"}],()=>{show("screen-game");render();nextTurn()},"🤒 寝込む");
gameBusy=false;return}
if(S.sick&&id==="rest"){sickRest(()=>{gameBusy=false;nextTurn()});render();return}
if(id==="rest"&&typeof nurseTryOffice==="function"&&nurseTryOffice(()=>{gameBusy=false;nextTurn()})){render();return}
/* scheduled / hokkori / encounter */
if(customStoryEvent(()=>{gameBusy=false;nextTurn()})){render();return}
if(storyEvent(()=>{gameBusy=false;nextTurn()})){render();return}
if(dateLabel(S.turn).month===8&&!S.flags.fireworksDone&&HEROINES.some(h=>S.met[h.id])){const topF=HEROINES.filter(h=>S.met[h.id]).slice().sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];evFireworks(topF,()=>{gameBusy=false;nextTurn()});render();return}
const ev=scheduledEvent();
if(ev){__adminNextNo="EV-"+String(turnInYear(S.turn)).padStart(2,"0");render();ev(()=>{bonusEvent(id,()=>{gameBusy=false;nextTurn()})});return}
const roll=Math.random();
if(roll<0.20){hokkoriEvent(()=>{gameBusy=false;nextTurn()});render();return}
if(roll<0.44&&extraEvent(()=>{gameBusy=false;nextTurn()})){render();return}
if(roll<0.50&&secretEvent(()=>{gameBusy=false;nextTurn()})){render();return}

if(roll<0.72){encounter(id,()=>{gameBusy=false;nextTurn()});render();return}
const leadTxt=cmd.name+"。"+(msgs.length?msgs.join("、")+"。":"")+"その週、黒羽の町で小さな出来事があった。";
if(S.kuhi&&S.kuhi.length<10&&Math.random()<0.5){kuhiEvent(()=>{gameBusy=false;nextTurn()},leadTxt)}else{localEvent(()=>{gameBusy=false;nextTurn()},leadTxt)}render();return;
}
function encounter(cmdId,done){
if(S.flags)S.flags.talk=(S.flags.talk||0)+1;
const weights={study:["yuki","rin","sakura"],sport:["akari","sakura","rin"],style:["sakura","rin","akari"],art:["rin","yuki","sakura"],manner:["rin","sakura"],cooking:["sakura","akari"],clean:["rin","yuki"],friend:["sakura","akari","yuki","rin"],volunteer:["sakura","yuki","akari"],work:["rin","sakura","yuki"],rest:["sakura","yuki"]};
const pool=weights[cmdId]||["sakura"];
const hid=pool[rnd(0,pool.length-1)];const h=hero(hid);const first=!S.met[hid];
S.met[hid]=true;S.lastMeet[hid]=S.turn;
const line=h.lines[rnd(0,h.lines.length-1)];
const intro=first?"――初めて言葉を交わした。"+h.desc:"";
setStage(hid,h.name,(intro?intro+"\n":"")+h.short+"「"+line.q+"」","💬 放課後");
const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
[[line.a,line.ra,line.ta],[line.b,line.rb,line.tb]].forEach(([label,delta,res])=>{
const b=document.createElement("button");b.textContent=label;
b.onclick=()=>{S.aff[hid]=clamp(S.aff[hid]+delta);S.lastMeet[hid]=S.turn;addHurt(hid,-12);addRel(hid,delta>=0?{trust:2,close:3}:{trust:-2});addLog(h.name+"と会話（好感度"+(delta>=0?"+":"")+delta+"）");beep(delta>=0?784:392,.12);ch.classList.add("hidden");const cb=lastHistoryLabel(hid);setStage(hid,h.name,res+(cb?"\n――話の流れで、この前の「"+cb+"」の話題になった。彼女はちゃんと覚えていた。":""),"💬 放課後",delta>=5?"smile":(delta<0?"shy":undefined));render();
const nx=$("game-next");nx.classList.remove("hidden");nx.onclick=()=>{nx.classList.add("hidden");done()}};
ch.appendChild(b)});
}
function hokkoriEvent(done){
if(S.flags)S.flags.talk=(S.flags.talk||0)+1;
const ev=HOKKORI[rnd(0,HOKKORI.length-1)];__adminNextNo="HK-"+ev.id;
 const SPOT_BY_HOK={hok_library:"library",hok_ayu:"nakagawa"};visitSpot(SPOT_BY_HOK[ev.id]);
const metIds=HEROINES.filter(h=>S.met[h.id]).map(h=>h.id);
const hid=(ev.img&&S.met[ev.img])?ev.img:(metIds.length?metIds[rnd(0,metIds.length-1)]:"sakura");const h=hero(hid);
S.aff[hid]=clamp(S.aff[hid]+5);S.stats.stress=clamp(S.stats.stress-10);S.lastMeet[hid]=S.turn;
unlockMem(ev.id);addLog("ほっこりイベント「"+ev.title+"」（"+h.short+" 好感度+5、ストレス-10）");
const text=ev.text.replaceAll("{hero}",h.short);
const hv=(S.turn%2===0)?"smile":"shy";
playNovel([{hero:hid,who:h.name,variant:hv,text:"――ほっこりイベント「"+ev.title+"」"},{hero:hid,who:"　",variant:hv,text}],()=>{show("screen-game");render();done()},"♡ ほっこりイベント");
}
/* ================= LOCAL EVENTS（黒羽・大田原の地元ミニイベント） ================= */
function localEvent(done,lead){
 if(typeof nurseTownIntercept==="function"&&nurseTownIntercept(done,lead))return;
 const month=dateLabel(S.turn).month;
 if(!S.localSeen)S.localSeen=[];
 const inSeason=e=>!e.months||e.months.includes(month);
 let pool=LOCAL_EVENTS.filter(e=>inSeason(e)&&!S.localSeen.includes(e.id));
 if(!pool.length){S.localSeen=S.localSeen.filter(id=>{const e=LOCAL_EVENTS.find(x=>x.id===id);return !(e&&inSeason(e))});pool=LOCAL_EVENTS.filter(e=>inSeason(e)&&!S.localSeen.includes(e.id))}
 if(!pool.length)pool=LOCAL_EVENTS.filter(inSeason);
 if(!pool.length){if(done)done();return}
 const ev=pool[rnd(0,pool.length-1)];S.localSeen.push(ev.id);__adminNextNo="LC-"+ev.id;
 if(typeof localMemHook==="function")localMemHook(ev);
 const SPOT_BY_LOCAL={ozeki_kinenhi:"ozeki",ungan_zazen:"unganji",ungan_kouyou:"unganji",daioji:"daioji",yana:"nakagawa",gohou:"gohou",yoichi:"yoichi",library_seki:"library",joseki_bench:"joseki",illumi:"joseki",basho_yakata:"basho_yakata",kagetsu_mae:"kagetsu",gelato:"yoichi",ayu_shioyaki:"nakagawa",ayu_tsukami:"nakagawa",haiku:"basho_yakata",ajisai:"joseki",ajisai_light:"joseki",ajisai_sketch:"joseki",daioji_saho:"daioji",ungan_bridge:"unganji",yoichi_den:"yoichi",kurohacha:"yoichi"};visitSpot(SPOT_BY_LOCAL[ev.id]);
 const metIds=HEROINES.filter(h=>S.met[h.id]).map(h=>h.id);
 const hid=(ev.img&&S.met[ev.img])?ev.img:(metIds.length?metIds[rnd(0,metIds.length-1)]:"sakura");const h=hero(hid);
 const fx=ev.fx||{};const affD=fx.aff||4;
 S.aff[hid]=clamp(S.aff[hid]+affD);S.stats.stress=clamp(S.stats.stress+(fx.stress||-6));S.lastMeet[hid]=S.turn;addRel(hid,{close:2});
 addLog("黒羽の出来事「"+ev.title+"」（"+h.short+" 好感度+"+affD+"）");
 const text=ev.text.replaceAll("{hero}",h.short);
 const scenes=[];
 if(lead)scenes.push({sys:true,text:lead});
 if(ev.pic)scenes.push({who:"　",img:ev.pic,text:"――"+ev.title+"。その景色を、目に焼き付けた。"});
 scenes.push({hero:hid,who:h.name,variant:"normal",text:"――黒羽の出来事「"+ev.title+"」"},{hero:hid,who:"　",variant:"smile",text});
 playNovel(scenes,()=>{show("screen-game");render();done()},"🏮 黒羽の出来事");
}
/* ================= KUHI（松尾芭蕉の句碑めぐり・大田原市公式ページ掲載の10か所） ================= */
function kuhiEvent(done,lead){
 if(!S.kuhi)S.kuhi=[];
 const rest=KUHI.filter(k=>!S.kuhi.includes(k.no));
 if(!rest.length){localEvent(done,lead);return}
 const k=rest[0];S.kuhi.push(k.no);visitSpot("kuhi"+k.no);__adminNextNo="KB-"+k.no;
 unlockMem("mem_kuhi"+String(k.no).padStart(2,"0"));if(k.no===8)unlockMem("mem_op15");
 const metIds=HEROINES.filter(h=>S.met[h.id]).map(h=>h.id);
 const hid=S.met.yuki?"yuki":(metIds.length?metIds[rnd(0,metIds.length-1)]:"sakura");const h=hero(hid);
 S.aff[hid]=clamp(S.aff[hid]+5);S.stats.stress=clamp(S.stats.stress-5);S.lastMeet[hid]=S.turn;addRel(hid,{close:2});
 const doneAll=S.kuhi.length>=10;
 addLog("句碑めぐり「"+k.spot+"」（"+S.kuhi.length+"/10）");
 const scenes=[];
 if(lead)scenes.push({sys:true,text:lead});
 scenes.push({who:"　",img:KUHI_IMGS[k.no],text:"――"+k.spot+"。石に刻まれた句が、静かに迎えてくれた。"});
 scenes.push({hero:hid,who:h.name,variant:"normal",text:"――句碑めぐり（"+S.kuhi.length+" / 10）「"+k.spot+"」"},
 {hero:hid,who:"　",variant:"normal",text:k.spot+"へ。石に刻まれた句を、"+h.short+"と声に出して読んだ。\n\n「"+k.haiku+"」\n\n"+k.note},
 {hero:hid,who:h.name,variant:"smile",text:doneAll?"…これで10か所、全部回りましたね。黒羽の町が、少しだけ私たちの町になった気がします":"あと"+(10-S.kuhi.length)+"か所ですね。…全部回れたら、きっと黒羽のことがもっと好きになります"});
 if(doneAll)scenes.push({sys:true,text:"🎉 句碑10か所をすべて巡りました！実績「句碑めぐり制覇」を達成。思い出がアルバムに追加されました。"});
 playNovel(scenes,()=>{if(doneAll){unlockMem("mem_kuhi");unlockAch("kuhi_master")}show("screen-game");render();done()},"🗿 句碑めぐり");
}
/* ================= STORY ARCS（各ヒロイン8章立て） ================= */
function storyEvent(done){
 if(!S.story)S.story={sakura:0,akari:0,yuki:0,rin:0};
 const grade=gradeOf(S.turn);
 const cands=HEROINES.filter(h=>{const ci=S.story[h.id]||0;if(ci>=2&&grade<2)return false;if(ci>=3&&grade<3)return false;return S.met[h.id]&&STORY[h.id][ci]&&S.aff[h.id]>=STORY[h.id][ci].min})
  .sort((a,b)=>S.aff[b.id]-S.aff[a.id]);
 if(!cands.length)return false;
 const h=cands[0];const ch=STORY[h.id][S.story[h.id]||0];__adminNextNo="ST-"+h.id+"-"+((S.story[h.id]||0)+1);
 playNovel([{hero:h.id,who:"　",text:"――"+h.name+"の物語「"+ch.title+"」"}].concat(ch.scenes),
 ()=>{S.story[h.id]=(S.story[h.id]||0)+1;S.lastMeet[h.id]=S.turn;addHurt(h.id,-20);unlockMem("mem_story");if(h.id==="sakura"&&S.story.sakura===1){unlockMem("mem_op02");unlockMem("mem_op13")}
  addLog(h.short+"の物語「"+ch.title+"」が進んだ");show("screen-game");render();done()},"📖 "+h.short+"の物語");
 return true;
}
/* scheduled events keyed by turn */
function scheduledMap(){return {2:evWalkHome,3:evGymClass,4:evRooftopRumor,5:evSakuraTree,6:evSports,7:evSpeech,8:evBallGame,9:evRainyLibrary,10:evPool,11:evStudyGroup,12:evTanabata,13:evSummerPlan,14:evTest,15:evSea,16:evBirthdayAkari,17:evPhoneCall,18:evSummer,19:evPlanetarium,20:evAquariumNight,21:evSenko,22:evNurse,23:evBirthdaySakura,24:evCulturePrep,25:evShopping,26:evCulture,27:evCleanup,28:evHalloween,29:evTripPrep,30:evTrip,31:evConcert,32:evMomiji,33:evBirthdayYuki,34:evSki,35:evSnowDay,36:evXmas,37:evHatsumode,38:evMarathon,39:evIllumination,40:evExam,41:evSetsubun,42:evBirthdayRin,43:evChocoEve,44:evValentine,45:evYosegaki,46:evWhiteDay,47:evRooftopEve}}
function scheduledEvent(){
const t=turnInYear(S.turn);const g=gradeOf(S.turn);
if((t===2||t===4)&&g!==1)return null;      /* 入学直後の出来事は1年次のみ */
if((t===45||t===47)&&g!==3)return null;    /* 卒業間際の出来事は3年次のみ */
const M=scheduledMap();
const fn=M[t]?M[t]:null;
/* 2.36 季節の風景：年1回必ず発生し、季節動画（season-*.mp4）が必ず見られる導入シーン */
if(fn&&SEASON_INTRO[t]){const intro=SEASON_INTRO[t];return function(done){playNovel(intro.scenes,function(){fn(done)},intro.tag)}}
return fn;
}
const SEASON_INTRO={
5:{tag:"🌸 季節の風景・桜の下",scenes:[{who:"　",img:"assets/sakura.webp",text:"――春。黒羽城址公園の桜が、今年も満開になった。"},{who:"　",img:"assets/sakura.webp",text:"花びらが風に舞う。この街の春は、いつもここから始まる気がする。"}]},
15:{tag:"🌻 季節の風景・夏",scenes:[{who:"　",img:"assets/akari-sea.webp",text:"――夏。那珂川の水面が、強い日差しに光っていた。"},{who:"　",img:"assets/akari-sea.webp",text:"鮎の季節だ。川原のやなの方から、香ばしい匂いが流れてくる。"}]},
32:{tag:"🍁 季節の風景・紅葉",scenes:[{who:"　",img:"assets/rin-date.webp",text:"――秋。那須神社の参道が、紅葉で赤く染まっていた。"},{who:"　",img:"assets/rin-date.webp",text:"落ち葉を踏む音が、やけに静かに響く。"}]},
35:{tag:"❄️ 季節の風景・雪の日",scenes:[{who:"　",img:"assets/yuki-winter.webp",text:"――冬。黒羽の町に、静かに雪が降り積もっていた。"},{who:"　",img:"assets/yuki-winter.webp",text:"羽田沼の白鳥たちは、寒くないのだろうか。"}]}
};
function evWalkHome(done){unlockMem("mem_walkhome");
playNovel([{who:"　",text:"放課後、校門でさくらと鉢合わせた。入学してまだ間もない、夕日の下校路。"},
{hero:"sakura",who:"桜井 さくら",text:"ねえ、途中まで一緒でもいい？…昔みたいにさ"},
{who:"　",text:"並んで歩く帰り道。ランドセルの頃と変わらないはずなのに、隣のさくらが少しだけ大人に見えた。",choices:[
 {label:"「毎日一緒に帰ろう」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+7)}},
 {label:"「たまにならいいよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+3)}}]},
{hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…ありがとう。卒業するまで、あと何回こうして帰れるんだろうね。…大事にしなきゃね"}],
()=>{S.lastMeet.sakura=S.turn;addLog("夕日の下校路をさくらと歩いた");show("screen-game");render();done()},"🌇 夕日の下校路")}
function evTanabata(done){unlockMem("mem_tanabata");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("yuki");
playNovel([{who:"　",text:"七夕。校舎の笹に、みんなの短冊が揺れていた。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"願い事、書いた？…私はね、内緒。言ったら叶わなくなっちゃうから"},
{who:"　",text:"短冊を結ぶ彼女の横顔を見ながら思った。この人の願いが叶うなら、自分の願いは半分でいい、と。",choices:[
 {label:"「君の願いが叶いますように、と書いた」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「合格祈願にしたよ」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+4);S.stats.gakuryoku=clamp(S.stats.gakuryoku+3)}}]},
{hero:cand.id,who:cand.name,variant:"smile",text:"…ふふ、ありがとう。じゃあ私も、あなたの願いが叶うように、星にお願いしておくね"}],
()=>{S.lastMeet[cand.id]=S.turn;addLog("七夕に"+cand.short+"と短冊を結んだ");show("screen-game");render();done()},"🎋 七夕")}
function evHalloween(done){unlockMem("mem_halloween");
playNovel([{who:"　",text:"ハロウィン。生徒会主催の仮装パーティーが、夕方の校舎で始まった。"},
{hero:"rin",who:"藤原 りん",variant:"shy",text:"…どう？魔女の仮装。生徒会長らしくない？…今日くらいは、許して"},
{hero:"rin",who:"藤原 りん",text:"お菓子をくれなきゃ、イタズラするわよ。…なんて、練習してみただけ。似合ってた？",choices:[
 {label:"「すごく似合ってる」",effect:()=>{S.aff.rin=clamp(S.aff.rin+9)}},
 {label:"「お菓子、どうぞ」手作りクッキーを渡す",effect:()=>{S.aff.rin=clamp(S.aff.rin+7);S.skills.ryouri=clamp(S.skills.ryouri+3)}}]},
{who:"　",text:"カボチャの明かりに照らされた校舎は、いつもと違う顔をしていた。仮装を脱いだりんの笑顔が、一番のご褒美だった。"}],
()=>{S.lastMeet.rin=S.turn;S.met.rin=true;addLog("ハロウィンパーティー（りん 好感度アップ）");show("screen-game");render();done()},"🎃 ハロウィン")}
function evSnowDay(done){unlockMem("mem_snow");unlockMem("mem_op09");
playNovel([{who:"　",img:"assets/op09.webp",text:"朝から雪が降り積もった日。学校は静まり返り、図書室は一年で一番静かだった。"},
{hero:"yuki",who:"月島 ゆき",variant:"date",text:"…来てくれたんだっぺね。雪の日は、みんな早く帰るから…。図書室は、私と、あなただけです"},
{hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…ねえ、今日は特別に、私の小説の続き、読みますか？…雪の日の、あなたにだけ"},
{who:"　",text:"窓の外では雪が静かに降り積もり、物語の声だけが、暖かい図書室に響いていた。"}],
()=>{S.aff.yuki=clamp(S.aff.yuki+9);S.lastMeet.yuki=S.turn;S.met.yuki=true;S.stats.stress=clamp(S.stats.stress-8);addLog("雪の日の図書室（ゆき 好感度+9）");show("screen-game");render();done()},"❄️ 雪の日の図書室")}
function evRooftopRumor(done){unlockMem("mem_rooftop_rumor");
playNovel([{who:"　",text:"昼休み、屋上への階段の前で、先輩たちの噂話が聞こえた。"},
{hero:"rin",who:"藤原 りん",text:"「卒業式の日、校舎の屋上で告白すると、その恋は必ず実る」――この学園に代々伝わる神話よ"},
{hero:"rin",who:"藤原 りん",text:"屋上は普段、立入禁止。でも卒業式の日だけ、生徒会が鍵を開ける決まりなの。…信じるかどうかは、あなた次第ね"},
{who:"　",text:"屋上の伝説。その言葉が、胸の奥に小さく灯った。卒業までの目標が、一つ増えた気がした。"}],
()=>{addLog("屋上の伝説を聞いた");show("screen-game");render();done()},"🏫 屋上の伝説")}
function evPool(done){unlockMem("mem_pool");const win=S.stats.undou+rnd(-8,8)>=50;
playNovel([{who:"　",text:"水泳大会。プールサイドは声援で熱気に包まれていた。"},
{hero:"akari",who:"星野 あかり",variant:"pool",text:"自由形、{call}も出るんでしょ？水の中でも負けないからね！"},
{who:"　",text:win?"号砲とともに飛び込む。結果は見事に上位入賞！クラスの人気者になった気分だ。":"懸命に泳いだが入賞は逃した。それでも、夏の始まりの水しぶきは最高に気持ちよかった。"},
{hero:"akari",who:"星野 あかり",variant:"smile",text:win?"やるじゃん！プールでも陸でも、{call}は私のライバルだね！":"お疲れ！夏はまだ始まったばかりだよ。海もプールも、今年は遊び尽くそうね！"}],
()=>{S.aff.akari=clamp(S.aff.akari+(win?9:6));S.lastMeet.akari=S.turn;S.met.akari=true;HEROINES.forEach(h=>{if(h.id!=="akari"&&S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+2)});addLog("水泳大会（活躍がみんなの評価に波及）");show("screen-game");render();done()},"🏊 水泳大会")}
function evSea(done){unlockMem("mem_sea");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
if(cand&&cand.id==="akari")unlockMem("mem_seaside");if(cand&&cand.id==="yuki")unlockMem("mem_seayuki");
playNovel([{who:"　",text:"夏休み、クラスのみんなで海へ行った。"},
{hero:cand.id,who:cand.name,variant:"sea",text:"見て見て、波！夏って感じだね。…ねえ、こういう日が、ずっと続けばいいのに"},
{hero:cand.id,who:"　",text:"スイカ割り、ビーチバレー、夕日の波打ち際。帰りのバスでは、みんなぐっすり眠っていた。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"…今日のこと、卒業しても覚えてる。私、絶対に忘れないから"}],
()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8);S.lastMeet[cand.id]=S.turn;HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+2)});addLog("海の一日（"+cand.short+" 好感度+8）");show("screen-game");render();done()},"🌊 海の一日")}
function evNurse(done){unlockMem("mem_nurse");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
if(cand&&cand.id==="akari")unlockMem("mem_nurse2");
playNovel([{who:"　",text:cand.name+"が風邪で学校を休んだ。プリントを届けに、家を訪ねることにした。"},
{hero:cand.id,who:cand.name,variant:"sick",text:"…わざわざ来てくれたの？ごめんね、こんな姿…。でも、すごく嬉しい"},
{who:"　",text:"冷えピタを貼り替えて、台所でおかゆを作る。不器用な味だったはずなのに、彼女は完食してくれた。",choices:[
 {label:"「早く元気になってね」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「寝てなきゃダメだよ」優しく叱る",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+11)}}]},
{hero:cand.id,who:cand.name,variant:"sick",text:"…看病してもらうの、初めて。…ねえ、元気になったら、今度は私が恩返しするね"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-5);addLog(cand.short+"の看病をした（好感度アップ）");show("screen-game");render();done()},"🤒 看病イベント")}
function birthdayEvent(h,giftLine,done){unlockMem("mem_birthday");
playNovel([{who:"　",text:"今日は"+h.name+"の誕生日（"+h.profile.birthday+"）。プロフィールで覚えていた日だ。"},
{hero:h.id,who:h.name,variant:"shy",text:"え…覚えててくれたの？"},
{who:"　",text:"何を渡そう？彼女の好物はプロフィールにあったはず…。",choices:[
 {label:"好物の「"+h.profile.giftName+"」を渡す",effect:()=>{S.aff[h.id]=clamp(S.aff[h.id]+14);addRel(h.id,{trust:5,close:6});pushHistory(h.id,"birthday","誕生日に好物を贈った日")}},
 {label:"💐 小さな花束を渡す",effect:()=>{S.aff[h.id]=clamp(S.aff[h.id]+9);addRel(h.id,{trust:3,close:4});pushHistory(h.id,"birthday","誕生日に花束を贈った日")}},
 {label:"用意できなかった…言葉で祝う",effect:()=>{S.aff[h.id]=clamp(S.aff[h.id]+4);addRel(h.id,{trust:1});pushHistory(h.id,"birthday_light","誕生日を言葉だけで祝った日")}}]},
{hero:h.id,who:h.name,variant:"smile",text:giftLine},
{hero:h.id,who:"　",text:"誕生日を覚えていてくれること。それが何より嬉しいのだと、彼女の笑顔が語っていた。"}],
()=>{S.lastMeet[h.id]=S.turn;S.met[h.id]=true;addHurt(h.id,-20);checkProfileUnlocks();addLog(h.short+"の誕生日を祝った");show("screen-game");render();done()},"🎂 誕生日")}
function evBirthdaySakura(done){birthdayEvent(hero("sakura"),"桜の小物、探してくれたんだ…！ありがとう、大事にするね！",done)}
function evBirthdayAkari(done){birthdayEvent(hero("akari"),"スポーツドリンク一ケース！？分かってるじゃん、{call}！",done)}
function evBirthdayYuki(done){birthdayEvent(hero("yuki"),"星空の栞…。私の好きな物、覚えててくれたんだっぺね…",done)}
function evBirthdayRin(done){birthdayEvent(hero("rin"),"高級チョコ…。ふふ、よく知ってるのね。…ありがとう",done)}
function evSki(done){unlockMem("mem_ski");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("akari");
if(cand&&cand.id==="rin")unlockMem("mem_skirin");
playNovel([{who:"　",text:"冬のスキー合宿。雪山は一面の銀世界だった。"},
{hero:cand.id,who:cand.name,variant:"ski",text:"うわっ…！ちょっと、手、貸して…！"},
{who:"　",text:"転びそうになった"+cand.short+"の手を、とっさに掴んだ。雪の冷たさの中で、その手だけが温かかった。"},
{hero:cand.id,who:"　",variant:"ski",text:"リフトに並んで座る二人。眼下に広がる銀世界と、少し曇るゴーグル。合宿の夜は、ロッジの暖炉の前で他愛ない話が続いた。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"…ありがと。…ねえ、この手、リフトが着くまで、このままでいい？"}],
()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9);S.lastMeet[cand.id]=S.turn;addLog("スキーで"+cand.short+"と接近（好感度+9）");show("screen-game");render();done()},"🎿 スキー合宿")}
function evHatsumode(done){unlockMem("mem_hatsumode");unlockMem("mem_op19");S.flags.hatsumodeDone=true;
const cand=HEROINES.filter(h=>S.met[h.id]&&S.aff[h.id]>=30).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
if(!cand){playNovel([{who:"　",text:"初詣。家族と神社へ行き、卒業までの無事を祈った。今年は勝負の年だ。"}],()=>{show("screen-game");render();done()},"⛩️ 初詣");return}
playNovel([{who:"　",img:"assets/op19.webp",text:"新年。思い切って"+cand.name+"を初詣に誘った。"},
{hero:cand.id,who:cand.name,variant:"winter",text:"おみくじ、引こう？…私はね、恋愛成就をお願いしたの。…なんて、内緒だよ？"},
{who:"　",text:"絵馬に願い事を書く彼女の横顔。何を書いたのかは、卒業までの秘密だと言った。",choices:[
 {label:"「俺も同じ願いにした」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10)}},
 {label:"「学業成就にしたよ」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+5);S.stats.gakuryoku=clamp(S.stats.gakuryoku+4)}}]}],
()=>{S.lastMeet[cand.id]=S.turn;rippleHurt(cand.id,6);addLog("初詣に"+cand.short+"と行った");show("screen-game");render();done()},"⛩️ 初詣")}
function evWhiteDay(done){unlockMem("mem_whiteday");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"ホワイトデー。バレンタインのお返しに、少し奮発した贈り物を用意した。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"え、私に…？こんなに素敵なの、いいの？…ありがとう。卒業まで、あと少しだね"},
{hero:cand.id,who:"　",text:"卒業は、もう目の前。伝えたい気持ちが、胸の中で静かに膨らんでいく。"}],
()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8);S.lastMeet[cand.id]=S.turn;addLog("ホワイトデーに"+cand.short+"へお返し（好感度+8）");show("screen-game");render();done()},"🤍 ホワイトデー")}
function evRooftopEve(done){
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"卒業式を明日に控えた放課後。屋上への階段の前を通ると、扉が少しだけ開いていた。"},
{hero:cand.id,who:cand.name,variant:"ending",text:"…明日の今頃、ここで何かが変わる気がするの。ねえ、卒業式の最後――屋上に、来てくれる？"},
{who:"　",text:"夕日に染まる屋上。1年間のすべてが、明日の一日に集まっていく。――神話の扉が、開こうとしていた。"}],
()=>{addLog("卒業前日、屋上への誘いを受けた");show("screen-game");render();done()},"🌇 卒業前日・屋上の誘い")}
function evSports(done){unlockMem("mem_festival_sport");const win=S.stats.undou+rnd(-8,8)>=55;
playNovel([{who:"　",text:"体育祭当日。クラス対抗リレーのアンカーに選ばれた。"},{hero:"sakura",who:"桜井 さくら",variant:"gym",text:"開会前のグラウンド。体操着姿のさくらが、ハチマキを結び直してくれた。「転んでも、最後まで走る{call}が見たいな」"},{hero:"akari",who:"星野 あかり",variant:"gym",text:"バトンは{call}に託すから！全力で走って！"},
{who:"　",text:win?"あかりからのバトンを受け取り、全力で駆け抜けた――ゴールテープを切った瞬間、クラス中が沸いた！":"懸命に走ったが、わずかの差で2位。悔しいけれど、あかりは笑った。「ナイスラン！」"},
{hero:"akari",who:"星野 あかり",variant:"gym",text:win?"やったー！！{call}最高！…ね、来年はもうないんだよね。だから今日のこと、絶対忘れない。":"負けても、いい汗かいたね！これが青春ってやつだよ！"}],
()=>{S.aff.akari=clamp(S.aff.akari+(win?10:6));S.lastMeet.akari=S.turn;S.met.akari=true;if(win)HEROINES.forEach(h=>{if(h.id!=="akari"&&S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+2)});addLog("体育祭（あかり 好感度+"+(win?10:6)+(win?"、活躍が全員の評価に波及":"")+"）");show("screen-game");render();done()},"🏃 体育祭")}
function evTest(done){unlockMem("mem_test");const good=S.stats.gakuryoku+rnd(-8,8)>=55;const red=!good&&S.stats.gakuryoku<35;
const scenes=[{who:"　",text:"期末テストの結果が返ってきた。"},{who:"　",text:good?"順位は大きくアップ！努力が実を結んだ。":red?"赤点だった…。放課後、補習が言い渡された。":"順位は伸び悩んだ…。次はもっと頑張ろう。"},
{hero:"yuki",who:"月島 ゆき",text:good?"すごいだっぺね…。図書室で頑張っていたの、私、知ってますよ。":red?"…補習、私も付き合います。図書室で、特訓しましょう":"…大丈夫だっぺ。勉強は、裏切りませんから。次は一緒に頑張りましょう"}];
if(red)scenes.push({hero:"yuki",who:"　",text:"補習の日々。ゆきの教え方は丁寧で、夕日の図書室が少しだけ好きになった。学力も少し取り戻した。"});
playNovel(scenes,
()=>{S.aff.yuki=clamp(S.aff.yuki+(good?9:red?8:5));S.lastMeet.yuki=S.turn;S.met.yuki=true;if(red)S.stats.gakuryoku=clamp(S.stats.gakuryoku+6);addLog(red?"期末テスト赤点→補習（ゆきと特訓、学力+6）":"期末テスト（ゆき 好感度+"+(good?9:5)+"）");show("screen-game");render();done()},"📝 期末テスト")}
function evSummer(done){unlockMem("mem_summer");
const cand=HEROINES.filter(h=>S.met[h.id]&&S.aff[h.id]>=35).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
if(!cand){playNovel([{who:"　",text:"夏祭りの夜。友達と屋台を回り、花火を見上げた。来年は誰かと来たいな、と思った。"}],()=>{show("screen-game");render();done()},"🎆 夏祭り");return}
playNovel([{who:"　",text:"夏祭りの夜。思い切って"+cand.name+"を誘った。"},{hero:cand.id,who:cand.name,variant:"yukata",text:"わあ…きれい。誘ってくれてありがとう。…ねえ、来年も、こうして見られるかな"},
{who:"　",text:"花火の音に紛れて、彼女の横顔を見た。この夏のことは、きっと忘れない。"},
{hero:cand.id,who:"　",text:"帰り道、屋台で買ったラムネを分け合った。祭りの喧騒が遠ざかるにつれて、二人の影だけが提灯の明かりに長く伸びていた。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"…ねえ、今の花火、見た？…私はずっと、横顔、見てたかも。…なんて、内緒だよ"}],
()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10);S.lastMeet[cand.id]=S.turn;S.dates++;addLog("夏祭りに"+cand.short+"と行った（好感度+10）");show("screen-game");render();done()},"🎆 夏祭り")}
function evCulture(done){unlockMem("mem_culture");const good=S.stats.geijutsu>=50||S.stats.miryoku>=55;
playNovel([{who:"　",text:"文化祭当日。クラスの出し物は大盛況だった。午後は自由時間。誰と回るかで、放課後の空気が変わりそうだ。",choices:[
 {label:"りんと一緒に校内を回る",effect:()=>{S.aff.rin=clamp(S.aff.rin+6);rippleHurt("rin",6)}},
 {label:"クラスの出し物を最後まで手伝う",effect:()=>{HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+2)})}}]},
{hero:"rin",who:"藤原 りん",variant:"gyouji",text:good?"見事だったわ。あなたの働き、生徒会長として保証する。…個人的にも、ね。":"お疲れさま。準備は大変だったけど…悪くない文化祭だったわね"},
{who:"　",text:"夜。後夜祭の校庭では焚き火が揺れ、フォークダンスの輪ができていた。"},
{hero:"rin",who:"藤原 りん",variant:"shy",text:"…誘ってくれるの？…ふふ、いいわ。今日くらいは、生徒会長じゃなく、ただの女の子でいさせて"},
{hero:"rin",who:"藤原 りん",variant:"smile",text:"…フォークダンス、意外と上手だったのね。…来年はもうない文化祭。あなたと回れて、よかった"},
{who:"　",text:"焚き火が小さくなる頃、りんと二人、静まり返った校舎を見上げた。「祭りの後って、少しだけ卒業みたいね」りんが小さく言った。"},
{who:"　",text:"夕日の校庭で片付けを終えた時、達成感と少しの寂しさが混じった。"}],
()=>{S.aff.rin=clamp(S.aff.rin+(good?10:6));S.lastMeet.rin=S.turn;S.met.rin=true;addLog("文化祭（りん 好感度+"+(good?10:6)+"）");show("screen-game");render();done()},"🎭 文化祭")}
function evTrip(done){unlockMem("mem_trip");
playNovel([{who:"　",text:"修学旅行。班行動で古い街並みを歩いた。"},
{hero:"yuki",who:"月島 ゆき",text:"この街の本屋さん、古い文学全集があって…。…あ、ごめんなさい、私だけ楽しんで…"},
{hero:"akari",who:"星野 あかり",text:"ねえ、将来さ、{call}は何してるんだろうね。…私は、{call}の近くにいたいな。なんてね！"},
{who:"　",text:"夜、布団の中で将来の話をした。夢、進路、そして――言い出せない気持ちの話。"},
{hero:"rin",who:"藤原 りん",text:"…静かにしなさい、先生が見回りに来るわ。…でも、もう少しだけ、話していたい気もするの"},
{who:"　",text:"卒業はまだ先だと思っていたのに、時間は静かに進んでいた。"},
{who:"　",text:"翌朝の自由行動。昨夜の約束通り、古い街の小さな本屋と甘味処を回った。旅行の思い出は、予定表にない時間ほど鮮やかに残った。"}],
()=>{HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+3)});addLog("修学旅行（出会った全員 好感度+3）");show("screen-game");render();done()},"🚌 修学旅行")}
function evXmas(done){unlockMem("mem_xmas");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"クリスマスイブの放課後。イルミネーションが街を彩っていた。"},{hero:cand.id,who:cand.name,variant:"winter",text:"これ…ささやかだけど、プレゼント。開けるのは家に帰ってからね？"},
{who:"　",text:"家で包みを開けると、手編みのマフラーだった。不器用な編み目が、なんだか嬉しかった。"}],
()=>{const bonus=S.stats.miryoku>=60?3:0;S.aff[cand.id]=clamp(S.aff[cand.id]+9+bonus);S.lastMeet[cand.id]=S.turn;rippleHurt(cand.id,5);addLog("クリスマスに"+cand.short+"と贈り物交換（好感度+"+(9+bonus)+(bonus?"、身だしなみの良さも好印象":"")+"）");show("screen-game");render();done()},"🎄 クリスマス")}
function evValentine(done){
const cand=HEROINES.filter(h=>S.met[h.id]&&S.aff[h.id]>=50).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
if(!cand){playNovel([{who:"　",text:"バレンタインデー。下駄箱には…義理チョコが一つ。来年こそは、と思ったが来年はもうないのだった。"}],()=>{show("screen-game");render();done()},"💝 バレンタイン");return}
unlockMem("mem_valentine");
playNovel([{who:"　",text:"バレンタインデー。下駄箱を開けると、手作りチョコと小さなカードがあった。"},
{who:"　",text:"カードには、少し震える字でこう書かれていた。『試作品を食べてくれた人へ。本番は、気持ちも本命です』"},{hero:cand.id,who:cand.name,variant:"shy",text:"…本命、です。受け取ってください。卒業式の日、桜の木の下で…待ってます"}],
()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8);S.lastMeet[cand.id]=S.turn;rippleHurt(cand.id,6);addLog("バレンタインに"+cand.short+"から本命チョコ（好感度+8、他の子の傷心度アップ）");show("screen-game");render();done()},"💝 バレンタイン")}

function evSpeech(done){unlockMem("mem_speech");const good=S.stats.gakuryoku>=45||S.skills.bungaku>=35;
playNovel([{who:"　",text:"弁論大会。体育館に全校生徒が集まり、クラス代表の弁論が始まった。"},
{hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…私の番だっぺ。…震えてますけど、聞いててください。…私の言葉で、私の気持ちを、伝えます"},
{who:"　",text:"ゆきの弁論のテーマは『本と人をつなぐもの』。小さな声で始まった言葉は、やがて体育館中を静かにさせた。"},
{who:"　",text:good?"自分の弁論も、練習の成果が出た。言葉を磨く日々が、壇上で報われた気がした。":"自分の弁論は緊張で早口になってしまった。それでも、最後まで言い切れたことが小さな自信になった。",choices:[
 {label:"ゆきを真っ先に称える",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+9)}},
 {label:"出場者全員に拍手を送る",effect:()=>{HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+3)})}}]},
{hero:"yuki",who:"月島 ゆき",variant:"smile",text:"…終わりました…。…あなたの顔が見えたから、最後まで言えたんだっぺ。…ありがとう"}],
()=>{S.lastMeet.yuki=S.turn;S.met.yuki=true;if(good)S.skills.bungaku=clamp(S.skills.bungaku+4);addLog("弁論大会（ゆきの弁論に感動"+(good?"、自分の弁論も好評":"")+"）");show("screen-game");render();done()},"🎤 弁論大会")}
function evPlanetarium(done){unlockMem("mem_planetarium");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"夏休み。市のプラネタリウムの特別投影に、"+cand.name+"を誘った。"},
{hero:cand.id,who:cand.name,variant:"planet",text:"わあ…満天の星。…暗闇って、少しドキドキするね"},
{who:"　",text:"ドームいっぱいの星空。解説の声が遠くなり、隣の彼女の呼吸だけが近くに聞こえた。",choices:[
 {label:"そっと手を握る",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+11)}},
 {label:"星の名前を教える",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8);S.stats.gakuryoku=clamp(S.stats.gakuryoku+3)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…今日の星空、忘れない。…卒業しても、同じ星を見ようね"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-6);addLog("プラネタリウムに"+cand.short+"と行った");show("screen-game");render();done()},"🔭 プラネタリウム")}
function evIllumination(done){unlockMem("mem_illumination");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("rin");
playNovel([{who:"　",text:"冬の夕方。駅前のイルミネーションが、今年も始まった。帰り道、"+cand.name+"と光のトンネルを歩く。"},
{hero:cand.id,who:cand.name,variant:"winter",text:"…点灯の瞬間、一緒に見られてよかった。…ねえ、こういう景色って、誰と見るかで全然違うの"},
{who:"　",text:"冷たい空気の中で、白い息と温かい光。受験の重さも、卒業へのカウントダウンも、この瞬間だけは遠くに感じた。",choices:[
 {label:"「来年も一緒に見よう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10)}},
 {label:"温かい飲み物を買って渡す",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8);S.skills.kidate=clamp(S.skills.kidate+3)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…ありがとう。…この冬の光、私の物語の、大事な場面にするね"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-7);addLog("冬のイルミネーションを"+cand.short+"と見た");show("screen-game");render();done()},"✨ 冬のイルミネーション")}
function evBallGame(done){unlockMem("mem_ballgame");const win=S.stats.undou>=45;
playNovel([{who:"　",text:"球技大会。体育館はクラス対抗の熱気に包まれていた。"},
{hero:"akari",who:"星野 あかり",variant:"gym",text:"決勝だよ！{call}のシュートが鍵だから。…緊張してる？大丈夫、私がパスを回すから！"},
{who:"　",text:"試合は一進一退。残り10秒、同点。あかりからのパスが、目の前に転がってきた。"},
{who:"　",text:win?"放ったシュートは、リングに吸い込まれた――逆転優勝！体育館の歓声が天井を揺らした。":"シュートはリングに弾かれた。あと一歩で優勝を逃し、床に座り込むクラスメイトたちと悔しさを分け合った。"},
{hero:"akari",who:"星野 あかり",variant:"smile",text:win?"やったぁ！！見た！？{call}のシュート、鳥肌立った！…ねえ、私たち、いいコンビだね":"惜しかった…！でも最後まで走り切った。{call}の頑張り、私はちゃんと見てたよ"}],
()=>{S.aff.akari=clamp(S.aff.akari+(win?9:6));S.lastMeet.akari=S.turn;S.met.akari=true;addLog("球技大会（あかり 好感度+"+(win?9:6)+"）");show("screen-game");render();done()},"🏀 球技大会")}
function evMarathon(done){unlockMem("mem_marathon");unlockMem("mem_ev03");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
const good=S.stats.tairyoku>=50;
playNovel([{who:"　",text:"冬のマラソン大会。冷たい風の中、白い息を吐きながら長いコースを走っていた。"},
{hero:cand.id,who:cand.name,variant:"winter",text:"はぁ、はぁ…。ちょっと、ペース落としてもいい…？"},
{who:"　",text:"歩きかけた"+cand.short+"の隣に、そっと並んでペースを合わせた。言葉はなくても、並んで走るだけで不思議と足が軽くなった。",choices:[
 {label:"「ゴールは二人で切ろう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「先に行って、ゴールで待ってる」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+4)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:good?"…ゴール、できた…。隣にいてくれたからだよ。ありがとう":"…完走できたの、あなたのペースのおかげ。…冬の空が、こんなに綺麗だったなんて"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-4);addLog("マラソン大会で"+cand.short+"と伴走した");show("screen-game");render();done()},"🏃 マラソン大会")}

function evAquariumNight(done){unlockMem("mem_aquarium");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("yuki");
playNovel([{who:"　",text:"夏休みの夜。水族館の夜間開館に、思い切って"+cand.name+"を誘った。"},
{hero:cand.id,who:cand.name,variant:"planet",text:"夜の水族館…。昼と全然違う。…クラゲが、星みたいに光ってる"},
{who:"　",text:"青い闇の中で、水槽の光だけが二人を照らしていた。誰もいない大水槽の前で、時間が止まったみたいだった。",choices:[
 {label:"「来年も、また来よう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10)}},
 {label:"「…綺麗だね」彼女を見て言う",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+12)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…今日のこと、私の物語の、大事な1ページにする。…連れてきてくれて、ありがとう"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-6);addLog("水族館の夜間開館に"+cand.short+"と行った");show("screen-game");render();done()},"🐠 水族館の夜")}
function evMomiji(done){unlockMem("mem_momiji");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"秋の放課後。通学路の坂道が、紅葉で真っ赤に染まっていた。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"見て、すごい色…。ねえ、少しだけ、寄り道してかない？"},
{who:"　",text:"自販機で温かい缶コーヒーを買って、ベンチで分け合った他愛ない時間。卒業まで、あと何回こんな放課後があるんだろう。",choices:[
 {label:"「卒業しても、また見に来よう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「今の景色、写真に撮ろう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+7)}}]},
{hero:cand.id,who:cand.name,variant:"smile",text:"…うん、約束。来年の秋も、その次の秋も。…ねえ、今日は帰りたくないな、少しだけ"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-8);addLog("紅葉の坂道で"+cand.short+"と寄り道した");show("screen-game");render();done()},"🍁 紅葉の放課後")}
function evYosegaki(done){unlockMem("mem_yosegaki");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("rin");
playNovel([{who:"　",text:"卒業アルバムの寄せ書きを集める日。教室は、少しだけセンチメンタルな空気だった。"},
{hero:cand.id,who:cand.name,variant:"smile",text:"私のページ、もう書いた？…私はね、あなたのページに、一番大事な一文を書いたの"},
{who:"　",text:"こっそり覗くと、彼女の字でこう書かれていた。――『屋上で、待ってる』。たった一文が、胸を熱くした。",choices:[
 {label:"「俺も、同じ気持ちだよ」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10)}},
 {label:"「卒業式の日、必ず行く」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+12)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…じゃあ、約束ね。アルバムに書いた言葉は、消えないんだから。…卒業式の日、屋上で"}],
()=>{S.lastMeet[cand.id]=S.turn;addHurt(cand.id,-20);addLog("卒業アルバムの寄せ書きで"+cand.short+"と約束した");show("screen-game");render();done()},"📖 卒業アルバムの寄せ書き")}

function evSakuraTree(done){unlockMem("mem_sakuratree");
playNovel([{who:"　",text:"昼休み。校庭の「伝説の桜」の下で、さくらが一人、木を見上げていた。"},
{hero:"sakura",who:"桜井 さくら",text:"この桜、小さい頃からずっと見てきたけど…卒業の年になると、見え方が違うね"},
{who:"　",text:"花びらが舞う中で、さくらが小さく笑った。",choices:[
 {label:"「卒業式の日も、ここで会おう」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+8)}},
 {label:"「その前に、屋上だね」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+6)}}]},
{hero:"sakura",who:"桜井 さくら",variant:"shy",text:"…うん、約束。桜の下でも、屋上でも。…{call}となら、どこでも特別だよ"}],
()=>{S.lastMeet.sakura=S.turn;addLog("伝説の桜の下でさくらと約束した");show("screen-game");render();done()},"🌸 伝説の桜の下で")}
function evCulturePrep(done){unlockMem("mem_cultureprep");
playNovel([{who:"　",text:"文化祭まで、あと少し。放課後の教室は、段ボールと絵の具の匂いがした。"},
{hero:"rin",who:"藤原 りん",variant:"gyouji",text:"準備は順調？…看板の文字、あなたの字が一番丁寧だから、任せたいの"},
{hero:"akari",who:"星野 あかり",text:"こっちは模擬店の試食係、募集中だよ！{call}、第一号ね！"},
{who:"　",text:"祭りの前のざわめき。誰と準備を進めるかで、当日の景色が変わる気がした。",choices:[
 {label:"りんと看板を仕上げる",effect:()=>{S.aff.rin=clamp(S.aff.rin+7);S.met.rin=true;S.lastMeet.rin=S.turn}},
 {label:"あかりと模擬店の試食をする",effect:()=>{S.aff.akari=clamp(S.aff.akari+7);S.met.akari=true;S.lastMeet.akari=S.turn}}]},
{who:"　",text:"夕日が差す教室で、文化祭への期待が少しずつ形になっていった。"}],
()=>{addLog("文化祭準備の放課後を過ごした");show("screen-game");render();done()},"🎨 文化祭準備")}
function evExam(done){unlockMem("mem_exam");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("yuki");
playNovel([{who:"　",text:"受験まで、あとわずか。ピリッとした空気の図書室で、"+cand.short+"が小さな包みを差し出した。"},
{hero:cand.id,who:cand.name,variant:"winter",text:"合格お守り。…私とお揃いなの。だから、絶対に一緒に受かろうね"},
{who:"　",text:"お守りを握りしめると、不思議と落ち着いた。隣で頑張る人がいる。それだけで、冬の勉強は乗り越えられた。",choices:[
 {label:"「一緒に合格しよう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9);S.stats.gakuryoku=clamp(S.stats.gakuryoku+4)}},
 {label:"「卒業式の日、屋上で報告しよう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+11)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…うん。…卒業式の日が、少しだけ楽しみになった。…ありがとう"}],
()=>{S.lastMeet[cand.id]=S.turn;addLog(cand.short+"から合格お守りをもらった");show("screen-game");render();done()},"📿 合格お守り")}
function evChocoEve(done){unlockMem("mem_chocoeve");
playNovel([{who:"　",text:"放課後、家庭科室から甘い匂い。さくらが、バレンタインのチョコ作りを練習していた。"},
{hero:"sakura",who:"桜井 さくら",variant:"shy",text:"あ、見ちゃった？…じゃあ、試食係に任命します。…本番は、もっと上手く作るからね"},
{who:"　",text:"少し焦げた試作品。でも、その不器用さごと、気持ちが伝わってくる味だった。",choices:[
 {label:"「本番が楽しみだ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+9)}},
 {label:"「試作品で十分美味しいよ」",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+7);S.skills.ryouri=clamp(S.skills.ryouri+2)}}]},
{hero:"sakura",who:"桜井 さくら",variant:"smile",text:"…ほんと？じゃあ本番は、もっとドキドキさせちゃうかも。…待っててね"}],
()=>{S.lastMeet.sakura=S.turn;S.met.sakura=true;addLog("バレンタイン直前、さくらのチョコ試食係になった");show("screen-game");render();done()},"🍫 チョコ作りの試食係")}

function evRainyLibrary(done){unlockMem("mem_rainylibrary");
playNovel([{who:"　",text:"梅雨入りした放課後。激しい雨で下校できず、図書室に足止めされた。"},
{hero:"yuki",who:"月島 ゆき",variant:"club",text:"…雨、止みそうにないだっぺね。…よかったら、その本、読み終わるまで隣にいますよ"},
{who:"　",text:"雨の音だけが響く図書室。隣の席で静かにページをめくるゆきと、言葉の少ない時間を分け合った。",choices:[
 {label:"「雨の日も悪くないね」",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+9)}},
 {label:"おすすめの本を教えてもらう",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+7);S.skills.bungaku=clamp(S.skills.bungaku+4)}}]},
{hero:"yuki",who:"月島 ゆき",variant:"shy",text:"…雨が止むのが、少しだけ惜しいなんて…。…初めて思いました"}],
()=>{S.lastMeet.yuki=S.turn;S.met.yuki=true;S.stats.stress=clamp(S.stats.stress-7);addLog("梅雨の図書室でゆきと過ごした");show("screen-game");render();done()},"☔ 梅雨の図書室")}
function evSenko(done){unlockMem("mem_senko");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("akari");
playNovel([{who:"　",text:"夏休みも終わりに近づいた夕方。河原で"+cand.name+"と線香花火をすることになった。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"見て…小さい火花。落ちそうで、落ちない。…ねえ、この時間、なんだか私たちみたいだね"},
{who:"　",text:"線香花火の玉が、最後にぽとりと落ちるまで、二人とも息を止めて見守っていた。夏が終わる音がした。",choices:[
 {label:"「来年の夏も、一緒にやろう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+10)}},
 {label:"「卒業しても、忘れないよ」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8)}}]},
{hero:cand.id,who:cand.name,variant:"smile",text:"…約束だよ。…小さい約束ほど、大事にしたいんだ。…ありがとう、今日誘ってくれて"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-6);addLog("線香花火を"+cand.short+"とした");show("screen-game");render();done()},"🎇 線香花火の夜")}
function evConcert(done){unlockMem("mem_concert");
playNovel([{who:"　",text:"秋の放課後。音楽室からピアノの音が漏れていた。扉を開けると、りんが一人で弾いていた。"},
{hero:"rin",who:"藤原 りん",variant:"club",text:"…あら、聞いてたの？…じゃあ、特等席へどうぞ。今日の曲は、まだ誰にも聴かせていないの"},
{hero:"rin",who:"藤原 りん",variant:"club",text:"この曲、卒業式の日に弾きたいと思って練習してるの。…屋上で聴かせられたら、それが一番なんだけど"},
{who:"　",text:"夕日に染まる音楽室。ピアノの音が、卒業までの時間を静かに数えているようだった。",choices:[
 {label:"「卒業式の日、必ず聴きに行く」",effect:()=>{S.aff.rin=clamp(S.aff.rin+10)}},
 {label:"静かに最後まで聴く",effect:()=>{S.aff.rin=clamp(S.aff.rin+8);S.stats.kansei=clamp(S.stats.kansei+4)}}]},
{hero:"rin",who:"藤原 りん",variant:"shy",text:"…ありがとう。…あなたに聴いてもらうと、不思議と間違えないの。…本番も、隣で聴いててね"}],
()=>{S.lastMeet.rin=S.turn;S.met.rin=true;S.stats.stress=clamp(S.stats.stress-5);addLog("音楽室でりんのピアノを聴いた");show("screen-game");render();done()},"🎹 秋の音楽室コンサート")}
function evSetsubun(done){unlockMem("mem_setsubun");
playNovel([{who:"　",text:"節分。生徒会企画の豆まきイベントで、鬼役を引き受けることになった。"},
{hero:"rin",who:"藤原 りん",variant:"gyouji",text:"鬼は外、福は内！…逃げても無駄よ。生徒会長の豆は、本気なんだから"},
{who:"　",text:"本気の豆から本気で逃げ回り、校舎中に笑い声が響いた。卒業を前に、少しだけ子供に戻れた気がした。",choices:[
 {label:"最後は捕まって、福を分けてもらう",effect:()=>{S.aff.rin=clamp(S.aff.rin+9)}},
 {label:"鬼のまま、みんなにお菓子を配る",effect:()=>{HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+3)});S.aff.rin=clamp(S.aff.rin+6)}}]},
{hero:"rin",who:"藤原 りん",variant:"smile",text:"…ふふ、お疲れさま、鬼さん。…福はね、分け合うものよ。…あなたの分は、特別に多めにしておいたわ"}],
()=>{S.lastMeet.rin=S.turn;S.met.rin=true;addLog("節分の豆まきで鬼役をした");show("screen-game");render();done()},"👹 節分と豆まき")}
function evGymClass(done){unlockMem("mem_gymclass");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("akari");
playNovel([{who:"　",text:"体育の授業。体育祭に向けて、二人三脚の練習が始まった。ペアは、"+cand.name+"。"},
{hero:cand.id,who:cand.name,variant:"gym",text:"足首、結ぶね。…せーの、で歩くよ。右、左、右、左…！"},
{who:"　",text:"最初は息が合わず転びかけた。とっさに肩を組むと、近づいた距離に少しだけドキドキした。",choices:[
 {label:"「卒業まで、この調子で歩こう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「本番は優勝だね」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+6);S.stats.undou=clamp(S.stats.undou+3)}}]},
{hero:cand.id,who:cand.name,variant:"gym",text:"…やった、揃った！ねえ、体操着の私たち、なんだかいいコンビじゃない？"}],
()=>{S.lastMeet[cand.id]=S.turn;S.met[cand.id]=true;addLog("体育で"+cand.short+"と二人三脚の練習をした");show("screen-game");render();done()},"🏃 二人三脚の練習")}
function evStudyGroup(done){unlockMem("mem_study");
playNovel([{who:"　",text:"期末テストが近づき、放課後の図書室で勉強会が開かれた。"},
{hero:"yuki",who:"月島 ゆき",variant:"club",text:"…ここの公式、こう考えると分かりやすいんだっぺ。…教えるの、少しだけ楽しいかも"},
{hero:"sakura",who:"桜井 さくら",text:"休憩のお菓子、持ってきたよ！…勉強も大事だけど、息抜きも大事だからね"},
{who:"　",text:"教え合う声、シャーペンの音、窓の外の梅雨空。テスト勉強のはずの時間が、少しだけ特別だった。",choices:[
 {label:"ゆきに分からない所を教わる",effect:()=>{S.aff.yuki=clamp(S.aff.yuki+8);S.stats.gakuryoku=clamp(S.stats.gakuryoku+4)}},
 {label:"さくらのお菓子でみんなと休憩する",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+7);S.stats.stress=clamp(S.stats.stress-6)}}]}],
()=>{S.met.yuki=true;S.met.sakura=true;S.lastMeet.yuki=S.turn;addLog("期末前の勉強会に参加した");show("screen-game");render();done()},"📚 期末前の勉強会")}
function evSummerPlan(done){
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"夏休み直前。下校路で、夏の計画の話になった。"},
{hero:cand.id,who:cand.name,variant:"smile",text:"夏休み、{call}はどう過ごすの？…私はね、できれば、{call}と過ごす日を増やしたいな"},
{who:"　",text:"海、夏祭り、花火、宿題。短い夏の予定表に、二人の名前が少しずつ増えていく。",choices:[
 {label:"「夏祭り、一緒に行こう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8)}},
 {label:"「海にも行こう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+7)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…約束だよ。…この夏が、卒業しても忘れられない夏になりますように"}],
()=>{S.lastMeet[cand.id]=S.turn;addLog("夏休みの計画を"+cand.short+"と立てた");show("screen-game");render();done()},"🌻 夏休みの計画")}
function evPhoneCall(done){unlockMem("mem_phone");
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("sakura");
playNovel([{who:"　",text:"夏休みの夜。スマホが鳴った。"+cand.name+"からだった。"},
{hero:cand.id,who:cand.name,variant:"shy",text:"あ、もしもし？…ごめん、なんでもない用事なんだけど…。声、聞きたくなっちゃって"},
{who:"　",text:"他愛ない話が、気づけば1時間。花火の音、宿題の愚痴、明日の天気。切るきっかけが、なかなか見つからなかった。",choices:[
 {label:"「また明日も電話しよう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+9)}},
 {label:"「夏祭り、楽しみにしてる」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+7)}}]},
{hero:cand.id,who:cand.name,variant:"smile",text:"…うん。…ねえ、電話の向こうの{call}、なんだか近く感じるね。…おやすみ、いい夢を"}],
()=>{S.lastMeet[cand.id]=S.turn;S.stats.stress=clamp(S.stats.stress-5);addLog("夏休みの夜、"+cand.short+"と長電話した");show("screen-game");render();done()},"📱 夏休みの夜の電話")}
function evShopping(done){unlockMem("mem_op05");
playNovel([{who:"　",text:"文化祭直前。出し物の買い出しで、放課後の商店街が賑わっていた。"},
{hero:"sakura",who:"桜井 さくら",variant:"date",text:"買い出しリスト、こっちは完了！…ねえ、帰りに寄り道してかない？短い時間でも、{call}となら楽しいの"},
{hero:"rin",who:"藤原 りん",text:"予算管理は完璧よ。…でも、たまには予算外の寄り道も、悪くないわね"},
{who:"　",text:"荷物で両手が塞がった帰り道。祭りの前のざわめきが、夕日の商店街に満ちていた。",choices:[
 {label:"さくらと寄り道する",effect:()=>{S.aff.sakura=clamp(S.aff.sakura+8);S.lastMeet.sakura=S.turn}},
 {label:"りんと予算の最終確認をする",effect:()=>{S.aff.rin=clamp(S.aff.rin+7);S.lastMeet.rin=S.turn}}]}],
()=>{S.met.sakura=true;S.met.rin=true;addLog("文化祭の買い出しに行った");show("screen-game");render();done()},"🛍️ 文化祭の買い出し")}
function evCleanup(done){
const cand=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0]||hero("rin");
playNovel([{who:"　",text:"文化祭の翌週。校舎の片付けと、小さな打ち上げの日。"},
{hero:cand.id,who:cand.name,variant:"smile",text:"終わっちゃったね、文化祭。…片付けって、少し寂しいけど、悪くない時間だよね"},
{who:"　",text:"看板を外し、机を戻し、写真を見返して笑う。祭りの余韻の中で、来年はもうないのだという実感が静かに湧いた。",choices:[
 {label:"「来年はもうない分、思い出にしよう」",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+8)}},
 {label:"片付けを最後まで手伝う",effect:()=>{S.aff[cand.id]=clamp(S.aff[cand.id]+6);S.stats.moral=clamp(S.stats.moral+3)}}]},
{hero:cand.id,who:cand.name,variant:"shy",text:"…ありがとう。…ねえ、片付けの後のジュース、奢るね。…二人で、乾杯しよ"}],
()=>{S.lastMeet[cand.id]=S.turn;addLog("文化祭の片付けと打ち上げをした");show("screen-game");render();done()},"🧹 文化祭の片付け")}
function evTripPrep(done){unlockMem("mem_tripprep");
playNovel([{who:"　",text:"修学旅行を前に、班決めとしおり作りの放課後。教室は旅行への期待でざわめいていた。"},
{hero:"rin",who:"藤原 りん",variant:"gyouji",text:"しおりの表紙、あなたの案が採用されたわ。…班も同じになったし、楽しみにしてる"},
{hero:"akari",who:"星野 あかり",text:"旅行先での自由行動、{call}と回る約束、忘れてないよね？"},
{who:"　",text:"旅行は始まる前から始まっていた。しおりの余白に、小さく「屋上の伝説、現地でも有効？」と誰かが書き込んでいた。",choices:[
 {label:"りんとしおりを仕上げる",effect:()=>{S.aff.rin=clamp(S.aff.rin+7);S.lastMeet.rin=S.turn}},
 {label:"あかりと自由行動の計画を立てる",effect:()=>{S.aff.akari=clamp(S.aff.akari+7);S.lastMeet.akari=S.turn}}]}],
()=>{S.met.rin=true;S.met.akari=true;addLog("修学旅行の班決めとしおり作りをした");show("screen-game");render();done()},"🗺️ 修学旅行の準備")}
/* ================= DATE ================= */
function openDate(){
const cand=HEROINES.filter(h=>S.met[h.id]&&S.aff[h.id]>=15);
if(!cand.length){toast("まだデートに誘える相手がいない。まずは会話で仲良くなろう");return}
if(S.money<500){gameBusy=true;addLog("お金が足りずデートを断念した");playNovel([{sys:true,text:"所持金が足りません…。デートを断念しました。カフェのバイトで稼ごう。"},{player:true,text:"財布が…軽い。今週はデート、無理か…。"},{who:"　",text:"お金が足りず、デートは断念した。カフェのバイトで稼ぐのも、立派な青春だ。"}],()=>{show("screen-game");render();gameBusy=false},"💸 デート断念");return}
gameBusy=true;
setStage(null,"　","誰を誘おう？（好感度が高いほどOKされやすい）","💌 デートに誘う");
const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
cand.forEach(h=>{const b=document.createElement("button");b.textContent=h.name+"（好感度 "+S.aff[h.id]+"）";
b.onclick=()=>{ch.classList.add("hidden");pickPlace(h)};ch.appendChild(b)});
const cancel=document.createElement("button");cancel.textContent="やっぱりやめる";cancel.onclick=()=>{ch.classList.add("hidden");gameBusy=false;setStage("sakura","　","デートはまた今度にしよう。","📅 "+dateLabel(S.turn).text)};ch.appendChild(cancel);
}
function pickPlace(h){
setStage(h.id,h.name,"行き先を選ぼう。相手の好みが大事。誘いが成功するかは、好感度・信頼度・魅力で決まるよ。お金も必要だ。","💌 行き先は？");
const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
const month=dateLabel(S.turn).month;const summer=month>=6&&month<=8;
PLACES.filter(p=>((p.id!=="sea"&&p.id!=="pool"&&p.id!=="river")||summer)&&(p.id!=="room"||(S.aff[h.id]>=60&&relOf(h.id).close>=35))).forEach(p=>{const b=document.createElement("button");b.textContent=p.name+"｜"+p.desc+"（"+dateCost(p.id)+"円）";
b.onclick=()=>{ch.classList.add("hidden");runDate(h,p)};ch.appendChild(b)});
}
function runDate(h,p){
const r=relOf(h.id);const cost=dateCost(p.id);
let chance=42+S.aff[h.id]*0.45+r.trust*0.25+S.stats.miryoku*0.15;
if(S.flags["planned_"+h.id]){chance+=15;delete S.flags["planned_"+h.id]}
chance=Math.max(15,Math.min(96,chance));
if(!chanceRoll(chance)){
 S.aff[h.id]=clamp(S.aff[h.id]-2);addRel(h.id,{close:2});pushHistory(h.id,"declined","誘いを断られた日");
 addLog(h.short+"をデートに誘ったが予定が合わなかった（好感度-2）");beep(392,.15);
 playNovel([
 {hero:h.id,who:"　",variant:"date",text:p.name+"へ、"+h.name+"を誘ってみた。"},
 {hero:h.id,who:h.name,variant:"shy",text:"ごめんね、その日はどうしても都合がつかなくて…。…また誘ってくれたら、嬉しいな"},
 {player:true,text:"そっか…。仕方ない。また今度、誘ってみよう。"},
 {sys:true,text:"誘いは断られました。成功率は好感度・信頼度・魅力で決まります（今回は約"+Math.round(chance)+"%）。数値を上げても必ず成功するわけではありません。"}
 ],()=>{show("screen-game");render();gameBusy=false;nextTurn()},"💌 デートの誘い");
 return;
}
if(S.money<cost){toast("お金が足りない！（必要 "+cost+"円／所持 "+S.money+"円）バイトで稼ごう");gameBusy=false;setStage(h.id,h.name,"財布の中身が足りなかった…。バイトで稼いでから誘おう。","💸 お金不足");return}
S.money-=cost;
const liked=h.like.includes(p.id);
S.lastMeet[h.id]=S.turn;S.dates++;S.stats.stress=clamp(S.stats.stress-6);addHurt(h.id,-15);rippleHurt(h.id,6);
if(S.dates===1){unlockMem("mem_date1");unlockAch("first_date")}
pushHistory(h.id,"date",p.name+"デート");
 const SPOT_BY_PLACE={park:"joseki",library:"library",museum:"basho_yakata",river:"nakagawa"};visitSpot(SPOT_BY_PLACE[p.id]);
if(p.id==="room"){
 const delta=12;S.aff[h.id]=clamp(S.aff[h.id]+delta);addRel(h.id,{trust:8,close:12});
 unlockMem("mem_room");unlockAch("room");
 addLog("お部屋デートに"+h.short+"を招いた（好感度+"+delta+"、信頼・親密アップ、"+cost+"円）");chime();
 const cookOk=S.skills.ryouri+rnd(-10,10)>=45;
 playNovel([
 {img:"assets/room-date.webp",who:"　",text:"日曜日。"+h.name+"が、少し緊張した顔で自宅の玄関に立っていた。――初めてのお部屋デート。"},
 {hero:h.id,who:h.name,variant:"date",text:"お、お邪魔します…。…へえ、これが"+pCall(h.id)+"の部屋かあ。…なんだか、ドキドキするね"},
 {player:true,text:"散らかってるけど、適当に座って。お昼、一緒に作ろうか？"},
 {hero:h.id,who:"　",variant:"date",text:cookOk?"キッチンに並んで立つ二人。手際よくできた手作りランチに、彼女の目が輝いた。":"慣れない二人での料理は少し焦げてしまったけれど、笑いながらのランチは格別だった。"},
 {hero:h.id,who:h.name,variant:"shy",text:"…ねえ、こういう休日もいいね。…また、来てもいい？"},
 {sys:true,text:"お部屋デートで親密度と信頼度が大きく上がりました。"}
 ],()=>{show("screen-game");render();gameBusy=false;nextTurn()},"🏠 お部屋デート");
 checkProfileUnlocks();return;
}
const delta=liked?14:8;
S.aff[h.id]=clamp(S.aff[h.id]+delta);addRel(h.id,{trust:4,close:8});
addLog(p.name+"へ"+h.short+"とデート（好感度+"+delta+"、"+cost+"円）");chime();
const dv=p.id==="sea"?"sea":p.id==="pool"?"pool":p.id==="river"?"sea":p.id==="planetarium"?"planet":"date";
playNovel([
{hero:h.id,who:"　",variant:dv,text:"日曜日。待ち合わせ場所に、少しおしゃれした"+h.name+"が現れた。"},
{hero:h.id,who:h.name,variant:dv,text:liked?"ここ、来てみたかったの！誘ってくれてありがとう！":"今日はありがとう。あなたとだと、どこでも楽しいね"},
{hero:h.id,who:"　",variant:dv,text:p.name+"で過ごした休日。帰り道、"+h.short+"が言った。"},
{hero:h.id,who:h.name,variant:"smile",text:liked?"今日のこと、ずっと覚えてる。…また誘ってね？":"また今度、別の場所にも行ってみたいな"}
],()=>{show("screen-game");render();gameBusy=false;nextTurn()},"💌 デート");
checkProfileUnlocks();
}

/* ================= NEW SYSTEMS（関係値・通知・履歴・実績・病気・連絡・追加イベント） ================= */
function kurobaneCount(){return S&&S.spots?Object.keys(S.spots).length:0}
function visitSpot(id){if(!id||!S)return;if(!S.spots)S.spots={};if(S.spots[id])return;S.spots[id]=true;const n=kurobaneCount();
 if(n>=5)unlockAch("kurobane1");if(n>=15)unlockAch("kurobane2");if(n>=KUROBANE_SPOTS.length)unlockAch("kurobane_full");
 if(id==="library")unlockMem("mem_op04");addLog("黒羽めぐり "+n+"/"+KUROBANE_SPOTS.length+" か所")}
function unlockAch(id){if(!S)return;if(!S.ach)S.ach=[];META.ach.add(id);persistMeta();if(S.ach.includes(id))return;S.ach.push(id);const a=ACHIEVEMENTS.find(x=>x.id===id);if(a)sysNotify("🏆 実績解除：「"+a.name+"」 "+a.desc,1)}
function relOf(hid){if(!S.rel)S.rel={};if(!S.rel[hid])S.rel[hid]={trust:10,close:5,jealous:0};return S.rel[hid]}
function addRel(hid,d){const r=relOf(hid);["trust","close","jealous"].forEach(k=>{if(d[k])r[k]=clamp(r[k]+d[k])});if(d.aff)S.aff[hid]=clamp(S.aff[hid]+d.aff)}
function rippleJealous(exceptId,d){HEROINES.forEach(h=>{if(h.id!==exceptId&&S.met[h.id]&&S.aff[h.id]>=40)addRel(h.id,{jealous:d})})}
function chanceRoll(pct){return Math.random()*100<pct}
function dateCost(pid){return {room:500,park:800,library:800,cafe:1200,movie:1800,amuse:3000,museum:1500,sports:2000,concert:2500,planetarium:2200,aquarium:2000,sea:1500,pool:1000,river:1200}[pid]||1500}
function pushHistory(hid,tag,label){if(!S.history)S.history={};if(!S.history[hid])S.history[hid]=[];S.history[hid].unshift({tag:tag,label:label,turn:S.turn});S.history[hid]=S.history[hid].slice(0,6)}
function lastHistoryLabel(hid){const hh=S.history&&S.history[hid];return hh&&hh.length?hh[0].label:null}
function profStageOf(hid){if(!S||!S.met[hid])return 0;const a=S.aff[hid];return a>=85?5:a>=70?4:a>=50?3:a>=30?2:1}
function checkProfileUnlocks(){if(!S)return;HEROINES.forEach(h=>{if(!S.met[h.id])return;const st=profStageOf(h.id);const prev=(S.profStage&&S.profStage[h.id])||0;if(st>prev){if(!S.profStage)S.profStage={};S.profStage[h.id]=st;if(prev>=1)sysNotify("📋 "+h.name+"さんのプロフィールで見られる項目が増えました！（開放度 Lv"+st+"）",1);if(st>=4)unlockAch("tel")}})}
function sysNotify(msg,imp){if(!S)return;if(!S.notices)S.notices=[];if(S.notices[0]!==msg){S.notices.unshift(msg);S.notices=S.notices.slice(0,6)}if(imp)toast(msg);if($("sys-box"))renderSys()}
function renderSys(){const box=$("sys-box");if(!box)return;if(!S||!S.notices||!S.notices.length){box.classList.add("hidden");return}box.classList.remove("hidden");$("sys-list").innerHTML=S.notices.map(n=>'<div class="sys-item">'+esc(n)+"</div>").join("")}
function weeklyChecks(){
 if(!S)return;if(!S.prevAff)S.prevAff={};
 HEROINES.forEach(h=>{if(!S.met[h.id]){S.prevAff[h.id]=S.aff[h.id];return}
  const d=S.aff[h.id]-(S.prevAff[h.id]||0);
  if(d>=10)sysNotify("💗 "+h.name+"さんの好感度が急上昇中です！（この1週間で+"+d+"）",1);
  else if(d<=-6)sysNotify("💔 "+h.name+"さんの好感度が下がりました…（この1週間で"+d+"）",1);
  S.prevAff[h.id]=S.aff[h.id];
  const r=relOf(h.id);if(r.jealous>0)r.jealous=clamp(r.jealous-2);
  if(S.turn-S.lastMeet[h.id]>=6&&r.close>0)r.close=clamp(r.close-2);
 });
 checkProfileUnlocks();
 if(!S.sick){
  if(S.stats.tairyoku<=18)sysNotify("⚠ プレイヤーの体力が落ちています…放置すると病気で寝込んでしまいます。「休養する」で回復しましょう",1);
  else if(S.stats.stress>=85)sysNotify("⚠ プレイヤーのストレスが限界に近いです…放置すると寝込んでしまいます",1);
 }
 if(HEROINES.every(h=>S.met[h.id]))unlockAch("meet_all");
 if(HEROINES.some(h=>S.aff[h.id]>=100))unlockAch("aff100");
}
/* ---------- 病気・見舞い ---------- */
function sickRest(done){
 S.sick=false;S.stats.tairyoku=clamp(S.stats.tairyoku+30);S.stats.stress=clamp(S.stats.stress-30);
 const vis=HEROINES.filter(h=>S.met[h.id]&&S.aff[h.id]>=55&&relOf(h.id).trust>=35).sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
 if(vis){addRel(vis.id,{aff:6,trust:8,close:8});S.lastMeet[vis.id]=S.turn;addHurt(vis.id,-15);pushHistory(vis.id,"visit","見舞いに来てくれた日");unlockMem("mem_visit");unlockAch("visit");addLog(vis.short+"が見舞いに来てくれた。体力が回復した");
  playNovel([
   {sys:true,text:"休養中――インターホンが鳴りました。"},
   {player:true,text:"…誰だろう。こんな時に…"},
   {hero:vis.id,who:vis.name,variant:"sick",text:"お見舞いに来たよ。…ほら、おかゆとスポーツドリンク。無理ばっかりして…心配したんだから"},
   {player:true,text:"ありがとう…。来てくれて、本当に嬉しい。"},
   {hero:vis.id,who:vis.name,variant:"shy",text:"早く元気になってね。…元気になったら、また一緒に帰ろう？"},
   {who:"　",text:"見舞いの温かさが、何よりの薬だった。体力もだいぶ戻ってきた。"}
  ],()=>{show("screen-game");render();done()},"🤒 お見舞い");
 }else{addLog("誰も見舞いに来ず、静かに休養した。体力は回復した");
  playNovel([
   {player:true,text:"…結局、誰も見舞いには来なかったな。"},
   {who:"　",text:"静かな部屋で一人、天井を見上げた。…もっと、みんなと仲良くなっておけばよかった。"},
   {sys:true,text:"見舞いに来る相手がいませんでした…。好感度55以上・信頼度35以上のヒロインが見舞いに来てくれます。体力は回復しました。"}
  ],()=>{show("screen-game");render();done()},"🤒 一人の休養");
 }
}
/* ---------- 電話・メール ---------- */
function contactCancel(ch){const cancel=document.createElement("button");cancel.textContent="やっぱりやめる";cancel.onclick=()=>{ch.classList.add("hidden");gameBusy=false;setStage("sakura","　","連絡はまた今度にしよう。","📅 "+dateLabel(S.turn).text)};ch.appendChild(cancel)}
function openContact(){
 const cand=HEROINES.filter(h=>S.met[h.id]&&profStageOf(h.id)>=3);
 if(!cand.length){toast("まだ連絡先を知っている相手がいない。好感度50でメール、70で電話番号がプロフィールに開くよ");return}
 gameBusy=true;
 setStage(null,"【システム】","誰に連絡する？（メール：好感度50以上／電話：好感度70以上で開放）","📱 電話・メール");
 const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
 cand.forEach(h=>{const st=profStageOf(h.id);const b=document.createElement("button");b.textContent=h.name+"（"+(st>=4?"📱電話・✉️メール可":"✉️メールのみ")+"）";b.onclick=()=>{pickContactMethod(h)};ch.appendChild(b)});
 contactCancel(ch);
}
function pickContactMethod(h){
 const st=profStageOf(h.id);
 setStage(h.id,h.name,"どうやって連絡する？","📱 電話・メール");
 const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
 if(st>=4){const b=document.createElement("button");b.textContent="📱 電話をかける";b.onclick=()=>{pickContactTopic(h,"tel")};ch.appendChild(b)}
 const b2=document.createElement("button");b2.textContent="✉️ メールを送る";b2.onclick=()=>{pickContactTopic(h,"mail")};ch.appendChild(b2);
 contactCancel(ch);
}
function pickContactTopic(h,method){
 setStage(h.id,h.name,method==="tel"?"電話がつながった。何を話そう？":"メールを書いている。何を送ろう？","📱 電話・メール");
 const ch=$("game-choices");ch.innerHTML="";ch.classList.remove("hidden");
 CONTACT_TOPICS.forEach(t=>{const b=document.createElement("button");b.textContent=t.name;b.onclick=()=>{ch.classList.add("hidden");runContact(h,method,t)};ch.appendChild(b)});
}
function runContact(h,method,topic){
 if(S.flags)S.flags.talk=(S.flags.talk||0)+1;
 const prevH=(S.history&&S.history[h.id]&&S.history[h.id][0])||null;
 const eff=method==="tel"?{close:5,trust:3,aff:2}:{close:4,trust:2,aff:1};
 if(topic.id==="worry")eff.trust+=3;
 if(topic.id==="plan")S.flags["planned_"+h.id]=true;
 addRel(h.id,eff);S.lastMeet[h.id]=S.turn;addHurt(h.id,-8);
 if(method==="tel"){unlockMem("mem_phone2");unlockAch("tel")}else unlockMem("mem_mail");
 pushHistory(h.id,method==="tel"?"phone":"mail",method==="tel"?"電話で話した日":"メールをやりとりした日");
 addLog(h.short+"に"+(method==="tel"?"電話":"メール")+"した（親密度・信頼度アップ）");chime();checkProfileUnlocks();
 const scenes=[
  {sys:true,text:method==="tel"?"電話をかけた。数コールで、彼女が出た。":"メールを送った。しばらくして、返信が来た。"},
  {player:true,text:topic.player},
  {hero:h.id,who:h.name,variant:method==="tel"?"smile":"shy",text:CONTACT_REPLIES[h.id][topic.id]}
 ];
 if(prevH)scenes.push({who:"　",text:"話の流れで、この前の「"+prevH.label+"」の話題になった。彼女はよく覚えていた。"});
 scenes.push({sys:true,text:(method==="tel"?"電話":"メール")+"で親密度と信頼度が上がりました。"+(topic.id==="plan"?"次のデートの誘いの成功率も少し上がります。":"")});
 playNovel(scenes,()=>{show("screen-game");render();gameBusy=false;nextTurn()},"📱 "+(method==="tel"?"電話":"メール"));
}
/* ---------- 追加イベント（月→好感度→能力値の入れ子条件＋成功率） ---------- */
function bonusEvent(cmdId,done){
 if(Math.random()>=0.35){done();return}
 const roll=Math.random();
 if(roll<0.25){hokkoriEvent(done);return}
 if(roll<0.55&&extraEvent(done))return;
 if(roll<0.65&&secretEvent(done))return;
 if(roll<0.85){encounter(cmdId,done);return}
 if(S.kuhi&&S.kuhi.length<10&&Math.random()<0.5){kuhiEvent(done,null)}else{localEvent(done,null)}
}
function evBlackSwan(done){S.flags.swanDone=true;unlockMem("mem_swan");const h=hero("yuki");
 playNovel([{sys:true,img:"assets/op03.webp",text:"ある月夜のこと――満月の光に誘われるように、羽田沼のほとりまで足を延ばした。隣には、月島ゆき。"},
 {hero:"yuki",who:"　",variant:"smile",text:"静かだね……。水面が、月を映して銀色に揺れてる"},
 {hero:"yuki",who:"月島 ゆき",text:"……見て。あれ、白鳥……でも、黒いっぺ？"},
 {who:"　",img:"assets/op03.webp",text:"月明かりの中、黒い白鳥が一羽、音もなく水面を滑っていた。白鳥は白いものだと思っていた。でも、確かに――黒い。"},
 {hero:"yuki",who:"月島 ゆき",text:"羽田沼の黒い白鳥は、見た人に幸運を運ぶって言い伝えがあるんだっぺ。……ふふ、内緒だよ。騒ぐと、逃げちゃうから"},
 {player:true,text:"……じゃあ、俺たち、運がいいんだな"},
 {hero:"yuki",who:"月島 ゆき",variant:"shy",text:"うん。……今日のことは、二人だけの秘密だっぺ"},
 {who:"　",img:"assets/op03.webp",text:"黒い白鳥は一度だけこちらを見て、月を映す水面の向こうへ消えた。――黒羽の森の奥には、まだ誰も知らない物語がある。"}],
 ()=>{S.aff.yuki=clamp(S.aff.yuki+5);addRel("yuki",{close:5,trust:3});S.lastMeet.yuki=S.turn;pushHistory("yuki","swan","羽田沼の黒い白鳥");addLog("羽田沼で、ゆきと黒い白鳥を見た");show("screen-game");render();done()},"🦢 黒羽の森");
}
function extraEvent(done){
 const month=dateLabel(S.turn).month;
 const met=HEROINES.filter(h=>S.met[h.id]);
 if(!met.length)return false;
 const top=met.slice().sort((a,b)=>S.aff[b.id]-S.aff[a.id])[0];
 const fightH=met.find(h=>S.flags["fight_"+h.id]);
 if(fightH){evMakeup(fightH,done);return true}
 const jH=met.filter(h=>relOf(h.id).jealous>=55).sort((a,b)=>relOf(b.id).jealous-relOf(a.id).jealous)[0];
 if(jH){evJealous(jH,done);return true}
 const cands=[];
 if(!S.flags.umbrellaDone)cands.push({ok:(month===6||month===9),fn:()=>evUmbrella(top,done)});
 cands.push({ok:month>=6&&month<=9&&!S.flags.shelterDone,fn:()=>evRainShelter(top,done)});
 cands.push({ok:(month===7||month===8)&&!S.flags.riverDone&&!!top,fn:()=>evRiver(top,done)});
 cands.push({ok:(month===7||month===8)&&S.met.akari&&!S.flags.campDone,fn:()=>evCamp(done)});
 cands.push({ok:!S.flags.lostDone&&(S.stats.moral>=35||S.skills.kidate>=35),fn:()=>evLostChild(top,done)});
 const misH=met.find(h=>relOf(h.id).jealous>=25&&S.aff[h.id]>=40);
 if(misH)cands.push({ok:!S.flags["mis_"+misH.id],fn:()=>evMisunderstand(misH,done)});
 if(top&&S.aff[top.id]>=60&&relOf(top.id).trust>=50&&!S.flags["secret_"+top.id])cands.push({ok:true,fn:()=>evSecret(top,done)});
 if(month>=10&&!S.flags.dreamDone&&top)cands.push({ok:true,fn:()=>evDream(top,done)});
 const bestStat=Math.max(S.stats.gakuryoku,S.stats.undou,S.stats.geijutsu,S.stats.miryoku);
 if(bestStat>=72&&!S.flags.effortDone)cands.push({ok:true,fn:()=>evEffort(done)});
 if(S.stats.gakuryoku<=28&&S.met.yuki&&!S.flags.remedialDone)cands.push({ok:true,fn:()=>evRemedial(done)});
 if(month>=9&&!S.flags.rival&&top)cands.push({ok:true,fn:()=>evRival(top,done)});
 if(S.met.yuki&&(month>=10||month<=2)&&!S.flags.swanDone)cands.push({ok:true,fn:()=>evBlackSwan(done)});
 const avail=cands.filter(c=>c.ok);
 if(!avail.length)return false;
 avail[rnd(0,avail.length-1)].fn();
 return true;
}
function evUmbrella(h,done){S.flags.umbrellaDone=true;unlockMem("mem_umbrella");
 const a=S.aff[h.id];
 const scenes=[{sys:true,text:"夕方、突然の雨。傘は一本しか持っていない。"},
 {hero:h.id,who:"　",variant:"shy",text:"帰り道、"+h.name+"が軒下で雨宿りをしていた。傘は、持っていないようだ。"},
 {player:true,text:"…ねえ、よかったら、半分入る？"}];
 if(a<30){scenes.push({hero:h.id,who:h.name,text:"…ううん、大丈夫。もうすぐ止むと思うから。…ありがとう、気持ちだけ"},
  {who:"　",text:"彼女は笑って断った。まだ、二人の距離はそこまで近くなかった。"},
  {sys:true,text:"相合傘は断られました…。好感度を上げると、同じイベントでも展開が変わります。"});
 }else if(a<60){scenes.push({hero:h.id,who:h.name,variant:"shy",text:"…いいの？ありがとう。…じゃあ、お言葉に甘えて"},
  {who:"　",text:"一本の傘で並んで歩く帰り道。肩が少し濡れたけど、それも悪くないと思った。"},
  {sys:true,text:"普通に相合傘ができた。好感度+5、親密度+5。"});
 }else if(a<85){scenes.push({hero:h.id,who:h.name,variant:"shy",text:"…ありがとう。…あの、もう少し、そっちに寄ってもいい？"},
  {who:"　",text:"歩くたびに、肩がそっと触れる。そのたびに、彼女の頬が少し赤くなった気がした。"},
  {hero:h.id,who:h.name,variant:"shy",text:"…ねえ、雨の日って、嫌いじゃないかも"},
  {sys:true,text:"肩が触れて照れる相合傘になった。好感度+8、親密度+8。"});
 }else{scenes.push({hero:h.id,who:h.name,variant:"shy",text:"…うん！…あのね、濡れちゃうから…手、つないでもいい？"},
  {who:"　",text:"彼女の方から、そっと手をつないできた。雨の音が、急に遠くなった。"},
  {sys:true,text:"相手から手をつないでくる、最高の相合傘になった！好感度+12、親密度+12、信頼度+5。"});
 }
 playNovel(scenes,()=>{
  if(a<30){S.aff[h.id]=clamp(S.aff[h.id]-2)}else if(a<60){S.aff[h.id]=clamp(S.aff[h.id]+5);addRel(h.id,{close:5})}else if(a<85){S.aff[h.id]=clamp(S.aff[h.id]+8);addRel(h.id,{close:8})}else{S.aff[h.id]=clamp(S.aff[h.id]+12);addRel(h.id,{close:12,trust:5});unlockAch("umbrella_max")}
  S.lastMeet[h.id]=S.turn;pushHistory(h.id,"umbrella","雨の日の相合傘");addLog("雨の日に"+h.short+"と相合傘（好感度"+a+"での分岐）");show("screen-game");render();done()},"☂️ 雨の日の相合傘");
}
function evRiver(h,done){S.flags.riverDone=true;visitSpot("nakagawa");unlockMem("mem_river");unlockMem("mem_op03");
 playNovel([{sys:true,text:"真夏の日曜日。黒羽の那珂川へ、川遊びに行くことになった。",img:"assets/op03.webp"},
 {hero:h.id,who:"　",variant:"sea",text:"澄んだ流れと、緑の山々。河原に着くなり、"+h.short+"の目が輝いた。"},
 {hero:h.id,who:h.name,variant:"sea",text:"見て見て！水、すっごく冷たくて気持ちいい！…ねえ、向こうで鮎の塩焼き売ってるよ？"},
 {who:"　",text:"どうする？",choices:[
  {label:"鮎の塩焼きを二人分買う（800円）",effect:()=>{if(S.money>=800){S.money-=800;S.aff[h.id]=clamp(S.aff[h.id]+8);addRel(h.id,{close:6})}else{S.aff[h.id]=clamp(S.aff[h.id]+4)}}},
  {label:"川遊びを思い切り楽しむ",effect:()=>{S.aff[h.id]=clamp(S.aff[h.id]+5);addRel(h.id,{close:5});S.stats.stress=clamp(S.stats.stress-8)}}]},
 {hero:h.id,who:h.name,variant:"smile",text:"黒羽の鮎って、やっぱり格別だね。…今日は誘ってくれてありがとう。また来年も、来ようね"}],
 ()=>{S.lastMeet[h.id]=S.turn;pushHistory(h.id,"river","那珂川で川遊びした日");addLog("那珂川へ"+h.short+"と川遊びに行った（鮎の塩焼き）");show("screen-game");render();done()},"🎣 那珂川の川遊び")}
function evCamp(done){S.flags.campDone=true;visitSpot("kagetsu");unlockMem("mem_camp");const h=hero("akari");
 playNovel([{sys:true,text:"夏休み。あかりのテニス部は、町内のホテル花月で合宿をしている。"},
 {hero:"akari",who:"　",variant:"gym",text:"練習帰りのあかりと、ホテル花月の前でばったり会った。"},
 {hero:"akari",who:"星野 あかり",variant:"gym",text:"あ、"+pCall("akari")+"！見て見て、合宿で真っ黒に日焼けしちゃった。花月のご飯が美味しくて、つい食べすぎちゃうんだよね"},
 {who:"　",text:"どうする？",choices:[
  {label:"差し入れのスポーツドリンクを渡す",effect:()=>{S.aff.akari=clamp(S.aff.akari+7);addRel("akari",{trust:4,close:5})}},
  {label:"「最終日、応援に行くよ」と伝える",effect:()=>{S.aff.akari=clamp(S.aff.akari+5);addRel("akari",{close:6})}}]},
 {hero:"akari",who:"星野 あかり",variant:"smile",text:"へへ、ありがとう。…合宿終わったらさ、那珂川に鮎食べに行こうよ。約束ね！"}],
 ()=>{S.lastMeet.akari=S.turn;pushHistory("akari","camp","ホテル花月の合宿");addLog("ホテル花月で合宿中のあかりに会った");show("screen-game");render();done()},"🏨 ホテル花月の合宿")}
function evFireworks(h,done){S.flags.fireworksDone=true;visitSpot("fireworks");unlockMem("mem_fireworks");unlockMem("mem_op07");
 playNovel([{sys:true,img:"assets/op07.webp",text:"8月。芭蕉の里くろばね夏まつりの夜。フィナーレは市民花火大会だ。"},
 {hero:h.id,who:"　",variant:"yukata",text:"浴衣姿の"+h.name+"と、那珂川の河原へ。人混みの中、はぐれないよう自然と距離が近づく。"},
 {hero:h.id,who:h.name,variant:"yukata",text:"ねえ、花火が始まったら…あそこの土手がよく見えるんだよ。…二人で、行こう？"},
 {who:"　",text:"どうする？",choices:[
  {label:"彼女の手を引いて土手へ向かう",effect:()=>{S.aff[h.id]=clamp(S.aff[h.id]+10);addRel(h.id,{close:8,trust:3})}},
  {label:"屋台で焼きそばと鮎の塩焼きを買う",effect:()=>{if(S.money>=600)S.money-=600;S.aff[h.id]=clamp(S.aff[h.id]+7);addRel(h.id,{close:6})}}]},
 {hero:h.id,who:"　",variant:"yukata",text:"――大輪の花火が、那珂川の水面にもう一つ咲いた。歓声と、火薬の匂いと、隣の笑顔。"},
 {hero:h.id,who:h.name,variant:"shy",text:"…ねえ、今の花火、見た？…ううん、なんでもない。…来年も、同じ場所で見たいな"}],
 ()=>{S.lastMeet[h.id]=S.turn;pushHistory(h.id,"fireworks","くろばね夏まつりの花火");addLog("芭蕉の里くろばね夏まつり・市民花火大会に"+h.short+"と行った");show("screen-game");render();done()},"🎆 くろばね夏まつり・市民花火大会")}
function evRainShelter(h,done){S.flags.shelterDone=true;
 playNovel([{sys:true,text:"急な夕立。駅前の軒下で雨宿りすることになった。"},
 {hero:h.id,who:h.name,variant:"shy",text:"わあ…すごい雨。…しばらく止みそうにないね"},
 {who:"　",text:"どうする？",choices:[
  {label:"温かい飲み物を買ってくる（300円）",effect:()=>{if(S.money>=300){S.money-=300;S.aff[h.id]=clamp(S.aff[h.id]+6);addRel(h.id,{close:5})}else{S.aff[h.id]=clamp(S.aff[h.id]+3)}}},
  {label:"雨が止むまで、他愛ない話をする",effect:()=>{addRel(h.id,{trust:4,close:3});S.aff[h.id]=clamp(S.aff[h.id]+4)}}]},
 {hero:h.id,who:h.name,variant:"smile",text:"…ねえ、雨宿りって、なんだか秘密の時間みたいだね"}],
 ()=>{S.lastMeet[h.id]=S.turn;pushHistory(h.id,"shelter","雨宿りをした日");addLog("急な雨で"+h.short+"と雨宿りした");show("screen-game");render();done()},"🌧️ 雨宿り")}
function evLostChild(h,done){S.flags.lostDone=true;
 const chance=Math.max(20,Math.min(95,35+S.skills.kidate*0.5+S.stats.moral*0.4));const ok=chanceRoll(chance);
 playNovel([{who:"　",text:"駅前で、泣いている小さな子供を見つけた。迷子のようだ。"},
 {hero:h.id,who:h.name,text:"どうしよう…。ねえ、私たちで、助けてあげよう？"},
 {who:"　",text:ok?"子供の手を引いて交番へ。ほどなくお母さんが駆けつけ、涙ながらに何度も頭を下げた。":"交番に届けると、すぐに保護者と連絡がついた。少し時間はかかったけれど、無事に解決した。"},
 {hero:h.id,who:h.name,variant:"smile",text:ok?"…あなたって、困ってる人を見ると放っておけないんだね。…そういう所、好きだな":"一緒にいてくれて、ありがとう。一人じゃ心細かったと思う"}],
 ()=>{S.aff[h.id]=clamp(S.aff[h.id]+(ok?6:3));addRel(h.id,{trust:ok?8:4});unlockMem("mem_lostchild");pushHistory(h.id,"lostchild","迷子の子供を助けた日");addLog("迷子の子供を助けた（成功率"+Math.round(chance)+"%→"+(ok?"成功":"解決")+"、"+h.short+"の信頼度アップ）");show("screen-game");render();done()},"🧒 迷子の子供")}
function evMisunderstand(h,done){S.flags["mis_"+h.id]=true;
 playNovel([{who:"　",text:"放課後、"+h.name+"の様子がいつもと違う。視線が、少し冷たい。"},
 {hero:h.id,who:h.name,text:"…この前、駅前で女の子と笑ってたよね。…あれ、誰？"},
 {player:true,text:"あれは従姉妹だよ。買い物に付き合ってただけで…"},
 {who:"　",text:"どう伝える？",choices:[
  {label:"その場で誠実に説明する",effect:()=>{const ok=chanceRoll(35+S.stats.shakou*0.5+relOf(h.id).trust*0.3);if(ok){addRel(h.id,{trust:5,jealous:-30});S.aff[h.id]=clamp(S.aff[h.id]+3)}else{S.flags["fight_"+h.id]=true;addRel(h.id,{jealous:-10,trust:-5});S.aff[h.id]=clamp(S.aff[h.id]-6)}}},
  {label:"後で手紙で丁寧に伝える",effect:()=>{addRel(h.id,{trust:2,jealous:-15})}}]},
 {hero:h.id,who:h.name,variant:"shy",text:"…今日は、帰るね。…ちゃんと話してくれて、ありがとう"}],
 ()=>{pushHistory(h.id,"mis","勘違いがあった日");addLog(h.short+"との勘違い・誤解イベント"+(S.flags["fight_"+h.id]?"（ケンカになってしまった）":""));show("screen-game");render();done()},"💭 勘違い・誤解")}
function evMakeup(h,done){delete S.flags["fight_"+h.id];
 playNovel([{who:"　",text:"この前のケンカ以来、どこかギクシャクしていた。今日こそ、仲直りしよう。"},
 {player:true,text:"この前のこと、ごめん。ちゃんと話したくて"},
 {hero:h.id,who:h.name,variant:"shy",text:"…私も、意地張ってた。ごめんね。…ねえ、これで仲直り、だよね？"},
 {who:"　",text:"笑い合えた帰り道。ケンカした分だけ、二人の距離は少し縮まった気がした。"}],
 ()=>{S.aff[h.id]=clamp(S.aff[h.id]+6);addRel(h.id,{trust:6,close:4});addHurt(h.id,-20);unlockMem("mem_fight");unlockAch("fight_fix");pushHistory(h.id,"makeup","ケンカして仲直りした日");addLog(h.short+"と仲直りした（信頼度アップ）");show("screen-game");render();done()},"🕊️ ケンカ・仲直り")}
function evJealous(h,done){
 playNovel([{sys:true,text:h.name+"の嫉妬度が高まっています…。"},
 {hero:h.id,who:h.name,variant:"shy",text:"…ねえ、最近、他の子と仲良すぎない？…私、別に、気にしてないけど。…気にしてない、けど…"},
 {who:"　",text:"どう答える？",choices:[
  {label:"誠実に謝って説明する",effect:()=>{const ok=chanceRoll(40+S.stats.shakou*0.4+relOf(h.id).trust*0.3);addRel(h.id,{jealous:-40,trust:ok?5:-2});S.aff[h.id]=clamp(S.aff[h.id]+(ok?2:-3))}},
  {label:"「一番大事なのは君だよ」と伝える",effect:()=>{addRel(h.id,{jealous:-35,close:4});S.aff[h.id]=clamp(S.aff[h.id]+4)}},
  {label:"開き直る",effect:()=>{addRel(h.id,{jealous:-20,trust:-8});S.aff[h.id]=clamp(S.aff[h.id]-8);addHurt(h.id,15)}}]},
 {hero:h.id,who:h.name,variant:"shy",text:"…もう、知らない。…でも、ちゃんと私の事も見ててよね"}],
 ()=>{pushHistory(h.id,"jealous","やきもちを焼かれた日");addLog(h.short+"のやきもちイベント");show("screen-game");render();done()},"💢 やきもち")}
function evSecret(h,done){S.flags["secret_"+h.id]=true;
 playNovel([{who:"　",text:"夕方の教室で二人きり。"+h.name+"が、意を決したように口を開いた。"},
 {hero:h.id,who:h.name,variant:"shy",text:"…ねえ、これ、誰にも言わないでね。"+h.profile.secret},
 {player:true,text:"うん、絶対に誰にも言わない。話してくれてありがとう"},
 {hero:h.id,who:h.name,variant:"smile",text:"…ありがとう。あなたにだけは、知っててほしかったの"},
 {sys:true,text:"秘密を共有したことで、信頼度が大きく上がりました。プロフィールにも「秘密の一面」が開放されました。"}],
 ()=>{addRel(h.id,{trust:10,close:5});S.aff[h.id]=clamp(S.aff[h.id]+4);S.lastMeet[h.id]=S.turn;unlockMem("mem_secret");unlockAch("secret");pushHistory(h.id,"secret","秘密を教えてもらった日");addLog(h.short+"の秘密を知った（信頼度+10）");show("screen-game");render();done()},"🤫 秘密")}
function evDream(h,done){S.flags.dreamDone=true;
 playNovel([{who:"　",text:"放課後、進路の話になった。卒業後の未来が、少しずつ現実味を帯びてくる季節。"},
 {hero:h.id,who:h.name,text:"ねえ、卒業したら、どうするの？…将来の夢とか、ある？"},
 {who:"　",text:"どう答える？",choices:[
  {label:"自分の夢を真剣に語る",effect:()=>{addRel(h.id,{trust:5,close:4});S.aff[h.id]=clamp(S.aff[h.id]+4)}},
  {label:"彼女の夢をじっくり聞く",effect:()=>{addRel(h.id,{trust:7,close:3});S.aff[h.id]=clamp(S.aff[h.id]+5)}},
  {label:"「まだ分からない」と正直に言う",effect:()=>{addRel(h.id,{trust:3});S.aff[h.id]=clamp(S.aff[h.id]+2)}}]},
 {hero:h.id,who:h.name,variant:"smile",text:"…そっか。卒業しても、それぞれの夢、応援し合えたらいいね"}],
 ()=>{S.lastMeet[h.id]=S.turn;unlockMem("mem_dream");pushHistory(h.id,"dream","将来の夢を語り合った日");addLog(h.short+"と進路・将来の夢を語り合った");show("screen-game");render();done()},"🌱 進路・将来の夢")}
function evEffort(done){S.flags.effortDone=true;
 playNovel([{sys:true,text:"努力が認められました！"},
 {hero:"rin",who:"藤原 りん",variant:"smile",text:"全校集会で、あなたの名前が呼ばれたわ。日々の努力が、表彰という形になったのね。おめでとう"},
 {who:"　",text:"積み重ねてきた努力は、ちゃんと誰かが見ていてくれた。クラスメイトからの拍手が、少し照れくさかった。"}],
 ()=>{HEROINES.forEach(h=>{if(S.met[h.id])S.aff[h.id]=clamp(S.aff[h.id]+2)});addLog("努力が認められて表彰された（全員の好感度+2）");sysNotify("🏅 努力が認められました！みんなの評価が上がっています",1);show("screen-game");render();done()},"🏅 努力が認められる")}
function evRemedial(done){S.flags.remedialDone=true;
 playNovel([{sys:true,text:"学力が不足しています…補習が言い渡されました。"},
 {hero:"yuki",who:"月島 ゆき",text:"…補習、私も付き合います。図書室で、特訓しましょう"},
 {who:"　",text:"夕日の図書室での特訓。教え方は丁寧で、苦手な所が少しずつ解けていった。"}],
 ()=>{S.stats.gakuryoku=clamp(S.stats.gakuryoku+6);S.stats.stress=clamp(S.stats.stress+5);S.aff.yuki=clamp(S.aff.yuki+4);addRel("yuki",{trust:3,close:3});S.lastMeet.yuki=S.turn;addLog("補習で特訓（学力+6、ゆき好感度+4）");show("screen-game");render();done()},"📚 補習")}
function evRival(h,done){S.flags.rival=true;
 playNovel([{sys:true,text:"転校生がやってきました。"},
 {who:"　",text:"2学期、転校生・蒼井翼がやってきた。爽やかで、誰にでも優しくて、あっという間にクラスの人気者になった。"},
 {hero:h.id,who:h.name,text:"…あの人、なんだかすごい人気だね。…ねえ、あなたはどう思う？"},
 {player:true,text:"（…少し、嫌な予感がする。油断はできないな）"},
 {sys:true,text:"ライバル「蒼井翼」が登場しました。信頼度が低いまま卒業を迎えると、想いがライバルに届いてしまうかもしれません…。"}],
 ()=>{if(h)addRel(h.id,{jealous:10});addLog("ライバル・蒼井翼が転校してきた");show("screen-game");render();done()},"⚔️ ライバル登場")}

/* ================= TURN / ENDING ================= */
function nextTurn(){
if(!S||S.ended)return;
if(S.turn>=TOTAL_TURNS){graduation();return}
/* 休み期間は地域イベントを週2回保証（⑤）：進級前に黒羽の出来事を2本差し込む */
if(isHolidayTurn(S.turn)&&S.flags.holReg!==S.turn){S.flags.holReg=S.turn;
 localEvent(()=>{kuhiEvent(()=>{advanceTurn()},null)},null);return}
advanceTurn();
}
function advanceTurn(){
weeklyChecks();
const prevTitle=S._lastEvent?String(S._lastEvent).replace(/^[^ぁ-んァ-ヶ一-龥Ａ-Ｚａ-ｚA-Za-z0-9]+/,""):null;S._lastEvent=null;
S.turn++;render();
const d=dateLabel(S.turn);
setStage(null,"　",(prevTitle?("先週の「"+prevTitle+"」の余韻を胸に、"):"")+d.text+"。新しい1週間が始まった。物語は、少しずつ進んでいく。","📅 "+d.text+" "+d.season);
}
function judgeEnding(){
const sorted=HEROINES.filter(h=>S.met[h.id]).sort((a,b)=>S.aff[b.id]-S.aff[a.id]);
const top=sorted[0];
if(top){const r=relOf(top.id);const topHurt=(S.hurt&&S.hurt[top.id])||0;
if(S.aff[top.id]>=80&&S.stats[top.stat]>=55&&topHurt<70&&r.trust>=50&&r.jealous<80)return {type:"love",h:top};
if(S.aff[top.id]>=70&&r.trust<40&&S.flags.rival)return {type:"rival",h:top};
if(S.aff[top.id]>=65)return {type:"almost",h:top};
const bestClose=sorted.slice().sort((a,b)=>relOf(b.id).close-relOf(a.id).close)[0];
if(bestClose&&relOf(bestClose.id).close>=55&&S.stats.shakou>=45)return {type:"friend",h:bestClose};
}
const st=S.stats;
/* 2.34 特殊エンド（恋愛系の次に判定） */
if((S.money||0)>=250000)return {type:"money"};
if(((S.flags&&S.flags.talk)||0)>=40)return {type:"host"};
if(st.miryoku>=85)return {type:"star"};
if(st.gakuryoku>=70)return {type:"life",life:"work"};
if(st.geijutsu>=70)return {type:"life",life:"hobby"};
if(st.shakou>=70)return {type:"life",life:"friends"};
if(st.gakuryoku<45&&st.undou<45&&st.miryoku<45&&st.geijutsu<45&&st.shakou<45)return {type:"journey"};
return {type:"life",life:"free"};
}
function graduation(){
S.ended=true;if(typeof __nurseReady==="function"&&__nurseReady()){__nurseEnding();return}
const e=judgeEnding();
if(e.type==="love"){const h=e.h;
playNovel([
{who:"　",img:"assets/op10.webp",text:"卒業式が終わった。ざわめく校舎を抜け、約束の場所へ向かう。――校舎の屋上。"},
{hero:h.id,who:"　",variant:"grad",text:"生徒会が開けた屋上の扉。夕日の中、フェンスにもたれて"+h.name+"が待っていた。"},
{hero:h.id,who:h.name,variant:"ending",text:"来てくれたんだ…。ねえ、覚えてる？「卒業式の日、屋上で告白すると恋が実る」って神話"},
{who:"　",text:"屋上のフェンスの向こうでは、桜の花びらが夕日に透けていた。3年分の放課後、行事、他愛ない会話が、一気に胸に押し寄せた。"},
{hero:h.id,who:h.name,variant:"shy",text:"私ね、ずっと言いたかったの。"+pCall(h.id)+"と過ごしたこの3年間、私の宝物だよ。…だから、神話に頼るんじゃなくて、自分の言葉で言うね"},
{hero:h.id,who:h.name,variant:"ending",text:"好きです。――卒業しても、その先も、ずっと隣にいてください"},
{who:"　",text:"夕日と、舞い始めた桜の花びら。差し出された手を、しっかりと握った。\n――神話は本当だった。少なくとも、この二人にとっては。"}
],()=>{showEndingScreen(e)},"🌇 卒業式・屋上の告白");
return}
showEndingScreen(e);
}
/* 2.45：エンディングの文字エンドロール（全エンディング共通の入口で1回だけ流す） */
function playEndRoll(done){
 const m=$("modal-endroll"),t=$("endroll-text");if(!m||!t){done();return}
 const cast=["桜井 さくら","星野 あかり","月島 ゆき","藤原 りん","藤原 千鶴","蒼井 翼"];
 t.textContent="桜色メモリアル\n〜ときめき学園物語〜\n\n\n― 出演 ―\n"+cast.join("\n")+"\n\n主人公\n"+(S?pName():"黒羽 白夜")+"\n\n\n― 舞台 ―\n栃木県 大田原市・黒羽\n黒羽城址公園／雲巌寺／芭蕉の館\n羽田沼／那珂川 ほか\n\n\n― 音楽 ―\n主題歌「桜色メモリアル」\n\n\n企画・制作\nSnow Moon Games\n\n\nSpecial Thanks\n黒羽の町のみなさま\nそして、プレイしてくれた あなた\n\n\n\nおわり\n\n― また、黒羽で会いましょう ―";
 t.style.animation="none";void t.offsetWidth;t.style.animation="";
 m.classList.remove("hidden");
 setBGM("ending");
 let fin=false;
 const finish=function(){if(fin)return;fin=true;m.classList.add("hidden");m.onclick=null;done()};
 m.onclick=finish;
 const reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 setTimeout(finish,reduced?13000:47000);
}
function showEndingScreen(e){
if(S&&!S._rollShown){S._rollShown=true;playEndRoll(()=>showEndingScreen(e));return}
let title,text,img="assets/sakura.webp",endMem="end_solo";
if(!S._endCounted){S._endCounted=true;META.clears++;META.endings.add(e.type==="life"?("life_"+e.life):e.type);S.clears=META.clears;persistMeta();unlockAch("grad")}
if(e.type==="love"){const h=e.h;img=heroImgBy(h,"ending");endMem="end_"+h.id;S.endingId=endMem;
title="卒業 ― 屋上の告白／"+h.name+" エンディング";
text="卒業式の最後、校舎の屋上。\n\n「卒業式の日、屋上で告白すると、その恋は実る」――桜丘黒羽学園に伝わる神話の場所で、"+h.name+"は自分の言葉で想いを伝えてくれた。\n\n夕日の中で手をつないだ二人に、桜の花びらが舞い落ちる。\n\n――神話は本当だった。少なくとも、この二人にとっては。\n\n春から新しい街へ進んだ二人は、今も桜の季節になると、この屋上と桜の木を思い出すという。";
unlockMem("mem_rooftop");
}else if(e.type==="almost"){const h=e.h;img=heroImgBy(h,"shy");S.endingId="end_solo";
title="卒業 ― もう少しだった春";
text="卒業式の日。屋上へ向かう階段の前で、"+h.name+"とすれ違った。\n\n「…屋上、行く？」一瞬、目が合って、二人とも笑った。あと少し、勇気があれば。\n\n連絡先を交換して、笑って別れた。恋には届かなかったけれど、この3年間は確かに二人を近づけた。\n\n――物語は、ここから始まるのかもしれない。";
}else if(e.type==="rival"){const h=e.h;img=heroImgBy(h,"shy");endMem="end_rival";S.endingId=endMem;
title="卒業 ― ライバルに託された想い";
text="卒業式の日。屋上へ向かう途中、"+h.name+"と、転校生の蒼井翼が並んで歩く姿を見た。\n\n好感度は高かった。けれど、本音を話し合う「信頼」を育てる時間が、少し足りなかったのかもしれない。\n\n「…ごめんね。翼くんが、私の話をよく聞いてくれたから」\n\n恋は、好意だけでは届かない。――そのことを、最後の日に教わった。";
}else if(e.type==="friend"){const h=e.h;img=heroImgBy(h,"smile");endMem="end_friend";S.endingId=endMem;
title="卒業 ― 親友エンド／"+h.name;
text="卒業式。恋人にはならなかったけれど、"+h.name+"とは誰より深い「親友」になっていた。\n\n一緒に過ごした時間の多さが、二人の距離を恋とは違う形で縮めていたのだ。\n\n「卒業しても、絶対連絡してよね。一生の親友なんだから」\n\n――この関係もまた、青春の立派な答えだった。";
}else if(e.type==="life"){S.endingId="end_life_"+e.life;endMem=S.endingId;img=heroImgBy(hero("sakura"),"grad");
const LT={work:["仕事成功型","学業に打ち込んだ3年間は、推薦と実績という形で実を結んだ。恋は実らなかったけれど、自分の足で未来を掴んだ春だった。"],hobby:["趣味没頭型","芸術と趣味に没頭した3年間。卒業式の帰り道、鞄の中の作品ノートがずっしり重かった。好きな事に生きる人生が、ここから始まる。"],friends:["友人関係充実型","恋人はできなかったけれど、友達に囲まれた最高の3年間だった。卒業写真の真ん中で笑う自分を見て、悪くない青春だったと思えた。"],free:["独身自由人型","誰にも縛られず、自分のペースで過ごした3年間。卒業は終わりではなく、自由な人生の始まりだった。"],none:["何も成し遂げられなかった型","振り返れば、何に打ち込むでもなく過ぎた3年間だった。…けれど、後悔があるということは、次は変えられるということだ。人生は、まだ始まったばかり。"]};
const lt=LT[e.life]||LT.free;title="卒業 ― 人生型エンディング（"+lt[0]+"）";text="卒業式。屋上に、待つ人はいなかった。\n\n"+lt[1]+"\n\n――"+pName()+"の物語は、ここからが本番だ。";
}else if(e.type==="nurse"){img="assets/nurse10.webp";endMem="mem_nurse10";S.endingId="end_nurse";
title="卒業 ― 保健室の先生／隠しエンディング";
text="卒業式の日、保健室の先生の正体が明かされた。\n\n黒髪は学校での姿。街で出会った金髪の女性こそ、彼女の素顔――そして、藤原りんの義理の姉、藤原千鶴だった。\n\n千鶴が看護の道を選んだのは、遠い親戚にあたる大関和への憧れだった。「明治のナイチンゲール」と呼ばれた黒羽の偉人の生き方に、いつか自分も――そう願い続けた彼女を、この街の保健室が待っていたのだ。\n\n屋上の伝説は、先生にも届いた。夕日の中、差し出された手を握る。\n\n――3年間の、誰も知らないもう一つの物語が、ここから始まる。";
}else if(e.type==="money"){img=heroImgBy(hero("sakura"),"grad");endMem="end_money";S.endingId=endMem;
title="卒業 ― 億万長者エンド";
text="卒業式。屋上に、待つ人はいなかった。\n\nけれど、帰り道に立ち寄った銀行で確認した残高は――"+(S.money||0).toLocaleString()+"円。3年間、放課後のほぼ全てをバイトに捧げた結晶だった。\n\n恋はなかった。だが、金はある。\n\n――10年後、黒羽の商店街に新しい店がオープンした。若きオーナーの名は、"+pName()+"。地元紙は彼をこう呼んだ。「羽田沼から羽ばたいた億万長者」と。";
}else if(e.type==="host"){img=heroImgBy(hero("sakura"),"grad");endMem="end_host";S.endingId=endMem;
title="卒業 ― 将来のホストエンド";
text="卒業式。特定の誰かとは結ばれなかったけれど、この3年間で声をかけ、話し込んだ相手は数えきれない。誰とでもすぐ打ち解けるのが、"+pName()+"の才能だった。\n\n卒業後、東京へ出た彼は、ひょんなことからホストクラブで働き始める。\n\n――数年後。新宿の夜に、その名を知らない者はいなかった。「黒羽から来た星」と呼ばれる、No.1ホストの伝説は、ここから始まった。";
}else if(e.type==="star"){img=heroImgBy(hero("sakura"),"grad");endMem="end_star";S.endingId=endMem;
title="卒業 ― 芸能人エンド";
text="卒業式の数日前。黒羽駅前で、芸能事務所のスカウトに声をかけられた。\n\n「身だしなみへの意識の高さが、素人離れしている」――3年間、欠かさず続けた身だしなみの積み重ねが、卒業間際に思わぬ形で花開いたのだ。\n\n――数年後。テレビのCMで笑うその顔を、黒羽の誰もが見上げることになる。桜丘黒羽学園初の芸能人の物語は、ここから始まった。";
}else if(e.type==="journey"){img=heroImgBy(hero("sakura"),"grad");endMem="end_journey";S.endingId=endMem;
title="卒業 ― 自分探しの旅（バッドエンド）";
text="卒業式。振り返れば、何に打ち込むでもなく、誰と深く関わるでもなく過ぎた3年間だった。\n\n卒業式の翌日。"+pName()+"はリュック1つを背負い、黒羽駅の始発に乗った。行き先は決めていない。――自分探しの旅だ。\n\n何者にもなれなかった春。けれど、旅の先で何者かになれるかどうかは、まだ誰にも分からない。\n\n――この物語の続きは、きっとどこかの町で始まっている。";
}else{S.endingId="end_solo";
title="卒業 ― それぞれの春";
text="卒業式。屋上にも、桜の木の下にも、待つ人はいなかった。\n\nけれど、この3年間は確かに自分のものだった。友達と笑い合って校門を出る。恋だけが青春じゃない。\n\n――"+pName()+"の春は、これから始まる。";
}
unlockMem(endMem);unlockMem("mem_op10");if(typeof __v2Ending==="function")__v2Ending(e);addLog("卒業を迎えた");
$("ending-title").textContent=title;$("ending-img").src=(S&&S.flags&&S.flags.badImg)||img;$("ending-text").textContent=text;
$("ending-stats").innerHTML="<h3 class='mincho' style='margin:6px 0'>📊 最終パラメータ（全21項目）</h3>"+
fullStatsHTML()+
HEROINES.map(h=>'<div class="kv"><span>'+h.name+" 好感度</span><span>"+(S.met[h.id]?S.aff[h.id]:"―（未出会）")+"</span></div>").join("")+
'<div class="kv"><span>デート回数</span><span>'+S.dates+"回</span></div>"+'<div class="kv"><span>集めた思い出</span><span>'+S.memories.length+" / "+ALL_MEMORIES.length+"</span></div>"+
HEROINES.map(h=>'<div class="kv"><span>'+h.name+" 信頼／親密／嫉妬</span><span>"+relOf(h.id).trust+"／"+relOf(h.id).close+"／"+relOf(h.id).jealous+"</span></div>").join("")+'<div class="kv"><span>🏆 実績</span><span>'+S.ach.length+" / "+ACHIEVEMENTS.length+"</span></div>"+'<div class="kv"><span>🌸 周回</span><span>'+META.clears+"周目クリア</span></div>";
chime();show("screen-ending");
}
$("btn-ending-title").onclick=()=>show("screen-title");
$("btn-ending-replay").onclick=()=>{S=null;show("screen-name")};
$("btn-ending-album").onclick=()=>{albumReturn="ending";openAlbum()};
$("btn-to-title").onclick=()=>{resetPlayState();show("screen-title")};
$("btn-sound").onclick=e=>{soundOn=!soundOn;e.target.textContent=soundOn?"🔊 音ON":"🔇 音OFF";
if(!soundOn){if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}adminStopMp3()}
else{beep(660,.1);const cur=bgmName;bgmName=null;setBGM(cur||"daily")}};

/* ================= ADMIN (maintenance) ================= */
let ADMIN={bgm:{},overrides:{},custom:[]};
let __adminNextNo=null,__adminCurNo=null;
const BGM_LABELS={opening:"オープニング（プロローグ）",title:"タイトル",daily:"通常（本編）",daily_spring:"通常・春",daily_summer:"通常・夏",daily_autumn:"通常・秋",daily_winter:"通常・冬",event:"イベント",choice:"選択肢・ドキドキ",date:"デート",sad:"悲しい場面",ending:"エンディング",hokkori:"ほっこりイベント",local:"黒羽の出来事（地元イベント）",kuhi:"句碑めぐり",story:"個別ストーリー",matsuri:"夏祭り",sports:"スポーツ行事",culture:"文化祭",sea:"海・夏",snow:"雪・冬",sakura:"桜",rain:"梅雨・雨",tanabata:"七夕",xmas:"クリスマス",illumination:"イルミネーション",newyear:"初詣・正月",valentine:"バレンタイン",halloween:"ハロウィン",trip:"修学旅行",concert:"コンサート",exam:"テスト・受験",birthday:"誕生日",night:"夜",pool:"プール",summer:"夏休み",rooftop:"屋上",sick:"看病",phone:"電話・メール",memory:"回想"};
const bgmAudio=new Audio();bgmAudio.loop=true;bgmAudio.volume=bgmVolume;
const bgmFailedUrls=new Set();
function adminBgmUrl(name){const u=((ADMIN.bgm||{})[name]||"").trim();return bgmFailedUrls.has(u)?"":u}
function fixBgmPath(v){if(typeof v!=="string")return v;let u=v.trim();u=u.replace(/^assets\/(bgm\/)/i,"$1");u=u.replace(/^assets\/(bgm\d+\.mp3)$/i,"bgm/$1");return u}
function migrateBgmPaths(){if(!ADMIN.bgm)return;let changed=false;Object.keys(ADMIN.bgm).forEach(k=>{const f=fixBgmPath(ADMIN.bgm[k]);if(f!==ADMIN.bgm[k]){ADMIN.bgm[k]=f;changed=true}});if(changed)persistAdmin()}
function adminStopMp3(){try{bgmAudio.pause()}catch(e){}}
const RECOMMENDED_BGM={opening:"bgm/bgm01.mp3",title:"bgm/bgm01.mp3"}; /* v2: BGM wa bgm folder no soutai pass de shitei (full URL demo ka. sono mama audio no src ni hairu) */
function refreshBgmNow(){adminStopMp3();bgmAudio.dataset.track="";const cur=bgmName;bgmName=null;if(cur)setBGM(cur)}
function setBgmVolume(v){bgmVolume=Math.min(1,Math.max(0,+v||0));try{bgmAudio.volume=bgmVolume}catch(e){}lsSet("sakura-memorial-vol-v1",bgmVolume);const l=$("vol-label");if(l)l.textContent=Math.round(bgmVolume*100)+"%"}
function applyBgmSettings(){adminCollectBgm();persistAdmin();refreshBgmNow();toast("BGM設定を反映しました")}
function applyRecommendedBgm(){Object.keys(BGM_LABELS).forEach(k=>{ADMIN.bgm[k]=""});Object.keys(RECOMMENDED_BGM).forEach(k=>{ADMIN.bgm[k]=RECOMMENDED_BGM[k]});persistAdmin();refreshBgmNow();toast("推奨BGMを設定しました（タイトル・名前登録・プロローグ＝bgm/bgm01.mp3）")}
function resetBgmToDefault(){Object.keys(BGM_LABELS).forEach(k=>{ADMIN.bgm[k]=""});persistAdmin();refreshBgmNow();toast("BGMを元（標準の合成BGM）に戻しました")}
function adminPlayMp3(name){
 const u=adminBgmUrl(name);if(!u)return false;
 if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}
 try{
  if(bgmAudio.dataset.track!==u){bgmAudio.src=u;bgmAudio.dataset.track=u}
  if(soundOn&&!bgmBlocked){const pr=bgmAudio.play();if(pr&&pr.catch)pr.catch(()=>{bgmFailedUrls.add(u);toast("BGMファイル「"+u+"」を読み込めなかったため、標準BGMで再生します");bgmAudio.dataset.track="";const cur=bgmName;bgmName=null;if(cur)setBGM(cur)})}
  return true;
 }catch(e){return false}
}
function deriveStoryNo(tag){
 if(!tag)return "ETC-000";
 if(tag.indexOf("プロローグ")>=0)return "P-001";
 let h=0;for(let i=0;i<tag.length;i++){h=(h*31+tag.charCodeAt(i))>>>0}
 return "S-"+String(h%900+100);
}
function updateStoryBadge(){
 const b=$("story-no-badge");if(!b)return;
 const pg=$("page-no-badge");
 if(!__adminCurNo||$("screen-novel").classList.contains("hidden")){b.classList.add("hidden");if(pg&&S&&!$("screen-game").classList.contains("hidden")){pg.textContent="第"+S.turn+"週／全"+TOTAL_TURNS+"週 ・ "+dateLabel(S.turn).text;pg.classList.remove("hidden")}else if(pg)pg.classList.add("hidden");return}
 b.textContent="No."+__adminCurNo+" ・ "+Math.min(novelIdx+1,Math.max(novelQueue.length,1))+"/"+novelQueue.length;
 b.classList.remove("hidden");
 if(pg){pg.textContent="No."+__adminCurNo+" ・ ページ "+Math.min(novelIdx+1,Math.max(novelQueue.length,1))+"/"+novelQueue.length;pg.classList.remove("hidden")}
}
function applyAdminFx(fx){
 if(!fx||!S)return;
 try{
  if(fx.aff)for(const k in fx.aff){if(S.aff[k]!=null)S.aff[k]=clamp(S.aff[k]+(+fx.aff[k]||0))}
  if(fx.rel)for(const k in fx.rel){if(S.aff[k]!=null)addRel(k,fx.rel[k])}
  if(fx.stats)for(const k in fx.stats){if(S.stats[k]!=null)S.stats[k]=clamp(S.stats[k]+(+fx.stats[k]||0))}
  if(fx.skills)for(const k in fx.skills){if(S.skills[k]!=null)S.skills[k]=clamp(S.skills[k]+(+fx.skills[k]||0))}
  if(fx.money)S.money=(S.money||0)+(+fx.money||0);
 }catch(e){}
}
function customStoryEvent(done){
 if(!S||!ADMIN.custom||!ADMIN.custom.length)return false;
 const month=dateLabel(S.turn).month;
 for(const cs of ADMIN.custom){
  if(!cs||!Array.isArray(cs.scenes)||!cs.scenes.length)continue;
  const key="custom_"+(cs.no||cs.title||"x");
  if(cs.once!==false&&S.flags&&S.flags[key])continue;
  if(cs.turn&&S.turn!==+cs.turn)continue;
  if(!cs.turn&&cs.month&&month!==+cs.month)continue;
  if(cs.hero&&cs.minAff!=null&&(!S.met[cs.hero]||S.aff[cs.hero]<+cs.minAff))continue;
  if(S.flags)S.flags[key]=true;
  const scenes=cs.scenes.map(sc=>({hero:sc.hero||cs.hero||undefined,who:sc.who||undefined,variant:sc.variant||undefined,img:sc.img||undefined,sys:!!sc.sys,player:!!sc.player,text:sc.text||"",choices:Array.isArray(sc.choices)?sc.choices.map(c=>({label:c.label||"つぎへ",effect:()=>applyAdminFx(c.fx)})):undefined}));
  scenes.__no=cs.no||"CU-001";
  playNovel(scenes,()=>{applyAdminFx(cs.fx);addLog("カスタムストーリー「"+(cs.title||cs.no||"")+"」");show("screen-game");render();done()},"✒️ "+(cs.title||"カスタムストーリー"));
  return true;
 }
 return false;
}
/* ---- admin UI ---- */
function adminCollectBgm(){document.querySelectorAll("[data-bgm-key]").forEach(inp=>{ADMIN.bgm[inp.dataset.bgmKey]=inp.value.trim()})}
function adminRenderLists(){
 const ov=$("adm-ov-list");
 if(ov){const ks=Object.keys(ADMIN.overrides);ov.innerHTML=ks.length?ks.map(k=>'<div class="kv"><span>No.'+esc(k)+'</span><span>'+esc([ADMIN.overrides[k].img?"絵URL":"",ADMIN.overrides[k].variant?"差分":"",ADMIN.overrides[k].texts?"セリフ":"",ADMIN.overrides[k].fx?"効果":""].filter(Boolean).join("・"))+'</span></div>').join(""):'<div class="kv"><span>上書きなし</span><span>―</span></div>'}
 const cu=$("adm-cu-list");
 if(cu){cu.innerHTML=ADMIN.custom.length?ADMIN.custom.map((c,i)=>'<div class="kv"><span>No.'+esc(c.no||("CU-"+(i+1)))+' '+esc(c.title||"")+'</span><span><button class="btn small" data-cu-del="'+i+'">削除</button></span></div>').join(""):'<div class="kv"><span>カスタムなし</span><span>―</span></div>';
 cu.querySelectorAll("[data-cu-del]").forEach(b=>{b.onclick=()=>{ADMIN.custom.splice(+b.dataset.cuDel,1);persistAdmin();adminRenderLists();toast("カスタムストーリーを削除しました")}})}
}
function openAdmin(){
 const list=$("adm-bgm-list");list.innerHTML="";
 Object.keys(BGM_LABELS).forEach(k=>{
  const row=document.createElement("div");row.className="field";
  const lab=document.createElement("label");lab.textContent=BGM_LABELS[k]+"（"+k+"）";row.appendChild(lab);
  const inp=document.createElement("input");inp.type="text";inp.placeholder="MP3のURL（空欄＝標準の合成BGM）";inp.value=(ADMIN.bgm||{})[k]||"";inp.dataset.bgmKey=k;row.appendChild(inp);
  const btns=document.createElement("div");btns.style.cssText="display:flex;gap:6px;margin-top:6px";
  const t=document.createElement("button");t.className="btn small";t.textContent="▶ 試聴";
  t.onclick=()=>{adminCollectBgm();bgmAudio.dataset.track="";const cur=bgmName;bgmName=null;setBGM(k);toast(adminBgmUrl(k)?"MP3で試聴中です":"標準BGMで試聴中です")};
  const st=document.createElement("button");st.className="btn small ghost";st.textContent="■ 停止";
  st.onclick=()=>{adminStopMp3();bgmAudio.dataset.track="";if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}};
  btns.append(t,st);row.appendChild(btns);list.appendChild(row);
 });
 adminRenderLists();
 $("modal-admin").classList.remove("hidden");
}
function adminParseJson(txt,label){if(!txt||!txt.trim())return undefined;try{return JSON.parse(txt)}catch(e){toast(label+"のJSONが正しくありません");throw e}}
$("adm-ov-save").onclick=()=>{
 const no=$("adm-ov-no").value.trim();if(!no){toast("ストーリーNoを入力してください");return}
 try{
  const ov={};
  const img=$("adm-ov-img").value.trim();if(img)ov.img=img;
  const variant=$("adm-ov-variant").value.trim();if(variant)ov.variant=variant;
  const texts=adminParseJson($("adm-ov-texts").value,"セリフ差替");if(texts)ov.texts=texts;
  const fx=adminParseJson($("adm-ov-fx").value,"効果");if(fx)ov.fx=fx;
  if(!Object.keys(ov).length){toast("上書き内容が空です");return}
  ADMIN.overrides[no]=ov;persistAdmin();adminRenderLists();toast("No."+no+" の上書きを登録しました");
 }catch(e){}
};
$("adm-ov-del").onclick=()=>{const no=$("adm-ov-no").value.trim();if(no&&ADMIN.overrides[no]){delete ADMIN.overrides[no];persistAdmin();adminRenderLists();toast("No."+no+" の上書きを削除しました")}else toast("そのNoの上書きはありません")};
$("adm-cu-template").onclick=()=>{$("adm-cu-json").value=JSON.stringify({no:"CU-001",title:"放課後の約束",turn:20,hero:"sakura",minAff:30,fx:{aff:{sakura:5}},scenes:[{hero:"sakura",variant:"smile",text:"放課後、教室にさくらが戻ってきた。"},{hero:"sakura",variant:"shy",text:"「ねえ、今日は一緒に帰ろう？」",choices:[{label:"「いいよ」",fx:{aff:{sakura:3}}},{label:"「用事がある」",fx:{aff:{sakura:-2}}}]}]},null,1)};
$("adm-cu-json").addEventListener("input",()=>{const st=$("adm-cu-status");if(!st)return;const v=$("adm-cu-json").value.trim();if(!v){st.textContent="";return}try{JSON.parse(v);st.textContent="✅ JSONの形式は正しいです";st.style.color="#2e7d32"}catch(e){st.textContent="⚠️ JSONの形式エラー："+e.message;st.style.color="#c62828"}});
$("adm-cu-add").onclick=()=>{
 try{const cs=JSON.parse($("adm-cu-json").value);if(!cs||!Array.isArray(cs.scenes)||!cs.scenes.length){toast("scenesが空です");return}
  if(!cs.no)cs.no="CU-"+String(ADMIN.custom.length+1).padStart(3,"0");
  ADMIN.custom.push(cs);persistAdmin();adminRenderLists();toast("カスタムストーリー No."+cs.no+" を追加しました");
 }catch(e){toast("カスタムストーリーのJSONが正しくありません")}
};
$("adm-export").onclick=()=>{adminCollectBgm();const data={app:"sakura-memorial-admin",version:1,savedAt:new Date().toISOString(),admin:ADMIN};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sakura-memorial-admin.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("管理データを保存しました")};
$("adm-file").addEventListener("change",e=>{
 const f=e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);const ad=d.admin||d;if(!ad||typeof ad!=="object")throw 0;
  ADMIN={bgm:ad.bgm||{},overrides:ad.overrides||{},custom:Array.isArray(ad.custom)?ad.custom:[]};
  migrateBgmPaths();persistAdmin();adminStopMp3();bgmAudio.dataset.track="";const cur=bgmName;bgmName=null;if(cur)setBGM(cur);
  openAdmin();toast("管理データを読み込みました");
 }catch(err){toast("読み込めない管理データでした")}};
 r.readAsText(f);e.target.value="";
});
$("adm-reset").onclick=()=>{if(!confirm("管理データをすべて初期化しますか？（BGM設定・上書き・カスタムが消えます）"))return;ADMIN={bgm:{},overrides:{},custom:[]};persistAdmin();adminStopMp3();bgmAudio.dataset.track="";const cur=bgmName;bgmName=null;if(cur)setBGM(cur);openAdmin();toast("管理データを初期化しました")};
$("adm-bgm-apply").onclick=()=>{applyBgmSettings()};
$("btn-bgm-recommend").onclick=()=>{applyRecommendedBgm()};
const __vs=$("vol-slider");if(__vs){__vs.value=Math.round(bgmVolume*100);const __vl=$("vol-label");if(__vl)__vl.textContent=Math.round(bgmVolume*100)+"%";__vs.addEventListener("input",e=>setBgmVolume(e.target.value/100))}
$("btn-bgm-default").onclick=()=>{resetBgmToDefault()};
$("adm-bgm-default").onclick=()=>{resetBgmToDefault();openAdmin()};
$("adm-readme-link").onclick=e=>{e.preventDefault();$("modal-admin").classList.add("hidden");showDoc("doc-readme")};
$("adm-close").onclick=()=>{adminCollectBgm();persistAdmin();$("modal-admin").classList.add("hidden");const cur=bgmName;if(cur){bgmName=null;setBGM(cur)}};
$("modal-admin").addEventListener("click",e=>{if(e.target.id==="modal-admin")$("adm-close").onclick()});
$("credit-admin").onclick=()=>openAdmin();

/* ---- debug（⑭） ---- */
function ensureDebugState(){if(!S){S=defaultState("黒羽","白夜","グレイ","4月","love");HEROINES.forEach(h=>{S.met[h.id]=true})}if(S.ended)S.ended=false}
function dbgDone(){if(S&&!S.ended){show("screen-game");render()}else show("screen-title")}
function debugPlayNo(raw){
 const no=(raw||"").trim().toUpperCase();if(!no){toast("ストーリーNoを入力してください");return}
 ensureDebugState();$("modal-admin").classList.add("hidden");
 const done=()=>dbgDone();let m;
 if(no==="P-001"){__adminNextNo="P-001";playNovel(prologueScenes(),done,"🌸 プロローグ");return}
 if(no==="EX-SWAN"){evBlackSwan(done);return}
 if(m=no.match(/^EV-(\d+)$/)){const fn=scheduledMap()[+m[1]];if(!fn){toast("その週の行事はありません");show("screen-game");render();return}__adminNextNo="EV-"+String(+m[1]).padStart(2,"0");fn(done);return}
 if(m=no.match(/^ST-(SAKURA|AKARI|YUKI|RIN)-(\d+)$/)){const hid=m[1].toLowerCase();const ch=(STORY[hid]||[])[+m[2]-1];if(!ch){toast("その章はありません");return}__adminNextNo="ST-"+hid+"-"+m[2];playNovel([{hero:hid,who:"　",text:"――"+hero(hid).name+"の物語「"+ch.title+"」"}].concat(ch.scenes),done,"📖 "+hero(hid).short+"の物語");return}
 if(m=no.match(/^HK-(.+)$/)){const ev=HOKKORI.find(x=>x.id===m[1].toLowerCase());if(!ev){toast("そのほっこりイベントはありません");return}const h=hero(ev.img||"sakura");__adminNextNo="HK-"+ev.id;playNovel([{hero:h.id,who:h.name,variant:"smile",text:"――ほっこりイベント「"+ev.title+"」"},{hero:h.id,who:"　",variant:"smile",text:ev.text.replaceAll("{hero}",h.short)}],done,"♡ ほっこりイベント");return}
 if(m=no.match(/^LC-(.+)$/)){const ev=LOCAL_EVENTS.find(x=>x.id===m[1].toLowerCase());if(!ev){toast("その地域イベントはありません");return}const h=hero(ev.img||"sakura");__adminNextNo="LC-"+ev.id;playNovel([{hero:h.id,who:h.name,variant:"normal",text:"――黒羽の出来事「"+ev.title+"」"},{hero:h.id,who:"　",variant:"smile",text:ev.text.replaceAll("{hero}",h.short)}],done,"🏮 黒羽の出来事");return}
 if(m=no.match(/^KB-(\d+)$/)){S.kuhi=KUHI.slice(0,Math.max(0,+m[1]-1)).map(k=>k.no);kuhiEvent(done,null);return}
 if(m=no.match(/^SC-(.+)$/)){const ev=SECRET_EVENTS.find(x=>x.id===m[1].toLowerCase());if(!ev){toast("そのレアイベントはありません");return}const h=hero(ev.img||"sakura");__adminNextNo="SC-"+ev.id;playNovel([{hero:h.id,who:h.name,variant:"normal",text:"――レアな出会い「"+ev.title+"」"},{hero:h.id,who:"　",variant:"smile",text:ev.text}],done,"✨ レアな出会い");return}
 if(m=no.match(/^CU-(.+)$/)){const cs=(ADMIN.custom||[]).find(c=>(c.no||"").toUpperCase()===no);if(!cs){toast("そのカスタムストーリーはありません");return}const scenes=cs.scenes.map(sc=>({hero:sc.hero||cs.hero||undefined,who:sc.who||undefined,variant:sc.variant||undefined,img:sc.img||undefined,sys:!!sc.sys,player:!!sc.player,text:sc.text||"",choices:Array.isArray(sc.choices)?sc.choices.map(c=>({label:c.label||"つぎへ",effect:()=>applyAdminFx(c.fx)})):undefined}));scenes.__no=cs.no;playNovel(scenes,done,"✒️ "+(cs.title||"カスタムストーリー"));return}
 if(m=no.match(/^N-0([1-5])$/)){
  const n=nurseState();const k=+m[1];
  if(k===1){n.stage=0;n.visits=0;n.saw=0;n.solo=0;nurseTryInjury(done)}
  else if(k===2){n.stage=1;n.visits=0;nurseTryOffice(done)}
  else if(k===3){n.stage=2;n.saw=0;nurseSister(done)}
  else if(k===4){n.stage=3;n.solo=0;nurseSolo(done)}
  else{n.stage=4;n.aff=Math.max(n.aff,50);__nurseEnding()}
  return}
 if(m=no.match(/^E-(\d+)$/)){
  const EM={1:["love","sakura"],2:["love","akari"],3:["love","yuki"],4:["love","rin"],6:["rival"],7:["almost"],8:["friend"],9:["life"],10:["hobby"],11:["friends"],12:["free"],13:["journey"],14:["money"],15:["host"],16:["star"],17:["journey"]};
  if(+m[1]===5){S=defaultState("黒羽","白夜","グレイ","4月","love");HEROINES.forEach(h=>{S.met[h.id]=true});S.turn=TOTAL_TURNS;const nn=nurseState();nn.stage=4;nn.aff=50;$("modal-admin").classList.add("hidden");graduation();return}
  const e=EM[+m[1]];if(!e){toast("そのエンディングはありません");return}
  debugEnding(e[0],e[1]);return}
 if(m=no.match(/^DT-(SAKURA|AKARI|YUKI|RIN)$/)){
  const hid=m[1].toLowerCase();const h=hero(hid);
  S.met[hid]=true;S.aff[hid]=Math.max(S.aff[hid],70);S.money=Math.max(S.money,8000);
  $("modal-admin").classList.add("hidden");show("screen-game");render();gameBusy=true;pickPlace(h);return}
 if(m=no.match(/^VD-(\d+)$/)){
  const cat=window.SAKURA_SPECIAL_VIDEOS||[];const idx=+m[1]-1;
  if(!cat[idx]){toast("その動画はありません");return}
  videoDisplay=cat.map(v=>[v[1],v[0]+"　"+v[2]]);
  $("modal-admin").classList.add("hidden");playSpecialAt(idx);return}
 toast("対応していない形式のNoです");
}
$("adm-dbg-play").onclick=()=>debugPlayNo($("adm-dbg-no").value);
$("adm-dbg-goto").onclick=()=>{if(!S){toast("プレイ中ではありません");return}const t=Math.max(1,Math.min(TOTAL_TURNS,+$("adm-dbg-turn").value||1));S.turn=t;$("modal-admin").classList.add("hidden");show("screen-game");render();toast("第"+t+"週（"+dateLabel(t).text+"）へ移動しました")};
function debugEnding(kind,heroId){
 S=defaultState("黒羽","白夜","グレイ","4月","love");HEROINES.forEach(h=>{S.met[h.id]=true});S.turn=TOTAL_TURNS;
 const top=heroId||"sakura";
 if(kind==="love"){S.aff[top]=92;S.stats[hero(top).stat]=70;const r=relOf(top);r.trust=65;r.close=65;r.jealous=0;S.hurt[top]=0}
 else if(kind==="almost"){S.aff[top]=68}
 else if(kind==="rival"){S.aff[top]=76;relOf(top).trust=30;S.flags.rival=true}
 else if(kind==="friend"){HEROINES.forEach(h=>S.aff[h.id]=45);relOf(top).close=65;S.stats.shakou=55}
 else if(kind==="life"){HEROINES.forEach(h=>S.aff[h.id]=10);S.stats.gakuryoku=78}
 else if(kind==="money"){HEROINES.forEach(h=>S.aff[h.id]=10);S.money=260000}
 else if(kind==="host"){HEROINES.forEach(h=>S.aff[h.id]=10);S.flags.talk=45}
 else if(kind==="star"){HEROINES.forEach(h=>S.aff[h.id]=10);S.stats.miryoku=90}
 else if(kind==="journey"){HEROINES.forEach(h=>S.aff[h.id]=10)}
 else if(kind==="hobby"){HEROINES.forEach(h=>S.aff[h.id]=10);S.stats.geijutsu=80}
 else if(kind==="friends"){HEROINES.forEach(h=>S.aff[h.id]=10);S.stats.shakou=75}
 else if(kind==="free"){HEROINES.forEach(h=>S.aff[h.id]=10);["gakuryoku","undou","miryoku","geijutsu","shakou"].forEach(k=>{if(S.stats[k]!=null)S.stats[k]=55})}
 $("modal-admin").classList.add("hidden");graduation();
}
document.querySelectorAll("[data-dbg-end]").forEach(b=>{b.onclick=()=>{if(!confirm("エンディング確認用の仮の状態で上書きします。現在のプレイは失われますが、よろしいですか？"))return;debugEnding(b.dataset.dbgEnd)}});




/* ================= SAVE / LOAD ================= */
let modalMode="save";
function openModal(mode){
 modalMode=mode;$("modal-title").textContent=mode==="save"?"💾 セーブ":"📂 ロード";
 renderSlots();$("modal-save").classList.remove("hidden");
}
function slotMeta(s){
 if(!s)return "（空き）";
 const d=dateLabel(s.turn);
 return esc(s.last)+" "+esc(s.first)+"／"+d.text+"／思い出 "+s.memories.length+"件";
}
function renderSlots(){
 $("slot-list").innerHTML="";
 slots.forEach((s,i)=>{
  const div=document.createElement("div");div.className="slot";
  div.innerHTML='<div><div class="ttl">スロット '+(i+1)+'</div><div class="meta">'+slotMeta(s)+'</div></div>';
  const btns=document.createElement("div");btns.className="slot-btns";
  if(modalMode==="save"){
   const b1=document.createElement("button");b1.className="btn small primary";b1.textContent=S?"ここにセーブ":"セーブ不可";b1.disabled=!S;
   b1.onclick=()=>{slots[i]=JSON.parse(JSON.stringify(S));if(persistSlots()){renderSlots();toast("スロット"+(i+1)+"にセーブしました")}else{toast("⚠️ セーブに失敗しました（ブラウザの保存容量不足の可能性があります）。ファイル書き出しもお試しください")}beep(784,.12)};
   const b2=document.createElement("button");b2.className="btn small";b2.textContent="📄 ファイルに保存";b2.disabled=!S;
   b2.onclick=()=>downloadSave(S,i+1);
   btns.append(b1,b2);
  }else{
   const b1=document.createElement("button");b1.className="btn small primary";b1.textContent="ロードする";b1.disabled=!s;
   b1.onclick=()=>{loadState(slots[i])};
   btns.append(b1);
   if(s){const b2=document.createElement("button");b2.className="btn small";b2.textContent="📄 ファイルに保存";b2.onclick=()=>downloadSave(s,i+1);btns.append(b2)}
  }
  if(s){const bd=document.createElement("button");bd.className="btn small";bd.textContent="🗑 削除";bd.onclick=()=>{if(!confirm("スロット"+(i+1)+"のセーブを削除しますか？"))return;slots[i]=null;persistSlots();renderSlots();toast("スロット"+(i+1)+"を削除しました")};btns.append(bd)}
  div.appendChild(btns);$("slot-list").appendChild(div);
 });
}
function downloadSave(state,slotNo){
 const data={app:"sakura-memorial",version:1,savedAt:new Date().toISOString(),state};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);
 a.download="sakura-memorial-save"+(slotNo||"")+"-"+state.last+state.first+".json";a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("セーブファイルを保存しました");
}
function resetPlayState(){try{gameBusy=false;igActive=false;igQueue=[];igDone=null;novelQueue=[];novelDone=null;const b=$("story-no-badge");if(b)b.classList.add("hidden")}catch(e){}}
function loadState(state){
 resetPlayState();
 S=migrateState(JSON.parse(JSON.stringify(state)));
 S.memories.forEach(id=>albumUnlocked.add(id));persistAlbum();if(S.clears&&S.clears>META.clears){META.clears=S.clears;persistMeta()}
 $("modal-save").classList.add("hidden");chime();
 if(S.ended){graduation();return}
 show("screen-game");render();setStage("sakura","　","セーブデータを読み込んだ。"+dateLabel(S.turn).text+"から再開！","📂 ロード完了");
 toast("ロードしました："+pName());
}
$("file-load").addEventListener("change",e=>{
 const f=e.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(d.app!=="sakura-memorial"||!d.state)throw 0;loadState(d.state)}catch(err){toast("読み込めないファイルでした")}};
 r.readAsText(f);e.target.value="";
});
$("btn-save-open").onclick=()=>openModal("save");
$("btn-load-open").onclick=()=>openModal("load");
$("btn-continue").onclick=()=>{albumReturn="title";openModal("load")};
$("modal-close").onclick=()=>$("modal-save").classList.add("hidden");
$("modal-save").addEventListener("click",e=>{if(e.target.id==="modal-save")$("modal-save").classList.add("hidden")});
restorePersisted();migrateBgmPaths();

/* ================= ALBUM ================= */
function openAlbum(){
 albumTab="none";show("screen-album");renderAlbum();renderBgmAlbum();renderVideoList();setAlbumTab("none");
}
function renderAlbumGrid(){
 $("album-grid").innerHTML="";
 ALL_MEMORIES.forEach(m=>{
  const un=albumUnlocked.has(m.id)||(m.secret&&["end_sakura","end_akari","end_yuki","end_rin"].every(id=>albumUnlocked.has(id)));const h=hero(m.hero);const mImg=albumImgOf(m);
  const b=document.createElement("button");b.className="mem"+(un?"":" locked")+((!un&&m.tag==="エンディング")?" end-locked":"")+((!un&&m.secret)?" secret-locked":"");
  b.innerHTML=(!un&&m.secret)?'<div class="mem-secret">？</div><div class="pad"><span class="tag">隠し</span><div class="t">？？？</div><div class="d">まだ集まっていない思い出</div></div>':'<img src="'+mImg+'" alt=""><div class="pad"><span class="tag '+(m.tag==="ほっこり"?"hokkori":m.tag==="エンディング"?"ending":"")+'">'+m.tag+'</span><div class="t">'+(un?m.title:"？？？")+'</div><div class="d">'+(un?m.date+"／"+h.name:"まだ集まっていない思い出")+'</div></div>';
  b.onclick=()=>{if(!un){toast("まだ集まっていない思い出です");return}
   $("album-detail").classList.remove("hidden");
   $("detail-tag").textContent=m.tag+"｜"+m.date;$("detail-title").textContent=m.title;
   $("detail-img").src=mImg;const __pq2=placeOf(mImg);const __dm=$("detail-map");if(__dm){__dm.classList.toggle("hidden",!__pq2);__dm.setAttribute("data-q",__pq2||"")}$("detail-text").textContent=m.text+(m.cond?"\n\n【解放条件】"+m.cond:"");
   $("album-detail").scrollIntoView({behavior:"smooth",block:"nearest"});beep(700,.08)};
  $("album-grid").appendChild(b);
 });
}
function renderAlbum(){
 const total=ALL_MEMORIES.length,got=ALL_MEMORIES.filter(m=>albumUnlocked.has(m.id)).length;
 $("album-prog").textContent="収集中 "+got+" / "+total+"（コンプリート率 "+Math.round(got/total*100)+"%）";
 const achBox=$("album-ach");
 if(achBox){const myAch=new Set([].concat(S?S.ach:[],Array.from(META.ach)));const ends=Array.from(META.endings);
 achBox.classList.remove("hidden");
 achBox.innerHTML="<h3 class='mincho' style='margin:0 0 8px'>🏆 実績 "+myAch.size+" / "+ACHIEVEMENTS.length+" ・ 🌸 "+META.clears+"周クリア</h3>"+
  ACHIEVEMENTS.map(a=>'<div class="kv"><span>'+(myAch.has(a.id)?"✅ ":"🔒 ")+a.name+"</span><span>"+a.desc+"</span></div>").join("")+
  "<h3 class='mincho' style='margin:12px 0 8px'>🎓 到達エンディング "+ends.length+"種</h3>"+
  (ends.length?ends.map(k=>'<div class="kv"><span>'+(ENDING_LABELS[k]||k)+"</span><span>到達済み</span></div>").join(""):'<div class="kv"><span>まだ卒業していない</span><span>―</span></div>');
 achBox.innerHTML+="<h3 class='mincho' style='margin:14px 0 8px'>🏮 黒羽めぐり "+kurobaneCount()+" / "+KUROBANE_SPOTS.length+" か所</h3>"+KUROBANE_SPOTS.map(sp=>'<div class="kv"><span>'+(S&&S.spots&&S.spots[sp.id]?"✅ ":"🔒 ")+sp.name+'</span><span>'+(S&&S.spots&&S.spots[sp.id]?"訪問済み":"まだ")+'</span></div>').join("");
 }
 const sum=$("album-summary");
 if(S&&S.ended){
  sum.classList.remove("hidden");
  sum.innerHTML="<h3 class='mincho' style='margin:0 0 8px'>🎓 卒業アルバム ― "+esc(pName())+" の3年間</h3>"+
   fullStatsHTML()+
   HEROINES.map(h=>'<div class="kv"><span>'+h.name+'</span><span>'+(S.met[h.id]?"好感度 "+S.aff[h.id]+"（"+affState(S.aff[h.id])+"）":"出会わなかった")+"</span></div>").join("")+
   '<div class="kv"><span>デート</span><span>'+S.dates+'回</span></div><div class="kv"><span>思い出</span><span>'+got+" / "+total+"</span></div>"+
   "<p style='font-weight:500;line-height:1.9'>入学の日の桜から、卒業の日の桜まで。下のカードをタップすると、あの日の場面をもう一度読めます。</p>";
 }else sum.classList.add("hidden");
 if(albumTab==="pic")renderAlbumGrid();
 /* perfect tokuten (v2 tougou) */
 if(["end_sakura","end_akari","end_yuki","end_rin"].every(id=>albumUnlocked.has(id))){["mem_perfect01","mem_perfect02","mem_perfect03","mem_perfect04"].forEach(id=>{if(!albumUnlocked.has(id)){albumUnlocked.add(id);persistAlbum()}})}
}
$("detail-close").onclick=()=>$("album-detail").classList.add("hidden");

/* ================= LOADING & OPENING（①⑧） ================= */
const OP_MAX=10;
let opImages=[],opTimer=null,opIdx=0,opFront="a",openingActive=false;
function stopOpening(){if(opTimer){clearInterval(opTimer);opTimer=null}openingActive=false;try{bgmAudio.pause()}catch(e){}bgmAudio.onended=null;bgmAudio.loop=true;bgmAudio.dataset.track="";bgmName=null}
function goTitle(){resetPlayState();stopOpening();show("screen-title")}
function startOpening(){
 show("screen-opening");openingActive=true;
 const A=$("op-img-a"),B=$("op-img-b");opIdx=0;opFront="a";
 A.classList.remove("hidden-op");B.classList.add("hidden-op");
 /* v2 fix: 先読み結果が空でも、固定のURL一覧でスライドショーを試みる（読み込めない画像は隠す） */
 const slides=opImages.length?opImages:Array.from({length:OP_MAX},(_,i)=>"assets/op"+String(i+1).padStart(2,"0")+".webp");
 A.onerror=()=>A.classList.add("hidden-op");B.onerror=()=>B.classList.add("hidden-op");
 if(slides.length){A.src=slides[0];
  if(slides.length>1){opTimer=setInterval(()=>{opIdx=(opIdx+1)%slides.length;const showEl=opFront==="a"?B:A,hideEl=opFront==="a"?A:B;showEl.src=slides[opIdx];showEl.classList.remove("hidden-op");hideEl.classList.add("hidden-op");opFront=opFront==="a"?"b":"a"},4200)}
 }else{A.removeAttribute("src");B.removeAttribute("src")}
 const url=(window.__MUSIC_BLOB_URL&&(adminBgmUrl("opening")||adminBgmUrl("title")||"bgm/bgm01.mp3")===window.__MUSIC_SRC_URL)?window.__MUSIC_BLOB_URL:(adminBgmUrl("opening")||adminBgmUrl("title")||"bgm/bgm01.mp3"); /* v2 fix: 全量DL済みの音楽があればそれを使う */
 if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}
 bgmName="opening";markBgmHeard("opening");
 try{bgmAudio.loop=false;bgmAudio.src=url;bgmAudio.dataset.track="opening";
  bgmAudio.onended=()=>{if(openingActive)goTitle()};
  bgmAudio.onerror=()=>{if(openingActive&&!opImages.length)goTitle()};
  const pr=bgmAudio.play();if(pr&&pr.catch)pr.catch(()=>{});
 }catch(e){}
}
$("btn-op-title").onclick=()=>{beep(660,.08);goTitle()};
$("btn-to-title2").onclick=()=>{beep(660,.08);goTitle()};
$("btn-opening").onclick=()=>{beep(784,.1);startOpening()};
if($("btn-opening-title"))$("btn-opening-title").onclick=()=>{beep(784,.1);startOpening()};
async function hardRefresh(){
 /* 2.43 強化版：ページ遷移だけではCDN/ブラウザのキャッシュを抜けられない事があるため、
    まず index と css/js を「キャッシュ無効」で取り直して最新を確定させてから遷移する */
 const bust="r="+Date.now();
 try{
  const base=location.href.split("?")[0].split("#")[0];
  const res=await fetch(base+"?"+bust,{cache:"no-store"});
  const html=await res.text();
  const subs=[...html.matchAll(/(style\.css|data\.js|story\.js|engine\.js)\?b=([0-9]+)/g)];
  await Promise.all(subs.map(x=>fetch(x[1]+"?b="+x[2],{cache:"no-store"}).catch(()=>{})));
 }catch(e){}
 try{if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){}
 try{const u=new URL(location.href);u.searchParams.set("r",String(Date.now()));location.replace(u.toString())}catch(e){location.reload()}
}
if($("btn-refresh"))$("btn-refresh").onclick=()=>{hardRefresh()};
if($("btn-refresh-loading"))$("btn-refresh-loading").onclick=()=>{hardRefresh()};
const BGM_ALBUM_LIST=[["opening","オープニング","プロローグ","assets/op01.webp"],["title","タイトル","タイトル画面","assets/op10.webp"],["daily","通常（原曲）","本編の通常週（季節で下の4曲に変化）","assets/op16.webp"],["daily_spring","通常・春","春（3〜5月）のメイン画面","assets/sakura-smile.webp"],["daily_summer","通常・夏","夏（6〜8月）のメイン画面","assets/akari-sea.webp"],["daily_autumn","通常・秋","秋（9〜11月）のメイン画面","assets/op08.webp"],["daily_winter","通常・冬","冬（12〜2月）のメイン画面","assets/rin-winter.webp"],["event","イベント","行事などのイベント全般","assets/op22.webp"],["choice","選択肢・ドキドキ","選択肢・やきもち・秘密の場面","assets/rin.webp"],["date","デート","デート・お部屋デート","assets/sakura-date.webp"],["sad","悲しい場面","病気・別れの場面","assets/yuki-sick.webp"],["ending","エンディング","卒業・告白の場面","assets/sakura-ending.webp"],["hokkori","ほっこり","ほっこりイベント","assets/akari-smile.webp"],["local","黒羽の出来事","地域イベント","assets/basho-yakata.webp"],["kuhi","句碑めぐり","芭蕉の句碑めぐり","assets/kuhi01.webp"],["story","個別ストーリー","ヒロインの物語（章）","assets/yuki.webp"],["matsuri","夏祭り","夏祭り・花火大会・線香花火","assets/sakura-yukata.webp"],["sports","スポーツ行事","体育祭・球技大会・マラソン","assets/akari-gym.webp"],["culture","文化祭","文化祭と準備・片付け","assets/rin-gyouji.webp"],["sea","海・夏","海の一日","assets/sakura-sea.webp"],["snow","雪・冬","スキー合宿・雪の日","assets/akari-ski.webp"],["sakura","桜","伝説の桜の下で","assets/sakura-shy.webp"],["rain","梅雨・雨","梅雨の図書室","assets/yuki-smile.webp"],["tanabata","七夕","七夕","assets/rin-planet.webp"],["xmas","クリスマス","クリスマス","assets/sakura-winter.webp"],["illumination","イルミネーション","冬のイルミネーション","assets/rin-date.webp"],["newyear","初詣・正月","初詣・合格お守り","assets/yuki-yukata.webp"],["valentine","バレンタイン","バレンタイン・ホワイトデー・チョコ作り","assets/rin-shy.webp"],["halloween","ハロウィン","ハロウィン","assets/op20.webp"],["trip","修学旅行","修学旅行とその準備","assets/op18.webp"],["concert","コンサート","秋の音楽室コンサート","assets/rin-club.webp"],["exam","テスト・受験","期末テスト・勉強会","assets/sakura-gyouji.webp"],["birthday","誕生日","ヒロインの誕生日","assets/akari-date.webp"],["night","夜","夏休みの夜の電話・水族館の夜・プラネタリウム","assets/akari-planet.webp"],["pool","プール","水泳大会・プール","assets/akari-club.webp"],["summer","夏休み","夏休みの計画","assets/op06.webp"],["rooftop","屋上","屋上の伝説・卒業前日の屋上","assets/rin-grad.webp"],["sick","看病","看病の場面","assets/rin-sick.webp"],["phone","電話・メール","電話・メールの場面","assets/akari.webp"],["memory","回想","回想アルバムを開いている時","assets/op21.webp"]];
function bgmStopAll(){if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}bgmName=null;try{adminStopMp3()}catch(e){}}
function renderBgmAlbum(){
 const list=$("album-bgm-list");if(!list)return;
 const cnt=$("album-bgm-count");if(cnt)cnt.textContent="（解放 "+BGM_ALBUM_LIST.filter(function(t){return bgmHeardSet.has(t[0])}).length+" / "+BGM_ALBUM_LIST.length+"）";
 list.innerHTML=BGM_ALBUM_LIST.map(function(t){
  const heard=bgmHeardSet.has(t[0]);
  const img='<img src="'+t[3]+'" loading="lazy" onerror="this.style.visibility=\'hidden\'" style="width:64px;height:48px;object-fit:cover;border-radius:8px;flex:none'+(heard?'':' ;filter:grayscale(1);opacity:.45')+'">';
  const btn=heard?'<button class="btn small" data-bgm-play="'+t[0]+'">▶</button>':'<button class="btn small" disabled style="opacity:.55">🔒</button>';
  const note=heard?t[2]:'🔒 ゲームの中で流れると解放されます';
  return '<div style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #f3b8cc;border-radius:10px;padding:8px;margin:6px 0">'+img+btn+'<div><div style="font-weight:700">'+t[1]+'</div><div style="font-size:12px;color:var(--muted)">'+note+'</div></div></div>';
 }).join("");
 list.querySelectorAll("[data-bgm-play]").forEach(function(b){b.onclick=function(){setBGM(b.getAttribute("data-bgm-play"))}});
}
renderBgmAlbum();;
if($("btn-album-bgm-stop"))$("btn-album-bgm-stop").onclick=()=>{bgmStopAll()};
function bootLoading(){
 const base=["assets/sakura.webp","assets/akari.webp","assets/yuki.webp","assets/rin.webp"];
 const variants=["assets/sakura-smile.webp","assets/sakura-shy.webp","assets/sakura-date.webp","assets/sakura-yukata.webp","assets/sakura-gyouji.webp","assets/sakura-club.webp","assets/sakura-winter.webp","assets/sakura-ski.webp","assets/sakura-sick.webp","assets/sakura-planet.webp","assets/sakura-grad.webp","assets/sakura-ending.webp","assets/akari-smile.webp","assets/akari-shy.webp","assets/akari-date.webp","assets/akari-yukata.webp","assets/akari-gyouji.webp","assets/akari-club.webp","assets/akari-winter.webp","assets/akari-ski.webp","assets/akari-grad.webp","assets/akari-ending.webp","assets/yuki-smile.webp","assets/yuki-shy.webp","assets/yuki-date.webp","assets/yuki-yukata.webp","assets/yuki-gyouji.webp","assets/yuki-club.webp","assets/yuki-winter.webp","assets/yuki-grad.webp","assets/yuki-ending.webp","assets/rin-smile.webp","assets/rin-shy.webp","assets/rin-date.webp","assets/rin-yukata.webp","assets/rin-gyouji.webp","assets/rin-club.webp","assets/rin-winter.webp","assets/rin-grad.webp","assets/rin-ending.webp","assets/sakura-gym.webp","assets/akari-gym.webp","assets/yuki-gym.webp","assets/rin-gym.webp","assets/akari-planet.webp","assets/yuki-planet.webp","assets/rin-planet.webp","assets/yuki-ski.webp","assets/sakura-sea.webp","assets/akari-sick.webp","assets/akari-sea.webp","assets/yuki-sick.webp","assets/yuki-sea.webp","assets/rin-ski.webp","assets/rin-sick.webp","assets/rin-sea.webp"];
 const withTimeout=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(null),ms))]);
 const imgTask=src=>withTimeout(new Promise(res=>{const im=new Image();im.onload=()=>res(src);im.onerror=()=>res(null);im.src=src}),9000);
 const opSrcs=[];for(let i=1;i<=OP_MAX;i++)opSrcs.push("assets/op"+String(i).padStart(2,"0")+".webp");
 const opTasks=opSrcs.map(imgTask);
 const baseTasks=base.map(imgTask);
 /* v2 fix: オープニング音楽を最優先で「全量」ダウンロードし、終わるまで選択画面を出さない。
    残りの画像は選択画面の後ろで読み込む（第2段階）。 */
 const musicUrl=(typeof adminBgmUrl==="function"&&(adminBgmUrl("opening")||adminBgmUrl("title")))||"bgm/bgm01.mp3";
 const phase1Units=1+opSrcs.length+base.length;
 let doneUnits=0,musicFrac=0;
 const upd=()=>{const cur=Math.min(phase1Units,doneUnits+musicFrac);const pct=Math.min(100,Math.round(cur/phase1Units*100));const f=$("load-bar-fill"),t=$("load-pct");if(f)f.style.width=pct+"%";if(t)t.textContent=pct+"%（音楽＋基本画像 "+Math.floor(cur)+" / "+phase1Units+"）"};
 const musicTask=(async()=>{
  try{
   const r=await fetch(musicUrl);
   if(!r.ok)throw new Error("http "+r.status);
   const total=parseInt(r.headers.get("Content-Length")||"0",10);
   const reader=r.body.getReader();const chunks=[];let got=0;
   for(;;){const d=await reader.read();if(d.done)break;chunks.push(d.value);got+=d.value.length;if(total>0){musicFrac=Math.min(1,got/total);upd()}}
   const blob=new Blob(chunks,{type:"audio/mpeg"});
   window.__MUSIC_SRC_URL=musicUrl;window.__MUSIC_BLOB_URL=URL.createObjectURL(blob);
  }catch(e){
   /* file:// 等 fetch できない環境では Audio の先読み完了を待つ（最大60秒） */
   await withTimeout(new Promise(res=>{const a=new Audio();a.preload="auto";a.oncanplaythrough=()=>res(1);a.onerror=()=>res(0);a.src=musicUrl}),60000);
  }
  musicFrac=1;upd();
 })();
 [...opTasks,...baseTasks].forEach(pr=>pr.then(()=>{doneUnits++;upd()}));
 upd();
 Promise.all(opTasks).then(r=>{opImages=r.filter(Boolean)});
 Promise.all([musicTask,...opTasks,...baseTasks]).then(()=>{
  const n=$("load-now");if(n)n.textContent="ローディング完了（残りの画像は裏で読み込みます）";
  const c=$("load-choice");if(c)c.classList.remove("hidden");
  try{const __pp=new URLSearchParams(location.search).get("play");if(__pp)setTimeout(()=>{try{debugPlayNo(__pp)}catch(e){}},60)}catch(e){}
  variants.forEach(src=>{const im=new Image();im.src=src});
  const bgmUrls=new Set();Object.keys(ADMIN.bgm||{}).forEach(k=>{const u=(ADMIN.bgm[k]||"").trim();if(u&&u!==musicUrl)bgmUrls.add(u)});
  bgmUrls.forEach(u=>{const a=new Audio();a.preload="auto";a.src=u});
 });
}
if(!window.__SAKURA_BOOT){window.__SAKURA_BOOT=true;bootLoading()}
$("btn-album-title").onclick=()=>{albumReturn="title";openAlbum()};
/* 2.37 ミニゲームコーナー（minigamesフォルダの独立HTMLをそのまま再生） */
const MINIGAMES=[
 {file:"quiz.html",name:"期末テストクイズ",desc:"4択クイズ・黒羽のご当地問題つき"},
 {file:"memory.html",name:"図書室の神経衰弱",desc:"本のペア合わせ・ゆきと対戦もできる"},
 {file:"takoyaki.html",name:"文化祭たこ焼き屋",desc:"注文をさばく出店ゲーム（60秒）"},
 {file:"recipe.html",name:"調理実習・手順おぼえ",desc:"光る順番を覚える記憶ゲーム"},
 {file:"karuta.html",name:"かるた読上ゲーム",desc:"百人一首・上の句を聞いて札を取る"},
 {file:"dot-battle.html",name:"ドットモンスターバトル",desc:"ターン制のモンスターバトル"},
 {file:"pachislot.html",name:"ドットパチスロ",desc:"メダルで運試し"},
 {file:"block.html",name:"ドットブロック崩し",desc:"定番のブロック崩し"},
 {file:"invader.html",name:"ドットインベーダー",desc:"迫るインベーダーを撃ち落とす"},
 {file:"barrel.html",name:"ドットバレルクライム",desc:"樽をよけて頂上の猫を助ける"},
 {file:"platformer.html",name:"ミニプラットフォーマー",desc:"3ステージの横スクロール"},
 {file:"fighter.html",name:"ミニ格闘",desc:"CPUと対戦する格闘ゲーム"},
 {file:"yusha.html",name:"ドットゆうしゃの冒険",desc:"村・野原・洞窟の小さなRPG"},
 {file:"kiri-no-yakata.html",name:"霧の館",desc:"ドット絵サウンドノベル"},
 {file:"boys/index.html",name:"いつも隣にいた君",desc:"ボーイズラブ長編ノベル（48ターン・5エンディング）"}
];
const MINITOOLS=[
 {file:"voice-to-text.html",name:"音声文字変換",desc:"話した言葉をそのまま文字にする"},
 {file:"ground-golf.html",name:"グラウンドゴルフ記録",desc:"スコア記録・集計"}
];
function openMinigames(){
 const list=$("minigame-list");list.innerHTML="";
 const addItem=(g,icon)=>{
  const b=document.createElement("button");b.className="btn";b.style.width="100%";b.style.margin="0 0 8px";b.style.textAlign="left";
  b.innerHTML=icon+" "+g.name+"<span style='display:block;font-size:12px;color:var(--muted);font-weight:700'>"+g.desc+"</span>";
  b.onclick=()=>{beep(700,.08);openMiniGame(g)};
  list.appendChild(b);
 };
 MINIGAMES.forEach(g=>addItem(g,"🎮"));
 const hd=document.createElement("h4");hd.className="mincho";hd.style.margin="14px 0 8px";hd.textContent="🧰 お道具";list.appendChild(hd);
 MINITOOLS.forEach(g=>addItem(g,"🧰"));
 $("modal-minigames").classList.remove("hidden");
}
function openMiniGame(g){
 $("modal-minigames").classList.add("hidden");
 $("mg-title").textContent="🎮 "+g.name;
 $("mg-frame").src="minigames/"+g.file;
 $("mg-overlay").classList.remove("hidden");
}
function closeMiniGame(){
 $("mg-frame").src="about:blank";
 $("mg-overlay").classList.add("hidden");
}
$("btn-minigames").onclick=()=>{beep(660,.08);openMinigames()};
$("btn-minigames-close").onclick=()=>$("modal-minigames").classList.add("hidden");
$("btn-mg-close").onclick=()=>{beep(520,.07);closeMiniGame()};
$("btn-album-game").onclick=()=>{albumReturn="game";openAlbum()};
$("btn-album-back").onclick=()=>{
 if(albumReturn==="game"&&S&&!S.ended)show("screen-game");
 else if(albumReturn==="ending"&&S&&S.ended)show("screen-ending");
 else show("screen-title");
};


/* ================= v2 追加エンジン（engine.js 追記分） ================= */
if(!window.__SAKURA_V2){window.__SAKURA_V2=true;
/* 隠しエンディングのラベル */
ENDING_LABELS.nurse="保健室の先生エンド";
/* アルバム画像の解決：専用画像（img）があればそれを、無ければヒロイン差分を使う */
function albumImgOf(m){return m.img?m.img:heroImgBy(hero(m.hero),m.variant)}
window.albumImgOf=albumImgOf;
/* ===== BGM二重再生防止ガード =====
   - MP3再生は土台の単一 Audio インスタンス（bgmAudio）だけを使う
   - MP3を鳴らす前に、合成BGMタイマーを必ず止める
   - 合成BGMが鳴っている間は bgmAudio を止める（setBGM 側でも実施済み。二重の安全策） */
if(typeof adminPlayMp3==="function"){
 const __adminPlayMp3Orig=adminPlayMp3;
 adminPlayMp3=function(name){
   if(bgmTimer){clearTimeout(bgmTimer);bgmTimer=null}
   try{bgmAudio.pause()}catch(e){}
   return __adminPlayMp3Orig(name);
 };
}
/* ===== ⑳ 演出：ノベルの最初のヒロイン場面にスライドインを自動付与 ===== */
if(typeof playNovel==="function"){
const __playNovelOrig=playNovel;
playNovel=function(scenes,done,tag){
if(Array.isArray(scenes)){let seen=false;
scenes.forEach(sc=>{if(sc&&sc.hero&&!sc.motion&&!seen){sc.motion="slide";seen=true}});
}
/* v2 fix: プレイ中（ゲーム画面表示中）のイベントは、画面を切り替えずゲーム画面の中で再生する */
if(window.__igRouteOk&&S&&$("screen-game")&&!$("screen-game").classList.contains("hidden")){playNovelInGame(scenes,done,tag);return}
return __playNovelOrig(scenes,done,tag);
};
}
/* ===== ゲーム画面内ノベル再生（サイズを変えず、その場でイベントを進める） ===== */
let igQueue=[],igIdx=0,igDone=null,igActive=false;
function playNovelInGame(scenes,done,tag){
const no=scenes.__no||__adminNextNo||deriveStoryNo(tag);__adminNextNo=null;__adminCurNo=no;
const ov=ADMIN.overrides[no];let scs=scenes;
if(ov){scs=scenes.map((sc,i)=>{const c=Object.assign({},sc);if(ov.img)c.img=ov.img;if(ov.variant&&c.hero)c.variant=ov.variant;if(ov.texts&&ov.texts[i]!=null)c.text=ov.texts[i];return c})}
scs=applyOpImg(scs,no);
igQueue=scs;igIdx=0;igDone=done||null;igActive=true;const __sk=$("game-skip");if(__sk)__sk.classList.remove("hidden");
if(ov&&ov.fx){const d0=igDone;igDone=()=>{applyAdminFx(ov.fx);if(d0)d0()}}
setImgPattern(tag);$("game-tag").textContent=tag||"物語";igTag=tag||"";const __fh=(scs.find(function(x){return x&&x.hero})||{}).hero||null;igVideoFile=videoForNovel(igTag,__fh);const __gv=$("game-video");if(__gv)__gv.classList.toggle("hidden",!igVideoFile);const __gsp=$("game-speak");if(__gsp)__gsp.classList.remove("hidden");const __gsr=$("game-speak-rate");if(__gsr)__gsr.classList.remove("hidden");const __gkb=$("game-kb");if(__gkb)__gkb.classList.remove("hidden");setBGM(bgmForNovel(tag));renderNovelInGame();scheduleAutoVideo();
}
function renderNovelInGame(){
stopSpeak();
const sc=igQueue[igIdx];if(!sc){finishNovelInGame();return}
igPlaceQuery=(sc&&sc.img)?placeOf(sc.img):null;const __gm=$("game-map");if(__gm)__gm.classList.toggle("hidden",!igPlaceQuery);
const h=sc.hero?hero(sc.hero):null;
if(sc.img){$("game-img").src=sc.img;lastStageSrc=sc.img;$("game-img-chip").classList.add("hidden")}
else if(h){applyStageImg($("game-img"),$("game-img-chip"),h.id,pickVariant(h.id,sc.variant))}
else{$("game-img").src="assets/sakura.webp";lastStageSrc="assets/sakura.webp";$("game-img-chip").classList.add("hidden")}
const gi=$("game-img");gi.classList.remove("motion-slide","motion-shake","motion-jump");if(sc.motion){void gi.offsetWidth;gi.classList.add("motion-"+sc.motion)}
applyImgMotion(gi);
const whoTxt=sc.sys?"":sc.player?pName():(sc.who||(h?h.name:"　"));
$("game-who").textContent=whoTxt;$("game-who").className="who"+(sc.sys?" sys":sc.player?" player":"");
autoSpeak("game",igIdx,sc,h);typeText($("game-text"),(sc.text||"").replaceAll("{call}",S?pCall(h?h.id:null):"君").replaceAll("{nick}",S?(S.nick||S.first):"白夜").replaceAll("{last}",S?S.last:"黒羽").replaceAll("{first}",(h&&!sc.player&&!sc.sys&&S)?pCall(h.id):(S?S.first:"白夜")).replaceAll("{name}",S?pName():"主人公"));
const ch=$("game-choices");ch.innerHTML="";
if(sc.choices){ch.classList.remove("hidden");$("game-next").classList.add("hidden");
sc.choices.forEach(c=>{const b=document.createElement("button");b.textContent=c.label;b.onclick=()=>{beep(740,.1);ch.classList.add("hidden");$("game-next").classList.remove("hidden");if(c.effect)c.effect();igIdx++;renderNovelInGame()};ch.appendChild(b)});
}else{ch.classList.add("hidden");$("game-next").classList.remove("hidden")}
$("game-next").onclick=()=>{if(typeComplete())return;beep(520,.07);igIdx++;renderNovelInGame()};
if($("game-skip"))$("game-skip").onclick=()=>{if(!igActive)return;beep(660,.07);typeComplete();finishNovelInGame()};
$("game-hint").textContent="タップ／クリックで進む";
}
function finishNovelInGame(){igActive=false;__adminCurNo=null;const d=igDone;igDone=null;igQueue=[];$("game-hint").textContent="";const __sk2=$("game-skip");if(__sk2)__sk2.classList.add("hidden");const __gv2=$("game-video");if(__gv2)__gv2.classList.add("hidden");igVideoFile=null;const __gsp2=$("game-speak");if(__gsp2)__gsp2.classList.add("hidden");const __gsr2=$("game-speak-rate");if(__gsr2)__gsr2.classList.add("hidden");const __gkb2=$("game-kb");if(__gkb2)__gkb2.classList.add("hidden");const __gm2=$("game-map");if(__gm2)__gm2.classList.add("hidden");igPlaceQuery=null;stopSpeak();if(d)d()}
const __gsEl=$("game-stage");if(__gsEl)__gsEl.addEventListener("click",e=>{if(typeComplete())return;if(!igActive)return;if(e.target.closest("button")||e.target.closest(".choices"))return;if(!$("game-choices").classList.contains("hidden"))return;igIdx++;renderNovelInGame()});
/* 2.45 仕様変更：動画はボタンに気づかれずスルーされるため、対象シーンに入ったら自動で再生する。
   1シーン列につき1回だけ。再生が終わる/失敗したら静かに閉じてノベルへ戻る（ボタン手動再生は従来どおり）。 */
let igVideoAutoDone=false;
function scheduleAutoVideo(){
 igVideoAutoDone=false;
 if(!igVideoFile)return;
 setTimeout(function(){
  if(!igActive||!igVideoFile||igVideoAutoDone)return;
  igVideoAutoDone=true;
  playEventVideoAuto();
 },1200);
}
function closeEventVideoAuto(){
 closeSpecial();
 if(igActive)setBGM(bgmForNovel(igTag));
}
function playEventVideoAuto(){
 if(!igVideoFile)return;
 videoMode="event";setVideoNavVisible(false);
 const v=$("special-video");if(v)v.loop=false;
 videoLoadShow();
 playSpecialCore(igVideoFile,"イベント動画");
 if(!v)return;
 let ok=false;
 v.addEventListener("playing",function(){ok=true},{once:true});
 v.addEventListener("ended",function h(){v.removeEventListener("ended",h);if(videoMode==="event")closeEventVideoAuto()});
 v.addEventListener("error",function h(){v.removeEventListener("error",h);if(videoMode==="event")closeEventVideoAuto()},true);
 setTimeout(function(){
  const m=$("modal-video");
  if(!ok&&v.paused&&videoMode==="event"&&m&&!m.classList.contains("hidden"))closeEventVideoAuto();
 },2500);
}
window.__igRouteOk=true;
/* ===== デバッグ：先生ルート状態の表示 ===== */
setInterval(()=>{
 const modal=$("modal-admin");if(modal&&modal.classList.contains("hidden"))return;
 const el=document.getElementById("adm-nurse-state");if(!el)return;
 if(!S||!S.nurse){el.textContent="―（プレイ中のみ表示）";return}
 const n=S.nurse;
 el.textContent="stage "+n.stage+" ／ 保健室 "+n.visits+"回 ／ 目撃 "+n.saw+"回 ／ 単独遭遇 "+n.solo+"回 ／ 先生の好感度 "+n.aff+(window.__nurseReady&&__nurseReady()?"（卒業で先生エンド到達可能）":"");
},900);
}

/* ================= SPECIAL VIDEOS（お宝動画） ================= */
const VIDEO_HERO_FULL={"さくら":"桜井 さくら","あかり":"星野 あかり","ゆき":"月島 ゆき","りん":"藤原 りん","全員":"全員"};
let videoMode="list", igTag="", igVideoFile=null;
const VIDEO_RULES=[
 ["水族館",{rin:"date-rin.mp4"}],
 ["クリスマス",{sakura:"date-sakura-winter.mp4",akari:"date-akari-winter.mp4",yuki:"date-yuki-winter.mp4",rin:"date-rin-winter.mp4"}],
 ["雪",{sakura:"date-sakura-winter.mp4",akari:"date-akari-winter.mp4",yuki:"date-yuki-winter.mp4",rin:"date-rin-winter.mp4",any:"season-winter.mp4"}],
 ["夏祭り",{sakura:"date-sakura-summer.mp4",akari:"date-akari-summer.mp4",yuki:"date-yuki-summer.mp4",rin:"date-rin-summer.mp4",any:"season-summer.mp4"}],
 ["花火",{sakura:"date-sakura-summer.mp4",akari:"date-akari-summer.mp4",yuki:"date-yuki-summer.mp4",rin:"date-rin-summer.mp4",any:"season-summer.mp4"}],
 ["海",{sakura:"date-sakura-summer.mp4",akari:"date-akari-summer.mp4",yuki:"date-yuki-summer.mp4",rin:"date-rin-summer.mp4"}],
 ["紅葉",{sakura:"date-sakura-autumn.mp4",akari:"date-akari-autumn.mp4",yuki:"date-yuki-autumn.mp4",rin:"date-rin-autumn.mp4",any:"season-autumn.mp4"}],
 ["桜の下",{sakura:"date-sakura-spring.mp4",akari:"date-akari-spring.mp4",yuki:"date-yuki-spring.mp4",rin:"date-rin-spring.mp4",any:"season-spring.mp4"}],
 ["桜",{sakura:"date-sakura-spring.mp4",akari:"date-akari-spring.mp4",yuki:"date-yuki-spring.mp4",rin:"date-rin-spring.mp4",any:"season-spring.mp4"}],
 ["カフェ",{sakura:"date-sakura.mp4",yuki:"date-yuki.mp4"}],
 ["図書",{yuki:"date-yuki.mp4"}],
 ["ブックカフェ",{yuki:"date-yuki.mp4"}],
 ["河原",{akari:"date-akari.mp4"}],
 ["那珂川",{akari:"date-akari.mp4"}],
 ["テニス",{akari:"date-akari.mp4"}],
 ["川",{akari:"date-akari-summer.mp4",any:"season-summer.mp4"}],
 ["デート",{sakura:"date-sakura.mp4",akari:"date-akari.mp4",yuki:"date-yuki.mp4",rin:"date-rin.mp4"}],
 ["お部屋",{sakura:"date-sakura.mp4",akari:"date-akari.mp4",yuki:"date-yuki.mp4",rin:"date-rin.mp4"}],
 ["春",{sakura:"date-sakura-spring.mp4",akari:"date-akari-spring.mp4",yuki:"date-yuki-spring.mp4",rin:"date-rin-spring.mp4",any:"season-spring.mp4"}],
 ["夏",{sakura:"date-sakura-summer.mp4",akari:"date-akari-summer.mp4",yuki:"date-yuki-summer.mp4",rin:"date-rin-summer.mp4",any:"season-summer.mp4"}],
 ["秋",{sakura:"date-sakura-autumn.mp4",akari:"date-akari-autumn.mp4",yuki:"date-yuki-autumn.mp4",rin:"date-rin-autumn.mp4",any:"season-autumn.mp4"}],
 ["冬",{sakura:"date-sakura-winter.mp4",akari:"date-akari-winter.mp4",yuki:"date-yuki-winter.mp4",rin:"date-rin-winter.mp4",any:"season-winter.mp4"}]
];
function videoForNovel(tag,heroId){
 const t=tag||"";
 for(let i=0;i<VIDEO_RULES.length;i++){
  if(t.indexOf(VIDEO_RULES[i][0])>=0){
   const map=VIDEO_RULES[i][1];
   if(heroId&&map[heroId])return map[heroId];
   if(map.any)return map.any;
   return null;
  }
 }
 return null;
}
function setVideoNavVisible(on){["btn-video-prev","btn-video-next","btn-video-bgm","btn-video-menu"].forEach(function(id){const b=$(id);if(b)b.style.display=on?"":"none"})}
function playEventVideo(){
 if(!igVideoFile)return;
 videoMode="event";setVideoNavVisible(false);
 const v=$("special-video");if(v)v.loop=true;
 videoLoadShow();
 playSpecialCore(igVideoFile,"イベント動画");
}
function renderVideoList(){
 const box=$("album-video-list");if(!box)return;
 const order=["さくら","あかり","ゆき","りん","全員"];let html="";videoDisplay=[];
 order.forEach(function(h){
  const items=(window.SAKURA_SPECIAL_VIDEOS||[]).filter(function(v){return v[0]===h});
  if(!items.length)return;
  html+='<h3 class="mincho" style="margin:14px 0 4px">'+(VIDEO_HERO_FULL[h]||h)+'</h3>';
  items.forEach(function(v,i){
   const label=h+"-"+String(i+1).padStart(2,"0")+"　"+v[2];
   const vidx=videoDisplay.length;videoDisplay.push([v[1],label]);
   if(videoSeenSet.has(v[1]))html+='<button class="btn small" data-video="'+v[1]+'" data-vidx="'+vidx+'" data-vtitle="'+label+'" style="display:block;width:100%;text-align:left;margin:4px 0">'+label+'</button>';
   else html+='<button class="btn small" disabled style="display:block;width:100%;text-align:left;margin:4px 0;opacity:.55">'+h+"-"+String(i+1).padStart(2,"0")+"　🔒 ゲームの中で見ると解放されます</button>";
  });
 });
 box.innerHTML=html||'<p style="color:var(--muted)">動画リストがありません。</p>';
 const vc=$("album-video-count");if(vc)vc.textContent="（解放 "+videoSeenSet.size+" / "+(window.SAKURA_SPECIAL_VIDEOS||[]).length+"）";
 box.querySelectorAll("[data-video]").forEach(function(b){b.onclick=function(){playSpecialAt(parseInt(b.getAttribute("data-vidx"),10))}});
}
let specialIdx=-1, videoDisplay=[], videoBgmOn=false;
function playSpecialCore(file,title,idx){
 stopSpeak();
 markVideoSeen(file);
 const m=$("modal-video"),v=$("special-video");if(!m||!v)return;
 if(typeof idx==="number")specialIdx=idx;
 $("video-title").textContent="🎁 "+title;$("video-msg").textContent="";
 if(!videoBgmOn)bgmStopAll();
 m.classList.remove("hidden");
 v.src="videos/"+file;
 try{const p=v.play&&v.play();if(p&&p.catch)p.catch(function(){})}catch(e){}
}
function playSpecial(file,title,idx){
 videoMode="list";setVideoNavVisible(true);
 const v=$("special-video");if(v)v.loop=false;
 playSpecialCore(file,title,idx);
}
function playSpecialAt(i){
 if(!videoDisplay.length)return;
 const n=videoDisplay.length;
 specialIdx=((i%n)+n)%n;
 const d=videoDisplay[specialIdx];
 playSpecial(d[0],d[1],specialIdx);
}
function setVideoBgm(on){
 videoBgmOn=on;
 const b=$("btn-video-bgm");if(b)b.textContent="🎵 BGM: "+(on?"ON":"OFF");
 if(on)setBGM("opening");else bgmStopAll();
}
function closeSpecial(){
 const m=$("modal-video"),v=$("special-video");
 if(v){try{v.pause()}catch(e){}v.removeAttribute("src");try{v.load()}catch(e){}}
 if(m)m.classList.add("hidden");
 videoBgmOn=false;const b=$("btn-video-bgm");if(b)b.textContent="🎵 BGM: OFF";
 const vv=$("special-video");if(vv)vv.loop=false;
 if(videoMode==="event"){setBGM(bgmForNovel(igTag||""))}else{setBGM("title")}
 videoMode="list";
}
if($("btn-video-close"))$("btn-video-close").onclick=closeSpecial;
if($("game-video"))$("game-video").onclick=function(){playEventVideo()};
if($("btn-video-prev"))$("btn-video-prev").onclick=function(){playSpecialAt(specialIdx-1)};
if($("btn-video-next"))$("btn-video-next").onclick=function(){playSpecialAt(specialIdx+1)};
if($("btn-video-bgm"))$("btn-video-bgm").onclick=function(){setVideoBgm(!videoBgmOn)};
if($("btn-video-menu"))$("btn-video-menu").onclick=function(){closeSpecial();goTitle()};
if($("special-video")){
 $("special-video").addEventListener("ended",closeSpecial);
 $("special-video").addEventListener("error",function(){$("video-msg").textContent="動画ファイルが見つかりませんでした。videos フォルダにファイルを入れてください。";toast("🎁 動画ファイルが見つかりません")});
}

/* お宝動画ローディングバー */
function videoLoadShow(){$("video-loading").style.display="block";$("video-load-bar").style.width="0%";$("video-load-text").textContent="読み込み中… 0%"}
function videoLoadUpdate(){
 const v=$("special-video");if(!v)return;
 let pct=null;
 try{if(v.buffered&&v.buffered.length&&v.duration&&isFinite(v.duration))pct=Math.min(100,Math.round(v.buffered.end(v.buffered.length-1)/v.duration*100))}catch(e){}
 if(pct===null)$("video-load-text").textContent="読み込み中…";
 else{$("video-load-bar").style.width=pct+"%";$("video-load-text").textContent="読み込み中… "+pct+"%"}
 if(pct!==null&&pct>=100)videoLoadDone();
}
function videoLoadDone(){$("video-load-bar").style.width="100%";$("video-loading").style.display="none"}
if($("special-video")){
 const sv=$("special-video");
 sv.addEventListener("progress",videoLoadUpdate);
 sv.addEventListener("loadedmetadata",videoLoadUpdate);
 sv.addEventListener("canplay",videoLoadDone);
 sv.addEventListener("playing",videoLoadDone);
 sv.addEventListener("waiting",function(){if(sv.readyState<3)videoLoadShow()});
 const _ps=playSpecial;
 playSpecial=function(file,title,idx){videoLoadShow();_ps(file,title,idx)};
}

/* ================= 読み上げ（端末の音声合成） ================= */
/* 2.41 読み上げ用よみ変換：画面表示は漢字のまま、音声だけ読みに変える。
   主人公の苗字は単独では変換しない（町の「黒羽＝くろばね」と区別するため、
   フルネーム・「苗字くん／さん」の形だけを本人のよみに変える） */
const YOMI_DICT=[["藤原千鶴","ふじわら ちづる"],["桜井さくら","さくらい さくら"],["星野あかり","ほしの あかり"],["月島ゆき","つきしま ゆき"],["藤原りん","ふじわら りん"],["蒼井翼","あおい つばさ"],["大関和","おおぜき ちか"],["羽田沼","はねたぬま"],["那珂川","なかがわ"],["雲巌寺","うんがんじ"],["芭蕉","ばしょう"]];
function yomiForSpeak(t){
 try{
  if(typeof S!=="undefined"&&S&&S.last){
   const ly=S.lastYomi||S.last,fy=S.firstYomi||S.first,ny=S.nickYomi||S.nick;
   t=t.split(S.last+" "+S.first).join(ly+" "+fy);
   t=t.split(S.last+S.first).join(ly+fy);
   t=t.split(S.last+"くん").join(ly+"くん");
   t=t.split(S.last+"さん").join(ly+"さん");
   if(S.nick&&ny&&S.nick!==ny)t=t.split(S.nick).join(ny);
   t=t.split(S.first+"くん").join(fy+"くん");
   if(S.first&&fy&&fy!==S.first)t=t.split(S.first).join(fy);
  }
 }catch(e){}
 YOMI_DICT.forEach(p=>{t=t.split(p[0]).join(p[1])});
 return t;
}
function speakJa(text){
 try{
  if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined")return false;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(yomiForSpeak(text));u.lang="ja-JP";u.rate=speakRate;u.pitch=1.0;
  try{const vs=speechSynthesis.getVoices?speechSynthesis.getVoices():[];const jv=vs.find(function(v){return /^ja/i.test(v.lang||"")});if(jv)u.voice=jv}catch(e){}
  speechSynthesis.speak(u);return true;
 }catch(e){return false}
}
function stopSpeak(){try{if("speechSynthesis" in window)speechSynthesis.cancel()}catch(e){}}
const SPEAK_RATES=[0.75,1,1.25,1.5,1.75,2];
let speakRate=1,lastSpeakEl=null;
try{const sr=parseFloat(localStorage.getItem("sakura-memorial-speakrate-v1"));if(SPEAK_RATES.includes(sr))speakRate=sr}catch(e){}
function speakRateLabel(){return "速度 ×"+speakRate.toFixed(2).replace(/0$/,"")}
function refreshSpeakRateBtns(){["game-speak-rate","novel-speak-rate"].forEach(function(id){const b=$(id);if(b)b.textContent=speakRateLabel()})}
function cycleSpeakRate(){const i=SPEAK_RATES.indexOf(speakRate);speakRate=SPEAK_RATES[(i+1)%SPEAK_RATES.length];try{localStorage.setItem("sakura-memorial-speakrate-v1",String(speakRate))}catch(e){}refreshSpeakRateBtns();refreshSpeakBtns();toast("読み上げ速度 "+speakRateLabel());if(lastSpeakEl&&"speechSynthesis" in window&&speechSynthesis.speaking)speakFrom(lastSpeakEl)}
let speakAuto=false,lastSpokenKey="";
try{speakAuto=localStorage.getItem("sakura-memorial-speakauto-v1")==="1"}catch(e){}
function speakTextOf(sc,h){return (sc.text||"").replaceAll("{call}",S?pCall(h?h.id:null):"君").replaceAll("{nick}",S?(S.nick||S.first):"白夜").replaceAll("{last}",S?S.last:"黒羽").replaceAll("{first}",(h&&!sc.player&&!sc.sys&&S)?pCall(h.id):(S?S.first:"白夜")).replaceAll("{name}",S?pName():"主人公")}
function autoSpeak(screen,idx,sc,h){if(!speakAuto)return;const t=speakTextOf(sc,h).trim();if(!t)return;const key=screen+":"+idx+":"+t;if(key===lastSpokenKey)return;lastSpokenKey=key;speakJa(t)}
function refreshSpeakBtns(){["game-speak","novel-speak"].forEach(function(id){const b=$(id);if(b)b.textContent=speakAuto?"🔊 読上ON":"🔇 読上OFF"})}
function toggleSpeakAuto(elId){speakAuto=!speakAuto;try{localStorage.setItem("sakura-memorial-speakauto-v1",speakAuto?"1":"0")}catch(e){}refreshSpeakBtns();if(speakAuto){toast("読み上げON：文章が自動で読み上げられます");speakFrom(elId)}else{stopSpeak();toast("読み上げOFF")}}
function speakFrom(elId){lastSpeakEl=elId;
 const el=$(elId);if(!el)return;
 if(typeof typeComplete==="function")typeComplete();
 const text=(el.textContent||"").trim();if(!text)return;
 if(!speakJa(text))toast("この環境では読み上げに対応していません");
}
if($("game-speak"))$("game-speak").onclick=function(){toggleSpeakAuto("game-text")};
if($("novel-speak"))$("novel-speak").onclick=function(){toggleSpeakAuto("novel-text")};
if($("game-speak-rate"))$("game-speak-rate").onclick=function(){cycleSpeakRate()};
if($("novel-speak-rate"))$("novel-speak-rate").onclick=function(){cycleSpeakRate()};
refreshSpeakRateBtns();
/* 2.32 1枚絵モーション（ケン・バーンズ）ON/OFF：既定ON、設定は保存 */
let kbOn=true;
try{kbOn=localStorage.getItem("sakura-memorial-kb-v1")!=="0"}catch(e){}
function refreshKbBtns(){["game-kb","novel-kb"].forEach(function(id){const b=$(id);if(b)b.textContent=kbOn?"🎞 動きON":"🎞 動きOFF"})}
function applyKb(){document.body.classList.toggle("kb-on",kbOn);refreshKbBtns()}
function toggleKb(){kbOn=!kbOn;try{localStorage.setItem("sakura-memorial-kb-v1",kbOn?"1":"0")}catch(e){}applyKb();toast(kbOn?"画面の動きON：場面の絵がゆっくり動きます":"画面の動きOFF")}
if($("game-kb"))$("game-kb").onclick=function(){toggleKb()};
if($("novel-kb"))$("novel-kb").onclick=function(){toggleKb()};
applyKb();
try{if("speechSynthesis" in window&&speechSynthesis.addEventListener)speechSynthesis.addEventListener("voiceschanged",function(){try{speechSynthesis.getVoices()}catch(e){}})}catch(e){}

/* ================= 実在スポット地図 ================= */
let igPlaceQuery=null;
function placeOf(img){if(!img)return null;const base=String(img).split("/").pop();const map=window.SAKURA_PLACE_MAP||{};return map[base]||null}
function openPlaceMap(q){if(!q)return;window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q),"_blank")}
if($("game-map"))$("game-map").onclick=function(){openPlaceMap(igPlaceQuery)};
if($("detail-map"))$("detail-map").onclick=function(){openPlaceMap(this.getAttribute("data-q"))};

/* ================= 聖地巡礼（観光案内） ================= */
function openPilgrim(){show("screen-pilgrim");renderPilgrim()}
function renderPilgrim(){
 const box=$("pilgrim-list");if(!box)return;
 box.innerHTML=(window.SAKURA_PILGRIM||[]).map(function(p){
  const q=placeOf(p.img);
  return '<div class="card" style="margin-bottom:12px;display:flex;gap:12px;align-items:flex-start">'
   +'<img src="'+p.img+'" alt="" loading="lazy" style="width:110px;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:10px;flex:none">'
   +'<div style="flex:1;min-width:0"><h3 class="mincho" style="margin:0 0 4px;font-size:17px">'+p.name+'</h3>'
   +(p.haiku?'<p style="margin:0 0 4px;font-weight:700;line-height:1.8">「'+p.haiku+'」</p>':"")
   +'<p style="margin:0 0 8px;font-weight:500;line-height:1.8;color:var(--muted)">'+p.note+'</p>'
   +(q?'<button class="btn small" data-pmap="'+q+'">🗺 地図で見る</button>':"")
   +'</div></div>';
 }).join("");
 box.querySelectorAll("[data-pmap]").forEach(function(b){b.onclick=function(){openPlaceMap(b.getAttribute("data-pmap"))}});
}
let albumTab="none";
function setAlbumTab(t){albumTab=(t===albumTab)?"none":t;const tg=function(id,on){const el=$(id);if(el)el.classList.toggle("hidden",!on)};
 tg("album-videos",albumTab==="video");tg("album-bgm",albumTab==="bgm");tg("album-grid",albumTab==="pic");
 if(albumTab==="pic")renderAlbumGrid();
 if(albumTab!=="pic")tg("album-detail",false);
 tg("album-ach",albumTab==="none");const sm=$("album-summary");if(sm)sm.classList.toggle("hidden",!(albumTab==="none"&&S&&S.ended));
 const bp=$("tab-pic"),bb=$("tab-bgm"),bv=$("tab-video");
 if(bp)bp.classList.toggle("primary",albumTab==="pic");if(bb)bb.classList.toggle("primary",albumTab==="bgm");if(bv)bv.classList.toggle("primary",albumTab==="video");
 window.scrollTo({top:0});}
if($("tab-pic"))$("tab-pic").onclick=function(){setAlbumTab("pic")};
if($("tab-bgm"))$("tab-bgm").onclick=function(){setAlbumTab("bgm")};
if($("tab-video"))$("tab-video").onclick=function(){setAlbumTab("video")};
if($("btn-pilgrim"))$("btn-pilgrim").onclick=openPilgrim;
if($("btn-pilgrim-title"))$("btn-pilgrim-title").onclick=openPilgrim;
if($("btn-pilgrim-back"))$("btn-pilgrim-back").onclick=function(){goTitle()};
if($("btn-pilgrim-back-top"))$("btn-pilgrim-back-top").onclick=function(){goTitle()};
if($("btn-album-to-title"))$("btn-album-to-title").onclick=function(){goTitle()};
