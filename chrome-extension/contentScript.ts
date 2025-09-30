/// <reference types="chrome"/>

console.log('Cursor Visual Editor - Content Script cargado');

// Interfaces actualizadas
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
    userPrompt?: string; // Propiedad opcional añadida
  };
}

interface ChromeMessage {
  action?: string;
  type?: string;
  data?: ElementData;
}

// Estado global
let isSelectionMode: boolean = false;
let isDragging: boolean = false;
let dragStartX: number = 0;
let dragStartY: number = 0;
let selectionRect: HTMLDivElement | null = null;
let selectedElements: Element[] = [];

// Inicializar
function initializeExtension(): void {
  console.log('Cursor Visual Editor inicializado en:', window.location.href);
  
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled) {
      enableGlobalSelection();
    }
  });

  chrome.runtime.onMessage.addListener((
    request: ChromeMessage, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ) => {
    if (request.action === 'toggleSelection') {
      toggleSelectionMode();
      sendResponse({ status: 'success' });
    }
    return true;
  });
}

// Alternar modo selección
function toggleSelectionMode(): void {
  chrome.storage.local.get(['isEnabled'], (result) => {
    const newState = !result.isEnabled;
    chrome.storage.local.set({ isEnabled: newState }, () => {
      if (newState) {
        enableGlobalSelection();
      } else {
        disableGlobalSelection();
      }
    });
  });
}

// Activar selección global
function enableGlobalSelection(): void {
  console.log('Activando selección global');
  
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('dragstart', preventDrag, true);
  
  showNotification('🎯 Modo selección activado - Arrastra para seleccionar elementos');
}

// Desactivar selección global
function disableGlobalSelection(): void {
  console.log('Desactivando selección global');
  
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('mouseup', handleMouseUp, true);
  document.removeEventListener('dragstart', preventDrag, true);
  
  cleanupSelection();
  showNotification('🔴 Modo selección desactivado');
}

// Prevenir arrastrado - CORREGIDO
function preventDrag(e: Event): void {
  e.preventDefault();
  // Eliminado: return false;
}

// Manejar inicio de arrastre - CORREGIDO
function handleMouseDown(e: MouseEvent): void {
  if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
    return;
  }

  const target = e.target as HTMLElement; // Cambiado a HTMLElement
  if (target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true') { // CORREGIDO: forma correcta de verificar contentEditable
    return;
  }

  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  
  selectionRect = document.createElement('div');
  selectionRect.className = 'cursor-selection-rect';
  selectionRect.style.cssText = `
    position: fixed;
    border: 2px dashed #007acc;
    background: rgba(0, 122, 204, 0.1);
    z-index: 10000;
    pointer-events: none;
    left: ${dragStartX}px;
    top: ${dragStartY}px;
    width: 0;
    height: 0;
  `;
  document.body.appendChild(selectionRect);
  
  e.preventDefault();
  e.stopPropagation();
}

// Manejar movimiento durante arrastre
function handleMouseMove(e: MouseEvent): void {
  if (!isDragging || !selectionRect) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(dragStartX, currentX);
  const top = Math.min(dragStartY, currentY);
  const width = Math.abs(currentX - dragStartX);
  const height = Math.abs(currentY - dragStartY);
  
  selectionRect.style.left = left + 'px';
  selectionRect.style.top = top + 'px';
  selectionRect.style.width = width + 'px';
  selectionRect.style.height = height + 'px';
  
  highlightElementsInRect(left, top, width, height);
}

// Manejar fin de arrastre
function handleMouseUp(e: MouseEvent): void {
  if (!isDragging) return;
  
  isDragging = false;
  
  if (selectionRect) {
    const rect = selectionRect.getBoundingClientRect();
    selectElementsInRect(rect.left, rect.top, rect.width, rect.height);
    selectionRect.remove();
    selectionRect = null;
  }
  
  cleanupHighlights();
  
  e.preventDefault();
  e.stopPropagation();
}

// Resaltar elementos dentro del rectángulo
function highlightElementsInRect(left: number, top: number, width: number, height: number): void {
  cleanupHighlights();
  
  const selectionRect = new DOMRect(left, top, width, height);
  selectedElements = [];
  
  const allElements = document.body.getElementsByTagName('*');
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const elementRect = element.getBoundingClientRect();
    
    if (elementsIntersect(selectionRect, elementRect)) {
      element.classList.add('cursor-element-highlight');
      selectedElements.push(element);
    }
  }
}

// Seleccionar elementos dentro del rectángulo
function selectElementsInRect(left: number, top: number, width: number, height: number): void {
  const selectionRect = new DOMRect(left, top, width, height);
  let bestElement: Element | null = null;
  let maxArea = 0;
  
  for (const element of selectedElements) {
    const elementRect = element.getBoundingClientRect();
    const intersection = getIntersectionArea(selectionRect, elementRect);
    
    if (intersection > maxArea) {
      maxArea = intersection;
      bestElement = element;
    }
  }
  
  if (bestElement) {
    const elementData = captureElementData(bestElement);
    showSelectionDialog(elementData, bestElement);
  }
}

// Verificar si dos rectángulos se intersectan
function elementsIntersect(rect1: DOMRect, rect2: DOMRect): boolean {
  return !(rect2.left > rect1.right || 
           rect2.right < rect1.left || 
           rect2.top > rect1.bottom ||
           rect2.bottom < rect1.top);
}

// Calcular área de intersección
function getIntersectionArea(rect1: DOMRect, rect2: DOMRect): number {
  const xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
  const yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
  return xOverlap * yOverlap;
}

// Limpiar resaltados
function cleanupHighlights(): void {
  document.querySelectorAll('.cursor-element-highlight').forEach(el => {
    el.classList.remove('cursor-element-highlight');
  });
}

// Limpiar selección
function cleanupSelection(): void {
  cleanupHighlights();
  if (selectionRect) {
    selectionRect.remove();
    selectionRect = null;
  }
  selectedElements = [];
}

// Mostrar diálogo de selección - CORREGIDO
function showSelectionDialog(elementData: ElementData, element: Element): void {
  const dialog = document.createElement('div');
  dialog.className = 'cursor-selection-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #007acc;
    border-radius: 8px;
    padding: 20px;
    z-index: 10001;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    min-width: 300px;
  `;
  
  dialog.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #007acc;">🎯 Elemento Seleccionado</h3>
    <div style="margin-bottom: 15px;">
      <strong>Tipo:</strong> ${elementData.context.tagName}<br>
      <strong>Texto:</strong> ${elementData.text.substring(0, 100)}${elementData.text.length > 100 ? '...' : ''}
    </div>
    <textarea id="cursor-prompt" placeholder="Describe los cambios que quieres hacer..." 
              style="width: 100%; height: 80px; margin-bottom: 15px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="cursor-cancel" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancelar</button>
      <button id="cursor-send" style="padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Enviar a Cursor</button>
      <button id="cursor-edit" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Editar Directamente</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Event listeners - CORREGIDO
  document.getElementById('cursor-cancel')?.addEventListener('click', () => {
    dialog.remove();
    cleanupHighlights();
  });
  
  document.getElementById('cursor-send')?.addEventListener('click', () => {
    const prompt = (document.getElementById('cursor-prompt') as HTMLTextAreaElement).value;
    if (prompt.trim()) {
      // CORREGIDO: Usar la propiedad opcional userPrompt
      const elementDataWithPrompt: ElementData = {
        ...elementData,
        context: {
          ...elementData.context,
          userPrompt: prompt
        }
      };
      sendElementToCursor(elementDataWithPrompt);
    }
    dialog.remove();
    cleanupHighlights();
  });
  
  document.getElementById('cursor-edit')?.addEventListener('click', () => {
    const prompt = (document.getElementById('cursor-prompt') as HTMLTextAreaElement).value;
    if (prompt.trim()) {
      applyDirectEdit(element, prompt);
    }
    dialog.remove();
    cleanupHighlights();
  });
  
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
  `;
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', () => {
    dialog.remove();
    overlay.remove();
    cleanupHighlights();
  });
}

// Aplicar edición directa
function applyDirectEdit(element: Element, prompt: string): void {
  const htmlElement = element as HTMLElement;
  
  if (prompt.toLowerCase().includes('color') || prompt.toLowerCase().includes('rojo')) {
    htmlElement.style.color = 'red';
  }
  if (prompt.toLowerCase().includes('grande') || prompt.toLowerCase().includes('tamaño')) {
    htmlElement.style.fontSize = 'larger';
  }
  if (prompt.toLowerCase().includes('ocultar')) {
    htmlElement.style.display = 'none';
  }
  
  if (prompt.toLowerCase().includes('cambiar texto') || prompt.toLowerCase().includes('pon')) {
    const newTextMatch = prompt.match(/poner\s+"([^"]+)"|pon\s+"([^"]+)"|texto\s+"([^"]+)"/i);
    if (newTextMatch) {
      const newText = newTextMatch[1] || newTextMatch[2] || newTextMatch[3];
      element.textContent = newText;
    }
  }
  
  showNotification('✅ Elemento editado directamente');
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
  const existingNotification = document.getElementById('cursor-notification');
  if (existingNotification) existingNotification.remove();
  
  const notification = document.createElement('div');
  notification.id = 'cursor-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10002;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
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