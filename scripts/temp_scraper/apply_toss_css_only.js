const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const tossCSS = `
  /* Toss-like UI Tokens */
  :root {
    --r-1: 8px;
    --r-2: 12px;
    --r-3: 16px;
    --r-4: 24px;
    --r-pill: 9999px;
    --shadow-card: 0 8px 24px rgba(0,0,0,0.06);
    --shadow-float: 0 12px 32px rgba(0,0,0,0.12);
    --input-bg: #f8fafc;
    --input-border: #e2e8f0;
  }

  /* Override inline styles via !important for cards */
  div[style*="border-radius:12px"], 
  div[style*="border-radius: 12px"],
  div[style*="border-radius:8px"], 
  div[style*="border-radius: 8px"] {
    border-radius: var(--r-3) !important;
    box-shadow: var(--shadow-card) !important;
    border: none !important;
    transition: transform 0.2s, box-shadow 0.2s !important;
  }
  
  div[style*="border-radius:12px"]:hover,
  div[style*="border-radius: 12px"]:hover,
  div[style*="border-radius:8px"]:hover,
  div[style*="border-radius: 8px"]:hover {
    transform: translateY(-2px) !important;
    box-shadow: var(--shadow-float) !important;
  }

  /* Override inputs */
  input[type="text"], input[type="password"], input[type="number"], select, textarea {
    background: var(--input-bg) !important;
    border: 1px solid var(--input-border) !important;
    border-radius: var(--r-2) !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    transition: all 0.2s !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
  }
  input:focus, select:focus, textarea:focus {
    background: #fff !important;
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important;
    outline: none !important;
  }

  /* Override Tabs to look like segmented controls */
  .tabs {
    display: flex !important;
    gap: 8px !important;
    background: var(--gray-100) !important;
    padding: 6px !important;
    border-radius: var(--r-pill) !important;
    overflow-x: auto !important;
    margin-bottom: 24px !important;
    border-bottom: none !important;
  }
  .tab-btn {
    flex: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: transparent !important;
    border: none !important;
    border-radius: var(--r-pill) !important;
    color: var(--gray-500) !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    padding: 10px 20px !important;
    margin: 0 !important;
    transition: all 0.2s !important;
  }
  .tab-btn.active {
    background: #fff !important;
    color: var(--black) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
  }
  
  /* Make buttons pop */
  .btn, .pulse-btn {
    border-radius: var(--r-pill) !important;
    font-weight: 700 !important;
    letter-spacing: -0.3px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
    transition: all 0.2s ease !important;
  }
  .btn:hover, .pulse-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
  }
`;

html = html.replace('</style>', `\n${tossCSS}\n</style>`);
fs.writeFileSync('index.html', html);
console.log("Safe CSS applied");
