document.addEventListener('DOMContentLoaded', function() {
  // Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  menuToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    mainNav.classList.toggle('active');
  });
  
  // Close mobile menu when clicking a link
  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
    });
  });
  
  // Smooth scrolling for all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Intersection Observer for section animations
  const sections = document.querySelectorAll('.section');
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  });
  
  sections.forEach(section => {
    sectionObserver.observe(section);
  });
  
  // Scroll to top button
  const scrollTopBtn = document.querySelector('.scroll-top');
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollTopBtn.classList.add('active');
    } else {
      scrollTopBtn.classList.remove('active');
    }
  });
  
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Form submission handling
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Here you would typically send the form data to a server
      // For demonstration, we'll just show an alert
      showCustomAlert("✅ Thank you! The GreenDrive Ireland team will get back to you shortly.");
      this.reset();
    });
  }

  // Stats counter animation
  const statNumbers = document.querySelectorAll('.stat-card h3');
  
  if (statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumbers();
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-card').forEach(card => {
      statsObserver.observe(card);
    });

    function animateNumbers() {
      statNumbers.forEach(number => {
        const target = parseInt(number.textContent);
        const suffix = number.textContent.match(/\D+$/)?.[0] || '';
        const duration = 2000;
        const startTime = performance.now();

        function updateNumber(currentTime) {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const value = Math.floor(progress * target);
          number.textContent = value + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateNumber);
          }
        }

        requestAnimationFrame(updateNumber);
      });
    }
  }

  // === EVA FAQs ACCORDION ===
  const faqButtons = document.querySelectorAll('.faq-question');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const faq = button.parentElement;
      faq.classList.toggle('open');
    });
  });
});
function showCustomAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.innerText = message;
  document.body.appendChild(alertBox);
  
  setTimeout(() => {
    alertBox.classList.add('show');
  }, 100);

  setTimeout(() => {
    alertBox.classList.remove('show');
    setTimeout(() => alertBox.remove(), 300);
  }, 4000); // Duration visible
}
// Toggle FAQs without jumping to top
const faqToggle = document.getElementById('eva-faq-toggle');
const faqSection = document.getElementById('eva-faqs');

if (faqToggle && faqSection) {
  faqToggle.addEventListener('click', function (e) {
    e.preventDefault(); // Evita el salto arriba
    faqSection.classList.toggle('visible');

    // Opcional: hace scroll suave a las FAQs si están ocultas y se abren
    if (faqSection.classList.contains('visible')) {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
// Mostrar/ocultar sección de FAQs y activar acordeón
document.addEventListener('DOMContentLoaded', function () {
  const faqToggle = document.getElementById('eva-faq-toggle');
  const faqSection = document.getElementById('eva-faqs');

  if (faqToggle && faqSection) {
    faqToggle.addEventListener('click', function (e) {
      e.preventDefault();
      faqSection.classList.toggle('visible');

      // Scroll suave si se abre
      if (faqSection.classList.contains('visible')) {
        faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Funcionalidad acordeón
  const allFaqs = document.querySelectorAll('.faq');

  allFaqs.forEach(faq => {
    const btn = faq.querySelector('.faq-question');

    btn.addEventListener('click', () => {
      // Cerrar otros abiertos si se desea exclusivo
      allFaqs.forEach(f => {
        if (f !== faq) f.classList.remove('open');
      });

      // Alternar visibilidad de este
      faq.classList.toggle('open');
    });
  });
});

