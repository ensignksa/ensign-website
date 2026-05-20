// Single entry point for all six lenses, EN + AR.
// system.en.js and system.ar.js import LENSES_EN / LENSES_AR / LENS_LABELS_* from here.

import { SALES_EN } from "./sales.en.js";
import { MARKETING_EN } from "./marketing.en.js";
import { WORKFLOW_EN } from "./workflow.en.js";
import { REPORTING_EN } from "./reporting.en.js";
import { CONTENT_EN } from "./content.en.js";
import { AGENTS_EN } from "./agents.en.js";

import { SALES_AR } from "./sales.ar.js";
import { MARKETING_AR } from "./marketing.ar.js";
import { WORKFLOW_AR } from "./workflow.ar.js";
import { REPORTING_AR } from "./reporting.ar.js";
import { CONTENT_AR } from "./content.ar.js";
import { AGENTS_AR } from "./agents.ar.js";

export const LENSES_EN = {
  sales: SALES_EN.posture,
  marketing: MARKETING_EN.posture,
  workflow: WORKFLOW_EN.posture,
  reporting: REPORTING_EN.posture,
  content: CONTENT_EN.posture,
  agents: AGENTS_EN.posture,
};

export const LENSES_AR = {
  sales: SALES_AR.posture,
  marketing: MARKETING_AR.posture,
  workflow: WORKFLOW_AR.posture,
  reporting: REPORTING_AR.posture,
  content: CONTENT_AR.posture,
  agents: AGENTS_AR.posture,
};

export const LENS_LABELS_EN = {
  sales: SALES_EN.label,
  marketing: MARKETING_EN.label,
  workflow: WORKFLOW_EN.label,
  reporting: REPORTING_EN.label,
  content: CONTENT_EN.label,
  agents: AGENTS_EN.label,
};

export const LENS_LABELS_AR = {
  sales: SALES_AR.label,
  marketing: MARKETING_AR.label,
  workflow: WORKFLOW_AR.label,
  reporting: REPORTING_AR.label,
  content: CONTENT_AR.label,
  agents: AGENTS_AR.label,
};
