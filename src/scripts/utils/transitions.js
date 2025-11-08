// src/scripts/utils/transitions.js

export const pageTransitions = {
  fadeIn: (element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  },

  slideIn: (element, direction = 'right') => {
    const translations = {
      right: 'translateX(100%)',
      left: 'translateX(-100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };

    element.style.transform = translations[direction] || translations.right;
    element.style.transition = 'transform 0.4s ease-in-out';
    
    requestAnimationFrame(() => {
      element.style.transform = 'translate(0, 0)';
    });

    setTimeout(() => {
      element.style.transition = '';
    }, 400);
  },

  scaleIn: (element) => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    });

    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  }
};


export function transitionTo(callback, element = document.body) {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      callback();
    });
  } else {
    callback();
    pageTransitions.fadeIn(element);
  }
}
