export function extractTokens(value: string) {
  const matches = value.match(/{{[^}]+}}/g) ?? [];
  return [...new Set(matches)];
}

export function tokenName(token: string) {
  return token.replace(/[{}]/g, '');
}

export function renderTemplate(value: string, sampleValues: Record<string, string>) {
  return value.replace(/{{([^}]+)}}/g, (_match, field: string) => {
    return sampleValues[field] ?? `{{${field}}}`;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function plainTextToHtml(value: string) {
  const normalized = value.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return '<p></p>';
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) =>
      `<p>${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`)
    .join('');
}

export function normalizeEmailBody(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '<p></p>';
  }

  return /<[^>]+>/.test(trimmed) ? value : plainTextToHtml(value);
}

export function renderTemplateHtml(value: string, sampleValues: Record<string, string>) {
  return value.replace(/{{([^}]+)}}/g, (_match, field: string) => {
    const replacement = sampleValues[field];
    return replacement ? escapeHtml(replacement) : `{{${field}}}`;
  });
}

export function usageForVariable(
  variable: string,
  emailVariables: string[],
  contractVariables: string[],
) {
  const usedInEmail = emailVariables.includes(variable);
  const usedInContract = contractVariables.includes(variable);

  if (usedInEmail && usedInContract) {
    return 'both' as const;
  }
  if (usedInEmail) {
    return 'email' as const;
  }
  if (usedInContract) {
    return 'contract' as const;
  }
  return 'unused' as const;
}
