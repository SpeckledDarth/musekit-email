export const defaultBrand = {
  appName: 'MuseKit',
  primaryColor: '#3b6cff',
  supportEmail: 'support@musekit.app',
  websiteUrl: 'https://musekit.app',
};

export function emailWrapper(content: string, brand = defaultBrand): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${brand.appName}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f7;
      color: #333333;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a2e !important; color: #e0e0e0 !important; }
      .email-container { background-color: #16213e !important; }
      .email-header { background-color: ${brand.primaryColor} !important; }
      .email-body { background-color: #16213e !important; color: #e0e0e0 !important; }
      .email-footer { color: #a0a0a0 !important; }
      .text-muted { color: #a0a0a0 !important; }
      h1, h2, h3 { color: #ffffff !important; }
      p { color: #e0e0e0 !important; }
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .email-header {
      background-color: ${brand.primaryColor};
      padding: 32px 40px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 24px;
      margin: 0;
      font-weight: 700;
    }
    .email-body {
      padding: 40px;
    }
    .email-body h2 {
      font-size: 20px;
      margin: 0 0 16px;
      color: #333333;
    }
    .email-body p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px;
      color: #555555;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${brand.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 8px 0 24px;
    }
    .btn:hover { opacity: 0.9; }
    .text-muted {
      font-size: 14px;
      color: #999999;
    }
    .email-footer {
      padding: 24px 40px;
      text-align: center;
      font-size: 12px;
      color: #999999;
      border-top: 1px solid #eaeaea;
    }
    .kpi-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .kpi-table th, .kpi-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eaeaea;
    }
    .kpi-table th {
      font-weight: 600;
      color: #333333;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-table td {
      font-size: 16px;
    }
    .kpi-value {
      font-weight: 700;
      color: ${brand.primaryColor};
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div style="padding: 40px 20px;">
    <div class="email-container">
      <div class="email-header">
        <h1>${brand.appName}</h1>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>&copy; ${new Date().getFullYear()} ${brand.appName}. All rights reserved.</p>
        <p><a href="${brand.websiteUrl}" style="color: ${brand.primaryColor};">${brand.websiteUrl}</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
