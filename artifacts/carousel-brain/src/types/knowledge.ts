export interface Slide {
  id: number;
  gradient: string;
  accent: string;
  heading: string;
  lines: number[];
  caption: string;
}

export interface Insight {
  text: string;
}

export interface ActionStep {
  text: string;
}

export interface Concept {
  name: string;
  desc: string;
}

export interface Resource {
  title: string;
  type: string;
  color: string;
  colorBg: string;
  link: string;
}

export interface LearningPathStep {
  stage: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}

export interface Extraction {
  id: string;
  title: string;
  summary: string;
  source: string;
  tags: string[];
  date: string;
  status: "Extracted";
  overview: string;
  insights: Insight[];
  actionSteps: ActionStep[];
  concepts: Concept[];
  resources: Resource[];
  path: LearningPathStep[];
  slides: Slide[];
}
