// Script para el popup de la extensión
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusDiv = document.getElementById('status');
  
  // Cargar estado actual
  loadCurrentState();
  
  // Botón toggle
  toggleButton.addEventListener('click', function() {
    const isActive = toggleButton.classList.contains('active');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleSelection'}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            statusDiv.textContent = 'Error: Recarga la página';
            statusDiv.className = 'status disconnected';
          } else {
            // Actualizar estado local después de un momento
            setTimeout(loadCurrentState, 100);
          }
        });
      }
    });
  });
  
  // Verificar conexión cada 2 segundos
  setInterval(checkCursorConnection, 2000);
});

// Cargar estado actual
function loadCurrentState() {
  const toggleButton = document.getElementById('toggleButton');
  const statusDiv = document.getElementById('status');
  
  chrome.storage.local.get(['isEnabled'], function(result) {
    if (result.isEnabled) {
      toggleButton.classList.add('active');
      statusDiv.textContent = '✅ Modo selección ACTIVADO';
      statusDiv.className = 'status connected';
    } else {
      toggleButton.classList.remove('active');
      statusDiv.textContent = '🔴 Modo selección DESACTIVADO';
      statusDiv.className = 'status disconnected';
    }
  });
}

// Verificar conexión con Cursor
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
      // Mantener el estado actual del modo selección
      chrome.storage.local.get(['isEnabled'], function(result) {
        if (result.isEnabled) {
          statusDiv.textContent = '✅ Modo selección ACTIVADO';
        } else {
          statusDiv.textContent = '🔴 Modo selección DESACTIVADO';
        }
        statusDiv.className = 'status connected';
      });
    } else {
      statusDiv.textContent = 'Cursor: Error de conexión ❌';
      statusDiv.className = 'status disconnected';
    }
  } catch (error) {
    statusDiv.textContent = 'Cursor: No conectado 🔌';
    statusDiv.className = 'status disconnected';
  }
}