<template>
  <div id="app">
    <header class="app-header">
      <h1>Spektrum</h1>
      <p>Твой инструмент для работы с цветом</p>
    </header>

    <!-- Навигация -->
    <nav class="main-nav">
      <router-link to="/" class="nav-link" exact-active-class="active">
        Генератор
      </router-link>
      <router-link to="/library" class="nav-link" active-class="active">
        Библиотека
      </router-link>
      <router-link to="/contrast" class="nav-link" active-class="active">
        Контраст
      </router-link>
      <router-link to="/export" class="nav-link" active-class="active">
        Экспорт
      </router-link>
    </nav>

    <!-- Основной контент -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <p class="footer-brand">Spektrum v1.0</p>
        <p class="footer-tech">Vue 3 + Vite + Vue Router</p>
        <p class="footer-copy">Сделано с вниманием к цвету</p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  background: linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  color: #e8e8e8;
  line-height: 1.6;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  position: relative;
  z-index: 1;
  font-weight: 700;
  letter-spacing: -1px;
}

.app-header p {
  opacity: 0.95;
  font-size: 1.1rem;
  position: relative;
  z-index: 1;
  font-weight: 400;
}

/* Навигация */
.main-nav {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: #888;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  border: 2px solid transparent;
}

.nav-link:hover {
  color: #e8e8e8;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Основное содержимое */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Переходы между страницами */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Подвал */
.app-footer {
  background: rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 1.5rem 1rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-brand {
  font-weight: 600;
  color: #a5b4fc;
  font-size: 0.95rem;
}

.footer-tech {
  color: #666;
  font-size: 0.85rem;
}

.footer-copy {
  color: #555;
  font-size: 0.8rem;
  font-style: italic;
}

/* Скроллбар */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
}

::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.6);
}

/* Мобильная адаптация */
@media (max-width: 640px) {
  .app-header h1 {
    font-size: 1.8rem;
  }
  
  .app-header p {
    font-size: 0.95rem;
  }
  
  .main-nav {
    gap: 0.25rem;
    padding: 0.75rem;
  }
  
  .nav-link {
    padding: 0.6rem 0.9rem;
    font-size: 0.85rem;
  }
  
  .nav-link {
    font-size: 0.8rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
