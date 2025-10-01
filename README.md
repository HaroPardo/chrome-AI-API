# 🎯 Cursor Visual Editor - Chrome Extension

Una extensión de Chrome que convierte cualquier página web en un editor visual. Selecciona elementos haciendo clic y arrastrando, describe los cambios que quieres hacer, y la IA modificará el HTML automáticamente.

## ✨ Características

- **Selección Visual**: Arrastra el ratón sobre cualquier elemento para seleccionarlo
- **Edición con IA**: Integración con Google Gemini para modificar elementos usando lenguaje natural
- **Funciona en cualquier sitio**: Compatible con todas las páginas web
- **Interfaz intuitiva**: Diálogo flotante para describir cambios fácilmente
- **Modo persistente**: Mantén el modo selección activo para múltiples ediciones

## 🚀 Instalación

### Prerrequisitos
- Navegador Chrome o basado en Chromium
- Cuenta en [Google AI Studio](https://aistudio.google.com/) para obtener una API key

### Pasos de instalación

1. **Clona o descarga el proyecto**
   ```bash
   git clone https://github.com/tu-usuario/cursor-visual-editor.git
Configura la extensión en Chrome

Abre chrome://extensions/

Activa "Modo desarrollador" (esquina superior derecha)

Haz clic en "Cargar extensión descomprimida"

Selecciona la carpeta chrome-extension del proyecto

Configura tu API key de Gemini

Haz clic en el icono de la extensión en la barra de herramientas

Ingresa tu API key de Google Gemini

Haz clic en "Guardar API Key"

## 🛠️ Configuración
Obtención de API Key
Ve a Google AI Studio

Inicia sesión con tu cuenta de Google

Haz clic en "Get API Key" o "Crear API Key"

Copia la clave generada

Pégala en la configuración de la extensión

Permisos requeridos
La extensión necesita:

activeTab: Para acceder a la pestaña actual

scripting: Para inyectar scripts de contenido

storage: Para guardar tu API key y preferencias

host_permissions: Para funcionar en todos los sitios web

## 💡 Cómo usar
Activar el modo selección

Haz clic en el icono de la extensión

Activa el "Modo Selección"

Seleccionar elementos

Arrastra el ratón sobre cualquier elemento de la página

Los elementos se resaltarán en azul cuando estén seleccionados

Describir cambios

Aparecerá un diálogo flotante

Describe los cambios que quieres hacer (ej: "Cambia el texto a rojo", "Aumenta el tamaño de fuente")

Ejemplos:

"Cambia el texto por 'Hola Mundo'"

"Haz el logo más grande"

"Cambia el color de fondo a azul"

Aplicar cambios

Enviar a IA: Usa Gemini para modificar el HTML automáticamente

Editar directamente: Aplica cambios básicos directamente

## 🏗️ Estructura del proyecto
text
chrome-extension/
├── manifest.json          # Configuración de la extensión
├── background.js          # Service worker y comunicación con API
├── contentScript.js       # Script que se inyecta en las páginas
├── contentScript.ts       # Código fuente TypeScript
├── popup.html            # Interfaz del popup
├── popup.js              # Lógica del popup
├── contentStyles.css     # Estilos para la interfaz visual
└── dist/                 # Archivos compilados (TypeScript → JavaScript)
## 🔧 Desarrollo
Requisitos de desarrollo
Node.js y npm

TypeScript (opcional, para desarrollo)

Compilar TypeScript
bash
cd chrome-extension
npm install
npx tsc
Estructura de archivos principales
manifest.json: Configuración de la extensión con permisos y scripts

contentScript.ts: Lógica principal de selección visual y modificación de elementos

background.js: Maneja las llamadas a la API de Gemini

popup.js: Interfaz de usuario para configurar y activar la extensión

## 🌐 Compatibilidad
✅ Chrome 88+

✅ Edge 88+

✅ Brave 1.20+

✅ Otros navegadores basados en Chromium

## ⚠️ Limitaciones
Los cambios son locales y se pierden al recargar la página

La API de Gemini tiene límites de uso gratuito

Algunos sitios web complejos (React, Vue) pueden requerir ajustes adicionales
