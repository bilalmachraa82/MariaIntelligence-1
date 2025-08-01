// Fallback for framer-motion during build
import * as React from 'react';

export const motion = {
  div: ({ children, className, ...props }) => {
    return React.createElement('div', { className, ...props }, children);
  },
  section: ({ children, className, ...props }) => {
    return React.createElement('section', { className, ...props }, children);
  },
  span: ({ children, className, ...props }) => {
    return React.createElement('span', { className, ...props }, children);
  },
  p: ({ children, className, ...props }) => {
    return React.createElement('p', { className, ...props }, children);
  },
  h1: ({ children, className, ...props }) => {
    return React.createElement('h1', { className, ...props }, children);
  },
  h2: ({ children, className, ...props }) => {
    return React.createElement('h2', { className, ...props }, children);
  },
  h3: ({ children, className, ...props }) => {
    return React.createElement('h3', { className, ...props }, children);
  },
  button: ({ children, className, ...props }) => {
    return React.createElement('button', { className, ...props }, children);
  }
};
