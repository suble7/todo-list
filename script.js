const TODOS_KEY = 'todo-list-todos';
const TODO_BADGES_KEY = 'todo-list-badges';
const NOTES_KEY = 'todo-list-notes';
const FINANCE_KEY = 'todo-list-finance';
const STATS_KEY = 'todo-list-stats';
const THEME_KEY = 'todo-list-theme';

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

const FINANCE_CATEGORIES = {
    food: { emoji: '🍜', name: '餐饮' },
    transport: { emoji: '🚇', name: '交通' },
    shopping: { emoji: '🛒', name: '购物' },
    entertainment: { emoji: '🎮', name: '娱乐' },
    health: { emoji: '🏥', name: '医疗' },
    education: { emoji: '📚', name: '教育' },
    salary: { emoji: '💼', name: '工资' },
    bonus: { emoji: '🎁', name: '奖金' },
    other: { emoji: '📦', name: '其他' },
};

let todos = [];
let todoBadges = [];
let notes = [];
let financeRecords = [];
let usageStats = {};
let currentTheme = 'dark';
let currentTodoFilter = 'all';
let currentNotesFilter = 'all';
let currentFinanceFilter = 'all';
let currentTool = 'todo';

function init() {
    loadTodos();
    loadNotes();
    loadFinance();
    loadStats();
    loadTheme();
    renderTodos();
    updateTodoStats();
    renderTodoBadges();
    renderNotes();
    updateNotesStats();
    renderFinance();
    updateFinanceStats();
    initKeyboardShortcuts();
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
function saveNotes() { safeSave(NOTES_KEY, notes); }
function saveFinance() { safeSave(FINANCE_KEY, financeRecords); }
function saveStats() { safeSave(STATS_KEY, usageStats); }
function saveTheme() { safeSave(THEME_KEY, currentTheme); }

function loadFinance() {
    const savedFinance = safeGet(FINANCE_KEY, null);
    financeRecords = (savedFinance && Array.isArray(savedFinance)) ? savedFinance : [];
}

function loadStats() {
    const savedStats = safeGet(STATS_KEY, null);
    usageStats = savedStats || {
        todo: { created: 0, completed: 0, lastUsed: null },
        notes: { created: 0, edited: 0, lastUsed: null },
        finance: { created: 0, totalExpense: 0, totalIncome: 0, lastUsed: null },
        appOpens: 0,
        totalTime: 0,
    };
    usageStats.appOpens++;
    saveStats();
}

function loadTheme() {
    currentTheme = safeGet(THEME_KEY, 'dark');
    applyTheme();
}

function applyTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme();
    applyTheme();
    showToast(`已切换到${currentTheme === 'dark' ? '深色' : '浅色'}模式`, 'info');
}

function updateStats(tool, action, data) {
    if (!usageStats[tool]) usageStats[tool] = {};
    usageStats[tool].lastUsed = new Date().toISOString();
    
    if (tool === 'todo') {
        if (action === 'create') usageStats.todo.created = (usageStats.todo.created || 0) + 1;
        if (action === 'complete') usageStats.todo.completed = (usageStats.todo.completed || 0) + 1;
    } else if (tool === 'notes') {
        if (action === 'create') usageStats.notes.created = (usageStats.notes.created || 0) + 1;
        if (action === 'edit') usageStats.notes.edited = (usageStats.notes.edited || 0) + 1;
    } else if (tool === 'finance') {
        if (action === 'create') usageStats.finance.created = (usageStats.finance.created || 0) + 1;
        if (action === 'expense') usageStats.finance.totalExpense = (usageStats.finance.totalExpense || 0) + data;
        if (action === 'income') usageStats.finance.totalIncome = (usageStats.finance.totalIncome || 0) + data;
    }
    
    saveStats();
}

function renderFinance() {
    const container = document.getElementById('finance-list');
    
    let filteredRecords = currentFinanceFilter === 'all' ? financeRecords 
        : financeRecords.filter(r => r.type === currentFinanceFilter);
    
    filteredRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filteredRecords.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-white/50">暂无记账记录</div>';
        return;
    }
    
    container.innerHTML = filteredRecords.map(record => {
        const category = FINANCE_CATEGORIES[record.category] || FINANCE_CATEGORIES.other;
        const isExpense = record.type === 'expense';
        
        return `<div class="todo-card" data-id="${record.id}">
            <div class="flex items-start gap-3">
                <div class="text-2xl">${category.emoji}</div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-white font-semibold">${category.name}</span>
                        <span class="${isExpense ? 'text-red-400' : 'text-green-400'} font-bold">${isExpense ? '-' : '+'}${record.amount.toFixed(2)}</span>
                    </div>
                    ${record.note ? `<div class="text-sm text-blue-300">${escapeHtml(record.note)}</div>` : ''}
                    <div class="text-sm text-white/50 mt-1">${formatFinanceDate(record.createdAt)}</div>
                </div>
                <button onclick="deleteFinance('${record.id}')" class="text-white/70 hover:text-red-400 p-2" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

function formatFinanceDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function updateFinanceStats() {
    const expense = financeRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = financeRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const balance = income - expense;
    
    document.getElementById('finance-total').textContent = expense.toFixed(2);
    document.getElementById('finance-income').textContent = income.toFixed(2);
    document.getElementById('finance-balance').textContent = balance.toFixed(2);
    document.getElementById('finance-count').textContent = financeRecords.length;
}

document.getElementById('finance-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('finance-type').value;
    const amount = parseFloat(document.getElementById('finance-amount').value);
    const category = document.getElementById('finance-category').value;
    const note = document.getElementById('finance-note').value.trim();
    
    if (!amount || amount <= 0) {
        showToast('请输入有效的金额', 'warning');
        return;
    }
    
    financeRecords.push({ 
        id: Date.now().toString(), 
        type, 
        amount, 
        category, 
        note,
        createdAt: new Date().toISOString() 
    });
    saveFinance();
    
    updateStats('finance', 'create');
    updateStats('finance', type, amount);
    
    document.getElementById('finance-amount').value = '';
    document.getElementById('finance-note').value = '';
    
    renderFinance();
    updateFinanceStats();
    showToast('记账成功！', 'success');
});

function deleteFinance(recordId) {
    if (!confirm('确定要删除这条记录吗？')) return;
    const record = financeRecords.find(r => r.id === recordId);
    if (record) {
        updateStats('finance', record.type, -record.amount);
    }
    financeRecords = financeRecords.filter(r => r.id !== recordId);
    saveFinance();
    renderFinance();
    updateFinanceStats();
    showToast('记录已删除', 'info');
}

function filterFinance(filter) {
    currentFinanceFilter = filter;
    document.querySelectorAll('#tool-finance .filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`finance-filter-${filter}`).classList.add('active');
    renderFinance();
}

function renderTodos() {
    const container = document.getElementById('todo-list');
    
    let filteredTodos = currentTodoFilter === 'all' ? todos 
        : currentTodoFilter === 'pending' ? todos.filter(t => !t.completed) 
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

function closeEditNoteModal() {
    document.getElementById('edit-note-modal').classList.add('hidden');
}

document.getElementById('edit-note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-note-id').value;
    const title = document.getElementById('edit-note-title').value.trim();
    const content = document.getElementById('edit-note-content').value.trim();
    const color = document.getElementById('edit-note-color').value;
    
    if (!title && !content) {
        showToast('请输入笔记内容', 'warning');
        return;
    }
    
    const note = notes.find(n => n.id === id);
    if (note) {
        note.title = title;
        note.content = content;
        note.color = color;
        saveNotes();
        closeEditNoteModal();
        renderNotes();
        updateNotesStats();
        showToast('笔记更新成功！', 'success');
    }
});

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
    currentTodoFilter = filter;
    document.querySelectorAll('#tool-todo .filter-btn').forEach(btn => btn.classList.remove('active'));
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
        showToast(`🎉 恭喜解锁成就：${badge.name}！`, 'success');
    }
}

function loadNotes() {
    const savedNotes = safeGet(NOTES_KEY, null);
    notes = (savedNotes && Array.isArray(savedNotes)) ? savedNotes : [];
}

function saveNotes() { safeSave(NOTES_KEY, notes); }

function renderNotes() {
    const container = document.getElementById('notes-list');
    
    let filteredNotes = currentNotesFilter === 'all' ? notes 
        : notes.filter(n => n.starred);
    
    filteredNotes.sort((a, b) => {
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (filteredNotes.length === 0) {
        container.innerHTML = '<div class="col-span-2 text-center py-12 text-white/50">暂无笔记</div>';
        return;
    }
    
    container.innerHTML = filteredNotes.map(note => `
        <div class="note-card ${note.starred ? 'starred' : ''}" style="border-left-color: ${note.color};">
            <div class="note-title">${escapeHtml(note.title || '无标题')}</div>
            <div class="note-content">${escapeHtml(note.content || '')}</div>
            <div class="note-meta">
                <div class="note-date">${formatNoteDate(note.createdAt)}</div>
                <div class="note-actions">
                    <button onclick="toggleNoteStar('${note.id}')" title="${note.starred ? '取消收藏' : '收藏'}">
                        <i class="fas ${note.starred ? 'fa-star' : 'fa-star-o'}"></i>
                    </button>
                    <button onclick="editNote('${note.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNote('${note.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function formatNoteDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

document.getElementById('note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const color = document.getElementById('note-color').value;
    
    if (!title && !content) {
        showToast('请输入笔记内容', 'warning');
        return;
    }
    
    notes.push({ 
        id: Date.now().toString(), 
        title, 
        content, 
        color,
        starred: false,
        createdAt: new Date().toISOString() 
    });
    saveNotes();
    
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-color').value = '#6366f1';
    
    renderNotes();
    updateNotesStats();
    showToast('笔记创建成功！', 'success');
});

function toggleNoteStar(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        note.starred = !note.starred;
        saveNotes();
        renderNotes();
        updateNotesStats();
        showToast(note.starred ? '已收藏' : '取消收藏', 'info');
    }
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        document.getElementById('edit-note-id').value = note.id;
        document.getElementById('edit-note-title').value = note.title || '';
        document.getElementById('edit-note-content').value = note.content || '';
        document.getElementById('edit-note-color').value = note.color;
        document.getElementById('edit-note-modal').classList.remove('hidden');
    }
}

function deleteNote(noteId) {
    if (!confirm('确定要删除这条笔记吗？')) return;
    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    renderNotes();
    updateNotesStats();
    showToast('笔记已删除', 'info');
}

function filterNotes(filter) {
    currentNotesFilter = filter;
    document.querySelectorAll('#tool-notes .filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`notes-filter-${filter}`).classList.add('active');
    renderNotes();
}

function updateNotesStats() {
    const total = notes.length;
    const starred = notes.filter(n => n.starred).length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = notes.filter(n => n.createdAt.startsWith(today)).length;
    
    document.getElementById('notes-total').textContent = total;
    document.getElementById('notes-starred').textContent = starred;
    document.getElementById('notes-today').textContent = todayCount;
}

function switchTool(tool) {
    currentTool = tool;
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${tool}`).classList.add('active');
    
    document.querySelectorAll('.tool-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`tool-${tool}`).classList.remove('hidden');
    
    if (tool === 'stats') {
        renderStats();
    }
    
    document.body.style.animation = 'none';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 10);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white font-medium`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function exportData() {
    const data = {
        todos,
        todoBadges,
        notes,
        financeRecords,
        usageStats,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-toolbox-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('数据导出成功！', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.todos && Array.isArray(data.todos)) todos = data.todos;
            if (data.todoBadges && Array.isArray(data.todoBadges)) todoBadges = data.todoBadges;
            if (data.notes && Array.isArray(data.notes)) notes = data.notes;
            if (data.financeRecords && Array.isArray(data.financeRecords)) financeRecords = data.financeRecords;
            if (data.usageStats) usageStats = { ...usageStats, ...data.usageStats };
            
            saveTodos();
            saveTodoBadges();
            saveNotes();
            saveFinance();
            saveStats();
            
            renderTodos();
            updateTodoStats();
            renderTodoBadges();
            renderNotes();
            updateNotesStats();
            renderFinance();
            updateFinanceStats();
            
            showToast('数据导入成功！', 'success');
        } catch (err) {
            showToast('导入失败：无效的文件格式', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === '1' || e.key === 't') {
            switchTool('todo');
        } else if (e.key === '2' || e.key === 'n') {
            switchTool('notes');
        } else if (e.key === '3' || e.key === 'f') {
            switchTool('finance');
        } else if (e.key === '4' || e.key === 'a') {
            switchTool('about');
        } else if (e.key === 'd') {
            toggleTheme();
        } else if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportData();
        }
    });
}

function toggleShortcutsHelp() {
    const help = document.getElementById('shortcuts-help');
    help.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', init);