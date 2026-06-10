// ===== OHM — Main JavaScript =====

// Dark/Light Mode Toggle (initial theme is applied by the inline head snippet
// before first paint; this module keeps the icon in sync and persists changes)
(function(){
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateToggle();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('ohm-theme', theme); } catch (e) {}
      updateToggle();
    });
  }

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// Mobile Menu Toggle
(function(){
  const toggle = document.querySelector('.mobile-toggle');
  const navList = document.querySelector('.header__nav-list');
  const header = document.querySelector('.header');

  if (toggle && navList && header) {
    function setOpen(open) {
      toggle.classList.toggle('active', open);
      navList.classList.toggle('active', open);
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => {
      setOpen(!navList.classList.contains('active'));
    });

    // Close on Escape and return focus to the toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('active')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close mobile menu on nav link or mobile CTA click
    navList.querySelectorAll('.header__nav-link, .header__nav-mobile-ctas .btn').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });
  }
})();

// FAQ Accordion
(function(){
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-item__question');
    const answer = item.querySelector('.faq-item__answer');

    if (question && answer) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all
        faqItems.forEach(i => {
          i.classList.remove('active');
          const a = i.querySelector('.faq-item__answer');
          const q = i.querySelector('.faq-item__question');
          if (a) a.style.maxHeight = '0';
          if (q) q.setAttribute('aria-expanded', 'false');
        });

        // Open clicked if was closed
        if (!isOpen) {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          question.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });
})();

// Scroll animations (IntersectionObserver)
(function(){
  const observerOptions = {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
