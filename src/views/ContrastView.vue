<template>
  <div class="contrast-view">
    <h2>Проверка контрастности WCAG</h2>
    <p class="subtitle">Анализируйте доступность цветовых комбинаций</p>

    <!-- Выбор цветов -->
    <div class="color-selectors">
      <div class="color-selector">
        <label>Цвет текста:</label>
        <div class="color-input-group">
          <input type="color" v-model="textColor" class="color-picker">
          <input type="text" v-model="textColor" class="hex-input">
        </div>
      </div>

      <button @click="swapColors" class="swap-btn" title="Поменять местами">
        Swap
      </button>

      <div class="color-selector">
        <label>Цвет фона:</label>
        <div class="color-input-group">
          <input type="color" v-model="bgColor" class="color-picker">
          <input type="text" v-model="bgColor" class="hex-input">
        </div>
      </div>
    </div>

    <!-- Результат проверки -->
    <div class="contrast-result">
      <div class="ratio-display">
        <span class="ratio-value">{{ contrastRatio.toFixed(2) }}</span>
        <span class="ratio-label">:1</span>
      </div>

      <div class="wcag-levels">
        <div 
          class="level-badge"
          :class="getLevelClass('AA-normal')"
        >
          <span class="level-name">AA Обычный</span>
          <span class="level-status">{{ passesAA ? 'OK' : 'NO' }}</span>
          <span class="level-req">≥ 4.5:1</span>
        </div>

        <div 
          class="level-badge"
          :class="getLevelClass('AA-large')"
        >
          <span class="level-name">AA Крупный</span>
          <span class="level-status">{{ passesAALarge ? 'OK' : 'NO' }}</span>
          <span class="level-req">≥ 3:1</span>
        </div>

        <div 
          class="level-badge"
          :class="getLevelClass('AAA-normal')"
        >
          <span class="level-name">AAA Обычный</span>
          <span class="level-status">{{ passesAAA ? 'OK' : 'NO' }}</span>
          <span class="level-req">≥ 7:1</span>
        </div>

        <div 
          class="level-badge"
          :class="getLevelClass('AAA-large')"
        >
          <span class="level-name">AAA Крупный</span>
          <span class="level-status">{{ passesAAALarge ? 'OK' : 'NO' }}</span>
          <span class="level-req">≥ 4.5:1</span>
        </div>
      </div>
    </div>

    <!-- Превью текста -->
    <div class="preview-section">
      <h3>Превью</h3>
      
      <div 
        class="text-preview"
        :style="{ backgroundColor: bgColor, color: textColor }"
      >
        <h1>Заголовок первого уровня</h1>
        <h2>Заголовок второго уровня</h2>
        <p class="large-text">Крупный текст (18pt+) - используется для основных заголовков и важных элементов интерфейса.</p>
        <p class="normal-text">Обычный текст (14px) — используется для основного контента, параграфов, описаний и прочего текстового содержимого на странице.</p>
        <p class="small-text">Мелкий текст (12px) — сноски, подписи, метаданные.</p>
        
        <div class="button-preview">
          <button :style="{ backgroundColor: textColor, color: bgColor }">
            Кнопка
          </button>
          <a :style="{ color: textColor }">Ссылка для навигации</a>
        </div>
      </div>
    </div>

    <!-- Анализ палитры из генератора -->
    <div class="palette-analysis" v-if="currentPalette.length">
      <h3>Анализ текущей палитры</h3>
      
      <div class="contrast-matrix">
        <div class="matrix-header">
          <div class="matrix-cell corner"></div>
          <div 
            v-for="(color, i) in currentPalette" 
            :key="'h-'+i"
            class="matrix-cell header-cell"
            :style="{ backgroundColor: color.hex }"
          >
            {{ i + 1 }}
          </div>
        </div>

        <div 
          v-for="(rowColor, rowIndex) in currentPalette" 
          :key="'r-'+rowIndex"
          class="matrix-row"
        >
          <div 
            class="matrix-cell header-cell"
            :style="{ backgroundColor: rowColor.hex }"
          >
            {{ rowIndex + 1 }}
          </div>
          
          <div 
            v-for="(colColor, colIndex) in currentPalette" 
            :key="'c-'+colIndex"
            class="matrix-cell"
            :class="getMatrixCellClass(rowColor.hex, colColor.hex)"
            :title="getContrastRatio(rowColor.hex, colColor.hex).toFixed(2) + ':1'"
            @click="selectColors(rowColor.hex, colColor.hex)"
          >
            {{ getContrastRatio(rowColor.hex, colColor.hex).toFixed(1) }}
          </div>
        </div>
      </div>

      <div class="matrix-legend">
        <span class="legend-item pass-aaa">AAA (≥7:1)</span>
        <span class="legend-item pass-aa">AA (≥4.5:1)</span>
        <span class="legend-item pass-large">Крупный (≥3:1)</span>
        <span class="legend-item fail">Недостаточно</span>
      </div>
    </div>

    <!-- Рекомендации -->
    <div class="recommendations">
      <h3>Рекомендации WCAG</h3>
      <ul>
        <li><strong>AA обычный текст:</strong> Минимальный коэффициент 4.5:1 для текста менее 18pt (или 14pt bold)</li>
        <li><strong>AA крупный текст:</strong> Минимальный коэффициент 3:1 для текста 18pt+ (или 14pt+ bold)</li>
        <li><strong>AAA обычный текст:</strong> Улучшенный коэффициент 7:1 для лучшей читаемости</li>
        <li><strong>AAA крупный текст:</strong> Улучшенный коэффициент 4.5:1 для крупного текста</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useColors } from '../composables/useColors'

export default {
  name: 'ContrastView',
  
  setup() {
    const {
      currentPalette,
      getContrastRatio: calcContrast
    } = useColors()

    const textColor = ref('#1a1a2e')
    const bgColor = ref('#ffffff')

    const contrastRatio = computed(() => {
      return calcContrast(textColor.value, bgColor.value)
    })

    const passesAALarge = computed(() => contrastRatio.value >= 3)
    const passesAA = computed(() => contrastRatio.value >= 4.5)
    const passesAAALarge = computed(() => contrastRatio.value >= 4.5)
    const passesAAA = computed(() => contrastRatio.value >= 7)

    const swapColors = () => {
      const temp = textColor.value
      textColor.value = bgColor.value
      bgColor.value = temp
    }

    const getLevelClass = (level) => {
      switch (level) {
        case 'AA-normal':
          return passesAA.value ? 'pass' : 'fail'
        case 'AA-large':
          return passesAALarge.value ? 'pass' : 'fail'
        case 'AAA-normal':
          return passesAAA.value ? 'pass' : 'fail'
        case 'AAA-large':
          return passesAAALarge.value ? 'pass' : 'fail'
        default:
          return 'fail'
      }
    }

    const getContrastRatio = (color1, color2) => {
      return calcContrast(color1, color2)
    }

    const getMatrixCellClass = (color1, color2) => {
      const ratio = calcContrast(color1, color2)
      if (ratio >= 7) return 'pass-aaa'
      if (ratio >= 4.5) return 'pass-aa'
      if (ratio >= 3) return 'pass-large'
      return 'fail'
    }

    const selectColors = (color1, color2) => {
      textColor.value = color1
      bgColor.value = color2
    }

    return {
      textColor,
      bgColor,
      contrastRatio,
      passesAA,
      passesAALarge,
      passesAAA,
      passesAAALarge,
      currentPalette,
      swapColors,
      getLevelClass,
      getContrastRatio,
      getMatrixCellClass,
      selectColors
    }
  }
}
</script>

<style scoped>
.contrast-view {
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

.color-selectors {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.color-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-selector label {
  color: #aaa;
  font-size: 0.9rem;
}

.color-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 60px;
  height: 45px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.hex-input {
  width: 100px;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e8e8e8;
  border-radius: 10px;
  font-family: monospace;
  text-transform: uppercase;
}

.swap-btn {
  padding: 0.5rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s;
}

.swap-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.contrast-result {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ratio-display {
  margin-bottom: 1.5rem;
}

.ratio-value {
  font-size: 4rem;
  font-weight: 700;
  color: #e8e8e8;
}

.ratio-label {
  font-size: 2rem;
  color: #888;
}

.wcag-levels {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.level-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  min-width: 120px;
}

.level-badge.pass {
  background: rgba(0, 200, 83, 0.15);
  border: 2px solid #00c853;
}

.level-badge.fail {
  background: rgba(244, 67, 54, 0.15);
  border: 2px solid #f44336;
}

.level-name {
  font-weight: 600;
  color: #e8e8e8;
  margin-bottom: 0.25rem;
}

.level-status {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.level-badge.pass .level-status {
  color: #00c853;
  font-weight: bold;
}

.level-badge.fail .level-status {
  color: #f44336;
  font-weight: bold;
}

.level-req {
  font-size: 0.8rem;
  color: #888;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  color: #e8e8e8;
  margin-bottom: 1rem;
}

.text-preview {
  padding: 2rem;
  border-radius: 16px;
  transition: all 0.3s;
}

.text-preview h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.text-preview h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.text-preview .large-text {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.text-preview .normal-text {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.text-preview .small-text {
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.button-preview {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-top: 1rem;
}

.button-preview button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.button-preview a {
  text-decoration: underline;
  cursor: pointer;
}

.palette-analysis {
  margin-bottom: 2rem;
}

.palette-analysis h3 {
  color: #e8e8e8;
  margin-bottom: 1rem;
}

.contrast-matrix {
  display: inline-block;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.matrix-header, .matrix-row {
  display: flex;
}

.matrix-cell {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 4px;
  margin: 2px;
}

.matrix-cell:hover {
  transform: scale(1.1);
  z-index: 10;
}

.matrix-cell.corner {
  background: transparent;
  cursor: default;
}

.matrix-cell.header-cell {
  cursor: default;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.matrix-cell.pass-aaa {
  background: #00c853;
  color: white;
}

.matrix-cell.pass-aa {
  background: #ffd600;
  color: #333;
}

.matrix-cell.pass-large {
  background: #ff9800;
  color: white;
}

.matrix-cell.fail {
  background: #f44336;
  color: white;
}

.matrix-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.legend-item.pass-aaa {
  background: #00c853;
  color: white;
}

.legend-item.pass-aa {
  background: #ffd600;
  color: #333;
}

.legend-item.pass-large {
  background: #ff9800;
  color: white;
}

.legend-item.fail {
  background: #f44336;
  color: white;
}

.recommendations {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.recommendations h3 {
  color: #e8e8e8;
  margin-bottom: 1rem;
}

.recommendations ul {
  list-style: none;
  padding: 0;
}

.recommendations li {
  color: #aaa;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
}

.recommendations li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #667eea;
}

.recommendations li strong {
  color: #e8e8e8;
}
</style>

