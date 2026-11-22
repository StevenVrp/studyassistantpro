document.addEventListener('DOMContentLoaded', () => {
    // Navigation Elements
    const showTimerBtn = document.getElementById('showTimerBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const settingsButton = document.getElementById('settingsButton');
    const backBtn = document.getElementById('backBtn');
    const backFromRemindersBtn = document.getElementById('backFromRemindersBtn');

    // Section Elements
    const taskSection = document.getElementById('taskSection');
    const graphSection = document.getElementById('graphSection');
    const remindersSection = document.getElementById('remindersSection');

    // Task Form Elements
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const scheduleTimeInputs = document.getElementById('scheduleTimeInputs');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');
    const subjectSelect = document.getElementById('subjectSelect');
    const taskList = document.getElementById('taskList');
    const dataDisplay = document.getElementById('dataDisplay');
    const taskMenuBtn = document.getElementById('taskMenuBtn');

    // Reminders Elements
    const reminderForm = document.getElementById('reminderForm');
    const reminderInput = document.getElementById('reminderInput');
    const reminderDueDate = document.getElementById('reminderDueDate');
    const remindersList = document.getElementById('remindersList');

    // Timer Elements
    const floatingTimer = document.getElementById('floatingTimer');
    const toggleTimerBtn = document.getElementById('toggleTimerBtn');
    const closeTimerBtn = document.getElementById('closeTimerBtn');
    const hoursInput = document.getElementById('hoursInput');
    const minutesInput = document.getElementById('minutesInput');
    const secondsInput = document.getElementById('secondsInput');
    const timerDisplay = document.getElementById('timerDisplay');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');

    // Graph Buttons
    const downloadLgBtn = document.createElement('button');
    downloadLgBtn.id = 'downloadLgBtn';
    downloadLgBtn.className = 'btn download-btn';
    downloadLgBtn.style.color = 'white';
    downloadLgBtn.innerHTML = '<i class="fas fa-download"></i> Download Graph';
    downloadLgBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
    const lineGraphContainer = document.querySelectorAll('.chart-container')[0];
    if (lineGraphContainer) lineGraphContainer.appendChild(downloadLgBtn);

    const downloadPgBtn = document.createElement('button');
    downloadPgBtn.id = 'downloadPgBtn';
    downloadPgBtn.className = 'btn download-btn';
    downloadPgBtn.style.color = 'white';
    downloadPgBtn.innerHTML = '<i class="fas fa-download"></i> Download Graph';
    downloadPgBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
    const pieGraphContainer = document.querySelectorAll('.chart-container')[1];
    if (pieGraphContainer) pieGraphContainer.appendChild(downloadPgBtn);

    // Persistent State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    let efficiencyData = JSON.parse(localStorage.getItem('efficiencyData')) || [];

    // Timer State
    let timerInterval;
    let timerRunning = false;
    let totalSeconds = 0;

    // Settings State
    let settings = {
        darkMode: false,
        targetCompletionTime: 30,
        appMode: 'focus'
    };

    let efficiencyChart = null;
    let subjectChart = null;

    // ===== Navigation Logic =====
    const pages = {tasks:taskSection,stats:graphSection,reminders:remindersSection,flashcards:document.querySelector('#flashcards'),journal:document.querySelector('#journal')};
    function route(){
        const hash = location.hash.slice(1);
        const page = Object.hasOwn(pages,hash) ? hash : 'tasks';
        for (const [key,section] of Object.entries(pages)) {
            section.hidden = key !== page;
            section.style.display = key === page ? 'block' : 'none';
        }
        document.querySelectorAll('.desk-tabs a').forEach(a=>{
            if(a.hash === '#'+page) a.setAttribute('aria-current','page');
            else a.removeAttribute('aria-current');
        });
        if(page==='stats'){ initCharts(); updateDataDisplay(); }
        if(page==='reminders') renderReminders();
        if(hash==='timer') floatingTimer.style.display='block';
    }
    window.addEventListener('hashchange',route);
    for(const button of [backBtn,backFromRemindersBtn]) button.onclick=()=>location.hash='tasks';
    document.querySelector('[href="../desk/#timer"]').addEventListener('click',()=>floatingTimer.style.display='block');
    const escapeText = text => String(text).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    // ===== Charts & Stats =====
    const downloadLineGraph = () => {
        const canvas = document.getElementById('efficiencyChart');
        if (!canvas) return;
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = 'productivity-graph-' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = image;
        link.click();
    };

    const downloadPieGraph = () => {
        const canvas = document.getElementById('subjectChart');
        if (!canvas) return;
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = 'subject-graph-' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = image;
        link.click();
    };

    downloadLgBtn.addEventListener('click', downloadLineGraph);
    downloadPgBtn.addEventListener('click', downloadPieGraph);

    const initCharts = () => {
        if (typeof Chart === 'undefined') return;
        const efficiencyCanvas = document.getElementById('efficiencyChart');
        const subjectCanvas = document.getElementById('subjectChart');
        if (!efficiencyCanvas || !subjectCanvas) return;

        if (efficiencyChart) efficiencyChart.destroy();
        const efficiencyCtx = efficiencyCanvas.getContext('2d');
        efficiencyChart = new Chart(efficiencyCtx, {
            type: 'line',
            data: {
                labels: efficiencyData.filter(d=>d.metric==='completion').map(d => new Date(d.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: 'Completed tasks (%)',
                    data: efficiencyData.filter(d=>d.metric==='completion').map(d => d.efficiency),
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: 'Task completion over time' } },
                scales: { y: { min: 0, max: 100 } }
            }
        });

        if (subjectChart) subjectChart.destroy();
        const subjectCtx = subjectCanvas.getContext('2d');
        const subjectTime = {};
        tasks.forEach(task => {
            if (task.completed) {
                subjectTime[task.subject] = (subjectTime[task.subject] || 0) + (1);
            }
        });

        const subjects = Object.keys(subjectTime);
        const timeData = subjects.map(s => subjectTime[s]);
        const backgroundColors = subjects.map(s => {
            switch (s) {
                case 'biology': return '#00b894';
                case 'physics': return '#0984e3';
                case 'chemistry': return '#6c5ce7';
                case 'math': return '#e84393';
                case 'english': return '#fd79a8';
                case 'chinese': return '#e17055';
                case 'spanish': return '#fdcb6e';
                case 'french': return '#a29bfe';
                case 'history': return '#636e72';
                case 'geography': return '#00cec9';
                case 'technology': return '#2d3436';
                case 'music': return '#fab1a0';
                case 'business': return '#000367';
                default: return '#dfe6e9';
            }
        });

        subjectChart = new Chart(subjectCtx, {
            type: 'pie',
            data: {
                labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [{ data: timeData, backgroundColor: backgroundColors }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Completed tasks by subject' } } }
        });
    };

    const updateDataDisplay = () => {
        const completedTasks = tasks.filter(t => t.completed);
        const pendingTasks = tasks.filter(t => !t.completed);
        
        dataDisplay.innerHTML = `
            <div style="padding: 1rem;">
                <h3>Progress (Updated: ${new Date().toLocaleTimeString()})</h3>
                <p>Total Activities: ${tasks.length}</p>
                <p>Completed: ${completedTasks.length} (${tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%)</p>
                <p>Pending: ${pendingTasks.length} (${tasks.length ? Math.round((pendingTasks.length / tasks.length) * 100) : 0}%)</p>
            </div>
        `;
    };

    // ===== Task Management & Mode Handling =====
    const renderTasks = () => {
        document.body.classList.remove('schedule-mode', 'focus-mode');
        document.body.classList.add(`${settings.appMode}-mode`);
        
        // Mode specific form input visibility
        if (settings.appMode === 'schedule') {
            if (prioritySelect) prioritySelect.style.display = 'none';
            if (scheduleTimeInputs) scheduleTimeInputs.style.display = 'flex';
            
            tasks.sort((a, b) => {
                if (!a.timeSlot && !b.timeSlot) return 0;
                if (!a.timeSlot) return 1;
                if (!b.timeSlot) return -1;
                return a.timeSlot.start.localeCompare(b.timeSlot.start);
            });
        } else {
            if (prioritySelect) prioritySelect.style.display = 'block';
            if (scheduleTimeInputs) scheduleTimeInputs.style.display = 'none';

            const priorityOrder = { high: 3, medium: 2, low: 1 };
            tasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
        }

        taskList.innerHTML = tasks.map(task => {
            if (settings.appMode === 'schedule') {
                return `
                    <li class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="task-time-range">
                            ${task.timeSlot?.start || '--:--'}${task.timeSlot?.end ? `-${task.timeSlot.end}` : ''}
                        </div>
                        <div class="task-content">
                            <span class="task-title">${escapeText(task.title)}</span>
                            <span class="task-subject">
                                <i class="fas fa-tag"></i> ${task.subject ? task.subject.toUpperCase() : 'OTHER'}
                            </span>
                        </div>
                        <div class="task-actions">
                            <button aria-label="Edit task" class="btn btn-icon btn-secondary edit-btn">✎</button>
                            <button aria-label="Delete task" class="btn btn-icon btn-secondary delete-btn">×</button>
                        </div>
                    </li>
                `;
            } else {
                return `
                    <li class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="task-content">
                            <span class="task-title">${escapeText(task.title)}</span>
                            <div class="task-meta">
                                <span class="task-priority priority-${task.priority}">
                                    <i class="fas fa-exclamation-circle"></i> ${task.priority ? task.priority.toUpperCase() : 'NONE'}
                                </span>
                                <span class="task-subject">
                                    <i class="fas fa-tag"></i> ${task.subject ? task.subject.toUpperCase() : 'OTHER'}
                                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button aria-label="Edit task" class="btn btn-icon btn-secondary edit-btn">✎</button>
                            <button aria-label="Delete task" class="btn btn-icon btn-secondary delete-btn">×</button>
                        </div>
                    </li>
                `;
            }
        }).join('');

        document.querySelectorAll('.task-checkbox').forEach(cb => cb.addEventListener('change', handleComplete));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.closest('.task-item').dataset.id;
                editTask(taskId);
            });
        });

        if (!tasks.length) taskList.textContent = 'Your task list is empty. Add a task above to start planning.';
        setupDragAndDrop();
        updateTaskCount();
    };

    const updateTaskCount = () => {
        const remaining = tasks.filter(t => !t.completed).length;
        const total = tasks.length;
        const countElement = document.getElementById('taskCount');
        if (countElement) {
            countElement.textContent = `${remaining} of ${total} tasks remaining`;
        }
    };

    const editTask = (taskId) => {
        const task = tasks.find(t => t.id.toString() === taskId.toString());
        if (!task) return;

        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (!taskElement) return;

        const titleElement = taskElement.querySelector('.task-title');
        const currentTitle = titleElement.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'task-edit-input';

        titleElement.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                task.title = newTitle;
                saveData();
            }
            renderTasks();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') renderTasks();
        });
    };

    // Context Menu Logic
    if (taskMenuBtn) {
        taskMenuBtn.addEventListener('click', function(e) {
            const existingMenu = document.querySelector('.task-context-menu');
            if (existingMenu) existingMenu.remove();

            const menu = document.createElement('div');
            menu.className = 'task-context-menu';
            const buttonRect = this.getBoundingClientRect();
            menu.style.cssText = `
                left: ${buttonRect.left - 100}px;
                top: ${buttonRect.bottom + 5}px;
            `;

            const items = [
                {
                    icon: 'fas fa-check-circle',
                    text: 'Complete All',
                    action: () => {
                        tasks.forEach(t => { t.completed = true; t.completedAt = new Date(); });
                        saveData();
                        renderTasks();
                        updateEfficiency();
                    }
                },
                {
                    icon: 'fas fa-trash-alt',
                    text: 'Clear Completed',
                    action: () => {
                        tasks = tasks.filter(t => !t.completed);
                        saveData();
                        renderTasks();
                        updateEfficiency();
                    }
                },
                {
                    icon: 'fas fa-sort',
                    text: settings.appMode === 'schedule' ? 'Sort by Time' : 'Sort by Priority',
                    action: () => {
                        if (settings.appMode === 'schedule') {
                            tasks.sort((a, b) => (a.timeSlot?.start || '').localeCompare(b.timeSlot?.start || ''));
                        } else {
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            tasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
                        }
                        saveData();
                        renderTasks();
                    }
                }
            ];

            items.forEach(item => {
                const button = document.createElement('button');
                button.className = 'menu-item';
                button.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
                button.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menu.appendChild(button);
            });

            document.body.appendChild(menu);

            const closeMenu = (e) => {
                if (!menu.contains(e.target) && e.target !== this) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        });
    }

    // Drag and Drop Logic
    const setupDragAndDrop = () => {
        const taskElements = document.querySelectorAll('.task-item');
        taskElements.forEach(task => {
            task.draggable = true;
            task.addEventListener('dragstart', function(e) {
                this.classList.add('dragging');
                e.dataTransfer.setData('text/plain', this.dataset.id);
            });
            task.addEventListener('dragend', function() {
                this.classList.remove('dragging');
            });
        });

        taskList.addEventListener('dragover', function(e) {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;
            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement == null) {
                taskList.appendChild(draggingItem);
            } else {
                taskList.insertBefore(draggingItem, afterElement);
            }
        });

        taskList.addEventListener('drop', function(e) {
            e.preventDefault();
            const newOrder = Array.from(taskList.querySelectorAll('.task-item')).map(el => parseInt(el.dataset.id));
            const newTasks = [];
            newOrder.forEach(id => {
                const t = tasks.find(item => item.id === id);
                if (t) newTasks.push(t);
            });
            tasks = newTasks;
            saveData();
        });
    };

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const handleComplete = (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        const task = tasks.find(t => t.id.toString() === taskId);
        if (task) {
            task.completed = e.target.checked;
            task.completedAt = task.completed ? new Date() : null;
            
            saveData();
            renderTasks();
            updateEfficiency(true);
        }
    };

    const handleDelete = (e) => {
        const taskId = e.target.closest('.task-item').dataset.id;
        tasks = tasks.filter(t => t.id.toString() !== taskId);
        saveData();
        renderTasks();
        updateEfficiency(true);
    };

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskInput.value.trim();
        if (settings.appMode === 'schedule' && (!startTimeInput.value || !endTimeInput.value || endTimeInput.value <= startTimeInput.value)) {
            endTimeInput.setCustomValidity('Choose an end time later than the start time.');endTimeInput.reportValidity();endTimeInput.setCustomValidity('');return;
        }
        if (title) {
            const newTask = {
                id: Date.now(),
                title,
                subject: subjectSelect.value,
                completed: false,
                createdAt: new Date()
            };

            if (settings.appMode === 'schedule') {
                if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
                    newTask.timeSlot = {
                        start: startTimeInput.value,
                        end: endTimeInput.value
                    };
                }
            } else {
                newTask.priority = prioritySelect.value;
            }

            tasks.push(newTask);
            taskInput.value = '';
            if (startTimeInput) startTimeInput.value = '';
            if (endTimeInput) endTimeInput.value = '';
            
            saveData();
            renderTasks();
            updateEfficiency(true);
        }
    });

    const updateEfficiency = (triggeredByCompletion = false) => {
        const activeTasks = tasks.filter(t => !t.completed);
        const efficiency = tasks.length ? Math.round(100 * (tasks.length - activeTasks.length) / tasks.length) : 0;

        efficiencyData.push({
            timestamp: new Date(),
            metric: 'completion',
            efficiency,
            activeTasks: activeTasks.length
        });

        if (efficiencyData.length > 100) efficiencyData = efficiencyData.slice(-100);
        saveData();
        if (graphSection.style.display === 'block') initCharts();
    };

    // ===== Reminders Logic =====
    const renderReminders = () => {
        if (!remindersList) return;
        remindersList.innerHTML = reminders.slice().sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(r => `
            <div class="reminder-item" data-id="${r.id}" style="padding: 1rem; border-left: 4px solid var(--primary); margin-bottom: 0.5rem; background: var(--card);">
                <div><strong>${escapeText(r.text)}</strong></div>
                <button type="button" class="suite-secondary dismiss" data-dismiss="${r.id}">Dismiss</button><small style="color: var(--text-light);">Due: ${new Date(r.dueDate).toLocaleString()}</small>
            </div>
        `).join('') || '<p class="empty">No reminders scheduled.</p>';
    };

    remindersList.addEventListener('click',e=>{
        const btn=e.target.closest('[data-dismiss]');if(!btn)return;
        reminders=reminders.filter(r=>String(r.id)!==btn.dataset.dismiss);saveData();renderReminders();
    });
    reminderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (reminderInput.value && reminderDueDate.value) {
            reminders.push({ id: Date.now(), text: reminderInput.value, dueDate: reminderDueDate.value });
            reminderInput.value = '';
            reminderDueDate.value = '';
            saveData();
            renderReminders();
        }
    });

    // ===== Floating Timer =====
    const updateTimerDisplay = () => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const timerKey = 'studyAssistantCountdown';
    let endsAt=0;
    const inputs=[hoursInput,minutesInput,secondsInput];
    function saveTimer(){ localStorage.setItem(timerKey,JSON.stringify({endsAt,remaining:totalSeconds})); }
    function syncTimer(){
        clearInterval(timerInterval);
        timerRunning=endsAt>Date.now();
        if(endsAt && !timerRunning){ endsAt=0; totalSeconds=0; saveTimer(); }
        startTimerBtn.textContent=timerRunning?'Pause':totalSeconds?'Resume':'Start';
        inputs.forEach(input=>input.disabled=timerRunning);
        if(timerRunning){
            const tick=()=>{
                totalSeconds=Math.max(0,Math.ceil((endsAt-Date.now())/1000));
                updateTimerDisplay();
                if(!totalSeconds)syncTimer();
            };
            timerInterval=setInterval(tick,250);tick();
        }
        updateTimerDisplay();
    }
    function restoreTimer(){
        const saved=JSON.parse(localStorage.getItem(timerKey)||'{}');
        endsAt=Number(saved.endsAt)||0;totalSeconds=Number(saved.remaining)||0;
        minutesInput.value=settings.targetCompletionTime;syncTimer();
    }
    inputs.forEach(input=>input.addEventListener('input',()=>{ totalSeconds=0;endsAt=0;saveTimer();syncTimer(); }));
    startTimerBtn.onclick=()=>{
        if(timerRunning){
            totalSeconds=Math.max(0,Math.ceil((endsAt-Date.now())/1000));endsAt=0;
        }else{
            if(!inputs.every(input=>input.reportValidity()))return;
            if(!totalSeconds)totalSeconds=Number(hoursInput.value)*3600+Number(minutesInput.value)*60+Number(secondsInput.value);
            if(!totalSeconds)return;
            endsAt=Date.now()+totalSeconds*1000;
        }
        saveTimer();syncTimer();
    };
    resetTimerBtn.onclick=()=>{endsAt=0;totalSeconds=0;saveTimer();syncTimer();};
    toggleTimerBtn.onclick=()=>{
        const collapsed=floatingTimer.classList.toggle('collapsed');
        toggleTimerBtn.textContent=collapsed?'+':'−';
        toggleTimerBtn.setAttribute('aria-label',collapsed?'Expand timer':'Collapse timer');
    };
    showTimerBtn.onclick=()=>{floatingTimer.style.display='block';};
    closeTimerBtn.onclick=()=>{floatingTimer.style.display='none';};
    window.addEventListener('storage',e=>{if(e.key===timerKey)restoreTimer();});
    // Draggable Timer
    let isDragging = false, offsetX = 0, offsetY = 0;
    floatingTimer.addEventListener('mousedown', (e) => {
        if (e.target.closest('.timer-header')) {
            isDragging = true;
            offsetX = e.clientX - floatingTimer.getBoundingClientRect().left;
            offsetY = e.clientY - floatingTimer.getBoundingClientRect().top;
        }
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            floatingTimer.style.left = `${e.clientX - offsetX}px`;
            floatingTimer.style.top = `${e.clientY - offsetY}px`;
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // ===== Settings Modal =====
    const settingsModal = document.getElementById('settingsModal');
    const settingsClose = document.getElementById('settingsClose');
    const settingsSave = document.getElementById('settingsSave');
    const darkModeToggle = document.getElementById('darkModeToggle');

    settingsButton.addEventListener('click', () => { settingsModal.classList.add('active');settingsClose.focus(); });
    settingsModal.addEventListener('keydown',e=>{
        if(e.key==='Escape'){settingsModal.classList.remove('active');settingsButton.focus();}
        if(e.key==='Tab' && e.shiftKey && document.activeElement===settingsClose){e.preventDefault();settingsSave.focus();}
        if(e.key==='Tab' && !e.shiftKey && document.activeElement===settingsSave){e.preventDefault();settingsClose.focus();}
    });
    settingsClose.addEventListener('click', () => settingsModal.classList.remove('active'));

    const applySettings = () => {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        darkModeToggle.checked = settings.darkMode;
        document.getElementById('appModeSelect').value = settings.appMode;
        document.getElementById('targetCompletionTime').value = settings.targetCompletionTime;
    };

    settingsSave.addEventListener('click', () => {
        const newMode = document.getElementById('appModeSelect').value;
        settings.darkMode = darkModeToggle.checked;
        settings.appMode = newMode;
        settings.targetCompletionTime = parseInt(document.getElementById('targetCompletionTime').value) || 30;
        
        localStorage.setItem('studyAssistantSettings', JSON.stringify(settings));
        applySettings();
        if(!timerRunning && !totalSeconds) minutesInput.value=settings.targetCompletionTime;
        renderTasks();
        settingsModal.classList.remove('active');
    });

    const resetAllData = () => {
        if (confirm('Delete all tasks, reminders, and efficiency data?')) {
            tasks = [];
            reminders = [];
            efficiencyData = [];
            saveData();
            renderTasks();
            renderReminders();
            if (graphSection.style.display === 'block') initCharts();
        }
    };
    resetAllBtn.addEventListener('click', resetAllData);

    const saveData = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('reminders', JSON.stringify(reminders));
        localStorage.setItem('efficiencyData', JSON.stringify(efficiencyData));
    };

    // ========================================================
    // App Initialization
    const init = () => {
        const savedSettings = localStorage.getItem('studyAssistantSettings');
        if (savedSettings) {
            try { settings = JSON.parse(savedSettings); } catch (e) {}
        }
        applySettings();
        renderTasks();
        renderReminders();
        restoreTimer();
        route();
        updateTimerDisplay();
    };

    init();
});