export type Subsidy = {
  title: string;
  financing: SubsidyFinancing;
  content: string;
  href: string;
  benefits: SubsidyBenefit;
};

export type SubsidyFinancing = "loan" | "grant";

export type SubsidyBenefit = {
  unit: string;
  for?: string;
} & (
  | { type: "range"; from: number; to: number }
  | { type: "upTo" | "exactly"; value: number }
);
