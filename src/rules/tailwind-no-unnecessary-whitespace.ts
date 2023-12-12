import { DEFAULT_CALLEE_NAMES, DEFAULT_CLASS_NAMES } from "eptm:utils:config.js";
import { getCallExpressionLiterals, getClassAttributeLiterals, getClassAttributes } from "eptm:utils:jsx.js";
import { splitClasses, splitWhitespace } from "eptm:utils:utils.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { ESLintRule } from "src/types/rule.js";

import type { Literals } from "eptm:utils:jsx.js";


export type Options = [
  {
    allowMultiline?: boolean;
    callees?: string[];
    classAttributes?: string[];
  }
];

export const tailwindNoUnnecessaryWhitespace: ESLintRule<Options> = {
  name: "no-unnecessary-whitespace" as const,
  rule: {
    create(ctx) {

      const { allowMultiline, callees } = getOptions(ctx);


      const lintLiterals = (ctx: Rule.RuleContext, literals: Literals, node: Node) => {

        for(const literal of literals){

          if(literal === undefined){ continue; }

          const classChunks = splitClasses(literal.content);
          const whitespaceChunks = splitWhitespace(literal.content);

          const classes: string[] = [];

          if(allowMultiline){
            for(let i = 0; i < Math.max(classChunks.length, whitespaceChunks.length); i++){
              if(whitespaceChunks[i] && whitespaceChunks[i].includes("\n")){

                if("closingBraces" in literal && literal.closingBraces && i === 0 && whitespaceChunks[i].length === 0 && classChunks[i]){ classes.push(" "); }
                classes.push(whitespaceChunks[i]);

                classChunks[i] && classes.push(classChunks[i]);

                if("openingBraces" in literal && literal.openingBraces && i === classChunks.length - 1 && classChunks[i]){ classes.push(" "); }

              } else {

                if("closingBraces" in literal && literal.closingBraces && i === 0 && classChunks[i]){ classes.push(" "); }

                if(classChunks[i] && i > 0){ classes.push(" "); }

                classChunks[i] && classes.push(classChunks[i]);

                if("openingBraces" in literal && literal.openingBraces && i === classChunks.length - 1 && classChunks[i]){ classes.push(" "); }

              }
            }
          } else {
            for(let i = 0; i < classChunks.length; i++){
              if(i > 0){ classes.push(" "); }
              classes.push(classChunks[i]);
            }
          }

          const fixedClasses = [
            literal.openingQuote ?? "",
            literal.type === "TemplateElement" && literal.closingBraces ? literal.closingBraces : "",
            ...classes,
            literal.type === "TemplateElement" && literal.openingBraces ? literal.openingBraces : "",
            literal.closingQuote ?? ""
          ].join("");

          if(literal.raw === fixedClasses){
            return;
          }

          ctx.report({
            data: {
              unnecessaryWhitespace: literal.content
            },
            fix(fixer) {
              return fixer.replaceText(literal, fixedClasses);
            },
            message: "Unnecessary whitespace: {{ unnecessaryWhitespace }}.",
            node
          });

        }

      };


      return {

        CallExpression(node) {

          const { callee } = node;

          if(callee.type !== "Identifier"){ return; }
          if(!callees.includes(callee.name)){ return; }

          const literals = getCallExpressionLiterals(ctx, node.arguments);

          lintLiterals(ctx, literals, node);

        },

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          const attributes = getClassAttributes(ctx, jsxNode);

          for(const attribute of attributes){
            const literals = getClassAttributeLiterals(ctx, attribute);
            lintLiterals(ctx, literals, node);
          }

        }

      };
    },
    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Disallow unnecessary whitespace in tailwind classes.",
        recommended: true
      },
      fixable: "whitespace",
      schema: [
        {
          additionalProperties: false,
          properties: {
            allowMultiline: {
              default: getOptions().allowMultiline,
              description: "Allow multi-line class declarations. If this option is disabled, template literal strings will be collapsed into a single line string wherever possible.",
              type: "boolean"
            },
            callees: {
              default: getOptions().callees,
              description: "List of function names whose arguments should also be considered.",
              items: {
                type: "string"
              },
              type: "array"
            },
            classAttributes: {
              items: {
                default: getOptions().classAttributes,
                description: "The name of the attribute that contains the tailwind classes.",
                type: "string"
              },
              type: "array"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};


function getOptions(ctx?: Rule.RuleContext) {

  const options: Options[0] = ctx?.options[0] ?? {};

  const classAttributes = options.classAttributes ?? DEFAULT_CLASS_NAMES;
  const allowMultiline = options.allowMultiline ?? true;
  const callees = options.callees ?? DEFAULT_CALLEE_NAMES;

  return {
    allowMultiline,
    callees,
    classAttributes
  };

}
