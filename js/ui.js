function formatWon(amount) {
  return `₩${Number(amount || 0).toLocaleString('ko-KR')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getDateLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${month}월 ${day}일`;
}

function getDueLabel(days) {
  if (days < 0) return { label: `${Math.abs(days)}일 지남`, className: 'overdue' };
  if (days === 0) return { label: '오늘 결제', className: 'due-soon' };
  if (days === 1) return { label: '내일 결제', className: 'due-soon' };
  return { label: `D-${days}`, className: days <= 7 ? 'due-soon' : '' };
}

function renderSubscriptionList(subscriptions, today) {
  const list = document.getElementById('subscription-list');
  document.getElementById('subscription-count').textContent = subscriptions.length;

  if (subscriptions.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-symbol" aria-hidden="true">＋</span><h3>아직 등록된 구독이 없어요</h3><p>오른쪽 폼에서 첫 구독을 추가해 보세요.</p></div>';
    return;
  }

  const sorted = [...subscriptions].sort((first, second) => first.nextPaymentDate.localeCompare(second.nextPaymentDate));
  list.innerHTML = sorted.map(subscription => {
    const days = getDaysUntilNextPayment(today, subscription.nextPaymentDate);
    const due = getDueLabel(days);
    const cycleLabel = subscription.cycle === 'yearly' ? '연간 결제' : '월간 결제';
    const monthlyAmount = getMonthlyAmount(subscription);
    const paymentMethod = subscription.paymentMethod ? `<span>${escapeHtml(subscription.paymentMethod)}</span>` : '';

    return `<article class="subscription-card">
      <div>
        <div class="service-heading">
          <span class="service-icon" aria-hidden="true">${escapeHtml(subscription.name.trim().charAt(0).toUpperCase() || '구')}</span>
          <div class="service-title-wrap">
            <h3 class="service-name">${escapeHtml(subscription.name)}</h3>
            <p class="service-category">${escapeHtml(subscription.category)}</p>
          </div>
        </div>
        <div class="service-details">
          <span class="${due.className}">${due.label}</span>
          <span>${getDateLabel(subscription.nextPaymentDate)}</span>
          <span>${cycleLabel}</span>
          ${paymentMethod}
        </div>
      </div>
      <div class="card-right">
        <div class="service-price">${formatWon(monthlyAmount)}<small> /월</small></div>
        <div class="card-actions">
          <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 수정">수정</button>
          <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(subscription.id)}" aria-label="${escapeHtml(subscription.name)} 삭제">삭제</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderSummary(subscriptions, today) {
  const monthlyTotal = getTotalMonthlyAmount(subscriptions);
  const yearlyTotal = getTotalYearlyAmount(subscriptions);
  const dueThisWeek = getSubscriptionsDueWithinDays(subscriptions, today, 7);
  const dueAmount = dueThisWeek.reduce((total, subscription) => total + getMonthlyAmount(subscription), 0);

  document.getElementById('monthly-total').textContent = formatWon(monthlyTotal);
  document.getElementById('yearly-total').textContent = formatWon(yearlyTotal);
  document.getElementById('due-count').textContent = `${dueThisWeek.length}건`;
  document.getElementById('due-note').textContent = dueThisWeek.length ? `월 환산 ${formatWon(dueAmount)} 예정` : '예정된 결제가 없습니다';
}

function renderCategoryBreakdown(subscriptions) {
  const container = document.getElementById('category-breakdown');
  const totals = getMonthlyAmountByCategory(subscriptions);
  const entries = Object.entries(totals).sort((first, second) => second[1] - first[1]);
  const overall = entries.reduce((sum, [, amount]) => sum + amount, 0);

  if (!entries.length || overall === 0) {
    container.innerHTML = '<p class="category-empty">구독을 추가하면 카테고리별 비중이 표시됩니다.</p>';
    return;
  }

  container.innerHTML = entries.map(([category, amount]) => {
    const percentage = Math.round((amount / overall) * 100);
    return `<div class="category-row">
      <div class="category-label-line"><span class="category-label">${escapeHtml(category)}</span><span class="category-value">${percentage}% · ${formatWon(amount)}</span></div>
      <div class="bar-track" role="img" aria-label="${escapeHtml(category)} ${percentage}%"><div class="bar-fill" style="width:${percentage}%"></div></div>
    </div>`;
  }).join('');
}

function renderApp(subscriptions, today) {
  renderSummary(subscriptions, today);
  renderSubscriptionList(subscriptions, today);
  renderCategoryBreakdown(subscriptions);
}