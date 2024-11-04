let undoStack = []; // Stack to keep track of states for undo

// Save data to LocalStorage
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Retrieve data from LocalStorage
function getData(key) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
}

// Save the state of the bentos, tasks, and the quote
function saveBentoState() {
    const bentos = [];
    document.querySelectorAll('.bento-column').forEach((bento) => {
        const title = bento.querySelector('.bento-title').innerText;
        const tasks = Array.from(bento.querySelectorAll('.task-item')).map((task) => {
            const taskInput = task.querySelector('.task-input');
            const isChecked = task.querySelector('.task-checkbox').checked;
            return {
                value: taskInput.value,
                height: taskInput.style.height,
                checked: isChecked
            };
        });
        bentos.push({ title, tasks });
    });

    const quote = document.getElementById('quote-box').value;
    localStorage.setItem('quote', quote); // Store the quote in LocalStorage

    pushToUndoStack(); // Save current state to undo stack before changes
    saveData('bentos', bentos);
}

// Load the state of the bentos, tasks, and the quote
function loadBentoState() {
    const bentos = getData('bentos');
    if (bentos) {
        const bentoContainer = document.getElementById('bento-container');
        bentoContainer.innerHTML = ''; // Clear existing bentos

        bentos.forEach((bento) => {
            addBentoBox(bento.title, bento.tasks);
        });
    }

    // Load the saved quote
    const savedQuote = localStorage.getItem('quote');
    if (savedQuote) {
        document.getElementById('quote-box').value = savedQuote; // Set the quote
    }
}

// Function to add a new bento box with optional title and tasks
function addBentoBox(title = 'New Bento', tasks = []) {
    const container = document.getElementById('bento-container');

    const newBento = document.createElement('div');
    newBento.className = 'bento-column';

    newBento.innerHTML = `
        <div class="column-header">
            <div class="title-container">
                <h2 contenteditable="true" class="bento-title">${title}</h2>
                <button class="add-task-btn">+</button>
            </div>
            <button class="delete-bento-btn">X</button>
        </div>
        <ul class="task-list"></ul>
    `;

    const taskList = newBento.querySelector('.task-list');
    tasks.forEach((task) => {
        addTask(taskList, task.value, task.height, task.checked);
    });

    container.appendChild(newBento);

    // Save state when title is edited
    newBento.querySelector('.bento-title').addEventListener('input', saveBentoState);

    // Enable SortableJS for task reordering within the bento
    new Sortable(taskList, {
        animation: 150,
        onEnd: saveBentoState
    });

    saveBentoState();
}

// Function to add a new task with a checkbox
function addTask(taskList, taskValue = '', taskHeight = 'auto', isChecked = false) {
    const newTask = document.createElement('li');
    newTask.className = 'task-item';

    const taskCheckbox = document.createElement('input');
    taskCheckbox.type = 'checkbox';
    taskCheckbox.className = 'task-checkbox';
    taskCheckbox.checked = isChecked;

    const taskInput = document.createElement('textarea');
    taskInput.placeholder = 'Type your task here...';
    taskInput.className = 'task-input';
    taskInput.value = taskValue;
    taskInput.style.height = taskHeight; // Set the height to the saved height

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-task-btn';
    deleteButton.textContent = '−';

    // Strike through the text if the checkbox is checked
    taskCheckbox.addEventListener('change', () => {
        taskInput.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
        saveBentoState();
    });

    // Apply the strikethrough style if the task is already checked
    taskInput.style.textDecoration = isChecked ? 'line-through' : 'none';

    newTask.appendChild(taskCheckbox);
    newTask.appendChild(taskInput);
    newTask.appendChild(deleteButton);
    taskList.appendChild(newTask);

    // Adjust the height of the textarea based on its content
    taskInput.addEventListener('input', autoResizeTextarea);
    taskInput.addEventListener('input', saveBentoState);

    deleteButton.addEventListener('click', () => {
        newTask.remove();
        saveBentoState();
    });

    saveBentoState();
}

// Automatically adjust the height of the textarea based on its content
function autoResizeTextarea() {
    this.style.height = 'auto'; // Reset height to calculate correct new height
    this.style.height = this.scrollHeight + 'px'; // Set height to fit content
}

// Function to push the current state to the undo stack
function pushToUndoStack() {
    const bentos = getData('bentos');
    if (bentos) {
        undoStack.push(JSON.stringify(bentos)); // Push current state to undo stack
        if (undoStack.length > 20) undoStack.shift(); // Limit undo stack size
    }
}

// Function to undo the last action
function undoLastAction() {
    if (undoStack.length > 0) {
        const lastState = undoStack.pop();
        saveData('bentos', JSON.parse(lastState));
        loadBentoState();
    } else {
        alert('No more actions to undo.');
    }
}

// Event delegation to handle add task, delete task, and delete bento
document.getElementById('bento-container').addEventListener('click', function (event) {
    const target = event.target;

    // Handle add task button
    if (target.classList.contains('add-task-btn')) {
        const taskList = target.closest('.bento-column').querySelector('.task-list');
        addTask(taskList);
    }

    // Handle delete task button
    if (target.classList.contains('delete-task-btn')) {
        target.closest('li').remove();
        saveBentoState();
    }

    // Handle delete bento button
    if (target.classList.contains('delete-bento-btn')) {
        target.closest('.bento-column').remove();
        saveBentoState();
    }
});

// Initialize SortableJS on the bento container
document.addEventListener('DOMContentLoaded', function () {
    loadBentoState();

    // Ensure the "Add Bento" button only has one event listener
    const addBentoButton = document.getElementById('add-bento-btn');
    addBentoButton.removeEventListener('click', handleAddBento);
    addBentoButton.addEventListener('click', handleAddBento);

    // Add undo button functionality
    const undoButton = document.getElementById('undo-btn');
    undoButton.addEventListener('click', undoLastAction);

    // Enable SortableJS on the bento container
    new Sortable(document.getElementById('bento-container'), {
        animation: 150,
        onEnd: saveBentoState // Save state after reordering
    });
});

// Function to handle adding a new bento box
function handleAddBento() {
    addBentoBox();
    saveBentoState();
}
