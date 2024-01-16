import { updateScrollPosition } from "./router.js";
const TRANSITION_BEFORE_PREPARATION = "astro:before-preparation";
const TRANSITION_AFTER_PREPARATION = "astro:after-preparation";
const TRANSITION_BEFORE_SWAP = "astro:before-swap";
const TRANSITION_AFTER_SWAP = "astro:after-swap";
const TRANSITION_PAGE_LOAD = "astro:page-load";
const triggerEvent = (name) => document.dispatchEvent(new Event(name));
const onPageLoad = () => triggerEvent(TRANSITION_PAGE_LOAD);
class BeforeEvent extends Event {
  from;
  to;
  direction;
  navigationType;
  sourceElement;
  info;
  newDocument;
  constructor(type, eventInitDict, from, to, direction, navigationType, sourceElement, info, newDocument) {
    super(type, eventInitDict);
    this.from = from;
    this.to = to;
    this.direction = direction;
    this.navigationType = navigationType;
    this.sourceElement = sourceElement;
    this.info = info;
    this.newDocument = newDocument;
    Object.defineProperties(this, {
      from: { enumerable: true },
      to: { enumerable: true, writable: true },
      direction: { enumerable: true, writable: true },
      navigationType: { enumerable: true },
      sourceElement: { enumerable: true },
      info: { enumerable: true },
      newDocument: { enumerable: true, writable: true }
    });
  }
}
const isTransitionBeforePreparationEvent = (value) => value.type === TRANSITION_BEFORE_PREPARATION;
class TransitionBeforePreparationEvent extends BeforeEvent {
  formData;
  loader;
  constructor(from, to, direction, navigationType, sourceElement, info, newDocument, formData, loader) {
    super(
      TRANSITION_BEFORE_PREPARATION,
      { cancelable: true },
      from,
      to,
      direction,
      navigationType,
      sourceElement,
      info,
      newDocument
    );
    this.formData = formData;
    this.loader = loader.bind(this, this);
    Object.defineProperties(this, {
      formData: { enumerable: true },
      loader: { enumerable: true, writable: true }
    });
  }
}
const isTransitionBeforeSwapEvent = (value) => value.type === TRANSITION_BEFORE_SWAP;
class TransitionBeforeSwapEvent extends BeforeEvent {
  direction;
  viewTransition;
  swap;
  constructor(afterPreparation, viewTransition, swap) {
    super(
      TRANSITION_BEFORE_SWAP,
      void 0,
      afterPreparation.from,
      afterPreparation.to,
      afterPreparation.direction,
      afterPreparation.navigationType,
      afterPreparation.sourceElement,
      afterPreparation.info,
      afterPreparation.newDocument
    );
    this.direction = afterPreparation.direction;
    this.viewTransition = viewTransition;
    this.swap = swap.bind(this, this);
    Object.defineProperties(this, {
      direction: { enumerable: true },
      viewTransition: { enumerable: true },
      swap: { enumerable: true, writable: true }
    });
  }
}
async function doPreparation(from, to, direction, navigationType, sourceElement, info, formData, defaultLoader) {
  const event = new TransitionBeforePreparationEvent(
    from,
    to,
    direction,
    navigationType,
    sourceElement,
    info,
    window.document,
    formData,
    defaultLoader
  );
  if (document.dispatchEvent(event)) {
    await event.loader();
    if (!event.defaultPrevented) {
      triggerEvent(TRANSITION_AFTER_PREPARATION);
      if (event.navigationType !== "traverse") {
        updateScrollPosition({ scrollX, scrollY });
      }
    }
  }
  return event;
}
async function doSwap(afterPreparation, viewTransition, defaultSwap) {
  const event = new TransitionBeforeSwapEvent(afterPreparation, viewTransition, defaultSwap);
  document.dispatchEvent(event);
  event.swap();
  return event;
}
export {
  TRANSITION_AFTER_PREPARATION,
  TRANSITION_AFTER_SWAP,
  TRANSITION_BEFORE_PREPARATION,
  TRANSITION_BEFORE_SWAP,
  TRANSITION_PAGE_LOAD,
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
  doPreparation,
  doSwap,
  isTransitionBeforePreparationEvent,
  isTransitionBeforeSwapEvent,
  onPageLoad,
  triggerEvent
};
