import { ref, computed } from 'vue'

// Общее состояние палитры (shared across components)
const currentPalette = ref([])
const savedPalettes = ref([])
const baseColor = ref('#667eea')

// Загружаем сохранённые палитры из localStorage
const loadSavedPalettes = () => {
  const saved = localStorage.getItem('paletteLibrary')
  if (saved) {
    try {
      savedPalettes.value = JSON.parse(saved)
    } catch (e) {
      savedPalettes.value = []
    }
  }
}

// Сохраняем палитры в localStorage
const persistPalettes = () => {
  localStorage.setItem('paletteLibrary', JSON.stringify(savedPalettes.value))
}

export function useColors() {
  // Конвертация HEX в RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    }
    return { r: 0, g: 0, b: 0 }
  }

  // Конвертация RGB в HEX
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('').toUpperCase()
  }

  // Конвертация HEX в HSL
  const hexToHsl = (hex) => {
    const rgb = hexToRgb(hex)
    let r = rgb.r / 255
    let g = rgb.g / 255
    let b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  // Конвертация HSL в HEX
  const hslToHex = (h, s, l) => {
    s /= 100
    l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = n => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
    }
    return rgbToHex(f(0), f(8), f(4))
  }

  // Расчёт относительной яркости (для WCAG)
  const getLuminance = (hex) => {
    const rgb = hexToRgb(hex)
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  // Расчёт контрастности между двумя цветами (WCAG)
  const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    return (brightest + 0.05) / (darkest + 0.05)
  }

  // Получить уровень WCAG
  const getWcagLevel = (ratio) => {
    if (ratio >= 7) return { level: 'AAA', text: 'Отлично', color: '#00c853' }
    if (ratio >= 4.5) return { level: 'AA', text: 'Хорошо', color: '#ffd600' }
    if (ratio >= 3) return { level: 'AA Large', text: 'Крупный текст', color: '#ff9800' }
    return { level: 'Fail', text: 'Недостаточно', color: '#f44336' }
  }

  // Получить контрастный цвет для текста
  const getContrastColor = (hex) => {
    const lum = getLuminance(hex)
    return lum > 0.179 ? '#1a1a2e' : '#ffffff'
  }

  // ГЕНЕРАЦИЯ ПАЛИТР

  // Случайная палитра
  const generateRandomPalette = (count) => {
    const baseHue = Math.random() * 360
    const colors = []
    
    for (let i = 0; i < count; i++) {
      const hue = (baseHue + (i * (360 / count)) + Math.random() * 30 - 15) % 360
      const sat = 55 + Math.random() * 35
      const light = 40 + Math.random() * 30
      colors.push({
        hex: hslToHex(hue, sat, light),
        locked: false
      })
    }
    
    return colors
  }

  // Аналоговая палитра (соседние цвета)
  const generateAnalogousPalette = (baseHex, count) => {
    const hsl = hexToHsl(baseHex)
    const colors = []
    const spread = 30 // градусов от базового

    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * (spread / Math.floor(count / 2))
      const hue = (hsl.h + offset + 360) % 360
      colors.push({
        hex: hslToHex(hue, hsl.s, hsl.l + (i % 2 === 0 ? 5 : -5)),
        locked: false
      })
    }
    
    return colors
  }

  // Монохромная палитра (оттенки одного цвета)
  const generateMonochromaticPalette = (baseHex, count) => {
    const hsl = hexToHsl(baseHex)
    const colors = []

    for (let i = 0; i < count; i++) {
      const light = 25 + (i * (50 / (count - 1)))
      const sat = hsl.s - (i * 5)
      colors.push({
        hex: hslToHex(hsl.h, Math.max(20, sat), light),
        locked: false
      })
    }
    
    return colors
  }

  // Триадная палитра (3 цвета на равном расстоянии)
  const generateTriadicPalette = (baseHex, count) => {
    const hsl = hexToHsl(baseHex)
    const colors = []
    const angles = [0, 120, 240]

    for (let i = 0; i < count; i++) {
      const angleIndex = i % 3
      const hue = (hsl.h + angles[angleIndex]) % 360
      const lightVariation = i < 3 ? 0 : (i - 2) * 10
      colors.push({
        hex: hslToHex(hue, hsl.s, hsl.l + lightVariation - 10),
        locked: false
      })
    }
    
    return colors
  }

  // Комплементарная палитра (противоположные цвета)
  const generateComplementaryPalette = (baseHex, count) => {
    const hsl = hexToHsl(baseHex)
    const colors = []

    for (let i = 0; i < count; i++) {
      const isComplement = i >= Math.ceil(count / 2)
      const hue = isComplement ? (hsl.h + 180) % 360 : hsl.h
      const lightOffset = (i % Math.ceil(count / 2)) * 15 - 15
      colors.push({
        hex: hslToHex(hue, hsl.s, Math.max(25, Math.min(75, hsl.l + lightOffset))),
        locked: false
      })
    }
    
    return colors
  }

  // Split-Complementary палитра
  const generateSplitComplementaryPalette = (baseHex, count) => {
    const hsl = hexToHsl(baseHex)
    const colors = []
    const angles = [0, 150, 210]

    for (let i = 0; i < count; i++) {
      const angleIndex = i % 3
      const hue = (hsl.h + angles[angleIndex]) % 360
      const lightVariation = Math.floor(i / 3) * 12
      colors.push({
        hex: hslToHex(hue, hsl.s, hsl.l + lightVariation - 10),
        locked: false
      })
    }
    
    return colors
  }

  // Палитры по настроению
  const generateMoodPalette = (mood, count) => {
    const moodSettings = {
      calm: { hueRange: [180, 240], sat: [30, 50], light: [60, 80] },
      energetic: { hueRange: [0, 60], sat: [70, 95], light: [45, 65] },
      professional: { hueRange: [200, 230], sat: [20, 45], light: [30, 60] },
      warm: { hueRange: [20, 50], sat: [60, 85], light: [50, 70] },
      cool: { hueRange: [180, 220], sat: [40, 70], light: [45, 70] },
      nature: { hueRange: [80, 150], sat: [40, 70], light: [40, 65] }
    }

    const settings = moodSettings[mood] || moodSettings.calm
    const colors = []
    const hueStep = (settings.hueRange[1] - settings.hueRange[0]) / count

    for (let i = 0; i < count; i++) {
      const hue = settings.hueRange[0] + (i * hueStep) + Math.random() * 10
      const sat = settings.sat[0] + Math.random() * (settings.sat[1] - settings.sat[0])
      const light = settings.light[0] + Math.random() * (settings.light[1] - settings.light[0])
      colors.push({
        hex: hslToHex(hue, sat, light),
        locked: false
      })
    }
    
    return colors
  }

  // Сохранить палитру в библиотеку
  const savePaletteToLibrary = (palette, name, tags = []) => {
    const newPalette = {
      id: Date.now(),
      name: name || `Палитра ${savedPalettes.value.length + 1}`,
      colors: [...palette],
      tags: tags,
      createdAt: new Date().toISOString(),
      isFavorite: false
    }
    
    savedPalettes.value.unshift(newPalette)
    persistPalettes()
    
    return newPalette
  }

  // Удалить палитру из библиотеки
  const deletePaletteFromLibrary = (id) => {
    savedPalettes.value = savedPalettes.value.filter(p => p.id !== id)
    persistPalettes()
  }

  // Переключить избранное
  const toggleFavorite = (id) => {
    const palette = savedPalettes.value.find(p => p.id === id)
    if (palette) {
      palette.isFavorite = !palette.isFavorite
      persistPalettes()
    }
  }

  // Инициализация
  loadSavedPalettes()

  return {
    // Состояние
    currentPalette,
    savedPalettes,
    baseColor,
    
    // Конвертации
    hexToRgb,
    rgbToHex,
    hexToHsl,
    hslToHex,
    
    // WCAG
    getLuminance,
    getContrastRatio,
    getWcagLevel,
    getContrastColor,
    
    // Генерация
    generateRandomPalette,
    generateAnalogousPalette,
    generateMonochromaticPalette,
    generateTriadicPalette,
    generateComplementaryPalette,
    generateSplitComplementaryPalette,
    generateMoodPalette,
    
    // Библиотека
    savePaletteToLibrary,
    deletePaletteFromLibrary,
    toggleFavorite,
    loadSavedPalettes
  }
}

