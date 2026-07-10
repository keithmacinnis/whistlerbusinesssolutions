// Minimal CSV parser for product catalog uploads. Handles quoted fields,
// escaped quotes, and CRLF. Returns { products, errors } where errors carry
// 1-based data-row numbers matching what the import API reports.
const HEADER_MAP = {
  name: 'name',
  description: 'description',
  imageurl: 'imageUrl',
  image_url: 'imageUrl',
  category: 'category',
  partnername: 'partnerName',
  partner_name: 'partnerName',
  partnerurl: 'partnerUrl',
  partner_url: 'partnerUrl',
  url: 'partnerUrl',
  price: 'priceCents',
  pricecents: 'priceCents',
  price_cents: 'priceCents',
  currency: 'currency',
  commissionpct: 'commissionPct',
  commission_pct: 'commissionPct',
  commission: 'commissionPct',
}

function parseRows(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

export function parseProductCsv(text) {
  const rows = parseRows(text)
  if (rows.length < 2) return { products: [], errors: [{ row: 0, error: 'CSV needs a header row and at least one data row' }] }

  const headers = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase().replace(/\s+/g, '')])
  if (!headers.includes('name') || !headers.includes('partnerUrl')) {
    return { products: [], errors: [{ row: 0, error: 'CSV must have "name" and "partnerUrl" (or "url") columns' }] }
  }

  const products = []
  const errors = []
  rows.slice(1).forEach((cells, i) => {
    const rowNum = i + 1
    const p = {}
    headers.forEach((key, col) => {
      if (!key) return
      const value = (cells[col] || '').trim()
      if (!value) return
      if (key === 'priceCents') {
        // Accept "49.99" (dollars) or plain integers of cents like "4999"
        const num = parseFloat(value.replace(/[$,]/g, ''))
        if (!Number.isNaN(num)) p.priceCents = value.includes('.') ? Math.round(num * 100) : Math.round(num)
      } else if (key === 'commissionPct') {
        const num = parseFloat(value.replace('%', ''))
        if (!Number.isNaN(num)) p.commissionPct = num
      } else {
        p[key] = value
      }
    })
    if (!p.name) errors.push({ row: rowNum, error: 'name is required' })
    else if (!p.partnerUrl) errors.push({ row: rowNum, error: 'partnerUrl is required' })
    else products.push(p)
  })
  return { products, errors }
}
