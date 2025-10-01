// Script para el popup de la extensión
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusDiv = document.getElementById('status');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const apiKeyInput = document.getElementById('apiKeyInput');

  // ✅ Cargar estado actual al abrir popup
  loadCurrentState();

  // ✅ Cargar API Key guardada y mostrar placeholder si ya existe
  chrome.storage.local.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.placeholder = 'API Key ya configurada';
    }
  });

  // ✅ Guardar API Key al hacer clic en el botón
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
        alert('API Key guardada correctamente ✅');
        apiKeyInput.value = '';
        apiKeyInput.placeholder = 'API Key ya configurada';
        checkCursorConnection(); // refresca estado
      });
    } else {
      alert('Por favor ingresa una API Key válida ❗');
    }
  });

  // ✅ Botón toggle para activar/desactivar modo selección
  toggleButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleSelection'}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            statusDiv.textContent = '⚠️ Error: Recarga la página';
            statusDiv.className = 'status disconnected';
          } else {
            // Actualizar estado local después de un momento
            setTimeout(loadCurrentState, 100);
          }
        });
      }
    });
  });

  // ✅ Verificar conexión periódicamente
  setInterval(checkCursorConnection, 2000);
});

// 🔄 Función para cargar estado actual desde storage
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

// 🔍 Verificar conexión con Cursor y si API Key está configurada
function checkCursorConnection() {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;
  
  chrome.storage.local.get(['geminiApiKey', 'isEnabled'], function(result) {
    if (!result.geminiApiKey) {
      statusDiv.textContent = '🔑 Configura API Key';
      statusDiv.className = 'status disconnected';
    } else if (result.isEnabled) {
      statusDiv.textContent = '✅ Modo selección ACTIVADO';
      statusDiv.className = 'status connected';
    } else {
      statusDiv.textContent = '🔴 Modo selección DESACTIVADO';
      statusDiv.className = 'status disconnected';
    }
  });
}


