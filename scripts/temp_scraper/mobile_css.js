const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. CSS Updates
const newCSS = `
    /* === Galaxy S24 Ultra & Mobile UI/UX Optimization === */
    .responsive-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .chip-container {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .chip-label {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .chip-label:has(input:checked) {
      background: var(--bg-gradient);
      color: var(--primary);
      border-color: var(--primary);
      font-weight: bold;
    }
    .chip-label input {
      margin: 0;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .responsive-grid {
        grid-template-columns: 1fr !important;
      }
      
      .tabs {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 5px;
        margin-bottom: 15px;
      }
      .tabs::-webkit-scrollbar {
        height: 4px;
      }
      .tabs::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .tab-btn {
        flex: 0 0 auto;
      }
      
      .mode-switch {
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }
      .mode-btn {
        flex: 1 1 calc(33.333% - 8px);
        font-size: 12px;
        padding: 8px 5px;
        text-align: center;
      }

      /* Reduce content grid minimum width for Galaxy S24 Ultra (viewport width ~412px) */
      #content-grid {
        grid-template-columns: 1fr !important; /* Force 1 column on mobile to use full width */
      }
      
      .splash-cards {
        flex-direction: column;
        align-items: stretch;
      }
      .splash-card {
        padding: 20px;
      }
      .splash-card h3 {
        font-size: 18px;
      }
      
      .form-group label {
        font-size: 13px;
      }
      .form-group input[type="text"], .form-group select, .form-group textarea {
        font-size: 16px; /* Prevents iOS auto-zoom, better readability on Android */
        padding: 12px 10px;
      }
    }
`;

if (!html.includes('/* === Galaxy S24 Ultra & Mobile UI/UX Optimization === */')) {
  html = html.replace('</style>', newCSS + '\n</style>');
}

// 2. HTML Replace: inline grids to responsive-grid
html = html.replace(/<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">/g, '<div class="responsive-grid" style="margin-bottom:20px;">');
html = html.replace(/<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">/g, '<div class="responsive-grid">');

// 3. HTML Replace: Chip labels for Tone and Channel
html = html.replace(/<div style="display:flex; gap:10px; flex-wrap:wrap;">/g, '<div class="chip-container">');
html = html.replace(/<label><input type="checkbox" /g, '<label class="chip-label"><input type="checkbox" ');
html = html.replace(/<label><input type="radio" /g, '<label class="chip-label"><input type="radio" ');

fs.writeFileSync('index.html', html);
console.log('Mobile UI/UX Optimization applied.');
