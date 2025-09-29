/// <reference types="chrome"/>

// Content Script - Se ejecuta en las páginas web
console.log('Cursor Visual Editor - Content Script cargado');

// Interfaces para TypeScript
interface ElementData {
  richText: string;
  text: string;
  context: {
    html: string;
    tagName: string;
    classes: string[];
    id: string;
    attributes: Record<string, string>;
    styles: {
      cssText: string;
      specific: Record<string, string>;
    };
    position: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
    react: any;
    url: string;
    timestamp: string;
  };
}

interface ChromeMessage {
  action?: string;
  type?: string;
  data?: ElementData;
}

let isSelectionMode: boolean = false;
let selectedElement: Element | null = null;

// Inicializar la extensión
function initializeExtension(): void {
  console.log('Inicializando Cursor Visual Editor en:', window.location.href);
  
  // Crear botón de activación
  createActivationButton();
  
  // Escuchar mensajes del background/popup
  chrome.runtime.onMessage.addListener((
    request: ChromeMessage, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ) => {
    if (request.action === 'toggleSelectionMode') {
      toggleSelectionMode();
      sendResponse({ status: 'success' });
    }
    return true;
  });
}

// Crear botón flotante de activación
function createActivationButton(): void {
  const button = document.createElement('div');
  button.innerHTML = '🎯 Cursor';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #007acc;
    color: white;
    padding: 10px 15px;
    border-radius: 20px;
    cursor: pointer;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    user-select: none;
  `;
  
  button.addEventListener('click', toggleSelectionMode);
  document.body.appendChild(button);
}

// Alternar modo de selección
function toggleSelectionMode(): void {
  isSelectionMode = !isSelectionMode;
  
  if (isSelectionMode) {
    enableSelectionMode();
  } else {
    disableSelectionMode();
  }
}

// Activar modo de selección
function enableSelectionMode(): void {
  console.log('Modo selección ACTIVADO');
  
  // Cambiar cursor
  document.body.style.cursor = 'crosshair';
  
  // Agregar overlay
  const overlay = document.createElement('div');
  overlay.id = 'cursor-selection-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 122, 204, 0.1);
    z-index: 9998;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);
  
  // Agregar event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleElementClick, true);
  
  showNotification('🎯 Modo selección activado - Haz clic en cualquier elemento');
}

// Desactivar modo de selección
function disableSelectionMode(): void {
  console.log('Modo selección DESACTIVADO');
  
  // Restaurar cursor
  document.body.style.cursor = '';
  
  // Remover overlay
  const overlay = document.getElementById('cursor-selection-overlay');
  if (overlay) overlay.remove();
  
  // Remover event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('click', handleElementClick, true);
  
  // Remover highlights
  document.querySelectorAll('.cursor-element-highlight').forEach(el => {
    el.classList.remove('cursor-element-highlight');
  });
}

// Manejar hover sobre elementos
function handleMouseOver(event: MouseEvent): void {
  event.stopPropagation();
  
  // Remover highlight anterior
  document.querySelectorAll('.cursor-element-highlight').forEach(el => {
    el.classList.remove('cursor-element-highlight');
  });
  
  // Aplicar highlight al elemento actual
  const element = event.target as Element;
  element.classList.add('cursor-element-highlight');
}

// Manejar clic en elementos
function handleElementClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target as Element;
  console.log('Elemento seleccionado:', element);
  
  // Capturar datos del elemento
  const elementData = captureElementData(element);
  
  // Enviar a Cursor
  sendElementToCursor(elementData);
  
  // Desactivar modo selección
  disableSelectionMode();
  isSelectionMode = false;
}

// Capturar datos del elemento
function captureElementData(element: Element): ElementData {
  const rect = element.getBoundingClientRect();
  
  return {
    richText: element.outerHTML,
    text: element.textContent?.trim() || '',
    context: {
      html: element.outerHTML,
      tagName: element.tagName,
      classes: Array.from(element.classList),
      id: element.id,
      attributes: getElementAttributes(element),
      styles: getElementStyles(element),
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      react: getReactContext(element),
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
  };
}

// Obtener atributos del elemento
function getElementAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
}

// Obtener estilos computados
function getElementStyles(element: Element): { cssText: string; specific: Record<string, string> } {
  const styles = window.getComputedStyle(element);
  return {
    cssText: styles.cssText,
    specific: {
      fontSize: styles.fontSize,
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      border: styles.border,
      padding: styles.padding,
      margin: styles.margin
    }
  };
}

// Intentar capturar contexto de React
function getReactContext(element: Element): any {
  try {
    for (const key in element) {
      if (key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')) {
        const fiber = (element as any)[key];
        return {
          props: fiber.memoizedProps,
          state: fiber.memoizedState,
          elementType: fiber.elementType?.name || 'Unknown'
        };
      }
    }
  } catch (error) {
    console.log('No se pudo capturar contexto React:', error);
  }
  return null;
}

// Enviar elemento a Cursor
async function sendElementToCursor(elementData: ElementData): Promise<void> {
  try {
    showNotification('📤 Enviando elemento a Cursor...');
    
    const response = await chrome.runtime.sendMessage({
      type: 'SEND_TO_CURSOR',
      data: elementData
    } as ChromeMessage);
    
    if (response.success) {
      showNotification('✅ Elemento enviado a Cursor correctamente');
    } else {
      showNotification('❌ Error enviando a Cursor: ' + response.error);
    }
  } catch (error) {
    console.error('Error enviando a Cursor:', error);
    showNotification('🔌 No se pudo conectar con Cursor - Verifica que el servidor esté ejecutándose');
  }
}

// Mostrar notificación
function showNotification(message: string): void {
  // Remover notificación anterior
  const existingNotification = document.getElementById('cursor-notification');
  if (existingNotification) existingNotification.remove();
  
  const notification = document.createElement('div');
  notification.id = 'cursor-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remover después de 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}