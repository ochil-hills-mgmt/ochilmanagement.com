// ===== OHM — Google Analytics (GA4) + Custom Event Tracking =====
// Shared across all pages. Loaded with `defer`; the gtag.js library loads async.

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-9JNDCJNLH0', {
  page_title: document.title,
  send_page_view: true
});

document.addEventListener('DOMContentLoaded', function() {

  // ─── CTA Click Tracking ───
  document.querySelectorAll('a.btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      gtag('event', 'cta_click', {
        event_category: 'engagement',
        event_label: this.textContent.trim(),
        link_url: this.href,
        link_location: this.closest('section')?.className || 'unknown'
      });
    });
  });

  // ─── Contact Form Submission Tracking ───
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function() {
      var revenue = document.getElementById('revenue');
      var services = [];
      document.querySelectorAll('input[name="services"]:checked, input[name="services[]"]:checked').forEach(function(cb) {
        services.push(cb.value);
      });
      gtag('event', 'form_submission', {
        event_category: 'conversion',
        event_label: 'contact_form',
        revenue_range: revenue ? revenue.value : 'not_specified',
        services_interested: services.join(', ') || 'not_specified'
      });
      gtag('event', 'generate_lead', {
        currency: 'USD',
        value: 1
      });
    });
  }

  // ─── Scroll Depth Tracking (25%, 50%, 75%, 100%) ───
  var scrollMarkers = { 25: false, 50: false, 75: false, 100: false };
  var remaining = 4;
  function onScroll() {
    var scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return; // page too short to scroll — no depth events
    var scrollPct = Math.round((window.scrollY / scrollable) * 100);
    [25, 50, 75, 100].forEach(function(marker) {
      if (scrollPct >= marker && !scrollMarkers[marker]) {
        scrollMarkers[marker] = true;
        remaining--;
        gtag('event', 'scroll_depth', {
          event_category: 'engagement',
          event_label: marker + '_percent',
          percent_scrolled: marker
        });
      }
    });
    if (remaining === 0) window.removeEventListener('scroll', onScroll);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Blog Article Engagement ───
  var articleContent = document.querySelector('article, .blog-content, .article-content');
  if (articleContent) {
    // Track time on article (30s, 60s, 120s, 300s)
    var timeMarkers = [30, 60, 120, 300];
    timeMarkers.forEach(function(seconds) {
      setTimeout(function() {
        if (!document.hidden) {
          gtag('event', 'article_engagement', {
            event_category: 'content',
            event_label: document.title,
            time_on_page: seconds
          });
        }
      }, seconds * 1000);
    });
  }

  // ─── External Link Tracking ───
  document.querySelectorAll('a[href^="http"]').forEach(function(link) {
    if (!link.href.includes('ochilmanagement.com')) {
      link.addEventListener('click', function() {
        gtag('event', 'outbound_click', {
          event_category: 'engagement',
          event_label: this.href,
          link_text: this.textContent.trim()
        });
      });
    }
  });

  // ─── Phone/Email Click Tracking ───
  document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      var type = this.href.startsWith('tel:') ? 'phone_click' : 'email_click';
      gtag('event', type, {
        event_category: 'conversion',
        event_label: this.href
      });
    });
  });

  // ─── FAQ Accordion Tracking ───
  document.querySelectorAll('.faq-item, details, [data-faq]').forEach(function(faq) {
    faq.addEventListener('click', function() {
      var question = this.querySelector('summary, .faq-question, h3, h4');
      if (question) {
        gtag('event', 'faq_interaction', {
          event_category: 'engagement',
          event_label: question.textContent.trim().substring(0, 100)
        });
      }
    });
  });

  // ─── Service Tier Interest Tracking ───
  document.querySelectorAll('[data-tier], .service-card, .tier-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var tierName = this.querySelector('h2, h3, .tier-name');
      if (tierName) {
        gtag('event', 'service_tier_view', {
          event_category: 'interest',
          event_label: tierName.textContent.trim()
        });
      }
    });
  });

});
