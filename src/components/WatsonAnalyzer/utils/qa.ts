// src/components/WatsonAnalyzer/utils/qa.ts
// Mini-QA utilities for pre-export validation

export function qaRowAmazon(row: any) {
  const issues: string[] = [];
  const bullets = ['gen_bullet_1','gen_bullet_2','gen_bullet_3','gen_bullet_4','gen_bullet_5'].map(k => (row[k] || '').trim());
  if (bullets.some(b => !b || b === '—')) issues.push('MissingBullets');
  const aplus = (row['gen_aplus_short'] || '').trim();
  if (!aplus) issues.push('MissingAplus');
  if (aplus.length > 300) issues.push('AplusTooLong');
  return issues;
}

export function qaBatchAmazon(rows: any[]) {
  const results = rows.map((row, index) => ({
    rowIndex: index,
    productId: row.vendor_sku || row.productId || `Row ${index + 1}`,
    issues: qaRowAmazon(row)
  }));
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const rowsWithIssues = results.filter(r => r.issues.length > 0);
  
  return {
    totalRows: rows.length,
    totalIssues,
    rowsWithIssues,
    summary: {
      missingBullets: results.filter(r => r.issues.includes('MissingBullets')).length,
      missingAplus: results.filter(r => r.issues.includes('MissingAplus')).length,
      aplusTooLong: results.filter(r => r.issues.includes('AplusTooLong')).length
    }
  };
}
