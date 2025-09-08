/**
 * Safe math expression parser to replace eval() for better performance and security
 * Supports basic arithmetic operations: +, -, *, /
 */

interface Token {
  type: 'number' | 'operator';
  value: string | number;
}

// Tokenize the expression
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (/[0-9.]/.test(char)) {
      current += char;
    } else if (/[+\-*/]/.test(char)) {
      if (current) {
        tokens.push({ type: 'number', value: parseFloat(current) });
        current = '';
      }
      tokens.push({ type: 'operator', value: char });
    }
  }
  
  if (current) {
    tokens.push({ type: 'number', value: parseFloat(current) });
  }
  
  return tokens;
}

// Evaluate the tokenized expression using proper order of operations
function evaluateTokens(tokens: Token[]): number {
  if (tokens.length === 0) return 0;
  if (tokens.length === 1 && tokens[0].type === 'number') {
    return tokens[0].value as number;
  }
  
  // Handle multiplication and division first (higher precedence)
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === 'operator' && (tokens[i].value === '*' || tokens[i].value === '/')) {
      const left = tokens[i - 1].value as number;
      const operator = tokens[i].value as string;
      const right = tokens[i + 1].value as number;
      
      let result: number;
      if (operator === '*') {
        result = left * right;
      } else {
        result = right === 0 ? 0 : left / right; // Prevent division by zero
      }
      
      // Replace the three tokens with the result
      tokens.splice(i - 1, 3, { type: 'number', value: result });
      i = i - 1;
    } else {
      i++;
    }
  }
  
  // Handle addition and subtraction (lower precedence)
  i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === 'operator' && (tokens[i].value === '+' || tokens[i].value === '-')) {
      const left = tokens[i - 1].value as number;
      const operator = tokens[i].value as string;
      const right = tokens[i + 1].value as number;
      
      const result = operator === '+' ? left + right : left - right;
      
      // Replace the three tokens with the result
      tokens.splice(i - 1, 3, { type: 'number', value: result });
      i = i - 1;
    } else {
      i++;
    }
  }
  
  return tokens.length === 1 ? tokens[0].value as number : 0;
}

/**
 * Safely evaluate a mathematical expression
 * @param expression String containing mathematical expression (e.g., "5+3*2")
 * @returns The result of the calculation, or 0 if invalid
 */
export function safeMathEval(expression: string): number {
  try {
    // Clean the expression - remove spaces and validate characters
    const cleanExpression = expression.replace(/\s/g, '');
    
    // Only allow numbers, operators, and decimal points
    if (!/^[0-9+\-*/.]+$/.test(cleanExpression)) {
      return 0;
    }
    
    // Don't allow consecutive operators or operators at start/end
    if (/[+\-*/]{2,}|^[+*/]|[+\-*/]$/.test(cleanExpression)) {
      return 0;
    }
    
    const tokens = tokenize(cleanExpression);
    const result = evaluateTokens(tokens);
    
    return isNaN(result) ? 0 : result;
  } catch (error) {
    console.warn('Math evaluation error:', error);
    return 0;
  }
}