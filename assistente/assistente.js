(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════
     1 · TEXTOS (tudo que o assistente "fala" fica aqui)
     ══════════════════════════════════════════════════════════════════ */
  const COPY = {
    greeting: 'Olá! Posso te ajudar a reservar uma sala?',
    placeholder: 'Ex.: sala para 6, amanhã às 14h',
    placeholderShort: 'Ex.: sala amanhã 14h',          // telas estreitas (até 600px)
    helpText: 'É só escrever do seu jeito que eu entendo. Por exemplo:',
    examples: [
      'Sala para 6 pessoas amanhã às 14h',
      'Toda segunda às 9h, por 1 hora',
      'Tem alguma sala livre agora?',
    ],
    thinking: 'Entendendo o seu pedido…',
    error: 'Não consegui processar agora. Pode tentar de novo?',
  };

  /* ══════════════════════════════════════════════════════════════════
     2 · TIMELINE - todas as durações e atrasos (em ms) ficam aqui
     ══════════════════════════════════════════════════════════════════ */
  const TIMELINE = {
    // 1 · ENTRADA
    startDelay: 600,          // espera antes do mascote aparecer
    popDuration: 800,         // pop com squash & stretch

    // 2 · ACENO
    waveDelay: 140,           // pausa entre o pop e o braço subir
    armRaiseDuration: 420,
    waveCount: 3,             // quantos acenos (cada um = ida e volta)
    waveSwingDuration: 480,   // duração de cada aceno
    armLowerDuration: 450,
    armRaisedAngle: 90,       // ângulo central do braço levantado (graus)
    armSwingAngle: 20,        // amplitude do aceno (± graus)
    bodySwayAngle: 2.2,       // balanço do corpo durante o aceno (graus)
    blinkAt: 0.55,            // 0–1: em que ponto do aceno os olhos piscam
    blinkDuration: 200,

    // 3 · BALÃO DE FALA
    bubbleDuration: 520,      // scale + fade

    // 4 · TRANSFORMAÇÃO EM CHAT
    holdBeforeChat: 3200,     // quanto o balão fica na tela antes do morph
    morphDuration: 720,
    morphTextOut: 0.30,       // fração do morph em que o texto some
    morphFormIn: 0.40,        // fração do morph em que o campo começa a aparecer
    breatheDuration: 3400,    // um ciclo de "respiração"
    breatheDistance: 6,       // px de subida e descida
    helpDelay: 450,           // pausa até o cartão de ajuda (com exemplos) aparecer

    // 5 · INTERAÇÃO
    jumpDuration: 560,
    jumpHeight: 16,           // px
    thinkingDelay: 350,       // só mostra "pensando…" se a resposta demorar mais que isso
    happyDuration: 1400,      // quanto tempo ele fica sorrindo depois de uma reação

    // VIDA (idle): o que ele faz sozinho enquanto espera
    blinkEveryMin: 2200,      // piscadas aleatórias: intervalo mínimo
    blinkEveryRange: 3600,    //   + até esse valor a mais
    glanceEveryMin: 5000,     // olhadinhas para os lados
    glanceEveryRange: 5000,
    idleArmAngle: 3.5,        // balanço dos braços parados (graus)
    followPointer: true,      // olhos seguem o mouse

    // prefers-reduced-motion
    fadeDuration: 320,
  };

  const EASE = {
    pop:     'cubic-bezier(.34, 1.56, .64, 1)',   // overshoot (bounce)
    bubble:  'cubic-bezier(.34, 1.35, .64, 1)',
    swing:   'cubic-bezier(.45, 0, .55, 1)',      // ida e volta suave
    soft:    'cubic-bezier(.4, 0, .2, 1)',
    morph:   'cubic-bezier(.55, 0, .2, 1)',
    breathe: 'ease-in-out',
  };

  /* ══════════════════════════════════════════════════════════════════
     3 · ONDE CONECTAR O SEU BACKEND DE IA
     Chamada sempre que a pessoa envia uma mensagem. Pode ser async.
     Também dá para trocar de fora:  window.aiAssistant.onSend = async (texto) => { ... }

     O que ela pode devolver (tudo opcional):
       • nada                      → o robô só comemora
       • "texto"                   → aparece em um cartão acima do robô
       • { text, actions: [ { label, primary?, onClick } ] }
                                   → cartão com botões (ex.: Confirmar / Ajustar).
                                     onClick pode devolver outro texto/objeto.
     Para falar a qualquer momento:  window.aiAssistant.say("texto" ou objeto)
     ══════════════════════════════════════════════════════════════════ */
  async function onSend(texto) {
    // Exemplo (agendamento de salas): a IA converte a frase em JSON para a API.
    // const res = await fetch('/api/agendamentos/interpretar', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ texto }),
    // });
    // const { resumo, payload } = await res.json();
    // return {
    //   text: resumo,                                   // "Sala Atlântico, amanhã, 14h às 15h"
    //   actions: [
    //     { label: 'Reservar', primary: true, onClick: async () => {
    //         await fetch('/api/agendamentos', { method: 'POST', body: JSON.stringify(payload) });
    //         return 'Pronto, sala reservada!';
    //     } },
    //     { label: 'Ajustar', onClick: () => window.aiAssistant.edit(texto) },
    //   ],
    // };
    console.log('[AIAssistant] onSend →', texto);
  }

  /* ══════════════════════════════════════════════════════════════════
     4 · COMPONENTE
     ══════════════════════════════════════════════════════════════════ */
  const T = TIMELINE;
  const host = document.getElementById('ai-assistant');
  if (!host) return;

  const part = (name) => host.querySelector(`[data-part="${name}"]`);
  const mascot = part('mascot'), jump = part('jump'), floater = part('float'), shadow = part('shadow');
  const sway = part('sway'), arm = part('arm'), arm2 = part('arm2'), blink = part('blink'), thrust = part('thrust');
  const bubble = part('bubble'), greeting = part('greeting'), form = part('form');
  const input = part('input'), send = part('send');
  const card = part('card'), cardBody = part('card-body'), cardClose = part('card-close');
  const sparkles = [...host.querySelectorAll('[data-part="sparkle"]')];
  const pulses = [...host.querySelectorAll('.m-pulse')];

  greeting.textContent = COPY.greeting;
  const narrowScreen = window.matchMedia('(max-width: 600px)');
  const applyPlaceholder = () => { input.placeholder = narrowScreen.matches ? COPY.placeholderShort : COPY.placeholder; };
  applyPlaceholder();
  narrowScreen.addEventListener('change', applyPlaceholder);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const api = { onSend, say: present, edit: editText, replay: () => runTimeline() };
  window.aiAssistant = api;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min, max) => min + Math.random() * (max - min);
  const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
  class Cancelled extends Error {}
  let currentRun = 0;

  /* ══════════════ EXPRESSÕES E OLHAR ══════════════ */
  let moodTimer = 0;
  function setMood(mood, ms) {
    clearTimeout(moodTimer);
    if (mood) host.dataset.mood = mood; else delete host.dataset.mood;
    updateLook();
    if (mood && ms) moodTimer = setTimeout(() => { if (host.dataset.mood === mood) setMood(null); }, ms);
  }

  let pointer = null, glance = null, lastPointerAt = 0, pointerXY = null, pointerFrame = 0;
  function updateLook() {
    let v = { x: 0, y: 0 };
    if (host.dataset.look === 'input') v = { x: -2.6, y: 0.8 };       // olha para o campo
    else if (host.dataset.mood === 'think') v = { x: 2.6, y: -3 };    // olha para cima, pensando
    else if (glance) v = glance;
    else if (pointer) v = pointer;
    host.style.setProperty('--look-x', v.x.toFixed(2) + 'px');
    host.style.setProperty('--look-y', v.y.toFixed(2) + 'px');
  }
  function onPointerMove(e) {
    if (!T.followPointer || e.pointerType !== 'mouse' || reduceMotion.matches) return;
    if (host.dataset.state === 'hidden' || host.dataset.state === 'intro') return;
    lastPointerAt = Date.now();
    pointerXY = [e.clientX, e.clientY];
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const r = mascot.getBoundingClientRect();
      const dx = pointerXY[0] - (r.left + r.width / 2);
      const dy = pointerXY[1] - (r.top + r.height * 0.36);
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 260);
      pointer = { x: (dx / dist) * k * 3.6, y: (dy / dist) * k * 2.6 };
      updateLook();
    });
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; updateLook(); });

  /* brilhinhos + feliz */
  function sparkle() {
    if (reduceMotion.matches) return;
    sparkles.forEach((s, i) => s.animate([
      { opacity: 0, transform: 'translateY(0) scale(0) rotate(0deg)' },
      { opacity: 1, transform: 'translateY(-4px) scale(1) rotate(20deg)', offset: .4 },
      { opacity: 0, transform: 'translateY(-11px) scale(.3) rotate(60deg)' },
    ], { duration: 900, delay: i * 140, easing: 'ease-out' }));
  }
  function react() { setMood('happy', T.happyDuration); sparkle(); }

  /* ══════════════ VIDA (idle) ══════════════ */
  let idleOn = false, idleTimers = [];
  const later = (fn, ms) => idleTimers.push(setTimeout(fn, ms));
  const doBlink = () => blink.animate(
    [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
    { duration: 170, easing: 'ease-in-out' });

  function scheduleBlink() {
    later(() => {
      if (!idleOn) return;
      doBlink();
      if (Math.random() < 0.28) later(doBlink, 240);   // às vezes pisca duas vezes
      scheduleBlink();
    }, T.blinkEveryMin + Math.random() * T.blinkEveryRange);
  }
  function scheduleGlance() {
    later(() => {
      if (!idleOn) return;
      const quiet = !host.dataset.look && !host.dataset.mood && Date.now() - lastPointerAt > 2500;
      if (quiet) {
        glance = { x: rand(-3.2, 3.2), y: rand(-1.4, 1) };
        updateLook();
        later(() => { glance = null; updateLook(); }, rand(900, 1500));
      }
      scheduleGlance();
    }, T.glanceEveryMin + Math.random() * T.glanceEveryRange);
  }
  function startIdle() {
    if (reduceMotion.matches) return;
    idleOn = true;
    const a = T.idleArmAngle;
    arm.animate([{ transform: `rotate(${-a}deg)` }, { transform: `rotate(${a}deg)` }],
      { duration: 3100, direction: 'alternate', iterations: Infinity, easing: EASE.swing, composite: 'add' });
    arm2.animate([{ transform: `rotate(${a}deg)` }, { transform: `rotate(${-a}deg)` }],
      { duration: 3700, direction: 'alternate', iterations: Infinity, easing: EASE.swing, composite: 'add' });
    thrust.animate([{ transform: 'scale(1, 1)', opacity: .9 }, { transform: 'scale(.9, 1.2)', opacity: 1 }],
      { duration: 420, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    pulses.forEach((p, i) => p.animate([{ opacity: .7 }, { opacity: 1 }],
      { duration: 1800 + i * 370, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
    scheduleBlink();
    scheduleGlance();
  }
  function stopIdle() {
    idleOn = false;
    idleTimers.forEach(clearTimeout);
    idleTimers = [];
  }

  /* ── Loop de "respiração": flutuar para cima e para baixo ── */
  function startBreathing() {
    const d = T.breatheDistance;
    const loop = { duration: T.breatheDuration, iterations: Infinity };
    const e = { easing: EASE.breathe };
    floater.animate([
      { transform: 'translateY(0)', ...e },
      { transform: `translateY(${-d}px)`, ...e },
      { transform: 'translateY(0)' },
    ], loop);
    shadow.animate([
      { transform: 'scaleX(1)', opacity: 1, ...e },
      { transform: 'scaleX(.84)', opacity: .55, ...e },
      { transform: 'scaleX(1)', opacity: 1 },
    ], loop);
  }

  /* ── Pulinho ao enviar / risadinha ao ser tocado ── */
  function hop() {
    if (reduceMotion.matches) return;
    const h = T.jumpHeight, duration = T.jumpDuration;
    jump.animate([
      { transform: 'translateY(0) scale(1, 1)', easing: 'ease-out' },
      { transform: 'translateY(0) scale(1.07, .92)', offset: .16, easing: 'cubic-bezier(.2, .7, .3, 1)' },
      { transform: `translateY(${-h}px) scale(.96, 1.06)`, offset: .5, easing: 'cubic-bezier(.7, 0, .8, .3)' },
      { transform: 'translateY(0) scale(1.1, .88)', offset: .82, easing: 'ease-out' },
      { transform: 'translateY(0) scale(1, 1)' },
    ], { duration });
    shadow.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(.7)', offset: .5 },
      { transform: 'scale(1)' },
    ], { duration, composite: 'add' });
  }
  function giggle() {
    if (reduceMotion.matches) return;
    jump.animate([
      { transform: 'rotate(0deg) scale(1, 1)', easing: 'ease-out' },
      { transform: 'rotate(-7deg) scale(1.05, .95)', offset: .2, easing: 'ease-in-out' },
      { transform: 'rotate(6deg) scale(.97, 1.04)', offset: .45, easing: 'ease-in-out' },
      { transform: 'rotate(-4deg) scale(1.03, .97)', offset: .7, easing: 'ease-in-out' },
      { transform: 'rotate(0deg) scale(1, 1)' },
    ], { duration: 620 });
  }

  /* ══════════════ CARTÃO (ajuda · pensando · resposta) ══════════════ */
  let hideToken = 0;
  function showCard(build) {
    hideToken++;
    const wasOpen = !card.hidden;
    card.getAnimations().forEach((a) => a.cancel());
    cardBody.replaceChildren();
    build(cardBody);
    card.hidden = false;
    if (!wasOpen) {
      const from = reduceMotion.matches ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px) scale(.92)' };
      const to = reduceMotion.matches ? { opacity: 1 } : { opacity: 1, transform: 'none' };
      card.animate([from, to], { duration: 320, easing: EASE.bubble, fill: 'backwards' });
    } else if (!reduceMotion.matches) {
      card.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 240, easing: EASE.pop });
    }
  }
  async function hideCard() {
    if (card.hidden) return;
    const token = ++hideToken;
    const fade = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    try { await fade.finished; } catch { return; }
    if (token === hideToken) { card.hidden = true; fade.cancel(); }
  }

  function showHelp() {
    showCard((body) => {
      const p = el('p', 'ai-card__text');
      p.textContent = COPY.helpText;
      const chips = el('div', 'ai-chips');
      COPY.examples.forEach((text) => {
        const b = el('button', 'ai-chip');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', () => editText(text));
        chips.append(b);
      });
      body.append(p, chips);
    });
  }
  function showThinking() {
    showCard((body) => {
      const p = el('p', 'ai-card__text');
      const dots = el('span', 'ai-dots');
      dots.append(el('i'), el('i'), el('i'));
      p.append(dots, document.createTextNode(COPY.thinking));
      body.append(p);
    });
  }

  /** Mostra uma resposta: string ou { text, actions: [{ label, primary, onClick }] } */
  function present(result) {
    const r = typeof result === 'string' ? { text: result } : (result || {});
    showCard((body) => {
      if (r.text) {
        const p = el('p', 'ai-card__text');
        p.textContent = r.text;
        body.append(p);
      }
      if (Array.isArray(r.actions) && r.actions.length) {
        const row = el('div', 'ai-actions');
        r.actions.forEach((a) => {
          const b = el('button', 'ai-btn' + (a.primary ? ' ai-btn--primary' : ''));
          b.type = 'button';
          b.textContent = a.label;
          b.addEventListener('click', async () => {
            row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
            try {
              const next = await a.onClick?.();
              if (next) { present(next); react(); } else hideCard();
            } catch (err) {
              console.error('[AIAssistant] ação falhou:', err);
              present({ text: COPY.error });
            }
          });
          row.append(b);
        });
        body.append(row);
      }
    });
  }

  /** Coloca um texto no campo (exemplos, "Ajustar") e deixa a pessoa editar */
  function editText(text) {
    input.value = text;
    syncSend();
    hideCard();
    input.focus();
  }

  /* ══════════════ RESET (início e replay) ══════════════ */
  function reset() {
    stopIdle();
    clearTimeout(moodTimer);
    host.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    host.dataset.state = 'hidden';
    delete host.dataset.look;
    delete host.dataset.mood;
    pointer = null; glance = null;
    updateLook();
    card.hidden = true;
    cardBody.replaceChildren();
    greeting.removeAttribute('aria-hidden');
    input.value = '';
    syncSend();
    if (host.contains(document.activeElement)) document.activeElement.blur();
  }

  /* ══════════════ A TIMELINE ══════════════ */
  async function runTimeline() {
    const id = ++currentRun;
    const alive = () => { if (id !== currentRun) throw new Cancelled(); };
    const until = async (promise) => { const r = await promise; alive(); return r; };
    const pause = (ms) => until(wait(ms));
    const go = (el, frames, opts) => until(el.animate(frames, opts).finished);

    try {
      reset();
      await pause(T.startDelay);

      if (reduceMotion.matches) return await playReduced({ pause, go });

      /* 1 · ENTRADA - pop com squash & stretch */
      host.dataset.state = 'intro';
      await go(mascot, [
        { transform: 'scale(0, 0)', easing: 'cubic-bezier(.2, .8, .3, 1)' },
        { transform: 'scale(1.13, .88)', offset: .55, easing: 'ease-in-out' },
        { transform: 'scale(.96, 1.06)', offset: .78, easing: 'ease-in-out' },
        { transform: 'scale(1, 1)' },
      ], { duration: T.popDuration });

      /* 2 · ACENO - braço sobe, balança 3x, corpo balança e os olhos piscam */
      await pause(T.waveDelay);
      const top = T.armRaisedAngle + T.armSwingAngle;
      const low = T.armRaisedAngle - T.armSwingAngle;
      await go(arm, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${top}deg)` }],
        { duration: T.armRaiseDuration, easing: EASE.pop, fill: 'forwards' });

      const waveTime = T.waveCount * T.waveSwingDuration;
      const armAngles = [top];
      const swayAngles = [0];
      for (let i = 0; i < T.waveCount; i++) {
        armAngles.push(low, top);
        swayAngles.push(T.bodySwayAngle, -T.bodySwayAngle);
      }
      swayAngles.push(0);

      const waving = arm.animate(
        armAngles.map((a) => ({ transform: `rotate(${a}deg)`, easing: EASE.swing })),
        { duration: waveTime });
      const swaying = sway.animate(
        swayAngles.map((a) => ({ transform: `rotate(${a}deg)`, easing: EASE.swing })),
        { duration: waveTime });
      const blinking = blink.animate(
        [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
        { duration: T.blinkDuration, delay: waveTime * T.blinkAt });
      await until(Promise.all([waving.finished, swaying.finished, blinking.finished]));

      /* 3 · BALÃO DE FALA - scale + fade; o braço desce e ele abre um sorriso */
      host.dataset.state = 'greeting';
      react();
      const lowering = arm.animate(
        [{ transform: `rotate(${top}deg)` }, { transform: 'rotate(0deg)' }],
        { duration: T.armLowerDuration, easing: EASE.soft, fill: 'forwards' });
      const appearing = bubble.animate(
        [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: T.bubbleDuration, easing: EASE.bubble, fill: 'backwards' });
      await until(Promise.all([lowering.finished, appearing.finished]));

      /* 4 · TRANSFORMAÇÃO EM CHAT - o balão vira o campo de entrada */
      await pause(T.holdBeforeChat);
      startBreathing();
      startIdle();

      const from = bubble.getBoundingClientRect();
      const fromRadius = getComputedStyle(bubble).borderTopLeftRadius;
      host.dataset.state = 'chat';                       // layout final (CSS)
      greeting.setAttribute('aria-hidden', 'true');
      const to = bubble.getBoundingClientRect();
      const toRadius = getComputedStyle(bubble).borderTopLeftRadius;

      const d = T.morphDuration;
      const morphing = bubble.animate([
        { width: `${from.width}px`, height: `${from.height}px`, borderRadius: fromRadius },
        { width: `${to.width}px`,   height: `${to.height}px`,   borderRadius: toRadius },
      ], { duration: d, easing: EASE.morph });
      const textOut = greeting.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: d * T.morphTextOut, easing: 'linear' });
      const formIn = form.animate(
        [{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: d * 0.55, delay: d * T.morphFormIn, easing: EASE.soft, fill: 'backwards' });
      await until(Promise.all([morphing.finished, textOut.finished, formIn.finished]));

      /* 5 · O robô oferece ajuda com exemplos do que dá para pedir */
      await pause(T.helpDelay);
      showHelp();
      hop();
      react();

    } catch (err) {
      if (!(err instanceof Cancelled) && err?.name !== 'AbortError') throw err;
    }
  }

  /* prefers-reduced-motion: sem pop, aceno, morph, respiração ou vida própria - só fade */
  async function playReduced({ pause, go }) {
    host.dataset.state = 'intro';
    await go(mascot, [{ opacity: 0 }, { opacity: 1 }], { duration: T.fadeDuration, easing: 'ease-out' });

    host.dataset.state = 'greeting';
    await go(bubble, [{ opacity: 0 }, { opacity: 1 }], { duration: T.fadeDuration, easing: 'ease-out' });

    await pause(T.holdBeforeChat);
    await go(bubble, [{ opacity: 1 }, { opacity: 0 }],
      { duration: T.fadeDuration / 2, fill: 'forwards' });
    host.dataset.state = 'chat';
    greeting.setAttribute('aria-hidden', 'true');
    await go(bubble, [{ opacity: 0 }, { opacity: 1 }],
      { duration: T.fadeDuration, easing: 'ease-out', fill: 'forwards' });
    showHelp();
  }

  /* ══════════════ INTERAÇÃO ══════════════ */
  function syncSend() { send.disabled = !input.value.trim(); }

  let busy = false;
  async function submit() {
    const texto = input.value.trim();
    if (!texto || busy) return;
    busy = true;
    input.value = '';
    syncSend();
    hop();
    input.focus();
    hideCard();
    setMood('think');                                          // olha para cima, pensando
    const thinkingTimer = setTimeout(showThinking, T.thinkingDelay);
    try {
      const result = await api.onSend(texto);
      clearTimeout(thinkingTimer);
      setMood(null);
      if (result) present(result); else hideCard();
      react();
    } catch (err) {
      clearTimeout(thinkingTimer);
      setMood(null);
      console.error('[AIAssistant] onSend falhou:', err);
      input.value = texto;          // devolve o texto para a pessoa tentar de novo
      syncSend();
      present({ text: COPY.error });
    } finally {
      busy = false;
    }
  }

  input.addEventListener('input', syncSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  send.addEventListener('click', submit);
  cardClose.addEventListener('click', hideCard);
  host.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCard(); });

  // ao focar no campo, o mascote olha na direção dele
  bubble.addEventListener('focusin', () => { host.dataset.look = 'input'; updateLook(); });
  bubble.addEventListener('focusout', (e) => {
    if (!bubble.contains(e.relatedTarget)) { delete host.dataset.look; updateLook(); }
  });
  // tocar no mascote: risadinha, brilhinhos e foco no campo
  mascot.addEventListener('click', () => {
    if (host.dataset.state === 'hidden' || host.dataset.state === 'intro') return;
    giggle();
    react();
    if (host.dataset.state === 'chat') input.focus();
  });

  runTimeline();
})();
