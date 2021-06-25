import generate from '@babel/generator';
import t = require('@babel/types');
import invariant = require('invariant');
import { CSSProperties, getRulesForStyleProps } from 'jsxstyle-utils';

import { StylesByClassName } from '../getStylesByClassName';

export interface Ternary {
  name: string;
  test: t.Expression | t.ExpressionStatement;
  consequent: string | null;
  alternate: string | null;
}

export function extractStaticTernaries(
  ternaries: Ternary[],
  getClassName: (key: string) => string
): {
  /** styles to be extracted */
  stylesByClassName: StylesByClassName;
  /** ternaries grouped into one binary expression */
  ternaryExpression: t.BinaryExpression | t.ConditionalExpression;
} | null {
  invariant(
    Array.isArray(ternaries),
    'extractStaticTernaries expects param 1 to be an array of ternaries'
  );

  if (ternaries.length === 0) {
    return null;
  }

  const ternariesByKey: Record<
    string,
    {
      test: t.Expression;
      consequentStyles: CSSProperties;
      alternateStyles: CSSProperties;
    }
  > = {};
  for (let idx = -1, len = ternaries.length; ++idx < len; ) {
    const { name, test, consequent, alternate } = ternaries[idx];

    let ternaryTest = test;

    // strip parens
    if (t.isExpressionStatement(test)) {
      ternaryTest = test.expression;
    }

    // convert `!thing` to `thing` with swapped consequent and alternate
    let shouldSwap = false;
    if (t.isUnaryExpression(test) && test.operator === '!') {
      ternaryTest = test.argument;
      shouldSwap = true;
    } else if (t.isBinaryExpression(test)) {
      if (test.operator === '!==') {
        ternaryTest = t.binaryExpression('===', test.left, test.right);
        shouldSwap = true;
      } else if (test.operator === '!=') {
        ternaryTest = t.binaryExpression('==', test.left, test.right);
        shouldSwap = true;
      }
    }

    const key = generate(ternaryTest).code;
    ternariesByKey[key] = ternariesByKey[key] || {
      alternateStyles: {},
      consequentStyles: {},
      test: ternaryTest,
    };
    ternariesByKey[key].consequentStyles[name] = shouldSwap
      ? alternate
      : consequent;
    ternariesByKey[key].alternateStyles[name] = shouldSwap
      ? consequent
      : alternate;
  }

  const stylesByClassName: StylesByClassName = {};

  const ternaryExpression = Object.keys(ternariesByKey)
    .map((key, idx) => {
      const { test, consequentStyles, alternateStyles } = ternariesByKey[key];
      const consequentClassName =
        getRulesForStyleProps(consequentStyles, getClassName)?.className || '';
      const alternateClassName =
        getRulesForStyleProps(alternateStyles, getClassName)?.className || '';

      if (!consequentClassName && !alternateClassName) {
        return null;
      }

      if (consequentClassName) {
        stylesByClassName[consequentClassName] = consequentStyles;
      }

      if (alternateClassName) {
        stylesByClassName[alternateClassName] = alternateStyles;
      }

      if (consequentClassName && alternateClassName) {
        if (idx > 0) {
          // if it's not the first ternary, add a leading space
          return t.binaryExpression(
            '+',
            t.stringLiteral(' '),
            t.conditionalExpression(
              test,
              t.stringLiteral(consequentClassName),
              t.stringLiteral(alternateClassName)
            )
          );
        } else {
          return t.conditionalExpression(
            test,
            t.stringLiteral(consequentClassName),
            t.stringLiteral(alternateClassName)
          );
        }
      } else {
        // if only one className is present, put the padding space inside the ternary
        return t.conditionalExpression(
          test,
          t.stringLiteral(
            (idx > 0 && consequentClassName ? ' ' : '') + consequentClassName
          ),
          t.stringLiteral(
            (idx > 0 && alternateClassName ? ' ' : '') + alternateClassName
          )
        );
      }
    })
    .filter(Boolean)
    .reduce(
      (acc, val) => (acc && val ? t.binaryExpression('+', acc, val) : val),
      null
    );

  if (!ternaryExpression) {
    return null;
  }

  return { stylesByClassName, ternaryExpression };
}
