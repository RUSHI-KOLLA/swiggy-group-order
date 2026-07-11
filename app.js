const state = {
  splitType: 'exact',
  birthdayMode: true,
  people: [
    { id: 'rushi', name: 'Rushi', initials: 'R', host: true, upi: 'rushi@okaxis' },
    { id: 'arjun', name: 'Arjun', initials: 'A', upi: 'arjun@upi' },
    { id: 'riya', name: 'Riya', initials: 'R', upi: 'riya@icici' },
    { id: 'kabir', name: 'Kabir', initials: 'K', upi: 'kabir@ybl' },
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
  paymentRequested: false,
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
      const shareRatio = itemValueFor(person.id) / sub;
      return itemValueFor(person.id) + fees() * shareRatio - discount() * shareRatio;
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
  cartList.innerHTML = state.cart.map((cartItem) => {
    const item = itemFor(cartItem);
    if (!item) return '';
    return `<div class="cart-item">
      <div><strong>${escapeHtml(item.name)}</strong><small>${money(item.price)} each</small></div>
      <select data-owner-id="${cartItem.id}" aria-label="Who is paying for ${escapeHtml(item.name)}">${ownerOptions(cartItem.owner)}</select>
      <div class="quantity-control">
        <button data-change-qty="${cartItem.id}" data-change="-1" type="button" aria-label="Decrease quantity">−</button>
        <span>${cartItem.qty}</span>
        <button data-change-qty="${cartItem.id}" data-change="1" type="button" aria-label="Increase quantity">+</button>
      </div>
      <button class="remove-item" data-remove-id="${cartItem.id}" type="button" aria-label="Remove ${escapeHtml(item.name)}">×</button>
    </div>`;
  }).join('');
}

function renderSummary() {
  document.querySelector('#subtotal').textContent = money(cartSubtotal());
  document.querySelector('#fees').textContent = money(fees());
  document.querySelector('#discount').textContent = `−${money(discount())}`;
  document.querySelector('#total').textContent = money(total());
  document.querySelector('#discountRow').style.display = discount() ? 'flex' : 'none';
  document.querySelector('#birthdaySaving').textContent = state.birthdayMode ? `${money(discount())} reward` : 'Party mode off';
  document.querySelector('#birthdayCard').classList.toggle('off', !state.birthdayMode);
  document.querySelector('#birthdayToggle').checked = state.birthdayMode;
  document.querySelector('#splitNote').textContent = state.splitType === 'exact'
    ? 'Items, fees and savings are shared fairly by what each person added.'
    : 'The final order amount is divided evenly between everyone in the group.';
  document.querySelectorAll('.split-option').forEach((button) => {
    const active = button.dataset.split === state.splitType;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', active);
  });
  const amounts = splitAmounts();
  document.querySelector('#shareList').innerHTML = state.people.map((person, index) => `
    <div class="share-row" data-person-share="${escapeHtml(person.id)}" title="Click to copy settlement summary for ${escapeHtml(person.name)}">
      <span class="share-avatar">${escapeHtml(person.initials)}</span>
      <div class="share-person">
        <strong>${escapeHtml(person.name)}${person.host ? ' · host' : ''}</strong>
        <small>${state.splitType === 'equal' ? 'Equal share' : itemValueFor(person.id) ? 'Items + shared costs' : 'Shared costs only'}</small>
      </div>
      <strong>${money(amounts[index])}</strong>
      ${person.host ? '' : `<button type="button" class="pay-status ${state.paymentRequested ? 'requested' : ''}" data-copy-share="${escapeHtml(person.id)}">${state.paymentRequested ? 'Copy UPI' : 'Request'}</button>`}
    </div>`).join('');
}

function render() { renderPeople(); renderMenu(); renderCart(); renderSummary(); }

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
    const existing = state.cart.find((cartItem) => cartItem.menuId === menuId && cartItem.owner === 'rushi');
    if (existing) existing.qty += 1;
    else state.cart.push({ id: Date.now(), menuId, owner: 'rushi', qty: 1 });
    render(); toast('Added to Rushi’s order'); return;
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
    const idx = state.people.findIndex((p) => p.id === personId);
    const amount = splitAmounts()[idx];
    const host = state.people.find((p) => p.host) || state.people[0];
    const text = `Hey ${person.name}! Your share for Friday Feast on Splitly is ${money(amount)}. Pay ${host.name} via UPI (${host.upi || 'rushi@okaxis'}).`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    state.paymentRequested = true;
    render();
    toast(`Copied UPI summary for ${person.name}`);
    return;
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-owner-id]')) {
    const cartItem = state.cart.find((item) => String(item.id) === event.target.dataset.ownerId);
    cartItem.owner = event.target.value; render();
  }
});

document.querySelector('#birthdayToggle').addEventListener('change', (event) => { state.birthdayMode = event.target.checked; render(); toast(state.birthdayMode ? 'Birthday reward added to the order' : 'Birthday reward removed'); });
document.querySelector('#requestButton').addEventListener('click', () => {
  if (!state.cart.length) { toast('Add food before sending payment requests'); return; }
  state.paymentRequested = true; render(); toast('UPI payment requests sent to your crew (demo)');
});
document.querySelector('#inviteButton').addEventListener('click', () => toast('Invite link copied: splitly.app/join/friday-feast (demo)'));
document.querySelector('#addFriendButton').addEventListener('click', () => {
  const name = window.prompt('Friend’s name');
  if (!name || !name.trim()) return;
  const cleanName = name.trim().slice(0, 18);
  state.people.push({ id: `${cleanName.toLowerCase()}-${Date.now()}`, name: cleanName, initials: cleanName.slice(0, 1).toUpperCase() });
  render(); toast(`${cleanName} joined Friday Feast`);
});
document.querySelector('#checkoutButton').addEventListener('click', () => {
  if (!state.cart.length) { toast('Your cart is empty — add items first'); return; }
  if (total() > 1000) { toast('This demo stays within the ₹1,000 Builder order limit'); return; }
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

/* ── Open / close ── */
function openCheckout() {
  selectedPayment = 'ONLINE';
  populateModal();
  showStep(step1);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
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
  const placeResponse = mcpSteps[1].response;
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

  // If UPI was selected, also update payment status
  if (selectedPayment === 'ONLINE') {
    state.paymentRequested = true;
    renderSummary();
  }

  showStep(step3);
}

/* Track order button — simulates opening Swiggy tracking */
document.querySelector('#trackOrder').addEventListener('click', () => {
  closeCheckout();
  toast('Order is being tracked — Swiggy delivery partner assigned (demo)');
});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
