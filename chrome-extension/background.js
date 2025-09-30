// Service Worker para la extensión de Chrome
console.log('Cursor Visual Editor - Service Worker cargado');

// Estado por defecto
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cursor Visual Editor instalado');
  chrome.storage.local.set({ isEnabled: false });
});

// Manejar mensajes desde content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Mensaje recibido en background:', request);
  
  if (request.type === 'SEND_TO_CURSOR') {
    sendToCursor(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Mantener el mensaje abierto para respuesta asíncrona
  }
});

// Función para enviar datos a Cursor
async function sendToCursor(data) {
  try {
    const response = await fetch('http://localhost:3001/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error enviando a Cursor:', error);
    throw error;
  }
}