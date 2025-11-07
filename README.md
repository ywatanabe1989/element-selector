# 🔍 Element Inspector

<div align="center">

![Demo](docs/demo.gif)

**Visual debugging tool for web developers**
Press `Alt+I` to inspect any element on any webpage

[🎮 Try Demo](https://YOUR-USERNAME.github.io/element-inspector/demo.html) • [📦 Install](#-quick-start) • [📖 Docs](#-features)

</div>

---

## ✨ Features

- 🎨 **Color-coded visualization** - Elements colored by nesting depth
- 📋 **One-click debug info** - Click any label to copy comprehensive debug data for AI
- 📸 **Full page capture** - Press `Alt+C` to export entire page structure
- 🔲 **Rectangle selection** - Press `Ctrl+Alt+I` to select multiple elements at once
- 🤖 **AI-ready output** - All debug info formatted for pasting into Claude/ChatGPT

## ⌨️ Keyboard Shortcuts

| Shortcut     | Action                         |
|--------------|--------------------------------|
| `Alt+I`      | Toggle inspector overlay       |
| `Alt+C`      | Copy full page structure       |
| `Ctrl+Alt+I` | Start rectangle selection mode |
| `Esc`        | Cancel selection mode          |

## 🚀 Quick Start

### Option 1: Bookmarklet (Easiest - No Installation!)

1. Visit [demo.html](demo.html)
2. Drag the **🔍 Element Inspector** button to your bookmarks bar
3. Click it on any website to activate

### Option 2: Include in Your Project

```html
<script src="element-inspector.js"></script>
```

### Option 3: Browser Console

Paste this on any webpage:
```javascript
var s=document.createElement('script');
s.src='https://YOUR-USERNAME.github.io/element-inspector/element-inspector.js';
document.head.appendChild(s);
```

## 💡 Use Cases

- Debug CSS layout issues
- Find elements for web scraping
- Generate element reports for AI assistance
- Visual inspection of DOM structure
- Quick CSS selector generation

## 💖 Support

If this tool saved you debugging time:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/ywatanabe)

## 📄 License

MIT - Do whatever you want with it

---

Made by a developer who got tired of console.log debugging

<!-- EOF -->