import nunjucks from 'nunjucks';
import { NunjucksFilterMap } from '../types';

export function getNunjucksEngine(filters?: NunjucksFilterMap) {
  if (process.env.PROMPTFOO_DISABLE_TEMPLATING) {
    return {
      renderString: (template: string) => template,
    };
  }

  const env = nunjucks.configure({
    autoescape: false,
  });

  if (filters) {
    for (const [name, filter] of Object.entries(filters)) {
      env.addFilter(name, filter);
    }
  }
  return env;
}

export function safeJsonStringify(value: any, prettyPrint: boolean = false): string {
  // Prevent circular references
  const cache = new Set();
  const space = prettyPrint ? 2 : undefined;
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (cache.has(val)) return;
        cache.add(val);
      }
      return val;
    },
    space,
  );
}

export function renderVarsInObject<T>(obj: T, vars?: Record<string, string | object>): T {
  // Renders nunjucks template strings with context variables
  if (!vars || process.env.PROMPTFOO_DISABLE_TEMPLATING) {
    return obj;
  }
  if (typeof obj === 'string') {
    return nunjucks.renderString(obj, vars) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => renderVarsInObject(item, vars)) as unknown as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = renderVarsInObject((obj as Record<string, unknown>)[key], vars);
    }
    return result as T;
  } else if (typeof obj === 'function') {
    const fn = obj as Function;
    return renderVarsInObject(fn({ vars }) as T);
  }
  return obj;
}
