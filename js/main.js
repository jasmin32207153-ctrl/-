const STORAGE_KEY = 'subtrack-subscriptions-v1';
let subscriptions = loadSubscriptions();

const form = document.getElementById('subscription-form');
const idInput = document.getElementById('subscription-id');
const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const cycleInput = document.getElementById('cycle');
const dateInput = document.getElementById('next-payment-date');
const categoryInput = document.getElementById('category');
const paymentMethodInput = document.getElementById('payment-method');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit');

function loadSubscriptions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(subscription => subscription
      && typeof subscription.id === 'string'
      && typeof subscription.name === 'string'
      && Number.isFinite(Number(subscription.amount))
      && (subscription.cycle === 'monthly' || subscription.cycle === 'yearly')
      && /^\d{4}-\d{2}-\d{2}$/.test(subscription.nextPaymentDate)
      && typeof subscription.category === 'string');
  } catch (error) {
    console.warn('저장된 구독 데이터를 읽지 못했습니다.', error);
    return [];
  }
}

function saveSubscriptions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    return true;
  } catch (error) {
    alert('브라우저 저장 공간에 데이터를 저장하지 못했습니다.');
    console.error('구독 데이터를 저장하지 못했습니다.', error);
    return false;
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function refreshView() {
  renderApp(subscriptions, getTodayString());
}

function resetForm() {
  form.reset();
  idInput.value = '';
  formTitle.textContent = '새 구독 추가';
  submitButton.innerHTML = '<span aria-hidden="true">＋</span> 구독 추가';
  cancelEditButton.hidden = true;
}

function startEditing(subscription) {
  idInput.value = subscription.id;
  nameInput.value = subscription.name;
  amountInput.value = subscription.amount;
  cycleInput.value = subscription.cycle;
  dateInput.value = subscription.nextPaymentDate;
  categoryInput.value = subscription.category;
  paymentMethodInput.value = subscription.paymentMethod || '';
  formTitle.textContent = '구독 수정';
  submitButton.textContent = '변경 저장';
  cancelEditButton.hidden = false;
  document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  nameInput.focus({ preventScroll: true });
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const existingId = idInput.value;
  const subscription = {
    id: existingId || createId(),
    name: nameInput.value.trim(),
    amount: Number(amountInput.value),
    cycle: cycleInput.value,
    nextPaymentDate: dateInput.value,
    category: categoryInput.value.trim(),
    paymentMethod: paymentMethodInput.value.trim()
  };

  if (!subscription.name || !subscription.category || subscription.amount <= 0) return;

  if (existingId) {
    subscriptions = subscriptions.map(item => item.id === existingId ? subscription : item);
  } else {
    subscriptions.push(subscription);
  }

  if (!saveSubscriptions()) return;
  resetForm();
  refreshView();
});

document.getElementById('subscription-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const subscription = subscriptions.find(item => item.id === button.dataset.id);
  if (!subscription) return;

  if (button.dataset.action === 'edit') {
    startEditing(subscription);
    return;
  }

  if (button.dataset.action === 'delete' && confirm(`“${subscription.name}” 구독을 삭제할까요?`)) {
    const previous = subscriptions;
    subscriptions = subscriptions.filter(item => item.id !== subscription.id);
    if (!saveSubscriptions()) {
      subscriptions = previous;
      return;
    }
    if (idInput.value === subscription.id) resetForm();
    refreshView();
  }
});

cancelEditButton.addEventListener('click', resetForm);

const today = getTodayString();
const [year, month, day] = today.split('-').map(Number);
document.getElementById('today-label').textContent = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC'
}).format(new Date(Date.UTC(year, month - 1, day)));
refreshView();