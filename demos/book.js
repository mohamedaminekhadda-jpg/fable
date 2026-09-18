
(function(){
  var CFG=window.__BOOK__||{};
  var BS=String.fromCharCode(92);
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function cvar(n,f){var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||f;}
  function pal(){return [cvar('--accent','#8c2f2a'),cvar('--gold','#c9a054'),cvar('--teal','#5fa39b'),cvar('--slate','#6b7089'),'#7ea0d6','#7ec496','#d27870','#b08440'];}
  /* Les mots que le lecteur voit, dans la langue du livre. Le tableau arrive
     par window.__BOOK__.i18n, deja reduit a cette langue. Sans lui on garde le
     francais : c'est la langue de reference de ce fichier, et un mot en trop
     vaut mieux qu'un bouton vide. */
  var IWL=(window.__BOOK__&&window.__BOOK__.i18n)||{};
  function T(k,d){ return IWL[k]||d||k; }
  function hash(s){var h=0,i=0;s=String(s||'');for(;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
  /* Inline formatting for labels written inside a widget's settings. The text is
     escaped first, so an author can format but cannot inject markup:
       **gras**  *italique*  ^exposant^  ~indice~  and a break for each newline.
     Italic needs a non-space after the star so that "3 * 4" stays arithmetic. */
  var RT_B=new RegExp('[*][*]([^*]+)[*][*]','g'), RT_I=new RegExp('[*]([^* ][^*]*)[*]','g'),
      RT_SUP=new RegExp(BS+'^([^^]+)'+BS+'^','g'), RT_SUB=new RegExp('~([^~]+)~','g'),
      RT_BR=new RegExp('['+String.fromCharCode(10)+']','g');
  function iwRT(s){ return esc(s).replace(RT_B,'<strong>$1</strong>').replace(RT_I,'<em>$1</em>')
    .replace(RT_SUP,'<sup>$1</sup>').replace(RT_SUB,'<sub>$1</sub>').replace(RT_BR,'<br>'); }
  /* the same text with the markers simply removed — for title=, aria-label= and
     anywhere else that takes a plain string */
  function iwRTx(s){ return String(s==null?'':s).replace(RT_B,'$1').replace(RT_I,'$1')
    .replace(RT_SUP,'$1').replace(RT_SUB,'$1'); }
  /* A tick box written by hand in a source file arrives as the text "true" or
     "false", and "false" is a perfectly truthy string. */
  function iwBool(v,dflt){ if(v===undefined||v===null||v==='')return !!dflt;
    if(typeof v==='boolean')return v;
    var s=String(v).trim().toLowerCase();
    return !(s==='0'||s==='false'||s==='non'||s==='no'||s==='off'); }
  function isImg(u){return (new RegExp('[.](png|jpg|jpeg|gif|webp|svg|avif|bmp)([?#]|$)','i')).test(String(u||''));}
  function isVid(u){return (new RegExp('[.](mp4|webm|ogv|mov|m4v)([?#]|$)','i')).test(String(u||''));}
  function isAud(u){return (new RegExp('[.](mp3|wav|ogg|oga|m4a|aac|flac|opus)([?#]|$)','i')).test(String(u||''));}
  function mediaEl(u,cls){ u=esc(u); if(isImg(u))return '<img class="'+cls+'" src="'+u+'" alt="" loading="lazy">';
    if(isVid(u))return '<video class="'+cls+'" src="'+u+'" controls preload="metadata"></video>';
    if(isAud(u))return '<audio class="'+cls+' iwt-audio" src="'+u+'" controls preload="metadata"></audio>';
    return '<iframe class="'+cls+' iwt-frame" src="'+u+'" loading="lazy"></iframe>'; }
  var R={}, SEQ=0, IWANS=[];   // IWANS: answer-key reveal hooks, see iwOnAnswers

  /* ── charts ── */
  R.chart=function(box,c){
    var P=pal(), type=c.chartType||'bar', labels=c.labels||[];
    var series=(c.series||[]).map(function(s,i){return {name:s.name||('Series '+(i+1)),color:s.color||P[i%P.length],data:(s.data||[]).map(Number),on:true};});
    box.className='iw iw-card';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')
      +(c.intro?'<p class="iwch-intro">'+esc(c.intro)+'</p>':'');
    var wrap=el('div','iw-chart'), legend=el('div','iw-legend');
    box.appendChild(wrap); box.appendChild(legend);
    /* La legende du graphique, sous la figure : ce que le lecteur doit en
       retenir, ou la source des chiffres. Un graphique sans source n'est pas
       une preuve. */
    if(c.note){ var cap=el('div','iwch-note'); cap.textContent=c.note; box.appendChild(cap); }
    function draw(){
      var W=wrap.clientWidth||640, H=c.height||300;
      var svg='<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="'+H+'">';
      if(type==='pie'){
        var s0=series[0]||{data:[]}, tot=s0.data.reduce(function(a,b){return a+(b||0);},0)||1;
        var cx=W/2, cy=H/2, r=Math.min(W,H)/2-12, ang=-Math.PI/2;
        s0.data.forEach(function(v,i){ var f=(v||0)/tot, a2=ang+f*Math.PI*2;
          var x1=cx+r*Math.cos(ang),y1=cy+r*Math.sin(ang),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
          svg+='<path d="M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+(f>0.5?1:0)+' 1 '+x2+','+y2+' Z" fill="'+P[i%P.length]+'" stroke="'+cvar('--paper-deep','#eee')+'" stroke-width="2"><title>'+esc((labels[i]||'')+': '+v)+'</title></path>'; ang=a2; });
      } else {
        var PL=52,PR=14,PT=14,PB=40, vals=[]; series.forEach(function(s){if(s.on)s.data.forEach(function(v){vals.push(v||0);});});
        var max=Math.max.apply(null,vals.concat([1])), min=Math.min.apply(null,vals.concat([0])); if(min>0)min=0;
        var x0=PL,y0=PT,pw=W-PL-PR,ph=H-PT-PB, n=labels.length||(series[0]&&series[0].data.length)||1;
        function Y(v){return y0+ph-(v-min)/((max-min)||1)*ph;}
        for(var g=0;g<=4;g++){var gy=y0+ph*g/4, gv=max-(max-min)*g/4;
          svg+='<line x1="'+x0+'" y1="'+gy+'" x2="'+(x0+pw)+'" y2="'+gy+'" stroke="'+cvar('--rule','#d8d1c2')+'"/>';
          svg+='<text x="'+(x0-8)+'" y="'+(gy+4)+'" text-anchor="end" class="iw-ax">'+(Math.round(gv*100)/100)+'</text>';}
        for(var li=0;li<n;li++){svg+='<text x="'+(x0+pw*(li+0.5)/n)+'" y="'+(y0+ph+18)+'" text-anchor="middle" class="iw-ax">'+esc(labels[li]||'')+'</text>';}
        var vis=series.filter(function(s){return s.on;});
        if(type==='line'){ vis.forEach(function(s){ var pts=s.data.map(function(v,d){return (x0+pw*(d+0.5)/n)+','+Y(v||0);}).join(' ');
          svg+='<polyline fill="none" stroke="'+s.color+'" stroke-width="2.5" points="'+pts+'"/>';
          s.data.forEach(function(v,d){svg+='<circle class="iw-dot" cx="'+(x0+pw*(d+0.5)/n)+'" cy="'+Y(v||0)+'" r="4" fill="'+s.color+'"><title>'+esc(s.name+': '+v)+'</title></circle>';}); });
        } else { var gw=pw/n, bw=gw*0.7/(vis.length||1);
          vis.forEach(function(s,si){ s.data.forEach(function(v,d){ var bx=x0+gw*d+gw*0.15+si*bw, by=Y(v||0);
            svg+='<rect class="iw-bar" x="'+bx+'" y="'+by+'" width="'+Math.max(1,bw-2)+'" height="'+Math.max(0,y0+ph-by)+'" fill="'+s.color+'"><title>'+esc(s.name+': '+v)+'</title></rect>'; }); }); }
      }
      wrap.innerHTML=svg+'</svg>';
    }
    if(type==='pie'){ (labels.length?labels:series).forEach(function(l,i){ var b=el('span','iw-leg'); b.innerHTML='<span style="background:'+P[i%P.length]+'"></span>'+esc(labels[i]||(series[i]&&series[i].name)||''); legend.appendChild(b); }); }
    else { series.forEach(function(s){ var b=el('button','iw-leg'); b.innerHTML='<span style="background:'+s.color+'"></span>'+esc(s.name); b.addEventListener('click',function(){s.on=!s.on;b.classList.toggle('off',!s.on);draw();}); legend.appendChild(b); }); }
    draw(); window.addEventListener('resize',draw);
  };

  /* ── timeline (vertical rail; text + image/video/audio/embed per event) ── */
  R.timeline=function(box,c){
    var evs=c.events||[]; var horiz=c.layout==='horizontal';
    box.className='iw iw-card iw-timeline'+(c.layout==='alternate'?' iwt-alt':'')+(horiz?' iwt-horiz':'');
    if(!evs.filter(function(e){return e&&(e.date||e.title||e.body||e.media);}).length){
      box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une date et son titre.</div>'; return; }
    function item(e){
      var media=e.media?'<div class="iwt-media">'+mediaEl(e.media,'iwt-img')+'</div>':'';
      return '<div class="iwt-item"><div class="iwt-marker"><span'+(e.color?' style="background:'+esc(e.color)+'"':'')+'></span></div><div class="iwt-content">'+
        (e.date?'<div class="iwt-date">'+esc(e.date)+'</div>':'')+
        (e.title?'<div class="iwt-h">'+esc(e.title)+'</div>':'')+
        media+
        (e.body?'<div class="iwt-b">'+esc(e.body)+'</div>':'')+
        '</div></div>';
    }
    var title=c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'';
    if(!horiz){
      box.innerHTML=title+'<div class="iwt-line">'+evs.map(item).join('')+'</div>';
      return;
    }
    // Horizontal: a draggable scroll strip with smooth fading edge shadows.
    box.innerHTML=title+'<div class="iwt-wrap"><div class="iwt-scroll"><div class="iwt-track">'+evs.map(item).join('')+'</div></div><div class="iwt-edge iwt-edge-l"></div><div class="iwt-edge iwt-edge-r"></div></div>';
    var wrap=box.querySelector('.iwt-wrap'), sc=box.querySelector('.iwt-scroll');
    function edges(){ var max=sc.scrollWidth-sc.clientWidth-1; wrap.classList.toggle('at-start',sc.scrollLeft<=2); wrap.classList.toggle('at-end',sc.scrollLeft>=max); }
    sc.addEventListener('scroll',edges); window.addEventListener('resize',edges); setTimeout(edges,50); setTimeout(edges,400);
    // drag-to-scroll
    var down=false,sx=0,sl=0,moved=false;
    sc.addEventListener('pointerdown',function(ev){ down=true; moved=false; sx=ev.clientX; sl=sc.scrollLeft; sc.classList.add('drag'); });
    sc.addEventListener('pointermove',function(ev){ if(!down)return; var dx=ev.clientX-sx; if(Math.abs(dx)>3)moved=true; sc.scrollLeft=sl-dx; });
    function endDrag(){ if(!down)return; down=false; sc.classList.remove('drag'); }
    sc.addEventListener('pointerup',endDrag); sc.addEventListener('pointerleave',endDrag); sc.addEventListener('pointercancel',endDrag);
    sc.addEventListener('click',function(ev){ if(moved){ ev.preventDefault(); ev.stopPropagation(); } },true);
    sc.addEventListener('dragstart',function(ev){ ev.preventDefault(); });
    // vertical wheel scrolls horizontally
    sc.addEventListener('wheel',function(ev){ if(Math.abs(ev.deltaY)>Math.abs(ev.deltaX)){ sc.scrollLeft+=ev.deltaY; ev.preventDefault(); } },{passive:false});
  };

  /* ── universal stat card: image + facts + animated stat bars ── */
  R.statcard=function(box,c){
    box.className='iw iw-card iw-statcard';
    if(!c.title&&!c.kicker&&!c.body&&!c.image
      &&!(c.info||[]).some(function(r){return r&&(r.label||r.value);})
      &&!(c.stats||[]).some(function(r){return r&&(r.label||r.value);})){
      box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Donne au moins un titre, ou une ligne de chiffres.</div>'; return; }
    if(c.accent)box.style.setProperty('--isc-accent',c.accent);
    var img=c.image?'<div class="isc-img"><img src="'+esc(c.image)+'" alt="'+esc(c.title||'')+'" loading="lazy"></div>':'';
    var facts=(c.info||[]).filter(function(r){return r&&(r.label||r.value);}).map(function(r){
      return '<div class="isc-fact"><dt>'+esc(r.label||'')+'</dt><dd>'+esc(r.value||'')+'</dd></div>';}).join('');
    var head='<div class="isc-head">'+
      (c.kicker?'<div class="isc-kicker">'+esc(c.kicker)+'</div>':'')+
      (c.title?'<div class="isc-title">'+esc(c.title)+'</div>':'')+
      (c.body?'<div class="isc-body">'+esc(c.body)+'</div>':'')+
      (facts?'<dl class="isc-facts">'+facts+'</dl>':'')+'</div>';
    var bars=(c.stats||[]).filter(function(s){return s&&(s.label||s.value);}).map(function(s){
      var max=parseFloat(s.max); if(!(max>0))max=100;
      var num=parseFloat(s.value); if(isNaN(num))num=0;
      var pct=Math.max(0,Math.min(100,num/max*100));
      var col=s.color?' style="background:'+esc(s.color)+'"':'';
      return '<div class="isc-stat"><div class="isc-stat-head"><span>'+esc(s.label||'')+'</span><span class="isc-stat-val">'+esc(s.value==null?'':s.value)+'</span></div>'+
        '<div class="isc-bar"><i data-pct="'+pct+'"'+col+'></i></div></div>';}).join('');
    box.innerHTML='<div class="isc-main">'+img+head+'</div>'+(bars?'<div class="isc-stats">'+bars+'</div>':'');
    var fills=box.querySelectorAll('.isc-bar i');
    function fill(){ for(var i=0;i<fills.length;i++)fills[i].style.width=fills[i].getAttribute('data-pct')+'%'; }
    if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(es){ for(var i=0;i<es.length;i++){ if(es[i].isIntersecting){ fill(); io.disconnect(); break; } } }); io.observe(box); setTimeout(fill,1200); }
    else setTimeout(fill,60);
  };

  /* ── tier list: drag items into ranked rows; rename tiers; saves locally ── */
  R.tierlist=function(box,c){
    box.className='iw iw-card iw-tierlist';
    var tiers=c.tiers||[], items=c.items||[];
    var KEY=(CFG.key||'book')+':tl:'+hash((c.title||'')+JSON.stringify(tiers)+JSON.stringify(items));
    var saved={assign:{},labels:{}}; try{var s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s)saved=s;}catch(e){}
    var rows=tiers.map(function(t,ti){ var lbl=(saved.labels&&saved.labels[ti]!=null)?saved.labels[ti]:(t.label||'');
      return '<div class="iwtl-row"><div class="iwtl-label" contenteditable="true" data-ti="'+ti+'" style="background:'+esc(t.color||'#888')+'">'+esc(lbl)+'</div><div class="iwtl-drop" data-tier="'+ti+'"></div></div>';}).join('');
    var quizBar=c.quiz?'<div class="iwtl-quizbar"><button class="iw-btn iwtl-check">'+T('check','Vérifier')+'</button><button class="iwtl-show">'+T('show','Montrer')+'</button><span class="iwtl-score"></span></div>':'';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwtl-board">'+rows+'</div>'+
      '<div class="iwtl-poolh">Non classés — faites glisser vers le haut</div><div class="iwtl-drop iwtl-pool" data-tier="pool"></div>'+quizBar+'<button class="iwtl-reset">'+T('reset','Recommencer')+'</button>';
    var pool=box.querySelector('.iwtl-pool');
    function zoneAt(x,y){ var el=document.elementFromPoint(x,y); while(el&&el!==box){ if(el.classList&&el.classList.contains('iwtl-drop'))return el; el=el.parentNode; } return null; }
    function save(){ var a={}; box.querySelectorAll('.iwtl-drop').forEach(function(z){ var t=z.getAttribute('data-tier'); z.querySelectorAll('.iwtl-chip').forEach(function(ch){ a[ch.getAttribute('data-i')]=t; }); });
      var labels={}; box.querySelectorAll('.iwtl-label').forEach(function(l){ labels[l.getAttribute('data-ti')]=l.textContent.trim(); });
      try{localStorage.setItem(KEY,JSON.stringify({assign:a,labels:labels}));}catch(e){} }
    function attach(chip){ chip.addEventListener('pointerdown',function(e){ if(e.button)return; e.preventDefault();
      var rect=chip.getBoundingClientRect(); var ghost=chip.cloneNode(true); ghost.className=chip.className+' iwtl-ghost';
      ghost.style.cssText='position:fixed;left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;pointer-events:none;z-index:99999;opacity:.92;margin:0';
      document.body.appendChild(ghost); chip.classList.add('iwtl-dragging');
      var ox=e.clientX-rect.left, oy=e.clientY-rect.top, cur=null;
      function mv(ev){ ghost.style.left=(ev.clientX-ox)+'px'; ghost.style.top=(ev.clientY-oy)+'px'; var z=zoneAt(ev.clientX,ev.clientY); if(z!==cur){ if(cur)cur.classList.remove('iwtl-over'); cur=z; if(cur)cur.classList.add('iwtl-over'); } }
      function up(ev){ document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up); ghost.remove(); chip.classList.remove('iwtl-dragging'); var z=zoneAt(ev.clientX,ev.clientY); if(cur)cur.classList.remove('iwtl-over'); if(z){ z.appendChild(chip); save(); } }
      document.addEventListener('pointermove',mv); document.addEventListener('pointerup',up); }); }
    items.forEach(function(it,idx){ var chip=el('div','iwtl-chip'); chip.setAttribute('data-i',idx);
      chip.innerHTML=(it.img?'<img src="'+esc(it.img)+'" alt="'+esc(it.label||'')+'">':'')+(it.label?'<span>'+esc(it.label)+'</span>':'');
      attach(chip); var tgt=(saved.assign&&saved.assign[idx]!=null)?box.querySelector('.iwtl-drop[data-tier="'+saved.assign[idx]+'"]'):null; (tgt||pool).appendChild(chip); });
    box.querySelectorAll('.iwtl-label').forEach(function(l){ l.addEventListener('blur',save); l.addEventListener('keydown',function(e){ if(e.key==='Enter'){e.preventDefault();l.blur();} }); });
    box.querySelector('.iwtl-reset').addEventListener('click',function(){ try{localStorage.removeItem(KEY);}catch(e){} R.tierlist(box,c); });
    if(c.quiz){
      function tierOf(chip){ var z=chip.parentNode; while(z&&z!==box){ if(z.classList&&z.classList.contains('iwtl-drop')){ var t=z.getAttribute('data-tier'); return t==='pool'?null:+t; } z=z.parentNode; } return null; }
      box.querySelector('.iwtl-check').addEventListener('click',function(){ var right=0,total=0;
        items.forEach(function(it,idx){ if(it.correct==null||it.correct==='')return; total++; var chip=box.querySelector('.iwtl-chip[data-i="'+idx+'"]'); if(!chip)return; var ok=tierOf(chip)===+it.correct; chip.classList.toggle('iwtl-correct',ok); chip.classList.toggle('iwtl-wrong',!ok); if(ok)right++; });
        var s=box.querySelector('.iwtl-score'); s.textContent=total?(right+' / '+total+' bien placés'):'Indiquez le bon rang dans Studio'; s.className='iwtl-score '+(total&&right===total?'ok':'no'); });
      box.querySelector('.iwtl-show').addEventListener('click',function(){ items.forEach(function(it,idx){ if(it.correct==null||it.correct==='')return; var chip=box.querySelector('.iwtl-chip[data-i="'+idx+'"]'), z=box.querySelector('.iwtl-drop[data-tier="'+it.correct+'"]'); if(chip&&z){ z.appendChild(chip); chip.classList.remove('iwtl-wrong'); chip.classList.add('iwtl-correct'); } }); save(); });
    }
  };

  /* ── branching path: click choices to walk a node graph, with a soft reveal ── */
  R.branch=function(box,c){
    box.className='iw iw-card iw-branch';
    var nodes={}; (c.nodes||[]).forEach(function(n){ if(n&&n.id)nodes[n.id]=n; });
    var startId=c.start||((c.nodes&&c.nodes[0])?c.nodes[0].id:''); var path=[];
    function draw(){ var html=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwb-trail">';
      path.forEach(function(id,k){ var n=nodes[id]; if(!n)return; var last=k===path.length-1;
        var choices=(n.choices||[]).filter(function(ch){return ch&&ch.label;});
        html+='<div class="iwb-node'+(last?' iwb-cur':'')+'">'+(n.text?'<div class="iwb-text">'+esc(n.text)+'</div>':'');
        if(last&&choices.length) html+='<div class="iwb-choices">'+choices.map(function(ch){return '<button class="iwb-choice" data-to="'+esc(ch.to||'')+'">'+esc(ch.label)+'</button>';}).join('')+'</div>';
        else if(last) html+='<div class="iwb-end">— the end —</div>';
        html+='</div>'; });
      html+='</div>'+(path.length>1?'<button class="iwb-restart">↺ Start over</button>':'');
      box.innerHTML=html;
      box.querySelectorAll('.iwb-choice').forEach(function(btn){ btn.addEventListener('click',function(){ var to=btn.getAttribute('data-to'); if(nodes[to]){ path.push(to); draw(); var cur=box.querySelector('.iwb-cur'); if(cur){ cur.style.opacity='0'; cur.style.transform='translateY(12px)'; requestAnimationFrame(function(){ requestAnimationFrame(function(){ cur.style.transition='opacity .45s ease,transform .45s ease'; cur.style.opacity='1'; cur.style.transform='none'; cur.scrollIntoView({block:'nearest'}); }); }); } } }); });
      var rs=box.querySelector('.iwb-restart'); if(rs)rs.addEventListener('click',function(){ path=[startId]; draw(); }); }
    if(nodes[startId]){ path=[startId]; draw(); } else box.innerHTML='<div class="iw-title">'+esc(c.title||'Branching path')+'</div><div class="iwb-text">No start node set.</div>';
  };

  /* ── sheet music: staff notation (with playback) or a chord/lyric sheet ── */
  R.sheetmusic=function(box,c){
    box.className='iw iw-card iw-sheet';
    var title=c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'';
    if((c.mode||'staff')==='chords'){
      var lines=(c.chordlines||[]).map(function(l){ return '<div class="iwsm-cl"><pre class="iwsm-chord">'+esc(l.chords||'')+'</pre><pre class="iwsm-lyric">'+esc(l.lyric||'')+'</pre></div>'; }).join('');
      box.innerHTML=title+'<div class="iwsm-chords">'+lines+'</div>'; return;
    }
    var notes=c.notes||[]; var clef=c.clef==='bass'?'bass':'treble';
    var refStep=clef==='bass'?18:30; var clefGlyph=clef==='bass'?'𝄢':'𝄞';
    var gap=11, half=gap/2, topY=24, bottomY=topY+gap*4, x0=64, dx=42;
    function parse(p){ p=String(p==null?'':p).trim(); if(/^rest$/i.test(p))return {rest:true};
      var m=(new RegExp('^([A-Ga-g])([#b]?)(-?[0-9])$')).exec(p); if(!m)return null;
      var L='CDEFGAB'.indexOf(m[1].toUpperCase()); var oct=parseInt(m[3],10);
      var step=oct*7+L; var semi=[0,2,4,5,7,9,11][L]+(m[2]==='#'?1:m[2]==='b'?-1:0);
      return {step:step,midi:(oct+1)*12+semi,acc:m[2]}; }
    var W=Math.max(220,x0+dx*notes.length+24), H=bottomY+34;
    var svg='<svg class="iwsm-svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">';
    var i; for(i=0;i<5;i++){ var ly=topY+i*gap; svg+='<line x1="10" y1="'+ly+'" x2="'+(W-10)+'" y2="'+ly+'" stroke="currentColor" stroke-width="1" opacity=".75"/>'; }
    svg+='<text x="14" y="'+(bottomY+2)+'" font-size="'+(gap*4.6)+'" fill="currentColor">'+clefGlyph+'</text>';
    var ts=(c.timesig||'4/4').split('/');
    svg+='<text x="40" y="'+(topY+gap*1.9)+'" font-size="'+(gap*1.9)+'" font-weight="700" fill="currentColor" text-anchor="middle">'+esc(ts[0]||'4')+'</text>';
    svg+='<text x="40" y="'+(bottomY+1)+'" font-size="'+(gap*1.9)+'" font-weight="700" fill="currentColor" text-anchor="middle">'+esc(ts[1]||'4')+'</text>';
    notes.forEach(function(n,k){ var x=x0+k*dx+14; var info=parse(n.pitch);
      if(!info||info.rest){ svg+='<text x="'+x+'" y="'+(topY+gap*2.2)+'" font-size="'+(gap*2)+'" fill="currentColor" text-anchor="middle" opacity=".8"> 𝄽</text>'; return; }
      var y=bottomY-(info.step-refStep)*half;
      // ledger lines
      var lc; for(lc=bottomY+gap; lc<=y; lc+=gap) svg+='<line x1="'+(x-9)+'" y1="'+lc+'" x2="'+(x+9)+'" y2="'+lc+'" stroke="currentColor" stroke-width="1"/>';
      for(lc=topY-gap; lc>=y; lc-=gap) svg+='<line x1="'+(x-9)+'" y1="'+lc+'" x2="'+(x+9)+'" y2="'+lc+'" stroke="currentColor" stroke-width="1"/>';
      var dur=n.dur||'q'; var open=(dur==='w'||dur==='h');
      if(info.acc) svg+='<text x="'+(x-13)+'" y="'+(y+4)+'" font-size="'+(gap*1.5)+'" fill="currentColor">'+(info.acc==='#'?'♯':'♭')+'</text>';
      svg+='<ellipse cx="'+x+'" cy="'+y+'" rx="6.2" ry="4.6" transform="rotate(-18 '+x+' '+y+')" fill="'+(open?'none':'currentColor')+'" stroke="currentColor" stroke-width="'+(open?1.4:0)+'"/>';
      if(dur!=='w'){ var up=y>topY+gap*2; var sx=x+(up?6:-6), sy=y, ey=y+(up?-30:30); svg+='<line x1="'+sx+'" y1="'+sy+'" x2="'+sx+'" y2="'+ey+'" stroke="currentColor" stroke-width="1.4"/>';
        if(dur==='e'||dur==='s'){ svg+='<path d="M'+sx+' '+ey+' q7 4 6 12" stroke="currentColor" stroke-width="1.4" fill="none"/>'; if(dur==='s')svg+='<path d="M'+sx+' '+(ey+6)+' q7 4 6 12" stroke="currentColor" stroke-width="1.4" fill="none"/>'; } }
    });
    svg+='</svg>';
    box.innerHTML=title+'<div class="iwsm-staffwrap"><button class="iwsm-play" aria-label="Écouter">▶ Écouter</button><div class="iwsm-scroll">'+svg+'</div></div>';
    var DUR={w:4,h:2,q:1,e:0.5,s:0.25};
    box.querySelector('.iwsm-play').addEventListener('click',function(){ var btn=this; if(btn._playing)return; var AC=window.AudioContext||window.webkitAudioContext; if(!AC)return; var ac=new AC();
      var beat=60/(c.tempo||90), t=ac.currentTime+0.06; var any=false;
      notes.forEach(function(n){ var info=parse(n.pitch); var d=(DUR[n.dur||'q']||1)*beat; if(info&&!info.rest){ any=true; var f=440*Math.pow(2,(info.midi-69)/12); var o=ac.createOscillator(),g=ac.createGain(); o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.22,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+d*0.92); o.start(t); o.stop(t+d); } t+=d; });
      btn._playing=true; setTimeout(function(){ btn._playing=false; try{ac.close();}catch(e){} },(t-ac.currentTime)*1000+120); });
  };

  /* ── prettify a plain math expression for display (x^2 → x², sqrt → √ …) ── */
  function iwGreek(s){ var g=[['sqrt(','√('],['cbrt(','∛('],['theta','θ'],['alpha','α'],['beta','β'],['gamma','γ'],['delta','δ'],['omega','ω'],['lambda','λ'],['sigma','σ'],['phi','φ'],['tau','τ'],['rho','ρ'],['mu','μ'],['pi','π'],['*',' · '],['>=',' ≥ '],['<=',' ≤ '],['!=',' ≠ '],['->',' → '],['inf','∞']]; for(var k=0;k<g.length;k++)s=s.split(g[k][0]).join(g[k][1]); return s; }
  function iwPretty(src){ var s=iwGreek(String(src==null?'':src)); s=s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
    function sc(c){ return (c>='0'&&c<='9')||(c>='a'&&c<='z')||(c>='A'&&c<='Z')||c==='.'||c==='-'; }
    var out='', i=0; while(i<s.length){ var c=s.charAt(i);
      if(c==='^'){ i++; var sup=''; if(s.charAt(i)==='('){ var dep=1; i++; while(i<s.length&&dep>0){ var d=s.charAt(i); if(d==='(')dep++; else if(d===')')dep--; if(dep>0)sup+=d; i++; } } else { while(i<s.length&&sc(s.charAt(i))){ sup+=s.charAt(i); i++; } } out+='<sup>'+sup+'</sup>'; }
      else { out+=c; i++; } }
    return out; }

  /* ── Cartesian grapher: compile y=f(x) expressions and plot them ── */
  function iwCompile(src){
    var s=String(src==null?'':src), i=0, n=s.length, toks=[];
    function isD(c){return c>='0'&&c<='9';}
    function isA(c){return (c>='a'&&c<='z')||(c>='A'&&c<='Z')||c==='_';}
    while(i<n){ var c=s.charAt(i);
      if(c<=' '){ i++; continue; }
      if(isD(c)||(c==='.'&&isD(s.charAt(i+1)))){ var j=i+1; while(j<n&&(isD(s.charAt(j))||s.charAt(j)==='.'))j++;
        if(j<n&&(s.charAt(j)==='e'||s.charAt(j)==='E')){ j++; if(s.charAt(j)==='+'||s.charAt(j)==='-')j++; while(j<n&&isD(s.charAt(j)))j++; }
        toks.push({t:'n',v:parseFloat(s.slice(i,j))}); i=j; continue; }
      if(isA(c)){ var k=i+1; while(k<n&&(isA(s.charAt(k))||isD(s.charAt(k))))k++; toks.push({t:'id',v:s.slice(i,k)}); i=k; continue; }
      if('+-*/^%(),'.indexOf(c)>=0){ toks.push({t:'op',v:c}); i++; continue; }
      return null; }
    var p=0; function peek(){return toks[p];}
    function eat(v){ var tk=toks[p]; if(!tk)return null; if(v!=null&&tk.v!==v)return null; p++; return tk; }
    var F1={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sqrt:Math.sqrt,cbrt:Math.cbrt,exp:Math.exp,ln:Math.log,log:function(x){return Math.log(x)/Math.LN10;},log2:function(x){return Math.log(x)/Math.LN2;},abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,sign:function(x){return x>0?1:x<0?-1:0;},trunc:function(x){return x<0?Math.ceil(x):Math.floor(x);}};
    var F2={pow:Math.pow,min:Math.min,max:Math.max,atan2:Math.atan2,mod:function(a,b){return a%b;}};
    var K={pi:Math.PI,e:Math.E,tau:Math.PI*2};
    function mk(o,a,b){ return o==='+'?function(s){return a(s)+b(s);}:o==='-'?function(s){return a(s)-b(s);}:o==='*'?function(s){return a(s)*b(s);}:o==='/'?function(s){return a(s)/b(s);}:function(s){return a(s)%b(s);}; }
    function pExpr(){ var v=pTerm(); while(peek()&&peek().t==='op'&&(peek().v==='+'||peek().v==='-')){ var o=eat().v; v=mk(o,v,pTerm()); } return v; }
    function pTerm(){ var v=pFac(); while(peek()){ var tk=peek();
      if(tk.t==='op'&&(tk.v==='*'||tk.v==='/'||tk.v==='%')){ var o=eat().v; v=mk(o,v,pFac()); }
      else if(tk.t==='n'||tk.t==='id'||(tk.t==='op'&&tk.v==='(')){ v=mk('*',v,pFac()); }
      else break; } return v; }
    function pFac(){ var v=pUn(); if(peek()&&peek().t==='op'&&peek().v==='^'){ eat(); var r=pFac(); var a=v; return function(s){return Math.pow(a(s),r(s));}; } return v; }
    function pUn(){ if(peek()&&peek().t==='op'&&(peek().v==='-'||peek().v==='+')){ var o=eat().v; var u=pUn(); return o==='-'?function(s){return -u(s);}:u; } return pPrim(); }
    function pPrim(){ var tk=peek(); if(!tk)throw 0;
      if(tk.t==='n'){ p++; var val=tk.v; return function(){return val;}; }
      if(tk.t==='op'&&tk.v==='('){ p++; var e=pExpr(); if(!eat(')'))throw 0; return e; }
      if(tk.t==='id'){ p++; var raw=tk.v, nm=tk.v.toLowerCase();
        if(peek()&&peek().t==='op'&&peek().v==='('){ p++; var args=[]; if(!(peek()&&peek().v===')')){ args.push(pExpr()); while(peek()&&peek().v===','){ p++; args.push(pExpr()); } } if(!eat(')'))throw 0;
          if(F1[nm]&&args.length===1){ var f=F1[nm],a0=args[0]; return function(s){return f(a0(s));}; }
          if(F2[nm]&&args.length===2){ var g=F2[nm],aa=args[0],bb=args[1]; return function(s){return g(aa(s),bb(s));}; }
          throw 0; }
        if(K[nm]!=null){ var cv=K[nm]; return function(){return cv;}; }
        return function(s){ if(!s)return NaN; var v=(s[raw]!=null?s[raw]:s[nm]); return v==null?NaN:v; }; }
      throw 0; }
    try{ var fn=pExpr(); if(p!==toks.length)return null; return fn; }catch(e){ return null; }
  }
  R.graph=function(box,c){
    box.className='iw iw-card iw-graph';
    var funcs=(c.funcs||[]).filter(function(f){return f&&f.expr;});
    var P=pal(), W=680, H=440;
    function num(v,d){ var x=parseFloat(v); return isFinite(x)?x:d; }
    var xmin=num(c.xmin,-10), xmax=num(c.xmax,10); if(xmax<=xmin){xmin=-10;xmax=10;}
    var compiled=funcs.map(function(f,i){ return {fn:iwCompile(f.expr), color:f.color||P[i%P.length], expr:f.expr}; });
    var SAMP=W;
    var autoY = c.ymin==null||c.ymax==null||c.ymin===''||c.ymax==='';
    var ymin=num(c.ymin,-10), ymax=num(c.ymax,10);
    if(autoY){ var lo=Infinity, hi=-Infinity; compiled.forEach(function(cf){ if(!cf.fn)return; for(var i=0;i<=SAMP;i++){ var xx=xmin+(xmax-xmin)*i/SAMP; var yy=cf.fn({x:xx}); if(isFinite(yy)&&Math.abs(yy)<1e6){ if(yy<lo)lo=yy; if(yy>hi)hi=yy; } } });
      if(lo<hi){ var pd=(hi-lo)*0.12||1; ymin=lo-pd; ymax=hi+pd; } else { ymin=-10; ymax=10; } }
    if(ymax<=ymin){ymin=-10;ymax=10;}
    function px(x){ return (x-xmin)/(xmax-xmin)*W; }
    function py(y){ return H-(y-ymin)/(ymax-ymin)*H; }
    function nice(span){ var raw=span/9, mag=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)), nrm=raw/mag; var st=nrm<1.5?1:nrm<3?2:nrm<7?5:10; return st*mag; }
    var svg='<svg class="iwg-svg" viewBox="0 0 '+W+' '+H+'">';
    var gx=nice(xmax-xmin), gy=nice(ymax-ymin);
    var strokes='', labels='';
    for(var gvx=Math.ceil(xmin/gx)*gx; gvx<=xmax+1e-9; gvx+=gx){ var X=px(gvx); strokes+='<line x1="'+X.toFixed(1)+'" y1="0" x2="'+X.toFixed(1)+'" y2="'+H+'" class="iwg-grid"/>'; if(Math.abs(gvx)>1e-9){ var ax=(X<18)?'start':((X>W-18)?'end':'middle');
      labels+='<text x="'+Math.max(1,Math.min(W-1,X)).toFixed(1)+'" y="'+Math.min(H-3,py(0)+13)+'" class="iwg-lbl" text-anchor="'+ax+'">'+(+gvx.toFixed(4))+'</text>'; } }
    for(var gvy=Math.ceil(ymin/gy)*gy; gvy<=ymax+1e-9; gvy+=gy){ var Y=py(gvy); strokes+='<line x1="0" y1="'+Y.toFixed(1)+'" x2="'+W+'" y2="'+Y.toFixed(1)+'" class="iwg-grid"/>'; if(Math.abs(gvy)>1e-9)labels+='<text x="'+Math.max(2,Math.min(W-24,px(0)+4))+'" y="'+Math.max(12,Math.min(H-2,Y-3)).toFixed(1)+'" class="iwg-lbl">'+(+gvy.toFixed(4))+'</text>'; }
    svg+=strokes;
    // axes
    if(0>=ymin&&0<=ymax)svg+='<line x1="0" y1="'+py(0).toFixed(1)+'" x2="'+W+'" y2="'+py(0).toFixed(1)+'" class="iwg-axis"/>';
    if(0>=xmin&&0<=xmax)svg+='<line x1="'+px(0).toFixed(1)+'" y1="0" x2="'+px(0).toFixed(1)+'" y2="'+H+'" class="iwg-axis"/>';
    svg+=labels;
    compiled.forEach(function(cf){ if(!cf.fn)return; var d='', pen=false;
      for(var i=0;i<=SAMP;i++){ var xx=xmin+(xmax-xmin)*i/SAMP; var yy=cf.fn({x:xx});
        if(!isFinite(yy)){ pen=false; continue; }
        var Y=py(yy); if(Y< -H*2||Y> H*3){ pen=false; continue; }
        d+=(pen?'L':'M')+px(xx).toFixed(1)+' '+Y.toFixed(1)+' '; pen=true; }
      if(d)svg+='<path d="'+d+'" fill="none" stroke="'+esc(cf.color)+'" stroke-width="2" vector-effect="non-scaling-stroke"/>'; });
    svg+='</svg>';
    var legend=compiled.map(function(cf){ return '<span class="iwg-leg"><i style="background:'+esc(cf.color)+'"></i><span class="iwg-eq">y = '+iwPretty(cf.expr)+'</span>'+(cf.fn?'':' <em>(invalid)</em>')+'</span>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwg-plot">'+svg+'</div>'+(legend?'<div class="iwg-legend">'+legend+'</div>':'');
  };

  /* ── interactive simulation: sliders drive live-computed formula outputs ── */
  function iwFmt(v,dec){ if(!isFinite(v))return '—'; if(dec!=null&&dec!=='')return (+v).toFixed(+dec); var a=Math.abs(v); if(a!==0&&(a<1e-3||a>=1e6))return (+v).toExponential(3); return ''+(Math.round(v*1e4)/1e4); }
  R.sim=function(box,c){
    box.className='iw iw-card iw-sim';
    var vars=(c.vars||[]).filter(function(v){return v&&v.name;});
    var outs=(c.outputs||[]).filter(function(o){return o&&o.expr;});
    var scope={}; vars.forEach(function(v){ var val=parseFloat(v.value); if(isNaN(val))val=parseFloat(v.min); if(isNaN(val))val=0; scope[v.name]=val; });
    var compiled=outs.map(function(o){ return {fn:iwCompile(o.expr), label:o.label, unit:o.unit, dec:o.decimals}; });
    var vh=vars.map(function(v,i){ var mn=(v.min!=null&&v.min!=='')?v.min:0, mx=(v.max!=null&&v.max!=='')?v.max:10, st=(v.step!=null&&v.step!=='')?v.step:'any';
      return '<div class="iwsim-var"><div class="iwsim-vh"><span>'+esc(v.name)+(v.label?' <em>'+esc(v.label)+'</em>':'')+'</span><b data-vv="'+i+'"></b></div><input type="range" data-vi="'+i+'" min="'+mn+'" max="'+mx+'" step="'+st+'" value="'+scope[v.name]+'"></div>'; }).join('');
    var oh=compiled.map(function(o,i){ return '<div class="iwsim-out"><span class="iwsim-ol">'+esc(o.label||('Result '+(i+1)))+(o.fn?'':' <em>(invalid)</em>')+'</span><span class="iwsim-ov" data-ov="'+i+'">—</span></div>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwsim-vars">'+vh+'</div>'+(oh?'<div class="iwsim-outs">'+oh+'</div>':'');
    function refresh(){ vars.forEach(function(v,i){ var b=box.querySelector('[data-vv="'+i+'"]'); if(b)b.textContent=iwFmt(scope[v.name])+(v.unit?' '+esc(v.unit):''); });
      compiled.forEach(function(o,i){ var el=box.querySelector('[data-ov="'+i+'"]'); if(!el)return; var val=o.fn?o.fn(scope):NaN; el.textContent=iwFmt(val,o.dec)+(o.unit&&isFinite(val)?' '+o.unit:''); }); }
    box.querySelectorAll('[data-vi]').forEach(function(r){ r.addEventListener('input',function(){ scope[vars[+r.getAttribute('data-vi')].name]=parseFloat(r.value); refresh(); }); });
    refresh();
  };

  /* ── labeled diagram: an image with numbered clickable hotspots ── */
  R.diagram=function(box,c){
    box.className='iw iw-card iw-diagram';
    var pins=(c.pins||[]).filter(function(p){return p&&(p.label||p.desc);});
    if(!c.image&&!pins.length){
      box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Choisis une image, puis pose des repères dessus.</div>'; return; }
    var img=c.image?'<img class="iwd-img" src="'+esc(c.image)+'" alt="'+esc(c.title||'')+'">':'';
    var pinEls=pins.map(function(p,i){ return '<button class="iwd-pin" data-i="'+i+'" style="left:'+(parseFloat(p.x)||50)+'%;top:'+(parseFloat(p.y)||50)+'%">'+(i+1)+'</button>'; }).join('');
    // With no image the wrapper is an inline-block around nothing, so it collapses
    // to zero height and the absolutely-placed pins land on the surrounding text.
    // Give it a dashed frame instead: the author still sees where the pins sit.
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwd-wrap'+(c.image?'':' iwd-empty')+'">'+img+pinEls+'</div><div class="iwd-cap" data-cap></div>';
    var wrap=box.querySelector('.iwd-wrap'), cap=box.querySelector('[data-cap]'), btns=box.querySelectorAll('.iwd-pin');
    function closePop(){ var o=wrap.querySelector('.iwd-pop'); if(o)o.remove(); }
    function show(i){ var p=pins[i]; if(!p)return; closePop();
      for(var j=0;j<btns.length;j++)btns[j].classList.toggle('on',j===i);
      if(p.popup){ var pop=el('div','iwd-pop'); pop.style.left=(parseFloat(p.x)||50)+'%'; pop.style.top=(parseFloat(p.y)||50)+'%';
        pop.innerHTML='<button class="iwd-pop-x" aria-label="Fermer">&times;</button><b>'+esc(p.label||'')+'</b>'+(p.desc?'<div class="iwd-desc">'+esc(p.desc)+'</div>':'');
        wrap.appendChild(pop); pop.querySelector('.iwd-pop-x').addEventListener('click',function(e){ e.stopPropagation(); closePop(); });
        cap.innerHTML=''; }
      else cap.innerHTML='<b>'+(i+1)+'. '+esc(p.label||'')+'</b>'+(p.desc?'<div class="iwd-desc">'+esc(p.desc)+'</div>':''); }
    for(var i=0;i<btns.length;i++){ (function(b){ b.addEventListener('click',function(){ show(+b.getAttribute('data-i')); }); })(btns[i]); }
    var firstNonPopup=-1; for(var k=0;k<pins.length;k++){ if(!pins[k].popup){ firstNonPopup=k; break; } }
    if(firstNonPopup>=0)show(firstNonPopup);
  };

  /* ── interactive periodic table ── */
  var IWPT=[[1,'H','Hydrogène',1.008,'nonmetal',1,1],[2,'He','Hélium',4.0026,'noble',18,1],
   [3,'Li','Lithium',6.94,'alkali',1,2],[4,'Be','Béryllium',9.0122,'alkaline',2,2],[5,'B','Bore',10.81,'metalloid',13,2],[6,'C','Carbone',12.011,'nonmetal',14,2],[7,'N','Azote',14.007,'nonmetal',15,2],[8,'O','Oxygène',15.999,'nonmetal',16,2],[9,'F','Fluor',18.998,'halogen',17,2],[10,'Ne','Néon',20.18,'noble',18,2],
   [11,'Na','Sodium',22.99,'alkali',1,3],[12,'Mg','Magnésium',24.305,'alkaline',2,3],[13,'Al','Aluminium',26.982,'post',13,3],[14,'Si','Silicium',28.085,'metalloid',14,3],[15,'P','Phosphore',30.974,'nonmetal',15,3],[16,'S','Soufre',32.06,'nonmetal',16,3],[17,'Cl','Chlore',35.45,'halogen',17,3],[18,'Ar','Argon',39.948,'noble',18,3],
   [19,'K','Potassium',39.098,'alkali',1,4],[20,'Ca','Calcium',40.078,'alkaline',2,4],[21,'Sc','Scandium',44.956,'transition',3,4],[22,'Ti','Titane',47.867,'transition',4,4],[23,'V','Vanadium',50.942,'transition',5,4],[24,'Cr','Chrome',51.996,'transition',6,4],[25,'Mn','Manganèse',54.938,'transition',7,4],[26,'Fe','Fer',55.845,'transition',8,4],[27,'Co','Cobalt',58.933,'transition',9,4],[28,'Ni','Nickel',58.693,'transition',10,4],[29,'Cu','Cuivre',63.546,'transition',11,4],[30,'Zn','Zinc',65.38,'transition',12,4],[31,'Ga','Gallium',69.723,'post',13,4],[32,'Ge','Germanium',72.63,'metalloid',14,4],[33,'As','Arsenic',74.922,'metalloid',15,4],[34,'Se','Sélénium',78.971,'nonmetal',16,4],[35,'Br','Brome',79.904,'halogen',17,4],[36,'Kr','Krypton',83.798,'noble',18,4],
   [37,'Rb','Rubidium',85.468,'alkali',1,5],[38,'Sr','Strontium',87.62,'alkaline',2,5],[39,'Y','Yttrium',88.906,'transition',3,5],[40,'Zr','Zirconium',91.224,'transition',4,5],[41,'Nb','Niobium',92.906,'transition',5,5],[42,'Mo','Molybdène',95.95,'transition',6,5],[43,'Tc','Technétium',98,'transition',7,5],[44,'Ru','Ruthénium',101.07,'transition',8,5],[45,'Rh','Rhodium',102.91,'transition',9,5],[46,'Pd','Palladium',106.42,'transition',10,5],[47,'Ag','Argent',107.87,'transition',11,5],[48,'Cd','Cadmium',112.41,'transition',12,5],[49,'In','Indium',114.82,'post',13,5],[50,'Sn','Étain',118.71,'post',14,5],[51,'Sb','Antimoine',121.76,'metalloid',15,5],[52,'Te','Tellure',127.6,'metalloid',16,5],[53,'I','Iode',126.9,'halogen',17,5],[54,'Xe','Xénon',131.29,'noble',18,5],
   [55,'Cs','Césium',132.91,'alkali',1,6],[56,'Ba','Baryum',137.33,'alkaline',2,6],[72,'Hf','Hafnium',178.49,'transition',4,6],[73,'Ta','Tantale',180.95,'transition',5,6],[74,'W','Tungstène',183.84,'transition',6,6],[75,'Re','Rhénium',186.21,'transition',7,6],[76,'Os','Osmium',190.23,'transition',8,6],[77,'Ir','Iridium',192.22,'transition',9,6],[78,'Pt','Platine',195.08,'transition',10,6],[79,'Au','Or',196.97,'transition',11,6],[80,'Hg','Mercure',200.59,'transition',12,6],[81,'Tl','Thallium',204.38,'post',13,6],[82,'Pb','Plomb',207.2,'post',14,6],[83,'Bi','Bismuth',208.98,'post',15,6],[84,'Po','Polonium',209,'post',16,6],[85,'At','Astate',210,'halogen',17,6],[86,'Rn','Radon',222,'noble',18,6],
   [87,'Fr','Francium',223,'alkali',1,7],[88,'Ra','Radium',226,'alkaline',2,7],[104,'Rf','Rutherfordium',267,'transition',4,7],[105,'Db','Dubnium',268,'transition',5,7],[106,'Sg','Seaborgium',269,'transition',6,7],[107,'Bh','Bohrium',270,'transition',7,7],[108,'Hs','Hassium',269,'transition',8,7],[109,'Mt','Meitnérium',278,'transition',9,7],[110,'Ds','Darmstadtium',281,'transition',10,7],[111,'Rg','Roentgenium',282,'transition',11,7],[112,'Cn','Copernicium',285,'transition',12,7],[113,'Nh','Nihonium',286,'post',13,7],[114,'Fl','Flérovium',289,'post',14,7],[115,'Mc','Moscovium',290,'post',15,7],[116,'Lv','Livermorium',293,'post',16,7],[117,'Ts','Tennesse',294,'halogen',17,7],[118,'Og','Oganesson',294,'noble',18,7],
   [57,'La','Lanthane',138.91,'lanthanide',3,9],[58,'Ce','Cérium',140.12,'lanthanide',4,9],[59,'Pr','Praséodyme',140.91,'lanthanide',5,9],[60,'Nd','Néodyme',144.24,'lanthanide',6,9],[61,'Pm','Prométhium',145,'lanthanide',7,9],[62,'Sm','Samarium',150.36,'lanthanide',8,9],[63,'Eu','Europium',151.96,'lanthanide',9,9],[64,'Gd','Gadolinium',157.25,'lanthanide',10,9],[65,'Tb','Terbium',158.93,'lanthanide',11,9],[66,'Dy','Dysprosium',162.5,'lanthanide',12,9],[67,'Ho','Holmium',164.93,'lanthanide',13,9],[68,'Er','Erbium',167.26,'lanthanide',14,9],[69,'Tm','Thulium',168.93,'lanthanide',15,9],[70,'Yb','Ytterbium',173.05,'lanthanide',16,9],[71,'Lu','Lutécium',174.97,'lanthanide',17,9],
   [89,'Ac','Actinium',227,'actinide',3,10],[90,'Th','Thorium',232.04,'actinide',4,10],[91,'Pa','Protactinium',231.04,'actinide',5,10],[92,'U','Uranium',238.03,'actinide',6,10],[93,'Np','Neptunium',237,'actinide',7,10],[94,'Pu','Plutonium',244,'actinide',8,10],[95,'Am','Américium',243,'actinide',9,10],[96,'Cm','Curium',247,'actinide',10,10],[97,'Bk','Berkélium',247,'actinide',11,10],[98,'Cf','Californium',251,'actinide',12,10],[99,'Es','Einsteinium',252,'actinide',13,10],[100,'Fm','Fermium',257,'actinide',14,10],[101,'Md','Mendélévium',258,'actinide',15,10],[102,'No','Nobélium',259,'actinide',16,10],[103,'Lr','Lawrencium',266,'actinide',17,10]];
  var IWPTCAT={alkali:'#f2a65a',alkaline:'#f6d365',transition:'#7fb3d5',post:'#7fd1ae',metalloid:'#5fa39b',nonmetal:'#a8d38d',halogen:'#e9c46a',noble:'#c3aed6',lanthanide:'#f4a3b8',actinide:'#ef8f7e'};
  var IWPTNAME={alkali:'Métal alcalin',alkaline:'Métal alcalino-terreux',transition:'Métal de transition',post:'Métal pauvre',metalloid:'Métalloïde',nonmetal:'Non-métal',halogen:'Halogène',noble:'Gaz noble',lanthanide:'Lanthanide',actinide:'Actinide'};
  // Electron configuration + shell (couche) distribution, computed from Z (Aufbau).
  function iwEconf(z){ var order=[[1,'s',2],[2,'s',2],[2,'p',6],[3,'s',2],[3,'p',6],[4,'s',2],[3,'d',10],[4,'p',6],[5,'s',2],[4,'d',10],[5,'p',6],[6,'s',2],[4,'f',14],[5,'d',10],[6,'p',6],[7,'s',2],[5,'f',14],[6,'d',10],[7,'p',6]];
    var left=z, parts=[], shells=[]; for(var i=0;i<order.length&&left>0;i++){ var n=order[i][0], take=Math.min(order[i][2],left); left-=take; parts.push(n+order[i][1]+'<sup>'+take+'</sup>'); shells[n-1]=(shells[n-1]||0)+take; }
    return {cfg:parts.join(' '), shells:shells}; }
  function iwAtom(e){ var sh=iwEconf(e[0]).shells, n=sh.length, R0=20, stepR=n?(84-R0)/n:0;
    var s='<svg class="iwp-atom" viewBox="0 0 200 200">';
    for(var i=0;i<n;i++){ s+='<circle class="iwp-ring" cx="100" cy="100" r="'+(R0+stepR*(i+1)).toFixed(1)+'" fill="none"/>'; }
    for(var i=0;i<n;i++){ var r=R0+stepR*(i+1), cnt=sh[i]; s+='<g class="iwp-orbit" style="animation-duration:'+(7+i*3)+'s;animation-direction:'+(i%2?'reverse':'normal')+'">';
      for(var k=0;k<cnt;k++){ var a=k/cnt*6.28318; s+='<circle class="iwp-elec" cx="'+(100+r*Math.cos(a)).toFixed(1)+'" cy="'+(100+r*Math.sin(a)).toFixed(1)+'" r="3.3"/>'; } s+='</g>'; }
    return s+'<circle class="iwp-nuc" cx="100" cy="100" r="15"/><text class="iwp-nuc-t" x="100" y="105" text-anchor="middle">'+e[0]+'</text></svg>'; }
  R.periodic=function(box,c){
    box.className='iw iw-card iw-periodic';
    var only=null; if(c.only&&String(c.only).trim()){ only={}; String(c.only).split(',').forEach(function(t){ t=t.trim(); if(t)only[t.toLowerCase()]=1; }); }
    function shown(e){ return !only || only[String(e[1]).toLowerCase()] || only[String(e[0])]; }
    var cells=IWPT.map(function(e){ return '<button class="iwp-el'+(shown(e)?'':' iwp-dim')+'" data-z="'+e[0]+'" style="grid-column:'+e[5]+';grid-row:'+e[6]+';background:'+(IWPTCAT[e[4]]||'#ccc')+'"><span class="iwp-z">'+e[0]+'</span><span class="iwp-sym">'+e[1]+'</span><span class="iwp-nm">'+esc(e[2])+'</span></button>'; }).join('');
    var letters=['K','L','M','N','O','P','Q'];
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwp-scroll"><div class="iwp-grid">'+cells+'</div></div><div class="iwp-info" data-info>Touchez un élément pour voir son atome et sa fiche.</div>';
    var info=box.querySelector('[data-info]');
    function fact(l,v){ return '<div class="iwp-f"><dt>'+l+'</dt><dd>'+v+'</dd></div>'; }
    box.querySelectorAll('.iwp-el').forEach(function(b){ b.addEventListener('click',function(){ var z=+b.getAttribute('data-z'), e=null; for(var i=0;i<IWPT.length;i++){ if(IWPT[i][0]===z){e=IWPT[i];break;} } if(!e)return;
      var ec=iwEconf(e[0]); var period=e[6]>=9?(e[6]===9?6:7):e[6]; var group=e[6]>=9?'—':e[5];
      var shellsStr=ec.shells.map(function(x,i){return letters[i]+' '+x;}).join('  ·  '); var val=ec.shells[ec.shells.length-1];
      info.innerHTML='<div class="iwp-i-atom">'+iwAtom(e)+'</div><div class="iwp-i-detail"><div class="iwp-i-name">'+esc(e[2])+' <span>'+esc(e[1])+'</span></div><div class="iwp-i-cat" style="color:'+(IWPTCAT[e[4]]||'#888')+'">'+(IWPTNAME[e[4]]||e[4])+'</div><dl class="iwp-facts">'
        +fact('Numéro atomique (Z)',e[0])+fact('Masse molaire',e[3]+' g/mol')+fact('Groupe · Période',group+' · '+period)+fact('Configuration électronique',ec.cfg)+fact('Structure (couches)',shellsStr)+fact('Électrons de valence',val)+'</dl></div>';
      box.querySelectorAll('.iwp-el').forEach(function(x){x.classList.toggle('on',x===b);}); }); });
  };

  /* ── population pyramid: mirrored cohort bars, both sides on one shared scale ── */
  R.poppyramid=function(box,c){
    box.className='iw iw-card iw-pyramid';
    var rowsSrc=(c.groups||[]).filter(function(g){ return g && (g.label||g.left||g.right); });
    var lc=c.leftColor||cvar('--slate','#6b7089'), rc=c.rightColor||cvar('--accent','#8c2f2a');
    var unit=c.unit==null?'%':c.unit;
    var totL=0, totR=0, peak=0;
    rowsSrc.forEach(function(g){ var a=Math.abs(parseFloat(g.left)||0), b=Math.abs(parseFloat(g.right)||0);
      totL+=a; totR+=b; if(a>peak)peak=a; if(b>peak)peak=b; });
    // one scale for both wings, so the two sides stay comparable
    var scale=(parseFloat(c.maxValue)>0)?parseFloat(c.maxValue):peak; if(!(scale>0))scale=1;
    // the author enters the youngest cohort first; the pyramid grows upward, so the
    // list is drawn in reverse unless they asked for "as listed"
    var rows=rowsSrc.slice(); if(c.order!=='listed')rows.reverse();
    // one decimal rule for the whole pyramid — deciding per value made 12.8 read
    // as "13%" next to a neighbouring "9.6%"
    var dec=parseInt(c.decimals,10);
    if(!(dec>=0)){ dec=0; rowsSrc.forEach(function(g){ [g.left,g.right].forEach(function(v){
      var n=parseFloat(v); if(!isNaN(n)&&Math.abs(n-Math.round(n))>1e-9)dec=1; }); }); }
    var fmt=function(v){ var n=parseFloat(v); if(isNaN(n))return '';
      return n.toFixed(dec)+(unit?(unit==='%'?'%':' '+unit):''); };
    var body=rows.map(function(g,ri){
      var a=Math.abs(parseFloat(g.left)||0), b=Math.abs(parseFloat(g.right)||0);
      var wa=Math.max(0,Math.min(100,a/scale*100)), wb=Math.max(0,Math.min(100,b/scale*100));
      var hl=g.color?' style="--ipy-hi:'+esc(g.color)+'"':'';
      var note=(g.note?' iwpy-has':'');
      return '<div class="iwpy-row'+note+'"'+hl+' data-i="'+ri+'">'+
        '<div class="iwpy-wing iwpy-l"><b class="iwpy-v">'+esc(fmt(g.left))+'</b><span class="iwpy-bar" data-w="'+wa+'" style="background:'+esc(g.color||lc)+'"></span></div>'+
        '<div class="iwpy-ax">'+esc(g.label||'')+'</div>'+
        '<div class="iwpy-wing iwpy-r"><span class="iwpy-bar" data-w="'+wb+'" style="background:'+esc(g.color||rc)+'"></span><b class="iwpy-v">'+esc(fmt(g.right))+'</b></div>'+
      '</div>'; }).join('');
    var head='<div class="iwpy-head"><span class="iwpy-side"><i style="background:'+esc(lc)+'"></i>'+esc(c.leftLabel||'Hommes')+
      (c.showTotals===false?'':' <b>'+esc(fmt(totL))+'</b>')+'</span>'+
      '<span class="iwpy-scale">0 — '+esc(fmt(scale))+'</span>'+
      '<span class="iwpy-side"><i style="background:'+esc(rc)+'"></i>'+esc(c.rightLabel||'Femmes')+
      (c.showTotals===false?'':' <b>'+esc(fmt(totR))+'</b>')+'</span></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+head+
      '<div class="iwpy-body">'+body+'</div>'+
      '<div class="iwpy-note" data-note></div>'+
      (c.source?'<div class="iwpy-src">'+esc(c.source)+'</div>':'');
    var noteBox=box.querySelector('[data-note]');
    box.querySelectorAll('.iwpy-row').forEach(function(row){ row.addEventListener('click',function(){
      var g=rows[+row.getAttribute('data-i')]; if(!g)return;
      var was=row.classList.contains('on');
      box.querySelectorAll('.iwpy-row').forEach(function(x){ x.classList.remove('on'); });
      if(was||!g.note){ noteBox.innerHTML=''; return; }
      row.classList.add('on');
      noteBox.innerHTML='<b>'+esc(g.label||'')+'</b> '+esc(g.note); }); });
    var bars=box.querySelectorAll('.iwpy-bar');
    function grow(){ for(var i=0;i<bars.length;i++)bars[i].style.width=bars[i].getAttribute('data-w')+'%'; }
    if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(es){ for(var i=0;i<es.length;i++){ if(es[i].isIntersecting){ grow(); io.disconnect(); break; } } }); io.observe(box); setTimeout(grow,1400); }
    else setTimeout(grow,60);
  };

  /* ── historical figure: portrait + quick facts + collapsible sections + dates ── */
  R.person=function(box,c){
    box.className='iw iw-card iw-person';
    if(c.accent)box.style.setProperty('--ipe-accent',c.accent);
    var portrait=c.portrait?'<div class="ipe-por"><img src="'+esc(c.portrait)+'" alt="'+esc(c.name||'')+'" loading="lazy">'+
      (c.portraitCap?'<span class="ipe-por-cap">'+esc(c.portraitCap)+'</span>':'')+'</div>':'';
    var quick=(c.quick||[]).filter(function(q){ return q&&(q.label||q.value); }).map(function(q){
      return '<div class="ipe-q"><dt>'+esc(q.label||'')+'</dt><dd>'+esc(q.value||'')+'</dd></div>'; }).join('');
    var head='<div class="ipe-head">'+portrait+'<div class="ipe-id">'+
      (c.kicker?'<div class="ipe-kicker">'+esc(c.kicker)+'</div>':'')+
      '<h3 class="ipe-name">'+esc(c.name||'')+'</h3>'+
      (c.lifespan?'<div class="ipe-life">'+esc(c.lifespan)+'</div>':'')+
      (c.summary?'<p class="ipe-sum">'+esc(c.summary)+'</p>':'')+
      (quick?'<dl class="ipe-quick">'+quick+'</dl>':'')+'</div></div>';
    var secs=(c.sections||[]).filter(function(s){ return s&&(s.title||s.body); });
    // one section open at a time keeps the panel compact; the author picks the default
    var openIdx=0; secs.forEach(function(s,i){ if(s.open)openIdx=i; });
    var secHtml=secs.length?('<div class="ipe-secs">'+secs.map(function(s,i){
      return '<section class="ipe-sec'+(i===openIdx?' open':'')+'" data-s="'+i+'">'+
        '<button class="ipe-sec-h" type="button" aria-expanded="'+(i===openIdx?'true':'false')+'"><span>'+esc(s.title||('Section '+(i+1)))+'</span><i class="ipe-chev" aria-hidden="true"></i></button>'+
        '<div class="ipe-sec-b"><div class="ipe-sec-in">'+
          (s.image?'<img class="ipe-sec-img" src="'+esc(s.image)+'" alt="" loading="lazy">':'')+
          esc(s.body||'').split(String.fromCharCode(10)).join('<br>')+'</div></div></section>'; }).join('')+'</div>'):'';
    var dates=(c.dates||[]).filter(function(d){ return d&&(d.year||d.event); });
    var dateHtml=dates.length?('<div class="ipe-dates"><div class="ipe-dates-h">'+esc(c.datesTitle||'Dates clés')+'</div><ol>'+
      dates.map(function(d){ return '<li><b>'+esc(d.year||'')+'</b><span>'+esc(d.event||'')+'</span></li>'; }).join('')+'</ol></div>'):'';
    var quote=c.quote?('<figure class="ipe-quote"><blockquote>'+esc(c.quote)+'</blockquote>'+
      (c.quoteSource?'<figcaption>'+esc(c.quoteSource)+'</figcaption>':'')+'</figure>'):'';
    box.innerHTML=head+quote+(secHtml||dateHtml?'<div class="ipe-cols">'+secHtml+dateHtml+'</div>':'');
    box.querySelectorAll('.ipe-sec-h').forEach(function(btn){ btn.addEventListener('click',function(){
      var sec=btn.parentNode, open=sec.classList.contains('open');
      if(c.multiOpen!==true)box.querySelectorAll('.ipe-sec').forEach(function(s){ s.classList.remove('open'); s.querySelector('.ipe-sec-h').setAttribute('aria-expanded','false'); });
      sec.classList.toggle('open',!open); btn.setAttribute('aria-expanded',open?'false':'true'); }); });
  };

  /* ── geometry figure: points in maths coordinates, joined into segments, polygons,
     circles, angles and vectors — lengths and angle measures are computed, never typed ── */
  R.geometry=function(box,c){
    box.className='iw iw-card iw-geo';
    var P=pal();
    var pts={}, order=[];
    (c.points||[]).forEach(function(p,i){ if(!p)return; var id=p.id||('P'+(i+1));
      pts[id]={id:id,x:parseFloat(p.x)||0,y:parseFloat(p.y)||0,label:(p.label==null||p.label==='')?id:p.label,
        color:p.color||'',hide:!!p.hide,dx:parseFloat(p.dx)||0,dy:parseFloat(p.dy)||0};
      order.push(id); });
    var shapes=(c.shapes||[]).filter(function(s){ return s&&s.kind; });
    if(!order.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins un point.</div>'; return; }
    // fit the view to the points unless the author pinned it
    var xs=order.map(function(k){return pts[k].x;}), ys=order.map(function(k){return pts[k].y;});
    var x0=parseFloat(c.xmin), x1=parseFloat(c.xmax), y0=parseFloat(c.ymin), y1=parseFloat(c.ymax);
    if(isNaN(x0)||isNaN(x1)||isNaN(y0)||isNaN(y1)){
      var pad=1.2;
      if(isNaN(x0))x0=Math.min.apply(null,xs)-pad; if(isNaN(x1))x1=Math.max.apply(null,xs)+pad;
      if(isNaN(y0))y0=Math.min.apply(null,ys)-pad; if(isNaN(y1))y1=Math.max.apply(null,ys)+pad; }
    if(x1-x0<1e-6)x1=x0+1; if(y1-y0<1e-6)y1=y0+1;
    var W=620, H=Math.max(180,Math.min(700,W*(y1-y0)/(x1-x0)));
    var X=function(x){ return (x-x0)/(x1-x0)*W; }, Y=function(y){ return H-(y-y0)/(y1-y0)*H; };
    var U=W/(x1-x0);                                   // px per unit
    var SW=Math.max(1,U*0.028);                        // stroke that scales with the figure
    var FS=Math.max(11,U*0.30);
    function pt(id){ return pts[id]||null; }
    function dist(a,b){ return Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y)); }
    function num(v,d){ var n=Math.round(v*Math.pow(10,d==null?1:d))/Math.pow(10,d==null?1:d); return String(n); }
    var s='<svg class="iwgeo-svg" viewBox="0 0 '+W.toFixed(1)+' '+H.toFixed(1)+'" role="img">';
    if(c.grid!==false){ var g=parseFloat(c.gridStep)||1;
      s+='<g class="iwgeo-grid">';
      for(var gx=Math.ceil(x0/g)*g; gx<=x1+1e-9; gx+=g)s+='<line x1="'+X(gx).toFixed(1)+'" y1="0" x2="'+X(gx).toFixed(1)+'" y2="'+H.toFixed(1)+'"/>';
      for(var gy=Math.ceil(y0/g)*g; gy<=y1+1e-9; gy+=g)s+='<line x1="0" y1="'+Y(gy).toFixed(1)+'" x2="'+W.toFixed(1)+'" y2="'+Y(gy).toFixed(1)+'"/>';
      s+='</g>'; }
    if(c.axes){ s+='<g class="iwgeo-ax">';
      if(y0<=0&&y1>=0)s+='<line x1="0" y1="'+Y(0).toFixed(1)+'" x2="'+W.toFixed(1)+'" y2="'+Y(0).toFixed(1)+'"/>';
      if(x0<=0&&x1>=0)s+='<line x1="'+X(0).toFixed(1)+'" y1="0" x2="'+X(0).toFixed(1)+'" y2="'+H.toFixed(1)+'"/>';
      s+='</g>'; }
    shapes.forEach(function(sh,si){
      var col=sh.color||P[si%P.length], k=sh.kind;
      var ids=(sh.pts||(typeof sh.p==='string'?sh.p.split(new RegExp('[ ,]+')):[])).filter(function(x){return x;});
      var dash=sh.dash==='dashed'?' stroke-dasharray="'+(SW*3)+' '+(SW*2.2)+'"':(sh.dash==='dotted'?' stroke-dasharray="0 '+(SW*2.2)+'" stroke-linecap="round"':'');
      if(k==='circle'){
        var ctr=pt(sh.center||ids[0]); if(!ctr)return;
        var rr=parseFloat(sh.r);
        if(isNaN(rr)){ var thr=pt(sh.through||ids[1]); rr=thr?dist(ctr,thr):1; }
        s+='<circle cx="'+X(ctr.x).toFixed(1)+'" cy="'+Y(ctr.y).toFixed(1)+'" r="'+(rr*U).toFixed(1)+'" fill="'+(sh.fill?esc(sh.fill):'none')+'" fill-opacity="'+(sh.fill?0.18:0)+'" stroke="'+esc(col)+'" stroke-width="'+SW+'"'+dash+'/>';
        return; }
      if(k==='angle'){
        var A=pt(ids[0]), B=pt(ids[1]), C=pt(ids[2]); if(!A||!B||!C)return;
        var a1=Math.atan2(A.y-B.y,A.x-B.x), a2=Math.atan2(C.y-B.y,C.x-B.x);
        var diff=a2-a1; while(diff<=-Math.PI)diff+=2*Math.PI; while(diff>Math.PI)diff-=2*Math.PI;
        var degv=Math.abs(diff)*180/Math.PI, rad=U*(parseFloat(sh.size)||0.55);
        var bx=X(B.x), by=Y(B.y);
        if(Math.abs(degv-90)<0.5){   // right angle gets the square, not an arc
          var u1x=Math.cos(a1)*rad*0.72, u1y=-Math.sin(a1)*rad*0.72, u2x=Math.cos(a2)*rad*0.72, u2y=-Math.sin(a2)*rad*0.72;
          s+='<path d="M'+(bx+u1x).toFixed(1)+' '+(by+u1y).toFixed(1)+' L'+(bx+u1x+u2x).toFixed(1)+' '+(by+u1y+u2y).toFixed(1)+' L'+(bx+u2x).toFixed(1)+' '+(by+u2y).toFixed(1)+'" fill="none" stroke="'+esc(col)+'" stroke-width="'+SW+'"/>'; }
        else {
          var sx=bx+Math.cos(a1)*rad, sy=by-Math.sin(a1)*rad, ex=bx+Math.cos(a2)*rad, ey=by-Math.sin(a2)*rad;
          s+='<path d="M'+sx.toFixed(1)+' '+sy.toFixed(1)+' A'+rad.toFixed(1)+' '+rad.toFixed(1)+' 0 0 '+(diff>0?0:1)+' '+ex.toFixed(1)+' '+ey.toFixed(1)+'" fill="none" stroke="'+esc(col)+'" stroke-width="'+SW+'"/>'; }
        if(sh.showMeasure!==false){ var mid=a1+diff/2;
          s+='<text class="iwgeo-m" x="'+(bx+Math.cos(mid)*rad*1.55).toFixed(1)+'" y="'+(by-Math.sin(mid)*rad*1.55).toFixed(1)+'" text-anchor="middle" dominant-baseline="central" style="font-size:'+(FS*0.82)+'px">'+esc(sh.label||(num(degv,0)+'°'))+'</text>'; }
        return; }
      var pl=ids.map(function(id){ var p=pt(id); return p?[X(p.x),Y(p.y)]:null; }).filter(Boolean);
      if(pl.length<2)return;
      if(k==='polygon'){
        s+='<polygon points="'+pl.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ')+'" fill="'+(sh.fill?esc(sh.fill):esc(col))+'" fill-opacity="'+(sh.fill?0.22:0.10)+'" stroke="'+esc(col)+'" stroke-width="'+SW+'" stroke-linejoin="round"'+dash+'/>'; }
      else if(k==='line'){   // infinite line through the two points, clipped to the box
        var dx=pl[1][0]-pl[0][0], dy=pl[1][1]-pl[0][1], L=Math.sqrt(dx*dx+dy*dy)||1, big=(W+H)*1.5;
        s+='<line x1="'+(pl[0][0]-dx/L*big).toFixed(1)+'" y1="'+(pl[0][1]-dy/L*big).toFixed(1)+'" x2="'+(pl[0][0]+dx/L*big).toFixed(1)+'" y2="'+(pl[0][1]+dy/L*big).toFixed(1)+'" stroke="'+esc(col)+'" stroke-width="'+SW+'"'+dash+'/>'; }
      else {                 // segment / vector / path
        var isVec=(k==='vector');
        var end=pl[pl.length-1], prev=pl[pl.length-2];
        var d2='M'+pl.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' L');
        if(isVec){ var vdx=end[0]-prev[0], vdy=end[1]-prev[1], vL=Math.sqrt(vdx*vdx+vdy*vdy)||1;
          var hl=SW*5.2, hw=SW*3.8;
          var tipx=end[0], tipy=end[1];
          d2='M'+pl.slice(0,-1).map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' L')+
             ' L'+(tipx-vdx/vL*hl*0.75).toFixed(1)+' '+(tipy-vdy/vL*hl*0.75).toFixed(1);
          s+='<path d="'+d2+'" fill="none" stroke="'+esc(col)+'" stroke-width="'+SW+'" stroke-linecap="butt"'+dash+'/>';
          var px=-vdy/vL, py=vdx/vL;
          s+='<path d="M'+tipx.toFixed(1)+' '+tipy.toFixed(1)+
            ' L'+(tipx-vdx/vL*hl+px*hw/2).toFixed(1)+' '+(tipy-vdy/vL*hl+py*hw/2).toFixed(1)+
            ' L'+(tipx-vdx/vL*hl-px*hw/2).toFixed(1)+' '+(tipy-vdy/vL*hl-py*hw/2).toFixed(1)+' Z" fill="'+esc(col)+'"/>'; }
        else s+='<path d="'+d2+'" fill="none" stroke="'+esc(col)+'" stroke-width="'+SW+'" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>';
        // length / name printed beside the middle of the first span
        var lab=sh.label||'';
        if(sh.showLen&&ids.length>=2){ var A2=pt(ids[0]), B2=pt(ids[1]);
          if(A2&&B2)lab=(lab?lab+' = ':'')+num(dist(A2,B2),parseInt(c.decimals,10)>=0?parseInt(c.decimals,10):1)+(c.unit?' '+c.unit:''); }
        if(lab){ var mx=(pl[0][0]+pl[1][0])/2, my=(pl[0][1]+pl[1][1])/2;
          var ndx=pl[1][1]-pl[0][1], ndy=-(pl[1][0]-pl[0][0]), nL=Math.sqrt(ndx*ndx+ndy*ndy)||1;
          s+='<text class="iwgeo-m" x="'+(mx+ndx/nL*FS*0.9).toFixed(1)+'" y="'+(my+ndy/nL*FS*0.9).toFixed(1)+'" text-anchor="middle" dominant-baseline="central" style="font-size:'+(FS*0.82)+'px">'+esc(lab)+'</text>'; } }
    });
    order.forEach(function(id){ var p=pts[id]; if(p.hide)return;
      s+='<circle class="iwgeo-pt" cx="'+X(p.x).toFixed(1)+'" cy="'+Y(p.y).toFixed(1)+'" r="'+(SW*1.9).toFixed(1)+'" fill="'+esc(p.color||cvar('--ink','#1a2238'))+'"/>';
      if(p.label)s+='<text class="iwgeo-l" x="'+(X(p.x)+FS*0.55+p.dx*U).toFixed(1)+'" y="'+(Y(p.y)-FS*0.5-p.dy*U).toFixed(1)+'" style="font-size:'+FS+'px">'+esc(p.label)+'</text>'; });
    s+='</svg>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwgeo-wrap">'+s+'</div>'+
      (c.note?'<div class="iwgeo-note">'+esc(c.note)+'</div>':'');
  };

  /* ── method: a worked solution revealed one step at a time ── */
  R.method=function(box,c){
    box.className='iw iw-card iw-method';
    var lines=(c.lines||[]).filter(function(l){ return l&&(l.expr||l.why); });
    var reveal=(c.mode!=='all')&&lines.length>1;
    var body=lines.map(function(l,i){
      var m=l.expr?'<div class="iwme-expr"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block">'+texToMML(l.expr)+'</math></div>':'';
      return '<li class="iwme-step'+(reveal&&i>0?' hid':'')+'" data-s="'+i+'">'+m+
        (l.why?'<div class="iwme-why">'+esc(l.why)+'</div>':'')+'</li>'; }).join('');
    // "Savoir-faire": what this worked example is teaching you to do, listed
    // before the solution. A revision book always says it; a textbook rarely
    // does, and it is the difference between reading a solution and learning one.
    var skills=iwLines(c.skills);
    box.innerHTML=(c.kicker||c.title?'<div class="iwme-head">'+(c.kicker?'<span class="iwme-kick">'+esc(c.kicker)+'</span>':'')+
        (c.title?'<h3>'+esc(c.title)+'</h3>':'')+'</div>':'')+
      iwMeta(c)+
      (c.problem?'<div class="iwme-prob">'+esc(c.problem)+'</div>':'')+
      (skills.length?'<div class="iwme-skills"><b>'+esc(c.skillsLabel||'Savoir-faire')+'</b><ul>'+
        skills.map(function(s){ return '<li>'+iwRT(s)+'</li>'; }).join('')+'</ul></div>':'')+
      '<ol class="iwme-steps">'+body+'</ol>'+
      (reveal?'<div class="iwme-actions"><button type="button" class="iw-btn" data-me="next">Étape suivante</button><button type="button" class="iwm-qbtn" data-me="all">Tout afficher</button><button type="button" class="iwm-qbtn" data-me="reset">'+T('reset','Recommencer')+'</button></div>':'')+
      (c.answer?'<div class="iwme-ans'+(reveal?' hid':'')+'" data-ans><span>'+esc(c.answerLabel||'Résultat')+'</span><math xmlns="http://www.w3.org/1998/Math/MathML">'+texToMML(c.answer)+'</math></div>':'');
    if(!reveal)return;
    var at=0, steps=box.querySelectorAll('.iwme-step'), ans=box.querySelector('[data-ans]');
    var next=box.querySelector('[data-me="next"]');
    function sync(){ for(var i=0;i<steps.length;i++)steps[i].classList.toggle('hid',i>at);
      var done=at>=steps.length-1;
      if(ans)ans.classList.toggle('hid',!done);
      next.disabled=done; next.textContent=done?'Terminé':'Étape suivante'; }
    next.addEventListener('click',function(){ if(at<steps.length-1)at++; sync(); });
    box.querySelector('[data-me="all"]').addEventListener('click',function(){ at=steps.length-1; sync(); });
    box.querySelector('[data-me="reset"]').addEventListener('click',function(){ at=0; sync(); });
    sync();
  };

  /* ── number line: points and open/closed intervals on a graduated axis ── */
  R.numberline=function(box,c){
    box.className='iw iw-card iw-nline';
    var P=pal();
    var lo=parseFloat(c.min), hi=parseFloat(c.max);
    if(isNaN(lo))lo=-5; if(isNaN(hi))hi=5; if(hi<=lo)hi=lo+10;
    var step=parseFloat(c.step); if(!(step>0))step=1;
    // H leaves room for the descenders of a label under the axis; at 104 the
    // tail of a "g" or "q" was cut off by the edge of the viewBox
    var W=620, H=112, PADX=26, AX=64;
    var X=function(v){ return PADX+(v-lo)/(hi-lo)*(W-PADX*2); };
    var s='<svg class="iwnl-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    s+='<line class="iwnl-axis" x1="'+PADX+'" y1="'+AX+'" x2="'+(W-PADX)+'" y2="'+AX+'"/>';
    s+='<path class="iwnl-arrow" d="M'+(W-PADX)+' '+AX+' l-9 -4.5 v9 Z"/><path class="iwnl-arrow" d="M'+PADX+' '+AX+' l9 -4.5 v9 Z"/>';
    for(var v=Math.ceil(lo/step)*step; v<=hi+1e-9; v+=step){
      var vv=Math.round(v*1e6)/1e6;
      s+='<line class="iwnl-tick" x1="'+X(vv).toFixed(1)+'" y1="'+(AX-5)+'" x2="'+X(vv).toFixed(1)+'" y2="'+(AX+5)+'"/>';
      s+='<text class="iwnl-num" x="'+X(vv).toFixed(1)+'" y="'+(AX+20)+'" text-anchor="middle">'+vv+'</text>'; }
    (c.intervals||[]).filter(function(it){ return it&&!isNaN(parseFloat(it.from))&&!isNaN(parseFloat(it.to)); })
      .forEach(function(it,i){ var a=parseFloat(it.from), b=parseFloat(it.to), col=it.color||P[i%P.length];
        var xa=X(Math.min(a,b)), xb=X(Math.max(a,b)), yy=AX-14-i*13;
        s+='<line x1="'+xa.toFixed(1)+'" y1="'+yy+'" x2="'+xb.toFixed(1)+'" y2="'+yy+'" stroke="'+esc(col)+'" stroke-width="4.5" stroke-linecap="butt" opacity=".85"/>';
        // hollow = excluded bound, filled = included
        s+='<circle cx="'+xa.toFixed(1)+'" cy="'+yy+'" r="5" fill="'+(it.fromOpen?cvar('--paper-deep','#fff'):esc(col))+'" stroke="'+esc(col)+'" stroke-width="2.2"/>';
        s+='<circle cx="'+xb.toFixed(1)+'" cy="'+yy+'" r="5" fill="'+(it.toOpen?cvar('--paper-deep','#fff'):esc(col))+'" stroke="'+esc(col)+'" stroke-width="2.2"/>';
        if(it.label)s+='<text class="iwnl-lab" x="'+((xa+xb)/2).toFixed(1)+'" y="'+(yy-9)+'" text-anchor="middle" fill="'+esc(col)+'">'+esc(it.label)+'</text>'; });
    (c.dots||[]).filter(function(d){ return d&&!isNaN(parseFloat(d.at)); }).forEach(function(d,i){
      var col=d.color||cvar('--accent','#8c2f2a'), x=X(parseFloat(d.at));
      s+='<circle cx="'+x.toFixed(1)+'" cy="'+AX+'" r="6" fill="'+(d.open?cvar('--paper-deep','#fff'):esc(col))+'" stroke="'+esc(col)+'" stroke-width="2.4"/>';
      if(d.label)s+='<text class="iwnl-lab" x="'+x.toFixed(1)+'" y="'+(AX+38)+'" text-anchor="middle" fill="'+esc(col)+'">'+esc(d.label)+'</text>'; });
    s+='</svg>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwnl-wrap">'+s+'</div>'+
      (c.note?'<div class="iwnl-note">'+esc(c.note)+'</div>':'');
  };

  /* ── statistics: the summary a school series needs, every measure able to say
     what it means and how it was worked out, and four ways of drawing it ── */
  /* A value may carry a frequency: "12 x3", "12:3" and "12(3)" all mean three
     twelves, because that is how a textbook prints a series. */
  function stParse(src){
    var s=String(src==null?'':src), re=new RegExp('[-+]?[0-9]*[.]?[0-9]+([eE][-+]?[0-9]+)?','g');
    var m, hits=[], out=[];
    while((m=re.exec(s))!==null)hits.push({v:parseFloat(m[0]),i:m.index,e:m.index+m[0].length});
    var gapRe=new RegExp('^[ ]*[:x'+String.fromCharCode(0xD7)+'*(][ ]*$');
    for(var k=0;k<hits.length;k++){
      var val=hits[k].v, rep=1;
      if(k+1<hits.length&&gapRe.test(s.slice(hits[k].e,hits[k+1].i))){
        rep=Math.max(0,Math.min(2000,Math.round(hits[k+1].v))); k++; }
      for(var r=0;r<rep&&out.length<20000;r++)out.push(val); }
    return out.sort(function(a,b){ return a-b; });
  }
  function stOrd(k){ return k===1?'1re':(k+'e'); }
  /* The tile labels are set in small caps by the stylesheet, which would turn
     the standard deviation from sigma into a capital sigma and the sample s
     into an S. A symbol is not a word: it keeps the case it was written in. */
  function SYM(s){ return '<span class="iwst-sym">'+esc(s)+'</span>'; }
  R.stats=function(box,c){
    box.className='iw iw-card iw-stats';
    var raw=stParse(c.data);
    if(raw.length<2){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Colle au moins deux valeurs.</div>'; return; }
    var n=raw.length, dec=(parseInt(c.decimals,10)>=0)?parseInt(c.decimals,10):2;
    var sum=0; raw.forEach(function(v){ sum+=v; });
    var mean=sum/n;
    // linear-interpolation quantiles (the usual school convention)
    function quant(p){ var h=(n-1)*p, a=Math.floor(h), b=Math.ceil(h);
      return raw[a]+(raw[b]-raw[a])*(h-a); }
    var q1=quant(0.25), med=quant(0.5), q3=quant(0.75), mn=raw[0], mx=raw[n-1];
    var iqr=q3-q1, range=mx-mn;
    var ss=raw.reduce(function(a,v){ return a+(v-mean)*(v-mean); },0);
    var vari=ss/n, sd=Math.sqrt(vari);
    var svar=n>1?ss/(n-1):0, ssd=Math.sqrt(svar);
    var mad=raw.reduce(function(a,v){ return a+Math.abs(v-mean); },0)/n;
    var cv=(mean!==0)?sd/Math.abs(mean):null;
    var fLo=q1-1.5*iqr, fHi=q3+1.5*iqr;
    var outs=raw.filter(function(v){ return v<fLo||v>fHi; });
    var counts={}, keys=[], modes=[], best=0;
    raw.forEach(function(v){ if(counts[v]==null){counts[v]=0;keys.push(v);} counts[v]++; });
    keys.forEach(function(v){ if(counts[v]>best)best=counts[v]; });
    keys.forEach(function(v){ if(counts[v]===best)modes.push(v); });
    modes.sort(function(a,b){ return a-b; });
    var f=function(v){ return iwFrFix(v,dec); };
    var g=function(v){ return iwFrNum(v); };            // for counts and positions
    var adv=!!c.advanced;
    var show=c.show&&c.show.length?c.show:['summary','box'];
    var has=function(k){ return show.indexOf(k)>=0; };
    var col=c.color||cvar('--accent','#8c2f2a');

    /* Every measure explains itself with this series' own numbers. A pupil who
       has forgotten what an interquartile range is gets the definition and the
       subtraction that produced the figure in front of them. */
    function qHow(p){
      var h=(n-1)*p, a=Math.floor(h), b=Math.ceil(h);
      var pos='Position '+g(p)+' × ('+n+' − 1) = '+g(h);
      if(a===b)return pos+' : la '+stOrd(a+1)+' valeur, '+f(raw[a])+'.';
      return pos+' : entre la '+stOrd(a+1)+' ('+f(raw[a])+') et la '+stOrd(b+1)+' ('+f(raw[b])+'), soit '+f(quant(p))+'.'; }
    var WHY={
      n:{t:'Effectif n',d:'Le nombre de valeurs de la série, chaque répétition comptée.',
         c:n+' valeur'+(n>1?'s':'')+', de '+f(mn)+' à '+f(mx)+'.'},
      min:{t:'Minimum',d:'La plus petite valeur de la série.',c:'La '+stOrd(1)+' valeur une fois la série rangée : '+f(mn)+'.'},
      max:{t:'Maximum',d:'La plus grande valeur de la série.',c:'La '+stOrd(n)+' valeur une fois la série rangée : '+f(mx)+'.'},
      q1:{t:'Premier quartile Q1',d:'La valeur telle qu’au moins un quart de la série lui est inférieur ou égal.',c:qHow(0.25)},
      med:{t:'Médiane',d:'La valeur qui coupe la série en deux parts égales : autant de valeurs au-dessous qu’au-dessus.',
           c:(n%2)?('La série a '+n+' valeurs : c’est la '+stOrd((n+1)/2)+', soit '+f(med)+'.')
                  :('La série a '+n+' valeurs, un nombre pair : c’est la moyenne de la '+stOrd(n/2)+' ('+f(raw[n/2-1])+') et de la '+stOrd(n/2+1)+' ('+f(raw[n/2])+'), soit '+f(med)+'.')},
      q3:{t:'Troisième quartile Q3',d:'La valeur telle qu’au moins trois quarts de la série lui sont inférieurs ou égaux.',c:qHow(0.75)},
      mean:{t:'Moyenne',d:'Le total partagé également entre toutes les valeurs. Une seule valeur extrême suffit à la déplacer — la médiane, elle, ne bouge pas.',
            c:'Somme ÷ effectif = '+f(sum)+' ÷ '+n+' = '+f(mean)+'.'},
      range:{t:'Étendue',d:'De combien la série s’étale en tout. Elle ne regarde que les deux extrêmes.',
             c:'Maximum − minimum = '+f(mx)+' − '+f(mn)+' = '+f(range)+'.'},
      iqr:{t:'Écart interquartile',d:'L’étalement de la moitié centrale de la série. Les valeurs extrêmes n’y entrent pas, ce qui en fait une mesure robuste.',
           c:'Q3 − Q1 = '+f(q3)+' − '+f(q1)+' = '+f(iqr)+'. La boîte du diagramme, c’est exactement cet écart.'},
      sd:{t:'Écart-type σ',d:'L’écart moyen à la moyenne, au sens des carrés. Dans la même unité que les données, contrairement à la variance.',
          c:'σ = racine de la variance = racine de '+f(vari)+' = '+f(sd)+'.'},
      mode:{t:'Mode',d:'La valeur la plus fréquente. C’est la seule mesure qui a un sens quand les données ne sont pas des nombres.',
            c:best>1?((modes.length>1?'Plusieurs modes : ':'Mode ')+modes.map(f).join(', ')+', '+best+' fois chacun'+(modes.length>1?'':'')+'.')
                    :'Aucune valeur ne se répète : la série n’a pas de mode.'},
      vari:{t:'Variance V',d:'La moyenne des carrés des écarts à la moyenne. On élève au carré pour que les écarts négatifs ne compensent pas les positifs.',
            c:'V = '+f(ss)+' ÷ '+n+' = '+f(vari)+' (unité au carré, d’où l’écart-type).'},
      ssd:{t:'Écart-type s (échantillon)',d:'Le même calcul divisé par n − 1 : c’est celui qu’on utilise quand la série est un échantillon dont on veut estimer la population entière.',
           c:'s = racine de ('+f(ss)+' ÷ '+(n-1)+') = '+f(ssd)+', contre σ = '+f(sd)+' pour la population.'},
      cv:{t:'Coefficient de variation',d:'La dispersion rapportée à la moyenne. Sans unité, il permet de comparer deux séries qui ne se mesurent pas dans la même grandeur.',
          c:cv==null?'La moyenne est nulle : le coefficient n’est pas défini.':('σ ÷ moyenne = '+f(sd)+' ÷ '+f(Math.abs(mean))+' = '+iwFrFix(cv*100,1)+' %.')},
      mad:{t:'Écart absolu moyen',d:'La distance moyenne à la moyenne, sans passer par les carrés. Plus facile à lire que l’écart-type, moins commode à manipuler.',
           c:'Moyenne des '+n+' distances à '+f(mean)+' = '+f(mad)+'.'},
      sum:{t:'Somme Σx',d:'Le total de toutes les valeurs. C’est le numérateur de la moyenne.',c:'Σx = '+f(sum)+'.'},
      outs:{t:'Valeurs aberrantes',d:'Les valeurs situées à plus d’une fois et demie l’écart interquartile en dehors de la boîte. Une valeur aberrante se vérifie, elle ne se supprime pas.',
            c:'Hors de ['+f(fLo)+' ; '+f(fHi)+'] : '+(outs.length?outs.map(f).join(', '):'aucune')+'.'}
    };

    var tiles=[['n','n',g(n)],['min','Minimum',f(mn)],['q1','Q1',f(q1)],['med','Médiane',f(med)],
      ['q3','Q3',f(q3)],['max','Maximum',f(mx)],['mean','Moyenne',f(mean)],['range','Étendue',f(range)],
      ['iqr','Écart interquartile',f(iqr)],['sd','Écart-type '+SYM('σ'),f(sd)],['mode','Mode',best>1?f(modes[0])+(modes.length>1?' …':''):'—']];
    if(adv)tiles=tiles.concat([['vari','Variance V',f(vari)],['ssd','Écart-type '+SYM('s'),f(ssd)],
      ['cv','Coeff. de variation',cv==null?'—':iwFrFix(cv*100,1)+' %'],['mad','Écart absolu moyen',f(mad)],
      ['sum','Somme '+SYM('Σx'),f(sum)],['outs','Valeurs aberrantes',g(outs.length)]]);

    var out='';
    if(has('summary')){
      out+='<div class="iwst-sum">'+tiles.map(function(t){
        return '<button type="button" class="iwst-tile" data-k="'+t[0]+'"><span class="iwst-dt">'+t[1]+'</span><span class="iwst-dd">'+t[2]+'</span></button>'; }).join('')+'</div>';
      out+='<div class="iwst-why" aria-live="polite"></div>'; }

    if(has('box')){
      var useF=!!c.outliers, wLo=useF?raw.filter(function(v){return v>=fLo;})[0]:mn;
      var above=raw.filter(function(v){ return v<=fHi; });
      var wHi=useF?above[above.length-1]:mx;
      var W=620,H=126,PADX=38,MID=56;
      var vLo=Math.min(mn,wLo), vHi=Math.max(mx,wHi), span=(vHi-vLo)||1;
      var X=function(v){ return PADX+(v-vLo)/span*(W-PADX*2); };
      var b='<svg class="iwst-box" viewBox="0 0 '+W+' '+H+'" role="img">';
      b+='<line class="iwst-wk" x1="'+X(wLo).toFixed(1)+'" y1="'+MID+'" x2="'+X(wHi).toFixed(1)+'" y2="'+MID+'" stroke="'+esc(col)+'" stroke-width="1.4" stroke-dasharray="4 3"/>';
      [[wLo,'min'],[wHi,'max']].forEach(function(r){
        b+='<line data-mk="'+r[1]+'" class="iwst-mk" x1="'+X(r[0]).toFixed(1)+'" y1="'+(MID-13)+'" x2="'+X(r[0]).toFixed(1)+'" y2="'+(MID+13)+'" stroke="'+esc(col)+'" stroke-width="2"/>'; });
      b+='<rect data-mk="iqr" class="iwst-mk" x="'+X(q1).toFixed(1)+'" y="'+(MID-22)+'" width="'+Math.max(1,X(q3)-X(q1)).toFixed(1)+'" height="44" fill="'+esc(col)+'" fill-opacity=".18" stroke="'+esc(col)+'" stroke-width="1.8" rx="2"/>';
      [[q1,'q1'],[q3,'q3']].forEach(function(r){
        b+='<line data-mk="'+r[1]+'" class="iwst-mk" x1="'+X(r[0]).toFixed(1)+'" y1="'+(MID-22)+'" x2="'+X(r[0]).toFixed(1)+'" y2="'+(MID+22)+'" stroke="'+esc(col)+'" stroke-width="1.8"/>'; });
      b+='<line data-mk="med" class="iwst-mk" x1="'+X(med).toFixed(1)+'" y1="'+(MID-22)+'" x2="'+X(med).toFixed(1)+'" y2="'+(MID+22)+'" stroke="'+esc(col)+'" stroke-width="3"/>';
      if(useF)outs.forEach(function(v){
        b+='<circle data-mk="outs" class="iwst-mk iwst-out" cx="'+X(v).toFixed(1)+'" cy="'+MID+'" r="4" fill="none" stroke="'+esc(col)+'" stroke-width="1.6"><title>'+f(v)+'</title></circle>'; });
      [[wLo,'Min'],[q1,'Q1'],[med,'Méd'],[q3,'Q3'],[wHi,'Max']].forEach(function(r,ri){
        var y=(ri%2)?(MID+52):(MID+38);
        b+='<text class="iwst-t" x="'+X(r[0]).toFixed(1)+'" y="'+y+'" text-anchor="middle">'+f(r[0])+'</text>';
        b+='<text class="iwst-k" x="'+X(r[0]).toFixed(1)+'" y="'+(MID-28)+'" text-anchor="middle">'+r[1]+'</text>'; });
      out+=b+'</svg>'; }

    if(has('histogram')){
      var bins=Math.max(2,Math.min(20,parseInt(c.bins,10)||6)), bw=(range||1)/bins, hc=[];
      for(var i=0;i<bins;i++)hc.push(0);
      raw.forEach(function(v){ var k=Math.min(bins-1,Math.floor((v-mn)/bw)); hc[k]++; });
      var hmax=Math.max.apply(null,hc), HW=620, HH=178, HP=38;
      var hb='<svg class="iwst-hist" viewBox="0 0 '+HW+' '+HH+'" role="img">';
      hc.forEach(function(k,i){ var x=HP+(HW-HP*2)*i/bins, w=(HW-HP*2)/bins-3, hgt=(HH-52)*(k/(hmax||1));
        hb+='<rect x="'+x.toFixed(1)+'" y="'+(HH-32-hgt).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+hgt.toFixed(1)+'" fill="'+esc(col)+'" fill-opacity=".72" rx="2"><title>['+f(mn+i*bw)+' ; '+f(mn+(i+1)*bw)+'[ : '+k+'</title></rect>';
        if(k)hb+='<text class="iwst-t" x="'+(x+w/2).toFixed(1)+'" y="'+(HH-36-hgt).toFixed(1)+'" text-anchor="middle">'+k+'</text>';
        hb+='<text class="iwst-t" x="'+x.toFixed(1)+'" y="'+(HH-12)+'" text-anchor="middle">'+f(mn+i*bw)+'</text>'; });
      hb+='<text class="iwst-t" x="'+(HW-HP).toFixed(1)+'" y="'+(HH-12)+'" text-anchor="middle">'+f(mx)+'</text>';
      hb+='<line x1="'+HP+'" y1="'+(HH-32)+'" x2="'+(HW-HP)+'" y2="'+(HH-32)+'" stroke="'+esc(cvar('--rule','#d8d1c2'))+'"/>';
      out+=hb+'</svg>'; }

    /* the dot plot: every value is still visible, which the box and the
       histogram both hide — a pupil can count the repeats */
    if(has('dotplot')){
      var DW=620, DP=38, tall=Math.max.apply(null,keys.map(function(v){return counts[v];}));
      var step=Math.min(13,Math.max(7,(DW-DP*2)/Math.max(12,keys.length)/1.6));
      var DH=44+tall*step;
      var DX=function(v){ return DP+(range?((v-mn)/range):0.5)*(DW-DP*2); };
      var d='<svg class="iwst-dot" viewBox="0 0 '+DW+' '+DH.toFixed(0)+'" role="img">';
      keys.slice().sort(function(a,b){return a-b;}).forEach(function(v){
        for(var j=0;j<counts[v];j++)
          d+='<circle cx="'+DX(v).toFixed(1)+'" cy="'+(DH-30-j*step-step/2).toFixed(1)+'" r="'+(step*0.36).toFixed(1)+'" fill="'+esc(col)+'" fill-opacity=".78"><title>'+f(v)+' : '+counts[v]+'</title></circle>'; });
      d+='<line x1="'+DP+'" y1="'+(DH-26)+'" x2="'+(DW-DP)+'" y2="'+(DH-26)+'" stroke="'+esc(cvar('--rule','#d8d1c2'))+'"/>';
      [mn,med,mx].forEach(function(v,vi){ d+='<text class="iwst-t" x="'+DX(v).toFixed(1)+'" y="'+(DH-9)+'" text-anchor="'+(vi===0?'start':(vi===2?'end':'middle'))+'">'+f(v)+'</text>'; });
      out+=d+'</svg>'; }

    /* the cumulative curve, and the reading of the quartiles off it — the
       graphical method the exercise actually asks for */
    if(has('cumulative')){
      var CW=620, CH=250, CL=52, CR=22, CT=18, CB=42;
      var uniq=keys.slice().sort(function(a,b){return a-b;});
      var acc=0, pts=[];
      uniq.forEach(function(v){ acc+=counts[v]; pts.push([v,acc/n]); });
      var CX=function(v){ return CL+(range?((v-mn)/range):0.5)*(CW-CL-CR); };
      var CY=function(p){ return CT+(1-p)*(CH-CT-CB); };
      var cu='<svg class="iwst-cum" viewBox="0 0 '+CW+' '+CH+'" role="img">';
      [0,0.25,0.5,0.75,1].forEach(function(p){
        cu+='<line x1="'+CL+'" y1="'+CY(p).toFixed(1)+'" x2="'+(CW-CR)+'" y2="'+CY(p).toFixed(1)+'" stroke="'+esc(cvar('--rule','#d8d1c2'))+'" stroke-width="1"'+(p===0?'':' stroke-dasharray="3 4"')+'/>';
        cu+='<text class="iwst-t" x="'+(CL-8)+'" y="'+(CY(p)+3.5).toFixed(1)+'" text-anchor="end">'+Math.round(p*100)+' %</text>'; });
      var dpath='M'+CX(mn).toFixed(1)+' '+CY(0).toFixed(1);
      pts.forEach(function(p){ dpath+=' L'+CX(p[0]).toFixed(1)+' '+CY(p[1]).toFixed(1); });
      cu+='<path d="'+dpath+'" fill="none" stroke="'+esc(col)+'" stroke-width="2.2" stroke-linejoin="round"/>';
      pts.forEach(function(p){ cu+='<circle cx="'+CX(p[0]).toFixed(1)+'" cy="'+CY(p[1]).toFixed(1)+'" r="2.6" fill="'+esc(col)+'"><title>'+f(p[0])+' : '+iwFrFix(p[1]*100,0)+' %</title></circle>'; });
      [[0.25,q1,'Q1'],[0.5,med,'Méd'],[0.75,q3,'Q3']].forEach(function(r){
        cu+='<path class="iwst-read" d="M'+CL+' '+CY(r[0]).toFixed(1)+' L'+CX(r[1]).toFixed(1)+' '+CY(r[0]).toFixed(1)+' L'+CX(r[1]).toFixed(1)+' '+CY(0).toFixed(1)+'" fill="none" stroke="'+esc(cvar('--gold','#c9a054'))+'" stroke-width="1.4" stroke-dasharray="5 4"/>';
        cu+='<text class="iwst-k" x="'+CX(r[1]).toFixed(1)+'" y="'+(CH-24)+'" text-anchor="middle">'+r[2]+'</text>';
        cu+='<text class="iwst-t" x="'+CX(r[1]).toFixed(1)+'" y="'+(CH-10)+'" text-anchor="middle">'+f(r[1])+'</text>'; });
      cu+='<line x1="'+CL+'" y1="'+CY(0).toFixed(1)+'" x2="'+CL+'" y2="'+CT+'" stroke="'+esc(cvar('--rule','#d8d1c2'))+'"/>';
      out+=cu+'</svg><div class="iwst-cap">Fréquences cumulées croissantes. On lit la médiane en descendant depuis 50 %.</div>'; }

    /* stem and leaf: the whole series written out, still ordered */
    if(has('stemleaf')){
      var allInt=raw.every(function(v){ return Math.abs(v-Math.round(v))<1e-9; });
      if(allInt){
        var stems={}, sk=[];
        raw.forEach(function(v){ var st=Math.floor(Math.abs(v)/10)*(v<0?-1:1), lf=Math.abs(v)%10;
          if(!stems[st]){stems[st]=[];sk.push(st);} stems[st].push(lf); });
        sk.sort(function(a,b){ return a-b; });
        out+='<table class="iwst-stem"><caption>Tige et feuilles — la tige est le chiffre des dizaines</caption><tbody>'+
          sk.map(function(st){ return '<tr><th>'+st+'</th><td>'+stems[st].sort(function(a,b){return a-b;}).join(' ')+'</td></tr>'; }).join('')+
          '</tbody></table>'; }
      else out+='<div class="iwst-cap">Le diagramme tige et feuilles demande des nombres entiers.</div>'; }

    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+out+
      (c.note?'<div class="iwst-note">'+esc(c.note)+'</div>':'');

    var why=box.querySelector('.iwst-why');
    if(why){
      var tls=box.querySelectorAll('.iwst-tile'), marks=box.querySelectorAll('[data-mk]');
      function setWhy(k){
        var w=WHY[k]; if(!w)return;
        why.innerHTML='<b>'+esc(w.t)+'</b><span>'+esc(w.d)+'</span>'+(w.c?'<i>'+esc(w.c)+'</i>':'');
        Array.prototype.forEach.call(tls,function(t){ t.classList.toggle('on',t.getAttribute('data-k')===k); });
        Array.prototype.forEach.call(marks,function(e){ e.classList.toggle('on',e.getAttribute('data-mk')===k); }); }
      why.innerHTML='<span class="iwst-hint">Survolez une mesure : elle dit ce qu’elle mesure et comment elle a été calculée.</span>';
      Array.prototype.forEach.call(tls,function(t){
        var k=t.getAttribute('data-k');
        t.addEventListener('mouseenter',function(){ setWhy(k); });
        t.addEventListener('focus',function(){ setWhy(k); });
        t.addEventListener('click',function(){ setWhy(k); }); }); }
  };
  /* ── probability tree ──
     Probabilities are kept as exact fractions, not decimals: a sixth typed as
     1/6 stays a sixth all the way down the tree, so two rolls of a die end at
     1/36 rather than 0,0278. parseFloat used to read "1/6" as 1, which made
     every fraction in the element silently wrong. */
  function ptGcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b>0.5){ var t=a%b; a=b; b=t; } return a||1; }
  function ptRat(n,d){
    if(!isFinite(n)||!isFinite(d)||d===0)return null;
    var g=ptGcd(n,d); n=n/g; d=d/g; if(d<0){ n=-n; d=-d; }
    return (Math.abs(n)<9e14&&d<9e14)?{n:n,d:d}:null; }
  function ptMul(a,b){ return (a&&b)?ptRat(a.n*b.n,a.d*b.d):null; }
  function ptAdd(a,b){ return (a&&b)?ptRat(a.n*b.d+b.n*a.d,a.d*b.d):null; }
  function ptVal(r){ return r?r.n/r.d:NaN; }
  /* "1/6", "0,5", "50 %" and ".25" all say the same kind of thing */
  function ptParse(s){
    var t=String(s==null?'':s).trim().replace(new RegExp('[ '+String.fromCharCode(0x202F)+String.fromCharCode(0xA0)+']','g'),'');
    if(!t)return null;
    var pc=false;
    if(t.charAt(t.length-1)==='%'){ pc=true; t=t.slice(0,-1); }
    t=t.replace(',','.');
    var r=null, wrote=false, i=t.indexOf('/');
    if(i>0){ var a=parseFloat(t.slice(0,i)), b=parseFloat(t.slice(i+1));
      if(isFinite(a)&&isFinite(b)&&b!==0){ r=ptRat(a,b); wrote=true; } }
    else { var v=parseFloat(t);
      if(isFinite(v)){ var dp=(t.split('.')[1]||'').length;
        r=ptRat(Math.round(v*Math.pow(10,dp)),Math.pow(10,dp)); } }
    if(!r)return null;
    if(pc)r=ptRat(r.n,r.d*100);
    return r?{r:r,wrote:wrote}:null; }
  function ptFmt(r,mode,dec){
    if(!r)return '—';
    if(mode==='fraction'){
      if(r.d===1)return String(r.n);
      return '<span class="iwpt-fr"><b>'+r.n+'</b><i>'+r.d+'</i></span>'; }
    /* iwFrNum, not iwFrFix: a probability of a half is 0,5, not 0,5000. The
       decimals setting is a ceiling for a value like a third, not a claim
       about how precisely the half was measured. */
    return iwFrNum(ptVal(r),dec,false); }

  R.probtree=function(box,c){
    box.className='iw iw-card iw-ptree';
    var raw=(c.pnodes||[]).filter(function(n){ return n&&(n.label||n.id); });
    if(!raw.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var byId={}, kids={};
    raw.forEach(function(n,i){ if(!n.id)n.id='n'+i; byId[n.id]=n; });
    raw.forEach(function(n){ var p=(n.parent&&byId[n.parent]&&n.parent!==n.id)?n.parent:'__root';
      (kids[p]=kids[p]||[]).push(n); });
    var dec=(parseInt(c.decimals,10)>=0)?parseInt(c.decimals,10):4;
    // fractions unless the author asked otherwise, or nobody typed one
    var anyFrac=false;
    raw.forEach(function(n){ var q=ptParse(n.p); if(q&&q.wrote)anyFrac=true; n._q=q?q.r:null; });
    var mode=(c.display==='decimal')?'decimal':((c.display==='fraction')?'fraction':(anyFrac?'fraction':'decimal'));
    var P=pal(), leaves=[], seen={};

    // depth-first, so the paths read top to bottom like the drawing
    function walk(n,depth,prob,trail,marked){
      if(seen[n.id]||depth>8)return; seen[n.id]=1;
      var np=n._q?ptMul(prob,n._q):prob;
      var t=trail.concat([n]);
      var mk=marked||!!n.event;
      var ch=kids[n.id]||[];
      if(!ch.length)leaves.push({node:n,path:t,p:np,event:mk});
      ch.forEach(function(k){ walk(k,depth+1,np,t,mk); }); }
    (kids.__root||[]).forEach(function(n){ walk(n,0,{n:1,d:1},[],false); });
    if(!leaves.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Aucune issue : vérifie les identifiants parents.</div>'; return; }
    leaves.forEach(function(l,i){ l.i=i; });

    function levelOf(n){ var d=0,cur=n; while(cur&&cur.parent&&byId[cur.parent]&&d<9){ cur=byId[cur.parent]; d++; } return d; }
    var maxLvl=0; raw.forEach(function(n){ maxLvl=Math.max(maxLvl,levelOf(n)); });
    var yOf={}, slot=0;
    function assign(n){ var ch=kids[n.id]||[];
      if(!ch.length){ yOf[n.id]=slot++; return; }
      ch.forEach(assign);
      yOf[n.id]=(yOf[ch[0].id]+yOf[ch[ch.length-1].id])/2; }
    (kids.__root||[]).forEach(assign);

    var pathOf={};                       // node id -> the ids from the root down to it
    raw.forEach(function(n){ var ids=[], cur=n, guard=0;
      while(cur&&guard++<10){ ids.push(cur.id); cur=byId[cur.parent]; }
      pathOf[n.id]=ids; });

    /* Branch labels are HTML over the SVG rather than SVG text: an outcome can
       be a phrase, and SVG text does not wrap. */
    /* A branch leaves from after its parent’s name, not from the dot, so the
       probability written on it has a clear run of empty space to sit in —
       the way the tree is drawn on a board. */
    // stacked fractions are twice the height of a decimal, so the forks need
    // more room between them or the two probabilities on a fork touch
    var COLW=230, LABW=88, PADL=14, ROWH=(mode==='fraction'?64:46), GAP=10;
    var X=function(l){ return PADL+(l+1)*COLW; };
    var W=X(maxLvl)+11+LABW+GAP+72;
    function draw(rowH){
      var H=Math.max(rowH*slot+26,90);
      var Y=function(n){ return 20+(yOf[n.id]+0.5)*rowH; };
      var rootY=H/2;
      var s='<svg class="iwpt-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMinYMin meet" role="img">';
      s+='<circle class="iwpt-root" cx="'+PADL+'" cy="'+rootY.toFixed(1)+'" r="4" fill="'+esc(cvar('--slate','#6b7089'))+'"/>';
      var labels='';
      raw.forEach(function(n){
        var l=levelOf(n), par=byId[n.parent];
        var x2=X(l), y2=Y(n);
        var x1=par?(X(l-1)+11+LABW+GAP):(PADL+7), y1=par?Y(par):rootY;
        var col=n.color||P[l%P.length];
        var pv=n._q?ptVal(n._q):null;
        // a likely branch is drawn thick: the picture carries the number
        var wgt=(pv!=null&&isFinite(pv))?(1.3+Math.max(0,Math.min(1,pv))*3.9):1.6;
        s+='<path class="iwpt-br" data-node="'+esc(n.id)+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' C'+((x1+x2)/2).toFixed(1)+' '+y1.toFixed(1)+' '+((x1+x2)/2).toFixed(1)+' '+y2.toFixed(1)+' '+(x2-7).toFixed(1)+' '+y2.toFixed(1)+'" fill="none" stroke="'+esc(col)+'" stroke-width="'+wgt.toFixed(2)+'" stroke-linecap="round"/>';
        s+='<circle class="iwpt-dot" data-node="'+esc(n.id)+'" cx="'+x2+'" cy="'+y2.toFixed(1)+'" r="4.5" fill="'+esc(col)+'"/>';
        // past the middle of the branch, where the fork has already opened and
        // the two probabilities of a pair are furthest apart
        if(n._q)labels+='<span class="iwpt-p" data-node="'+esc(n.id)+'" style="left:'+(x1+(x2-x1)*0.6).toFixed(1)+'px;top:'+(y1+(y2-y1)*0.72).toFixed(1)+'px">'+ptFmt(n._q,mode,dec)+'</span>';
        labels+='<span class="iwpt-lab'+(n.event?' ev':'')+'" data-node="'+esc(n.id)+'" style="left:'+(x2+11)+'px;top:'+y2.toFixed(1)+'px;width:'+LABW+'px">'+esc(n.label||n.id)+'</span>'; });
      s+='</svg>';
      // the outcome probability, printed level with each leaf
      leaves.forEach(function(l){
        labels+='<span class="iwpt-leafp" data-leaf="'+l.i+'" style="left:'+(X(maxLvl)+11+LABW+6)+'px;top:'+Y(l.node).toFixed(1)+'px">'+ptFmt(l.p,mode,dec)+'</span>'; });
      /* The stage is exactly as wide as the viewBox. Letting it stretch would
         scale the SVG while the HTML labels kept their pixel positions, and
         the two would drift apart across the width of the tree. */
      return '<div class="iwpt-stage" style="width:'+W+'px;height:'+H+'px">'+s+labels+'</div>'; }

    var total=leaves.reduce(function(a,l){ return ptAdd(a,l.p); },{n:0,d:1});
    var evP=leaves.filter(function(l){ return l.event; }).reduce(function(a,l){ return ptAdd(a,l.p); },{n:0,d:1});
    var anyEvent=leaves.some(function(l){ return l.event; });

    // every fork must total 1
    var warn='';
    Object.keys(kids).forEach(function(k){
      var sib=kids[k], tot={n:0,d:1}, any=false;
      sib.forEach(function(n){ if(n._q){ tot=ptAdd(tot,n._q); any=true; } });
      if(any&&tot&&Math.abs(ptVal(tot)-1)>0.0005){ var who=(k==='__root')?'la racine':(byId[k]?(byId[k].label||k):k);
        warn+='<div class="iwpt-warn">Les branches de <b>'+esc(who)+'</b> totalisent '+ptFmt(tot,mode,dec)+' au lieu de 1.</div>'; } });

    /* The unit bar: the whole of the probability is one length, cut into the
       outcomes. It is the one picture that shows a pupil why the paths have to
       add up to 1, and it points at the same paths as the tree. */
    var bar='';
    if(c.bar!==false){
      bar='<div class="iwpt-bar" role="img" aria-label="Répartition des issues">'+
        leaves.map(function(l){ var pv=ptVal(l.p)||0;
          var col=l.node.color||P[(l.i)%P.length];
          var nm=l.path.map(function(x){ return x.label||x.id; }).join(' '+String.fromCharCode(0x2192)+' ');
          return '<span class="iwpt-seg'+(l.event?' ev':'')+'" data-leaf="'+l.i+'" style="flex:'+Math.max(pv,0.0001)+' 0 0;background:'+esc(col)+'" title="'+esc(nm)+'"><em>'+esc(nm)+'</em></span>'; }).join('')+'</div>'+
        '<div class="iwpt-barcap">Les issues se partagent exactement 1.</div>'; }

    var tbl='';
    if(c.showPaths!==false){
      tbl='<table class="iwpt-tab"><thead><tr><th>Chemin</th><th>Calcul</th><th>Probabilité</th></tr></thead><tbody>'+
        leaves.map(function(l){
          var mult=l.path.filter(function(x){ return x._q; }).map(function(x){ return ptFmt(x._q,mode,dec); }).join(' × ');
          return '<tr data-leaf="'+l.i+'"'+(l.event?' class="ev"':'')+'><td>'+l.path.map(function(x){ return esc(x.label||x.id); }).join(' <i>' + String.fromCharCode(0x2192) + '</i> ')+'</td>'+
            '<td class="iwpt-calc">'+(mult||'—')+'</td><td class="iwpt-val">'+ptFmt(l.p,mode,dec)+'</td></tr>'; }).join('')+
        '</tbody><tfoot><tr><th>Total</th><th></th><th>'+ptFmt(total,mode,dec)+'</th></tr></tfoot></table>'; }

    var ev='';
    if(anyEvent){
      var parts=leaves.filter(function(l){ return l.event; });
      ev='<div class="iwpt-event"><b>P('+esc(c.eventLabel||'A')+')</b> = '+
        parts.map(function(l){ return ptFmt(l.p,mode,dec); }).join(' + ')+
        (parts.length>1?(' = '+ptFmt(evP,mode,dec)):'')+
        '<i>'+parts.map(function(l){ return esc(l.path.map(function(x){ return x.label||x.id; }).join(' '+String.fromCharCode(0x2192)+' ')); }).join(' · ')+'</i></div>'; }

    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwpt-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwpt-scroll">'+draw(ROWH)+'</div>'+warn+bar+ev+tbl+
      (c.note?'<div class="iwpt-note">'+esc(c.note)+'</div>':'');

    // one measured pass: if any outcome wrapped, every row gets taller
    var tallest=0;
    Array.prototype.forEach.call(box.querySelectorAll('.iwpt-lab'),function(e){ tallest=Math.max(tallest,e.offsetHeight); });
    if(tallest>ROWH-12){
      var scroll=box.querySelector('.iwpt-scroll');
      scroll.innerHTML=draw(tallest+14); }

    /* Hovering anywhere — a branch, an outcome, a bar segment, a table row —
       lights the same path everywhere else. */
    var stage=box.querySelector('.iwpt-stage');
    function light(ids,leaf){
      var on=!!ids;
      box.classList.toggle('iwpt-focus',on);
      Array.prototype.forEach.call(box.querySelectorAll('[data-node]'),function(e){
        e.classList.toggle('on',on&&ids.indexOf(e.getAttribute('data-node'))>=0); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-leaf]'),function(e){
        e.classList.toggle('on',on&&String(leaf)===e.getAttribute('data-leaf')); }); }
    function nodeEnter(id){ light(pathOf[id]||[id],null); }
    function leafEnter(i){ var l=leaves[i]; light(l.path.map(function(x){ return x.id; }),i); }
    if(stage)Array.prototype.forEach.call(stage.querySelectorAll('[data-node]'),function(e){
      e.addEventListener('mouseenter',function(){ nodeEnter(e.getAttribute('data-node')); });
      e.addEventListener('mouseleave',function(){ light(null,null); }); });
    Array.prototype.forEach.call(box.querySelectorAll('.iwpt-seg,.iwpt-tab tbody tr,.iwpt-leafp'),function(e){
      var i=+e.getAttribute('data-leaf');
      e.addEventListener('mouseenter',function(){ leafEnter(i); });
      e.addEventListener('mouseleave',function(){ light(null,null); }); });
  };
  /* ── circuit: a school schematic — one loop, optional parallel branches, and the
     usual computed totals (R equivalent, then I = U / R) ── */
  /* Component symbols. Each returns SVG for a part drawn along a horizontal wire
     from (x,y) of width w, so the layout code never has to know their shapes. */
  var IWCSYM={
    resistor:function(x,y,w){ var h=9; return '<path d="M'+x+' '+y+' h'+((w-30)/2)+' v-'+h+' h30 v'+(2*h)+' h-30 v-'+h+' h'+((w-30)/2)+'" fill="none"/>'; },
    lamp:function(x,y,w){ var r=11, cx=x+w/2; return '<path d="M'+x+' '+y+' h'+(w/2-r)+'M'+(cx+r)+' '+y+' h'+(w/2-r)+'" fill="none"/>'+
      '<circle cx="'+cx+'" cy="'+y+'" r="'+r+'" fill="none"/><path d="M'+(cx-r*0.7)+' '+(y-r*0.7)+' l'+(r*1.4)+' '+(r*1.4)+'M'+(cx+r*0.7)+' '+(y-r*0.7)+' l-'+(r*1.4)+' '+(r*1.4)+'" fill="none"/>'; },
    motor:function(x,y,w){ var r=11, cx=x+w/2; return '<path d="M'+x+' '+y+' h'+(w/2-r)+'M'+(cx+r)+' '+y+' h'+(w/2-r)+'" fill="none"/>'+
      '<circle cx="'+cx+'" cy="'+y+'" r="'+r+'" fill="none"/><text class="iwci-in" x="'+cx+'" y="'+y+'" text-anchor="middle" dominant-baseline="central">M</text>'; },
    ammeter:function(x,y,w){ var r=11, cx=x+w/2; return '<path d="M'+x+' '+y+' h'+(w/2-r)+'M'+(cx+r)+' '+y+' h'+(w/2-r)+'" fill="none"/>'+
      '<circle cx="'+cx+'" cy="'+y+'" r="'+r+'" fill="none"/><text class="iwci-in" x="'+cx+'" y="'+y+'" text-anchor="middle" dominant-baseline="central">A</text>'; },
    voltmeter:function(x,y,w){ var r=11, cx=x+w/2; return '<path d="M'+x+' '+y+' h'+(w/2-r)+'M'+(cx+r)+' '+y+' h'+(w/2-r)+'" fill="none"/>'+
      '<circle cx="'+cx+'" cy="'+y+'" r="'+r+'" fill="none"/><text class="iwci-in" x="'+cx+'" y="'+y+'" text-anchor="middle" dominant-baseline="central">V</text>'; },
    switch:function(x,y,w,open){ var a=x+(w-28)/2, b=a+28;
      return '<path d="M'+x+' '+y+' h'+((w-28)/2)+'M'+b+' '+y+' h'+((w-28)/2)+'" fill="none"/>'+
        '<circle cx="'+a+'" cy="'+y+'" r="2.6"/><circle cx="'+b+'" cy="'+y+'" r="2.6"/>'+
        '<path d="M'+a+' '+y+' L'+(open===false?b:(b-3))+' '+(open===false?y:(y-13))+'" fill="none"/>'; },
    // condensateur — two plates with a gap; blocks DC once charged
    capacitor:function(x,y,w){ var g=5, cx=x+w/2, hh=12;
      return '<path d="M'+x+' '+y+' h'+(w/2-g)+'M'+(cx+g)+' '+y+' h'+(w/2-g)+'" fill="none"/>'+
        '<path d="M'+(cx-g)+' '+(y-hh)+' V'+(y+hh)+'M'+(cx+g)+' '+(y-hh)+' V'+(y+hh)+'" fill="none"/>'; },
    // bobine — four half-turns; a short circuit in DC steady state
    coil:function(x,y,w){ var n=4, d=13, x0=x+(w-n*d)/2, p='M'+x+' '+y+' h'+((w-n*d)/2), i;
      for(i=0;i<n;i++)p+=' a'+(d/2)+' '+(d/2)+' 0 0 1 '+d+' 0';
      return '<path d="'+p+' h'+((w-n*d)/2)+'" fill="none"/>'; },
    diode:function(x,y,w){ var h=10, cx=x+w/2;
      return '<path d="M'+x+' '+y+' h'+(w/2-h)+'M'+(cx+h)+' '+y+' h'+(w/2-h)+'" fill="none"/>'+
        '<path d="M'+(cx-h)+' '+(y-h)+' L'+(cx+h)+' '+y+' L'+(cx-h)+' '+(y+h)+' Z"/>'+
        '<path d="M'+(cx+h)+' '+(y-h)+' V'+(y+h)+'" fill="none"/>'; },
    fuse:function(x,y,w){ var hw=17, hh=8, cx=x+w/2;
      return '<path d="M'+x+' '+y+' h'+(w/2-hw)+'M'+(cx+hw)+' '+y+' h'+(w/2-hw)+'" fill="none"/>'+
        '<rect x="'+(cx-hw)+'" y="'+(y-hh)+'" width="'+(hw*2)+'" height="'+(hh*2)+'" rx="2" fill="none"/>'+
        '<path d="M'+(cx-hw)+' '+y+' h'+(hw*2)+'" fill="none"/>'; },
    wire:function(x,y,w){ return '<path d="M'+x+' '+y+' h'+w+'" fill="none"/>'; }
  };
  var IWCOHM={resistor:1,lamp:1};             // the only parts that carry a resistance
  var IWCNAME={resistor:'Ω',lamp:'Ω',capacitor:'F',coil:'H'};
  R.circuit=function(box,c){
    box.className='iw iw-card iw-circ';
    var els=(c.elements||[]).filter(function(e){ return e&&(e.kind||e.parallel); });
    var src=c.source||{kind:'battery',label:'E',value:''};
    // ── resistance maths: only ohmic parts count, and only when numeric ──
    var hasCap=false;
    function scan(list){ (list||[]).forEach(function(e){ if(!e)return;
      if(e.kind==='capacitor')hasCap=true;
      if(e.parallel)e.parallel.forEach(scan); }); }
    scan(els);
    function ohms(e){ var v=parseFloat(String(e&&e.value).replace(',','.')); return (e&&IWCOHM[e.kind]&&!isNaN(v)&&v>0)?v:null; }
    function seriesR(list){ var tot=0, ok=list.length>0;
      list.forEach(function(e){ if(e.parallel){ var pr=parallelR(e.parallel); if(pr==null)ok=false; else tot+=pr; }
        else { var r=ohms(e); if(r==null){ if(IWCOHM[e.kind])ok=false; } else tot+=r; } });
      return ok?tot:null; }
    function parallelR(branches){ var inv=0, ok=true;
      branches.forEach(function(br){ var r=seriesR(br||[]); if(r==null||r<=0){ok=false;return;} inv+=1/r; });
      return (ok&&inv>0)?1/inv:null; }
    var Rtot=seriesR(els), U=parseFloat(String(src.value).replace(',','.')), I=(Rtot!=null&&Rtot>0&&!isNaN(U))?U/Rtot:null;
    function lbOf(e){ return (e.label||'')+(e.value?' — '+e.value+(IWCNAME[e.kind]?' '+IWCNAME[e.kind]:''):''); }
    // ── layout ──────────────────────────────────────────────────────────
    // Everything is derived from the content: the old fixed box pushed the source
    // label off the left edge (it started at x = -26) and let a lower branch's
    // label land on top of the branch above it.
    var CH=6.5;                                  // approx width of one 11px mono char
    var SLOT=112, GAP=54, PADT=10, PADB=34, PADR=26, LEFT=40;
    var slots=els.length||1;
    var maxBr=1;
    els.forEach(function(e){ if(e.parallel&&e.parallel.length)maxBr=Math.max(maxBr,e.parallel.length); });
    var spread=(maxBr-1)*GAP/2;                  // how far branches reach above/below the rail
    var TOP=PADT+spread+30;                      // 30 = one label row above the topmost branch
    var BOT=Math.max(TOP+128, TOP+spread+96);
    var RIGHT=LEFT+slots*SLOT, H=BOT+PADB, W=RIGHT+PADR;
    var midY=(TOP+BOT)/2;
    var s='<svg class="iwci-svg" viewBox="0 0 '+W+' '+H+'" role="img"><g class="iwci-g">';
    // left rail, broken for the source
    s+='<path d="M'+LEFT+' '+TOP+' V'+(midY-17)+'M'+LEFT+' '+(midY+17)+' V'+BOT+'" fill="none"/>';
    s+='<path d="M'+(LEFT-13)+' '+(midY-9)+' h26M'+(LEFT-7)+' '+(midY-3)+' h14M'+(LEFT-13)+' '+(midY+5)+' h26M'+(LEFT-7)+' '+(midY+11)+' h14" fill="none"/>';
    // the source label sits INSIDE the loop, to the right of the plates — the loop
    // is empty there, and nothing can ever be clipped by the left edge again
    s+='<text class="iwci-lb" x="'+(LEFT+16)+'" y="'+midY+'" dominant-baseline="central">'+
      esc(src.label||'E')+(src.value?' — '+esc(src.value)+(isNaN(U)?'':' V'):'')+'</text>';
    s+='<text class="iwci-sg" x="'+(LEFT-19)+'" y="'+(midY-13)+'" text-anchor="middle">+</text>';
    s+='<text class="iwci-sg" x="'+(LEFT-19)+'" y="'+(midY+17)+'" text-anchor="middle">−</text>';
    // bottom and right rails
    s+='<path d="M'+LEFT+' '+BOT+' H'+RIGHT+'M'+RIGHT+' '+BOT+' V'+TOP+'" fill="none"/>';
    // conventional current: out of +, along the top, back along the bottom
    if(c.showCurrent!==false){ var ax=(LEFT+RIGHT)/2;
      s+='<path d="M'+(ax+11)+' '+BOT+' l11 -5 v10 Z" transform="rotate(180 '+(ax+16)+' '+BOT+')"/>'+
        '<text class="iwci-i" x="'+(ax+16)+'" y="'+(BOT+19)+'" text-anchor="middle">I</text>'; }
    els.forEach(function(e,i){ var x=LEFT+i*SLOT, w=SLOT;
      if(e.parallel&&e.parallel.length){
        var brs=e.parallel, n=brs.length, y0=TOP-((n-1)*GAP)/2;
        s+='<path d="M'+x+' '+TOP+' h14M'+(x+w-14)+' '+TOP+' h14" fill="none"/>';
        s+='<path d="M'+(x+14)+' '+y0+' V'+(y0+(n-1)*GAP)+'M'+(x+w-14)+' '+y0+' V'+(y0+(n-1)*GAP)+'" fill="none"/>';
        brs.forEach(function(br,bi){ var by=y0+bi*GAP, inner=(br||[]).filter(function(z){return z&&z.kind;});
          var iw=(w-28)/(inner.length||1);
          if(!inner.length)s+=IWCSYM.wire(x+14,by,w-28);
          inner.forEach(function(z,zi){ var zx=x+14+zi*iw;
            s+=(IWCSYM[z.kind]||IWCSYM.wire)(zx,by,iw,z.open);
            var t=lbOf(z);
            // each branch label rides above ITS OWN wire; GAP is wide enough that it
            // clears the symbol of the branch above by ~16px
            if(t)s+='<text class="iwci-lb" x="'+(zx+iw/2)+'" y="'+(by-17)+'" text-anchor="middle">'+esc(t)+'</text>'; }); });
      } else {
        s+=(IWCSYM[e.kind]||IWCSYM.wire)(x,TOP,w,e.open);
        var t2=lbOf(e);
        if(t2)s+='<text class="iwci-lb" x="'+(x+w/2)+'" y="'+(TOP-20)+'" text-anchor="middle">'+esc(t2)+'</text>'; }
    });
    s+='</g></svg>';
    var calc='';
    if(c.compute!==false){
      var bits=[];
      if(Rtot!=null)bits.push('<span><em>R</em><sub>éq</sub> = '+iwFmt(Rtot,2)+' Ω</span>');
      if(!isNaN(U))bits.push('<span><em>U</em> = '+iwFmt(U,2)+' V</span>');
      // a charged capacitor blocks direct current, whatever the resistances say
      if(hasCap)bits.push('<span class="iwci-hint">Régime permanent : le condensateur est chargé, <em>I</em> = 0</span>');
      else if(I!=null)bits.push('<span><em>I</em> = U / R<sub>éq</sub> = '+iwFmt(I,3)+' A</span>');
      else if(Rtot==null)bits.push('<span class="iwci-hint">Donne une valeur à chaque résistance pour obtenir I</span>');
      if(bits.length)calc='<div class="iwci-calc">'+bits.join('')+'</div>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwci-scroll">'+s+'</div>'+calc+
      (c.note?'<div class="iwci-note">'+esc(c.note)+'</div>':'');
  };

  /* ── molecule: a flat structural formula — atoms on a grid joined by 1/2/3 bonds ── */
  var IWATOMCOL={H:'#8d99ae',C:'#3d4663',N:'#4a6fa5',O:'#c0392b',S:'#c9a054',P:'#d97706',
    F:'#2e7d32',Cl:'#2e7d32',Br:'#8b4513',I:'#6b3fa0',Na:'#a855c7',K:'#a855c7',Ca:'#5fa39b',Mg:'#5fa39b'};
  R.molecule=function(box,c){
    box.className='iw iw-card iw-mol';
    var atoms={}, ord=[];
    (c.atoms||[]).forEach(function(a,i){ if(!a||!a.el)return; var id=a.id||('a'+(i+1));
      atoms[id]={id:id,el:a.el,x:parseFloat(a.x)||0,y:parseFloat(a.y)||0,charge:a.charge||'',lone:parseInt(a.lone,10)||0,color:a.color||''};
      ord.push(id); });
    if(!ord.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins un atome.</div>'; return; }
    var bonds=(c.bonds||[]).filter(function(b){ return b&&atoms[b.a]&&atoms[b.b]; });
    var xs=ord.map(function(k){return atoms[k].x;}), ys=ord.map(function(k){return atoms[k].y;});
    var x0=Math.min.apply(null,xs)-1, x1=Math.max.apply(null,xs)+1, y0=Math.min.apply(null,ys)-1, y1=Math.max.apply(null,ys)+1;
    var U=parseFloat(c.spacing)||54;
    var W=(x1-x0)*U, H=(y1-y0)*U;
    var X=function(x){ return (x-x0)*U; }, Y=function(y){ return H-(y-y0)*U; };
    var R0=Math.max(12,U*0.30);   // clear radius around a label so bonds stop short
    var s='<svg class="iwmol-svg" viewBox="0 0 '+W.toFixed(1)+' '+H.toFixed(1)+'" role="img">';
    bonds.forEach(function(b){ var A=atoms[b.a], B=atoms[b.b];
      var ax=X(A.x), ay=Y(A.y), bx=X(B.x), by=Y(B.y);
      var dx=bx-ax, dy=by-ay, L=Math.sqrt(dx*dx+dy*dy)||1, ux=dx/L, uy=dy/L;
      var sx=ax+ux*R0, sy=ay+uy*R0, ex=bx-ux*R0, ey=by-uy*R0;
      var px=-uy, py=ux, n=Math.max(1,Math.min(3,parseInt(b.order,10)||1)), gap=4.2;
      for(var k=0;k<n;k++){ var off=(k-(n-1)/2)*gap;
        s+='<line x1="'+(sx+px*off).toFixed(1)+'" y1="'+(sy+py*off).toFixed(1)+'" x2="'+(ex+px*off).toFixed(1)+'" y2="'+(ey+py*off).toFixed(1)+'" stroke="'+esc(b.color||cvar('--ink','#1a2238'))+'" stroke-width="2" stroke-linecap="round"/>'; }
      if(b.label)s+='<text class="iwmol-bl" x="'+((sx+ex)/2+px*11).toFixed(1)+'" y="'+((sy+ey)/2+py*11).toFixed(1)+'" text-anchor="middle" dominant-baseline="central">'+esc(b.label)+'</text>'; });
    ord.forEach(function(id){ var a=atoms[id], x=X(a.x), y=Y(a.y);
      s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(R0*0.92).toFixed(1)+'" class="iwmol-bg"/>';
      s+='<text class="iwmol-el" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" dominant-baseline="central" fill="'+esc(a.color||IWATOMCOL[a.el]||cvar('--ink','#1a2238'))+'">'+esc(a.el)+'</text>';
      if(a.charge)s+='<text class="iwmol-ch" x="'+(x+R0*0.85).toFixed(1)+'" y="'+(y-R0*0.7).toFixed(1)+'" text-anchor="middle">'+esc(a.charge)+'</text>';
      // lone pairs ride around the atom, two dots per pair
      for(var k2=0;k2<a.lone;k2++){ var ang=(-90+k2*90)*Math.PI/180, rr=R0*1.25;
        var cxp=x+Math.cos(ang)*rr, cyp=y+Math.sin(ang)*rr, tx=-Math.sin(ang)*3.6, ty=Math.cos(ang)*3.6;
        s+='<circle cx="'+(cxp+tx).toFixed(1)+'" cy="'+(cyp+ty).toFixed(1)+'" r="1.9" class="iwmol-lp"/>'+
           '<circle cx="'+(cxp-tx).toFixed(1)+'" cy="'+(cyp-ty).toFixed(1)+'" r="1.9" class="iwmol-lp"/>'; } });
    s+='</svg>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwmol-wrap">'+s+'</div>'+
      (c.caption?'<div class="iwmol-cap">'+esc(c.caption)+'</div>':'');
  };

  /* ── scale: an annotated measurement strip (pH, Richter, Mohs, spectrum…) ── */
  R.scale=function(box,c){
    box.className='iw iw-card iw-scale';
    var P=pal();
    var lo=parseFloat(c.min), hi=parseFloat(c.max);
    if(isNaN(lo))lo=0; if(isNaN(hi))hi=14; if(hi<=lo)hi=lo+1;
    var logMode=!!c.log&&lo>0;
    var pos=function(v){ var t=logMode?(Math.log(v/lo)/Math.log(hi/lo)):((v-lo)/(hi-lo));
      return Math.max(0,Math.min(100,t*100)); };
    var zones=(c.zones||[]).filter(function(z){ return z&&!isNaN(parseFloat(z.from))&&!isNaN(parseFloat(z.to)); });
    var marks=(c.marks||[]).filter(function(m){ return m&&!isNaN(parseFloat(m.at)); });
    var bar=zones.map(function(z,i){ var a=pos(parseFloat(z.from)), b=pos(parseFloat(z.to));
      var x=Math.min(a,b), w=Math.abs(b-a);
      return '<span class="iwsc-zone"'+(z.label?' title="'+esc(z.label)+'"':'')+
        ' style="left:'+x+'%;width:'+w+'%;background:'+esc(z.color||P[i%P.length])+'">'+
        (z.label?'<b>'+esc(z.label)+'</b>':'')+'</span>'; }).join('');
    var step=parseFloat(c.tickStep);
    var ticks='';
    if(!logMode&&step>0){ for(var v=Math.ceil(lo/step)*step; v<=hi+1e-9; v+=step){
      var vv=Math.round(v*1e6)/1e6;
      ticks+='<span class="iwsc-tick" style="left:'+pos(vv)+'%"><i></i><b>'+vv+'</b></span>'; } }
    else if(logMode){ for(var e=Math.ceil(Math.log(lo)/Math.LN10); Math.pow(10,e)<=hi*1.0000001; e++){
      var pv=Math.pow(10,e); ticks+='<span class="iwsc-tick" style="left:'+pos(pv)+'%"><i></i><b>10<sup>'+e+'</sup></b></span>'; } }
    var pins=marks.map(function(m,i){ return '<button type="button" class="iwsc-mark" data-m="'+i+'" style="left:'+pos(parseFloat(m.at))+'%">'+
      '<span class="iwsc-mv">'+esc(m.label||m.at)+'</span><i></i></button>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwsc-wrap"><div class="iwsc-marks">'+pins+'</div>'+
      '<div class="iwsc-bar">'+(bar||'<span class="iwsc-zone iwsc-plain" style="left:0;width:100%"></span>')+'</div>'+
      '<div class="iwsc-axis">'+ticks+'</div></div>'+
      (c.unit?'<div class="iwsc-unit">'+esc(c.unit)+'</div>':'')+
      '<div class="iwsc-detail" data-det></div>'+(c.note?'<div class="iwsc-note">'+esc(c.note)+'</div>':'');
    /* Two marks close together on the scale used to print their labels on top
       of one another. Stack them instead: a label that would touch one already
       placed goes on the row above, and the strip grows to suit. The pin itself
       stays exactly where the value is. */
    var strip=box.querySelector('.iwsc-marks');
    function stackMarks(){
      if(!strip.clientWidth)return;
      var pins2=[].slice.call(strip.querySelectorAll('.iwsc-mark'));
      if(!pins2.length)return;
      var ROW=20, rows=[];
      pins2.map(function(p){ return {el:p,c:p.offsetLeft,w:p.offsetWidth}; })
        .sort(function(a,b){ return a.c-b.c; })
        .forEach(function(it){
          var l=it.c-it.w/2, r=it.c+it.w/2, k=0;
          while(true){ rows[k]=rows[k]||[]; var hit=false, q;
            for(q=0;q<rows[k].length;q++){ if(l<rows[k][q][1]+6&&r>rows[k][q][0]-6){ hit=true; break; } }
            if(!hit)break; k++; if(k>pins2.length)break; }
          rows[k].push([l,r]);
          it.el.style.setProperty('--mrow',k); });
      strip.style.height=(14+rows.length*ROW)+'px';
    }
    iwWatch(strip,stackMarks);


    var det=box.querySelector('[data-det]');
    box.querySelectorAll('[data-m]').forEach(function(b){ b.addEventListener('click',function(){
      var m=marks[+b.getAttribute('data-m')];
      box.querySelectorAll('[data-m]').forEach(function(x){ x.classList.toggle('on',x===b); });
      if(!m||!m.desc)return;
      det.innerHTML='<b>'+esc(m.label||'')+'</b> <span>'+esc(String(m.at))+(c.unit?' '+esc(c.unit):'')+'</span><div>'+esc(m.desc)+'</div>'; }); });
  };

  /* ── cycle: a closed circular process (water cycle, rock cycle, cardiac cycle) ── */
  R.cycle=function(box,c){
    box.className='iw iw-card iw-cycle';
    var steps=(c.steps||[]).filter(function(s){ return s&&(s.label||s.desc); });
    if(!steps.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var P=pal(), n=steps.length, dir=(c.direction==='counter')?-1:1;
    // A 150x100 canvas (not a square) so the labels flanking the ring have somewhere
    // to go; SVG units and HTML label percentages share these coordinates.
    var VW=150, VH=100, CX=75, CY=50, RING=24, NODE=n>8?4.4:5.5, LABR=31;
    function ang(i){ return (-90 + dir*i*360/n) * Math.PI/180; }
    function ptAt(a,r){ return [CX+r*Math.cos(a), CY+r*Math.sin(a)]; }
    var s='<svg class="iwcy-svg" viewBox="0 0 '+VW+' '+VH+'" aria-hidden="true">';
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+RING+'" fill="none" stroke="'+esc(cvar('--rule','#d8d1c2'))+'" stroke-width="0.7"/>';
    // one arc per gap, so the direction of the process is unmistakable
    for(var i=0;i<n;i++){
      var a1=ang(i), a2=ang(i+1), gap=(NODE+2.4)/RING;
      var s1=a1+dir*gap, s2=a2-dir*gap;
      var p1=ptAt(s1,RING), p2=ptAt(s2,RING);
      var sweep=(dir>0)?1:0;
      var col=steps[i].color||P[i%P.length];
      s+='<path d="M'+p1[0].toFixed(2)+' '+p1[1].toFixed(2)+' A'+RING+' '+RING+' 0 0 '+sweep+' '+p2[0].toFixed(2)+' '+p2[1].toFixed(2)+'" fill="none" stroke="'+esc(col)+'" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>';
      // arrowhead, tangent to the ring at the arc's end
      var tx=-Math.sin(s2)*dir, ty=Math.cos(s2)*dir, hw=1.7, hl=2.9;
      s+='<path d="M'+p2[0].toFixed(2)+' '+p2[1].toFixed(2)
        +' L'+(p2[0]-tx*hl-(-ty)*hw).toFixed(2)+' '+(p2[1]-ty*hl-(tx)*hw).toFixed(2)
        +' L'+(p2[0]-tx*hl+(-ty)*hw).toFixed(2)+' '+(p2[1]-ty*hl+(tx)*hw).toFixed(2)
        +' Z" fill="'+esc(col)+'" opacity=".85"/>'; }
    steps.forEach(function(st,i){ var p=ptAt(ang(i),RING), col=st.color||P[i%P.length];
      s+='<circle class="iwcy-node" data-i="'+i+'" cx="'+p[0].toFixed(2)+'" cy="'+p[1].toFixed(2)+'" r="'+NODE+'" fill="'+esc(col)+'"/>';
      s+='<text class="iwcy-num" x="'+p[0].toFixed(2)+'" y="'+p[1].toFixed(2)+'" text-anchor="middle" dominant-baseline="central" style="font-size:'+(NODE*0.95)+'px">'+(i+1)+'</text>'; });
    if(c.center)s+='<text class="iwcy-c" x="'+CX+'" y="'+CY+'" text-anchor="middle" dominant-baseline="central">'+esc(c.center)+'</text>';
    s+='</svg>';
    // Labels sit outside the ring. A centred label on the left or right would sit
    // on top of its node, so those anchor by their inner edge instead.
    var labs=steps.map(function(st,i){ var a=ang(i), cs=Math.cos(a);
      // a label above or below its node is centred on the node's axis, so it needs
      // extra clearance for half its own height; side labels don't
      var p=ptAt(a, LABR + Math.abs(Math.sin(a))*5.5);
      var tx='-50%', al='center';
      if(cs>0.34){ tx='0'; al='left'; } else if(cs<-0.34){ tx='-100%'; al='right'; }
      return '<button type="button" class="iwcy-lab" data-i="'+i+'" style="left:'+(p[0]/VW*100).toFixed(2)+'%;top:'+(p[1]/VH*100).toFixed(2)+
        '%;transform:translate('+tx+',-50%);text-align:'+al+'">'+esc(st.label||('Étape '+(i+1)))+'</button>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwcy-wrap">'+s+labs+'</div><div class="iwcy-detail" data-det></div>';
    var det=box.querySelector('[data-det]');
    function show(i){ var st=steps[i]; if(!st)return;
      box.querySelectorAll('.iwcy-lab,.iwcy-node').forEach(function(e){ e.classList.toggle('on',+e.getAttribute('data-i')===i); });
      det.innerHTML='<div class="iwcy-d-h"><i style="background:'+esc(st.color||P[i%P.length])+'">'+(i+1)+'</i>'+esc(st.label||'')+'</div>'+
        (st.img?'<img class="iwcy-d-img" src="'+esc(st.img)+'" alt="" loading="lazy">':'')+
        (st.desc?'<div class="iwcy-d-b">'+esc(st.desc)+'</div>':''); }
    box.querySelectorAll('[data-i]').forEach(function(e){ e.addEventListener('click',function(){ show(+e.getAttribute('data-i')); }); });
    if(steps.some(function(s2){return s2.desc||s2.img;}))show(0);
  };

  /* ── lab card: the practical-work protocol (objective → materials → steps → conclusion) ── */
  R.labcard=function(box,c){
    box.className='iw iw-card iw-lab';
    if(c.accent)box.style.setProperty('--ilab-accent',c.accent);
    var meta=[['Durée',c.duration],['Niveau',c.level],['Groupe',c.group]].filter(function(m){return m[1];})
      .map(function(m){ return '<span class="ilab-meta"><em>'+m[0]+'</em>'+esc(m[1])+'</span>'; }).join('');
    var mats=(c.materials||[]).filter(function(x){return String(x||'').trim();});
    var steps=(c.protocol||c.steps||[]).filter(function(s){ return s&&(typeof s==='string'?s.trim():(s.text||s.img)); })
      .map(function(s){ return typeof s==='string'?{text:s}:s; });
    var safety=(c.safety||[]).filter(function(x){return String(x||'').trim();});
    function sect(t,inner,cls){ return inner?'<section class="ilab-s'+(cls?' '+cls:'')+'"><h4>'+esc(t)+'</h4>'+inner+'</section>':''; }
    var h='<div class="ilab-head">'+(c.kicker?'<div class="ilab-kick">'+esc(c.kicker)+'</div>':'')+
      '<h3 class="ilab-title">'+esc(c.title||'')+'</h3>'+(meta?'<div class="ilab-metas">'+meta+'</div>':'')+'</div>';
    h+=sect(c.objectiveLabel||'Objectif', c.objective?'<p>'+esc(c.objective)+'</p>':'');
    h+=sect(c.hypothesisLabel||'Hypothèse', c.hypothesis?'<p>'+esc(c.hypothesis)+'</p>':'');
    /* The fair test. Naming what you change, what you measure and what you hold
       still is the whole of experimental design at school level, and it is the
       one part a protocol usually leaves implicit. Shown as three columns so
       the reader can see that exactly one thing is being changed. */
    var vars=[['Ce que je fais varier',c.independent],['Ce que je mesure',c.dependent],
      ['Ce que je garde constant',c.controlled]].filter(function(v){ return v[1]; });
    h+=sect(c.variablesLabel||'Le test équitable', vars.length?'<div class="ilab-vars">'+
      vars.map(function(v){ return '<div><em>'+esc(v[0])+'</em>'+
        iwLines(v[1]).map(function(t){ return '<span>'+esc(t)+'</span>'; }).join('')+'</div>'; }).join('')+
      '</div>':'');
    h+=sect(c.materialsLabel||'Matériel', mats.length?'<ul class="ilab-mats">'+mats.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul>':'');
    h+=sect(c.safetyLabel||'Sécurité', safety.length?'<ul class="ilab-safe">'+safety.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul>':'', 'ilab-danger');
    h+=sect(c.stepsLabel||'Protocole', steps.length?'<ol class="ilab-steps">'+steps.map(function(s){
      return '<li>'+(s.img?'<img src="'+esc(s.img)+'" alt="" loading="lazy">':'')+'<span>'+esc(s.text||'')+'</span></li>'; }).join('')+'</ol>':'');
    h+=sect(c.observationsLabel||'Observations', c.observations?'<p>'+esc(c.observations)+'</p>':'');
    h+=sect(c.conclusionLabel||'Conclusion', c.conclusion?'<p>'+esc(c.conclusion)+'</p>':'');
    box.innerHTML=h;
  };

  /* ── data table: students type measurements, computed columns + stats recompute ── */
  R.datatable=function(box,c){
    box.className='iw iw-card iw-dtab';
    var cols=(c.cols||[]).filter(function(x){ return x&&(x.name||x.formula); });
    if(!cols.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var nRows=Math.max(1,parseInt(c.rows,10)||((c.data&&c.data.length)||5));
    var data=[]; for(var r=0;r<nRows;r++){ data.push((c.data&&c.data[r])?c.data[r].slice():[]); }
    // a column with a formula is derived from the others by their variable name
    var comp=cols.map(function(col){ return col.formula?iwCompile(col.formula):null; });
    var stats=(c.stats||[]).filter(function(s){ return ['mean','sum','min','max','count'].indexOf(s)>=0; });
    var STATN={mean:'Moyenne',sum:'Somme',min:'Min',max:'Max',count:'N'};
    var head=cols.map(function(col){ return '<th'+(col.formula?' class="iwdt-calc"':'')+'>'+esc(col.name||'')+
      (col.unit?'<em>'+esc(col.unit)+'</em>':'')+(col.formula?'<i title="Calculé automatiquement">= '+esc(col.formula)+'</i>':'')+'</th>'; }).join('');
    var body='';
    for(var i=0;i<nRows;i++){ body+='<tr>'+cols.map(function(col,j){
      if(col.formula)return '<td class="iwdt-calc" data-out="'+i+'-'+j+'">—</td>';
      var v=(data[i]&&data[i][j]!=null)?data[i][j]:'';
      return '<td><input type="text" inputmode="decimal" data-in="'+i+'-'+j+'" value="'+esc(v)+'" aria-label="'+esc((col.name||'')+' ligne '+(i+1))+'"></td>'; }).join('')+'</tr>'; }
    var foot=stats.map(function(st){ return '<tr class="iwdt-stat"><th>'+esc(STATN[st])+'</th>'+
      cols.slice(1).map(function(col,j){ return '<td data-st="'+st+'-'+(j+1)+'">—</td>'; }).join('')+'</tr>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<p class="iwdt-intro">'+esc(c.intro)+'</p>':'')+
      '<div class="iwdt-scroll"><table class="iwdt"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody>'+
      (foot?'<tfoot>'+foot+'</tfoot>':'')+'</table></div>'+
      (c.note?'<div class="iwdt-note">'+esc(c.note)+'</div>':'');
    function rowScope(i){ var sc={}; cols.forEach(function(col,j){ if(col.formula||!col.name)return;
      var el2=box.querySelector('[data-in="'+i+'-'+j+'"]'); var v=parseFloat(el2?el2.value:''); sc[col.name]=isNaN(v)?NaN:v; }); return sc; }
    function recalc(){
      var colVals=cols.map(function(){ return []; });
      for(var i=0;i<nRows;i++){ var sc=rowScope(i);
        cols.forEach(function(col,j){
          var v;
          if(col.formula){ v=comp[j]?comp[j](sc):NaN;
            var cell=box.querySelector('[data-out="'+i+'-'+j+'"]');
            if(cell)cell.textContent=isFinite(v)?iwFmt(v,col.decimals):'—'; }
          else { var el3=box.querySelector('[data-in="'+i+'-'+j+'"]'); v=parseFloat(el3?el3.value:''); }
          if(isFinite(v))colVals[j].push(v); }); }
      stats.forEach(function(st){ cols.forEach(function(col,j){ if(j===0)return;
        var cell=box.querySelector('[data-st="'+st+'-'+j+'"]'); if(!cell)return;
        var a=colVals[j]; if(!a.length){ cell.textContent='—'; return; }
        var v; if(st==='mean')v=a.reduce(function(x,y){return x+y;},0)/a.length;
        else if(st==='sum')v=a.reduce(function(x,y){return x+y;},0);
        else if(st==='min')v=Math.min.apply(null,a); else if(st==='max')v=Math.max.apply(null,a);
        else v=a.length;
        cell.textContent=iwFmt(v,st==='count'?0:col.decimals); }); });
    }
    box.querySelectorAll('[data-in]').forEach(function(inp){ inp.addEventListener('input',recalc); });
    recalc();
  };

  /* ── chemical reaction: real formulas, live atom balance, optional "balance it" quiz ── */
  // H2SO4 → H<sub>2</sub>SO<sub>4</sub> ; Ca^2+ → Ca<sup>2+</sup>
  function iwChem(f){
    var parts=String(f||'').split('^');
    // no backslash escapes here: this source is itself inside a template literal,
    // so an escaped "]" would be unescaped twice and break the character class
    var body=esc(parts[0]).replace(new RegExp('([A-Za-z)])([0-9]+)','g'),'$1<sub>$2</sub>');
    var chg=parts[1]?'<sup>'+esc(parts[1])+'</sup>':'';
    return body+chg; }
  // count atoms in one species, honouring groups: Ca(OH)2, Al2(SO4)3
  function iwAtoms(f,coef){
    f=String(f||'').split('^')[0]; var out={}, mult=coef||1;
    function add(sym,k){ out[sym]=(out[sym]||0)+k; }
    function walk(str,factor){
      var i=0;
      while(i<str.length){
        var ch=str.charAt(i);
        if(ch==='('||ch==='['){ var depth=1,j=i+1;
          while(j<str.length&&depth>0){ var d=str.charAt(j); if(d==='('||d==='[')depth++; else if(d===')'||d===']')depth--; j++; }
          var innerS=str.slice(i+1,j-1), k=j, num='';
          while(k<str.length&&str.charAt(k)>='0'&&str.charAt(k)<='9'){ num+=str.charAt(k); k++; }
          walk(innerS,factor*(parseInt(num,10)||1)); i=k; continue; }
        if(ch>='A'&&ch<='Z'){ var sym=ch, m=i+1;
          while(m<str.length&&str.charAt(m)>='a'&&str.charAt(m)<='z'){ sym+=str.charAt(m); m++; }
          var nm=''; while(m<str.length&&str.charAt(m)>='0'&&str.charAt(m)<='9'){ nm+=str.charAt(m); m++; }
          add(sym,factor*(parseInt(nm,10)||1)); i=m; continue; }
        i++; } }
    walk(f,mult); return out; }
  var IWARROW={'->':'→','<->':'⇄','<=>':'⇌','=':'→'};
  R.reaction=function(box,c){
    box.className='iw iw-card iw-rxn';
    var L=(c.left||[]).filter(function(s){return s&&s.formula;});
    var Rr=(c.right||[]).filter(function(s){return s&&s.formula;});
    if(!L.length&&!Rr.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var quiz=!!c.quiz;
    function side(list,key){ return list.map(function(sp,i){
      var coef=(sp.coef==null||sp.coef==='')?1:sp.coef;
      var cf = quiz
        ? '<input class="iwrx-coef" type="text" inputmode="numeric" data-coef="'+key+'-'+i+'" value="" aria-label="Coefficient">'
        : (String(coef)==='1'?'':'<span class="iwrx-c">'+esc(coef)+'</span>');
      return '<span class="iwrx-sp">'+cf+'<span class="iwrx-f">'+iwChem(sp.formula)+'</span>'+
        (sp.state?'<span class="iwrx-st">('+esc(sp.state)+')</span>':'')+'</span>'; }).join('<span class="iwrx-plus">+</span>'); }
    var arrow=IWARROW[c.arrow||'->']||IWARROW['->'];
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwrx-eq">'+side(L,'l')+
      '<span class="iwrx-arrow">'+(c.conditions?'<em>'+esc(c.conditions)+'</em>':'')+arrow+'</span>'+
      side(Rr,'r')+'</div>'+
      '<div class="iwrx-bal" data-bal></div>'+
      (quiz?'<div class="iwrx-actions"><button type="button" class="iw-btn" data-rx="check">'+T('check','Vérifier')+'</button><button type="button" class="iwm-qbtn" data-rx="show">'+T('show','Montrer')+'</button><button type="button" class="iwm-qbtn" data-rx="reset">'+T('clear','Effacer')+'</button></div>':'')+
      (c.note?'<div class="iwrx-note">'+esc(c.note)+'</div>':'');
    var bal=box.querySelector('[data-bal]');
    function coefOf(list,key,i){
      if(quiz){ var inp=box.querySelector('[data-coef="'+key+'-'+i+'"]'); var v=parseInt(inp?inp.value:'',10); return isNaN(v)?null:v; }
      var cv=parseInt(list[i].coef,10); return isNaN(cv)?1:cv; }
    function tally(){
      var a={}, b={}, missing=false;
      L.forEach(function(sp,i){ var k=coefOf(L,'l',i); if(k==null){missing=true;k=0;}
        var t=iwAtoms(sp.formula,k); for(var s in t)a[s]=(a[s]||0)+t[s]; });
      Rr.forEach(function(sp,i){ var k=coefOf(Rr,'r',i); if(k==null){missing=true;k=0;}
        var t=iwAtoms(sp.formula,k); for(var s2 in t)b[s2]=(b[s2]||0)+t[s2]; });
      return {a:a,b:b,missing:missing}; }
    function render(showState){
      var t=tally(), syms={}, s;
      for(s in t.a)syms[s]=1; for(s in t.b)syms[s]=1;
      var keys=Object.keys(syms).sort(), ok=true;
      var cells=keys.map(function(k){ var x=t.a[k]||0, y=t.b[k]||0; var good=(x===y&&x>0);
        if(!good)ok=false;
        return '<span class="iwrx-at'+(showState?(good?' ok':' bad'):'')+'"><b>'+esc(k)+'</b>'+x+' / '+y+'</span>'; }).join('');
      var verdict = t.missing ? '' :
        (ok?'<span class="iwrx-verdict ok">✓ Équation équilibrée</span>':'<span class="iwrx-verdict bad">Non équilibrée</span>');
      bal.innerHTML='<div class="iwrx-atoms"><span class="iwrx-atl">Atomes — gauche / droite</span>'+cells+'</div>'+verdict;
      return ok&&!t.missing; }
    if(quiz){
      box.querySelectorAll('[data-coef]').forEach(function(inp){
        inp.addEventListener('input',function(){ inp.classList.remove('ok','bad'); render(false); }); });
      box.querySelector('[data-rx="check"]').addEventListener('click',function(){
        var good=render(true);
        box.querySelectorAll('[data-coef]').forEach(function(inp){
          var v=parseInt(inp.value,10); inp.classList.toggle('ok',good&&!isNaN(v)); inp.classList.toggle('bad',!good); }); });
      box.querySelector('[data-rx="show"]').addEventListener('click',function(){
        L.forEach(function(sp,i){ var e=box.querySelector('[data-coef="l-'+i+'"]'); if(e)e.value=(sp.coef==null||sp.coef==='')?1:sp.coef; });
        Rr.forEach(function(sp,i){ var e=box.querySelector('[data-coef="r-'+i+'"]'); if(e)e.value=(sp.coef==null||sp.coef==='')?1:sp.coef; });
        box.querySelectorAll('[data-coef]').forEach(function(e){ e.classList.remove('ok','bad'); }); render(false); });
      box.querySelector('[data-rx="reset"]').addEventListener('click',function(){
        box.querySelectorAll('[data-coef]').forEach(function(e){ e.value=''; e.classList.remove('ok','bad'); }); render(false); });
    }
    render(false);
  };

  /* ── comparative timeline: parallel tracks sharing one date axis ── */
  R.multitrack=function(box,c){
    box.className='iw iw-card iw-mtrack';
    var tracks=(c.tracks||[]).filter(function(t){ return t&&(t.label||(t.bands||[]).length||(t.marks||[]).length); });
    if(!tracks.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var P=pal();
    // if the author didn't fix the span, take it from the data
    var lo=parseFloat(c.start), hi=parseFloat(c.end);
    if(isNaN(lo)||isNaN(hi)){ var all=[];
      tracks.forEach(function(t){ (t.bands||[]).forEach(function(b){ all.push(parseFloat(b.from),parseFloat(b.to)); });
        (t.marks||[]).forEach(function(m){ all.push(parseFloat(m.at)); }); });
      all=all.filter(function(v){ return !isNaN(v); });
      if(!all.length)all=[0,100];
      if(isNaN(lo))lo=Math.min.apply(null,all); if(isNaN(hi))hi=Math.max.apply(null,all); }
    if(hi<=lo)hi=lo+1;
    var span=hi-lo, pct=function(v){ return Math.max(0,Math.min(100,(v-lo)/span*100)); };
    // a round-ish tick step so the axis reads cleanly
    var target=parseFloat(c.tickStep);
    if(!(target>0)){ var raw=span/6, mag=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10));
      var norm=raw/mag; target=(norm>=5?5:norm>=2?2:1)*mag; }
    var ticks=''; var t0=Math.ceil(lo/target)*target;
    for(var tv=t0; tv<=hi+1e-9; tv+=target){
      ticks+='<span class="iwmt-tick" style="left:'+pct(tv)+'%"><i></i><b>'+esc(c.tickPrefix||'')+(Math.round(tv*1000)/1000)+'</b></span>'; }
    var rows=tracks.map(function(t,ti){ var col=t.color||P[ti%P.length];
      var bands=(t.bands||[]).filter(function(b){ return b&&!isNaN(parseFloat(b.from)); }).map(function(b,bi){
        var f=parseFloat(b.from), to=isNaN(parseFloat(b.to))?f:parseFloat(b.to);
        var x=pct(Math.min(f,to)), w=Math.max(0.6,pct(Math.max(f,to))-x);
        return '<button type="button" class="iwmt-band" data-t="'+ti+'" data-b="'+bi+'" title="'+esc(b.label||'')+'" style="left:'+x+'%;width:'+w+'%;background:'+esc(b.color||col)+'"><span>'+esc(b.label||'')+'</span></button>'; }).join('');
      var marks=(t.marks||[]).filter(function(m){ return m&&!isNaN(parseFloat(m.at)); }).map(function(m,mi){
        return '<button type="button" class="iwmt-mark" data-t="'+ti+'" data-m="'+mi+'" style="left:'+pct(parseFloat(m.at))+'%;--mk:'+esc(m.color||col)+'" title="'+esc(m.label||'')+'"></button>'; }).join('');
      return '<div class="iwmt-row"><div class="iwmt-lab"><i style="background:'+esc(col)+'"></i>'+esc(t.label||'')+'</div>'+
        '<div class="iwmt-lane">'+bands+marks+'</div></div>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwmt-scroll"><div class="iwmt-grid" style="min-width:'+(parseInt(c.minWidth,10)||520)+'px">'+
      rows+'<div class="iwmt-row iwmt-axis"><div class="iwmt-lab"></div><div class="iwmt-lane">'+ticks+'</div></div>'+
      '</div></div><div class="iwmt-detail" data-det></div>';
    var det=box.querySelector('[data-det]');
    box.querySelectorAll('[data-t]').forEach(function(el2){ el2.addEventListener('click',function(){
      var t=tracks[+el2.getAttribute('data-t')]; if(!t)return;
      var isB=el2.hasAttribute('data-b');
      var it=isB?(t.bands||[])[+el2.getAttribute('data-b')]:(t.marks||[])[+el2.getAttribute('data-m')];
      if(!it)return;
      box.querySelectorAll('[data-t]').forEach(function(x){ x.classList.toggle('on',x===el2); });
      var when=isB?(it.from+(it.to&&it.to!==it.from?' – '+it.to:'')):it.at;
      det.innerHTML='<div class="iwmt-d-h"><b>'+esc(when)+'</b> · '+esc(t.label||'')+'</div>'+
        '<div class="iwmt-d-t">'+esc(it.label||'')+'</div>'+
        (it.img?'<img class="iwmt-d-img" src="'+esc(it.img)+'" alt="" loading="lazy">':'')+
        (it.desc?'<div class="iwmt-d-b">'+esc(it.desc)+'</div>':''); }); });
  };

  /* ── document study: a primary source with numbered lines and guided questions ── */
  R.source=function(box,c){
    box.className='iw iw-card iw-src';
    var qs=(c.qs||c.questions||[]).filter(function(q){ return q&&(typeof q==='string'?q.trim():q.q); })
      .map(function(q){ return typeof q==='string'?{q:q}:q; });
    var cite=[c.author,c.origin,c.date].filter(function(x){ return x; }).map(esc).join(' · ');
    var docHtml='';
    if(c.img)docHtml+='<figure class="iwsrc-fig"><img src="'+esc(c.img)+'" alt="'+esc(c.caption||'')+'" loading="lazy">'+
      (c.caption?'<figcaption>'+esc(c.caption)+'</figcaption>':'')+'</figure>';
    if(c.text){
      var lines=String(c.text).split(String.fromCharCode(10));
      docHtml+= (c.lineNumbers===false)
        ? '<div class="iwsrc-text">'+lines.map(function(l){ return '<p>'+esc(l)+'</p>'; }).join('')+'</div>'
        : '<ol class="iwsrc-lines">'+lines.map(function(l){ return '<li>'+esc(l)+'</li>'; }).join('')+'</ol>'; }
    var qh=qs.map(function(q,i){
      return '<li class="iwsrc-q"><div class="iwsrc-qt">'+esc(q.q||'')+
        (q.points?'<span class="iwsrc-pts">'+esc(q.points)+' pt</span>':'')+'</div>'+
        (q.hint?'<div class="iwsrc-hint">'+esc(q.hint)+'</div>':'')+
        '<textarea class="iwsrc-ans" rows="'+(parseInt(q.lines,10)||2)+'" placeholder="Ta réponse…"></textarea>'+
        (q.answer?'<div class="iwsrc-rev"><button type="button" class="iwm-qbtn" data-rev="'+i+'">'+T('showAnswer','Voir la réponse')+'</button>'+
          '<div class="iwsrc-model" hidden>'+esc(q.answer)+'</div></div>':'')+'</li>'; }).join('');
    box.innerHTML=(c.kicker?'<div class="iwsrc-kick">'+esc(c.kicker)+'</div>':'')+
      (c.title?'<h3 class="iwsrc-title">'+esc(c.title)+'</h3>':'')+
      '<div class="iwsrc-doc">'+docHtml+(cite?'<div class="iwsrc-cite">'+cite+'</div>':'')+'</div>'+
      (qh?'<div class="iwsrc-qs"><h4>'+esc(c.questionsLabel||'Questions')+'</h4><ol>'+qh+'</ol></div>':'');
    box.querySelectorAll('[data-rev]').forEach(function(b){ b.addEventListener('click',function(){
      var m=b.parentNode.querySelector('.iwsrc-model'); var open=!m.hasAttribute('hidden');
      if(open){ m.setAttribute('hidden',''); b.textContent='Voir la réponse'; }
      else { m.removeAttribute('hidden'); b.textContent='Masquer'; } }); });
  };

  /* ── tree: dynasty / family / classification, laid out from parent links ── */
  R.tree=function(box,c){
    box.className='iw iw-card iw-tree';
    // tnodes, not nodes: IW_ROW_DEFAULTS keys on the last path segment and the
    // branching-path element already owns "nodes". Older configs still work.
    var nodes=(c.tnodes||c.nodes||[]).filter(function(n){ return n&&(n.label||n.id); });
    if(!nodes.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':''); return; }
    var byId={}, kids={};
    nodes.forEach(function(n,i){ if(!n.id)n.id='n'+i; byId[n.id]=n; });
    nodes.forEach(function(n){ var p=(n.parent&&byId[n.parent]&&n.parent!==n.id)?n.parent:'__root';
      (kids[p]=kids[p]||[]).push(n); });
    var seen={};
    function node(n,depth){
      if(seen[n.id]||depth>12)return '';   // a bad parent link must not loop forever
      seen[n.id]=1;
      var ch=(kids[n.id]||[]).map(function(k){ return node(k,depth+1); }).join('');
      var st=n.color?' style="--itr:'+esc(n.color)+'"':'';
      return '<li'+st+'><div class="iwtr-node'+(n.desc||n.img?' iwtr-has':'')+'" data-id="'+esc(n.id)+'">'+
        (n.img?'<img src="'+esc(n.img)+'" alt="" loading="lazy">':'')+
        '<span class="iwtr-l">'+esc(n.label||n.id)+'</span>'+
        (n.sub?'<span class="iwtr-s">'+esc(n.sub)+'</span>':'')+'</div>'+
        (ch?'<ul>'+ch+'</ul>':'')+'</li>'; }
    var roots=(kids.__root||[]).map(function(n){ return node(n,0); }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwtr-scroll"><ul class="iwtr'+(c.compact?' iwtr-compact':'')+'">'+roots+'</ul></div>'+
      '<div class="iwtr-detail" data-det></div>';
    var det=box.querySelector('[data-det]');
    box.querySelectorAll('.iwtr-node').forEach(function(el2){ el2.addEventListener('click',function(){
      var n=byId[el2.getAttribute('data-id')]; if(!n||!(n.desc||n.img))return;
      box.querySelectorAll('.iwtr-node').forEach(function(x){ x.classList.toggle('on',x===el2); });
      det.innerHTML='<div class="iwtr-d-h">'+esc(n.label||'')+(n.sub?' <em>'+esc(n.sub)+'</em>':'')+'</div>'+
        (n.desc?'<div class="iwtr-d-b">'+esc(n.desc)+'</div>':''); }); });
  };

  /* ── compare: criteria table, or a two-set Venn ── */
  R.compare=function(box,c){
    box.className='iw iw-card iw-cmp';
    var P=pal(), sides=(c.sides||[]).filter(function(s){ return s&&(s.label||s.color); });
    if(c.mode==='venn'){
      var a=sides[0]||{label:'A'}, b=sides[1]||{label:'B'};
      var ca=a.color||P[0], cb=b.color||P[2];
      var list=function(arr){ return '<ul>'+(arr||[]).filter(function(x){return String(x||'').trim();})
        .map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>'; };
      box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
        '<div class="iwcmp-venn">'+
        '<div class="iwcmp-v iwcmp-vl" style="--vc:'+esc(ca)+'"><h4>'+esc(a.label||'A')+'</h4>'+list(c.onlyLeft)+'</div>'+
        '<div class="iwcmp-v iwcmp-vm"><h4>'+esc(c.bothLabel||'Les deux')+'</h4>'+list(c.both)+'</div>'+
        '<div class="iwcmp-v iwcmp-vr" style="--vc:'+esc(cb)+'"><h4>'+esc(b.label||'B')+'</h4>'+list(c.onlyRight)+'</div>'+
        '</div>'+(c.note?'<div class="iwcmp-note">'+esc(c.note)+'</div>':'');
      return; }
    if(!sides.length)sides=[{label:'A'},{label:'B'}];
    var rows=(c.rows||[]).filter(function(r){ return r&&(r.criterion||(r.values||[]).join('')); });
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwcmp-scroll"><table class="iwcmp-t"><thead><tr><th></th>'+
      sides.map(function(s,i){ return '<th style="--sc:'+esc(s.color||P[i%P.length])+'">'+esc(s.label||'')+'</th>'; }).join('')+
      '</tr></thead><tbody>'+rows.map(function(r){
        return '<tr><th scope="row">'+esc(r.criterion||'')+'</th>'+
          sides.map(function(s,i){ return '<td>'+esc((r.values||[])[i]||'')+'</td>'; }).join('')+'</tr>'; }).join('')+
      '</tbody></table></div>'+(c.note?'<div class="iwcmp-note">'+esc(c.note)+'</div>':'');
  };

  /* ── before / after: one image revealed over another by a draggable divider ── */
  R.beforeafter=function(box,c){
    box.className='iw iw-card iw-ba';
    if(!c.before||!c.after){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iw-err">Choisis deux images (avant / après).</div>'; return; }
    var start=Math.max(0,Math.min(100,parseFloat(c.start)||50));
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwba-wrap" style="--p:'+start+'%">'+
        '<img class="iwba-img iwba-a" src="'+esc(c.before)+'" alt="'+esc(c.beforeLabel||'Avant')+'" loading="lazy">'+
        '<div class="iwba-clip"><img class="iwba-img iwba-b" src="'+esc(c.after)+'" alt="'+esc(c.afterLabel||'Après')+'" loading="lazy"></div>'+
        '<span class="iwba-tag iwba-tl">'+esc(c.beforeLabel||'Avant')+'</span>'+
        '<span class="iwba-tag iwba-tr">'+esc(c.afterLabel||'Après')+'</span>'+
        '<div class="iwba-bar"><span class="iwba-knob"></span></div>'+
        '<input class="iwba-range" type="range" min="0" max="100" step="0.1" value="'+start+'" aria-label="Comparer avant et après">'+
      '</div>'+(c.caption?'<div class="iwba-cap">'+esc(c.caption)+'</div>':'');
    var wrap=box.querySelector('.iwba-wrap'), rng=box.querySelector('.iwba-range');
    function set(v){ wrap.style.setProperty('--p',v+'%'); }
    rng.addEventListener('input',function(){ set(rng.value); });
    // dragging anywhere on the image feels more natural than hunting for the handle
    function fromEvent(e){ var r=wrap.getBoundingClientRect(); var x=(e.clientX-r.left)/r.width*100;
      x=Math.max(0,Math.min(100,x)); rng.value=x; set(x); }
    var down=false;
    wrap.addEventListener('pointerdown',function(e){ if(e.target===rng)return; down=true; fromEvent(e); });
    wrap.addEventListener('pointermove',function(e){ if(down)fromEvent(e); });
    window.addEventListener('pointerup',function(){ down=false; });
  };

  /* ── map ────────────────────────────────────────────────────────────────
     A map is a DECK OF STEPS. Each step is a complete map of its own — its own
     basemap, its own colours, its own roads and arrows — and the reader moves
     between them with a slider. A plain map is a deck of one, so nothing extra
     shows.

     ONE COORDINATE SPACE. Everything drawn on a map is stored in the units of
     that map's own viewBox and nothing else. For a built-in basemap those units
     come from projecting the outlines once; for an author's own SVG they are
     the units the SVG already had. The editor draws in the same space, so what
     is placed is what appears.

     A MAP INSIDE A PART IS A PLACE YOU GO, not an SVG inside an SVG. A part
     that owns a second map is outlined, and clicking it replaces the view, with
     a way back — what a reader does with an atlas when they turn to the
     regional plate.

     NOTHING IS DRAWN WITH <marker>. Arrow heads are real paths, computed from
     the line they end. Markers are referenced by id, and two maps in one book
     would have emitted the same ids and stolen each other's heads; drawing them
     by hand removes the whole class of bug, and lets the legend reuse the exact
     same drawing as the map. */
  R.map=function(box,c){
    var steps=(c.steps&&c.steps.length)?c.steps:[{label:'',base:c.base||'',parts:c.parts||[],items:c.items||[]}];
    var LG=c.legend||{}, QC=c.quiz||{}, quizOn=iwBool(QC.on,false);
    var GEO=(window.__BOOK__&&window.__BOOK__.geo)||{};
    var UID='m'+hash(JSON.stringify(steps).slice(0,400)+(c.title||''))+'x'+(R.map._n=(R.map._n||0)+1);
    var cur=0, stack=[], view=null, drag=null;

    /* La projection vient de lib/basemaps/project.js, injectee ici mot pour
       mot : l'editeur de Studio appelle la MEME fonction, si bien qu'une route
       posee sur le canevas tombe au pixel pres au meme endroit dans le livre. */
    var project=function projectBasemap(geo, bounds) {
  var kx = Math.cos((geo.parallele || 0) * Math.PI / 180);
  var U = function (lon) { return lon * kx; };
  var V = function (lat) { return -lat; };
  var u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, code, rings, ring, i, j, x, y;
  if (bounds) {
    u0 = U(bounds.lon0); u1 = U(bounds.lon1);
    v0 = V(bounds.lat1); v1 = V(bounds.lat0);
  } else {
    for (code in geo.data) {
      rings = geo.data[code].a;
      for (i = 0; i < rings.length; i++) {
        ring = rings[i];
        for (j = 0; j < ring.length; j += 2) {
          x = U(ring[j]); y = V(ring[j + 1]);
          if (x < u0) u0 = x;
          if (x > u1) u1 = x;
          if (y < v0) v0 = y;
          if (y > v1) v1 = y;
        }
      }
    }
  }
  var W = 1000, s = W / Math.max(1e-6, u1 - u0), H = Math.max(60, (v1 - v0) * s);
  var shapes = [];
  for (code in geo.data) {
    var d = '';
    rings = geo.data[code].a;
    for (i = 0; i < rings.length; i++) {
      ring = rings[i];
      for (j = 0; j < ring.length; j += 2) {
        d += (j ? 'L' : 'M') + ((U(ring[j]) - u0) * s).toFixed(1)
          + ' ' + ((V(ring[j + 1]) - v0) * s).toFixed(1);
      }
      d += 'Z';
    }
    shapes.push({ id: code, name: geo.data[code].nom, d: d });
  }
  /* On rend aussi de quoi REVENIR aux degres. Sans cela impossible de tracer un
     quadrillage ou une echelle : il faudrait redeviner la projection ailleurs,
     et une echelle devinee est une echelle fausse.

     L'unite intermediaire u vaut un degre de longitude multiplie par cos(phi0).
     Un degre de longitude a la latitude phi0 mesure 111,32 x cos(phi0) km ;
     une unite u vaut donc 111,32 km, exactement, le long du parallele choisi. */
  return {
    kind: 'geo', w: W, h: H, shapes: shapes,
    geo: {
      s: s, u0: u0, v0: v0, kx: kx, parallele: geo.parallele || 0,
      kmParUnite: 111.32 / s,
      lon: function (x) { return (x / s + u0) / (kx || 1); },
      lat: function (y) { return -(y / s + v0); },
      x: function (lon) { return (lon * kx - u0) * s; },
      y: function (lat) { return (-lat - v0) * s; },
    },
  };
};

    /* Un SVG maison ne se REDESSINE pas, il s'HABILLE : chaque partie reglee
       par l'auteur retrouve son element par son identifiant et recoit couleur,
       infobulle et clic, exactement comme une partie de la bibliotheque. */
    function habilleSvg(byId,CH){
      var g=host.querySelector('.iwm-land'); if(!g) return;
      /* Les identifiants d'un SVG dessine a la main sont en capitales, ceux que
         l'editeur ecrit en minuscules -- "MA-08" contre "ma-08". Un
         rapprochement sensible a la casse ne trouvait donc AUCUNE partie et la
         carte restait grise. On tente l'exact, puis on ignore la casse. */
      var bas={}; for(var k in byId) bas[String(k).toLowerCase()]=byId[k];
      [].slice.call(g.querySelectorAll('[id]')).forEach(function(n){
        var idn=n.getAttribute('id');
        var p=byId[idn]||bas[String(idn).toLowerCase()]; if(!p) return;
        n.setAttribute('data-part',p.id);
        var hide=quizOn&&iwBool(p.blankColor,false)&&!QZ.col[p.id];
        var f=hide?null:(QZ.col[p.id]||(CH?CH.fill(p):fillOf(p)));
        if(f) n.style.fill=f;
        var cls=(n.getAttribute('class')||'')+' iwm-p'
          +(p.sub?' iwm-into':'')+((p.desc||p.label)?' iwm-named':'')+(hide?' iwm-blank':'');
        n.setAttribute('class',cls.replace(new RegExp('  +','g'),' ').trim());
        if(p.label&&!(n.querySelector&&n.querySelector('title'))&&n.appendChild){
          var ti=document.createElementNS('http://www.w3.org/2000/svg','title');
          ti.textContent=iwRTx(p.label); n.appendChild(ti);
        }
      });
    }
    function build(st){
      if(st.base&&GEO[st.base]) return project(GEO[st.base],st.bounds||null);
      var tpl=box.querySelector('template[data-mapsvg="'+(st.svgSrc||'')+'"]');
      var mk=tpl?tpl.innerHTML:(st.svg||'');
      return (mk?fromSvg(mk):null)||{kind:'empty',w:1000,h:560,shapes:[]};
    }

    /* ── geometry ─────────────────────────────────────── */
    /* Ecrite une seule fois dans lib/basemaps/shapes.js et injectee ici mot
       pour mot ; l'editeur de Studio va chercher le MEME texte. Le canevas
       montrait autrefois un disque la ou le livre dessinait une etoile. */
    
    function len(a,b){ var dx=b[0]-a[0], dy=b[1]-a[1]; return Math.sqrt(dx*dx+dy*dy); }
    /* Catmull-Rom en Bezier : une route qui suit une vallee n'est pas une ligne
       brisee. On garde les angles vifs quand l'auteur le demande (une frontiere,
       un axe de symetrie), mais par defaut un trace se lisse. */
    function pathOf(p,closed,smooth){
      if(!p||p.length<2) return p&&p.length?('M'+p[0][0]+' '+p[0][1]):'';
      if(!smooth||p.length<3){
        return p.map(function(q,i){return (i?'L':'M')+q[0]+' '+q[1];}).join('')+(closed?'Z':'');
      }
      var d='M'+p[0][0]+' '+p[0][1], n=p.length;
      for(var i=0;i<n-1;i++){
        var p0=p[i-1]||p[0], p1=p[i], p2=p[i+1], p3=p[i+2]||p2;
        if(closed){ p0=p[(i-1+n)%n]; p3=p[(i+2)%n]; }
        d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)
          +' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)
          +' '+p2[0]+' '+p2[1];
      }
      return d+(closed?'Z':'');
    }
    /* Raccourcir le trace de la longueur de la pointe, pour que la POINTE
       s'arrete sur le dernier point au lieu de le depasser. Sans cela une
       fleche depasse toujours sa cible, et l'on ne peut pas viser une ville. */
    function trim(p,d,atEnd){
      if(p.length<2||d<=0) return p;
      var q=p.map(function(x){return [x[0],x[1]];});
      var i=atEnd?q.length-1:0, j=atEnd?q.length-2:1;
      var L=len(q[i],q[j]); if(L<1e-6) return q;
      var t=Math.min(d,L*0.92);
      q[i]=[q[i][0]+(q[j][0]-q[i][0])/L*t, q[i][1]+(q[j][1]-q[i][1])/L*t];
      return q;
    }
    // an arrow head, drawn as a path so nothing depends on a shared <marker> id
    function head(tip,from,size,col){
      var a=Math.atan2(tip[1]-from[1],tip[0]-from[0]), w=size*0.55;
      var bx=tip[0]-Math.cos(a)*size, by=tip[1]-Math.sin(a)*size;
      return '<path d="M'+tip[0]+' '+tip[1]
        +'L'+(bx-Math.sin(a)*w)+' '+(by+Math.cos(a)*w)
        +'L'+(bx+Math.sin(a)*w)+' '+(by-Math.cos(a)*w)+'Z" fill="'+col+'"/>';
    }
    function centroid(p){ var x=0,y=0; p.forEach(function(q){x+=q[0];y+=q[1];}); return [x/p.length,y/p.length]; }
    // the point half-way ALONG a line, which is where a road's name belongs —
    // the centroid of a bent road sits off the road entirely
    function midOfLine(p){
      var tot=0,i; for(i=0;i<p.length-1;i++) tot+=len(p[i],p[i+1]);
      var half=tot/2, run=0;
      for(i=0;i<p.length-1;i++){
        var L=len(p[i],p[i+1]);
        if(run+L>=half){ var t=(half-run)/(L||1);
          return [p[i][0]+(p[i+1][0]-p[i][0])*t, p[i][1]+(p[i+1][1]-p[i][1])*t]; }
        run+=L;
      }
      return p[p.length-1];
    }
    function star(x,y,R1,R2,n){
      var d='';
      for(var i=0;i<n*2;i++){ var a=-Math.PI/2+i*Math.PI/n, r=i%2?R2:R1;
        d+=(i?'L':'M')+(x+Math.cos(a)*r).toFixed(1)+' '+(y+Math.sin(a)*r).toFixed(1); }
      return d+'Z';
    }
    /* Le SVG que l'auteur a dessine lui-meme : sa boite de coordonnees est la
       nôtre. Beaucoup de SVG exportes n'ont PAS de viewBox -- seulement une
       largeur et une hauteur -- et il faut alors la reconstituer, sans quoi on
       plaque un cadre de mille sur six cents sur un dessin de 612 sur 654 et
       tout le pays se retrouve de travers.
       Ses parties sont ses elements IDENTIFIES : sans cette liste on ne peut
       ni les colorier ni les nommer ni les cliquer. */
    function fromSvg(markup){
      var t=document.createElement('div'); t.innerHTML=String(markup||'');
      var svg=t.querySelector('svg');
      if(!svg) return null;
      var vb=(svg.getAttribute('viewBox')||'').trim().split(new RegExp('[ ,]+')).map(Number);
      var ok=vb.length===4&&vb.every(function(n){return isFinite(n);});
      var ids=[], vu={};
      [].slice.call(svg.querySelectorAll('[id]')).forEach(function(n){
        var id=n.getAttribute('id'); if(!id||vu[id]) return; vu[id]=1;
        var ti=n.querySelector?n.querySelector('title'):null;
        ids.push({id:id, name:(ti&&(ti.textContent||'').trim())||n.getAttribute('data-name')||id});
      });
      return {kind:'svg', ox:ok?vb[0]:0, oy:ok?vb[1]:0,
        w:ok?vb[2]:(parseFloat(svg.getAttribute('width'))||1000),
        h:ok?vb[3]:(parseFloat(svg.getAttribute('height'))||600),
        inner:svg.innerHTML, shapes:ids};
    }
    /* Un nombre se lit a la francaise ou ne se lit pas : espace fine insecable
       entre les milliers, virgule decimale, vrai signe moins. Sans expression
       reguliere -- ce fichier est un litteral de gabarit et une barre oblique
       inversee y traverserait deux couches d'echappement.
       L'editeur en avait sa propre version, qui coupait les zeros de fin sans
       regarder s'il y avait une virgule : 100 s'affichait « 1 », 250 « 25 », et
       la gamme d'une choroplethe annoncait « 50 - 1 ». */
    function nbFr(x,fixe){
      var v=+x; if(!isFinite(v)) return '';
      var a=Math.abs(v), d=fixe!=null?fixe:(a>=100?0:(a>=10?1:(a>=1?2:3)));
      var t=v.toFixed(d), pt=t.indexOf('.');
      var ent=pt<0?t:t.slice(0,pt), dec=pt<0?'':t.slice(pt+1);
      var neg=ent.charAt(0)==='-'; if(neg) ent=ent.slice(1);
      while(dec.length&&dec.charAt(dec.length-1)==='0') dec=dec.slice(0,-1);
      var o='',i;
      for(i=0;i<ent.length;i++){ if(i&&(ent.length-i)%3===0) o+=String.fromCharCode(0x202F); o+=ent.charAt(i); }
      return (neg?String.fromCharCode(0x2212):'')+o+(dec?','+dec:'');
    }
    function degTx(v,quoi){
      var n=Math.round(Math.abs(v)*100)/100;
      var h=Math.abs(v)<1e-9?'':(quoi==='lon'?(v>0?'E':'O'):(v>0?'N':'S'));
      return String(n).split('.').join(',')+String.fromCharCode(0xB0)+(h?' '+h:'');
    }

    /* -- la choroplethe --------------------------------------------------
       L'auteur donne une VALEUR a des parties -- une densite, un PIB, un taux.
       Les classes, leurs bornes et leurs couleurs se calculent : taper soi-meme
       six nuances et six intervalles, c'est se tromper six fois, et une carte
       thematique fausse est pire qu'une carte vide. */
    var RAMPES={
      rouge:['#fdece8','#f7c3b5','#ec9077','#d95f43','#b8321c','#7f1d0c'],
      bleu:['#e9f1fb','#c3daf2','#8fbde5','#5b98d2','#2f6fb0','#164a80'],
      vert:['#ecf5e9','#c9e4c0','#9bcd8d','#68b05a','#3d8c34','#20601c'],
      chaud:['#fff6d6','#fee08b','#fdae61','#f46d43','#d7301f','#8c0f0f'],
      froid:['#f3f0fa','#d6cdec','#b3a2dc','#8b74c6','#6247a6','#3d2b7a'],
      gris:['#f2f0ed','#d9d5cf','#bab4ac','#948d84','#6b645c','#423d37']
    };
    function bornes(vals,n,mode){
      var v=vals.slice().sort(function(a,b){return a-b;}), out=[], i;
      if(mode==='quantile'){
        /* Autant de parties par classe : ce qu'il faut quand quelques valeurs
           enormes ecrasent toutes les autres. */
        out.push(v[0]);
        for(i=1;i<n;i++) out.push(v[Math.min(v.length-1,Math.floor(i*v.length/n))]);
        out.push(v[v.length-1]);
      } else {
        /* Des intervalles egaux, mais arrondis a un pas lisible : 0-20-40 se
           retient, 0-19,3-38,6 ne se retient pas. On prend le PLUS PETIT pas
           rond qui couvre l'etendue en n classes au plus -- une echelle a trois
           crans (1, 2, 5) sautait a 0,5 pour des valeurs de 0,02 a 0,9 et ne
           rendait que deux classes sur les quatre demandees. */
        var lo=v[0], hi=v[v.length-1], span=(hi-lo)||Math.abs(hi)||1;
        var e=Math.pow(10,Math.floor(Math.log(span/n)/Math.LN10));
        var ECH=[1,1.5,2,2.5,3,4,5,6,7.5,10,15,20], pas=0, d=0, t, base;
        for(i=0;i<ECH.length;i++){
          t=ECH[i]*e; base=Math.floor(lo/t)*t;
          if(Math.ceil((hi-base)/t-1e-9)<=n){ pas=t; d=base; break; }
        }
        if(!pas){ pas=ECH[ECH.length-1]*e; d=Math.floor(lo/pas)*pas; }
        for(i=0;i<=n;i++) out.push(+(d+pas*i).toFixed(9));
        while(out.length>2&&out[out.length-2]>=hi) out.pop();
      }
      /* Deux bornes identiques feraient une classe vide : on ne montre pas au
         lecteur un intervalle qui ne contient rien. */
      var net=[out[0]];
      for(i=1;i<out.length;i++) if(out[i]>net[net.length-1]) net.push(out[i]);
      return net.length>1?net:[v[0],v[0]+1];
    }
    /* Le calcul complet, pour qui a deja decide que la choroplethe est active. */
    function choroDe(parts,cf){
      if(!cf) return null;
      var ps=(parts||[]).filter(function(q){
        return q.value!=null&&q.value!==''&&isFinite(+q.value); });
      if(ps.length<2) return null;
      var n=Math.max(2,Math.min(6,+cf.classes||5));
      var ramp=RAMPES[cf.palette]||RAMPES.rouge;
      var br=bornes(ps.map(function(q){return +q.value;}),n,cf.mode==='quantile'?'quantile':'egal');
      n=br.length-1;
      var cols=[],i;
      for(i=0;i<n;i++) cols.push(ramp[Math.round(i*(ramp.length-1)/Math.max(1,n-1))]);
      function classe(v){ for(var k=n-1;k>=0;k--) if(v>=br[k]) return k; return 0; }
      return { n:n, br:br, cols:cols, cf:cf,
        fill:function(q){
          if(!q) return cf.absent||null;
          if(q.value==null||q.value===''||!isFinite(+q.value)) return q.color||cf.absent||null;
          return cols[classe(+q.value)];
        },
        rows:function(){
          var r=[],k;
          for(k=0;k<n;k++) r.push({color:cols[k],
            text:nbFr(br[k])+' '+String.fromCharCode(0x2013)+' '+nbFr(br[k+1])
              +(cf.unit?' '+cf.unit:'')});
          return r;
        } };
    }
    /* -- les trames ------------------------------------------------------
       La tuile est dimensionnee d'apres la VUE COURANTE, pas en unites de
       carte : une trame en unites de carte grossit quand on recadre ou qu'on
       zoome -- fines hachures sur un planisphere, bandes de dix pixels sur le
       Maghreb recadre. Rapportee a la vue, elle garde toujours la meme finesse
       a l'ecran.
       L'identifiant est passe de l'exterieur : chaque carte d'un livre a le
       sien, sinon deux cartes d'une meme page se voleraient leurs motifs. */
    var TEX={hachures:1,croix:1,points:1,briques:1};
    function texDef(id,t,col,vw){
      var u=Math.max(2,(vw||1000)/125), k=u/8;
      var c=String(col).split('"').join('');
      var g='<rect width="'+u+'" height="'+u+'" fill="'+c+'" opacity=".20"/>';
      if(t==='points') g+='<circle cx="'+(4*k)+'" cy="'+(4*k)+'" r="'+(1.5*k)+'" fill="'+c+'"/>';
      else if(t==='briques') g+='<path d="M0 '+(4*k)+'h'+u+'M'+(4*k)+' 0v'+(4*k)+'M'+(2*k)+' '+(4*k)+'v'+(4*k)
        +'" stroke="'+c+'" stroke-width="'+(1.2*k)+'" fill="none"/>';
      else g+='<path d="'+(t==='croix'?('M0 '+u+'L'+u+' 0M0 0L'+u+' '+u):('M0 '+u+'L'+u+' 0'))
        +'" stroke="'+c+'" stroke-width="'+(1.6*k)+'" fill="none"/>';
      return '<pattern id="'+id+'" width="'+u+'" height="'+u+'" patternUnits="userSpaceOnUse">'+g+'</pattern>';
    }
    function markerShape(sh,x,y,r,col,img){
      var st=' stroke="var(--paper)" stroke-width="'+(r*0.26).toFixed(2)+'"';
      /* Un pictogramme a soi. Il remplace la forme dessinee : c'est ce qu'il
         faut pour les pictogrammes de securite, un logo, le symbole d'une
         discipline. Centre sur le point, comme les autres formes, et sans
         deformation — preserveAspectRatio, sinon un carre devient un oeuf. */
      if(sh==='image'&&img) return '<image href="'+img+'" x="'+(x-r*1.4)+'" y="'+(y-r*1.4)+'" width="'+(r*2.8)+'" height="'+(r*2.8)+'" preserveAspectRatio="xMidYMid meet"/>';
      if(sh==='square') return '<rect x="'+(x-r)+'" y="'+(y-r)+'" width="'+(2*r)+'" height="'+(2*r)+'" rx="'+(r*0.22)+'" fill="'+col+'"'+st+'/>';
      if(sh==='triangle') return '<path d="M'+x+' '+(y-r*1.15)+'L'+(x+r)+' '+(y+r*0.8)+'L'+(x-r)+' '+(y+r*0.8)+'Z" fill="'+col+'"'+st+'/>';
      if(sh==='star') return '<path d="'+star(x,y,r,r*0.45,5)+'" fill="'+col+'"'+st+'/>';
      if(sh==='pin') return '<path d="M'+x+' '+(y+r*1.3)+'c'+(-r*0.95)+' '+(-r*1.1)+' '+(-r*0.95)+' '+(-r*2.1)+' 0 '+(-r*2.1)
        +'c'+(r*0.95)+' 0 '+(r*0.95)+' '+(r)+' 0 '+(r*2.1)+'z" fill="'+col+'"'+st+'/>';
      return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+col+'"'+st+'/>';
    }

    /* TEX et texDef viennent de shapes.js : l'editeur de Studio dessine ses
       trames avec le meme code, si bien qu'une region hachuree sur le canevas
       est hachuree sur la page. */
    function texId(t,col){ return UID+'-t'+hash(t+'|'+col); }
    function fillOf(p){
      if(!p||!p.color) return null;
      return (p.texture&&TEX[p.texture])?'url(#'+texId(p.texture,p.color)+')':p.color;
    }

    /* nbFr, degTx, RAMPES, bornes et choroDe viennent de shapes.js, injecte
       plus haut : l'editeur de Studio calcule ses classes avec le MEME code, et
       la gamme qu'il montre est celle qui sera imprimee. */
    function choro(st){
      var cf=st.choro||c.choro;
      if(!cf||!iwBool(cf.on,false)) return null;
      return choroDe(st.parts,cf);
    }

    /* -- habillage : quadrillage, echelle, rose des vents -------------------
       Trois objets qu'aucune carte serieuse n'omet et qu'aucun auteur ne devrait
       dessiner a la main. Tous trois se DEDUISENT de la projection : le pas du
       quadrillage de l'etendue affichee, la longueur de l'echelle du nombre de
       kilometres par unite, le nord de l'orientation du canevas.
       Tout est dimensionne en fractions de view.w : la vue retrecit quand on
       zoome, donc une fraction de la vue garde la meme taille A L'ECRAN. */
    var PAS_DEG=[0.5,1,2,5,10,15,20,30,45];
    function decoSvg(src){
      var g=src.geo, u=view.w, o='', i;
      if(g&&iwBool(c.grid,false)){
        var lo0=g.lon(view.x), lo1=g.lon(view.x+view.w);
        var la1=g.lat(view.y), la0=g.lat(view.y+view.h);
        var pas=PAS_DEG[PAS_DEG.length-1];
        for(i=0;i<PAS_DEG.length;i++){ if((lo1-lo0)/PAS_DEG[i]<=9){ pas=PAS_DEG[i]; break; } }
        o+='<g class="iwm-grid" stroke-width="'+(u/1500).toFixed(3)+'">';
        var lon=Math.ceil(lo0/pas)*pas, X;
        for(;lon<=lo1+1e-9;lon+=pas){
          X=g.x(lon);
          o+='<path d="M'+X.toFixed(1)+' '+view.y.toFixed(1)+'V'+(view.y+view.h).toFixed(1)+'"/>'
            +'<text x="'+X.toFixed(1)+'" y="'+(view.y+view.h-u*0.006).toFixed(1)
            +'" text-anchor="middle" class="iwm-gtx" data-px="9.5" data-fixed="1">'
            +degTx(lon,'lon')+'</text>';
        }
        var lat=Math.ceil(la0/pas)*pas, Y;
        for(;lat<=la1+1e-9;lat+=pas){
          Y=g.y(lat);
          o+='<path d="M'+view.x.toFixed(1)+' '+Y.toFixed(1)+'H'+(view.x+view.w).toFixed(1)+'"/>'
            +'<text x="'+(view.x+u*0.008).toFixed(1)+'" y="'+(Y-u*0.005).toFixed(1)
            +'" text-anchor="start" class="iwm-gtx" data-px="9.5" data-fixed="1">'
            +degTx(lat,'lat')+'</text>';
        }
        o+='</g>';
      }
      /* Le drapeau s'appelle scalebar et non scale : le nom "scale" est reserve
         par la mise en page libre (le zoom d'un bloc sur le canevas) et Studio le
         retire de TOUTE configuration d'element avant d'ecrire. Sous ce nom-la,
         la barre d'echelle disparaissait a l'enregistrement, sans un mot. */
      if(g&&iwBool(c.scalebar,false)){
        /* On vise le cinquieme de la largeur, puis on arrondit a 1, 2 ou 5 fois
           une puissance de dix : une echelle de 437 km ne se lit pas. */
        var kmU=g.kmParUnite, vise=view.w*0.2*kmU;
        var e=Math.pow(10,Math.floor(Math.log(Math.max(1e-6,vise))/Math.LN10));
        var m=vise/e, km=(m>=5?5:(m>=2?2:1))*e;
        var L=km/kmU, x0=view.x+u*0.035, ht=u/170;
        var y0=view.y+view.h-view.h*0.075;
        o+='<g class="iwm-scale">';
        for(i=0;i<4;i++) o+='<rect x="'+(x0+L*i/4).toFixed(1)+'" y="'+y0.toFixed(1)
          +'" width="'+(L/4).toFixed(1)+'" height="'+ht.toFixed(2)
          +'" class="'+(i%2?'iwm-sc1':'iwm-sc0')+'"/>';
        o+='<text x="'+x0.toFixed(1)+'" y="'+(y0-ht*0.6).toFixed(1)
          +'" text-anchor="start" class="iwm-gtx" data-px="10" data-fixed="1">0</text>'
          +'<text x="'+(x0+L).toFixed(1)+'" y="'+(y0-ht*0.6).toFixed(1)
          +'" text-anchor="middle" class="iwm-gtx" data-px="10" data-fixed="1">'
          +nbFr(km,0)+' km</text></g>';
      }
      if(iwBool(c.north,false)){
        var R=u/30, nx=view.x+view.w-R*1.7, ny=view.y+R*1.9;
        o+='<g class="iwm-north">'
          +'<circle cx="'+nx.toFixed(1)+'" cy="'+ny.toFixed(1)+'" r="'+R.toFixed(1)+'" class="iwm-nbg"/>'
          +'<path d="M'+nx.toFixed(1)+' '+(ny-R*0.62).toFixed(1)
            +'L'+(nx+R*0.36).toFixed(1)+' '+(ny+R*0.58).toFixed(1)
            +'L'+nx.toFixed(1)+' '+(ny+R*0.22).toFixed(1)
            +'L'+(nx-R*0.36).toFixed(1)+' '+(ny+R*0.58).toFixed(1)+'Z" class="iwm-nar"/>'
          +'<text x="'+nx.toFixed(1)+'" y="'+(ny-R*0.78).toFixed(1)
          +'" text-anchor="middle" class="iwm-gtx iwm-nn" data-px="10.5" data-fixed="1">N</text></g>';
      }
      return o;
    }

    /* ── quiz ─────────────────────────────────────────────────────────────
       Un blanc n'est pas un decor : le nom d'une partie disparait de la legende
       et le lecteur le tape ; sa couleur disparait de la carte et le lecteur va
       la chercher dans la legende. On compare sans accents ni ponctuation,
       parce qu'on evalue une connaissance et pas une orthographe de clavier. */
    var QZ={txt:{},col:{},pick:null,done:false};
    function qNorm(s){ s=String(s==null?'':s).toLowerCase().trim();
      if(s.normalize)s=s.normalize('NFD').replace(new RegExp('['+String.fromCharCode(0x300)+'-'+String.fromCharCode(0x36f)+']','g'),'');
      return s.replace(new RegExp('[^a-z0-9]+','g'),''); }

    /* ── items ────────────────────────────────────────────────────────── */
    function itemSvg(it,i){
      var col=esc(it.color||cvar('--accent','#8c2f2a')), w=+it.width||3;
      var pts=(it.pts||[]).slice(), o='';
      var clickable=(it.popup&&(it.popup.text||it.popup.img))?' class="iwm-has"':'';
      var tag=' data-mi="'+i+'"'+clickable;
      if(!pts.length) return '';
      if(it.kind==='marker'){
        var p0=pts[0], r=+it.r||9, sh=it.shape||'disc';
        o='<g'+tag+'>'+markerShape(sh,p0[0],p0[1],r,col,it.img)
          +(it.label?txtAt(p0[0],p0[1]-r-fs(6),it.label):'')+'</g>';
        return o;
      }
      if(it.kind==='onion'){
        var cxo=pts[0][0], cyo=pts[0][1], rings=(it.rings||[]).slice();
        /* Deux series de cercles proportionnels ne se comparent que si elles
           partagent une echelle. Chacune calee sur SON propre maximum, un port
           de 438 Mt et un port de 1250 Mt se dessinaient du meme diametre : la
           carte disait le contraire de ses chiffres. "max" fixe la reference
           commune ; sans lui on retombe sur le maximum local. */
        var rmax=+it.r||70;
        var big=(+it.max>0)?+it.max
          :rings.reduce(function(a,r2){return Math.max(a,+r2.value||0);},1);
        o='<g'+tag+'>';
        rings.sort(function(a,b2){return (+b2.value||0)-(+a.value||0);}).forEach(function(r2){
          var rr=rmax*Math.sqrt(Math.max(0,+r2.value||0)/big);
          o+='<circle cx="'+cxo+'" cy="'+cyo+'" r="'+rr.toFixed(1)+'" fill="'+esc(r2.color||col)
            +'" fill-opacity=".38" stroke="'+esc(r2.color||col)+'" stroke-width="1.4"/>';
          if(r2.label)o+=txtAt(cxo,cyo-rr-fs(3),r2.label);
        });
        return o+'</g>';
      }
      if(it.kind==='text'){
        /* Une annotation posee a la main ne doit JAMAIS etre deplacee par
           l'anti-chevauchement : l'auteur l'a mise la expres. */
        var tp=pts[0], ang=+it.angle||0;
        return '<g'+tag+(ang?' transform="rotate('+ang+' '+tp[0].toFixed(1)+' '+tp[1].toFixed(1)+')"':'')+'>'
          +'<text x="'+tp[0].toFixed(1)+'" y="'+tp[1].toFixed(1)+'" text-anchor="'
          +esc(it.align||'middle')+'" class="iwm-lab iwm-free'+(it.bold?' iwm-b':'')
          +(it.italic?' iwm-i':'')+'" data-px="'+(+it.size||15)+'" data-fixed="1"'
          +' style="fill:'+col+'">'+esc(iwRTx(it.label||''))+'</text></g>';
      }
      if(it.kind==='zone'){
        o='<g'+tag+'><path d="'+pathOf(pts,true,iwBool(it.smooth,true))+'" fill="'+col
          +'" fill-opacity="'+(it.opacity!=null?it.opacity:0.28)+'" stroke="'+col
          +'" stroke-width="'+w+'"'+(it.dash?' stroke-dasharray="'+esc(it.dash)+'"':'')+'/>';
        if(it.label){ var cz=centroid(pts); o+=txtAt(cz[0],cz[1],it.label); }
        return o+'</g>';
      }
      // road / arrow
      var hd=it.kind==='arrow'?(it.heads||'end'):'none';
      var hs=Math.max(7,w*2.6);
      var line=pts;
      if(hd==='end'||hd==='both') line=trim(line,hs*0.82,true);
      if(hd==='start'||hd==='both') line=trim(line,hs*0.82,false);
      o='<g'+tag+'><path d="'+pathOf(line,false,iwBool(it.smooth,true))+'" fill="none" stroke="'+col
        +'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'
        +(it.dash?' stroke-dasharray="'+esc(it.dash)+'"':'')+'/>';
      if(hd==='end'||hd==='both') o+=head(pts[pts.length-1],pts[pts.length-2],hs,col);
      if(hd==='start'||hd==='both') o+=head(pts[0],pts[1],hs,col);
      if(it.label){ var m=midOfLine(pts); o+=txtAt(m[0],m[1]-w-fs(7),it.label); }
      return o+'</g>';
    }
    /* Le texte pose sur une carte est en UNITES DE CARTE : sur un planisphere
       de mille unites de large une etiquette de 10 se lit bien, mais des qu'on
       recadre sur le Maghreb la meme etiquette occupe le quart du dessin. On la
       rapporte donc a la vue courante, exactement comme les trames — a l'ecran,
       elle garde toujours la meme taille. */
    /* Le texte pose sur une carte est en UNITES DE CARTE : sur un planisphere de
       mille unites une etiquette de 10 se lit bien, mais recadre sur le Maghreb
       la meme etiquette occupe le quart du dessin. On ne peut pas la calculer a
       l'avance — il faut la LARGEUR REELLE du dessin, qui n'existe qu'une fois
       la mise en page faite. On note donc la taille voulue en pixels, et on la
       convertit juste apres (voir ajusteTexte). */
    var ECART=1;                       // unites de carte par pixel, mesurees
    function fs(k){ return Math.max(0.4,ECART*k); }
    function txtAt(x,y,t,k){
      return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" class="iwm-lab"'
        +' data-px="'+(k||11.5)+'">'+esc(iwRTx(t))+'</text>';
    }
    function ajusteTexte(){
      var svg=host.querySelector('.iwm-svg'); if(!svg) return;
      var large=svg.getBoundingClientRect().width||svg.clientWidth||1;
      ECART=view.w/large;
      var tt=[].slice.call(svg.querySelectorAll('[data-px]'));
      tt.forEach(function(t){
        var z=(+t.getAttribute('data-px'))*ECART;
        t.style.fontSize=z.toFixed(2)+'px';
        t.style.strokeWidth=(z*0.28).toFixed(2)+'px';
        if(t.__dy){ t.setAttribute('y',(+t.getAttribute('data-y0'))); t.__dy=0; }
        if(!t.hasAttribute('data-y0')) t.setAttribute('data-y0',t.getAttribute('y'));
      });
      /* Une etiquette centree sur un point du bord deborde du cadre : la moitie
         du mot tombe hors du dessin, et l'on lit « uakchott ». On ne la deplace
         que si elle deborde, et que de ce qu'il faut. Les textes tournes sont
         laisses tranquilles : leur boite n'est pas celle qu'on voit. */
      var marge=view.w*0.006;
      tt.forEach(function(t){
        if(!t.hasAttribute('data-x0')) t.setAttribute('data-x0',t.getAttribute('x'));
        t.setAttribute('x',t.getAttribute('data-x0'));
      });
      tt.forEach(function(t){
        var g=t.parentNode;
        if(g&&g.getAttribute&&g.getAttribute('transform')) return;
        var b; try{ b=t.getBBox(); }catch(e){ return; }
        if(!b||!b.width) return;
        var d=0;
        if(b.x<view.x+marge) d=(view.x+marge)-b.x;
        else if(b.x+b.width>view.x+view.w-marge) d=(view.x+view.w-marge)-(b.x+b.width);
        if(d) t.setAttribute('x',((+t.getAttribute('data-x0'))+d).toFixed(1));
      });
      declutter(tt);
    }
    /* Des etiquettes qui se marchent dessus rendent une carte illisible, et sur
       une carte on ne peut pas se contenter de les ecarter au hasard : une
       etiquette doit rester pres de ce qu'elle nomme. On les remonte donc d'un
       cran a la fois, de la plus courte a la plus longue, et l'on s'arrete des
       que plus rien ne se touche — quelques pixels suffisent presque toujours. */
    function declutter(tt){
      if(tt.length<2) return;
      var boites=function(){ return tt.map(function(t){ return t.getBoundingClientRect(); }); };
      var ordre=tt.filter(function(t){ return !t.hasAttribute('data-fixed'); })
        .sort(function(a,b2){
          return a.getComputedTextLength()-b2.getComputedTextLength(); });
      if(!ordre.length) return;
      for(var pas=0;pas<14;pas++){
        var r=boites(), bouge=false;
        for(var i=0;i<ordre.length;i++){
          var ia=tt.indexOf(ordre[i]);
          for(var j=0;j<tt.length;j++){
            if(j===ia) continue;
            var a=r[ia], b3=r[j];
            if(Math.min(a.right,b3.right)-Math.max(a.left,b3.left)>1
              && Math.min(a.bottom,b3.bottom)-Math.max(a.top,b3.top)>1){
              var t=ordre[i], y0=+t.getAttribute('data-y0');
              t.__dy=(t.__dy||0)-1.15*(+t.getAttribute('data-px'))*ECART;
              // on ne s'eloigne jamais de plus de trois hauteurs de ligne
              if(Math.abs(t.__dy)>3.6*(+t.getAttribute('data-px'))*ECART){ t.__dy=0; }
              t.setAttribute('y',(y0+t.__dy).toFixed(1));
              bouge=true; break;
            }
          }
          if(bouge) break;
        }
        if(!bouge) break;
      }
    }

    /* ── the legend ───────────────────────────────────────────────────────
       Chaque entree se dessine avec le MEME code que l'objet qu'elle annonce :
       une route en pointille rouge apparait dans la legende en pointille rouge,
       une aire hachuree avec ses hachures, des cercles proportionnels avec
       leurs tailles. Une legende dessinee a part finit toujours par mentir. */
    function swatch(e){
      var col=esc(e.color||'#888'), s='<svg class="iwm-sw" viewBox="0 0 26 16" aria-hidden="true">';
      if(e.type==='line'||e.type==='arrow'){
        var w=Math.max(1.6,Math.min(5,+e.width||3));
        var x2=e.type==='arrow'?18:24;
        s+='<path d="M2 8H'+x2+'" stroke="'+col+'" stroke-width="'+w+'" fill="none" stroke-linecap="round"'
          +(e.dash?' stroke-dasharray="'+esc(e.dash)+'"':'')+'/>';
        if(e.type==='arrow') s+='<path d="M24 8L17 4.6V11.4Z" fill="'+col+'"/>';
      } else if(e.type==='marker'){
        s+=markerShape(e.shape||'disc',13,8,6,col).replace('var(--paper)','#fff');
      } else if(e.type==='graduated'){
        s+='<circle cx="9" cy="8" r="7" fill="'+col+'" fill-opacity=".35" stroke="'+col+'"/>'
          +'<circle cx="9" cy="10.5" r="4" fill="'+col+'" fill-opacity=".55" stroke="'+col+'"/>'
          +'<circle cx="21" cy="12" r="2.4" fill="'+col+'" fill-opacity=".7" stroke="'+col+'"/>';
      } else if(e.type==='zone'){
        s+='<rect x="2" y="3" width="22" height="10" rx="2" fill="'+col+'" fill-opacity=".30" stroke="'+col+'" stroke-width="1.6"'
          +(e.dash?' stroke-dasharray="'+esc(e.dash)+'"':'')+'/>';
      } else {
        /* La pastille porte SA PROPRE trame, taillee pour 26x16 : celle de la
           carte est reglee sur la vue et deborderait completement une vignette
           de seize pixels de haut. */
        var f=col;
        if(e.texture&&TEX[e.texture]){
          var lid=texId(e.texture,e.color||'#888')+'l';
          s+='<defs>'+texDef(lid,e.texture,e.color||'#888',560)+'</defs>';
          f='url(#'+lid+')';
        }
        s+='<rect x="2" y="2" width="22" height="12" rx="2.5" fill="'+f+'" stroke="'+col+'" stroke-width="1"/>';
      }
      return s+'</svg>';
    }
    function legendRows(st){
      var rows=[];
      (st.parts||[]).forEach(function(p){
        if(p.legend===false||!p.label||!p.color) return;
        rows.push({type:'area',color:p.color,texture:p.texture,text:p.label,cat:p.cat||'',
          quiz:quizOn&&iwBool(p.blankName,false),id:p.id,
          pickable:quizOn&&iwBool(p.blankColor,false)});
      });
      (st.items||[]).forEach(function(it){
        if(!iwBool(it.legend,false)||!it.label) return;
        rows.push({type:it.kind==='road'?'line':(it.kind==='onion'?'graduated':it.kind),
          color:it.color,width:it.width,dash:it.dash,shape:it.shape,text:it.label,cat:it.cat||''});
      });
      /* Une vignette qui ne designe aucune partie : « zone aride », « moins de
         dix habitants au km2 ». Les cartes d'avant la refonte en etaient
         pleines et la nouvelle legende les perdait toutes. */
      (LG.keys||[]).forEach(function(k){
        if(!k||!k.label) return;
        rows.push({type:k.kind||'area',color:k.color||'#888',texture:k.texture,
          dash:k.dash,shape:k.shape,width:k.width,text:k.label,cat:k.cat||''});
      });
      (LG.notes||[]).forEach(function(n){ if(n&&n.text) rows.push({type:'note',text:n.text,cat:n.cat||''}); });
      /* Regrouper ce qui porte la meme couleur.
         Sur une carte thematique, dix pays de la meme teinte disent UNE chose —
         « pays exportateurs » — et non dix. La legende les listait un par un,
         ce qui la rendait illisible et faisait perdre la lecture. Reunis, ils
         donnent une ligne, sous le nom que l'auteur choisit ; faute de nom, on
         enumere, ce qui reste plus court que dix lignes.
         Le quiz ne se regroupe pas : chaque pastille y est cliquable, et deux
         reponses fondues en une n'en seraient plus une. */
      if(iwBool(LG.groupByColor,false)&&!quizOn){
        var noms={};
        (LG.colorNames||[]).forEach(function(c){
          if(c&&c.color) noms[String(c.color).toLowerCase()]=c.label||''; });
        var vus={}, fondu=[];
        rows.forEach(function(r){
          if(r.type!=='area'||!r.color){ fondu.push(r); return; }
          /* La clef est la COULEUR SEULE, sans le remplissage.
             L'auteur demande « ces regions ont la meme couleur, mets-les
             ensemble » ; deux teintes identiques dont l'une est hachuree
             restaient separees, et le regroupement paraissait ne rien faire.
             La ligne fusionnee garde le remplissage de la premiere. */
          var k=String(r.color).toLowerCase();
          if(!vus[k]){
            var copie={}; for(var q in r) if(Object.prototype.hasOwnProperty.call(r,q)) copie[q]=r[q];
            copie.membres=[r.text]; vus[k]=copie; fondu.push(copie);
          } else if(vus[k].membres.indexOf(r.text)<0) vus[k].membres.push(r.text);
        });
        fondu.forEach(function(r){
          if(!r.membres) return;
          var nom=noms[String(r.color).toLowerCase()];
          /* Une seule region gardee seule : son propre nom, jamais un nom de
             groupe qui ferait croire a un ensemble. */
          r.text=(r.membres.length>1&&nom)?nom:r.membres.join(', ');
          delete r.membres;
        });
        rows=fondu;
      }
      return rows;
    }
    function legendHtml(st){
      if(iwBool(LG.hidden,false)) return '';
      var rows=legendRows(st);
      /* La gamme d'une choroplethe est une echelle, pas une liste de symboles :
         ses pastilles se touchent, comme sur un thermometre, et se lisent dans
         l'ordre. On la met en tete, avant les symboles ponctuels. */
      var CH=choro(st), gamme='';
      if(CH){
        gamme='<div class="iwm-lgroup iwm-lramp">'
          +(CH.cf.title?'<div class="iwm-lcat">'+esc(iwRTx(CH.cf.title))+'</div>':'')
          +'<div class="iwm-ramp">'+CH.rows().map(function(r){
            return '<span class="iwm-rstep"><i style="background:'+esc(r.color)+'"></i>'
              +esc(r.text)+'</span>'; }).join('')+'</div>'
          +(CH.cf.absent?'<span class="iwm-lrow"><svg class="iwm-sw" viewBox="0 0 26 16" aria-hidden="true">'
            +'<rect x="2" y="2" width="22" height="12" rx="2.5" fill="'+esc(CH.cf.absent)
            +'" stroke="rgba(0,0,0,.25)"/></svg>'+esc(iwRTx(CH.cf.absentLabel||'donnee absente'))
            +'</span>':'')
          +'</div>';
      }
      if(!rows.length&&!gamme) return '';
      // group by category, in the order the categories first appear
      var order=[], byCat={};
      rows.forEach(function(r){ var k=r.cat||''; if(!byCat[k]){byCat[k]=[];order.push(k);} byCat[k].push(r); });
      var side=LG.side?' iwm-legend-side':'';
      var cols=(+LG.cols>1&&!LG.side)?' iwm-l'+Math.min(3,+LG.cols):'';
      var h='<div class="iwm-legend'+side+cols+'">'
        +(LG.title?'<div class="iwm-legend-t">'+esc(iwRTx(LG.title))+'</div>':'')
        +gamme;
      order.forEach(function(k){
        h+='<div class="iwm-lgroup">'
          +(k?'<div class="iwm-lcat">'+esc(iwRTx(k))+'</div>':'')
          +byCat[k].map(function(r){
            if(r.type==='note') return '<span class="iwm-lrow iwm-lnote">'+iwRT(r.text)+'</span>';
            var lab=r.quiz
              ? '<input class="iwm-qin" data-qz="'+esc(r.id)+'" value="'+esc(QZ.txt[r.id]||'')
                +'" autocomplete="off" spellcheck="false" aria-label="nom a completer">'
              : esc(iwRTx(r.text));
            return '<span class="iwm-lrow'+(r.pickable?' iwm-lpick':'')+'"'
              +(r.pickable?' data-pick="'+esc(r.color)+'" title="Cliquez, puis cliquez la partie sur la carte"':'')
              +'>'+swatch(r)+lab+'</span>';
          }).join('')
        +'</div>';
      });
      return h+'</div>';
    }

    /* ── one render ───────────────────────────────────────────────────── */
    var host=el('div','iwm-host');
    function render(){
      var st=steps[cur]||{}, src=build(st);
      var parts=st.parts||[], items=st.items||[];
      var byId={}; parts.forEach(function(p){ byId[p.id]=p; });
      var CH=choro(st);

      var base=[src.ox||0,src.oy||0,src.w,src.h];
      if(iwBool(c.fit,false)&&src.shapes){
        var xs=[],ys=[];
        src.shapes.forEach(function(s){ var q=byId[s.id];
          if(!s.d||!q||(!q.color&&!(CH&&CH.fill(q))))return;
          var m=s.d.match(new RegExp('-?[0-9.]+','g'))||[];
          for(var i=0;i<m.length;i+=2){ xs.push(+m[i]); ys.push(+m[i+1]); } });
        /* Le recadrage tient compte des TRACES autant que des parties coloriees.
           Cale sur les seules parties, il coupait les fleches et les reperes que
           l'auteur venait de poser — on recadrait sur la carte en perdant ce
           qu'elle avait a dire. */
        items.forEach(function(it){
          (it.pts||[]).forEach(function(q){ xs.push(q[0]); ys.push(q[1]); });
          if(it.kind==='onion'&&it.pts&&it.pts[0]){ var r=+it.r||70;
            xs.push(it.pts[0][0]-r,it.pts[0][0]+r); ys.push(it.pts[0][1]-r,it.pts[0][1]+r); }
        });
        parts.forEach(function(p){ if(p.at){ xs.push(p.at[0]); ys.push(p.at[1]); } });
        if(xs.length){
          var pad=Math.max(14,(Math.max.apply(null,xs)-Math.min.apply(null,xs))*0.07);
          base=[Math.min.apply(null,xs)-pad,Math.min.apply(null,ys)-pad,
            Math.max.apply(null,xs)-Math.min.apply(null,xs)+pad*2,
            Math.max.apply(null,ys)-Math.min.apply(null,ys)+pad*2];
        }
      }
      if(!view||view.of!==cur+'|'+stack.length) view={of:cur+'|'+stack.length,x:base[0],y:base[1],w:base[2],h:base[3],base:base};

      // les trames, une fois la vue connue : leur finesse en depend
      var defs='', seen={};
      parts.forEach(function(p){ if(p.texture&&TEX[p.texture]&&p.color&&!seen[p.texture+p.color]){
        seen[p.texture+p.color]=1; defs+=texDef(texId(p.texture,p.color),p.texture,p.color,view.w); } });
      var body='<defs>'+defs+'</defs>';
      if(src.inner){
        body+='<g class="iwm-land">'+src.inner+'</g>';
      } else if(src.shapes){
        body+='<g class="iwm-land">';
        src.shapes.forEach(function(s){
          var p=byId[s.id], f=CH?CH.fill(p):fillOf(p);
          var hide=quizOn&&p&&iwBool(p.blankColor,false)&&!QZ.col[s.id];
          var fill=hide?null:(QZ.col[s.id]||f);
          var cls='iwm-p'+(p&&p.sub?' iwm-into':'')+(p&&(p.desc||p.label)?' iwm-named':'')
            +(hide?' iwm-blank':'');
          body+='<path data-part="'+esc(s.id)+'" d="'+s.d+'" class="'+cls+'"'
            +(fill?' style="fill:'+esc(fill)+'"':'')+'>'
            +'<title>'+esc(p&&p.label?iwRTx(p.label):s.name)+'</title></path>';
        });
        body+='</g>';
      }
      /* L'ordre du dessin : la terre, puis ce que l'auteur a trace, et les NOMS
         EN DERNIER. Poses avant, un repere ou une fleche passait par-dessus le
         nom d'un pays et l'effacait a moitie. Un nom se lit toujours. */
      body+=decoSvg(src);
      items.forEach(function(it,i){ body+=itemSvg(it,i); });
      parts.forEach(function(p){
        if(!p.label||!p.at||iwBool(p.hideName,false)) return;
        if(quizOn&&iwBool(p.blankName,false)) return;
        body+='<text x="'+p.at[0]+'" y="'+p.at[1]+'" text-anchor="middle" class="iwm-name"'
          +' data-px="13">'+esc(iwRTx(p.label))+'</text>';
      });

      var slider=steps.length>1
        ? '<div class="iwm-steps">'
          +'<button type="button" class="iwm-nav" data-step="-1" aria-label="Etape precedente">&#8249;</button>'
          +'<input type="range" min="0" max="'+(steps.length-1)+'" value="'+cur+'" data-stepr aria-label="Etape">'
          +'<button type="button" class="iwm-nav" data-step="1" aria-label="Etape suivante">&#8250;</button>'
          +'<span class="iwm-steplab">'+esc(iwRTx(steps[cur].label||('Etape '+(cur+1))))+'</span>'
          +'<span class="iwm-stepn">'+(cur+1)+' / '+steps.length+'</span></div>'
        : '';
      var crumb=stack.length
        ? '<div class="iwm-crumb"><button type="button" class="iwm-back" data-mback>&#8249; Revenir</button>'
          +'<span>'+esc(stack[stack.length-1].into||'')+'</span></div>' : '';
      /* La barre du quiz ne s'affiche que sur les etapes qui ont VRAIMENT un
         blanc a remplir. Affichee partout, elle proposait de verifier une carte
         ou il n'y avait rien a completer. */
      var desBlancs=quizOn&&parts.some(function(p){
        return iwBool(p.blankName,false)||iwBool(p.blankColor,false); });
      var qbar=desBlancs
        ? '<div class="iwm-quiz">'+(QC.prompt?'<span>'+iwRT(QC.prompt)+'</span>':'')
          +'<button type="button" class="iwm-qbtn" data-q="check">Verifier</button>'
          +'<button type="button" class="iwm-qbtn" data-q="show">'+T('show','Montrer')+'</button>'
          +'<button type="button" class="iwm-qbtn" data-q="reset">'+T('clear','Effacer')+'</button>'
          +'<span class="iwm-qscore" data-qscore></span></div>'
        : '';

      /* Une legende posee SUR la carte doit vivre DANS le cadre de la carte :
         placee a cote, elle se calait sur la boite entiere du composant, passait
         par-dessus la barre de quiz et debordait par le bas. */
      var lg=legendHtml(st);
      host.innerHTML=(c.title&&!stack.length?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')
        +crumb+slider+qbar
        +'<div class="iwm-stage'+(LG.side?' iwm-hasside':'')+'">'
          +'<div class="iwm-zoom">'
            +'<button type="button" data-mz="out" aria-label="Dezoomer">&#8722;</button>'
            +'<button type="button" data-mz="fit" aria-label="Ajuster">&#10530;</button>'
            +'<button type="button" data-mz="in" aria-label="Zoomer">+</button></div>'
          +'<svg class="iwm-svg" viewBox="'+[view.x,view.y,view.w,view.h].join(' ')
          +'" preserveAspectRatio="xMidYMid meet" role="img">'+body+'</svg>'
          +(LG.side?lg:'')
        +'</div>'
        +(LG.side?'':lg)
        +'<div class="iwm-pop" data-mpop hidden></div>';
      if(src.inner) habilleSvg(byId,CH);
      if(desBlancs) paintScore();
      ajusteTexte();
    }
    // la largeur du dessin change avec la fenetre : les etiquettes suivent
    if(window.ResizeObserver){
      var ro=new ResizeObserver(function(){ ajusteTexte(); });
      ro.observe(box);
    } else { window.addEventListener('resize',ajusteTexte); }

    /* ── zoom that zooms about the middle, and a map you can drag ──────── */
    function zoomBy(k){
      var cx=view.x+view.w/2, cy=view.y+view.h/2;
      var w=Math.max(view.base[2]/12,Math.min(view.base[2],view.w*k));
      var h=w*view.base[3]/view.base[2];
      view.w=w; view.h=h; view.x=cx-w/2; view.y=cy-h/2; clampView(); render();
    }
    function clampView(){
      var b=view.base;
      view.x=Math.max(b[0]-view.w*0.25,Math.min(b[0]+b[2]-view.w*0.75,view.x));
      view.y=Math.max(b[1]-view.h*0.25,Math.min(b[1]+b[3]-view.h*0.75,view.y));
    }

    function enter(partId){
      var st=steps[cur]||{}, p=null;
      (st.parts||[]).forEach(function(x){ if(x.id===partId)p=x; });
      if(!p||!p.sub||!p.sub.steps||!p.sub.steps.length) return false;
      stack.push({into:p.label||partId,steps:steps,cur:cur});
      steps=p.sub.steps; cur=0; view=null; render(); return true;
    }
    function leave(){ var s=stack.pop(); if(!s)return; steps=s.steps; cur=s.cur; view=null; render(); }

    function showPop(html){
      var pop=host.querySelector('[data-mpop]'); if(!pop)return;
      pop.hidden=false;
      pop.innerHTML='<button type="button" class="iwm-popx" data-mpopx aria-label="Fermer">&#215;</button>'+html;
    }
    function paintScore(){
      var st=steps[cur]||{}, tot=0, ok=0;
      (st.parts||[]).forEach(function(p){
        if(iwBool(p.blankName,false)&&p.label){ tot++; if(qNorm(QZ.txt[p.id])===qNorm(p.label))ok++; }
        if(iwBool(p.blankColor,false)&&p.color){ tot++; if(QZ.col[p.id]===p.color)ok++; }
      });
      var s=host.querySelector('[data-qscore]');
      if(s) s.textContent=QZ.done?(ok+' / '+tot):'';
      if(QZ.done){
        host.querySelectorAll('[data-qz]').forEach(function(inp){
          var p=null; (st.parts||[]).forEach(function(x){ if(x.id===inp.getAttribute('data-qz'))p=x; });
          inp.classList.toggle('ok',!!p&&qNorm(inp.value)===qNorm(p.label));
          inp.classList.toggle('ko',!(!!p&&qNorm(inp.value)===qNorm(p.label)));
        });
      }
    }

    host.addEventListener('click',function(e){
      var t=e.target;
      var z=t.closest('[data-mz]');
      if(z){ var k=z.getAttribute('data-mz');
        if(k==='in')zoomBy(1/1.4); else if(k==='out')zoomBy(1.4);
        else { view=null; render(); } return; }
      if(t.closest('[data-mback]')){ leave(); return; }
      var nav=t.closest('[data-step]');
      if(nav){ cur=Math.max(0,Math.min(steps.length-1,cur+ +nav.getAttribute('data-step'))); view=null; render(); return; }
      var q=t.closest('[data-q]');
      if(q){ var a=q.getAttribute('data-q');
        if(a==='check'){ QZ.done=true; }
        else if(a==='show'){ var st0=steps[cur]||{};
          (st0.parts||[]).forEach(function(p){ if(p.label)QZ.txt[p.id]=p.label; if(p.color)QZ.col[p.id]=p.color; });
          QZ.done=true; }
        else { QZ.txt={}; QZ.col={}; QZ.done=false; QZ.pick=null; }
        render(); return; }
      var pick=t.closest('[data-pick]');
      if(pick){ QZ.pick=pick.getAttribute('data-pick');
        host.querySelectorAll('.iwm-lpick').forEach(function(x){x.classList.remove('on');});
        pick.classList.add('on'); return; }
      var path=t.closest('[data-part]');
      if(path){
        var id=path.getAttribute('data-part');
        if(quizOn&&QZ.pick){ QZ.col[id]=QZ.pick; QZ.done=false; render(); return; }
        if(enter(id)) return;
        var st1=steps[cur]||{}, p1=null;
        (st1.parts||[]).forEach(function(x){ if(x.id===id)p1=x; });
        if(p1&&(p1.desc||p1.label)){
          showPop((p1.label?'<h4>'+esc(iwRTx(p1.label))+'</h4>':'')
            +(p1.desc?'<div>'+iwRT(p1.desc)+'</div>':''));
        }
        return;
      }
      var mi=t.closest('[data-mi]');
      if(mi){
        var it=(steps[cur].items||[])[+mi.getAttribute('data-mi')];
        if(it&&it.popup&&(it.popup.text||it.popup.img)){
          showPop((it.popup.img?'<img src="'+esc(it.popup.img)+'" alt="">':'')
            +(it.popup.text?'<div>'+iwRT(it.popup.text)+'</div>':''));
        }
        return;
      }
      if(t.closest('[data-mpopx]')){ var pp=host.querySelector('[data-mpop]'); if(pp)pp.hidden=true; }
    });
    host.addEventListener('input',function(e){
      var t=e.target;
      if(t.hasAttribute('data-stepr')){ cur=+t.value; view=null; render(); return; }
      if(t.hasAttribute('data-qz')){ QZ.txt[t.getAttribute('data-qz')]=t.value; QZ.done=false; }
    });
    // drag to pan, once zoomed in
    host.addEventListener('pointerdown',function(e){
      var svg=e.target.closest('.iwm-svg'); if(!svg||view.w>=view.base[2]*0.999) return;
      drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,w:svg.clientWidth||1};
      svg.setPointerCapture&&svg.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove',function(e){
      if(!drag) return;
      var k=view.w/drag.w;
      view.x=drag.vx-(e.clientX-drag.x)*k; view.y=drag.vy-(e.clientY-drag.y)*k;
      clampView();
      var svg=host.querySelector('.iwm-svg');
      if(svg) svg.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '));
    });
    window.addEventListener('pointerup',function(){ drag=null; });

    box.className='iw iw-card iw-map';
    /* Les <template> qui portent le SVG de l'auteur vivent DANS cette boite.
       Les effacer avant de dessiner, c'etait perdre le fond : build() les
       cherchait ensuite et ne trouvait rien, si bien qu'une carte batie sur un
       SVG maison sortait vide -- sans erreur, sans avertissement. */
    var garde=document.createDocumentFragment();
    [].slice.call(box.querySelectorAll('template[data-mapsvg]'))
      .forEach(function(t){ garde.appendChild(t); });
    box.innerHTML='';
    box.appendChild(garde);
    box.appendChild(host);
    render();
  };
  /* ── matching: real drag-and-drop with tap-to-place fallback, text or images ── */
  R.match=function(box,c){
    var pairs=(c.pairs||[]).filter(function(p){return (p.left||p.leftImg)&&(p.right||p.rightImg);});
    box.className='iw iw-card iw-match';
    function cell(txt,img){ var h=''; if(img)h+='<img class="iwx-img" src="'+esc(img)+'" alt="'+esc(txt||'')+'">'; if(txt!=null&&txt!=='')h+='<span class="iwx-txt">'+esc(txt)+'</span>'; return h||'<span class="iwx-txt">·</span>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwx-grid"><div class="iwx-col iwx-left"></div></div>'+
      '<div class="iwx-bankwrap"><div class="iwx-banklabel">Glissez chaque étiquette dans sa case — ou touchez-en une, puis la case.</div><div class="iwx-bank"></div></div>'+
      '<div class="iwx-actions"><button class="iw-btn iwx-check">'+T('check','Vérifier')+'</button><button class="iw-btn iwx-reset" style="background:transparent;color:var(--slate);border:1px solid var(--rule)">'+T('clear','Effacer')+'</button><span class="iwx-msg"></span></div>';
    var L=box.querySelector('.iwx-left'), bank=box.querySelector('.iwx-bank'), msg=box.querySelector('.iwx-msg');
    var order=pairs.map(function(p,i){return i;});
    for(var i=order.length-1;i>0;i--){var j=hash('m'+i+(pairs[i].right||pairs[i].rightImg||''))%(i+1);var t=order[i];order[i]=order[j];order[j]=t;}
    var sel=null, placed={}, dragPair=null;
    function slotOf(idx){ for(var k in placed){ if(placed[k]===idx)return +k; } return -1; }
    function clearMsg(){ msg.textContent=''; msg.className='iwx-msg'; box.querySelectorAll('.iwx-slot').forEach(function(s){s.classList.remove('ok','no');}); }
    function render(){
      L.innerHTML='';
      pairs.forEach(function(p,i){ var s=el('div','iwx-slot'); s.dataset.i=i;
        var drop=placed[i]!=null
          ? '<span class="iwx-tile placed" draggable="true" data-pair="'+placed[i]+'">'+cell(pairs[placed[i]].right,pairs[placed[i]].rightImg)+'</span>'
          : '<span class="iwx-ph">drop here</span>';
        s.innerHTML='<span class="iwx-key">'+cell(p.left,p.leftImg)+'</span><span class="iwx-drop">'+drop+'</span>'; L.appendChild(s); });
      bank.innerHTML='';
      order.forEach(function(idx){ if(slotOf(idx)>=0)return; var t=el('button','iwx-tile'+(sel===idx?' sel':'')); t.setAttribute('draggable','true'); t.dataset.pair=idx; t.innerHTML=cell(pairs[idx].right,pairs[idx].rightImg); bank.appendChild(t); });
      wireTiles(); wireSlots();
    }
    function placeInto(slot,idx){ var prev=slotOf(idx); if(prev>=0)delete placed[prev]; placed[slot]=idx; sel=null; clearMsg(); render(); }
    function toBank(idx){ var prev=slotOf(idx); if(prev>=0)delete placed[prev]; sel=null; clearMsg(); render(); }
    function wireTiles(){ box.querySelectorAll('.iwx-tile').forEach(function(t){ var idx=+t.dataset.pair;
      t.addEventListener('dragstart',function(e){ dragPair=idx; try{e.dataTransfer.setData('text/plain',String(idx));e.dataTransfer.effectAllowed='move';}catch(_){ } t.classList.add('dragging'); });
      t.addEventListener('dragend',function(){ dragPair=null; t.classList.remove('dragging'); });
      t.addEventListener('click',function(){ if(t.classList.contains('placed'))toBank(idx); else { sel=(sel===idx?null:idx); render(); } }); }); }
    function wireSlots(){ box.querySelectorAll('.iwx-slot').forEach(function(s){ var slot=+s.dataset.i;
      s.addEventListener('dragover',function(e){ e.preventDefault(); s.classList.add('over'); });
      s.addEventListener('dragleave',function(){ s.classList.remove('over'); });
      s.addEventListener('drop',function(e){ e.preventDefault(); s.classList.remove('over'); if(dragPair!=null)placeInto(slot,dragPair); });
      s.addEventListener('click',function(e){ if(e.target.closest('.iwx-tile'))return; if(sel!=null)placeInto(slot,sel); }); }); }
    bank.addEventListener('dragover',function(e){ e.preventDefault(); });
    bank.addEventListener('drop',function(e){ e.preventDefault(); if(dragPair!=null)toBank(dragPair); });
    box.querySelector('.iwx-check').addEventListener('click',function(){ var all=true,ok=0;
      box.querySelectorAll('.iwx-slot').forEach(function(s,i){ var good=placed[i]===i; s.classList.toggle('ok',good); s.classList.toggle('no',!good); if(good)ok++;else all=false; });
      msg.textContent=all?(c.successMsg||'Parfait — toutes les paires y sont !'):((c.failMsg||'Pas encore — réessayez.')+' ('+ok+'/'+pairs.length+')'); msg.className='iwx-msg '+(all?'ok':'no'); });
    box.querySelector('.iwx-reset').addEventListener('click',function(){ placed={}; sel=null; clearMsg(); render(); });
    render();
  };

  /* ── math (MathML native, or LaTeX subset) ── */
  var GREEK={alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω',Gamma:'Γ',Delta:'Δ',Theta:'Θ',Lambda:'Λ',Pi:'Π',Sigma:'Σ',Phi:'Φ',Psi:'Ψ',Omega:'Ω'};
  var OPS={times:'×',div:'÷',pm:'±',mp:'∓',cdot:'·',leq:'≤',geq:'≥',neq:'≠',approx:'≈',equiv:'≡',infty:'∞',partial:'∂',nabla:'∇',rightarrow:'→',Rightarrow:'⇒',leftarrow:'←',sum:'∑',prod:'∏',int:'∫',forall:'∀',exists:'∃',in:'∈',cup:'∪',cap:'∩'};
  function lexTex(s){var t=[],i=0;while(i<s.length){var ch=s[i];
    if(ch===BS){var m=(new RegExp('^[a-zA-Z]+')).exec(s.slice(i+1));if(m){t.push({c:m[0]});i+=1+m[0].length;}else{t.push({ch:s[i+1]||''});i+=2;}}
    else if(ch==='{'){t.push({o:1});i++;}else if(ch==='}'){t.push({o:0});i++;}
    else if(ch==='^'){t.push({sup:1});i++;}else if(ch==='_'){t.push({sub:1});i++;}
    else if(ch===' '){i++;}else{t.push({ch:ch});i++;}}return t;}
  function texToMML(tex){
    var toks=lexTex(tex||''), pos=0;
    function atom(){ var t=toks[pos]; if(!t)return '<mi></mi>';
      if(t.o===1){pos++;return '<mrow>'+seq(true)+'</mrow>';}
      if(t.c){pos++;
        if(t.c==='frac')return '<mfrac>'+atom()+atom()+'</mfrac>';
        if(t.c==='sqrt')return '<msqrt>'+atom()+'</msqrt>';
        if(GREEK[t.c])return '<mi>'+GREEK[t.c]+'</mi>';
        if(OPS[t.c])return '<mo>'+OPS[t.c]+'</mo>';
        return '<mi>'+esc(t.c)+'</mi>';}
      pos++; var ch=t.ch;
      if((new RegExp('[0-9.]')).test(ch))return '<mn>'+ch+'</mn>';
      if((new RegExp('[a-zA-Z]')).test(ch))return '<mi>'+ch+'</mi>';
      return '<mo>'+esc(ch)+'</mo>'; }
    function seq(stop){ var out=[]; while(pos<toks.length){ var t=toks[pos];
      if(stop&&t.o===0){pos++;break;} if(t.o===0){pos++;continue;}
      if(t.sup||t.sub){pos++;var base=out.pop()||'<mi></mi>';var tag=t.sup?'msup':'msub';out.push('<'+tag+'>'+base+atom()+'</'+tag+'>');continue;}
      out.push(atom()); } return out.join(''); }
    return seq(false);
  }
  R.math=function(box,c){
    box.className='iw iw-math'+(c.display!==false?' iw-math-display':'');
    if(c.mathml){ box.innerHTML=c.mathml; return; }
    box.innerHTML='<math xmlns="http://www.w3.org/1998/Math/MathML" display="'+(c.display!==false?'block':'inline')+'">'+texToMML(c.tex||c.code||'')+'</math>';
  };

  /* ── poll (client-side tally) ── */
  R.poll=function(box,c){
    box.className='iw iw-card iw-poll';
    var opts=c.options||[], KEY=(CFG.key||'book')+'_poll_'+(c.id||hash(c.question||''));
    var st; try{st=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){} if(!st||!st.counts||st.counts.length!==opts.length)st={counts:opts.map(function(){return 0;}),voted:-1};
    box.innerHTML='<div class="iw-title">'+esc(c.question||'')+'</div><div class="iwp-opts"></div><div class="iwp-foot"></div>';
    var oe=box.querySelector('.iwp-opts'), foot=box.querySelector('.iwp-foot');
    function render(){ var total=st.counts.reduce(function(a,b){return a+b;},0); oe.innerHTML='';
      opts.forEach(function(o,i){ var voted=st.voted>=0, pct=total?Math.round(st.counts[i]/total*100):0;
        var b=el('button','iwp-opt'+(st.voted===i?' mine':''));
        if(voted&&c.results!=='private'){ b.classList.add('done'); b.innerHTML='<span class="iwp-bar" style="width:'+pct+'%"></span><span class="iwp-l">'+esc(o)+'</span><span class="iwp-pct">'+pct+'%</span>'; }
        else { b.classList.toggle('done',voted); b.textContent=o; }
        if(!voted)b.addEventListener('click',function(){ st.counts[i]++; st.voted=i; try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){} render(); });
        oe.appendChild(b); });
      foot.textContent = st.voted>=0 ? (c.results==='private'?'Merci pour votre vote.':(total+' vote'+(total!==1?'s':'')+' pour l’instant')) : 'Touchez une réponse pour voter.'; }
    render();
  };

  /* ── quiz: multiple-choice, fill-in-the-blank (cloze), and fillable table ── */
  R.quiz=function(box,c){
    var qs=c.questions||[], uid=++SEQ; box.className='iw iw-card iw-quiz';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iwq-qs"></div><div class="iwq-actions"><button class="iw-btn iwq-submit">Corriger</button><span class="iwq-score"></span></div>';
    var qe=box.querySelector('.iwq-qs'), graders=[];
    function norm(s){return String(s==null?'':s).trim().toLowerCase().replace(/[ ]+/g,' ');}
    // A fillable token: [[answer]] | [[a/b]] (typed alternatives) | [[answer|opt1;opt2]] (dropdown)
    function parseTok(inner){ var bar=inner.indexOf('|'); var ansPart=(bar>=0?inner.slice(0,bar):inner).trim();
      var opts=bar>=0?inner.slice(bar+1).split(';').map(function(x){return x.trim();}).filter(Boolean):[];
      var alts=ansPart.split('/').map(function(x){return x.trim();}).filter(Boolean); if(!alts.length)alts=[ansPart];
      return {answer:alts[0],alts:alts,options:opts}; }
    function splitTokens(text){ var out=[],i=0,s=String(text||'');
      while(i<s.length){ var a=s.indexOf('[[',i); if(a<0){out.push({txt:s.slice(i)});break;} if(a>i)out.push({txt:s.slice(i,a)});
        var b=s.indexOf(']]',a+2); if(b<0){out.push({txt:s.slice(a)});break;} out.push({tok:s.slice(a+2,b)}); i=b+2; } return out; }
    // split a table row on "|" — but not on a "|" that lives inside a [[ … ]] token
    function splitRow(line){ var cells=[],cur='',i=0,depth=0; while(i<line.length){
      if(line.substr(i,2)==='[['){depth++;cur+='[[';i+=2;continue;}
      if(line.substr(i,2)===']]'){if(depth>0)depth--;cur+=']]';i+=2;continue;}
      if(line[i]==='|'&&depth===0){cells.push(cur);cur='';i++;continue;}
      cur+=line[i];i++; } cells.push(cur); return cells.map(function(x){return x.trim();}); }
    function field(meta,cls,key){ if(meta.options&&meta.options.length){
        return '<select class="'+cls+'" data-fk="'+key+'"><option value=""></option>'+meta.options.map(function(o){return '<option>'+esc(o)+'</option>';}).join('')+'</select>'; }
      return '<input type="text" class="'+cls+'" data-fk="'+key+'" autocomplete="off" spellcheck="false" size="'+Math.max(5,(meta.answer||'').length+2)+'">'; }
    function grade(meta,val){ return val!==''&&val!=null&&meta.alts.some(function(a){return norm(a)===norm(val);}); }
    qs.forEach(function(q,qi){ var kind=q.kind||'choice';
      var d=el('div','iwq-q'); var head='<div class="iwq-qt">'+(qi+1)+'. '+esc(q.q||'')+'</div>';
      if(q.img)head+='<img class="iwq-img" src="'+esc(q.img)+'" alt="" loading="lazy">';
      d.innerHTML=head; var body=el('div','iwq-body'); d.appendChild(body);
      if(kind==='blank'){ body.classList.add('iwq-cloze'); var metas=[]; var html='';
        splitTokens(q.text||'').forEach(function(p){ if(p.tok!=null){ var m=parseTok(p.tok); html+=field(m,'iwq-blank',metas.length); metas.push(m); } else html+=esc(p.txt); });
        body.innerHTML=html;
        graders.push(function(){ var ok=true; metas.forEach(function(m,bi){ var f=body.querySelector('[data-fk="'+bi+'"]'); var g=grade(m,f?f.value:''); if(f){f.classList.toggle('bk-ok',g);f.classList.toggle('bk-no',!g);} if(!g)ok=false; }); return ok; });
      } else if(kind==='table'){ var metas2=[];
        var rows=String(q.grid||'').split(String.fromCharCode(13)).join('').split(String.fromCharCode(10)).filter(function(l){return l.trim()!=='';}).map(splitRow);
        var t='<table class="iwq-table"><tbody>';
        rows.forEach(function(r,ri){ t+='<tr>'; r.forEach(function(cell){ var tag=(q.headerRow&&ri===0)?'th':'td'; var a=cell.indexOf('[['), b=cell.indexOf(']]');
          if(a>=0&&b>a){ var m=parseTok(cell.slice(a+2,b)); t+='<'+tag+'>'+field(m,'iwq-cell',metas2.length)+'</'+tag+'>'; metas2.push(m); }
          else t+='<'+tag+'>'+esc(cell)+'</'+tag+'>'; }); t+='</tr>'; });
        body.innerHTML=t+'</tbody></table>';
        graders.push(function(){ var ok=true; metas2.forEach(function(m,ci){ var f=body.querySelector('[data-fk="'+ci+'"]'); var g=grade(m,f?f.value:''); if(f){f.classList.toggle('bk-ok',g);f.classList.toggle('bk-no',!g);} if(!g)ok=false; }); return ok; });
      } else { var multi=Array.isArray(q.correct)&&q.correct.length>1;
        (q.options||[]).forEach(function(o,oi){ var lab=el('label','iwq-opt'); lab.innerHTML='<input type="'+(multi?'checkbox':'radio')+'" name="q'+uid+'_'+qi+'" value="'+oi+'">'; lab.appendChild(document.createTextNode(' '+o)); body.appendChild(lab); });
        graders.push(function(){ var cor=Array.isArray(q.correct)?q.correct:[q.correct]; var pick=[].slice.call(body.querySelectorAll('input:checked')).map(function(x){return +x.value;}); return cor.length===pick.length&&cor.every(function(v){return pick.indexOf(v)>=0;}); });
      }
      var ex=el('div','iwq-explain',esc(q.explain||'')); ex.style.display='none'; d.appendChild(ex); qe.appendChild(d); });
    box.querySelector('.iwq-submit').addEventListener('click',function(){ var score=0;
      qs.forEach(function(q,qi){ var ok=graders[qi](); var d=qe.children[qi]; d.classList.toggle('ok',ok); d.classList.toggle('no',!ok); if(q.explain)d.querySelector('.iwq-explain').style.display='block'; if(ok)score++; });
      var pct=qs.length?Math.round(score/qs.length*100):0, pass=pct>=(c.passScore||60);
      var s=box.querySelector('.iwq-score'); s.textContent=score+'/'+qs.length+' · '+pct+'% · '+(pass?(c.passMsg||'Réussi'):(c.failMsg||'À revoir')); s.className='iwq-score '+(pass?'ok':'no'); });
  };

  /* ── code editor + live preview ── */
  /* A one-pass highlighter. The old one ran four regular expressions over the
     escaped source in turn, so the markup the first pass inserted was fed to
     the next — and it looked for &quot;, which esc() never produces, so no
     string was ever coloured. Scanning once, in order, cannot make either
     mistake. */
  function hlCode(code,py){
    var NLh=String.fromCharCode(10);
    var KWJS='function return if else for while do var let const class new this true false null undefined import from export typeof switch case break continue try catch throw';
    var KWPY='def return if elif else for while in not and or is None True False import from as pass break continue global del lambda with try except finally raise class yield assert';
    var BIPY='print range len int float str bool list dict tuple set sum min max abs round sorted reversed enumerate zip input type chr ord pow divmod any all map filter open';
    var kw={}, bn={}, i, a=(py?KWPY:KWJS).split(' ');
    for(i=0;i<a.length;i++)kw[a[i]]=1;
    if(py){ var b=BIPY.split(' '); for(i=0;i<b.length;i++)bn[b[i]]=1; }
    var s='', j=0, n=code.length;
    function put(cls,txt){ s+=cls?('<span class="'+cls+'">'+esc(txt)+'</span>'):esc(txt); }
    while(j<n){
      var ch=code.charAt(j);
      if(ch==='#'||(!py&&ch==='/'&&code.charAt(j+1)==='/')){
        var e=code.indexOf(NLh,j); if(e<0)e=n; put('hl-c',code.slice(j,e)); j=e; continue; }
      if(ch==='"'||ch==="'"){
        var q=ch, k=j+1;
        while(k<n){ var ck=code.charAt(k);
          if(ck===BS){ k+=2; continue; }
          if(ck===q){ k++; break; }
          if(ck===NLh)break;
          k++; }
        put('hl-s',code.slice(j,k)); j=k; continue; }
      if(ch>='0'&&ch<='9'){
        var m=j;
        while(m<n){ var cm=code.charAt(m);
          if((cm>='0'&&cm<='9')||cm==='.'||cm==='_'){ m++; continue; } break; }
        put('hl-n',code.slice(j,m)); j=m; continue; }
      if((ch>='a'&&ch<='z')||(ch>='A'&&ch<='Z')||ch==='_'){
        var w=j;
        while(w<n){ var cw=code.charAt(w);
          if((cw>='a'&&cw<='z')||(cw>='A'&&cw<='Z')||(cw>='0'&&cw<='9')||cw==='_'){ w++; continue; } break; }
        var word=code.slice(j,w);
        put(kw[word]?'hl-k':(bn[word]?'hl-b':''),word); j=w; continue; }
      put('',ch); j++; }
    return s; }
  /* ── Python, for the code element ────────────────────────────────────────
     Picking "python" used to give no Run button and no output pane at all,
     because the preview was an iframe and an iframe cannot run Python. Books
     are offline files, so a real CPython (ten megabytes of WebAssembly) cannot
     be inlined into every one of them, and there is no server to post the
     program to.
     What a class actually runs is a small language: numbers, strings, lists,
     dicts, if, while, for, def. That fits in a tokeniser, a parser and a tree
     walker. Anything outside the subset stops with a message naming the line
     and the construct — never with a wrong answer, which in a textbook is
     worse than no answer. */
  var PY=(function(){
    var NLc=String.fromCharCode(10), TABc=String.fromCharCode(9), CRc=String.fromCharCode(13);
    function err(line,kind,msg){ var e=new Error(msg); e.py=1; e.line=line; e.kind=kind; return e; }

    /* ── tokeniser ── indentation becomes INDENT / DEDENT, so the parser can
       treat a block like any other bracketed thing ── */
    var OPS=['**=','//=','**','//','<=','>=','==','!=','+=','-=','*=','/=','%=','->',
      '(',')','[',']','{','}',',',':','.',';','+','-','*','/','%','<','>','='];
    var KW={'if':1,'elif':1,'else':1,'while':1,'for':1,'in':1,'def':1,'return':1,'break':1,
      'continue':1,'pass':1,'and':1,'or':1,'not':1,'is':1,'None':1,'True':1,'False':1,
      'import':1,'from':1,'as':1,'global':1,'del':1,'lambda':1};
    function lex(src){
      src=String(src==null?'':src).split(CRc).join('').split(TABc).join('    ');
      var lines=src.split(NLc), toks=[], stack=[0], depth=0, cont=false, ln, lastLine=1;
      function push(t,v,l){ toks.push({t:t,v:v,l:l}); }
      for(ln=0;ln<lines.length;ln++){
        var raw=lines[ln], line=ln+1, i=0, emitted=0;
        lastLine=line;
        if(depth===0&&!cont){
          while(i<raw.length&&raw.charAt(i)===' ')i++;
          var rest=raw.slice(i);
          if(rest===''||rest.charAt(0)==='#')continue;
          if(i>stack[stack.length-1]){ stack.push(i); push('INDENT','',line); }
          else while(i<stack[stack.length-1]){ stack.pop(); push('DEDENT','',line);
            if(i>stack[stack.length-1])throw err(line,'IndentationError',"l’indentation ne correspond à aucun bloc ouvert"); }
        }
        cont=false;
        while(i<raw.length){
          var ch=raw.charAt(i);
          if(ch===' '){ i++; continue; }
          if(ch==='#')break;
          if(ch===BS&&i===raw.length-1){ cont=true; i++; break; }
          // a string, possibly with an f prefix
          var fpre=false, qi=i;
          if((ch==='f'||ch==='F')&&(raw.charAt(i+1)==='"'||raw.charAt(i+1)==="'")){ fpre=true; qi=i+1; }
          if(raw.charAt(qi)==='"'||raw.charAt(qi)==="'"){
            var q=raw.charAt(qi), s='', j=qi+1, closed=false;
            /* A triple-quoted string runs across lines, so it is the one thing
               a line-at-a-time tokeniser has to reach forward for. Docstrings
               are the first line of half the functions in a textbook. */
            if(raw.slice(qi,qi+3)===q+q+q){
              var body='', k3=qi+3, fin=false;
              for(;;){
                var e3=raw.indexOf(q+q+q,k3);
                if(e3>=0){ body+=raw.slice(k3,e3); k3=e3+3; fin=true; break; }
                body+=raw.slice(k3)+NLc; ln++;
                if(ln>=lines.length)break;
                raw=lines[ln]; k3=0; }
              if(!fin)throw err(line,'SyntaxError',"cette chaîne sur trois guillemets n’est jamais refermée");
              push(fpre?'FSTR':'STR',body,line); i=k3; emitted++; continue; }
            while(j<raw.length){
              var cj=raw.charAt(j);
              if(cj===BS){ var nx=raw.charAt(j+1);
                if(nx==='n')s+=NLc; else if(nx==='t')s+=TABc; else if(nx===BS)s+=BS;
                else if(nx==='"')s+='"'; else if(nx==="'")s+="'";
                else if(nx==='0')s+=String.fromCharCode(0); else s+=nx;
                j+=2; continue; }
              if(cj===q){ j++; closed=true; break; }
              s+=cj; j++; }
            if(!closed)throw err(line,'SyntaxError',"cette chaîne de caractères n’est jamais refermée");
            push(fpre?'FSTR':'STR',s,line); i=j; emitted++; continue; }
          // a number
          if((ch>='0'&&ch<='9')||(ch==='.'&&raw.charAt(i+1)>='0'&&raw.charAt(i+1)<='9')){
            var k=i, dot=false, exp=false;
            while(k<raw.length){ var c2=raw.charAt(k);
              if(c2>='0'&&c2<='9'){ k++; continue; }
              if(c2==='_'){ k++; continue; }
              if(c2==='.'&&!dot&&!exp){ dot=true; k++; continue; }
              if((c2==='e'||c2==='E')&&!exp&&k>i){ var c3=raw.charAt(k+1);
                if((c3>='0'&&c3<='9')||((c3==='+'||c3==='-')&&raw.charAt(k+2)>='0'&&raw.charAt(k+2)<='9')){
                  exp=true; k+=(c3==='+'||c3==='-')?2:1; continue; } }
              break; }
            var txt=raw.slice(i,k).split('_').join('');
            push('NUM',{v:parseFloat(txt),f:(dot||exp)},line); i=k; emitted++; continue; }
          // a name or a keyword
          if((ch>='a'&&ch<='z')||(ch>='A'&&ch<='Z')||ch==='_'){
            var m=i;
            while(m<raw.length){ var c4=raw.charAt(m);
              if((c4>='a'&&c4<='z')||(c4>='A'&&c4<='Z')||(c4>='0'&&c4<='9')||c4==='_'){ m++; continue; }
              break; }
            var w=raw.slice(i,m);
            push(KW[w]?'KW':'NAME',w,line); i=m; emitted++; continue; }
          // an operator
          var got=null, oi;
          for(oi=0;oi<OPS.length;oi++)if(raw.slice(i,i+OPS[oi].length)===OPS[oi]){ got=OPS[oi]; break; }
          if(!got)throw err(line,'SyntaxError','caractère inattendu : '+ch);
          if(got==='('||got==='['||got==='{')depth++;
          if(got===')'||got===']'||got==='}')depth=Math.max(0,depth-1);
          push('OP',got,line); i+=got.length; emitted++; }
        if(emitted&&depth===0&&!cont)push('NEWLINE','',line); }
      if(toks.length&&toks[toks.length-1].t!=='NEWLINE')push('NEWLINE','',lastLine);
      while(stack.length>1){ stack.pop(); push('DEDENT','',lastLine); }
      push('EOF','',lastLine);
      return toks; }

    /* ── parser ── */
    function parse(toks){
      var p=0;
      function cur(){ return toks[p]; }
      function at(t,v){ var x=toks[p]; return !!x&&x.t===t&&(v===undefined||x.v===v); }
      function line(){ return toks[p]?toks[p].l:1; }
      function take(){ return toks[p++]; }
      function want(t,v,what){
        if(!at(t,v))throw err(line(),'SyntaxError','il manque '+(what||("'"+(v||t)+"'"))+" — trouvé "+describe(cur()));
        return toks[p++]; }
      function describe(x){ if(!x)return 'la fin du programme';
        if(x.t==='NEWLINE')return 'une fin de ligne'; if(x.t==='INDENT')return 'une indentation';
        if(x.t==='DEDENT')return 'une fin de bloc'; if(x.t==='EOF')return 'la fin du programme';
        return "'"+String(x.v&&x.v.v!==undefined?x.v.v:x.v)+"'"; }

      function program(){ var b=[]; while(!at('EOF')){ if(at('NEWLINE')){ take(); continue; } b.push(statement()); } return b; }
      function block(){
        want('OP',':');
        if(at('NEWLINE')){ take(); want('INDENT','','un bloc indenté');
          var b=[]; while(!at('DEDENT')&&!at('EOF')){ if(at('NEWLINE')){ take(); continue; } b.push(statement()); }
          want('DEDENT','','la fin du bloc'); return b; }
        return simpleLine(); }
      function simpleLine(){ var b=[simple()];
        while(at('OP',';')){ take(); if(at('NEWLINE'))break; b.push(simple()); }
        if(at('NEWLINE'))take();
        return b; }
      function statement(){
        var l=line();
        if(at('KW','if'))return ifStmt();
        if(at('KW','while')){ take(); var c=expr(); return {k:'while',c:c,b:block(),l:l}; }
        if(at('KW','for')){ take(); var tg=targetList(); want('KW','in'); var it=expr();
          return {k:'for',t:tg,it:it,b:block(),l:l}; }
        if(at('KW','def')){ take(); var nm=want('NAME',undefined,'un nom de fonction').v;
          want('OP','('); var ps=[], ds=[];
          while(!at('OP',')')){ var pn=want('NAME',undefined,'un nom de paramètre').v;
            var dv=null; if(at('OP','=')){ take(); dv=expr(); }
            ps.push(pn); ds.push(dv);
            if(at('OP',','))take(); else break; }
          want('OP',')');
          if(at('OP','->')){ take(); expr(); }               // a type hint is accepted and ignored
          return {k:'def',name:nm,params:ps,defaults:ds,b:block(),l:l}; }
        var st=simple();
        if(at('NEWLINE'))take();
        else if(at('OP',';')){ var rest=simpleLine(); return {k:'seq',b:[st].concat(rest),l:l}; }
        return st; }
      function ifStmt(){
        var l=line(); take();
        var arms=[{c:expr(),b:block()}], orelse=null;
        while(at('KW','elif')){ take(); arms.push({c:expr(),b:block()}); }
        if(at('KW','else')){ take(); orelse=block(); }
        return {k:'if',arms:arms,orelse:orelse,l:l}; }
      function simple(){
        var l=line();
        if(at('KW','pass')){ take(); return {k:'pass',l:l}; }
        if(at('KW','break')){ take(); return {k:'break',l:l}; }
        if(at('KW','continue')){ take(); return {k:'continue',l:l}; }
        if(at('KW','return')){ take();
          var e=(at('NEWLINE')||at('OP',';')||at('EOF'))?null:exprList();
          return {k:'return',e:e,l:l}; }
        if(at('KW','global')){ take(); var g=[g0()];
          function g0(){ return want('NAME',undefined,'un nom').v; }
          while(at('OP',',')){ take(); g.push(g0()); }
          return {k:'global',names:g,l:l}; }
        if(at('KW','del')){ take(); var dt=[expr()];
          while(at('OP',',')){ take(); dt.push(expr()); }
          return {k:'del',targets:dt,l:l}; }
        if(at('KW','import')){ take(); var mods=[];
          do { var mn=want('NAME',undefined,'un nom de module').v, al=mn;
            if(at('KW','as')){ take(); al=want('NAME',undefined,'un nom').v; }
            mods.push([mn,al]); } while(at('OP',',')&&take());
          return {k:'import',mods:mods,l:l}; }
        if(at('KW','from')){ take(); var fm=want('NAME',undefined,'un nom de module').v;
          want('KW','import'); var names=[];
          if(at('OP','*')){ take(); names=null; }
          else do { var nn=want('NAME',undefined,'un nom').v, na=nn;
            if(at('KW','as')){ take(); na=want('NAME',undefined,'un nom').v; }
            names.push([nn,na]); } while(at('OP',',')&&take());
          return {k:'from',mod:fm,names:names,l:l}; }
        var first=exprList();
        if(at('OP','=')){
          var tg=[first];
          while(at('OP','=')){ take(); tg.push(exprList()); }
          var val=tg.pop();
          return {k:'assign',targets:tg,e:val,l:l}; }
        var AUG={'+=':'+','-=':'-','*=':'*','/=':'/','//=':'//','%=':'%','**=':'**'};
        if(at('OP')&&AUG[cur().v]){ var op=AUG[take().v]; return {k:'aug',t:first,op:op,e:exprList(),l:l}; }
        return {k:'expr',e:first,l:l}; }
      function targetList(){
        var t=[target()];
        while(at('OP',',')){ take(); if(at('KW','in'))break; t.push(target()); }
        return t.length===1?t[0]:{k:'tuple',items:t}; }
      function target(){ return postfix(atom()); }
      function exprList(){
        var e=expr();
        if(!at('OP',','))return e;
        var items=[e];
        while(at('OP',',')){ take();
          if(at('NEWLINE')||at('OP','=')||at('EOF')||at('OP',')')||at('OP',']')||at('OP','}'))break;
          items.push(expr()); }
        return {k:'tuple',items:items}; }

      function expr(){ return ternary(); }
      function ternary(){
        var a=orExpr();
        if(at('KW','if')){ take(); var c=orExpr(); want('KW','else'); var b=ternary();
          return {k:'ifexp',c:c,a:a,b:b}; }
        return a; }
      function orExpr(){ var a=andExpr();
        while(at('KW','or')){ take(); a={k:'bool',op:'or',a:a,b:andExpr()}; } return a; }
      function andExpr(){ var a=notExpr();
        while(at('KW','and')){ take(); a={k:'bool',op:'and',a:a,b:notExpr()}; } return a; }
      function notExpr(){ if(at('KW','not')){ var l=line(); take(); return {k:'not',e:notExpr(),l:l}; } return comparison(); }
      function comparison(){
        var a=arith(), ops=[], rest=[];
        for(;;){
          var op=null, l=line();
          if(at('OP')&&['<','>','<=','>=','==','!='].indexOf(cur().v)>=0)op=take().v;
          else if(at('KW','in')){ take(); op='in'; }
          else if(at('KW','not')&&toks[p+1]&&toks[p+1].t==='KW'&&toks[p+1].v==='in'){ take(); take(); op='not in'; }
          else if(at('KW','is')){ take(); if(at('KW','not')){ take(); op='is not'; } else op='is'; }
          else break;
          ops.push({op:op,l:l}); rest.push(arith()); }
        if(!ops.length)return a;
        return {k:'cmp',first:a,ops:ops,rest:rest}; }
      function arith(){ var a=term();
        while(at('OP','+')||at('OP','-')){ var l=line(), op=take().v; a={k:'bin',op:op,a:a,b:term(),l:l}; } return a; }
      function term(){ var a=unary();
        while(at('OP','*')||at('OP','/')||at('OP','//')||at('OP','%')){ var l=line(), op=take().v; a={k:'bin',op:op,a:a,b:unary(),l:l}; } return a; }
      function unary(){
        if(at('OP','-')||at('OP','+')){ var l=line(), op=take().v; return {k:'un',op:op,e:unary(),l:l}; }
        return power(); }
      function power(){ var a=postfix(atom());
        if(at('OP','**')){ var l=line(); take(); return {k:'bin',op:'**',a:a,b:unary(),l:l}; }
        return a; }
      function postfix(a){
        for(;;){
          var l=line();
          if(at('OP','(')){ take(); var ar=[], kw=[];
            while(!at('OP',')')){
              if(at('NAME')&&toks[p+1]&&toks[p+1].t==='OP'&&toks[p+1].v==='='){
                var kn=take().v; take(); kw.push([kn,expr()]); }
              else ar.push(expr());
              if(at('OP',','))take(); else break; }
            want('OP',')'); a={k:'call',fn:a,args:ar,kw:kw,l:l}; continue; }
          if(at('OP','[')){ take();
            var lo=null, hi=null, stp=null, isSlice=false;
            if(!at('OP',':'))lo=expr();
            if(at('OP',':')){ isSlice=true; take();
              if(!at('OP',']')&&!at('OP',':'))hi=expr();
              if(at('OP',':')){ take(); if(!at('OP',']'))stp=expr(); } }
            want('OP',']');
            a=isSlice?{k:'slice',o:a,lo:lo,hi:hi,st:stp,l:l}:{k:'index',o:a,i:lo,l:l}; continue; }
          if(at('OP','.')){ take(); var nm=want('NAME',undefined,'un nom après le point').v;
            a={k:'attr',o:a,name:nm,l:l}; continue; }
          break; }
        return a; }
      function atom(){
        var l=line(), x=cur();
        if(at('NUM')){ take(); return {k:'num',v:x.v.v,f:x.v.f,l:l}; }
        if(at('STR')){ take(); return {k:'str',v:x.v,l:l}; }
        if(at('FSTR')){ take(); return {k:'fstr',parts:fparts(x.v,l),l:l}; }
        if(at('NAME')){ take(); return {k:'name',name:x.v,l:l}; }
        if(at('KW','True')){ take(); return {k:'const',v:true,l:l}; }
        if(at('KW','False')){ take(); return {k:'const',v:false,l:l}; }
        if(at('KW','None')){ take(); return {k:'const',v:null,l:l}; }
        if(at('KW','lambda')){ take(); var ps=[];
          while(!at('OP',':')){ ps.push(want('NAME',undefined,'un paramètre').v); if(at('OP',','))take(); else break; }
          want('OP',':'); return {k:'lambda',params:ps,e:expr(),l:l}; }
        if(at('OP','(')){ take();
          if(at('OP',')')){ take(); return {k:'tuple',items:[],l:l}; }
          var e=expr();
          if(at('OP',',')){ var items=[e];
            while(at('OP',',')){ take(); if(at('OP',')'))break; items.push(expr()); }
            want('OP',')'); return {k:'tuple',items:items,l:l}; }
          want('OP',')'); return e; }
        if(at('OP','[')){ take();
          if(at('OP',']')){ take(); return {k:'list',items:[],l:l}; }
          var e1=expr();
          if(at('KW','for')){ take(); var tg=targetList(); want('KW','in'); var it=orExpr();
            var cond=null; if(at('KW','if')){ take(); cond=orExpr(); }
            want('OP',']'); return {k:'comp',e:e1,t:tg,it:it,cond:cond,l:l}; }
          var its=[e1];
          while(at('OP',',')){ take(); if(at('OP',']'))break; its.push(expr()); }
          want('OP',']'); return {k:'list',items:its,l:l}; }
        if(at('OP','{')){ take();
          var ks=[], vs=[];
          while(!at('OP','}')){ var kk=expr(); want('OP',':'); ks.push(kk); vs.push(expr());
            if(at('OP',','))take(); else break; }
          want('OP','}'); return {k:'dict',ks:ks,vs:vs,l:l}; }
        throw err(l,'SyntaxError','expression attendue, trouvé '+describe(x)); }

      /* an f-string is split here, once, and each {…} is parsed as its own
         little expression */
      function fparts(s,l){
        var out=[], buf='', i=0;
        while(i<s.length){
          var c=s.charAt(i);
          if(c==='{'&&s.charAt(i+1)==='{'){ buf+='{'; i+=2; continue; }
          if(c==='}'&&s.charAt(i+1)==='}'){ buf+='}'; i+=2; continue; }
          if(c==='{'){
            if(buf){ out.push({lit:buf}); buf=''; }
            var d=1, j=i+1, inner='', q=null;
            while(j<s.length){ var cj=s.charAt(j);
              if(q){ if(cj===q)q=null; inner+=cj; j++; continue; }
              if(cj==='"'||cj==="'"){ q=cj; inner+=cj; j++; continue; }
              if(cj==='{')d++; if(cj==='}'){ d--; if(!d){ j++; break; } }
              inner+=cj; j++; }
            if(d)throw err(l,'SyntaxError',"une accolade de f-string n’est pas refermée");
            var spec='', ci=-1, dep=0, qq=null, z;
            for(z=0;z<inner.length;z++){ var cz=inner.charAt(z);
              if(qq){ if(cz===qq)qq=null; continue; }
              if(cz==='"'||cz==="'"){ qq=cz; continue; }
              if(cz==='('||cz==='['||cz==='{')dep++;
              if(cz===')'||cz===']'||cz==='}')dep--;
              if(cz===':'&&!dep){ ci=z; break; } }
            if(ci>=0){ spec=inner.slice(ci+1); inner=inner.slice(0,ci); }
            out.push({e:subExpr(inner,l),spec:spec});
            i=j; continue; }
          buf+=c; i++; }
        if(buf)out.push({lit:buf});
        return out; }
      function subExpr(text,l){
        var st=lex(text), sp=p, stoks=toks;
        toks=st; p=0;
        var e=exprList();
        toks=stoks; p=sp;
        if(!e)throw err(l,'SyntaxError','expression vide dans une f-string');
        return e; }

      return program(); }

    /* ── values ──
       Ints are plain JavaScript numbers and floats are boxed, so that 4/2
       prints 2.0 the way Python prints it and 4//2 prints 2. Getting that
       wrong in a textbook teaches the wrong thing. */
    function F(x){ return {f:x}; }
    function isF(v){ return !!(v&&typeof v==='object'&&v.f!==undefined); }
    function isNum(v){ return typeof v==='number'||typeof v==='boolean'||isF(v); }
    function nv(v){ return typeof v==='boolean'?(v?1:0):(typeof v==='number'?v:v.f); }
    function mk(x,f){ return f?F(x):x; }
    function isStr(v){ return typeof v==='string'; }
    function isList(v){ return Array.isArray(v); }
    function isTup(v){ return !!(v&&v.tup); }
    function isDict(v){ return !!(v&&v.d); }
    function isFn(v){ return !!(v&&(v.fn||v.bi)); }
    function T(v){
      if(v===null)return 'NoneType';
      if(typeof v==='boolean')return 'bool';
      if(typeof v==='number')return 'int';
      if(isF(v))return 'float';
      if(isStr(v))return 'str';
      if(isList(v))return 'list';
      if(isTup(v))return 'tuple';
      if(isDict(v))return 'dict';
      if(v&&v.rng)return 'range';
      if(isFn(v))return 'function';
      if(v&&v.mod)return 'module';
      return 'object'; }
    function fstr(x){
      if(x!==x)return 'nan';
      if(x===Infinity)return 'inf';
      if(x===-Infinity)return '-inf';
      if(Number.isInteger(x)&&Math.abs(x)<1e16)return x.toFixed(1);
      return String(x); }
    function repr(v,inner){
      if(v===null)return 'None';
      if(v===true)return 'True';
      if(v===false)return 'False';
      if(typeof v==='number')return String(v);
      if(isF(v))return fstr(v.f);
      if(isStr(v))return inner?("'"+v.split(BS).join(BS+BS).split("'").join(BS+"'")+"'"):v;
      if(isList(v))return '['+v.map(function(x){ return repr(x,true); }).join(', ')+']';
      if(isTup(v)){ var a=v.tup.map(function(x){ return repr(x,true); });
        return '('+a.join(', ')+(a.length===1?',':'')+')'; }
      if(isDict(v)){ var o=[]; v.d.forEach(function(pair){ o.push(repr(pair[0],true)+': '+repr(pair[1],true)); });
        return '{'+o.join(', ')+'}'; }
      if(v&&v.rng)return 'range('+v.rng[0]+', '+v.rng[1]+(v.rng[2]!==1?(', '+v.rng[2]):'')+')';
      if(v&&v.fn)return '<function '+v.fn.name+'>';
      if(v&&v.bi)return '<built-in function '+v.bi+'>';
      if(v&&v.mod)return "<module '"+v.mod+"'>";
      return String(v); }
    function truth(v){
      if(v===null||v===false)return false;
      if(v===true)return true;
      if(typeof v==='number')return v!==0;
      if(isF(v))return v.f!==0;
      if(isStr(v))return v.length>0;
      if(isList(v))return v.length>0;
      if(isTup(v))return v.tup.length>0;
      if(isDict(v))return v.d.size>0;
      if(v&&v.rng)return rlen(v)>0;
      return true; }
    function eq(a,b){
      if(isNum(a)&&isNum(b))return nv(a)===nv(b)&&(typeof a==='boolean')===(typeof b==='boolean')||nv(a)===nv(b);
      if(isStr(a)&&isStr(b))return a===b;
      if(a===null||b===null)return a===b;
      if(isList(a)&&isList(b))return a.length===b.length&&a.every(function(x,i){ return eq(x,b[i]); });
      if(isTup(a)&&isTup(b))return eq(a.tup,b.tup);
      if(isDict(a)&&isDict(b)){ if(a.d.size!==b.d.size)return false;
        var ok=true; a.d.forEach(function(pair,k){ if(!b.d.has(k)||!eq(pair[1],b.d.get(k)[1]))ok=false; }); return ok; }
      return a===b; }
    function key(v){
      if(v===null)return 'n';
      if(typeof v==='boolean')return 'i:'+(v?1:0);
      if(typeof v==='number')return 'i:'+v;
      if(isF(v))return 'i:'+v.f;
      if(isStr(v))return 's:'+v;
      if(isTup(v))return 't:['+v.tup.map(key).join(',')+']';
      throw err(0,'TypeError','ce type ne peut pas servir de clé de dictionnaire : '+T(v)); }
    function rlen(r){ var a=r.rng[0], b=r.rng[1], s=r.rng[2];
      return Math.max(0,Math.ceil((b-a)/s)); }

    /* ── running ── */
    var OUT, PEND, STEPS, START, LIMIT_MS=4000, INPUTS, INPOS, RND;
    function tick(line){
      STEPS++;
      if(((STEPS&2047)===0&&Date.now()-START>LIMIT_MS)||STEPS>40000000)
        throw err(line,'TimeoutError','le programme ne se termine pas — il a été arrêté. Cherchez une boucle dont la condition ne devient jamais fausse'); }
    function say(s){
      if(OUT.length>=3000)throw err(0,'OutputError','plus de 3000 lignes affichées : la sortie a été coupée');
      OUT.push(s); }
    /* print(end='') has to leave the line open for the next print, so output is
       a list of finished lines plus whatever is still being written */
    function emit(text){
      var parts=String(text).split(NLc), i;
      PEND+=parts[0];
      for(i=1;i<parts.length;i++){ say(PEND); PEND=parts[i]; } }
    // never throws: it runs in the error path too, and a second throw there
    // would escape the interpreter entirely
    function flush(){ if(PEND!==''){ if(OUT.length<3000)OUT.push(PEND); PEND=''; } }

    function Env(parent){ this.v={}; this.p=parent; this.g={}; }
    Env.prototype.get=function(n,l){
      var e=this; while(e){ if(Object.prototype.hasOwnProperty.call(e.v,n))return e.v[n]; e=e.p; }
      throw err(l,'NameError',"le nom '"+n+"' n’est pas défini — il n’a pas encore reçu de valeur, ou c’est une faute de frappe"); };
    Env.prototype.has=function(n){ var e=this; while(e){ if(Object.prototype.hasOwnProperty.call(e.v,n))return true; e=e.p; } return false; };
    Env.prototype.set=function(n,val){
      if(this.g[n]){ var g=this; while(g.p)g=g.p; g.v[n]=val; return; }
      this.v[n]=val; };

    var BREAK={brk:1}, CONT={cnt:1};
    function Ret(v){ this.v=v; }

    function add(a,b,l){
      if(isStr(a)&&isStr(b))return a+b;
      if(isList(a)&&isList(b))return a.concat(b);
      if(isTup(a)&&isTup(b))return {tup:a.tup.concat(b.tup)};
      if(isNum(a)&&isNum(b))return mk(nv(a)+nv(b),isF(a)||isF(b));
      throw err(l,'TypeError',"on ne peut pas additionner "+T(a)+" et "+T(b)); }
    function mul(a,b,l){
      if(isNum(a)&&isNum(b))return mk(nv(a)*nv(b),isF(a)||isF(b));
      if(isStr(a)&&typeof b==='number')return b>0?new Array(b+1).join(a):'';
      if(typeof a==='number'&&isStr(b))return a>0?new Array(a+1).join(b):'';
      if(isList(a)&&typeof b==='number'){ var o=[],i; for(i=0;i<b;i++)o=o.concat(a); return o; }
      if(typeof a==='number'&&isList(b)){ var o2=[],j; for(j=0;j<a;j++)o2=o2.concat(b); return o2; }
      throw err(l,'TypeError',"on ne peut pas multiplier "+T(a)+" par "+T(b)); }
    function arith2(op,a,b,l){
      if(op==='+')return add(a,b,l);
      if(op==='*')return mul(a,b,l);
      if(!isNum(a)||!isNum(b))throw err(l,'TypeError',"l’opération "+op+" ne s’applique pas à "+T(a)+" et "+T(b));
      var x=nv(a), y=nv(b), f=isF(a)||isF(b);
      if(op==='-')return mk(x-y,f);
      if(op==='/'){ if(y===0)throw err(l,'ZeroDivisionError','division par zéro'); return F(x/y); }
      if(op==='//'){ if(y===0)throw err(l,'ZeroDivisionError','division entière par zéro'); return mk(Math.floor(x/y),f); }
      if(op==='%'){ if(y===0)throw err(l,'ZeroDivisionError','modulo par zéro');
        var r=x-Math.floor(x/y)*y; return mk(r,f); }
      if(op==='**'){ var v=Math.pow(x,y);
        return mk(v,f||y<0||!Number.isInteger(y)); }
      throw err(l,'SyntaxError',"opérateur inconnu "+op); }
    function cmp2(op,a,b,l){
      if(op==='=='){ return eq(a,b); }
      if(op==='!=')return !eq(a,b);
      if(op==='is')return (a===b)||(a===null&&b===null)||(isNum(a)&&isNum(b)&&nv(a)===nv(b)&&T(a)===T(b));
      if(op==='is not')return !cmp2('is',a,b,l);
      if(op==='in')return contains(b,a,l);
      if(op==='not in')return !contains(b,a,l);
      var c=order(a,b,l);
      if(op==='<')return c<0; if(op==='<=')return c<=0;
      if(op==='>')return c>0; if(op==='>=')return c>=0;
      throw err(l,'SyntaxError','comparaison inconnue '+op); }
    function order(a,b,l){
      if(isNum(a)&&isNum(b))return nv(a)<nv(b)?-1:(nv(a)>nv(b)?1:0);
      if(isStr(a)&&isStr(b))return a<b?-1:(a>b?1:0);
      var la=isList(a)?a:(isTup(a)?a.tup:null), lb=isList(b)?b:(isTup(b)?b.tup:null);
      if(la&&lb){ var i;
        for(i=0;i<Math.min(la.length,lb.length);i++){ var c=order(la[i],lb[i],l); if(c)return c; }
        return la.length-lb.length; }
      throw err(l,'TypeError','on ne peut pas comparer '+T(a)+' et '+T(b)); }
    function contains(box,v,l){
      if(isStr(box)){ if(!isStr(v))throw err(l,'TypeError',"'in' sur une chaîne attend une chaîne");
        return box.indexOf(v)>=0; }
      if(isList(box))return box.some(function(x){ return eq(x,v); });
      if(isTup(box))return box.tup.some(function(x){ return eq(x,v); });
      if(isDict(box))return box.d.has(key(v));
      if(box&&box.rng){ if(!isNum(v))return false; var it=iter(box,l), r;
        while(!(r=it.next()).done)if(eq(r.value,v))return true; return false; }
      throw err(l,'TypeError',"'in' ne s’applique pas à "+T(box)); }
    function iter(v,l){
      if(isStr(v)){ var i=0; return {next:function(){ return i<v.length?{value:v.charAt(i++),done:false}:{done:true}; }}; }
      if(isList(v)){ var j=0; return {next:function(){ return j<v.length?{value:v[j++],done:false}:{done:true}; }}; }
      if(isTup(v)){ var k2=0; return {next:function(){ return k2<v.tup.length?{value:v.tup[k2++],done:false}:{done:true}; }}; }
      if(isDict(v)){ var ks=[]; v.d.forEach(function(pair){ ks.push(pair[0]); }); var m=0;
        return {next:function(){ return m<ks.length?{value:ks[m++],done:false}:{done:true}; }}; }
      if(v&&v.rng){ var a=v.rng[0], b=v.rng[1], s=v.rng[2], c=a;
        return {next:function(){ if((s>0&&c>=b)||(s<0&&c<=b))return {done:true}; var x=c; c+=s; return {value:x,done:false}; }}; }
      if(v&&v.gen)return v.gen();
      throw err(l,'TypeError','on ne peut pas parcourir '+T(v)+' avec une boucle for'); }
    function toArr(v,l){ var it=iter(v,l), o=[], r;
      while(!(r=it.next()).done){ o.push(r.value); if(o.length>2000000)throw err(l,'MemoryError','séquence trop longue'); }
      return o; }
    function len(v,l){
      if(isStr(v))return v.length;
      if(isList(v))return v.length;
      if(isTup(v))return v.tup.length;
      if(isDict(v))return v.d.size;
      if(v&&v.rng)return rlen(v);
      throw err(l,'TypeError',T(v)+" n’a pas de longueur"); }
    function idx(v,i,l){
      if(!isNum(i)||isF(i))throw err(l,'TypeError','un indice doit être un entier, pas '+T(i));
      var n=nv(i);
      if(isStr(v)||isList(v)||isTup(v)){
        var arr=isTup(v)?v.tup:v, L=arr.length;
        var m=n<0?L+n:n;
        if(m<0||m>=L)throw err(l,'IndexError','indice '+n+' hors des limites (longueur '+L+')');
        return isStr(v)?v.charAt(m):arr[m]; }
      if(v&&v.rng){ var L2=rlen(v), m2=n<0?L2+n:n;
        if(m2<0||m2>=L2)throw err(l,'IndexError','indice hors des limites');
        return v.rng[0]+m2*v.rng[2]; }
      throw err(l,'TypeError',T(v)+' ne se lit pas avec des crochets'); }
    function getitem(o,i,l){
      if(isDict(o)){ var k=key(i);
        if(!o.d.has(k))throw err(l,'KeyError','la clé '+repr(i,true)+" n’est pas dans le dictionnaire");
        return o.d.get(k)[1]; }
      return idx(o,i,l); }
    function slice(o,lo,hi,st,l){
      var arr=isStr(o)?o.split(''):(isList(o)?o:(isTup(o)?o.tup:(o&&o.rng?toArr(o,l):null)));
      if(!arr)throw err(l,'TypeError','on ne peut pas découper '+T(o));
      var L=arr.length, s=(st===null||st===undefined)?1:nv(st);
      if(s===0)throw err(l,'ValueError','le pas ne peut pas être nul');
      var a,b;
      if(s>0){ a=(lo==null)?0:nv(lo); b=(hi==null)?L:nv(hi); }
      else { a=(lo==null)?L-1:nv(lo); b=(hi==null)?-1-L:nv(hi); }
      if(a<0)a+=L; if(b<0&&!(s<0&&hi==null))b+=L;
      var out=[], i;
      if(s>0){ a=Math.max(0,Math.min(L,a)); b=Math.max(0,Math.min(L,b)); for(i=a;i<b;i+=s)out.push(arr[i]); }
      else { a=Math.max(-1,Math.min(L-1,a)); for(i=a;i>b;i+=s)if(i>=0&&i<L)out.push(arr[i]); }
      if(isStr(o))return out.join('');
      if(isTup(o))return {tup:out};
      return out; }

    /* ── the standard library a class actually uses ── */
    function bi(name,fn){ return {bi:name,call:fn}; }
    function fmtSpec(v,spec,l){
      if(!spec)return repr(v);
      var m=new RegExp('^([<>^]?)([0-9]*)(,?)(?:[.]([0-9]+))?([fedgs%]?)$').exec(spec);
      if(!m)throw err(l,'ValueError','format non géré : '+spec);
      var align=m[1], width=m[2]?parseInt(m[2],10):0, group=m[3], prec=m[4]?parseInt(m[4],10):null, kind=m[5];
      var s;
      if(kind==='f'||kind==='%'){
        if(!isNum(v))throw err(l,'ValueError','le format '+spec+' attend un nombre');
        var x=nv(v)*(kind==='%'?100:1);
        s=x.toFixed(prec==null?6:prec)+(kind==='%'?'%':''); }
      else if(kind==='e'){ s=nv(v).toExponential(prec==null?6:prec); }
      else if(kind==='d'){ s=String(Math.round(nv(v))); }
      else if(prec!=null&&isNum(v)){ s=nv(v).toPrecision(prec); }
      else s=repr(v);
      if(group){ var pr=s.split('.'), ip=pr[0], neg=ip.charAt(0)==='-'; if(neg)ip=ip.slice(1);
        var o='',c=0,q;
        for(q=ip.length-1;q>=0;q--){ o=ip.charAt(q)+o; c++; if(c%3===0&&q>0)o=','+o; }
        s=(neg?'-':'')+o+(pr[1]?'.'+pr[1]:''); }
      while(s.length<width){
        if(align==='>'||(!align&&isNum(v)))s=' '+s;
        else if(align==='^'){ s=' '+s; if(s.length<width)s=s+' '; }
        else s=s+' '; }
      return s; }
    /* Python rounds the true binary value, so round(2.675, 2) is 2.67 — the
       stored double is a hair under 2.675. Scaling by 100 and rounding gets
       that wrong, because 2.675 * 100 lands a hair above 267.5. toFixed reads
       the exact value, so it agrees with Python everywhere except an exact
       tie, which Python breaks towards the even neighbour. */
    function pyRound(x,n){
      n=n||0;
      if(!isFinite(x))return x;
      var p2=Math.pow(10,n), r;
      if(n>=0&&n<=17)r=parseFloat(x.toFixed(n));
      else r=Math.round(x*p2)/p2;
      /* A real tie needs the stored value to be exactly k + a half at this many
         digits, which only a dyadic rational can be — so x times 2^(n+1) must
         be a whole odd number. Testing (x * 10^n) % 1 instead would call 2.675
         a tie, because that multiplication rounds up to 267.5 even though the
         stored 2.675 is below it. Multiplying by a power of two never rounds. */
      if(n>=0&&n<=17){
        var M=x*Math.pow(2,n+1);
        if(Number.isInteger(M)&&Math.abs(M%2)===1){
          var scaled=x*p2, lo=Math.trunc(scaled), hi=lo+(scaled>0?1:-1);
          r=((Math.abs(lo)%2===0)?lo:hi)/p2; } }
      return r; }
    function callable(v){ return isFn(v); }

    function makeBuiltins(call){
      var B={};
      B.print=bi('print',function(a,kw,l){
        var sep=' ', end=NLc, i;
        for(i=0;i<kw.length;i++){ if(kw[i][0]==='sep')sep=repr(kw[i][1]); if(kw[i][0]==='end')end=repr(kw[i][1]); }
        emit(a.map(function(x){ return repr(x); }).join(sep)+end);
        return null; });
      B.len=bi('len',function(a,kw,l){ return len(a[0],l); });
      B.range=bi('range',function(a,kw,l){
        var n=a.map(function(x){ if(!isNum(x)||isF(x))throw err(l,'TypeError','range attend des entiers'); return nv(x); });
        if(n.length===1)return {rng:[0,n[0],1]};
        if(n.length===2)return {rng:[n[0],n[1],1]};
        if(n.length===3){ if(n[2]===0)throw err(l,'ValueError','le pas de range ne peut pas être nul'); return {rng:n}; }
        throw err(l,'TypeError','range prend 1, 2 ou 3 arguments'); });
      B.int=bi('int',function(a,kw,l){
        if(!a.length)return 0;
        var v=a[0];
        if(isStr(v)){ var t=v.trim(); if(!new RegExp('^[-+]?[0-9]+$').test(t))throw err(l,'ValueError',"int() n’arrive pas à lire "+repr(v,true)); return parseInt(t,10); }
        if(isNum(v))return Math.trunc(nv(v));
        throw err(l,'TypeError','int() ne convertit pas '+T(v)); });
      B.float=bi('float',function(a,kw,l){
        if(!a.length)return F(0);
        var v=a[0];
        if(isStr(v)){ var x=parseFloat(v.trim().replace(',','.')); if(isNaN(x))throw err(l,'ValueError',"float() n’arrive pas à lire "+repr(v,true)); return F(x); }
        if(isNum(v))return F(nv(v));
        throw err(l,'TypeError','float() ne convertit pas '+T(v)); });
      B.str=bi('str',function(a,kw,l){ return a.length?repr(a[0]):''; });
      B.bool=bi('bool',function(a,kw,l){ return a.length?truth(a[0]):false; });
      B.abs=bi('abs',function(a,kw,l){ if(!isNum(a[0]))throw err(l,'TypeError','abs attend un nombre'); return mk(Math.abs(nv(a[0])),isF(a[0])); });
      B.round=bi('round',function(a,kw,l){
        if(!isNum(a[0]))throw err(l,'TypeError','round attend un nombre');
        var n=a.length>1?nv(a[1]):0, r=pyRound(nv(a[0]),n);
        return (a.length>1)?F(r):Math.round(r); });
      B.min=bi('min',function(a,kw,l){ return pick(a,kw,l,-1); });
      B.max=bi('max',function(a,kw,l){ return pick(a,kw,l,1); });
      function pick(a,kw,l,dir){
        var items=(a.length===1)?toArr(a[0],l):a;
        if(!items.length)throw err(l,'ValueError','min() ou max() sur une séquence vide');
        var kf=null, i; for(i=0;i<kw.length;i++)if(kw[i][0]==='key')kf=kw[i][1];
        var best=items[0], bk=kf?call(kf,[best],[],l):best;
        for(i=1;i<items.length;i++){ var v=items[i], k2=kf?call(kf,[v],[],l):v;
          if(order(k2,bk,l)*dir>0){ best=v; bk=k2; } }
        return best; }
      B.sum=bi('sum',function(a,kw,l){
        var items=toArr(a[0],l), acc=a.length>1?a[1]:0, i;
        for(i=0;i<items.length;i++)acc=add(acc,items[i],l);
        return acc; });
      B.sorted=bi('sorted',function(a,kw,l){
        var items=toArr(a[0],l).slice(), kf=null, rev=false, i;
        for(i=0;i<kw.length;i++){ if(kw[i][0]==='key')kf=kw[i][1]; if(kw[i][0]==='reverse')rev=truth(kw[i][1]); }
        items.sort(function(x,y){ return order(kf?call(kf,[x],[],l):x, kf?call(kf,[y],[],l):y, l); });
        if(rev)items.reverse();
        return items; });
      B.reversed=bi('reversed',function(a,kw,l){ return toArr(a[0],l).slice().reverse(); });
      B.list=bi('list',function(a,kw,l){ return a.length?toArr(a[0],l):[]; });
      B.tuple=bi('tuple',function(a,kw,l){ return {tup:a.length?toArr(a[0],l):[]}; });
      B.dict=bi('dict',function(a,kw,l){ var d=new Map(), i;
        for(i=0;i<kw.length;i++)d.set(key(kw[i][0]),[kw[i][0],kw[i][1]]);
        return {d:d}; });
      B.enumerate=bi('enumerate',function(a,kw,l){
        var items=toArr(a[0],l), st=a.length>1?nv(a[1]):0;
        return items.map(function(x,i){ return {tup:[st+i,x]}; }); });
      B.zip=bi('zip',function(a,kw,l){
        var cols=a.map(function(x){ return toArr(x,l); });
        var n=Math.min.apply(null,cols.map(function(c){ return c.length; })), o=[], i;
        for(i=0;i<n;i++)o.push({tup:cols.map(function(c){ return c[i]; })});
        return o; });
      B.type=bi('type',function(a,kw,l){ return "<class '"+T(a[0])+"'>"; });
      B.chr=bi('chr',function(a,kw,l){ return String.fromCharCode(nv(a[0])); });
      B.ord=bi('ord',function(a,kw,l){ return String(a[0]).charCodeAt(0); });
      B.pow=bi('pow',function(a,kw,l){ return arith2('**',a[0],a[1],l); });
      B.divmod=bi('divmod',function(a,kw,l){ return {tup:[arith2('//',a[0],a[1],l),arith2('%',a[0],a[1],l)]}; });
      B.any=bi('any',function(a,kw,l){ return toArr(a[0],l).some(truth); });
      B.all=bi('all',function(a,kw,l){ return toArr(a[0],l).every(truth); });
      B.map=bi('map',function(a,kw,l){ return toArr(a[1],l).map(function(x){ return call(a[0],[x],[],l); }); });
      B.filter=bi('filter',function(a,kw,l){ return toArr(a[1],l).filter(function(x){ return truth(call(a[0],[x],[],l)); }); });
      B.input=bi('input',function(a,kw,l){
        if(a.length)emit(repr(a[0]));
        if(INPOS>=INPUTS.length)throw err(l,'EOFError','le programme demande une saisie, mais aucune n’a été prévue — remplissez « Saisies » dans les réglages de l’élément, une par ligne');
        var v=INPUTS[INPOS++];
        emit(v+NLc);                    // echo it, the way a terminal would
        return v; });
      B.isinstance=bi('isinstance',function(a,kw,l){ return true; });
      return B; }

    var MATH={pi:F(Math.PI), e:F(Math.E), inf:F(Infinity), tau:F(2*Math.PI),
      sqrt:1, floor:1, ceil:1, fabs:1, exp:1, log:1, log10:1, log2:1, sin:1, cos:1, tan:1,
      asin:1, acos:1, atan:1, atan2:1, radians:1, degrees:1, factorial:1, gcd:1, trunc:1, pow:1, hypot:1};
    function mathAttr(n,l){
      if(n==='pi')return F(Math.PI);
      if(n==='e')return F(Math.E);
      if(n==='tau')return F(2*Math.PI);
      if(n==='inf')return F(Infinity);
      if(!MATH[n])throw err(l,'AttributeError',"le module math n’a pas de "+n+" ici");
      return bi('math.'+n,function(a,kw,ll){
        var x=a.length?nv(a[0]):0, y=a.length>1?nv(a[1]):0;
        if(n==='sqrt'){ if(x<0)throw err(ll,'ValueError','racine carrée d’un nombre négatif'); return F(Math.sqrt(x)); }
        if(n==='floor')return Math.floor(x);
        if(n==='ceil')return Math.ceil(x);
        if(n==='trunc')return Math.trunc(x);
        if(n==='fabs')return F(Math.abs(x));
        if(n==='exp')return F(Math.exp(x));
        if(n==='log')return F(a.length>1?(Math.log(x)/Math.log(y)):Math.log(x));
        if(n==='log10')return F(Math.log(x)/Math.LN10);
        if(n==='log2')return F(Math.log(x)/Math.LN2);
        if(n==='sin')return F(Math.sin(x));
        if(n==='cos')return F(Math.cos(x));
        if(n==='tan')return F(Math.tan(x));
        if(n==='asin')return F(Math.asin(x));
        if(n==='acos')return F(Math.acos(x));
        if(n==='atan')return F(Math.atan(x));
        if(n==='atan2')return F(Math.atan2(x,y));
        if(n==='hypot')return F(Math.sqrt(x*x+y*y));
        if(n==='radians')return F(x*Math.PI/180);
        if(n==='degrees')return F(x*180/Math.PI);
        if(n==='pow')return F(Math.pow(x,y));
        if(n==='gcd'){ var p2=Math.abs(x), q2=Math.abs(y); while(q2){ var t=p2%q2; p2=q2; q2=t; } return p2; }
        if(n==='factorial'){ if(x<0||!Number.isInteger(x))throw err(ll,'ValueError','factorial attend un entier positif');
          if(x>170)throw err(ll,'OverflowError','factorielle trop grande'); var f2=1,i2; for(i2=2;i2<=x;i2++)f2*=i2; return f2; }
        throw err(ll,'AttributeError','math.'+n+" n’est pas géré"); }); }
    /* a seeded generator, so random.seed(1) really does reproduce a run */
    function rnd(){ RND=(RND*1103515245+12345)%2147483648; return RND/2147483648; }
    function randAttr(n,l){
      return bi('random.'+n,function(a,kw,ll){
        if(n==='random')return F(rnd());
        if(n==='seed'){ RND=Math.abs(Math.round(nv(a[0])))%2147483648; return null; }
        if(n==='randint'){ var lo=nv(a[0]), hi=nv(a[1]); return lo+Math.floor(rnd()*(hi-lo+1)); }
        if(n==='randrange'){ var s0=a.length>1?nv(a[0]):0, s1=a.length>1?nv(a[1]):nv(a[0]);
          return s0+Math.floor(rnd()*(s1-s0)); }
        if(n==='uniform')return F(nv(a[0])+rnd()*(nv(a[1])-nv(a[0])));
        if(n==='choice'){ var it=toArr(a[0],ll); if(!it.length)throw err(ll,'IndexError','choice() sur une séquence vide');
          return it[Math.floor(rnd()*it.length)]; }
        if(n==='shuffle'){ var arr=a[0], i3;
          if(!isList(arr))throw err(ll,'TypeError','shuffle attend une liste');
          for(i3=arr.length-1;i3>0;i3--){ var j3=Math.floor(rnd()*(i3+1)), t3=arr[i3]; arr[i3]=arr[j3]; arr[j3]=t3; }
          return null; }
        if(n==='sample'){ var pool=toArr(a[0],ll).slice(), k3=nv(a[1]), o3=[];
          while(o3.length<k3&&pool.length)o3.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);
          return o3; }
        throw err(ll,'AttributeError','random.'+n+" n’est pas géré"); }); }

    /* ── methods on the built-in types ── */
    function method(o,name,l,call){
      if(isStr(o)){
        var S={
          upper:function(){ return o.toUpperCase(); },
          lower:function(){ return o.toLowerCase(); },
          strip:function(a){ return a.length?trimChars(o,String(a[0]),3):o.trim(); },
          lstrip:function(a){ return a.length?trimChars(o,String(a[0]),1):o.replace(new RegExp('^[ '+TABc+']+'),''); },
          rstrip:function(a){ return a.length?trimChars(o,String(a[0]),2):o.replace(new RegExp('[ '+TABc+']+$'),''); },
          split:function(a){ if(!a.length)return o.split(new RegExp('[ '+TABc+NLc+']+')).filter(function(x){ return x!==''; });
            return o.split(String(a[0])); },
          join:function(a){ return toArr(a[0],l).map(function(x){
            if(!isStr(x))throw err(l,'TypeError','join attend des chaînes'); return x; }).join(o); },
          replace:function(a){ return o.split(String(a[0])).join(String(a[1])); },
          find:function(a){ return o.indexOf(String(a[0])); },
          index:function(a){ var i=o.indexOf(String(a[0])); if(i<0)throw err(l,'ValueError','sous-chaîne introuvable'); return i; },
          count:function(a){ return o.split(String(a[0])).length-1; },
          startswith:function(a){ return o.indexOf(String(a[0]))===0; },
          endswith:function(a){ var s=String(a[0]); return s===''||o.slice(-s.length)===s; },
          title:function(){ return o.replace(new RegExp('[A-Za-zÀ-ÿ]+','g'),function(w){ return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }); },
          capitalize:function(){ return o.charAt(0).toUpperCase()+o.slice(1).toLowerCase(); },
          isdigit:function(){ return o.length>0&&new RegExp('^[0-9]+$').test(o); },
          isalpha:function(){ return o.length>0&&new RegExp('^[A-Za-zÀ-ÿ]+$').test(o); },
          isupper:function(){ return o.length>0&&o===o.toUpperCase(); },
          islower:function(){ return o.length>0&&o===o.toLowerCase(); },
          format:function(a){ var i=0; return o.replace(new RegExp('[{]([0-9]*)[}]','g'),function(m,d){
            var v=d===''?a[i++]:a[parseInt(d,10)]; return repr(v); }); }
        };
        if(!S[name])throw err(l,'AttributeError',"les chaînes n’ont pas de méthode ."+name+" ici");
        return bi('str.'+name,function(a){ return S[name](a); }); }
      if(isList(o)){
        var L={
          append:function(a){ o.push(a[0]); return null; },
          extend:function(a){ toArr(a[0],l).forEach(function(x){ o.push(x); }); return null; },
          insert:function(a){ o.splice(nv(a[0]),0,a[1]); return null; },
          pop:function(a){ if(!o.length)throw err(l,'IndexError','pop() sur une liste vide');
            var i=a.length?nv(a[0]):o.length-1; if(i<0)i+=o.length;
            if(i<0||i>=o.length)throw err(l,'IndexError','indice hors des limites');
            return o.splice(i,1)[0]; },
          remove:function(a){ var i,f2=-1;
            for(i=0;i<o.length;i++)if(eq(o[i],a[0])){ f2=i; break; }
            if(f2<0)throw err(l,'ValueError',repr(a[0],true)+" n’est pas dans la liste");
            o.splice(f2,1); return null; },
          index:function(a){ var i;
            for(i=0;i<o.length;i++)if(eq(o[i],a[0]))return i;
            throw err(l,'ValueError',repr(a[0],true)+" n’est pas dans la liste"); },
          count:function(a){ return o.filter(function(x){ return eq(x,a[0]); }).length; },
          sort:function(a,kw){ var kf=null, rev=false, i;
            for(i=0;i<(kw||[]).length;i++){ if(kw[i][0]==='key')kf=kw[i][1]; if(kw[i][0]==='reverse')rev=truth(kw[i][1]); }
            o.sort(function(x,y){ return order(kf?call(kf,[x],[],l):x, kf?call(kf,[y],[],l):y, l); });
            if(rev)o.reverse(); return null; },
          reverse:function(){ o.reverse(); return null; },
          clear:function(){ o.length=0; return null; },
          copy:function(){ return o.slice(); }
        };
        if(!L[name])throw err(l,'AttributeError',"les listes n’ont pas de méthode ."+name+" ici");
        return bi('list.'+name,function(a,kw){ return L[name](a,kw); }); }
      if(isDict(o)){
        var D={
          keys:function(){ var r=[]; o.d.forEach(function(p2){ r.push(p2[0]); }); return r; },
          values:function(){ var r=[]; o.d.forEach(function(p2){ r.push(p2[1]); }); return r; },
          items:function(){ var r=[]; o.d.forEach(function(p2){ r.push({tup:[p2[0],p2[1]]}); }); return r; },
          get:function(a){ var k=key(a[0]); return o.d.has(k)?o.d.get(k)[1]:(a.length>1?a[1]:null); },
          pop:function(a){ var k=key(a[0]);
            if(!o.d.has(k)){ if(a.length>1)return a[1]; throw err(l,'KeyError',repr(a[0],true)); }
            var v=o.d.get(k)[1]; o.d.delete(k); return v; },
          clear:function(){ o.d.clear(); return null; },
          copy:function(){ var m=new Map(); o.d.forEach(function(p2,k){ m.set(k,[p2[0],p2[1]]); }); return {d:m}; },
          update:function(a){ if(isDict(a[0]))a[0].d.forEach(function(p2,k){ o.d.set(k,[p2[0],p2[1]]); }); return null; }
        };
        if(!D[name])throw err(l,'AttributeError',"les dictionnaires n’ont pas de méthode ."+name+" ici");
        return bi('dict.'+name,function(a){ return D[name](a); }); }
      if(o&&o.mod==='math')return mathAttr(name,l);
      if(o&&o.mod==='random')return randAttr(name,l);
      throw err(l,'AttributeError',T(o)+" n’a pas d’attribut ."+name); }
    function trimChars(s,chars,mode){
      var a=0, b=s.length;
      if(mode&1)while(a<b&&chars.indexOf(s.charAt(a))>=0)a++;
      if(mode&2)while(b>a&&chars.indexOf(s.charAt(b-1))>=0)b--;
      return s.slice(a,b); }

    /* ── evaluator ── */
    function run(src,stdin){
      OUT=[]; PEND=''; STEPS=0; START=Date.now();
      INPUTS=String(stdin==null?'':stdin).split(CRc).join('').split(NLc).filter(function(x,i,arr){ return !(i===arr.length-1&&x===''); });
      INPOS=0; RND=12345;
      var G=new Env(null);
      var B=makeBuiltins(callValue);
      Object.keys(B).forEach(function(k){ G.v[k]=B[k]; });

      function callValue(f,args,kw,l){
        tick(l);
        if(f&&f.bi)return f.call(args,kw||[],l);
        if(f&&f.fn){
          var d=f.fn, e2=new Env(d.env), i;
          if(args.length>d.params.length)
            throw err(l,'TypeError',d.name+'() reçoit '+args.length+' arguments alors qu’elle en attend '+d.params.length);
          for(i=0;i<d.params.length;i++){
            if(i<args.length)e2.v[d.params[i]]=args[i];
            else { var kvv=null, found=false, j;
              for(j=0;j<(kw||[]).length;j++)if(kw[j][0]===d.params[i]){ kvv=kw[j][1]; found=true; }
              if(found)e2.v[d.params[i]]=kvv;
              else if(d.defaults[i])e2.v[d.params[i]]=evalExpr(d.defaults[i],d.env);
              else throw err(l,'TypeError',d.name+"() attend un argument pour '"+d.params[i]+"'"); } }
          try { execBlock(d.body,e2); }
          catch(ex){ if(ex instanceof Ret)return ex.v; throw ex; }
          return null; }
        throw err(l,'TypeError',T(f)+" ne peut pas être appelé comme une fonction"); }

      function assign(t,v,env){
        if(t.k==='name'){ env.set(t.name,v); return; }
        if(t.k==='tuple'||t.k==='list'){
          var vals=toArr(v,t.l);
          if(vals.length!==t.items.length)
            throw err(t.l,'ValueError','il y a '+vals.length+' valeurs à répartir sur '+t.items.length+' noms');
          t.items.forEach(function(x,i){ assign(x,vals[i],env); });
          return; }
        if(t.k==='index'){
          var o=evalExpr(t.o,env), i2=evalExpr(t.i,env);
          if(isDict(o)){ o.d.set(key(i2),[i2,v]); return; }
          if(isList(o)){ var n=nv(i2); if(n<0)n+=o.length;
            if(n<0||n>=o.length)throw err(t.l,'IndexError','indice hors des limites');
            o[n]=v; return; }
          throw err(t.l,'TypeError','on ne peut pas modifier '+T(o)+' par indice'); }
        throw err(t.l,'SyntaxError','cette cible d’affectation n’est pas gérée'); }

      function execBlock(b,env){ var i; for(i=0;i<b.length;i++)exec(b[i],env); }
      function exec(s,env){
        tick(s.l);
        switch(s.k){
          case 'expr': evalExpr(s.e,env); return;
          case 'pass': return;
          case 'seq': execBlock(s.b,env); return;
          case 'assign': { var v=evalExpr(s.e,env); s.targets.forEach(function(t){ assign(t,v,env); }); return; }
          case 'aug': { var cur2=evalExpr(s.t,env), nv2=arith2(s.op,cur2,evalExpr(s.e,env),s.l);
            assign(s.t,nv2,env); return; }
          case 'if': { var i2;
            for(i2=0;i2<s.arms.length;i2++)if(truth(evalExpr(s.arms[i2].c,env))){ execBlock(s.arms[i2].b,env); return; }
            if(s.orelse)execBlock(s.orelse,env); return; }
          case 'while': {
            while(truth(evalExpr(s.c,env))){ tick(s.l);
              try { execBlock(s.b,env); }
              catch(ex){ if(ex===BREAK)return; if(ex!==CONT)throw ex; } }
            return; }
          case 'for': {
            var it=iter(evalExpr(s.it,env),s.l), r;
            while(!(r=it.next()).done){ tick(s.l); assign(s.t,r.value,env);
              try { execBlock(s.b,env); }
              catch(ex){ if(ex===BREAK)return; if(ex!==CONT)throw ex; } }
            return; }
          case 'break': throw BREAK;
          case 'continue': throw CONT;
          case 'return': throw new Ret(s.e?evalExpr(s.e,env):null);
          case 'def': env.set(s.name,{fn:{name:s.name,params:s.params,defaults:s.defaults,body:s.b,env:env}}); return;
          case 'global': s.names.forEach(function(n){ env.g[n]=1; }); return;
          case 'del': s.targets.forEach(function(t){
            if(t.k==='name'){ delete env.v[t.name]; return; }
            if(t.k==='index'){ var o=evalExpr(t.o,env), i3=evalExpr(t.i,env);
              if(isDict(o)){ o.d.delete(key(i3)); return; }
              if(isList(o)){ var n2=nv(i3); if(n2<0)n2+=o.length; o.splice(n2,1); return; } }
            throw err(s.l,'SyntaxError','del ne sait pas supprimer cela'); }); return;
          case 'import': s.mods.forEach(function(m){
            if(m[0]!=='math'&&m[0]!=='random')
              throw err(s.l,'ImportError','seuls les modules math et random sont disponibles hors ligne (demandé : '+m[0]+')');
            env.set(m[1],{mod:m[0]}); }); return;
          case 'from': {
            if(s.mod!=='math'&&s.mod!=='random')
              throw err(s.l,'ImportError','seuls les modules math et random sont disponibles hors ligne (demandé : '+s.mod+')');
            if(!s.names)throw err(s.l,'ImportError','"from '+s.mod+' import *" n’est pas géré : nommez ce que vous importez');
            s.names.forEach(function(n){
              env.set(n[1], s.mod==='math'?mathAttr(n[0],s.l):randAttr(n[0],s.l)); });
            return; }
        }
        throw err(s.l,'SyntaxError','instruction non gérée : '+s.k); }

      function evalExpr(e,env){
        tick(e.l);
        switch(e.k){
          case 'num': return e.f?F(e.v):e.v;
          case 'str': return e.v;
          case 'const': return e.v;
          case 'name': return env.get(e.name,e.l);
          case 'fstr': return e.parts.map(function(pp){
            if(pp.lit!==undefined)return pp.lit;
            return fmtSpec(evalExpr(pp.e,env),pp.spec,e.l); }).join('');
          case 'list': return e.items.map(function(x){ return evalExpr(x,env); });
          case 'tuple': return {tup:e.items.map(function(x){ return evalExpr(x,env); })};
          case 'dict': { var m=new Map(), i;
            for(i=0;i<e.ks.length;i++){ var kv=evalExpr(e.ks[i],env); m.set(key(kv),[kv,evalExpr(e.vs[i],env)]); }
            return {d:m}; }
          case 'comp': { var it=iter(evalExpr(e.it,env),e.l), r, out=[], e2=new Env(env);
            while(!(r=it.next()).done){ tick(e.l); assign(e.t,r.value,e2);
              if(!e.cond||truth(evalExpr(e.cond,e2)))out.push(evalExpr(e.e,e2)); }
            return out; }
          case 'bin': return arith2(e.op,evalExpr(e.a,env),evalExpr(e.b,env),e.l);
          case 'un': { var v=evalExpr(e.e,env);
            if(!isNum(v))throw err(e.l,'TypeError',"le signe "+e.op+" ne s’applique pas à "+T(v));
            return mk(e.op==='-'?-nv(v):nv(v),isF(v)); }
          case 'not': return !truth(evalExpr(e.e,env));
          case 'bool': { var a=evalExpr(e.a,env);
            if(e.op==='and')return truth(a)?evalExpr(e.b,env):a;
            return truth(a)?a:evalExpr(e.b,env); }
          case 'cmp': { var left=evalExpr(e.first,env), i2;
            for(i2=0;i2<e.ops.length;i2++){ var right=evalExpr(e.rest[i2],env);
              if(!cmp2(e.ops[i2].op,left,right,e.ops[i2].l))return false;
              left=right; }
            return true; }
          case 'ifexp': return truth(evalExpr(e.c,env))?evalExpr(e.a,env):evalExpr(e.b,env);
          case 'lambda': return {fn:{name:'<lambda>',params:e.params,defaults:e.params.map(function(){ return null; }),
            body:[{k:'return',e:e.e,l:e.l}],env:env}};
          case 'index': return getitem(evalExpr(e.o,env),evalExpr(e.i,env),e.l);
          case 'slice': return slice(evalExpr(e.o,env),
            e.lo?evalExpr(e.lo,env):null, e.hi?evalExpr(e.hi,env):null, e.st?evalExpr(e.st,env):null, e.l);
          case 'attr': return method(evalExpr(e.o,env),e.name,e.l,callValue);
          case 'call': {
            var f=evalExpr(e.fn,env);
            var args=e.args.map(function(x){ return evalExpr(x,env); });
            var kw=e.kw.map(function(x){ return [x[0],evalExpr(x[1],env)]; });
            return callValue(f,args,kw,e.l); }
        }
        throw err(e.l,'SyntaxError','expression non gérée : '+e.k); }

      try {
        var ast=parse(lex(src));
        execBlock(ast,G);
        flush();
        return {out:OUT.join(NLc),ok:true}; }
      catch(ex){
        flush();
        if(ex instanceof Ret)return {out:OUT.join(NLc),ok:true};
        if(ex===BREAK||ex===CONT)
          return {out:OUT.join(NLc),ok:false,err:'SyntaxError : break ou continue en dehors d’une boucle'};
        if(ex&&ex.py)return {out:OUT.join(NLc),ok:false,
          err:(ex.line?('Ligne '+ex.line+' — '):'')+ex.kind+' : '+ex.message};
        return {out:OUT.join(NLc),ok:false,err:'Erreur interne : '+(ex&&ex.message?ex.message:String(ex))}; }
    }
    return {run:run};
  })();
  R.code=function(box,c){
    var lang=String(c.lang||'html').toLowerCase();
    var isPy=(new RegExp('^(py|python|python3)$')).test(lang);
    var isWeb=(new RegExp('^(html|css|js|javascript)$')).test(lang);
    var canRun=(isPy||isWeb)&&c.preview!==false;
    box.className='iw iw-card iw-code'+(c.layout==='stack'?' stack':'')+(isPy?' py':'');
    box.innerHTML='<div class="iwco-head"><span class="iwco-lang">'+esc(isPy?'python':lang)+'</span>'+
      (canRun?'<span class="iwco-acts"><button class="iw-btn iwco-reset" title="Revenir au programme de départ">Réinitialiser</button><button class="iw-btn iwco-run">Exécuter ▶</button></span>':'')+'</div>'+
      '<div class="iwco-body"><div class="iwco-editor"><pre class="iwco-hl"></pre><textarea class="iwco-ta" spellcheck="false"></textarea></div>'+
      (canRun?(isPy?'<div class="iwco-term"><div class="iwco-termhead">Sortie</div><pre class="iwco-out"></pre></div>'
                   :'<iframe class="iwco-out" sandbox="allow-scripts"></iframe>'):'')+'</div>';
    var ta=box.querySelector('.iwco-ta'), hl=box.querySelector('.iwco-hl'), out=box.querySelector('.iwco-out');
    ta.value=c.code||'';
    function paint(){ hl.innerHTML=hlCode(ta.value,isPy)+'\n'; }
    ta.addEventListener('input',paint);
    ta.addEventListener('scroll',function(){hl.scrollTop=ta.scrollTop;hl.scrollLeft=ta.scrollLeft;});
    // Tab indents rather than leaving the box: an indented language needs it
    ta.addEventListener('keydown',function(e){
      if(e.key!=='Tab'||e.ctrlKey||e.altKey)return;
      e.preventDefault();
      var s=ta.selectionStart, en=ta.selectionEnd, v=ta.value;
      ta.value=v.slice(0,s)+'    '+v.slice(en); ta.selectionStart=ta.selectionEnd=s+4; paint(); });
    function run(){
      if(!out)return;
      if(isPy){
        var r=PY.run(ta.value,c.stdin||'');
        out.textContent=r.out;
        var e=box.querySelector('.iwco-err'); if(e)e.parentNode.removeChild(e);
        if(!r.ok){ var d=el('div','iwco-err'); d.textContent=r.err; out.parentNode.appendChild(d); }
        box.querySelector('.iwco-term').classList.toggle('bad',!r.ok);
        return; }
      var code=ta.value, doc;
      if(lang==='css')doc='<style>'+code+'</style><body>';
      else if(lang==='js'||lang==='javascript')doc='<body><scr'+'ipt>try{'+code+'}catch(e){document.body.innerHTML="<pre style=color:red>"+e+"</pre>";}<'+'/scr'+'ipt>';
      else doc=code;
      out.srcdoc=doc; }
    if(canRun){
      box.querySelector('.iwco-run').addEventListener('click',run);
      box.querySelector('.iwco-reset').addEventListener('click',function(){ ta.value=c.code||''; paint(); run(); });
      run(); }
    paint();
  };
  /* ── full custom HTML embed ── */
  R.embed=function(box,c){
    box.className='iw iw-embed';
    if(!(c.html||'').trim()){
      box.className='iw iw-card iw-embed';
      box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Colle ici le code HTML à afficher.</div>'; return; }
    var f=el('iframe','iw-embed-frame'); f.setAttribute('sandbox','allow-scripts allow-forms allow-popups');
    f.style.height=((c.height||420))+'px'; box.appendChild(f); f.srcdoc=c.html||'';
  };

  /* ── reveal box: collapse / flip / scratch ── */
  function nl2br(s){ return esc(s).split(String.fromCharCode(10)).join('<br>'); }
  R.reveal=function(box,c){
    var mode=c.mode||'collapse';
    box.className='iw iw-card iw-reveal';
    var title=c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'';
    var front=nl2br(c.front||''), back=nl2br(c.back||'');
    if(mode==='flip'){
      box.innerHTML=title+'<div class="iwr-flip" tabindex="0" role="button" aria-label="Retourner"><div class="iwr-fi"><div class="iwr-face iwr-front">'+(front||'Cliquez pour retourner')+'</div><div class="iwr-face iwr-back">'+back+'</div></div></div>';
      var fl=box.querySelector('.iwr-flip');
      fl.addEventListener('click',function(){fl.classList.toggle('on');});
      fl.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fl.classList.toggle('on');}});
    } else if(mode==='scratch'){
      box.innerHTML=title+'<div class="iwr-scratch"><div class="iwr-under">'+back+'</div><canvas class="iwr-cv"></canvas><div class="iwr-hint">'+(front||'Grattez pour découvrir')+'</div></div>';
      initScratch(box,c);
    } else {
      box.innerHTML=title+'<button class="iwr-head" aria-expanded="false">'+(front||'Reveal')+'<span class="iwr-chev">▾</span></button><div class="iwr-body" hidden>'+back+'</div>';
      var hd=box.querySelector('.iwr-head'), bd=box.querySelector('.iwr-body');
      hd.addEventListener('click',function(){ var open=bd.hidden; bd.hidden=!open; hd.setAttribute('aria-expanded',String(open)); box.classList.toggle('on',open); });
    }
  };
  function initScratch(box,c){
    var wrap=box.querySelector('.iwr-scratch'), cv=box.querySelector('.iwr-cv'), hint=box.querySelector('.iwr-hint');
    function setup(){ var w=wrap.clientWidth, h=wrap.clientHeight; if(!w||!h){setTimeout(setup,90);return;}
      cv.width=w; cv.height=h; var ctx=cv.getContext('2d');
      ctx.fillStyle=(c.coverColor||cvar('--slate','#8b90a3')); ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='destination-out';
      var down=false, started=false, R0=Math.max(15,w*0.045);
      function pos(e){ var r=cv.getBoundingClientRect(); var t=(e.touches&&e.touches[0])||e; return [(t.clientX-r.left)*(cv.width/r.width),(t.clientY-r.top)*(cv.height/r.height)]; }
      function erase(x,y){ ctx.beginPath(); ctx.arc(x,y,R0,0,7); ctx.fill(); if(!started){started=true; if(hint)hint.style.opacity='0';} }
      cv.addEventListener('pointerdown',function(e){down=true; var p=pos(e); erase(p[0],p[1]); e.preventDefault();});
      cv.addEventListener('pointermove',function(e){ if(!down)return; var p=pos(e); erase(p[0],p[1]); });
      window.addEventListener('pointerup',function(){down=false;});
    }
    setup();
  }

  /* ── shared answer checking, used by the exercise and ordering elements ──
     Numbers are compared with a tolerance; anything else is compared as text
     with accents, case and punctuation removed, and ";" separating accepted
     variants. Authors type answers the way they would write them on the board. */
  function iwNum(s){ var v=parseFloat(String(s==null?'':s).replace(',','.').replace(new RegExp('[ ]','g'),'')); return isNaN(v)?null:v; }
  function iwNorm(s){ s=String(s==null?'':s).toLowerCase().trim();
    if(s.normalize)s=s.normalize('NFD').replace(new RegExp('['+String.fromCharCode(0x300)+'-'+String.fromCharCode(0x36f)+']','g'),'');
    return s.replace(new RegExp('[^a-z0-9]+','g'),' ').trim(); }
  function iwAnswerOk(given,expect,tol){
    var variants=String(expect==null?'':expect).split(';');
    for(var i=0;i<variants.length;i++){ var w=variants[i].trim(); if(!w)continue;
      var a=iwNum(given), b=iwNum(w);
      if(a!=null&&b!=null){
        var t=parseFloat(String(tol==null?'':tol).replace(',','.'));
        // no tolerance given → 0.5 % of the expected value, never below 1e-9
        if(isNaN(t))t=Math.max(Math.abs(b)*0.005,1e-9);
        if(Math.abs(a-b)<=t)return true;
      } else if(iwNorm(given)===iwNorm(w))return true; }
    return false; }

  /* ── annotated text: passages of a document marked up and explained ── */
  R.annotate=function(box,c){
    box.className='iw iw-card iw-ann';
    var P=pal(), src=String(c.text||'');
    var notes=(c.notes||[]).filter(function(n){ return n&&n.find; });
    if(!src){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Colle le texte à annoter.</div>'; return; }
    // Locate each passage once, left to right, so overlapping notes cannot nest.
    var hits=[], used=[];
    notes.forEach(function(n,i){ var from=0, at=-1;
      while(true){ at=src.indexOf(n.find,from); if(at<0)break;
        var clash=used.some(function(u){ return at<u[1]&&at+n.find.length>u[0]; });
        if(!clash)break; from=at+1; }
      if(at<0)return;
      used.push([at,at+n.find.length]);
      hits.push({i:i,at:at,end:at+n.find.length,n:n}); });
    hits.sort(function(a,b){ return a.at-b.at; });
    hits.forEach(function(h,k){ h.num=k+1; });
    var out='', cur=0;
    hits.forEach(function(h){
      out+=esc(src.slice(cur,h.at));
      var col=h.n.color||P[h.i%P.length];
      out+='<mark class="iwann-m" data-m="'+h.num+'" style="--am:'+esc(col)+'">'+esc(src.slice(h.at,h.end))+
        '<sup>'+h.num+'</sup></mark>';
      cur=h.end; });
    out+=esc(src.slice(cur));
    var paras=out.split(String.fromCharCode(10)).filter(function(l){ return l.trim(); });
    var body=(c.lineNumbers)
      ? '<ol class="iwann-lines">'+paras.map(function(l){ return '<li>'+l+'</li>'; }).join('')+'</ol>'
      : '<div class="iwann-text">'+paras.map(function(l){ return '<p>'+l+'</p>'; }).join('')+'</div>';
    var cite=[c.author,c.origin,c.date].filter(function(x){ return x; }).map(esc).join(' · ');
    var list=hits.map(function(h){ var col=h.n.color||P[h.i%P.length];
      return '<li class="iwann-n" data-n="'+h.num+'" style="--am:'+esc(col)+'"><b>'+h.num+'</b>'+
        '<div><span class="iwann-lab">'+esc(h.n.label||h.n.find)+'</span>'+
        (h.n.note?'<div class="iwann-note">'+esc(h.n.note)+'</div>':'')+'</div></li>'; }).join('');
    var missing=notes.length-hits.length;
    box.innerHTML=(c.kicker?'<div class="iwann-kick">'+esc(c.kicker)+'</div>':'')+
      (c.title?'<h3 class="iwann-title">'+esc(c.title)+'</h3>':'')+
      '<div class="iwann-doc">'+body+(cite?'<div class="iwann-cite">'+cite+'</div>':'')+'</div>'+
      (list?'<div class="iwann-notes"><h4>'+esc(c.notesLabel||'Annotations')+'</h4><ol>'+list+'</ol></div>':'')+
      (missing>0?'<div class="iwann-warn">'+missing+' annotation(s) introuvable(s) dans le texte — vérifie le passage exact.</div>':'')+
      (c.note?'<div class="iwann-foot">'+esc(c.note)+'</div>':'');
    function focus(num){ box.querySelectorAll('.iwann-m').forEach(function(m){ m.classList.toggle('on',m.getAttribute('data-m')===num); });
      box.querySelectorAll('.iwann-n').forEach(function(n){ n.classList.toggle('on',n.getAttribute('data-n')===num); }); }
    box.querySelectorAll('.iwann-m').forEach(function(m){ m.addEventListener('click',function(){
      var num=m.getAttribute('data-m'); focus(num);
      var n=box.querySelector('.iwann-n[data-n="'+num+'"]'); if(n)n.scrollIntoView({block:'nearest',behavior:'smooth'}); }); });
    box.querySelectorAll('.iwann-n').forEach(function(n){ n.addEventListener('click',function(){
      var num=n.getAttribute('data-n'); focus(num);
      var m=box.querySelector('.iwann-m[data-m="'+num+'"]'); if(m)m.scrollIntoView({block:'center',behavior:'smooth'}); }); });
  };

  /* ── Punnett square: a genetic cross, gamete by gamete ── */
  R.punnett=function(box,c){
    box.className='iw iw-card iw-pun';
    var split=function(s){ return String(s==null?'':s).split(new RegExp('[ ,;/]+')).filter(function(x){ return x; }); };
    var g1=split(c.p1), g2=split(c.p2);
    if(!g1.length||!g2.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Donne les gamètes des deux parents, par exemple A a.</div>'; return; }
    // One allele per locus per gamete: pair them position by position, dominant first.
    function cross(a,b){ var n=Math.max(a.length,b.length), out='';
      for(var i=0;i<n;i++){ var x=a.charAt(i)||'', y=b.charAt(i)||'';
        out+=(x.toUpperCase()===x&&y.toUpperCase()!==y)?(x+y):((y.toUpperCase()===y&&x.toUpperCase()!==x)?(y+x):(x<=y?(x+y):(y+x))); }
      return out; }
    // Genotypes must be matched CASE-SENSITIVELY — the case is the allele. Only the
    // order inside each locus pair is normalised, so "aA" and "Aa" are the same thing.
    function canon(g){ var s=String(g||''), out='';
      for(var i=0;i<s.length;i+=2){ var x=s.charAt(i), y=s.charAt(i+1)||'';
        out+=(y&&x.toLowerCase()===x&&y.toUpperCase()===y)?(y+x):(x+y); }
      return out; }
    var phen=(c.phenotypes||[]).filter(function(p){ return p&&(p.label||p.genotypes); }).map(function(p,i){
      return {label:p.label||'',color:p.color||pal()[i%pal().length],
        set:split(p.genotypes).map(canon)}; });
    function phenOf(g){ var k=canon(g);
      for(var i=0;i<phen.length;i++)if(phen[i].set.indexOf(k)>=0)return phen[i];
      return null; }
    var counts={}, total=0;
    var rows='<tr><th class="iwpun-corner"><span>'+esc(c.p2Label||'Parent 2')+'</span><span>'+esc(c.p1Label||'Parent 1')+'</span></th>'+
      g1.map(function(g){ return '<th scope="col">'+esc(g)+'</th>'; }).join('')+'</tr>';
    g2.forEach(function(b){
      rows+='<tr><th scope="row">'+esc(b)+'</th>'+g1.map(function(a){
        var g=cross(a,b), p=phenOf(g); total++;
        var key=p?p.label:g; counts[key]=(counts[key]||0)+1;
        return '<td'+(p?' style="--pc:'+esc(p.color)+'" class="iwpun-has"':'')+'><b>'+esc(g)+'</b>'+
          (p&&c.showPheno!==false?'<i>'+esc(p.label)+'</i>':'')+'</td>'; }).join('')+'</tr>'; });
    var keys=Object.keys(counts);
    // reduce n:m:… to its simplest whole-number form
    function gcd(a,b){ return b?gcd(b,a%b):a; }
    var g0=keys.length?keys.map(function(k){ return counts[k]; }).reduce(gcd):1;
    var ratio=keys.map(function(k){
      var col=(phen.filter(function(p){ return p.label===k; })[0]||{}).color;
      return '<span class="iwpun-r"'+(col?' style="--pc:'+esc(col)+'"':'')+'><b>'+(counts[k]/g0)+'</b>'+esc(k)+
        ' <em>'+Math.round(counts[k]/total*100)+' %</em></span>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwpun-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwpun-scroll"><table class="iwpun-t">'+rows+'</table></div>'+
      (c.showRatio!==false&&keys.length?'<div class="iwpun-ratio"><span class="iwpun-rl">'+esc(c.ratioLabel||'Proportions')+'</span>'+ratio+'</div>':'')+
      (c.note?'<div class="iwpun-note">'+esc(c.note)+'</div>':'');
  };

  /* ── pedigree: a family tree with the standard genetics symbols ── */
  R.pedigree=function(box,c){
    box.className='iw iw-card iw-ped';
    var people=(c.people||[]).filter(function(p){ return p&&p.id; });
    if(!people.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une personne.</div>'; return; }
    var by={}; people.forEach(function(p){ by[p.id]=p; });
    var gens={}, order=[];
    people.forEach(function(p){ var g=parseInt(p.gen,10)||1; (gens[g]=gens[g]||[]).push(p); if(order.indexOf(g)<0)order.push(g); });
    order.sort(function(a,b){ return a-b; });
    var COL=86, ROW=104, PAD=34, S=26;
    var wide=Math.max.apply(null,order.map(function(g){ return gens[g].length; }));
    var W=PAD*2+Math.max(1,wide)*COL, H=PAD*2+order.length*ROW;
    var X={}, Y={};
    order.forEach(function(g,gi){ var list=gens[g], span=list.length*COL;
      list.forEach(function(p,pi){ X[p.id]=(W-span)/2+COL*pi+COL/2; Y[p.id]=PAD+gi*ROW+S/2; }); });
    var lines='', sym='', labs='';
    // couples: a horizontal bar between partners
    var couples={};
    people.forEach(function(p){ if(!p.partner||!by[p.partner])return;
      var k=[p.id,p.partner].sort().join('+'); if(couples[k])return;
      var a=X[p.id], b=X[p.partner], y=Y[p.id];
      couples[k]={x:(a+b)/2,y:y};
      lines+='<line x1="'+Math.min(a,b)+'" y1="'+y+'" x2="'+Math.max(a,b)+'" y2="'+y+'" class="iwped-l"/>'; });
    // sibships: children sharing the same parent pair hang off one bar
    var sibs={};
    people.forEach(function(p){ var ps=String(p.parents||'').split(new RegExp('[ ,+]+')).filter(function(x){ return x&&by[x]; });
      if(!ps.length)return; var k=ps.slice().sort().join('+'); (sibs[k]=sibs[k]||[]).push(p); });
    Object.keys(sibs).forEach(function(k){ var kids=sibs[k], ps=k.split('+');
      var px=ps.reduce(function(a,id){ return a+X[id]; },0)/ps.length;
      var py=Y[ps[0]]+S/2;
      var xs=kids.map(function(p){ return X[p.id]; });
      var bar=Math.min.apply(null,kids.map(function(p){ return Y[p.id]; }))-S/2-22;
      lines+='<line x1="'+px+'" y1="'+py+'" x2="'+px+'" y2="'+bar+'" class="iwped-l"/>';
      lines+='<line x1="'+Math.min.apply(null,xs)+'" y1="'+bar+'" x2="'+Math.max.apply(null,xs)+'" y2="'+bar+'" class="iwped-l"/>';
      kids.forEach(function(p){ lines+='<line x1="'+X[p.id]+'" y1="'+bar+'" x2="'+X[p.id]+'" y2="'+(Y[p.id]-S/2)+'" class="iwped-l"/>'; }); });
    people.forEach(function(p){ var x=X[p.id], y=Y[p.id], h=S/2;
      var cls='iwped-s'+(p.affected?' aff':'')+(p.carrier&&!p.affected?' car':'');
      if(p.sex==='f')sym+='<circle cx="'+x+'" cy="'+y+'" r="'+h+'" class="'+cls+'"/>';
      else if(p.sex==='u')sym+='<polygon points="'+x+','+(y-h)+' '+(x+h)+','+y+' '+x+','+(y+h)+' '+(x-h)+','+y+'" class="'+cls+'"/>';
      else sym+='<rect x="'+(x-h)+'" y="'+(y-h)+'" width="'+S+'" height="'+S+'" class="'+cls+'"/>';
      if(p.carrier&&!p.affected)sym+='<circle cx="'+x+'" cy="'+y+'" r="4.2" class="iwped-dot"/>';
      if(p.dead)sym+='<line x1="'+(x-h-5)+'" y1="'+(y+h+5)+'" x2="'+(x+h+5)+'" y2="'+(y-h-5)+'" class="iwped-dead"/>';
      if(p.label)labs+='<text x="'+x+'" y="'+(y+h+15)+'" class="iwped-t" text-anchor="middle">'+esc(p.label)+'</text>'; });
    var romans=['I','II','III','IV','V','VI','VII','VIII'];
    var gl=order.map(function(g,gi){ return '<text x="10" y="'+(PAD+gi*ROW+S/2+4)+'" class="iwped-g">'+(romans[gi]||(gi+1))+'</text>'; }).join('');
    var key='<div class="iwped-key">'+
      '<span><svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="1" width="14" height="14" class="iwped-s"/></svg>'+esc(c.maleLabel||'Homme')+'</span>'+
      '<span><svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" class="iwped-s"/></svg>'+esc(c.femaleLabel||'Femme')+'</span>'+
      '<span><svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="1" width="14" height="14" class="iwped-s aff"/></svg>'+esc(c.affectedLabel||'Atteint')+'</span>'+
      '<span><svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" class="iwped-s"/><circle cx="8" cy="8" r="3" class="iwped-dot"/></svg>'+esc(c.carrierLabel||'Porteur sain')+'</span></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwped-scroll"><svg class="iwped-svg" viewBox="0 0 '+W+' '+H+'" role="img">'+gl+lines+sym+labs+'</svg></div>'+
      key+(c.note?'<div class="iwped-note">'+esc(c.note)+'</div>':'');
  };

  /* ── exercise sheet: typed answers, checked with a tolerance ── */
  R.exercise=function(box,c){
    box.className='iw iw-card iw-ex';
    var items=(c.tasks||c.items||[]).filter(function(q){ return q&&(q.q||q.answer); });
    if(!items.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une question.</div>'; return; }
    var body=items.map(function(q,i){
      return '<li class="iwex-q" data-q="'+i+'">'+
        '<div class="iwex-qt">'+esc(q.q||'')+(q.points?'<span class="iwex-pts">'+esc(q.points)+' pt</span>':'')+'</div>'+
        '<div class="iwex-in"><input type="text" class="iwex-a" autocomplete="off" spellcheck="false" aria-label="Réponse" placeholder="'+esc(c.placeholder||'Ta réponse…')+'">'+
        (q.unit?'<span class="iwex-u">'+esc(q.unit)+'</span>':'')+'<i class="iwex-mark"></i></div>'+
        (q.hint?'<button type="button" class="iwm-qbtn iwex-hb" data-h="'+i+'">Indice</button><div class="iwex-hint" hidden>'+esc(q.hint)+'</div>':'')+
        (q.solution?'<div class="iwex-sol" hidden><b>Correction</b>'+esc(q.solution)+'</div>':'')+
        '</li>'; }).join('');
    box.innerHTML=(c.kicker?'<div class="iwex-kick">'+esc(c.kicker)+'</div>':'')+
      (c.title?'<h3 class="iwex-title">'+esc(c.title)+'</h3>':'')+
      iwMeta(c)+
      (c.intro?'<div class="iwex-intro">'+esc(c.intro)+'</div>':'')+
      '<ol class="iwex-list">'+body+'</ol>'+
      '<div class="iwex-actions"><button type="button" class="iw-btn" data-ex="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-ex="sol">Corrigé</button>'+
      '<button type="button" class="iwm-qbtn" data-ex="reset">'+T('clear','Effacer')+'</button>'+
      '<span class="iwex-score"></span></div>'+
      (c.note?'<div class="iwex-note">'+esc(c.note)+'</div>':'');
    var qs=box.querySelectorAll('.iwex-q');
    box.querySelectorAll('[data-h]').forEach(function(b){ b.addEventListener('click',function(){
      var d=qs[+b.getAttribute('data-h')].querySelector('.iwex-hint'); d.hidden=!d.hidden; }); });
    box.querySelectorAll('.iwex-a').forEach(function(inp){ inp.addEventListener('input',function(){
      inp.closest('.iwex-q').classList.remove('ok','no'); }); });
    box.querySelector('[data-ex="check"]').addEventListener('click',function(){
      var n=0;
      items.forEach(function(q,i){ var d=qs[i], v=d.querySelector('.iwex-a').value;
        var ok=String(v).trim()!==''&&iwAnswerOk(v,q.answer,q.tolerance);
        d.classList.toggle('ok',ok); d.classList.toggle('no',!ok); if(ok)n++; });
      var pct=Math.round(n/items.length*100);
      var s=box.querySelector('.iwex-score');
      s.textContent=n+'/'+items.length+' · '+pct+' %'; s.className='iwex-score '+(pct>=(c.passScore||60)?'ok':'no'); });
    box.querySelector('[data-ex="sol"]').addEventListener('click',function(){
      items.forEach(function(q,i){ var d=qs[i];
        var sol=d.querySelector('.iwex-sol'); if(sol)sol.hidden=false;
        if(q.answer&&!d.querySelector('.iwex-shown')){ var a=el('div','iwex-shown'); a.innerHTML='<b>Réponse</b>'+esc(q.answer)+(q.unit?' '+esc(q.unit):''); d.appendChild(a); } }); });
    box.querySelector('[data-ex="reset"]').addEventListener('click',function(){
      box.querySelectorAll('.iwex-a').forEach(function(a){ a.value=''; });
      box.querySelectorAll('.iwex-shown').forEach(function(a){ a.remove(); });
      box.querySelectorAll('.iwex-sol,.iwex-hint').forEach(function(a){ a.hidden=true; });
      qs.forEach(function(d){ d.classList.remove('ok','no'); });
      var s=box.querySelector('.iwex-score'); s.textContent=''; s.className='iwex-score'; });
  };

  /* ── glossary: a searchable list of terms ── */
  R.glossary=function(box,c){
    box.className='iw iw-card iw-glo';
    var terms=(c.terms||[]).filter(function(t){ return t&&t.term; });
    if(!terms.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins un terme.</div>'; return; }
    var sorted=terms.slice().sort(function(a,b){ return iwNorm(a.term)<iwNorm(b.term)?-1:1; });
    var letter='', body='';
    sorted.forEach(function(t,i){ var L=iwNorm(t.term).charAt(0).toUpperCase()||'#';
      if(L!==letter){ letter=L; body+='<dt class="iwglo-letter" aria-hidden="true">'+esc(L)+'</dt>'; }
      body+='<div class="iwglo-e" data-k="'+esc(iwNorm(t.term+' '+(t.aka||'')+' '+(t.def||'')))+'">'+
        '<dt>'+esc(t.term)+(t.tag?'<span class="iwglo-tag">'+esc(t.tag)+'</span>':'')+
        (t.aka?'<em>'+esc(t.aka)+'</em>':'')+'</dt>'+
        '<dd>'+esc(t.def||'')+'</dd></div>'; });
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwglo-intro">'+esc(c.intro)+'</div>':'')+
      (c.search===false?'':'<div class="iwglo-bar"><input type="search" class="iwglo-in" placeholder="'+esc(c.searchLabel||'Chercher un terme…')+'" aria-label="Chercher"><span class="iwglo-count"></span></div>')+
      '<dl class="iwglo-l'+(+c.columns>1?' iwglo-2':'')+'">'+body+'</dl>';
    var inp=box.querySelector('.iwglo-in'); if(!inp)return;
    var cnt=box.querySelector('.iwglo-count'), entries=box.querySelectorAll('.iwglo-e'), heads=box.querySelectorAll('.iwglo-letter');
    inp.addEventListener('input',function(){ var q=iwNorm(inp.value), n=0;
      entries.forEach(function(e){ var hit=!q||e.getAttribute('data-k').indexOf(q)>=0; e.hidden=!hit; if(hit)n++; });
      heads.forEach(function(h){ h.hidden=!!q; });
      cnt.textContent=q?(n+' / '+entries.length):''; });
  };

  /* ── flashcards: a revision deck, one card at a time ── */
  R.flashcards=function(box,c){
    box.className='iw iw-card iw-fc';
    var cards=(c.cards||[]).filter(function(x){ return x&&(x.front||x.back); });
    if(!cards.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une carte.</div>'; return; }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwfc-card" tabindex="0" role="button" aria-label="Retourner la carte"><div class="iwfc-inner">'+
      '<div class="iwfc-face iwfc-front"><span class="iwfc-tag"></span><div class="iwfc-tx"></div><i>Cliquez pour retourner</i></div>'+
      '<div class="iwfc-face iwfc-back"><div class="iwfc-tx"></div></div></div></div>'+
      '<div class="iwfc-bar"><button type="button" class="iwm-qbtn" data-f="prev">‹</button>'+
      '<span class="iwfc-pos"></span>'+
      '<button type="button" class="iwm-qbtn" data-f="next">›</button></div>'+
      '<div class="iwfc-judge"><button type="button" class="iw-btn iwfc-yes" data-f="known">Je savais</button>'+
      '<button type="button" class="iwm-qbtn iwfc-no" data-f="again">À revoir</button>'+
      '<button type="button" class="iwm-qbtn" data-f="restart">'+T('reset','Recommencer')+'</button></div>'+
      '<div class="iwfc-stat"></div>'+(c.note?'<div class="iwfc-note">'+esc(c.note)+'</div>':'');
    var deck=[], at=0, known=0, again=0, flipped=false;
    var cardEl=box.querySelector('.iwfc-card');
    var frontTx=box.querySelector('.iwfc-front .iwfc-tx'), backTx=box.querySelector('.iwfc-back .iwfc-tx');
    var tagEl=box.querySelector('.iwfc-tag'), pos=box.querySelector('.iwfc-pos'), stat=box.querySelector('.iwfc-stat');
    function reset(){ deck=cards.map(function(_,i){ return i; });
      // deterministic shuffle: no Math.random, so a printed book and a screen agree
      if(c.shuffle){ var s=deck.length; deck.sort(function(a,b){ return ((a*7+3)%s)-((b*7+3)%s); }); }
      at=0; known=0; again=0; show(); }
    function show(){ var card=cards[deck[at]]||{};
      flipped=false; cardEl.classList.remove('flip');
      frontTx.textContent=card.front||''; backTx.textContent=card.back||'';
      tagEl.textContent=card.tag||''; tagEl.hidden=!card.tag;
      pos.textContent=(at+1)+' / '+deck.length;
      stat.textContent=(known+again)?('Su : '+known+' · À revoir : '+again):''; }
    function step(d){ at=(at+d+deck.length)%deck.length; show(); }
    cardEl.addEventListener('click',function(){ flipped=!flipped; cardEl.classList.toggle('flip',flipped); });
    cardEl.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); cardEl.click(); } });
    box.querySelector('[data-f="prev"]').addEventListener('click',function(){ step(-1); });
    box.querySelector('[data-f="next"]').addEventListener('click',function(){ step(1); });
    box.querySelector('[data-f="known"]').addEventListener('click',function(){ known++; step(1); });
    box.querySelector('[data-f="again"]').addEventListener('click',function(){ again++; step(1); });
    box.querySelector('[data-f="restart"]').addEventListener('click',reset);
    reset();
  };

  /* ── scatter plot with an optional fitted line ── */
  R.scatter=function(box,c){
    box.className='iw iw-card iw-sc';
    var pts=[];
    String(c.data||'').split(String.fromCharCode(10)).forEach(function(line){
      var m=line.split(new RegExp('[;,	 ]+')).filter(function(x){ return x!==''; });
      if(m.length<2)return; var x=iwNum(m[0]), y=iwNum(m[1]);
      if(x!=null&&y!=null)pts.push([x,y]); });
    (c.points||[]).forEach(function(p){ var x=iwNum(p&&p.x), y=iwNum(p&&p.y); if(x!=null&&y!=null)pts.push([x,y]); });
    if(pts.length<2){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Colle au moins deux couples de valeurs, un par ligne : « 1 ; 2,4 ».</div>'; return; }
    var xs=pts.map(function(p){ return p[0]; }), ys=pts.map(function(p){ return p[1]; });
    var x0=iwNum(c.xmin), x1=iwNum(c.xmax), y0=iwNum(c.ymin), y1=iwNum(c.ymax);
    if(x0==null)x0=Math.min(0,Math.min.apply(null,xs)); if(x1==null)x1=Math.max.apply(null,xs);
    if(y0==null)y0=Math.min(0,Math.min.apply(null,ys)); if(y1==null)y1=Math.max.apply(null,ys);
    var padx=(x1-x0)*0.06||1, pady=(y1-y0)*0.08||1;
    x1+=padx; y1+=pady;
    if(x1-x0<1e-9)x1=x0+1; if(y1-y0<1e-9)y1=y0+1;
    var W=640,H=380,L=62,B=52,T=18,Rr=18;
    var X=function(v){ return L+(v-x0)/(x1-x0)*(W-L-Rr); }, Y=function(v){ return H-B-(v-y0)/(y1-y0)*(H-B-T); };
    var col=c.color||cvar('--accent','#8c2f2a');
    // least squares, either y = ax + b or y = ax forced through the origin
    var mode=c.fit||'none', a=0, b=0, r2=null;
    if(mode!=='none'){
      var n=pts.length, sx=0,sy=0,sxy=0,sxx=0;
      pts.forEach(function(p){ sx+=p[0]; sy+=p[1]; sxy+=p[0]*p[1]; sxx+=p[0]*p[0]; });
      if(mode==='proportional'){ a=sxx?sxy/sxx:0; b=0; }
      else { var den=n*sxx-sx*sx; a=den?(n*sxy-sx*sy)/den:0; b=(sy-a*sx)/n; }
      var my=sy/n, ss=0, sr=0;
      pts.forEach(function(p){ ss+=(p[1]-my)*(p[1]-my); sr+=(p[1]-(a*p[0]+b))*(p[1]-(a*p[0]+b)); });
      r2=ss?1-sr/ss:null; }
    function ticks(lo,hi){ var span=hi-lo, p=Math.pow(10,Math.floor(Math.log(span)/Math.LN10)), s=p;
      if(span/s>8)s=p*2; if(span/s>8)s=p*5; if(span/s<3)s=p/2;
      var out=[]; for(var v=Math.ceil(lo/s)*s; v<=hi+1e-9; v+=s)out.push(Math.round(v*1e6)/1e6); return out; }
    var s='<svg class="iwsc-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    ticks(y0,y1).forEach(function(v){ s+='<line class="iwsc-grid" x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+Y(v).toFixed(1)+'"/>'+
      '<text class="iwsc-n" x="'+(L-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+v+'</text>'; });
    ticks(x0,x1).forEach(function(v){ s+='<line class="iwsc-grid" x1="'+X(v).toFixed(1)+'" y1="'+T+'" x2="'+X(v).toFixed(1)+'" y2="'+(H-B)+'"/>'+
      '<text class="iwsc-n" x="'+X(v).toFixed(1)+'" y="'+(H-B+18)+'" text-anchor="middle">'+v+'</text>'; });
    s+='<line class="iwsc-ax" x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="iwsc-ax" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-Rr)+'" y2="'+(H-B)+'"/>';
    if(mode!=='none'){ var lx0=x0, lx1=x1;
      s+='<line class="iwsc-fit" x1="'+X(lx0).toFixed(1)+'" y1="'+Y(a*lx0+b).toFixed(1)+'" x2="'+X(lx1).toFixed(1)+'" y2="'+Y(a*lx1+b).toFixed(1)+'" stroke="'+esc(col)+'"/>'; }
    pts.forEach(function(p){ s+='<circle class="iwsc-pt" cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="4.4" fill="'+esc(col)+'"><title>'+p[0]+' ; '+p[1]+'</title></circle>'; });
    if(c.xLabel)s+='<text class="iwsc-al" x="'+((L+W-Rr)/2)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(c.xLabel)+'</text>';
    if(c.yLabel)s+='<text class="iwsc-al" transform="translate(15,'+((T+H-B)/2)+') rotate(-90)" text-anchor="middle">'+esc(c.yLabel)+'</text>';
    s+='</svg>';
    var eq='';
    if(mode!=='none'&&c.showEquation!==false){
      var dec=(parseInt(c.decimals,10)>=0)?parseInt(c.decimals,10):3;
      eq='<div class="iwsc-eq"><span><em>y</em> = '+iwFmt(a,dec)+' <em>x</em>'+
        (mode==='proportional'?'':(b>=0?' + ':' − ')+iwFmt(Math.abs(b),dec))+'</span>'+
        (r2!=null?'<span>R² = '+iwFmt(r2,4)+'</span>':'')+
        '<span>'+pts.length+' points</span></div>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwsc-wrap">'+s+'</div>'+eq+(c.note?'<div class="iwsc-note">'+esc(c.note)+'</div>':'');
  };

  /* ── ordering: put the steps back in the right sequence ── */
  R.ordering=function(box,c){
    box.className='iw iw-card iw-ord';
    var items=(c.items||[]).filter(function(x){ return String(x||'').trim(); });
    if(items.length<2){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins deux éléments, dans le bon ordre.</div>'; return; }
    // Start order: a fixed rotation, so the exercise is the same for everyone.
    var start=items.map(function(_,i){ return i; });
    if(c.shuffle!==false){ var k=Math.max(1,Math.floor(items.length/2)+1);
      start=start.slice(k).concat(start.slice(0,k));
      if(start.length>2){ var t=start[0]; start[0]=start[start.length-1]; start[start.length-1]=t; } }
    var cur=start.slice();
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iword-intro">'+esc(c.intro)+'</div>':'')+
      '<ol class="iword-list"></ol>'+
      '<div class="iword-actions"><button type="button" class="iw-btn" data-o="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-o="show">'+T('show','Montrer')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-o="reset">'+T('reset','Recommencer')+'</button>'+
      '<span class="iword-score"></span></div>'+
      (c.note?'<div class="iword-note">'+esc(c.note)+'</div>':'');
    var list=box.querySelector('.iword-list');
    function draw(){ list.innerHTML=cur.map(function(idx,pos){
      return '<li class="iword-li" data-p="'+pos+'"><span class="iword-n">'+(pos+1)+'</span>'+
        '<span class="iword-t">'+esc(items[idx])+'</span>'+
        '<span class="iword-btns"><button type="button" data-mv="'+pos+':-1" aria-label="Monter"'+(pos===0?' disabled':'')+'>▲</button>'+
        '<button type="button" data-mv="'+pos+':1" aria-label="Descendre"'+(pos===cur.length-1?' disabled':'')+'>▼</button></span></li>'; }).join('');
      list.querySelectorAll('[data-mv]').forEach(function(b){ b.addEventListener('click',function(){
        var p=b.getAttribute('data-mv').split(':'), i=+p[0], d=+p[1], j=i+d;
        if(j<0||j>=cur.length)return; var t=cur[i]; cur[i]=cur[j]; cur[j]=t;
        box.querySelector('.iword-score').textContent=''; draw(); }); }); }
    box.querySelector('[data-o="check"]').addEventListener('click',function(){
      var n=0; list.querySelectorAll('.iword-li').forEach(function(li,pos){
        var ok=cur[pos]===pos; li.classList.toggle('ok',ok); li.classList.toggle('no',!ok); if(ok)n++; });
      var s=box.querySelector('.iword-score');
      s.textContent=n+'/'+items.length+' à la bonne place'; s.className='iword-score '+(n===items.length?'ok':'no'); });
    box.querySelector('[data-o="show"]').addEventListener('click',function(){
      cur=items.map(function(_,i){ return i; }); draw();
      list.querySelectorAll('.iword-li').forEach(function(li){ li.classList.add('ok'); });
      var s=box.querySelector('.iword-score'); s.textContent='Ordre correct'; s.className='iword-score ok'; });
    box.querySelector('[data-o="reset"]').addEventListener('click',function(){
      cur=start.slice(); draw(); var s=box.querySelector('.iword-score'); s.textContent=''; s.className='iword-score'; });
    draw();
  };

  /* ── climatogram: the ombrothermic diagram, bars for rain, a line for heat ──
     Convention: the precipitation axis runs at twice the temperature axis, so a
     month whose rainfall curve dips below the temperature curve is a dry month. */
  R.climatogram=function(box,c){
    box.className='iw iw-card iw-clim';
    var months=(c.months&&c.months.length)?c.months:['J','F','M','A','M','J','J','A','S','O','N','D'];
    var T=(c.temp||[]).map(function(v){ return iwNum(v); });
    var P=(c.precip||[]).map(function(v){ return iwNum(v); });
    var n=Math.min(months.length,Math.max(T.length,P.length));
    if(!n){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Donne au moins une série de valeurs mensuelles.</div>'; return; }
    var tCol=c.tempColor||cvar('--accent','#c0392b'), pCol=c.precipColor||cvar('--teal','#4a6fa5');
    var tMax=Math.max.apply(null,T.filter(function(v){return v!=null;}).concat([0]));
    var tMin=Math.min.apply(null,T.filter(function(v){return v!=null;}).concat([0]));
    var pMax=Math.max.apply(null,P.filter(function(v){return v!=null;}).concat([0]));
    // the classic P = 2T pairing, rounded up to a tidy step
    var tTop=Math.max(Math.ceil(tMax/10)*10,10), pTop=Math.max(tTop*2,Math.ceil(pMax/20)*20);
    if(pTop<pMax)pTop=Math.ceil(pMax/20)*20;
    var tBot=Math.min(0,Math.floor(tMin/10)*10);
    var W=660,H=330,L=54,Rp=58,Tp=18,B=46;
    var iw2=(W-L-Rp)/n;
    var YP=function(v){ return H-B-(v/pTop)*(H-B-Tp); };
    var YT=function(v){ return H-B-((v-tBot)/(tTop-tBot))*(H-B-Tp); };
    var s='<svg class="iwcl-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    var step=pTop/5, i;
    for(i=0;i<=5;i++){ var pv=Math.round(step*i), y=YP(pv);
      s+='<line class="iwcl-grid" x1="'+L+'" y1="'+y.toFixed(1)+'" x2="'+(W-Rp)+'" y2="'+y.toFixed(1)+'"/>'+
         '<text class="iwcl-n" x="'+(L-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" fill="'+esc(pCol)+'">'+pv+'</text>'+
         '<text class="iwcl-n" x="'+(W-Rp+8)+'" y="'+(y+4).toFixed(1)+'" fill="'+esc(tCol)+'">'+Math.round(tBot+(tTop-tBot)*i/5)+'</text>'; }
    // dry months: shaded where the rain curve falls under the temperature curve
    var dry=0;
    for(i=0;i<n;i++){ if(P[i]!=null&&T[i]!=null&&P[i]<2*T[i]){ dry++;
      s+='<rect class="iwcl-dry" x="'+(L+i*iw2).toFixed(1)+'" y="'+Tp+'" width="'+iw2.toFixed(1)+'" height="'+(H-B-Tp)+'"/>'; } }
    for(i=0;i<n;i++){ if(P[i]==null)continue; var bh=Math.max(0,H-B-YP(P[i]));
      s+='<rect class="iwcl-bar" x="'+(L+i*iw2+iw2*0.22).toFixed(1)+'" y="'+YP(P[i]).toFixed(1)+'" width="'+(iw2*0.56).toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="'+esc(pCol)+'" rx="2"><title>'+esc(months[i])+' : '+P[i]+' mm</title></rect>'; }
    var pts=[];
    for(i=0;i<n;i++){ if(T[i]!=null)pts.push([(L+i*iw2+iw2/2),YT(T[i]),i]); }
    if(pts.length>1)s+='<polyline class="iwcl-line" points="'+pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ')+'" fill="none" stroke="'+esc(tCol)+'"/>';
    pts.forEach(function(p){ s+='<circle class="iwcl-dot" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.4" fill="'+esc(tCol)+'"><title>'+esc(months[p[2]])+' : '+T[p[2]]+' °C</title></circle>'; });
    for(i=0;i<n;i++)s+='<text class="iwcl-m" x="'+(L+i*iw2+iw2/2).toFixed(1)+'" y="'+(H-B+18)+'" text-anchor="middle">'+esc(months[i])+'</text>';
    s+='<line class="iwcl-ax" x1="'+L+'" y1="'+Tp+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="iwcl-ax" x1="'+(W-Rp)+'" y1="'+Tp+'" x2="'+(W-Rp)+'" y2="'+(H-B)+'"/>'+
      '<line class="iwcl-ax" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-Rp)+'" y2="'+(H-B)+'"/>';
    s+='<text class="iwcl-al" x="'+(L-8)+'" y="'+(Tp-4)+'" text-anchor="end" fill="'+esc(pCol)+'">'+esc(c.precipLabel||'P (mm)')+'</text>'+
       '<text class="iwcl-al" x="'+(W-Rp+8)+'" y="'+(Tp-4)+'" fill="'+esc(tCol)+'">'+esc(c.tempLabel||'T (°C)')+'</text>';
    s+='</svg>';
    var tv=T.filter(function(v){return v!=null;}), pv2=P.filter(function(v){return v!=null;});
    var tMean=tv.length?tv.reduce(function(a,b){return a+b;},0)/tv.length:null;
    var pSum=pv2.reduce(function(a,b){return a+b;},0);
    // the amplitude is coldest month → hottest month. tMin above is the AXIS floor
    // (clamped to 0 so the scale always shows zero) and must not be used here.
    var amp=tv.length?(Math.max.apply(null,tv)-Math.min.apply(null,tv)):null;
    var facts='<div class="iwcl-facts">'+
      (pv2.length?'<span><b>'+Math.round(pSum)+' mm</b>total annuel</span>':'')+
      (tMean!=null?'<span><b>'+iwFmt(tMean,1)+' °C</b>moyenne annuelle</span>':'')+
      (amp!=null?'<span><b>'+iwFmt(amp,1)+' °C</b>amplitude thermique</span>':'')+
      '<span><b>'+dry+'</b>mois sec'+(dry>1?'s':'')+'</span></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.place?'<div class="iwcl-place">'+esc(c.place)+'</div>':'')+
      '<div class="iwcl-wrap">'+s+'</div>'+facts+
      '<div class="iwcl-key"><span class="iwcl-kb" style="background:'+esc(pCol)+'"></span>Précipitations'+
      '<span class="iwcl-kl" style="background:'+esc(tCol)+'"></span>Températures'+
      '<span class="iwcl-kd"></span>Mois sec (P &lt; 2T)</div>'+
      (c.note?'<div class="iwcl-note">'+esc(c.note)+'</div>':'');
  };

  /* ── force diagram: arrows on a body, with the resultant worked out ── */
  R.forces=function(box,c){
    box.className='iw iw-card iw-frc';
    var F=(c.forces||[]).filter(function(f){ return f&&(f.label||f.magnitude!=null); }).map(function(f,i){
      var m=iwNum(f.magnitude); var a=iwNum(f.angle);
      return {label:f.label||('F'+(i+1)), m:(m==null?1:Math.abs(m)), given:(m!=null), a:(a==null?0:a), color:f.color||pal()[i%pal().length]}; });
    if(!F.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une force.</div>'; return; }
    var W=560,H=380,CX=W/2,CY=H/2;
    var mMax=Math.max.apply(null,F.map(function(f){ return f.m; }).concat([1]));
    var LMAX=124, R0=iwNum(c.bodySize)||26;
    var len=function(m){ return R0+10+(m/mMax)*LMAX; };
    var rad=function(d){ return -d*Math.PI/180; };            // 0 = right, angles anticlockwise
    var s='<svg class="iwfrc-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    if(c.showAxes!==false)s+='<line class="iwfrc-ax" x1="'+(CX-190)+'" y1="'+CY+'" x2="'+(CX+190)+'" y2="'+CY+'"/>'+
      '<line class="iwfrc-ax" x1="'+CX+'" y1="'+(CY-160)+'" x2="'+CX+'" y2="'+(CY+160)+'"/>';
    if(c.ground)s+='<line class="iwfrc-gnd" x1="'+(CX-150)+'" y1="'+(CY+R0+2)+'" x2="'+(CX+150)+'" y2="'+(CY+R0+2)+'"/>';
    // the body
    if((c.bodyShape||'box')==='circle')s+='<circle class="iwfrc-body" cx="'+CX+'" cy="'+CY+'" r="'+R0+'"/>';
    else s+='<rect class="iwfrc-body" x="'+(CX-R0)+'" y="'+(CY-R0*0.78)+'" width="'+(R0*2)+'" height="'+(R0*1.56)+'" rx="3"/>';
    if(c.bodyLabel)s+='<text class="iwfrc-bl" x="'+CX+'" y="'+CY+'" text-anchor="middle" dominant-baseline="central">'+esc(c.bodyLabel)+'</text>';
    function arrow(ang,L,col,cls,label){ var ux=Math.cos(ang), uy=Math.sin(ang);
      var x0=CX+ux*(R0+3), y0=CY+uy*(R0+3), x1=CX+ux*L, y1=CY+uy*L;
      var hl=13, hw=10, px=-uy, py=ux;
      var o='<line class="'+cls+'" x1="'+x0.toFixed(1)+'" y1="'+y0.toFixed(1)+'" x2="'+(x1-ux*hl*0.8).toFixed(1)+'" y2="'+(y1-uy*hl*0.8).toFixed(1)+'" stroke="'+esc(col)+'"/>'+
        '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+(x1-ux*hl+px*hw/2).toFixed(1)+' '+(y1-uy*hl+py*hw/2).toFixed(1)+
        ' L'+(x1-ux*hl-px*hw/2).toFixed(1)+' '+(y1-uy*hl-py*hw/2).toFixed(1)+' Z" fill="'+esc(col)+'"/>';
      if(label)o+='<text class="iwfrc-l" x="'+(CX+ux*(L+18)).toFixed(1)+'" y="'+(CY+uy*(L+18)).toFixed(1)+
        '" text-anchor="middle" dominant-baseline="central" fill="'+esc(col)+'">'+esc(label)+'</text>';
      return o; }
    F.forEach(function(f){ s+=arrow(rad(f.a),len(f.m),f.color,'iwfrc-a',f.label+(f.given&&c.showValues!==false?' = '+f.m+' N':'')); });
    // resultant
    var rx=0, ry=0;
    F.forEach(function(f){ rx+=f.m*Math.cos(f.a*Math.PI/180); ry+=f.m*Math.sin(f.a*Math.PI/180); });
    var rMag=Math.sqrt(rx*rx+ry*ry), rAng=Math.atan2(ry,rx)*180/Math.PI;
    var equil=rMag<mMax*0.005;
    if(c.showResultant!==false&&!equil)s+=arrow(rad(rAng),len(rMag),cvar('--gold','#c9a054'),'iwfrc-r',(c.resultantLabel||'R'));
    s+='</svg>';
    var read='<div class="iwfrc-read">'+F.map(function(f){
      return '<span style="--fc:'+esc(f.color)+'"><b>'+esc(f.label)+'</b>'+(f.given?f.m+' N':'—')+
        '<em>'+iwFmt(f.a,0)+'°</em></span>'; }).join('')+'</div>';
    var verdict=c.showResultant===false?'' : '<div class="iwfrc-sum '+(equil?'ok':'')+'">'+
      (equil?'<b>Équilibre</b> la somme vectorielle des forces est nulle : le corps est immobile ou en mouvement rectiligne uniforme.'
            :'<b>Résultante</b> R = '+iwFmt(rMag,2)+' N, orientée à '+iwFmt(rAng,1)+'° — le corps accélère dans cette direction.')+'</div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwfrc-wrap">'+s+'</div>'+read+verdict+(c.note?'<div class="iwfrc-note">'+esc(c.note)+'</div>':'');
  };

  /* ── radar chart: several items scored on the same criteria ── */
  R.radar=function(box,c){
    box.className='iw iw-card iw-rad';
    var axes=(c.axes||[]).filter(function(a){ return String(a||'').trim(); });
    var series=(c.series||[]).filter(function(s2){ return s2&&(s2.name||(s2.data||[]).length); });
    if(axes.length<3||!series.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Il faut au moins trois axes et une série.</div>'; return; }
    var P=pal(), n=axes.length, max=iwNum(c.max)||0;
    if(!max)series.forEach(function(s2){ (s2.data||[]).forEach(function(v){ var x=iwNum(v); if(x!=null&&x>max)max=x; }); });
    if(!max)max=1;
    var W=560,H=440,CX=W/2,CY=H/2+6,R0=142;
    var ang=function(i){ return -Math.PI/2+i*2*Math.PI/n; };
    var pt=function(i,v){ var a=ang(i), r=R0*Math.max(0,Math.min(1,v/max)); return [CX+r*Math.cos(a),CY+r*Math.sin(a)]; };
    var s='<svg class="iwrad-svg" viewBox="0 0 '+W+' '+H+'" role="img">', i, k;
    for(k=1;k<=4;k++){ var rr=R0*k/4, poly=[];
      for(i=0;i<n;i++){ var a2=ang(i); poly.push((CX+rr*Math.cos(a2)).toFixed(1)+','+(CY+rr*Math.sin(a2)).toFixed(1)); }
      s+='<polygon class="iwrad-web" points="'+poly.join(' ')+'"/>'; }
    for(i=0;i<n;i++){ var p=pt(i,max);
      s+='<line class="iwrad-spoke" x1="'+CX+'" y1="'+CY+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'"/>';
      var lp=[CX+(R0+22)*Math.cos(ang(i)),CY+(R0+22)*Math.sin(ang(i))];
      var anc=Math.abs(lp[0]-CX)<6?'middle':(lp[0]>CX?'start':'end');
      s+='<text class="iwrad-ax" x="'+lp[0].toFixed(1)+'" y="'+lp[1].toFixed(1)+'" text-anchor="'+anc+'" dominant-baseline="central">'+esc(axes[i])+'</text>'; }
    series.forEach(function(s2,si){ var col=s2.color||P[si%P.length], poly=[];
      for(i=0;i<n;i++){ var v=iwNum((s2.data||[])[i]); poly.push(pt(i,v==null?0:v)); }
      s+='<polygon class="iwrad-s" data-s="'+si+'" points="'+poly.map(function(q){return q[0].toFixed(1)+','+q[1].toFixed(1);}).join(' ')+
        '" fill="'+esc(col)+'" stroke="'+esc(col)+'"/>';
      poly.forEach(function(q,qi){ s+='<circle class="iwrad-p" data-s="'+si+'" cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="3.4" fill="'+esc(col)+'"><title>'+esc(s2.name||'')+' · '+esc(axes[qi])+' : '+((s2.data||[])[qi]==null?'—':(s2.data||[])[qi])+'</title></circle>'; }); });
    s+='<text class="iwrad-max" x="'+CX+'" y="'+(CY-R0-6)+'" text-anchor="middle">'+iwFmt(max,0)+'</text></svg>';
    var leg='<div class="iwrad-leg">'+series.map(function(s2,si){
      return '<button type="button" class="iwrad-chip on" data-t="'+si+'"><i style="background:'+esc(s2.color||P[si%P.length])+'"></i>'+esc(s2.name||('Série '+(si+1)))+'</button>'; }).join('')+'</div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwrad-wrap">'+s+'</div>'+leg+(c.note?'<div class="iwrad-note">'+esc(c.note)+'</div>':'');
    box.querySelectorAll('[data-t]').forEach(function(b){ b.addEventListener('click',function(){
      var si=b.getAttribute('data-t'), on=b.classList.toggle('on');
      box.querySelectorAll('[data-s="'+si+'"]').forEach(function(e2){ e2.style.display=on?'':'none'; }); }); });
  };

  /* ── mind map: a centre, a ring of branches, their children fanned outward ── */
  R.mindmap=function(box,c){
    box.className='iw iw-card iw-mm';
    var nodes=(c.mnodes||[]).filter(function(n2){ return n2&&(n2.label||n2.id); });
    if(!nodes.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une branche.</div>'; return; }
    var by={}, kids={}, P=pal();
    nodes.forEach(function(n2,i){ if(!n2.id)n2.id='n'+i; by[n2.id]=n2; });
    nodes.forEach(function(n2){ var p=(n2.parent&&by[n2.parent]&&n2.parent!==n2.id)?n2.parent:'__root';
      (kids[p]=kids[p]||[]).push(n2); });
    var roots=kids.__root||[];
    if(!roots.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Aucune branche de premier niveau : laisse le champ « parent » vide sur au moins une.</div>'; return; }
    var W=680,H=520,CX=W/2,CY=H/2,R1=138,R2=228;
    var pos={}, col={};
    roots.forEach(function(n2,i){ var a=-Math.PI/2+i*2*Math.PI/roots.length;
      pos[n2.id]={x:CX+R1*Math.cos(a),y:CY+R1*Math.sin(a),a:a};
      col[n2.id]=n2.color||P[i%P.length];
      var ch=kids[n2.id]||[], spread=Math.min(Math.PI*0.8,0.34*Math.max(1,ch.length));
      ch.forEach(function(k2,j){ var aa=a+(ch.length>1?(-spread/2+j*spread/(ch.length-1)):0);
        pos[k2.id]={x:CX+R2*Math.cos(aa),y:CY+R2*Math.sin(aa),a:aa};
        col[k2.id]=k2.color||col[n2.id]; }); });
    var s='<svg class="iwmm-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    nodes.forEach(function(n2){ var p=pos[n2.id]; if(!p)return;
      var par=by[n2.parent]&&pos[n2.parent]?pos[n2.parent]:{x:CX,y:CY};
      var mx=(par.x+p.x)/2, my=(par.y+p.y)/2;
      s+='<path class="iwmm-e" d="M'+par.x.toFixed(1)+' '+par.y.toFixed(1)+' Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+p.x.toFixed(1)+' '+p.y.toFixed(1)+
        '" fill="none" stroke="'+esc(col[n2.id])+'"/>'; });
    s+='</svg>';
    var html='<div class="iwmm-stage" style="height:'+H+'px">'+s+
      '<button type="button" class="iwmm-c">'+iwRT(c.center||'')+'</button>';
    nodes.forEach(function(n2){ var p=pos[n2.id]; if(!p)return;
      var lvl=(by[n2.parent]&&pos[n2.parent])?2:1;
      html+='<button type="button" class="iwmm-n l'+lvl+(n2.note?' has':'')+'" data-n="'+esc(n2.id)+
        '" style="--mc:'+esc(col[n2.id])+'">'+iwRT(n2.label||n2.id)+'</button>'; });
    html+='</div><div class="iwmm-det" data-det></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+html+
      (c.note?'<div class="iwmm-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwmm-stage'), svg=box.querySelector('.iwmm-svg');
    var cEl=box.querySelector('.iwmm-c');

    /* The branches used to sit at a fixed radius whatever the labels turned out
       to be, so a long centre word and a long branch word simply covered each
       other. Place them by angle as before, then push every pair apart until
       none of them touch and none of them leave the stage. It is a handful of
       iterations on a handful of boxes, and it means the map is legible for any
       set of labels rather than for the ones that happened to be tried. */
    function relax(){
      var sw=stage.clientWidth; if(!sw)return;
      var items=[{el:cEl,a:0,r:0,fixed:true}];
      nodes.forEach(function(n2){
        var p=pos[n2.id]; if(!p)return;
        var el2=stage.querySelector('[data-n="'+CSS.escape(n2.id)+'"]');
        if(el2)items.push({el:el2,a:p.a,r:(by[n2.parent]&&pos[n2.parent])?R2:R1,id:n2.id}); });
      items.forEach(function(it){ it.w=it.el.offsetWidth; it.h=it.el.offsetHeight; });
      // start from a radius that already clears the centre along each direction
      function reach(w,h,a){ var ca=Math.abs(Math.cos(a)), sa=Math.abs(Math.sin(a));
        return Math.min(ca>1e-6?(w/2)/ca:1e9, sa>1e-6?(h/2)/sa:1e9); }
      var c0=items[0], GAP=13;
      items.forEach(function(it){ if(it.fixed)return;
        var need=reach(c0.w,c0.h,it.a)+reach(it.w,it.h,it.a)+GAP;
        if(it.r<need)it.r=need; });
      var cx=sw/2, cy=0;
      function layout(){ items.forEach(function(it){
        it.x=cx+it.r*Math.cos(it.a); it.y=it.r*Math.sin(it.a); }); }
      layout();
      /* Separating the boxes and keeping them inside the column are one problem,
         not two: clamping afterwards used to shove a box straight back onto its
         neighbour, which is why a narrow phone still showed overlaps. Solve
         them together, and prefer moving vertically — there is always room
         downwards, never sideways. */
      var i,j,k;
      for(k=0;k<220;k++){
        var moved=false;
        for(i=0;i<items.length;i++)for(j=i+1;j<items.length;j++){
          var A=items[i], B=items[j];
          var dx=B.x-A.x, dy=B.y-A.y;
          var ox=(A.w+B.w)/2+10-Math.abs(dx), oy=(A.h+B.h)/2+8-Math.abs(dy);
          if(ox<=0||oy<=0)continue;
          moved=true;
          /* Try sideways, but only keep it if it actually worked once the
             column edges have had their say — a box already pinned against the
             edge cannot move, and pushing at it forever is how the two of them
             stayed on top of each other. Otherwise go down, where there is
             always room. */
          var done=false;
          if(ox<oy&&(A.w+B.w+24)<sw){
            var ax=A.x, bx=B.x, sx=(dx<0?-1:1)*ox/2;
            if(A.fixed)B.x+=sx*2; else if(B.fixed)A.x-=sx*2; else { A.x-=sx; B.x+=sx; }
            if(!A.fixed)A.x=Math.max(A.w/2+2,Math.min(sw-A.w/2-2,A.x));
            if(!B.fixed)B.x=Math.max(B.w/2+2,Math.min(sw-B.w/2-2,B.x));
            done=Math.abs(B.x-A.x)>=(A.w+B.w)/2+9;
            if(!done){ A.x=ax; B.x=bx; } }
          if(!done){ var sy=(dy===0?1:(dy<0?-1:1))*(oy/2+0.5);
            if(A.fixed)B.y+=sy*2; else if(B.fixed)A.y-=sy*2; else { A.y-=sy; B.y+=sy; } } }
        // pull anything that drifted out of the column back in on every pass, so
        // the next pass is looking at the truth
        items.forEach(function(it){ if(it.fixed)return;
          it.x=Math.max(it.w/2+2,Math.min(sw-it.w/2-2,it.x)); });
        if(!moved)break; }
      // keep every box inside the column, then size the stage to what is left
      /* Relaxation gets it right in every ordinary case, but it is iterative and
         a very crowded map in a very narrow column can still finish with a pair
         touching. This cannot: take the boxes in order and, if one still lands
         on an earlier one, drop it straight down until it is clear. It always
         terminates, and downwards is the one direction that never runs out. */
      var order2=items.slice().sort(function(a,b){
        if(a.fixed!==b.fixed)return a.fixed?-1:1;    // the centre never moves, so settle it first
        return (a.y-a.h/2)-(b.y-b.h/2); });
      for(i=1;i<order2.length;i++){
        var cur2=order2[i], guard=0;
        while(guard++<200){
          var hit2=null;
          for(j=0;j<i;j++){ var P=order2[j];
            if(Math.abs(P.x-cur2.x)<(P.w+cur2.w)/2+8&&Math.abs(P.y-cur2.y)<(P.h+cur2.h)/2+6){ hit2=P; break; } }
          if(!hit2)break;
          if(cur2.fixed)break;
          cur2.y=hit2.y+(hit2.h+cur2.h)/2+7; } }
      var top=0,bot=0;
      items.forEach(function(it){
        it.x=Math.max(it.w/2+2,Math.min(sw-it.w/2-2,it.x));
        top=Math.min(top,it.y-it.h/2); bot=Math.max(bot,it.y+it.h/2); });
      var pad=6, hh=(bot-top)+pad*2;
      cy=-top+pad;
      stage.style.height=Math.round(hh)+'px';
      items.forEach(function(it){
        it.el.style.left=it.x.toFixed(1)+'px';
        it.el.style.top=(it.y+cy).toFixed(1)+'px'; });
      // redraw the edges between where the boxes actually ended up
      var at={}; items.forEach(function(it){ if(it.id)at[it.id]={x:it.x,y:it.y+cy}; });
      var d='';
      nodes.forEach(function(n2){ var p=at[n2.id]; if(!p)return;
        var par=(by[n2.parent]&&at[n2.parent])?at[n2.parent]:{x:cx,y:cy};
        d+='<path class="iwmm-e" d="M'+par.x.toFixed(1)+' '+par.y.toFixed(1)+' Q'+
          ((par.x+p.x)/2).toFixed(1)+' '+((par.y+p.y)/2).toFixed(1)+' '+p.x.toFixed(1)+' '+p.y.toFixed(1)+
          '" fill="none" stroke="'+esc(col[n2.id])+'"/>'; });
      svg.setAttribute('viewBox','0 0 '+sw+' '+Math.round(hh));
      svg.innerHTML=d;
    }
    function relaxSafe(){ try{ relax(); }catch(e){ box.setAttribute('data-mmerr',e.message); } }
    iwWatch(stage,relaxSafe);


    var det=box.querySelector('[data-det]');
    box.querySelectorAll('[data-n]').forEach(function(b){ b.addEventListener('click',function(){
      var n2=by[b.getAttribute('data-n')];
      // whatever is being read comes to the front, so a crowded map still works
      box.querySelectorAll('[data-n]').forEach(function(x){ x.classList.toggle('on',x===b); });
      if(!n2||!n2.note)return;
      det.innerHTML='<b>'+iwRT(n2.label||'')+'</b>'+iwRT(n2.note); }); });
  };

  /* ── 3D viewer ────────────────────────────────────────────────────────
     A tiny software renderer on a 2D canvas: no WebGL, no library, so the book
     stays one offline file. Faces are z-sorted (painter's algorithm), backfaces
     dropped and flat-shaded from one light. Enough for a solid or a study model,
     and it degrades to nothing worse than a still image on old hardware. */
  function iwMesh(shape,c){
    var v=[], f=[], lab=[], info=null, TAU=Math.PI*2;
    var a=iwNum(c.a), b=iwNum(c.b), d=iwNum(c.c), r=iwNum(c.r), h=iwNum(c.h);
    if(a==null)a=1; if(b==null)b=a; if(d==null)d=a; if(r==null)r=0.6; if(h==null)h=1.4;
    var SEG=Math.max(8,Math.min(64,parseInt(c.segments,10)||28));
    var NAMES='ABCDEFGH';
    function ring(n,rr,y){ var out=[],i; for(i=0;i<n;i++){ var t=i/n*TAU; out.push([rr*Math.cos(t),y,rr*Math.sin(t)]); } return out; }
    if(shape==='box'||shape==='cube'){
      if(shape==='cube')b=d=a;
      var hx=a/2,hy=b/2,hz=d/2;
      v=[[-hx,-hy,hz],[hx,-hy,hz],[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz],[-hx,hy,-hz]];
      f=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
      lab=v.map(function(_,i){ return NAMES.charAt(i); });
      info=(shape==='cube')
        ? {V:a*a*a,S:6*a*a,fV:'V = a³',fS:'S = 6a²'}
        : {V:a*b*d,S:2*(a*b+b*d+a*d),fV:'V = L × l × h',fS:'S = 2(Ll + lh + Lh)'};
    } else if(shape==='tetrahedron'){
      var s=a, k=s/Math.sqrt(2);
      v=[[k,0,-k/Math.sqrt(2)],[-k,0,-k/Math.sqrt(2)],[0,k,k/Math.sqrt(2)],[0,-k,k/Math.sqrt(2)]];
      f=[[0,1,2],[0,3,1],[0,2,3],[1,3,2]];
      lab=['A','B','C','D'];
      info={V:s*s*s/(6*Math.sqrt(2)),S:Math.sqrt(3)*s*s,fV:'V = a³ / (6√2)',fS:'S = √3 · a²'};
    } else if(shape==='octahedron'){
      v=[[a,0,0],[-a,0,0],[0,a,0],[0,-a,0],[0,0,a],[0,0,-a]];
      f=[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]];
      info={V:Math.sqrt(2)/3*Math.pow(a*Math.sqrt(2),3),S:2*Math.sqrt(3)*Math.pow(a*Math.sqrt(2),2),fV:'V = (√2/3) a³',fS:'S = 2√3 a²'};
    } else if(shape==='pyramid'){
      var px=a/2;
      v=[[-px,-h/2,px],[px,-h/2,px],[px,-h/2,-px],[-px,-h/2,-px],[0,h/2,0]];
      f=[[0,1,2,3],[0,4,1],[1,4,2],[2,4,3],[3,4,0]];
      lab=['A','B','C','D','S'];
      var ap=Math.sqrt(h*h+a*a/4);
      info={V:a*a*h/3,S:a*a+2*a*ap,fV:'V = (a² × h) / 3',fS:'S = a² + 2a·a′'};
    } else if(shape==='prism'){
      var t3=a/Math.sqrt(3);
      var base=[[0,-h/2,t3],[t3*Math.sqrt(3)/2*1,-h/2,-t3/2],[-t3*Math.sqrt(3)/2*1,-h/2,-t3/2]];
      base.forEach(function(p){ v.push(p); });
      base.forEach(function(p){ v.push([p[0],h/2,p[2]]); });
      f=[[0,1,2],[5,4,3],[0,3,4,1],[1,4,5,2],[2,5,3,0]];
      lab=['A','B','C','A′','B′','C′'];
      var ab=Math.sqrt(3)/4*a*a;
      info={V:ab*h,S:2*ab+3*a*h,fV:'V = B × h',fS:'S = 2B + P·h'};
    } else if(shape==='cylinder'){
      var lo=ring(SEG,r,-h/2), hi=ring(SEG,r,h/2), i2;
      lo.forEach(function(p){ v.push(p); }); hi.forEach(function(p){ v.push(p); });
      var bot=[],top=[];
      for(i2=0;i2<SEG;i2++)bot.push(SEG-1-i2);
      for(i2=0;i2<SEG;i2++)top.push(SEG+i2);
      f.push(bot); f.push(top);
      for(i2=0;i2<SEG;i2++){ var j2=(i2+1)%SEG; f.push([i2,j2,SEG+j2,SEG+i2]); }
      info={V:Math.PI*r*r*h,S:2*Math.PI*r*(r+h),fV:'V = π r² h',fS:'S = 2π r (r + h)'};
    } else if(shape==='cone'){
      var lc=ring(SEG,r,-h/2), i3;
      lc.forEach(function(p){ v.push(p); }); v.push([0,h/2,0]);
      var bc=[]; for(i3=0;i3<SEG;i3++)bc.push(SEG-1-i3); f.push(bc);
      for(i3=0;i3<SEG;i3++)f.push([i3,(i3+1)%SEG,SEG]);
      var g=Math.sqrt(r*r+h*h);
      info={V:Math.PI*r*r*h/3,S:Math.PI*r*(r+g),fV:'V = (π r² h) / 3',fS:'S = π r (r + g)'};
    } else if(shape==='torus'){
      var R1=r, r2=iwNum(c.r2)||r*0.36, ni,nj, ring1=Math.max(10,SEG), ring2=Math.max(8,Math.round(SEG*0.6));
      for(ni=0;ni<ring1;ni++)for(nj=0;nj<ring2;nj++){
        var u=ni/ring1*TAU, w=nj/ring2*TAU;
        v.push([(R1+r2*Math.cos(w))*Math.cos(u), r2*Math.sin(w), (R1+r2*Math.cos(w))*Math.sin(u)]); }
      for(ni=0;ni<ring1;ni++)for(nj=0;nj<ring2;nj++){
        var n1=ni*ring2+nj, n2=((ni+1)%ring1)*ring2+nj, n3=((ni+1)%ring1)*ring2+((nj+1)%ring2), n4=ni*ring2+((nj+1)%ring2);
        f.push([n1,n2,n3,n4]); }
      info={V:2*Math.PI*Math.PI*R1*r2*r2,S:4*Math.PI*Math.PI*R1*r2,fV:'V = 2π² R r²',fS:'S = 4π² R r'};
    } else {                                   // sphere
      var rows=Math.max(6,Math.round(SEG*0.55)), cols=SEG, ri,ci;
      for(ri=0;ri<=rows;ri++){ var phi=ri/rows*Math.PI;
        for(ci=0;ci<cols;ci++){ var th=ci/cols*TAU;
          v.push([r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th)]); } }
      for(ri=0;ri<rows;ri++)for(ci=0;ci<cols;ci++){
        var q1=ri*cols+ci, q2=ri*cols+((ci+1)%cols), q3=(ri+1)*cols+((ci+1)%cols), q4=(ri+1)*cols+ci;
        f.push([q1,q2,q3,q4]); }
      info={V:4/3*Math.PI*r*r*r,S:4*Math.PI*r*r,fV:'V = (4/3) π r³',fS:'S = 4π r²'};
    }
    return {verts:v,faces:f,labels:(c.labels===false?[]:lab),info:info};
  }
  function iwParseObj(txt){
    var v=[], f=[], lines=String(txt||'').split(String.fromCharCode(10)), i;
    for(i=0;i<lines.length;i++){
      var ln=lines[i].split(String.fromCharCode(9)).join(' ').trim();
      if(!ln||ln.charAt(0)==='#')continue;
      var p=ln.split(' ').filter(function(x){ return x!==''; });
      if(p[0]==='v'&&p.length>=4)v.push([parseFloat(p[1]),parseFloat(p[2]),parseFloat(p[3])]);
      else if(p[0]==='f'&&p.length>=4){ var fa=[],k;
        for(k=1;k<p.length;k++){ var idx=parseInt(p[k].split('/')[0],10);
          if(isNaN(idx))continue; fa.push(idx<0?v.length+idx:idx-1); }
        if(fa.length>=3)f.push(fa); } }
    if(!v.length)return null;
    // This is a software rasteriser: every face is transformed, z-sorted and
    // painted on a 2D canvas each frame. A scanned mesh can carry hundreds of
    // thousands of them and will simply lock the tab up, so keep an even sample
    // and say so. It is a seatbelt, not a feature — decimate the model properly
    // before shipping it.
    var CAP=12000, dropped=0;
    if(f.length>CAP){
      var stride=f.length/CAP, kept=[], t;
      for(t=0;t<CAP;t++)kept.push(f[Math.floor(t*stride)]);
      dropped=f.length-kept.length; f=kept; }
    // centre on the origin and scale so the longest side is 2 units
    var lo=[1e9,1e9,1e9], hi=[-1e9,-1e9,-1e9];
    v.forEach(function(p){ for(var k2=0;k2<3;k2++){ if(p[k2]<lo[k2])lo[k2]=p[k2]; if(p[k2]>hi[k2])hi[k2]=p[k2]; } });
    var cx=(lo[0]+hi[0])/2, cy=(lo[1]+hi[1])/2, cz=(lo[2]+hi[2])/2;
    var span=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])||1, sc=2/span;
    v=v.map(function(p){ return [(p[0]-cx)*sc,(p[1]-cy)*sc,(p[2]-cz)*sc]; });
    return {verts:v,faces:f,labels:[],info:null,dropped:dropped};
  }
  R.model3d=function(box,c){
    box.className='iw iw-card iw-3d';
    var tpl=box.querySelector('template.iw3d-src');
    var M=tpl?iwParseObj(tpl.textContent||tpl.innerHTML):null;
    var fromObj=!!M;
    if(!M)M=iwMesh(c.shape||'cube',c);
    if(!M||!M.verts.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Modèle illisible.</div>'; return; }
    var facts=(!fromObj&&M.info&&c.showFormulas!==false)
      ? '<div class="iw3d-facts"><span><b>'+esc(M.info.fV)+'</b>'+iwFmt(M.info.V,3)+' unités³</span>'+
        '<span><b>'+esc(M.info.fS)+'</b>'+iwFmt(M.info.S,3)+' unités²</span>'+
        '<span><b>'+M.verts.length+' sommets</b>'+M.faces.length+' faces</span></div>' : '';
    // an imported mesh gets its own count, and an honest note when it was thinned
    if(fromObj&&c.showFormulas!==false)
      facts='<div class="iw3d-facts"><span><b>'+M.verts.length+' sommets</b>'+M.faces.length+' faces</span>'+
        (M.dropped?'<span class="iw3d-warn"><b>maillage allégé</b>'+(M.dropped+M.faces.length)+
          ' faces à l’origine — simplifiez le modèle avant publication</span>':'')+'</div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iw3d-stage"><canvas class="iw3d-cv"></canvas>'+
      '<div class="iw3d-tools">'+
      '<button type="button" data-v="in" aria-label="Agrandir">+</button>'+
      '<button type="button" data-v="out" aria-label="Réduire">−</button>'+
      '<button type="button" data-v="spin" aria-label="Rotation automatique">↻</button>'+
      '<button type="button" data-v="reset" aria-label="Réinitialiser">⌂</button></div>'+
      '<div class="iw3d-hint">Faites glisser pour tourner</div></div>'+facts+
      (c.caption?'<div class="iw3d-cap">'+esc(c.caption)+'</div>':'')+
      (c.note?'<div class="iw3d-note">'+esc(c.note)+'</div>':'');
    var cv=box.querySelector('.iw3d-cv'), ctx=cv.getContext('2d');
    var yaw=0.62, pitch=-0.42, zoom=1, spin=!!c.spin, raf=0, W=1, H=1;
    var base=c.color||cvar('--accent','#8c2f2a');
    var wire=!!c.wire, edges=c.showEdges!==false;
    function rgb(hex){ var s=String(hex).replace('#',''); if(s.length===3)s=s.charAt(0)+s.charAt(0)+s.charAt(1)+s.charAt(1)+s.charAt(2)+s.charAt(2);
      var n=parseInt(s,16); return isNaN(n)?[140,60,60]:[(n>>16)&255,(n>>8)&255,n&255]; }
    var C0=rgb(base);
    function size(){ var r=cv.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
      W=Math.max(120,r.width); H=Math.max(120,r.height);
      cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0); }
    function draw(){
      size();
      ctx.clearRect(0,0,W,H);
      var cy2=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
      var S=Math.min(W,H)*0.34*zoom, FOV=6.5;
      var P=M.verts.map(function(p){
        var x=p[0]*cy2+p[2]*sy, z=-p[0]*sy+p[2]*cy2;
        var y=p[1]*cp-z*sp; z=p[1]*sp+z*cp;
        var k=FOV/(FOV+z);
        return [W/2+x*S*k, H/2-y*S*k, z]; });
      var L=[0.42,0.66,-0.62];
      var order=M.faces.map(function(fa,i){ var zs=0,k2;
        for(k2=0;k2<fa.length;k2++)zs+=P[fa[k2]]?P[fa[k2]][2]:0;
        return {i:i,z:zs/fa.length}; }).sort(function(p,q){ return q.z-p.z; });
      order.forEach(function(o){ var fa=M.faces[o.i];
        var A=P[fa[0]],B=P[fa[1]],Cc=P[fa[2]]; if(!A||!B||!Cc)return;
        var nx=(B[0]-A[0])*(Cc[1]-A[1])-(B[1]-A[1])*(Cc[0]-A[0]);
        if(!wire&&nx>=0)return;                     // backface
        ctx.beginPath(); ctx.moveTo(A[0],A[1]);
        for(var k3=1;k3<fa.length;k3++){ var Q=P[fa[k3]]; if(Q)ctx.lineTo(Q[0],Q[1]); }
        ctx.closePath();
        if(!wire){
          // flat shading from the face normal in world space
          var v0=M.verts[fa[0]], v1=M.verts[fa[1]], v2=M.verts[fa[2]];
          var ax=v1[0]-v0[0],ay=v1[1]-v0[1],az=v1[2]-v0[2];
          var bx=v2[0]-v0[0],by=v2[1]-v0[1],bz=v2[2]-v0[2];
          var Nx=ay*bz-az*by, Ny=az*bx-ax*bz, Nz=ax*by-ay*bx;
          var ln=Math.sqrt(Nx*Nx+Ny*Ny+Nz*Nz)||1;
          var rx=(Nx/ln)*cy2+(Nz/ln)*sy, rz=-(Nx/ln)*sy+(Nz/ln)*cy2;
          var ry=(Ny/ln)*cp-rz*sp; rz=(Ny/ln)*sp+rz*cp;
          var dot=rx*L[0]+ry*L[1]+rz*L[2];
          var t=0.42+0.58*Math.abs(dot);
          ctx.fillStyle='rgb('+Math.round(C0[0]*t)+','+Math.round(C0[1]*t)+','+Math.round(C0[2]*t)+')';
          ctx.fill(); }
        if(edges||wire){ ctx.lineWidth=wire?1:1.05; ctx.strokeStyle=wire?base:'rgba(0,0,0,.32)'; ctx.stroke(); } });
      if(M.labels&&M.labels.length){
        ctx.font='600 13px ui-monospace, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        M.labels.forEach(function(t,i){ var p=P[i]; if(!p||!t)return;
          var dx=p[0]-W/2, dy=p[1]-H/2, m=Math.sqrt(dx*dx+dy*dy)||1;
          ctx.fillStyle=cvar('--ink','#1a2238');
          ctx.strokeStyle=cvar('--paper','#fff'); ctx.lineWidth=3.4;
          ctx.strokeText(t,p[0]+dx/m*13,p[1]+dy/m*13);
          ctx.fillText(t,p[0]+dx/m*13,p[1]+dy/m*13); }); }
    }
    function loop(){ if(spin){ yaw+=0.006; draw(); raf=requestAnimationFrame(loop); } else raf=0; }
    function start(){ if(spin&&!raf)raf=requestAnimationFrame(loop); }
    var down=false,lx=0,ly=0;
    cv.addEventListener('pointerdown',function(e){ down=true; lx=e.clientX; ly=e.clientY; cv.setPointerCapture(e.pointerId);
      box.querySelector('.iw3d-hint').style.opacity='0'; });
    cv.addEventListener('pointermove',function(e){ if(!down)return;
      yaw+=(e.clientX-lx)*0.0095; pitch+=(e.clientY-ly)*0.0095;
      pitch=Math.max(-1.45,Math.min(1.45,pitch)); lx=e.clientX; ly=e.clientY; draw(); });
    window.addEventListener('pointerup',function(){ down=false; });
    box.querySelector('[data-v="in"]').addEventListener('click',function(){ zoom=Math.min(3.2,zoom*1.22); draw(); });
    box.querySelector('[data-v="out"]').addEventListener('click',function(){ zoom=Math.max(0.35,zoom/1.22); draw(); });
    box.querySelector('[data-v="reset"]').addEventListener('click',function(){ yaw=0.62; pitch=-0.42; zoom=1; draw(); });
    box.querySelector('[data-v="spin"]').addEventListener('click',function(e){ spin=!spin;
      e.currentTarget.classList.toggle('on',spin); if(spin)start(); });
    // Getting the canvas to the right size is fiddlier than it looks. At hydrate
    // time layout has not run, so the rect is 0 and size() clamps to its floor. We
    // therefore redraw again later — and NOT only from requestAnimationFrame, which
    // never fires while the tab is in the background: a book opened in a background
    // tab would then stay stuck at the floor size for good. setTimeout still fires
    // there (clamped), so it is the one that actually rescues that case.
    var ro=null;
    if(window.ResizeObserver){ try{ ro=new ResizeObserver(function(){ draw(); }); ro.observe(cv); box.__iw3dRO=ro; }catch(e){} }
    function redraw(){ draw(); }
    draw();
    setTimeout(redraw,60); setTimeout(redraw,400);
    if(window.requestAnimationFrame)requestAnimationFrame(redraw);
    window.addEventListener('resize',redraw);
    document.addEventListener('visibilitychange',function(){ if(!document.hidden)redraw(); });
    start();
  };

  /* ── tableau de signes et de variations ── */
  R.variations=function(box,c){
    box.className='iw iw-card iw-var';
    var pts=(c.points||[]).filter(function(p){ return String(p||'').trim(); });
    if(pts.length<2){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Donne au moins deux valeurs de x (les bornes).</div>'; return; }
    var n=pts.length, cols=2*n-1;
    function val(s){ s=String(s==null?'':s).trim();
      if(s.indexOf('+∞')>=0)return Infinity; if(s.indexOf('−∞')>=0||s.indexOf('-∞')>=0)return -Infinity;
      var v=iwNum(s); return v==null?null:v; }
    var head='<tr><th class="iwvar-lb">'+esc(c.xlabel||'x')+'</th>';
    pts.forEach(function(p,i){ head+='<th class="iwvar-pt">'+esc(p)+'</th>'; if(i<n-1)head+='<th class="iwvar-gap"></th>'; });
    head+='</tr>';
    var body='';
    (c.rows||[]).forEach(function(row){
      if(!row)return;
      if(row.kind==='var'){
        var vals=row.values||[], dirs=[], i;
        for(i=0;i<n-1;i++){ var A=val(vals[i]), B=val(vals[i+1]);
          var d=(row.dirs&&row.dirs[i])?row.dirs[i]:null;
          dirs.push(d==='up'||d==='down' ? d : ((A!=null&&B!=null&&B<A)?'down':'up')); }
        // a value sits at the top when it ends a rise or starts a fall
        function place(i2){ if(i2===0)return dirs[0]==='up'?'bot':'top';
          if(i2===n-1)return dirs[n-2]==='up'?'top':'bot';
          return dirs[i2-1]==='up'?'top':'bot'; }
        body+='<tr class="iwvar-row iwvar-vrow"><th class="iwvar-lb">'+esc(row.label||'')+'</th>';
        for(i=0;i<n;i++){
          var pl=place(i);
          body+='<td class="iwvar-v"><span class="'+pl+'">'+esc(vals[i]==null?'':vals[i])+'</span></td>';
          if(i<n-1){ var up=dirs[i]==='up';
            body+='<td class="iwvar-a"><svg viewBox="0 0 60 56" preserveAspectRatio="none" aria-hidden="true">'+
              '<line x1="6" y1="'+(up?48:8)+'" x2="50" y2="'+(up?12:44)+'"/>'+
              '<path d="M54 '+(up?8:48)+' l-8 '+(up?1.5:-1.5)+' l4 '+(up?6:-6)+' Z"/></svg>'+
              '<i class="iwvar-sr">'+(up?'croissante':'décroissante')+'</i></td>'; } }
        body+='</tr>';
      } else {
        var signs=row.signs||[], marks=row.marks||[], j;
        body+='<tr class="iwvar-row iwvar-srow"><th class="iwvar-lb">'+esc(row.label||'')+'</th>';
        for(j=0;j<n;j++){
          var mk=String(marks[j]==null?'':marks[j]).trim();
          body+='<td class="iwvar-m'+(mk==='‖'||mk==='||'?' bar':'')+'">'+esc(mk==='||'?'‖':mk)+'</td>';
          if(j<n-1){ var sg=String(signs[j]==null?'':signs[j]).trim();
            body+='<td class="iwvar-s'+(sg==='-'||sg==='−'?' neg':(sg==='+'?' pos':''))+'">'+esc(sg==='-'?'−':sg)+'</td>'; } }
        body+='</tr>';
      } });
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwvar-scroll"><table class="iwvar-t">'+head+body+'</table></div>'+
      (c.note?'<div class="iwvar-note">'+esc(c.note)+'</div>':'');
  };

  /* ── thin-lens ray construction, solved and draggable ── */
  R.optics=function(box,c){
    box.className='iw iw-card iw-opt';
    var diverging=(c.lens==='diverging');
    var f0=Math.abs(iwNum(c.f)==null?4:iwNum(c.f))||4;
    var fS=diverging?-f0:f0;
    var hObj=Math.abs(iwNum(c.objectHeight)==null?2:iwNum(c.objectHeight))||2;
    var d0=Math.abs(iwNum(c.objectDistance)==null?10:iwNum(c.objectDistance))||10;
    var live=c.interactive!==false;
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwopt-wrap"></div>'+
      (live?'<div class="iwopt-ctl"><label>Distance objet–lentille <b data-dv></b></label>'+
        '<input type="range" min="1" max="30" step="0.5" value="'+d0+'" aria-label="Distance objet"></div>':'')+
      '<div class="iwopt-read" data-read></div>'+
      (c.note?'<div class="iwopt-note">'+esc(c.note)+'</div>':'');
    var wrap=box.querySelector('.iwopt-wrap'), read=box.querySelector('[data-read]');
    var rng=box.querySelector('input[type=range]'), dv=box.querySelector('[data-dv]');
    function render(d){
      var OAp, gam, atInf=Math.abs(d-fS)<0.04&&!diverging;
      if(atInf){ OAp=Infinity; gam=Infinity; }
      else { OAp=fS*d/(d-fS); gam=fS/(fS-d); }
      var hImg=gam*hObj;
      var span=Math.max(d,Math.abs(isFinite(OAp)?OAp:0),2*f0)*1.18+1;
      var W=680,H=330,AX=H/2,CX=W/2, S=(W/2-26)/span;
      var X=function(cm){ return CX+cm*S; }, Y=function(cm){ return AX-cm*S; };
      var s='<svg class="iwopt-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
      s+='<line class="iwopt-axis" x1="8" y1="'+AX+'" x2="'+(W-8)+'" y2="'+AX+'"/>';
      // lens
      var lh=Math.min(H/2-16,Math.max(46,hObj*S*1.9));
      s+='<line class="iwopt-lens" x1="'+CX+'" y1="'+(AX-lh)+'" x2="'+CX+'" y2="'+(AX+lh)+'"/>';
      var aw=7;
      if(!diverging)s+='<path class="iwopt-lt" d="M'+(CX-aw)+' '+(AX-lh+aw)+' L'+CX+' '+(AX-lh)+' L'+(CX+aw)+' '+(AX-lh+aw)+
        'M'+(CX-aw)+' '+(AX+lh-aw)+' L'+CX+' '+(AX+lh)+' L'+(CX+aw)+' '+(AX+lh-aw)+'"/>';
      else s+='<path class="iwopt-lt" d="M'+(CX-aw)+' '+(AX-lh)+' L'+CX+' '+(AX-lh+aw)+' L'+(CX+aw)+' '+(AX-lh)+
        'M'+(CX-aw)+' '+(AX+lh)+' L'+CX+' '+(AX+lh-aw)+' L'+(CX+aw)+' '+(AX+lh)+'"/>';
      [[-f0,'F'],[f0,'F′']].forEach(function(p){
        s+='<circle class="iwopt-f" cx="'+X(p[0]).toFixed(1)+'" cy="'+AX+'" r="3.2"/>'+
          '<text class="iwopt-t" x="'+X(p[0]).toFixed(1)+'" y="'+(AX+18)+'" text-anchor="middle">'+p[1]+'</text>'; });
      s+='<text class="iwopt-t" x="'+CX+'" y="'+(AX+18)+'" text-anchor="middle">O</text>';
      // object
      var Bx=X(-d), By=Y(hObj);
      s+='<line class="iwopt-obj" x1="'+Bx.toFixed(1)+'" y1="'+AX+'" x2="'+Bx.toFixed(1)+'" y2="'+By.toFixed(1)+'"/>'+
        '<path class="iwopt-oh" d="M'+(Bx-5).toFixed(1)+' '+(By+8)+' L'+Bx.toFixed(1)+' '+By.toFixed(1)+' L'+(Bx+5).toFixed(1)+' '+(By+8)+'"/>'+
        '<text class="iwopt-t2" x="'+(Bx-9).toFixed(1)+'" y="'+(By-4).toFixed(1)+'" text-anchor="end">B</text>'+
        '<text class="iwopt-t" x="'+(Bx-9).toFixed(1)+'" y="'+(AX+18)+'" text-anchor="end">A</text>';
      if(!atInf){
        var Ix=X(OAp), Iy=Y(hImg), real=OAp>0;
        // three construction rays, all meeting at B′ (or at its backward extension)
        function ray(x1,y1,x2,y2,cls){ return '<line class="'+cls+'" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>'; }
        function beyond(x1,y1,x2,y2,k){ return [x1+(x2-x1)*k, y1+(y2-y1)*k]; }
        // 1 — parallel in, through F′ out
        s+=ray(Bx,By,CX,By,'iwopt-r1');
        var e1=real?beyond(CX,By,Ix,Iy,1.28):beyond(CX,By,Ix,Iy,-0.55);
        s+=ray(CX,By,e1[0],e1[1],'iwopt-r1');
        if(!real)s+=ray(CX,By,Ix,Iy,'iwopt-virt');
        // 2 — straight through the centre
        var e2=real?beyond(Bx,By,Ix,Iy,1.18):beyond(CX,AX,Ix,Iy,-0.75);
        s+=ray(Bx,By,CX,AX,'iwopt-r2');
        s+=real?ray(CX,AX,e2[0],e2[1],'iwopt-r2'):ray(CX,AX,e2[0],e2[1],'iwopt-r2')+ray(CX,AX,Ix,Iy,'iwopt-virt');
        // 3 — through F in, parallel out
        s+=ray(Bx,By,CX,Iy,'iwopt-r3')+ray(CX,Iy,W-14,Iy,'iwopt-r3');
        if(!real)s+=ray(CX,Iy,Ix,Iy,'iwopt-virt');
        s+='<line class="iwopt-img'+(real?'':' virt')+'" x1="'+Ix.toFixed(1)+'" y1="'+AX+'" x2="'+Ix.toFixed(1)+'" y2="'+Iy.toFixed(1)+'"/>'+
          '<path class="iwopt-ih'+(real?'':' virt')+'" d="M'+(Ix-5).toFixed(1)+' '+(Iy+(hImg>0?8:-8)).toFixed(1)+' L'+Ix.toFixed(1)+' '+Iy.toFixed(1)+
          ' L'+(Ix+5).toFixed(1)+' '+(Iy+(hImg>0?8:-8)).toFixed(1)+'"/>'+
          '<text class="iwopt-t2" x="'+(Ix+9).toFixed(1)+'" y="'+(Iy+(hImg>0?-4:14)).toFixed(1)+'">B′</text>'+
          '<text class="iwopt-t" x="'+(Ix+9).toFixed(1)+'" y="'+(AX+18)+'">A′</text>';
      } else {
        s+='<line class="iwopt-r1" x1="'+Bx.toFixed(1)+'" y1="'+By.toFixed(1)+'" x2="'+CX+'" y2="'+By.toFixed(1)+'"/>'+
          '<line class="iwopt-r1" x1="'+CX+'" y1="'+By.toFixed(1)+'" x2="'+(W-14)+'" y2="'+AX+'"/>';
      }
      s+='</svg>';
      wrap.innerHTML=s;
      var nat;
      if(atInf)nat='<b>Image à l’infini</b> l’objet est exactement au foyer : les rayons émergent parallèles.';
      else nat='<span><b>OA′</b>'+iwFmt(OAp,2)+' cm</span>'+
        '<span><b>γ</b>'+iwFmt(gam,3)+'</span>'+
        '<span><b>A′B′</b>'+iwFmt(Math.abs(hImg),2)+' cm</span>'+
        '<span class="iwopt-nat">'+(OAp>0?'réelle':'virtuelle')+' · '+(gam<0?'renversée':'droite')+' · '+
        (Math.abs(gam)>1.001?'agrandie':(Math.abs(gam)<0.999?'réduite':'même taille'))+'</span>';
      read.innerHTML=nat;
      read.className='iwopt-read'+(atInf?' inf':'');
      if(dv)dv.textContent=iwFmt(d,1)+' cm  ·  f′ = '+(diverging?'−':'')+f0+' cm';
    }
    if(rng)rng.addEventListener('input',function(){ render(parseFloat(rng.value)); });
    render(d0);
  };

  /* ── nuclear equation, with A and Z conservation checked ── */
  R.nuclear=function(box,c){
    box.className='iw iw-card iw-nuc';
    var L=(c.left||[]).filter(function(s){ return s&&s.el; });
    var Rr=(c.right||[]).filter(function(s){ return s&&s.el; });
    if(!L.length||!Rr.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Donne au moins un noyau de chaque côté.</div>'; return; }
    var quiz=!!c.quiz;
    function nuc(s,side,i){
      var A=quiz&&s.hide?'<input class="iwnuc-in" data-q="'+side+'-'+i+'-A" inputmode="numeric" aria-label="Nombre de masse">':esc(s.A);
      var Z=quiz&&s.hide?'<input class="iwnuc-in" data-q="'+side+'-'+i+'-Z" inputmode="numeric" aria-label="Numéro atomique">':esc(s.Z);
      return '<span class="iwnuc-sp"><span class="iwnuc-az"><i>'+A+'</i><b>'+Z+'</b></span>'+
        '<span class="iwnuc-el">'+esc(s.el)+'</span></span>'; }
    var sumA=function(a){ return a.reduce(function(t,s){ var v=iwNum(s.A); return t+(v==null?0:v); },0); };
    var sumZ=function(a){ return a.reduce(function(t,s){ var v=iwNum(s.Z); return t+(v==null?0:v); },0); };
    var aL=sumA(L), aR=sumA(Rr), zL=sumZ(L), zR=sumZ(Rr);
    var kind='';
    Rr.forEach(function(s){ var A=iwNum(s.A), Z=iwNum(s.Z);
      if(A===4&&Z===2)kind='désintégration α';
      else if(A===0&&Z===-1)kind='désintégration β⁻';
      else if(A===0&&Z===1)kind='désintégration β⁺';
      else if(A===0&&Z===0&&!kind)kind='émission γ'; });
    if(!kind&&L.length>1)kind='réaction nucléaire provoquée';
    var ok=(aL===aR&&zL===zR);
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwnuc-eq">'+L.map(function(s,i){ return nuc(s,'l',i); }).join('<span class="iwnuc-op">+</span>')+
      '<span class="iwnuc-arrow">→</span>'+
      Rr.map(function(s,i){ return nuc(s,'r',i); }).join('<span class="iwnuc-op">+</span>')+'</div>'+
      '<div class="iwnuc-bal" data-bal></div>'+
      (quiz?'<div class="iwnuc-actions"><button type="button" class="iw-btn" data-nu="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-nu="show">'+T('show','Montrer')+'</button></div>':'')+
      (c.note?'<div class="iwnuc-note">'+esc(c.note)+'</div>':'');
    var bal=box.querySelector('[data-bal]');
    function report(){
      bal.innerHTML='<span class="iwnuc-h">Conservation</span>'+
        '<span class="'+(aL===aR?'ok':'no')+'"><b>A</b>'+aL+' / '+aR+'</span>'+
        '<span class="'+(zL===zR?'ok':'no')+'"><b>Z</b>'+zL+' / '+zR+'</span>'+
        (ok?'<span class="iwnuc-ok">✓ Lois de Soddy respectées'+(kind?' — '+esc(kind):'')+'</span>'
           :'<span class="iwnuc-no">L’équation n’est pas équilibrée</span>'); }
    if(!quiz)report(); else {
      box.querySelector('[data-nu="check"]').addEventListener('click',function(){
        var good=0,tot=0;
        box.querySelectorAll('.iwnuc-in').forEach(function(inp){ tot++;
          var p=inp.getAttribute('data-q').split('-'), src=(p[0]==='l'?L:Rr)[+p[1]];
          var want=iwNum(p[2]==='A'?src.A:src.Z), got=iwNum(inp.value);
          var hit=(got!=null&&want!=null&&got===want);
          inp.classList.toggle('ok',hit); inp.classList.toggle('bad',!hit); if(hit)good++; });
        bal.innerHTML='<span class="'+(good===tot?'iwnuc-ok':'iwnuc-no')+'">'+good+' / '+tot+' correct'+(good>1?'s':'')+
          (good===tot&&kind?' — '+esc(kind):'')+'</span>'; });
      box.querySelector('[data-nu="show"]').addEventListener('click',function(){
        box.querySelectorAll('.iwnuc-in').forEach(function(inp){
          var p=inp.getAttribute('data-q').split('-'), src=(p[0]==='l'?L:Rr)[+p[1]];
          inp.value=(p[2]==='A'?src.A:src.Z); inp.classList.add('ok'); inp.classList.remove('bad'); });
        report(); }); }
  };

  /* ── flow diagram: boxes on levels, joined by labelled arrows ── */
  R.flow=function(box,c){
    box.className='iw iw-card iw-flow';
    var nodes=(c.fnodes||[]).filter(function(n){ return n&&(n.label||n.id); });
    if(!nodes.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une case.</div>'; return; }
    var P=pal(), by={}, lv={}, order=[];
    nodes.forEach(function(n,i){ if(!n.id)n.id='f'+i; by[n.id]=n;
      var l=parseInt(n.level,10)||1; (lv[l]=lv[l]||[]).push(n); if(order.indexOf(l)<0)order.push(l); });
    order.sort(function(a,b){ return a-b; });
    var COLS=Math.max.apply(null,order.map(function(l){ return lv[l].length; }));
    var W=760, ROW=132, PAD=18, H=PAD*2+order.length*ROW-40;
    var pos={};
    order.forEach(function(l,li){ var row=lv[l], each=W/row.length;
      row.forEach(function(n,ni){ pos[n.id]={x:each*ni+each/2, y:PAD+li*ROW+34}; }); });
    var links=(c.links||[]).filter(function(k){ return k&&by[k.from]&&by[k.to]; });
    var s='<svg class="iwflow-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-hidden="true">'+
      '<defs><marker id="iwflow-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'+
      '<path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>';
    links.forEach(function(k){ var A=pos[k.from], B=pos[k.to]; if(!A||!B)return;
      var dy=B.y-A.y, sameRow=Math.abs(dy)<4;
      var y1=A.y+(sameRow?0:(dy>0?26:-26)), y2=B.y+(sameRow?0:(dy>0?-30:30));
      var mx=(A.x+B.x)/2, my=(y1+y2)/2+(sameRow?-26:0);
      s+='<path class="iwflow-l'+(k.dash?' dash':'')+'" d="M'+A.x.toFixed(1)+' '+y1.toFixed(1)+
        ' Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+B.x.toFixed(1)+' '+y2.toFixed(1)+
        '" fill="none" marker-end="url(#iwflow-ah)"/>';
      if(k.label)s+='<text class="iwflow-lt" x="'+mx.toFixed(1)+'" y="'+(my-5).toFixed(1)+'" text-anchor="middle">'+esc(k.label)+'</text>'; });
    s+='</svg>';
    var html='<div class="iwflow-stage" style="aspect-ratio:'+W+'/'+H+'">'+s;
    nodes.forEach(function(n,i){ var p=pos[n.id];
      html+='<button type="button" class="iwflow-n s-'+esc(n.shape||'box')+(n.note?' has':'')+'" data-n="'+esc(n.id)+
        '" style="left:'+(p.x/W*100).toFixed(2)+'%;top:'+(p.y/H*100).toFixed(2)+'%;--fc:'+esc(n.color||P[i%P.length])+'">'+
        esc(n.label||n.id)+'</button>'; });
    html+='</div><div class="iwflow-det" data-det></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwflow-intro">'+esc(c.intro)+'</div>':'')+html+
      (c.note?'<div class="iwflow-note">'+esc(c.note)+'</div>':'');
    /* The row is divided evenly, which is right until the column is narrow
       enough that the boxes are wider than their share and start covering each
       other. Measure, then spread the row out and give it the height its
       tallest box actually needs. */
    var stage=box.querySelector('.iwflow-stage');
    function spread(){
      var sw=stage.clientWidth; if(!sw)return;
      var rowsY=[], maxH=0;
      order.forEach(function(l,li){
        var row=lv[l].map(function(n){
          var el2=stage.querySelector('[data-n="'+CSS.escape(n.id)+'"]');
          return el2?{el:el2,id:n.id,w:el2.offsetWidth,h:el2.offsetHeight}:null; }).filter(Boolean);
        if(!row.length)return;
        var each=sw/row.length, x=0, k;
        row.forEach(function(it,ni){ it.x=each*ni+each/2; });
        // push apart left to right, then back, so the row stays centred
        for(k=0;k<24;k++){ var moved=false;
          for(var i2=0;i2<row.length-1;i2++){
            var A=row[i2], B=row[i2+1];
            var need=(A.w+B.w)/2+8-(B.x-A.x);
            if(need>0){ A.x-=need/2; B.x+=need/2; moved=true; } }
          if(!moved)break; }
        row.forEach(function(it){ it.x=Math.max(it.w/2+1,Math.min(sw-it.w/2-1,it.x));
          maxH=Math.max(maxH,it.h); });
        rowsY.push(row); });
      var rowH=Math.max(ROW,maxH+56), top=PAD+18, hh=top*2+rowsY.length*rowH-56;
      rowsY.forEach(function(row,li){ row.forEach(function(it){
        it.y=top+li*rowH;
        it.el.style.left=it.x.toFixed(1)+'px';
        it.el.style.top=it.y.toFixed(1)+'px'; }); });
      stage.style.aspectRatio='auto'; stage.style.height=Math.round(hh)+'px';
      // redraw the arrows between where the boxes ended up
      var at={}; rowsY.forEach(function(r){ r.forEach(function(it){ at[it.id]={x:it.x,y:it.y,h:it.h}; }); });
      var d='';
      links.forEach(function(k2){ var A=at[k2.from], B=at[k2.to]; if(!A||!B)return;
        var dy=B.y-A.y, same=Math.abs(dy)<4;
        var y1=A.y+(same?0:(dy>0?A.h/2+2:-A.h/2-2)), y2=B.y+(same?0:(dy>0?-B.h/2-8:B.h/2+8));
        var mx=(A.x+B.x)/2, my=(y1+y2)/2+(same?-26:0);
        d+='<path class="iwflow-l'+(k2.dash?' dash':'')+'" d="M'+A.x.toFixed(1)+' '+y1.toFixed(1)+
          ' Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+B.x.toFixed(1)+' '+y2.toFixed(1)+
          '" fill="none" marker-end="url(#iwflow-ah)"/>';
        if(k2.label)d+='<text class="iwflow-lt" x="'+mx.toFixed(1)+'" y="'+(my-5).toFixed(1)+
          '" text-anchor="middle">'+esc(k2.label)+'</text>'; });
      var svg=stage.querySelector('.iwflow-svg');
      svg.setAttribute('viewBox','0 0 '+sw+' '+Math.round(hh));
      svg.innerHTML=svg.innerHTML.split('</defs>')[0]+'</defs>'+d;
    }
    function spreadSafe(){ try{ spread(); }catch(e){} }
    iwWatch(stage,spreadSafe);


    var det=box.querySelector('[data-det]');
    box.querySelectorAll('[data-n]').forEach(function(b){ b.addEventListener('click',function(){
      var n=by[b.getAttribute('data-n')];
      box.querySelectorAll('[data-n]').forEach(function(x){ x.classList.toggle('on',x===b); });
      if(!n||!n.note)return;
      det.innerHTML='<b>'+esc(n.label||'')+'</b>'+esc(n.note); }); });
  };

  /* ── label the diagram: drag the names onto the numbered spots ── */
  R.labelling=function(box,c){
    box.className='iw iw-card iw-lbl';
    var T=(c.targets||[]).filter(function(t){ return t&&t.label; });
    if(!T.length){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Ajoute au moins une étiquette à placer.</div>'; return; }
    // a fixed rotation, so every reader gets the same puzzle
    var ord=T.map(function(_,i){ return i; });
    if(c.shuffle!==false&&ord.length>2){ var k=Math.floor(ord.length/2)+1;
      ord=ord.slice(k).concat(ord.slice(0,k)); var t0=ord[0]; ord[0]=ord[ord.length-1]; ord[ord.length-1]=t0; }
    var placed=T.map(function(){ return null; }), sel=null;
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwlb-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwlb-stage'+(c.image?'':' empty')+'">'+
      (c.image?'<img class="iwlb-img" src="'+esc(c.image)+'" alt="'+esc(c.title||'')+'">':'')+
      T.map(function(t,i){ return '<button type="button" class="iwlb-t" data-t="'+i+'" style="left:'+
        (parseFloat(t.x)||50)+'%;top:'+(parseFloat(t.y)||50)+'%"><i>'+(i+1)+'</i><span></span></button>'; }).join('')+
      '</div>'+
      '<div class="iwlb-pool" data-pool>'+ord.map(function(i){
        return '<button type="button" class="iwlb-c" draggable="true" data-c="'+i+'">'+esc(T[i].label)+'</button>'; }).join('')+'</div>'+
      '<div class="iwlb-actions"><button type="button" class="iw-btn" data-l="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-l="show">Corrigé</button>'+
      '<button type="button" class="iwm-qbtn" data-l="reset">'+T('reset','Recommencer')+'</button>'+
      '<span class="iwlb-score"></span></div>'+
      (c.note?'<div class="iwlb-note">'+esc(c.note)+'</div>':'');
    var pool=box.querySelector('[data-pool]'), score=box.querySelector('.iwlb-score');
    function chip(i){ return box.querySelector('.iwlb-c[data-c="'+i+'"]'); }
    function sync(){
      T.forEach(function(_,ti){ var b=box.querySelector('.iwlb-t[data-t="'+ti+'"]');
        var ci=placed[ti]; b.querySelector('span').textContent=ci==null?'':T[ci].label;
        b.classList.toggle('full',ci!=null); b.classList.remove('ok','no'); });
      T.forEach(function(_,ci){ var ch=chip(ci); if(!ch)return;
        ch.hidden=placed.indexOf(ci)>=0; ch.classList.toggle('sel',sel===ci); });
      score.textContent=''; score.className='iwlb-score'; }
    function put(ti,ci){ var was=placed.indexOf(ci); if(was>=0)placed[was]=null;
      placed[ti]=ci; sel=null; sync(); }
    box.querySelectorAll('.iwlb-c').forEach(function(ch){
      ch.addEventListener('click',function(){ var ci=+ch.getAttribute('data-c'); sel=(sel===ci?null:ci); sync(); });
      ch.addEventListener('dragstart',function(e){ sel=+ch.getAttribute('data-c');
        try{ e.dataTransfer.setData('text/plain',String(sel)); }catch(err){} }); });
    box.querySelectorAll('.iwlb-t').forEach(function(b){
      var ti=+b.getAttribute('data-t');
      b.addEventListener('click',function(){ if(sel!=null){ put(ti,sel); return; }
        if(placed[ti]!=null){ placed[ti]=null; sync(); } });
      b.addEventListener('dragover',function(e){ e.preventDefault(); b.classList.add('over'); });
      b.addEventListener('dragleave',function(){ b.classList.remove('over'); });
      b.addEventListener('drop',function(e){ e.preventDefault(); b.classList.remove('over');
        var ci=sel; try{ var d=e.dataTransfer.getData('text/plain'); if(d!=='')ci=+d; }catch(err){}
        if(ci!=null)put(ti,ci); }); });
    function check(){ var n=0;
      T.forEach(function(_,ti){ var b=box.querySelector('.iwlb-t[data-t="'+ti+'"]');
        var ok=placed[ti]===ti; b.classList.toggle('ok',ok); b.classList.toggle('no',!ok); if(ok)n++; });
      score.textContent=n+' / '+T.length+' bien placée'+(n>1?'s':'');
      score.className='iwlb-score '+(n===T.length?'ok':'no'); }
    function show(){ placed=T.map(function(_,i){ return i; }); sel=null; sync();
      T.forEach(function(_,ti){ box.querySelector('.iwlb-t[data-t="'+ti+'"]').classList.add('ok'); });
      score.textContent='Corrigé'; score.className='iwlb-score ok'; }
    box.querySelector('[data-l="check"]').addEventListener('click',check);
    box.querySelector('[data-l="show"]').addEventListener('click',show);
    box.querySelector('[data-l="reset"]').addEventListener('click',function(){
      placed=T.map(function(){ return null; }); sel=null; sync(); });
    iwOnAnswers(function(on){ if(on)show(); });
    sync();
  };

  /* ── titration curve: finds the equivalence point from the data ── */
  R.titration=function(box,c){
    var pts=[];
    String(c.data||'').split(String.fromCharCode(10)).forEach(function(line){
      var m=line.split(new RegExp('[;,	 ]+')).filter(function(x){ return x!==''; });
      if(m.length<2)return; var x=iwNum(m[0]), y=iwNum(m[1]);
      if(x!=null&&y!=null)pts.push([x,y]); });
    pts.sort(function(a,b){ return a[0]-b[0]; });
    box.className='iw iw-card iw-titr';
    if(pts.length<4){ box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+'<div class="iw-err">Colle au moins quatre couples « volume ; pH », un par ligne.</div>'; return; }
    // dpH/dV by central differences, then a parabola through the three points
    // around the maximum — the standard derivative method, done properly
    var der=[];
    for(var i=1;i<pts.length-1;i++){ var dv=pts[i+1][0]-pts[i-1][0];
      der.push([ (pts[i-1][0]+pts[i+1][0])/2, dv?(pts[i+1][1]-pts[i-1][1])/dv:0 ]); }
    var bi=0; der.forEach(function(d,k){ if(d[1]>der[bi][1])bi=k; });
    var VE=der.length?der[bi][0]:null, DMAX=der.length?der[bi][1]:0;
    if(bi>0&&bi<der.length-1){
      var y0=der[bi-1][1], y1=der[bi][1], y2=der[bi+1][1], den=(y0-2*y1+y2);
      if(Math.abs(den)>1e-12){ var off=0.5*(y0-y2)/den;
        if(Math.abs(off)<=1)VE=der[bi][0]+off*((der[bi+1][0]-der[bi-1][0])/2); } }
    // pH at equivalence, read off the curve by linear interpolation
    var pHE=null;
    for(var j=0;j<pts.length-1;j++){ if(VE>=pts[j][0]&&VE<=pts[j+1][0]){
      var t=(VE-pts[j][0])/((pts[j+1][0]-pts[j][0])||1);
      pHE=pts[j][1]+t*(pts[j+1][1]-pts[j][1]); break; } }
    var W=680,H=380,L=54,Rr=54,Tp=18,B=48;
    var xs=pts.map(function(p){return p[0];}), ys=pts.map(function(p){return p[1];});
    var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    var y0b=Math.min(0,Math.min.apply(null,ys)), y1b=Math.max.apply(null,ys)*1.06;
    if(x1-x0<1e-9)x1=x0+1; if(y1b-y0b<1e-9)y1b=y0b+1;
    var X=function(v){ return L+(v-x0)/(x1-x0)*(W-L-Rr); }, Y=function(v){ return H-B-(v-y0b)/(y1b-y0b)*(H-B-Tp); };
    var dmaxAll=Math.max.apply(null,der.map(function(d){return Math.abs(d[1]);}).concat([1e-9]));
    var YD=function(v){ return H-B-(v/dmaxAll)*(H-B-Tp)*0.92; };
    var col=c.color||cvar('--accent','#8c2f2a'), dcol=cvar('--teal','#5fa39b');
    function ticks(lo,hi){ var span=hi-lo, p=Math.pow(10,Math.floor(Math.log(span)/Math.LN10)), s=p;
      if(span/s>8)s=p*2; if(span/s>8)s=p*5; if(span/s<3)s=p/2;
      var out=[]; for(var v=Math.ceil(lo/s)*s; v<=hi+1e-9; v+=s)out.push(Math.round(v*1e6)/1e6); return out; }
    var s='<svg class="iwtt-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
    ticks(y0b,y1b).forEach(function(v){ s+='<line class="iwtt-grid" x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-Rr)+'" y2="'+Y(v).toFixed(1)+'"/>'+
      '<text class="iwtt-n" x="'+(L-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+v+'</text>'; });
    ticks(x0,x1).forEach(function(v){ s+='<text class="iwtt-n" x="'+X(v).toFixed(1)+'" y="'+(H-B+18)+'" text-anchor="middle">'+v+'</text>'; });
    if(c.showDerivative!==false&&der.length>1){
      s+='<polyline class="iwtt-der" points="'+der.map(function(d){ return X(d[0]).toFixed(1)+','+YD(d[1]).toFixed(1); }).join(' ')+'" fill="none" stroke="'+esc(dcol)+'"/>'; }
    if(VE!=null){ s+='<line class="iwtt-ve" x1="'+X(VE).toFixed(1)+'" y1="'+Tp+'" x2="'+X(VE).toFixed(1)+'" y2="'+(H-B)+'"/>';
      if(pHE!=null)s+='<line class="iwtt-ve" x1="'+L+'" y1="'+Y(pHE).toFixed(1)+'" x2="'+X(VE).toFixed(1)+'" y2="'+Y(pHE).toFixed(1)+'"/>'+
        '<circle class="iwtt-e" cx="'+X(VE).toFixed(1)+'" cy="'+Y(pHE).toFixed(1)+'" r="5.5"/>'+
        '<text class="iwtt-el" x="'+(X(VE)+9).toFixed(1)+'" y="'+(Y(pHE)-9).toFixed(1)+'">E</text>'; }
    s+='<polyline class="iwtt-curve" points="'+pts.map(function(p){ return X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1); }).join(' ')+'" fill="none" stroke="'+esc(col)+'"/>';
    pts.forEach(function(p){ s+='<circle class="iwtt-p" cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="2.9" fill="'+esc(col)+'"><title>'+p[0]+' mL · pH '+p[1]+'</title></circle>'; });
    s+='<line class="iwtt-ax" x1="'+L+'" y1="'+Tp+'" x2="'+L+'" y2="'+(H-B)+'"/><line class="iwtt-ax" x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-Rr)+'" y2="'+(H-B)+'"/>';
    s+='<text class="iwtt-al" x="'+((L+W-Rr)/2)+'" y="'+(H-10)+'" text-anchor="middle">'+esc(c.xLabel||'V versé (mL)')+'</text>'+
       '<text class="iwtt-al" transform="translate(14,'+((Tp+H-B)/2)+') rotate(-90)" text-anchor="middle">'+esc(c.yLabel||'pH')+'</text></svg>';
    var cb=iwNum(c.cb), va=iwNum(c.va), ca=(cb!=null&&va!=null&&va>0&&VE!=null)?cb*VE/va:null;
    var read='<div class="iwtt-read">'+
      (VE!=null?'<span><b>V<sub>E</sub></b>'+iwFmt(VE,2)+' mL</span>':'')+
      (pHE!=null?'<span><b>pH<sub>E</sub></b>'+iwFmt(pHE,2)+'</span>':'')+
      (ca!=null?'<span><b>C<sub>A</sub></b>'+iwFmt(ca,4)+' mol/L</span>':'')+
      '<span><b>(dpH/dV)<sub>max</sub></b>'+iwFmt(DMAX,2)+'</span></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwtt-wrap">'+s+'</div>'+read+
      '<div class="iwtt-key"><span class="iwtt-kc" style="background:'+esc(col)+'"></span>pH mesuré'+
      (c.showDerivative!==false?'<span class="iwtt-kd" style="background:'+esc(dcol)+'"></span>dpH/dV (courbe dérivée)':'')+
      '<span class="iwtt-kv"></span>Équivalence</div>'+
      (ca!=null?'<div class="iwtt-calc">C<sub>A</sub> = C<sub>B</sub> × V<sub>E</sub> / V<sub>A</sub> = '+iwFmt(cb,4)+' × '+iwFmt(VE,2)+' / '+iwFmt(va,1)+' = <b>'+iwFmt(ca,4)+' mol/L</b></div>':'')+
      (c.note?'<div class="iwtt-note">'+esc(c.note)+'</div>':'');
  };

  /* ── periodic trends: pick two elements, compare one property ── */
  var IWTR={
    1:[2.20,53,1312],2:[null,31,2372],3:[0.98,167,520],4:[1.57,112,899],5:[2.04,87,801],
    6:[2.55,67,1086],7:[3.04,56,1402],8:[3.44,48,1314],9:[3.98,42,1681],10:[null,38,2081],
    11:[0.93,190,496],12:[1.31,145,738],13:[1.61,118,578],14:[1.90,111,787],15:[2.19,98,1012],
    16:[2.58,88,1000],17:[3.16,79,1251],18:[null,71,1521],19:[0.82,243,419],20:[1.00,194,590],
    21:[1.36,184,633],22:[1.54,176,659],23:[1.63,171,651],24:[1.66,166,653],25:[1.55,161,717],
    26:[1.83,156,763],27:[1.88,152,760],28:[1.91,149,737],29:[1.90,145,745],30:[1.65,142,906],
    31:[1.81,136,579],32:[2.01,125,762],33:[2.18,114,947],34:[2.55,103,941],35:[2.96,94,1140],
    36:[3.00,88,1351],37:[0.82,265,403],38:[0.95,219,550],47:[1.93,165,731],53:[2.66,115,1008],
    54:[2.60,108,1170],55:[0.79,298,376],56:[0.89,253,503],79:[2.54,174,890],82:[2.33,154,716]};
  var IWTRMETA={en:{i:0,label:'Électronégativité',unit:'',dec:2,
      rule:'Elle augmente de gauche à droite dans une période et diminue de haut en bas dans une colonne : le fluor est le plus électronégatif des éléments.'},
    r:{i:1,label:'Rayon atomique',unit:'pm',dec:0,
      rule:'Il diminue de gauche à droite (la charge du noyau attire davantage les électrons) et augmente de haut en bas (une couche de plus).'},
    ei:{i:2,label:'Énergie de première ionisation',unit:'kJ/mol',dec:0,
      rule:'Elle augmente de gauche à droite et diminue de haut en bas : arracher un électron à un alcalin coûte peu, à un gaz noble énormément.'}};
  R.trends=function(box,c){
    box.className='iw iw-card iw-trd';
    var prop=IWTRMETA[c.property]?c.property:'en', M=IWTRMETA[prop];
    var byS={}; IWPT.forEach(function(e){ byS[e[1]]=e; });
    var pick=[c.a,c.b].filter(function(x){ return x&&byS[x]; });
    var grid='';
    IWPT.forEach(function(e){ var Z=e[0], sym=e[1], g=e[5], p=e[6];
      if(!g||!p||p>7)return;
      var has=IWTR[Z]&&IWTR[Z][M.i]!=null;
      grid+='<button type="button" class="iwtrd-c'+(has?'':' off')+' f-'+esc(e[4])+'" '+(has?'':'disabled ')+
        'data-s="'+esc(sym)+'" style="grid-column:'+g+';grid-row:'+p+'" title="'+esc(e[2])+'">'+esc(sym)+'</button>'; });
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwtrd-bar"><label>Propriété</label><select class="iwtrd-sel">'+
      Object.keys(IWTRMETA).map(function(k){ return '<option value="'+k+'"'+(k===prop?' selected':'')+'>'+esc(IWTRMETA[k].label)+'</option>'; }).join('')+
      '</select><span class="iwtrd-hint">Cliquez deux éléments pour les comparer</span></div>'+
      '<div class="iwtrd-grid">'+grid+'</div>'+
      '<div class="iwtrd-out" data-out></div>'+
      '<div class="iwtrd-rule" data-rule></div>'+
      (c.note?'<div class="iwtrd-note">'+esc(c.note)+'</div>':'');
    var out=box.querySelector('[data-out]'), rule=box.querySelector('[data-rule]'), sel=box.querySelector('.iwtrd-sel');
    function val(sym){ var e=byS[sym]; return e&&IWTR[e[0]]?IWTR[e[0]][IWTRMETA[prop].i]:null; }
    function render(){
      var MM=IWTRMETA[prop]; rule.textContent=MM.rule;
      box.querySelectorAll('.iwtrd-c').forEach(function(b){
        var s2=b.getAttribute('data-s'), e=byS[s2];
        var has=e&&IWTR[e[0]]&&IWTR[e[0]][MM.i]!=null;
        b.disabled=!has; b.classList.toggle('off',!has);
        b.classList.toggle('on',pick.indexOf(s2)>=0); });
      if(pick.length<1){ out.innerHTML='<div class="iwtrd-empty">Aucun élément sélectionné.</div>'; return; }
      var vs=pick.map(val), mx=Math.max.apply(null,vs.concat([0]))||1;
      var rows=pick.map(function(s2,k){ var e=byS[s2], v=vs[k];
        return '<div class="iwtrd-row"><b>'+esc(s2)+'</b><i>'+esc(e[2])+'</i>'+
          '<div class="iwtrd-track"><span style="width:'+(v/mx*100).toFixed(1)+'%"></span></div>'+
          '<em>'+iwFmt(v,MM.dec)+(MM.unit?' '+MM.unit:'')+'</em></div>'; }).join('');
      var verdict='';
      if(pick.length===2&&vs[0]!=null&&vs[1]!=null){
        var A=byS[pick[0]], B=byS[pick[1]], hi=vs[0]>=vs[1]?0:1, lo=1-hi;
        var same=A[6]===B[6]?'la même période':(A[5]===B[5]?'la même colonne':null);
        var ratio=vs[lo]?(vs[hi]/vs[lo]):null;
        verdict='<div class="iwtrd-verdict"><b>'+esc(pick[hi])+'</b> l’emporte sur <b>'+esc(pick[lo])+'</b>'+
          (ratio&&ratio>1.02?' — '+iwFmt(ratio,2)+' fois plus':'')+
          (same?', et tous deux sont sur '+same+'.':'.')+'</div>'; }
      out.innerHTML='<div class="iwtrd-rows">'+rows+'</div>'+verdict; }
    box.querySelectorAll('.iwtrd-c').forEach(function(b){ b.addEventListener('click',function(){
      var s2=b.getAttribute('data-s'), at=pick.indexOf(s2);
      if(at>=0)pick.splice(at,1); else { pick.push(s2); if(pick.length>2)pick.shift(); }
      render(); }); });
    sel.addEventListener('change',function(){ prop=sel.value; render(); });
    render();
  };

  /* ── inequality: the reader builds the solution set on the line ── */
  R.inequality=function(box,c){
    box.className='iw iw-card iw-ineq';
    var lo=iwNum(c.min), hi=iwNum(c.max), step=iwNum(c.step);
    if(lo==null)lo=-10; if(hi==null)hi=10; if(hi<=lo)hi=lo+20; if(!(step>0))step=1;
    var sol=c.solution||{};
    // three states per bound: 0 included ● · 1 excluded ○ · 2 infinite →
    function stateOf(v,open){ if(v==null||v==='')return 2;
      var s2=String(v).toLowerCase(); if(s2.indexOf('inf')>=0||s2.indexOf('∞')>=0)return 2;
      return open?1:0; }
    var want={a:iwNum(sol.from), b:iwNum(sol.to), sa:stateOf(sol.from,sol.fromOpen), sb:stateOf(sol.to,sol.toOpen)};
    var cur={a:lo+Math.round((hi-lo)/4/step)*step, b:lo+Math.round(3*(hi-lo)/4/step)*step, sa:0, sb:0};
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.statement?'<div class="iwiq-stat">'+esc(c.statement)+'</div>':'')+
      (c.intro?'<div class="iwiq-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwiq-wrap"></div>'+
      '<div class="iwiq-read" data-read></div>'+
      '<div class="iwiq-actions"><button type="button" class="iw-btn" data-q="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button>'+
      '<span class="iwiq-score"></span></div>'+
      '<div class="iwiq-tip">Faites glisser les deux poignées ; cliquez une poignée pour passer de <b>●</b> incluse à <b>○</b> exclue puis à <b>→</b> infinie.</div>'+
      (c.note?'<div class="iwiq-note">'+esc(c.note)+'</div>':'');
    var wrap=box.querySelector('.iwiq-wrap'), read=box.querySelector('[data-read]'), score=box.querySelector('.iwiq-score');
    var W=660,H=104,PAD=30,AX=58;
    var X=function(v){ return PAD+(v-lo)/(hi-lo)*(W-PAD*2); };
    var invX=function(px){ var v=lo+(px-PAD)/(W-PAD*2)*(hi-lo); return Math.max(lo,Math.min(hi,Math.round(v/step)*step)); };
    function txt(){
      var L=cur.sa===2?']−∞':((cur.sa===1?']':'[')+iwFmt(cur.a,2));
      var Rz=cur.sb===2?'+∞[':(iwFmt(cur.b,2)+(cur.sb===1?'[':']'));
      return L+' ; '+Rz; }
    function draw(){
      var a=cur.sa===2?lo:cur.a, b=cur.sb===2?hi:cur.b;
      if(a>b){ var t=a; a=b; b=t; }
      var s='<svg class="iwiq-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
      s+='<line class="iwiq-axis" x1="'+PAD+'" y1="'+AX+'" x2="'+(W-PAD)+'" y2="'+AX+'"/>'+
        '<path class="iwiq-arrow" d="M'+(W-PAD)+' '+AX+' l-9 -4.5 v9 Z"/><path class="iwiq-arrow" d="M'+PAD+' '+AX+' l9 -4.5 v9 Z"/>';
      for(var v=Math.ceil(lo/step)*step; v<=hi+1e-9; v+=step){ var vv=Math.round(v*1e6)/1e6;
        s+='<line class="iwiq-tick" x1="'+X(vv).toFixed(1)+'" y1="'+(AX-5)+'" x2="'+X(vv).toFixed(1)+'" y2="'+(AX+5)+'"/>'+
          '<text class="iwiq-num" x="'+X(vv).toFixed(1)+'" y="'+(AX+21)+'" text-anchor="middle">'+vv+'</text>'; }
      s+='<line class="iwiq-band" x1="'+X(a).toFixed(1)+'" y1="'+(AX-16)+'" x2="'+X(b).toFixed(1)+'" y2="'+(AX-16)+'"/>';
      [['a',cur.sa,cur.a],['b',cur.sb,cur.b]].forEach(function(p){
        var k=p[0], st=p[1], v=(st===2?(k==='a'?lo:hi):p[2]), x=X(v);
        if(st===2)s+='<path class="iwiq-inf" data-h="'+k+'" d="M'+(x+(k==='a'?12:-12))+' '+(AX-16)+' L'+x+' '+(AX-16)+
          ' l'+(k==='a'?10:-10)+' -5 v10 Z"/>';
        else s+='<circle class="iwiq-h'+(st===1?' open':'')+'" data-h="'+k+'" cx="'+x.toFixed(1)+'" cy="'+(AX-16)+'" r="8"/>'; });
      s+='</svg>'; wrap.innerHTML=s;
      read.innerHTML='<span>Votre réponse</span><b>S = '+esc(txt())+'</b>';
      wrap.querySelectorAll('[data-h]').forEach(function(el2){
        var k=el2.getAttribute('data-h');
        el2.addEventListener('click',function(e){ e.stopPropagation();
          cur[k==='a'?'sa':'sb']=(cur[k==='a'?'sa':'sb']+1)%3; score.textContent=''; draw(); }); });
      var svg=wrap.querySelector('svg'); var drag=null;
      function toVal(ev){ var r=svg.getBoundingClientRect();
        return invX((ev.clientX-r.left)/r.width*W); }
      svg.addEventListener('pointerdown',function(e){
        var v=toVal(e); drag=(Math.abs(v-cur.a)<=Math.abs(v-cur.b))?'a':'b';
        cur[drag]=v; if(cur[drag==='a'?'sa':'sb']===2)cur[drag==='a'?'sa':'sb']=0;
        score.textContent=''; svg.setPointerCapture(e.pointerId); draw(); });
      svg.addEventListener('pointermove',function(e){ if(!drag)return; cur[drag]=toVal(e); draw(); });
      svg.addEventListener('pointerup',function(){ drag=null; });
    }
    function same(){
      if(cur.sa!==want.sa||cur.sb!==want.sb)return false;
      if(cur.sa!==2&&Math.abs(cur.a-(want.a==null?0:want.a))>1e-6)return false;
      if(cur.sb!==2&&Math.abs(cur.b-(want.b==null?0:want.b))>1e-6)return false;
      return true; }
    function show(){ cur.a=want.a==null?lo:want.a; cur.b=want.b==null?hi:want.b;
      cur.sa=want.sa; cur.sb=want.sb; draw();
      score.textContent='Corrigé'; score.className='iwiq-score ok'; }
    box.querySelector('[data-q="check"]').addEventListener('click',function(){
      var ok=same(); score.textContent=ok?'Exact':'Pas encore';
      score.className='iwiq-score '+(ok?'ok':'no'); });
    box.querySelector('[data-q="show"]').addEventListener('click',show);
    iwOnAnswers(function(on){ if(on)show(); });
    draw();
  };

  /* ── shared helpers for the language and primary batch ──
     iwList splits on newlines, commas and semicolons, which is how every
     "one per line, or comma-separated" field in the editor is meant to read.
     iwShuf is seeded from the content so a built book shuffles the same way
     every time it is opened — a pupil comparing with a neighbour sees the
     same pool, and a printed correction still matches the printed exercise. */
  var IWNL=String.fromCharCode(10), IWCR=String.fromCharCode(13);
  /* "x , y" per line — but a bare comma is a decimal mark in French, so the
     separator has to be whichever one the author actually used. Splitting on
     every comma turned "2,0e-5 , 0,18" into four fields and quietly produced a
     calibration line of slope zero. */
  /* Significant figures, French, with a real ×10ⁿ. A concentration of
     2,36 × 10⁻⁵ printed to four decimal places reads "0,0001", which tells the
     reader nothing — chemistry needs figures, not decimal places. */
  function iwSup(n){ var S='⁰¹²³⁴⁵⁶⁷⁸⁹', s=String(Math.abs(Math.round(n))),
    out=(n<0?String.fromCharCode(0x207B):''), i;
    for(i=0;i<s.length;i++)out+=S.charAt(+s.charAt(i));
    return out; }
  function iwFrSig(v,sig){
    if(v==null||!isFinite(v))return '—';
    sig=sig||3;
    var a=Math.abs(v);
    if(a===0)return '0';
    if(a<1e-3||a>=1e6){
      var e=Math.floor(Math.log(a)/Math.LN10);
      return iwFrNum(v/Math.pow(10,e),sig-1)+' × 10'+iwSup(e); }
    var d=Math.max(0,Math.min(9,sig-1-Math.floor(Math.log(a)/Math.LN10)));
    return iwFrNum(v,d); }
  /* A ResizeObserver fires while the browser is still reflowing, so measuring
     inside the callback reads sizes that are about to change — which is how a
     laid-out diagram came back crowded after the window was resized. Measure on
     the next tick, and again once things have settled. */
  function iwSettle(fn){ var a=0,b=0;
    return function(){ clearTimeout(a); clearTimeout(b);
      a=setTimeout(fn,0); b=setTimeout(fn,170); }; }
  /* Watch an element for anything that should make it measure itself again.
     A ResizeObserver on its own is not enough — it does not fire in every
     embedding, and a diagram laid out for a wide column then sits wrongly in a
     narrow one for ever. The window listener always fires, so the two together
     cover both "the column changed" and "the window changed". */
  function iwWatch(el,fn){
    var run=iwSettle(fn);
    try{ el.__iwro=new ResizeObserver(run); el.__iwro.observe(el); }catch(e){}
    // A widget hydrated inside a chapter that is not on screen has no width, so
    // it measures nothing and stays as it was built. It has to lay itself out
    // the first time it is actually shown — which is what this is for.
    try{ el.__iwio=new IntersectionObserver(function(es){
          for(var i=0;i<es.length;i++)if(es[i].isIntersecting){ run(); return; } },{threshold:0});
        el.__iwio.observe(el); }catch(e){}
    window.addEventListener('resize',run);
    try{ fn(); }catch(e){}
    run();
    return run; }
  function iwPairs(s){
    var out=[], NL=String.fromCharCode(10), CR=String.fromCharCode(13), TAB=String.fromCharCode(9);
    String(s==null?'':s).split(new RegExp('['+NL+CR+';]+')).forEach(function(line){
      var t=line.trim(); if(t==='')return;
      var parts=null, seps=[TAB,' , ',' ,',', '], i, p;
      for(i=0;i<seps.length&&!parts;i++){
        if(t.indexOf(seps[i])>=0){ p=t.split(seps[i]); if(p.length===2)parts=p; } }
      if(!parts){ p=t.split(new RegExp('[ ]+')); if(p.length===2)parts=p; }
      if(!parts&&t.indexOf(',')>=0){ p=t.split(','); if(p.length===2)parts=p; }
      if(!parts)return;
      var a=iwNum(parts[0]), b=iwNum(parts[1]);
      if(a!=null&&b!=null)out.push([a,b]); });
    return out; }
  function iwList(s){ return String(s==null?'':s).split(new RegExp('['+IWNL+IWCR+',;]+'))
    .map(function(x){return x.trim();}).filter(function(x){return x!=='';}); }
  function iwLines(s){ return String(s==null?'':s).split(new RegExp('['+IWNL+IWCR+']+'))
    .map(function(x){return x.trim();}).filter(function(x){return x!=='';}); }
  function iwBr(s){ return esc(s).split(IWNL).join('<br>'); }
  function iwShuf(a,seed){ var r=(hash(String(seed||'x'))+a.length*7919)||7, out=a.slice(), i,j,t;
    for(i=out.length-1;i>0;i--){ r=(r*1103515245+12345)&0x7fffffff; j=r%(i+1); t=out[i]; out[i]=out[j]; out[j]=t; }
    return out; }
  function iwGcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a||1; }
  /* French number writing — comma for the decimal mark, a narrow no-break space
     every three digits. Used by the numeracy elements only: printing 0.600 in a
     table whose whole subject is where the comma goes would be self-defeating.
     The other elements keep iwFmt, because the engine also builds English books.
     Pass group=false when the string goes into an input the reader will re-read. */
  /* ── the stamp on an exercise ────────────────────────────────────────────
     Every revision book prints the same three things above a task: how hard it
     is, how long it should take, and where the answer lives. They are worth
     more than they look — a reader who knows an exercise is meant to take five
     minutes behaves differently at minute fifteen. Shared by exercise, twotier
     and method so the three never drift apart.

     The level shows as dots when it is 1–5 and as plain text otherwise, so
     "niveau 2" and "Terminale" both work. The reference is written however your book
     writes it and is never turned into a link, so renumbering cannot break it. */
  function iwMeta(c){
    var lvl=String(c.level==null?'':c.level).trim(), n=iwNum(lvl);
    var t=String(c.time==null?'':c.time).trim(), ref=String(c.ref||'').trim();
    if(!lvl&&!t&&!ref)return '';
    var out='<div class="iwmeta">';
    if(lvl){
      if(n!=null&&n>=1&&n<=5&&String(Math.round(n))===lvl){
        var dots='', i;
        for(i=1;i<=5;i++){ if(i>3&&i>n)break; dots+='<i'+(i<=n?' class="on"':'')+'></i>'; }
        out+='<span class="iwmeta-lv" title="niveau '+esc(lvl)+'">niveau '+dots+'</span>';
      } else out+='<span class="iwmeta-lv">'+iwRT(lvl)+'</span>';
    }
    if(t)out+='<span class="iwmeta-t">'+iwRT(iwNum(t)!=null&&String(iwNum(t))===t?(t+' min'):t)+'</span>';
    if(ref)out+='<span class="iwmeta-r">'+iwRT(ref)+'</span>';
    return out+'</div>';
  }

  /* iwFrNum trims trailing zeros, which is right for a label and wrong for a
     measured value: a norm of 5,0 m/s is not the same claim as one of 5. Use
     this wherever the number is the result of a calculation. */
  function iwFrFix(v,dec){
    if(v==null||!isFinite(v))return '—';
    var s=(+v).toFixed(dec==null?1:dec).replace('.',',');
    return s.charAt(0)==='-'?String.fromCharCode(0x2212)+s.slice(1):s; }
  function iwFrNum(v,dec,group){
    if(v==null||!isFinite(v))return '—';
    var s=(dec==null)?String(Math.round(v*1e9)/1e9):(+v).toFixed(dec);
    s=s.replace('.',',');
    if(s.indexOf(',')>=0)s=s.replace(new RegExp('0+$'),'').replace(new RegExp(',$'),'');
    var p=s.split(','), ip=p[0], neg=ip.charAt(0)==='-'; if(neg)ip=ip.slice(1);
    var out='', k=0, j;
    for(j=ip.length-1;j>=0;j--){ out=ip.charAt(j)+out; k++;
      if(group!==false&&k%3===0&&j>0)out=String.fromCharCode(0x202F)+out; }
    return (neg?'−':'')+out+(p[1]?','+p[1]:''); }

  /* ── conjugation: one verb, several tenses, optional drill ── */
  R.conjugation=function(box,c){
    box.className='iw iw-card iw-conj';
    var pron=iwList(c.persons); if(!pron.length)pron=['je','tu','il / elle','nous','vous','ils / elles'];
    var tenses=(c.tenses||[]).filter(function(t){ return t&&(t.name||t.forms); });
    if(!tenses.length)tenses=[{name:'Temps',forms:''}];
    var drill=!!c.drill, cur=0;
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<div class="iwcj-head"><b class="iwcj-verb">'+esc(c.verb||'')+'</b>'+
      (c.group?'<span class="iwcj-tag">'+esc(c.group)+'</span>':'')+
      (c.aux?'<span class="iwcj-tag">auxiliaire '+esc(c.aux)+'</span>':'')+'</div>'+
      (c.intro?'<div class="iwcj-intro">'+esc(c.intro)+'</div>':'')+
      (tenses.length>1?'<div class="iwcj-tabs">'+tenses.map(function(t,i){
        return '<button type="button" class="iwcj-tab'+(i===0?' on':'')+'" data-t="'+i+'">'+esc(t.name||('Temps '+(i+1)))+'</button>'; }).join('')+'</div>':
        (tenses[0].name?'<div class="iwcj-one">'+esc(tenses[0].name)+'</div>':''))+
      '<div class="iwcj-body"></div>'+
      (drill?'<div class="iwcj-actions"><button type="button" class="iw-btn" data-cj="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwcj-score"></span></div>':'')+
      (c.note?'<div class="iwcj-note">'+esc(c.note)+'</div>':'');
    var body=box.querySelector('.iwcj-body'), score=box.querySelector('.iwcj-score');
    // The ending is the thing a pupil actually has to learn, so find the point
    // where the forms of one tense stop agreeing and colour everything after it.
    // An irregular verb simply has no common stem and nothing gets coloured,
    // which is itself the right lesson.
    function stemLen(list){ if(list.length<2)return 0;
      var n=Math.min.apply(null,list.map(function(s){return s.length;})), k=0;
      while(k<n){ var ch=list[0].charAt(k), same=true, i;
        for(i=1;i<list.length;i++)if(list[i].charAt(k)!==ch){ same=false; break; }
        if(!same)break; k++; }
      return k; }
    function same(a,b){ a=String(a==null?'':a).trim().toLowerCase(); b=String(b==null?'':b).trim().toLowerCase();
      if(a===b)return true;
      return c.strictAccents===false&&iwNorm(a)===iwNorm(b); }
    function render(){
      var t=tenses[cur], list=iwList(t.forms);
      var cut=(c.endings===false)?0:stemLen(list);
      var rows=pron.map(function(p,i){
        var f=list[i]==null?'':list[i], cell;
        if(drill)cell='<input class="iwcj-in" type="text" data-i="'+i+'" autocomplete="off" spellcheck="false" aria-label="'+esc(p)+'">';
        else if(cut>0&&f.length>cut)cell='<span class="iwcj-f">'+esc(f.slice(0,cut))+'<b>'+esc(f.slice(cut))+'</b></span>';
        else cell='<span class="iwcj-f">'+esc(f)+'</span>';
        return '<div class="iwcj-r"><span class="iwcj-p">'+esc(p)+'</span>'+cell+'</div>'; }).join('');
      body.innerHTML='<div class="iwcj-grid">'+rows+'</div>'+
        (!drill&&cut>0?'<div class="iwcj-key">Radical en clair, <b>terminaison</b> en couleur.</div>':'');
      if(score){ score.textContent=''; score.className='iwcj-score'; } }
    function check(reveal){
      var list=iwList(tenses[cur].forms), ok=0, n=0;
      [].forEach.call(body.querySelectorAll('.iwcj-in'),function(inp){
        var i=+inp.getAttribute('data-i'), want=list[i];
        if(want==null||want==='')return; n++;
        if(reveal)inp.value=want;
        var good=same(inp.value,want);
        inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!=='');
        if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwcj-score '+((reveal||(n&&ok===n))?'ok':'no'); }
    [].forEach.call(box.querySelectorAll('.iwcj-tab'),function(b){ b.addEventListener('click',function(){
      [].forEach.call(box.querySelectorAll('.iwcj-tab'),function(x){ x.classList.remove('on'); });
      b.classList.add('on'); cur=+b.getAttribute('data-t'); render(); }); });
    if(drill){ box.querySelector('[data-cj="check"]').addEventListener('click',function(){ check(false); });
      box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); }); }
    render();
  };

  /* ── cloze: texte à trous, typed or picked from a bank ── */
  R.cloze=function(box,c){
    box.className='iw iw-card iw-cloze';
    var pick=(c.mode==='pick'), src=String(c.text||''), gaps=[], out='', i=0;
    // Square brackets mark the gaps: "Le chat [dort]". A pipe accepts variants,
    // "[dort|sommeille]". Scanned by hand rather than by regex so the author can
    // put anything at all inside the brackets.
    while(i<src.length){
      var a=src.indexOf('[',i);
      if(a<0){ out+=iwBr(src.slice(i)); break; }
      var b=src.indexOf(']',a+1);
      if(b<0){ out+=iwBr(src.slice(i)); break; }
      out+=iwBr(src.slice(i,a));
      out+='<span class="iwcz-g" data-g="'+gaps.length+'"></span>';
      gaps.push(src.slice(a+1,b).trim());
      i=b+1; }
    var bank=[]; gaps.forEach(function(g){ var w=g.split('|')[0].trim(); if(w&&bank.indexOf(w)<0)bank.push(w); });
    iwList(c.extra).forEach(function(w){ if(bank.indexOf(w)<0)bank.push(w); });
    var shown=(c.shuffle===false)?bank.slice():iwShuf(bank,src);
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcz-intro">'+esc(c.intro)+'</div>':'')+
      ((c.bank!==false&&shown.length)?'<div class="iwcz-bank">'+shown.map(function(w){
        return '<button type="button" class="iwcz-chip">'+esc(w)+'</button>'; }).join('')+'</div>':'')+
      '<div class="iwcz-text">'+out+'</div>'+
      (gaps.length?'<div class="iwcz-actions"><button type="button" class="iw-btn" data-cz="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwcz-score"></span></div>':'')+
      (c.note?'<div class="iwcz-note">'+esc(c.note)+'</div>':'');
    var score=box.querySelector('.iwcz-score');
    [].forEach.call(box.querySelectorAll('.iwcz-g'),function(sp){
      var gi=+sp.getAttribute('data-g'), ans=gaps[gi].split('|')[0].trim();
      if(pick){ sp.innerHTML='<select class="iwcz-sel" aria-label="mot manquant"><option value=""></option>'+
        shown.map(function(w){ return '<option>'+esc(w)+'</option>'; }).join('')+'</select>'; }
      else { sp.innerHTML='<input class="iwcz-in" type="text" autocomplete="off" spellcheck="false" aria-label="mot manquant" '+
        'style="width:'+Math.max(5,Math.min(24,ans.length+2))+'ch">'; } });
    var focused=null;
    box.addEventListener('focusin',function(e){ if(e.target&&e.target.classList&&e.target.classList.contains('iwcz-in'))focused=e.target; });
    [].forEach.call(box.querySelectorAll('.iwcz-chip'),function(ch){ ch.addEventListener('click',function(){
      var f=(focused&&!focused.value)?focused:null;
      if(!f){ var all=[].slice.call(box.querySelectorAll('.iwcz-in')); for(var k=0;k<all.length;k++)if(!all[k].value){ f=all[k]; break; } }
      if(f){ f.value=ch.textContent; f.focus(); } }); });
    function check(reveal){
      var ok=0;
      [].forEach.call(box.querySelectorAll('.iwcz-g'),function(sp){
        var gi=+sp.getAttribute('data-g'), f=sp.querySelector('input,select');
        if(!f)return;
        var accept=gaps[gi].split('|').map(function(x){return x.trim();}).join(';');
        if(reveal)f.value=gaps[gi].split('|')[0].trim();
        var good=String(f.value).trim()!==''&&iwAnswerOk(f.value,accept);
        f.classList.toggle('ok',good); f.classList.toggle('no',!good&&String(f.value).trim()!=='');
        if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+gaps.length);
      score.className='iwcz-score '+((reveal||ok===gaps.length)?'ok':'no'); }
    if(gaps.length){ box.querySelector('[data-cz="check"]').addEventListener('click',function(){ check(false); });
      box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); }); }
  };

  /* ── sentence: nature et fonction, group by group ── */
  R.sentence=function(box,c){
    box.className='iw iw-card iw-sent';
    var P=pal(), parts=(c.parts||[]).filter(function(p){ return p&&String(p.text||'').trim()!==''; });
    var ask=(c.ask==='nature'||c.ask==='both')?c.ask:'fonction', quiz=!!c.quiz;
    var nats=[], byNat={};
    parts.forEach(function(p){ var n=String(p.nature||'').trim(); if(n&&nats.indexOf(n)<0)nats.push(n); });
    nats.forEach(function(n,i){ byNat[n]=P[i%P.length]; });
    parts.forEach(function(p){ var n=String(p.nature||'').trim(); if(n&&p.color)byNat[n]=p.color; });
    var fons=[]; parts.forEach(function(p){ var f=String(p.fonction||'').trim(); if(f&&fons.indexOf(f)<0)fons.push(f); });
    var natsAll=nats.slice();
    iwList(c.extraNature).forEach(function(x){ if(natsAll.indexOf(x)<0)natsAll.push(x); });
    iwList(c.extraFonction).forEach(function(x){ if(fons.indexOf(x)<0)fons.push(x); });
    // sorted, so the order of the dropdown never gives the answer away
    natsAll.sort(); fons.sort();
    function sel(kind,i,list){ return '<select class="iwst-sel" data-k="'+kind+'" data-i="'+i+'" aria-label="'+kind+'">'+
      '<option value=""></option>'+list.map(function(x){ return '<option>'+esc(x)+'</option>'; }).join('')+'</select>'; }
    var chips=parts.map(function(p,i){
      var col=byNat[String(p.nature||'').trim()]||'var(--slate)';
      var lab;
      if(quiz){ lab=((ask==='nature'||ask==='both')?sel('nature',i,natsAll):'<span class="iwst-n">'+esc(p.nature||'')+'</span>')+
        ((ask==='fonction'||ask==='both')?sel('fonction',i,fons):'<span class="iwst-fn">'+esc(p.fonction||'')+'</span>'); }
      else lab='<span class="iwst-n">'+esc(p.nature||'')+'</span><span class="iwst-fn">'+esc(p.fonction||'')+'</span>';
      return '<span class="iwst-p" style="--pc:'+esc(col)+'"><span class="iwst-t">'+esc(p.text)+'</span>'+
        '<span class="iwst-l">'+lab+'</span></span>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwst-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwst-row">'+chips+'</div>'+
      ((c.legend!==false&&nats.length)?'<div class="iwst-legend">'+nats.map(function(n){
        return '<span class="iwst-lg"><i style="background:'+esc(byNat[n])+'"></i>'+esc(n)+'</span>'; }).join('')+'</div>':'')+
      (quiz?'<div class="iwst-actions"><button type="button" class="iw-btn" data-st="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwst-score"></span></div>':'')+
      (c.note?'<div class="iwst-note">'+esc(c.note)+'</div>':'');
    if(!quiz)return;
    var score=box.querySelector('.iwst-score');
    function check(reveal){
      var ok=0, n=0;
      [].forEach.call(box.querySelectorAll('.iwst-sel'),function(s){
        var i=+s.getAttribute('data-i'), k=s.getAttribute('data-k');
        var want=String((parts[i]||{})[k]||'').trim();
        if(!want)return; n++;
        if(reveal)s.value=want;
        var good=iwNorm(s.value)===iwNorm(want);
        s.classList.toggle('ok',good); s.classList.toggle('no',!good&&s.value!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwst-score '+((reveal||(n&&ok===n))?'ok':'no'); }
    box.querySelector('[data-st="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── crossword: the grid lays itself out from the words ──
     Longest word first, then every later word is tried against every letter of
     every placed word and the crossing with the most intersections wins. A word
     that cannot cross anything is dropped onto a fresh row below the grid rather
     than silently discarded. No randomness anywhere, so the grid is identical
     every time the book is opened — a printed correction still matches. */
  R.crossword=function(box,c){
    box.className='iw iw-card iw-cw';
    function up(s){ return iwNorm(s).toUpperCase().replace(new RegExp('[^A-Z0-9]','g'),''); }
    var words=(c.words||[]).map(function(w){ return {w:up(w&&w.word),clue:String((w&&w.clue)||'')}; })
      .filter(function(w){ return w.w.length>1; });
    words.sort(function(a,b){ return (b.w.length-a.w.length)||(a.w<b.w?-1:1); });
    var grid={}, placed=[];
    function get(r,k){ return grid[r+','+k]; }
    function fits(w,r,k,dir){
      var dr=dir?1:0, dk=dir?0:1, i, cross=0;
      if(get(r-dr,k-dk)||get(r+dr*w.length,k+dk*w.length))return -1;
      for(i=0;i<w.length;i++){
        var rr=r+dr*i, kk=k+dk*i, cell=get(rr,kk);
        if(cell){ if(cell!==w.charAt(i))return -1; cross++; }
        // an empty cell may not have a neighbour on the perpendicular axis, or
        // two words end up glued side by side and spell something that is not a word
        else if(get(rr+dk,kk+dr)||get(rr-dk,kk-dr))return -1; }
      return cross; }
    function put(o,r,k,dir){ var dr=dir?1:0, dk=dir?0:1;
      for(var i=0;i<o.w.length;i++)grid[(r+dr*i)+','+(k+dk*i)]=o.w.charAt(i);
      placed.push({w:o.w,clue:o.clue,r:r,c:k,dir:dir}); }
    function ext(){ var r1=0,c0=0;
      placed.forEach(function(p){ r1=Math.max(r1,p.dir?p.r+p.w.length-1:p.r); c0=Math.min(c0,p.c); });
      return {r1:r1,c0:c0}; }
    if(words.length){
      put(words[0],0,0,0);
      for(var wi=1;wi<words.length;wi++){
        var w=words[wi], best=null, pi,a,b2;
        for(pi=0;pi<placed.length;pi++){ var p=placed[pi], nd=p.dir?0:1;
          for(a=0;a<p.w.length;a++)for(b2=0;b2<w.w.length;b2++){
            if(p.w.charAt(a)!==w.w.charAt(b2))continue;
            var rr=p.dir?p.r+a:p.r, kk=p.dir?p.c:p.c+a;
            var r0=nd?rr-b2:rr, k0=nd?kk:kk-b2;
            var sc=fits(w.w,r0,k0,nd);
            if(sc>0&&(!best||sc>best.sc))best={r:r0,c:k0,dir:nd,sc:sc}; } }
        if(best)put(w,best.r,best.c,best.dir);
        else { var e=ext(); put(w,e.r1+2,e.c0,0); } } }
    if(!placed.length){ box.innerHTML='<div class="iw-err">Aucun mot à placer.</div>'; return; }
    placed.sort(function(a,b){ return (a.r-b.r)||(a.c-b.c)||(a.dir-b.dir); });
    var num={}, n=0;
    placed.forEach(function(p){ var k=p.r+','+p.c; if(!num[k])num[k]=++n; p.n=num[k]; });
    var r0=Infinity,c0=Infinity,r1=-Infinity,c1=-Infinity;
    placed.forEach(function(p){ r0=Math.min(r0,p.r); c0=Math.min(c0,p.c);
      r1=Math.max(r1,p.dir?p.r+p.w.length-1:p.r); c1=Math.max(c1,p.dir?p.c:p.c+p.w.length-1); });
    var rows='', r,k;
    for(r=r0;r<=r1;r++){ var tds='';
      for(k=c0;k<=c1;k++){ var ch=get(r,k);
        if(!ch){ tds+='<td class="iwcw-x"></td>'; continue; }
        tds+='<td class="iwcw-c">'+(num[r+','+k]?'<i>'+num[r+','+k]+'</i>':'')+
          '<input maxlength="1" data-rc="'+r+','+k+'" data-a="'+ch+'" autocomplete="off" spellcheck="false" aria-label="lettre"></td>'; }
      rows+='<tr>'+tds+'</tr>'; }
    function clues(list,head){ if(!list.length)return '';
      return '<div class="iwcw-side"><h4>'+head+'</h4><ul class="iwcw-cl">'+list.map(function(p){
        return '<li><b>'+p.n+'.</b> '+esc(p.clue||'—')+' <em>('+p.w.length+')</em></li>'; }).join('')+'</ul></div>'; }
    var across=placed.filter(function(p){ return !p.dir; }).sort(function(a,b){ return a.n-b.n; });
    var down=placed.filter(function(p){ return p.dir; }).sort(function(a,b){ return a.n-b.n; });
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcw-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwcw-wrap"><table class="iwcw-grid"><tbody>'+rows+'</tbody></table>'+
      '<div class="iwcw-clues">'+clues(across,'Horizontalement')+clues(down,'Verticalement')+'</div></div>'+
      '<div class="iwcw-actions"><button type="button" class="iw-btn" data-cw="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwcw-score"></span></div>'+
      (c.note?'<div class="iwcw-note">'+esc(c.note)+'</div>':'');
    var score=box.querySelector('.iwcw-score');
    var cells=[].slice.call(box.querySelectorAll('.iwcw-c input'));
    cells.forEach(function(inp,ix){
      inp.addEventListener('input',function(){
        inp.value=up(inp.value).slice(0,1);
        inp.classList.remove('ok','no');
        if(inp.value&&cells[ix+1])cells[ix+1].focus(); });
      inp.addEventListener('keydown',function(e){
        if(e.key==='Backspace'&&!inp.value&&cells[ix-1]){ cells[ix-1].focus(); } }); });
    function check(reveal){ var ok=0;
      cells.forEach(function(inp){ var want=inp.getAttribute('data-a');
        if(reveal)inp.value=want;
        var good=up(inp.value)===want;
        inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&inp.value!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+cells.length+' lettres');
      score.className='iwcw-score '+((reveal||ok===cells.length)?'ok':'no'); }
    box.querySelector('[data-cw="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── fractions: bars or discs, compared and simplified ── */
  R.fractionbar=function(box,c){
    box.className='iw iw-card iw-frac';
    var P=pal(), disc=(c.shape==='disc'), live=!!c.interactive;
    var fr=(c.fracs||[]).map(function(f,i){
      var d=Math.round(iwNum(f&&f.den)||0), n=Math.round(iwNum(f&&f.num)||0);
      if(!(d>0))d=1; if(d>60)d=60; if(n<0)n=0; if(n>d*4)n=d*4;
      return {n:n,d:d,label:String((f&&f.label)||''),color:(f&&f.color)||P[i%P.length]}; });
    if(!fr.length)fr=[{n:1,d:2,label:'',color:P[0]}];
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwfr-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwfr-list"></div><div class="iwfr-cmp"></div>'+
      (c.note?'<div class="iwfr-note">'+esc(c.note)+'</div>':'');
    var list=box.querySelector('.iwfr-list'), cmp=box.querySelector('.iwfr-cmp');
    function fx(n,d){ return '<span class="iwfr-fx"><b>'+n+'</b><i>'+d+'</i></span>'; }
    function bars(f){
      // an improper fraction is drawn as whole units side by side, which is the
      // whole point of showing 7/4 rather than just writing 1,75
      var units=Math.max(1,Math.ceil(f.n/f.d)), left=f.n, s='', u,i;
      for(u=0;u<units;u++){ var cells='';
        for(i=0;i<f.d;i++){ var on=left>0; if(on)left--;
          cells+='<span class="iwfr-cell'+(on?' on':'')+'"></span>'; }
        s+='<div class="iwfr-bar">'+cells+'</div>'; }
      return s; }
    function discs(f){
      var units=Math.max(1,Math.ceil(f.n/f.d)), left=f.n, s='', u,i;
      for(u=0;u<units;u++){
        var g='<svg class="iwfr-disc" viewBox="0 0 100 100" role="img">';
        if(f.d===1){ var on1=left>0; if(on1)left--;
          g+='<circle class="iwfr-sec'+(on1?' on':'')+'" cx="50" cy="50" r="46"/>'; }
        else for(i=0;i<f.d;i++){ var on=left>0; if(on)left--;
          var a0=-Math.PI/2+i*2*Math.PI/f.d, a1=-Math.PI/2+(i+1)*2*Math.PI/f.d, big=(2*Math.PI/f.d)>Math.PI?1:0;
          g+='<path class="iwfr-sec'+(on?' on':'')+'" d="M50 50 L'+(50+46*Math.cos(a0)).toFixed(2)+' '+(50+46*Math.sin(a0)).toFixed(2)+
            ' A46 46 0 '+big+' 1 '+(50+46*Math.cos(a1)).toFixed(2)+' '+(50+46*Math.sin(a1)).toFixed(2)+' Z"/>'; }
        s+=g+'</svg>'; }
      return s; }
    function render(){
      list.innerHTML=fr.map(function(f,i){
        var g=iwGcd(f.n,f.d), simp=(g>1&&f.n>0)?' = '+fx(f.n/g,f.d/g):'';
        var v=f.n/f.d;
        return '<div class="iwfr-item" style="--fc:'+esc(f.color)+'">'+
          (f.label?'<div class="iwfr-lb">'+esc(f.label)+'</div>':'')+
          '<div class="iwfr-shapes">'+(disc?discs(f):bars(f))+'</div>'+
          '<div class="iwfr-read">'+fx(f.n,f.d)+simp+
          '<em>'+iwFrNum(v,3)+'</em><em>'+iwFrNum(v*100,1)+' %</em></div>'+
          (live?'<div class="iwfr-btns"><button type="button" data-fr="'+i+'" data-dz="-1" aria-label="moins">−</button>'+
            '<button type="button" data-fr="'+i+'" data-dz="1" aria-label="plus">+</button></div>':'')+
        '</div>'; }).join('');
      if(live)[].forEach.call(list.querySelectorAll('[data-fr]'),function(b){ b.addEventListener('click',function(){
        var f=fr[+b.getAttribute('data-fr')], dz=+b.getAttribute('data-dz');
        f.n=Math.max(0,Math.min(f.d*4,f.n+dz)); render(); }); });
      if(c.compare===false||fr.length<2){ cmp.innerHTML=''; return; }
      var srt=fr.slice().sort(function(a,b){ return a.n/a.d-b.n/b.d; });
      // the sign is decided pair by pair: two fractions that reduce to the same
      // value get "=", and saying "≤" everywhere just because one pair is equal
      // would hide exactly the fact the exercise is about
      var chain=srt.map(function(f,i){
        var sign=i?'<span class="iwfr-op"> '+((Math.abs(f.n/f.d-srt[i-1].n/srt[i-1].d)<1e-12)?'=':'&lt;')+' </span>':'';
        return sign+fx(f.n,f.d); }).join('');
      var L=1, ok=true;
      fr.forEach(function(f){ L=L/iwGcd(L,f.d)*f.d; if(L>100000)ok=false; });
      var same=ok?'<div class="iwfr-same">Au même dénominateur : '+
        srt.map(function(f){ return fx(f.n*(L/f.d),L); }).join('<span class="iwfr-op"> · </span>')+'</div>':'';
      cmp.innerHTML='<div class="iwfr-chain">'+chain+'</div>'+same; }
    render();
  };

  /* ── clock: read it, set it, or measure a duration ── */
  R.clock=function(box,c){
    box.className='iw iw-card iw-clock';
    var mode=(c.mode==='read'||c.mode==='set'||c.mode==='duration')?c.mode:'show';
    var step=Math.max(1,Math.min(30,Math.round(iwNum(c.step)||1)));
    function parseT(s,dh,dm){ s=String(s==null?'':s).trim();
      var m=s.match(new RegExp('^([0-9]{1,2})[^0-9]+([0-9]{1,2})'));
      if(m)return {h:(+m[1])%24,m:(+m[2])%60};
      var m2=s.match(new RegExp('^([0-9]{1,2})$'));
      if(m2)return {h:(+m2[1])%24,m:0};
      return {h:dh,m:dm}; }
    var U=['zéro','une','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze',
      'treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf','vingt'];
    function w2(n){ if(n<=20)return U[n];
      var t=Math.floor(n/10), r=n%10, T=['','','vingt','trente','quarante','cinquante'][t];
      return T+(r===1?' et une':(r?'-'+U[r]:'')); }
    function hWord(h){ h=((h%24)+24)%24;
      if(h===0)return 'minuit'; if(h===12)return 'midi';
      var hh=h>12?h-12:h; return U[hh]+' heure'+(hh>1?'s':''); }
    function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
    // "midi et demi" is masculine, "deux heures et demie" feminine — teachers notice
    function words(h,m){ h=((h%24)+24)%24;
      if(m===0)return cap(hWord(h));
      if(m===15)return cap(hWord(h))+' et quart';
      if(m===30)return cap(hWord(h))+((h%12===0)?' et demi':' et demie');
      if(m===45)return cap(hWord(h+1))+' moins le quart';
      if(m<30)return cap(hWord(h))+' '+w2(m);
      return cap(hWord(h+1))+' moins '+w2(60-m); }
    function two(n){ return (n<10?'0':'')+n; }
    function digital(h,m){ return two(((h%24)+24)%24)+':'+two(m); }
    function face(t,drag){
      var s='<svg class="iwck-face'+(drag?' drag':'')+'" viewBox="0 0 210 210" role="img">'+
        '<circle class="iwck-rim" cx="105" cy="105" r="98"/>';
      var i,a;
      for(i=0;i<60;i++){ a=i*6*Math.PI/180-Math.PI/2; var big=(i%5===0);
        s+='<line class="iwck-tk'+(big?' big':'')+'" x1="'+(105+(big?80:85)*Math.cos(a)).toFixed(1)+'" y1="'+(105+(big?80:85)*Math.sin(a)).toFixed(1)+
          '" x2="'+(105+91*Math.cos(a)).toFixed(1)+'" y2="'+(105+91*Math.sin(a)).toFixed(1)+'"/>'; }
      for(i=1;i<=12;i++){ a=i*30*Math.PI/180-Math.PI/2;
        s+='<text class="iwck-n" x="'+(105+64*Math.cos(a)).toFixed(1)+'" y="'+(105+64*Math.sin(a)).toFixed(1)+
          '" text-anchor="middle" dominant-baseline="central">'+i+'</text>';
        if(c.minuteNumbers)s+='<text class="iwck-mn" x="'+(105+99*Math.cos(a)).toFixed(1)+'" y="'+(105+99*Math.sin(a)).toFixed(1)+
          '" text-anchor="middle" dominant-baseline="central">'+two(i*5%60)+'</text>'; }
      var ha=((t.h%12)+t.m/60)*30*Math.PI/180-Math.PI/2, ma=t.m*6*Math.PI/180-Math.PI/2;
      s+='<line class="iwck-hh" x1="105" y1="105" x2="'+(105+46*Math.cos(ha)).toFixed(1)+'" y2="'+(105+46*Math.sin(ha)).toFixed(1)+'"/>'+
        '<line class="iwck-mh" x1="105" y1="105" x2="'+(105+74*Math.cos(ma)).toFixed(1)+'" y2="'+(105+74*Math.sin(ma)).toFixed(1)+'"/>'+
        '<circle class="iwck-pin" cx="105" cy="105" r="5.5"/></svg>';
      return s; }
    var t0=parseT(c.time,10,10), t1=parseT(c.to,t0.h+1,t0.m);
    var cur={h:(mode==='set'?(iwNum(c.startHour)==null?12:iwNum(c.startHour)):t0.h)%24,m:0};
    function panel(){
      if(mode==='duration'){
        return '<div class="iwck-pair"><figure>'+face(t0)+'<figcaption>Départ — '+digital(t0.h,t0.m)+'</figcaption></figure>'+
          '<figure>'+face(t1)+'<figcaption>Arrivée — '+digital(t1.h,t1.m)+'</figcaption></figure></div>'; }
      if(mode==='set')return '<div class="iwck-one">'+face(cur,true)+'</div>';
      return '<div class="iwck-one">'+face(t0)+'</div>'; }
    var ask='';
    if(mode==='read')ask='<div class="iwck-ask"><label>Il est <input class="iwck-in" data-k="h" type="text" inputmode="numeric" aria-label="heures"> h '+
      '<input class="iwck-in" data-k="m" type="text" inputmode="numeric" aria-label="minutes"></label></div>';
    if(mode==='duration')ask='<div class="iwck-ask"><label>Durée : <input class="iwck-in" data-k="dh" type="text" inputmode="numeric" aria-label="heures"> h '+
      '<input class="iwck-in" data-k="dm" type="text" inputmode="numeric" aria-label="minutes"> min</label></div>';
    if(mode==='set')ask='<div class="iwck-target">Placez les aiguilles sur <b>'+esc(words(t0.h,t0.m))+'</b></div>';
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwck-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwck-wrap">'+panel()+'</div>'+ask+
      (mode==='show'?'<div class="iwck-read"><b>'+digital(t0.h,t0.m)+'</b><span>'+esc(words(t0.h,t0.m))+'</span></div>':
        '<div class="iwck-actions"><button type="button" class="iw-btn" data-ck="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwck-score"></span></div>')+
      (c.note?'<div class="iwck-note">'+esc(c.note)+'</div>':'');
    if(mode==='show')return;
    var wrap=box.querySelector('.iwck-wrap'), score=box.querySelector('.iwck-score');
    function repaint(){ wrap.innerHTML=panel(); if(mode==='set')wire(); }
    function wire(){
      var svg=wrap.querySelector('svg'); if(!svg)return;
      var drag=null;
      function ang(ev){ var r=svg.getBoundingClientRect();
        var x=(ev.clientX-r.left)/r.width*210-105, y=(ev.clientY-r.top)/r.height*210-105;
        var a=Math.atan2(y,x)*180/Math.PI+90; return a<0?a+360:a; }
      svg.addEventListener('pointerdown',function(e){
        var r=svg.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width*210-105, y=(e.clientY-r.top)/r.height*210-105;
        // near the middle it is the hour hand, out towards the rim the minute hand
        drag=(Math.sqrt(x*x+y*y)<52)?'h':'m';
        svg.setPointerCapture(e.pointerId); move(e); });
      svg.addEventListener('pointermove',function(e){ if(drag)move(e); });
      svg.addEventListener('pointerup',function(){ drag=null; });
      function move(e){ var a=ang(e);
        if(drag==='m'){ cur.m=(Math.round(a/6/step)*step)%60; }
        else { cur.h=(Math.round(a/30)%12)||12; if(cur.h===12)cur.h=12; }
        if(score){ score.textContent=''; score.className='iwck-score'; }
        repaint(); }
    }
    if(mode==='set')wire();
    function diff(){ var m0=t0.h*60+t0.m, m1=t1.h*60+t1.m; if(m1<m0)m1+=24*60; return m1-m0; }
    function check(reveal){
      var good=false, wants;
      if(mode==='set'){
        if(reveal){ cur.h=t0.h%12||12; cur.m=t0.m; repaint(); }
        good=((cur.h%12)===(t0.h%12))&&cur.m===t0.m;
        wants=words(t0.h,t0.m); }
      else {
        var D=diff();
        wants=(mode==='read')?{h:t0.h,m:t0.m}:{h:Math.floor(D/60),m:D%60};
        var ok=0;
        [].forEach.call(box.querySelectorAll('.iwck-in'),function(inp){
          var k=inp.getAttribute('data-k'), want=(k==='h'||k==='dh')?wants.h:wants.m;
          if(mode==='read'&&k==='h')want=t0.h%12||12;
          if(reveal)inp.value=want;
          var v=iwNum(inp.value);
          var hit=(v!=null)&&(v===want||(k==='h'&&v===t0.h));
          inp.classList.toggle('ok',hit); inp.classList.toggle('no',!hit&&String(inp.value).trim()!==''); if(hit)ok++; });
        good=(ok===2);
        wants=(mode==='read')?words(t0.h,t0.m):(wants.h+' h '+two(wants.m)); }
      score.textContent=reveal?String(wants):(good?'Exact':'Pas encore');
      score.className='iwck-score '+((reveal||good)?'ok':'no'); }
    box.querySelector('[data-ck="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── place value: the numeration table, and the chiffre / nombre trap ── */
  R.placevalue=function(box,c){
    box.className='iw iw-card iw-pv';
    var GR=[{n:'Milliards',k:['c','d','u']},{n:'Millions',k:['c','d','u']},{n:'Mille',k:['c','d','u']},{n:'Unités',k:['c','d','u']}];
    var NAME={c:'centaines',d:'dizaines',u:'unités'};
    var DE=[{k:'x',n:'dixièmes'},{k:'y',n:'centièmes'},{k:'z',n:'millièmes'}];
    var raw=String(c.number==null?'':c.number).replace(new RegExp('[  ]','g'),'').replace('.',',');
    var ip=(raw.split(',')[0]||'').replace(new RegExp('[^0-9]','g'),'');
    var fp=(raw.split(',')[1]||'').replace(new RegExp('[^0-9]','g'),'');
    if(!ip)ip='0'; if(ip.length>12)ip=ip.slice(-12); if(fp.length>3)fp=fp.slice(0,3);
    var nDec=(iwNum(c.decimals)==null)?fp.length:Math.max(0,Math.min(3,Math.round(iwNum(c.decimals))));
    while(fp.length<nDec)fp+='0';
    fp=fp.slice(0,nDec);
    var nGrp=Math.max(1,Math.min(4,Math.ceil(ip.length/3)));
    if(iwNum(c.groups)!=null)nGrp=Math.max(nGrp,Math.min(4,Math.round(iwNum(c.groups))));
    var grp=GR.slice(4-nGrp), cols=[];
    grp.forEach(function(g){ g.k.forEach(function(k){ cols.push({g:g.n,k:k,dec:false}); }); });
    DE.slice(0,nDec).forEach(function(d){ cols.push({g:'Décimales',k:d.k,name:d.n,dec:true}); });
    var digits=[], padded=ip;
    while(padded.length<nGrp*3)padded='0'+padded;
    for(var i=0;i<padded.length;i++)digits.push(padded.charAt(i));
    for(i=0;i<fp.length;i++)digits.push(fp.charAt(i));
    var lead=padded.length-ip.length;   // leading zeros are structural, never printed
    var fill=(c.mode==='fill');
    var head1='', head2='', row='', seen={};
    cols.forEach(function(col,ix){
      if(!seen[col.g]){ seen[col.g]=cols.filter(function(x){ return x.g===col.g; }).length;
        head1+='<th class="iwpv-g'+(col.dec?' dec':'')+'" colspan="'+seen[col.g]+'">'+esc(col.g)+'</th>'; }
      head2+='<th class="iwpv-k'+(col.dec?' dec':'')+'" title="'+esc(col.name||NAME[col.k])+'">'+
        (col.dec?esc(col.name.charAt(0)):col.k)+'</th>';
      var d=digits[ix], blank=(ix<lead);
      row+='<td class="iwpv-c'+(col.dec?' dec':'')+(blank?' pale':'')+'">'+
        (fill?'<input maxlength="1" data-i="'+ix+'" data-a="'+esc(blank?'':d)+'" autocomplete="off" aria-label="chiffre">':
          (blank?'':esc(d)))+'</td>'; });
    // decomposition, written the way it is written on the board
    var parts=[];
    for(i=0;i<digits.length;i++){ var p=(padded.length-1-i), w=Math.pow(10,p);
      if(i>=padded.length)w=Math.pow(10,-(i-padded.length+1));
      if(+digits[i]!==0)parts.push(digits[i]+' × '+iwFrNum(w)); }
    // the classic confusion: the digit in a column versus how many of that unit
    // the whole number contains
    var traps=[];
    for(i=Math.max(0,padded.length-4);i<padded.length;i++){
      var col=cols[i]; if(!col||col.dec)continue;
      var pw=padded.length-1-i, cnt=Math.floor(Math.abs(parseFloat(ip))/Math.pow(10,pw));
      var unit=NAME[col.k]+(pw>=3?' de '+(pw>=6?(pw>=9?'milliards':'millions'):'mille'):'');
      // "nombre d’unités", never "nombre de unités"
      var de=(new RegExp('^[aeiouéèêh]','i')).test(unit)?'d’':'de ';
      traps.push('<li>chiffre des '+unit+' : <b>'+digits[i]+'</b> · nombre '+de+unit+
        ' : <b>'+iwFrNum(cnt)+'</b></li>'); }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwpv-intro">'+esc(c.intro)+'</div>':'')+
      (fill?'<div class="iwpv-ask">Écrivez <b>'+esc(raw||'0')+'</b> dans le tableau.</div>':'')+
      '<div class="iwpv-scroll"><table class="iwpv-t"><thead><tr>'+head1+'</tr><tr>'+head2+'</tr></thead>'+
      '<tbody><tr>'+row+'</tr></tbody></table></div>'+
      (fill?'<div class="iwpv-actions"><button type="button" class="iw-btn" data-pv="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwpv-score"></span></div>':'')+
      ((c.decompose!==false&&parts.length)?'<div class="iwpv-dec"><span>Décomposition</span><b>'+esc(ip)+(fp?','+esc(fp):'')+
        ' = '+parts.join(' + ')+'</b></div>':'')+
      ((c.traps!==false&&traps.length)?'<ul class="iwpv-traps">'+traps.join('')+'</ul>':'')+
      (c.note?'<div class="iwpv-note">'+esc(c.note)+'</div>':'');
    if(!fill)return;
    var score=box.querySelector('.iwpv-score');
    function check(reveal){ var ok=0, n=0;
      [].forEach.call(box.querySelectorAll('.iwpv-c input'),function(inp){ n++;
        var want=inp.getAttribute('data-a');
        if(reveal)inp.value=want;
        var good=String(inp.value).trim()===want;
        inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwpv-score '+((reveal||ok===n)?'ok':'no'); }
    box.querySelector('[data-pv="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── posed operation: the four operations laid out as on squared paper ──
     Every character sits in its own cell of a grid, so the columns line up
     exactly whatever font the theme picks, and any cell can become an input
     without the layout shifting. */
  R.posed=function(box,c){
    box.className='iw iw-card iw-posed';
    var OPS={'+':'+','-':'−','−':'−','*':'×','x':'×','×':'×','/':'÷','÷':'÷',':':'÷'};
    var op=OPS[String(c.op||'+').trim()]||'+';
    function split(s){ s=String(s==null?'':s).replace(new RegExp('[  ]','g'),'').replace('.',',');
      if(s.charAt(0)==='-')s=s.slice(1);
      var a=s.split(',');
      return {i:(a[0]||'').replace(new RegExp('[^0-9]','g'),'')||'0',
              d:(a[1]||'').replace(new RegExp('[^0-9]','g'),'')}; }
    var A=split(c.a), B=split(c.b);
    var blank=(c.mode==='blank'), rows=[];
    function mk(w){ var a=[],i; for(i=0;i<w;i++)a.push(' '); return a; }
    function put(row,s,end){ for(var i=0;i<s.length;i++){ var k=end-s.length+1+i; if(k>=0&&k<row.length)row[k]=s.charAt(i); } }
    function push(cells,o){ o=o||{}; o.cells=cells; rows.push(o); return o; }
    var W, extra='';
    if(op==='+'||op==='−'){
      var dl=Math.max(A.d.length,B.d.length);
      var ai=A.i, bi=B.i, ad=A.d, bd=B.d;
      while(ad.length<dl)ad+='0'; while(bd.length<dl)bd+='0';
      var il=Math.max(ai.length,bi.length)+1;          // one spare column for a carry out
      W=2+il+(dl?1+dl:0);
      var comma=dl?(2+il):-1, endI=1+il, endD=W-1;
      var sa=ai+ad, sb=bi+bd, n=il+dl;
      while(sa.length<n)sa='0'+sa; while(sb.length<n)sb='0'+sb;
      var na=parseInt(sa,10), nb=parseInt(sb,10);
      var nr=(op==='+')?(na+nb):(na-nb), neg=nr<0; nr=Math.abs(nr);
      var rs=String(nr); while(rs.length<dl+1)rs='0'+rs;
      var rI=dl?rs.slice(0,rs.length-dl):rs, rD=dl?rs.slice(rs.length-dl):'';
      // where the retenues land. Column j of the strings sits at cell
      // 2+j, shifted one more once we are past the comma.
      function cellOf(j){ return 2+j+((dl&&j>=il)?1:0); }
      var marks=mk(W), cy=0, j;
      for(j=n-1;j>=0;j--){
        var x=+sa.charAt(j), y=+sb.charAt(j);
        if(op==='+'){ var s2=x+y+cy; cy=s2>=10?1:0; if(cy&&j>0)marks[cellOf(j-1)]='1'; }
        else { var s3=x-y-cy; if(s3<0){ if(j>0)marks[cellOf(j-1)]='1'; cy=1; } else cy=0; } }
      // addition writes the retenue above the sum, subtraction writes the
      // compensation next to the number being taken away — two different rows
      if(op==='+')push(marks,{cls:'iwpo-mark'});
      var r1=mk(W); put(r1,ai,endI); if(dl){ r1[comma]=','; put(r1,ad,endD); } push(r1);
      if(op==='−')push(marks,{cls:'iwpo-mark low'});
      var r2=mk(W); r2[0]=op; put(r2,bi,endI); if(dl){ r2[comma]=','; put(r2,bd,endD); }
      push(r2);
      // the bar is a border-top, so it has to be carried by the row *under* the
      // operands — putting it on the second operand draws it between the two
      var r3=mk(W); put(r3,(neg?'−':'')+rI,endI); if(dl){ r3[comma]=','; put(r3,rD,endD); }
      push(r3,{cls:'iwpo-res',ans:1,rule:[0,W-1]});
    } else if(op==='×'){
      var dtot=A.d.length+B.d.length, sa2=A.i+A.d, sb2=B.i+B.d;
      var pa=parseInt(sa2,10), pb=parseInt(sb2,10), prod=String(pa*pb);
      var digitsB=sb2.split('').reverse();
      var partials=digitsB.map(function(d,k){ return {v:String(pa*(+d)),sh:k}; });
      var shown=prod;
      if(dtot){ var pi=prod; while(pi.length<=dtot)pi='0'+pi;
        shown=pi.slice(0,pi.length-dtot)+','+pi.slice(pi.length-dtot); }
      var maxw=Math.max(sa2.length,sb2.length,shown.length);
      partials.forEach(function(p){ maxw=Math.max(maxw,p.v.length+p.sh); });
      W=2+maxw; var END=W-1;
      var q1=mk(W); put(q1,sa2,END); push(q1);
      var q2=mk(W); q2[0]='×'; put(q2,sb2,END); push(q2);
      if(partials.length>1)partials.forEach(function(p,pi){
        var r=mk(W); put(r,p.v,END-p.sh);
        for(var z=0;z<p.sh;z++)r[END-z]='·';
        push(r,{cls:'iwpo-part',rule:pi===0?[0,W-1]:null}); });
      var q3=mk(W); put(q3,shown,END);
      push(q3,{cls:'iwpo-res',ans:1,rule:[0,W-1]});
      if(dtot)extra='<div class="iwpo-say">On pose <b>'+esc(sa2)+' × '+esc(sb2)+'</b> sans virgule, '+
        'puis on replace les <b>'+dtot+'</b> décimale'+(dtot>1?'s':'')+' dans le produit.</div>';
    } else {
      var dvd=parseInt(A.i+A.d,10), dvs=parseInt(B.i+B.d,10);
      if(!dvs){ box.innerHTML='<div class="iw-err">Division par zéro.</div>'; return; }
      var nd=Math.max(0,Math.min(4,Math.round(iwNum(c.decimals)||0)));
      var ds=String(dvd), L=ds.length, TW=L+nd;
      W=TW+2;
      var work=0, quot='', started=false, steps=[], p2;
      for(p2=0;p2<TW;p2++){
        work=work*10+(p2<L?+ds.charAt(p2):0);
        var q=Math.floor(work/dvs);
        if(q>0)started=true;
        if(started||p2>=L-1)quot+=q;
        if(q>0){ steps.push({at:p2,before:String(work),sub:String(q*dvs),after:String(work-q*dvs)}); work-=q*dvs; } }
      var qi=quot.replace(new RegExp('^0+([0-9])'),'$1');
      if(nd)qi=qi.slice(0,qi.length-nd)+','+qi.slice(qi.length-nd);
      // digit p of the dividend sits in cell 2+p; every line of the working is
      // right-aligned on the digit it was brought down to, which is what makes
      // the potence readable
      var COL=function(p){ return 2+p; };
      var d0=mk(W); put(d0,ds,COL(L-1));
      for(var z2=0;z2<nd;z2++)d0[COL(L+z2)]='0';
      push(d0,{right:String(dvs),paleFrom:nd?COL(L):-1});
      push(mk(W),{right:qi,rightRule:1});
      steps.forEach(function(st,si){
        var end=COL(st.at), wide=Math.max(st.sub.length,st.before.length);
        var rr=mk(W); put(rr,st.sub,end); rr[end-st.sub.length]='−';
        push(rr);
        // under the bar goes the remainder *with the next digit brought down* —
        // that is the number the following subtraction actually works on, and
        // printing the bare remainder instead is what makes pupils lose the thread.
        // The bar rides on this row, since it is drawn as a border-top.
        var nx=steps[si+1];
        var r4=mk(W); put(r4,nx?nx.before:st.after,nx?COL(nx.at):end);
        push(r4,{rule:[Math.max(0,end-wide),end]}); });
      extra='<div class="iwpo-say"><b>'+esc(ds)+'</b> = <b>'+esc(String(dvs))+'</b> × <b>'+esc(qi)+'</b>'+
        (nd?'':' + <b>'+work+'</b> &nbsp;— quotient '+esc(qi)+', reste '+work)+'</div>';
    }
    var html=rows.map(function(r){
      var cs=r.cells.map(function(ch,ix){
        var cls='iwpo-c';
        if(r.rule&&ix>=r.rule[0]&&ix<=r.rule[1])cls+=' rule';
        if(ch===',')cls+=' comma';
        if(r.paleFrom>=0&&ix>=r.paleFrom)cls+=' pale';
        if(blank&&r.ans&&(new RegExp('^[0-9]$')).test(ch))
          return '<span class="'+cls+'"><input maxlength="1" data-a="'+ch+'" autocomplete="off" aria-label="chiffre"></span>';
        return '<span class="'+cls+'">'+(ch===' '?'':esc(ch))+'</span>'; }).join('');
      var right=r.right!=null?'<span class="iwpo-div'+(r.rightRule?' q':'')+'">'+esc(r.right)+'</span>':'';
      return '<div class="iwpo-r '+(r.cls||'')+'">'+cs+right+'</div>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwpo-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwpo-grid" style="--pw:'+W+'">'+html+'</div>'+extra+
      (blank?'<div class="iwpo-actions"><button type="button" class="iw-btn" data-po="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwpo-score"></span></div>':'')+
      (c.note?'<div class="iwpo-note">'+esc(c.note)+'</div>':'');
    if(!blank)return;
    var score=box.querySelector('.iwpo-score');
    function check(reveal){ var ok=0, n=0;
      [].forEach.call(box.querySelectorAll('.iwpo-grid input'),function(inp){ n++;
        var want=inp.getAttribute('data-a');
        if(reveal)inp.value=want;
        var good=String(inp.value).trim()===want;
        inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwpo-score '+((reveal||ok===n)?'ok':'no'); }
    box.querySelector('[data-po="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── wave: amplitude, wavelength, and what two waves do when they meet ── */
  R.wave=function(box,c){
    box.className='iw iw-card iw-wv';
    var P=pal();
    var ws=(c.waves||[]).map(function(w,i){ return {
      name:String((w&&w.name)||('Onde '+(i+1))),
      A:Math.abs(iwNum(w&&w.amplitude)==null?1:iwNum(w.amplitude)),
      L:Math.abs(iwNum(w&&w.wavelength)==null?4:iwNum(w.wavelength))||4,
      ph:iwNum(w&&w.phase)||0, color:(w&&w.color)||P[i%P.length] }; });
    if(!ws.length)ws=[{name:'Onde 1',A:1,L:4,ph:0,color:P[0]}];
    var sup=(c.superpose!==false)&&ws.length>1, live=(c.interactive!==false);
    var speed=iwNum(c.speed);
    var xmax=iwNum(c.xmax); if(!(xmax>0))xmax=Math.max(8,ws[0].L*2.5);
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwwv-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwwv-plot"></div><div class="iwwv-read"></div>'+
      (live?'<div class="iwwv-ctl"></div>':'')+
      (c.note?'<div class="iwwv-note">'+esc(c.note)+'</div>':'');
    var plot=box.querySelector('.iwwv-plot'), read=box.querySelector('.iwwv-read'), ctl=box.querySelector('.iwwv-ctl');
    var W=680,H=280,PL=46,PR=18,PT=18,PB=38;
    function draw(){
      var amax=0; ws.forEach(function(w){ amax+=w.A; });
      if(sup)amax=Math.max(amax,0.1); else { amax=0; ws.forEach(function(w){ amax=Math.max(amax,w.A); }); }
      amax=amax*1.15||1;
      var X=function(x){ return PL+x/xmax*(W-PL-PR); };
      var Y=function(y){ return PT+(amax-y)/(2*amax)*(H-PT-PB); };
      function y1(w,x){ return w.A*Math.sin(2*Math.PI*x/w.L+w.ph*Math.PI/180); }
      function path(f){ var s='', N=480, i;
        for(i=0;i<=N;i++){ var x=xmax*i/N; s+=(i?'L':'M')+X(x).toFixed(1)+' '+Y(f(x)).toFixed(1); }
        return s; }
      var s='<svg class="iwwv-svg" viewBox="0 0 '+W+' '+H+'" role="img">';
      s+='<line class="iwwv-ax" x1="'+PL+'" y1="'+Y(0)+'" x2="'+(W-PR)+'" y2="'+Y(0)+'"/>'+
        '<line class="iwwv-ax" x1="'+PL+'" y1="'+PT+'" x2="'+PL+'" y2="'+(H-PB)+'"/>';
      var gi; for(gi=0;gi*ws[0].L<=xmax+1e-9;gi++){ var gx=X(gi*ws[0].L);
        s+='<line class="iwwv-gr" x1="'+gx.toFixed(1)+'" y1="'+PT+'" x2="'+gx.toFixed(1)+'" y2="'+(H-PB)+'"/>'; }
      ws.forEach(function(w){ s+='<path class="iwwv-w" style="stroke:'+esc(w.color)+'" d="'+path(function(x){ return y1(w,x); })+'"/>'; });
      if(sup)s+='<path class="iwwv-sum" d="'+path(function(x){ var t=0; ws.forEach(function(w){ t+=y1(w,x); }); return t; })+'"/>';
      // λ is measured crest to crest on the first wave, which is where it is
      // legible; A is the height of that same crest above the axis
      var w0=ws[0], x0=w0.L*(0.25-w0.ph/360); while(x0<0)x0+=w0.L;
      if(x0+w0.L<=xmax){
        var ya=Y(w0.A)-14;
        s+='<line class="iwwv-dim" x1="'+X(x0)+'" y1="'+ya+'" x2="'+X(x0+w0.L)+'" y2="'+ya+'"/>'+
          '<path class="iwwv-dimh" d="M'+X(x0)+' '+ya+' l7 -4 v8 Z"/><path class="iwwv-dimh" d="M'+X(x0+w0.L)+' '+ya+' l-7 -4 v8 Z"/>'+
          '<text class="iwwv-dt" x="'+((X(x0)+X(x0+w0.L))/2).toFixed(1)+'" y="'+(ya-6)+'" text-anchor="middle">λ = '+iwFmt(w0.L,2)+(c.xUnit?' '+esc(c.xUnit):'')+'</text>';
        s+='<line class="iwwv-dim" x1="'+(X(x0)-16)+'" y1="'+Y(0)+'" x2="'+(X(x0)-16)+'" y2="'+Y(w0.A)+'"/>'+
          '<text class="iwwv-dt" x="'+(X(x0)-20)+'" y="'+((Y(0)+Y(w0.A))/2).toFixed(1)+'" text-anchor="end" dominant-baseline="central">A</text>'; }
      s+='<text class="iwwv-al" x="'+(W-PR)+'" y="'+(H-PB+26)+'" text-anchor="end">'+esc(c.xLabel||'distance')+(c.xUnit?' ('+esc(c.xUnit)+')':'')+'</text>';
      s+='</svg>';
      plot.innerHTML=s;
      var chips=ws.map(function(w){
        var bits='λ = '+iwFmt(w.L,2)+(c.xUnit?' '+esc(c.xUnit):'')+' · A = '+iwFmt(w.A,2);
        if(speed>0){ var T=w.L/speed; bits+=' · T = '+iwFmt(T,4)+' s · f = '+iwFmt(1/T,2)+' Hz'; }
        return '<span class="iwwv-chip"><i style="background:'+esc(w.color)+'"></i><b>'+esc(w.name)+'</b>'+bits+'</span>'; });
      if(sup){
        // in phase the crests add, in opposition they cancel — say which it is
        var d=Math.abs(((ws[1].ph-ws[0].ph)%360+360)%360);
        var same=Math.abs(ws[0].L-ws[1].L)<1e-9;
        var verdict=!same?'longueurs d’onde différentes : battement':
          (d<1||d>359?'interférence constructive — les crêtes s’ajoutent':
          (Math.abs(d-180)<1?'interférence destructive — les crêtes s’annulent':'déphasage de '+iwFmt(d,0)+'°'));
        chips.push('<span class="iwwv-chip sum"><i></i><b>Somme</b>'+verdict+'</span>'); }
      read.innerHTML=chips.join('');
      if(speed>0)read.innerHTML+='<div class="iwwv-rel">v = λ / T = λ × f — ici v = '+iwFmt(speed,2)+(c.speedUnit?' '+esc(c.speedUnit):' m/s')+'</div>';
    }
    if(live){
      ctl.innerHTML=ws.map(function(w,i){
        return '<div class="iwwv-row"><span style="color:'+esc(w.color)+'">'+esc(w.name)+'</span>'+
          '<label>A<input type="range" min="0" max="3" step="0.05" value="'+w.A+'" data-w="'+i+'" data-p="A"></label>'+
          '<label>λ<input type="range" min="0.5" max="'+(xmax/1.5).toFixed(2)+'" step="0.05" value="'+w.L+'" data-w="'+i+'" data-p="L"></label>'+
          '<label>φ<input type="range" min="0" max="360" step="5" value="'+w.ph+'" data-w="'+i+'" data-p="ph"></label></div>'; }).join('');
      [].forEach.call(ctl.querySelectorAll('input'),function(r){ r.addEventListener('input',function(){
        var w=ws[+r.getAttribute('data-w')], p=r.getAttribute('data-p');
        w[p]=parseFloat(r.value)||(p==='ph'?0:0.01); draw(); }); }); }
    draw();
  };

  /* ── unit conversion: the ladder table, plus a live converter ── */
  R.unitconvert=function(box,c){
    box.className='iw iw-card iw-uc';
    var FAM={
      length:{n:'Longueurs',cells:1,u:['km','hm','dam','m','dm','cm','mm']},
      mass:{n:'Masses',cells:1,u:['t','q','kg','hg','dag','g','dg','cg','mg']},
      capacity:{n:'Contenances',cells:1,u:['kL','hL','daL','L','dL','cL','mL']},
      area:{n:'Aires',cells:2,u:['km²','hm²','dam²','m²','dm²','cm²','mm²']},
      volume:{n:'Volumes',cells:3,u:['km³','hm³','dam³','m³','dm³','cm³','mm³']},
      time:{n:'Durées',cells:0,u:['j','h','min','s'],f:[86400,3600,60,1]},
      data:{n:'Mémoire',cells:0,u:['To','Go','Mo','ko','o'],f:[1e12,1e9,1e6,1e3,1]}
    };
    var F=FAM[c.family]||FAM.length;
    var units=F.u, ladder=F.cells>0;
    // a decimal ladder is just powers of ten: one cell per step for lengths,
    // two for areas, three for volumes — that is the whole trick of the table
    var fac=F.f||units.map(function(u,i){ return Math.pow(10,(units.length-1-i)*F.cells); });
    var from=units.indexOf(c.from)>=0?units.indexOf(c.from):Math.floor(units.length/2);
    var to=units.indexOf(c.to)>=0?units.indexOf(c.to):Math.max(0,from-1);
    var val=iwNum(c.value); if(val==null)val=1;
    function conv(v,a,b){ return v*fac[a]/fac[b]; }
    function opts(sel){ return units.map(function(u,i){ return '<option value="'+i+'"'+(i===sel?' selected':'')+'>'+esc(u)+'</option>'; }).join(''); }
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwuc-intro">'+esc(c.intro)+'</div>':'')+
      (ladder?'<div class="iwuc-scroll"><table class="iwuc-t"><thead><tr class="iwuc-h"></tr></thead><tbody><tr class="iwuc-d"></tr></tbody></table></div>':'')+
      '<div class="iwuc-conv"><input class="iwuc-v" type="text" inputmode="decimal" value="'+esc(String(c.value==null?1:c.value))+'" aria-label="valeur">'+
      '<select class="iwuc-f" aria-label="unité de départ">'+opts(from)+'</select><span class="iwuc-eq">=</span>'+
      '<b class="iwuc-out"></b><select class="iwuc-t2" aria-label="unité d’arrivée">'+opts(to)+'</select></div>'+
      '<div class="iwuc-say"></div>'+
      ((c.drills&&c.drills.length)?'<div class="iwuc-drill"><div class="iwuc-dh">À compléter</div>'+
        (c.drills||[]).map(function(d,i){
          var a=units.indexOf(d.from), b=units.indexOf(d.to);
          if(a<0||b<0)return '';
          var want=conv(iwNum(d.value)||0,a,b);
          return '<div class="iwuc-dr"><span>'+esc(String(d.value))+' '+esc(units[a])+' =</span>'+
            '<input type="text" inputmode="decimal" data-a="'+want+'" aria-label="résultat"><em>'+esc(units[b])+'</em></div>'; }).join('')+
        '<div class="iwuc-actions"><button type="button" class="iw-btn" data-uc="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwuc-score"></span></div></div>':'')+
      (c.note?'<div class="iwuc-note">'+esc(c.note)+'</div>':'');
    var vin=box.querySelector('.iwuc-v'), fs=box.querySelector('.iwuc-f'), ts=box.querySelector('.iwuc-t2');
    var out=box.querySelector('.iwuc-out'), say=box.querySelector('.iwuc-say');
    function paint(){
      var v=iwNum(vin.value); if(v==null)v=0;
      var a=+fs.value, b=+ts.value, r=conv(v,a,b);
      out.textContent=iwFrNum(r,Math.abs(r)<1?6:3);
      var k=fac[a]/fac[b];
      say.innerHTML=ladder
        ? 'De <b>'+esc(units[a])+'</b> à <b>'+esc(units[b])+'</b> : '+(a<b?'on descend':'on monte')+' de <b>'+Math.abs(a-b)+
          '</b> rang'+(Math.abs(a-b)>1?'s':'')+', donc '+(k>=1?'×':'÷')+' <b>'+iwFrNum(k>=1?k:1/k)+'</b> — la virgule se déplace de <b>'+
          (Math.abs(a-b)*F.cells)+'</b> rang'+(Math.abs(a-b)*F.cells>1?'s':'')+' vers la '+(k>=1?'droite':'gauche')+'.'
        : '1 '+esc(units[a])+' = '+iwFrNum(fac[a]/fac[b],6)+' '+esc(units[b])+'.';
      if(!ladder)return;
      var head='', row='', ci=0;
      var raw=String(v).replace('.',','), ip=(raw.split(',')[0]||'0').replace(new RegExp('[^0-9]','g'),'')||'0';
      var fp=(raw.split(',')[1]||'').replace(new RegExp('[^0-9]','g'),'');
      // the units digit of the source sits in the last cell of its column
      var endCell=(a+1)*F.cells-1, cells=[], n=units.length*F.cells, i;
      for(i=0;i<n;i++)cells.push('');
      for(i=0;i<ip.length;i++){ var kk=endCell-ip.length+1+i; if(kk>=0&&kk<n)cells[kk]=ip.charAt(i); }
      for(i=0;i<fp.length;i++){ var k2=endCell+1+i; if(k2<n)cells[k2]=fp.charAt(i); }
      var toEnd=(b+1)*F.cells-1;
      units.forEach(function(u,ui){
        head+='<th colspan="'+F.cells+'" class="'+(ui===a?'src':'')+(ui===b?' dst':'')+'">'+esc(u)+'</th>';
        for(var q=0;q<F.cells;q++){ var cc=ui*F.cells+q;
          row+='<td class="'+(cc===toEnd?'mark':'')+(cells[cc]?'':' pale')+'">'+(cells[cc]||'0')+'</td>'; } });
      box.querySelector('.iwuc-h').innerHTML=head;
      box.querySelector('.iwuc-d').innerHTML=row; }
    vin.addEventListener('input',paint); fs.addEventListener('change',paint); ts.addEventListener('change',paint);
    paint();
    var score=box.querySelector('.iwuc-score');
    if(score){
      var check=function(reveal){ var ok=0, n2=0;
        [].forEach.call(box.querySelectorAll('.iwuc-dr input'),function(inp){ n2++;
          var want=parseFloat(inp.getAttribute('data-a'));
          // no thousands spacing here: this string goes back into an input the
          // reader may edit, and iwNum only strips ordinary spaces
          if(reveal)inp.value=iwFrNum(want,Math.abs(want)<1?6:3,false);
          var good=String(inp.value).trim()!==''&&iwAnswerOk(inp.value,String(want));
          inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!==''); if(good)ok++; });
        score.textContent=reveal?'Corrigé':(ok+' / '+n2);
        score.className='iwuc-score '+((reveal||ok===n2)?'ok':'no'); };
      box.querySelector('[data-uc="check"]').addEventListener('click',function(){ check(false); });
      box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); }); }
  };

  /* ── energy: an energy chain that can be taken apart ─────────────────────
     An output may itself be made of parts — a flow whose "parent" names another
     flow — so one diagram carries the whole chain: électrique → thermique →
     { utile, pertes }. Click a block that has parts and the view opens it,
     easing from one state to the next instead of jumping, so the reader keeps
     their place.

     The labels are HTML plates laid over the SVG ribbons rather than <text>:
     they wrap instead of being shrunk to fit, they take **gras** and H~2~O, and
     they are real buttons, so the diagram works from the keyboard too. */
  R.energy=function(box,c){
    box.className='iw iw-card iw-en';
    var P=pal(), unit=String(c.unit||'J');
    var raw=(c.flows||[]).filter(function(f){ return f&&String(f.label||'').trim()!==''; });
    if(!raw.length){ box.innerHTML='<div class="iw-err">Aucun flux à représenter.</div>'; return; }

    /* ---- the tree. "parent" may name another flow by its id or its label ---- */
    var N={}, order=[];
    raw.forEach(function(f,ix){
      var key=String(f.id||'').trim()||('f'+ix);
      while(N[key])key=key+'.'+ix;
      N[key]={key:key,label:String(f.label),raw:iwNum(f.value),useful:iwBool(f.useful),
        color:String(f.color||''),note:String(f.note||''),pid:String(f.parent||'').trim(),
        kids:[],parent:null};
      order.push(key); });
    var byKey={}, byLabel={};
    order.forEach(function(k){ byKey[iwNorm(k)]=k;
      if(!byLabel[iwNorm(N[k].label)])byLabel[iwNorm(N[k].label)]=k; });
    order.forEach(function(k){ var p=N[k].pid; if(!p)return;
      var t=byKey[iwNorm(p)]||byLabel[iwNorm(p)];
      if(!t||t===k)return; N[k].parent=N[t]; N[t].kids.push(N[k]); });
    // cut any accidental loop, so no later walk can spin
    order.forEach(function(k){ var w=N[k], g=0;
      while(w&&w.parent){ if(g++>48){ var pr=w.parent; w.parent=null;
          pr.kids=pr.kids.filter(function(x){ return x!==w; }); break; } w=w.parent; } });
    var tops=order.map(function(k){ return N[k]; }).filter(function(n){ return !n.parent; });
    if(!tops.length){ box.innerHTML='<div class="iw-err">Chaque sortie est la partie d’une autre : il n’en reste aucune au premier niveau.</div>'; return; }

    /* ---- amounts. A block with parts and no amount of its own takes theirs -- */
    function val(n){ if(n._v!=null)return n._v;
      n._v=0;                                   // guards a re-entrant call
      var kid=0; n.kids.forEach(function(x){ kid+=val(x); });
      n._kid=kid;
      n._v=(n.raw!=null&&n.raw>0)?Math.abs(n.raw):kid;
      return n._v; }
    order.forEach(function(k){ val(N[k]); });
    var tot=tops.reduce(function(t,n){ return t+n._v; },0);
    var given=iwNum(c.sourceValue), src=(given!=null&&given>0)?given:tot;
    if(!(src>0)){ box.innerHTML='<div class="iw-err">Toutes les quantités sont nulles.</div>'; return; }
    // 2 decimals asked for, but iwFrNum drops the zeros it does not need, so
    // whole numbers still print as "60 J" and not "60,00 J"
    function amount(v){ return iwFrNum(v,2)+' '+unit; }
    function pct(v){ return iwFrNum(v/src*100,1)+' %'; }

    /* ---- colour. A part is a paler wash of whatever it is a part of -------- */
    function rgbOf(h){ h=String(h||'').trim(); if(h.charAt(0)!=='#')return null; h=h.slice(1);
      if(h.length===3)h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
      if(h.length<6)return null;
      var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
      return (isNaN(r)||isNaN(g)||isNaN(b))?null:[r,g,b]; }
    function wash(rgb,amt){ if(!rgb)return null;
      return [Math.round(rgb[0]+(255-rgb[0])*amt),Math.round(rgb[1]+(255-rgb[1])*amt),
        Math.round(rgb[2]+(255-rgb[2])*amt)]; }
    function relL(a){ var f=function(v){ v=v/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); };
      return 0.2126*f(a[0])+0.7152*f(a[1])+0.0722*f(a[2]); }
    function ratio(a,b){ var l1=relL(a),l2=relL(b);
      return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); }
    // Which type colour to use is decided by measured contrast, not by a guess
    // at lightness: white on a mid teal comes out at 2.6:1, which nobody can
    // read, and the same palette swings light and dark with the theme.
    // the two it actually picks between, so the measurement matches the page
    var INKD=[11,14,18], INKL=[255,255,255];
    function inkFor(rgb){ return rgb?(ratio(INKD,rgb)>ratio(INKL,rgb)):false; }
    var pi=0;
    (function tone(list,inherit,depth){ list.forEach(function(n){
        var base=n.color||inherit||(n.useful?cvar('--teal','#5fa39b'):P[(pi++)%P.length]);
        var amt=(n.color||!inherit)?0:Math.min(0.5,depth*0.2);
        var used=wash(rgbOf(base),amt);
        n.base=base; n.fill=used?('rgb('+used[0]+','+used[1]+','+used[2]+')'):base;
        n.depth=depth; n.dark=inkFor(used);
        tone(n.kids,base,depth+1); }); })(tops,'',0);

    /* ---- what counts as useful. A part of something already counted is not
            counted again, so ticking a block and its parts cannot double it. -- */
    var useful=0;
    (function reap(list,inside){ list.forEach(function(n){
        if(n.useful&&!inside)useful+=n._v;
        reap(n.kids,inside||n.useful); }); })(tops,false);

    /* ---- does it add up? --------------------------------------------------- */
    var probs=[];
    order.forEach(function(k){ var n=N[k];
      if(!n.kids.length||!(n.raw!=null&&n.raw>0))return;
      if(Math.abs(n._kid-n._v)>Math.max(1e-9,n._v*0.005))
        probs.push('« '+iwRTx(n.label)+' » vaut '+amount(n._v)+' mais ses parties totalisent '+amount(n._kid)+'.'); });
    if(given!=null&&given>0&&Math.abs(given-tot)>Math.max(1e-9,given*0.005))
      probs.push('Les sorties totalisent '+amount(tot)+' pour '+amount(given)+' reçus : l’énergie ne se conserve pas dans ce schéma.');

    /* ---- shell ------------------------------------------------------------- */
    var eff=useful/src;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwen-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwen-bar"><div class="iwen-crumbs"></div>'+
        '<div class="iwen-zoomer"><button type="button" class="iwen-zb" data-en="out" title="Reculer" aria-label="Reculer">−</button>'+
        '<button type="button" class="iwen-zb iwen-zr" data-en="fit" title="Vue d’ensemble">100 %</button>'+
        '<button type="button" class="iwen-zb" data-en="in" title="Agrandir" aria-label="Agrandir">+</button></div></div>'+
      '<div class="iwen-stage"><div class="iwen-pane"><div class="iwen-zoom">'+
        '<svg class="iwen-svg" aria-hidden="true"></svg><div class="iwen-plates"></div></div></div></div>'+
      '<div class="iwen-detail" hidden></div>'+
      ((iwBool(c.efficiency,true)&&useful>0)?'<div class="iwen-eff"><span>Rendement</span>'+
        '<div class="iwen-track"><i style="width:'+(Math.min(1,eff)*100).toFixed(1)+'%"></i></div>'+
        '<b>η = '+amount(useful)+' / '+amount(src)+' = '+iwFrNum(eff*100,1)+' %</b></div>':'')+
      (probs.length?'<div class="iwen-warn">'+probs.map(function(p){ return '<div>'+esc(p)+'</div>'; }).join('')+'</div>':'')+
      (c.note?'<div class="iwen-note">'+iwRT(c.note)+'</div>':'');

    var stage=box.querySelector('.iwen-stage'), pane=box.querySelector('.iwen-pane'),
        zoom=box.querySelector('.iwen-zoom'), svg=box.querySelector('.iwen-svg'),
        plates=box.querySelector('.iwen-plates'), crumbs=box.querySelector('.iwen-crumbs'),
        detail=box.querySelector('.iwen-detail'), zr=box.querySelector('.iwen-zr');

    /* ---- layout ------------------------------------------------------------ */
    // LMIN: two lines of label plus the amount underneath. A block never gets
    // thinner than its own type; the ribbon still leaves its parent at the true
    // proportional height, so the picture stays honest where it matters.
    var GAP=8, LMIN=58, PAD=4, RIB=76, SRCKEY='@src';
    var srcCol=cvar('--slate','#6b7089');
    var srcNode={key:SRCKEY,label:String(c.sourceLabel||'Énergie reçue'),_v:src,kids:tops,
      fill:srcCol,dark:inkFor(rgbOf(srcCol)),note:'',useful:false,parent:null};
    function reach(list){ var d=0; list.forEach(function(n){ d=Math.max(d,1+reach(n.kids)); }); return d; }
    function leaves(list){ var t=0; list.forEach(function(n){ t+=n.kids.length?leaves(n.kids):1; }); return t||1; }

    function layout(root,avail){
      var cols=1+reach(root.kids);
      var plateW=Math.max(104,Math.min(168,Math.round((avail-(cols-1)*RIB)/cols)));
      var ribW=Math.max(52,Math.round((avail-cols*plateW)/Math.max(1,cols-1)));
      var W=cols*plateW+(cols-1)*ribW;
      var target=Math.max(230,Math.min(560,110+leaves(root.kids)*58));
      var scale=target/(root._v>0?root._v:1);
      // pass 1 — the least height each block needs to stay readable and to hold
      // its own parts; pass 2 — hand the height back out, the slack in proportion
      function least(n){ var h=Math.max(LMIN,n._v*scale);
        if(n.kids.length){ var s=GAP*(n.kids.length-1);
          n.kids.forEach(function(k){ s+=least(k); }); h=Math.max(h,s); }
        n._min=h; return h; }
      function give(n,h){ n._h=h; if(!n.kids.length)return;
        var free=h-GAP*(n.kids.length-1), need=0, sv=0;
        n.kids.forEach(function(k){ need+=k._min; sv+=k._v; });
        var slack=Math.max(0,free-need);
        n.kids.forEach(function(k){ give(k,k._min+slack*(sv>0?k._v/sv:1/n.kids.length)); }); }
      least(root); give(root,root._min);
      var H=root._h+PAD*2, nodes={}, ribs={};
      function put(n,col,y){
        nodes[n.key]={x:col*(plateW+ribW),y:y,w:plateW,h:n._h,a:1,fill:n.fill,dark:!!n.dark,
          label:n.label,v:n._v,note:n.note,kids:n.kids.length,useful:!!n.useful};
        if(!n.kids.length)return;
        var sk=0; n.kids.forEach(function(k){ sk+=k._v; });
        // one unit of value is this many pixels of the parent's edge. When the
        // parts come to less than the whole, the shortfall stays visible as a
        // gap at the foot of the block — that is the point of drawing it.
        var per=n._h/Math.max(n._v,sk||n._v), ay=y, cy=y;
        var x0=col*(plateW+ribW)+plateW, x1=(col+1)*(plateW+ribW);
        n.kids.forEach(function(k){
          var dh=Math.max(1,k._v*per);
          ribs[k.key]={x0:x0,x1:x1,a0:ay,a1:ay+dh,b0:cy,b1:cy+k._h,a:1,fill:k.fill,use:!!k.useful};
          ay+=dh; put(k,col+1,cy); cy+=k._h+GAP; }); }
      put(root,0,PAD);
      return {W:W,H:H,nodes:nodes,ribs:ribs,focus:root.key};
    }

    /* ---- drawing ----------------------------------------------------------- */
    var pathEl={}, plateEl={}, cur=null, focusKey=SRCKEY, selKey='', Z=1, raf=0, wd=0, lastW=0;
    function f1(v){ return Math.round(v*10)/10; }
    function ribD(r){ var m=(r.x0+r.x1)/2;
      return 'M'+f1(r.x0)+' '+f1(r.a0)+' C'+f1(m)+' '+f1(r.a0)+' '+f1(m)+' '+f1(r.b0)+' '+f1(r.x1)+' '+f1(r.b0)+
        ' L'+f1(r.x1)+' '+f1(r.b1)+' C'+f1(m)+' '+f1(r.b1)+' '+f1(m)+' '+f1(r.a1)+' '+f1(r.x0)+' '+f1(r.a1)+' Z'; }
    function plateHTML(n){
      return '<span class="iwen-pl">'+iwRT(n.label)+'</span>'+
        '<span class="iwen-pv">'+esc(amount(n.v))+' · '+esc(pct(n.v))+'</span>'+
        (n.kids?'<span class="iwen-pk">'+n.kids+' partie'+(n.kids>1?'s':'')+'</span>':'');
    }
    function build(g){
      var k, keep={};
      for(k in g.ribs){ keep[k]=1;
        if(!pathEl[k]){ var p=document.createElementNS('http://www.w3.org/2000/svg','path');
          p.setAttribute('class','iwen-f'); svg.appendChild(p); pathEl[k]=p; } }
      for(k in pathEl)if(!keep[k]){ if(pathEl[k].parentNode)pathEl[k].parentNode.removeChild(pathEl[k]); delete pathEl[k]; }
      keep={};
      for(k in g.nodes){ keep[k]=1;
        var n=g.nodes[k], e=plateEl[k];
        if(!e){ e=document.createElement('button'); e.type='button'; e.className='iwen-plate';
          e.setAttribute('data-k',k); plates.appendChild(e); plateEl[k]=e; }
        e.innerHTML=plateHTML(n);
        e.title=iwRTx(n.label)+' — '+amount(n.v)+' ('+pct(n.v)+')'+(n.kids?' · '+n.kids+' parties':''); }
      for(k in plateEl)if(!keep[k]){ if(plateEl[k].parentNode)plateEl[k].parentNode.removeChild(plateEl[k]); delete plateEl[k]; }
    }
    function draw(g){
      svg.setAttribute('viewBox','0 0 '+f1(g.W)+' '+f1(g.H));
      svg.setAttribute('width',f1(g.W)); svg.setAttribute('height',f1(g.H));
      zoom.style.width=f1(g.W)+'px'; zoom.style.height=f1(g.H)+'px';
      pane.style.width=f1(g.W*Z)+'px'; pane.style.height=f1(g.H*Z)+'px';
      var k;
      for(k in g.ribs){ var r=g.ribs[k], p=pathEl[k]; if(!p)continue;
        p.setAttribute('d',ribD(r)); p.style.fill=r.fill;
        p.style.opacity=(r.a*(r.use?0.72:0.5)).toFixed(3); }
      for(k in g.nodes){ var n=g.nodes[k], e=plateEl[k]; if(!e)continue;
        e.style.left=f1(n.x)+'px'; e.style.top=f1(n.y)+'px';
        e.style.width=f1(n.w)+'px'; e.style.height=f1(n.h)+'px';
        e.style.background=n.fill; e.style.opacity=n.a.toFixed(3);
        e.classList.toggle('on-pale',!!n.dark);
        e.classList.toggle('is-focus',k===g.focus);
        e.classList.toggle('is-sel',k===selKey);
        e.classList.toggle('has-parts',!!n.kids&&k!==g.focus);
        e.classList.toggle('sm',n.h<40); e.classList.toggle('xs',n.h<25);
        var lb=e.firstElementChild;
        if(lb){ var room=n.h-11-(n.h>=40?13:0)-((n.kids&&k!==g.focus&&n.h>=54)?12:0);
          lb.style.webkitLineClamp=String(Math.max(1,Math.floor(room/15.7))); }
        e.setAttribute('aria-expanded',(!!n.kids&&k===g.focus)?'true':'false'); }
    }
    function fade(anchor,src){ return {x:anchor.x+anchor.w/2,y:anchor.y+anchor.h/2,w:0,h:0,a:0,
      fill:src.fill,dark:src.dark,label:src.label,v:src.v,note:src.note,kids:src.kids,useful:src.useful}; }
    function fadeR(anchor,src){ var mx=anchor.x+anchor.w, my=anchor.y+anchor.h/2;
      return {x0:mx,x1:mx,a0:my,a1:my,b0:my,b1:my,a:0,fill:src.fill,use:src.use}; }
    function lerp(a,b,t){ return a+(b-a)*t; }
    function blend(A,B,t){
      var g={W:lerp(A.W,B.W,t),H:lerp(A.H,B.H,t),focus:B.focus,nodes:{},ribs:{}}, k;
      for(k in B.nodes){ var a=A.nodes[k], b=B.nodes[k];
        g.nodes[k]={x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),w:lerp(a.w,b.w,t),h:lerp(a.h,b.h,t),
          a:lerp(a.a,b.a,t),fill:b.fill,dark:b.dark,label:b.label,v:b.v,note:b.note,
          kids:b.kids,useful:b.useful}; }
      for(k in B.ribs){ var p=A.ribs[k], q=B.ribs[k];
        g.ribs[k]={x0:lerp(p.x0,q.x0,t),x1:lerp(p.x1,q.x1,t),a0:lerp(p.a0,q.a0,t),a1:lerp(p.a1,q.a1,t),
          b0:lerp(p.b0,q.b0,t),b1:lerp(p.b1,q.b1,t),a:lerp(p.a,q.a,t),fill:q.fill,use:q.use}; }
      return g; }

    var still=false;
    try{ still=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){}

    function show(key,anim){
      var root=(key&&key!==SRCKEY&&N[key])?N[key]:srcNode;
      focusKey=root.key;
      var avail=Math.max(300,(stage.clientWidth||660)-18);
      lastW=stage.clientWidth||0;
      var to=layout(root,avail), from=cur;
      paintCrumbs(); paintDetail();
      if(!from||!anim||still){ build(to); draw(to); cur=to; return; }
      // things arriving grow out of where the new focus used to be; things
      // leaving shrink into where it has landed
      var aPrev=from.nodes[to.focus]||from.nodes[from.focus],
          aNext=to.nodes[to.focus]||to.nodes[from.focus]||from.nodes[from.focus];
      var A={W:from.W,H:from.H,focus:from.focus,nodes:{},ribs:{}},
          B={W:to.W,H:to.H,focus:to.focus,nodes:{},ribs:{}}, k;
      for(k in from.nodes){ A.nodes[k]=from.nodes[k]; B.nodes[k]=to.nodes[k]||fade(aNext,from.nodes[k]); }
      for(k in to.nodes){ B.nodes[k]=to.nodes[k]; if(!A.nodes[k])A.nodes[k]=fade(aPrev,to.nodes[k]); }
      for(k in from.ribs){ A.ribs[k]=from.ribs[k]; B.ribs[k]=to.ribs[k]||fadeR(aNext,from.ribs[k]); }
      for(k in to.ribs){ B.ribs[k]=to.ribs[k]; if(!A.ribs[k])A.ribs[k]=fadeR(aPrev,to.ribs[k]); }
      build(B);
      if(raf)cancelAnimationFrame(raf);
      if(wd)clearTimeout(wd);
      // rAF for the smooth part, and a plain timer that lands the final state
      // whatever happens: rAF does not run at all in a background tab, and a
      // diagram frozen half way between two states would be worse than no
      // animation at all.
      var done=function(){ if(raf){ cancelAnimationFrame(raf); raf=0; } wd=0;
        build(to); draw(to); cur=to; };
      wd=setTimeout(done,540);
      var t0=0;
      var step=function(ts){ if(!wd)return;               // already landed
        if(!t0)t0=ts;
        var t=Math.min(1,(ts-t0)/420);
        var e=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;       // ease in-out cubic
        draw(blend(A,B,e));
        if(t<1)raf=requestAnimationFrame(step); else { raf=0; clearTimeout(wd); done(); } };
      raf=requestAnimationFrame(step);
    }

    function chain(key){ var out=[], n=N[key]; while(n){ out.unshift(n); n=n.parent; } return out; }
    function paintCrumbs(){
      var list=(focusKey===SRCKEY)?[]:chain(focusKey);
      crumbs.innerHTML='<button type="button" class="iwen-cr'+(list.length?'':' now')+'" data-go="'+esc(SRCKEY)+'">'+
        iwRT(srcNode.label)+'</button>'+
        list.map(function(n,ix){ return '<i>›</i><button type="button" class="iwen-cr'+
          (ix===list.length-1?' now':'')+'" data-go="'+esc(n.key)+'">'+iwRT(n.label)+'</button>'; }).join('');
    }
    function paintDetail(){
      var n=selKey&&N[selKey];
      var txt=n?n.note:'';
      if(!txt&&focusKey!==SRCKEY&&N[focusKey])txt=N[focusKey].note;
      if(!txt){ detail.hidden=true; detail.innerHTML=''; return; }
      detail.hidden=false;
      detail.innerHTML='<b>'+iwRT((n&&n.note?n:N[focusKey]).label)+'</b> '+iwRT(txt);
    }

    plates.addEventListener('click',function(ev){
      var e=ev.target.closest?ev.target.closest('.iwen-plate'):null; if(!e)return;
      var k=e.getAttribute('data-k');
      if(k===focusKey){ selKey=k; show(N[k]&&N[k].parent?N[k].parent.key:SRCKEY,true); return; }
      selKey=k;
      if(N[k]&&N[k].kids.length)show(k,true); else { draw(cur); paintDetail(); } });
    crumbs.addEventListener('click',function(ev){
      var e=ev.target.closest?ev.target.closest('.iwen-cr'):null; if(!e)return;
      selKey=''; show(e.getAttribute('data-go'),true); });

    /* ---- zoom. Native scrollbars do the panning, so there is nothing to
            re-implement and it stays usable with a trackpad or a keyboard. --- */
    function setZoom(z,anchor){
      var old=Z; Z=Math.max(0.5,Math.min(3,Math.round(z*20)/20));
      if(Z===old)return;
      var cxr=anchor?anchor.x:0.5, cyr=anchor?anchor.y:0.5;
      var sl=stage.scrollLeft, st=stage.scrollTop, vw=stage.clientWidth, vh=stage.clientHeight;
      pane.style.width=f1(cur.W*Z)+'px'; pane.style.height=f1(cur.H*Z)+'px';
      zoom.style.transform=(Z===1)?'none':('scale('+Z+')');
      zr.textContent=Math.round(Z*100)+' %';
      stage.scrollLeft=(sl+vw*cxr)*(Z/old)-vw*cxr;
      stage.scrollTop=(st+vh*cyr)*(Z/old)-vh*cyr;
      zr.classList.toggle('act',Z!==1); }
    box.querySelector('.iwen-zoomer').addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-en]'):null; if(!b)return;
      var a=b.getAttribute('data-en');
      if(a==='fit'){ Z=1.0001; setZoom(1); stage.scrollLeft=0; }
      else setZoom(Z*(a==='in'?1.25:0.8)); });
    stage.addEventListener('wheel',function(ev){
      if(!ev.ctrlKey&&!ev.metaKey)return;                 // plain scroll still scrolls the page
      ev.preventDefault();
      var r=stage.getBoundingClientRect();
      setZoom(Z*(ev.deltaY<0?1.12:0.9),{x:(ev.clientX-r.left)/Math.max(1,r.width),
        y:(ev.clientY-r.top)/Math.max(1,r.height)}); },{passive:false});

    /* Measured, not scaled: the plates hold real text at a real size, so the
       diagram is re-laid-out when the column changes width. The observer is
       kept on the element or it can be collected while the tab is in the
       background, and the timeouts cover the case where it never fires. */
    function remeasure(){ if(!stage.clientWidth||stage.clientWidth===lastW)return; show(focusKey,false); }
    iwWatch(stage,remeasure);
    show(SRCKEY,false);

  };

  /* ── oscillo: an oscillogram the reader measures ─────────────────────────
     The figure a physics page keeps asking for and that no other element here
     could give: a trace on a graticule with a time base and a sensitivity, and
     two pairs of cursors to drag. Reading a period off the screen and turning
     it into f = 1/T is the whole exercise, so the element does not print the
     frequency anywhere — the reader has to measure it. */
  R.oscillo=function(box,c){
    box.className='iw iw-card iw-os';
    var P=pal();
    var DX=Math.max(4,Math.min(20,Math.round(iwNum(c.divx)||10)));
    var DY=Math.max(4,Math.min(20,Math.round(iwNum(c.divy)||8)));
    var tb=Math.abs(iwNum(c.timebase)||1);            // ms per division
    var vd=Math.abs(iwNum(c.voltdiv)||1);             // V (or the given unit) per division
    var vu=String(c.voltUnit||'V'), tu='ms';
    var chans=(c.channels||[]).map(function(ch,i){ return {
        name:String((ch&&ch.name)||('Voie '+(i+1))), shape:String((ch&&ch.shape)||'sine'),
        amp:Math.abs(iwNum(ch&&ch.amplitude)||1), freq:Math.abs(iwNum(ch&&ch.frequency)||0),
        phase:(iwNum(ch&&ch.phase)||0), off:(iwNum(ch&&ch.offset)||0),
        color:(ch&&ch.color)||P[i%P.length]}; })
      .filter(function(ch){ return ch.freq>0; });
    if(!chans.length){ box.innerHTML='<div class="iw-err">Il faut au moins une voie, avec une fréquence en Hz.</div>'; return; }
    var span=DX*tb;                                    // ms across the screen
    var scope=String(c.screen||'paper')==='scope';
    var W=660, GL=46, GR=14, GT=10, GH=300, GW=W-GL-GR, GB=GT+GH, H=GB+34;
    var px=GW/DX, py=GH/DY, midY=GT+GH/2;
    function wave(ch,t){
      var x=2*Math.PI*ch.freq*(t/1000)+ch.phase*Math.PI/180, s=ch.shape, v;
      if(s==='square')v=Math.sin(x)>=0?1:-1;
      else if(s==='triangle')v=(2/Math.PI)*Math.asin(Math.sin(x));
      else if(s==='saw'){ var u=((x/(2*Math.PI))%1+1)%1; v=2*u-1; }
      else v=Math.sin(x);
      return ch.off+ch.amp*v; }
    function yOf(u){ return midY-(u/vd)*py; }
    var grid='', i;
    for(i=0;i<=DX;i++){ var gx=GL+i*px;
      grid+='<line class="iwos-g'+((i===DX/2)?' mid':'')+'" x1="'+gx.toFixed(1)+'" y1="'+GT+'" x2="'+gx.toFixed(1)+'" y2="'+GB+'"/>'; }
    for(i=0;i<=DY;i++){ var gy=GT+i*py;
      grid+='<line class="iwos-g'+((i===DY/2)?' mid':'')+'" x1="'+GL+'" y1="'+gy.toFixed(1)+'" x2="'+(GL+GW)+'" y2="'+gy.toFixed(1)+'"/>'; }
    var axes='';
    for(i=0;i<=DX;i+=Math.max(1,Math.round(DX/10))) axes+='<text class="iwos-ax" x="'+(GL+i*px).toFixed(1)+'" y="'+(GB+16)+'" text-anchor="middle">'+esc(iwFrNum(i*tb,2))+'</text>';
    axes+='<text class="iwos-ax" x="'+(GL+GW)+'" y="'+(GB+29)+'" text-anchor="end">t ('+esc(tu)+')</text>';
    for(i=0;i<=DY;i+=Math.max(1,Math.round(DY/8))){ var uv=(DY/2-i)*vd;
      axes+='<text class="iwos-ax" x="'+(GL-6)+'" y="'+(GT+i*py+3.5).toFixed(1)+'" text-anchor="end">'+esc(iwFrNum(uv,2))+'</text>'; }
    axes+='<text class="iwos-ax" x="'+(GL-6)+'" y="'+(GT+8)+'" text-anchor="end">'+esc(vu)+'</text>';
    var traces=chans.map(function(ch){
      var pts=[], n=Math.round(GW), k;
      for(k=0;k<=n;k++){ var t=span*(k/n), y=yOf(wave(ch,t));
        pts.push((GL+k*GW/n).toFixed(1)+','+Math.max(GT-40,Math.min(GB+40,y)).toFixed(1)); }
      return '<polyline class="iwos-tr" style="stroke:'+esc(ch.color)+'" points="'+pts.join(' ')+'"/>'; }).join('');
    var showCur=iwBool(c.cursors,true);
    var cur={t1:span*0.2,t2:span*0.5,u1:vd,u2:-vd};
    function curSVG(){
      if(!showCur)return '';
      var x1=GL+cur.t1/span*GW, x2=GL+cur.t2/span*GW, y1=yOf(cur.u1), y2=yOf(cur.u2);
      function vline(id,x){ return '<g class="iwos-cur" data-cur="'+id+'">'+
        '<line class="iwos-cl" x1="'+x.toFixed(1)+'" y1="'+GT+'" x2="'+x.toFixed(1)+'" y2="'+GB+'"/>'+
        '<rect class="iwos-tab" x="'+(x-9).toFixed(1)+'" y="'+(GT-9)+'" width="18" height="11" rx="2.5"/>'+
        '<line class="iwos-hit" x1="'+x.toFixed(1)+'" y1="'+(GT-10)+'" x2="'+x.toFixed(1)+'" y2="'+GB+'"/></g>'; }
      function hline(id,y){ return '<g class="iwos-cur h" data-cur="'+id+'">'+
        '<line class="iwos-cl" x1="'+GL+'" y1="'+y.toFixed(1)+'" x2="'+(GL+GW)+'" y2="'+y.toFixed(1)+'"/>'+
        '<rect class="iwos-tab" x="'+(GL-11)+'" y="'+(y-5.5).toFixed(1)+'" width="11" height="11" rx="2.5"/>'+
        '<line class="iwos-hit" x1="'+(GL-12)+'" y1="'+y.toFixed(1)+'" x2="'+(GL+GW)+'" y2="'+y.toFixed(1)+'"/></g>'; }
      return vline('t1',x1)+vline('t2',x2)+hline('u1',y1)+hline('u2',y2); }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwos-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwos-set"><span>Base de temps <b>'+esc(iwFrNum(tb,3))+' '+esc(tu)+'/div</b></span>'+
      '<span>Sensibilité <b>'+esc(iwFrNum(vd,3))+' '+esc(vu)+'/div</b></span>'+
      chans.map(function(ch){ return '<span class="iwos-ch" style="--cc:'+esc(ch.color)+'">'+iwRT(ch.name)+'</span>'; }).join('')+'</div>'+
      '<svg class="iwos-svg'+(scope?' scope':'')+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Oscillogramme">'+
        '<rect class="iwos-bg" x="'+GL+'" y="'+GT+'" width="'+GW+'" height="'+GH+'"/>'+grid+traces+
        '<g class="iwos-curs">'+curSVG()+'</g>'+axes+'</svg>'+
      (showCur?'<div class="iwos-read"><span>Δt</span><b data-os="dt"></b><span>f = 1/Δt</span><b data-os="f"></b>'+
        '<span>ΔU</span><b data-os="du"></b>'+
        '<button type="button" class="iwm-qbtn" data-os="reset">Replacer les curseurs</button></div>':'')+
      (c.note?'<div class="iwos-note">'+iwRT(c.note)+'</div>':'');
    if(!showCur)return;
    var svg=box.querySelector('.iwos-svg'), host=box.querySelector('.iwos-curs');
    function readout(){
      var dt=Math.abs(cur.t2-cur.t1), du=Math.abs(cur.u2-cur.u1);
      box.querySelector('[data-os="dt"]').textContent=iwFrNum(dt,3)+' '+tu;
      box.querySelector('[data-os="f"]').textContent=dt>0?(iwFrNum(1000/dt,1)+' Hz'):'—';
      box.querySelector('[data-os="du"]').textContent=iwFrNum(du,3)+' '+vu; }
    function repaint(){ host.innerHTML=curSVG(); readout(); }
    var grabbed='';
    function at(ev){ var r=svg.getBoundingClientRect();
      return {x:(ev.clientX-r.left)/Math.max(1,r.width)*W,y:(ev.clientY-r.top)/Math.max(1,r.height)*H}; }
    svg.addEventListener('pointerdown',function(ev){
      var g=ev.target.closest?ev.target.closest('.iwos-cur'):null; if(!g)return;
      grabbed=g.getAttribute('data-cur'); ev.preventDefault();
      try{ svg.setPointerCapture(ev.pointerId); }catch(e){} });
    svg.addEventListener('pointermove',function(ev){
      if(!grabbed)return; var p=at(ev);
      if(grabbed==='t1'||grabbed==='t2')cur[grabbed]=Math.max(0,Math.min(span,(p.x-GL)/GW*span));
      else cur[grabbed]=Math.max(-DY/2*vd,Math.min(DY/2*vd,(midY-p.y)/py*vd));
      repaint(); });
    function drop(){ grabbed=''; }
    svg.addEventListener('pointerup',drop); svg.addEventListener('pointercancel',drop);
    box.querySelector('[data-os="reset"]').addEventListener('click',function(){
      cur.t1=span*0.2; cur.t2=span*0.5; cur.u1=vd; cur.u2=-vd; repaint(); });
    readout();
  };

  /* ── spectrum: continuous, emission and absorption spectra ───────────────
     Wavelengths are turned into colour by the usual approximation, so a raie at
     656 nm comes out the red it should be without the author picking a hex. */
  R.spectrum=function(box,c){
    box.className='iw iw-card iw-sp';
    var kind=String(c.kind||'continuous');
    var lo=iwNum(c.from), hi=iwNum(c.to);
    lo=(lo==null)?380:lo; hi=(hi==null)?780:hi;
    if(hi<=lo){ box.innerHTML='<div class="iw-err">L’intervalle de longueurs d’onde est vide.</div>'; return; }
    var rays=(c.rays||[]).map(function(r,i){ return {nm:iwNum(r&&r.nm),label:String((r&&r.label)||''),
        width:Math.abs(iwNum(r&&r.width)||2),color:String((r&&r.color)||'')}; })
      .filter(function(r){ return r.nm!=null&&r.nm>=lo&&r.nm<=hi; });
    if(kind!=='continuous'&&!rays.length){ box.innerHTML='<div class="iw-err">Un spectre de raies a besoin d’au moins une raie.</div>'; return; }
    function nmCol(w){
      var r=0,g=0,b=0,f=1;
      if(w>=380&&w<440){ r=-(w-440)/60; b=1; }
      else if(w<490){ g=(w-440)/50; b=1; }
      else if(w<510){ g=1; b=-(w-510)/20; }
      else if(w<580){ r=(w-510)/70; g=1; }
      else if(w<645){ r=1; g=-(w-645)/65; }
      else if(w<=780){ r=1; }
      if(w<380||w>780)f=0; else if(w<420)f=0.3+0.7*(w-380)/40; else if(w>700)f=0.3+0.7*(780-w)/80;
      function ch(v){ return Math.round(255*Math.pow(Math.max(0,Math.min(1,v))*f,0.8)); }
      return 'rgb('+ch(r)+','+ch(g)+','+ch(b)+')'; }
    var W=660, PL=8, PR=8, BW=W-PL-PR, BT=8, BH=74, AX=BT+BH, H=AX+38;
    var uid='sp'+(SEQ++);
    function xOf(nm){ return PL+(nm-lo)/(hi-lo)*BW; }
    var stops='', i;
    for(i=0;i<=48;i++){ var w=lo+(hi-lo)*i/48;
      stops+='<stop offset="'+(i/48*100).toFixed(2)+'%" stop-color="'+nmCol(w)+'"/>'; }
    var band='';
    if(kind==='emission'){
      band='<rect x="'+PL+'" y="'+BT+'" width="'+BW+'" height="'+BH+'" fill="#07080b"/>';
      rays.forEach(function(r,ix){ band+='<rect class="iwsp-ray" data-ray="'+ix+'" x="'+(xOf(r.nm)-r.width/2).toFixed(2)+
        '" y="'+BT+'" width="'+r.width.toFixed(2)+'" height="'+BH+'" fill="'+(r.color||nmCol(r.nm))+'"/>'; });
    } else {
      band='<rect x="'+PL+'" y="'+BT+'" width="'+BW+'" height="'+BH+'" fill="url(#'+uid+')"/>';
      if(kind==='absorption')rays.forEach(function(r,ix){ band+='<rect class="iwsp-ray" data-ray="'+ix+'" x="'+(xOf(r.nm)-r.width/2).toFixed(2)+
        '" y="'+BT+'" width="'+r.width.toFixed(2)+'" height="'+BH+'" fill="'+(r.color||'#07080b')+'"/>'; });
    }
    var axis='<line class="iwsp-axl" x1="'+PL+'" y1="'+AX+'" x2="'+(PL+BW)+'" y2="'+AX+'"/>';
    var stepNm=(hi-lo)>400?100:((hi-lo)>150?50:10);
    var first=Math.ceil(lo/stepNm)*stepNm;
    for(i=first;i<=hi;i+=stepNm){ var tx=xOf(i);
      axis+='<line class="iwsp-tk" x1="'+tx.toFixed(1)+'" y1="'+AX+'" x2="'+tx.toFixed(1)+'" y2="'+(AX+5)+'"/>'+
        '<text class="iwsp-tl" x="'+tx.toFixed(1)+'" y="'+(AX+17)+'" text-anchor="middle">'+i+'</text>'; }
    axis+='<text class="iwsp-tl" x="'+(PL+BW)+'" y="'+(AX+31)+'" text-anchor="end">λ (nm)</text>';
    var marks=rays.map(function(r,ix){ return '<g class="iwsp-mk" data-ray="'+ix+'">'+
      '<line x1="'+xOf(r.nm).toFixed(1)+'" y1="'+BT+'" x2="'+xOf(r.nm).toFixed(1)+'" y2="'+(BT-4)+'"/>'+
      '<rect class="iwsp-hit" x="'+(xOf(r.nm)-7).toFixed(1)+'" y="'+BT+'" width="14" height="'+BH+'"/></g>'; }).join('');
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwsp-intro">'+iwRT(c.intro)+'</div>':'')+
      '<svg class="iwsp-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Spectre">'+
      '<defs><linearGradient id="'+uid+'" x1="0" x2="1">'+stops+'</linearGradient></defs>'+
      band+marks+axis+'</svg>'+
      (rays.length?'<div class="iwsp-read" aria-live="polite">Cliquez une raie pour la nommer.</div>':'')+
      (rays.length?'<div class="iwsp-list">'+rays.map(function(r,ix){
        return '<button type="button" class="iwsp-chip" data-ray="'+ix+'"><i style="background:'+
          (r.color||nmCol(r.nm))+'"></i>'+esc(iwFrNum(r.nm,1))+' nm'+(r.label?' · '+iwRT(r.label):'')+'</button>'; }).join('')+'</div>':'')+
      (c.note?'<div class="iwsp-note">'+iwRT(c.note)+'</div>':'');
    if(!rays.length)return;
    var read=box.querySelector('.iwsp-read');
    function pick(ix){ var r=rays[ix]; if(!r)return;
      read.innerHTML='<b>λ = '+esc(iwFrNum(r.nm,1))+' nm</b>'+(r.label?' — '+iwRT(r.label):'');
      [].forEach.call(box.querySelectorAll('.iwsp-chip'),function(b){
        b.classList.toggle('on',b.getAttribute('data-ray')===String(ix)); });
      [].forEach.call(box.querySelectorAll('.iwsp-mk'),function(g){
        g.classList.toggle('on',g.getAttribute('data-ray')===String(ix)); }); }
    box.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-ray]'):null; if(!t)return;
      pick(+t.getAttribute('data-ray')); });
  };

  /* ── algo: an algorithm and the trace table that goes with it ────────────
     Stepping through a program by hand is the exercise; the reader either
     watches the table fill in, or fills it in and gets marked. */
  R.algo=function(box,c){
    box.className='iw iw-card iw-al';
    var lines=String(c.code||'').replace(new RegExp(String.fromCharCode(13),'g'),'').split(String.fromCharCode(10));
    while(lines.length&&!lines[lines.length-1].trim())lines.pop();
    if(!lines.length){ box.innerHTML='<div class="iw-err">Il n’y a pas de programme à dérouler.</div>'; return; }
    var vars=iwList(c.vars);
    var steps=(c.trace||[]).map(function(s){ return {line:Math.round(iwNum(s&&s.line)||0),
      vals:String((s&&s.values)||'').split(',').map(function(x){ return x.trim(); }),
      out:String((s&&s.out)||'')}; });
    var fill=String(c.mode||'watch')==='fill';
    var anyOut=steps.some(function(s){ return s.out!==''; });
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwal-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwal-grid"><ol class="iwal-code">'+lines.map(function(l){
        return '<li><code>'+esc(l)+'</code></li>'; }).join('')+'</ol>'+
      (steps.length?'<div class="iwal-tw"><table class="iwal-t"><thead><tr><th>Étape</th><th>Ligne</th>'+
        vars.map(function(v){ return '<th>'+iwRT(v)+'</th>'; }).join('')+
        (anyOut?'<th>Affiche</th>':'')+'</tr></thead><tbody></tbody></table></div>':'')+
      '</div>'+
      (steps.length?'<div class="iwal-act"><button type="button" class="iwm-qbtn" data-al="prev">◂</button>'+
        '<span class="iwal-n"></span><button type="button" class="iwm-qbtn" data-al="next">▸</button>'+
        '<button type="button" class="iw-btn" data-al="all">Tout dérouler</button>'+
        (fill?'<button type="button" class="iw-btn" data-al="check">'+T('check','Vérifier')+'</button>'+
          '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwal-score"></span>':'')+
        '</div>':'')+
      (c.note?'<div class="iwal-note">'+iwRT(c.note)+'</div>':'');
    if(!steps.length)return;
    var tb=box.querySelector('.iwal-t tbody'), at=0, score=box.querySelector('.iwal-score');
    function row(s,ix){
      return '<tr data-s="'+ix+'"><td>'+(ix+1)+'</td><td class="iwal-ln">'+(s.line||'—')+'</td>'+
        vars.map(function(v,vi){ var a=s.vals[vi]==null?'':s.vals[vi];
          return '<td>'+(fill?'<input type="text" data-a="'+esc(a)+'" aria-label="'+esc(iwRTx(v))+' étape '+(ix+1)+'">':esc(a))+'</td>'; }).join('')+
        (anyOut?'<td class="iwal-out">'+esc(s.out)+'</td>':'')+'</tr>'; }
    var built=false;
    function paint(){
      // In fill mode the whole table is there from the start and is built once:
      // re-rendering it on every step would wipe what the reader has typed.
      if(fill){ if(!built){ tb.innerHTML=steps.map(row).join(''); built=true; }
        [].forEach.call(tb.children,function(tr,ix){ tr.classList.toggle('now',ix===at-1); }); }
      else tb.innerHTML=steps.slice(0,at).map(row).join('');
      box.querySelector('.iwal-n').textContent=at+' / '+steps.length;
      var ln=at>0?steps[at-1].line:0;
      [].forEach.call(box.querySelectorAll('.iwal-code li'),function(li,ix){
        li.classList.toggle('on',ix+1===ln); });
      if(score){ score.textContent=''; score.className='iwal-score'; } }
    box.querySelector('.iwal-act').addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-al],[data-q]'):null; if(!b)return;
      var a=b.getAttribute('data-al');
      if(a==='next'){ at=Math.min(steps.length,at+1); paint(); }
      else if(a==='prev'){ at=Math.max(0,at-1); paint(); }
      else if(a==='all'){ at=steps.length; paint(); }
      else if(a==='check'||b.getAttribute('data-q')==='show'){
        var reveal=b.getAttribute('data-q')==='show';
        if(reveal&&at<steps.length){ at=steps.length; paint(); }
        var ok=0,n=0;
        [].forEach.call(box.querySelectorAll('.iwal-t input'),function(inp){ n++;
          var want=inp.getAttribute('data-a');
          if(reveal)inp.value=want;
          var good=iwAnswerOk(inp.value,want);
          inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!=='');
          if(good)ok++; });
        if(score){ score.textContent=reveal?'Corrigé':(ok+' / '+n);
          score.className='iwal-score '+((reveal||ok===n)?'ok':'no'); } } });
    // the "Corrigé" button carries data-q="show", so iwAutoAnswers already
    // wires it to the book-wide answer key — nothing to register here.
    // On paper a half-stepped table would be a mistake, so printing a watch
    // table unrolls it first; a fill table is left empty on purpose.
    if(!fill&&window.addEventListener)window.addEventListener('beforeprint',function(){
      at=steps.length; paint(); });
    paint();
  };

  /* ── avancement: the advancement table ──────────────────────────────────
     The table every French chemistry course is built on. Give the species,
     their stoichiometric coefficients and what you start with; the element
     works out the maximum advancement, names the limiting reactant and fills
     the final state. In "fill" mode the reader does that themselves. */
  R.avancement=function(box,c){
    box.className='iw iw-card iw-av';
    var sp=(c.species||[]).map(function(s,i){ return {
        name:String((s&&s.name)||('Espèce '+(i+1))),
        side:(String((s&&s.side)||'reactif').toLowerCase().charAt(0)==='p')?'p':'r',
        coef:Math.abs(iwNum(s&&s.coef)||1),
        n0:Math.max(0,iwNum(s&&s.n0)||0)}; })
      .filter(function(s){ return s.name!==''; });
    if(sp.length<2){ box.innerHTML='<div class="iw-err">Il faut au moins un réactif et un produit.</div>'; return; }
    var re=sp.filter(function(s){ return s.side==='r'; });
    if(!re.length){ box.innerHTML='<div class="iw-err">Aucun réactif : précisez le côté de chaque espèce.</div>'; return; }
    var unit=String(c.unit||'mol');
    // xmax is set by whichever reactant runs out first
    var xmax=Infinity, limit=null;
    re.forEach(function(s){ var x=(s.coef>0)?(s.n0/s.coef):Infinity;
      if(x<xmax){ xmax=x; limit=s; } });
    if(!isFinite(xmax)){ xmax=0; }
    function amount(s,x){ return (s.side==='r')?(s.n0-s.coef*x):(s.n0+s.coef*x); }
    function num(v){ return iwFrNum(v,4); }
    function term(s){
      var k=(s.coef===1)?'':(iwFrNum(s.coef,3)+' ');
      var sign=(s.side==='r')?' − ':' + ';
      return (s.n0?num(s.n0):'0')+sign+k+'x'; }
    var eq=String(c.equation||'')||
      re.map(function(s){ return (s.coef===1?'':iwFrNum(s.coef,3)+' ')+s.name; }).join(' + ')+' → '+
      sp.filter(function(s){ return s.side==='p'; }).map(function(s){ return (s.coef===1?'':iwFrNum(s.coef,3)+' ')+s.name; }).join(' + ');
    var fill=String(c.mode||'watch')==='fill';
    function cell(v,key){ return fill?('<input type="text" data-a="'+esc(String(v))+'" data-k="'+key+'" aria-label="'+esc(key)+'">'):esc(num(v)); }
    var head='<tr><th>État</th><th>Avancement</th>'+sp.map(function(s){
      return '<th>'+iwRT(s.name)+'</th>'; }).join('')+'</tr>';
    var rowI='<tr><td>initial</td><td class="iwav-x">x = 0</td>'+sp.map(function(s){
      return '<td>'+esc(num(s.n0))+'</td>'; }).join('')+'</tr>';
    var rowE='<tr><td>en cours</td><td class="iwav-x">x</td>'+sp.map(function(s){
      return '<td class="iwav-sym">'+esc(term(s))+'</td>'; }).join('')+'</tr>';
    var rowF='<tr class="iwav-final"><td>final</td><td class="iwav-x">x = x<sub>max</sub>'+
      (fill?' = <input type="text" data-a="'+esc(String(xmax))+'" data-k="xmax" aria-label="xmax">':' = '+esc(num(xmax)))+'</td>'+
      sp.map(function(s,i){ return '<td>'+cell(amount(s,xmax),'f'+i)+'</td>'; }).join('')+'</tr>';
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwav-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwav-eq">'+iwRT(eq)+'</div>'+
      '<div class="iwav-tw"><table class="iwav-t"><thead>'+head+'</thead><tbody>'+rowI+rowE+rowF+'</tbody></table></div>'+
      (fill?'<div class="iwav-actions"><button type="button" class="iw-btn" data-av="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwav-score"></span></div>':'')+
      ((c.conclusion!==false)?'<div class="iwav-say'+(fill?' hid':'')+'"><b>x<sub>max</sub> = '+esc(num(xmax))+' '+esc(unit)+'</b>'+
        (limit?' — le réactif limitant est <b>'+iwRT(limit.name)+'</b>.':'')+
        (re.length>1&&limit?' Les réactifs sont '+(re.every(function(s){ return Math.abs(s.n0/s.coef-xmax)<1e-9; })?'introduits dans les <b>proportions stœchiométriques</b>.':'introduits hors des proportions stœchiométriques.'):'')+
        '</div>':'')+
      (c.note?'<div class="iwav-note">'+iwRT(c.note)+'</div>':'');
    if(!fill)return;
    var score=box.querySelector('.iwav-score'), say=box.querySelector('.iwav-say');
    function check(reveal){ var ok=0,n=0;
      [].forEach.call(box.querySelectorAll('.iwav-t input'),function(inp){ n++;
        var want=inp.getAttribute('data-a');
        if(reveal)inp.value=iwFrNum(parseFloat(want),4);
        var good=String(inp.value).trim()!==''&&iwAnswerOk(inp.value,want);
        inp.classList.toggle('ok',good); inp.classList.toggle('no',!good&&String(inp.value).trim()!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwav-score '+((reveal||ok===n)?'ok':'no');
      if(say&&(reveal||ok===n))say.classList.remove('hid'); }
    box.querySelector('[data-av="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
  };

  /* ── hazard: the SGH diamonds and the H/P statements ─────────────────────
     Drawn rather than photographed, so they stay sharp and weigh nothing. */
  var SGH={
    explosif:['SGH01','Explosif','<circle cx="0" cy="5" r="6.5" fill="currentColor" stroke="none"/><path d="M0-12 1.6-6 6-8.5 3.6-4 9-3 4 0z" fill="currentColor" stroke="none"/><path d="M-9-6l2.5 2M-11 1l3 .6M8-9l-2 2.5" stroke-width="1.5"/>'],
    inflammable:['SGH02','Inflammable','<path d="M0-11c2 5-3 6-3 10 0 3 2 5 3 7 1-2 4-3 4-6 0-2-1-3-1-3 3 2 5 5 5 8 0 5-4 9-8 9s-9-4-9-9c0-8 9-9 9-16z" fill="currentColor" stroke="none"/>'],
    comburant:['SGH03','Comburant','<circle cx="0" cy="6" r="6"/><path d="M0-11c1 5-4 7-4 11 0 3 2 5 4 6 2-1 4-3 4-6 0-4-5-6-4-11z" fill="currentColor" stroke="none"/>'],
    gaz:['SGH04','Gaz sous pression','<path d="M-5.5-6c0-2 1.4-3.4 5.5-3.4S5.5-8 5.5-6v13a5.5 5.5 0 0 1-11 0z" fill="currentColor" stroke="none"/><path d="M-2-12.5h4v3.2h-4z" fill="currentColor" stroke="none"/><path d="M-5.5-3.5h11" stroke="#fff" stroke-width="1.3"/>'],
    corrosif:['SGH05','Corrosif','<path d="M-9.6-9.6l3.1-1.7 4.2 7.8-3.1 1.7z" fill="currentColor" stroke="none"/><path d="M-4.8-1.4l-1.1 3.1M-6.4-.8l-.7 2.1" stroke-width="1.3"/><path d="M-15 5.5h11.5l-1.8-2.6-1.7 1.6-1.8-1.9-1.7 1.7-1.6-1.4z" fill="currentColor" stroke="none"/><path d="M-15 5.5h11.5v3.4H-15z" fill="currentColor" stroke="none"/><path d="M9.6-9.6l-3.1-1.7-4.2 7.8 3.1 1.7z" fill="currentColor" stroke="none"/><path d="M4.8-1.4l1.1 3.1M6.4-.8l.7 2.1" stroke-width="1.3"/><path d="M4.6 5.2c-.5-2 .8-2.9 1.7-1.6l1 1.5V-.6c0-1.8 2.4-1.8 2.4 0v3.9c0-1.7 2.3-1.7 2.3 0v.8c0-1.5 2.1-1.5 2.1.1v3.1c0 2.6-1.7 4.3-4.4 4.3-2.3 0-3.4-.9-4.2-2.6z" fill="currentColor" stroke="none"/>'],
    toxique:['SGH06','Toxique','<circle cx="0" cy="-3" r="7"/><circle cx="-2.6" cy="-4" r="1.6" fill="currentColor" stroke="none"/><circle cx="2.6" cy="-4" r="1.6" fill="currentColor" stroke="none"/><path d="M-2 1h4" stroke-width="1.4"/><path d="M-9 7 9 13M9 7-9 13" stroke-width="2.2"/>'],
    nocif:['SGH07','Nocif / irritant','<path d="M0-9v12" stroke-width="3.4"/><circle cx="0" cy="8" r="2" fill="currentColor" stroke="none"/>'],
    sante:['SGH08','Danger pour la santé','<circle cx="0" cy="-9" r="4" fill="currentColor" stroke="none"/><path d="M-2.4-6.4h4.8v4.6h-4.8z" fill="currentColor" stroke="none"/><path d="M-10 13c0-8.6 3.9-13.2 10-13.2s10 4.6 10 13.2z" fill="currentColor" stroke="none"/><path d="M0 2.2l1.7 3.4 3.8-.6-2.1 3.2 2.1 3.2-3.8-.6L0 14.2l-1.7-3.4-3.8.6 2.1-3.2-2.1-3.2 3.8.6z" fill="#fff" stroke="none"/>'],
    environnement:['SGH09','Danger pour l’environnement','<path d="M-14 1.5h28" stroke-width="1.5"/><path d="M-7.5 1.5v-13" stroke-width="2.2"/><path d="M-7.5-8.4l-4.2-3.1M-7.5-4.6l4-3M-7.5-11.2l3-2.2" stroke-width="1.5"/><path d="M2.5 8.5c3.4-4.2 9-4.2 11.5 0-2.5 4.2-8.1 4.2-11.5 0z" fill="currentColor" stroke="none"/><path d="M2.5 8.5-2 5.2v6.6z" fill="currentColor" stroke="none"/><path d="M9.2 7.1l2 2M11.2 7.1l-2 2" stroke="#fff" stroke-width="1.15"/>'],
  };
  R.hazard=function(box,c){
    box.className='iw iw-card iw-hz';
    var want=iwList(c.pictograms).map(function(s){ return iwNorm(s); });
    var keys=Object.keys(SGH);
    var picked=[];
    want.forEach(function(w){
      var hit=null;
      keys.forEach(function(k){ if(hit)return;
        if(iwNorm(k)===w||iwNorm(SGH[k][0])===w||iwNorm(SGH[k][1]).indexOf(w)===0)hit=k; });
      if(hit&&picked.indexOf(hit)<0)picked.push(hit); });
    var st=(c.statements||[]).map(function(s){ return {code:String((s&&s.code)||'').trim(),
      text:String((s&&s.text)||'').trim()}; }).filter(function(s){ return s.code||s.text; });
    if(!picked.length&&!st.length){ box.innerHTML='<div class="iw-err">Indiquez au moins un pictogramme ou une phrase de danger.</div>'; return; }
    function dia(k){ var d=SGH[k];
      return '<figure class="iwhz-p" title="'+esc(d[1])+'">'+
        '<svg viewBox="-24 -24 48 48" role="img" aria-label="'+esc(d[0]+' — '+d[1])+'">'+
        '<path class="iwhz-dm" d="M0-22 22 0 0 22-22 0Z"/>'+
        '<g class="iwhz-gl" transform="translate(0,1)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">'+d[2]+'</g>'+
        '</svg><figcaption>'+esc(d[1])+'</figcaption></figure>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.product?'<div class="iwhz-prod">'+iwRT(c.product)+'</div>':'')+
      (picked.length?'<div class="iwhz-row">'+picked.map(dia).join('')+'</div>':'')+
      (st.length?'<dl class="iwhz-st">'+st.map(function(s){
        return '<div class="'+(/^P/i.test(s.code)?'p':'h')+'"><dt>'+esc(s.code)+'</dt><dd>'+iwRT(s.text)+'</dd></div>'; }).join('')+'</dl>':'')+
      (c.note?'<div class="iwhz-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── truefalse: vrai / faux / non mentionné, justified from the text ───── */
  R.truefalse=function(box,c){
    box.className='iw iw-card iw-tf';
    var three=String(c.mode||'tf')==='tfn';
    var opts=three?['Vrai','Faux','Non mentionné']:['Vrai','Faux'];
    var cl=(c.claims||[]).map(function(s,i){ return {text:String((s&&s.text)||''),
      answer:iwNorm(String((s&&s.answer)||'')),quote:String((s&&s.quote)||'')}; })
      .filter(function(s){ return s.text!==''; });
    if(!cl.length){ box.innerHTML='<div class="iw-err">Aucune affirmation à juger.</div>'; return; }
    function want(a){
      if(a.indexOf('v')===0||a==='true'||a==='t')return 0;
      if(a.indexOf('f')===0)return 1;
      return three?2:1; }
    var uid=++SEQ;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwtf-intro">'+iwRT(c.intro)+'</div>':'')+
      '<ol class="iwtf-list">'+cl.map(function(s,i){
        return '<li class="iwtf-i"><div class="iwtf-q">'+iwRT(s.text)+'</div>'+
          '<div class="iwtf-opts">'+opts.map(function(o,oi){
            return '<label class="iwtf-o"><input type="radio" name="tf'+uid+'_'+i+'" value="'+oi+'"><span>'+esc(o)+'</span></label>'; }).join('')+'</div>'+
          (s.quote?'<div class="iwtf-j" hidden><b>Justification</b> '+iwRT(s.quote)+'</div>':'')+'</li>'; }).join('')+'</ol>'+
      '<div class="iwtf-actions"><button type="button" class="iw-btn" data-tf="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwtf-score"></span></div>'+
      (c.note?'<div class="iwtf-note">'+iwRT(c.note)+'</div>':'');
    var score=box.querySelector('.iwtf-score');
    function run(reveal){ var ok=0;
      [].forEach.call(box.querySelectorAll('.iwtf-i'),function(li,i){
        var w=want(cl[i].answer);
        var ins=li.querySelectorAll('input');
        if(reveal&&ins[w])ins[w].checked=true;
        var got=-1; [].forEach.call(ins,function(x,xi){ if(x.checked)got=xi; });
        var good=got===w;
        li.classList.toggle('ok',good); li.classList.toggle('no',got>=0&&!good);
        var j=li.querySelector('.iwtf-j'); if(j&&(reveal||got>=0))j.hidden=false;
        if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+cl.length);
      score.className='iwtf-score '+((reveal||ok===cl.length)?'ok':'no'); }
    box.querySelector('[data-tf="check"]').addEventListener('click',function(){ run(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ run(true); });
  };

  /* ── reflexes: what the question asks, and what you have to do ──────────
     The method rail of a revision page. Each move is numbered so the exercises
     can point back at it: "utiliser le réflexe 2". */
  R.reflexes=function(box,c){
    box.className='iw iw-card iw-rf';
    var mv=(c.moves||[]).map(function(m){ return {ask:String((m&&m.ask)||''),
      steps:String((m&&m.steps)||''),link:String((m&&m.link)||'')}; })
      .filter(function(m){ return m.ask||m.steps; });
    if(!mv.length){ box.innerHTML='<div class="iw-err">Aucun réflexe à présenter.</div>'; return; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwrf-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwrf-head"><span>'+esc(c.askLabel||'Si l’énoncé demande de…')+'</span>'+
      '<span>'+esc(c.stepLabel||'Il est nécessaire de…')+'</span></div>'+
      '<div class="iwrf-rows">'+mv.map(function(m,i){
        // iwLines, not iwList: a step is a sentence and may well contain a
        // comma — "1,0 L" would otherwise become two steps
        var steps=iwLines(m.steps);
        return '<div class="iwrf-r"><div class="iwrf-ask">'+iwRT(m.ask)+'</div>'+
          '<div class="iwrf-do"><div class="iwrf-badge">Réflexe '+(i+1)+
          (m.link?'<i>'+iwRT(m.link)+'</i>':'')+'</div>'+
          '<ul>'+steps.map(function(s){ return '<li>'+iwRT(s)+'</li>'; }).join('')+'</ul></div></div>'; }).join('')+'</div>'+
      (c.note?'<div class="iwrf-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── twotier: one problem, two ways in ──────────────────────────────────
     The compact statement for a reader who can go straight at it, the detailed
     one for a reader who needs the steps. Same problem, same answer. */
  R.twotier=function(box,c){
    box.className='iw iw-card iw-tt';
    var compact=String(c.compact||'').trim();
    // one question per line, and only per line — the questions are prose and
    // French decimals put commas inside them
    var detail=iwLines(c.detailed);
    if(!compact&&!detail.length){ box.innerHTML='<div class="iw-err">Il faut au moins un énoncé.</div>'; return; }
    var start=(String(c.start||'compact')==='detailed'&&detail.length)?1:0;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      iwMeta(c)+
      (c.context?'<div class="iwtt-ctx">'+iwRT(c.context)+'</div>':'')+
      '<div class="iwtt-tabs" role="tablist">'+
        (compact?'<button type="button" class="iwtt-tab'+(start===0?' on':'')+'" data-tt="0" role="tab">'+esc(c.compactLabel||'Énoncé compact')+'</button>':'')+
        (detail.length?'<button type="button" class="iwtt-tab'+(start===1?' on':'')+'" data-tt="1" role="tab">'+esc(c.detailedLabel||'Énoncé détaillé')+'</button>':'')+
      '</div>'+
      (c.hint?'<div class="iwtt-hint">'+iwRT(c.hint)+'</div>':'')+
      '<div class="iwtt-pane'+(start===0?' on':'')+'" data-pane="0">'+iwRT(compact)+'</div>'+
      '<div class="iwtt-pane'+(start===1?' on':'')+'" data-pane="1"><ol>'+
        detail.map(function(q){ return '<li>'+iwRT(q)+'</li>'; }).join('')+'</ol></div>'+
      (c.data?'<div class="iwtt-data"><b>Données</b> '+iwRT(c.data)+'</div>':'')+
      (c.note?'<div class="iwtt-note">'+iwRT(c.note)+'</div>':'');
    box.querySelector('.iwtt-tabs').addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-tt]'):null; if(!b)return;
      var k=b.getAttribute('data-tt');
      [].forEach.call(box.querySelectorAll('.iwtt-tab'),function(t){ t.classList.toggle('on',t===b); });
      [].forEach.call(box.querySelectorAll('.iwtt-pane'),function(p){
        p.classList.toggle('on',p.getAttribute('data-pane')===k); }); });
  };

  /* ── phonetics: transcription and word stress ───────────────────────────
     No audio, on purpose: a book that has to work offline cannot lean on it,
     and marking the stressed syllable is a written exercise anyway. Syllables
     are separated with a hyphen or a middle dot. */
  R.phonetics=function(box,c){
    box.className='iw iw-card iw-ph';
    var quiz=String(c.mode||'show')==='quiz';
    var SEP=new RegExp('[-'+String.fromCharCode(0xB7)+String.fromCharCode(0x2027)+'/]');
    var ws=(c.sounds||[]).map(function(w){ return {word:String((w&&w.word)||''),
      ipa:String((w&&w.ipa)||''),stress:Math.round(iwNum(w&&w.stress)||0),
      note:String((w&&w.note)||'')}; }).filter(function(w){ return w.word!==''; });
    if(!ws.length){ box.innerHTML='<div class="iw-err">Aucun mot à transcrire.</div>'; return; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwph-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwph-list">'+ws.map(function(w,i){
        var syl=w.word.split(SEP).map(function(s){ return s.trim(); }).filter(function(s){ return s!==''; });
        var cells=syl.map(function(s,si){
          var on=(!quiz&&w.stress===si+1)?' on':'';
          return quiz?('<button type="button" class="iwph-syl" data-w="'+i+'" data-s="'+(si+1)+'">'+esc(s)+'</button>')
            :('<span class="iwph-syl'+on+'">'+esc(s)+'</span>'); }).join('<i>·</i>');
        return '<div class="iwph-w" data-w="'+i+'"><div class="iwph-sy">'+cells+'</div>'+
          (w.ipa?'<div class="iwph-ipa">/'+esc(w.ipa)+'/</div>':'')+
          (w.note?'<div class="iwph-note-w">'+iwRT(w.note)+'</div>':'')+'</div>'; }).join('')+'</div>'+
      (quiz?'<div class="iwph-actions"><span class="iwph-say">Cliquez la syllabe accentuée de chaque mot.</span>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button><span class="iwph-score"></span></div>':'')+
      (c.note?'<div class="iwph-note">'+iwRT(c.note)+'</div>':'');
    if(!quiz)return;
    var picked={}, score=box.querySelector('.iwph-score');
    function mark(reveal){ var ok=0,n=0;
      ws.forEach(function(w,i){ if(!w.stress)return; n++;
        var got=reveal?w.stress:picked[i];
        if(got===w.stress)ok++;
        [].forEach.call(box.querySelectorAll('.iwph-syl[data-w="'+i+'"]'),function(b){
          var s=+b.getAttribute('data-s');
          b.classList.toggle('on',s===got);
          b.classList.toggle('ok',reveal?s===w.stress:(s===got&&got===w.stress));
          b.classList.toggle('no',s===got&&got!==w.stress&&!reveal); }); });
      if(n){ score.textContent=reveal?'Corrigé':(ok+' / '+n);
        score.className='iwph-score '+((reveal||ok===n)?'ok':'no'); } }
    box.addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('.iwph-syl'):null; if(!b)return;
      picked[+b.getAttribute('data-w')]=+b.getAttribute('data-s'); mark(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ mark(true); });
  };

  /* ── formula: an equation with its symbols named ─────────────────────────
     The single most repeated figure in a science textbook: the expression in
     the middle and, around it, a label per symbol saying what it is and in what
     unit, joined by a curved leader. Ten of them in three pages of the chapter
     this was written for.

     The equation is a row of tokens; a label names the token it points at, so
     nothing has to be positioned by hand and it re-aims itself when the column
     changes width. */
  R.formula=function(box,c){
    box.className='iw iw-card iw-fo';
    var toks=String(c.expr||'').trim().split(new RegExp('[ ]+')).filter(function(t){ return t!==''; });
    if(!toks.length){ box.innerHTML='<div class="iw-err">Écrivez l’expression, les symboles séparés par des espaces.</div>'; return; }
    var labs=(c.labels||[]).map(function(l){ return {at:String((l&&l.at)||'').trim(),
      text:String((l&&l.text)||''),side:(String((l&&l.side)||'up').toLowerCase()==='down')?'down':'up'}; })
      .filter(function(l){ return l.text!==''; });
    // resolve each label to a token: by 1-based position, else by exact text,
    // and never twice to the same token so repeated symbols line up in order
    var used={};
    labs.forEach(function(l){
      var n=parseInt(l.at,10);
      if(!isNaN(n)&&String(n)===l.at&&n>=1&&n<=toks.length){ l.i=n-1; used[l.i]=1; return; }
      var hit=-1;
      toks.forEach(function(t,i){ if(hit<0&&!used[i]&&t===l.at)hit=i; });
      if(hit<0)toks.forEach(function(t,i){ if(hit<0&&!used[i]&&t.indexOf(l.at)>=0&&l.at!=='')hit=i; });
      l.i=hit; if(hit>=0)used[hit]=1; });
    var up=labs.filter(function(l){ return l.side==='up'&&l.i>=0; });
    var dn=labs.filter(function(l){ return l.side==='down'&&l.i>=0; });
    var orphan=labs.filter(function(l){ return l.i<0; });
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwfo-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwfo-stage">'+
        '<svg class="iwfo-lead" aria-hidden="true"></svg>'+
        '<div class="iwfo-band up">'+up.map(function(l,k){
          return '<span class="iwfo-l" data-l="u'+k+'">'+iwRT(l.text)+'</span>'; }).join('')+'</div>'+
        '<div class="iwfo-eq">'+toks.map(function(t,i){
          return '<span class="iwfo-tk" data-t="'+i+'">'+iwRT(t)+'</span>'; }).join('')+'</div>'+
        '<div class="iwfo-band down">'+dn.map(function(l,k){
          return '<span class="iwfo-l" data-l="d'+k+'">'+iwRT(l.text)+'</span>'; }).join('')+'</div>'+
      '</div>'+
      (orphan.length?'<div class="iwfo-orphan">Sans cible dans l’expression : '+
        orphan.map(function(l){ return esc(l.at||l.text); }).join(', ')+'</div>':'')+
      (c.note?'<div class="iwfo-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwfo-stage'), svg=box.querySelector('.iwfo-lead');
    var bandUp=box.querySelector('.iwfo-band.up'), bandDn=box.querySelector('.iwfo-band.down');
    var ROW=21, PAD=5;                       // one row of label, and the gap between two
    /* Aim each label at its token, then stack: a label that would sit on top of
       one already placed moves to the next row out. Three labels over a short
       formula therefore end up on three rows rather than on top of each other,
       and the leaders lengthen to follow. Nothing is ever hidden or clipped. */
    function lay(list,pre,band,down,sr,w){
      var rows=[];                            // rows[k] = list of [left,right] taken
      // widest first: the long labels get the room they need, the short ones tuck in
      var order=list.map(function(l,k){ return {l:l,k:k}; });
      order.sort(function(a,b){
        var A=stage.querySelector('[data-l="'+pre+a.k+'"]'), B=stage.querySelector('[data-l="'+pre+b.k+'"]');
        return (B?B.offsetWidth:0)-(A?A.offsetWidth:0); });
      var rowH=[];
      order.forEach(function(o){
        var el2=stage.querySelector('[data-l="'+pre+o.k+'"]'),
            tk=stage.querySelector('[data-t="'+o.l.i+'"]');
        if(!el2||!tk)return;
        // a label longer than the whole column has to wrap — nothing else can
        // be done with it, and wrapping beats a horizontal scrollbar
        // scrollWidth, not offsetWidth: max-width caps the box, so the box is
        // never "too wide" — it is the text inside it that overflows
        el2.classList.remove('wrap');
        if(el2.scrollWidth>w)el2.classList.add('wrap');
        var tr=tk.getBoundingClientRect();
        var tx=tr.left-sr.left+tr.width/2;
        var lw=Math.min(el2.offsetWidth,w);
        var left=Math.max(0,Math.min(Math.max(0,w-lw),tx-lw/2));
        var right=left+lw, r=0;
        while(true){
          var clash=false, i;
          rows[r]=rows[r]||[];
          for(i=0;i<rows[r].length;i++){
            if(left<rows[r][i][1]+PAD&&right>rows[r][i][0]-PAD){ clash=true; break; } }
          if(!clash)break;
          r++;
          if(r>list.length+2)break;           // cannot happen, but never spin
        }
        rows[r].push([left,right]);
        rowH[r]=Math.max(rowH[r]||0,el2.offsetHeight);
        el2.__row=r; el2.style.left=left+'px';
      });
      // stack the rows by the height each one actually needs, so a wrapped
      // label gets its two lines instead of being sat on by the next row
      var off=[], acc=0, ri;
      for(ri=0;ri<rows.length;ri++){ off[ri]=acc; acc+=(rowH[ri]||ROW)+2; }
      order.forEach(function(o){ var el2=stage.querySelector('[data-l="'+pre+o.k+'"]');
        if(el2&&el2.__row!=null)el2.style[down?'top':'bottom']=off[el2.__row]+'px'; });
      band.style.height=Math.max(acc,list.length?ROW:0)+'px'; }
    function place(){
      var w=stage.clientWidth; if(!w)return;
      var sr=stage.getBoundingClientRect();
      lay(up,'u',bandUp,false,sr,w); lay(dn,'d',bandDn,true,sr,w);
      // the bands have just changed height, so every rect moved — measure again
      sr=stage.getBoundingClientRect();
      var d='';
      function redo(list,pre,down){
        list.forEach(function(l,k){
          var el2=stage.querySelector('[data-l="'+pre+k+'"]'),
              tk=stage.querySelector('[data-t="'+l.i+'"]');
          if(!el2||!tk)return;
          var tr=tk.getBoundingClientRect(), lr=el2.getBoundingClientRect();
          var tx=tr.left-sr.left+tr.width/2;
          var ty=down?(tr.bottom-sr.top+2):(tr.top-sr.top-2);
          var lx=lr.left-sr.left+lr.width/2, ly=down?(lr.top-sr.top+1):(lr.bottom-sr.top-1);
          var my=(ly+ty)/2;
          d+='M'+lx.toFixed(1)+' '+ly.toFixed(1)+' C'+lx.toFixed(1)+' '+my.toFixed(1)+
             ' '+tx.toFixed(1)+' '+my.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+' '; }); }
      redo(up,'u',false); redo(dn,'d',true);
      var h=stage.clientHeight;
      svg.setAttribute('viewBox','0 0 '+w+' '+h);
      svg.setAttribute('width',w); svg.setAttribute('height',h);
      svg.innerHTML=d?'<path class="iwfo-p" d="'+d+'"/>':'';
    }
    // measured, so it must survive a resize; the observer is held on the element
    // or it can be collected while the tab is in the background

    iwWatch(stage,place);

  };

  /* ── absorption: an IR or UV-visible spectrum ────────────────────────────
     The curve is built from the bands the author names, which is how a textbook
     uses it — the teaching point is always "a strong broad band around 3300",
     never the exact shape. Give explicit points instead for a real measurement. */
  R.absorption=function(box,c){
    box.className='iw iw-card iw-ab';
    var ir=String(c.kind||'ir')!=='uv';
    var lo=iwNum(c.from), hi=iwNum(c.to);
    if(lo==null)lo=ir?4000:400; if(hi==null)hi=ir?500:800;
    var flip=ir;                                   // IR runs 4000 → 500, right to left
    var x0=Math.min(lo,hi), x1=Math.max(lo,hi);
    if(x1<=x0){ box.innerHTML='<div class="iw-err">L’intervalle en abscisse est vide.</div>'; return; }
    var pk=(c.peaks||[]).map(function(p){ return {at:iwNum(p&&p.at),
      width:Math.abs(iwNum(p&&p.width)||(ir?90:40)),
      depth:Math.min(100,Math.max(5,Math.abs(iwNum(p&&p.depth)||70))),
      label:String((p&&p.label)||''),color:String((p&&p.color)||'')}; })
      .filter(function(p){ return p.at!=null&&p.at>=x0&&p.at<=x1; });
    var pts=iwPairs(c.points);
    if(!pk.length&&!pts.length){ box.innerHTML='<div class="iw-err">Indiquez au moins une bande d’absorption.</div>'; return; }
    var yMax=ir?100:Math.max(0.2,iwNum(c.yMax)||Math.max.apply(null,[0.2].concat(pk.map(function(p){ return p.depth/100*(iwNum(c.yMax)||1.2); }))));
    if(!ir&&iwNum(c.yMax))yMax=iwNum(c.yMax); else if(!ir)yMax=1.2;
    var W=680,GL=54,GR=16,GT=16,GH=250,GW=W-GL-GR,GB=GT+GH,H=GB+42+(!ir&&c.colours!==false?18:0);
    function px(v){ var t=(v-x0)/(x1-x0); return GL+(flip?(1-t):t)*GW; }
    function py(v){ return ir?(GB-(v/100)*GH):(GB-(v/yMax)*GH); }
    /* baseline plus one gaussian per band: down for transmittance, up for absorbance */
    function yAt(v){
      var y=ir?96:0;
      pk.forEach(function(p){
        var g=Math.exp(-Math.pow((v-p.at)/(p.width*0.6),2));
        if(ir)y-=p.depth*0.92*g; else y+=(p.depth/100)*yMax*0.92*g; });
      return ir?Math.max(2,y):Math.max(0,y); }
    var path='',N=340,i;
    if(pts.length){
      pts.sort(function(a,b){ return a[0]-b[0]; });
      path=pts.map(function(p,k){ return (k?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1); }).join(' ');
    } else {
      for(i=0;i<=N;i++){ var v=x0+(x1-x0)*i/N;
        path+=(i?'L':'M')+px(v).toFixed(1)+' '+py(yAt(v)).toFixed(1)+' '; }
    }
    var grid='',step=ir?500:50, first=Math.ceil(x0/step)*step;
    for(i=first;i<=x1;i+=step){ var gx=px(i);
      grid+='<line class="iwab-g" x1="'+gx.toFixed(1)+'" y1="'+GT+'" x2="'+gx.toFixed(1)+'" y2="'+GB+'"/>'+
        '<text class="iwab-ax" x="'+gx.toFixed(1)+'" y="'+(GB+17)+'" text-anchor="middle">'+iwFrNum(i,0)+'</text>'; }
    var yst=ir?20:(yMax/4);
    for(i=0;i<=(ir?100:yMax)+1e-9;i+=yst){ var gy=py(i);
      grid+='<line class="iwab-g h" x1="'+GL+'" y1="'+gy.toFixed(1)+'" x2="'+(GL+GW)+'" y2="'+gy.toFixed(1)+'"/>'+
        '<text class="iwab-ax" x="'+(GL-7)+'" y="'+(gy+3.5).toFixed(1)+'" text-anchor="end">'+iwFrNum(i,ir?0:2)+'</text>'; }
    var shade=pk.map(function(p,k){
      var a=px(p.at-p.width), b=px(p.at+p.width);
      var l=Math.min(a,b), w=Math.abs(b-a);
      return '<rect class="iwab-b" data-p="'+k+'" x="'+l.toFixed(1)+'" y="'+GT+'" width="'+w.toFixed(1)+
        '" height="'+GH+'"'+(p.color?' style="fill:'+esc(p.color)+'"':'')+'/>'; }).join('');
    var tags=pk.filter(function(p){ return p.label; }).map(function(p,k){
      return '<text class="iwab-t" data-p="'+k+'" x="'+px(p.at).toFixed(1)+'" y="'+(GT+12+(k%2)*14)+
        '" text-anchor="middle">'+esc(iwRTx(p.label))+'</text>'; }).join('');
    var strip='';
    if(!ir&&c.colours!==false){
      var sid='ab'+(SEQ++), stops='';
      for(i=0;i<=40;i++){ var w2=x0+(x1-x0)*i/40, r=0,g=0,b=0,f=1;
        if(w2>=380&&w2<440){ r=-(w2-440)/60; b=1; } else if(w2<490){ g=(w2-440)/50; b=1; }
        else if(w2<510){ g=1; b=-(w2-510)/20; } else if(w2<580){ r=(w2-510)/70; g=1; }
        else if(w2<645){ r=1; g=-(w2-645)/65; } else if(w2<=780){ r=1; }
        if(w2<380||w2>780)f=0; else if(w2<420)f=0.3+0.7*(w2-380)/40; else if(w2>700)f=0.3+0.7*(780-w2)/80;
        var ch=function(x){ return Math.round(255*Math.pow(Math.max(0,Math.min(1,x))*f,0.8)); };
        stops+='<stop offset="'+(i/40*100).toFixed(1)+'%" stop-color="rgb('+ch(r)+','+ch(g)+','+ch(b)+')"/>'; }
      strip='<defs><linearGradient id="'+sid+'" x1="0" x2="1">'+stops+'</linearGradient></defs>'+
        '<rect x="'+GL+'" y="'+(GB+24)+'" width="'+GW+'" height="12" fill="url(#'+sid+')"/>';
    }
    var maxMark='';
    var lam=iwNum(c.markAt);
    if(lam!=null&&lam>=x0&&lam<=x1){
      var mx=px(lam), my=py(pts.length?0:yAt(lam));
      maxMark='<line class="iwab-mk" x1="'+mx.toFixed(1)+'" y1="'+GT+'" x2="'+mx.toFixed(1)+'" y2="'+GB+'"/>'+
        '<text class="iwab-mkt" x="'+mx.toFixed(1)+'" y="'+(GB-6)+'" text-anchor="middle">'+
        esc(String(c.markLabel||((ir?'σ = ':'λmax = ')+iwFrNum(lam,0)+(ir?' cm⁻¹':' nm'))))+'</text>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwab-intro">'+iwRT(c.intro)+'</div>':'')+
      '<svg class="iwab-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(iwRTx(c.title||'Spectre'))+'">'+
      strip+grid+shade+
      '<path class="iwab-c" d="'+path+'"/>'+maxMark+tags+
      '<line class="iwab-ay" x1="'+GL+'" y1="'+GT+'" x2="'+GL+'" y2="'+GB+'"/>'+
      '<line class="iwab-ay" x1="'+GL+'" y1="'+GB+'" x2="'+(GL+GW)+'" y2="'+GB+'"/>'+
      '<text class="iwab-al" x="'+(GL-7)+'" y="'+(GT-4)+'" text-anchor="end">'+esc(c.yLabel||(ir?'T (%)':'A'))+'</text>'+
      '<text class="iwab-al" x="'+(GL+GW)+'" y="'+(GB+34)+'" text-anchor="end">'+esc(c.xLabel||(ir?'σ (cm⁻¹)':'λ (nm)'))+'</text>'+
      '</svg>'+
      (pk.filter(function(p){ return p.label; }).length?'<div class="iwab-key">'+pk.map(function(p,k){
        return p.label?('<span class="iwab-kc" data-p="'+k+'">'+iwRT(p.label)+' <i>'+iwFrNum(p.at,0)+
          (ir?' cm⁻¹':' nm')+'</i></span>'):''; }).join('')+'</div>':'')+
      (c.note?'<div class="iwab-note">'+iwRT(c.note)+'</div>':'');
    box.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-p]'):null; if(!t)return;
      var k=t.getAttribute('data-p');
      [].forEach.call(box.querySelectorAll('[data-p]'),function(e2){
        e2.classList.toggle('on',e2.getAttribute('data-p')===k); }); });
  };

  /* ── calibration: la courbe d'étalonnage ─────────────────────────────────
     Standards measured, a proportional line through them, and the construction
     that reads an unknown concentration off it — the dashed lines a student is
     expected to draw with a ruler. */
  R.calibration=function(box,c){
    box.className='iw iw-card iw-cb';
    var pts=iwPairs(c.points);
    if(pts.length<2){ box.innerHTML='<div class="iw-err">Il faut au moins deux solutions étalons : « C , valeur » par ligne.</div>'; return; }
    pts.sort(function(a,b){ return a[0]-b[0]; });
    // proportional fit through the origin — the law being tested says so
    var sxy=0,sxx=0;
    pts.forEach(function(p){ sxy+=p[0]*p[1]; sxx+=p[0]*p[0]; });
    var k=sxx?sxy/sxx:0;
    var meas=iwNum(c.measured), unk=(k&&meas!=null)?meas/k:null;
    var xMax=iwNum(c.xMax), yMax=iwNum(c.yMax);
    if(xMax==null)xMax=Math.max(pts[pts.length-1][0],unk!=null?unk:0)*1.15||1;
    if(yMax==null)yMax=Math.max.apply(null,pts.map(function(p){ return p[1]; }).concat(meas!=null?[meas]:[]))*1.2||1;
    var W=660,GL=62,GR=18,GT=14,GH=250,GW=W-GL-GR,GB=GT+GH,H=GB+44;
    function X(v){ return GL+(v/xMax)*GW; }
    function Y(v){ return GB-(v/yMax)*GH; }
    var grid='',i,nx=5,ny=5;
    for(i=0;i<=nx;i++){ var gv=xMax*i/nx;
      grid+='<line class="iwcb-g" x1="'+X(gv).toFixed(1)+'" y1="'+GT+'" x2="'+X(gv).toFixed(1)+'" y2="'+GB+'"/>'+
        '<text class="iwcb-ax" x="'+X(gv).toFixed(1)+'" y="'+(GB+17)+'" text-anchor="'+
          (i===0?'start':(i===nx?'end':'middle'))+'">'+iwFrSig(gv,2)+'</text>'; }
    for(i=0;i<=ny;i++){ var gw=yMax*i/ny;
      grid+='<line class="iwcb-g" x1="'+GL+'" y1="'+Y(gw).toFixed(1)+'" x2="'+(GL+GW)+'" y2="'+Y(gw).toFixed(1)+'"/>'+
        '<text class="iwcb-ax" x="'+(GL-7)+'" y="'+(Y(gw)+3.5).toFixed(1)+'" text-anchor="end">'+iwFrSig(gw,2)+'</text>'; }
    var lin=iwNum(c.linearTo);
    var domain=(lin!=null&&lin>0)?('<rect class="iwcb-dom" x="'+GL+'" y="'+GT+'" width="'+Math.max(0,X(lin)-GL).toFixed(1)+
      '" height="'+GH+'"/><text class="iwcb-domt" x="'+((GL+X(lin))/2).toFixed(1)+'" y="'+(GT+13)+
      '" text-anchor="middle">Domaine de linéarité</text>'):'';
    var lineTo=Math.min(xMax,(lin!=null&&lin>0)?lin:xMax);
    var fit='<line class="iwcb-fit" x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(lineTo).toFixed(1)+'" y2="'+Y(k*lineTo).toFixed(1)+'"/>';
    var dots=pts.map(function(p){ return '<g class="iwcb-pt"><line x1="'+(X(p[0])-4.5).toFixed(1)+'" y1="'+Y(p[1]).toFixed(1)+
      '" x2="'+(X(p[0])+4.5).toFixed(1)+'" y2="'+Y(p[1]).toFixed(1)+'"/><line x1="'+X(p[0]).toFixed(1)+'" y1="'+(Y(p[1])-4.5).toFixed(1)+
      '" x2="'+X(p[0]).toFixed(1)+'" y2="'+(Y(p[1])+4.5).toFixed(1)+'"/></g>'; }).join('');
    var read='';
    if(unk!=null&&unk>0&&unk<=xMax&&meas<=yMax){
      read='<path class="iwcb-read" d="M'+GL+' '+Y(meas).toFixed(1)+' L'+X(unk).toFixed(1)+' '+Y(meas).toFixed(1)+
        ' L'+X(unk).toFixed(1)+' '+GB+'"/>'+
        '<circle class="iwcb-hit" cx="'+X(unk).toFixed(1)+'" cy="'+Y(meas).toFixed(1)+'" r="4"/>'+
        '<text class="iwcb-rt" x="'+(GL+5)+'" y="'+(Y(meas)-6).toFixed(1)+'">'+esc((c.yLabel||'A')+' mesurée = '+iwFrSig(meas,3))+'</text>'+
        '<text class="iwcb-rt" x="'+X(unk).toFixed(1)+'" y="'+(GB+31)+'" text-anchor="middle">'+
        esc('C = '+iwFrSig(unk,3)+(c.xUnit?' '+c.xUnit:''))+'</text>'; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcb-intro">'+iwRT(c.intro)+'</div>':'')+
      '<svg class="iwcb-svg" viewBox="0 0 '+W+' '+H+'" role="img">'+
      domain+grid+fit+dots+read+
      '<line class="iwcb-ay" x1="'+GL+'" y1="'+GT+'" x2="'+GL+'" y2="'+GB+'"/>'+
      '<line class="iwcb-ay" x1="'+GL+'" y1="'+GB+'" x2="'+(GL+GW)+'" y2="'+GB+'"/>'+
      '<text class="iwcb-al" x="2" y="'+(GT+9)+'">'+esc((c.yLabel||'A')+(c.yUnit?' ('+c.yUnit+')':''))+'</text>'+
      '<text class="iwcb-al" x="'+(GL+GW)+'" y="'+(GB+38)+'" text-anchor="end">'+esc((c.xLabel||'C')+(c.xUnit?' ('+c.xUnit+')':''))+'</text>'+
      '</svg>'+
      '<div class="iwcb-say"><b>'+esc((c.yLabel||'A')+' = '+iwFrSig(k,3)+' × '+(c.xLabel||'C'))+'</b>'+
      (unk!=null&&unk>0?' — la valeur mesurée donne <b>'+esc((c.xLabel||'C')+' = '+iwFrSig(unk,3)+(c.xUnit?' '+c.xUnit:''))+'</b>.':'')+
      '</div>'+
      (c.note?'<div class="iwcb-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── sort into categories: drag, or tap a card then tap a bin ── */
  R.sortbins=function(box,c){
    box.className='iw iw-card iw-sb';
    var P=pal();
    var bins=(c.bins||[]).filter(function(b){ return b&&String(b.label||'').trim()!==''; })
      .map(function(b,i){ return {label:String(b.label).trim(),color:b.color||P[i%P.length]}; });
    var chips=(c.chips||[]).filter(function(x){ return x&&(String(x.label||'').trim()!==''||x.img); })
      .map(function(x,i){ return {id:'k'+i,label:String(x.label||''),img:String(x.img||''),bin:String(x.bin||'').trim()}; });
    if(!bins.length||!chips.length){ box.innerHTML='<div class="iw-err">Il faut au moins une catégorie et une étiquette.</div>'; return; }
    var order=(c.shuffle===false)?chips.slice():iwShuf(chips,chips.map(function(x){return x.label;}).join('|'));
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwsb-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwsb-pool" data-bin=""></div>'+
      '<div class="iwsb-bins">'+bins.map(function(b,i){
        return '<div class="iwsb-bin" data-bin="'+esc(b.label)+'" style="--bc:'+esc(b.color)+'">'+
          '<div class="iwsb-bh">'+esc(b.label)+'</div><div class="iwsb-drop" data-bin="'+esc(b.label)+'"></div></div>'; }).join('')+'</div>'+
      '<div class="iwsb-actions"><button type="button" class="iw-btn" data-sb="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button>'+
      '<button type="button" class="iwm-qbtn" data-sb="reset">'+T('reset','Recommencer')+'</button><span class="iwsb-score"></span></div>'+
      (c.note?'<div class="iwsb-note">'+esc(c.note)+'</div>':'');
    var pool=box.querySelector('.iwsb-pool'), score=box.querySelector('.iwsb-score'), sel=null;
    function chipEl(x){
      var e=el('button','iwsb-chip');
      e.type='button'; e.draggable=true; e.setAttribute('data-id',x.id);
      e.innerHTML=(x.img?'<img src="'+esc(x.img)+'" alt="" loading="lazy">':'')+'<span>'+esc(x.label)+'</span>';
      e.addEventListener('dragstart',function(ev){ sel=x.id; try{ ev.dataTransfer.setData('text/plain',x.id); }catch(er){} });
      e.addEventListener('click',function(){
        if(sel===x.id){ sel=null; }
        else sel=x.id;
        paintSel(); });
      return e; }
    function paintSel(){ [].forEach.call(box.querySelectorAll('.iwsb-chip'),function(e){
      e.classList.toggle('sel',e.getAttribute('data-id')===sel); }); }
    // looked up by walking the drop zones rather than with an attribute selector,
    // because a category label is free text and may contain quotes or brackets
    function dropFor(label){ if(!label)return pool;
      var found=null;
      [].forEach.call(box.querySelectorAll('.iwsb-drop'),function(d){
        if(!found&&d.getAttribute('data-bin')===label)found=d; });
      return found; }
    function place(id,binLabel){
      var x=null; chips.forEach(function(k){ if(k.id===id)x=k; }); if(!x)return;
      var host=dropFor(binLabel); if(!host)return;
      var cur=box.querySelector('.iwsb-chip[data-id="'+id+'"]');
      if(cur&&cur.parentNode)cur.parentNode.removeChild(cur);
      host.appendChild(chipEl(x));
      sel=null; paintSel(); if(score){ score.textContent=''; score.className='iwsb-score'; } }
    function reset(){ pool.innerHTML='';
      [].forEach.call(box.querySelectorAll('.iwsb-drop'),function(d){ d.innerHTML=''; });
      order.forEach(function(x){ pool.appendChild(chipEl(x)); });
      sel=null; if(score){ score.textContent=''; score.className='iwsb-score'; } }
    [].forEach.call(box.querySelectorAll('[data-bin]'),function(z){
      if(!z.classList.contains('iwsb-drop')&&z!==pool)return;
      z.addEventListener('dragover',function(ev){ ev.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave',function(){ z.classList.remove('over'); });
      z.addEventListener('drop',function(ev){ ev.preventDefault(); z.classList.remove('over');
        var id=''; try{ id=ev.dataTransfer.getData('text/plain'); }catch(er){}
        place(id||sel,z.getAttribute('data-bin')); });
      z.addEventListener('click',function(ev){
        if(ev.target.closest&&ev.target.closest('.iwsb-chip'))return;
        if(sel)place(sel,z.getAttribute('data-bin')); }); });
    function check(reveal){
      if(reveal)chips.forEach(function(x){ place(x.id,x.bin); });
      var ok=0;
      chips.forEach(function(x){
        var e=box.querySelector('.iwsb-chip[data-id="'+x.id+'"]');
        if(!e)return;
        var host=e.parentNode, got=host?(host.getAttribute('data-bin')||''):'';
        var good=iwNorm(got)===iwNorm(x.bin);
        e.classList.toggle('ok',good); e.classList.toggle('no',!good&&got!==''); if(good)ok++; });
      score.textContent=reveal?'Corrigé':(ok+' / '+chips.length);
      score.className='iwsb-score '+((reveal||ok===chips.length)?'ok':'no'); }
    box.querySelector('[data-sb="check"]').addEventListener('click',function(){ check(false); });
    box.querySelector('[data-sb="reset"]').addEventListener('click',reset);
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ check(true); });
    reset();
  };

  /* ── rubric: a marking grid that adds itself up ── */
  R.rubric=function(box,c){
    box.className='iw iw-card iw-rb';
    var levels=iwList(c.levels); if(levels.length<2)levels=['Non acquis','En cours d’acquisition','Acquis','Expert'];
    var crit=(c.criteria||[]).filter(function(x){ return x&&String(x.label||'').trim()!==''; })
      .map(function(x){ var w=iwNum(x.weight); return {label:String(x.label).trim(),detail:String(x.detail||''),w:(w!=null&&w>0)?w:1}; });
    if(!crit.length){ box.innerHTML='<div class="iw-err">Aucun critère.</div>'; return; }
    var total=iwNum(c.total); if(!(total>0))total=20;
    var wsum=crit.reduce(function(t,x){ return t+x.w; },0);
    var head=levels.map(function(l,i){ return '<th><span>'+esc(l)+'</span><em>'+i+'</em></th>'; }).join('');
    var body=crit.map(function(x,ri){
      return '<tr><th class="iwrb-c"><b>'+esc(x.label)+'</b>'+(x.detail?'<span>'+esc(x.detail)+'</span>':'')+
        (wsum!==crit.length?'<i>× '+iwFmt(x.w,2)+'</i>':'')+'</th>'+
        levels.map(function(l,ci){ return '<td><label><input type="radio" name="iwrb'+(SEQ)+'r'+ri+'" value="'+ci+'" aria-label="'+esc(x.label+' — '+l)+'"><i></i></label></td>'; }).join('')+
        '</tr>'; }).join('');
    SEQ++;
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      (c.intro?'<div class="iwrb-intro">'+esc(c.intro)+'</div>':'')+
      '<div class="iwrb-scroll"><table class="iwrb-t"><thead><tr><th class="iwrb-ch">Critère</th>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>'+
      '<div class="iwrb-out"><div class="iwrb-track"><i></i></div><b class="iwrb-mark">—</b>'+
      '<button type="button" class="iwm-qbtn" data-rb="reset">'+T('clear','Effacer')+'</button></div>'+
      (c.note?'<div class="iwrb-note">'+esc(c.note)+'</div>':'');
    var mark=box.querySelector('.iwrb-mark'), bar=box.querySelector('.iwrb-track i');
    function paint(){
      var got=0, done=0;
      crit.forEach(function(x,ri){
        var r=box.querySelector('input[name$="r'+ri+'"]:checked');
        if(!r)return; done++; got+=(+r.value)/(levels.length-1)*x.w; });
      if(!done){ mark.textContent='—'; bar.style.width='0%'; mark.className='iwrb-mark'; return; }
      var m=got/wsum*total;
      bar.style.width=(got/wsum*100).toFixed(1)+'%';
      mark.textContent=iwFmt(m,2)+' / '+iwFmt(total,0)+(done<crit.length?' (' +done+'/'+crit.length+' critères)':'');
      mark.className='iwrb-mark '+(m>=total/2?'ok':'no'); }
    box.addEventListener('change',function(e){ if(e.target&&e.target.type==='radio')paint(); });
    box.querySelector('[data-rb="reset"]').addEventListener('click',function(){
      [].forEach.call(box.querySelectorAll('input[type=radio]'),function(r){ r.checked=false; }); paint(); });
    paint();
  };

  /* ── GIF / animation: a looping image that waits to be asked ──
     A GIF dropped into a figure slot autoplays and loops for ever, which is
     distracting beside prose and prints as whatever frame it happened to be on.
     This shows a still first frame with a play button instead, and takes a
     silent looping video just as happily — which is what most "GIFs" should be,
     at a tenth of the weight. */
  R.gif=function(box,c){
    box.className='iw iw-gif';
    var src=String(c.src||'').trim(), poster=String(c.poster||'').trim();
    var vid=isVid(src);
    var w=iwNum(c.width); if(!(w>0)||w>100)w=100;
    var align=(c.align==='left'||c.align==='right')?c.align:'center';
    var reduce=false;
    try{ reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){}
    box.innerHTML=(c.title?'<div class="iw-title">'+esc(c.title)+'</div>':'')+
      '<figure class="iwgif-fig iwgif-'+align+'" style="--gw:'+w+'%">'+
        '<div class="iwgif-stage"><div class="iwgif-hold"></div></div>'+
        ((c.caption||c.credit)?'<figcaption>'+(c.caption?'<span>'+esc(c.caption)+'</span>':'')+
          (c.credit?'<em>'+esc(c.credit)+'</em>':'')+'</figcaption>':'')+
      '</figure>'+
      (c.note?'<div class="iwgif-note">'+esc(c.note)+'</div>':'');
    var stage=box.querySelector('.iwgif-stage'), hold=box.querySelector('.iwgif-hold');
    if(!src){ hold.innerHTML='<div class="iwgif-empty">Animation à ajouter</div>'; return; }
    stage.insertAdjacentHTML('beforeend',
      '<button type="button" class="iwgif-play" aria-label="Lire l’animation"></button>'+
      '<div class="iwgif-bar">'+
        '<button type="button" class="iwgif-b" data-g="toggle" aria-pressed="false">Lire</button>'+
        '<button type="button" class="iwgif-b" data-g="again">Revoir</button>'+
        '<span class="iwgif-tag">'+(vid?'vidéo':'GIF')+'</span></div>');
    var big=stage.querySelector('.iwgif-play'), tog=stage.querySelector('[data-g="toggle"]'),
        ag=stage.querySelector('[data-g="again"]'), playing=false;
    function setState(on){ playing=on; stage.classList.toggle('on',on);
      tog.textContent=on?'Pause':'Lire'; tog.setAttribute('aria-pressed',on?'true':'false'); }
    var auto=(c.autoplay===true)&&!reduce;
    if(vid){
      // a video can be paused, resumed and rewound properly, so one node does everything
      var vd=document.createElement('video');
      vd.className='iwgif-media'; vd.muted=true; vd.defaultMuted=true; vd.loop=(c.loop!==false);
      vd.setAttribute('playsinline',''); vd.setAttribute('muted',''); vd.preload='metadata';
      if(poster)vd.poster=poster;
      vd.src=src; hold.appendChild(vd);
      var go=function(restart){ if(restart){ try{ vd.currentTime=0; }catch(e){} }
        var p=vd.play(); if(p&&p['catch'])p['catch'](function(){}); setState(true); };
      var stop=function(){ vd.pause(); setState(false); };
      big.addEventListener('click',function(){ go(false); });
      tog.addEventListener('click',function(){ if(playing)stop(); else go(false); });
      ag.addEventListener('click',function(){ go(true); });
      vd.addEventListener('ended',function(){ setState(false); });
      setState(false); if(auto)go(false);
    } else {
      var posterNode=null;
      function makePoster(){
        if(posterNode)return posterNode;
        if(poster){ posterNode=el('img','iwgif-media'); posterNode.alt=String(c.alt||''); posterNode.src=poster; return posterNode; }
        // No still supplied: an animated GIF is showing frame 1 the moment it
        // loads, so painting it to a canvas right then captures that frame
        // without having to decode the format.
        var cv=el('canvas','iwgif-media'); posterNode=cv;
        var im=new Image();
        im.onload=function(){ cv.width=im.naturalWidth||640; cv.height=im.naturalHeight||360;
          try{ cv.getContext('2d').drawImage(im,0,0); }catch(e){} };
        im.onerror=function(){ hold.innerHTML='<div class="iwgif-empty">Fichier introuvable</div>'; };
        im.src=src;
        return cv; }
      var showPoster=function(){ hold.innerHTML=''; hold.appendChild(makePoster()); setState(false); };
      var showGif=function(){ hold.innerHTML='';
        // a GIF cannot be rewound; a brand-new node is what restarts it at frame 1
        var im2=el('img','iwgif-media'); im2.alt=String(c.alt||''); im2.src=src;
        hold.appendChild(im2); setState(true); };
      big.addEventListener('click',function(){ showGif(); });
      tog.addEventListener('click',function(){ if(playing)showPoster(); else showGif(); });
      ag.addEventListener('click',function(){ showGif(); });
      if(auto)showGif(); else showPoster();
    }
  };

  /* ── examtips: what loses marks, and what earns the extra one ───────────
     The page every revision book has and no textbook does: a column of
     mistakes not to make, a column of things that gain a point, each able to
     point at the exercise that drills it. Nothing about it is subject-specific
     — it is the shape of exam advice, whatever the exam. */
  R.examtips=function(box,c){
    box.className='iw iw-card iw-et';
    var tips=(c.tips||[]).map(function(t){
      return {kind:(String((t&&t.kind)||'lose').toLowerCase()==='gain')?'gain':'lose',
        text:String((t&&t.text)||''),link:String((t&&t.link)||'')};
    }).filter(function(t){ return t.text!==''; });
    if(!tips.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins un conseil.</div>'; return; }
    function col(kind,label){
      var list=tips.filter(function(t){ return t.kind===kind; });
      if(!list.length)return '';
      return '<div class="iwet-col iwet-'+kind+'"><div class="iwet-h">'+iwRT(label)+'</div><ul>'+
        list.map(function(t){
          return '<li><span class="iwet-m" aria-hidden="true">'+(kind==='gain'?'+':'!')+'</span>'+
            '<span class="iwet-t">'+iwRT(t.text)+
            (t.link?'<b class="iwet-ref">'+iwRT(t.link)+'</b>':'')+'</span></li>';
        }).join('')+'</ul></div>';
    }
    box.innerHTML=(c.title!==''?'<div class="iw-title">'+iwRT(c.title||'Pour réussir le jour J')+'</div>':'')+
      (c.intro?'<div class="iwet-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwet-cols">'+col('lose',c.loseLabel||'Les erreurs à ne pas commettre')+
      col('gain',c.gainLabel||'Un point en plus sur la copie')+'</div>'+
      (c.note?'<div class="iwet-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── checklist: the reader's own "have I…?" before handing in ────────────
     Not a marking grid (that is rubric, and it belongs to the teacher) — this
     one belongs to the student: tick what you have done, and the bar tells you
     how far off you are. Ticks survive a reload, per book, so a checklist can
     span a whole revision session. */
  R.checklist=function(box,c){
    box.className='iw iw-card iw-ck';
    var items=(c.checks||[]).map(function(t){
      return {text:String((t&&t.text)||''),why:String((t&&t.why)||''),
        group:String((t&&t.group)||'')};
    }).filter(function(t){ return t.text!==''; });
    if(!items.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins un critère.</div>'; return; }
    var key='iwck:'+hash(String(c.title||'')+'|'+items.length+'|'+items[0].text);
    var saved={}; try{ saved=JSON.parse(localStorage.getItem(key)||'{}')||{}; }catch(e){ saved={}; }
    var groups=[], seen={};
    items.forEach(function(t,i){ var g=t.group;
      if(!seen.hasOwnProperty(g)){ seen[g]=groups.length; groups.push({name:g,rows:[]}); }
      groups[seen[g]].rows.push({t:t,i:i}); });
    box.innerHTML=(c.title!==''?'<div class="iw-title">'+iwRT(c.title||'Critères de réussite')+'</div>':'')+
      (c.intro?'<div class="iwck-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwck-list">'+groups.map(function(g){
        return (g.name?'<div class="iwck-g">'+iwRT(g.name)+'</div>':'')+g.rows.map(function(r){
          return '<label class="iwck-row"><input type="checkbox" data-ck="'+r.i+'"'+(saved[r.i]?' checked':'')+'>'+
            '<span class="iwck-tx">'+iwRT(r.t.text)+
            (r.t.why?'<i>'+iwRT(r.t.why)+'</i>':'')+'</span></label>';
        }).join(''); }).join('')+'</div>'+
      '<div class="iwck-foot"><div class="iwck-bar"><i></i></div><span class="iwck-score"></span>'+
      '<button type="button" class="iwm-qbtn iwck-clear">Tout décocher</button></div>'+
      (c.note?'<div class="iwck-note">'+iwRT(c.note)+'</div>':'');
    var bar=box.querySelector('.iwck-bar i'), sc=box.querySelector('.iwck-score');
    function tally(){
      var on=[].slice.call(box.querySelectorAll('[data-ck]')).filter(function(b){ return b.checked; }).length;
      var pc=Math.round(on/items.length*100);
      bar.style.width=pc+'%';
      bar.className=(on===items.length?'full':'');
      sc.textContent=on+' / '+items.length;
      sc.className='iwck-score'+(on===items.length?' ok':'');
      var st={}; [].slice.call(box.querySelectorAll('[data-ck]')).forEach(function(b){
        if(b.checked)st[b.getAttribute('data-ck')]=1; });
      try{ localStorage.setItem(key,JSON.stringify(st)); }catch(e){}
    }
    box.addEventListener('change',function(ev){ if(ev.target.hasAttribute('data-ck'))tally(); });
    box.querySelector('.iwck-clear').addEventListener('click',function(){
      [].forEach.call(box.querySelectorAll('[data-ck]'),function(b){ b.checked=false; }); tally(); });
    tally();
  };

  /* ── formulary: the sheet at the back of the book ────────────────────────
     A glossary holds words; this holds relations. Each entry carries what the
     formula is called, the relation itself, what every symbol means with its
     unit, and — the part a formula sheet usually leaves out — when you reach
     for it. Typing filters the lot, so a 60-formula sheet stays usable. */
  R.formulary=function(box,c){
    box.className='iw iw-card iw-fy';
    var fs=(c.formulas||[]).map(function(f){
      return {name:String((f&&f.name)||''),expr:String((f&&f.expr)||''),
        group:String((f&&f.group)||''),symbols:String((f&&f.symbols)||''),
        use:String((f&&f.use)||'')};
    }).filter(function(f){ return f.expr!==''||f.name!==''; });
    if(!fs.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins une relation.</div>'; return; }
    var search=iwBool(c.search,true);
    var groups=[], seen={};
    fs.forEach(function(f,i){ var g=f.group;
      if(!seen.hasOwnProperty(g)){ seen[g]=groups.length; groups.push({name:g,rows:[]}); }
      groups[seen[g]].rows.push({f:f,i:i}); });
    function syms(s){
      // one symbol per ";" — never per comma, which is a decimal mark in French
      var parts=String(s).split(';').map(function(x){ return x.trim(); }).filter(function(x){ return x!==''; });
      if(!parts.length)return '';
      return '<dl class="iwfy-sym">'+parts.map(function(p){
        var k=p.indexOf(':');
        if(k<0)return '<dd>'+iwRT(p)+'</dd>';
        return '<dt>'+iwRT(p.slice(0,k).trim())+'</dt><dd>'+iwRT(p.slice(k+1).trim())+'</dd>';
      }).join('')+'</dl>';
    }
    box.innerHTML=(c.title!==''?'<div class="iw-title">'+iwRT(c.title||'Formulaire')+'</div>':'')+
      (c.intro?'<div class="iwfy-intro">'+iwRT(c.intro)+'</div>':'')+
      (search?'<div class="iwfy-search"><input type="search" placeholder="'+
        esc(c.searchLabel||'Chercher une grandeur, un symbole, une relation…')+'" aria-label="'+
        esc(c.searchLabel||'Chercher')+'"></div>':'')+
      '<div class="iwfy-list">'+groups.map(function(g){
        return '<div class="iwfy-grp" data-grp="1">'+(g.name?'<div class="iwfy-g">'+iwRT(g.name)+'</div>':'')+
          g.rows.map(function(r){
            var f=r.f;
            // iwNorm, so that searching "energie" finds "énergie" — the search
            // box and the key have to be folded exactly the same way
            return '<div class="iwfy-item" data-k="'+esc(iwNorm(iwRTx(f.name+' '+f.expr+' '+f.symbols+' '+f.group+' '+f.use)))+'">'+
              (f.name?'<div class="iwfy-name">'+iwRT(f.name)+'</div>':'')+
              (f.expr?'<div class="iwfy-expr">'+iwPretty(f.expr)+'</div>':'')+
              syms(f.symbols)+
              (f.use?'<div class="iwfy-use"><b>Quand ?</b> '+iwRT(f.use)+'</div>':'')+'</div>';
          }).join('')+'</div>'; }).join('')+'</div>'+
      '<div class="iwfy-empty" hidden>Aucune relation ne correspond.</div>'+
      (c.note?'<div class="iwfy-note">'+iwRT(c.note)+'</div>':'');
    if(!search)return;
    var inp=box.querySelector('.iwfy-search input'), empty=box.querySelector('.iwfy-empty');
    inp.addEventListener('input',function(){
      var q=iwNorm(inp.value), any=false;
      [].forEach.call(box.querySelectorAll('.iwfy-item'),function(el){
        var on=!q||el.getAttribute('data-k').indexOf(q)>=0;
        el.hidden=!on; if(on)any=true; });
      [].forEach.call(box.querySelectorAll('.iwfy-grp'),function(g){
        g.hidden=!g.querySelector('.iwfy-item:not([hidden])'); });
      empty.hidden=any;
    });
  };

  /* ── vectors: arrows on squared paper, and the arithmetic on them ────────
     Δv = v2 − v1 is the same picture as F1 + F2 = R and as a translation in
     maths: arrows on a grid, and a construction that follows from them. So the
     element takes vectors by components and expressions over their names, and
     draws the result rather than asking you to draw it — change a component
     and the resultant moves with it.

     A vector starts at the origin unless you say otherwise: "3,1" starts it at
     a point, a vector's name starts it at that vector's tip, which is how you
     build a sum head-to-tail without computing anything. */
  R.vectors=function(box,c){
    box.className='iw iw-card iw-vc';
    var vs=(c.vecs||[]).map(function(v,i){
      return {name:String((v&&v.name)||('v'+(i+1))),x:iwNum(v&&v.x)||0,y:iwNum(v&&v.y)||0,
        from:String((v&&v.from)||'').trim(),color:String((v&&v.color)||''),
        dash:iwBool(v&&v.dash,false),calc:false};
    }).filter(function(v){ return v.x!==0||v.y!==0; });
    var sums=(c.sums||[]).map(function(s){
      return {name:String((s&&s.name)||''),expr:String((s&&s.expr)||''),
        from:String((s&&s.from)||'').trim(),color:String((s&&s.color)||''),calc:true};
    }).filter(function(s){ return s.expr!==''; });
    if(!vs.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins un vecteur.</div>'; return; }
    var by={}; vs.forEach(function(v){ by[v.name]=v; });
    // "F1 + F2 - v" — the only operators a vector expression needs
    sums.forEach(function(s){
      var terms=String(s.expr).replace(new RegExp('-','g'),' - ').replace(new RegExp('[+]','g'),' + ')
        .split(new RegExp('[ ]+')).filter(function(t){ return t!==''; });
      var sign=1, ok=false; s.x=0; s.y=0;
      terms.forEach(function(t){
        if(t==='+'){ sign=1; return; }
        if(t==='-'){ sign=-1; return; }
        var v=by[t]; if(!v)return;
        s.x+=sign*v.x; s.y+=sign*v.y; sign=1; ok=true; });
      s.bad=!ok;
      if(!s.name)s.name=String(s.expr);
      by[s.name]=s;
    });
    var all=vs.concat(sums.filter(function(s){ return !s.bad; }));
    // resolve each start point; a name means "at the tip of", so it can chain
    var pass;
    all.forEach(function(v){ v.ox=0; v.oy=0; v.done=(v.from===''); });
    for(pass=0;pass<all.length+2;pass++){
      var moved=false;
      all.forEach(function(v){
        if(v.done)return;
        var p=iwPairs(v.from);
        if(p.length){ v.ox=p[0][0]; v.oy=p[0][1]; v.done=true; moved=true; return; }
        var t=by[v.from];
        if(!t||t===v){ v.done=true; moved=true; return; }        // unknown start: origin
        if(!t.done)return;
        v.ox=t.ox+t.x; v.oy=t.oy+t.y; v.done=true; moved=true; });
      if(!moved)break;
    }
    all.forEach(function(v){ v.done=true; });
    // bounds: every tail and every tip, plus the origin, rounded outwards
    var xs=[0], ys=[0];
    all.forEach(function(v){ xs.push(v.ox,v.ox+v.x); ys.push(v.oy,v.oy+v.y); });
    var x0=iwNum(c.xmin), x1=iwNum(c.xmax), y0=iwNum(c.ymin), y1=iwNum(c.ymax);
    if(x0==null)x0=Math.floor(Math.min.apply(null,xs)-1);
    if(x1==null)x1=Math.ceil(Math.max.apply(null,xs)+1);
    if(y0==null)y0=Math.floor(Math.min.apply(null,ys)-1);
    if(y1==null)y1=Math.ceil(Math.max.apply(null,ys)+1);
    if(x1-x0<2)x1=x0+2;
    if(y1-y0<2)y1=y0+2;
    var grid=iwBool(c.grid,true), axes=iwBool(c.axes,true), comps=iwBool(c.components,false);
    var unit=String(c.unit||''), dec=iwNum(c.decimals);
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwvc-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwvc-stage"></div>'+
      '<div class="iwvc-keys">'+all.map(function(v,i){
        return '<button type="button" class="iwvc-key" data-v="'+i+'"><i style="background:'+
          esc(vcColor(v,i))+'"></i>'+esc(v.name)+(v.calc?' <b>=</b> '+esc(v.expr):'')+'</button>'; }).join('')+'</div>'+
      '<div class="iwvc-read"></div>'+
      (c.note?'<div class="iwvc-note">'+iwRT(c.note)+'</div>':'');
    function vcColor(v,i){
      if(v.color)return v.color;
      if(v.calc)return 'var(--gold)';
      return ['var(--accent)','var(--teal)','var(--slate)','#7a5ea8','#b3762c'][i%5];
    }
    var stage=box.querySelector('.iwvc-stage'), read=box.querySelector('.iwvc-read'), sel=-1;
    function say(i){
      var v=all[i];
      if(!v){ read.innerHTML=all.length?'<span class="iwvc-hint">Cliquez un vecteur pour lire ses coordonnées.</span>':''; return; }
      var n=Math.sqrt(v.x*v.x+v.y*v.y);
      read.innerHTML='<b style="color:'+esc(vcColor(v,i))+'">'+esc(v.name)+'</b> ('+
        iwFrNum(v.x,dec==null?1:dec)+' ; '+iwFrNum(v.y,dec==null?1:dec)+')'+
        ' &nbsp;·&nbsp; norme '+iwFrFix(n,dec==null?1:dec)+(unit?' '+esc(unit):'')+
        (v.calc?' &nbsp;·&nbsp; <i>'+esc(v.expr)+'</i>':'');
    }
    function draw(){
      var w=Math.max(200,stage.clientWidth||box.clientWidth||520);
      var per=Math.min(w/(x1-x0),150), h=Math.round(per*(y1-y0));
      if(h>520){ per=520/(y1-y0); h=520; }
      var W=Math.round(per*(x1-x0));
      var X=function(u){ return (u-x0)*per; }, Y=function(u){ return (y1-u)*per; };
      var s='<svg viewBox="0 0 '+W+' '+h+'" width="'+W+'" height="'+h+'" role="img">';
      if(grid){ s+='<g class="iwvc-grid">';
        for(var gx=Math.ceil(x0);gx<=x1;gx++)s+='<line x1="'+X(gx)+'" y1="0" x2="'+X(gx)+'" y2="'+h+'"/>';
        for(var gy=Math.ceil(y0);gy<=y1;gy++)s+='<line x1="0" y1="'+Y(gy)+'" x2="'+W+'" y2="'+Y(gy)+'"/>';
        s+='</g>'; }
      if(axes&&x0<=0&&x1>=0&&y0<=0&&y1>=0){
        s+='<g class="iwvc-ax"><line x1="0" y1="'+Y(0)+'" x2="'+W+'" y2="'+Y(0)+'"/>'+
          '<line x1="'+X(0)+'" y1="0" x2="'+X(0)+'" y2="'+h+'"/></g>'; }
      s+='<defs>';
      all.forEach(function(v,i){
        s+='<marker id="iwvcA'+i+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'+
          '<path d="M0 0L10 5L0 10z" fill="'+esc(vcColor(v,i))+'"/></marker>'; });
      s+='</defs>';
      all.forEach(function(v,i){
        var col=vcColor(v,i), on=(sel===i), ax=X(v.ox), ay=Y(v.oy), bx=X(v.ox+v.x), byy=Y(v.oy+v.y);
        if((comps||on)&&(v.x!==0&&v.y!==0)){
          s+='<g class="iwvc-cp"><line x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+ay+'" stroke="'+esc(col)+'"/>'+
            '<line x1="'+bx+'" y1="'+ay+'" x2="'+bx+'" y2="'+byy+'" stroke="'+esc(col)+'"/></g>'; }
        s+='<line class="iwvc-v'+(on?' on':'')+'" data-v="'+i+'" x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+byy+
          '" stroke="'+esc(col)+'" marker-end="url(#iwvcA'+i+')"'+
          (v.dash||v.calc?' stroke-dasharray="7 5"':'')+'/>';
        var mx=(ax+bx)/2, my=(ay+byy)/2, off=(v.y>=0?-9:15);
        s+='<text class="iwvc-lb'+(on?' on':'')+'" x="'+(mx+(v.x<0?-8:8))+'" y="'+(my+off)+
          '" fill="'+esc(col)+'">'+esc(v.name)+'</text>';
      });
      s+='</svg>';
      stage.innerHTML=s;
    }
    stage.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-v]'):null;
      sel=t?+t.getAttribute('data-v'):-1; draw(); say(sel);
      [].forEach.call(box.querySelectorAll('.iwvc-key'),function(k){
        k.classList.toggle('on',+k.getAttribute('data-v')===sel); }); });
    box.querySelector('.iwvc-keys').addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-v]'):null; if(!t)return;
      var i=+t.getAttribute('data-v'); sel=(sel===i?-1:i); draw(); say(sel);
      [].forEach.call(box.querySelectorAll('.iwvc-key'),function(k){
        k.classList.toggle('on',+k.getAttribute('data-v')===sel); }); });
    say(-1);
    iwWatch(box,draw);
  };

  /* ── fieldmap: a field, drawn from its sources ───────────────────────────
     Electrostatic, gravitational or magnetic — the picture is the same and so
     is the maths, so one element covers all three and the reader can move a
     test point through it. The arrows are computed from an inverse-square sum,
     not drawn by hand, which means a figure cannot disagree with the physics
     it illustrates. */
  /* ── le système solaire ───────────────────────────────────────────────────
     Rien n'est mis en scène ici: tout ce qui peut se calculer se calcule.
     Les périodes viennent de la troisième loi de Kepler, les positions de
     l'équation de Kepler résolue par Newton — la deuxième loi, les aires égales
     en temps égaux, n'est donc pas imitée, elle sort du calcul — et la
     pesanteur, la vitesse de libération, la masse volumique et la température
     d'équilibre se déduisent de la masse, du rayon et de l'albédo.
     Comparer cette dernière à la température mesurée donne l'effet de serre
     sans rien saisir de plus. */
  var SOL_UID=0, SOL_TRAIL=4;
  var SOL_G=6.6743e-11, SOL_AU=1.495978707e11, SOL_MSUN=1.98847e30;
  var SOL_TSUN=5772, SOL_RSUN=6.957e8, SOL_YRD=365.25636;
  var SOL_MOIS=['janvier','février','mars','avril','mai','juin','juillet','août',
    'septembre','octobre','novembre','décembre'];
  /* a  demi-grand axe (ua)          e   excentricité
     pe longitude du périhélie (°)   L0  longitude moyenne au 1.1.2000 (°)
     inc inclinaison sur l'écliptique (°)
     m  masse (kg)                   r   rayon moyen (km)
     rot période de rotation (h, négative si rétrograde)
     ax inclinaison de l'axe (°)     al  albédo de Bond
     sat satellites connus           t   température moyenne mesurée (K) */
  var SOL_DATA=[
    {k:'soleil',n:'Soleil',star:1,m:1.98847e30,r:695700,rot:609.12,ax:7.25,t:5772,c:'#f0a63c',
     fam:'Étoile',d:'Une naine jaune ordinaire — et 99,86 % de la masse du système. Elle fusionne 600 millions de tonnes d’hydrogène par seconde.'},
    {k:'mercure',n:'Mercure',a:0.38710,e:0.20563,pe:77.46,L0:252.25,inc:7.00,
     m:3.3011e23,r:2439.7,rot:1407.6,ax:0.034,al:0.088,sat:0,t:440,c:'#9a8f86',
     fam:'Planète tellurique',d:'La plus petite et la plus rapide. Son orbite est la plus excentrique des huit: sa distance au Soleil varie de moitié.'},
    {k:'venus',n:'Vénus',a:0.72333,e:0.00677,pe:131.60,L0:181.98,inc:3.39,
     m:4.8675e24,r:6051.8,rot:-5832.5,ax:177.36,al:0.760,sat:0,t:737,c:'#d9a441',
     fam:'Planète tellurique',d:'Presque jumelle de la Terre par la taille, invivable par l’atmosphère: 92 bars de CO₂. Elle tourne à l’envers, et un jour y dure plus longtemps qu’une année.'},
    {k:'terre',n:'Terre',a:1.00000,e:0.01671,pe:102.95,L0:100.46,inc:0.00,
     m:5.97237e24,r:6371.0,rot:23.9345,ax:23.44,al:0.306,sat:1,t:288,c:'#4a7fb5',
     fam:'Planète tellurique',d:'La seule où l’eau tient les trois états. L’inclinaison de 23,4° de son axe fait les saisons.'},
    {k:'mars',n:'Mars',a:1.52371,e:0.09339,pe:336.06,L0:355.45,inc:1.85,
     m:6.4171e23,r:3389.5,rot:24.6229,ax:25.19,al:0.250,sat:2,t:210,c:'#b5502f',
     fam:'Planète tellurique',d:'Rouge par l’oxyde de fer. Son atmosphère de CO₂ est cent fois trop mince pour retenir la chaleur — sa température mesurée est celle du calcul.'},
    {k:'jupiter',n:'Jupiter',a:5.20288,e:0.04839,pe:14.75,L0:34.40,inc:1.30,
     m:1.8982e27,r:69911,rot:9.9250,ax:3.13,al:0.503,sat:95,t:165,c:'#c08a5a',
     fam:'Géante gazeuse',d:'Deux fois et demie la masse de toutes les autres planètes réunies. Elle rayonne plus d’énergie qu’elle n’en reçoit: elle se contracte encore.'},
    {k:'saturne',n:'Saturne',a:9.53667,e:0.05386,pe:92.43,L0:49.94,inc:2.49,
     m:5.6834e26,r:58232,rot:10.656,ax:26.73,al:0.342,sat:146,t:134,c:'#d6b877',ring:1,
     fam:'Géante gazeuse',d:'Moins dense que l’eau. Ses anneaux, larges de 280 000 km, ne font que dix mètres d’épaisseur.'},
    {k:'uranus',n:'Uranus',a:19.18917,e:0.04726,pe:170.96,L0:313.23,inc:0.77,
     m:8.6810e25,r:25362,rot:-17.24,ax:97.77,al:0.300,sat:28,t:76,c:'#7fc4c9',ring:1,
     fam:'Géante de glaces',d:'Couchée sur le côté: son axe est incliné de 98°, sans doute après une collision. Chaque pôle passe 42 ans au soleil, puis 42 ans dans la nuit.'},
    {k:'neptune',n:'Neptune',a:30.06992,e:0.00859,pe:44.97,L0:304.88,inc:1.77,
     m:1.02413e26,r:24622,rot:16.11,ax:28.32,al:0.290,sat:16,t:72,c:'#4a63a8',ring:1,
     fam:'Géante de glaces',d:'Trouvée par le calcul avant d’être vue: Le Verrier a déduit sa position des écarts d’Uranus. Vents les plus rapides du système, 2 100 km/h.'},
    {k:'pluton',n:'Pluton',a:39.48168,e:0.24881,pe:224.07,L0:238.93,inc:17.16,
     m:1.303e22,r:1188.3,rot:-153.29,ax:122.53,al:0.500,sat:5,t:44,c:'#a9927d',dwarf:1,
     fam:'Planète naine',d:'Reclassée en 2006: elle n’a pas « nettoyé » son orbite, qu’elle partage avec la ceinture de Kuiper. Elle passe parfois plus près du Soleil que Neptune.'}
  ];
  /* les grandeurs qu'on ne saisit jamais: elles se déduisent des trois nombres
     mesurés que sont la masse, le rayon et l'albédo */
  function solDeriv(b){
    var R=b.r*1000, o={};
    o.g=SOL_G*b.m/(R*R);                                   // g = GM/R²
    o.vesc=Math.sqrt(2*SOL_G*b.m/R);                       // v = √(2GM/R)
    o.rho=b.m/(4/3*Math.PI*R*R*R);                         // ρ = M/V
    if(b.a){
      o.T=Math.pow(b.a,1.5);                               // T² = a³  (ua, années)
      o.vorb=Math.sqrt(SOL_G*SOL_MSUN/(b.a*SOL_AU));       // vitesse circulaire moyenne
      o.per=b.a*(1-b.e); o.aph=b.a*(1+b.e);
      if(b.al!=null)o.teq=SOL_TSUN*Math.sqrt(SOL_RSUN/(2*b.a*SOL_AU))*Math.pow(1-b.al,0.25);
      if(o.teq&&b.t)o.serre=b.t-o.teq;
    }
    return o;
  }
  /* position à l'instant t (années depuis J2000), dans le plan de l'écliptique.
     Newton sur E − e sin E = M converge en trois ou quatre tours. */
  function solPos(b,t){
    var RAD=Math.PI/180, T=Math.pow(b.a,1.5);
    var M=(b.L0-b.pe)*RAD+2*Math.PI*t/T;
    M=M-2*Math.PI*Math.floor(M/(2*Math.PI));
    var E=M, i, d;
    for(i=0;i<12;i++){ d=(E-b.e*Math.sin(E)-M)/(1-b.e*Math.cos(E)); E-=d; if(Math.abs(d)<1e-12)break; }
    var xv=b.a*(Math.cos(E)-b.e), yv=b.a*Math.sqrt(1-b.e*b.e)*Math.sin(E);
    var w=b.pe*RAD, cw=Math.cos(w), sw=Math.sin(w);
    var r=b.a*(1-b.e*Math.cos(E));
    return {x:xv*cw-yv*sw, y:xv*sw+yv*cw, r:r, T:T,
      v:Math.sqrt(SOL_G*SOL_MSUN*(2/(r*SOL_AU)-1/(b.a*SOL_AU)))};   // vis-viva
  }
  function solDate(t){
    var ms=Date.UTC(2000,0,1,12)+t*SOL_YRD*86400000;
    if(!isFinite(ms)||Math.abs(ms)>8.6e15)return '—';
    var d=new Date(ms);
    return d.getUTCDate()+' '+SOL_MOIS[d.getUTCMonth()]+' '+d.getUTCFullYear();
  }
  /* 5,97 × 10²⁴ — les masses couvrent huit ordres de grandeur, la notation
     scientifique est la seule lisible */
  function solSci(v,dec){
    if(!isFinite(v)||v===0)return '0';
    var ex=Math.floor(Math.log(Math.abs(v))/Math.LN10);
    var mant=v/Math.pow(10,ex);
    if(ex>-3&&ex<5)return iwFrNum(v,dec==null?2:dec);
    return iwFrNum(mant,dec==null?2:dec)+' × 10<sup>'+ex+'</sup>';
  }
  /* ── l'apparence: des sphères, pas des ronds ─────────────────────────────
     Une planète est une boule éclairée d'un seul côté. Un disque plat en
     aplat ne dit rien; un dégradé dont le point chaud pointe vers le Soleil
     dit, sans une ligne de texte, d'où vient la lumière. Dans la vue des
     orbites la direction est recalculée à chaque image, si bien que le
     terminateur tourne avec la planète — c'est juste, et c'est joli. */
  function solRGB(h){ h=String(h||'#888888').replace('#','');
    if(h.length===3)h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    return [parseInt(h.substr(0,2),16)||0,parseInt(h.substr(2,2),16)||0,parseInt(h.substr(4,2),16)||0]; }
  function solMix(a,b,t){ var A=solRGB(a),B=solRGB(b),o='#',i,v;
    for(i=0;i<3;i++){ v=Math.round(A[i]+(B[i]-A[i])*t); v=v<0?0:(v>255?255:v);
      o+=(v<16?'0':'')+v.toString(16); }
    return o; }
  var solLit=function(c,t){ return solMix(c,'#ffffff',t); };
  var solShade=function(c,t){ return solMix(c,'#080a12',t); };
  /* un générateur reproductible: le même ciel à chaque ouverture du livre,
     sinon les étoiles sautent d'une image à l'autre */
  function solRnd(seed){ var s=(seed||1)>>>0;
    return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
  function solStars(W,H,n,seed){
    var r=solRnd(seed), s='', i, m, rad, c;
    for(i=0;i<n;i++){ m=r();
      rad=m<0.84?(0.3+r()*0.55):(0.9+r()*0.8);
      c=m<0.88?'#ffffff':(r()<0.5?'#c7d8ff':'#ffd6a8');
      s+='<circle cx="'+(r()*W).toFixed(1)+'" cy="'+(r()*H).toFixed(1)+'" r="'+rad.toFixed(2)
        +'" fill="'+c+'" opacity="'+(0.2+r()*0.62).toFixed(2)+'"/>'; }
    return s; }
  /* Ce que porte chaque monde, en quelques formes découpées dans le disque.
     b bande (y, demi-hauteur) · c cercle (x, y, r) · e ellipse (x, y, rx, ry)
     Les coordonnées sont en fractions du rayon, donc le même dessin sert à
     six pixels comme à cent cinquante. */
  var SOL_SKIN={
    mercure:[['c',-0.34,-0.22,0.20,'#000000',0.17],['c',0.30,0.12,0.24,'#000000',0.14],
      ['c',-0.02,0.50,0.15,'#000000',0.15],['c',0.44,-0.44,0.13,'#ffffff',0.12],
      ['c',-0.55,0.28,0.11,'#ffffff',0.09]],
    venus:[['b',-0.52,0.17,'#ffffff',0.20],['b',-0.10,0.21,'#8a6a2e',0.13],
      ['b',0.34,0.16,'#ffffff',0.15],['b',0.72,0.13,'#8a6a2e',0.10]],
    terre:[['b',-0.90,0.13,'#ffffff',0.88],['b',0.92,0.11,'#ffffff',0.82],
      ['e',-0.34,-0.34,0.30,0.24,'#3f7a4e',0.92],['e',-0.18,0.10,0.20,0.34,'#4d8a52',0.88],
      ['e',0.38,-0.16,0.28,0.30,'#5a8f4a',0.86],['e',0.30,0.46,0.22,0.16,'#6f9c52',0.80],
      ['e',-0.62,0.42,0.16,0.12,'#4d8a52',0.7],
      ['e',0.02,-0.60,0.42,0.10,'#ffffff',0.34],['e',-0.30,0.62,0.34,0.09,'#ffffff',0.30]],
    mars:[['b',-0.88,0.15,'#ffffff',0.9],['b',0.94,0.09,'#ffffff',0.6],
      ['e',-0.22,0.06,0.36,0.24,'#000000',0.20],['e',0.40,0.34,0.26,0.16,'#000000',0.16],
      ['c',0.30,-0.34,0.13,'#000000',0.14],['e',-0.50,-0.40,0.20,0.12,'#ffffff',0.10]],
    jupiter:[['b',-0.74,0.11,'#ffffff',0.20],
      ['b',-0.48,0.11,'#6b3f26',0.26],['b',-0.22,0.12,'#ffffff',0.24],
      ['b',0.04,0.11,'#6b3f26',0.28],['b',0.30,0.12,'#ffffff',0.22],
      ['b',0.56,0.10,'#6b3f26',0.24],['b',0.80,0.10,'#ffffff',0.16],
      ['e',0.26,0.20,0.24,0.12,'#a4442c',0.85]],
    saturne:[['b',-0.66,0.13,'#ffffff',0.18],['b',-0.30,0.13,'#8a6a34',0.16],
      ['b',0.06,0.14,'#ffffff',0.15],['b',0.44,0.13,'#8a6a34',0.14],['b',0.80,0.10,'#ffffff',0.12]],
    uranus:[['b',-0.30,0.30,'#ffffff',0.10],['b',0.46,0.18,'#2f7f86',0.14]],
    neptune:[['b',-0.34,0.26,'#ffffff',0.10],['b',0.40,0.18,'#2b3f77',0.18],
      ['e',-0.28,0.26,0.22,0.13,'#16224a',0.62]],
    pluton:[['e',0.10,0.30,0.44,0.30,'#f0e3cc',0.55],['e',-0.42,-0.30,0.26,0.20,'#000000',0.18],
      ['c',0.44,-0.36,0.16,'#000000',0.13]]
  };
  function solSkin(b,R){
    var rows=SOL_SKIN[b.k]||[], s='', i, x;
    for(i=0;i<rows.length;i++){ x=rows[i];
      if(x[5]===0||x[6]===0)continue;
      if(x[0]==='b')s+='<ellipse cx="0" cy="'+(x[1]*R).toFixed(2)+'" rx="'+(R*1.04).toFixed(2)
        +'" ry="'+(x[2]*R).toFixed(2)+'" fill="'+x[3]+'" opacity="'+x[4]+'"/>';
      else if(x[0]==='c')s+='<circle cx="'+(x[1]*R).toFixed(2)+'" cy="'+(x[2]*R).toFixed(2)
        +'" r="'+(x[3]*R).toFixed(2)+'" fill="'+x[4]+'" opacity="'+x[5]+'"/>';
      else s+='<ellipse cx="'+(x[1]*R).toFixed(2)+'" cy="'+(x[2]*R).toFixed(2)+'" rx="'+(x[3]*R).toFixed(2)
        +'" ry="'+(x[4]*R).toFixed(2)+'" fill="'+x[5]+'" opacity="'+x[6]+'"/>'; }
    return s; }
  /* Les anneaux passent DERRIÈRE la planète d'un côté et devant de l'autre:
     un seul ovale posé par-dessus casse tout de suite l'illusion. On dessine
     donc l'ovale complet avant la boule, puis le demi-arc de devant après.
     Uranus est couchée à 98°, ses anneaux sont donc presque verticaux. */
  function solRingGeom(b){
    if(b.k==='saturne')return {rx:2.15,ry:0.46,rot:-17,w:0.30,op:0.85,c:'#e0cd9c'};
    if(b.k==='uranus') return {rx:1.75,ry:0.30,rot:-82,w:0.10,op:0.55,c:'#bfe6ea'};
    if(b.k==='neptune')return {rx:1.70,ry:0.34,rot:-22,w:0.07,op:0.42,c:'#9fb4e8'};
    return null; }
  /* combien de rayons la figure occupe réellement: les anneaux de Saturne
     débordent de plus du double, et une boîte au diamètre de la boule les
     ferait passer par-dessus la planète voisine */
  function solPad(b){ var g=solRingGeom(b); if(!g)return 1.06;
    return Math.max(g.rx,g.ry)+g.w/2+0.10; }
  function solRingBack(b,R){
    var g=solRingGeom(b); if(!g)return '';
    return '<g transform="rotate('+g.rot+')" opacity="'+g.op+'">'
      +'<ellipse cx="0" cy="0" rx="'+(g.rx*R).toFixed(2)+'" ry="'+(g.ry*R).toFixed(2)
      +'" fill="none" stroke="'+g.c+'" stroke-width="'+(g.w*R).toFixed(2)+'"/>'
      +(b.k==='saturne'?'<ellipse cx="0" cy="0" rx="'+(g.rx*R*0.845).toFixed(2)+'" ry="'
        +(g.ry*R*0.845).toFixed(2)+'" fill="none" stroke="#0b0e18" stroke-width="'
        +(R*0.055).toFixed(2)+'" opacity="0.55"/>':'')+'</g>'; }
  function solRingFront(b,R){
    var g=solRingGeom(b); if(!g)return '';
    var rx=g.rx*R, ry=g.ry*R;
    return '<g transform="rotate('+g.rot+')" opacity="'+g.op+'">'
      +'<path d="M '+(-rx).toFixed(2)+' 0 A '+rx.toFixed(2)+' '+ry.toFixed(2)+' 0 0 0 '+rx.toFixed(2)+' 0"'
      +' fill="none" stroke="'+g.c+'" stroke-width="'+(g.w*R).toFixed(2)+'"/></g>'; }
  /* Une boule complète, réutilisée aux trois tailles: orbites, comparatif des
     diamètres et fiche. Les options fx et fy placent le point chaud; skin
     ajoute bandes, cratères et calottes, inutiles sous dix pixels. */
  function solOrb(b,R,uid,opt){
    opt=opt||{};
    var base=b.c, gid=uid+'-g', cid=uid+'-c';
    var s='<defs><radialGradient id="'+gid+'" cx="0.5" cy="0.5" r="0.62" fx="'
      +(opt.fx==null?0.34:opt.fx)+'" fy="'+(opt.fy==null?0.32:opt.fy)+'">'
      +'<stop offset="0" stop-color="'+(b.star?'#fff8dc':solLit(base,0.62))+'"/>'
      +'<stop offset="0.40" stop-color="'+(b.star?'#f7c85a':base)+'"/>'
      +'<stop offset="1" stop-color="'+(b.star?'#d9651a':solShade(base,0.78))+'"/>'
      +'</radialGradient><clipPath id="'+cid+'"><circle cx="0" cy="0" r="'+R.toFixed(2)+'"/></clipPath></defs>';
    s+=solRingBack(b,R);
    s+='<circle cx="0" cy="0" r="'+R.toFixed(2)+'" fill="url(#'+gid+')"/>';
    if(opt.skin)s+='<g clip-path="url(#'+cid+')">'+solSkin(b,R)+'</g>';
    // le limbe: un liseré clair côté jour, qui détache la boule du fond noir
    if(!b.star)s+='<circle cx="0" cy="0" r="'+(R*0.985).toFixed(2)+'" fill="none" stroke="'
      +solLit(base,0.5)+'" stroke-width="'+Math.max(0.4,R*0.045).toFixed(2)+'" opacity="0.30"/>';
    s+=solRingFront(b,R);
    return s; }
  R.solar=function(box,c){
    box.className='iw iw-card iw-sol';
    var only=String(c.only||'').trim();
    var pick=only?only.split(',').map(function(s){ return iwNorm(s); }).filter(Boolean):null;
    var extra=(c.bodies||[]).map(function(b){
      if(!b||!b.label)return null;
      var o={k:'x'+iwNorm(b.label).split(' ').join(''),n:String(b.label),
        a:iwNum(b.a), e:iwNum(b.e)||0, pe:iwNum(b.pe)||0, L0:iwNum(b.L0)||0, inc:iwNum(b.inc)||0,
        m:iwNum(b.mass), r:iwNum(b.radius), rot:iwNum(b.rot), ax:iwNum(b.tilt),
        al:iwNum(b.albedo), sat:iwNum(b.moons), t:iwNum(b.temp),
        c:String(b.color||'#7ea0d6'), fam:String(b.family||'Corps ajouté'), d:String(b.desc||'')};
      return (o.m>0&&o.r>0)?o:null;
    }).filter(Boolean);
    var all=SOL_DATA.concat(extra);
    var bodies=pick?all.filter(function(b){ return pick.indexOf(iwNorm(b.n))>=0; }):all;
    if(!bodies.length)bodies=all;
    var orbs=bodies.filter(function(b){ return b.a>0; });
    if(!orbs.length)orbs=all.filter(function(b){ return b.a>0; });
    var sun=all[0];
    var view=String(c.view||'orbites').toLowerCase();
    if(['orbites','tailles','comparer','fiche'].indexOf(view)<0)view='orbites';
    var trueScale=String(c.dist||'')==='reel';
    var speed=Math.abs(iwNum(c.speed))||0.25;             // années par seconde
    var mass=Math.abs(iwNum(c.mass))||60;                 // masse du lecteur, kg
    var cmp=String(c.compare||'g');
    var night=String(c.sky||'')!=='papier';
    var sel=orbs.length?orbs[Math.min(orbs.length-1,2)]:bodies[0];
    if(c.body){ var want=iwNorm(c.body);
      for(var q=0;q<bodies.length;q++)if(iwNorm(bodies[q].n)===want)sel=bodies[q]; }
    var t=0, playing=true, raf=0, last=0;

    var TABS=[['orbites','Orbites'],['tailles','Tailles'],['comparer','Comparer'],['fiche','Fiche']];
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')
      +(c.intro?'<div class="iwsol-intro">'+iwRT(c.intro)+'</div>':'')
      +'<div class="iwsol-tabs" role="tablist">'+TABS.map(function(x){
        return '<button type="button" role="tab" data-v="'+x[0]+'"'+(x[0]===view?' class="on" aria-selected="true"':' aria-selected="false"')+'>'+x[1]+'</button>';
      }).join('')+'</div>'
      +'<div class="iwsol-view"></div>'
      +(c.note?'<div class="iwsol-note">'+iwRT(c.note)+'</div>':'');
    var host=box.querySelector('.iwsol-view');
    box.querySelectorAll('.iwsol-tabs button').forEach(function(btn){
      btn.addEventListener('click',function(){ view=btn.getAttribute('data-v');
        box.querySelectorAll('.iwsol-tabs button').forEach(function(o){
          o.classList.toggle('on',o===btn); o.setAttribute('aria-selected',o===btn?'true':'false'); });
        render(); });
    });

    /* ── vue 1: les orbites ──────────────────────────────────────────────── */
    var svgEl2=null, dots={}, trails={}, readout=null;
    var zoom=1, panX=0, panY=0, VW=560, VH=380, world=null, sung=null, KOF=null, AUPX=1, dragged=false;
    function orbitHTML(){
      return '<div class="iwsol-bar">'
        +'<button type="button" class="iwsol-play" data-play>'+(playing?'❙❙ Pause':'▶ Lecture')+'</button>'
        +'<label class="iwsol-sp">Vitesse<select data-speed>'
        +[0.02,0.1,0.25,1,5,25].map(function(v){
          return '<option value="'+v+'"'+(v===speed?' selected':'')+'>'+iwFrNum(v,2)+' an/s</option>'; }).join('')
        +'</select></label>'
        +'<label class="iwsol-sc"><input type="checkbox" data-true'+(trueScale?' checked':'')+'> Distances réelles</label>'
        +'<label class="iwsol-sc"><input type="checkbox" data-night'+(night?' checked':'')+'> Ciel nocturne</label>'
        +'<button type="button" data-reset>Revenir au 1<sup>er</sup> janvier 2000</button>'
        +'<span class="iwsol-date" data-date></span></div>'
        +'<div class="iwsol-stagewrap">'
        +'<div class="iwsol-zoom">'
          +'<button type="button" data-z="out" title="Reculer">−</button>'
          +'<span class="iwsol-zv" data-zv>×1</span>'
          +'<button type="button" data-z="in" title="Avancer">+</button>'
          +'<button type="button" data-z="fit" title="Tout le système">⤢</button>'
          +'<button type="button" data-z="orb" title="Cadrer l’orbite de la planète choisie">◎</button>'
        +'</div>'
        +'<div class="iwsol-stage"></div></div>'
        +'<div class="iwsol-live" data-live></div>'
        +'<div class="iwsol-cap">Vue de dessus du plan de l’écliptique. Les orbites sont de vraies ellipses'
        +' — le Soleil occupe un foyer, pas le centre — et chaque planète accélère au périhélie:'
        +' c’est la deuxième loi de Kepler, calculée et non imitée.'
        +'<b data-scalenote></b></div>';
    }
    /* Le zoom est « sémantique »: seules les distances grandissent, les boules et
       les étiquettes gardent leur taille. Un zoom d'image rendrait Jupiter gros
       comme la page avant que Mercure ne se détache du Soleil. Les orbites et
       les traînées vivent donc dans un groupe transformé, tout le reste est
       posé en pixels d'écran. */
    function drawOrbits(){
      var stage=host.querySelector('.iwsol-stage'); if(!stage)return;
      stage.classList.toggle('night',night);
      var W=Math.max(260,Math.min(760,stage.clientWidth||box.clientWidth||560));
      var H=Math.round(W*0.68);
      VW=W; VH=H;
      var Rb=Math.min(W,H)/2-16;
      var amax=0; orbs.forEach(function(b){ if(b.a>amax)amax=b.a; });
      var rank={}; orbs.slice().sort(function(x,y){ return x.a-y.a; })
        .forEach(function(b,i){ rank[b.k]=(i+1)/orbs.length; });
      /* À l'échelle, les quatre telluriques sont un pâté de points contre le
         Soleil. La compression mélange à parts égales la loi de puissance (qui
         garde le vrai resserrement du centre) et le rang (qui garantit un
         écart minimum entre deux orbites voisines). Seul le RAYON dessiné est
         tassé: chaque ellipse reste une ellipse, le Soleil reste au foyer, et
         la deuxième loi de Kepler reste visible. */
      function kOf(b){
        var f=trueScale?(b.a/amax):(0.5*rank[b.k]+0.5*Math.pow(b.a/amax,0.38));
        return Rb*f/b.a; }
      KOF=kOf; AUPX=Rb/amax;
      var uid='s'+(SOL_UID++);
      var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" class="iwsol-svg" role="img"'
        +' aria-label="Orbites du système solaire vues de dessus">';
      s+='<defs><radialGradient id="'+uid+'sun"><stop offset="0" stop-color="#fffdf2"/>'
        +'<stop offset="0.38" stop-color="#ffd76a"/><stop offset="1" stop-color="#e8791a"/></radialGradient>'
        +'<radialGradient id="'+uid+'halo"><stop offset="0" stop-color="#ffd07a" stop-opacity="0.5"/>'
        +'<stop offset="0.35" stop-color="#f79a2a" stop-opacity="0.16"/>'
        +'<stop offset="1" stop-color="#f7861a" stop-opacity="0"/></radialGradient></defs>';
      // le fond: du vrai noir et un ciel reproductible. Les étoiles ne bougent
      // pas quand on se déplace — à cette distance, elles ne bougeraient pas.
      if(night){
        s+='<rect width="'+W+'" height="'+H+'" fill="#070a14"/>'
          +'<g class="iwsol-sky">'+solStars(W,H,Math.round(W*H/620),1729)+'</g>';
      }
      s+='<g class="iwsol-world">';
      orbs.forEach(function(b){
        var k=kOf(b), ap=k*b.a, bp=ap*Math.sqrt(1-b.e*b.e);
        var ox=W/2-ap*b.e*Math.cos(b.pe*Math.PI/180), oy=H/2+ap*b.e*Math.sin(b.pe*Math.PI/180);
        s+='<ellipse class="iwsol-orb'+(b===sel?' on':'')+'" cx="'+ox.toFixed(2)+'" cy="'+oy.toFixed(2)
          +'" rx="'+ap.toFixed(2)+'" ry="'+bp.toFixed(2)+'" transform="rotate('+(-b.pe).toFixed(2)
          +' '+ox.toFixed(2)+' '+oy.toFixed(2)+')" stroke="'+esc(b.c)+'"/>';
      });
      // la traînée: quatre arcs de l'orbite juste derrière la planète, de plus
      // en plus pâles. Elle rend visible d'un coup d'œil qui va vite.
      orbs.forEach(function(b){ for(var q=0;q<SOL_TRAIL;q++)
        s+='<path class="iwsol-tr" data-tk="'+b.k+'" data-tq="'+q+'" stroke="'+solLit(b.c,0.35)
          +'" opacity="'+(0.85*Math.pow(1-q/SOL_TRAIL,1.6)).toFixed(3)+'"/>'; });
      s+='</g>';
      var sr=Math.max(9,Rb*0.052);
      s+='<g class="iwsol-sung"><circle r="'+(sr*3.4).toFixed(1)+'" fill="url(#'+uid+'halo)"/>'
        +'<circle r="'+sr.toFixed(1)+'" fill="url(#'+uid+'sun)"/></g>';
      orbs.forEach(function(b){
        var rr=2.2+3*Math.pow(b.r/6371,0.4);
        s+='<g class="iwsol-pl'+(b===sel?' on':'')+'" data-k="'+b.k+'" tabindex="0" role="button"'
          +' aria-label="'+esc(b.n)+'"><circle class="iwsol-hit" r="'+Math.max(12,rr+8).toFixed(1)+'"/>'
          +'<circle class="iwsol-glow" r="'+(rr*2.1).toFixed(1)+'" fill="'+esc(b.c)+'"/>'
          +solOrb(b,rr,uid+b.k,{skin:rr>7})
          +'<text class="iwsol-lab" y="'+(-rr-7).toFixed(1)+'">'+esc(b.n)+'</text></g>';
      });
      // une échelle chiffrée: sans elle, « distances réelles » ne veut rien dire
      s+='<g class="iwsol-bar2"><line class="iwsol-bl" data-bl/>'
        +'<text class="iwsol-bt" data-bt></text></g>';
      stage.innerHTML=s+'</svg>';
      svgEl2=stage.querySelector('svg'); dots={}; trails={};
      world=stage.querySelector('.iwsol-world'); sung=stage.querySelector('.iwsol-sung');
      stage.querySelectorAll('.iwsol-tr').forEach(function(p){
        (trails[p.getAttribute('data-tk')]=trails[p.getAttribute('data-tk')]||[])[+p.getAttribute('data-tq')]=p; });
      stage.querySelectorAll('.iwsol-pl').forEach(function(g){
        var key=g.getAttribute('data-k');
        dots[key]={g:g,k:kOf(byKey(key)),grad:stage.querySelector('#'+uid+key+'-g')};
        var go=function(){ sel=byKey(key); drawOrbits(); tick(0); };
        g.addEventListener('click',function(e){ if(dragged)return; e.stopPropagation(); go(); });
        g.addEventListener('dblclick',function(e){ e.stopPropagation(); sel=byKey(key); frameOrbit(); });
        g.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
      });
      var sn=host.querySelector('[data-scalenote]');
      if(sn)sn.innerHTML=trueScale
        ? ' Distances à l’échelle: les quatre telluriques se serrent contre le Soleil, et c’est la réalité. Zoomez (boutons, ou Ctrl + molette) pour les séparer; glissez pour vous déplacer.'
        : ' Distances compressées pour tenir dans le cadre; cochez « distances réelles », puis zoomez, pour voir le vrai vide.';
      applyView();   // pose le zoom, la grappe et la barre d échelle
      place();
    }
    function byKey(k){ for(var i=0;i<orbs.length;i++)if(orbs[i].k===k)return orbs[i]; return orbs[0]; }
    /* Une longueur ronde — 0,1 / 0,2 / 0,5 / 1 / 2 / 5 ua… — dont la barre fait
       entre soixante et cent quarante pixels au zoom courant. */
    var SOL_STEPS=[0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10,20,50,100];
    function drawScaleBar(){
      var ln=host.querySelector('[data-bl]'), tx=host.querySelector('[data-bt]');
      if(!ln||!tx)return;
      if(!trueScale){ ln.setAttribute('x1',-99); ln.setAttribute('x2',-99); tx.textContent=''; return; }
      var per=AUPX*zoom, i, L=0, v=SOL_STEPS[0];
      for(i=0;i<SOL_STEPS.length;i++){ L=SOL_STEPS[i]*per; v=SOL_STEPS[i]; if(L>=62)break; }
      var x0=14, y=VH-16;
      ln.setAttribute('x1',x0); ln.setAttribute('x2',x0+L); ln.setAttribute('y1',y); ln.setAttribute('y2',y);
      tx.setAttribute('x',x0); tx.setAttribute('y',y-7);
      tx.textContent=iwFrNum(v,2)+' ua';
    }
    function applyView(){
      if(world)world.setAttribute('transform','translate('+(VW/2+panX).toFixed(2)+' '+(VH/2+panY).toFixed(2)
        +') scale('+zoom.toFixed(5)+') translate('+(-VW/2).toFixed(2)+' '+(-VH/2).toFixed(2)+')');
      if(sung)sung.setAttribute('transform','translate('+(VW/2+panX).toFixed(2)+' '+(VH/2+panY).toFixed(2)+')');
      var zv=host.querySelector('[data-zv]');
      if(zv)zv.textContent='×'+(zoom<10?iwFrNum(zoom,1):iwFrNum(zoom,0));
      drawScaleBar();
    }
    function setZoom(z,ax,ay){
      z=Math.max(0.5,Math.min(600,z));
      // garder fixe le point visé: sans cela, zoomer chasse hors du cadre ce
      // qu'on regardait
      if(ax!=null){ var f=z/zoom;
        panX=ax-VW/2-(ax-VW/2-panX)*f;
        panY=ay-VH/2-(ay-VH/2-panY)*f; }
      zoom=z; applyView(); place();
    }
    function frameOrbit(){
      if(!sel||!sel.a){ setZoom(1); panX=panY=0; applyView(); place(); return; }
      var far=(KOF?KOF(sel):1)*sel.a*(1+sel.e);
      panX=0; panY=0;
      setZoom(far>0?(0.44*Math.min(VW,VH))/far:1);
      drawOrbits();
    }
    function place(){
      var live=host.querySelector('[data-live]'), dt=host.querySelector('[data-date]');
      if(dt)dt.textContent=solDate(t);
      var ox=VW/2+panX, oy=VH/2+panY;
      for(var k in dots){ var D=dots[k], b=byKey(k), p=solPos(b,t);
        var px=ox+p.x*D.k*zoom, py=oy-p.y*D.k*zoom;
        D.g.setAttribute('transform','translate('+px.toFixed(2)+' '+py.toFixed(2)+')');
        // hors cadre: inutile de le peindre, et cela évite les étiquettes
        // collées au bord quand on est zoomé au fond du système
        var out=px<-40||px>VW+40||py<-40||py>VH+40;
        D.g.style.display=out?'none':'';
        // le point chaud du dégradé pointe vers le Soleil: le terminateur
        // tourne donc avec la planète, ce qui est exactement ce qui se passe
        if(D.grad){ var L=Math.sqrt(p.x*p.x+p.y*p.y)||1;
          D.grad.setAttribute('fx',(0.5-0.30*p.x/L).toFixed(3));
          D.grad.setAttribute('fy',(0.5+0.30*p.y/L).toFixed(3)); }
        var tp=trails[k];
        if(tp){ var T=Math.pow(b.a,1.5), span=T*0.085;
          for(var q=0;q<tp.length;q++){ if(!tp[q])continue;
            var d='', m;
            for(m=0;m<=3;m++){ var tt=t-span*(q+m/3)/SOL_TRAIL, pp=solPos(b,tt);
              d+=(m?' L':'M')+(VW/2+pp.x*D.k).toFixed(2)+' '+(VH/2-pp.y*D.k).toFixed(2); }
            tp[q].setAttribute('d',d); } }
      }
      if(live&&sel&&sel.a){ var p2=solPos(sel,t), dv=solDeriv(sel);
        live.innerHTML='<b style="color:'+esc(sel.c)+'">'+esc(sel.n)+'</b>'
          +'<span>distance au Soleil <b>'+iwFrNum(p2.r,3)+' ua</b></span>'
          +'<span>vitesse <b>'+iwFrNum(p2.v/1000,2)+' km/s</b></span>'
          +'<span>période <b>'+(dv.T<1?iwFrNum(dv.T*SOL_YRD,1)+' jours':iwFrNum(dv.T,2)+(dv.T<2?' an':' ans'))+'</b></span>'
          +'<span class="iwsol-ext">périhélie '+iwFrNum(dv.per,3)+' ua · aphélie '+iwFrNum(dv.aph,3)+' ua</span>';
      } else if(live)live.innerHTML='';
    }
    function tick(dtms){
      if(playing&&dtms>0)t+=speed*dtms/1000;
      place();
    }
    function loop(ts){
      if(!playing){ raf=0; return; }
      var dtms=last?Math.min(120,ts-last):0; last=ts;
      tick(dtms); raf=requestAnimationFrame(loop);
    }
    function start(){ if(playing&&!raf&&window.requestAnimationFrame){ last=0; raf=requestAnimationFrame(loop); } }
    function stop(){ if(raf)cancelAnimationFrame(raf); raf=0; }

    /* ── vue 2: les tailles, à l'échelle ─────────────────────────────────── */
    function sizesHTML(){
      var list=bodies.slice().sort(function(x,y){ return y.r-x.r; });
      // le Soleil est 109 fois la Terre: le mettre à côté écrase tout le reste
      var withSun=list.length>1&&list[0].star;
      var shown=withSun?list.slice(1):list;
      var top=shown.length?shown[0].r:1, maxpx=76;
      var s='<div class="iwsol-sizes">';
      shown.forEach(function(b){
        var rr=maxpx*(b.r/top);
        var pad=solPad(b), VB=(2*rr*pad).toFixed(1);
        s+='<button type="button" class="iwsol-sz'+(b===sel?' on':'')+'" data-k="'+b.k+'">'
          +'<svg class="iwsol-szd" width="'+VB+'" height="'+VB+'" viewBox="'+(-rr*pad).toFixed(1)+' '+(-rr*pad).toFixed(1)+' '+VB+' '+VB+'">'
          +solOrb(b,rr,'sz'+(SOL_UID++)+b.k,{skin:1})+'</svg>'
          +'<b>'+esc(b.n)+'</b><i>'+iwFrNum(2*b.r,0)+' km</i>'
          +'<i class="iwsol-rel">'+(b.r>=6371?iwFrNum(b.r/6371,2)+' × Terre':iwFrNum(b.r/6371,3)+' × Terre')+'</i></button>';
      });
      s+='</div>';
      /* Un disque solaire à la même échelle ferait quinze cents pixels: il ne
         cadre pas, et un fragment de son bord ne dit rien de plus. La chaîne de
         Terres en travers de son diamètre, elle, se lit d'un coup. */
      if(withSun){
        var ref=null; shown.forEach(function(x){ if(!ref&&x.k==='terre')ref=x; });
        if(!ref)ref=shown[shown.length-1]||list[0];
        var many=Math.max(2,Math.round(list[0].r/ref.r)), CW=700, CH=26, dd=CW/many, row='';
        for(var q=0;q<many;q++)row+='<circle cx="'+((q+0.5)*dd).toFixed(2)+'" cy="13" r="'
          +Math.max(1.1,dd/2-0.35).toFixed(2)+'"/>';
        s+='<div class="iwsol-suncmp"><div class="iwsol-sunband">'
          +'<svg viewBox="0 0 '+CW+' '+CH+'" preserveAspectRatio="none" class="iwsol-chain" role="img"'
          +' aria-label="'+many+' '+esc(ref.n)+'s alignées en travers du Soleil">'
          +'<g fill="'+esc(ref.c)+'">'+row+'</g></svg></div>'
          +'<p><b>'+iwFrNum(many,0)+' '+esc(ref.n)+'s alignées</b> tiennent en travers du Soleil, dont le'
          +' diamètre est de '+iwFrNum(2*list[0].r,0)+' km. À l’échelle des disques ci-dessus il ferait '
          +iwFrNum(2*maxpx*(list[0].r/top),0)+' pixels de large: aucune page ne le contient.</p></div>';
      }
      // la maquette: un rapport unique appliqué aux diamètres ET aux distances
      var earth=null; bodies.forEach(function(b){ if(b.k==='terre')earth=b; });
      if(earth){
        s+='<div class="iwsol-model"><div class="iwsol-mh">Si le Soleil était un ballon d’un mètre…</div>'
          +'<table class="iwsol-tab"><thead><tr><th>Corps</th><th>Diamètre</th><th>Distance au ballon</th></tr></thead><tbody>';
        var f=1/(2*sun.r*1000);                            // mètres de maquette par mètre réel
        orbs.forEach(function(b){
          var dia=2*b.r*1000*f, dist=b.a*SOL_AU*f;
          s+='<tr'+(b===sel?' class="on"':'')+'><td><i style="background:'+esc(b.c)+'"></i>'+esc(b.n)+'</td>'
            +'<td>'+(dia<0.01?iwFrNum(dia*1000,2)+' mm':iwFrNum(dia*100,2)+' cm')+'</td>'
            +'<td>'+(dist<1000?iwFrNum(dist,1)+' m':iwFrNum(dist/1000,2)+' km')+'</td></tr>';
        });
        s+='</tbody></table><p class="iwsol-cap">Le même facteur réduit les diamètres et les distances.'
          +' C’est pourquoi aucune image du système solaire n’est à l’échelle: à cette taille, Neptune serait'
          +' à '+iwFrNum(30.07*SOL_AU/(2*sun.r*1000)/1000,1)+' km du ballon.</p></div>';
      }
      return s;
    }

    /* ── vue 3: comparer une grandeur ────────────────────────────────────── */
    var PROPS=[
      {k:'g',    lab:'Pesanteur de surface',   unit:'m/s²',   get:function(b){ return solDeriv(b).g; },        dec:2, calc:1},
      {k:'vesc', lab:'Vitesse de libération',  unit:'km/s',   get:function(b){ return solDeriv(b).vesc/1000; },dec:2, calc:1},
      {k:'rho',  lab:'Masse volumique',        unit:'kg/m³',  get:function(b){ return solDeriv(b).rho; },      dec:0, calc:1},
      {k:'m',    lab:'Masse',                  unit:'× Terre',get:function(b){ return b.m/5.97237e24; },       dec:2, log:1},
      {k:'r',    lab:'Rayon',                  unit:'km',     get:function(b){ return b.r; },                  dec:0},
      {k:'a',    lab:'Distance au Soleil',     unit:'ua',     get:function(b){ return b.a||0; },               dec:2},
      {k:'T',    lab:'Période de révolution',  unit:'ans',    get:function(b){ return b.a?Math.pow(b.a,1.5):0; },dec:2, log:1, calc:1},
      {k:'rot',  lab:'Durée du jour',          unit:'heures', get:function(b){ return Math.abs(b.rot||0); },   dec:1},
      {k:'t',    lab:'Température mesurée',    unit:'K',      get:function(b){ return b.t||0; },               dec:0},
      {k:'teq',  lab:'Température calculée',   unit:'K',      get:function(b){ return solDeriv(b).teq||0; },   dec:0, calc:1},
      {k:'sat',  lab:'Satellites connus',      unit:'',       get:function(b){ return b.sat||0; },             dec:0},
      {k:'e',    lab:'Excentricité',           unit:'',       get:function(b){ return b.e||0; },               dec:4},
      {k:'ax',   lab:'Inclinaison de l’axe',   unit:'°',      get:function(b){ return b.ax||0; },              dec:1}
    ];
    function propOf(k){ for(var i=0;i<PROPS.length;i++)if(PROPS[i].k===k)return PROPS[i]; return PROPS[0]; }
    function compareHTML(){
      var P=propOf(cmp), rows=bodies.map(function(b){ return {b:b,v:P.get(b)}; })
        .filter(function(x){ return isFinite(x.v)&&x.v>0; })
        .sort(function(x,y){ return y.v-x.v; });
      var top=rows.length?rows[0].v:1;
      var useLog=P.log&&rows.length>1&&top/rows[rows.length-1].v>60;
      var s='<div class="iwsol-cmpbar"><label>Comparer<select data-cmp>'
        +PROPS.map(function(p){ return '<option value="'+p.k+'"'+(p.k===cmp?' selected':'')+'>'+p.lab+'</option>'; }).join('')
        +'</select></label>'+(P.calc?'<span class="iwsol-badge">calculée, pas saisie</span>':'')
        +(useLog?'<span class="iwsol-badge alt">échelle logarithmique</span>':'')+'</div>';
      s+='<div class="iwsol-bars">';
      rows.forEach(function(x){
        var f=useLog?(Math.log(x.v)-Math.log(rows[rows.length-1].v)*0.98)/(Math.log(top)-Math.log(rows[rows.length-1].v)*0.98):x.v/top;
        f=Math.max(0.02,Math.min(1,f));
        s+='<button type="button" class="iwsol-brow'+(x.b===sel?' on':'')+'" data-k="'+x.b.k+'">'
          +'<span class="iwsol-bn"><i style="background:'+esc(x.b.c)+'"></i>'+esc(x.b.n)+'</span>'
          +'<span class="iwsol-btr"><i style="width:'+(f*100).toFixed(1)+'%;background:'+esc(x.b.c)+'"></i></span>'
          +'<span class="iwsol-bv">'+solSci(x.v,P.dec)+(P.unit?(P.unit==='°'?'<em>°</em>':' <em>'+esc(P.unit)+'</em>'):'')+'</span></button>';
      });
      return s+'</div>';
    }

    /* ── vue 4: la fiche d'un corps ──────────────────────────────────────── */
    function ficheHTML(){
      var b=sel, dv=solDeriv(b);
      var s='<div class="iwsol-pick">'+bodies.map(function(x){
        return '<button type="button" class="iwsol-chip'+(x===b?' on':'')+'" data-k="'+x.k+'">'
          +'<i style="background:'+esc(x.c)+'"></i>'+esc(x.n)+'</button>'; }).join('')+'</div>';
      var HP=solPad(b), HR=Math.round(30/HP), HV=(2*HR*HP).toFixed(1);
      s+='<div class="iwsol-card"><div class="iwsol-ch">'
        +'<svg class="iwsol-disc" width="'+HV+'" height="'+HV+'" viewBox="'+(-HR*HP).toFixed(1)+' '+(-HR*HP).toFixed(1)+' '+HV+' '+HV+'">'
        +solOrb(b,HR,'fc'+(SOL_UID++)+b.k,{skin:1})+'</svg>'
        +'<span><b>'+esc(b.n)+'</b><i>'+esc(b.fam||'')+'</i></span></div>';
      if(b.d)s+='<p class="iwsol-cd">'+iwRT(b.d)+'</p>';
      var meas=[['Masse',solSci(b.m,3)+' kg'],['Rayon moyen',iwFrNum(b.r,1)+' km']];
      if(b.a)meas.push(['Demi-grand axe',iwFrNum(b.a,4)+' ua'],['Excentricité',iwFrNum(b.e,5)],
        ['Inclinaison de l’orbite',iwFrNum(b.inc,2)+'°']);
      if(b.rot)meas.push(['Rotation',iwFrNum(Math.abs(b.rot),2)+' h'+(b.rot<0?' (rétrograde)':'')]);
      if(b.ax!=null)meas.push(['Inclinaison de l’axe',iwFrNum(b.ax,2)+'°']);
      if(b.al!=null)meas.push(['Albédo de Bond',iwFrNum(b.al,3)]);
      if(b.sat!=null)meas.push(['Satellites connus',iwFrNum(b.sat,0)]);
      if(b.t)meas.push(['Température moyenne',iwFrNum(b.t,0)+' K ('+iwFrNum(b.t-273.15,0)+' °C)']);
      s+='<div class="iwsol-sec"><h4>Mesuré</h4><dl class="iwsol-dl">'
        +meas.map(function(m){ return '<div><dt>'+m[0]+'</dt><dd>'+m[1]+'</dd></div>'; }).join('')+'</dl></div>';
      var der=[['Pesanteur de surface','g = GM / R²',iwFrNum(dv.g,2)+' m/s²',
                iwFrNum(dv.g/9.80665,2)+' × celle de la Terre'],
               ['Vitesse de libération','v = √(2GM / R)',iwFrNum(dv.vesc/1000,2)+' km/s',''],
               ['Masse volumique','ρ = M / (4/3 π R³)',iwFrNum(dv.rho,0)+' kg/m³',
                dv.rho<1000?'moins dense que l’eau':'']];
      if(dv.T)der.push(['Période de révolution','T = a<sup>3/2</sup> — 3<sup>e</sup> loi de Kepler',
        (dv.T<1?iwFrNum(dv.T*SOL_YRD,1)+' jours':iwFrNum(dv.T,3)+(dv.T<2?' an':' ans')),
        dv.T<1?'':iwFrNum(dv.T*SOL_YRD,0)+' jours']);
      if(dv.vorb)der.push(['Vitesse orbitale moyenne','v = √(GM<sub>☉</sub> / a)',iwFrNum(dv.vorb/1000,2)+' km/s','']);
      if(dv.per)der.push(['Périhélie et aphélie','a(1−e) et a(1+e)',
        iwFrNum(dv.per,3)+' — '+iwFrNum(dv.aph,3)+' ua','']);
      s+='<div class="iwsol-sec"><h4>Calculé <span>à partir des trois nombres du dessus</span></h4>'
        +'<div class="iwsol-calcs">'+der.map(function(d){
          return '<div class="iwsol-calc"><b>'+d[0]+'</b><code>'+d[1]+'</code>'
            +'<span class="iwsol-val">'+d[2]+'</span>'+(d[3]?'<em>'+d[3]+'</em>':'')+'</div>'; }).join('')+'</div></div>';
      if(dv.teq){
        var over=dv.serre||0;
        s+='<div class="iwsol-sec iwsol-green"><h4>Le bilan radiatif</h4>'
          +'<div class="iwsol-tline"><span>Calculée sans atmosphère<code>T = T<sub>☉</sub> √(R<sub>☉</sub>/2d) (1−A)<sup>¼</sup></code></span>'
          +'<b>'+iwFrNum(dv.teq,0)+' K</b></div>'
          +'<div class="iwsol-tline"><span>Mesurée</span><b>'+iwFrNum(b.t,0)+' K</b></div>'
          +'<div class="iwsol-tline iwsol-gap"><span>Écart</span><b>'+(over>0?'+':'')+iwFrNum(over,0)+' K</b></div>'
          +'<p>'+(Math.abs(over)<8
            ? 'Le calcul tombe juste: l’atmosphère est trop mince pour retenir la chaleur.'
            : (b.k==='jupiter'||b.k==='saturne'||b.k==='uranus'||b.k==='neptune'
              ? 'Une géante rayonne plus qu’elle ne reçoit: l’écart vient surtout de sa chaleur interne, pas d’un effet de serre.'
              : 'Cet écart est l’effet de serre — ce que l’atmosphère renvoie vers le sol.'))+'</p></div>';
      }
      s+='<div class="iwsol-sec"><h4>Votre poids</h4><div class="iwsol-weigh">'
        +'<label>Masse <input type="number" min="1" max="500" step="1" data-mass value="'+iwFrNum(mass,0)+'"> kg</label>'
        +'<span class="iwsol-wout" data-wout></span></div>'
        +'<p class="iwsol-cap">La masse ne change pas d’un astre à l’autre; le poids, si: P = m g.</p></div>';
      return s+'</div>';
    }
    function weigh(){
      var out=host.querySelector('[data-wout]'); if(!out)return;
      var g=solDeriv(sel).g;
      out.innerHTML='<b>'+iwFrNum(mass*g,0)+' N</b> sur '+esc(sel.n)
        +' <em>soit ce que pèserait '+iwFrNum(mass*g/9.80665,1)+' kg sur Terre</em>';
    }

    function render(){
      stop();
      if(view==='orbites'){
        host.innerHTML=orbitHTML();
        host.querySelector('[data-play]').addEventListener('click',function(){
          playing=!playing; this.innerHTML=playing?'❙❙ Pause':'▶ Lecture'; if(playing)start(); else stop(); });
        host.querySelector('[data-speed]').addEventListener('change',function(){ speed=parseFloat(this.value)||0.25; });
        host.querySelector('[data-true]').addEventListener('change',function(){ trueScale=this.checked; drawOrbits(); });
        host.querySelector('[data-night]').addEventListener('change',function(){ night=this.checked; drawOrbits(); });
        // changer d'échelle change tout: repartir d'une vue d'ensemble
        host.querySelector('[data-true]').addEventListener('change',function(){ zoom=1; panX=panY=0; });
        host.querySelectorAll('.iwsol-zoom [data-z]').forEach(function(bt){
          bt.addEventListener('click',function(e){ e.preventDefault(); var z=bt.getAttribute('data-z');
            if(z==='in')setZoom(zoom*1.6); else if(z==='out')setZoom(zoom/1.6);
            else if(z==='orb')frameOrbit();
            else { zoom=1; panX=panY=0; applyView(); place(); } }); });
        var st=host.querySelector('.iwsol-stage');
        // molette NUE = la page défile. Un livre se lit en faisant défiler,
        // et capturer la molette piège le lecteur dans la figure.
        st.addEventListener('wheel',function(e){ if(!e.ctrlKey&&!e.metaKey)return;
          e.preventDefault(); var r=st.getBoundingClientRect();
          setZoom(zoom*(e.deltaY<0?1.16:1/1.16),(e.clientX-r.left)*VW/r.width,(e.clientY-r.top)*VH/r.height);
        },{passive:false});
        st.addEventListener('pointerdown',function(e){ if(e.button)return;
          var r=st.getBoundingClientRect(), sx=e.clientX, sy=e.clientY, px0=panX, py0=panY, moved=0;
          dragged=false; st.classList.add('grab');
          var mv=function(ev){ var dx=(ev.clientX-sx)*VW/r.width, dy=(ev.clientY-sy)*VH/r.height;
            moved+=Math.abs(dx)+Math.abs(dy); if(moved>4)dragged=true;
            panX=px0+dx; panY=py0+dy; applyView(); place(); };
          var up=function(){ st.classList.remove('grab');
            window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up);
            setTimeout(function(){ dragged=false; },0); };
          window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); });
        host.querySelector('[data-reset]').addEventListener('click',function(){ t=0; place(); });
        drawOrbits();
        // la première mise en page peut ne pas être finie: on redessine, et pas
        // seulement depuis rAF, qui ne se déclenche jamais dans un onglet caché
        setTimeout(drawOrbits,60); setTimeout(drawOrbits,420);
        start();
      } else if(view==='tailles'){
        host.innerHTML=sizesHTML();
        host.querySelectorAll('[data-k]').forEach(function(el){
          el.addEventListener('click',function(){ sel=byAny(el.getAttribute('data-k')); render(); }); });
      } else if(view==='comparer'){
        host.innerHTML=compareHTML();
        host.querySelector('[data-cmp]').addEventListener('change',function(){ cmp=this.value; render(); });
        host.querySelectorAll('.iwsol-brow').forEach(function(el){
          el.addEventListener('click',function(){ sel=byAny(el.getAttribute('data-k')); render(); }); });
      } else {
        host.innerHTML=ficheHTML();
        host.querySelectorAll('.iwsol-chip').forEach(function(el){
          el.addEventListener('click',function(){ sel=byAny(el.getAttribute('data-k')); render(); }); });
        var mi=host.querySelector('[data-mass]');
        mi.addEventListener('input',function(){ var v=iwNum(this.value); if(v>0){ mass=v; weigh(); } });
        weigh();
      }
    }
    function byAny(k){ for(var i=0;i<bodies.length;i++)if(bodies[i].k===k)return bodies[i]; return sel; }
    render();
    window.addEventListener('resize',function(){ if(view==='orbites')drawOrbits(); });
    // ne pas faire tourner le système derrière un autre chapitre
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        for(var i=0;i<es.length;i++){ if(es[i].isIntersecting){ if(view==='orbites')start(); } else stop(); }
      },{threshold:0}).observe(box);
    }
  };
  R.fieldmap=function(box,c){
    box.className='iw iw-card iw-fm';
    var kind=String(c.kind||'electric').toLowerCase();
    if(kind!=='gravity'&&kind!=='magnet')kind='electric';
    var srcs=(c.sources||[]).map(function(s){
      var q=iwNum(s&&s.q); if(q==null)q=1;
      if(kind==='gravity')q=Math.abs(q)||1;          // masses only ever attract
      return {label:String((s&&s.label)||''),x:iwNum(s&&s.x)||0,y:iwNum(s&&s.y)||0,
        q:q,color:String((s&&s.color)||'')};
    }).filter(function(s){ return s.q!==0; });
    if(!srcs.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins une source.</div>'; return; }
    var mode=String(c.mode||'arrows').toLowerCase();
    if(mode!=='lines'&&mode!=='both')mode='arrows';
    var probe=iwBool(c.probe,true), R0=Math.abs(iwNum(c.span)||10);
    var SYM=kind==='gravity'?'g':(kind==='magnet'?'B':'E');
    // the field at a point, in arbitrary units: sum of q/r^2 along r-hat
    function at(px,py){
      var fx=0, fy=0, i, s, dx, dy, r2, r;
      for(i=0;i<srcs.length;i++){ s=srcs[i];
        dx=px-s.x; dy=py-s.y; r2=dx*dx+dy*dy;
        if(r2<0.09)r2=0.09;
        r=Math.sqrt(r2);
        var k=(kind==='gravity'?-Math.abs(s.q):s.q)/(r2*r);
        fx+=k*dx; fy+=k*dy; }
      return [fx,fy];
    }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwfm-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwfm-stage"></div>'+
      '<div class="iwfm-legend">'+srcs.map(function(s,i){
        return '<span class="iwfm-lg"><i class="'+(s.q<0?'neg':'pos')+'" style="'+
          (s.color?'background:'+esc(s.color):'')+'"></i>'+
          esc(s.label||((s.q>0?'+':'')+iwFrNum(s.q,1)))+'</span>'; }).join('')+
      (probe?'<span class="iwfm-hint">Faites glisser le point de test.</span>':'')+'</div>'+
      '<div class="iwfm-read"></div>'+
      (c.note?'<div class="iwfm-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwfm-stage'), read=box.querySelector('.iwfm-read');
    var pxu=R0*0.55, pyu=R0*0.35, W=0, H=0, per=1;
    function X(u){ return (u+R0)*per; }
    function Y(u){ return (R0*H/W-u)*per; }
    function draw(){
      var w=Math.max(220,stage.clientWidth||box.clientWidth||520);
      W=Math.round(Math.min(w,760)); H=Math.round(W*0.62); per=W/(2*R0);
      var ry=R0*H/W;                                     // half-height in field units
      var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" class="iwfm-svg">';
      var i,j,px,py,f,m,mag=[],maxm=0;
      if(mode!=='lines'){
        var step=Math.max(26,Math.round(W/16));
        for(px=step/2;px<W;px+=step)for(py=step/2;py<H;py+=step){
          f=at(px/per-R0,ry-py/per); m=Math.sqrt(f[0]*f[0]+f[1]*f[1]);
          mag.push({px:px,py:py,fx:f[0],fy:f[1],m:m}); if(m>maxm)maxm=m; }
        s+='<g class="iwfm-arr">'+mag.map(function(a){
          if(!(a.m>0))return '';
          var k=Math.min(1,Math.pow(a.m/maxm,0.32)), L=step*0.42*(0.35+0.65*k);
          var ux=a.fx/a.m*L, uy=-a.fy/a.m*L;
          return '<line x1="'+(a.px-ux/2).toFixed(1)+'" y1="'+(a.py-uy/2).toFixed(1)+
            '" x2="'+(a.px+ux/2).toFixed(1)+'" y2="'+(a.py+uy/2).toFixed(1)+
            '" opacity="'+(0.25+0.6*k).toFixed(2)+'" marker-end="url(#iwfmA)"/>'; }).join('')+'</g>';
      }
      if(mode!=='arrows'){
        // streamlines: leave each source in even directions and follow the field
        var out=[], n=12;
        srcs.forEach(function(sc){
          if(kind!=='gravity'&&sc.q<0)return;             // lines run out of + and into −
          for(i=0;i<n;i++){
            var a=i/n*Math.PI*2, ppx=sc.x+0.45*Math.cos(a), ppy=sc.y+0.45*Math.sin(a);
            var d=(kind==='gravity'?-1:1), pts=[], guard=0;
            while(guard++<420){
              pts.push([X(ppx),Y(ppy)]);
              var ff=at(ppx,ppy), mm=Math.sqrt(ff[0]*ff[0]+ff[1]*ff[1]);
              if(!(mm>0))break;
              ppx+=d*ff[0]/mm*0.14; ppy+=d*ff[1]/mm*0.14;
              if(ppx<-R0-1||ppx>R0+1||ppy<-ry-1||ppy>ry+1)break;
              var hit=false;
              srcs.forEach(function(o){ if(o===sc)return;
                if(Math.abs(o.x-ppx)<0.3&&Math.abs(o.y-ppy)<0.3)hit=true; });
              if(hit)break;
            }
            if(pts.length>3)out.push('<path d="M'+pts.map(function(p){ return p[0].toFixed(1)+' '+p[1].toFixed(1); }).join('L')+'"/>');
          } });
        s+='<g class="iwfm-lines">'+out.join('')+'</g>';
      }
      s+='<defs><marker id="iwfmA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'+
        '<path d="M0 0L10 5L0 10z"/></marker></defs>';
      srcs.forEach(function(sc){
        var r=Math.max(9,Math.min(20,9+Math.abs(sc.q)*3));
        s+='<circle class="iwfm-src '+(sc.q<0?'neg':'pos')+'" cx="'+X(sc.x)+'" cy="'+Y(sc.y)+'" r="'+r+'"'+
          (sc.color?' style="fill:'+esc(sc.color)+'"':'')+'/>'+
          '<text class="iwfm-sg" x="'+X(sc.x)+'" y="'+Y(sc.y)+'">'+
          (kind==='gravity'?'M':(sc.q<0?String.fromCharCode(0x2212):'+'))+'</text>'+
          (sc.label?'<text class="iwfm-sl" x="'+X(sc.x)+'" y="'+(Y(sc.y)+r+13)+'">'+esc(sc.label)+'</text>':'');
      });
      if(probe){
        s+='<line class="iwfm-pv" x1="0" y1="0" x2="0" y2="0" marker-end="url(#iwfmP)"/>'+
          '<circle class="iwfm-p" cx="0" cy="0" r="7"/>'+
          '<defs><marker id="iwfmP" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'+
          '<path d="M0 0L10 5L0 10z"/></marker></defs>';
      }
      s+='</svg>';
      stage.innerHTML=s;
      if(probe)place(pxu,pyu);
    }
    function place(ux,uy){
      var ry=R0*H/W;
      pxu=Math.max(-R0,Math.min(R0,ux)); pyu=Math.max(-ry,Math.min(ry,uy));
      var dot=stage.querySelector('.iwfm-p'), arr=stage.querySelector('.iwfm-pv');
      if(!dot)return;
      var f=at(pxu,pyu), m=Math.sqrt(f[0]*f[0]+f[1]*f[1]);
      var L=Math.min(64,14+Math.pow(m,0.34)*26);
      dot.setAttribute('cx',X(pxu)); dot.setAttribute('cy',Y(pyu));
      arr.setAttribute('x1',X(pxu)); arr.setAttribute('y1',Y(pyu));
      arr.setAttribute('x2',X(pxu)+(m?f[0]/m*L:0)); arr.setAttribute('y2',Y(pyu)-(m?f[1]/m*L:0));
      read.innerHTML='<b>'+SYM+'</b> au point ('+iwFrNum(pxu,1)+' ; '+iwFrNum(pyu,1)+
        ') &nbsp;·&nbsp; direction '+Math.round((Math.atan2(f[1],f[0])*180/Math.PI+360)%360)+
        String.fromCharCode(0xB0)+' &nbsp;·&nbsp; intensité relative '+iwFrSig(m,2);
    }
    if(probe){
      var drag=false;
      var pt=function(ev){
        var r=stage.querySelector('svg').getBoundingClientRect();
        var cx=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left;
        var cy=(ev.touches?ev.touches[0].clientY:ev.clientY)-r.top;
        place(cx/r.width*W/per-R0,R0*H/W-cy/r.height*H/per); };
      stage.addEventListener('pointerdown',function(ev){ drag=true; pt(ev); ev.preventDefault(); });
      window.addEventListener('pointermove',function(ev){ if(drag)pt(ev); });
      window.addEventListener('pointerup',function(){ drag=false; });
    }
    iwWatch(box,draw);
  };

  /* ── colormix: how colours add, subtract and filter ──────────────────────
     Four figures that every art room and every optics chapter needs, and that
     are the same arithmetic underneath: light adds (screen), pigment and
     filters subtract (multiply), and the wheel is just the pairs that add to
     white. Doing it for real means the reader can switch a lamp off and watch
     the answer change, instead of being told what would happen. */
  var CM_NAMES=[[255,0,0,'rouge'],[0,255,0,'vert'],[0,0,255,'bleu'],[255,255,0,'jaune'],
    [0,255,255,'cyan'],[255,0,255,'magenta'],[255,255,255,'blanc'],[0,0,0,'noir'],
    [255,128,0,'orange'],[128,0,255,'violet'],[128,128,128,'gris']];
  function cmHex(s,dflt){
    s=String(s==null?'':s).trim();
    var m=new RegExp('^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$').exec(s);
    if(!m)return dflt;
    var h=m[1];
    if(h.length===3)h=h.charAt(0)+h.charAt(0)+h.charAt(1)+h.charAt(1)+h.charAt(2)+h.charAt(2);
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function cmStr(a){ return 'rgb('+Math.round(a[0])+','+Math.round(a[1])+','+Math.round(a[2])+')'; }
  function cmName(a){
    var best='', bd=1e9, i, d;
    for(i=0;i<CM_NAMES.length;i++){
      d=Math.pow(a[0]-CM_NAMES[i][0],2)+Math.pow(a[1]-CM_NAMES[i][1],2)+Math.pow(a[2]-CM_NAMES[i][2],2);
      if(d<bd){ bd=d; best=CM_NAMES[i][3]; } }
    return best;
  }
  R.colormix=function(box,c){
    box.className='iw iw-card iw-cm';
    var mode=String(c.mode||'add').toLowerCase();
    if(['add','sub','wheel','filter'].indexOf(mode)<0)mode='add';
    var head=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcm-intro">'+iwRT(c.intro)+'</div>':'');
    var tail=(c.note?'<div class="iwcm-note">'+iwRT(c.note)+'</div>':'');

    if(mode==='add'||mode==='sub'){
      var add=(mode==='add');
      var base=add?[[255,0,0,'Rouge'],[0,255,0,'Vert'],[0,0,255,'Bleu']]
                  :[[0,255,255,'Cyan'],[255,0,255,'Magenta'],[255,255,0,'Jaune']];
      var lamps=(c.lamps||[]).map(function(l,i){
        var d=base[i%3];
        return {label:String((l&&l.label)||d[3]),rgb:cmHex(l&&l.color,[d[0],d[1],d[2]]),
          on:iwBool(l&&l.on,true)};
      });
      if(!lamps.length)lamps=base.map(function(d){ return {label:d[3],rgb:[d[0],d[1],d[2]],on:true}; });
      box.innerHTML=head+
        '<div class="iwcm-stage'+(add?' add':' sub')+'"><div class="iwcm-discs">'+
        lamps.map(function(l,i){
          return '<i class="iwcm-d d'+i+(l.on?' on':'')+'" data-l="'+i+'" style="background:'+cmStr(l.rgb)+'"></i>';
        }).join('')+'</div></div>'+
        '<div class="iwcm-lamps">'+lamps.map(function(l,i){
          return '<button type="button" class="iwcm-lamp'+(l.on?' on':'')+'" data-l="'+i+'" aria-pressed="'+
            (l.on?'true':'false')+'"><i style="background:'+cmStr(l.rgb)+'"></i>'+esc(l.label)+'</button>';
        }).join('')+'</div>'+
        '<div class="iwcm-read"></div>'+tail;
      var stage=box.querySelector('.iwcm-stage'), read=box.querySelector('.iwcm-read');
      function mix(){
        var r=add?[0,0,0]:[255,255,255], any=false;
        lamps.forEach(function(l){ if(!l.on)return; any=true;
          if(add){ r=[Math.min(255,r[0]+l.rgb[0]),Math.min(255,r[1]+l.rgb[1]),Math.min(255,r[2]+l.rgb[2])]; }
          else { r=[r[0]*l.rgb[0]/255,r[1]*l.rgb[1]/255,r[2]*l.rgb[2]/255]; } });
        if(!any)r=add?[0,0,0]:[255,255,255];
        stage.style.background=add?'#0b0e12':'#ffffff';
        [].forEach.call(box.querySelectorAll('.iwcm-d'),function(d){
          d.classList.toggle('on',lamps[+d.getAttribute('data-l')].on); });
        [].forEach.call(box.querySelectorAll('.iwcm-lamp'),function(b){
          var on=lamps[+b.getAttribute('data-l')].on;
          b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false'); });
        read.innerHTML='<span class="iwcm-sw" style="background:'+cmStr(r)+'"></span>'+
          (add?'Synthèse additive':'Synthèse soustractive')+' : <b>'+esc(cmName(r))+'</b>';
      }
      box.addEventListener('click',function(ev){
        var b=ev.target.closest?ev.target.closest('[data-l]'):null; if(!b)return;
        var i=+b.getAttribute('data-l'); lamps[i].on=!lamps[i].on; mix(); });
      mix();
      return;
    }

    if(mode==='filter'){
      var src=cmHex(c.source,[255,255,255]);
      var fils=(c.filters||[]).map(function(f){
        return {label:String((f&&f.label)||''),rgb:cmHex(f&&f.color,[255,255,255]),
          on:iwBool(f&&f.on,true)};
      });
      if(!fils.length)fils=[{label:'Filtre rouge',rgb:[255,0,0],on:true}];
      box.innerHTML=head+'<div class="iwcm-beam"><div class="iwcm-src" style="background:'+cmStr(src)+'">'+
        esc(c.sourceLabel||'Source')+'</div>'+
        fils.map(function(f,i){
          return '<span class="iwcm-seg" data-seg="'+i+'"></span>'+
            '<button type="button" class="iwcm-fil'+(f.on?' on':'')+'" data-f="'+i+'" aria-pressed="'+
            (f.on?'true':'false')+'"><i style="background:'+cmStr(f.rgb)+'"></i>'+
            esc(f.label||('Filtre '+(i+1)))+'</button>';
        }).join('')+'<span class="iwcm-seg" data-seg="'+fils.length+'"></span>'+
        '<div class="iwcm-eye"></div></div>'+
        '<div class="iwcm-read"></div>'+tail;
      var read2=box.querySelector('.iwcm-read');
      function run(){
        var cur=src.slice(), i;
        box.querySelector('[data-seg="0"]').style.background=cmStr(cur);
        for(i=0;i<fils.length;i++){
          if(fils[i].on)cur=[cur[0]*fils[i].rgb[0]/255,cur[1]*fils[i].rgb[1]/255,cur[2]*fils[i].rgb[2]/255];
          var seg=box.querySelector('[data-seg="'+(i+1)+'"]');
          if(seg)seg.style.background=cmStr(cur);
        }
        box.querySelector('.iwcm-eye').style.background=cmStr(cur);
        [].forEach.call(box.querySelectorAll('.iwcm-fil'),function(b){
          var on=fils[+b.getAttribute('data-f')].on;
          b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false'); });
        read2.innerHTML='<span class="iwcm-sw" style="background:'+cmStr(cur)+'"></span>'+
          'Lumière reçue : <b>'+esc(cmName(cur))+'</b>';
      }
      box.addEventListener('click',function(ev){
        var b=ev.target.closest?ev.target.closest('[data-f]'):null; if(!b)return;
        var i=+b.getAttribute('data-f'); fils[i].on=!fils[i].on; run(); });
      run();
      return;
    }

    // the chromatic circle: complementary colours are diametrically opposite
    var n=12, secs=[], k;
    for(k=0;k<n;k++){
      var hue=k/n*360;
      secs.push({hue:hue,rgb:cmHue(hue),name:cmHueName(hue)});
    }
    box.innerHTML=head+'<div class="iwcm-wheel"><svg viewBox="-110 -110 220 220" role="img">'+
      secs.map(function(s,i){
        var a0=(i/n*360-90-360/n/2)*Math.PI/180, a1=((i+1)/n*360-90-360/n/2)*Math.PI/180;
        var x0=100*Math.cos(a0), y0=100*Math.sin(a0), x1=100*Math.cos(a1), y1=100*Math.sin(a1);
        var i0=52*Math.cos(a1), j0=52*Math.sin(a1), i1=52*Math.cos(a0), j1=52*Math.sin(a0);
        return '<path class="iwcm-sec" data-s="'+i+'" fill="'+cmStr(s.rgb)+'" d="M'+x0.toFixed(1)+' '+y0.toFixed(1)+
          'A100 100 0 0 1 '+x1.toFixed(1)+' '+y1.toFixed(1)+'L'+i0.toFixed(1)+' '+j0.toFixed(1)+
          'A52 52 0 0 0 '+i1.toFixed(1)+' '+j1.toFixed(1)+'Z"/>';
      }).join('')+'<line class="iwcm-diam" x1="0" y1="0" x2="0" y2="0"/></svg></div>'+
      '<div class="iwcm-read"><span class="iwcm-hint">Cliquez une couleur : sa complémentaire est diamétralement opposée.</span></div>'+tail;
    var wsvg=box.querySelector('.iwcm-wheel svg'), read3=box.querySelector('.iwcm-read');
    wsvg.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-s]'):null; if(!t)return;
      var i=+t.getAttribute('data-s'), o=(i+n/2)%n;
      [].forEach.call(wsvg.querySelectorAll('.iwcm-sec'),function(p){
        var pi=+p.getAttribute('data-s');
        p.classList.toggle('on',pi===i||pi===o); });
      var a=(i/n*360-90)*Math.PI/180, l=wsvg.querySelector('.iwcm-diam');
      l.setAttribute('x1',(100*Math.cos(a)).toFixed(1)); l.setAttribute('y1',(100*Math.sin(a)).toFixed(1));
      l.setAttribute('x2',(-100*Math.cos(a)).toFixed(1)); l.setAttribute('y2',(-100*Math.sin(a)).toFixed(1));
      read3.innerHTML='<span class="iwcm-sw" style="background:'+cmStr(secs[i].rgb)+'"></span>'+
        esc(secs[i].name)+' &nbsp;'+String.fromCharCode(0x2194)+'&nbsp; <span class="iwcm-sw" style="background:'+
        cmStr(secs[o].rgb)+'"></span>'+esc(secs[o].name)+
        ' <i>Une solution qui absorbe le '+esc(secs[i].name.toLowerCase())+' laisse passer le '+esc(secs[o].name.toLowerCase())+'.</i>';
    });
  };
  function cmHue(h){
    var s=1, v=1, i=Math.floor(h/60)%6, f=h/60-Math.floor(h/60);
    var p=0, q=v*(1-f*s), t=v*(1-(1-f)*s), r,g,b;
    if(i===0){r=v;g=t;b=p;} else if(i===1){r=q;g=v;b=p;} else if(i===2){r=p;g=v;b=t;}
    else if(i===3){r=p;g=q;b=v;} else if(i===4){r=t;g=p;b=v;} else {r=v;g=p;b=q;}
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
  }
  function cmHueName(h){
    var t=[[0,'Rouge'],[30,'Orange'],[60,'Jaune'],[90,'Jaune-vert'],[120,'Vert'],[150,'Vert-cyan'],
      [180,'Cyan'],[210,'Bleu roi'],[240,'Bleu'],[270,'Violet'],[300,'Magenta'],[330,'Rouge-rosé']];
    var best=t[0][1], bd=1e9, i, d;
    for(i=0;i<t.length;i++){ d=Math.min(Math.abs(h-t[i][0]),360-Math.abs(h-t[i][0]));
      if(d<bd){ bd=d; best=t[i][1]; } }
    return best;
  }

  /* ── levels: an energy-level diagram and its transitions ─────────────────
     Rungs at their real spacing, arrows between them, and the arithmetic done
     for you: a transition knows whether it absorbs or emits, how big ΔE is,
     what wavelength that corresponds to and which part of the spectrum it
     lands in. Getting the sign right is the whole exercise, so the element
     never hides it. */
  R.levels=function(box,c){
    box.className='iw iw-card iw-lv';
    var unit=String(c.unit||'eV');
    var lv=(c.rungs||[]).map(function(l,i){
      return {label:String((l&&l.label)||('E'+(i+1))),value:iwNum(l&&l.value),
        note:String((l&&l.note)||'')};
    }).filter(function(l){ return l.value!=null; });
    if(lv.length<2){ box.innerHTML='<div class="iw-err">Il faut au moins deux niveaux.</div>'; return; }
    lv.sort(function(a,b){ return a.value-b.value; });
    var byL={}; lv.forEach(function(l,i){ l.i=i; byL[l.label]=l; });
    function pick(k){
      k=String(k==null?'':k).trim();
      if(byL[k])return byL[k];
      var n=iwNum(k);
      if(n!=null&&n>=1&&n<=lv.length)return lv[Math.round(n)-1];
      return null;
    }
    var trs=(c.transitions||[]).map(function(t){
      var a=pick(t&&t.from), b=pick(t&&t.to);
      if(!a||!b||a===b)return null;
      return {a:a,b:b,label:String((t&&t.label)||''),color:String((t&&t.color)||'')};
    }).filter(Boolean);
    var lo=lv[0].value, hi=lv[lv.length-1].value, span=(hi-lo)||1;
    // ΔE is only ever as precise as the levels it came from
    var lvDec=1;
    lv.forEach(function(l){ var t=String(l.value), k=t.indexOf('.');
      if(k>=0)lvDec=Math.max(lvDec,Math.min(3,t.length-k-1)); });
    // eV and J are the two units an energy diagram is ever drawn in; anything
    // else is a scale of the author's own, so no wavelength is claimed for it
    var TOEV=(unit==='eV')?1:((unit==='J')?6.241509e18:0);
    function lam(dE){                                     // nm, from |ΔE|
      if(!TOEV||!dE)return null;
      return 1239.841984/Math.abs(dE*TOEV);
    }
    function domain(nm){
      if(nm==null)return '';
      if(nm<400)return 'ultraviolet';
      if(nm>800)return 'infrarouge';
      return 'visible';
    }
    function visColor(nm){
      if(nm==null||nm<380||nm>780)return '';
      var h=(780-nm)/(780-380)*280;                        // red at one end, violet at the other
      return cmStr(cmHue(h));
    }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwlv-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwlv-stage"></div>'+
      (trs.length?'<div class="iwlv-read"><span class="iwlv-hint">Cliquez une transition.</span></div>':'')+
      (c.note?'<div class="iwlv-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwlv-stage'), read=box.querySelector('.iwlv-read'), sel=-1;
    /* The rung labels live in the left margin, so the margin has to be as wide
       as the longest of them — and the only honest way to know that is to draw
       once and measure. Guessing from the character count was out by 32 px on
       "E1 = −21,6" and cut the label in half. */
    var padL=0;
    function draw(){
      var w=Math.max(240,stage.clientWidth||box.clientWidth||520);
      var W=Math.round(Math.min(w,720)), H=Math.max(210,Math.min(420,74+lv.length*52));
      var padT=34, padB=26, padR=14;
      if(!padL)padL=Math.round(Math.min(W*0.42,96));
      var Y=function(v){ return padT+(hi-v)/span*(H-padT-padB); };
      var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img">';
      // the arrow belongs at the TOP of an energy axis, so the line runs upwards
      s+='<line class="iwlv-axis" x1="'+(padL-8)+'" y1="'+(H-padB+6)+'" x2="'+(padL-8)+'" y2="'+(padT-16)+'" marker-end="url(#iwlvA)"/>'+
        '<defs><marker id="iwlvA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'+
        '<path d="M0 0L10 5L0 10z"/></marker></defs>'+
        '<text class="iwlv-au" x="'+(padL-12)+'" y="14">E ('+esc(unit)+')</text>';
      lv.forEach(function(l){
        var y=Y(l.value);
        s+='<line class="iwlv-r" x1="'+padL+'" y1="'+y+'" x2="'+(W-padR)+'" y2="'+y+'"/>'+
          '<text class="iwlv-v" x="'+(padL-14)+'" y="'+(y+4)+'">'+esc(l.label)+' = '+iwFrNum(l.value,2)+'</text>'+
          (l.note?'<text class="iwlv-n" x="'+(W-padR)+'" y="'+(y-6)+'">'+esc(iwRTx(l.note))+'</text>':'');
      });
      trs.forEach(function(t,i){
        var x=padL+40+i*Math.max(38,(W-padL-padR-70)/Math.max(trs.length,1));
        var y1=Y(t.a.value), y2=Y(t.b.value), up=(t.b.value>t.a.value);
        var col=t.color||(up?'var(--accent)':'var(--teal)');
        s+='<line class="iwlv-t'+(sel===i?' on':'')+'" data-t="'+i+'" x1="'+x+'" y1="'+y1+'" x2="'+x+'" y2="'+y2+
          '" stroke="'+esc(col)+'" marker-end="url(#iwlvT'+i+')"/>'+
          '<defs><marker id="iwlvT'+i+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">'+
          '<path d="M0 0L10 5L0 10z" fill="'+esc(col)+'"/></marker></defs>'+
          '<rect class="iwlv-hit" data-t="'+i+'" x="'+(x-11)+'" y="'+Math.min(y1,y2)+'" width="22" height="'+Math.abs(y2-y1)+'"/>';
        if(t.label)s+='<text class="iwlv-tl" x="'+(x+7)+'" y="'+((y1+y2)/2)+'" fill="'+esc(col)+'">'+esc(iwRTx(t.label))+'</text>';
      });
      s+='</svg>';
      stage.innerHTML=s;
      // measure what we just drew; if a label ran off the left, widen the
      // margin and draw once more. Once only — the second pass fits by
      // construction, and a loop here would be a loop on every resize.
      var need=0;
      [].forEach.call(stage.querySelectorAll('.iwlv-v'),function(t){
        var b; try{ b=t.getBBox(); }catch(e){ return; }
        if(b.x<2)need=Math.max(need,2-b.x); });
      if(need>0.5){ padL=Math.min(padL+Math.ceil(need)+2,Math.round(W*0.6)); draw(); }
    }
    function say(i){
      if(!read)return;
      var t=trs[i];
      if(!t){ read.innerHTML='<span class="iwlv-hint">Cliquez une transition.</span>'; return; }
      var dE=t.b.value-t.a.value, up=dE>0, nm=lam(dE), col=visColor(nm);
      read.innerHTML='<b>'+esc(t.a.label)+' '+String.fromCharCode(0x2192)+' '+esc(t.b.label)+'</b>'+
        ' &nbsp;·&nbsp; ΔE = '+(up?'+':'')+iwFrFix(dE,lvDec)+' '+esc(unit)+
        ' &nbsp;·&nbsp; '+(up?'photon <b>absorbé</b>':'photon <b>émis</b>')+
        (nm!=null?(' &nbsp;·&nbsp; λ = '+iwFrSig(nm,3)+' nm ('+domain(nm)+')'+
          (col?'<span class="iwcm-sw" style="background:'+col+'"></span>':'')):'');
    }
    stage.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-t]'):null;
      sel=t?+t.getAttribute('data-t'):-1; draw(); say(sel); });
    iwWatch(box,draw);
  };

  /* ── sigfig: significant figures and rounding ────────────────────────────
     The single most reliable way to lose a mark in any science, in any country,
     at any level — and the one thing no element in the library drilled.

     The element works out its own answers. Give it "0,00340" and it knows that
     is three significant figures; give it "2,5 × 3,42" and it knows the product
     carries two, because that is the rule and the rule is code. An author
     cannot enter a wrong answer here, because they do not enter one at all. */
  var SF_THIN=String.fromCharCode(0x202F), SF_NB=String.fromCharCode(0xA0);
  function sfClean(s){
    return String(s==null?'':s).split(' ').join('').split(SF_THIN).join('')
      .split(SF_NB).join('').replace(new RegExp('^[+]'),'');
  }
  /* Split off a power of ten, however it was written: 2,5e3 / 2,5 × 10^3 /
     2,5·10^-3. Only the mantissa carries significant figures. */
  function sfMantissa(s){
    // The caret is dropped before matching rather than escaped in the pattern:
    // this file is a template literal, so a backslash in it does not survive.
    // "2,5 x 10^-3" becomes "2,5 x 10-3", which the pattern reads the same way.
    s=sfClean(s).split(String.fromCharCode(94)).join('')
      .split(String.fromCharCode(0x2212)).join('-');
    var m=new RegExp('^(.+?)(?:[eE]|[x*' + String.fromCharCode(0xD7) + String.fromCharCode(0xB7)
      + ']10)([-+]?[0-9]+)$').exec(s);
    if(m)return {man:m[1],exp:parseInt(m[2],10)};
    return {man:s,exp:null};
  }
  function sfCount(s){
    var p=sfMantissa(s), t=p.man.replace(new RegExp('^-'),'');
    var dot=t.indexOf(',')>=0?',':(t.indexOf('.')>=0?'.':'');
    var digits=dot?t.split(dot).join(''):t;
    if(!new RegExp('^[0-9]+$').test(digits))return null;
    var lead=digits.replace(new RegExp('^0+'),'');
    if(lead==='')return {n:0,zero:true,exp:p.exp};
    if(dot)return {n:lead.length,exp:p.exp};
    // a bare integer's trailing zeros are ambiguous — 1200 may be 2, 3 or 4 —
    // unless it was written in scientific notation, which is the whole point
    var noTrail=lead.replace(new RegExp('0+$'),'');
    if(noTrail.length===lead.length||p.exp!=null)return {n:lead.length,exp:p.exp};
    return {n:noTrail.length,max:lead.length,ambiguous:true,exp:p.exp};
  }
  function sfDecimals(s){
    var p=sfMantissa(s);
    if(p.exp!=null)return null;                    // not comparable digit for digit
    var t=p.man, k=Math.max(t.indexOf(','),t.indexOf('.'));
    return k<0?0:t.length-k-1;
  }
  /* toPrecision is not usable here: 8,55 is stored as 8.549999999999999, so it
     rounds to 8,5 where every textbook says 8,6. Round the scaled integer with
     a relative nudge instead, and decide on scientific notation from the
     exponent — writing 12 000 for two significant figures would state a
     precision the value does not have, which is the very thing being taught. */
  function sfRound(v,sig){
    if(v===0)return '0';
    var neg=v<0, a=Math.abs(v);
    var e=Math.floor(Math.log(a)/Math.LN10);
    if(a/Math.pow(10,e)>=10)e++;                 // log10(1000) can land at 2.9999…
    if(a/Math.pow(10,e)<1)e--;
    var f=Math.pow(10,sig-1-e), scaled=a*f;
    var r=Math.round(scaled+scaled*1e-12);
    if(r>=Math.pow(10,sig)){ e++; f=Math.pow(10,sig-1-e); r=Math.round(a*f+a*f*1e-12); }
    var val=r/f, sign=neg?String.fromCharCode(0x2212):'';
    if(e>=sig||e<-3)return sign+iwFrFix(r/Math.pow(10,sig-1),sig-1)+' × 10'+iwSup(e);
    return sign+iwFrFix(val,Math.max(0,sig-1-e));
  }
  R.sigfig=function(box,c){
    box.className='iw iw-card iw-sf';
    var mode=String(c.mode||'count').toLowerCase();
    if(['count','round','calc'].indexOf(mode)<0)mode='count';
    var rows=(c.values||[]).map(function(v){
      return {value:String((v&&v.value)||'').trim(),target:iwNum(v&&v.target),
        note:String((v&&v.note)||'')};
    }).filter(function(v){ return v.value!==''; });
    if(!rows.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins une valeur.</div>'; return; }
    var dflt=iwNum(c.digits);
    /* Work out the answer for each row. Every branch is a rule from the course,
       written once: counting, rounding, and which rule a calculation follows. */
    rows.forEach(function(r){
      if(mode==='count'){
        var g=sfCount(r.value);
        r.ok=!!g; r.ans=g?String(g.n):'';
        r.why=g?(g.ambiguous
            ? ('Les zéros finaux d’un entier sont ambigus : ' + r.value + ' compte '
               + g.n + ' chiffre' + (g.n>1?'s':'') + ' significatif' + (g.n>1?'s':'')
               + ', ou jusqu’à ' + g.max + ' si l’écriture scientifique le précise.')
            : (g.exp!=null ? 'En écriture scientifique, seule la mantisse compte.'
               : 'Les zéros de tête ne comptent jamais ; ceux qui suivent la virgule comptent toujours.'))
          : '';
        return;
      }
      if(mode==='round'){
        var sig=r.target!=null?Math.round(r.target):(dflt!=null?Math.round(dflt):3);
        var val=iwNum(r.value.split(String.fromCharCode(0xD7)).join('e').split('10^').join(''));
        r.sig=sig; r.ok=(val!=null&&sig>=1);
        r.ans=r.ok?sfRound(val,sig):'';
        r.why=r.ok?('On garde '+sig+' chiffre'+(sig>1?'s':'')+' significatif'+(sig>1?'s':'')+
          ' et on arrondit le dernier.'):'';
        return;
      }
      // calc: "a × b" or "a + b" — the rule depends on the operation
      var OPS=[[String.fromCharCode(0xD7),'*'],['x','*'],['*','*'],
        [String.fromCharCode(0xF7),'/'],['/','/'],['+','+'],[String.fromCharCode(0x2212),'-'],['-','-']];
      var raw=sfClean(r.value), found=null, k, at;
      for(k=0;k<OPS.length&&!found;k++){
        at=raw.indexOf(OPS[k][0],1);
        if(at>0&&at<raw.length-1)found={op:OPS[k][1],a:raw.slice(0,at),b:raw.slice(at+OPS[k][0].length)};
      }
      if(!found){ r.ok=false; return; }
      var A=iwNum(found.a.split(String.fromCharCode(0x2212)).join('-'));
      var B=iwNum(found.b.split(String.fromCharCode(0x2212)).join('-'));
      if(A==null||B==null){ r.ok=false; return; }
      var exact=found.op==='*'?A*B:(found.op==='/'?A/B:(found.op==='+'?A+B:A-B));
      if(found.op==='*'||found.op==='/'){
        var ca=sfCount(found.a), cb=sfCount(found.b);
        var sg=Math.min(ca?ca.n:3,cb?cb.n:3);
        r.sig=sg; r.ok=true; r.ans=sfRound(exact,sg);
        r.why='Produit ou quotient : on garde le plus petit nombre de chiffres significatifs des facteurs, ici '+sg+'.';
      } else {
        var da=sfDecimals(found.a), db=sfDecimals(found.b);
        if(da==null||db==null){ r.sig=null; r.ok=true; r.ans=iwFrSig(exact,3);
          r.why='Somme ou différence : ramenez les deux valeurs à la même puissance de dix avant de comparer les décimales.'; return; }
        var dd=Math.min(da,db);
        r.dec=dd; r.ok=true; r.ans=iwFrFix(exact,dd);
        r.why='Somme ou différence : on garde le plus petit nombre de décimales des termes, ici '+dd+'.';
      }
    });
    var ASK={count:'Combien de chiffres significatifs ?',
      round:'Arrondissez correctement.',calc:'Donnez le résultat avec la bonne précision.'};
    box.innerHTML=(c.title!==''?'<div class="iw-title">'+iwRT(c.title||'Chiffres significatifs')+'</div>':'')+
      '<div class="iwsf-intro">'+iwRT(c.intro||ASK[mode])+'</div>'+
      '<div class="iwsf-list">'+rows.map(function(r,i){
        return '<div class="iwsf-row" data-r="'+i+'">'+
          '<div class="iwsf-v">'+iwRT(r.value)+
            (mode==='round'&&r.ok?'<i> à '+r.sig+' c.s.</i>':'')+'</div>'+
          '<div class="iwsf-in"><input type="text" inputmode="'+(mode==='count'?'numeric':'text')+
            '" autocomplete="off" spellcheck="false" aria-label="Réponse" placeholder="'+
            esc(mode==='count'?'…':'…')+'"><i class="iwsf-mark"></i></div>'+
          '<div class="iwsf-why" hidden><b>'+esc(r.ans)+'</b>'+(r.why?' — '+iwRT(r.why):'')+
            (r.note?' '+iwRT(r.note):'')+'</div>'+
          '</div>'; }).join('')+'</div>'+
      '<div class="iwsf-actions"><button type="button" class="iw-btn" data-sf="check">'+T('check','Vérifier')+'</button>'+
      '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button>'+
      '<span class="iwsf-score"></span></div>'+
      (c.note?'<div class="iwsf-note">'+iwRT(c.note)+'</div>':'');
    var score=box.querySelector('.iwsf-score');
    function norm(s){
      // a reader may type 6,2 or 6.2, with or without spaces in the power of ten
      return sfClean(s).split(String.fromCharCode(0x2212)).join('-').split('.').join(',')
        .split(String.fromCharCode(0xD7)).join('x').toLowerCase();
    }
    function mark(reveal){
      var ok=0, n=0;
      rows.forEach(function(r,i){
        var row=box.querySelector('.iwsf-row[data-r="'+i+'"]');
        var inp=row.querySelector('input'), why=row.querySelector('.iwsf-why');
        if(!r.ok){ why.hidden=!reveal; return; }
        n++;
        var good=norm(inp.value)===norm(r.ans);
        if(reveal||inp.value.trim()!==''){
          row.classList.toggle('ok',good); row.classList.toggle('no',!good);
        }
        if(good)ok++;
        why.hidden=!(reveal||good);
        if(reveal)inp.value=r.ans;
      });
      score.textContent=reveal?'Corrigé':(ok+' / '+n);
      score.className='iwsf-score '+((reveal||ok===n)?'ok':'no');
    }
    box.querySelector('[data-sf="check"]').addEventListener('click',function(){ mark(false); });
    box.querySelector('[data-q="show"]').addEventListener('click',function(){ mark(true); });
    box.addEventListener('keydown',function(ev){ if(ev.key==='Enter')mark(false); });
  };

  /* ── karyotype: chromosomes, in pairs, side by side ─────────────────────
     A karyotype figure is almost never shown alone — it is shown next to
     another one, because the whole point is what differs: a missing copy, an
     extra one, a pair that changed shape. So the element takes one reference
     set of pairs and lets each individual state only its differences, and
     clicking a pair lights it up in every panel at once.

     Each chromosome is drawn from two numbers a cytogeneticist would give you:
     its relative length, and where along it the centromere sits. */
  function kyChrom(x,y,L,r,w,col,cls){
    var p=L*r, q=L*(1-r), a=Math.max(2.6,w*0.42);
    return '<g class="'+cls+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')">'+
      '<path d="M'+(-a)+' '+(-p).toFixed(1)+'L0 0L'+(-a)+' '+q.toFixed(1)+'" stroke="'+col+'" stroke-width="'+w.toFixed(1)+'"/>'+
      '<path d="M'+a+' '+(-p).toFixed(1)+'L0 0L'+a+' '+q.toFixed(1)+'" stroke="'+col+'" stroke-width="'+w.toFixed(1)+'"/>'+
      '</g>';
  }
  R.karyotype=function(box,c){
    box.className='iw iw-card iw-ky';
    var pairs=(c.pairs||[]).map(function(p,i){
      var r=iwNum(p&&p.centromere); if(r==null)r=0.5;
      return {n:String((p&&p.n)||(i+1)),size:Math.max(5,iwNum(p&&p.size)||60),
        r:Math.min(0.9,Math.max(0.1,r)),color:String((p&&p.color)||''),
        note:String((p&&p.note)||'')};
    });
    if(!pairs.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins une paire.</div>'; return; }
    var sets=(c.sets||[]).map(function(s){
      // "9:3 ; 5:1" — pair 9 has three copies, pair 5 has one. Anything unsaid
      // is a normal pair, which is the overwhelming majority of any karyotype.
      var d={};
      String((s&&s.diff)||'').split(';').forEach(function(t){
        var k=t.split(':'); if(k.length<2)return;
        var key=k[0].trim(), v=Math.round(iwNum(k[1])||0);
        if(key)d[key]=Math.max(0,Math.min(6,v)); });
      return {label:String((s&&s.label)||''),diff:d,sex:String((s&&s.sex)||''),
        note:String((s&&s.note)||'')};
    });
    if(!sets.length)sets=[{label:'',diff:{},sex:'',note:''}];
    var maxS=Math.max.apply(null,pairs.map(function(p){ return p.size; }));
    var perRow=Math.max(1,Math.round(iwNum(c.perRow)||3));
    var sel=-1;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwky-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwky-sets">'+sets.map(function(s,si){
        return '<div class="iwky-set"><div class="iwky-lb">'+iwRT(s.label||('Individu '+(si+1)))+'</div>'+
          '<div class="iwky-grid" data-set="'+si+'"></div>'+
          (s.sex?'<div class="iwky-sex">'+iwRT(s.sex)+'</div>':'')+
          (s.note?'<div class="iwky-sn">'+iwRT(s.note)+'</div>':'')+'</div>';
      }).join('')+'</div>'+
      '<div class="iwky-read"><span class="iwky-hint">Cliquez une paire pour la comparer d’un individu à l’autre.</span></div>'+
      (c.note?'<div class="iwky-note">'+iwRT(c.note)+'</div>':'');
    var read=box.querySelector('.iwky-read');
    function draw(){
      sets.forEach(function(s,si){
        var g=box.querySelector('[data-set="'+si+'"]');
        var cw=Math.max(120,g.clientWidth||260), cell=Math.floor(cw/perRow);
        var H=Math.round(cell*0.9);
        g.innerHTML=pairs.map(function(p,pi){
          var n=s.diff.hasOwnProperty(p.n)?s.diff[p.n]:2;
          var odd=(n!==2);
          var L=Math.round(H*0.62*p.size/maxS), w=Math.max(4,Math.round(L*0.16));
          var gap=Math.max(9,w*1.7);
          var svgW=Math.max(cell-6,30), mid=svgW/2, top=H*0.5;
          var col=p.color||(odd?'var(--accent)':'var(--ink)');
          var xs=[], k;
          for(k=0;k<n;k++)xs.push(mid+(k-(n-1)/2)*(gap+w));
          return '<div class="iwky-cell'+(sel===pi?' on':'')+(odd?' odd':'')+'" data-p="'+pi+'">'+
            '<svg viewBox="0 0 '+svgW+' '+H+'" width="'+svgW+'" height="'+H+'">'+
            xs.map(function(x){ return kyChrom(x,top,L,p.r,w,col,'iwky-c'); }).join('')+
            '</svg><span>'+esc(p.n)+'</span></div>';
        }).join('');
      });
    }
    function say(i){
      var p=pairs[i];
      if(!p){ read.innerHTML='<span class="iwky-hint">Cliquez une paire pour la comparer d’un individu à l’autre.</span>'; return; }
      read.innerHTML='<b>Paire '+esc(p.n)+'</b> '+sets.map(function(s){
        var n=s.diff.hasOwnProperty(p.n)?s.diff[p.n]:2;
        return '<span'+(n!==2?' class="odd"':'')+'>'+esc(s.label||'—')+' : '+n+
          (n===1?' seul exemplaire':(n===2?' exemplaires':' exemplaires'))+'</span>';
      }).join('')+(p.note?'<i>'+iwRT(p.note)+'</i>':'');
    }
    box.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-p]'):null; if(!t)return;
      var i=+t.getAttribute('data-p'); sel=(sel===i?-1:i); draw(); say(sel); });
    iwWatch(box,draw);
  };

  /* ── cladogram: who is more closely related to whom ──────────────────────
     Not a family tree — that is the tree element, and it runs on descent from named
     ancestors. A cladogram runs on shared characters: every fork is the
     appearance of something new, and the marks on the branches are the
     evidence for the grouping. So the characters are first-class here, and
     clicking a fork lights up the whole clade it defines.

     Topology comes from parent ids, the same way flow and mindmap do it, so
     there is no bracket notation to learn. */
  R.cladogram=function(box,c){
    box.className='iw iw-card iw-cl';
    var raw=(c.cnodes||[]).map(function(n){
      return {id:String((n&&n.id)||'').trim(),parent:String((n&&n.parent)||'').trim(),
        label:String((n&&n.label)||''),character:String((n&&n.character)||''),
        img:String((n&&n.img)||''),note:String((n&&n.note)||'')};
    }).filter(function(n){ return n.id!==''; });
    if(!raw.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins un nœud.</div>'; return; }
    var by={}; raw.forEach(function(n){ n.kids=[]; by[n.id]=n; });
    var roots=[];
    raw.forEach(function(n){
      var p=n.parent&&by[n.parent];
      if(p&&p!==n)p.kids.push(n); else roots.push(n); });
    if(!roots.length)roots=[raw[0]];
    var leaves=[], depth=0;
    (function walk(n,d){ n.d=d; if(d>depth)depth=d;
      if(!n.kids.length){ n.leaf=true; n.row=leaves.length; leaves.push(n); return; }
      n.kids.forEach(function(k){ walk(k,d+1); });
      n.row=(n.kids[0].row+n.kids[n.kids.length-1].row)/2;
    })(roots[0],0);
    roots.slice(1).forEach(function(r){ /* extra roots would make it a forest */ });
    if(!leaves.length){ box.innerHTML='<div class="iw-err">Il faut au moins deux taxons.</div>'; return; }
    var periods=(c.periods||[]).map(function(p){
      return {label:String((p&&p.label)||''),from:iwNum(p&&p.from),to:iwNum(p&&p.to),
        color:String((p&&p.color)||'')};
    }).filter(function(p){ return p.from!=null&&p.to!=null; });
    var clades=(c.clades||[]).map(function(g){
      return {from:String((g&&g.from)||'').trim(),to:String((g&&g.to)||'').trim(),
        label:String((g&&g.label)||''),color:String((g&&g.color)||'')};
    }).filter(function(g){ return g.from&&g.to; });
    var sel=null;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcl-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwcl-stage"></div>'+
      '<div class="iwcl-read"><span class="iwcl-hint">Cliquez une bifurcation : le groupe qu’elle définit s’allume.</span></div>'+
      (c.note?'<div class="iwcl-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwcl-stage'), read=box.querySelector('.iwcl-read'), measuredAt=-1;
    function inClade(n,id){                       // is n inside the clade rooted at id?
      var p=n;
      while(p){ if(p.id===id)return true; p=p.parent?by[p.parent]:null; }
      return false;
    }
    function draw(grow){
      var w=Math.max(260,stage.clientWidth||box.clientWidth||560);
      var W=Math.round(Math.min(w,820));
      measuredAt=stage.clientWidth;         // what this drawing was sized for
      var anyImg=leaves.some(function(n){ return n.img; });
      var lblW=Math.round(Math.min(anyImg?250:190,W*(anyImg?0.4:0.3)));
      var padL=iwBool(c.characters,true)?Math.round(Math.min(150,W*0.24)):12;
      /* A clade name written inside the clade box lands on top of the taxon
         names, which share that column. It belongs beside them, against a
         bracket — which is how a printed cladogram marks a clade anyway.
         The gutter yields first if the drawing would be squeezed to nothing. */
      var longest=0; clades.forEach(function(g){ if(g.label)longest=Math.max(longest,iwRTx(g.label).length); });
      // large enough for the name we actually have, not a flat share of the
      // width: every pixel here is a pixel the tree and the period bar lose
      var cladeW=longest?Math.round(Math.min(96,Math.max(46,longest*6.2+18))):0;
      cladeW=Math.max(0,Math.min(cladeW,W-lblW-padL-80));
      var rowH=Math.max(22,Math.min(44,iwNum(c.rowHeight)||30));
      if(grow)rowH=grow;
      var padB=periods.length?26:6;
      var H=Math.round(leaves.length*rowH+16+padB);
      var x0=padL, x1=W-lblW-10-cladeW;
      var stepX=(x1-x0)/Math.max(depth,1);
      var X=function(n){ return x0+n.d*stepX; };
      var Y=function(n){ return 10+n.row*rowH+rowH/2; };
      var s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img">';
      if(periods.length){
        var lo=Math.min.apply(null,periods.map(function(p){ return Math.min(p.from,p.to); }));
        var hi=Math.max.apply(null,periods.map(function(p){ return Math.max(p.from,p.to); }));
        var span=(hi-lo)||1;
        s+='<g class="iwcl-per">'+periods.map(function(p,i){
          var a=x0+(Math.min(p.from,p.to)-lo)/span*(x1-x0);
          var b=x0+(Math.max(p.from,p.to)-lo)/span*(x1-x0);
          var nm=iwRTx(p.label);
          return '<rect x="'+a.toFixed(1)+'" y="'+(H-padB+4)+'" width="'+Math.max(1,b-a).toFixed(1)+
            '" height="16" fill="'+esc(p.color||['#8d6ca8','#4f9ec4','#7fbf5a','#e0a63c'][i%4])+'">'+
            '<title>'+esc(nm)+'</title></rect>'+
            '<text x="'+((a+b)/2).toFixed(1)+'" y="'+(H-padB+15)+'" data-w="'+Math.max(1,b-a).toFixed(1)+
            '" data-full="'+esc(nm)+'">'+esc(nm)+'</text>';
        }).join('')+'</g>';
      }
      var cladeTags=[];
      clades.forEach(function(g){
        var a=by[g.from], b=by[g.to];
        if(!a||!b)return;
        var y1=Math.min(Y(a),Y(b))-rowH*0.45, y2=Math.max(Y(a),Y(b))+rowH*0.45;
        var col=esc(g.color||'var(--accent-soft)');
        s+='<rect class="iwcl-clade" x="'+(X(a)-6)+'" y="'+y1.toFixed(1)+'" width="'
          +Math.max(8,(W-cladeW-8)-(X(a)-6)).toFixed(1)+'" height="'+(y2-y1).toFixed(1)
          +'" fill="'+col+'"/>';
        if(g.label&&cladeW){ var bx=W-cladeW+5;
          s+='<path class="iwcl-brk" stroke="'+col+'" d="M'+(bx+5).toFixed(1)+' '+y1.toFixed(1)
            +' H'+bx.toFixed(1)+' V'+y2.toFixed(1)+' H'+(bx+5).toFixed(1)+'"/>';
          cladeTags.push({text:iwRTx(g.label),top:y1,h:y2-y1,left:bx+10,w:cladeW-16}); }
      });
      raw.forEach(function(n){
        if(!n.kids.length)return;
        var x=X(n), yA=Y(n.kids[0]), yB=Y(n.kids[n.kids.length-1]);
        var on=sel&&inClade(n,sel)&&n.id!==sel?false:(sel===n.id);
        s+='<line class="iwcl-v'+(sel&&inClade(n,sel)?' on':'')+'" x1="'+x+'" y1="'+yA+'" x2="'+x+'" y2="'+yB+'"/>';
        n.kids.forEach(function(k){
          s+='<line class="iwcl-h'+(sel&&inClade(k,sel)?' on':'')+'" x1="'+x+'" y1="'+Y(k)+'" x2="'+X(k)+'" y2="'+Y(k)+'"/>'; });
        s+='<circle class="iwcl-node'+(sel===n.id?' on':'')+'" data-n="'+esc(n.id)+'" cx="'+x+'" cy="'+Y(n)+'" r="7"/>';
      });
      /* A character belongs to the BRANCH above a node, not to the fork — which
         matters most for a tip, where the character that defines the lineage
         (a sauropod's neck) would otherwise never be drawn at all. */
      var chars=[];
      if(iwBool(c.characters,true))raw.forEach(function(n){
        if(!n.character)return;
        var p=n.parent&&by[n.parent], x=X(n), y=Y(n);
        var tx=p?(X(p)+x)/2:x;
        chars.push({n:n,tx:tx,y:y});
        s+='<line class="iwcl-tick" x1="'+tx.toFixed(1)+'" y1="'+(y-7)+'" x2="'+tx.toFixed(1)+'" y2="'+(y+7)+'"/>'+
          '<rect class="iwcl-chit" data-n="'+esc(n.id)+'" x="'+(tx-9)+'" y="'+(y-9)+'" width="18" height="18"/>';
      });
      leaves.forEach(function(n){
        var x=X(n), y=Y(n);
        s+='<line class="iwcl-leaf'+(sel&&inClade(n,sel)?' on':'')+'" x1="'+x+'" y1="'+y+'" x2="'+(x1+6)+'" y2="'+y+'"/>';
      });
      s+='</svg>';
      stage.innerHTML=s;
      /* Names and characters are HTML, not SVG text. SVG cannot wrap, and a
         character is a sentence ("os pubien vers l'avant, ischion vers
         l'arrière") that will not fit on one line at any sane width — it was
         running off the left edge of the drawing. */
      cladeTags.forEach(function(g){
        var el=document.createElement('div');
        el.className='iwcl-cln'; el.textContent=g.text; el.title=g.text;
        el.style.left=g.left+'px'; el.style.width=Math.max(30,g.w)+'px';
        el.style.top=g.top+'px'; el.style.height=g.h+'px';
        stage.appendChild(el); });
      /* A band narrower than its own name lets that name run into the next
         one. SVG text neither wraps nor shrinks, so measure it once it
         exists, try a short form, and drop it rather than let it collide —
         the colour and the tooltip still carry the period. */
      var dropped=0;
      [].slice.call(stage.querySelectorAll('.iwcl-per text')).forEach(function(tn){
        if(!tn.getComputedTextLength)return;
        var room=parseFloat(tn.getAttribute('data-w'))||0;
        var full=tn.getAttribute('data-full')||tn.textContent;
        if(tn.getComputedTextLength()<=room-8)return;
        tn.textContent=full.slice(0,3)+'.';
        if(tn.getComputedTextLength()>room-6){ tn.textContent=''; dropped++; }
      });
      // sur un téléphone aucune bande ne peut porter son nom: la frise devient
      // une légende sous le dessin plutôt que trois rectangles muets
      if(dropped&&periods.length){
        var lg=document.createElement('div'); lg.className='iwcl-perleg';
        lg.innerHTML=periods.map(function(pp,i){
          return '<span><i style="background:'+esc(pp.color||['#8d6ca8','#4f9ec4','#7fbf5a','#e0a63c'][i%4])
            +'"></i>'+esc(iwRTx(pp.label))+'</span>'; }).join('');
        stage.appendChild(lg);
      }
      var imgW2=leaves.some(function(n){ return n.img; })?Math.round(rowH*1.35):0;
      leaves.forEach(function(n){
        var el=document.createElement('div');
        el.className='iwcl-lb'+(sel&&inClade(n,sel)?' on':'');
        el.textContent=iwRTx(n.label||n.id);
        el.style.left=(x1+12)+'px';
        el.style.width=Math.max(40,W-cladeW-(x1+12)-imgW2-6)+'px';
        el.style.top=(Y(n)-rowH/2)+'px';
        el.style.height=rowH+'px';
        stage.appendChild(el);
      });
      /* A fork sits halfway between its children, so two characters can be half
         a row apart and their labels overlap. Place them, measure, then push
         the later ones down — the same measure-then-fix the mind map needs.
         Below about 90px of margin there is no column to write in at all, so
         only the tick is drawn and the text stays one click away. */
      var placed=[];
      var GAP=9, LEAD=15;                 // air between blocks, and the tick standoff
      /* A deep branch is 300px to the right, but its note is 200px wide, so
         a note hung straight off its own tick reaches back across the tree
         and lands on the forks of shallower branches. Cap every right edge
         at the left margin instead: the notes line up in the gutter that
         padL already reserves, and the leader says which branch is which —
         which is how an annotated cladogram is printed anyway. */
      chars.forEach(function(k){
        k.xR=Math.min(k.tx-LEAD,x0-8);
        var room=Math.min(k.xR,200);
        if(room<84)return;
        var el=document.createElement('div');
        el.className='iwcl-ch';
        el.textContent=iwRTx(k.n.character);
        el.title=iwRTx(k.n.character);
        el.style.right=(W-k.xR)+'px';
        el.style.width=room+'px';
        el.style.top=(k.y-rowH/2)+'px';
        stage.appendChild(el);
        placed.push({el:el,top:k.y-rowH/2,k:k});
      });
      /* Three sentences in the left margin of a six-row tree will not sit
         where their forks are. Space them out properly rather than by the
         three pixels that merely stopped them overlapping, then centre the
         whole column on the ticks it serves so it does not drift downwards. */
      placed.sort(function(a,b){ return a.top-b.top; });
      var floor=-1e9, deepest=0, i2;
      var lastY=H-padB-6, wantBottom=0, dropped2=0;   // the frieze owns the bottom strip
      for(i2=0;i2<placed.length;i2++){
        var pp=placed[i2], hh=pp.el.offsetHeight||rowH;
        pp.h=hh;
        pp.y=Math.max(pp.top,floor+GAP);
        floor=pp.y+hh; wantBottom=floor;         // what the column needs, dropped or not
        if(pp.y+hh>lastY){                       // no room left: the tick still marks it
          pp.el.remove(); pp.gone=true; dropped2++; }
      }
      placed=placed.filter(function(q){ return !q.gone; });
      /* No re-centring pass: lifting the column to balance it moved a label
         off its own row and onto the fork above. Each label starts on its own
         row and is only ever pushed DOWN, which keeps it below its tick and
         clear of the drawing; the leader line covers the displacement. */
      if(placed.length)deepest=placed[placed.length-1].y+placed[placed.length-1].h;
      var svgN=stage.querySelector('svg');
      placed.forEach(function(pq){
        pq.el.style.top=pq.y+'px';
        // once a label has left its own row, a hair line says which tick it
        // belongs to — without it the column is just a paragraph
        var mid=pq.y+pq.h/2;
        if(Math.abs(mid-pq.k.y)<3||!svgN)return;
        var ln=document.createElementNS('http://www.w3.org/2000/svg','path');
        ln.setAttribute('class','iwcl-lead');
        ln.setAttribute('d','M'+(pq.k.tx-4).toFixed(1)+' '+pq.k.y.toFixed(1)
          +' H'+(pq.k.xR+9).toFixed(1)+' L'+(pq.k.xR+3).toFixed(1)+' '+mid.toFixed(1)+'');
        svgN.appendChild(ln);
      });
      /* One corrective pass, never two: if a taxon name had to wrap past its
         own row, or a note was dropped for want of room, the rows are simply
         too short for this width. Work out the height the content needs and
         redraw at that. The guard is the argument itself — a grown draw never
         grows again, so this cannot oscillate. */
      if(!grow){
        var tallest=0;
        [].slice.call(stage.querySelectorAll('.iwcl-lb')).forEach(function(e){
          if(e.scrollHeight>tallest)tallest=e.scrollHeight; });
        var need=0;
        if(tallest>rowH-1)need=Math.max(need,tallest+8);  // air, not just clearance
        if(dropped2)need=Math.max(need,Math.ceil((wantBottom+16+padB)/leaves.length));
        if(need>rowH+1){ draw(Math.min(64,need)); return; }
      }
      // a label pushed down must not fall out of the bottom of the element
      stage.style.minHeight=Math.max(H,deepest+4)+'px';
      // pictures sit in HTML on top of the drawing: an <image> in SVG cannot be
      // told to keep its aspect ratio and stay inside a row at every width.
      // They go to the far right so the names keep their own column.
      var imgW=Math.round(rowH*1.35);
      leaves.forEach(function(n){
        if(!n.img)return;
        var y=Y(n), im=document.createElement('img');
        im.src=n.img; im.alt=iwRTx(n.label||n.id); im.className='iwcl-img';
        im.style.top=(y-rowH*0.45)+'px'; im.style.height=(rowH*0.9)+'px';
        im.style.width=imgW+'px'; im.style.left=(W-cladeW-imgW-2)+'px';
        stage.appendChild(im);
      });
    }
    function say(id){
      var n=id&&by[id];
      if(!n){ read.innerHTML='<span class="iwcl-hint">Cliquez une bifurcation : le groupe qu’elle définit s’allume.</span>'; return; }
      var inside=leaves.filter(function(l){ return inClade(l,id); }).map(function(l){ return l.label||l.id; });
      read.innerHTML=(n.character?'<b>'+iwRT(n.character)+'</b> — ':'')+
        'groupe de '+inside.length+' : '+esc(inside.join(', '))+
        (n.note?'<i>'+iwRT(n.note)+'</i>':'');
    }
    stage.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-n]'):null;
      var id=t?t.getAttribute('data-n'):null;
      sel=(sel===id)?null:id; draw(); say(sel); });
    iwWatch(box,draw);
    /* iwWatch observes the block, but every measurement in draw() comes from
       the stage inside it. A chapter revealed after hydration widens the
       stage without the block ever changing size, so nothing fired and the
       tree stayed laid out for the 260px floor inside a 654px column.
       Watch what we actually measure — and only on a WIDTH change, because
       draw() sets min-height and a height-triggered redraw would loop. */
    function reflow(){ if(Math.abs(stage.clientWidth-measuredAt)>2)draw(); }
    try{ new ResizeObserver(reflow).observe(stage); }catch(e){}
    setTimeout(reflow,90); setTimeout(reflow,600);
  };

  /* ── particles: the particle model of matter ─────────────────────────────
     Three figures that every science course draws, and that are one drawing
     underneath: the three states side by side, a substance you heat until it
     changes state, and the difference between an element, a compound and a
     mixture. Only the arrangement changes, which is the lesson.

     Movement is CSS, not requestAnimationFrame: a book gets read in background
     tabs and on slow machines, where a keyframe throttles cleanly and a script
     loop just stutters.

     Positions come from paRnd, not from hash(): consecutive strings differ by
     one in that hash, so every particle in a box landed within a tenth of a
     percent of its neighbour and the liquid looked like a single blob. */
  function paRnd(n){ var x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
  /* A real liquid is as dense as a solid and merely disordered, and a gas is
     mostly empty — so each state is a different packing, not a different
     number of particles. Jittered grids keep them from piling up. */
  function paLayout(kind,n,seed){
    var out=[], i, cols, rows, cw, ch;
    if(kind==='solide'){
      cols=Math.ceil(Math.sqrt(n)); rows=Math.ceil(n/cols);
      for(i=0;i<n;i++)out.push([10+(i%cols)*(80/(cols-1||1)),12+Math.floor(i/cols)*(76/(rows-1||1))]);
      return out;
    }
    if(kind==='liquide'){
      cols=Math.ceil(Math.sqrt(n*1.5)); rows=Math.ceil(n/cols);
      cw=84/cols; ch=52/rows;
      for(i=0;i<n;i++){
        var r=Math.floor(i/cols), cx=i%cols;
        out.push([8+cx*cw+cw*(0.15+0.7*paRnd(seed+i*3+1))+(r%2?cw*0.4:0),
                  44+r*ch+ch*(0.1+0.7*paRnd(seed+i*3+2))]);
      }
      return out;
    }
    cols=Math.ceil(Math.sqrt(n*1.2)); rows=Math.ceil(n/cols);
    cw=84/cols; ch=84/rows;
    for(i=0;i<n;i++)
      out.push([8+(i%cols)*cw+cw*(0.1+0.8*paRnd(seed+i*5+3)),
                8+Math.floor(i/cols)*ch+ch*(0.1+0.8*paRnd(seed+i*5+4))]);
    return out;
  }
  /* Element colours and radii, near enough to the CPK convention that a
     chemistry teacher will not wince. */
  var PA_EL={H:['#eceff3',0.55],C:['#3b3f46',0.95],N:['#4a6fb5',0.92],O:['#c0392b',0.9],
    S:['#d6b028',1.05],P:['#e08a3c',1.05],Cl:['#5fa85f',1.0],Br:['#a0522d',1.05],
    Na:['#9a6fc4',1.15],K:['#8d63b8',1.2],Ca:['#7f9a45',1.1],Fe:['#a0632a',1.1],
    He:['#7fd1c4',0.7],Ne:['#7fb3d5',0.75],Ar:['#6fa3c8',0.8]};
  function paAtom(el){ return PA_EL[el]||['var(--slate)',0.95]; }
  /* A molecule, drawn from its formula: the rarest element sits in the middle
     and the others hang off it. That single rule gets H2O, CO2, CH4, NH3, O2
     and N2 right, which is most of what a school book ever draws. */
  function paMol(f,unit){
    var at={}; try{ at=iwAtoms(f,1); }catch(e){ at={}; }
    var keys=Object.keys(at);
    if(!keys.length)return '';
    var centre=keys.slice().sort(function(a,b){ return at[a]-at[b]||a.localeCompare(b); })[0];
    var sats=[], k;
    keys.forEach(function(key){
      var n=at[key]-(key===centre?1:0);
      for(k=0;k<n;k++)sats.push(key);
    });
    var cA=paAtom(centre), cR=unit*0.5*cA[1];
    var maxSat=0; sats.forEach(function(s){ maxSat=Math.max(maxSat,unit*0.5*paAtom(s)[1]); });
    var bond=cR+maxSat*0.75;
    var S=Math.ceil((cR+bond+maxSat)*2)+2, mid=S/2;
    // two light satellites make a bent molecule (water); anything else is drawn
    // straight, which is right for CO2 and near enough for the rest
    var bent=(sats.length===2&&sats[0]==='H');
    var g='';
    sats.forEach(function(s,i){
      var a;
      if(sats.length===1)a=0;
      else if(sats.length===2)a=bent?(-52+104*i):(180*i);
      else a=-90+i*(360/sats.length);
      var rad=a*Math.PI/180, x=mid+bond*Math.cos(rad), y=mid+bond*Math.sin(rad);
      var sA=paAtom(s), sR=unit*0.5*sA[1];
      g+='<line x1="'+mid+'" y1="'+mid+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'"/>'+
        '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+sR.toFixed(1)+'" fill="'+sA[0]+'"/>';
    });
    return '<svg viewBox="0 0 '+S+' '+S+'" width="'+S+'" height="'+S+'" class="iwpa-mol">'+
      '<g class="iwpa-bond">'+g+'</g>'+
      '<circle cx="'+mid+'" cy="'+mid+'" r="'+cR.toFixed(1)+'" fill="'+cA[0]+'"/></svg>';
  }
  R.particles=function(box,c){
    box.className='iw iw-card iw-pa';
    var mode=String(c.mode||'states').toLowerCase();
    if(['states','heat','mix'].indexOf(mode)<0)mode='states';
    var anim=iwBool(c.animate,true);
    var head=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwpa-intro">'+iwRT(c.intro)+'</div>':'');
    var tail=(c.note?'<div class="iwpa-note">'+iwRT(c.note)+'</div>':'');
    var col=String(c.color||'')||'var(--accent)';
    var r=Math.max(7,Math.round(iwNum(c.size)||12));
    var FACTS={
      solide:['forme propre','volume propre','incompressible'],
      liquide:['prend la forme du récipient','volume propre','peu compressible'],
      gaz:['occupe tout le volume','pas de volume propre','compressible']
    };

    if(mode==='states'){
      var ST=[{k:'solide',lab:c.solidLabel||'Solide',n:36},
              {k:'liquide',lab:c.liquidLabel||'Liquide',n:30},
              {k:'gaz',lab:c.gasLabel||'Gaz',n:12}];
      box.innerHTML=head+'<div class="iwpa-states'+(anim?' anim':'')+'">'+ST.map(function(s,si){
        var pts=paLayout(s.k,s.n,si*97+11);
        return '<figure class="iwpa-st" data-st="'+si+'"><div class="iwpa-box '+s.k+'">'+
          pts.map(function(p,i){
            return '<span class="iwpa-d '+s.k.charAt(0)+'" style="left:'+p[0].toFixed(1)+'%;top:'+
              p[1].toFixed(1)+'%;width:'+r+'px;height:'+r+'px;background:'+col+
              ';animation-delay:'+(paRnd(si*31+i)*2).toFixed(2)+'s"></span>';
          }).join('')+'</div>'+
          '<figcaption>'+esc(s.lab)+'</figcaption>'+
          (iwBool(c.facts,true)?'<ul>'+FACTS[s.k].map(function(f){ return '<li>'+esc(f)+'</li>'; }).join('')+'</ul>':'')+
          '</figure>';
      }).join('')+'</div>'+
      (iwBool(c.changes,true)?'<div class="iwpa-arrows">'+
        '<span class="iwpa-ar up"><i>fusion</i></span><span class="iwpa-ar up"><i>vaporisation</i></span>'+
        '<span class="iwpa-ar dn"><i>solidification</i></span><span class="iwpa-ar dn"><i>liquéfaction</i></span>'+
        '<span class="iwpa-ar sub"><i>sublimation</i></span></div>':'')+
      tail;
      // hovering a box lifts it and dims the others, so a class can be pointed
      // at one state without losing the comparison
      box.addEventListener('mouseover',function(ev){
        var f=ev.target.closest?ev.target.closest('[data-st]'):null;
        box.querySelector('.iwpa-states').classList.toggle('focus',!!f);
        [].forEach.call(box.querySelectorAll('[data-st]'),function(x){ x.classList.toggle('on',x===f); });
      });
      box.addEventListener('mouseleave',function(){
        box.querySelector('.iwpa-states').classList.remove('focus');
        [].forEach.call(box.querySelectorAll('[data-st]'),function(x){ x.classList.remove('on'); });
      });
      return;
    }

    if(mode==='heat'){
      /* One box and a temperature. The particles are the SAME particles at
         every temperature — they only rearrange — which is the sentence the
         figure is there to prove: heating changes neither the nature nor the
         amount of matter. */
      var melt=iwNum(c.melt); if(melt==null)melt=0;
      var boil=iwNum(c.boil); if(boil==null)boil=100;
      if(boil<=melt)boil=melt+1;
      var lo=iwNum(c.tmin); if(lo==null)lo=melt-(boil-melt)*0.5;
      var hi=iwNum(c.tmax); if(hi==null)hi=boil+(boil-melt)*0.5;
      var unit=String(c.unit||'°C'), t=iwNum(c.value);
      if(t==null)t=melt-(boil-melt)*0.2;
      var N=30, pts={solide:paLayout('solide',N,7),liquide:paLayout('liquide',N,23),gaz:paLayout('gaz',N,41)};
      box.innerHTML=head+
        '<div class="iwpa-heat'+(anim?' anim':'')+'"><div class="iwpa-box"></div>'+
        '<div class="iwpa-hside"><div class="iwpa-state"></div>'+
        '<ul class="iwpa-hfacts"></ul></div></div>'+
        // a step of (range/100) lands on 1,8 °C and the readout says −20,2;
        // snap to the nearest round number a thermometer would actually show
        '<div class="iwpa-slider"><input type="range" min="'+lo+'" max="'+hi+'" step="'+
        (function(){ var want=(hi-lo)/180, N=[0.1,0.2,0.5,1,2,5,10,20,50], j;
          for(j=0;j<N.length;j++)if(N[j]>=want)return N[j];
          return N[N.length-1]; })()+'" value="'+t+'" aria-label="Température">'+
        '<div class="iwpa-scale"><span style="left:'+((melt-lo)/(hi-lo)*100).toFixed(1)+'%">'+
        iwFrNum(melt,1)+' '+esc(unit)+'</span><span style="left:'+((boil-lo)/(hi-lo)*100).toFixed(1)+'%">'+
        iwFrNum(boil,1)+' '+esc(unit)+'</span></div>'+
        '<div class="iwpa-temp"></div></div>'+tail;
      var bx=box.querySelector('.iwpa-box'), inp=box.querySelector('input');
      var stateEl=box.querySelector('.iwpa-state'), factsEl=box.querySelector('.iwpa-hfacts');
      var tempEl=box.querySelector('.iwpa-temp'), heat=box.querySelector('.iwpa-heat');
      var dots=[], i;
      for(i=0;i<N;i++){
        var d=document.createElement('span');
        d.className='iwpa-d';
        d.style.width=r+'px'; d.style.height=r+'px'; d.style.background=col;
        d.style.animationDelay=(paRnd(i*13)*2).toFixed(2)+'s';
        bx.appendChild(d); dots.push(d);
      }
      function apply(){
        var v=+inp.value;
        var k=v<melt?'solide':(v<boil?'liquide':'gaz');
        var p=pts[k];
        dots.forEach(function(d,j){ d.style.left=p[j][0].toFixed(1)+'%'; d.style.top=p[j][1].toFixed(1)+'%'; });
        heat.className='iwpa-heat'+(anim?' anim':'')+' '+k;
        stateEl.textContent=k.charAt(0).toUpperCase()+k.slice(1);
        factsEl.innerHTML=FACTS[k].map(function(f){ return '<li>'+esc(f)+'</li>'; }).join('');
        var near='';
        if(Math.abs(v-melt)<=(hi-lo)*0.03)near='fusion / solidification';
        else if(Math.abs(v-boil)<=(hi-lo)*0.03)near='vaporisation / liquéfaction';
        tempEl.innerHTML='<b>'+iwFrNum(v,1)+' '+esc(unit)+'</b>'+
          (near?'<i>'+esc(near)+'</i>':'');
      }
      inp.addEventListener('input',apply);
      apply();
      return;
    }

    /* mixture mode: real molecules, so "one element or two" is visible */
    var boxes=(c.boxes||[]).map(function(b){
      var sp=(String((b&&b.species)||'')).split(';').map(function(t){ return t.trim(); })
        .filter(function(t){ return t!==''; }).map(function(t){
          var m=new RegExp('^(.+?)(?:[ ]*[x' + String.fromCharCode(0xD7) + '][ ]*([0-9]+))?$').exec(t);
          var f=(m?m[1]:t).trim(), n=m&&m[2]?parseInt(m[2],10):3;
          return {f:f,n:Math.max(1,Math.min(24,n))};
        });
      return {label:String((b&&b.label)||''),sp:sp,note:String((b&&b.note)||'')};
    }).filter(function(b){ return b.sp.length; });
    if(!boxes.length){ box.innerHTML=head+'<div class="iw-err">Ajoutez au moins une boîte.</div>'; return; }
    /* iwAtoms is the parser — it returns {O:2} for O2. iwChem is the *formatter*
       and returns markup, whose Object.keys are character indices, so using it
       here called dioxygen a compound. */
    function kindOf(sp){
      var distinct={}; sp.forEach(function(s){ distinct[s.f]=1; });
      if(Object.keys(distinct).length>1)
        return {t:'mélange',d:'plusieurs espèces chimiques différentes'};
      var atoms=iwAtoms(sp[0].f,1);
      return Object.keys(atoms).length>1
        ? {t:'corps pur composé',d:'une seule espèce, formée de plusieurs éléments'}
        : {t:'corps pur simple',d:'une seule espèce, formée d’un seul élément'};
    }
    box.innerHTML=head+'<div class="iwpa-mix'+(anim?' anim':'')+'">'+boxes.map(function(b,bi){
      var k=kindOf(b.sp), total=0;
      b.sp.forEach(function(s){ total+=s.n; });
      var pts=paLayout('gaz',total,bi*57+5), i=0, cells='';
      b.sp.forEach(function(s,si){
        var glyph=paMol(s.f,r*1.7), j;
        for(j=0;j<s.n;j++,i++)
          cells+='<span class="iwpa-m" data-sp="'+bi+'_'+si+'" style="left:'+pts[i][0].toFixed(1)+
            '%;top:'+pts[i][1].toFixed(1)+'%;animation-delay:'+(paRnd(bi*29+i)*2).toFixed(2)+'s">'+glyph+'</span>';
      });
      return '<figure class="iwpa-mb" data-box="'+bi+'"><div class="iwpa-box">'+cells+'</div>'+
        '<figcaption>'+iwRT(b.label||('Boîte '+(bi+1)))+'</figcaption>'+
        '<div class="iwpa-leg">'+b.sp.map(function(s,si){
          return '<button type="button" data-lg="'+bi+'_'+si+'">'+iwChem(s.f)+
            '<em>× '+s.n+'</em></button>'; }).join('')+'</div>'+
        (iwBool(c.verdict,true)?'<div class="iwpa-verdict"><b>'+esc(k.t)+'</b><i>'+esc(k.d)+'</i></div>':'')+
        (b.note?'<div class="iwpa-bn">'+iwRT(b.note)+'</div>':'')+'</figure>';
    }).join('')+'</div>'+tail;
    // clicking a species in the legend picks it out of the box
    box.addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-lg]'):null;
      var key=b?b.getAttribute('data-lg'):null;
      var was=b&&b.classList.contains('on');
      [].forEach.call(box.querySelectorAll('[data-lg]'),function(x){ x.classList.remove('on'); });
      [].forEach.call(box.querySelectorAll('.iwpa-m'),function(x){ x.classList.remove('dim'); });
      if(!b||was)return;
      b.classList.add('on');
      [].forEach.call(box.querySelectorAll('.iwpa-m'),function(x){
        if(x.getAttribute('data-sp')!==key)x.classList.add('dim'); });
    });
  };

  /* ── instrument: read the scale ──────────────────────────────────────────
     Taking a reading off a graduated instrument is a skill every science
     course teaches and no textbook can practise, because a printed instrument
     shows one reading for ever. Here the reading is a number you set, the
     graduations are drawn from the range and the step, and the tolerance
     defaults to half a division — which is the rule being taught. */
  R.instrument=function(box,c){
    box.className='iw iw-card iw-in';
    var kind=String(c.kind||'cylinder').toLowerCase();
    if(['cylinder','thermometer','dial','ruler'].indexOf(kind)<0)kind='cylinder';
    var lo=iwNum(c.min), hi=iwNum(c.max);
    if(lo==null)lo=0;
    if(hi==null)hi=kind==='thermometer'?100:(kind==='ruler'?10:100);
    if(hi===lo)hi=lo+1;
    var step=Math.abs(iwNum(c.step)||((hi-lo)/10));
    var val=iwNum(c.value); if(val==null)val=lo+(hi-lo)*0.42;
    val=Math.max(lo,Math.min(hi,val));
    var unit=String(c.unit||(kind==='thermometer'?'°C':(kind==='ruler'?'cm':'mL')));
    var quiz=String(c.mode||'read').toLowerCase()==='read';
    var tol=iwNum(c.tolerance); if(tol==null)tol=step/2;
    var dec=Math.max(0,Math.min(4,Math.round(iwNum(c.decimals)!=null?iwNum(c.decimals):
      (step<0.1?2:(step<1?1:0)))));
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwin-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwin-wrap"><div class="iwin-stage"></div>'+
      (quiz?'<div class="iwin-ask"><label>'+esc(c.askLabel||'Quelle est la valeur lue ?')+
        '</label><div class="iwin-in"><input type="text" inputmode="decimal" autocomplete="off" '+
        'spellcheck="false" aria-label="Valeur lue"><span class="iwin-u">'+esc(unit)+'</span>'+
        '<i class="iwin-mark"></i></div>'+
        '<div class="iwin-actions"><button type="button" class="iw-btn" data-in="check">'+T('check','Vérifier')+'</button>'+
        '<button type="button" class="iwm-qbtn" data-q="show">Corrigé</button></div>'+
        '<div class="iwin-why" hidden></div></div>'
        :'<div class="iwin-ask"><div class="iwin-shown"><b>'+iwFrFix(val,dec)+'</b> '+esc(unit)+'</div></div>')+
      '</div>'+
      (c.note?'<div class="iwin-note">'+iwRT(c.note)+'</div>':'');
    var stage=box.querySelector('.iwin-stage');
    function ticks(){
      var out=[], v, n=0;
      for(v=lo;v<=hi+step/1e6&&n<400;v+=step,n++)out.push(v);
      return out;
    }
    function draw(){
      var w=Math.max(150,stage.clientWidth||240);
      var s='';
      if(kind==='ruler'){
        var W=Math.round(Math.min(w,620)), H=86, m=18;
        var X=function(v){ return m+(v-lo)/(hi-lo)*(W-2*m); };
        s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'">'+
          '<rect class="iwin-body" x="'+m+'" y="14" width="'+(W-2*m)+'" height="40" rx="3"/>'+
          ticks().map(function(v,i){
            var big=Math.abs(v/step)%5<0.001||i===0;
            return '<line class="iwin-t'+(big?' big':'')+'" x1="'+X(v).toFixed(1)+'" y1="14" x2="'+
              X(v).toFixed(1)+'" y2="'+(big?32:24)+'"/>'+
              (big?'<text class="iwin-n" x="'+X(v).toFixed(1)+'" y="46">'+iwFrNum(v,dec)+'</text>':'');
          }).join('')+
          '<path class="iwin-mk" d="M'+X(val).toFixed(1)+' 60 l-6 14 h12 z"/>'+
          '<line class="iwin-mkl" x1="'+X(val).toFixed(1)+'" y1="10" x2="'+X(val).toFixed(1)+'" y2="60"/>'+
          '</svg>';
      } else if(kind==='dial'){
        var D=Math.round(Math.min(w,300)), R0=D/2-16, cx=D/2, cy=D*0.62;
        var A=function(v){ return (-160+(v-lo)/(hi-lo)*140)*Math.PI/180; };
        s='<svg viewBox="0 0 '+D+' '+Math.round(D*0.72)+'" width="'+D+'" height="'+Math.round(D*0.72)+'">'+
          '<path class="iwin-arc" d="M'+(cx+R0*Math.cos(A(lo))).toFixed(1)+' '+(cy+R0*Math.sin(A(lo))).toFixed(1)+
          'A'+R0+' '+R0+' 0 0 1 '+(cx+R0*Math.cos(A(hi))).toFixed(1)+' '+(cy+R0*Math.sin(A(hi))).toFixed(1)+'"/>'+
          ticks().map(function(v,i){
            var a=A(v), big=Math.abs(v/step)%5<0.001||i===0, r2=R0-(big?11:6);
            return '<line class="iwin-t'+(big?' big':'')+'" x1="'+(cx+R0*Math.cos(a)).toFixed(1)+'" y1="'+(cy+R0*Math.sin(a)).toFixed(1)+
              '" x2="'+(cx+r2*Math.cos(a)).toFixed(1)+'" y2="'+(cy+r2*Math.sin(a)).toFixed(1)+'"/>'+
              (big?'<text class="iwin-n" x="'+(cx+(R0-24)*Math.cos(a)).toFixed(1)+'" y="'+(cy+(R0-20)*Math.sin(a)).toFixed(1)+
                '">'+iwFrNum(v,dec)+'</text>':'');
          }).join('')+
          '<line class="iwin-needle" x1="'+cx+'" y1="'+cy+'" x2="'+(cx+(R0-6)*Math.cos(A(val))).toFixed(1)+
          '" y2="'+(cy+(R0-6)*Math.sin(A(val))).toFixed(1)+'"/>'+
          '<circle class="iwin-pin" cx="'+cx+'" cy="'+cy+'" r="6"/>'+
          (unit?'<text class="iwin-un" x="'+cx+'" y="'+(cy-R0*0.42).toFixed(1)+'">'+esc(unit)+'</text>':'')+
          '</svg>';
      } else {
        // cylinder and thermometer are the same drawing: a column that fills
        var widest=0;
        ticks().forEach(function(v){ widest=Math.max(widest,iwFrNum(v,dec).length); });
        var W2=Math.round((kind==='thermometer'?78:112)+widest*7), H2=Math.round(Math.min(320,Math.max(200,w*0.8)));
        var top=14, bot=H2-(kind==='thermometer'?34:16);
        var Y=function(v){ return bot-(v-lo)/(hi-lo)*(bot-top); };
        var cw=kind==='thermometer'?12:60, cx2=W2/2;
        s='<svg viewBox="0 0 '+W2+' '+H2+'" width="'+W2+'" height="'+H2+'">'+
          (kind==='thermometer'
            ? '<rect class="iwin-body" x="'+(cx2-cw/2)+'" y="'+top+'" width="'+cw+'" height="'+(bot-top+10)+'" rx="6"/>'+
              '<circle class="iwin-body" cx="'+cx2+'" cy="'+(bot+18)+'" r="13"/>'+
              '<rect class="iwin-fill" x="'+(cx2-cw/2+3)+'" y="'+Y(val).toFixed(1)+'" width="'+(cw-6)+
                '" height="'+(bot+14-Y(val)).toFixed(1)+'" rx="3"/>'+
              '<circle class="iwin-fill" cx="'+cx2+'" cy="'+(bot+18)+'" r="10"/>'
            : '<path class="iwin-body" d="M'+(cx2-cw/2)+' '+top+'V'+(bot-8)+'q0 8 8 8h'+(cw-16)+'q8 0 8-8V'+top+'"/>'+
              '<rect class="iwin-fill" x="'+(cx2-cw/2+2)+'" y="'+Y(val).toFixed(1)+'" width="'+(cw-4)+
                '" height="'+(bot-Y(val)).toFixed(1)+'"/>'+
              '<path class="iwin-men" d="M'+(cx2-cw/2+2)+' '+(Y(val)+4).toFixed(1)+'q'+((cw-4)/2)+' -9 '+(cw-4)+' 0"/>')+
          ticks().map(function(v,i){
            var big=Math.abs(v/step)%5<0.001||i===0;
            var xa=cx2+cw/2, xb=xa+(big?12:7);
            return '<line class="iwin-t'+(big?' big':'')+'" x1="'+xa+'" y1="'+Y(v).toFixed(1)+'" x2="'+xb+'" y2="'+Y(v).toFixed(1)+'"/>'+
              (big?'<text class="iwin-n l" x="'+(xb+3)+'" y="'+(Y(v)+3.5).toFixed(1)+'">'+iwFrNum(v,dec)+'</text>':'');
          }).join('')+
          '</svg>';
      }
      stage.innerHTML=s;
    }
    if(quiz){
      var inp=box.querySelector('.iwin-ask input'), why=box.querySelector('.iwin-why');
      var mark=function(reveal){
        var given=iwNum(inp.value);
        var good=given!=null&&Math.abs(given-val)<=tol+1e-9;
        box.querySelector('.iwin-in').className='iwin-in '+(reveal?'ok':(good?'ok':'no'));
        why.hidden=false;
        why.innerHTML=(reveal||good)
          ? '<b>'+iwFrFix(val,dec)+' '+esc(unit)+'</b> — une graduation vaut '+iwFrNum(step,dec+1)+
            ' '+esc(unit)+', donc on lit à '+iwFrNum(tol,dec+1)+' '+esc(unit)+' près.'
          : 'Pas encore. Regardez d’abord ce que vaut <b>une graduation</b>.';
        if(reveal)inp.value=iwFrFix(val,dec);
      };
      box.querySelector('[data-in="check"]').addEventListener('click',function(){ mark(false); });
      box.querySelector('[data-q="show"]').addEventListener('click',function(){ mark(true); });
      inp.addEventListener('keydown',function(ev){ if(ev.key==='Enter')mark(false); });
    }
    iwWatch(box,draw);
  };

  /* ── keychart: a dichotomous key ─────────────────────────────────────────
     Two questions at a time until only one answer is left. Biology teaches it
     for classifying organisms, but the shape is older and wider than biology:
     mineral identification, grammar decisions, fault-finding, a library
     catalogue. Written as couplets — the way every printed key is written —
     and walkable, which a printed key never is. */
  R.keychart=function(box,c){
    box.className='iw iw-card iw-kc';
    var steps=(c.steps||[]).map(function(s,i){
      return {id:String((s&&s.id)||(i+1)),
        a:{t:String((s&&s.a)||''),to:String((s&&s.aTo)||'').trim()},
        b:{t:String((s&&s.b)||''),to:String((s&&s.bTo)||'').trim()},
        ask:String((s&&s.ask)||''),note:String((s&&s.note)||'')};
    }).filter(function(s){ return s.a.t||s.b.t; });
    if(!steps.length){ box.innerHTML='<div class="iw-err">Ajoutez au moins un couplet.</div>'; return; }
    var by={}; steps.forEach(function(s){ by[s.id]=s; });
    var walk=String(c.mode||'walk').toLowerCase()==='walk';
    var start=steps[0].id, at=start, trail=[];
    function isStep(t){ return !!by[t]; }
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwkc-intro">'+iwRT(c.intro)+'</div>':'')+
      (walk?'<div class="iwkc-walk"><div class="iwkc-trail"></div><div class="iwkc-now"></div>'+
        '<button type="button" class="iwm-qbtn iwkc-again" hidden>'+T('reset','Recommencer')+'</button></div>'
        :'<div class="iwkc-list">'+steps.map(function(s){
          return '<div class="iwkc-row"><span class="iwkc-id">'+esc(s.id)+'</span><div>'+
            (s.ask?'<div class="iwkc-ask">'+iwRT(s.ask)+'</div>':'')+
            [['a',s.a],['b',s.b]].map(function(p){
              return '<div class="iwkc-opt"><i>'+esc(s.id)+p[0]+'</i>'+iwRT(p[1].t)+
                '<b>'+(isStep(p[1].to)?esc(p[1].to):('→ '+esc(p[1].to)))+'</b></div>';
            }).join('')+'</div></div>'; }).join('')+'</div>')+
      (c.note?'<div class="iwkc-note">'+iwRT(c.note)+'</div>':'');
    if(!walk)return;
    var now=box.querySelector('.iwkc-now'), tr=box.querySelector('.iwkc-trail');
    var again=box.querySelector('.iwkc-again');
    function render(){
      tr.innerHTML=trail.map(function(t){
        return '<span class="iwkc-crumb">'+iwRT(t)+'</span>'; }).join('');
      var s=by[at];
      if(s){
        now.innerHTML=(s.ask?'<div class="iwkc-ask">'+iwRT(s.ask)+'</div>':'')+
          '<div class="iwkc-btns">'+[['a',s.a],['b',s.b]].map(function(p){
            return '<button type="button" class="iwkc-b" data-go="'+esc(p[1].to)+'" data-lb="'+
              esc(iwRTx(p[1].t))+'">'+iwRT(p[1].t)+'</button>'; }).join('')+'</div>'+
          (s.note?'<div class="iwkc-sn">'+iwRT(s.note)+'</div>':'');
        again.hidden=!trail.length;
      } else {
        now.innerHTML='<div class="iwkc-result"><span>Identification</span><b>'+iwRT(at)+'</b></div>';
        again.hidden=false;
      }
    }
    box.addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-go]'):null;
      if(b){ trail.push(b.getAttribute('data-lb')); at=b.getAttribute('data-go')||at; render(); return; }
      if(ev.target.closest&&ev.target.closest('.iwkc-again')){ at=start; trail=[]; render(); }
    });
    render();
  };

  /* ── music: the shared pitch arithmetic ──────────────────────────────────
     Everything below runs on one idea: a pitch is a semitone number, and a
     note name is a letter plus an accidental. Get that right once and
     intervals, scales, chords and key signatures all fall out of it, instead
     of each element carrying its own table of special cases. */
  var MU_LET='CDEFGAB', MU_SEMI=[0,2,4,5,7,9,11];
  var MU_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var MU_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  function muParse(s){
    s=String(s==null?'':s).trim();
    var m=new RegExp('^([A-Ga-g])([#b' + String.fromCharCode(0x266F) + String.fromCharCode(0x266D)
      + ']*)(-?[0-9]+)?$').exec(s);
    if(!m)return null;
    var letter=m[1].toUpperCase(), acc=0, i;
    for(i=0;i<m[2].length;i++)acc+=(m[2].charAt(i)==='#'||m[2].charAt(i)===String.fromCharCode(0x266F))?1:-1;
    var oct=m[3]==null?4:parseInt(m[3],10);
    var li=MU_LET.indexOf(letter);
    return {letter:letter,li:li,acc:acc,oct:oct,pc:((MU_SEMI[li]+acc)%12+12)%12,
      midi:(oct+1)*12+MU_SEMI[li]+acc};
  }
  function muName(pc,flats){ return (flats?MU_FLAT:MU_SHARP)[((pc%12)+12)%12]; }
  /* An accidental is only ever an accidental after a note letter — "b" on its
     own is the note B, and the relative minor of D major was being printed as
     a lone flat sign. So the first character is left alone. */
  function muPretty(n){
    var s=String(n==null?'':n);
    if(!s)return s;
    return s.charAt(0)+s.slice(1).replace(new RegExp('#','g'),String.fromCharCode(0x266F))
      .replace(new RegExp('b','g'),String.fromCharCode(0x266D));
  }
  /* Interval quality from the letter distance and the semitone distance — the
     two numbers a musician actually uses, which is why C-E and C-Fb differ. */
  var MU_IVN=['unisson','seconde','tierce','quarte','quinte','sixte','septième','octave'];
  function muInterval(a,b){
    var A=muParse(a), B=muParse(b);
    if(!A||!B)return null;
    var lo=A.midi<=B.midi?A:B, hi=A.midi<=B.midi?B:A;
    var deg=(hi.li-lo.li)+7*(hi.oct-lo.oct);        // letter steps
    var semi=hi.midi-lo.midi;
    var num=deg+1, simple=((deg%7)+7)%7;
    var perfect=(simple===0||simple===3||simple===4);
    var base=MU_SEMI[simple]+12*Math.floor(deg/7);
    var d=semi-base, q;
    if(perfect)q=(d===0?'juste':(d===1?'augmentée':(d===-1?'diminuée':(d>0?'sur-augmentée':'sous-diminuée'))));
    else q=(d===0?'majeure':(d===-1?'mineure':(d===1?'augmentée':(d===-2?'diminuée':(d>0?'sur-augmentée':'sous-diminuée')))));
    return {num:num,semi:semi,quality:q,
      name:(num<=8?MU_IVN[simple]:('intervalle de '+num+'e'))+' '+q,
      short:(perfect?'J':(q==='majeure'?'M':(q==='mineure'?'m':(q==='augmentée'?'A':'d'))))+num};
  }
  var MU_SCALES={
    majeure:[0,2,4,5,7,9,11], 'mineure naturelle':[0,2,3,5,7,8,10],
    'mineure harmonique':[0,2,3,5,7,8,11], 'mineure mélodique':[0,2,3,5,7,9,11],
    dorien:[0,2,3,5,7,9,10], phrygien:[0,1,3,5,7,8,10], lydien:[0,2,4,6,7,9,11],
    mixolydien:[0,2,4,5,7,9,10], locrien:[0,1,3,5,6,8,10],
    pentatonique:[0,2,4,7,9], blues:[0,3,5,6,7,10], chromatique:[0,1,2,3,4,5,6,7,8,9,10,11]
  };
  /* Each chord is a pair: the semitones above the root, and the LETTER steps
     that go with them. A triad is stacked in thirds, so its letters are every
     other one — and that is what decides the spelling: G minor is G–B♭–D, not
     G–A♯–D, because the third of G must be some kind of B. */
  var MU_CHORDS={
    majeur:[0,4,7], mineur:[0,3,7], diminué:[0,3,6], augmenté:[0,4,8],
    'sus4':[0,5,7], 'sus2':[0,2,7],
    '7 de dominante':[0,4,7,10], 'majeur 7':[0,4,7,11], 'mineur 7':[0,3,7,10],
    'demi-diminué':[0,3,6,10], 'diminué 7':[0,3,6,9]
  };
  var MU_STEPS={ 'sus4':[0,3,4], 'sus2':[0,1,4] };     // everything else stacks in thirds
  function muSpell(root,quality){
    var iv=MU_CHORDS[quality], steps=MU_STEPS[quality];
    return iv.map(function(s,idx){
      var li=((root.li+(steps?steps[idx]:2*idx))%7+7)%7;
      var want=((root.pc+s)%12+12)%12;
      var acc=((want-MU_SEMI[li])%12+12)%12;
      if(acc>6)acc-=12;                                 // -2 = double flat, +1 = sharp
      var name=MU_LET.charAt(li), k;
      for(k=0;k<Math.abs(acc);k++)name+=(acc>0?'#':'b');
      return name;
    });
  }
  var MU_SYM={majeur:'',mineur:'m',diminué:'°',augmenté:'+','sus4':'sus4','sus2':'sus2',
    '7 de dominante':'7','majeur 7':'maj7','mineur 7':'m7','demi-diminué':'ø7','diminué 7':'°7'};

  /* ── keyboard: the piano as a ruler for pitch ────────────────────────────
     A keyboard makes a semitone visible in a way a staff never does — which is
     why every theory book reaches for one when it explains intervals, scales
     and octave numbering. Marks are given as note names, so the same element
     shows a chord, a scale or a single interval, and in quiz mode it asks the
     reader to find the note instead of telling them where it is. */
  R.keyboard=function(box,c){
    box.className='iw iw-card iw-kb';
    var from=muParse(c.from||'C3')||muParse('C3');
    var octaves=Math.max(1,Math.min(5,Math.round(iwNum(c.octaves)||2)));
    var flats=iwBool(c.flats,false);
    var show=String(c.labels||'marked').toLowerCase();   // all | marked | none
    var quiz=String(c.mode||'show').toLowerCase()==='quiz';
    var marks=(c.marks||[]).map(function(m){
      var p=muParse(m&&m.note);
      return p?{p:p,label:String((m&&m.label)||''),color:String((m&&m.color)||''),
        note:String((m&&m.note)||'')}:null;
    }).filter(Boolean);
    var byMidi={}; marks.forEach(function(m){ byMidi[m.p.midi]=m; });
    var startMidi=(from.oct+1)*12+MU_SEMI[from.li];      // always start on a white key
    var keys=[], i, wcount=0;
    for(i=0;i<octaves*12+1;i++){
      var midi=startMidi+i, pc=((midi%12)+12)%12;
      var black=(MU_SHARP[pc].length>1);
      keys.push({midi:midi,pc:pc,black:black,wi:black?wcount-1:wcount++,
        name:muName(pc,flats)+Math.floor(midi/12-1)});
    }
    var white=wcount;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwkb-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwkb-stage"><div class="iwkb-keys">'+keys.map(function(k){
        var m=byMidi[k.midi], on=!!m;
        var lb=(show==='all'||(show==='marked'&&on))?(m&&m.label?m.label:muPretty(muName(k.pc,flats))):'';
        return '<button type="button" class="iwkb-k'+(k.black?' b':' w')+(on&&!quiz?' on':'')+
          '" data-m="'+k.midi+'" data-n="'+esc(k.name)+'"'+
          (k.black?' style="left:calc('+(k.wi+1)+' * (100% / '+white+') - (100% / '+white+') * 0.29)"':'')+
          (on&&m.color&&!quiz?' data-col="1"':'')+
          '><span'+(on&&m.color&&!quiz?' style="background:'+esc(m.color)+'"':'')+'>'+
          (lb?esc(muPretty(lb)):'')+'</span></button>';
      }).join('')+'</div></div>'+
      '<div class="iwkb-read"></div>'+
      (c.note?'<div class="iwkb-note">'+iwRT(c.note)+'</div>':'');
    var read=box.querySelector('.iwkb-read');
    function base(){
      if(quiz){
        var todo=marks.filter(function(m){ return !m.found; });
        read.innerHTML=todo.length
          ? 'Trouvez : <b>'+esc(muPretty(todo.map(function(m){ return m.label||m.note; }).join(', ')))+'</b>'
          : '<b class="ok">Toutes trouvées.</b>';
        return;
      }
      if(marks.length){
        read.innerHTML=marks.map(function(m){
          return '<span>'+esc(muPretty(m.note))+(m.label?' — '+iwRT(m.label):'')+'</span>'; }).join('');
        if(marks.length===2){
          var iv=muInterval(marks[0].note,marks[1].note);
          if(iv)read.innerHTML+='<i>'+esc(iv.name)+' ('+iv.semi+' demi-tons)</i>';
        }
      } else read.innerHTML='<span class="iwkb-hint">Cliquez une touche pour la nommer.</span>';
    }
    box.addEventListener('click',function(ev){
      var b=ev.target.closest?ev.target.closest('[data-m]'):null; if(!b)return;
      var midi=+b.getAttribute('data-m'), m=byMidi[midi];
      if(quiz){
        if(m){ m.found=true; b.classList.add('ok'); }
        else { b.classList.add('no'); setTimeout(function(){ b.classList.remove('no'); },700); }
        base(); return;
      }
      read.innerHTML='<b>'+esc(muPretty(b.getAttribute('data-n')))+'</b>'+
        (m&&m.label?' — '+iwRT(m.label):'');
    });
    base();
  };

  /* ── fifths: the circle of fifths ────────────────────────────────────────
     One picture that answers three questions at once — how many sharps or
     flats a key has, which keys are next door, and what its relative minor is.
     The signatures are counted, not looked up in a table, so the circle cannot
     drift out of step with itself. */
  R.fifths=function(box,c){
    box.className='iw iw-card iw-cf';
    var MAJ=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];
    var MIN=['a','e','b','f#','c#','g#','d#','bb','f','c','g','d'];
    var SIG=[0,1,2,3,4,5,6,-5,-4,-3,-2,-1];
    var start=String(c.highlight||'').trim();
    var sel=Math.max(0,MAJ.map(function(k){ return k.toLowerCase(); }).indexOf(start.toLowerCase()));
    if(start==='')sel=-1;
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcf-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwcf-wheel"><svg viewBox="-130 -130 260 260" role="img">'+
      MAJ.map(function(k,i){
        var a0=(i*30-105)*Math.PI/180, a1=((i+1)*30-105)*Math.PI/180;
        function arc(r0,r1){
          var x0=r1*Math.cos(a0), y0=r1*Math.sin(a0), x1=r1*Math.cos(a1), y1=r1*Math.sin(a1);
          var i0=r0*Math.cos(a1), j0=r0*Math.sin(a1), i1=r0*Math.cos(a0), j1=r0*Math.sin(a0);
          return 'M'+x0.toFixed(1)+' '+y0.toFixed(1)+'A'+r1+' '+r1+' 0 0 1 '+x1.toFixed(1)+' '+y1.toFixed(1)+
            'L'+i0.toFixed(1)+' '+j0.toFixed(1)+'A'+r0+' '+r0+' 0 0 0 '+i1.toFixed(1)+' '+j1.toFixed(1)+'Z';
        }
        var am=(a0+a1)/2;
        return '<path class="iwcf-seg maj'+(sel===i?' on':'')+'" data-k="'+i+'" d="'+arc(78,122)+'"/>'+
          '<path class="iwcf-seg min'+(sel===i?' on':'')+'" data-k="'+i+'" d="'+arc(40,76)+'"/>'+
          '<text class="iwcf-maj'+(sel===i?' on':'')+'" x="'+(100*Math.cos(am)).toFixed(1)+'" y="'+(100*Math.sin(am)+5).toFixed(1)+'">'+
            esc(muPretty(k))+'</text>'+
          '<text class="iwcf-min'+(sel===i?' on':'')+'" x="'+(58*Math.cos(am)).toFixed(1)+'" y="'+(58*Math.sin(am)+4).toFixed(1)+'">'+
            esc(muPretty(MIN[i]))+'</text>';
      }).join('')+
      '<text class="iwcf-c1" x="0" y="-6">majeur</text><text class="iwcf-c2" x="0" y="10">mineur</text>'+
      '</svg></div>'+
      '<div class="iwcf-read"></div>'+
      (c.note?'<div class="iwcf-note">'+iwRT(c.note)+'</div>':'');
    var read=box.querySelector('.iwcf-read');
    function say(i){
      if(i<0){ read.innerHTML='<span class="iwcf-hint">Cliquez une tonalité : son armure, sa relative et ses voisines.</span>'; return; }
      var n=SIG[i], acc=n===0?'aucune altération':(Math.abs(n)+' '+(n>0?
        (Math.abs(n)>1?'dièses':'dièse'):(Math.abs(n)>1?'bémols':'bémol')));
      read.innerHTML='<b>'+esc(muPretty(MAJ[i]))+' majeur</b> — '+esc(acc)+
        ' &nbsp;·&nbsp; relative mineure <b>'+esc(muPretty(MIN[i]))+'</b>'+
        ' &nbsp;·&nbsp; voisines '+esc(muPretty(MAJ[(i+11)%12]))+' et '+esc(muPretty(MAJ[(i+1)%12]));
    }
    box.addEventListener('click',function(ev){
      var t=ev.target.closest?ev.target.closest('[data-k]'):null; if(!t)return;
      var i=+t.getAttribute('data-k'); sel=(sel===i?-1:i);
      [].forEach.call(box.querySelectorAll('[data-k]'),function(p){
        p.classList.toggle('on',+p.getAttribute('data-k')===sel); });
      [].forEach.call(box.querySelectorAll('.iwcf-maj,.iwcf-min'),function(p,k){
        p.classList.toggle('on',Math.floor(k/2)===sel); });
      say(sel); });
    say(sel);
  };

  /* ── rhythmgrid: does the bar add up? ────────────────────────────────────
     A meter signature is a promise about how much fits in a bar, and the
     commonest mistake a beginner makes is breaking it. So the element counts:
     write the note values, and each bar says whether it is short, full or
     over. Dots and ties are handled where they belong — in the arithmetic. */
  var RG_VAL={'r':4,'b':2,'n':1,'c':0.5,'d':0.25,'q':0.125,
    'w':4,'h':2,'q4':1,'e':0.5,'s':0.25,'t':0.125};
  var RG_GLYPH={4:'𝅝',2:'𝅗𝅥',1:'♩',0.5:'♪',0.25:'𝅘𝅥𝅯',0.125:'𝅘𝅥𝅰'};
  function rgTok(t){
    t=String(t).trim(); if(!t)return null;
    var rest=new RegExp('^-').test(t); if(rest)t=t.slice(1);
    var dots=0; while(new RegExp('[.]$').test(t)){ dots++; t=t.slice(0,-1); }
    var v=RG_VAL[t]!==undefined?RG_VAL[t]:iwNum(t);
    if(v==null||!(v>0))return null;
    var total=v, add=v;
    for(var i=0;i<dots;i++){ add/=2; total+=add; }
    return {v:total,base:v,dots:dots,rest:rest};
  }
  R.rhythmgrid=function(box,c){
    box.className='iw iw-card iw-rg';
    var sig=String(c.meter||'4/4').split('/');
    var top=Math.max(1,Math.round(iwNum(sig[0])||4));
    var bot=Math.max(1,Math.round(iwNum(sig[1])||4));
    var perBar=top*(4/bot);                              // in quarter notes
    var compound=(top%3===0&&top>3);
    var bars=iwLines(c.bars).map(function(line,bi){
      var toks=line.split(new RegExp('[ ,]+')).map(rgTok).filter(Boolean);
      var sum=toks.reduce(function(a,t){ return a+t.v; },0);
      return {i:bi,toks:toks,sum:sum,
        state:Math.abs(sum-perBar)<1e-9?'ok':(sum<perBar?'short':'over')};
    }).filter(function(b){ return b.toks.length; });
    if(!bars.length){ box.innerHTML='<div class="iw-err">Écrivez au moins une mesure.</div>'; return; }
    var count=iwBool(c.count,true);
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwrg-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwrg-head"><span class="iwrg-sig"><b>'+top+'</b><b>'+bot+'</b></span>'+
      '<span class="iwrg-kind">'+(compound?'mesure composée':'mesure simple')+' · '+
      esc(iwFrNum(perBar,2))+' noire'+(perBar>1?'s':'')+' par mesure</span></div>'+
      '<div class="iwrg-bars">'+bars.map(function(b){
        var acc=0;
        return '<div class="iwrg-bar '+b.state+'" data-b="'+b.i+'">'+
          '<div class="iwrg-notes">'+b.toks.map(function(t){
            var w=Math.max(6,t.v/perBar*100);
            acc+=t.v;
            return '<span class="iwrg-n'+(t.rest?' rest':'')+'" style="flex:'+t.v.toFixed(4)+'">'+
              '<i>'+(t.rest?'𝄽':(RG_GLYPH[t.base]||'♩'))+(t.dots?'·'.repeat(t.dots):'')+'</i></span>';
          }).join('')+'</div>'+
          (count?'<div class="iwrg-count">'+(function(){
            var cells='', k;
            for(k=0;k<top;k++)cells+='<span>'+(k+1)+'</span>';
            return cells; })()+'</div>':'')+
          '<div class="iwrg-sum">'+iwFrNum(b.sum,3)+' / '+iwFrNum(perBar,3)+
          ' <b>'+(b.state==='ok'?'✓':(b.state==='short'?'incomplète':'trop pleine'))+'</b></div>'+
          '</div>';
      }).join('')+'</div>'+
      (c.note?'<div class="iwrg-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── chordbuilder: a triad, spelled out ──────────────────────────────────
     Root, quality, inversion — and everything else is derived: the notes, the
     figured bass, the popular symbol, and the Roman numeral if you name a key.
     A chord chart in a book is a list of facts a reader must trust; this one
     is computed, so changing the root cannot leave a stale symbol behind. */
  R.chordbuilder=function(box,c){
    box.className='iw iw-card iw-cb';
    var root=muParse(c.root||'C')||muParse('C');
    var quality=String(c.quality||'majeur');
    if(!MU_CHORDS[quality])quality='majeur';
    var iv=MU_CHORDS[quality];
    var inv=Math.max(0,Math.min(iv.length-1,Math.round(iwNum(c.inversion)||0)));
    var spelled=muSpell(root,quality);
    var names=spelled.slice(inv).concat(spelled.slice(0,inv));
    var FIG={0:{3:'5/3',4:'7'},1:{3:'6',4:'6/5'},2:{3:'6/4',4:'4/3'},3:{4:'4/2'}};
    var fig=(FIG[inv]&&FIG[inv][iv.length])||'';
    var sym=spelled[0]+(MU_SYM[quality]||'');
    if(inv>0)sym+='/'+names[0];
    var key=String(c.key||'').trim(), roman='';
    if(key){
      var k=muParse(key);
      if(k){
        var degSemi=((root.pc-k.pc)%12+12)%12;
        var DEG={0:'I',2:'II',4:'III',5:'IV',7:'V',9:'VI',11:'VII'};
        var r=DEG[degSemi];
        if(r){
          roman=(quality==='mineur'||quality==='diminué'||quality==='demi-diminué'||quality==='diminué 7')
            ? r.toLowerCase() : r;
          if(quality==='diminué'||quality==='diminué 7')roman+='°';
          if(quality==='demi-diminué')roman+='ø';
          if(quality==='augmenté')roman+='+';
          if(iv.length>3)roman+='7';
          if(fig&&inv>0)roman+=' '+fig;
        }
      }
    }
    // a small keyboard, so the shape is visible and not only spelled
    var lowMidi=(root.oct+1)*12+MU_SEMI[root.li]-((root.pc)); // start of that octave
    var span=24, keysH=[];
    for(var i=0;i<span+1;i++){
      var midi=lowMidi+i, pc=((midi%12)+12)%12;
      keysH.push({midi:midi,pc:pc,black:MU_SHARP[pc].length>1});
    }
    var wi=0; keysH.forEach(function(k){ if(!k.black)k.wi=wi++; else k.wi=wi-1; });
    var sound={};
    (function(){ var m=(root.oct+1)*12+MU_SEMI[root.li]+root.acc, j;
      for(j=0;j<iv.length;j++)sound[m+iv[(j+inv)%iv.length]+(j+inv>=iv.length?12:0)]=1; })();
    box.innerHTML=(c.title?'<div class="iw-title">'+iwRT(c.title)+'</div>':'')+
      (c.intro?'<div class="iwcb-intro">'+iwRT(c.intro)+'</div>':'')+
      '<div class="iwcb-top"><div class="iwcb-sym">'+esc(muPretty(sym))+'</div>'+
      '<div class="iwcb-facts">'+
        '<span><i>notes</i>'+esc(muPretty(names.join(' – ')))+'</span>'+
        '<span><i>état</i>'+esc(inv===0?'fondamental':(inv===1?'1er renversement':
          (inv===2?'2e renversement':'3e renversement')))+'</span>'+
        (fig?'<span><i>basse chiffrée</i>'+esc(fig)+'</span>':'')+
        (roman?'<span><i>degré en '+esc(muPretty(key))+'</i>'+esc(roman)+'</span>':'')+
        // measured between the SPELLED tones, so C–E is a major third and
        // C–F flat is a diminished fourth — which is why they are spelled
        '<span><i>intervalles</i>'+esc(muPretty(spelled.slice(1).map(function(nm,j){
          var x=muInterval(spelled[0]+'4',nm+((root.pc+iv[j+1])>=12?'5':'4'));
          return x?x.short:'?'; }).join(' · ')))+'</span>'+
      '</div></div>'+
      '<div class="iwcb-kb">'+keysH.map(function(k){
        return '<span class="iwcb-k'+(k.black?' b':' w')+(sound[k.midi]?' on':'')+'"'+
          (k.black?' style="left:calc('+(k.wi+1)+' * (100% / '+wi+') - (100% / '+wi+') * 0.29)"':'')+
          '></span>'; }).join('')+'</div>'+
      (c.note?'<div class="iwcb-note">'+iwRT(c.note)+'</div>':'');
  };

  /* ── the answer key ──────────────────────────────────────────────────
     One switch in the nav reveals every answer in the book at once, so the same
     file is both the student's copy and the teacher's. Elements that already own
     a "show" control are wired automatically by clicking it; the rest register a
     reveal function with iwOnAnswers(). Printing follows whatever state this is
     in, which is how you get a worksheet or its correction from one book. */
  function iwOnAnswers(fn){ IWANS.push(fn); if(window.__IWANSWERS){ try{ fn(true); }catch(e){} } }
  var IWANSSEL=['[data-ex="sol"]','[data-o="show"]','[data-me="all"]','[data-nu="show"]',
    '[data-rx="show"]','[data-q="show"]','.iwtl-show','.iwx-check','.iwq-submit','[data-rev]'];
  function iwAutoAnswers(box){
    var btns=[];
    IWANSSEL.forEach(function(s){ [].slice.call(box.querySelectorAll(s)).forEach(function(b){ if(btns.indexOf(b)<0)btns.push(b); }); });
    if(!btns.length)return;
    var done=false;
    iwOnAnswers(function(on){ if(!on||done)return; done=true;
      btns.forEach(function(b){ try{ b.click(); }catch(e){} }); }); }
  function iwSetAnswers(on){
    window.__IWANSWERS=!!on;
    document.documentElement.classList.toggle('iw-answers',!!on);
    var i; for(i=0;i<IWANS.length;i++){ try{ IWANS[i](!!on); }catch(e){} }
    var b=document.getElementById('answerKey');
    if(b){ b.classList.toggle('on',!!on); b.setAttribute('aria-pressed',on?'true':'false'); } }
  window.__iwAnswers=iwSetAnswers;

  function hydrate(box){ if(box.dataset.iwReady)return; box.dataset.iwReady='1';
    var fn=R[box.dataset.iw], cfg={}; try{cfg=JSON.parse(box.dataset.cfg||'{}');}catch(e){}
    if(fn){ try{ fn(box,cfg); iwAutoAnswers(box); }catch(e){ box.className='iw iw-card'; box.innerHTML='<div class="iw-err">Cet élément n’a pas pu s’afficher ('+esc(box.dataset.iw)+').</div>'; } } }
  function init(){ document.querySelectorAll('.iw[data-iw]').forEach(hydrate);
    var kb=document.getElementById('answerKey');
    if(kb&&!kb.__wired){ kb.__wired=1;
      kb.addEventListener('click',function(e){ e.preventDefault(); iwSetAnswers(!window.__IWANSWERS); }); }
    if(window.__IWANSWERS)iwSetAnswers(true); }
  if(document.readyState!=='loading')init(); else document.addEventListener('DOMContentLoaded',init);
  window.__hydrateInteractive=init;
})();
