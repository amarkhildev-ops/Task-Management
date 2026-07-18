/* =========================================================
   CodeLab JavaScript — app.js
   Vanilla JS only. Shared helpers + one init function per page.
   ========================================================= */

/* ---------- Small shared helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — fail silently */
  }
}

/* ---------- Theme toggle (all pages) ---------- */
function initTheme() {
  const toggleBtn = $(".theme-toggle");
  const saved = localStorage.getItem("codelab-theme");
  if (saved === "dark") document.body.classList.add("dark");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const mode = document.body.classList.contains("dark") ? "dark" : "light";
      localStorage.setItem("codelab-theme", mode);
    });
  }
}

/* =========================================================
   PAGE 1 — INTERACTIVE TASK MANAGER
   ========================================================= */
function initTaskManager() {
  const STORAGE_KEY = "codelab-tasks";

  const defaultTasks = [
    { id: 1, title: "Review DOM event listeners", priority: "high", category: "Study", completed: false },
    { id: 2, title: "Prepare product filtering exercise", priority: "medium", category: "Project", completed: true },
    { id: 3, title: "Read about localStorage", priority: "low", category: "Study", completed: false },
    { id: 4, title: "Meet project team at 2:00 PM", priority: "medium", category: "Meeting", completed: false }
  ];

  let tasks = readStorage(STORAGE_KEY, defaultTasks);

  const taskForm = $("#taskForm");
  const taskTitle = $("#taskTitle");
  const taskPriority = $("#taskPriority");
  const taskCategory = $("#taskCategory");
  const taskList = $("#taskList");
  const taskSearch = $("#taskSearch");
  const statusFilter = $("#statusFilter");
  const clearCompletedBtn = $("#clearCompleted");

  const totalCount = $("#totalCount");
  const completedCount = $("#completedCount");
  const pendingCount = $("#pendingCount");
  const completionRate = $("#completionRate");

  const todayLabel = $("#todayLabel");
  const dateLabel = $("#dateLabel");

  function setTodayLabels() {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (todayLabel) todayLabel.textContent = days[now.getDay()];
    if (dateLabel) dateLabel.textContent = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  function saveTasks() {
    writeStorage(STORAGE_KEY, tasks);
  }

  function nextId() {
    return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    completionRate.textContent = `${rate}%`;
  }

  function getFilteredTasks() {
    const query = taskSearch.value.trim().toLowerCase();
    const status = statusFilter.value;

    return tasks.filter(task => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query);

      const matchesStatus =
        status === "all" ||
        (status === "completed" && task.completed) ||
        (status === "pending" && !task.completed);

      return matchesQuery && matchesStatus;
    });
  }

  function renderTasks() {
    const visible = getFilteredTasks();

    if (visible.length === 0) {
      taskList.innerHTML = `<li class="empty-state">No tasks found.</li>`;
    } else {
      taskList.innerHTML = visible
        .map(
          task => `
        <li class="task-item ${task.completed ? "done" : ""}" data-id="${task.id}">
          <button type="button" class="check-btn" data-action="toggle" aria-label="Toggle task completion">${task.completed ? "✓" : ""}</button>
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span class="badge ${task.priority}">${capitalize(task.priority)} priority</span>
              <span>${escapeHtml(task.category)}</span>
            </div>
          </div>
          <div class="task-actions">
            <button type="button" class="icon-btn" data-action="delete" aria-label="Delete task">×</button>
          </div>
        </li>`
        )
        .join("");
    }

    updateStats();
  }

  function addTask(event) {
    event.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) return;

    tasks.push({
      id: nextId(),
      title,
      priority: taskPriority.value,
      category: taskCategory.value,
      completed: false
    });

    saveTasks();
    renderTasks();
    taskForm.reset();
    taskTitle.focus();
    showToast("Task added.");
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    showToast(task.completed ? "Task marked completed." : "Task marked pending.");
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast("Task deleted.");
  }

  function clearCompleted() {
    const hadCompleted = tasks.some(t => t.completed);
    if (!hadCompleted) {
      showToast("No completed tasks to clear.");
      return;
    }
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    showToast("Completed tasks cleared.");
  }

  taskForm.addEventListener("submit", addTask);
  taskSearch.addEventListener("input", renderTasks);
  statusFilter.addEventListener("change", renderTasks);
  clearCompletedBtn.addEventListener("click", clearCompleted);

  taskList.addEventListener("click", event => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const li = event.target.closest("[data-id]");
    const id = Number(li.dataset.id);

    if (btn.dataset.action === "toggle") toggleTask(id);
    if (btn.dataset.action === "delete") deleteTask(id);
  });

  setTodayLabels();
  renderTasks();
}

/* =========================================================
   PAGE 2 — DYNAMIC PRODUCT EXPLORER
   ========================================================= */
function initProductExplorer() {
  const CART_KEY = "codelab-cart";

  const products = [
    { id: 1, name: "JavaScript Essentials", category: "Development", description: "A practical guide to variables, functions, arrays, events, and DOM manipulation.", price: 24, icon: "JS", colorA: "#2563eb", colorB: "#0f766e" },
    { id: 2, name: "UI Component Kit", category: "Design", description: "Reusable interface cards, buttons, forms, alerts, and dashboard components.", price: 18, icon: "UI", colorA: "#9333ea", colorB: "#db2777" },
    { id: 3, name: "Focus Planner Pro", category: "Productivity", description: "A planning toolkit for weekly goals, time blocks, and assignment deadlines.", price: 12, icon: "✓", colorA: "#f97316", colorB: "#f59e0b" },
    { id: 4, name: "Advanced DOM Projects", category: "Development", description: "Build modals, tabs, filters, carts, validation, and interactive dashboards.", price: 32, icon: "</>", colorA: "#16a34a", colorB: "#15803d" },
    { id: 5, name: "Design System Starter", category: "Design", description: "Typography, spacing, color tokens, responsive layouts, and component rules.", price: 28, icon: "DS", colorA: "#c026d3", colorB: "#7c3aed" },
    { id: 6, name: "Study Sprint Board", category: "Productivity", description: "Organize study sprints and track progress through simple visual boards.", price: 15, icon: "⚡", colorA: "#1d4ed8", colorB: "#2563eb" }
  ];

  let cart = readStorage(CART_KEY, []); // [{ id, qty }]

  const productGrid = $("#productGrid");
  const productSearch = $("#productSearch");
  const categoryFilter = $("#categoryFilter");
  const sortProducts = $("#sortProducts");
  const visibleCount = $("#visibleCount");

  const overlay = $("#overlay");
  const productModal = $("#productModal");
  const modalBody = $("#modalBody");
  const closeModalBtn = $("#closeModal");

  const cartDrawer = $("#cartDrawer");
  const openCartBtn = $("#openCart");
  const closeCartBtn = $("#closeCart");
  const cartItemsEl = $("#cartItems");
  const cartCountEl = $("#cartCount");
  const cartTotalEl = $("#cartTotal");

  function saveCart() {
    writeStorage(CART_KEY, cart);
  }

  function findProduct(id) {
    return products.find(p => p.id === id);
  }

  function getVisibleProducts() {
    const query = productSearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const sortBy = sortProducts.value;

    let list = products.filter(p => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesCategory;
    });

    if (sortBy === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }

  function productCardHTML(p) {
    return `
      <article class="panel product-card" data-id="${p.id}">
        <div class="product-art" style="--product-a:${p.colorA}; --product-b:${p.colorB};">
          <div class="product-icon">${p.icon}</div>
          <small>${p.category}</small>
        </div>
        <div class="product-content">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.description)}</p>
          <div class="product-bottom">
            <div class="price"><strong>$${p.price}</strong><span> one-time</span></div>
            <div class="product-buttons">
              <button type="button" class="btn btn-outline btn-small" data-action="view" data-id="${p.id}">View</button>
              <button type="button" class="btn btn-primary btn-small" data-action="add" data-id="${p.id}">Add</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderProducts() {
    const visible = getVisibleProducts();
    productGrid.innerHTML = visible.length
      ? visible.map(productCardHTML).join("")
      : `<div class="empty-state">No products match your search.</div>`;
    visibleCount.textContent = `${visible.length} items`;
  }

  function openOverlay() {
    overlay.classList.add("show");
  }
  function closeOverlay() {
    overlay.classList.remove("show");
  }

  function openModal(id) {
    const p = findProduct(id);
    if (!p) return;
    modalBody.innerHTML = `
      <div class="modal-product">
        <div class="modal-art" style="--product-a:${p.colorA}; --product-b:${p.colorB};">${p.icon}</div>
        <div>
          <span class="badge">${p.category}</span>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="helper">${escapeHtml(p.description)}</p>
          <div class="price"><strong>$${p.price}</strong></div>
          <button type="button" class="btn btn-primary" data-action="add" data-id="${p.id}">Add to Cart</button>
        </div>
      </div>`;
    productModal.classList.add("show");
    openOverlay();
  }

  function closeModal() {
    productModal.classList.remove("show");
    if (!cartDrawer.classList.contains("show")) closeOverlay();
  }

  function openCart() {
    cartDrawer.classList.add("show");
    openOverlay();
  }
  function closeCart() {
    cartDrawer.classList.remove("show");
    if (!productModal.classList.contains("show")) closeOverlay();
  }

  function addToCart(id) {
    const item = cart.find(c => c.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, qty: 1 });

    saveCart();
    renderCart();
    const p = findProduct(id);
    showToast(`${p.name} added to cart.`);
  }

  function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id);
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    renderCart();
  }

  function renderCart() {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    } else {
      cartItemsEl.innerHTML = cart
        .map(item => {
          const p = findProduct(item.id);
          if (!p) return "";
          return `
          <div class="cart-item" data-id="${p.id}">
            <div>
              <strong>${escapeHtml(p.name)}</strong>
              <small>$${p.price} each</small>
              <div class="qty">
                <button type="button" data-action="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
                <span>${item.qty}</span>
                <button type="button" data-action="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div>
              <strong>$${p.price * item.qty}</strong>
              <button type="button" class="icon-btn" data-action="remove" data-id="${p.id}" aria-label="Remove item">×</button>
            </div>
          </div>`;
        })
        .join("");
    }

    const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
    const totalPrice = cart.reduce((sum, c) => {
      const p = findProduct(c.id);
      return sum + (p ? p.price * c.qty : 0);
    }, 0);

    cartCountEl.textContent = totalQty;
    cartTotalEl.textContent = `$${totalPrice}`;
  }

  productSearch.addEventListener("input", renderProducts);
  categoryFilter.addEventListener("change", renderProducts);
  sortProducts.addEventListener("change", renderProducts);

  productGrid.addEventListener("click", event => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "view") openModal(id);
    if (btn.dataset.action === "add") addToCart(id);
  });

  modalBody.addEventListener("click", event => {
    const btn = event.target.closest("button[data-action='add']");
    if (!btn) return;
    addToCart(Number(btn.dataset.id));
  });

  cartItemsEl.addEventListener("click", event => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "inc") changeQty(id, 1);
    if (btn.dataset.action === "dec") changeQty(id, -1);
    if (btn.dataset.action === "remove") removeFromCart(id);
  });

  openCartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  closeModalBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", () => {
    closeCart();
    closeModal();
  });

  renderProducts();
  renderCart();
}

/* =========================================================
   PAGE 3 — SMART REGISTRATION FORM
   ========================================================= */
function initRegistrationForm() {
  const form = $("#registrationForm");
  const fullName = $("#fullName");
  const email = $("#email");
  const password = $("#password");
  const togglePasswordBtn = $("#togglePassword");
  const strengthBar = $("#strengthBar");
  const strengthText = $("#strengthText");
  const role = $("#role");
  const bio = $("#bio");
  const bioCount = $("#bioCount");
  const terms = $("#terms");

  const formStatus = $("#formStatus");
  const validFieldCount = $("#validFieldCount");

  const previewAvatar = $("#previewAvatar");
  const previewName = $("#previewName");
  const previewRole = $("#previewRole");
  const previewEmail = $("#previewEmail");
  const previewBio = $("#previewBio");

  const overlay = $("#overlay");
  const successModal = $("#successModal");
  const successMessage = $("#successMessage");
  const closeSuccessBtn = $("#closeSuccess");
  const submitBtn = $("#submitProfile");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  const validators = {
    fullName: () => {
      const value = fullName.value.trim();
      if (value.length < 3) return "Enter at least 3 characters.";
      return "";
    },
    email: () => {
      const value = email.value.trim();
      if (!EMAIL_REGEX.test(value)) return "Enter a valid email address.";
      return "";
    },
    password: () => {
      const value = password.value;
      if (value.length < 8 || !PASSWORD_REGEX.test(value)) return "Use 8+ characters with letters and numbers.";
      return "";
    },
    role: () => {
      if (!role.value) return "Select a role.";
      return "";
    },
    bio: () => {
      const length = bio.value.trim().length;
      if (length < 20 || length > 120) return "Write at least 20 characters.";
      return "";
    }
  };

  function fieldWrap(input) {
    return input.closest(".field");
  }

  function setFieldError(input, message) {
    const wrap = fieldWrap(input);
    const errorEl = wrap.querySelector(".error-text");
    if (message) {
      wrap.classList.add("invalid");
      errorEl.textContent = message;
    } else {
      wrap.classList.remove("invalid");
      errorEl.textContent = "";
    }
  }

  function validateField(name, input) {
    const message = validators[name]();
    setFieldError(input, message);
    return message === "";
  }

  function getPasswordStrength(value) {
    if (!value) return { label: "none", percent: 0, color: "var(--danger)" };

    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) return { label: "weak", percent: 25, color: "var(--danger)" };
    if (score <= 3) return { label: "fair", percent: 60, color: "var(--accent)" };
    return { label: "strong", percent: 100, color: "var(--success)" };
  }

  function updateStrength() {
    const { label, percent, color } = getPasswordStrength(password.value);
    strengthBar.style.width = `${percent}%`;
    strengthBar.style.background = color;
    strengthText.textContent = `Password strength: ${label}`;
  }

  function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function updatePreview() {
    previewName.textContent = fullName.value.trim() || "Student Name";
    previewRole.textContent = role.value || "Selected role";
    previewEmail.textContent = email.value.trim() || "student@example.com";
    previewBio.textContent = bio.value.trim() || "Your biography will appear here while you type.";
    previewAvatar.textContent = getInitials(fullName.value);
  }

  function updateBioCount() {
    bioCount.textContent = bio.value.length;
  }

  function updateFormStatus() {
    const fields = [
      { name: "fullName", input: fullName },
      { name: "email", input: email },
      { name: "password", input: password },
      { name: "role", input: role },
      { name: "bio", input: bio }
    ];

    const validCount = fields.filter(f => validators[f.name]() === "").length;
    validFieldCount.textContent = `${validCount} of ${fields.length} fields valid`;
    formStatus.textContent = validCount === fields.length ? "Complete" : "Incomplete";
    return validCount === fields.length;
  }

  function handleFieldInput(name, input) {
    validateField(name, input);
    updatePreview();
    updateBioCount();
    updateFormStatus();
  }

  fullName.addEventListener("input", () => handleFieldInput("fullName", fullName));
  email.addEventListener("input", () => handleFieldInput("email", email));
  password.addEventListener("input", () => {
    handleFieldInput("password", password);
    updateStrength();
  });
  role.addEventListener("change", () => handleFieldInput("role", role));
  bio.addEventListener("input", () => handleFieldInput("bio", bio));

  togglePasswordBtn.addEventListener("click", () => {
    const isHidden = password.type === "password";
    password.type = isHidden ? "text" : "password";
    togglePasswordBtn.textContent = isHidden ? "Hide" : "Show";
  });

  function openSuccessModal() {
    successMessage.textContent = `${fullName.value.trim()}, your ${role.value} profile is ready.`;
    successModal.classList.add("show");
    overlay.classList.add("show");
  }

  function closeSuccessModal() {
    successModal.classList.remove("show");
    overlay.classList.remove("show");
  }

  closeSuccessBtn.addEventListener("click", closeSuccessModal);
  overlay.addEventListener("click", closeSuccessModal);

  form.addEventListener("submit", event => {
    event.preventDefault();

    validateField("fullName", fullName);
    validateField("email", email);
    validateField("password", password);
    validateField("role", role);
    validateField("bio", bio);

    const allFieldsValid = updateFormStatus();

    if (!allFieldsValid) {
      showToast("Please fix the highlighted fields.");
      return;
    }

    if (!terms.checked) {
      showToast("Please confirm the information checkbox.");
      return;
    }

    openSuccessModal();
  });

  submitBtn.type = "submit";

  updatePreview();
  updateBioCount();
  updateStrength();
  updateFormStatus();
}

/* =========================================================
   BOOTSTRAP
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const page = document.body.dataset.page;
  if (page === "tasks") initTaskManager();
  if (page === "products") initProductExplorer();
  if (page === "registration") initRegistrationForm();
});