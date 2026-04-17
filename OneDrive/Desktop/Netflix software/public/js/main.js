function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const value = Number(amount);
  return Number.isNaN(value) ? '-' : `$${value.toFixed(2)}`;
}

function statusClass(status) {
  return status === 'Paid' || status === 'Active' ? 'badge success' : 'badge warning';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function bindMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');

  if (!toggle || !nav) {
    return;
  }

  const closeMenu = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('nav-open')) {
      return;
    }

    const clickedInsideNav = nav.contains(event.target) || toggle.contains(event.target);
    if (!clickedInsideNav) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) {
      closeMenu();
    }
  });
}

async function showLoginSuccessAndRedirect() {
  const successLayer = document.getElementById('loginSuccess');

  if (successLayer) {
    successLayer.classList.add('is-visible');
    successLayer.setAttribute('aria-hidden', 'false');
  }

  document.body.classList.add('login-success-active');

  await new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

  await new Promise((resolve) => {
    window.setTimeout(resolve, 1200);
  });

  window.location.href = '/dashboard.html';
}

async function initLoginPage() {
  const form = document.getElementById('loginForm');

  try {
    await apiRequest('/api/auth/me');
    window.location.href = '/dashboard.html';
    return;
  } catch (error) {
    // Not logged in yet.
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage('loginMessage');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      await showLoginSuccessAndRedirect();
    } catch (error) {
      showMessage('loginMessage', error.message, 'error');
    }
  });
}

async function initDashboardPage() {
  await ensureAuth();
  bindLogout();
  bindMobileMenu();

  try {
    const stats = await apiRequest('/api/dashboard/stats');
    document.getElementById('totalAccounts').textContent = stats.total_accounts;
    document.getElementById('fullAccounts').textContent = stats.full_accounts;
    document.getElementById('totalProfiles').textContent = stats.total_profiles;
    document.getElementById('activeProfiles').textContent = stats.active_profiles;
    document.getElementById('pendingPayments').textContent = stats.pending_payments;
  } catch (error) {
    showMessage('dashboardMessage', error.message, 'error');
  }
}

async function initAccountsPage() {
  await ensureAuth();
  bindLogout();
  bindMobileMenu();

  const form = document.getElementById('accountForm');
  const tableBody = document.getElementById('accountsTableBody');
  const accountIdField = document.getElementById('accountId');

  async function loadAccounts() {
    const accounts = await apiRequest('/api/accounts');
    tableBody.innerHTML = accounts.map((account) => `
      <tr>
        <td>${account.id}</td>
        <td>${account.email}</td>
        <td><span class="badge ${account.status === 'Full' ? 'warning' : 'success'}">${account.status}</span></td>
        <td>${account.profile_count}</td>
        <td>
          <button class="small" data-action="edit" data-id="${account.id}">Edit</button>
          <button class="small danger" data-action="delete" data-id="${account.id}">Delete</button>
        </td>
      </tr>`).join('');

    tableBody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const account = accounts.find((item) => item.id === Number(button.dataset.id));
        accountIdField.value = account.id;
        document.getElementById('accountEmail').value = account.email;
        document.getElementById('accountPassword').value = '';
        document.getElementById('accountSubmit').textContent = 'Update Account';
      });
    });

    tableBody.querySelectorAll('button[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Delete this account and all linked profiles?')) {
          return;
        }

        try {
          await apiRequest(`/api/accounts/${button.dataset.id}`, { method: 'DELETE' });
          showMessage('accountsMessage', 'Account deleted successfully.');
          await loadAccounts();
        } catch (error) {
          showMessage('accountsMessage', error.message, 'error');
        }
      });
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage('accountsMessage');

    const payload = {
      email: document.getElementById('accountEmail').value.trim(),
      password: document.getElementById('accountPassword').value.trim()
    };

    const id = accountIdField.value;

    try {
      if (id) {
        await apiRequest(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMessage('accountsMessage', 'Account updated successfully.');
      } else {
        await apiRequest('/api/accounts', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('accountsMessage', 'Account created successfully.');
      }

      form.reset();
      accountIdField.value = '';
      document.getElementById('accountSubmit').textContent = 'Save Account';
      await loadAccounts();
    } catch (error) {
      showMessage('accountsMessage', error.message, 'error');
    }
  });

  await loadAccounts();
}

async function initProfilesPage() {
  await ensureAuth();
  bindLogout();
  bindMobileMenu();

  const form = document.getElementById('profileForm');
  const tableBody = document.getElementById('profilesTableBody');
  const profileIdField = document.getElementById('profileId');
  const accountSelect = document.getElementById('profileAccountId');

  async function loadAccountsOptions() {
    const accounts = await apiRequest('/api/accounts');
    const currentValue = accountSelect.value;
    accountSelect.innerHTML = '<option value="">Select account</option>' + accounts.map((account) => `<option value="${account.id}">${account.email} (${account.status}, ${account.profile_count}/4)</option>`).join('');
    if (currentValue) {
      accountSelect.value = currentValue;
    }
  }

  async function loadProfiles() {
    const profiles = await apiRequest('/api/profiles');
    tableBody.innerHTML = profiles.map((profile) => `
      <tr>
        <td>${profile.id}</td>
        <td>${profile.account_email}</td>
        <td>${profile.profile_name}</td>
        <td>${profile.username}</td>
        <td>${profile.full_name}</td>
        <td>${profile.phone_number}</td>
        <td><span class="${statusClass(profile.payment_status)}">${profile.payment_status}</span></td>
        <td><span class="${statusClass(profile.status)}">${profile.status}</span></td>
        <td>
          <button class="small" data-action="edit" data-id="${profile.id}">Edit</button>
          <button class="small danger" data-action="delete" data-id="${profile.id}">Delete</button>
        </td>
      </tr>`).join('');

    tableBody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const profile = profiles.find((item) => item.id === Number(button.dataset.id));
        profileIdField.value = profile.id;
        accountSelect.value = profile.account_id;
        document.getElementById('profileName').value = profile.profile_name;
        document.getElementById('profileUsername').value = profile.username;
        document.getElementById('profilePassword').value = '';
        document.getElementById('profileFullName').value = profile.full_name;
        document.getElementById('profilePhone').value = profile.phone_number;
        document.getElementById('profileSubmit').textContent = 'Update Profile';
      });
    });

    tableBody.querySelectorAll('button[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Delete this profile?')) {
          return;
        }

        try {
          await apiRequest(`/api/profiles/${button.dataset.id}`, { method: 'DELETE' });
          showMessage('profilesMessage', 'Profile deleted successfully.');
          await loadProfiles();
          await loadAccountsOptions();
        } catch (error) {
          showMessage('profilesMessage', error.message, 'error');
        }
      });
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage('profilesMessage');

    const payload = {
      account_id: accountSelect.value,
      profile_name: document.getElementById('profileName').value.trim(),
      username: document.getElementById('profileUsername').value.trim(),
      password: document.getElementById('profilePassword').value.trim(),
      full_name: document.getElementById('profileFullName').value.trim(),
      phone_number: document.getElementById('profilePhone').value.trim()
    };

    const id = profileIdField.value;

    try {
      if (id) {
        await apiRequest(`/api/profiles/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMessage('profilesMessage', 'Profile updated successfully.');
      } else {
        await apiRequest('/api/profiles', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('profilesMessage', 'Profile created successfully.');
      }

      form.reset();
      profileIdField.value = '';
      document.getElementById('profileSubmit').textContent = 'Save Profile';
      await loadProfiles();
      await loadAccountsOptions();
    } catch (error) {
      showMessage('profilesMessage', error.message, 'error');
    }
  });

  await loadAccountsOptions();
  await loadProfiles();
}

async function initPaymentsPage() {
  await ensureAuth();
  bindLogout();
  bindMobileMenu();

  const form = document.getElementById('paymentForm');
  const tableBody = document.getElementById('paymentsTableBody');
  const paymentIdField = document.getElementById('paymentId');
  const profileSelect = document.getElementById('paymentProfileId');

  async function loadProfileOptions() {
    const profiles = await apiRequest('/api/profiles');
    profileSelect.innerHTML = '<option value="">Select profile</option>' + profiles.map((profile) => `<option value="${profile.id}">${profile.profile_name} - ${profile.full_name}</option>`).join('');
  }

  async function loadPayments() {
    const payments = await apiRequest('/api/payments');
    tableBody.innerHTML = payments.map((payment) => `
      <tr>
        <td>${payment.id}</td>
        <td>${payment.profile_name}</td>
        <td>${formatDate(payment.payment_date)}</td>
        <td>${formatDate(payment.next_payment_date)}</td>
        <td>
          <button class="small" data-action="edit" data-id="${payment.id}">Edit</button>
          <button class="small danger" data-action="delete" data-id="${payment.id}">Delete</button>
        </td>
      </tr>`).join('');

    tableBody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const payment = payments.find((item) => item.id === Number(button.dataset.id));
        paymentIdField.value = payment.id;
        profileSelect.value = payment.profile_id;
        document.getElementById('paymentDate').value = formatDate(payment.payment_date);
        document.getElementById('paymentSubmit').textContent = 'Update Payment';
      });
    });

    tableBody.querySelectorAll('button[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Delete this payment record?')) {
          return;
        }

        try {
          await apiRequest(`/api/payments/${button.dataset.id}`, { method: 'DELETE' });
          showMessage('paymentsMessage', 'Payment deleted successfully.');
          await loadPayments();
        } catch (error) {
          showMessage('paymentsMessage', error.message, 'error');
        }
      });
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage('paymentsMessage');

    const payload = {
      profile_id: profileSelect.value,
      payment_date: document.getElementById('paymentDate').value
    };

    const id = paymentIdField.value;

    try {
      if (id) {
        await apiRequest(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMessage('paymentsMessage', 'Payment updated successfully.');
      } else {
        await apiRequest('/api/payments', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('paymentsMessage', 'Payment saved successfully.');
      }

      form.reset();
      paymentIdField.value = '';
      document.getElementById('paymentSubmit').textContent = 'Save Payment';
      await loadPayments();
    } catch (error) {
      showMessage('paymentsMessage', error.message, 'error');
    }
  });

  await loadProfileOptions();
  await loadPayments();
}

function bindLogout() {
  const button = document.getElementById('logoutButton');
  if (!button) {
    return;
  }

  button.addEventListener('click', async () => {
    try {
      await logout();
    } catch (error) {
      window.location.href = '/login.html';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;

  if (page === 'login') {
    await initLoginPage();
  } else if (page === 'dashboard') {
    await initDashboardPage();
  } else if (page === 'accounts') {
    await initAccountsPage();
  } else if (page === 'profiles') {
    await initProfilesPage();
  } else if (page === 'payments') {
    await initPaymentsPage();
  }
});
