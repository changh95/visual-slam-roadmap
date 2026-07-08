import { visit } from 'unist-util-visit';

/** Render `$$…$$` written on a single line as display math (centered block),
 * matching GitHub's behaviour. remark-math parses it as inline math because
 * the closing fence shares the opening line, so without this the same
 * equation is centered or not depending on how the fences were wrapped. */
export default function remarkDisplayDollars() {
  return (tree, file) => {
    const src = String(file.value ?? '');
    if (!src) return;
    visit(tree, 'inlineMath', (node) => {
      const start = node.position?.start?.offset;
      if (start == null || !src.startsWith('$$', start)) return;
      node.data = node.data ?? {};
      node.data.hProperties = {
        ...node.data.hProperties,
        className: ['language-math', 'math-display'],
      };
    });
  };
}
