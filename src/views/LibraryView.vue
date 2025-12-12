<template>
  <div class="library-view">
    <div class="library-header">
      <h2>Библиотека палитр</h2>
      <div class="library-stats">
        <span>Всего: {{ savedPalettes.length }}</span>
        <span>Избранных: {{ favoritesCount }}</span>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="library-filters">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по названию или тегам..."
        class="search-input"
      >
      
      <div class="filter-buttons">
        <button 
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
        >
          Все
        </button>
        <button 
          :class="{ active: filter === 'favorites' }"
          @click="filter = 'favorites'"
        >
          Избранные
        </button>
      </div>

      <select v-model="sortBy" class="sort-select">
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="name">По названию</option>
      </select>
    </div>

    <!-- Список палитр -->
    <div class="palettes-grid" v-if="filteredPalettes.length">
      <div 
        v-for="palette in filteredPalettes" 
        :key="palette.id"
        class="palette-card"
      >
        <div class="palette-colors">
          <div 
            v-for="(color, index) in palette.colors.slice(0, 5)" 
            :key="index"
            class="mini-color"
            :style="{ backgroundColor: color.hex }"
            @click="copyColor(color.hex)"
          ></div>
        </div>

        <div class="palette-info">
          <h3>{{ palette.name }}</h3>
          <div class="palette-tags" v-if="palette.tags?.length">
            <span v-for="tag in palette.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
          <span class="palette-date">{{ formatDate(palette.createdAt) }}</span>
        </div>

        <div class="palette-actions">
          <button 
            @click="toggleFavorite(palette.id)"
            class="action-btn"
            :class="{ favorite: palette.isFavorite }"
            title="Избранное"
          >
            {{ palette.isFavorite ? 'Fav' : '-' }}
          </button>
          <button 
            @click="loadPalette(palette)"
            class="action-btn"
            title="Загрузить"
          >
            Load
          </button>
          <button 
            @click="exportPalette(palette)"
            class="action-btn"
            title="Экспорт"
          >
            Export
          </button>
          <button 
            @click="confirmDelete(palette.id)"
            class="action-btn delete"
            title="Удалить"
          >
            Del
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-library">
      <div v-if="searchQuery || filter === 'favorites'">
        <p>Ничего не найдено</p>
        <button @click="resetFilters" class="reset-btn">Сбросить фильтры</button>
      </div>
      <div v-else>
        <p>Библиотека пуста</p>
        <p class="hint">Сохраните палитру из генератора</p>
        <router-link to="/" class="goto-generator">
          Перейти к генератору
        </router-link>
      </div>
    </div>

    <!-- Модальное окно удаления -->
    <div v-if="deleteConfirmId" class="modal-overlay" @click="deleteConfirmId = null">
      <div class="modal" @click.stop>
        <h3>Удалить палитру?</h3>
        <p>Это действие нельзя отменить</p>
        <div class="modal-actions">
          <button @click="deleteConfirmId = null" class="cancel-btn">Отмена</button>
          <button @click="deletePalette" class="confirm-delete-btn">Удалить</button>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useColors } from '../composables/useColors'

export default {
  name: 'LibraryView',
  
  setup() {
    const router = useRouter()
    const {
      savedPalettes,
      currentPalette,
      toggleFavorite: toggleFav,
      deletePaletteFromLibrary
    } = useColors()

    const searchQuery = ref('')
    const filter = ref('all')
    const sortBy = ref('newest')
    const deleteConfirmId = ref(null)
    const notification = ref(null)

    const favoritesCount = computed(() => 
      savedPalettes.value.filter(p => p.isFavorite).length
    )

    const filteredPalettes = computed(() => {
      let result = [...savedPalettes.value]

      // Фильтр по избранным
      if (filter.value === 'favorites') {
        result = result.filter(p => p.isFavorite)
      }

      // Поиск
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Сортировка
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt)
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return new Date(b.createdAt) - new Date(a.createdAt)
        }
      })

      return result
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    const toggleFavorite = (id) => {
      toggleFav(id)
    }

    const loadPalette = (palette) => {
      currentPalette.value = [...palette.colors]
      localStorage.setItem('currentPalette', JSON.stringify(palette.colors))
      showNotification('Палитра загружена')
      router.push('/')
    }

    const exportPalette = (palette) => {
      const colors = palette.colors.map(c => c.hex).join(', ')
      navigator.clipboard.writeText(colors)
      showNotification('Цвета скопированы')
    }

    const copyColor = async (hex) => {
      await navigator.clipboard.writeText(hex)
      showNotification(`Скопировано: ${hex}`)
    }

    const confirmDelete = (id) => {
      deleteConfirmId.value = id
    }

    const deletePalette = () => {
      deletePaletteFromLibrary(deleteConfirmId.value)
      deleteConfirmId.value = null
      showNotification('Палитра удалена')
    }

    const resetFilters = () => {
      searchQuery.value = ''
      filter.value = 'all'
    }

    const showNotification = (message) => {
      notification.value = message
      setTimeout(() => {
        notification.value = null
      }, 2000)
    }

    return {
      savedPalettes,
      searchQuery,
      filter,
      sortBy,
      deleteConfirmId,
      notification,
      favoritesCount,
      filteredPalettes,
      formatDate,
      toggleFavorite,
      loadPalette,
      exportPalette,
      copyColor,
      confirmDelete,
      deletePalette,
      resetFilters
    }
  }
}
</script>

<style scoped>
.library-view {
  max-width: 1100px;
  margin: 0 auto;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.library-header h2 {
  margin: 0;
  color: #e8e8e8;
}

.library-stats {
  display: flex;
  gap: 1.5rem;
  color: #888;
}

.library-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e8e8e8;
  border-radius: 10px;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-buttons button {
  padding: 0.75rem 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.filter-buttons button:hover {
  border-color: #667eea;
  color: #fff;
}

.filter-buttons button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.sort-select {
  padding: 0.75rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: #e8e8e8;
  border-radius: 10px;
  font-family: inherit;
  cursor: pointer;
}

.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.palette-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s;
}

.palette-card:hover {
  transform: translateY(-4px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.palette-colors {
  display: flex;
  height: 80px;
}

.mini-color {
  flex: 1;
  cursor: pointer;
  transition: flex 0.2s;
}

.mini-color:hover {
  flex: 1.3;
}

.palette-info {
  padding: 1rem;
}

.palette-info h3 {
  margin: 0 0 0.5rem;
  color: #e8e8e8;
  font-size: 1.1rem;
}

.palette-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.tag {
  padding: 0.2rem 0.6rem;
  background: rgba(102, 126, 234, 0.2);
  color: #a5b4fc;
  border-radius: 12px;
  font-size: 0.75rem;
}

.palette-date {
  font-size: 0.8rem;
  color: #666;
}

.palette-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.7rem;
  font-family: inherit;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.action-btn.favorite {
  color: #ffd700;
}

.action-btn.delete:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.empty-library {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
}

.empty-library p {
  color: #888;
  margin-bottom: 0.5rem;
}

.empty-library .hint {
  font-size: 0.9rem;
  color: #666;
}

.reset-btn, .goto-generator {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1a1a2e;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal h3 {
  margin: 0 0 0.5rem;
  color: #e8e8e8;
}

.modal p {
  color: #888;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
}

.confirm-delete-btn {
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
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

