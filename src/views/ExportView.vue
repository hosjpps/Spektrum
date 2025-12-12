<template>
  <div class="export-view">
    <h2>Экспорт палитры</h2>
    <p class="subtitle">Получите готовый код для вашего проекта</p>

    <!-- Текущая палитра -->
    <div class="current-palette" v-if="currentPalette.length">
      <div class="palette-preview">
        <div 
          v-for="(color, index) in currentPalette" 
          :key="index"
          class="color-swatch"
          :style="{ backgroundColor: color.hex }"
        >
          <span :style="{ color: getContrastColor(color.hex) }">
            {{ color.hex }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="no-palette">
      <p>Нет активной палитры</p>
      <router-link to="/" class="generate-link">Сгенерировать палитру</router-link>
    </div>

    <!-- Форматы экспорта -->
    <div class="export-formats" v-if="currentPalette.length">
      <div class="format-tabs">
        <button 
          v-for="format in formats" 
          :key="format.id"
          :class="{ active: selectedFormat === format.id }"
          @click="selectedFormat = format.id"
        >
          {{ format.name }}
        </button>
      </div>

      <!-- Настройки имён переменных -->
      <div class="naming-options">
        <label>Префикс переменных:</label>
        <input v-model="variablePrefix" type="text" placeholder="color">
        
        <label>Стиль именования:</label>
        <select v-model="namingStyle">
          <option value="numbered">Нумерация (color-1, color-2)</option>
          <option value="semantic">Семантика (primary, secondary)</option>
          <option value="descriptive">Описание (bright-purple)</option>
        </select>
      </div>

      <!-- Код -->
      <div class="code-section">
        <div class="code-header">
          <span>{{ formats.find(f => f.id === selectedFormat)?.name }}</span>
          <button @click="copyCode" class="copy-btn">
            {{ copied ? 'Скопировано!' : 'Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ generatedCode }}</code></pre>
      </div>

      <!-- Дополнительные форматы -->
      <div class="additional-exports">
        <h3>Быстрое копирование</h3>
        <div class="quick-copy-grid">
          <button @click="copyAsList('hex')" class="quick-copy-btn">
            HEX список
          </button>
          <button @click="copyAsList('rgb')" class="quick-copy-btn">
            RGB список
          </button>
          <button @click="copyAsList('hsl')" class="quick-copy-btn">
            HSL список
          </button>
          <button @click="copyAsArray" class="quick-copy-btn">
            JSON массив
          </button>
        </div>
      </div>

      <!-- Шаринг -->
      <div class="share-section">
        <h3>Поделиться палитрой</h3>
        <div class="share-link-container">
          <input 
            :value="shareLink" 
            readonly 
            class="share-link-input"
            ref="shareLinkInput"
          >
          <button @click="copyShareLink" class="copy-link-btn">
            Копировать ссылку
          </button>
        </div>
      </div>
    </div>

    <!-- Уведомление -->
    <transition name="slide">
      <div v-if="notification" class="notification">
        {{ notification }}
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useColors } from '../composables/useColors'

export default {
  name: 'ExportView',
  
  setup() {
    const { currentPalette, getContrastColor, hexToRgb, hexToHsl } = useColors()

    const selectedFormat = ref('css')
    const variablePrefix = ref('color')
    const namingStyle = ref('numbered')
    const copied = ref(false)
    const notification = ref(null)

    const formats = [
      { id: 'css', name: 'CSS Variables' },
      { id: 'scss', name: 'SCSS Variables' },
      { id: 'tailwind', name: 'Tailwind Config' },
      { id: 'js', name: 'JavaScript' },
      { id: 'json', name: 'JSON' }
    ]

    const semanticNames = ['primary', 'secondary', 'accent', 'highlight', 'muted', 'subtle', 'bold']
    const descriptiveNames = computed(() => 
      currentPalette.value.map(c => getColorName(c.hex))
    )

    const getColorName = (hex) => {
      const hsl = hexToHsl(hex)
      let name = ''
      
      // Яркость
      if (hsl.l < 30) name += 'dark-'
      else if (hsl.l > 70) name += 'light-'
      else if (hsl.l > 50) name += 'bright-'
      
      // Оттенок
      const h = hsl.h
      if (h < 15 || h >= 345) name += 'red'
      else if (h < 45) name += 'orange'
      else if (h < 75) name += 'yellow'
      else if (h < 150) name += 'green'
      else if (h < 210) name += 'cyan'
      else if (h < 270) name += 'blue'
      else if (h < 315) name += 'purple'
      else name += 'pink'
      
      return name
    }

    const getVariableName = (index) => {
      const prefix = variablePrefix.value || 'color'
      
      switch (namingStyle.value) {
        case 'semantic':
          return `${prefix}-${semanticNames[index] || `extra-${index - semanticNames.length + 1}`}`
        case 'descriptive':
          return `${prefix}-${descriptiveNames.value[index]}`
        default:
          return `${prefix}-${index + 1}`
      }
    }

    const generatedCode = computed(() => {
      const colors = currentPalette.value
      if (!colors.length) return ''

      switch (selectedFormat.value) {
        case 'css':
          return generateCSS(colors)
        case 'scss':
          return generateSCSS(colors)
        case 'tailwind':
          return generateTailwind(colors)
        case 'js':
          return generateJS(colors)
        case 'json':
          return generateJSON(colors)
        default:
          return ''
      }
    })

    const generateCSS = (colors) => {
      let code = ':root {\n'
      colors.forEach((color, i) => {
        code += `  --${getVariableName(i)}: ${color.hex};\n`
      })
      code += '}\n\n'
      code += '/* RGB variants */\n:root {\n'
      colors.forEach((color, i) => {
        const rgb = hexToRgb(color.hex)
        code += `  --${getVariableName(i)}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};\n`
      })
      code += '}'
      return code
    }

    const generateSCSS = (colors) => {
      let code = '// Color palette\n'
      colors.forEach((color, i) => {
        code += `$${getVariableName(i)}: ${color.hex};\n`
      })
      code += '\n// Color map\n$colors: (\n'
      colors.forEach((color, i) => {
        code += `  "${getVariableName(i)}": ${color.hex},\n`
      })
      code += ');'
      return code
    }

    const generateTailwind = (colors) => {
      let code = '// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n'
      colors.forEach((color, i) => {
        const name = getVariableName(i).replace(variablePrefix.value + '-', '')
        code += `        '${name}': '${color.hex}',\n`
      })
      code += '      },\n    },\n  },\n}'
      return code
    }

    const generateJS = (colors) => {
      let code = 'const palette = {\n'
      colors.forEach((color, i) => {
        const name = getVariableName(i).replace(/-/g, '_')
        code += `  ${name}: '${color.hex}',\n`
      })
      code += '};\n\nexport default palette;'
      return code
    }

    const generateJSON = (colors) => {
      const obj = {}
      colors.forEach((color, i) => {
        obj[getVariableName(i)] = {
          hex: color.hex,
          rgb: hexToRgb(color.hex),
          hsl: hexToHsl(color.hex)
        }
      })
      return JSON.stringify(obj, null, 2)
    }

    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(generatedCode.value)
        copied.value = true
        showNotification('Код скопирован!')
        setTimeout(() => { copied.value = false }, 2000)
      } catch (e) {
        showNotification('Ошибка копирования')
      }
    }

    const copyAsList = async (format) => {
      const list = currentPalette.value.map(c => {
        switch (format) {
          case 'rgb':
            const rgb = hexToRgb(c.hex)
            return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
          case 'hsl':
            const hsl = hexToHsl(c.hex)
            return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
          default:
            return c.hex
        }
      }).join('\n')
      
      await navigator.clipboard.writeText(list)
      showNotification(`${format.toUpperCase()} список скопирован!`)
    }

    const copyAsArray = async () => {
      const arr = JSON.stringify(currentPalette.value.map(c => c.hex))
      await navigator.clipboard.writeText(arr)
      showNotification('JSON массив скопирован!')
    }

    const shareLink = computed(() => {
      const colors = currentPalette.value.map(c => c.hex.replace('#', '')).join('-')
      return `${window.location.origin}?palette=${colors}`
    })

    const copyShareLink = async () => {
      await navigator.clipboard.writeText(shareLink.value)
      showNotification('Ссылка скопирована!')
    }

    const showNotification = (message) => {
      notification.value = message
      setTimeout(() => { notification.value = null }, 2000)
    }

    return {
      currentPalette,
      selectedFormat,
      variablePrefix,
      namingStyle,
      copied,
      notification,
      formats,
      generatedCode,
      shareLink,
      getContrastColor,
      copyCode,
      copyAsList,
      copyAsArray,
      copyShareLink
    }
  }
}
</script>

<style scoped>
.export-view {
  max-width: 900px;
  margin: 0 auto;
}

h2 {
  color: #e8e8e8;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #888;
  margin-bottom: 2rem;
}

.current-palette {
  margin-bottom: 2rem;
}

.palette-preview {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.color-swatch {
  flex: 1;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
}

.no-palette {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
}

.no-palette p {
  color: #888;
  margin-bottom: 1rem;
}

.generate-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 500;
}

.export-formats {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.format-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.format-tabs button {
  padding: 0.6rem 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.format-tabs button:hover {
  border-color: #667eea;
  color: #fff;
}

.format-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.naming-options {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.naming-options label {
  color: #aaa;
  font-size: 0.9rem;
}

.naming-options input, .naming-options select {
  padding: 0.5rem 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e8e8e8;
  border-radius: 8px;
  font-family: inherit;
}

.naming-options input {
  width: 120px;
}

.code-section {
  margin-bottom: 2rem;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.code-header span {
  color: #aaa;
  font-size: 0.9rem;
}

.copy-btn {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: rgba(102, 126, 234, 0.3);
}

.code-block {
  background: #0d0d1a;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #a5b4fc;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.additional-exports {
  margin-bottom: 2rem;
}

.additional-exports h3 {
  color: #e8e8e8;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.quick-copy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.quick-copy-btn {
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.quick-copy-btn:hover {
  border-color: #667eea;
  color: #fff;
  background: rgba(102, 126, 234, 0.1);
}

.share-section h3 {
  color: #e8e8e8;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.share-link-container {
  display: flex;
  gap: 0.5rem;
}

.share-link-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #888;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.85rem;
}

.copy-link-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;
}

.notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00c853, #00e676);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  z-index: 100;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>

