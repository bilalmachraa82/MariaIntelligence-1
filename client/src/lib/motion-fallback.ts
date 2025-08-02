import React from 'react';

// Fallback for AnimatePresence
export const AnimatePresence: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

// Fallback for motion components
const createMotionFallback = (Component: React.ElementType) => {
  return React.forwardRef<any, any>((props, ref) => {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      layoutId,
      ...rest
    } = props;
    return React.createElement(Component, { ref, ...rest });
  });
};

export const motion = {
  div: createMotionFallback('div'),
  span: createMotionFallback('span'),
  p: createMotionFallback('p'),
  h1: createMotionFallback('h1'),
  h2: createMotionFallback('h2'),
  h3: createMotionFallback('h3'),
  h4: createMotionFallback('h4'),
  h5: createMotionFallback('h5'),
  h6: createMotionFallback('h6'),
  button: createMotionFallback('button'),
  a: createMotionFallback('a'),
  ul: createMotionFallback('ul'),
  li: createMotionFallback('li'),
  img: createMotionFallback('img'),
  svg: createMotionFallback('svg'),
  path: createMotionFallback('path'),
  section: createMotionFallback('section'),
  form: createMotionFallback('form'),
  input: createMotionFallback('input'),
  textarea: createMotionFallback('textarea'),
  select: createMotionFallback('select'),
  option: createMotionFallback('option'),
  label: createMotionFallback('label'),
  table: createMotionFallback('table'),
  thead: createMotionFallback('thead'),
  tbody: createMotionFallback('tbody'),
  tr: createMotionFallback('tr'),
  td: createMotionFallback('td'),
  th: createMotionFallback('th'),
  nav: createMotionFallback('nav'),
  header: createMotionFallback('header'),
  footer: createMotionFallback('footer'),
  main: createMotionFallback('main'),
  aside: createMotionFallback('aside'),
  article: createMotionFallback('article'),
};