import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Block, cache, Col, InlineBlock, Row } from 'jsxstyle';

import './polyfills';

const reactVersion = require('react/package').version;
const reactDomVersion = require('react-dom/package').version;

describe('jsxstyle', () => {
  const node = document.createElement('div');
  // element has to be in the page for getComputedStyle to work
  document.body.appendChild(node);

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
    cache.reset();
  });

  it('does the thing', () => {
    const id = 'jsxstyle-test';

    console.info(`React ${reactVersion}, ReactDOM ${reactDomVersion}`);

    expect(() => {
      ReactDOM.render(
        <Col>
          <Row>
            <Block
              component="a"
              props={{ id, href: '#wow' }}
              color="blue"
              placeholderColor="red"
              hoverColor="orange"
              activeColor="purple"
              // @ts-expect-error
              activePlaceholderColor="cyan"
              flex={1}
              width={2 / 3}
              maxWidth={600}
            >
              <InlineBlock>Neat!</InlineBlock>
            </Block>
          </Row>
        </Col>,
        node,
        () => {
          const item = document.getElementById(id);
          expect(item!.getAttribute('class')).toEqual(
            '_14fght8 _19gs3g1 _1mb383g _1qo33y1 _2qghku _cmecz0 _fo6t74 _g2v7xg _tx589f'
          );

          const style = window.getComputedStyle(item!);
          const styleObj: Record<string, string> = {};
          for (let idx = -1, len = style.length; ++idx < len; ) {
            const k = style[idx];
            styleObj[k] = style.getPropertyValue(k);
          }
          expect(styleObj).toEqual(
            jasmine.objectContaining({
              color: 'rgb(0, 0, 255)',
              'max-width': '600px',
            })
          );
        }
      );
    }).not.toThrow();
  });
});
