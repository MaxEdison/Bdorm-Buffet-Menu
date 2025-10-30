document.addEventListener('DOMContentLoaded', () => {
  /* Function to convert Persian digits to English digits */
  function persianToEnglish(numStr) {
    const p = {'۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'};
    return numStr.replace(/[۰-۹]/g, d => p[d] || d);
  }

  /* Function to convert numbers to Persian digits */
  function toPersianNum(num) {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹'.split('');
    return num.toString().replace(/\d/g, d => persianDigits[d]);
  }

  /* Format money in Tooman with Persian digits, no decimals */
  const formatMoney = num => toPersianNum(Math.floor(Number(num) || 0)) + ' تومان';

  /* Fetch and Render Menu Items */
  const menuGrid = document.querySelector('.menu-grid');
  const menuFilters = document.querySelector('.menu-filters');

  fetch('menu.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load menu data');
      return response.json();
    })
    .then(data => {
      // Extract unique categories dynamically
      const categories = [...new Set(data.map(item => item.category))].sort();

      // Dynamically generate filter buttons, including "همه"
      const allButton = document.createElement('button');
      allButton.className = 'filter-btn active';
      allButton.dataset.filter = 'all';
      allButton.textContent = '🌟 همه';
      menuFilters.appendChild(allButton);

      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat;
        btn.textContent = cat; // Categories already have emojis
        menuFilters.appendChild(btn);
      });

      // Render menu items
      data.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item animate-on-scroll';
        menuItem.dataset.category = item.category;
        menuItem.style.setProperty('--animation-order', index % 4);
        menuItem.innerHTML = `
          <img src="${item.image}" alt="${item.name}" class="menu-item-img">
          <div class="menu-item-content">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="menu-item-footer">
              <span class="price">${formatMoney(item.price)}</span>
              <button class="add-to-cart-btn">+</button>
            </div>
          </div>
        `;
        menuGrid.appendChild(menuItem);
      });

      // Re-observe animations after items are added
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      }, { threshold: 0.1 });
      animatedElements.forEach(el => observer.observe(el));

      // Re-attach add-to-cart listeners
      attachAddToCartListeners();

      // Attach filter listeners dynamically
      attachFilterListeners();

      // Apply initial filter (all)
      filterItems('all');
    })
    .catch(error => {
      console.error('Error loading menu:', error);
      menuGrid.innerHTML = '<p style="text-align: center; color: red;">بارگیری منو ناموفق بود. لطفاً بعداً امتحان کنید. 😔</p>';
    });

  /* Smooth scroll for anchors */
  document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const el = document.querySelector(anchor.getAttribute('href'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Sticky Nav */
  const nav = document.querySelector('nav');
  const setNavStyle = () => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  setNavStyle();
  window.addEventListener('scroll', setNavStyle, { passive: true });

  /* Menu Filters - Function to attach listeners dynamically */
  const attachFilterListeners = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        filterItems(btn.dataset.filter);
      });
    });
  };

  const filterItems = (filter) => {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.category === filter) ? 'flex' : 'none';
    });
  };

  /* Cart State */
  const cart = [];
  const cartToggle = document.getElementById('cart-toggle');
  const cartDropdown = document.querySelector('.cart-dropdown');
  const cartList = cartDropdown.querySelector('.cart-list');
  const cartTotal = cartDropdown.querySelector('.cart-total');
  const cartEmpty = cartDropdown.querySelector('.cart-empty');
  const cartCount = document.querySelector('.cart-count');

  const recalcBadge = () => cartCount.textContent = toPersianNum(cart.reduce((s, i) => s + i.qty, 0));

  const updateCart = () => {
    cartList.innerHTML = '';
    if (!cart.length) {
      cartEmpty.style.display = 'block';
    } else {
      cartEmpty.style.display = 'none';
      cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <img src="${item.img}" alt="${item.name}" class="cart-thumb" />
          <span class="cart-item-name" title="مشاهده جزئیات">${item.name}</span>
          <div class="cart-item-controls">
            <button class="decrease" aria-label="کاهش تعداد">-</button>
            <span class="cart-item-qty">${toPersianNum(item.qty)}</span>
            <button class="increase" aria-label="افزایش تعداد">+</button>
          </div>
          <span class="cart-item-price">${formatMoney(item.price * item.qty)}</span>
        `;

        li.addEventListener('click', e => e.stopPropagation());

        li.querySelector('.cart-item-name').addEventListener('click', e => {
          e.stopPropagation();
          alert(`جزئیات سفارش:\n\n${item.name}\nواحد: ${formatMoney(item.price)}\nتعداد: ${toPersianNum(item.qty)}\nجمع: ${formatMoney(item.price * item.qty)} ✨`);
        });

        li.querySelector('.increase').addEventListener('click', e => {
          e.stopPropagation();
          item.qty++;
          updateCart();
        });

        li.querySelector('.decrease').addEventListener('click', e => {
          e.stopPropagation();
          if (item.qty > 1) item.qty--;
          else cart.splice(index, 1);
          updateCart();
        });

        cartList.appendChild(li);
      });
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    cartTotal.textContent = `جمع: ${formatMoney(total)} 💰`;
    recalcBadge();
  };

  /* Cart Toggle & Close */
  const closeCart = () => {
    cartDropdown.classList.remove('open');
    cartToggle.setAttribute('aria-expanded', 'false');
  };
  const openCart = () => {
    cartDropdown.classList.add('open');
    cartToggle.setAttribute('aria-expanded', 'true');
  };

  cartToggle.addEventListener('click', e => {
    e.stopPropagation();
    cartDropdown.classList.toggle('open');
    cartToggle.setAttribute('aria-expanded', cartDropdown.classList.contains('open'));
  });

  document.addEventListener('click', e => {
    const inside = cartDropdown.contains(e.target) || cartToggle.contains(e.target);
    if (!inside) closeCart();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });

  /* Cart Actions */
  cartDropdown.querySelector('.cart-clear').addEventListener('click', e => {
    e.stopPropagation();
    cart.length = 0;
    updateCart();
  });


  /* Toast Notifications */
  const showToast = msg => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 2000);
  };

  /* Add To Cart Buttons - Function to attach listeners dynamically */
  const attachAddToCartListeners = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const itemEl = e.target.closest('.menu-item');
        const name = itemEl.querySelector('h3').textContent.trim();
        const priceDisplay = itemEl.querySelector('.price').textContent;
        const priceText = persianToEnglish(priceDisplay).replace(/[^\d.]/g, '');
        const price = parseFloat(priceText) || 0;
        const img = itemEl.querySelector('img')?.getAttribute('src');

        const existing = cart.find(i => i.name === name);
        existing ? existing.qty++ : cart.push({ name, price, img, qty: 1 });

        updateCart();
        showToast(`${name} به سبد خرید اضافه شد ✔✨`);
        openCart();
      });
    });
  };

  recalcBadge();
});

document.addEventListener("DOMContentLoaded", ()=> {
  const lenis = new Lenis({
    lerp: 0.070,
    smoothWheel: true,
  });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
});