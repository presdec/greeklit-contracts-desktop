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
