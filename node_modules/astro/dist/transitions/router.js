import { TRANSITION_AFTER_SWAP, doPreparation, doSwap } from "./events.js";
const inBrowser = import.meta.env.SSR === false;
const pushState = inBrowser && history.pushState.bind(history);
const replaceState = inBrowser && history.replaceState.bind(history);
const updateScrollPosition = (positions) => {
  if (history.state) {
    history.scrollRestoration = "manual";
    replaceState({ ...history.state, ...positions }, "");
  }
};
const supportsViewTransitions = inBrowser && !!document.startViewTransition;
const transitionEnabledOnThisPage = () => inBrowser && !!document.querySelector('[name="astro-view-transitions-enabled"]');
const samePage = (thisLocation, otherLocation) => thisLocation.pathname === otherLocation.pathname && thisLocation.search === otherLocation.search;
let originalLocation;
let viewTransition;
let skipTransition = false;
let viewTransitionFinished;
const triggerEvent = (name) => document.dispatchEvent(new Event(name));
const onPageLoad = () => triggerEvent("astro:page-load");
const announce = () => {
  let div = document.createElement("div");
  div.setAttribute("aria-live", "assertive");
  div.setAttribute("aria-atomic", "true");
  div.className = "astro-route-announcer";
  document.body.append(div);
  setTimeout(
    () => {
      let title = document.title || document.querySelector("h1")?.textContent || location.pathname;
      div.textContent = title;
    },
    // Much thought went into this magic number; the gist is that screen readers
    // need to see that the element changed and might not do so if it happens
    // too quickly.
    60
  );
};
const PERSIST_ATTR = "data-astro-transition-persist";
const DIRECTION_ATTR = "data-astro-transition";
const OLD_NEW_ATTR = "data-astro-transition-fallback";
const VITE_ID = "data-vite-dev-id";
let parser;
let currentHistoryIndex = 0;
if (inBrowser) {
  if (history.state) {
    currentHistoryIndex = history.state.index;
    scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
  } else if (transitionEnabledOnThisPage()) {
    replaceState({ index: currentHistoryIndex, scrollX, scrollY }, "");
    history.scrollRestoration = "manual";
  }
}
const throttle = (cb, delay) => {
  let wait = false;
  let onceMore = false;
  return (...args) => {
    if (wait) {
      onceMore = true;
      return;
    }
    cb(...args);
    wait = true;
    setTimeout(() => {
      if (onceMore) {
        onceMore = false;
        cb(...args);
      }
      wait = false;
    }, delay);
  };
};
async function fetchHTML(href, init) {
  try {
    const res = await fetch(href, init);
    const contentType = res.headers.get("content-type") ?? "";
    const mediaType = contentType.split(";", 1)[0].trim();
    if (mediaType !== "text/html" && mediaType !== "application/xhtml+xml") {
      return null;
    }
    const html = await res.text();
    return {
      html,
      redirected: res.redirected ? res.url : void 0,
      mediaType
    };
  } catch (err) {
    return null;
  }
}
function getFallback() {
  const el = document.querySelector('[name="astro-view-transitions-fallback"]');
  if (el) {
    return el.getAttribute("content");
  }
  return "animate";
}
function runScripts() {
  let wait = Promise.resolve();
  for (const script of Array.from(document.scripts)) {
    if (script.dataset.astroExec === "")
      continue;
    const type = script.getAttribute("type");
    if (type && type !== "module" && type !== "text/javascript")
      continue;
    const newScript = document.createElement("script");
    newScript.innerHTML = script.innerHTML;
    for (const attr of script.attributes) {
      if (attr.name === "src") {
        const p = new Promise((r) => {
          newScript.onload = newScript.onerror = r;
        });
        wait = wait.then(() => p);
      }
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.dataset.astroExec = "";
    script.replaceWith(newScript);
  }
  return wait;
}
const moveToLocation = (to, from, options, pageTitleForBrowserHistory, historyState) => {
  const intraPage = samePage(from, to);
  const targetPageTitle = document.title;
  document.title = pageTitleForBrowserHistory;
  let scrolledToTop = false;
  if (to.href !== location.href && !historyState) {
    if (options.history === "replace") {
      const current = history.state;
      replaceState(
        {
          ...options.state,
          index: current.index,
          scrollX: current.scrollX,
          scrollY: current.scrollY
        },
        "",
        to.href
      );
    } else {
      pushState(
        { ...options.state, index: ++currentHistoryIndex, scrollX: 0, scrollY: 0 },
        "",
        to.href
      );
    }
  }
  originalLocation = to;
  if (!intraPage) {
    scrollTo({ left: 0, top: 0, behavior: "instant" });
    scrolledToTop = true;
  }
  if (historyState) {
    scrollTo(historyState.scrollX, historyState.scrollY);
  } else {
    if (to.hash) {
      history.scrollRestoration = "auto";
      const savedState = history.state;
      location.href = to.href;
      history.state || replaceState(savedState, "");
    } else {
      if (!scrolledToTop) {
        scrollTo({ left: 0, top: 0, behavior: "instant" });
      }
    }
    history.scrollRestoration = "manual";
  }
  document.title = targetPageTitle;
};
function preloadStyleLinks(newDocument) {
  const links = [];
  for (const el of newDocument.querySelectorAll("head link[rel=stylesheet]")) {
    if (!document.querySelector(
      `[${PERSIST_ATTR}="${el.getAttribute(
        PERSIST_ATTR
      )}"], link[rel=stylesheet][href="${el.getAttribute("href")}"]`
    )) {
      const c = document.createElement("link");
      c.setAttribute("rel", "preload");
      c.setAttribute("as", "style");
      c.setAttribute("href", el.getAttribute("href"));
      links.push(
        new Promise((resolve) => {
          ["load", "error"].forEach((evName) => c.addEventListener(evName, resolve));
          document.head.append(c);
        })
      );
    }
  }
  return links;
}
async function updateDOM(preparationEvent, options, historyState, fallback) {
  const persistedHeadElement = (el, newDoc) => {
    const id = el.getAttribute(PERSIST_ATTR);
    const newEl = id && newDoc.head.querySelector(`[${PERSIST_ATTR}="${id}"]`);
    if (newEl) {
      return newEl;
    }
    if (el.matches("link[rel=stylesheet]")) {
      const href = el.getAttribute("href");
      return newDoc.head.querySelector(`link[rel=stylesheet][href="${href}"]`);
    }
    return null;
  };
  const saveFocus = () => {
    const activeElement = document.activeElement;
    if (activeElement?.closest(`[${PERSIST_ATTR}]`)) {
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        return { activeElement, start, end };
      }
      return { activeElement };
    } else {
      return { activeElement: null };
    }
  };
  const restoreFocus = ({ activeElement, start, end }) => {
    if (activeElement) {
      activeElement.focus();
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
        activeElement.selectionStart = start;
        activeElement.selectionEnd = end;
      }
    }
  };
  const defaultSwap = (beforeSwapEvent) => {
    const html = document.documentElement;
    const astroAttributes = [...html.attributes].filter(
      ({ name }) => (html.removeAttribute(name), name.startsWith("data-astro-"))
    );
    [...beforeSwapEvent.newDocument.documentElement.attributes, ...astroAttributes].forEach(
      ({ name, value }) => html.setAttribute(name, value)
    );
    for (const s1 of document.scripts) {
      for (const s2 of beforeSwapEvent.newDocument.scripts) {
        if (
          // Inline
          !s1.src && s1.textContent === s2.textContent || // External
          s1.src && s1.type === s2.type && s1.src === s2.src
        ) {
          s2.dataset.astroExec = "";
          break;
        }
      }
    }
    for (const el of Array.from(document.head.children)) {
      const newEl = persistedHeadElement(el, beforeSwapEvent.newDocument);
      if (newEl) {
        newEl.remove();
      } else {
        el.remove();
      }
    }
    document.head.append(...beforeSwapEvent.newDocument.head.children);
    const oldBody = document.body;
    const savedFocus = saveFocus();
    document.body.replaceWith(beforeSwapEvent.newDocument.body);
    for (const el of oldBody.querySelectorAll(`[${PERSIST_ATTR}]`)) {
      const id = el.getAttribute(PERSIST_ATTR);
      const newEl = document.querySelector(`[${PERSIST_ATTR}="${id}"]`);
      if (newEl) {
        newEl.replaceWith(el);
      }
    }
    restoreFocus(savedFocus);
  };
  async function animate(phase) {
    function isInfinite(animation) {
      const effect = animation.effect;
      if (!effect || !(effect instanceof KeyframeEffect) || !effect.target)
        return false;
      const style = window.getComputedStyle(effect.target, effect.pseudoElement);
      return style.animationIterationCount === "infinite";
    }
    const currentAnimations = document.getAnimations();
    document.documentElement.setAttribute(OLD_NEW_ATTR, phase);
    const nextAnimations = document.getAnimations();
    const newAnimations = nextAnimations.filter(
      (a) => !currentAnimations.includes(a) && !isInfinite(a)
    );
    return Promise.all(newAnimations.map((a) => a.finished));
  }
  if (!skipTransition) {
    document.documentElement.setAttribute(DIRECTION_ATTR, preparationEvent.direction);
    if (fallback === "animate") {
      await animate("old");
    }
  } else {
    throw new DOMException("Transition was skipped");
  }
  const pageTitleForBrowserHistory = document.title;
  const swapEvent = await doSwap(preparationEvent, viewTransition, defaultSwap);
  moveToLocation(swapEvent.to, swapEvent.from, options, pageTitleForBrowserHistory, historyState);
  triggerEvent(TRANSITION_AFTER_SWAP);
  if (fallback === "animate" && !skipTransition) {
    animate("new").then(() => viewTransitionFinished());
  }
}
async function transition(direction, from, to, options, historyState) {
  if (!transitionEnabledOnThisPage() || location.origin !== to.origin) {
    location.href = to.href;
    return;
  }
  const navigationType = historyState ? "traverse" : options.history === "replace" ? "replace" : "push";
  if (navigationType !== "traverse") {
    updateScrollPosition({ scrollX, scrollY });
  }
  if (samePage(from, to) && !!to.hash) {
    moveToLocation(to, from, options, document.title, historyState);
    return;
  }
  const prepEvent = await doPreparation(
    from,
    to,
    direction,
    navigationType,
    options.sourceElement,
    options.info,
    options.formData,
    defaultLoader
  );
  if (prepEvent.defaultPrevented) {
    location.href = to.href;
    return;
  }
  async function defaultLoader(preparationEvent) {
    const href = preparationEvent.to.href;
    const init = {};
    if (preparationEvent.formData) {
      init.method = "POST";
      const form = preparationEvent.sourceElement instanceof HTMLFormElement ? preparationEvent.sourceElement : preparationEvent.sourceElement instanceof HTMLElement && "form" in preparationEvent.sourceElement ? preparationEvent.sourceElement.form : preparationEvent.sourceElement?.closest("form");
      init.body = form?.attributes.getNamedItem("enctype")?.value === "application/x-www-form-urlencoded" ? new URLSearchParams(preparationEvent.formData) : preparationEvent.formData;
    }
    const response = await fetchHTML(href, init);
    if (response === null) {
      preparationEvent.preventDefault();
      return;
    }
    if (response.redirected) {
      preparationEvent.to = new URL(response.redirected);
    }
    parser ??= new DOMParser();
    preparationEvent.newDocument = parser.parseFromString(response.html, response.mediaType);
    preparationEvent.newDocument.querySelectorAll("noscript").forEach((el) => el.remove());
    if (!preparationEvent.newDocument.querySelector('[name="astro-view-transitions-enabled"]') && !preparationEvent.formData) {
      preparationEvent.preventDefault();
      return;
    }
    const links = preloadStyleLinks(preparationEvent.newDocument);
    links.length && await Promise.all(links);
    if (import.meta.env.DEV)
      await prepareForClientOnlyComponents(preparationEvent.newDocument, preparationEvent.to);
  }
  skipTransition = false;
  if (supportsViewTransitions) {
    viewTransition = document.startViewTransition(
      async () => await updateDOM(prepEvent, options, historyState)
    );
  } else {
    const updateDone = (async () => {
      await new Promise((r) => setTimeout(r));
      await updateDOM(prepEvent, options, historyState, getFallback());
    })();
    viewTransition = {
      updateCallbackDone: updateDone,
      // this is about correct
      ready: updateDone,
      // good enough
      finished: new Promise((r) => viewTransitionFinished = r),
      // see end of updateDOM
      skipTransition: () => {
        skipTransition = true;
      }
    };
  }
  viewTransition.ready.then(async () => {
    await runScripts();
    onPageLoad();
    announce();
  });
  viewTransition.finished.then(() => {
    document.documentElement.removeAttribute(DIRECTION_ATTR);
    document.documentElement.removeAttribute(OLD_NEW_ATTR);
  });
  await viewTransition.ready;
}
let navigateOnServerWarned = false;
async function navigate(href, options) {
  if (inBrowser === false) {
    if (!navigateOnServerWarned) {
      const warning = new Error(
        "The view transitions client API was called during a server side render. This may be unintentional as the navigate() function is expected to be called in response to user interactions. Please make sure that your usage is correct."
      );
      warning.name = "Warning";
      console.warn(warning);
      navigateOnServerWarned = true;
    }
    return;
  }
  await transition("forward", originalLocation, new URL(href, location.href), options ?? {});
}
function onPopState(ev) {
  if (!transitionEnabledOnThisPage() && ev.state) {
    location.reload();
    return;
  }
  if (ev.state === null) {
    return;
  }
  const state = history.state;
  const nextIndex = state.index;
  const direction = nextIndex > currentHistoryIndex ? "forward" : "back";
  currentHistoryIndex = nextIndex;
  transition(direction, originalLocation, new URL(location.href), {}, state);
}
const onScroll = () => {
  updateScrollPosition({ scrollX, scrollY });
};
if (inBrowser) {
  if (supportsViewTransitions || getFallback() !== "none") {
    originalLocation = new URL(location.href);
    addEventListener("popstate", onPopState);
    addEventListener("load", onPageLoad);
    if ("onscrollend" in window)
      addEventListener("scrollend", onScroll);
    else
      addEventListener("scroll", throttle(onScroll, 350), { passive: true });
  }
  for (const script of document.scripts) {
    script.dataset.astroExec = "";
  }
}
async function prepareForClientOnlyComponents(newDocument, toLocation) {
  if (newDocument.body.querySelector(`astro-island[client='only']`)) {
    const nextPage = document.createElement("iframe");
    nextPage.src = toLocation.href;
    nextPage.style.display = "none";
    document.body.append(nextPage);
    nextPage.contentWindow.console = Object.keys(console).reduce((acc, key) => {
      acc[key] = () => {
      };
      return acc;
    }, {});
    await hydrationDone(nextPage);
    const nextHead = nextPage.contentDocument?.head;
    if (nextHead) {
      document.head.querySelectorAll(`style[${PERSIST_ATTR}=""]`).forEach((s) => s.removeAttribute(PERSIST_ATTR));
      const viteIds = [...nextHead.querySelectorAll(`style[${VITE_ID}]`)].map(
        (style) => style.getAttribute(VITE_ID)
      );
      viteIds.forEach((id) => {
        const style = document.head.querySelector(`style[${VITE_ID}="${id}"]`);
        if (style && !newDocument.head.querySelector(`style[${VITE_ID}="${id}"]`)) {
          newDocument.head.appendChild(style.cloneNode(true));
        }
      });
    }
    async function hydrationDone(loadingPage) {
      await new Promise(
        (r) => loadingPage.contentWindow?.addEventListener("load", r, { once: true })
      );
      return new Promise(async (r) => {
        for (let count = 0; count <= 20; ++count) {
          if (!loadingPage.contentDocument.body.querySelector("astro-island[ssr]"))
            break;
          await new Promise((r2) => setTimeout(r2, 50));
        }
        r();
      });
    }
  }
}
export {
  navigate,
  supportsViewTransitions,
  transitionEnabledOnThisPage,
  updateScrollPosition
};
