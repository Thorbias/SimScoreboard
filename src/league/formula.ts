/**
 * The points formula of a league (ADR-0007): a small expression language with a
 * fixed vocabulary. It is parsed here and never handed to `eval`, so a formula
 * from a foreign file can do nothing but calculate.
 */

export const FORMULA_VARIABLES = [
  'position',
  'overallPosition',
  'starters',
  'fastestLap',
  'pole',
  'finished',
  'laps',
  'leaderLaps',
] as const;

export type FormulaVariable = (typeof FORMULA_VARIABLES)[number];
export type FormulaValues = Record<FormulaVariable, number>;

/** Allowed argument counts per function: [min, max]. */
const FUNCTIONS: Record<string, [number, number]> = {
  min: [1, 8],
  max: [1, 8],
  round: [1, 1],
  floor: [1, 1],
  ceil: [1, 1],
  abs: [1, 1],
  if: [3, 3],
};

export class FormulaError extends Error {
  /** Zero-based character position in the formula text. */
  readonly position: number;
  constructor(message: string, position: number) {
    super(message);
    this.name = 'FormulaError';
    this.position = position;
  }
}

type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: FormulaVariable }
  | { type: 'neg'; arg: Node }
  | { type: 'not'; arg: Node }
  | { type: 'bin'; op: string; left: Node; right: Node; position: number }
  | { type: 'call'; name: string; args: Node[] };

interface Token {
  kind: 'num' | 'id' | 'op' | 'end';
  text: string;
  position: number;
}

const OPERATORS = [
  '<=',
  '>=',
  '==',
  '!=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '(',
  ')',
  ',',
];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (/\s/.test(ch)) {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^(\d+(\.\d+)?|\.\d+)/.exec(source.slice(i));
      if (!match) throw new FormulaError(`Unexpected "${ch}"`, i);
      tokens.push({ kind: 'num', text: match[0], position: i });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(
        source.slice(i),
      ) as RegExpExecArray;
      tokens.push({ kind: 'id', text: match[0], position: i });
      i += match[0].length;
    } else {
      const op = OPERATORS.find((o) => source.startsWith(o, i));
      if (!op) throw new FormulaError(`Unexpected "${ch}"`, i);
      tokens.push({ kind: 'op', text: op, position: i });
      i += op.length;
    }
  }
  tokens.push({ kind: 'end', text: '', position: source.length });
  return tokens;
}

class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.index] as Token;
  }
  private next(): Token {
    const token = this.peek();
    if (token.kind !== 'end') this.index += 1;
    return token;
  }
  private isOp(text: string): boolean {
    const token = this.peek();
    return token.kind === 'op' && token.text === text;
  }
  private isWord(text: string): boolean {
    const token = this.peek();
    return token.kind === 'id' && token.text === text;
  }
  private expectOp(text: string): void {
    if (!this.isOp(text)) {
      const token = this.peek();
      throw new FormulaError(
        token.kind === 'end'
          ? `Expected "${text}" at the end`
          : `Expected "${text}" but found "${token.text}"`,
        token.position,
      );
    }
    this.next();
  }

  parse(): Node {
    if (this.peek().kind === 'end') {
      throw new FormulaError('The formula is empty', 0);
    }
    const node = this.parseOr();
    const token = this.peek();
    if (token.kind !== 'end') {
      throw new FormulaError(`Unexpected "${token.text}"`, token.position);
    }
    return node;
  }

  private parseOr(): Node {
    let left = this.parseAnd();
    while (this.isWord('or')) {
      const position = this.next().position;
      left = { type: 'bin', op: 'or', left, right: this.parseAnd(), position };
    }
    return left;
  }

  private parseAnd(): Node {
    let left = this.parseNot();
    while (this.isWord('and')) {
      const position = this.next().position;
      left = { type: 'bin', op: 'and', left, right: this.parseNot(), position };
    }
    return left;
  }

  private parseNot(): Node {
    if (this.isWord('not')) {
      this.next();
      return { type: 'not', arg: this.parseNot() };
    }
    return this.parseComparison();
  }

  private parseComparison(): Node {
    const left = this.parseSum();
    const token = this.peek();
    if (
      token.kind === 'op' &&
      ['<', '<=', '>', '>=', '==', '!='].includes(token.text)
    ) {
      this.next();
      return {
        type: 'bin',
        op: token.text,
        left,
        right: this.parseSum(),
        position: token.position,
      };
    }
    return left;
  }

  private parseSum(): Node {
    let left = this.parseProduct();
    for (;;) {
      const token = this.peek();
      if (token.kind === 'op' && (token.text === '+' || token.text === '-')) {
        this.next();
        left = {
          type: 'bin',
          op: token.text,
          left,
          right: this.parseProduct(),
          position: token.position,
        };
      } else {
        return left;
      }
    }
  }

  private parseProduct(): Node {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (
        token.kind === 'op' &&
        (token.text === '*' || token.text === '/' || token.text === '%')
      ) {
        this.next();
        left = {
          type: 'bin',
          op: token.text,
          left,
          right: this.parseUnary(),
          position: token.position,
        };
      } else {
        return left;
      }
    }
  }

  private parseUnary(): Node {
    if (this.isOp('-')) {
      this.next();
      return { type: 'neg', arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const token = this.next();
    if (token.kind === 'num') return { type: 'num', value: Number(token.text) };
    if (token.kind === 'op' && token.text === '(') {
      const node = this.parseOr();
      this.expectOp(')');
      return node;
    }
    if (token.kind === 'id') {
      if (this.isOp('(')) return this.parseCall(token);
      if ((FORMULA_VARIABLES as readonly string[]).includes(token.text)) {
        return { type: 'var', name: token.text as FormulaVariable };
      }
      throw new FormulaError(`Unknown name "${token.text}"`, token.position);
    }
    throw new FormulaError(
      token.kind === 'end'
        ? 'The formula ends too early'
        : `Unexpected "${token.text}"`,
      token.position,
    );
  }

  private parseCall(name: Token): Node {
    const range = FUNCTIONS[name.text];
    if (!range) {
      throw new FormulaError(`Unknown function "${name.text}"`, name.position);
    }
    this.expectOp('(');
    const args: Node[] = [];
    if (!this.isOp(')')) {
      args.push(this.parseOr());
      while (this.isOp(',')) {
        this.next();
        args.push(this.parseOr());
      }
    }
    this.expectOp(')');
    const [min, max] = range;
    if (args.length < min || args.length > max) {
      const wanted = min === max ? `${min}` : `${min} to ${max}`;
      throw new FormulaError(
        `"${name.text}" takes ${wanted} arguments, not ${args.length}`,
        name.position,
      );
    }
    return { type: 'call', name: name.text, args };
  }
}

function evaluate(node: Node, values: FormulaValues): number {
  switch (node.type) {
    case 'num':
      return node.value;
    case 'var':
      return values[node.name];
    case 'neg':
      return -evaluate(node.arg, values);
    case 'not':
      return evaluate(node.arg, values) === 0 ? 1 : 0;
    case 'bin': {
      const a = evaluate(node.left, values);
      if (node.op === 'and')
        return a !== 0 && evaluate(node.right, values) !== 0 ? 1 : 0;
      if (node.op === 'or')
        return a !== 0 || evaluate(node.right, values) !== 0 ? 1 : 0;
      const b = evaluate(node.right, values);
      switch (node.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
        case '%':
          if (b === 0)
            throw new FormulaError('Division by zero', node.position);
          return node.op === '/' ? a / b : a % b;
        case '<':
          return a < b ? 1 : 0;
        case '<=':
          return a <= b ? 1 : 0;
        case '>':
          return a > b ? 1 : 0;
        case '>=':
          return a >= b ? 1 : 0;
        case '==':
          return a === b ? 1 : 0;
        default:
          return a !== b ? 1 : 0;
      }
    }
    case 'call': {
      if (node.name === 'if') {
        const [condition, then, otherwise] = node.args as [Node, Node, Node];
        return evaluate(condition, values) !== 0
          ? evaluate(then, values)
          : evaluate(otherwise, values);
      }
      const args = node.args.map((arg) => evaluate(arg, values));
      switch (node.name) {
        case 'min':
          return Math.min(...args);
        case 'max':
          return Math.max(...args);
        case 'round':
          return Math.round(args[0] as number);
        case 'floor':
          return Math.floor(args[0] as number);
        case 'ceil':
          return Math.ceil(args[0] as number);
        default:
          return Math.abs(args[0] as number);
      }
    }
  }
}

export type CompiledFormula = (values: FormulaValues) => number;

/** Parses the formula; throws a `FormulaError` with the position of the problem. */
export function compileFormula(source: string): CompiledFormula {
  const ast = new Parser(tokenize(source)).parse();
  return (values) => evaluate(ast, values);
}

export type FormulaCheck =
  { ok: true } | { ok: false; message: string; position: number };

/** Checks a formula without throwing, e.g. for the input field. */
export function checkFormula(source: string): FormulaCheck {
  try {
    compileFormula(source);
    return { ok: true };
  } catch (error) {
    if (error instanceof FormulaError) {
      return { ok: false, message: error.message, position: error.position };
    }
    throw error;
  }
}
