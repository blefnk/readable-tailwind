import { getClassAttributeLiterals, isJSXAttribute } from "eptm:utils:jsx.js";

import type { Rule } from "eslint";
import type { Node } from "estree";
import type { JSXOpeningElement } from "estree-jsx";
import type { QuoteMeta } from "src/types/ast.js";
import type { ESLintRule } from "src/types/rule.js";


type Options = [{
  expression?: "always" | "as-needed";
}];

export const jsxAttributeExpression: ESLintRule<Options> = {
  name: "jsx-attribute-expression" as const,
  rule: {
    create(ctx) {

      return {

        JSXOpeningElement(node: Node) {

          const jsxNode = node as JSXOpeningElement;

          for(const attribute of jsxNode.attributes){

            if(!isJSXAttribute(attribute)){ continue; }

            const literals = getClassAttributeLiterals(ctx, attribute);

            if(literals.length !== 1){ continue; }

            const literal = literals[0]!;

            const attributeValue = attribute.value;
            const attributeName = attribute.name.name;

            if(!attributeValue){ continue; }
            if(typeof attributeName !== "string"){ continue; }
            if(literal.content.includes("\n")){ continue; }

            const { expression } = getOptions(ctx);
            const { closingQuote, openingQuote } = getAllowedQuotes(ctx, { closingQuote: literal.closingQuote, openingQuote: literal.openingQuote });

            const rawAttribute = attributeValue.type === "JSXExpressionContainer"
              ? `{${literal.raw}}`
              : literal.raw;

            const fixedAttribute = expression === "always"
              ? `{${literal.openingQuote}${literal.content}${literal.closingQuote}}`
              : `${openingQuote}${literal.content}${closingQuote}`;

            if(rawAttribute === fixedAttribute){
              continue;
            }

            ctx.report({
              data: {
                attributeName,
                rawAttribute
              },
              fix(fixer) {
                return fixer.replaceText(attributeValue, fixedAttribute);
              },
              message: "Invalid jsx attribute expression: {{ attributeName }}={{ rawAttribute }}.",
              node
            });

          }
        }

      };
    },

    meta: {
      docs: {
        category: "Stylistic Issues",
        description: "Enforce consistent jsx attribute expressions.",
        recommended: true
      },
      fixable: "code",
      schema: [
        {
          additionalProperties: false,
          properties: {
            expression: {
              default: getOptions().expression,
              description: "List of function names whose arguments should also be considered.",
              enum: ["always", "as-needed"],
              type: "string"
            }
          },
          type: "object"
        }
      ],
      type: "layout"
    }
  }
};

function getAllowedQuotes(ctx: Rule.RuleContext, preferredQuotes: QuoteMeta): QuoteMeta {
  const { openingQuote } = preferredQuotes;

  if(openingQuote === "'" || openingQuote === '"'){
    return { closingQuote: openingQuote, openingQuote };
  }

  return { closingQuote: '"', openingQuote: '"' };
}

function getOptions(ctx?: Rule.RuleContext) {
  const options: Options[0] = ctx?.options[0] ?? {};

  const expression = options.expression ?? "as-needed";

  return { expression };
}
