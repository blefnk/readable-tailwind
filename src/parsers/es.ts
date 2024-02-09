import { isJSXExpressionContainerWithESTemplateLiteral } from "readable-tailwind:flavors:jsx";
import { deduplicateLiterals, getQuotes, getWhitespace } from "readable-tailwind:utils:utils.js";

import type { AST, Rule } from "eslint";
import type {
  BaseNode as ESBaseNode,
  CallExpression as ESCallExpression,
  Expression as ESExpression,
  Node as ESNode,
  SimpleLiteral as ESSimpleLiteral,
  SpreadElement as ESSpreadElement,
  TemplateElement as ESTemplateElement,
  TemplateLiteral as ESTemplateLiteral
} from "estree";

import type { BracesMeta, Literal, Node, StringLiteral, TemplateLiteral } from "readable-tailwind:types:ast";
import type { CalleeRegex, Callees } from "readable-tailwind:types:rule.js";


export function getLiteralsByESCallExpression(ctx: Rule.RuleContext, node: ESCallExpression, callees: Callees): Literal[] {
  const literals = callees.reduce<Literal[]>((literals, callee) => {

    if(node.callee.type !== "Identifier"){ return literals; }

    if(typeof callee === "string"){
      if(callee !== node.callee.name){ return literals; }

      literals.push(...getLiteralsByESCallExpressionAndStringCallee(ctx, node.arguments));
    } else {
      literals.push(...getLiteralsByESCallExpressionAndRegexCallee(ctx, node, callee));
    }

    return literals;
  }, []);

  return deduplicateLiterals(literals);
}

function getLiteralsByESCallExpressionAndStringCallee(ctx: Rule.RuleContext, args: (ESExpression | ESSpreadElement)[]): Literal[] {
  return args.reduce<Literal[]>((acc, arg) => {
    if(arg.type === "SpreadElement"){ return acc; }
    const literals = getLiteralsByESExpression(ctx, arg);
    return [...acc, ...literals];
  }, []);
}

function getLiteralsByESCallExpressionAndRegexCallee(ctx: Rule.RuleContext, node: ESNode, regexCallee: CalleeRegex): Literal[] {

  const [containerRegexString, stringLiteralRegexString] = regexCallee;

  const sourceCode = ctx.sourceCode.getText(node);

  const containerRegex = new RegExp(containerRegexString, "g");
  const stringLiteralRegex = new RegExp(stringLiteralRegexString, "g");
  const containers = sourceCode.matchAll(containerRegex);

  const matchedLiterals: Literal[] = [];

  for(const container of containers){
    const stringLiterals = container[0].matchAll(stringLiteralRegex);

    for(const stringLiteral of stringLiterals){
      if(!stringLiteral.index){ continue; }

      const node = ctx.sourceCode.getNodeByRangeIndex(stringLiteral.index);

      if(!node){ continue; }

      const literals = isESSimpleStringLiteral(node)
        ? getStringLiteralByESStringLiteral(ctx, node)
        : isJSXExpressionContainerWithESTemplateLiteral(node)
          ? getLiteralsByESTemplateLiteral(ctx, node.expression)
          : undefined;

      if(literals === undefined){ continue; }

      matchedLiterals.push(
        ...Array.isArray(literals) ? literals : [literals]
      );
    }

  }

  return matchedLiterals;

}

function getLiteralsByESExpression(ctx: Rule.RuleContext, node: ESExpression): Literal[] {

  if(isESSimpleStringLiteral(node)){
    const simpleStringLiteral = getStringLiteralByESStringLiteral(ctx, node);
    if(simpleStringLiteral){
      return [simpleStringLiteral];
    }
  }

  if(isESTemplateLiteral(node)){
    return getLiteralsByESTemplateLiteral(ctx, node);
  }

  return [];

}

export function getStringLiteralByESStringLiteral(ctx: Rule.RuleContext, node: ESSimpleStringLiteral): StringLiteral | undefined {

  const token = getTokenByESNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value;

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);

  return {
    ...quotes,
    ...whitespaces,
    content,
    loc: node.loc,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "StringLiteral"
  };

}

export function getLiteralByESTemplateElement(ctx: Rule.RuleContext, node: ESTemplateElement & Rule.Node): TemplateLiteral | undefined {

  const token = getTokenByESNode(ctx, node);

  if(!token || !node.loc || !node.range || !node.parent.loc || !node.parent.range){
    return;
  }

  const raw = token.value;
  const content = node.value.raw;

  const quotes = getQuotes(raw);
  const whitespaces = getWhitespace(content);
  const braces = getBracesByTemplateToken(ctx, token);

  return {
    ...whitespaces,
    ...quotes,
    ...braces,
    content,
    loc: node.loc,
    parent: node.parent as Node,
    range: node.range,
    raw,
    type: "TemplateLiteral"
  };

}

export function getLiteralsByESTemplateLiteral(ctx: Rule.RuleContext, node: ESTemplateLiteral): TemplateLiteral[] {
  return node.quasis.map(quasi => {
    if(!hasESNodeParentExtension(quasi)){
      return;
    }
    return getLiteralByESTemplateElement(ctx, quasi);
  }).filter((literal): literal is TemplateLiteral => literal !== undefined);
}

export interface ESSimpleStringLiteral extends Rule.NodeParentExtension, ESSimpleLiteral {
  value: string;
}

export function isESSimpleStringLiteral(node: ESBaseNode): node is ESSimpleStringLiteral {
  return node.type === "Literal" &&
    "value" in node &&
    typeof node.value === "string";
}

export function isESTemplateLiteral(node: ESBaseNode): node is ESTemplateLiteral {
  return node.type === "TemplateLiteral";
}

export function isESNode(node: unknown): node is ESNode {
  return node !== null &&
    typeof node === "object" &&
    "type" in node;
}

export function hasESNodeParentExtension(node: ESNode): node is Rule.Node & Rule.NodeParentExtension {
  return "parent" in node;
}

function getTokenByESNode(ctx: Rule.RuleContext, node: ESBaseNode) {
  return node.range?.[0]
    ? ctx.sourceCode.getTokenByRangeStart(node.range[0])
    : undefined;
}

function getBracesByTemplateToken(ctx: Rule.RuleContext, token: AST.Token): BracesMeta {
  const closingBraces = token.value.startsWith("}") ? "}" : undefined;
  const openingBraces = token.value.endsWith("${") ? "${" : undefined;

  return {
    closingBraces,
    openingBraces
  };
}
