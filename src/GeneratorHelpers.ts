import * as ts from 'typescript';
import * as sast from "ts-simple-ast";
import {Context} from "./Context";

export function emitStatic(source: string[], text: string, node: sast.Node, context: Context): void {
  addWhitespace(source, node, context);
  source.push(text);
  context.offset += text.length;
}

const whitespaces = /^([ \f\n\r\t\v\u0085\u00A0\u2028\u2029\u3000]+)/;
export function addWhitespace(source: string[], node: sast.Node, context: Context): void;
export function addWhitespace(source: string[], pos: number, node: sast.Node, context: Context): void;
// tslint:disable-next-line:cyclomatic-complexity
export function addWhitespace(source: string[], posOrNode: number|sast.Node, nodeOrContext: sast.Node|Context,
  optionalContext?: Context): void {
  const context = optionalContext || (nodeOrContext as Context);
  const node = optionalContext ? nodeOrContext as sast.Node : posOrNode as sast.Node;
  const pos = optionalContext ? posOrNode as number : node.getFullStart();

  if (context.offset > node.getEnd()) {
    return;
  }

  if (context.offset <= node.getFullStart()) {
    const text = node.getSourceFile().getFullText().substring(pos, node.getEnd());
    const leadingWhitespace = text.match(whitespaces);
    if (leadingWhitespace) {
      context.offset = pos + leadingWhitespace[1].length;
      source.push(leadingWhitespace[1]);
    }
  } else {
    const text = node.getSourceFile().getFullText().substring(context.offset, node.getEnd());
    const trailingWhitespace = text.match(whitespaces);
    if (trailingWhitespace) {
      context.offset = context.offset + trailingWhitespace[1].length;
      source.push(trailingWhitespace[1]);
    }
  }
}

export function addLeadingComment(source: string[], node: sast.Node, context: Context): void;
export function addLeadingComment(source: string[], pos: number, node: sast.Node, context: Context): void;
export function addLeadingComment(source: string[], posOrNode: number|sast.Node, nodeOrContext: sast.Node|Context,
    optionalContext?: Context): void {
  const context = optionalContext || (nodeOrContext as Context);
  const node = optionalContext ? nodeOrContext as sast.Node : posOrNode as sast.Node;
  const pos = optionalContext ? posOrNode as number : node.getFullStart();

  const text = node.getSourceFile().getFullText();
  const ranges = ts.getLeadingCommentRanges(text, pos);
  if (ranges) {
    source.push(ranges
      .map(range => {
        if (context.offset <= range.pos) {
          const prefix = text.substring(context.offset, range.pos);
          const comment = prefix + text.substring(range.pos, range.end);
          context.offset += comment.length;
          return comment;
        }
        return '';
      })
      .join(''));
  }
}

export function addTrailingComment(source: string[], node: sast.Node, context: Context): void;
export function addTrailingComment(source: string[], pos: number, node: sast.Node, context: Context): void;
export function addTrailingComment(source: string[], posOrNode: number|sast.Node, nodeOrContext: sast.Node|Context,
    optionalContext?: Context): void {
  var context = optionalContext || (nodeOrContext as Context);
  const node = optionalContext ? nodeOrContext as sast.Node : posOrNode as sast.Node;
  const pos = optionalContext ? posOrNode as number : node.getEnd();

  const text = node.getSourceFile().getFullText();
  const ranges = ts.getTrailingCommentRanges(text, pos);
  if (ranges) {
    source.push(ranges
      .map(range => {
        if (context.offset <= range.pos) {
          const prefix = text.substring(context.offset, range.pos);
          const comment = prefix + text.substring(range.pos, range.end);
          context.offset += comment.length;
          return comment;
        }
        return '';
      })
      .join(''));
  }
  
}

export function addSemicolon(source: string[], node: sast.Node, context: Context): void {
  
  if (node.getSourceFile().getFullText().substring(context.offset).trim().startsWith(';')) {
    emitStatic(source, ';', node, context);
  }
}

export function addComma(source: string[], node: sast.Node, context: Context): void {
  if (node.getSourceFile().getFullText().substring(context.offset).trim().startsWith(',')) {
    emitStatic(source, ',', node, context);
  }
}

export function endNode(node: sast.Node, context: Context): void {
  const end = node.getEnd();
  if (context.offset < end) {
    context.offset = end;
  }
}
