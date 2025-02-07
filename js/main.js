document.addEventListener('DOMContentLoaded', () => {
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.classList.add('modal-open');
    }
  }
  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  }
  document.querySelectorAll('.learn-more-btn').forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      openModal(button.getAttribute('data-modal'));
    });
  });
  document.querySelectorAll('.tooltip-close').forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      closeModal(button.closest('.tooltip'));
    });
  });
  document.querySelectorAll('.tooltip').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  const gallery = document.querySelector('.gallery');
  const track = document.querySelector('.gallery-track');
  const firstContainer = document.querySelector('.gallery-container');
  let autoScrollTimeout;

  function disableAutoScroll() {
    const cs = window.getComputedStyle(track);
    const t = cs.transform || cs.webkitTransform;
    let tx = 0;
    if (t && t !== 'none') {
      const m = t.match(/matrix\(([^)]+)\)/);
      if (m) tx = parseFloat(m[1].split(', ')[4]);
    }
    track.style.animation = 'none';
    track.style.transform = `translateX(${tx}px)`;
    gallery.style.overflowX = 'auto';
    clearTimeout(autoScrollTimeout);
    autoScrollTimeout = setTimeout(resumeAutoScroll, 2000);
  }

  function resumeAutoScroll() {
    const offset = gallery.scrollLeft;
    gallery.style.overflowX = 'hidden';
    const containerWidth = firstContainer.offsetWidth;
    const fraction = offset / containerWidth;
    const duration = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--gallery-animation-duration')) || 7;
    track.style.transform = '';
    track.style.animation = `scroll-loop ${duration}s linear infinite`;
    track.style.animationDelay = `-${fraction * duration}s`;
  }

  gallery.addEventListener('wheel', disableAutoScroll);
  gallery.addEventListener('touchstart', disableAutoScroll);
  gallery.addEventListener('mousedown', disableAutoScroll);
});
