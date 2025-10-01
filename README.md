# 🎯 Chrome Extension AI Visual Editor

A Chrome extension that turns any web page into a visual editor. Select elements by clicking and dragging, describe the changes you want to make, and the AI will modify the HTML automatically.

Video: https://youtu.be/m6SopePV5l0

## ✨ Features

- **Visual Selection**: Drag the mouse over any element to select it
- **AI Editing**: Integration with Google Gemini to modify elements using natural language
- **Works anywhere**: Compatible with all web pages
- **Intuitive interface**: Floating dialog to easily describe changes
- **Persistent mode**: Keep selection mode active for multiple edits

## 🚀 Installation

### Installation steps

1. **Clone or download the project**
   ```bash
   git clone https://github.com/HaroPardo/chrome-AI-API.git
Set up the extension in Chrome

Open chrome://extensions/

Activate "Developer Mode" (upper right corner)

Click "Load unzipped extension"

Select the project's chrome-extension folder

Configure your Gemini API key

Click the extension icon on the toolbar

Enter your Google Gemini API key

Click "Save API Key"

## 🛠️ Configuration
Getting API Key
Go to Google AI Studio

Sign in with your Google account

Click "Get API Key" or "Create API Key"

Copy the generated key

Paste it into the extension settings

Permits required
The extension needs:

activeTab: To access the current tab

scripting: To inject content scripts

storage: To save your API key and preferences

host_permissions: To work on all websites

## 💡 How to use
Activate selection mode

Click the extension icon

Activate "Selection Mode"

Select elements

Drag the mouse over any element on the page

Items will be highlighted in blue when selected

Describe changes

A floating dialog will appear

Describe the changes you want to make

Example:

"Change the text to 'Hello World'"

Apply changes

Send to AI: Use Gemini to modify the HTML automatically

Edit directly: Apply basic changes directly

## 🏗️ Project structure

text
chrome-extension/
├── manifest.json          # Extension settings
├── background.js          # Service worker and communication with API
├── contentScript.js       # Script that is injected into the pages
├── contentScript.ts       # TypeScript source code
├── popup.html            # Popup interface
├── popup.js              # Popup logic
├── contentStyles.css     # Styles for the visual interface
└── dist/                 # Compiled files (TypeScript → JavaScript)
## 🔧 Development
Development requirements
Node.js and npm

TypeScript (optional, for development)

Compile TypeScript
bash
cd chrome-extension
npm install
npx tsc
Main file structure
manifest.json: Extension configuration with permissions and scripts

contentScript.ts: Main logic for visual selection and element modification

background.js: Handles calls to the Gemini API

popup.js: User interface to configure and activate the extension

## 🌐 Compatibility
✅ Chrome 88+

✅ Edge 88+

✅ Brave 1.20+

✅ Other Chromium-based browsers

## ⚠️ Limitations
Changes are local and are lost when the page is reloaded

The Gemini API has free usage limits

Some complex websites (React, Vue) may require additional adjustments
