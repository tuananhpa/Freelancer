import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      indentSize: 24, // px
      maxIndent: 240, // px
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const textIndent = element.style.textIndent;
              if (textIndent) {
                return parseInt(textIndent, 10);
              }
              return 0;
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }
              return {
                style: `text-indent: ${attributes.indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        let trUpdated = tr.setSelection(selection);
        
        let changed = false;
        const { doc } = trUpdated;
        const { from, to } = selection;
        
        doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            let indent = node.attrs.indent || 0;
            indent += this.options.indentSize;
            if (indent > this.options.maxIndent) indent = this.options.maxIndent;
            trUpdated = trUpdated.setNodeMarkup(pos, node.type, { ...node.attrs, indent });
            changed = true;
          }
        });

        if (changed && dispatch) {
          dispatch(trUpdated);
          return true;
        }
        return false;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        let trUpdated = tr.setSelection(selection);
        
        let changed = false;
        const { doc } = trUpdated;
        const { from, to } = selection;
        
        doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            let indent = node.attrs.indent || 0;
            indent -= this.options.indentSize;
            if (indent < 0) indent = 0;
            trUpdated = trUpdated.setNodeMarkup(pos, node.type, { ...node.attrs, indent });
            changed = true;
          }
        });

        if (changed && dispatch) {
          dispatch(trUpdated);
          return true;
        }
        return false;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});
