<template>
  <div class="generator-view">
    <!-- Настройки генерации -->
    <div class="generator-controls">
      <div class="control-row">
        <!-- Выбор базового цвета -->
        <div class="control-group">
          <label>Базовый цвет:</label>
          <div class="color-picker-wrapper">
            <input 
              type="color" 
              v-model="baseColor"
              class="color-picker"
            >
            <span class="color-value">{{ baseColor }}</span>
          </div>
        </div>

        <!-- Количество цветов -->
        <div class="control-group">
          <label>Количество:</label>
          <div class="count-buttons">
            <button 
              v-for="count in [3, 5, 7]" 
              :key="count"
              :class="{ active: colorCount === count }"
              @click="colorCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <!-- Формат -->
        <div class="control-group">
          <label>Формат:</label>
          <div class="format-buttons">
            <button 
              :class="{ active: colorFormat === 'hex' }"
              @click="colorFormat = 'hex'"
            >HEX</button>
            <button 
              :class="{ active: colorFormat === 'rgb' }"
              @click="colorFormat = 'rgb'"
            >RGB</button>
          </div>
        </div>
      </div>

      <!-- Тип палитры -->
      <div class="control-row">
        <div class="control-group full-width">
          <label>Тип палитры:</label>
          <div class="palette-types">
            <button 
              v-for="type in paletteTypes" 
              :key="type.id"
              :class="{ active: selectedType === type.id }"
            @click="selectedType = type.id"
            :title="type.description"
          >
            {{ type.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Настроение (если выбран mood) -->
      <div class="control-row" v-if="selectedType === 'mood'">
        <div class="control-group full-width">
          <label>Настроение:</label>
          <div class="mood-buttons">
            <button 
              v-for="mood in moods" 
              :key="mood.id"
              :class="{ active: selectedMood === mood.id }"
            @click="selectedMood = mood.id"
          >
            {{ mood.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Кнопка генерации -->
      <button @click="generate" class="generate-btn">
        Сгенерировать палитру
      </button>
    </div>

    <!-- Палитра -->
    <div class="palette-section">
      <div class="palette" v-if="colors.length">
        <div 
          v-for="(color, index) in colors" 
          :key="index"
          class="color-card"
          :style="{ backgroundColor: color.hex }"
          @click="copyColor(color.hex)"
        >
          <button 
            class="lock-btn"
            :class="{ locked: color.locked }"
            @click.stop="toggleLock(index)"
          >
            {{ color.locked ? 'x' : 'o' }}
          </button>
          
          <div class="color-info" :style="{ color: getContrastColor(color.hex) }">
            <span class="color-value">{{ formatColor(color.hex) }}</span>
            <span class="copy-hint">Клик для копирования</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-palette">
        <p>Нажмите "Сгенерировать" для создания палитры</p>
      </div>
    </div>

    <!-- Уведомление -->
    <transition name="slide">
      <div v-if="notification" class="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </transition>

    <!-- Превью -->
    <div class="preview-section" v-if="colors.length">
      <div class="preview-header">
        <h3>Превью интерфейса</h3>
        <label class="theme-toggle">
          <span class="toggle-label">{{ darkPreview ? 'Тёмная тема' : 'Светлая тема' }}</span>
          <div class="toggle-switch">
            <input type="checkbox" v-model="darkPreview">
            <span class="toggle-slider"></span>
          </div>
        </label>
      </div>
      
      <div class="preview-mockup" :class="{ dark: darkPreview }">
        <div class="mockup-header" :style="{ backgroundColor: colors[0]?.hex }">
          <span :style="{ color: getContrastColor(colors[0]?.hex) }">Шапка сайта</span>
        </div>
        <div class="mockup-content">
          <div class="mockup-sidebar" :style="{ backgroundColor: colors[1]?.hex }">
            <span :style="{ color: getContrastColor(colors[1]?.hex) }">Меню</span>
          </div>
          <div class="mockup-main">
            <div class="mockup-card" :style="{ borderColor: colors[2]?.hex }">
              <h4 :style="{ color: colors[0]?.hex }">Заголовок карточки</h4>
              <p>Текст контента</p>
              <button :style="{ backgroundColor: colors[2]?.hex, color: getContrastColor(colors[2]?.hex) }">
                Кнопка
              </button>
            </div>
            <div class="mockup-badges">
              <span 
                v-for="(color, i) in colors" 
                :key="i"
                class="badge"
                :style="{ backgroundColor: color.hex, color: getContrastColor(color.hex) }"
              >
                Цвет {{ i + 1 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сохранение -->
    <div class="save-section" v-if="colors.length">
      <input 
        v-model="paletteName" 
        placeholder="Название палитры..."
        class="palette-name-input"
      >
      <input 
        v-model="paletteTags" 
        placeholder="Теги через запятую..."
        class="palette-tags-input"
      >
      <button @click="savePalette" class="save-btn">
        Сохранить в библиотеку
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useColors } from '../composables/useColors'

export default {
  name: 'GeneratorView',
  
  setup() {
    const {
      currentPalette,
      baseColor,
      getContrastColor,
      hexToRgb,
      generateRandomPalette,
      generateAnalogousPalette,
      generateMonochromaticPalette,
      generateTriadicPalette,
      generateMoodPalette,
      savePaletteToLibrary
    } = useColors()

    const colors = ref([])
    const colorCount = ref(5)
    const colorFormat = ref('hex')
    const selectedType = ref('random')
    const selectedMood = ref('calm')
    const darkPreview = ref(false)
    const notification = ref(null)
    const paletteName = ref('')
    const paletteTags = ref('')

    const paletteTypes = [
      { id: 'random', name: 'Случайная', description: 'Случайные гармоничные цвета' },
      { id: 'analogous', name: 'Аналоговая', description: 'Соседние цвета на круге' },
      { id: 'monochromatic', name: 'Монохром', description: 'Оттенки одного цвета' },
      { id: 'triadic', name: 'Триада', description: '3 равноудалённых цвета' },
      { id: 'mood', name: 'Настроение', description: 'По настроению' }
    ]

    const moods = [
      { id: 'calm', name: 'Спокойные' },
      { id: 'energetic', name: 'Энергичные' },
      { id: 'professional', name: 'Деловые' },
      { id: 'warm', name: 'Тёплые' },
      { id: 'cool', name: 'Холодные' },
      { id: 'nature', name: 'Природа' }
    ]

    const generate = () => {
      let newColors = []
      
      switch (selectedType.value) {
        case 'analogous':
          newColors = generateAnalogousPalette(baseColor.value, colorCount.value)
          break
        case 'monochromatic':
          newColors = generateMonochromaticPalette(baseColor.value, colorCount.value)
          break
        case 'triadic':
          newColors = generateTriadicPalette(baseColor.value, colorCount.value)
          break
        case 'mood':
          newColors = generateMoodPalette(selectedMood.value, colorCount.value)
          break
        default:
          newColors = generateRandomPalette(colorCount.value)
      }

      // Сохраняем заблокированные цвета
      colors.value = newColors.map((color, index) => {
        if (colors.value[index]?.locked) {
          return colors.value[index]
        }
        return color
      })

      currentPalette.value = colors.value
    }

    const toggleLock = (index) => {
      colors.value[index].locked = !colors.value[index].locked
    }

    const formatColor = (hex) => {
      if (colorFormat.value === 'rgb') {
        const rgb = hexToRgb(hex)
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      }
      return hex
    }

    const copyColor = async (hex) => {
      const text = formatColor(hex)
      try {
        await navigator.clipboard.writeText(text)
        showNotification(`Скопировано: ${text}`, 'success')
      } catch (err) {
        showNotification('Ошибка копирования', 'error')
      }
    }

    const showNotification = (message, type = 'success') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 2000)
    }

    const savePalette = () => {
      if (colors.value.length === 0) return

      const tags = paletteTags.value
        .split(',')
        .map(t => t.trim())
        .filter(t => t)

      savePaletteToLibrary(colors.value, paletteName.value, tags)
      showNotification('Палитра сохранена!', 'success')
      paletteName.value = ''
      paletteTags.value = ''
    }

    // Загружаем сохранённую палитру при старте
    onMounted(() => {
      const saved = localStorage.getItem('currentPalette')
      if (saved) {
        try {
          colors.value = JSON.parse(saved)
          currentPalette.value = colors.value
        } catch (e) {
          generate()
        }
      } else {
        generate()
      }
    })

    return {
      colors,
      colorCount,
      colorFormat,
      selectedType,
      selectedMood,
      darkPreview,
      notification,
      paletteName,
      paletteTags,
      paletteTypes,
      moods,
      baseColor,
      generate,
      toggleLock,
      formatColor,
      copyColor,
      savePalette,
      getContrastColor
    }
  }
}
</script>

<style scoped>
.generator-view {
  max-width: 1000px;
  margin: 0 auto;
}

.generator-controls {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.control-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group.full-width {
  width: 100%;
}

.control-group label {
  font-size: 0.9rem;
  color: #aaa;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 0.95rem;
}

.count-buttons, .format-buttons {
  display: flex;
  gap: 0.5rem;
}

.count-buttons button, .format-buttons button {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.count-buttons button:hover, .format-buttons button:hover {
  border-color: #667eea;
  color: #fff;
}

.count-buttons button.active, .format-buttons button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.palette-types, .mood-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.palette-types button, .mood-buttons button {
  padding: 0.6rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 0.9rem;
}

.palette-types button:hover, .mood-buttons button:hover {
  border-color: #667eea;
  color: #fff;
}

.palette-types button.active, .mood-buttons button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.generate-btn {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  font-weight: 600;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.4);
}

.palette-section {
  margin-bottom: 2rem;
}

.palette {
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.color-card {
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  position: relative;
  transition: flex 0.3s;
}

.color-card:hover {
  flex: 1.2;
}

.lock-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  font-family: inherit;
  transition: all 0.2s;
  color: inherit;
}

.lock-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.1);
}

.lock-btn.locked {
  background: rgba(255, 215, 0, 0.5);
  color: #333;
}

.color-info {
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.color-info .color-value {
  display: block;
  font-weight: 600;
}

.copy-hint {
  display: block;
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 2px;
}

.empty-palette {
  text-align: center;
  padding: 4rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  color: #666;
}

.notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  z-index: 100;
}

.notification.success {
  background: linear-gradient(135deg, #00c853, #00e676);
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #f44336, #e91e63);
  color: white;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.preview-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-header h3 {
  margin: 0;
  color: #e8e8e8;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-label {
  color: #aaa;
  font-size: 0.9rem;
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3a3a4a 0%, #2a2a3a 100%);
  border-radius: 28px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #34c759 0%, #30b350 100%);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-switch input:focus + .toggle-slider {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(52, 199, 89, 0.3);
}

.preview-mockup {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  color: #333;
}

.preview-mockup.dark {
  background: #1a1a2e;
  color: #e8e8e8;
}

.mockup-header {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
}

.mockup-content {
  display: flex;
  min-height: 200px;
}

.mockup-sidebar {
  width: 80px;
  padding: 1rem;
  text-align: center;
  font-size: 0.8rem;
}

.mockup-main {
  flex: 1;
  padding: 1rem;
}

.mockup-card {
  border: 2px solid;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.mockup-card h4 {
  margin: 0 0 0.5rem;
}

.mockup-card p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.mockup-card button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.mockup-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.save-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.palette-name-input, .palette-tags-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #e8e8e8;
  border-radius: 10px;
  font-family: inherit;
}

.palette-name-input:focus, .palette-tags-input:focus {
  outline: none;
  border-color: #667eea;
}

.save-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.3s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .palette {
    flex-direction: column;
  }
  
  .color-card {
    min-height: 80px;
  }
  
  .mockup-content {
    flex-direction: column;
  }
  
  .mockup-sidebar {
    width: 100%;
  }
}
</style>

