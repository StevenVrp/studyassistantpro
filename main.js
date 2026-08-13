document.addEventListener('DOMContentLoaded', () => {
    // Navigation Elements
    const homeBtn = document.getElementById('homeBtn');
    const graphBtn = document.getElementById('graphBtn');
    const elementsBtn = document.getElementById('elementsBtn');
    const showTimerBtn = document.getElementById('showTimerBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const settingsButton = document.getElementById('settingsButton');
    const backBtn = document.getElementById('backBtn');
    const backFromRemindersBtn = document.getElementById('backFromRemindersBtn');

    // Section Elements
    const taskSection = document.getElementById('taskSection');
    const graphSection = document.getElementById('graphSection');
    const remindersSection = document.getElementById('remindersSection');
    const elementsSection = document.getElementById('elementsSection');
    const elementSearchContainer = document.getElementById('elementSearchContainer');

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
    const showSection = (sectionName) => {
        taskSection.style.display = 'none';
        graphSection.style.display = 'none';
        remindersSection.style.display = 'none';
        elementsSection.style.display = 'none';
        elementSearchContainer.style.display = 'none';

        if (sectionName === 'home') {
            taskSection.style.display = 'block';
        } else if (sectionName === 'stats') {
            graphSection.style.display = 'block';
            initCharts();
            updateDataDisplay();
        } else if (sectionName === 'reminders') {
            remindersSection.style.display = 'block';
            renderReminders();
        } else if (sectionName === 'elements') {
            elementsSection.style.display = 'block';
            elementSearchContainer.style.display = 'block';
        }
    };

    homeBtn.addEventListener('click', () => showSection('home'));
    graphBtn.addEventListener('click', () => showSection('stats'));
    elementsBtn.addEventListener('click', () => showSection('elements'));
    if (backBtn) backBtn.addEventListener('click', () => showSection('home'));
    if (backFromRemindersBtn) backFromRemindersBtn.addEventListener('click', () => showSection('home'));

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
                labels: efficiencyData.map(d => new Date(d.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: 'Progress %',
                    data: efficiencyData.map(d => d.efficiency),
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: 'Efficiency Over Time' } },
                scales: { y: { min: 0, max: 100 } }
            }
        });

        if (subjectChart) subjectChart.destroy();
        const subjectCtx = subjectCanvas.getContext('2d');
        const subjectTime = {};
        tasks.forEach(task => {
            if (task.completed) {
                subjectTime[task.subject] = (subjectTime[task.subject] || 0) + (task.timeSpent || 10);
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
            options: { responsive: true, plugins: { title: { display: true, text: 'Time Spent by Subject (minutes)' } } }
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
                            <span class="task-title">${task.title}</span>
                            <span class="task-subject">
                                <i class="fas fa-tag"></i> ${task.subject ? task.subject.toUpperCase() : 'OTHER'}
                            </span>
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-icon btn-secondary edit-btn"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-icon btn-secondary delete-btn"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </li>
                `;
            } else {
                return `
                    <li class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="task-content">
                            <span class="task-title">${task.title}</span>
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
                            <button class="btn btn-icon btn-secondary edit-btn"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-icon btn-secondary delete-btn"><i class="fas fa-trash-alt"></i></button>
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
                    }
                },
                {
                    icon: 'fas fa-trash-alt',
                    text: 'Clear Completed',
                    action: () => {
                        tasks = tasks.filter(t => !t.completed);
                        saveData();
                        renderTasks();
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
            if (task.completed) task.timeSpent = 15;
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
        const efficiency = Math.min(Math.round((settings.targetCompletionTime / 30) * 100), 100);

        efficiencyData.push({
            timestamp: new Date(),
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
        remindersList.innerHTML = reminders.map(r => `
            <div class="reminder-item" data-id="${r.id}" style="padding: 1rem; border-left: 4px solid var(--primary); margin-bottom: 0.5rem; background: var(--card);">
                <div><strong>${r.text}</strong></div>
                <small style="color: var(--text-light);">Due: ${new Date(r.dueDate).toLocaleString()}</small>
            </div>
        `).join('');
    };

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

    const startTimer = () => {
        if (timerRunning) return;
        const h = parseInt(hoursInput.value) || 0;
        const m = parseInt(minutesInput.value) || 0;
        const s = parseInt(secondsInput.value) || 0;
        totalSeconds = h * 3600 + m * 60 + s;
        if (totalSeconds <= 0) return;

        timerRunning = true;
        startTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        timerInterval = setInterval(() => {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
            }
        }, 1000);
    };

    startTimerBtn.addEventListener('click', () => {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        } else {
            startTimer();
        }
    });

    resetTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        totalSeconds = 0;
        updateTimerDisplay();
        startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    });

    showTimerBtn.addEventListener('click', () => floatingTimer.style.display = 'block');
    closeTimerBtn.addEventListener('click', () => floatingTimer.style.display = 'none');

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

    settingsButton.addEventListener('click', () => settingsModal.classList.add('active'));
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
    // ===== FULL PERIODIC TABLE IMPLEMENTATION (FILE 3) ======
    // ========================================================
    const ELEMENTS = [{"z": 1, "sym": "H", "name": "Hydrogen", "cat": "nonmetal", "group": 1, "period": 1, "mass": "1.008", "x": 1, "y": 1, "config": "1s¹", "valence": "1", "charge": "+1", "radius": 31, "en": 2.2, "ion": 1312}, {"z": 2, "sym": "He", "name": "Helium", "cat": "noble", "group": 18, "period": 1, "mass": "4.0026", "x": 18, "y": 1, "config": "1s²", "valence": "2", "charge": "0", "radius": 28, "en": null, "ion": 2372}, {"z": 3, "sym": "Li", "name": "Lithium", "cat": "alkali", "group": 1, "period": 2, "mass": "6.94", "x": 1, "y": 2, "config": "1s² 2s¹", "valence": "1", "charge": "+1", "radius": 128, "en": 0.98, "ion": 520}, {"z": 4, "sym": "Be", "name": "Beryllium", "cat": "alkaline", "group": 2, "period": 2, "mass": "9.0122", "x": 2, "y": 2, "config": "1s² 2s²", "valence": "2", "charge": "+2", "radius": 96, "en": 1.57, "ion": 899}, {"z": 5, "sym": "B", "name": "Boron", "cat": "metalloid", "group": 13, "period": 2, "mass": "10.81", "x": 13, "y": 2, "config": "1s² 2s² 2p¹", "valence": "3", "charge": "+3", "radius": 84, "en": 2.04, "ion": 801}, {"z": 6, "sym": "C", "name": "Carbon", "cat": "nonmetal", "group": 14, "period": 2, "mass": "12.011", "x": 14, "y": 2, "config": "1s² 2s² 2p²", "valence": "4", "charge": "+4", "radius": 76, "en": 2.55, "ion": 1086}, {"z": 7, "sym": "N", "name": "Nitrogen", "cat": "nonmetal", "group": 15, "period": 2, "mass": "14.007", "x": 15, "y": 2, "config": "1s² 2s² 2p³", "valence": "5", "charge": "-3", "radius": 71, "en": 3.04, "ion": 1402}, {"z": 8, "sym": "O", "name": "Oxygen", "cat": "nonmetal", "group": 16, "period": 2, "mass": "15.999", "x": 16, "y": 2, "config": "1s² 2s² 2p⁴", "valence": "6", "charge": "-2", "radius": 66, "en": 3.44, "ion": 1314}, {"z": 9, "sym": "F", "name": "Fluorine", "cat": "halogen", "group": 17, "period": 2, "mass": "18.998", "x": 17, "y": 2, "config": "1s² 2s² 2p⁵", "valence": "7", "charge": "-1", "radius": 57, "en": 3.98, "ion": 1681}, {"z": 10, "sym": "Ne", "name": "Neon", "cat": "noble", "group": 18, "period": 2, "mass": "20.180", "x": 18, "y": 2, "config": "1s² 2s² 2p⁶", "valence": "8", "charge": "0", "radius": 58, "en": null, "ion": 2081}, {"z": 11, "sym": "Na", "name": "Sodium", "cat": "alkali", "group": 1, "period": 3, "mass": "22.990", "x": 1, "y": 3, "config": "1s² 2s² 2p⁶ 3s¹", "valence": "1", "charge": "+1", "radius": 166, "en": 0.93, "ion": 496}, {"z": 12, "sym": "Mg", "name": "Magnesium", "cat": "alkaline", "group": 2, "period": 3, "mass": "24.305", "x": 2, "y": 3, "config": "1s² 2s² 2p⁶ 3s²", "valence": "2", "charge": "+2", "radius": 141, "en": 1.31, "ion": 738}, {"z": 13, "sym": "Al", "name": "Aluminium", "cat": "posttransition", "group": 13, "period": 3, "mass": "26.982", "x": 13, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p¹", "valence": "3", "charge": "+3", "radius": 121, "en": 1.61, "ion": 578}, {"z": 14, "sym": "Si", "name": "Silicon", "cat": "metalloid", "group": 14, "period": 3, "mass": "28.085", "x": 14, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p²", "valence": "4", "charge": "+4", "radius": 111, "en": 1.9, "ion": 787}, {"z": 15, "sym": "P", "name": "Phosphorus", "cat": "nonmetal", "group": 15, "period": 3, "mass": "30.974", "x": 15, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p³", "valence": "5", "charge": "-3", "radius": 107, "en": 2.19, "ion": 1012}, {"z": 16, "sym": "S", "name": "Sulfur", "cat": "nonmetal", "group": 16, "period": 3, "mass": "32.06", "x": 16, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p⁴", "valence": "6", "charge": "-2", "radius": 105, "en": 2.58, "ion": 1000}, {"z": 17, "sym": "Cl", "name": "Chlorine", "cat": "halogen", "group": 17, "period": 3, "mass": "35.45", "x": 17, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p⁵", "valence": "7", "charge": "-1", "radius": 102, "en": 3.16, "ion": 1251}, {"z": 18, "sym": "Ar", "name": "Argon", "cat": "noble", "group": 18, "period": 3, "mass": "39.948", "x": 18, "y": 3, "config": "1s² 2s² 2p⁶ 3s² 3p⁶", "valence": "8", "charge": "0", "radius": 106, "en": null, "ion": 1521}, {"z": 19, "sym": "K", "name": "Potassium", "cat": "alkali", "group": 1, "period": 4, "mass": "39.098", "x": 1, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹", "valence": "1", "charge": "+1", "radius": 203, "en": 0.82, "ion": 419}, {"z": 20, "sym": "Ca", "name": "Calcium", "cat": "alkaline", "group": 2, "period": 4, "mass": "40.078", "x": 2, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s²", "valence": "2", "charge": "+2", "radius": 176, "en": 1.0, "ion": 590}, {"z": 21, "sym": "Sc", "name": "Scandium", "cat": "transition", "group": 3, "period": 4, "mass": "44.956", "x": 3, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹", "valence": "3", "charge": "+3", "radius": 170, "en": 1.36, "ion": 633}, {"z": 22, "sym": "Ti", "name": "Titanium", "cat": "transition", "group": 4, "period": 4, "mass": "47.867", "x": 4, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d²", "valence": "4", "charge": "+4", "radius": 160, "en": 1.54, "ion": 659}, {"z": 23, "sym": "V", "name": "Vanadium", "cat": "transition", "group": 5, "period": 4, "mass": "50.942", "x": 5, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d³", "valence": "5", "charge": "+5", "radius": 153, "en": 1.63, "ion": 651}, {"z": 24, "sym": "Cr", "name": "Chromium", "cat": "transition", "group": 6, "period": 4, "mass": "51.996", "x": 6, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d⁵", "valence": "6", "charge": "+3", "radius": 139, "en": 1.66, "ion": 653}, {"z": 25, "sym": "Mn", "name": "Manganese", "cat": "transition", "group": 7, "period": 4, "mass": "54.938", "x": 7, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁵", "valence": "7", "charge": "+2", "radius": 139, "en": 1.55, "ion": 717}, {"z": 26, "sym": "Fe", "name": "Iron", "cat": "transition", "group": 8, "period": 4, "mass": "55.845", "x": 8, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶", "valence": "8", "charge": "+3", "radius": 132, "en": 1.83, "ion": 763}, {"z": 27, "sym": "Co", "name": "Cobalt", "cat": "transition", "group": 9, "period": 4, "mass": "58.933", "x": 9, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁷", "valence": "9", "charge": "+2", "radius": 126, "en": 1.88, "ion": 760}, {"z": 28, "sym": "Ni", "name": "Nickel", "cat": "transition", "group": 10, "period": 4, "mass": "58.693", "x": 10, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁸", "valence": "10", "charge": "+2", "radius": 121, "en": 1.91, "ion": 737}, {"z": 29, "sym": "Cu", "name": "Copper", "cat": "transition", "group": 11, "period": 4, "mass": "63.546", "x": 11, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d¹⁰", "valence": "11", "charge": "+2", "radius": 138, "en": 1.9, "ion": 746}, {"z": 30, "sym": "Zn", "name": "Zinc", "cat": "transition", "group": 12, "period": 4, "mass": "65.38", "x": 12, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰", "valence": "12", "charge": "+2", "radius": 131, "en": 1.65, "ion": 906}, {"z": 31, "sym": "Ga", "name": "Gallium", "cat": "posttransition", "group": 13, "period": 4, "mass": "69.723", "x": 13, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p¹", "valence": "13", "charge": "+3", "radius": 122, "en": 1.81, "ion": 579}, {"z": 32, "sym": "Ge", "name": "Germanium", "cat": "metalloid", "group": 14, "period": 4, "mass": "72.630", "x": 14, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p²", "valence": "14", "charge": "+4", "radius": 122, "en": 2.01, "ion": 762}, {"z": 33, "sym": "As", "name": "Arsenic", "cat": "metalloid", "group": 15, "period": 4, "mass": "74.922", "x": 15, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p³", "valence": "15", "charge": "-3", "radius": 119, "en": 2.18, "ion": 947}, {"z": 34, "sym": "Se", "name": "Selenium", "cat": "nonmetal", "group": 16, "period": 4, "mass": "78.971", "x": 16, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁴", "valence": "16", "charge": "-2", "radius": 120, "en": 2.55, "ion": 941}, {"z": 35, "sym": "Br", "name": "Bromine", "cat": "halogen", "group": 17, "period": 4, "mass": "79.904", "x": 17, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁵", "valence": "17", "charge": "-1", "radius": 120, "en": 2.96, "ion": 1140}, {"z": 36, "sym": "Kr", "name": "Krypton", "cat": "noble", "group": 18, "period": 4, "mass": "83.798", "x": 18, "y": 4, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶", "valence": "18", "charge": "0", "radius": 116, "en": 3.0, "ion": 1351}, {"z": 37, "sym": "Rb", "name": "Rubidium", "cat": "alkali", "group": 1, "period": 5, "mass": "85.468", "x": 1, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹", "valence": "1", "charge": "+1", "radius": 220, "en": 0.82, "ion": 403}, {"z": 38, "sym": "Sr", "name": "Strontium", "cat": "alkaline", "group": 2, "period": 5, "mass": "87.62", "x": 2, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s²", "valence": "2", "charge": "+2", "radius": 195, "en": 0.95, "ion": 550}, {"z": 39, "sym": "Y", "name": "Yttrium", "cat": "transition", "group": 3, "period": 5, "mass": "88.906", "x": 3, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹", "valence": "3", "charge": "+3", "radius": 190, "en": 1.22, "ion": 600}, {"z": 40, "sym": "Zr", "name": "Zirconium", "cat": "transition", "group": 4, "period": 5, "mass": "91.224", "x": 4, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d²", "valence": "4", "charge": "+4", "radius": 175, "en": 1.33, "ion": 640}, {"z": 41, "sym": "Nb", "name": "Niobium", "cat": "transition", "group": 5, "period": 5, "mass": "92.906", "x": 5, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d¹⁰ 4p⁶ 5s¹ 4d⁴", "valence": "5", "charge": "+5", "radius": 164, "en": 1.6, "ion": 652}, {"z": 42, "sym": "Mo", "name": "Molybdenum", "cat": "transition", "group": 6, "period": 5, "mass": "95.95", "x": 6, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹ 4d⁵", "valence": "6", "charge": "+6", "radius": 154, "en": 2.16, "ion": 684}, {"z": 43, "sym": "Tc", "name": "Technetium", "cat": "transition", "group": 7, "period": 5, "mass": "98", "x": 7, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d⁵", "valence": "7", "charge": "+7", "radius": 147, "en": 1.9, "ion": 702}, {"z": 44, "sym": "Ru", "name": "Ruthenium", "cat": "transition", "group": 8, "period": 5, "mass": "101.07", "x": 8, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹ 4d⁷", "valence": "8", "charge": "+3", "radius": 146, "en": 2.2, "ion": 710}, {"z": 45, "sym": "Rh", "name": "Rhodium", "cat": "transition", "group": 9, "period": 5, "mass": "102.91", "x": 9, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹ 4d⁸", "valence": "9", "charge": "+3", "radius": 142, "en": 2.28, "ion": 720}, {"z": 46, "sym": "Pd", "name": "Palladium", "cat": "transition", "group": 10, "period": 5, "mass": "106.42", "x": 10, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 4d¹⁰", "valence": "10", "charge": "+2", "radius": 139, "en": 2.2, "ion": 804}, {"z": 47, "sym": "Ag", "name": "Silver", "cat": "transition", "group": 11, "period": 5, "mass": "107.87", "x": 11, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s¹ 4d¹⁰", "valence": "11", "charge": "+1", "radius": 145, "en": 1.93, "ion": 731}, {"z": 48, "sym": "Cd", "name": "Cadmium", "cat": "transition", "group": 12, "period": 5, "mass": "112.41", "x": 12, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰", "valence": "12", "charge": "+2", "radius": 144, "en": 1.69, "ion": 868}, {"z": 49, "sym": "In", "name": "Indium", "cat": "posttransition", "group": 13, "period": 5, "mass": "114.82", "x": 13, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p¹", "valence": "13", "charge": "+3", "radius": 142, "en": 1.78, "ion": 558}, {"z": 50, "sym": "Sn", "name": "Tin", "cat": "posttransition", "group": 14, "period": 5, "mass": "118.71", "x": 14, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p²", "valence": "14", "charge": "+4", "radius": 139, "en": 1.96, "ion": 709}, {"z": 51, "sym": "Sb", "name": "Antimony", "cat": "metalloid", "group": 15, "period": 5, "mass": "121.76", "x": 15, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p³", "valence": "15", "charge": "-3", "radius": 139, "en": 2.05, "ion": 834}, {"z": 52, "sym": "Te", "name": "Tellurium", "cat": "metalloid", "group": 16, "period": 5, "mass": "127.60", "x": 16, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁴", "valence": "16", "charge": "-2", "radius": 138, "en": 2.1, "ion": 869}, {"z": 53, "sym": "I", "name": "Iodine", "cat": "halogen", "group": 17, "period": 5, "mass": "126.90", "x": 17, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁵", "valence": "17", "charge": "-1", "radius": 139, "en": 2.66, "ion": 1008}, {"z": 54, "sym": "Xe", "name": "Xenon", "cat": "noble", "group": 18, "period": 5, "mass": "131.29", "x": 18, "y": 5, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶", "valence": "18", "charge": "0", "radius": 140, "en": 2.6, "ion": 1170}, {"z": 55, "sym": "Cs", "name": "Caesium", "cat": "alkali", "group": 1, "period": 6, "mass": "132.91", "x": 1, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s¹", "valence": "1", "charge": "+1", "radius": 244, "en": 0.79, "ion": 376}, {"z": 56, "sym": "Ba", "name": "Barium", "cat": "alkaline", "group": 2, "period": 6, "mass": "137.33", "x": 2, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s²", "valence": "2", "charge": "+2", "radius": 198, "en": 0.89, "ion": 503}, {"z": 57, "sym": "La", "name": "Lanthanum", "cat": "lanthanide", "group": "-", "period": 6, "mass": "138.91", "x": 3, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 5d¹", "valence": "3", "charge": "+3", "radius": 169, "en": 1.1, "ion": 538}, {"z": 58, "sym": "Ce", "name": "Cerium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "140.12", "x": 4, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹ 5d¹", "valence": "3", "charge": "+3", "radius": 168, "en": 1.12, "ion": 534}, {"z": 59, "sym": "Pr", "name": "Praseodymium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "140.91", "x": 5, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f³", "valence": "3", "charge": "+3", "radius": 165, "en": 1.13, "ion": 527}, {"z": 60, "sym": "Nd", "name": "Neodymium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "144.24", "x": 6, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁴", "valence": "3", "charge": "+3", "radius": 164, "en": 1.14, "ion": 533}, {"z": 61, "sym": "Pm", "name": "Promethium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "145", "x": 7, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁵", "valence": "3", "charge": "+3", "radius": 163, "en": 1.13, "ion": 536}, {"z": 62, "sym": "Sm", "name": "Samarium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "150.36", "x": 8, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁶", "valence": "3", "charge": "+3", "radius": 162, "en": 1.17, "ion": 543}, {"z": 63, "sym": "Eu", "name": "Europium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "151.96", "x": 9, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁷", "valence": "3", "charge": "+3", "radius": 185, "en": 1.2, "ion": 547}, {"z": 64, "sym": "Gd", "name": "Gadolinium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "157.25", "x": 10, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁷ 5d¹", "valence": "3", "charge": "+3", "radius": 180, "en": 1.2, "ion": 593}, {"z": 65, "sym": "Tb", "name": "Terbium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "158.93", "x": 11, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f⁹", "valence": "3", "charge": "+3", "radius": 177, "en": 1.2, "ion": 565}, {"z": 66, "sym": "Dy", "name": "Dysprosium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "162.50", "x": 12, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁰", "valence": "3", "charge": "+3", "radius": 178, "en": 1.22, "ion": 573}, {"z": 67, "sym": "Ho", "name": "Holmium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "164.93", "x": 13, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹¹", "valence": "3", "charge": "+3", "radius": 176, "en": 1.23, "ion": 581}, {"z": 68, "sym": "Er", "name": "Erbium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "167.26", "x": 14, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹²", "valence": "3", "charge": "+3", "radius": 176, "en": 1.24, "ion": 589}, {"z": 69, "sym": "Tm", "name": "Thulium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "168.93", "x": 15, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹³", "valence": "3", "charge": "+3", "radius": 176, "en": 1.25, "ion": 597}, {"z": 70, "sym": "Yb", "name": "Ytterbium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "173.05", "x": 16, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴", "valence": "3", "charge": "+3", "radius": 193, "en": 1.1, "ion": 603}, {"z": 71, "sym": "Lu", "name": "Lutetium", "cat": "lanthanide", "group": "-", "period": 6, "mass": "174.97", "x": 17, "y": 9, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹", "valence": "3", "charge": "+3", "radius": 174, "en": 1.27, "ion": 524}, {"z": 72, "sym": "Hf", "name": "Hafnium", "cat": "transition", "group": 4, "period": 6, "mass": "178.49", "x": 4, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d²", "valence": "4", "charge": "+4", "radius": 159, "en": 1.3, "ion": 659}, {"z": 73, "sym": "Ta", "name": "Tantalum", "cat": "transition", "group": 5, "period": 6, "mass": "180.95", "x": 5, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d³", "valence": "5", "charge": "+5", "radius": 146, "en": 1.5, "ion": 761}, {"z": 74, "sym": "W", "name": "Tungsten", "cat": "transition", "group": 6, "period": 6, "mass": "183.84", "x": 6, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d⁴", "valence": "6", "charge": "+6", "radius": 139, "en": 2.36, "ion": 770}, {"z": 75, "sym": "Re", "name": "Rhenium", "cat": "transition", "group": 7, "period": 6, "mass": "186.21", "x": 7, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d⁵", "valence": "7", "charge": "+4", "radius": 137, "en": 1.9, "ion": 760}, {"z": 76, "sym": "Os", "name": "Osmium", "cat": "transition", "group": 8, "period": 6, "mass": "190.23", "x": 8, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d⁶", "valence": "8", "charge": "+4", "radius": 135, "en": 2.2, "ion": 840}, {"z": 77, "sym": "Ir", "name": "Iridium", "cat": "transition", "group": 9, "period": 6, "mass": "192.22", "x": 9, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d⁷", "valence": "9", "charge": "+4", "radius": 136, "en": 2.2, "ion": 880}, {"z": 78, "sym": "Pt", "name": "Platinum", "cat": "transition", "group": 10, "period": 6, "mass": "195.08", "x": 10, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s¹ 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s¹ 4f¹⁴ 5d⁹", "valence": "10", "charge": "+4", "radius": 136, "en": 2.28, "ion": 870}, {"z": 79, "sym": "Au", "name": "Gold", "cat": "transition", "group": 11, "period": 6, "mass": "196.97", "x": 11, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s¹ 4f¹⁴ 5d¹⁰", "valence": "11", "charge": "+3", "radius": 144, "en": 2.54, "ion": 890}, {"z": 80, "sym": "Hg", "name": "Mercury", "cat": "transition", "group": 12, "period": 6, "mass": "200.59", "x": 12, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰", "valence": "12", "charge": "+2", "radius": 151, "en": 2.0, "ion": 1007}, {"z": 81, "sym": "Tl", "name": "Thallium", "cat": "posttransition", "group": 13, "period": 6, "mass": "204.38", "x": 13, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p¹", "valence": "13", "charge": "+1", "radius": 170, "en": 1.62, "ion": 589}, {"z": 82, "sym": "Pb", "name": "Lead", "cat": "posttransition", "group": 14, "period": 6, "mass": "207.2", "x": 14, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p²", "valence": "14", "charge": "+2", "radius": 146, "en": 2.33, "ion": 716}, {"z": 83, "sym": "Bi", "name": "Bismuth", "cat": "posttransition", "group": 15, "period": 6, "mass": "208.98", "x": 15, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p³", "valence": "15", "charge": "+3", "radius": 148, "en": 2.02, "ion": 703}, {"z": 84, "sym": "Po", "name": "Polonium", "cat": "metalloid", "group": 16, "period": 6, "mass": "209", "x": 16, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁴", "valence": "16", "charge": "+2", "radius": 140, "en": 2.0, "ion": 812}, {"z": 85, "sym": "At", "name": "Astatine", "cat": "halogen", "group": 17, "period": 6, "mass": "210", "x": 17, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁵", "valence": "17", "charge": "-1", "radius": 150, "en": 2.2, "ion": 899}, {"z": 86, "sym": "Rn", "name": "Radon", "cat": "noble", "group": 18, "period": 6, "mass": "222", "x": 18, "y": 6, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶", "valence": "18", "charge": "0", "radius": 150, "en": null, "ion": 1037}, {"z": 87, "sym": "Fr", "name": "Francium", "cat": "alkali", "group": 1, "period": 7, "mass": "223", "x": 1, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s¹", "valence": "1", "charge": "+1", "radius": 260, "en": 0.7, "ion": 380}, {"z": 88, "sym": "Ra", "name": "Radium", "cat": "alkaline", "group": 2, "period": 7, "mass": "226", "x": 2, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s²", "valence": "2", "charge": "+2", "radius": 221, "en": 0.9, "ion": 509}, {"z": 89, "sym": "Ac", "name": "Actinium", "cat": "actinide", "group": "-", "period": 7, "mass": "227", "x": 3, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 6d¹", "valence": "3", "charge": "+3", "radius": 215, "en": 1.1, "ion": 499}, {"z": 90, "sym": "Th", "name": "Thorium", "cat": "actinide", "group": "-", "period": 7, "mass": "232.04", "x": 4, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 6d²", "valence": "4", "charge": "+4", "radius": 206, "en": 1.3, "ion": 587}, {"z": 91, "sym": "Pa", "name": "Protactinium", "cat": "actinide", "group": "-", "period": 7, "mass": "231.04", "x": 5, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f² 6d¹", "valence": "5", "charge": "+5", "radius": 200, "en": 1.5, "ion": 568}, {"z": 92, "sym": "U", "name": "Uranium", "cat": "actinide", "group": "-", "period": 7, "mass": "238.03", "x": 6, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f³ 6d¹", "valence": "6", "charge": "+6", "radius": 196, "en": 1.38, "ion": 598}, {"z": 93, "sym": "Np", "name": "Neptunium", "cat": "actinide", "group": "-", "period": 7, "mass": "237", "x": 7, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f⁴ 6d¹", "valence": "7", "charge": "+5", "radius": 190, "en": 1.36, "ion": 604}, {"z": 94, "sym": "Pu", "name": "Plutonium", "cat": "actinide", "group": "-", "period": 7, "mass": "244", "x": 8, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f⁶", "valence": "8", "charge": "+4", "radius": 187, "en": 1.28, "ion": 585}, {"z": 95, "sym": "Am", "name": "Americium", "cat": "actinide", "group": "-", "period": 7, "mass": "243", "x": 9, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f⁷", "valence": "9", "charge": "+3", "radius": 180, "en": 1.3, "ion": 578}, {"z": 96, "sym": "Cm", "name": "Curium", "cat": "actinide", "group": "-", "period": 7, "mass": "247", "x": 10, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f⁷ 6d¹", "valence": "10", "charge": "+3", "radius": 169, "en": 1.3, "ion": 581}, {"z": 97, "sym": "Bk", "name": "Berkelium", "cat": "actinide", "group": "-", "period": 7, "mass": "247", "x": 11, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f⁹", "valence": "11", "charge": "+3", "radius": 168, "en": 1.3, "ion": 601}, {"z": 98, "sym": "Cf", "name": "Californium", "cat": "actinide", "group": "-", "period": 7, "mass": "251", "x": 12, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁰", "valence": "12", "charge": "+3", "radius": 168, "en": 1.3, "ion": 608}, {"z": 99, "sym": "Es", "name": "Einsteinium", "cat": "actinide", "group": "-", "period": 7, "mass": "252", "x": 13, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹¹", "valence": "13", "charge": "+3", "radius": 165, "en": 1.3, "ion": 619}, {"z": 100, "sym": "Fm", "name": "Fermium", "cat": "actinide", "group": "-", "period": 7, "mass": "257", "x": 14, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹²", "valence": "14", "charge": "+3", "radius": 167, "en": 1.3, "ion": 627}, {"z": 101, "sym": "Md", "name": "Mendelevium", "cat": "actinide", "group": "-", "period": 7, "mass": "258", "x": 15, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹³", "valence": "15", "charge": "+3", "radius": 173, "en": 1.3, "ion": 635}, {"z": 102, "sym": "No", "name": "Nobelium", "cat": "actinide", "group": "-", "period": 7, "mass": "259", "x": 16, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴", "valence": "16", "charge": "+2", "radius": 176, "en": 1.3, "ion": 642}, {"z": 103, "sym": "Lr", "name": "Lawrencium", "cat": "actinide", "group": "-", "period": 7, "mass": "266", "x": 17, "y": 10, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 7p¹", "valence": "17", "charge": "+3", "radius": 161, "en": 1.3, "ion": 470}, {"z": 104, "sym": "Rf", "name": "Rutherfordium", "cat": "transition", "group": 4, "period": 7, "mass": "267", "x": 4, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d²", "valence": "4", "charge": "+4", "radius": 157, "en": null, "ion": 580}, {"z": 105, "sym": "Db", "name": "Dubnium", "cat": "transition", "group": 5, "period": 7, "mass": "268", "x": 5, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d³", "valence": "5", "charge": "+5", "radius": 149, "en": null, "ion": null}, {"z": 106, "sym": "Sg", "name": "Seaborgium", "cat": "transition", "group": 6, "period": 7, "mass": "269", "x": 6, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁴", "valence": "6", "charge": "+6", "radius": 143, "en": null, "ion": null}, {"z": 107, "sym": "Bh", "name": "Bohrium", "cat": "transition", "group": 7, "period": 7, "mass": "270", "x": 7, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁵", "valence": "7", "charge": "+7", "radius": 141, "en": null, "ion": null}, {"z": 108, "sym": "Hs", "name": "Hassium", "cat": "transition", "group": 8, "period": 7, "mass": "269", "x": 8, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁶", "valence": "8", "charge": "+4", "radius": 134, "en": null, "ion": null}, {"z": 109, "sym": "Mt", "name": "Meitnerium", "cat": "transition", "group": 9, "period": 7, "mass": "278", "x": 9, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁷", "valence": "9", "charge": "+3", "radius": 129, "en": null, "ion": null}, {"z": 110, "sym": "Ds", "name": "Darmstadtium", "cat": "transition", "group": 10, "period": 7, "mass": "281", "x": 10, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁸", "valence": "10", "charge": "+4", "radius": 128, "en": null, "ion": null}, {"z": 111, "sym": "Rg", "name": "Roentgenium", "cat": "transition", "group": 11, "period": 7, "mass": "282", "x": 11, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d⁹", "valence": "11", "charge": "+3", "radius": 121, "en": null, "ion": null}, {"z": 112, "sym": "Cn", "name": "Copernicium", "cat": "transition", "group": 12, "period": 7, "mass": "285", "x": 12, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰", "valence": "12", "charge": "+2", "radius": 122, "en": null, "ion": null}, {"z": 113, "sym": "Nh", "name": "Nihonium", "cat": "posttransition", "group": 13, "period": 7, "mass": "286", "x": 13, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p¹", "valence": "13", "charge": "+3", "radius": 136, "en": null, "ion": null}, {"z": 114, "sym": "Fl", "name": "Flerovium", "cat": "posttransition", "group": 14, "period": 7, "mass": "289", "x": 14, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p²", "valence": "14", "charge": "+4", "radius": 138, "en": null, "ion": null}, {"z": 115, "sym": "Mc", "name": "Moscovium", "cat": "posttransition", "group": 15, "period": 7, "mass": "290", "x": 15, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p³", "valence": "15", "charge": "-3", "radius": 138, "en": null, "ion": null}, {"z": 116, "sym": "Lv", "name": "Livermorium", "cat": "posttransition", "group": 16, "period": 7, "mass": "293", "x": 16, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p⁴", "valence": "16", "charge": "-2", "radius": 140, "en": null, "ion": null}, {"z": 117, "sym": "Ts", "name": "Tennessine", "cat": "halogen", "group": 17, "period": 7, "mass": "294", "x": 17, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p⁵", "valence": "17", "charge": "-1", "radius": 144, "en": null, "ion": null}, {"z": 118, "sym": "Og", "name": "Oganesson", "cat": "noble", "group": 18, "period": 7, "mass": "294", "x": 18, "y": 7, "config": "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰ 4p⁶ 5s² 4d¹⁰ 5p⁶ 6s² 4f¹⁴ 5d¹⁰ 6p⁶ 7s² 5f¹⁴ 6d¹⁰ 7p⁶", "valence": "18", "charge": "0", "radius": 153, "en": null, "ion": null}];

    const COLORS = {"alkali": "#F7C1C1", "alkaline": "#FAC775", "transition": "#B5D4F4", "posttransition": "#CECBF6", "metalloid": "#9FE1CB", "nonmetal": "#C7EEDD", "halogen": "#F4C0D1", "noble": "#C0DD97", "lanthanide": "#AFA9EC", "actinide": "#ED93B1"};
    const LABELS = {"alkali": "Alkali metal", "alkaline": "Alkaline earth", "transition": "Transition metal", "posttransition": "Post-transition", "metalloid": "Metalloid", "nonmetal": "Nonmetal", "halogen": "Halogen", "noble": "Noble gas", "lanthanide": "Lanthanide", "actinide": "Actinide"};

    const periodicTable = document.getElementById('periodicTable');
    const elementDetail = document.getElementById('elementDetail');
    const elementLegend = document.getElementById('elementLegend');
    const elementSearch = document.getElementById('elementSearch');
    const tip = document.getElementById('tooltip');
    const elementCells = [];

    const generateAufbauConfig = (z) => {
        const order = [
            {n:'1s', cap:2}, {n:'2s', cap:2}, {n:'2p', cap:6},
            {n:'3s', cap:2}, {n:'3p', cap:6}, {n:'4s', cap:2},
            {n:'3d', cap:10}, {n:'4p', cap:6}, {n:'5s', cap:2},
            {n:'4d', cap:10}, {n:'5p', cap:6}, {n:'6s', cap:2},
            {n:'4f', cap:14}, {n:'5d', cap:10}, {n:'6p', cap:6},
            {n:'7s', cap:2}, {n:'5f', cap:14}, {n:'6d', cap:10}, {n:'7p', cap:6}
        ];
        const sups = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','¹⁰','¹¹','¹²','¹³','¹⁴'];
        let remaining = z;
        let parts = [];
        for (let sub of order) {
            if (remaining <= 0) break;
            let filled = Math.min(remaining, sub.cap);
            parts.push(sub.n + (sups[filled] || filled));
            remaining -= filled;
        }
        return parts.join(' ');
    };

    const parseShells = (configStr) => {
        const shells = [];
        const parts = configStr.split(/\s+/);
        for (const p of parts) {
            const m = p.match(/^(\d+)([spdf])([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
            if (!m) continue;
            const n = parseInt(m[1]);
            const supMap = {'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9};
            let count = 0;
            for (const ch of m[3]) {
                if (supMap[ch] !== undefined) count = count * 10 + supMap[ch];
            }
            while (shells.length < n) shells.push(0);
            shells[n - 1] += count;
        }
        return shells.filter(s => s > 0);
    };

    const buildShellDiagram = (el) => {
        const shells = parseShells(el.config);
        if (!shells.length) return '';
        const size = el.z > 54 ? 220 : 180;
        const cx = size / 2, cy = size / 2;
        const nucleusR = el.z > 54 ? 20 : 25;
        const maxR = (size / 2) - 14;
        const step = shells.length > 1 ? maxR / shells.length : maxR;
        
        let svg = `<svg viewBox="0 0 ${size} ${size}" class="shell-diagram">`;
        svg += `<circle cx="${cx}" cy="${cy}" r="${nucleusR}" fill="#D4F1F4" stroke="#333" stroke-width="1.5"/>`;
        svg += `<text x="${cx}" y="${cy + nucleusR * 0.38}" text-anchor="middle" font-size="${nucleusR * 0.85}" font-weight="700" fill="#111">${el.sym}</text>`;
        
        for (let i = 0; i < shells.length; i++) {
            const r = (i + 1) * step;
            svg += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#888" stroke-width="1"/>`;
            const count = shells[i];
            for (let e = 0; e < count; e++) {
                const angle = (e / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
                const ex = cx + r * Math.cos(angle);
                const ey = cy + r * Math.sin(angle);
                svg += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="4" fill="#7A9B9E" stroke="#555" stroke-width="0.5"/>`;
            }
        }
        svg += '</svg>';
        return '<div class="shell-diagram">' + svg + '</div>';
    };

    const buildOrbitalBoxDiagram = (el) => {
        const sups = {'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9};
        const parts = el.config.split(/\s+/);
        let html = '<div class="orbital-box-container"><div class="orbital-title">Orbital Box Diagram</div>';

        const orbitalsToDisplay = parts.slice(-4);
        orbitalsToDisplay.forEach(p => {
            const m = p.match(/^(\d+[spdf])([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
            if (!m) return;
            const sub = m[1];
            const supStr = m[2];
            let eCount = 0;
            for (let ch of supStr) {
                if (sups[ch] !== undefined) eCount = eCount * 10 + sups[ch];
                else if (!isNaN(parseInt(ch))) eCount = eCount * 10 + parseInt(ch);
            }

            let numBoxes = sub.includes('p') ? 3 : sub.includes('d') ? 5 : sub.includes('f') ? 7 : 1;
            let boxArr = Array(numBoxes).fill(0);
            let rem = eCount;
            for (let i = 0; i < numBoxes && rem > 0; i++) { boxArr[i]++; rem--; }
            for (let i = 0; i < numBoxes && rem > 0; i++) { boxArr[i]++; rem--; }

            html += `<div class="orbital-group"><div class="sub-label">${sub}</div><div class="orbital-boxes">`;
            boxArr.forEach(c => {
                let arrow = c === 1 ? '↿' : c === 2 ? '↿⇂' : '';
                html += `<div class="box-unit">${arrow}</div>`;
            });
            html += '</div></div>';
        });

        html += '</div>';
        return html;
    };
    const BLOCKS = [
        {label:'1s', col:1, span:1, row:1}, {label:'1s', col:18, span:1, row:1},
        {label:'2s', col:1, span:2, row:2}, {label:'2p', col:13, span:6, row:2},
        {label:'3s', col:1, span:2, row:3}, {label:'3p', col:13, span:6, row:3},
        {label:'4s', col:1, span:2, row:4}, {label:'3d', col:3, span:10, row:4}, {label:'4p', col:13, span:6, row:4},
        {label:'5s', col:1, span:2, row:5}, {label:'4d', col:3, span:10, row:5}, {label:'5p', col:13, span:6, row:5},
        {label:'6s', col:1, span:2, row:6}, {label:'4f', col:3, span:15, row:9}, {label:'5d', col:3, span:10, row:6}, {label:'6p', col:13, span:6, row:6},
        {label:'7s', col:1, span:2, row:7}, {label:'5f', col:3, span:15, row:10}, {label:'6d', col:3, span:10, row:7}, {label:'7p', col:13, span:6, row:7},
    ];
    const buildTrend = (tKey) => {
        const TRENDS = {
            radius: {
                title: 'Atomic Radius',
                hLabel: 'LARGER', hDir: 'left',  // Increases right-to-left
                vLabel: 'LARGER', vDir: 'down'  // Increases top-to-bottom
            },
            electronegativity: {
                title: 'Electronegativity',
                hLabel: 'HIGHER', hDir: 'right', // Increases left-to-right
                vLabel: 'HIGHER', vDir: 'up'     // Increases bottom-to-top
            },
            ionization: {
                title: 'First Ionization Energy',
                hLabel: 'HIGHER', hDir: 'right', // Increases left-to-right
                vLabel: 'HIGHER', vDir: 'up'     // Increases bottom-to-top
            },
        };
        const c = TRENDS[tKey];
        if (!c) { trendOverlay.innerHTML = ''; return; }

        const M = 45, W = 810, H = 450;
        const x0 = M, y0 = M, x1 = M + W, y1 = M + H;

        // Horizontal Arrow Direction & Label Placement
        const hLine = c.hDir === 'right' 
            ? `<line x1="${x0+60}" y1="${y0-25}" x2="${x1-60}" y2="${y0-25}" stroke="var(--text-sub)" stroke-width="1.5" marker-end="url(#ah)"/>
            <text x="${x1-40}" y="${y0-30}" text-anchor="end" font-size="12" font-weight="600" fill="var(--text-sub)">${c.hLabel}</text>`
            : `<line x1="${x1-60}" y1="${y0-25}" x2="${x0+60}" y2="${y0-25}" stroke="var(--text-sub)" stroke-width="1.5" marker-end="url(#ah)"/>
            <text x="${x0+40}" y="${y0-30}" text-anchor="start" font-size="12" font-weight="600" fill="var(--text-sub)">${c.hLabel}</text>`;

        // Vertical Arrow Direction & Label Placement
        const vLine = c.vDir === 'up'
            ? `<line x1="${x1+25}" y1="${y1-60}" x2="${x1+25}" y2="${y0+60}" stroke="var(--text-sub)" stroke-width="1.5" marker-end="url(#ah)"/>
            <text x="${x1+30}" y="${y0+45}" text-anchor="start" font-size="12" font-weight="600" fill="var(--text-sub)">${c.vLabel}</text>`
            : `<line x1="${x1+25}" y1="${y0+60}" x2="${x1+25}" y2="${y1-60}" stroke="var(--text-sub)" stroke-width="1.5" marker-end="url(#ah)"/>
            <text x="${x1+30}" y="${y1-45}" text-anchor="start" font-size="12" font-weight="600" fill="var(--text-sub)">${c.vLabel}</text>`;

        trendOverlay.innerHTML = `
            <defs>
                <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text-sub)" stroke-width="1.5" stroke-linecap="round"/>
                </marker>
            </defs>
            ${hLine}
            ${vLine}
        `;
    };
    const initPeriodicTable = () => {
        if (!periodicTable) return;
        periodicTable.innerHTML = '';
        elementCells.length = 0;

        ELEMENTS.forEach(el => {
            const d = document.createElement('div');
            d.className = 'cell';
            d.style.gridColumn = el.x;
            d.style.gridRow = el.y;
            d.style.background = COLORS[el.cat] || '#eee';
            d.innerHTML = `<div class="z">${el.z}</div><div class="s">${el.sym}</div><div class="v"></div>`;
            d.onclick = () => showElementDetail(el);
            d.onmouseenter = () => showElementTip(el, d);
            d.onmouseleave = () => { tip.style.display = 'none'; };
            d._el = el;
            elementCells.push(d);
            periodicTable.appendChild(d);
        });

        // Placeholders
        [['57-71','3','6'],['89-103','3','7']].forEach(([txt,c,r]) => {
            const p = document.createElement('div');
            p.className = 'cell placeholder';
            p.style.gridColumn = c; p.style.gridRow = r;
            p.textContent = txt;
            periodicTable.appendChild(p);
        });

        // Append Electron Configuration Block Labels
        BLOCKS.forEach(b => {
            const d = document.createElement('div');
            d.className = 'block-label';
            d.textContent = b.label;
            d.style.gridColumn = `${b.col} / span ${b.span}`;
            d.style.gridRow = b.row;
            periodicTable.appendChild(d);
        });

        // Legend
        elementLegend.innerHTML = '';
        Object.keys(LABELS).forEach(k => {
            const item = document.createElement('div');
            item.innerHTML = `<span class="sw" style="background:${COLORS[k]}"></span>${LABELS[k]}`;
            elementLegend.appendChild(item);
        });
    };

    // Modified showElementDetail to match font size for Valence e- and Charge
    const showElementDetail = (el) => {
        const aufbauStr = generateAufbauConfig(el.z);
        elementDetail.innerHTML = `
            <h2>${el.name} (${el.sym})</h2>
            <div class="meta">Atomic Number ${el.z} · ${LABELS[el.cat] || el.cat}</div>
            <div class="row"><span>Atomic Mass</span><span>${el.mass}</span></div>
            <div class="row"><span>Group</span><span>${el.group}</span></div>
            <div class="row"><span>Period</span><span>${el.period}</span></div>
            <div class="row"><span>Valence e⁻</span><span>${el.valence}</span></div>
            <div class="row"><span>Common Charge</span><span>${el.charge}</span></div>
            <div class="config-section">
                <div class="cfg-label" style="color:#888;">Aufbau Configuration</div>
                <div class="cfg-aufbau">${aufbauStr}</div>
                <div class="cfg-label" style="color:#e74c3c;">Ground State Config</div>
                <div class="cfg-ground">${el.config}</div>
            </div>
            ${buildShellDiagram(el)}
            ${buildOrbitalBoxDiagram(el)}
        `;
    };

    const showElementTip = (el, cell) => {
        tip.innerHTML = `
            <div class="tname">${el.name} (${el.sym})</div>
            <div class="tmeta">#${el.z} · ${LABELS[el.cat] || el.cat}</div>
            Mass: <b>${el.mass}</b><br>
            Valence: <b>${el.valence}</b> | Charge: <b>${el.charge}</b>
        `;
        tip.style.display = 'block';
        const r = cell.getBoundingClientRect();
        tip.style.left = `${Math.max(8, r.left + r.width / 2 - 60)}px`;
        tip.style.top = `${r.top - 70}px`;
    };

    elementSearch.addEventListener('input', () => {
        const q = elementSearch.value.trim().toLowerCase();
        elementCells.forEach(c => {
            c.classList.remove('highlight', 'dim');
            const e = c._el;
            const hit = q && (e.sym.toLowerCase() === q || e.name.toLowerCase().includes(q) || String(e.z) === q);
            if (hit) {
                c.classList.add('highlight');
            } else if (q) {
                c.classList.add('dim');
            }
        });
    });

    // Trend Bar Buttons Event Listener
    const trendButtons = document.querySelectorAll('#trendBar button');
    trendButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            trendButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const mode = this.dataset.mode;

            periodicTable.classList.remove('blocks-mode');
            buildTrend(mode);

            elementCells.forEach(c => {
                c.classList.remove('value-mode', 'blocks-mode');
                const el = c._el;
                c.querySelector('.v').textContent = '';
                if (mode === 'radius') {
                    c.classList.add('value-mode');
                    c.querySelector('.v').textContent = el.radius || '—';
                } else if (mode === 'electronegativity') {
                    c.classList.add('value-mode');
                    c.querySelector('.v').textContent = el.en || '—';
                } else if (mode === 'ionization') {
                    c.classList.add('value-mode');
                    c.querySelector('.v').textContent = el.ion || '—';
                } else if (mode === 'blocks') {
                    c.classList.add('blocks-mode');
                    periodicTable.classList.add('blocks-mode');
                }
            });
        });
    });
    // App Initialization
    const init = () => {
        const savedSettings = localStorage.getItem('studyAssistantSettings');
        if (savedSettings) {
            try { settings = JSON.parse(savedSettings); } catch (e) {}
        }
        applySettings();
        renderTasks();
        renderReminders();
        initPeriodicTable();
        updateTimerDisplay();
    };

    init();
});