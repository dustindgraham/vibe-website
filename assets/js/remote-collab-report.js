/*
{{ $src := resources.Get "js/common/common.js" | resources.Minify | resources.Fingerprint }}
*/
import { bindEventWithTarget } from '{{ $src.RelPermalink }}';

const updateToc = (function () {
  const tocItems = document.querySelectorAll('.toc [data-id]')
  const subItemsEls = document.querySelectorAll('.toc .subitems')

  return (activeId) => {
    tocItems.forEach(tocItem => {
      const isActive = activeId === tocItem.dataset.id;
      const op = isActive ? 'add' : 'remove';
      tocItem.classList[op]('is-active');
    });
    subItemsEls.forEach(el => {
      const hasActiveChild = el.querySelector('.subitem.is-active');

      const op = hasActiveChild ? 'add' : 'remove';
      el.classList[op]('is-expand');
      el.parentNode.classList[op]('is-expand');
    })
  }
})()

const GLOBALS_ = {
  hashchanged: false,
};

getLastActiveToc();
observeHeaders(updateToc);

window.addEventListener('hashchange', () => {
  GLOBALS_.hashchanged = true;
  const id = location.hash.slice(1);
  if (id) {
    updateToc(id);
    saveLastActiveToc(id);
  }
})

function observeHeaders(notify) {
  const headers = [...document.querySelectorAll('.main-content h2, .main-content h3')]
  const options = {
    rootMargin: `0% 0% -80% 0%`,
    threshold: 0.8
  }
  const observer = new IntersectionObserver(entries => {
    // If changes were caused by clicking the TOC item, leave them.
    if (GLOBALS_.hashchanged) {
      GLOBALS_.hashchanged = false;
      return;
    }

    let activeItem = null;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeItem = entry.target;
      } else {
        if (!activeItem) {
          // when a header slides down from the observing area,
          // highlight the header above it
          if (entry.boundingClientRect.top < entry.rootBounds.bottom
            && entry.boundingClientRect.bottom > entry.rootBounds.bottom) {
            const index = headers.findIndex(el => el === entry.target);
            if (index > 0) {
              activeItem = headers[index - 1];
            }
          } 
          // when a header slides up from the observing area,
          // highlight the header itself
          else if (entry.boundingClientRect.top < entry.rootBounds.top
            && entry.boundingClientRect.bottom > entry.rootBounds.top) {
              activeItem = entry.target;
            }
        };
      }
    })
    if (activeItem) {
      notify(activeItem.id);
      saveLastActiveToc(activeItem.id);
    }
  }, options)
  headers.forEach(item => observer.observe(item));
}

function saveLastActiveToc(id) {
  sessionStorage.setItem('lastActiveTocId', id);
}

function getLastActiveToc() {
  const id = sessionStorage.getItem('lastActiveTocId')
  id && updateToc(id);
}

function convertRemToPixels(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const navbar = document.querySelector('.navbar');
const tocDropdown = document.querySelector('.toc-dropdown');
const tocDropdownMenu = document.getElementById('dropdown-menu');

bindEventWithTarget('.dropdown-trigger', 'click', () => {
  tocDropdown.classList.toggle('is-active');
  const isActive = tocDropdown.classList.contains('is-active');
  if (isActive) {
    document.documentElement.classList.add('is-clipped');
    setTocHeight();
  } else {
    document.documentElement.classList.remove('is-clipped');
    clearTocHeight();
  }

});

function setTocHeight() {
  const navbarTop = navbar.getBoundingClientRect().top;
  tocDropdownMenu.style.maxHeight = `calc(${window.innerHeight - navbarTop}px - 4.125rem - 48px)`;
}

function clearTocHeight() {
  tocDropdownMenu.style.maxHeight = '';
}

window.addEventListener('resize', () => {
  if (tocDropdown.classList.contains('is-active')) {
    setTocHeight();
  }
});