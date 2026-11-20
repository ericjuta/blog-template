"use client"

import { createParts } from "@ui-sdk/react/primitive"
import { evidenceStepper } from "./evidence-stepper"

const parts = createParts(evidenceStepper, {
  root: "div",
  list: "div",
  step: "button",
})

const EvidenceStepper = parts.Root
const EvidenceStepperList = parts.List
const EvidenceStepperStep = parts.Step

export { EvidenceStepper, EvidenceStepperList, EvidenceStepperStep }
