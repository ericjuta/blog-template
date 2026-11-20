import {
  createChange,
  createRovingFocus,
  definePrimitive,
  type ChangeDetails,
} from "@ui-sdk/core"

// "step-navigation" is not in the shared ReasonVocabulary.
type EvidenceStepperReason = "item-press" | "list-navigation" | "step-navigation"

type EvidenceStepperOptions = {
  value?: string
  defaultValue?: string
  steps?: string[]
  onValueChange?: (
    value: string,
    details: ChangeDetails<EvidenceStepperReason>
  ) => void
}

const evidenceStepper = definePrimitive({
  name: "evidence-stepper",
  options: {
    value: "string",
    defaultValue: "string",
    steps: "list",
    onValueChange: "callback",
  },
  controlled: ["value"],
  state: (options: EvidenceStepperOptions) => ({
    value: options.value ?? options.defaultValue ?? options.steps?.[0] ?? "",
    steps: options.steps ?? [],
    focused: null as string | null,
  }),
  sync: (options) => ({
    ...(options.value !== undefined ? { value: options.value } : {}),
    ...(options.steps !== undefined ? { steps: options.steps } : {}),
  }),
  api: (context) => {
    const change = createChange(context)
    const roving = createRovingFocus(context, {
      slot: "step",
      key: "focused",
      remember: true,
      preferred: (part) => part.key === context.store.get().value,
      claims: (state, part) =>
        state.value ? part.key === state.value : part.key === state.steps[0],
      orientation: () => "both",
      loop: () => false,
    })

    const selectStep = (
      stepValue: string,
      reason: EvidenceStepperReason,
      event?: Event
    ) => {
      const { steps } = context.store.get()
      if (steps.length > 0 && !steps.includes(stepValue)) return false
      return change("value", stepValue, { reason, event })
    }

    return {
      roving,
      getSteps: () => context.store.get().steps,
      goTo: (stepValue: string, event?: Event) =>
        selectStep(stepValue, "item-press", event),
      next: (event?: Event) => {
        const { steps, value } = context.store.get()
        const idx = steps.indexOf(value)
        if (idx < 0 || idx >= steps.length - 1) return false
        const target = steps[idx + 1]
        const ok = selectStep(target, "step-navigation", event)
        if (ok) roving.focus(target)
        return ok
      },
      previous: (event?: Event) => {
        const { steps, value } = context.store.get()
        const idx = steps.indexOf(value)
        if (idx <= 0) return false
        const target = steps[idx - 1]
        const ok = selectStep(target, "step-navigation", event)
        if (ok) roving.focus(target)
        return ok
      },
      keydown(event: KeyboardEvent, el: HTMLElement) {
        const moved = roving.keydown(event, el)
        if (moved) {
          selectStep(moved.key, "list-navigation", event)
        }
      },
    }
  },
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        "data-step": state.value,
      }),
    }),
    list: slot({
      attrs: () => ({
        role: "group",
      }),
    }),
    step: slot<{ value: string }>({
      props: { value: "string" },
      attrs: (state, part) => {
        const current = part.key === state.value
        const idx = state.steps.indexOf(part.key)
        const activeIdx = state.steps.indexOf(state.value)
        return {
          type: "button",
          "aria-current": current ? "step" : undefined,
          tabindex: part.api.roving.tabIndex(state, part),
          "data-current": current ? "" : undefined,
          "data-completed": idx >= 0 && activeIdx > idx ? "" : undefined,
        }
      },
      press: ({ api, key }, event) => {
        api.goTo(key, event)
      },
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.keydown(event, el)
        },
      },
      bind: (el, part) => part.api.roving.bind(el, part),
    }),
  }),
  agent: {
    actions: ["goTo", "next", "previous"],
    closed: true,
    items: (api) =>
      api.getSteps().map((step) => ({ value: step, label: step })),
  },
})

export {
  evidenceStepper,
  type EvidenceStepperOptions,
  type EvidenceStepperReason,
}
