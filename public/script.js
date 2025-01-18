// State management
let token = localStorage.getItem("token");
let isLoading = false;
let isAuthenticating = false;
let isRegistration = false;
let selectedTab = "All";
let todos = [];

const apiBase = "/";

// DOM Elements
const nav = document.querySelector("nav");
const header = document.querySelector("header");
const main = document.querySelector("main");
const navElements = document.querySelectorAll(".tab-button");
const authContent = document.getElementById("auth");
const textError = document.getElementById("error");
const email = document.getElementById("emailInput");
const password = document.getElementById("passwordInput");
const registerBtn = document.getElementById("registerBtn");
const authBtn = document.getElementById("authBtn");

// Event Listeners
registerBtn.addEventListener("click", toggleIsRegister);
authBtn.addEventListener("click", authenticate);

navElements.forEach((button) => {
  button.addEventListener("click", () => {
    changeTab(button.dataset.tab);
  });
});

// PAGE RENDERING LOGIC
async function showDashboard() {
  nav.style.display = "block";
  header.style.display = "flex";
  main.style.display = "flex";
  authContent.style.display = "none";
  await fetchTodos();
}

function updateHeaderText() {
  const todosLength = todos.length;
  const newString =
    todos.length === 1
      ? `You have 1 open task.`
      : `You have ${todosLength} open tasks.`;
  header.querySelector("h1").innerText = newString;
}

function updateNavCount() {
  navElements.forEach((ele) => {
    const btnText = ele.dataset.tab;
    const count = todos.filter((val) => {
      if (btnText === "All") return true;
      return btnText === "Complete" ? val.completed : !val.completed;
    }).length;
    ele.querySelector("span").innerText = `(${count})`;
  });
}

function changeTab(tab) {
  selectedTab = tab;
  navElements.forEach((val) => {
    if (val.dataset.tab === tab) {
      val.classList.add("selected-tab");
    } else {
      val.classList.remove("selected-tab");
    }
  });
  renderTodos();
}

function renderTodos() {
  updateNavCount();
  updateHeaderText();

  const filteredTodos = todos.filter((val) => {
    return selectedTab === "All"
      ? true
      : selectedTab === "Complete"
      ? val.completed
      : !val.completed;
  });

  const todoList = filteredTodos
    .map(
      (todo) => `
        <div class="card todo-item">
            <p>${todo.task}</p>
            <div class="todo-buttons">
                <button onclick="updateTodo(${todo.id})" ${
        todo.completed ? "disabled" : ""
      }>
                    <h6>Done</h6>
                </button>
                <button onclick="deleteTodo(${todo.id})">
                    <h6>Delete</h6>
                </button>
            </div>
        </div>
    `
    )
    .join("");

  const inputContainer = `
        <div class="input-container">
            <input id="todoInput" placeholder="Add task" />
            <button onclick="addTodo()">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    `;

  main.innerHTML = todoList + inputContainer;
}

// AUTH LOGIC
async function toggleIsRegister() {
  isRegistration = !isRegistration;
  registerBtn.innerText = isRegistration ? "Sign in" : "Sign up";
  document.querySelector("#auth > div h2").innerText = isRegistration
    ? "Sign Up"
    : "Login";
  document.querySelector(".register-content p").innerText = isRegistration
    ? "Already have an account?"
    : "Don't have an account?";
}

async function authenticate() {
  const emailVal = email.value;
  const passVal = password.value;

  if (
    isLoading ||
    isAuthenticating ||
    !emailVal ||
    !passVal ||
    passVal.length < 6
  ) {
    return;
  }

  error.style.display = "none";
  isAuthenticating = true;
  authBtn.innerText = "Authenticating...";

  try {
    const response = await fetch(
      apiBase + `auth/${isRegistration ? "register" : "login"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: emailVal, password: passVal }),
      }
    );
    const data = await response.json();

    if (data.token) {
      token = data.token;
      localStorage.setItem("token", token);
      authBtn.innerText = "Loading...";
      await fetchTodos();
      showDashboard();
    } else {
      throw Error("❌ Failed to authenticate...");
    }
  } catch (err) {
    console.error(err.message);
    error.innerText = err.message;
    error.style.display = "block";
  } finally {
    authBtn.innerText = "Submit";
    isAuthenticating = false;
  }
}

// CRUD LOGIC
async function fetchTodos() {
  isLoading = true;
  try {
    const response = await fetch(apiBase + "todos", {
      headers: { Authorization: token },
    });
    todos = await response.json();
    renderTodos();
  } catch (error) {
    console.error("Error fetching todos:", error);
  } finally {
    isLoading = false;
  }
}

async function updateTodo(index) {
  try {
    const todo = todos.find((val) => val.id === index);
    await fetch(`${apiBase}todos/${index}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        task: todo.task,
        completed: 1,
      }),
    });
    await fetchTodos();
  } catch (error) {
    console.error("Error updating todo:", error);
  }
}

async function deleteTodo(index) {
  try {
    await fetch(`${apiBase}todos/${index}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });
    await fetchTodos();
  } catch (error) {
    console.error("Error deleting todo:", error);
  }
}

async function addTodo() {
  const todoInput = document.getElementById("todoInput");
  const task = todoInput.value.trim();

  if (!task) return;

  try {
    await fetch(apiBase + "todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ task }),
    });
    todoInput.value = "";
    await fetchTodos();
  } catch (error) {
    console.error("Error adding todo:", error);
  }
}

// Initialize app
if (token) {
  showDashboard().catch(console.error);
}
