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

        showScreen("game");

        toast(
          "A aventura começou!"
        );

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


// ======================================================
// INICIAR
// ======================================================

init();