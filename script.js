const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const defaults = {
  fullscreen: true,
  effects: true,
  subtitles: false,

  language: "pt",

  volume: {
    master: 80,
    music: 60,
    sfx: 90,
    ambience: 45
  },

  keys: {
    up: "w",
    down: "s",
    left: "a",
    right: "d",
    jump: " ",
    attack: "k",
    dash: "shift",
    map: "tab"
  }
};

let settings = loadSettings();
let listeningKey = null;


// ======================================================
// CARREGAR CONFIGURAÇÕES
// ======================================================

function loadSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("valeSombrioSettings")
    );

    return {
      ...defaults,
      ...saved,

      volume: {
        ...defaults.volume,
        ...(saved?.volume || {})
      },

      keys: {
        ...defaults.keys,
        ...(saved?.keys || {})
      }
    };

  } catch {
    return structuredClone(defaults);
  }
}


// ======================================================
// SALVAR CONFIGURAÇÕES
// ======================================================

function saveSettings() {
  localStorage.setItem(
    "valeSombrioSettings",
    JSON.stringify(settings)
  );
}


// ======================================================
// TELA CHEIA
// ======================================================

function enterFullscreen() {

  if (!settings.fullscreen || document.fullscreenElement) return;

  const root = document.documentElement;

  if (root.requestFullscreen) {
    root.requestFullscreen().catch(() => {});
  }
}


// ======================================================
// TROCAR DE TELA
// ======================================================

function showScreen(name) {

  $$(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = $(`#screen-${name}`);

  if (target) {
    target.classList.add("active");
  }

  document.body.dataset.screen = name;

  if (name === "game") {
    Game.start();
  } else {
    Game.stop();
  }
}


// ======================================================
// NOTIFICAÇÃO
// ======================================================

function toast(message) {

  const element = $("#toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2200);
}


// ======================================================
// ATUALIZAR SWITCHES
// ======================================================

function updateSwitches() {

  $$("[data-switch]").forEach(sw => {

    const key = sw.dataset.switch;

    sw.classList.toggle(
      "on",
      !!settings[key]
    );

  });

  document.body.classList.toggle(
    "no-effects",
    !settings.effects
  );
}


// ======================================================
// SWITCHES
// ======================================================

function setupSwitches() {

  $$("[data-switch]").forEach(sw => {

    sw.addEventListener("click", async () => {

      const key = sw.dataset.switch;

      settings[key] = !settings[key];


      // ================================================
      // TELA CHEIA
      // ================================================

      if (
        key === "fullscreen" &&
        settings.fullscreen
      ) {

        try {

          await document.documentElement.requestFullscreen();

        } catch {

          settings.fullscreen = false;

          toast(
            "O navegador bloqueou a tela cheia."
          );
        }
      }


      // ================================================
      // SAIR DA TELA CHEIA
      // ================================================

      if (
        key === "fullscreen" &&
        !settings.fullscreen &&
        document.fullscreenElement
      ) {

        await document.exitFullscreen()
          .catch(() => {});

      }


      saveSettings();

      updateSwitches();

    });

  });
}


// ======================================================
// ABAS DAS CONFIGURAÇÕES
// ======================================================

function setupTabs() {

  $$(".tab").forEach(tab => {

    tab.addEventListener("click", () => {

      $$(".tab").forEach(t => {
        t.classList.remove("active");
      });

      $$(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
      });


      tab.classList.add("active");


      const panel = $(
        `#tab-${tab.dataset.tab}`
      );

      if (panel) {
        panel.classList.add("active");
      }

    });

  });
}


// ======================================================
// SLIDERS DE VOLUME
// ======================================================

function setupSliders() {

  $$(".slider-row").forEach(row => {

    const input = $("input", row);

    const value = $(".slider-val", row);

    const key = row.dataset.volume;


    if (!input || !value) return;


    // Valor salvo

    input.value = settings.volume[key];

    value.textContent = input.value;


    // Alterar volume

    input.addEventListener("input", () => {

      settings.volume[key] =
        Number(input.value);

      value.textContent =
        input.value;

      saveSettings();

    });

  });
}


// ======================================================
// MOSTRAR NOME DA TECLA
// ======================================================

function prettyKey(key) {

  if (key === " ") {
    return "Espaço";
  }

  if (key === "shift") {
    return "Shift";
  }

  if (key === "tab") {
    return "Tab";
  }

  if (key === "escape") {
    return "Esc";
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return (
    key.charAt(0).toUpperCase() +
    key.slice(1)
  );
}


// ======================================================
// CONFIGURAÇÃO DE TECLAS
// ======================================================

function setupKeybinds() {

  $$("[data-key]").forEach(chip => {

    const action = chip.dataset.key;


    // Mostrar tecla salva

    chip.textContent =
      prettyKey(settings.keys[action]);


    // Clique para alterar

    chip.addEventListener("click", () => {

      // Cancelar outro botão

      if (listeningKey) {

        listeningKey.classList.remove(
          "listening"
        );
      }


      listeningKey = chip;

      chip.classList.add("listening");

      chip.textContent = "...";


      const label =
        chip.parentElement.querySelector(
          ".opt-label"
        );


      toast(
        "Pressione uma tecla para " +
        label.textContent
      );

    });

  });


  // Escutar teclado

  window.addEventListener(
    "keydown",
    event => {

      if (!listeningKey) return;


      event.preventDefault();


      const action =
        listeningKey.dataset.key;


      let key =
        event.key.toLowerCase();


      // Espaço

      if (key === " ") {
        key = " ";
      }


      // Salvar tecla

      settings.keys[action] = key;


      listeningKey.textContent =
        prettyKey(key);


      listeningKey.classList.remove(
        "listening"
      );


      listeningKey = null;


      saveSettings();


      toast(
        "Tecla configurada com sucesso!"
      );

    }
  );
}


// ======================================================
// NAVEGAÇÃO
// ======================================================

function setupNavigation() {


  // ================================================
  // BOTÕES DATA-GOTO
  // ================================================

  $$("[data-goto]").forEach(button => {

    button.addEventListener("click", () => {

      const target =
        button.dataset.goto;

      showScreen(target);

    });

  });


  // ================================================
  // AÇÕES
  // ================================================

  $$("[data-action]").forEach(button => {

    button.addEventListener("click", () => {

      const action =
        button.dataset.action;


      // ==============================================
      // INICIAR JOGO
      // ==============================================

      if (action === "start") {

        // O navegador só aceita tela cheia logo após um clique, então ela é pedida aqui,
        // antes da tela de carregamento (e só se a opção "Tela cheia" estiver ligada).
        enterFullscreen();

        runLoading({
          label: "Entrando na Floresta do Véu",
          minTime: 1900
        }).then(() => {

          showScreen("game");

          toast(
            "A aventura começou!"
          );

        });

      }


      // ==============================================
      // EXTRAS
      // ==============================================

      if (action === "extras") {

        showScreen("extras");

      }


      // ==============================================
      // EXPLORAR
      // ==============================================

      if (action === "demo") {

        toast(
          "Próxima etapa: mapa, personagem e inimigos."
        );

      }


      // ==============================================
      // SAIR
      // ==============================================

      if (action === "quit") {

        toast(
          "Para sair, feche a aba ou a janela do jogo."
        );

      }

    });

  });
}


// ======================================================
// IDIOMA
// ======================================================

const languageSelect =
  $("#language");


if (languageSelect) {

  languageSelect.addEventListener(
    "change",
    event => {

      settings.language =
        event.target.value;


      saveSettings();


      toast(
        "Idioma salvo."
      );

    }
  );

}


// ======================================================
// EFEITO DE TECLADO NO MENU
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    // ESC volta ao menu

    if (
      event.key === "Escape" &&
      !$("#screen-main").classList.contains("active")
    ) {

      showScreen("main");

      listeningKey = null;

      $$(".keychip").forEach(chip => {
        chip.classList.remove("listening");
      });

    }

  }
);


// ======================================================
// IMAGENS DO JOGO (pré-carregamento)
// ======================================================

const ASSETS = {
  andar:    "assets/andar.png",     // folha de sprites: andar (lado, costas, frente)
  atac:     "assets/atac.png",      // folha de sprites: ataque (lado, costas, frente)
  floresta: "assets/floresta.jpg",  // fundo da Floresta do Véu
  vila:     "assets/vila.jpg",      // fundo do menu
  capa:     "assets/capa.jpg",      // tela de carregamento
  retrato:  "assets/retrato.png"    // retrato do HUD
};

const images = {};

function preloadAssets(onProgress) {

  const entries = Object.entries(ASSETS);

  let done = 0;

  return Promise.all(
    entries.map(([name, src]) =>
      new Promise(resolve => {

        const img = new Image();

        const finish = () => {
          done++;
          onProgress(done / entries.length);
          resolve();
        };

        img.onload = finish;

        img.onerror = () => {
          console.warn("Imagem não encontrada:", src);
          finish();
        };

        img.src = src;

        images[name] = img;
      })
    )
  );
}


// ======================================================
// TELA DE CARREGAMENTO
// ======================================================

const loadingEl = $("#loading");

let tipTimer = null;

function loadingTips() {

  return [
    `Segure ${prettyKey(settings.keys.dash)} para dar um dash e escapar do perigo.`,
    `Ataque com ${prettyKey(settings.keys.attack)}: cada direção tem o seu golpe.`,
    "Trinta relíquias esquecidas dormem na escuridão do vale.",
    "A névoa da Floresta do Véu esconde mais do que parece.",
    `Pule com ${prettyKey(settings.keys.jump)} para atravessar o terreno acidentado.`,
    "Toda lenda começa com alguém disposto a entrar na escuridão."
  ];
}

function startTips() {

  const tips = loadingTips();

  const tipEl = $("#loading-tip");

  let i = Math.floor(Math.random() * tips.length);

  tipEl.textContent = tips[i];

  clearInterval(tipTimer);

  tipTimer = setInterval(() => {

    tipEl.classList.add("fade");

    setTimeout(() => {
      i = (i + 1) % tips.length;
      tipEl.textContent = tips[i];
      tipEl.classList.remove("fade");
    }, 400);

  }, 3200);
}

// Mostra a tela de carregamento. A barra acompanha o progresso real da
// tarefa (task) e nunca fica menos que minTime ms na tela.
function runLoading({ label = "Carregando", minTime = 1800, task = null } = {}) {

  return new Promise(resolve => {

    const track = $("#loading-track");

    const percentEl = $("#loading-percent");

    $("#loading-label").textContent = label;

    startTips();

    track.style.setProperty("--p", 0);

    percentEl.textContent = "0%";

    loadingEl.classList.add("show");

    let real = task ? 0 : 1;

    let shown = 0;

    const begin = performance.now();

    if (task) {
      task(p => { real = p; }).then(() => { real = 1; });
    }

    function frame(now) {

      const time = Math.min(1, (now - begin) / minTime);

      const target = Math.min(real, time);

      shown += (target - shown) * 0.14;

      track.style.setProperty("--p", shown.toFixed(4));

      percentEl.textContent = Math.round(shown * 100) + "%";

      if (real >= 1 && time >= 1 && shown > 0.995) {

        track.style.setProperty("--p", 1);

        percentEl.textContent = "100%";

        setTimeout(() => {

          loadingEl.classList.remove("show");

          clearInterval(tipTimer);

          setTimeout(resolve, 650);

        }, 350);

        return;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}


// ======================================================
// VALE SOMBRIO — RPG 2D DE PLATAFORMAS
// ======================================================
const Game = (() => {
  const W = 960, H = 540, WORLD = 4200, GRAVITY = 1750;
  let canvas, ctx, running = false, raf = 0, last = 0, camera = 0, clock = 0, scale = 1;
  const pressed = new Set();

  // Faz o canvas ocupar o máximo da área disponível mantendo a proporção 16:9 (sobram
  // faixas pretas só se a janela não for 16:9). A resolução interna cresce junto com a
  // tela (até 2x) para o desenho não ficar borrado em tela cheia. O jogo continua usando
  // as coordenadas de 960 x 540; o draw() aplica a escala.
  function fit() {
    if (!canvas) return;
    const box = canvas.parentElement;
    const aw = box.clientWidth, ah = box.clientHeight;
    if (!aw || !ah) return;                        // a tela do jogo está escondida
    const s = Math.min(aw / W, ah / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    const k = Math.min(2, Math.max(1, s * (window.devicePixelRatio || 1)));
    const cw = Math.round(W * k), ch = Math.round(H * k);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    scale = cw / W;
  }
  let hero, enemies, coins, relics, particles, boss, won = false, mapOpen = false, spellEffects = [];
  let mouseAim = null;
  const platforms = [
    {x:0,y:470,w:530,h:90},{x:600,y:425,w:180,h:24},{x:850,y:380,w:170,h:24},
    {x:1090,y:440,w:340,h:100},{x:1480,y:395,w:180,h:24},{x:1730,y:345,w:170,h:24},
    {x:1980,y:440,w:360,h:100},{x:2390,y:390,w:170,h:24},{x:2640,y:340,w:180,h:24},
    {x:2900,y:430,w:340,h:100},{x:3290,y:390,w:180,h:24},{x:3550,y:440,w:650,h:100}
  ];
  const key = a => pressed.has(String(settings.keys[a] || '').toLowerCase());

  // ---- Folhas de sprites do herói ------------------------------------------
  // cols/rows: grade da folha. scale: tamanho na tela. ax/ay: ponto do QUADRO que fica
  // sobre o herói (ax = centro do corpo, ay = sola dos pés), medido em pixels da imagem.
  // Os dois usam o mesmo ponto de apoio e quase a mesma escala, então a troca
  // andar <-> atacar não dá "pulo" nem muda o tamanho do personagem.
  const SPRITE = {
    walk:   { cols: 8, rows: 3, scale: .405, ax: 64,  ay: 144 },  // 122 x 154 px por quadro
    attack: { cols: 9, rows: 3, scale: .425, ax: 116, ay: 175 }   // 250 x 185 px por quadro
  };
  const ATTACK_TIME = .36;      // duração da animação de ataque (segundos)
  const ATTACK_FRAMES = 8;      // a linha lateral tem 8 quadros; a 9ª coluna da folha é vazia
  const ready = img => !!(img && img.complete && img.naturalWidth);

  // Desenha um quadro da folha com os pés no chão, virado para onde o herói olha.
  function drawSprite(img, spec, col, row) {
    const fw = img.naturalWidth / spec.cols, fh = img.naturalHeight / spec.rows;
    ctx.save();
    ctx.translate(hero.x + hero.w / 2, hero.y + hero.h);
    if (hero.face < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, col * fw, row * fh, fw, fh,
      -spec.ax * spec.scale, -spec.ay * spec.scale, fw * spec.scale, fh * spec.scale);
    ctx.restore();
  }

  function reset() {
    hero={x:80,y:380,vx:0,vy:0,w:30,h:48,face:1,hp:100,maxHp:100,soul:0,maxSoul:100,ground:false,attack:0,attackCd:0,spellCd:0,spell:0,dash:0,dashCd:0,invuln:0,coins:0,relics:0};
    enemies=[{x:390,y:420,w:34,h:40,hp:3,max:3,alive:true,range:80,base:390},{x:950,y:330,w:34,h:40,hp:3,max:3,alive:true,range:70,base:950},{x:1280,y:390,w:38,h:46,hp:4,max:4,alive:true,range:90,base:1280},{x:1850,y:295,w:36,h:42,hp:3,max:3,alive:true,range:70,base:1850},{x:2160,y:390,w:42,h:48,hp:4,max:4,alive:true,range:100,base:2160},{x:3060,y:380,w:40,h:46,hp:4,max:4,alive:true,range:90,base:3060}];
    coins=[260,330,680,910,1190,1260,1530,1780,2070,2240,2460,2700,2990,3120,3370,3670].map((x,i)=>({x,y:[425,405,380,335,395,390,355,300,390,390,350,295,380,375,350,390][i],got:false}));
    relics=[{x:1020,y:330,got:false},{x:2250,y:380,got:false},{x:3420,y:340,got:false}];
    particles=[]; spellEffects=[]; boss={x:3860,y:365,w:90,h:100,hp:18,max:18,alive:true,attack:0,hit:0}; camera=0;clock=0;won=false;mapOpen=false;updateHud();
  }
  function init(){canvas=$('#game-canvas');if(!canvas)return;ctx=canvas.getContext('2d');canvas.width=W;canvas.height=H;window.addEventListener('resize',fit);window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',()=>pressed.clear());canvas.addEventListener('pointerdown',mouseDown);canvas.addEventListener('contextmenu',e=>e.preventDefault());reset();}
  function down(e){if(!running||listeningKey)return;const k=e.key.toLowerCase();pressed.add(k);const binds=Object.values(settings.keys).map(x=>String(x).toLowerCase());if(binds.includes(k)||['arrowleft','arrowright','arrowup',' ','escape'].includes(k))e.preventDefault();if(e.repeat)return;if(k===String(settings.keys.attack).toLowerCase())attack();if(k===String(settings.keys.jump).toLowerCase()||k==='arrowup'){if(hero.ground){hero.vy=-650;hero.ground=false;}}if(k===String(settings.keys.dash).toLowerCase())dash();if(k===String(settings.keys.map).toLowerCase()){mapOpen=!mapOpen;}}
  function up(e){pressed.delete(e.key.toLowerCase());}
  function mouseDown(e){if(!running||won)return;const rect=canvas.getBoundingClientRect();const mx=(e.clientX-rect.left)*W/rect.width+camera;mouseAim=mx;if(e.button===0){hero.face=mx>=hero.x+hero.w/2?1:-1;attack();}else if(e.button===2){e.preventDefault();castSpell();}}
  function gainSoul(amount){hero.soul=Math.min(hero.maxSoul,hero.soul+amount);updateHud();}
  function castSpell(){if(hero.spellCd>0||hero.soul<33||won)return;hero.soul-=33;hero.spellCd=.65;hero.spell=.32;const sx=hero.x+hero.w/2+hero.face*34, sy=hero.y+hero.h/2;spellEffects.push({x:sx,y:sy,dir:hero.face,life:.34});burst(sx+hero.face*25,sy,'#8be9ff',18);for(const en of enemies){if(en.alive&&Math.abs(en.x+en.w/2-sx)<125&&Math.abs(en.y+en.h/2-sy)<85){en.hp-=2;burst(en.x+en.w/2,en.y+en.h/2,'#8be9ff',12);if(en.hp<=0){en.alive=false;hero.coins+=3;gainSoul(8);}}}if(boss.alive&&Math.abs(boss.x+45-sx)<145&&Math.abs(boss.y+50-sy)<110){boss.hp-=2;boss.hit=.2;burst(boss.x+45,boss.y+50,'#8be9ff',18);if(boss.hp<=0){boss.alive=false;won=true;toast('O Guardião caiu! Vale Sombrio foi libertado.');}}updateHud();}
  function attack(){if(hero.attackCd>0||won)return;hero.attack=ATTACK_TIME;hero.attackCd=.42;let hx=hero.x+(hero.face>0?hero.w:-44);for(const en of enemies){if(en.alive&&Math.abs((en.x+en.w/2)-(hx+22))<62&&Math.abs(en.y-hero.y)<68){en.hp--;gainSoul(12);burst(en.x+en.w/2,en.y,'#c8f4ff',10);if(en.hp<=0){en.alive=false;hero.coins+=3;gainSoul(8);}}}if(boss.alive&&Math.abs((boss.x+boss.w/2)-(hero.x+hero.w/2+hero.face*65))<92&&Math.abs(boss.y-hero.y)<95){boss.hp--;gainSoul(10);boss.hit=.2;burst(boss.x+boss.w/2,boss.y,'#f5c46b',12);if(boss.hp<=0){boss.alive=false;won=true;toast('O Guardião caiu! Vale Sombrio foi libertado.');}}updateHud();}
  function dash(){if(hero.dashCd>0||won)return;hero.dash=.16;hero.dashCd=.8;hero.vx=hero.face*720;hero.vy=Math.min(hero.vy,30);for(let i=0;i<7;i++)burst(hero.x,hero.y+20,'#a9d8e8',1);}
  function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*190,vy:(Math.random()-.8)*190,life:.3+Math.random()*.35,color});}
  function updateHud(){const life=$('#hud-life'),fill=$('#hud-life-fill'),coinsEl=$('#hud-coins'),rel=$('#hud-relics');if(life)life.textContent=`${hero.hp} / ${hero.maxHp}`;if(fill)fill.style.width=`${hero.hp/hero.maxHp*100}%`;if(coinsEl)coinsEl.textContent=hero.coins;if(rel)rel.textContent=`${hero.relics} / 3`;const loc=document.querySelector('.hud-left strong');if(loc)loc.textContent=hero.x>3500?'Portão do Guardião':hero.x>2700?'Ruínas Afundadas':hero.x>1900?'Pântano das Almas':hero.x>1000?'Trilha das Cinzas':'Floresta do Véu';}
  function update(dt){clock+=dt;hero.attackCd=Math.max(0,hero.attackCd-dt);hero.attack=Math.max(0,hero.attack-dt);hero.spellCd=Math.max(0,hero.spellCd-dt);hero.spell=Math.max(0,hero.spell-dt);hero.dashCd=Math.max(0,hero.dashCd-dt);hero.invuln=Math.max(0,hero.invuln-dt);if(!won){let dir=(key('right')||pressed.has('arrowright')?1:0)-(key('left')||pressed.has('arrowleft')?1:0);if(hero.dash<=0){hero.vx=dir*245;if(dir)hero.face=dir;}else hero.dash=Math.max(0,hero.dash-dt);if((key('jump')||pressed.has('arrowup'))&&hero.ground){hero.vy=-650;hero.ground=false;}hero.vy=Math.min(1000,hero.vy+GRAVITY*dt);let oldY=hero.y;hero.x=Math.max(0,Math.min(WORLD-hero.w,hero.x+hero.vx*dt));hero.y+=hero.vy*dt;hero.ground=false;for(const p of platforms){if(hero.vy>=0&&oldY+hero.h<=p.y+4&&hero.y+hero.h>=p.y&&hero.x+hero.w>p.x&&hero.x<p.x+p.w){hero.y=p.y-hero.h;hero.vy=0;hero.ground=true;}}if(hero.y>H+500){hero.hp-=15;hero.x=Math.max(20,hero.x-160);hero.y=250;hero.vy=0;hero.invuln=1;}
      coins.forEach(c=>{if(!c.got&&Math.abs(hero.x+15-c.x)<27&&Math.abs(hero.y+24-c.y)<40){c.got=true;hero.coins++;burst(c.x,c.y,'#ffd86a',7);updateHud();}});relics.forEach(r=>{if(!r.got&&Math.abs(hero.x+15-r.x)<35&&Math.abs(hero.y+24-r.y)<45){r.got=true;hero.relics++;hero.hp=Math.min(hero.maxHp,hero.hp+15);toast('Relíquia antiga encontrada! +vida');updateHud();}});
      for(const en of enemies){if(!en.alive)continue;en.x=en.base+Math.sin(clock*1.5+en.base)*en.range;if(hero.invuln<=0&&Math.abs(hero.x+15-(en.x+en.w/2))<30&&Math.abs(hero.y+25-(en.y+20))<35){hero.hp-=10;hero.invuln=.8;hero.vx=-hero.face*220;updateHud();if(hero.hp<=0){hero.hp=100;hero.coins=Math.max(0,hero.coins-5);hero.x=80;hero.y=350;toast('Você caiu nas sombras. Voltou ao início.');updateHud();}}}
      if(boss.alive){boss.hit=Math.max(0,boss.hit-dt);boss.x=3790+Math.sin(clock*.8)*100;if(hero.invuln<=0&&Math.abs(hero.x+15-(boss.x+45))<65&&Math.abs(hero.y+24-(boss.y+50))<70){hero.hp-=18;hero.invuln=1;hero.vx=-hero.face*320;updateHud();if(hero.hp<=0){hero.hp=100;hero.x=3500;hero.y=350;toast('O guardião te expulsou. Tente novamente!');updateHud();}}}}
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);spellEffects.forEach(p=>p.life-=dt);spellEffects=spellEffects.filter(p=>p.life>0);camera=Math.max(0,Math.min(WORLD-W,hero.x-W*.36));}
  function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function draw(){ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,W,H);
    // Fundo ilustrado da Floresta do Véu: camadas com paralaxe e névoa, usando o asset original.
    const forest=images.floresta;
    if(forest && forest.complete && forest.naturalWidth){
      const tileW=740, scale=H/forest.naturalHeight, drawW=forest.naturalWidth*scale;
      ctx.fillStyle='#07101d';ctx.fillRect(0,0,W,H);
      for(let layer=0;layer<3;layer++){
        const factor=[.10,.20,.32][layer], alpha=[.88,.68,.42][layer];
        const w=drawW*(layer===0?1.15:1.0), h=H*(layer===0?1.08:1.0);
        let offset=-((camera*factor)%w);
        ctx.globalAlpha=alpha;
        for(let x=offset-w;x<W+w;x+=w)ctx.drawImage(forest,x,0,w,h);
      }
      ctx.globalAlpha=1;
      const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(3,8,22,.12)');shade.addColorStop(.72,'rgba(4,9,17,.08)');shade.addColorStop(1,'rgba(1,4,8,.72)');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    }else{let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#090f20');sky.addColorStop(.65,'#172536');sky.addColorStop(1,'#080d14');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);}
    // Lua pálida e névoa em movimento para reforçar o clima gótico.
    ctx.fillStyle='rgba(202,225,236,.52)';ctx.beginPath();ctx.arc(760-camera*.025,92,27,0,Math.PI*2);ctx.fill();
    for(let i=0;i<7;i++){ctx.fillStyle=`rgba(160,195,207,${.035+Math.sin(clock*.6+i)*.018})`;ctx.beginPath();ctx.ellipse(((i*230-clock*10-camera*.22)%1250+1250)%1250-100,410+i*17,190,18,0,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(-camera,0);
    platforms.forEach((p,i)=>{ctx.fillStyle='#10191c';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#3c5b55';ctx.fillRect(p.x,p.y,p.w,6);ctx.fillStyle='#233b37';for(let x=p.x+8;x<p.x+p.w;x+=35)ctx.fillRect(x,p.y+10,18,3);if(p.h>50){ctx.fillStyle='#080e12';ctx.fillRect(p.x,p.y+18,p.w,p.h-18);}});
    coins.forEach(c=>{if(c.got)return;ctx.fillStyle='#ffda72';ctx.beginPath();ctx.arc(c.x,c.y+Math.sin(clock*4+c.x)*3,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff0b0';ctx.stroke();});
    relics.forEach(r=>{if(r.got)return;ctx.save();ctx.translate(r.x,r.y+Math.sin(clock*2+r.x)*4);ctx.rotate(Math.PI/4);ctx.fillStyle='#8ad9ef';ctx.fillRect(-9,-9,18,18);ctx.strokeStyle='#d7faff';ctx.strokeRect(-9,-9,18,18);ctx.restore();});
    enemies.forEach(en=>{if(!en.alive)return;ctx.fillStyle='#070a0d';ctx.beginPath();ctx.ellipse(en.x+en.w/2,en.y+en.h-2,en.w*.65,7,0,0,Math.PI*2);ctx.fill();rounded(en.x,en.y+8,en.w,en.h-8,10,'#26323c');rounded(en.x+5,en.y,en.w-10,22,8,'#465c65');ctx.fillStyle='#e7bd78';ctx.fillRect(en.x+8,en.y+14,5,4);ctx.fillRect(en.x+en.w-13,en.y+14,5,4);ctx.fillStyle='#0a1118';ctx.fillRect(en.x+5,en.y+en.h-2,8,8);ctx.fillRect(en.x+en.w-13,en.y+en.h-2,8,8);ctx.fillStyle='#080b10';ctx.fillRect(en.x,en.y-8,en.w,4);ctx.fillStyle='#b85c61';ctx.fillRect(en.x,en.y-8,en.w*(en.hp/en.max),4);});
    if(boss.alive){ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(boss.x+45,boss.y+boss.h,58,12,0,0,Math.PI*2);ctx.fill();rounded(boss.x+12,boss.y+24,66,74,18,boss.hit?'#f0d5a0':'#202a36');rounded(boss.x+2,boss.y+8,86,42,14,'#394b5a');ctx.fillStyle='#0a1019';ctx.beginPath();ctx.moveTo(boss.x+5,boss.y+22);ctx.lineTo(boss.x-13,boss.y-4);ctx.lineTo(boss.x+25,boss.y+13);ctx.fill();ctx.beginPath();ctx.moveTo(boss.x+85,boss.y+22);ctx.lineTo(boss.x+103,boss.y-4);ctx.lineTo(boss.x+65,boss.y+13);ctx.fill();ctx.fillStyle='#ff626e';ctx.fillRect(boss.x+22,boss.y+25,12,6);ctx.fillRect(boss.x+56,boss.y+25,12,6);ctx.fillStyle='#080b10';ctx.fillRect(boss.x,boss.y-22,90,7);ctx.fillStyle='#c74755';ctx.fillRect(boss.x,boss.y-22,90*boss.hp/boss.max,7);}
    // Personagem: folhas andar.png e atac.png, sempre com os pés no chão (veja SPRITE).
    let blink=hero.invuln>0&&Math.floor(clock*18)%2===0;
    if(!blink){
      const x=hero.x-11,y=hero.y-10;
      ctx.fillStyle='rgba(0,0,0,.42)';ctx.beginPath();ctx.ellipse(hero.x+15,hero.y+hero.h,22,6,0,0,Math.PI*2);ctx.fill();
      const walking=Math.abs(hero.vx)>25 && hero.ground && hero.dash<=0;
      if(hero.attack>0 && ready(images.atac)){
        // Linha 0 = visão lateral. O progresso do golpe (0 a 1) percorre os 8 quadros em ordem.
        const progress=1-hero.attack/ATTACK_TIME;
        const f=Math.min(ATTACK_FRAMES-1,Math.max(0,Math.floor(progress*ATTACK_FRAMES)));
        drawSprite(images.atac,SPRITE.attack,f,0);
      }else if(ready(images.andar)){
        // Linha 1: lateral; o espelhamento (face) mantém a direção.
        const f=walking?Math.floor(clock*12)%8:Math.floor(clock*2)%8;
        drawSprite(images.andar,SPRITE.walk,f,0);
      }else{
        rounded(x+4,y+15,22,27,7,'#b9c8cb');ctx.fillStyle='#e3e9e5';ctx.beginPath();ctx.arc(x+15,y+13,13,0,Math.PI*2);ctx.fill();
      }
      if(hero.dash>0){ctx.fillStyle='rgba(174,226,244,.24)';ctx.fillRect(x-20,y+8,25,34);}
    }
    spellEffects.forEach(p=>{const a=Math.max(0,p.life/.34);ctx.save();ctx.globalAlpha=a;const sx=p.x,sy=p.y;const grad=ctx.createRadialGradient(sx,sy,4,sx,sy,68);grad.addColorStop(0,'rgba(220,255,255,.95)');grad.addColorStop(.35,'rgba(82,211,255,.72)');grad.addColorStop(1,'rgba(80,90,255,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(sx,sy,68*(1-a*.18),0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c8f8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,42*(1-a*.25),0,Math.PI*2);ctx.stroke();ctx.restore();});
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;});ctx.restore();
    // interface de objetivo e progresso
    ctx.fillStyle='rgba(3,8,13,.72)';ctx.fillRect(16,16,260,46);ctx.strokeStyle='rgba(177,210,215,.35)';ctx.strokeRect(16,16,260,46);ctx.fillStyle='#d8e7e8';ctx.font='15px Cinzel,serif';ctx.fillText(boss.alive?'ENCONTRE O GUARDIÃO':'VALE SOMBRIO LIBERTADO',28,36);ctx.fillStyle='#9db5ba';ctx.font='12px sans-serif';ctx.fillText(`Exploração: ${Math.floor(hero.x/WORLD*100)}%  •  Relíquias ${hero.relics}/3`,28,52);ctx.fillStyle='rgba(3,8,13,.78)';ctx.fillRect(16,70,190,30);ctx.strokeStyle='rgba(139,233,255,.55)';ctx.strokeRect(16,70,190,30);ctx.fillStyle='#263d50';ctx.fillRect(25,80,150,9);ctx.fillStyle='#70dcff';ctx.fillRect(25,80,150*hero.soul/hero.maxSoul,9);ctx.fillStyle='#e0faff';ctx.font='12px sans-serif';ctx.fillText(`✦ ALMA ${hero.soul}/${hero.maxSoul}`,25,76);ctx.fillStyle='#c5d6dc';ctx.fillText('Clique esquerdo: espada  •  direito: magia',220,88);
    if(mapOpen){ctx.fillStyle='rgba(3,7,12,.88)';ctx.fillRect(250,175,460,130);ctx.strokeStyle='#7d9da4';ctx.strokeRect(250,175,460,130);ctx.fillStyle='#e2eff0';ctx.font='20px Cinzel,serif';ctx.fillText('MAPA DO REINO',390,208);ctx.fillStyle='#4b686c';ctx.fillRect(280,238,400,8);ctx.fillStyle='#d6c37a';ctx.beginPath();ctx.arc(280+400*hero.x/WORLD,242,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c76d76';ctx.fillRect(280+400*3860/WORLD-4,232,8,20);ctx.font='13px sans-serif';ctx.fillStyle='#c1d2d5';ctx.fillText('● Você     ▮ Guardião',390,276);}
    if(won){ctx.fillStyle='rgba(2,5,10,.78)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e8d39b';ctx.font='bold 38px Cinzel,serif';ctx.fillText('O VALE ESTÁ LIVRE',W/2,H/2-20);ctx.fillStyle='#d8e7e8';ctx.font='18px sans-serif';ctx.fillText(`Você reuniu ${hero.relics} relíquias e ${hero.coins} moedas`,W/2,H/2+20);ctx.fillText('Volte ao menu para iniciar outra jornada',W/2,H/2+50);ctx.textAlign='left';}
  }
  function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;update(dt);draw();raf=requestAnimationFrame(loop);}
  function start(){if(!canvas||running)return;fit();reset();pressed.clear();running=true;last=performance.now();const hint=$('#game-hint');if(hint){hint.textContent=`${prettyKey(settings.keys.left)}/${prettyKey(settings.keys.right)} mover · ${prettyKey(settings.keys.jump)} pular · clique esquerdo atacar · clique direito magia (33 alma) · ${prettyKey(settings.keys.attack)} atacar · ${prettyKey(settings.keys.dash)} dash · ${prettyKey(settings.keys.map)} mapa · ESC menu`;hint.classList.remove('faded');}raf=requestAnimationFrame(loop);}
  function stop(){running=false;cancelAnimationFrame(raf);pressed.clear();}
  return {init,start,stop};
})();

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

function init() {

  // Aplicar idioma

  if (languageSelect) {
    languageSelect.value =
      settings.language;
  }


  // Atualizar visual

  updateSwitches();


  // Configurações

  setupSwitches();

  setupTabs();

  setupSliders();

  setupKeybinds();

  setupNavigation();

}


function boot() {

  // Tela de carregamento inicial: acompanha o download das imagens de verdade
  runLoading({
    label: "Carregando",
    minTime: 2600,
    task: preloadAssets
  }).then(() => {
    Game.init();
  });
}


// ======================================================
// INICIAR
// ======================================================

init();

boot();