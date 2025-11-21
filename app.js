const state = {
  tasks: [],
  selectedDate: new Date(),
  filterDate: '',
  filterPriority: 'all',
};

const els = {
  form: document.getElementById('taskForm'),
  taskList: document.getElementById('taskList'),
  template: document.getElementById('taskTemplate'),
  monthLabel: document.getElementById('monthLabel'),
  calendar: document.getElementById('calendar'),
  prevMonth: document.getElementById('prevMonth'),
  nextMonth: document.getElementById('nextMonth'),
  filterDate: document.getElementById('filterDate'),
  filterPriority: document.getElementById('filterPriority'),
  prefillBtn: document.getElementById('prefillBtn'),
  todayBtn: document.getElementById('todayBtn'),
  clearAll: document.getElementById('clearAll'),
};

function loadFromStorage() {
  const raw = localStorage.getItem('tasks');
  if (raw) {
    state.tasks = JSON.parse(raw);
  }
}

function saveToStorage() {
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function renderCalendar() {
  const current = new Date(state.selectedDate);
  current.setDate(1);

  const month = current.getMonth();
  const year = current.getFullYear();
  els.monthLabel.textContent = `${year} 年 ${month + 1} 月`;

  const startDay = current.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const fragment = document.createDocumentFragment();

  const todayStr = formatDate(new Date());
  const selectedStr = formatDate(state.selectedDate);

  // weekdays header
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach((w) => {
    const header = document.createElement('div');
    header.className = 'day day--header';
    header.textContent = w;
    header.style.minHeight = 'auto';
    header.style.fontWeight = '700';
    header.style.color = 'var(--muted)';
    fragment.appendChild(header);
  });

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    fragment.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const cell = document.createElement('button');
    cell.className = 'day';
    cell.setAttribute('type', 'button');
    cell.setAttribute('aria-label', `${dateStr} 的任务`);

    if (dateStr === todayStr) cell.classList.add('day--today');
    if (dateStr === selectedStr) cell.classList.add('day--selected');

    const label = document.createElement('div');
    label.className = 'day__label';
    label.innerHTML = `<span>${day}</span>`;

    const dots = document.createElement('div');
    dots.className = 'day__dots';
    const todaysTasks = state.tasks.filter((t) => t.dueDate === dateStr);
    todaysTasks.forEach((task) => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.dataset.priority = task.priority;
      dots.appendChild(dot);
    });

    label.appendChild(dots);
    cell.appendChild(label);

    cell.addEventListener('click', () => {
      state.selectedDate = date;
      state.filterDate = dateStr;
      els.filterDate.value = dateStr;
      renderCalendar();
      renderTasks();
    });

    fragment.appendChild(cell);
  }

  els.calendar.innerHTML = '';
  els.calendar.appendChild(fragment);
}

function renderTasks() {
  els.taskList.innerHTML = '';
  const filtered = state.tasks.filter((task) => {
    const matchDate = state.filterDate ? task.dueDate === state.filterDate : true;
    const matchPriority = state.filterPriority === 'all' ? true : task.priority === state.filterPriority;
    return matchDate && matchPriority;
  });

  if (!filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '暂无任务，试着创建一个吧。';
    els.taskList.appendChild(empty);
    return;
  }

  filtered
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .forEach((task) => {
      const node = els.template.content.cloneNode(true);
      const li = node.querySelector('li');
      li.dataset.id = task.id;

      const badge = node.querySelector('.badge');
      badge.dataset.priority = task.priority;
      badge.textContent = `${task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'} 优先`;

      node.querySelector('.task__date').textContent = task.dueDate;
      node.querySelector('.task__title').textContent = task.title;
      const desc = node.querySelector('.task__description');
      desc.textContent = task.description || '无描述';

      const completeBtn = node.querySelector('.complete-btn');
      completeBtn.textContent = task.done ? '已完成' : '标记完成';
      completeBtn.disabled = task.done;
      completeBtn.addEventListener('click', () => toggleTask(task.id));

      node.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

      if (task.done) {
        li.style.opacity = '0.6';
        node.querySelector('.task__title').style.textDecoration = 'line-through';
      }

      els.taskList.appendChild(node);
    });
}

function addTask(task) {
  state.tasks.push(task);
  saveToStorage();
  renderTasks();
  renderCalendar();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveToStorage();
  renderTasks();
  renderCalendar();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, done: true } : t));
  saveToStorage();
  renderTasks();
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const title = formData.get('title').trim();
  const description = formData.get('description').trim();
  const dueDate = formData.get('dueDate');
  const priority = formData.get('priority');

  if (!title || !dueDate) return;

  addTask({
    id: crypto.randomUUID(),
    title,
    description,
    dueDate,
    priority,
    done: false,
  });

  event.target.reset();
  event.target.title.focus();
}

function prefillExample() {
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  const nextWeek = formatDate(new Date(Date.now() + 7 * 86400000));

  state.tasks = [
    {
      id: crypto.randomUUID(),
      title: '迭代产品原型',
      description: '整理同事反馈，输出交互稿与标注。',
      dueDate: today,
      priority: 'high',
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: '团队周会',
      description: '汇报本周进度，明确下周目标。',
      dueDate: tomorrow,
      priority: 'medium',
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: '阅读行业报告',
      description: '关注 AI 新趋势，整理要点。',
      dueDate: nextWeek,
      priority: 'low',
      done: false,
    },
  ];
  saveToStorage();
  renderCalendar();
  renderTasks();
}

function clearAllTasks() {
  if (confirm('确定要清空全部任务吗？')) {
    state.tasks = [];
    saveToStorage();
    renderCalendar();
    renderTasks();
  }
}

function initFilters() {
  els.filterDate.addEventListener('change', (e) => {
    state.filterDate = e.target.value;
    renderTasks();
    renderCalendar();
  });
  els.filterPriority.addEventListener('change', (e) => {
    state.filterPriority = e.target.value;
    renderTasks();
  });
}

function initCalendarNav() {
  els.prevMonth.addEventListener('click', () => {
    state.selectedDate.setMonth(state.selectedDate.getMonth() - 1);
    renderCalendar();
  });
  els.nextMonth.addEventListener('click', () => {
    state.selectedDate.setMonth(state.selectedDate.getMonth() + 1);
    renderCalendar();
  });
  els.todayBtn.addEventListener('click', () => {
    state.selectedDate = new Date();
    state.filterDate = formatDate(state.selectedDate);
    els.filterDate.value = state.filterDate;
    renderCalendar();
    renderTasks();
  });
}

function initForm() {
  els.form.addEventListener('submit', handleSubmit);
  els.prefillBtn.addEventListener('click', prefillExample);
  els.clearAll.addEventListener('click', clearAllTasks);
}

function init() {
  loadFromStorage();
  initFilters();
  initCalendarNav();
  initForm();
  renderCalendar();
  renderTasks();
}

document.addEventListener('DOMContentLoaded', init);
