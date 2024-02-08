import type { Rule } from "eslint";


export type CalleeRegex = [string, string];
export type Callees = CalleeRegex[] | string[];

export interface ESLintRule<Options extends any[] = [any]> {
  name: string;
  rule: Rule.RuleModule;
  options?: Options;
}
