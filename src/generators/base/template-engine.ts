/**
 * Simple template engine that performs string interpolation without
 * requiring external dependencies like EJS or Handlebars.
 *
 * Supports:
 * - Variable substitution: {{variableName}}
 * - Conditional blocks: {{#if condition}}...{{/if}}
 * - Negative conditionals: {{#unless condition}}...{{/unless}}
 */

export type TemplateVars = Record<string, string | boolean | number | undefined>;

/**
 * Render a template string with variable substitution and conditional blocks.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  let result = template;

  // Process {{#if condition}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, varName: string, content: string) => {
      const value = vars[varName];
      return value ? content : '';
    },
  );

  // Process {{#unless condition}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, varName: string, content: string) => {
      const value = vars[varName];
      return value ? '' : content;
    },
  );

  // Process {{variableName}} substitutions
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_match, varName: string) => {
      const value = vars[varName];
      return value !== undefined ? String(value) : '';
    },
  );

  return result;
}

/**
 * Render a JSON template — parses the rendered template as JSON.
 */
export function renderJsonTemplate(template: string, vars: TemplateVars): string {
  const rendered = renderTemplate(template, vars);
  // Validate it's valid JSON, then re-format with consistent indentation
  const parsed = JSON.parse(rendered);
  return JSON.stringify(parsed, null, 2) + '\n';
}
