export function getPlaceholderDataUri(width = 400, height = 200, text = 'Anúncio') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%23CCCCCC'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666666' font-family='Arial, sans-serif' font-size='${Math.max(12, Math.floor(width / 20))}'>${text}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
