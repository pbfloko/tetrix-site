/* ============================================================================
   TETRIX — MOTOR DA v2
   Uma copia so para o site inteiro: navegacao, revelacao, simulador e o motor
   de formularios. Antes cada pagina carregava ~450 linhas identicas inline;
   qualquer correcao precisava ser repetida nove vezes e foi assim que a
   consultoria ficou meses sem enviar e-mail.

   Como uma pagina liga um formulario:
     <form data-lead="origem_do_lead"> com, dentro dele:
       [data-role=banner] [data-role=campos] [data-role=btn] [data-role=ok]
       .fgroup[data-field=nome] envolvendo cada campo
   Nada mais. Sem ids unicos, sem configuracao por pagina.
   ============================================================================ */
(function () {
  'use strict';

  var CFG = {
    SUPABASE_URL:      'https://zgiunavniyxsqjqmzplt.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_3OM-2GzMhA21hd87C8op1g_6dVzEg4E',
    EMAILJS_PUBLIC:    '3RMl5t0U5HtR6bw5-',
    EMAILJS_SERVICE:   'service_xz0lz79',
    EMAILJS_TEMPLATE:  'template_3yemdd8',
    WPP:               '5511992353669'
  };

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.dataLayer = window.dataLayer || [];

  /* ================================================ COMPATIBILIDADE ======
     A agencia de marketing montou os gatilhos do GTM em cima dos nomes de
     evento do site ANTERIOR, que eram prefixados por pagina:
       index      -> home_form_submit, home_whatsapp_click, home_scroll, ...
       contato    -> lead_form_submit, lead_form_erro
       consultoria-> lead_form_submit, lead_form_erro
     A v2 padronizou para form_submit / whatsapp_click / cta_click. Se so o
     nome novo fosse disparado, todo gatilho ja configurado pararia de
     funcionar no dia da virada — sem erro visivel, so parando de contar.

     Entao cada pagina declara <body data-legado="home|lead"> e o track()
     empurra os DOIS nomes: o novo, para o que for configurado daqui pra
     frente, e o legado, para nao quebrar o que ja existe. Quando a agencia
     migrar os gatilhos, basta remover o atributo data-legado das paginas.
     ====================================================================== */
  var LEGADO = (document.body && document.body.getAttribute('data-legado')) || '';
  var ALIAS_HOME = {
    form_start: 1, form_submit: 1, form_erro: 1, form_erro_validacao: 1,
    form_spam_bloqueado: 1, cta_click: 1, whatsapp_click: 1, menu_click: 1
  };

  function empurra(evento, extra) {
    window.dataLayer.push(Object.assign({ event: evento }, extra || {}));
  }
  function track(evento, extra) {
    empurra(evento, extra);
    if (LEGADO === 'home') {
      if (ALIAS_HOME[evento]) empurra('home_' + evento, extra);
      if (evento === 'scroll_marco') empurra('home_scroll', extra);
    } else if (LEGADO === 'lead') {
      if (evento === 'form_submit') empurra('lead_form_submit', extra);
      if (evento === 'form_erro') empurra('lead_form_erro', extra);
    }
  }
  window.TetrixTrack = track;

  /* ====================================================== NAVEGACAO ======= */
  var nav = $('.nav');
  if (nav) {
    var marcaScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', marcaScroll, { passive: true });
    marcaScroll();
  }
  var burger = $('.burger'), menu = $('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var aberto = menu.classList.toggle('open');
      burger.classList.toggle('open', aberto);
      burger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      document.body.style.overflow = aberto ? 'hidden' : '';
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ====================================================== REVELACAO =======
     Em aba de segundo plano o navegador nao pinta frames e a transicao nunca
     termina — sem a rede de seguranca abaixo o conteudo fica preso em
     opacity:0 e a pagina chega vazia para quem abriu em nova aba.          */
  function revelarTudo() {
    $$('.reveal').forEach(function (el) {
      el.classList.add('visible');
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: .12 });
    $$('.reveal').forEach(function (el) { obs.observe(el); });
    setTimeout(revelarTudo, 3000);
  } else {
    revelarTudo();
  }

  /* ============================================ ATRIBUICAO DE CAMPANHA ====
     Sem isto o Google Ads nao consegue casar o lead com o clique pago.     */
  var CAMPANHA = (function () {
    var p = new URLSearchParams(location.search), out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
     'gclid', 'gbraid', 'wbraid', 'fbclid'].forEach(function (k) {
      var v = p.get(k); if (v) out[k] = v;
    });
    return out;
  })();
  var campanhaTexto = Object.keys(CAMPANHA).map(function (k) { return k + '=' + CAMPANHA[k]; }).join(' | ');

  /* ======================================================== TELEFONE ====== */
  $$('[data-mask="tel"]').forEach(function (el) {
    el.addEventListener('input', function (e) {
      var v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10)     v = v.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, '($1) $2 $3-$4');
      else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      else if (v.length > 0) v = v.replace(/^(\d{0,2})/, '($1');
      e.target.value = v;
    });
  });

  /* ============================================================ SDKs ======
     Carregados so na primeira interacao com um formulario. Sao ~90 KB que
     nao fazem falta a quem apenas le a pagina.                             */
  var supabaseClient = null, emailjsOk = false, sdkPromise = null;

  function carregaScript(src) {
    return new Promise(function (ok, erro) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ok; s.onerror = function () { erro(new Error('falhou: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function carregaSDKs() {
    if (sdkPromise) return sdkPromise;
    sdkPromise = Promise.all([
      carregaScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2').catch(function (e) { console.error(e); }),
      carregaScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js').catch(function (e) { console.error(e); })
    ]).then(function () {
      try {
        if (window.supabase && window.supabase.createClient) {
          supabaseClient = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
        }
      } catch (e) { console.error('Supabase init:', e); }
      try {
        if (window.emailjs) { window.emailjs.init({ publicKey: CFG.EMAILJS_PUBLIC }); emailjsOk = true; }
      } catch (e) { console.error('EmailJS init:', e); }
    });
    return sdkPromise;
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function gatilho(e) {
      if (e.target.closest && (e.target.closest('form') || e.target.closest('.sim'))) {
        carregaSDKs();
        ['pointerdown', 'keydown', 'touchstart'].forEach(function (x) { document.removeEventListener(x, gatilho); });
      }
    }, { passive: true });
  });
  setTimeout(carregaSDKs, 6000);

  /* ======================================================= SIMULADOR ======
     Constantes iguais em toda a v2: home e pagina do simulador nunca podem
     devolver numeros diferentes para o mesmo galpao.                       */
  var FOLGA_TOPO = 0.55;
  var DENS = { CB: 0.21, PT: 0.29, TR: 0.33 };
  var DENS_PISO_SEM_EMP = 0.40;
  var ALT_CARGA = 1.5;
  var GANHO_CAMADA = 0.70;   // cada camada extra empilhada em bloco rende ~70%

  var SIM = null;

  function folgaY3(a) { return Math.max(0.20, 0.10 * a, 0.15); }
  function calcNiveis(pd, a) {
    var passo = a + folgaY3(a) + 0.14;
    return Math.max(1, Math.floor((pd - FOLGA_TOPO) / passo));
  }
  function capacidadeHoje(area, camadas) {
    if (camadas === 1) return Math.round(area * DENS_PISO_SEM_EMP);
    return Math.round(area * DENS_PISO_SEM_EMP * (1 + (camadas - 1) * GANHO_CAMADA));
  }
  function faixaArea(m2) {
    if (m2 <= 500)  return 'Até 500 m²';
    if (m2 <= 1000) return '501 a 1.000 m²';
    if (m2 <= 3000) return '1.001 a 3.000 m²';
    return 'Acima de 3.000 m²';
  }
  function anima(el, alvo) {
    if (!el) return;
    var final = Math.round(alvo).toLocaleString('pt-BR');
    if (semMovimento || document.hidden) { el.textContent = final; return; }
    var dur = 620, ini = performance.now();
    (function passo(now) {
      var p = Math.min((now - ini) / dur, 1);
      el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(passo);
    })(performance.now());
    setTimeout(function () { el.textContent = final; }, dur + 120);
  }

  var sim = $('[data-sim]');
  if (sim) {
    var campo = function (n) { return $('[data-sim-' + n + ']', sim); };
    var elArea = campo('area'), elPd = campo('pd'), elEmp = campo('emp'), elCam = campo('cam');
    var elPdVal = campo('pdval'), elPdNiv = campo('pdniveis');
    var elOut = campo('out'), elHoje = campo('hoje'), elNovo = campo('novo'), elGanho = campo('ganho'), elMsg = campo('msg');
    var elLead = campo('lead'), btnQuero = campo('quero'), btnGo = campo('go');
    var origem = sim.getAttribute('data-sim') || 'simulador';

    function atualizaPd() {
      var pd = parseFloat(elPd.value);
      if (elPdVal) elPdVal.textContent = pd.toFixed(1).replace('.', ',') + ' m';
      var n = calcNiveis(pd, ALT_CARGA);
      if (elPdNiv) elPdNiv.textContent = n === 1 ? '1 nível' : n + ' níveis';
    }
    if (elPd) { elPd.addEventListener('input', atualizaPd); atualizaPd(); }

    function aplicaSim() {
      if (!SIM) return;
      var resumo = SIM.novo.toLocaleString('pt-BR') + ' posições-palete · ' +
                   SIM.area.toLocaleString('pt-BR') + ' m² · pé-direito ' +
                   String(SIM.pd).replace('.', ',') + ' m · ' +
                   SIM.niveis + (SIM.niveis === 1 ? ' nível' : ' níveis');
      $$('[data-lead-simulacao]').forEach(function (i) { i.value = 'Simulação: ' + resumo; });
      $$('[data-lead-pe]').forEach(function (i) { i.value = String(SIM.pd); });
      $$('[data-lead-area]').forEach(function (i) { if (!i.value) i.value = faixaArea(SIM.area); });
      $$('[data-sim-chip]').forEach(function (c) {
        c.innerHTML = '<b>Sua simulação:</b> ' + resumo + '. Vamos conferir esse número no seu galpão.';
        c.classList.add('show');
      });
    }

    function simular() {
      var area = parseFloat(elArea.value) || 800;
      var pd   = parseFloat(elPd.value) || 10;
      var emp  = elEmp ? elEmp.value : 'CB';
      var cam  = elCam ? parseInt(elCam.value, 10) : 1;

      var niveis = calcNiveis(pd, ALT_CARGA);
      var novo   = Math.round(area * (DENS[emp] || DENS.CB) * niveis);
      var hoje   = capacidadeHoje(area, cam);
      var ganho  = novo - hoje;

      elOut.classList.add('show');
      anima(elHoje, hoje);
      anima(elNovo, novo);

      if (ganho > 0) {
        var pct = hoje > 0 ? Math.round(ganho / hoje * 100) : 0;
        if (elGanho) elGanho.textContent = '+' + ganho.toLocaleString('pt-BR');
        if (elMsg) elMsg.innerHTML = '<strong>São ' + ganho.toLocaleString('pt-BR') +
          ' posições a mais, ' + pct + '% de ganho</strong>, em ' + niveis +
          (niveis === 1 ? ' nível' : ' níveis') + '. Este número é uma estimativa — ' +
          'no projeto real entram pilares, sprinklers e o raio de giro da sua empilhadeira.';
      } else {
        if (elGanho) elGanho.textContent = '—';
        if (elMsg) elMsg.innerHTML = '<strong>Neste cenário a verticalização não amplia a capacidade.</strong> ' +
          'O ganho seria acesso direto a todos os paletes, controle FIFO e menos avaria. Vale falar com a engenharia.';
      }

      SIM = { area: area, pd: pd, emp: emp, cam: cam, niveis: niveis, novo: novo, hoje: hoje, ganho: ganho };
      aplicaSim();

      track(origem + '_uso', {
        sim_area: area, sim_pe_direito: pd, sim_empilhadeira: emp,
        sim_cenario_atual: cam, sim_niveis: niveis, sim_posicoes: novo, sim_ganho: ganho
      });
    }

    if (btnGo) btnGo.addEventListener('click', simular);
    [elArea, elEmp, elCam, elPd].forEach(function (el) {
      if (el) el.addEventListener('change', function () { if (SIM) simular(); });
    });

    if (btnQuero) {
      btnQuero.addEventListener('click', function () {
        elLead.classList.add('show');
        this.style.display = 'none';
        track(origem + '_cta', { sim_posicoes: SIM ? SIM.novo : 0 });
        var n = $('input[name=nome]', elLead);
        if (n) {
          n.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth', block: 'center' });
          if (window.innerWidth > 860) setTimeout(function () { n.focus({ preventScroll: true }); }, 400);
        }
      });
    }
  }

  /* =============================================== MOTOR DOS FORMULARIOS == */
  var ABERTO_EM = Date.now();
  var jaComecou = {};

  $$('form[data-lead]').forEach(function (form) {
    var origem  = form.getAttribute('data-lead');
    var banner  = $('[data-role=banner]', form);
    var campos  = $('[data-role=campos]', form);
    var btn     = $('[data-role=btn]', form);
    var ok      = $('[data-role=ok]', form);
    if (!btn || !campos || !ok) return;

    function erro(nome) {
      var g = $('.fgroup[data-field=' + nome + ']', form);
      if (g) g.classList.add('bad');
    }
    function limpar() {
      $$('.fgroup.bad', form).forEach(function (g) { g.classList.remove('bad'); });
      if (banner) banner.classList.remove('show');
    }
    function aviso(msg) {
      if (!banner) return;
      banner.textContent = msg;
      banner.classList.add('show');
      banner.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth', block: 'center' });
    }

    form.addEventListener('input', function () {
      if (!jaComecou[origem]) {
        jaComecou[origem] = true;
        track('form_start', { form_origem: origem });
        carregaSDKs();
      }
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      limpar();

      var d = new FormData(form);
      var v = function (k) { return (d.get(k) || '').toString().trim(); };
      var nome = v('nome'), tel = v('telefone'), empresa = v('empresa');
      var email = v('email'), cidade = v('cidade');
      var area = v('area'), obj = v('objetivo');
      var pe = v('pe_direito'), simulacao = v('simulacao');

      // Armadilha de robo: campo invisivel preenchido, ou envio rapido demais
      // para um humano ter digitado.
      if (v('site') !== '' || Date.now() - ABERTO_EM < 2500) {
        track('form_spam_bloqueado', { form_origem: origem });
        aviso('Aguarde um instante e clique de novo para enviar.');
        return;
      }

      var falhou = false;
      if (!nome) { erro('nome'); falhou = true; }
      if (tel.replace(/\D/g, '').length < 10) { erro('telefone'); falhou = true; }
      if ($('.fgroup[data-field=empresa]', form) && !empresa) { erro('empresa'); falhou = true; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { erro('email'); falhou = true; }
      if (falhou) {
        aviso('Confira os campos destacados.');
        track('form_erro_validacao', { form_origem: origem });
        return;
      }

      var rotulo = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      // A aba do WhatsApp precisa nascer AQUI, ainda dentro do clique. Chamar
      // window.open depois do envio (assincrono) faz o navegador tratar como
      // pop-up nao solicitado e bloquear — era o motivo de o WhatsApp nunca abrir.
      var janelaWpp = null;
      try { janelaWpp = window.open('', '_blank'); } catch (e) { janelaWpp = null; }

      var notas = ['[' + origem + ']', simulacao || null, campanhaTexto || null].filter(Boolean).join(' | ');

      var lead = {
        nome: nome, empresa: empresa || null, telefone: tel,
        email: email || null, cidade: cidade || null,
        tipo_interesse: obj || 'Nao informado',
        area_galpao: area || null,
        pe_direito: pe || null,
        mensagem: notas,
        origem: origem,
        user_agent: navigator.userAgent.substring(0, 500)
      };

      carregaSDKs().then(function () {
        var tarefas = [], okSupabase = false, okEmail = false;

        if (supabaseClient) {
          tarefas.push(
            supabaseClient.from('leads_contato').insert([lead]).then(function (r) {
              if (r.error) console.error('Supabase:', r.error); else okSupabase = true;
            }).catch(function (e) { console.error('Supabase:', e); })
          );
        }
        if (emailjsOk) {
          tarefas.push(
            window.emailjs.send(CFG.EMAILJS_SERVICE, CFG.EMAILJS_TEMPLATE, {
              nome: nome, empresa: empresa || 'Nao informado', telefone: tel,
              // {{email}} e o Reply-To do template. Uma string que nao seja
              // endereco valido faz o Outlook recusar com 412 e o envio inteiro
              // falha — por isso vazio, nunca "Nao informado".
              email: email || '',
              cidade: cidade || 'Nao informado',
              tipo_interesse: obj || 'Nao informado',
              area_galpao: area || 'Nao informado',
              pe_direito: pe || 'Nao informado',
              mensagem: 'Origem: ' + origem +
                        (simulacao ? '\n' + simulacao : '') +
                        (campanhaTexto ? '\n' + campanhaTexto : ''),
              data_envio: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            }).then(function () { okEmail = true; }).catch(function (e) { console.error('EmailJS:', e); })
          );
        }
        return Promise.all(tarefas).then(function () { return { okSupabase: okSupabase, okEmail: okEmail }; });
      }).then(function (r) {
        var urlWpp = 'https://wa.me/' + CFG.WPP + '?text=' + encodeURIComponent(
          'Olá! Solicitei diagnóstico pelo site.\n\nNome: ' + nome +
          (empresa ? '\nEmpresa: ' + empresa : '') +
          '\nWhatsApp: ' + tel +
          (cidade ? '\nCidade: ' + cidade : '') +
          '\nPreciso de: ' + (obj || 'orientação') +
          (simulacao ? '\n' + simulacao : ''));

        var btnOk = ok.querySelector('a[href*="wa.me"], a[href*="tintim.link"]');
        if (btnOk) btnOk.href = urlWpp;

        if (!r.okSupabase && !r.okEmail) {
          btn.disabled = false;
          btn.innerHTML = rotulo;
          aviso('Não conseguimos registrar seu contato agora. Clique no botão abaixo para falar direto no WhatsApp com os dados já preenchidos.');
          if (janelaWpp) janelaWpp.location.href = urlWpp; else location.href = urlWpp;
          track('form_erro', { form_origem: origem });
          return;
        }

        track('form_submit', {
          form_origem: origem,
          lead_objetivo: obj || 'nao_informado',
          lead_area: area || 'nao_informado',
          lead_simulou: simulacao ? 'sim' : 'nao'
        });
        track('generate_lead', { form_origem: origem, value: 1, currency: 'BRL' });

        btn.disabled = false;
        btn.innerHTML = rotulo;
        campos.style.display = 'none';
        ok.style.display = 'block';
        ok.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth', block: 'center' });

        if (janelaWpp) {
          janelaWpp.location.href = urlWpp;
          track('whatsapp_click', { wpp_origem: 'pos_formulario_' + origem });
        }
      }).catch(function (e) {
        // Nenhum caminho de erro pode deixar o botao preso em "Enviando...".
        console.error('Falha inesperada no envio:', e);
        if (janelaWpp) janelaWpp.close();
        btn.disabled = false;
        btn.innerHTML = rotulo;
        aviso('Não conseguimos enviar agora. Tente novamente ou fale pelo WhatsApp.');
        track('form_erro', { form_origem: origem, motivo: 'excecao' });
      });
    });
  });

  /* ========================================================== RASTREIO ==== */
  $$('[data-wpp]').forEach(function (a) {
    a.addEventListener('click', function () { track('whatsapp_click', { wpp_origem: a.dataset.wpp }); });
  });
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () { track('cta_click', { cta_origem: a.dataset.cta }); });
  });
  /* O site anterior contava clique de menu (home_menu_click). Sem isto o
     relatorio de navegacao da agencia zeraria na virada. */
  $$('.nav-links a, .menu a').forEach(function (a) {
    a.addEventListener('click', function () { track('menu_click', { menu_destino: a.getAttribute('href') }); });
  });

  var marcos = [25, 50, 75, 100], trava = false;
  window.addEventListener('scroll', function () {
    if (trava) return;
    trava = true;
    requestAnimationFrame(function () {
      var pct = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      while (marcos.length && pct >= marcos[0]) track('scroll_marco', { scroll_pct: marcos.shift() });
      trava = false;
    });
  }, { passive: true });

  $$('.js-ano').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
