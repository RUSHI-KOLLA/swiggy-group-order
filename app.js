const state = {
  splitType: 'exact',
  birthdayMode: false,
  birthdayApplied: false,
  hostDob: '1999-06-15',
  people: [
    { id: 'rushi', name: 'Rushi', initials: 'R', host: true, upi: 'rushi@okaxis', settlementStatus: 'pending' },
    { id: 'arjun', name: 'Arjun', initials: 'A', upi: 'arjun@upi', settlementStatus: 'pending' },
    { id: 'riya', name: 'Riya', initials: 'R', upi: 'riya@icici', settlementStatus: 'pending' },
    { id: 'kabir', name: 'Kabir', initials: 'K', upi: 'kabir@ybl', settlementStatus: 'pending' },
  ],
  menu: [
    { id: 'wrap', name: 'Paneer Tikka Wrap', description: 'Smoky paneer · mint chutney', price: 229, emoji: '🌯' },
    { id: 'biryani', name: 'Chicken Biryani', description: 'Hyderabadi style · raita included', price: 319, emoji: '🍛' },
    { id: 'pizza', name: 'Margherita Pizza', description: 'Classic cheese · basil', price: 299, emoji: '🍕' },
    { id: 'fries', name: 'Loaded Cheesy Fries', description: 'Cheese sauce · jalapeños', price: 149, emoji: '🍟' },
  ],
  cart: [
    { id: 1, menuId: 'wrap', owner: 'rushi', qty: 1 },
    { id: 2, menuId: 'biryani', owner: 'arjun', qty: 1 },
    { id: 3, menuId: 'pizza', owner: 'riya', qty: 1 },
    { id: 4, menuId: 'fries', owner: 'shared', qty: 1 },
  ],
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
  document.querySelector('#peopleGrid').innerHTML = state.people.map((person) => `
    <div class="person-card ${person.host ? 'host' : ''}">
      <span class="person-avatar">${escapeHtml(person.initials)}</span>
      <div>
        <div class="person-name">${escapeHtml(person.name)}</div>
        ${person.host ? '<span class="host-tag">HOST · ' + escapeHtml(person.upi || 'UPI') + '</span>' : ''}
      </div>
    </div>`).join('');
  document.querySelector('#peopleCount').textContent = `${state.people.length} ${state.people.length === 1 ? 'person' : 'people'}`;
}

function renderMenu() {
  document.querySelector('#menuGrid').innerHTML = state.menu.map((item) => `
    <article class="menu-item" data-emoji="${escapeHtml(item.emoji)}">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <div class="menu-footer">
        <strong>${money(item.price)}</strong>
        <button class="add-item" data-menu-id="${escapeHtml(item.id)}" type="button" aria-label="Add ${escapeHtml(item.name)}">+</button>
      </div>
    </article>`).join('');
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

  renderPeople(); renderMenu(); renderCart(); renderSummary();
}

function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('show'), 2800);
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-menu-id]');
  if (addButton) {
    const menuId = addButton.dataset.menuId;
    const uid = currentUserId();
    const existing = state.cart.find((cartItem) => cartItem.menuId === menuId && cartItem.owner === uid);
    if (existing) existing.qty += 1;
    else state.cart.push({ id: Date.now(), menuId, owner: uid, qty: 1 });
    const hostName = state.people.find((p) => p.host)?.name || 'Host';
    render(); toast(`Added to ${hostName}'s order`); return;
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

// Keyboard handler for role="button" elements (Copy UPI)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const btn = e.target.closest('[data-copy-share]');
  if (!btn) return;
  e.preventDefault();
  btn.click();
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-owner-id]')) {
    const cartItem = state.cart.find((item) => String(item.id) === event.target.dataset.ownerId);
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
  const shortName = cleanName.slice(0, 18);
  state.people.push({ id: `${shortName.toLowerCase()}-${Date.now()}`, name: shortName, initials: shortName.slice(0, 1).toUpperCase(), host: false, upi: '', settlementStatus: 'pending' });
  render(); toast(`${shortName} joined Friday Feast`);
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

const overlay  = document.querySelector('#checkoutOverlay');
const step1    = document.querySelector('#checkoutStep1');
const step2    = document.querySelector('#checkoutStep2');
const step3    = document.querySelector('#checkoutStep3');

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

/* ═══════════════════════════════════════════════════════════
   Party Planner — Multi-service orchestration
   Food + Instamart + Dineout with budget cap, confirmation,
   fallback, and transparent bill.
   ═══════════════════════════════════════════════════════════ */

const plannerOverlay = document.querySelector('#plannerOverlay');
const plannerStep1    = document.querySelector('#plannerStep1');
const plannerStep2    = document.querySelector('#plannerStep2');
const plannerStep3    = document.querySelector('#plannerStep3');
const plannerStep4    = document.querySelector('#plannerStep4');

let plannerState = {
  budget: 1500,
  results: {},
};

function showPlannerStep(el) {
  [plannerStep1, plannerStep2, plannerStep3, plannerStep4].forEach((s) => s.classList.remove('active'));
  el.classList.add('active');
  plannerOverlay.querySelector('.checkout-modal').scrollTop = 0;
}

function openPlanner() {
  plannerState = { budget: 1500, results: {} };
  showPlannerStep(plannerStep1);
  document.querySelector('#plannerGroupInfo').innerHTML = `<strong>${state.people.length} people</strong> · Hosted by ${state.people.find((p) => p.host)?.name || 'Host'}`;
  plannerOverlay.classList.add('open');
  plannerOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  trapFocus(plannerOverlay);
}

function closePlanner() {
  plannerOverlay.classList.remove('open');
  plannerOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  releaseTrap(plannerOverlay);
}

document.querySelector('#plannerButton').addEventListener('click', openPlanner);
document.querySelector('#closePlanner').addEventListener('click', closePlanner);
document.querySelector('#cancelPlanner').addEventListener('click', closePlanner);
plannerOverlay.addEventListener('click', (e) => { if (e.target === plannerOverlay) closePlanner(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && plannerOverlay.classList.contains('open')) closePlanner(); });

document.querySelector('#plannerBudget').addEventListener('input', (e) => {
  plannerState.budget = Math.min(1000, Math.max(500, parseInt(e.target.value) || 500));
});

/* ── Start planning ── */
document.querySelector('#startPlanner').addEventListener('click', async () => {
  plannerState.budget = parseInt(document.querySelector('#plannerBudget').value) || 1000;
  if (plannerState.budget < 500) { toast('Minimum budget is ₹500'); return; }
  showPlannerStep(plannerStep2);
  await runPlannerSimulation();
});

/**
 * Multi-service orchestration:
 *   1. Dineout → search_restaurants_dineout → get_available_slots → book_table
 *   2. Food  → search_restaurants → get_restaurant_menu → place_food_order
 *   3. Instamart → search_products → checkout
 *
 * Each step pauses for user confirmation.
 */
async function runPlannerSimulation() {
  const log = document.querySelector('#plannerLog');
  log.innerHTML = '';
  plannerState.results = { dineout: null, food: null, instamart: null };
  let totalSpent = 0;
  let remaining = plannerState.budget;

  const addLog = (tool, status, cls) => {
    const entry = document.createElement('div');
    entry.className = `mcp-log-entry ${cls || ''}`;
    entry.innerHTML = `<span class="log-tool">${tool}</span><span class="log-status ${status}">${status}</span>`;
    log.appendChild(entry);
  };

  const runStep = (tool, ms) => new Promise((resolve) => {
    addLog(tool, 'running', '');
    setTimeout(() => {
      const done = log.lastElementChild;
      done.classList.add('done');
      done.querySelector('.log-status').className = 'log-status done';
      done.querySelector('.log-status').textContent = '✓ done';
      setTimeout(resolve, 200);
    }, ms);
  });

  // ── Phase 1: Dineout ──
  addLog('🔍 search_restaurants_dineout', 'running');
  await sleep(700 + Math.random() * 400);
  log.lastElementChild.querySelector('.log-status').textContent = '✓ found 3 options';
  log.lastElementChild.classList.add('done');

  const dineoutOptions = [
    { name: 'The Grand Pavilion', cuisine: 'North Indian', rating: 4.3, costForTwo: 800, slots: ['7:00 PM', '7:30 PM'], free: true },
    { name: 'Spice Garden', cuisine: 'Mughlai', rating: 4.1, costForTwo: 600, slots: ['7:30 PM', '8:00 PM'], free: true },
    { name: 'Rooftop Bites', cuisine: 'Fusion', rating: 4.5, costForTwo: 1200, slots: [], free: false },
  ];

  const dineoutResult = await showPlannerConfirm(
    'dineout',
    '🍽️ Dineout',
    dineoutOptions,
    (opt) => `${opt.name} · ${opt.cuisine} ★${opt.rating} · ₹${opt.costForTwo}/2 · Slots: ${opt.slots.length ? opt.slots.join(', ') : 'none'}`,
    (opt) => {
      if (!opt.slots.length) return { ok: false, reason: 'No available slots' };
      if (!opt.free) return { ok: false, reason: 'Paid deals not supported' };
      return { ok: true, cost: Math.round(opt.costForTwo * state.people.length / 2) };
    },
    'Dineout'
  );

  if (dineoutResult.confirmed && dineoutResult.selected) {
    const cost = Math.round(dineoutResult.selected.costForTwo * state.people.length / 2);
    addLog('🔍 get_available_slots', 'running');
    await sleep(400 + Math.random() * 300);
    log.lastElementChild.querySelector('.log-status').textContent = '✓ slots available';
    log.lastElementChild.classList.add('done');

    addLog('📅 book_table', 'running');
    await sleep(500 + Math.random() * 300);
    log.lastElementChild.querySelector('.log-status').textContent = `✓ Booked at ${dineoutResult.selected.name}`;
    log.lastElementChild.classList.add('done');

    plannerState.results.dineout = { name: dineoutResult.selected.name, cost, status: 'confirmed' };
    totalSpent += cost;
    remaining = plannerState.budget - totalSpent;
    toast(`Table booked at ${dineoutResult.selected.name}`);
  } else {
    addLog('📅 book_table', 'skipped', '');
    log.lastElementChild.querySelector('.log-status').textContent = dineoutResult.reason || 'Skipped';
    log.lastElementChild.classList.add('done');
    plannerState.results.dineout = { name: '—', cost: 0, status: dineoutResult.reason || 'skipped' };
  }

  // ── Phase 2: Food ──
  addLog('🔍 search_restaurants', 'running');
  await sleep(600 + Math.random() * 400);
  log.lastElementChild.querySelector('.log-status').textContent = '✓ found options';
  log.lastElementChild.classList.add('done');

  const foodOptions = [
    { name: 'Spice & Slice', cuisine: 'North Indian · Pizza', deliveryFee: 57, items: ['Paneer Tikka Wrap ₹229', 'Chicken Biryani ₹319', 'Margherita Pizza ₹299'], estimated: 800 },
    { name: 'Dragon Bowl', cuisine: 'Asian · Noodles', deliveryFee: 47, items: ['Veg Manchurian ₹199', 'Fried Rice ₹249', 'Noodles ₹179'], estimated: 700 },
    { name: 'Burger Barn', cuisine: 'American · Fast Food', deliveryFee: 67, items: ['Aloo Tikki Burger ₹99', 'Chicken Burger ₹179', 'Fries ₹129'], estimated: 500 },
  ];

  const remainingBudget = plannerState.budget - totalSpent;
  const affordableFood = foodOptions.filter((o) => o.estimated <= remainingBudget);

  if (affordableFood.length) {
    const foodResult = await showPlannerConfirm(
      'food',
      '🍛 Swiggy Food',
      affordableFood,
      (opt) => `${opt.name} · ${opt.cuisine} · Est. ₹${opt.estimated} · Delivery ₹${opt.deliveryFee}`,
      (opt) => ({ ok: true, cost: opt.estimated + opt.deliveryFee }),
      'Food Delivery'
    );

    if (foodResult.confirmed && foodResult.selected) {
      const cost = foodResult.selected.estimated + foodResult.selected.deliveryFee;
      addLog('🍛 get_restaurant_menu', 'running');
      await sleep(400 + Math.random() * 300);
      log.lastElementChild.querySelector('.log-status').textContent = '✓ menu loaded';
      log.lastElementChild.classList.add('done');

      addLog('🍛 place_food_order', 'running');
      await sleep(500 + Math.random() * 300);
      log.lastElementChild.querySelector('.log-status').textContent = `✓ Order placed at ${foodResult.selected.name}`;
      log.lastElementChild.classList.add('done');

      plannerState.results.food = { name: foodResult.selected.name, cost, status: 'confirmed' };
      totalSpent += cost;
      remaining = plannerState.budget - totalSpent;
    } else {
      addLog('🍛 place_food_order', 'skipped', '');
      log.lastElementChild.querySelector('.log-status').textContent = foodResult.reason || 'Declined';
      log.lastElementChild.classList.add('done');
      plannerState.results.food = { name: '—', cost: 0, status: 'skipped' };
    }
  } else {
    addLog('🍛 search_restaurants', 'fallback', '');
    log.lastElementChild.querySelector('.log-status').textContent = 'No affordable options — skipped';
    log.lastElementChild.classList.add('done');
    plannerState.results.food = { name: '—', cost: 0, status: 'over budget' };
  }

  // ── Phase 3: Instamart ──
  remaining = plannerState.budget - totalSpent;

  if (remaining >= 100) {
    addLog('🛒 search_products', 'running');
    await sleep(500 + Math.random() * 400);
    log.lastElementChild.querySelector('.log-status').textContent = '✓ products found';
    log.lastElementChild.classList.add('done');

    const instamartBundle = [
      { name: 'Coke (1L x 4)', price: 160 },
      { name: 'Chilli Potato Chips (Pack x 2)', price: 80 },
      { name: 'Mineral Water (1L x 6)', price: 120 },
      { name: 'Ice Cream Tub (500ml)', price: 150 },
    ];
    const bundleCost = instamartBundle.reduce((s, i) => s + i.price, 0);

    const instamartResult = await showPlannerConfirm(
      'instamart',
      '🛒 Swiggy Instamart',
      [{ name: 'Party Drinks & Snacks Bundle', items: instamartBundle.map((i) => `${i.name} — ₹${i.price}`), total: bundleCost }],
      (opt) => `${opt.name}: ${opt.items.join(', ')}`,
      (opt) => {
        if (opt.total > remaining) return { ok: false, reason: `₹${opt.total} exceeds remaining ₹${remaining}` };
        return { ok: true, cost: opt.total };
      },
      'Instamart'
    );

    if (instamartResult.confirmed && instamartResult.selected) {
      const cost = instamartResult.selected.total;
      addLog('🛒 checkout', 'running');
      await sleep(500 + Math.random() * 300);
      log.lastElementChild.querySelector('.log-status').textContent = `✓ Order placed (₹${cost})`;
      log.lastElementChild.classList.add('done');

      plannerState.results.instamart = { name: 'Drinks & Snacks', cost, status: 'confirmed' };
      totalSpent += cost;
    } else {
      addLog('🛒 checkout', 'skipped', '');
      log.lastElementChild.querySelector('.log-status').textContent = instamartResult.reason || 'Declined';
      log.lastElementChild.classList.add('done');
      plannerState.results.instamart = { name: '—', cost: 0, status: 'skipped' };
    }
  } else {
    addLog('🛒 search_products', 'fallback', '');
    log.lastElementChild.querySelector('.log-status').textContent = 'Budget exhausted — skipped';
    log.lastElementChild.classList.add('done');
    plannerState.results.instamart = { name: '—', cost: 0, status: 'over budget' };
  }

  // ── Show final bill ──
  await sleep(500);
  showPlannerBill(totalSpent);
}

/* ── Confirmation dialog (reused for each service) ── */
function showPlannerConfirm(serviceKey, badgeLabel, options, formatFn, validateFn, stepName) {
  return new Promise((resolve) => {
    const badgeEl = document.querySelector('#plannerConfirmBadge');
    const titleEl = document.querySelector('#plannerConfirmTitle');
    const subEl = document.querySelector('#plannerConfirmSub');
    const detailsEl = document.querySelector('#plannerConfirmDetails');
    const costEl = document.querySelector('#plannerConfirmCost');

    let selectedIndex = 0;
    const remaining = plannerState.budget - Object.values(plannerState.results).reduce((s, r) => s + (r ? r.cost : 0), 0);

    const renderConfirm = () => {
      badgeEl.innerHTML = `<span class="mcp-dot"></span>${badgeLabel}`;
      titleEl.textContent = `Confirm ${stepName}`;
      subEl.textContent = `Remaining budget: ₹${remaining}. Choose or skip.`;

      detailsEl.innerHTML = options.map((opt, i) => {
        const details = formatFn(opt);
        const validation = validateFn(opt);
        const disabled = !validation.ok;
        return `<div class="payment-option ${i === selectedIndex && !disabled ? 'active' : ''}" style="${disabled ? 'opacity:0.5;' : ''}" data-planner-opt="${i}">
          <div style="flex:1">
            <strong>${disabled ? '✗ ' : ''}${escapeHtml(String(details).split(' · ')[0])}</strong>
            <small>${escapeHtml(String(details))}</small>
          </div>
          <div style="text-align:right">
            ${validation.ok ? `<strong style="color:var(--green)">₹${validation.cost}</strong>` : `<small style="color:var(--red)">${validation.reason}</small>`}
          </div>
        </div>`;
      }).join('');

      const sel = options[selectedIndex];
      const val = validateFn(sel);
      if (val.ok) {
        costEl.innerHTML = `<span class="cost-label">${stepName} cost</span><span class="cost-value" style="color:var(--green)">₹${val.cost}</span>`;
      } else {
        costEl.innerHTML = `<span class="cost-label">${stepName}</span><span class="cost-value" style="color:var(--red)">${val.reason}</span>`;
      }
    };

    renderConfirm();
    showPlannerStep(plannerStep3);

    // Selection click
    const handler = (e) => {
      const optEl = e.target.closest('[data-planner-opt]');
      if (!optEl) return;
      const idx = parseInt(optEl.dataset.plannerOpt);
      const validation = validateFn(options[idx]);
      if (!validation.ok) return;
      selectedIndex = idx;
      document.querySelectorAll('[data-planner-opt]').forEach((el, i) => el.classList.toggle('active', i === idx));
      const sel = options[selectedIndex];
      const val = validateFn(sel);
      costEl.innerHTML = `<span class="cost-label">${stepName} cost</span><span class="cost-value" style="color:var(--green)">₹${val.cost}</span>`;
    };
    plannerStep3.addEventListener('click', handler);

    // Confirm button
    const confirmBtn = document.querySelector('#plannerConfirm');
    const skipBtn = document.querySelector('#plannerSkip');

    const cleanup = () => {
      plannerStep3.removeEventListener('click', handler);
      confirmBtn.removeEventListener('click', onConfirm);
      skipBtn.removeEventListener('click', onSkip);
    };

    const onConfirm = () => {
      cleanup();
      const sel = options[selectedIndex];
      const val = validateFn(sel);
      if (!val.ok) { resolve({ confirmed: false, reason: val.reason }); return; }
      resolve({ confirmed: true, selected: sel, cost: val.cost });
    };

    const onSkip = () => {
      cleanup();
      const sel = options[0];
      const val = validateFn(sel);
      resolve({ confirmed: false, selected: null, reason: val.ok ? 'Skipped by user' : val.reason || 'Unavailable' });
    };

    confirmBtn.addEventListener('click', onConfirm);
    skipBtn.addEventListener('click', onSkip);
  });
}

/* ── Display final combined bill ── */
function showPlannerBill(totalSpent) {
  showPlannerStep(plannerStep4);
  const { dineout, food, instamart } = plannerState.results;

  const statusLabel = (r) => {
    if (r.status === 'confirmed') return `<span class="bill-status confirmed">✓ Confirmed</span>`;
    return `<span class="bill-status ${r.status === 'skipped' || r.status === 'over budget' ? 'skipped' : 'failed'}">${r.status === 'skipped' || r.status === 'over budget' ? '— Skipped' : '✗ Failed'}</span>`;
  };

  const rows = [
    { icon: '🍽️', name: 'Dineout — ' + dineout.name, cost: dineout.cost, status: statusLabel(dineout) },
    { icon: '🍛', name: 'Food — ' + food.name, cost: food.cost, status: statusLabel(food) },
    { icon: '🛒', name: 'Instamart — ' + instamart.name, cost: instamart.cost, status: statusLabel(instamart) },
  ];

  document.querySelector('#plannerBill').innerHTML = rows.map((r) => `
    <div class="planner-bill-row">
      <div class="bill-service"><span>${r.icon}</span><span>${escapeHtml(r.name)}</span></div>
      ${r.status}
      <strong>${r.cost ? '₹' + r.cost : '₹0'}</strong>
    </div>
  `).join('') + `
    <div class="planner-bill-total">
      <span>Total spent</span>
      <strong class="${totalSpent <= plannerState.budget ? 'under' : 'over'}">₹${totalSpent} / ₹${plannerState.budget}</strong>
    </div>`;

  const budgetEl = document.querySelector('#plannerBudgetStatus');
  if (totalSpent <= plannerState.budget) {
    budgetEl.className = 'planner-budget-status within';
    budgetEl.textContent = `✓ Budget respected — ₹${plannerState.budget - totalSpent} remaining`;
  } else {
    budgetEl.className = 'planner-budget-status exceeded';
    budgetEl.textContent = `⚠ Budget exceeded by ₹${totalSpent - plannerState.budget} — adjust or skip items`;
  }

  document.querySelector('#plannerFinalSub').textContent = `${state.people.length} people · ₹${totalSpent} total · ₹${Math.round(totalSpent / state.people.length)} per person`;
}

/* ── Apply planned items to the existing order ── */
document.querySelector('#plannerDone').addEventListener('click', () => {
  const { food, instamart } = plannerState.results;
  if (food && food.status === 'confirmed') {
    state.cart = [
      ...state.cart,
      { id: Date.now() + 1, menuId: 'biryani', owner: currentUserId(), qty: Math.ceil(state.people.length / 2) },
    ];
  }
  if (instamart && instamart.status === 'confirmed') {
    state.cart.push({ id: Date.now() + 2, menuId: 'fries', owner: 'shared', qty: state.people.length });
  }
  closePlanner();
  render();
  toast('Party planner items added to your order!');
});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
