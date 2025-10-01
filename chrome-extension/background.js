// Service Worker para la extensión de Chrome
console.log('Cursor Visual Editor - Service Worker cargado');

// Manejar la instalación
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cursor Visual Editor instalado');
  chrome.storage.local.set({ isEnabled: false });
});

// Manejar mensajes desde content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensaje recibido en background:', request);
  
  if (request.type === 'SEND_TO_AI') {
    // Llama a la función Gemini y devuelve la promesa
    sendToGemini(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // ✅ Indica que la respuesta se enviará de forma asíncrona
  }
});

// 🔹 Función para enviar los datos a Google Gemini
// 🔹 CORRECTED function to send data to Google Gemini
async function sendToGemini(data) {
  try {
    // 1. Securely retrieve your API key from storage
    const storageResult = await chrome.storage.local.get(['geminiApiKey']);
    console.log('Storage retrieval result:', storageResult); // Check what's actually in storage
    
    const apiKey = storageResult.geminiApiKey;

    // This condition now fails, meaning apiKey is undefined
    if (!apiKey) {
      console.error('API key is undefined. Full storage result:', storageResult);
      throw new Error('API key de Gemini no configurada. Configúrala en la extensión.');
    }

    // 2. Construct the prompt for Gemini
    const prompt = `Eres un asistente que modifica elementos HTML.
HTML ORIGINAL: ${data.context.html}
TEXTO ORIGINAL: ${data.text}
INSTRUCCIONES DEL USUARIO: ${data.context.userPrompt}

Devuelve SOLO el nuevo código HTML modificado, sin explicaciones ni comentarios.
Mantén la estructura HTML similar pero aplica los cambios solicitados.`;

    // 3. Make a request to the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Gemini API: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    // 4. Process the response SAFELY
    const geminiResult = await response.json();
    
    // Safe extraction with error checking
    if (geminiResult.candidates && geminiResult.candidates[0] && geminiResult.candidates[0].content) {
      const modifiedHtml = geminiResult.candidates[0].content.parts[0].text;
      return modifiedHtml;
    } else {
      throw new Error('Estructura de respuesta de Gemini inválida');
    }

  } catch (error) {
    console.error('Error enviando a Gemini:', error);
    throw error; // Re-throw the error to be handled by the message listener
  }
}

// 🔹 Ensure your message listener is set up correctly
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensaje recibido en background:', request);
  
  if (request.type === 'SEND_TO_AI') { // Make sure this type matches what you send from contentScript.js
    sendToGemini(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Indicates you wish to send a response asynchronously
  }
});