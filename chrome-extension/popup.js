// Script para el popup de la extensión
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleSelection');
  const statusDiv = document.getElementById('status');
  
  // Verificar estado de conexión con Cursor
  checkCursorConnection();
  
  // Botón para activar selección
  toggleButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleSelectionMode'}, function(response) {
          if (chrome.runtime.lastError) {
            if (statusDiv) {
              statusDiv.textContent = 'Error: Recarga la página';
              statusDiv.className = 'status disconnected';
            }
          }
        });
      }
    });
  });
  
  // Verificar conexión cada 2 segundos
  setInterval(checkCursorConnection, 2000);
});

async function checkCursorConnection() {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;
  
  try {
    const response = await fetch('http://localhost:3001/update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({test: true})
    });
    
    if (response.ok) {
      statusDiv.textContent = 'Cursor: Conectado ✅';
      statusDiv.className = 'status connected';
    } else {
      statusDiv.textContent = 'Cursor: Error de conexión ❌';
      statusDiv.className = 'status disconnected';
    }
  } catch (error) {
    statusDiv.textContent = 'Cursor: No conectado 🔌';
    statusDiv.className = 'status disconnected';
  }
}