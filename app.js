// 修复事件监听器注册方式
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
    });
} else {
    console.error('浏览器不支持标准事件监听');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
        // 批量操作按钮
        document.getElementById('selectAllBtn')?.addEventListener('click', function() {
  this.classList.toggle('active', tasks.length > 0 && Array.from(document.querySelectorAll('.task-checkbox')).every(checkbox => checkbox.checked));
  toggleAllTasks();
});
        document.getElementById('invertSelectionBtn').addEventListener('click', invertSelection);
    // 确保DOM元素正确获取
    const taskInput = document.getElementById('taskInput');
    if (!taskInput) console.error('taskInput元素未找到!');
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (!taskInput || !addTaskBtn) console.error('关键元素未找到!');
    const taskList = document.getElementById('taskList');
    // 过滤功能事件绑定
const filterBtns = document.querySelectorAll('[data-filter]');
filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const currentFilter = this.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderTasks(currentFilter);
    });
});
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');

    addTaskBtn.addEventListener('click', () => {
            console.log('添加按钮被点击');
            console.log('当前输入值:', taskInput.value);
        const text = document.getElementById('taskInput').value.trim();
        if (text) addTask(text);
    });

    taskInput.addEventListener('keypress', (e) => {
            console.log('键盘事件触发 按键:', e.key);
        if (e.key === 'Enter' && document.getElementById('taskInput').value.trim()) {
            const text = taskInput.value.trim();
            if (text) addTask(text);
        }
    });

    // 任务数据存储
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // 时间格式化函数
    function formatDate(date) {
      return new Date(date).toLocaleString('zh-CN', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // 渲染任务列表
    // 获取拖拽位置辅助函数
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

let sortMode = false;

    // 切换排序模式
    function toggleSortMode() {
  sortMode = !sortMode;
  const toggleBtn = document.getElementById('toggleSortBtn');
  toggleBtn.textContent = sortMode ? '✅ 退出排序' : '↕️ 进入排序';
  toggleBtn.classList.toggle('active', sortMode);
  
  document.querySelectorAll('.task-item').forEach(li => {
    li.draggable = sortMode;
    li.style.cursor = sortMode ? 'grab' : 'default';
    li.classList.toggle('sort-mode', sortMode);
  });
  
  if (!sortMode) renderTasks(getCurrentFilter());
}

    function renderTasks(filter = 'all') {
  // 同步全选按钮状态
  const allChecked = tasks.length > 0 && tasks.every(task => task.completed);
  document.getElementById('selectAllBtn').classList.toggle('active', allChecked);
        taskList.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            if (filter === 'all') return true;
            if (filter === 'active') return !task.completed;
            if (filter === 'completed') return task.completed;
            return true;
        });

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
        li.draggable = true;
        li.dataset.taskId = index;
        li.style.cursor = 'grab';
        
        li.addEventListener('dragstart', (e) => {
    if (!sortMode) return;
            e.dataTransfer.setData('text/plain', index);
            li.classList.add('dragging');
        });
        
        li.addEventListener('dragover', (e) => {
    if (!sortMode) return;
            e.preventDefault();
            const afterElement = getDragAfterElement(taskList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                taskList.appendChild(draggable);
            } else {
                taskList.insertBefore(draggable, afterElement);
            }
        });
        
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            const newIndex = Array.from(taskList.children).indexOf(li);
            const draggedIndex = parseInt(li.dataset.taskId);
            if (newIndex !== draggedIndex) {
                const [movedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(newIndex, 0, movedTask);
                saveTasks();
                renderTasks(getCurrentFilter());
            }
        });
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                <div class="task-content">
                  <span class="task-text">${escapeHTML(task.text)}</span>
                  <div class="task-times">
                    <span class="created-time">创建：${formatDate(task.createdAt)}</span>
                    ${task.completed ? `<span class="completed-time">完成：${formatDate(task.completedAt)}</span>` : ''}
                  </div>
                </div>
                <button class="delete-btn" data-index="${index}">删除</button>
            `;
            taskList.appendChild(li);
        });

        // 添加事件监听器到新创建的元素
        addTaskEventListeners();
    }

    // 添加任务
        function toggleAllTasks() {
        const allCompleted = tasks.every(task => task.completed);
        tasks = tasks.map(task => ({...task, completed: !allCompleted}));
        saveTasks();
        renderTasks(getCurrentFilter());
    }

    function invertSelection() {
        tasks = tasks.map(task => ({...task, completed: !task.completed}));
        saveTasks();
        renderTasks(getCurrentFilter());
        document.getElementById('selectAllBtn').classList.remove('active');
    }

    function addTask(text) {
    // 输入验证已在事件监听器处理

        tasks.push({ 
  text: text.trim(), 
  completed: false,
  createdAt: new Date().toISOString(),
  completedAt: null 
});

        saveTasks();
        renderTasks(getCurrentFilter());
        taskInput.value = '';
    }

    // 切换任务完成状态
    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        tasks[index].completedAt = tasks[index].completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks(getCurrentFilter());
    }

    // 删除任务
    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(getCurrentFilter());
    }

    // 清除所有已完成任务
    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks(getCurrentFilter());
    }

    // 保存任务到localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // 获取当前选中的过滤器
    function getCurrentFilter() {
        const activeBtn = document.querySelector('.filter-btn.active');
        return activeBtn ? activeBtn.dataset.filter : 'all';
    }

    // 添加任务相关的事件监听器
    function addTaskEventListeners() {
        // 排序模式切换
        document.getElementById('toggleSortBtn').addEventListener('click', toggleSortMode);
        // 清除按钮事件
        document.getElementById('clearCompletedBtn').addEventListener('click', () => {
            clearCompletedTasks();
        });
        // 复选框事件
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            // 勾选框始终可交互
checkbox.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                document.getElementById('selectAllBtn').classList.remove('active');
                toggleTask(index);
            });
        });

        // 删除按钮事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                deleteTask(index);
            });
        });
    }
})();

    // 转义HTML特殊字符
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }