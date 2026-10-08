// JSON writer: pretty down to `depth`, one line per value below it. Keeps spec files diffable
// (one primitive, one pose or one frame per line) without paying for full indentation.
export function stringify(value, depth = 3, indent = '') {
  if (depth <= 0 || value === null || typeof value !== 'object') return JSON.stringify(value);
  const next = indent + '  ';
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return '[\n' + value.map(v => next + stringify(v, depth - 1, next)).join(',\n') + '\n' + indent + ']';
  }
  const keys = Object.keys(value).filter(k => value[k] !== undefined);
  if (!keys.length) return '{}';
  return '{\n' + keys.map(k => next + JSON.stringify(k) + ': ' + stringify(value[k], depth - 1, next)).join(',\n') + '\n' + indent + '}';
}
