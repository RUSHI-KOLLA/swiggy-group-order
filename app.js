const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const generateId = (prefix = 'id') => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
};

const state = {
  splitType: 'exact',
  activePerson: 'rushi',
  budgetCap: 1000,
  birthdayMode: false,
  birthdayApplied: false,
  hostDob: getTodayString(),
  people: [
    { id: 'rushi', name: 'Rushi', initials: 'R', host: true, upi: 'rushi@okaxis', settlementStatus: 'pending' },
    { id: 'arjun', name: 'Arjun', initials: 'A', upi: 'arjun@upi', settlementStatus: 'pending' },
    { id: 'riya', name: 'Riya', initials: 'R', upi: 'riya@icici', settlementStatus: 'pending' },
    { id: 'kabir', name: 'Kabir', initials: 'K', upi: 'kabir@ybl', settlementStatus: 'pending' },
  ],
  activeCuisine: 'all',
  menu: [
    // North Indian
    { id: 'wrap', name: 'Paneer Tikka Wrap', description: 'Smoky paneer · mint chutney', price: 229, emoji: '🌯', cuisine: 'north-indian', veg: true, restaurant: 'Spice & Slice' },
    { id: 'biryani', name: 'Chicken Biryani', description: 'Hyderabadi style · raita included', price: 319, emoji: '🍛', cuisine: 'north-indian', veg: false, restaurant: 'Spice & Slice' },
    { id: 'dal-makhani', name: 'Dal Makhani + Naan', description: 'Creamy black lentils · butter naan', price: 199, emoji: '🫓', cuisine: 'north-indian', veg: true, restaurant: 'Spice & Slice' },
    { id: 'butter-chicken', name: 'Butter Chicken', description: 'Rich tomato gravy · tender chicken', price: 289, emoji: '🍗', cuisine: 'north-indian', veg: false, restaurant: 'Spice & Slice', aiPick: true },
    { id: 'veg-thali', name: 'Veg Thali', description: 'Dal · sabzi · roti · rice · papad', price: 179, emoji: '🥘', cuisine: 'north-indian', veg: true, restaurant: 'Spice & Slice', aiPick: true },
    // Chinese
    { id: 'manchurian', name: 'Veg Manchurian', description: 'Crispy veg balls · spicy sauce', price: 189, emoji: '🥡', cuisine: 'chinese', veg: true, restaurant: 'Dragon Bowl' },
    { id: 'fried-rice', name: 'Chicken Fried Rice', description: 'Wok-tossed · egg · veggies', price: 219, emoji: '🍚', cuisine: 'chinese', veg: false, restaurant: 'Dragon Bowl' },
    { id: 'noodles', name: 'Hakka Noodles', description: 'Stir-fried · vegetables · soy', price: 169, emoji: '🍜', cuisine: 'chinese', veg: true, restaurant: 'Dragon Bowl' },
    { id: 'chilli-paneer', name: 'Chilli Paneer', description: 'Indo-Chinese · bell peppers', price: 199, emoji: '🌶️', cuisine: 'chinese', veg: true, restaurant: 'Dragon Bowl' },
    { id: 'spring-rolls', name: 'Spring Rolls (6pc)', description: 'Crispy · mixed veg filling', price: 129, emoji: '🥟', cuisine: 'chinese', veg: true, restaurant: 'Dragon Bowl' },
    // Pizza & Snacks
    { id: 'pizza', name: 'Margherita Pizza', description: 'Classic cheese · fresh basil', price: 299, emoji: '🍕', cuisine: 'fast-food', veg: true, restaurant: 'Quick Bites' },
    { id: 'fries', name: 'Loaded Cheesy Fries', description: 'Cheese sauce · jalapeños', price: 149, emoji: '🍟', cuisine: 'fast-food', veg: true, restaurant: 'Quick Bites', aiPick: true },
    { id: 'burger', name: 'Chicken Burger', description: 'Grilled patty · lettuce · mayo', price: 179, emoji: '🍔', cuisine: 'fast-food', veg: false, restaurant: 'Quick Bites' },
    { id: 'garlic-bread', name: 'Garlic Bread', description: 'Cheesy · herb butter · 4 slices', price: 119, emoji: '🥖', cuisine: 'fast-food', veg: true, restaurant: 'Quick Bites' },
    { id: 'pasta', name: 'Pasta Alfredo', description: 'Creamy white sauce · mushrooms', price: 249, emoji: '🍝', cuisine: 'fast-food', veg: true, restaurant: 'Quick Bites' },
    // Drinks & Desserts
    { id: 'coke', name: 'Coke (750ml)', description: 'Chilled classic cola', price: 40, emoji: '🥤', cuisine: 'drinks', veg: true, restaurant: 'Quick Bites' },
    { id: 'lassi', name: 'Mango Lassi', description: 'Thick · sweet · alphonso mango', price: 79, emoji: '🥛', cuisine: 'drinks', veg: true, restaurant: 'Spice & Slice' },
    { id: 'gulab-jamun', name: 'Gulab Jamun (2pc)', description: 'Warm · sugar syrup · cardamom', price: 69, emoji: '🍯', cuisine: 'drinks', veg: true, restaurant: 'Spice & Slice' },
    { id: 'brownie', name: 'Brownie Sundae', description: 'Warm brownie · vanilla ice cream', price: 129, emoji: '🍫', cuisine: 'drinks', veg: true, restaurant: 'Quick Bites' },
  ],
  cart: [],
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const money = (value) => `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`;
const itemFor = (cartItem) => state.menu.find((item) => item.id === cartItem.menuId);
const cartSubtotal = () => state.cart.reduce((sum, cartItem) => sum + (itemFor(cartItem)?.price || 0) * cartItem.qty, 0);
const fees = () => state.cart.length ? 57 : 0;
const discount = () => state.birthdayMode && cartSubtotal() ? Math.min(150, Math.round(cartSubtotal() * 0.2)) : 0;
const total = () => Math.max(0, cartSubtotal() + fees() - discount());
const perPersonCap = () => state.people.length ? Math.floor(state.budgetCap / state.people.length) : state.budgetCap;

function spentByPerson(personId) {
  return state.cart.reduce((sum, ci) => {
    const item = itemFor(ci);
    if (!item) return sum;
    const value = item.price * ci.qty;
    if (ci.owner === personId) return sum + value;
    if (ci.owner === 'shared') return sum + value / state.people.length;
    return sum;
  }, 0);
}

const remainingForPerson = (personId) => Math.max(0, perPersonCap() - Math.round(spentByPerson(personId)));

function ensureHost() {
  if (!state.people.length) return false;
  if (!state.people.some((p) => p.host)) {
    state.people[0].host = true;
  }
  return true;
}

const currentUserId = () => {
  const host = state.people.find((p) => p.host);
  return host ? host.id : (state.people[0]?.id || 'host');
};

function birthdayEligible() {
  if (!state.hostDob) return false;
  const today = new Date();
  const parts = state.hostDob.split('-');
  if (parts.length !== 3) return false;
  const dobMonth = parseInt(parts[1], 10) - 1;
  const dobDay = parseInt(parts[2], 10);
  return today.getMonth() === dobMonth && today.getDate() === dobDay;
}

function itemValueFor(personId) {
  if (!state.people.length) return 0;
  return state.cart.reduce((sum, cartItem) => {
    const item = itemFor(cartItem);
    if (!item) return sum;
    const value = item.price * cartItem.qty;
    return sum + (cartItem.owner === personId ? value : cartItem.owner === 'shared' ? value / state.people.length : 0);
  }, 0);
}

function splitAmounts() {
  const n = state.people.length;
  if (!n) return [];
  const targetTotal = Math.round(total());
  if (targetTotal === 0) return state.people.map(() => 0);

  let rawShares;
  if (state.splitType === 'equal') {
    rawShares = state.people.map(() => targetTotal / n);
  } else {
    const sub = cartSubtotal();
    if (!sub) return state.people.map(() => Math.round(targetTotal / n));
    rawShares = state.people.map((person) => {
      const val = itemValueFor(person.id);
      const shareRatio = val / sub;
      return val + fees() * shareRatio - discount() * shareRatio;
    });
  }

  const floored = rawShares.map((val) => Math.floor(val));
  const remainders = rawShares.map((val, idx) => ({ idx, rem: val - floored[idx] }));
  const currentSum = floored.reduce((a, b) => a + b, 0);
  const deficit = targetTotal - currentSum;

  remainders.sort((a, b) => b.rem - a.rem);
  const reconciled = [...floored];
  for (let i = 0; i < deficit && i < n; i++) {
    reconciled[remainders[i].idx] += 1;
  }
  return reconciled;
}

function renderPeople() {
  const cap = perPersonCap();
  document.querySelector('#peopleGrid').innerHTML = state.people.map((person) => {
    const spent = Math.round(spentByPerson(person.id));
    const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
    const isActive = person.id === state.activePerson;
    const overBudget = spent > cap;
    return `
    <div class="person-card ${person.host ? 'host' : ''} ${isActive ? 'active-orderer' : ''}" data-switch-person="${escapeHtml(person.id)}" role="button" tabindex="0" aria-label="Order as ${escapeHtml(person.name)}">
      <span class="person-avatar">${escapeHtml(person.initials)}</span>
      <div>
        <div class="person-name">${escapeHtml(person.name)}${isActive ? ' <span class="ordering-tag">ORDERING</span>' : ''}</div>
        ${person.host ? '<span class="host-tag">HOST · ' + escapeHtml(person.upi || 'UPI') + '</span>' : ''}
      </div>
      <div class="person-budget">
        <div class="budget-bar"><div class="budget-fill ${overBudget ? 'over' : ''}" style="width:${pct}%"></div></div>
        <span class="budget-text ${overBudget ? 'over' : ''}">₹${spent} / ₹${cap}</span>
      </div>
    </div>`;
  }).join('');
  document.querySelector('#peopleCount').textContent = `${state.people.length} ${state.people.length === 1 ? 'person' : 'people'}`;
  const capEl = document.querySelector('#capPerPerson');
  if (capEl) capEl.textContent = `₹${cap} / person`;
}

function renderMenu() {
  const cuisines = [
    { id: 'all', label: 'All', emoji: '🍽️' },
    { id: 'north-indian', label: 'North Indian', emoji: '🍛' },
    { id: 'chinese', label: 'Chinese', emoji: '🍜' },
    { id: 'fast-food', label: 'Pizza & Snacks', emoji: '🍕' },
    { id: 'drinks', label: 'Drinks & Desserts', emoji: '🥤' },
  ];
  const active = state.activeCuisine || 'all';
  const filtered = active === 'all' ? state.menu : state.menu.filter((item) => item.cuisine === active || !item.cuisine);

  const tabsEl = document.querySelector('#cuisineTabs');
  if (tabsEl) {
    tabsEl.innerHTML = cuisines.map((c) =>
      `<button class="cuisine-tab ${c.id === active ? 'active' : ''}" data-cuisine="${c.id}" type="button">${c.emoji} ${c.label}</button>`
    ).join('');
  }

  document.querySelector('#menuGrid').innerHTML = filtered.map((item) => `
    <article class="menu-item" data-emoji="${escapeHtml(item.emoji)}">
      ${item.aiPick ? '<span class="ai-badge">✨ AI Pick</span>' : ''}
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <div class="menu-meta">
        <span class="restaurant-src">${escapeHtml(item.restaurant || '')}</span>
        ${item.veg ? '<span class="veg-dot">🟢</span>' : '<span class="nonveg-dot">🔴</span>'}
      </div>
      <div class="menu-footer">
        <strong>${money(item.price)}</strong>
        <button class="add-item" data-menu-id="${escapeHtml(item.id)}" type="button" aria-label="Add ${escapeHtml(item.name)}">+</button>
      </div>
    </article>`).join('');
}

/* ── AI Suggestion Engine (rule-based) ── */
function getAISuggestions() {
  const suggestions = [];
  const person = state.people.find((p) => p.id === state.activePerson);
  if (!person) return suggestions;
  const myItems = state.cart.filter((ci) => ci.owner === state.activePerson);
  const allItems = state.cart;
  const remaining = remainingForPerson(state.activePerson);

  if (myItems.length === 0) {
    suggestions.push({ icon: '👋', text: `${person.name}, start by picking your favorites! Try the Butter Chicken or Veg Thali.` });
  }
  const unordered = state.people.filter((p) => !state.cart.some((ci) => ci.owner === p.id));
  if (unordered.length > 0 && unordered.length < state.people.length) {
    suggestions.push({ icon: '📢', text: `${unordered.map((p) => p.name).join(', ')} hasn’t picked anything yet — nudge them!` });
  }
  if (allItems.some((ci) => ci.menuId === 'biryani') && !allItems.some((ci) => ci.menuId === 'lassi')) {
    suggestions.push({ icon: '🥛', text: 'Pair your Biryani with a Mango Lassi (₹79)?' });
  }
  if (allItems.some((ci) => ['pizza', 'burger', 'fries'].includes(ci.menuId)) && !allItems.some((ci) => ['coke', 'lassi'].includes(ci.menuId))) {
    suggestions.push({ icon: '🥤', text: 'Add a Coke (₹40) to go with your meal?' });
  }
  if (remaining > 0 && remaining < 200 && myItems.length > 0) {
    const affordable = state.menu.filter((m) => m.price <= remaining).sort((a, b) => b.price - a.price);
    if (affordable.length) suggestions.push({ icon: '💡', text: `₹${remaining} left — try ${affordable[0].name} (₹${affordable[0].price})?` });
  }
  if (allItems.length >= 2 && !allItems.some((ci) => ci.owner === 'shared')) {
    suggestions.push({ icon: '🤝', text: 'Share some Loaded Fries (₹149)? Split ' + state.people.length + ' ways = ₹' + Math.round(149 / state.people.length) + ' each!' });
  }
  if (myItems.length >= 2 && !allItems.some((ci) => ['gulab-jamun', 'brownie'].includes(ci.menuId))) {
    suggestions.push({ icon: '🍰', text: 'Finish with something sweet — Gulab Jamun (₹69) or Brownie Sundae (₹129)!' });
  }
  return suggestions.slice(0, 2);
}

function renderAISuggestions() {
  const container = document.querySelector('#aiSuggestions');
  if (!container) return;
  const suggestions = getAISuggestions();
  if (!suggestions.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="ai-card">
      <div class="ai-card-header"><span class="ai-sparkle">✨</span> AI Suggestions</div>
      ${suggestions.map((s) => `<div class="ai-suggestion"><span>${s.icon}</span><span>${s.text}</span></div>`).join('')}
    </div>`;
}

function ownerOptions(selected) {
  const people = state.people.map((person) => `<option value="${escapeHtml(person.id)}" ${selected === person.id ? 'selected' : ''}>${escapeHtml(person.name)}</option>`).join('');
  return `${people}<option value="shared" ${selected === 'shared' ? 'selected' : ''}>Shared equally</option>`;
}

function renderCart() {
  const cartList = document.querySelector('#cartList');
  const units = state.cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelector('#cartCount').textContent = `${units} ${units === 1 ? 'item' : 'items'}`;
  if (!state.cart.length) {
    cartList.innerHTML = '<p class="empty-cart">Your crew is hungry. Add something delicious above.</p>';
    return;
  }
  const validItems = state.cart.filter((ci) => itemFor(ci));
  cartList.innerHTML = validItems.map((cartItem) => {
    const item = itemFor(cartItem);
    return `<div class="cart-item">
      <div><strong>${escapeHtml(item.name)}</strong><small>${money(item.price)} each</small></div>
      <select data-owner-id="${escapeHtml(String(cartItem.id))}" aria-label="Who is paying for ${escapeHtml(item.name)}">${ownerOptions(cartItem.owner)}</select>
      <div class="quantity-control">
        <button data-change-qty="${escapeHtml(String(cartItem.id))}" data-change="-1" type="button" aria-label="Decrease quantity">−</button>
        <span>${cartItem.qty}</span>
        <button data-change-qty="${escapeHtml(String(cartItem.id))}" data-change="1" type="button" aria-label="Increase quantity">+</button>
      </div>
      <button class="remove-item" data-remove-id="${escapeHtml(String(cartItem.id))}" type="button" aria-label="Remove ${escapeHtml(item.name)}">×</button>
    </div>`;
  }).join('');
}

function renderSummary() {
  document.querySelector('#subtotal').textContent = money(cartSubtotal());
  document.querySelector('#fees').textContent = money(fees());
  document.querySelector('#discount').textContent = `−${money(discount())}`;
  document.querySelector('#total').textContent = money(total());
  document.querySelector('#discountRow').style.display = discount() ? 'flex' : 'none';
  const discAmount = discount();
  document.querySelector('#birthdaySaving').textContent = state.birthdayMode ? `${money(discAmount)} reward${discAmount >= 150 ? ' (max)' : ' (20% off)'}` : 'Party mode off';
  document.querySelector('#birthdayCard').classList.toggle('off', !state.birthdayMode);
  document.querySelector('#birthdayToggle').checked = state.birthdayMode;
  const birthdayHost = state.people.find((p) => p.host);
  document.querySelector('#birthdayTitle').textContent = birthdayHost ? `It\u2019s ${birthdayHost.name}\u2019s birthday!` : 'Birthday Party Mode';
  const eligEl = document.querySelector('#birthdayEligibility');
  if (birthdayEligible()) {
    eligEl.textContent = state.birthdayApplied ? '✓ Applied' : '✓ Eligible today';
    eligEl.className = 'birthday-eligibility eligible';
  } else {
    eligEl.textContent = state.hostDob ? 'Not eligible today' : 'No DOB set';
    eligEl.className = 'birthday-eligibility not-eligible';
  }
  document.querySelector('#splitNote').textContent = state.splitType === 'exact'
    ? 'Items, fees and savings are shared fairly by what each person added.'
    : 'The final order amount is divided evenly between everyone in the group.';
  document.querySelectorAll('.split-option').forEach((button) => {
    const active = button.dataset.split === state.splitType;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', active);
  });
  const amounts = splitAmounts();
  document.querySelector('#shareList').innerHTML = state.people.map((person, index) => {
    const isHost = person.host;
    let actionBtn = '';
    if (isHost) {
      actionBtn = `<span class="pay-status host-badge">HOST</span>`;
    } else {
      const status = person.settlementStatus || 'pending';
      if (status === 'paid') {
        actionBtn = `<span class="pay-status paid">✓ Paid</span>`;
      } else if (status === 'requested') {
        actionBtn = `<span class="pay-status requested" data-copy-share="${escapeHtml(person.id)}" role="button" tabindex="0">Copy UPI</span><button class="mark-paid" data-mark-paid="${escapeHtml(person.id)}" type="button" aria-label="Mark ${escapeHtml(person.name)} as paid">✓</button>`;
      } else {
        actionBtn = `<button type="button" class="pay-status" data-copy-share="${escapeHtml(person.id)}">Request</button>`;
      }
    }
    return `<div class="share-row" data-person-share="${escapeHtml(person.id)}">
      <span class="share-avatar">${escapeHtml(person.initials)}</span>
      <div class="share-person">
        <strong>${escapeHtml(person.name)}${isHost ? ' · host' : ''}</strong>
        <small>${state.splitType === 'equal' ? 'Equal share' : itemValueFor(person.id) ? 'Items + shared costs' : 'Shared costs only'}</small>
      </div>
      <strong>${money(amounts[index])}</strong>
      ${actionBtn}
    </div>`;
  }).join('');
}

function renderOrderingBanner() {
  const banner = document.querySelector('#orderingBanner');
  if (!banner) return;
  const person = state.people.find((p) => p.id === state.activePerson);
  if (!person) { banner.innerHTML = ''; return; }
  const spent = Math.round(spentByPerson(person.id));
  const cap = perPersonCap();
  const remaining = Math.max(0, cap - spent);
  banner.innerHTML = `
    <span class="banner-avatar">${escapeHtml(person.initials)}</span>
    <span>Ordering as <strong>${escapeHtml(person.name)}</strong></span>
    <span class="banner-budget ${remaining <= 0 ? 'over' : ''}">₹${remaining} left of ₹${cap}</span>`;
}

function render() {
  if (!state.people.length) {
    document.querySelector('#peopleGrid').innerHTML = '<p class="empty-cart">No one is in the group yet. Add a friend above.</p>';
    document.querySelector('#peopleCount').textContent = '0 people';
    document.querySelector('#checkoutButton').disabled = true;
    document.querySelector('#checkoutButton').style.opacity = '0.4';
    return;
  }
  document.querySelector('#checkoutButton').disabled = false;
  document.querySelector('#checkoutButton').style.opacity = '1';
  ensureHost();
  if (!state.people.some((p) => p.id === state.activePerson)) {
    state.activePerson = state.people[0]?.id || 'rushi';
  }

  // Dynamic host info in hero
  const host = state.people.find((p) => p.host) || state.people[0];
  if (host) {
    document.querySelector('#hostName').textContent = host.name;
    document.querySelector('#hostAvatar').textContent = host.initials;
  }

  // Clean up cart items whose owner no longer exists
  const validIds = new Set(state.people.map((p) => p.id));
  validIds.add('shared');
  let reassigned = 0;
  state.cart.forEach((ci) => {
    if (!validIds.has(ci.owner)) {
      ci.owner = currentUserId();
      reassigned++;
    }
  });
  if (reassigned) toast(`Some items reassigned — owner is no longer in the group`);

  // Warn if group is very large
  if (state.people.length > 12) {
    const existing = document.querySelector('#groupWarning');
    if (!existing) {
      const warn = document.createElement('p');
      warn.id = 'groupWarning';
      warn.className = 'limit-note';
      warn.textContent = 'Large group — ensure everyone has contributed before checking out.';
      document.querySelector('#peopleGrid').after(warn);
    }
  } else {
    document.querySelector('#groupWarning')?.remove();
  }

  renderPeople(); renderMenu(); renderCart(); renderSummary(); renderOrderingBanner(); renderAISuggestions();
}

function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('show'), 2800);
}

document.addEventListener('click', (event) => {
  const cuisineTab = event.target.closest('[data-cuisine]');
  if (cuisineTab) {
    state.activeCuisine = cuisineTab.dataset.cuisine;
    renderMenu();
    return;
  }
  const switchPerson = event.target.closest('[data-switch-person]');
  if (switchPerson) {
    const personId = switchPerson.dataset.switchPerson;
    if (state.people.some((p) => p.id === personId)) {
      state.activePerson = personId;
      render();
      toast(`Now ordering as ${state.people.find((p) => p.id === personId)?.name}`);
    }
    return;
  }
  const addButton = event.target.closest('[data-menu-id]');
  if (addButton) {
    const menuId = addButton.dataset.menuId;
    const uid = state.activePerson;
    const menuItem = state.menu.find((m) => m.id === menuId);
    if (menuItem) {
      const spent = Math.round(spentByPerson(uid));
      const cap = perPersonCap();
      if (spent + menuItem.price > cap) {
        const pName = state.people.find((p) => p.id === uid)?.name || 'You';
        toast(`${pName} would exceed ₹${cap} cap — can't add this`);
        return;
      }
    }
    const existing = state.cart.find((cartItem) => cartItem.menuId === menuId && cartItem.owner === uid);
    if (existing) existing.qty += 1;
    else state.cart.push({ id: generateId('cart'), menuId, owner: uid, qty: 1 });
    const personName = state.people.find((p) => p.id === uid)?.name || 'You';
    render(); toast(`Added to ${personName}'s order`); return;
  }
  const quantityButton = event.target.closest('[data-change-qty]');
  if (quantityButton) {
    const cartItem = state.cart.find((item) => String(item.id) === quantityButton.dataset.changeQty);
    if (!cartItem) return;
    cartItem.qty += Number(quantityButton.dataset.change);
    if (cartItem.qty < 1) state.cart = state.cart.filter((item) => item !== cartItem);
    render(); return;
  }
  const removeButton = event.target.closest('[data-remove-id]');
  if (removeButton) { state.cart = state.cart.filter((item) => String(item.id) !== removeButton.dataset.removeId); render(); return; }
  const splitButton = event.target.closest('[data-split]');
  if (splitButton) { state.splitType = splitButton.dataset.split; render(); return; }

  // Copy individual settlement breakdown (student group ordering use case)
  const copyShareButton = event.target.closest('[data-copy-share]');
  if (copyShareButton) {
    event.stopPropagation();
    const personId = copyShareButton.dataset.copyShare;
    const person = state.people.find((p) => p.id === personId);
    if (!person) return;
    const idx = state.people.findIndex((p) => p.id === personId);
    const amount = splitAmounts()[idx];
    const host = state.people.find((p) => p.host) || state.people[0];
    const fallbackUpi = state.people.find((p) => p.host)?.upi || 'host@upi';
    const text = `Hey ${person.name}! Your share for Friday Feast on Splitly is ${money(amount)}. Pay ${host.name} via UPI (${host.upi || fallbackUpi}).`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => toast('Could not copy to clipboard — try again'));
    } else {
      toast('Clipboard not available in this browser');
    }
    person.settlementStatus = 'requested';
    render();
    toast(`UPI request sent to ${person.name}`);
    return;
  }

  // Mark as paid
  const markPaidButton = event.target.closest('[data-mark-paid]');
  if (markPaidButton) {
    const personId = markPaidButton.dataset.markPaid;
    const person = state.people.find((p) => p.id === personId);
    if (!person) return;
    person.settlementStatus = 'paid';
    render();
    toast(`${person.name} marked as paid`);
    return;
  }
});

// Keyboard handler for role="button" elements (Copy UPI + Person switching)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const switchBtn = e.target.closest('[data-switch-person]');
  if (switchBtn) { e.preventDefault(); switchBtn.click(); return; }
  const btn = e.target.closest('[data-copy-share]');
  if (!btn) return;
  e.preventDefault();
  btn.click();
});

// Budget cap input
document.querySelector('#budgetCapInput')?.addEventListener('input', (e) => {
  state.budgetCap = Math.min(1000, Math.max(100, parseInt(e.target.value) || 1000));
  render();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-owner-id]')) {
    const cartItem = state.cart.find((item) => String(item.id) === event.target.dataset.ownerId);
    if (!cartItem) return;
    cartItem.owner = event.target.value; render();
  }
});

document.querySelector('#birthdayToggle').addEventListener('change', (event) => {
  state.birthdayMode = event.target.checked;
  if (state.birthdayMode) {
    if (!birthdayEligible()) {
      toast('Birthday not eligible — host\'s birthday is not today');
      state.birthdayMode = false;
      render();
      return;
    }
    if (state.birthdayApplied) {
      toast('Birthday reward already applied this order');
      state.birthdayMode = false;
      render();
      return;
    }
    state.birthdayApplied = true;
    toast('🎂 Birthday reward applied!');
  } else {
    state.birthdayApplied = false;
    toast('Birthday reward removed');
  }
  render();
});
document.querySelector('#requestButton').addEventListener('click', () => {
  if (!state.cart.length) { toast('Add food before sending payment requests'); return; }
  if (!state.people.length) { toast('No one is in the group yet'); return; }
  ensureHost();
  const host = state.people.find((p) => p.host);
  if (!host) { toast('No host assigned to receive payments'); return; }
  state.people.forEach((p) => { if (!p.host && p.settlementStatus === 'pending') p.settlementStatus = 'requested'; });
  render(); toast('UPI payment requests sent to your crew (demo)');
});
document.querySelector('#inviteButton').addEventListener('click', () => toast('Invite link copied: splitly.app/join/friday-feast (demo)'));
document.querySelector('#addFriendButton').addEventListener('click', () => {
  const name = window.prompt('Friend’s name (max 18 characters)');
  if (!name || !name.trim()) return;
  const cleanName = name.trim();
  if (cleanName.length > 18) {
    toast('Name too long — using first 18 characters');
  }
  let shortName = cleanName.slice(0, 18);
  const existingCount = state.people.filter((p) => p.name.toLowerCase().startsWith(shortName.toLowerCase())).length;
  if (existingCount > 0) {
    shortName = `${shortName} ${existingCount + 1}`;
  }
  state.people.push({ id: generateId('person'), name: shortName, initials: shortName.slice(0, 1).toUpperCase(), host: false, upi: '', settlementStatus: 'pending' });
  render(); toast(`${shortName} joined Friday Feast`);
});
document.querySelector('#addCustomDishButton').addEventListener('click', () => {
  const rawName = window.prompt('Dish name (max 24 characters)', 'Special Thali');
  if (!rawName || !rawName.trim()) return;
  const name = rawName.trim().slice(0, 24);
  const rawPrice = window.prompt(`Enter price for "${name}" in ₹`, '180');
  if (rawPrice === null) return;
  const price = Math.max(1, Math.min(1000, parseInt(rawPrice, 10) || 100));
  const emojis = ['🥗', '🍝', '🍲', '🌮', '🍱', '🥟', '🥪', '🥘'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const newId = generateId('dish');
  state.menu.push({
    id: newId,
    name,
    description: 'Custom added dish',
    price,
    emoji,
  });
  render();
  toast(`Added "${name}" (₹${price}) to menu`);
});
document.querySelector('#checkoutButton').addEventListener('click', () => {
  if (!state.cart.length) { toast('Your cart is empty — add items first'); return; }
  if (!cartSubtotal()) { toast('Your cart subtotal is zero — add items before checkout'); return; }
  const preDiscountTotal = cartSubtotal() + fees();
  if (preDiscountTotal > 1000) { toast('This demo stays within the ₹1,000 Builder order limit'); return; }
  openCheckout();
});

render();

/* ═══════════════════════════════════════════════════════════
   Checkout Modal — COD/UPI choice + Swiggy MCP simulation
   ═══════════════════════════════════════════════════════════ */

const overlay = document.querySelector('#checkoutOverlay');
const step1 = document.querySelector('#checkoutStep1');
const step2 = document.querySelector('#checkoutStep2');
const step3 = document.querySelector('#checkoutStep3');

let selectedPayment = 'ONLINE';

/* ── Focus trap helper ── */
function trapFocus(element) {
  releaseTrap(element);
  const prev = document.activeElement;
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function handler(e) {
    if (e.key !== 'Tab' || !element.classList.contains('open')) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', handler);
  element._focusTrap = handler;
  element._prevFocus = prev;
  if (first) first.focus();
}

function releaseTrap(element) {
  const el = element || overlay;
  if (el._focusTrap) {
    document.removeEventListener('keydown', el._focusTrap);
    delete el._focusTrap;
  }
  if (el._prevFocus) {
    el._prevFocus.focus();
    delete el._prevFocus;
  }
}

const announceEl = document.querySelector('#checkoutAnnounce');
function announceCheckout(message) {
  if (announceEl) announceEl.textContent = message;
}

/* ── Open / close ── */
function openCheckout() {
  selectedPayment = 'ONLINE';
  populateModal();
  showStep(step1);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  trapFocus(overlay);
  announceCheckout('Checkout opened — review your order');
}

function closeCheckout() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  releaseTrap(overlay);
}

document.querySelector('#closeModal').addEventListener('click', closeCheckout);
document.querySelector('#cancelCheckout').addEventListener('click', closeCheckout);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCheckout(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeCheckout(); });

/* ── Step switching ── */
function showStep(stepEl) {
  [step1, step2, step3].forEach((s) => s.classList.remove('active'));
  stepEl.classList.add('active');
  overlay.querySelector('.checkout-modal').scrollTop = 0;
}

/* ── Payment method selection ── */
overlay.addEventListener('click', (e) => {
  const payBtn = e.target.closest('[data-payment]');
  if (!payBtn) return;
  selectedPayment = payBtn.dataset.payment;
  overlay.querySelectorAll('.payment-option').forEach((btn) => {
    const active = btn.dataset.payment === selectedPayment;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', active);
  });
});

/* ── Populate modal from state ── */
function populateModal() {
  // Cart items
  document.querySelector('#modalCartSummary').innerHTML = state.cart.map((cartItem) => {
    const item = itemFor(cartItem);
    if (!item) return '';
    const ownerLabel = cartItem.owner === 'shared' ? 'Shared' :
      state.people.find((p) => p.id === cartItem.owner)?.name || cartItem.owner;
    return `<div class="modal-cart-row">
      <div class="item-info">
        <span class="item-qty">${cartItem.qty}×</span>
        <span>${escapeHtml(item.name)}<span class="item-owner"> · ${escapeHtml(ownerLabel)}</span></span>
      </div>
      <strong>${money(item.price * cartItem.qty)}</strong>
    </div>`;
  }).join('');

  // Split breakdown
  const amounts = splitAmounts();
  document.querySelector('#modalSplitBreakdown').innerHTML = state.people.map((person, i) => `
    <div class="modal-split-row">
      <span class="split-avatar">${escapeHtml(person.initials)}</span>
      <span class="split-name">${escapeHtml(person.name)}</span>
      ${person.host ? '<span class="split-tag">HOST</span>' : ''}
      <span class="split-amount">${money(amounts[i])}</span>
    </div>`).join('');

  // Totals
  document.querySelector('#modalSubtotal').textContent = money(cartSubtotal());
  document.querySelector('#modalFees').textContent = money(fees());
  document.querySelector('#modalDiscount').textContent = `−${money(discount())}`;
  document.querySelector('#modalTotal').textContent = money(total());
  document.querySelector('#modalDiscountRow').style.display = discount() ? 'flex' : 'none';

  // Reset payment selection UI
  overlay.querySelectorAll('.payment-option').forEach((btn) => {
    const active = btn.dataset.payment === selectedPayment;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', active);
  });
}

/* ── Confirm & place: MCP simulation ── */
document.querySelector('#confirmOrder').addEventListener('click', () => {
  showStep(step2);
  runMcpSimulation();
});

/**
 * Simulates the Swiggy MCP tool-call sequence:
 *   1. get_food_cart   → validate cart, get availablePaymentMethods
 *   2. place_food_order → place with addressId + paymentMethod
 *   3. track_food_order → get initial order status
 *
 * Each step animates in the MCP log. Timings are cosmetic.
 * Docs:  /docs/reference/food/get_food_cart.md
 *        /docs/reference/food/place_food_order.md
 *        /docs/reference/food/track_food_order.md
 */
async function runMcpSimulation() {
  const mcpLog = document.querySelector('#mcpLog');
  const paymentLabel = selectedPayment === 'COD' ? 'Cash on Delivery' : 'Online / UPI';
  announceCheckout('Processing your Swiggy order');

  // Build the mock MCP responses aligned with the real Swiggy MCP response shape
  const mcpSteps = [
    {
      tool: 'get_food_cart',
      description: 'Validating cart & payment methods',
      response: {
        success: true,
        data: {
          items: state.cart.map((ci) => ({ name: itemFor(ci).name, qty: ci.qty, price: itemFor(ci).price })),
          totalAmount: total(),
          availablePaymentMethods: ['ONLINE', 'COD'],
        },
        message: `Cart validated · ${state.cart.length} items · ${money(total())}`,
      },
    },
    {
      tool: 'place_food_order',
      description: `Placing order via ${paymentLabel}`,
      args: { addressId: 'addr_campus_block_c', paymentMethod: selectedPayment },
      response: {
        success: true,
        data: {
          orderId: `SW-${100000 + Math.floor(Math.random() * 900000)}`,
          status: 'CONFIRMED',
          estimatedDelivery: '28-32 min',
        },
        // Per Swiggy MCP docs: use the message from the tool response as-is, including Swiggy branding.
        message: selectedPayment === 'COD'
          ? 'Swiggy order placed successfully! Payment: Cash on Delivery.'
          : 'Swiggy order placed successfully! Payment completed via UPI.',
      },
    },
    {
      tool: 'track_food_order',
      description: 'Getting initial tracking status',
      response: {
        success: true,
        data: { status: 'Confirmed', eta: '28-32 min', restaurant: 'Spice & Slice' },
        message: 'Restaurant has confirmed your order. Preparing now.',
      },
    },
  ];

  // Reset log
  mcpLog.innerHTML = '';

  for (let i = 0; i < mcpSteps.length; i++) {
    const step = mcpSteps[i];

    // Add entry as "running"
    const entry = document.createElement('div');
    entry.className = 'mcp-log-entry';
    entry.innerHTML = `
      <span class="log-tool">${step.tool}</span>
      <span class="log-status running">running</span>`;
    mcpLog.appendChild(entry);

    // Simulate network latency
    await sleep(800 + Math.random() * 600);

    // Complete the step
    if (step.response.success) {
      entry.classList.add('done');
      entry.querySelector('.log-status').className = 'log-status done';
      entry.querySelector('.log-status').textContent = '✓ done';
    } else {
      entry.classList.add('error');
      entry.querySelector('.log-status').className = 'log-status error';
      entry.querySelector('.log-status').textContent = 'error';
    }

    // Short pause before next step
    await sleep(300);
  }

  // All steps done — build the success view
  const placeStep = mcpSteps.find((s) => s.tool === 'place_food_order');
  const placeResponse = placeStep ? placeStep.response : { data: { orderId: 'SW-000000', estimatedDelivery: '30 min' }, message: '' };
  await sleep(500);

  // Populate success state
  document.querySelector('#successOrderId').textContent = `#${placeResponse.data.orderId}`;
  document.querySelector('#successEta').textContent = placeResponse.data.estimatedDelivery;
  document.querySelector('#successStatus').textContent = placeResponse.data.status === 'CONFIRMED' ? 'Confirmed' : placeResponse.data.status;

  // Per Swiggy MCP docs: always use the message from the tool response as-is. It includes Swiggy branding.
  document.querySelector('#successMessage').textContent = 'Swiggy order placed successfully!';
  document.querySelector('#successPayment').textContent = selectedPayment === 'COD'
    ? 'Payment: Cash on Delivery'
    : 'Payment completed via UPI';

  // Split summary in success view
  const amounts = splitAmounts();
  document.querySelector('#successSplitSummary').innerHTML = state.people.map((person, i) => {
    const methodLabel = person.host
      ? (selectedPayment === 'COD' ? 'Pays cash to delivery' : 'Paid via Swiggy')
      : (selectedPayment === 'COD' ? 'Owes host cash' : 'UPI request sent');
    return `<div class="success-split-row">
      <span class="ss-avatar">${escapeHtml(person.initials)}</span>
      <span class="ss-name">${escapeHtml(person.name)}${person.host ? ' · host' : ''}</span>
      <span class="ss-method">${methodLabel}</span>
      <span class="ss-amount">${money(amounts[i])}</span>
    </div>`;
  }).join('');

  // Update progress bar to step 3
  const progressSteps = document.querySelectorAll('.progress-step');
  progressSteps[0].classList.add('done');
  progressSteps[1].classList.add('done');
  progressSteps[1].classList.remove('current');
  progressSteps[2].classList.add('current');

  // If UPI was selected, mark non-host members as requested
  if (selectedPayment === 'ONLINE') {
    state.people.forEach((p) => { if (!p.host && p.settlementStatus === 'pending') p.settlementStatus = 'requested'; });
    renderSummary();
  }

  showStep(step3);
  announceCheckout('Order placed successfully. Check your order details.');
}

/* Track order button — simulates opening Swiggy tracking */
document.querySelector('#trackOrder').addEventListener('click', () => {
  closeCheckout();
  toast('Order is being tracked — Swiggy delivery partner assigned (demo)');
});


function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

