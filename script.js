const TODOS_KEY = 'todo-list-todos';
const TODO_BADGES_KEY = 'todo-list-badges';

const TODO_BADGE_CONFIG = [
    { id: 'todo-first', name: '初次尝试', emoji: '🌱', condition: '完成第一个待办任务' },
    { id: 'todo-5', name: '小试牛刀', emoji: '⚡', condition: '完成5个待办任务' },
    { id: 'todo-10', name: '渐入佳境', emoji: '🎯', condition: '完成10个待办任务' },
    { id: 'todo-25', name: '效率达人', emoji: '🚀', condition: '完成25个待办任务' },
    { id: 'todo-50', name: '任务终结者', emoji: '💪', condition: '完成50个待办任务' },
    { id: 'todo-100', name: '超级英雄', emoji: '🦸', condition: '完成100个待办任务' },
    { id: 'todo-perfect-day', name: '完美一天', emoji: '🌟', condition: '一天内完成所有任务' },
    { id: 'todo-urgent', name: '紧急救援', emoji: '🚨', condition: '完成一个高优先级任务' },
];

const MOTIVATIONAL_MESSAGES = [
    '太棒了！继续保持！', '你真厉害！', '做得好！', '完美！',
    '太优秀了！', '你是最棒的！', '继续加油！', '胜利在望！',
];

let todos = [];
let todoBadges = [];
let currentFilter = 'all';

function init() {
    loadTodos();
    renderTodos();
    updateTodoStats();
    renderTodoBadges();
}

function isLocalStorageAvailable() {
    try {
        const key = '__storage_test__';
        localStorage.setItem(key, key);
        localStorage.removeItem(key);
        return true;
    } catch (e) { return false; }
}

const STORAGE_AVAILABLE = isLocalStorageAvailable();

function safeParse(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    try { return JSON.parse(jsonString); }
    catch (e) { console.warn('数据解析失败:', e); return defaultValue; }
}

function safeSave(key, data) {
    if (!STORAGE_AVAILABLE) return;
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('保存数据失败:', e); }
}

function safeGet(key, defaultValue) {
    if (!STORAGE_AVAILABLE) return defaultValue;
    try { return safeParse(localStorage.getItem(key), defaultValue); }
    catch (e) { console.warn('获取数据失败:', e); return defaultValue; }
}

function loadTodos() {
    const savedTodos = safeGet(TODOS_KEY, null);
    const savedTodoBadges = safeGet(TODO_BADGES_KEY, null);
    
    todos = (savedTodos && Array.isArray(savedTodos)) ? savedTodos : [];
    todoBadges = (savedTodoBadges && Array.isArray(savedTodoBadges)) 
        ? savedTodoBadges 
        : TODO_BADGE_CONFIG.map(b => ({ ...b, unlocked: false }));
    
    if (!savedTodoBadges) saveTodoBadges();
    
    if (!STORAGE_AVAILABLE) alert('注意：浏览器存储功能不可用，数据将不会保存。');
}

function saveTodos() { safeSave(TODOS_KEY, todos); }
function saveTodoBadges() { safeSave(TODO_BADGES_KEY, todoBadges); }

function renderTodos() {
    const container = document.getElementById('todo-list');
    
    let filteredTodos = currentFilter === 'all' ? todos 
        : currentFilter === 'pending' ? todos.filter(t => !t.completed) 
        : todos.filter(t => t.completed);
    
    filteredTodos.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) 
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
        return a.deadline ? -1 : 1;
    });
    
    if (filteredTodos.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-white/50">暂无待办事项</div>';
        return;
    }
    
    const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
    
    container.innerHTML = filteredTodos.map(todo => {
        const deadlineText = todo.deadline ? formatDeadline(todo.deadline) : '';
        const isOverdue = todo.deadline && !todo.completed && new Date(todo.deadline) < new Date();
        
        return `<div class="todo-card ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${todo.id}">
            <div class="flex items-start gap-3">
                <button class="todo-check-btn ${todo.completed ? 'completed' : ''}" onclick="toggleTodo('${todo.id}')" title="${todo.completed ? '标记为未完成' : '标记为已完成'}">${todo.completed ? '✓' : ''}</button>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span>${priorityEmoji[todo.priority]}</span>
                        <span class="text-white font-semibold ${todo.completed ? 'line-through opacity-60' : ''}">${escapeHtml(todo.text)}</span>
                    </div>
                    ${deadlineText ? `<div class="text-sm ${isOverdue ? 'text-red-400' : 'text-blue-300'} flex items-center gap-1"><i class="fas fa-clock"></i><span>${deadlineText}</span>${isOverdue ? '<span class="text-red-400 font-semibold">(已过期)</span>' : ''}</div>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openEditTodoModal('${todo.id}')" class="text-white/70 hover:text-white p-2" title="编辑"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTodo('${todo.id}')" class="text-white/70 hover:text-red-400 p-2" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function formatDeadline(deadline) {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date - now;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (Math.abs(diff) < 86400000) {
        if (diff < 0) return `已过期 ${hours}:${minutes}`;
        if (diff < 3600000) return `即将到期 ${Math.floor(diff / 60000)}分钟后`;
        return `今天 ${hours}:${minutes}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('todo-input').value.trim();
    const deadline = document.getElementById('todo-deadline').value;
    const priority = document.getElementById('todo-priority').value;
    
    if (!text) { alert('请输入任务内容'); return; }
    if (text.length > 100) { alert('任务内容不能超过100个字符'); return; }
    
    todos.push({ id: Date.now().toString(), text, deadline: deadline || null, priority, completed: false, createdAt: new Date().toISOString() });
    saveTodos();
    
    document.getElementById('todo-input').value = '';
    document.getElementById('todo-deadline').value = '';
    document.getElementById('todo-priority').value = 'medium';
    
    renderTodos();
    updateTodoStats();
    checkTodoBadges();
});

let lastToggleTime = 0;
function toggleTodo(todoId) {
    const now = Date.now();
    if (now - lastToggleTime < 300) return;
    lastToggleTime = now;
    
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    const wasCompleted = todo.completed;
    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date().toISOString() : undefined;
    
    saveTodos();
    renderTodos();
    updateTodoStats();
    
    if (!wasCompleted && todo.completed) {
        showTodoSuccessAnimation();
        checkTodoBadges();
    }
}

function showTodoSuccessAnimation() {
    const animation = document.getElementById('todo-success-animation');
    const message = document.getElementById('todo-success-message');
    message.textContent = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    animation.classList.remove('hidden');
    setTimeout(() => animation.classList.add('hidden'), 1500);
}

function deleteTodo(todoId) {
    if (!confirm('确定要删除这个待办事项吗？')) return;
    todos = todos.filter(t => t.id !== todoId);
    saveTodos();
    renderTodos();
    updateTodoStats();
}

function openEditTodoModal(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    document.getElementById('edit-todo-id').value = todo.id;
    document.getElementById('edit-todo-text').value = todo.text;
    document.getElementById('edit-todo-deadline').value = todo.deadline || '';
    document.getElementById('edit-todo-priority').value = todo.priority;
    document.getElementById('edit-todo-modal').classList.remove('hidden');
}

function closeEditTodoModal() {
    document.getElementById('edit-todo-modal').classList.add('hidden');
}

document.getElementById('edit-todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-todo-id').value;
    const text = document.getElementById('edit-todo-text').value.trim();
    const deadline = document.getElementById('edit-todo-deadline').value;
    const priority = document.getElementById('edit-todo-priority').value;
    
    if (!text) { alert('请输入任务内容'); return; }
    if (text.length > 100) { alert('任务内容不能超过100个字符'); return; }
    
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.text = text;
        todo.deadline = deadline || null;
        todo.priority = priority;
        saveTodos();
        closeEditTodoModal();
        renderTodos();
        updateTodoStats();
    }
});

function filterTodos(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filter}`).classList.add('active');
    renderTodos();
}

function updateTodoStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const trophies = todoBadges.filter(b => b.unlocked).length;
    
    document.getElementById('todo-total').textContent = total;
    document.getElementById('todo-pending').textContent = pending;
    document.getElementById('todo-completed').textContent = completed;
    document.getElementById('todo-trophies').textContent = trophies;
    document.getElementById('header-trophies').textContent = trophies;
    
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('todo-progress-text').textContent = `${progress}%`;
    document.getElementById('todo-progress-bar').style.width = `${progress}%`;
}

function renderTodoBadges() {
    const container = document.getElementById('todo-badges');
    container.innerHTML = todoBadges.map(badge => `<div class="badge-item ${badge.unlocked ? 'unlocked' : ''}" title="${badge.name}: ${badge.condition}"><span>${badge.emoji}</span><span class="text-xs text-white/70 mt-1">${badge.name}</span></div>`).join('');
}

function checkTodoBadges() {
    const completedCount = todos.filter(t => t.completed).length;
    const hasHighPriorityCompleted = todos.some(t => t.completed && t.priority === 'high');
    const today = new Date().toISOString().split('T')[0];
    const todayTodos = todos.filter(t => t.createdAt.startsWith(today));
    const isPerfectDay = todayTodos.length > 0 && todayTodos.every(t => t.completed);
    
    const conditions = {
        'todo-first': completedCount >= 1,
        'todo-5': completedCount >= 5,
        'todo-10': completedCount >= 10,
        'todo-25': completedCount >= 25,
        'todo-50': completedCount >= 50,
        'todo-100': completedCount >= 100,
        'todo-perfect-day': isPerfectDay,
        'todo-urgent': hasHighPriorityCompleted,
    };
    
    todoBadges.forEach(badge => {
        if (!badge.unlocked && conditions[badge.id]) unlockTodoBadge(badge.id);
    });
}

function unlockTodoBadge(badgeId) {
    const badge = todoBadges.find(b => b.id === badgeId);
    if (badge && !badge.unlocked) {
        badge.unlocked = true;
        saveTodoBadges();
        renderTodoBadges();
        updateTodoStats();
        setTimeout(() => alert(`🎉 恭喜解锁成就：${badge.name}！`), 500);
    }
}

document.addEventListener('DOMContentLoaded', init);