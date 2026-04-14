/**
 * main.js — 블로그 SPA 메인 진입점
 * - SPA 라우터 (pages/*.html fetch & 교체)
 * - 스크롤 스냅 닷 인디케이터
 * - 네비게이션 (햄버거, 활성 링크)
 * - 스킬 바 애니메이션 (Intersection Observer)
 * - 블로그 마크다운 포스트 목록 & 렌더링
 */

(function () {
  'use strict';

  // =========================================================
  // State
  // =========================================================
  const state = {
    currentPage: 'home',
    currentPostId: null,
  };

  // =========================================================
  // DOM Refs
  // =========================================================
  const pageContainer = document.getElementById('page-container');
  const navbar        = document.getElementById('navbar');
  const hamburger     = document.getElementById('hamburger-btn');
  const navLinks      = document.getElementById('nav-links');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const pageLoader    = document.getElementById('page-loader');

  // =========================================================
  // Loader Utility
  // =========================================================
  function showLoader() { pageLoader.classList.add('active'); }
  function hideLoader() { pageLoader.classList.remove('active'); }

  // =========================================================
  // SPA Router — fetch page HTML & inject
  // =========================================================
  async function navigate(pageName) {
    if (pageName === state.currentPage) return;
    showLoader();

    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`Page not found: ${pageName}`);
      const html = await response.text();

      pageContainer.innerHTML = html;
      state.currentPage = pageName;

      // Update active nav link
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
      });

      // Close mobile menu
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');

      // Page-specific init
      afterNavigate(pageName);

      // Scroll to top
      window.scrollTo({ top: 0 });
    } catch (err) {
      pageContainer.innerHTML = `
        <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
          <div style="text-align:center;">
            <div style="font-size:3rem;margin-bottom:16px;">⚠️</div>
            <p>페이지를 불러올 수 없습니다: ${pageName}</p>
            <p style="font-size:0.875rem;margin-top:8px;">${err.message}</p>
          </div>
        </div>
      `;
    } finally {
      setTimeout(hideLoader, 200);
    }
  }

  // =========================================================
  // After Navigate — per-page init hooks
  // =========================================================
  function afterNavigate(pageName) {
    if (window.particleInterval) {
      clearInterval(window.particleInterval);
      window.particleInterval = null;
      const oldWrapper = document.getElementById('particle-container');
      if (oldWrapper) oldWrapper.remove();
    }
    
    switch (pageName) {
      case 'home':
        initHomeScrollSnap();
        initParticles('cherry');
        break;
      case 'greeting':
        initParticles('leaf');
        break;
      case 'skills':
        initSkillBars();
        initParticles('maple');
        break;
      case 'projects':
        initParticles('snow');
        break;
      case 'blog':
        initBlogPage();
        break;
    }
    initTimelineVisibility();
    initFadeObserver();
  }

  // =========================================================
  // Particle Animation (Cherry / Leaves / Maple / Snow)
  // =========================================================
  function initParticles(type) {
    let wrapper = document.getElementById('particle-container');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'particle-container';
      document.body.appendChild(wrapper);
    }

    // 초기 입자 생성 (자연스러운 배치를 위해)
    for (let i = 0; i < 12; i++) {
      setTimeout(() => createParticle(wrapper, type), Math.random() * 2000);
    }

    window.particleInterval = setInterval(() => {
      createParticle(wrapper, type);
    }, 400); // 0.4초마다 하나씩 생성
  }

  function createParticle(wrapper, type) {
    if (!wrapper || !wrapper.parentNode) return;
    const particle = document.createElement('div');
    
    let sizeMultiplier = 1;
    if (type === 'leaf') {
      particle.className = 'green-leaf';
      sizeMultiplier = 2;
    } else if (type === 'maple') {
      particle.className = 'maple-leaf';
      sizeMultiplier = 1.5;
    } else if (type === 'snow') {
      if (Math.random() > 0.85) {
        particle.className = 'snow-crystal';
        particle.innerHTML = '❄️';
        sizeMultiplier = 1.8;
      } else {
        particle.className = 'snow-circle';
        sizeMultiplier = 0.8;
      }
    } else {
      particle.className = 'cherry-petal';
    }

    const baseSize = Math.random() * 6 + 8; // 8px ~ 14px
    const size = baseSize * sizeMultiplier;
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    if (type === 'snow' && particle.className === 'snow-crystal') {
      particle.style.fontSize = `${size}px`;
      particle.style.lineHeight = `${size}px`;
    }

    // 우측 영역(40%~120%)에서 시작해 왼쪽으로 부드럽게 흩날리도록 
    const startX = window.innerWidth * 0.4 + Math.random() * (window.innerWidth * 0.8);
    const startY = -(Math.random() * 60 + 20); // 위쪽에서 살짝 가려진 상태로 시작

    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    const duration = Math.random() * 5 + 7; // 7초 ~ 12초
    particle.style.animationDuration = `${duration}s`;

    // 왼쪽 방향과 아래 방향 이동 거리 설정
    const fallX = -(Math.random() * 400 + 300); // 왼쪽으로 300px~700px
    const fallY = wrapper.clientHeight + 50; 

    particle.style.setProperty('--fall-x', `${fallX}px`);
    particle.style.setProperty('--fall-y', `${fallY}px`);
    particle.style.setProperty('--rot', `${Math.random() * 360 + 180}deg`);

    wrapper.appendChild(particle);
    setTimeout(() => {
      if (particle.parentNode) particle.remove();
    }, duration * 1000);
  }

  // =========================================================
  // Scroll Snap Dot Indicator (Home Page)
  // =========================================================
  function initHomeScrollSnap() {
    const snapWrapper = document.getElementById('home-snap');
    if (!snapWrapper) return;

    const sections = snapWrapper.querySelectorAll('.snap-section');
    scrollIndicator.innerHTML = '';

    sections.forEach((section, idx) => {
      const dot = document.createElement('div');
      dot.className = 'scroll-dot' + (idx === 0 ? ' active' : '');
      dot.setAttribute('title', section.id || `섹션 ${idx + 1}`);
      dot.addEventListener('click', () => {
        section.scrollIntoView({ behavior: 'smooth' });
      });
      scrollIndicator.appendChild(dot);
    });

    // Update active dot on scroll
    const dots = scrollIndicator.querySelectorAll('.scroll-dot');
    snapWrapper.addEventListener('scroll', () => {
      const scrollTop = snapWrapper.scrollTop;
      const sectionHeight = snapWrapper.clientHeight;
      const activeIdx = Math.round(scrollTop / sectionHeight);
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }, { passive: true });

    scrollIndicator.style.display = 'flex';
  }

  // =========================================================
  // Skill Bars Animation
  // =========================================================
  function initSkillBars() {
    const fills = document.querySelectorAll('.skill-bar-fill');
    if (!fills.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target;
          const width = parseFloat(fill.dataset.width || 0.5);
          fill.style.transform = `scaleX(${width})`;
          fill.classList.add('animate');
          observer.unobserve(fill);
        }
      });
    }, { threshold: 0.2 });

    fills.forEach(fill => observer.observe(fill));
  }

  // =========================================================
  // Timeline Visibility Animation
  // =========================================================
  function initTimelineVisibility() {
    const items = document.querySelectorAll('.timeline-item');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(item => {
      item.classList.remove('visible');
      observer.observe(item);
    });
  }

  // =========================================================
  // Fade-in observer for .fade-in elements
  // =========================================================
  function initFadeObserver() {
    // 애니메이션을 멈추지 않고 바로 실행 — paused 처리 시 IntersectionObserver 타이밍 이슈 발생
    // CSS animation-delay가 자연스럽게 순차 표시를 담당
    const fadeEls = document.querySelectorAll(
      '.fade-in-delay-1, .fade-in-delay-2, .fade-in-delay-3, .fade-in-delay-4, .fade-in-delay-5'
    );
    fadeEls.forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }

  // =========================================================
  // Blog Page — Post List & Viewer
  // =========================================================
  async function initBlogPage() {
    const postList = document.getElementById('post-list');
    const blogEmpty = document.getElementById('blog-empty');
    const markdownBody = document.getElementById('markdown-body');
    if (!postList || !blogEmpty || !markdownBody) return;

    // Fetch post index
    let posts = [];
    try {
      const res = await fetch('posts/index.json');
      const data = await res.json();
      posts = data.posts || [];
    } catch (_) {
      postList.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:0.875rem;">포스트 목록을 불러올 수 없습니다.<br>로컬 서버가 필요합니다.</p>';
      return;
    }

    // Render post list
    postList.innerHTML = posts.map(post => `
      <div class="post-list-item" data-id="${post.id}" data-file="${post.file}" onclick="window.Blog.openPost('${post.id}', '${post.file}')">
        <p class="post-item-date">${formatDate(post.date)}</p>
        <p class="post-item-title">${post.title}</p>
        <div class="post-item-tags">
          ${(post.tags || []).map(tag => `<span class="post-item-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');

    // Auto-open first post
    if (posts.length > 0) {
      openPost(posts[0].id, posts[0].file, postList, blogEmpty, markdownBody);
    }
  }

  async function openPost(postId, filePath, listEl, emptyEl, bodyEl) {
    // If called from global scope, re-query
    listEl   = listEl   || document.getElementById('post-list');
    emptyEl  = emptyEl  || document.getElementById('blog-empty');
    bodyEl   = bodyEl   || document.getElementById('markdown-body');
    if (!listEl || !emptyEl || !bodyEl) return;

    state.currentPostId = postId;

    // Highlight active item
    listEl.querySelectorAll('.post-list-item').forEach(item => {
      item.classList.toggle('active', item.dataset.id === postId);
    });

    // Show markdown body
    emptyEl.style.display = 'none';
    bodyEl.style.display = 'block';
    bodyEl.innerHTML = '<div style="color:var(--text-muted);padding:20px 0;">불러오는 중...</div>';

    // Render
    await window.MarkdownRenderer.renderMarkdown(filePath, bodyEl);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  // =========================================================
  // Navbar scroll effect
  // =========================================================
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  // =========================================================
  // Hamburger
  // =========================================================
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // =========================================================
  // Nav Links click
  // =========================================================
  navLinks.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();
    const pageName = link.dataset.page;
    if (pageName) navigate(pageName);
  });

  // Nav logo → home
  document.getElementById('nav-logo-btn').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('home');
  });

  // =========================================================
  // Rainbow Sparkle Particle Effect 
  // =========================================================
  const sparkleColors = ['#00d4ff', '#7c3aed', '#ec4899', '#10b981', '#ffdeeb', '#fbbf24'];
  let lastSparkleTime = 0;

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkleTime < 40) return; // limit to ~25 particles/sec
    lastSparkleTime = now;

    const sparkle = document.createElement('div');
    sparkle.className = 'rainbow-sparkle';
    
    const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
    sparkle.style.backgroundColor = color;
    sparkle.style.boxShadow = `0 0 6px ${color}`;
    
    const size = Math.random() * 5 + 3; // 3px ~ 8px
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    
    const offsetX = (Math.random() - 0.5) * 15;
    const offsetY = (Math.random() - 0.5) * 10;
    
    sparkle.style.left = `${e.clientX + offsetX}px`;
    sparkle.style.top = `${e.clientY + offsetY + 15}px`; 
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
      sparkle.remove();
    }, 1000); // matches CSS animation duration
  }, { passive: true });

  // =========================================================
  // Mouse Click Enlarge Cursor Effect
  // =========================================================
  window.addEventListener('mousedown', () => {
    document.body.classList.add('mouse-down');
  });
  window.addEventListener('mouseup', () => {
    document.body.classList.remove('mouse-down');
  });

  // =========================================================
  // Public API
  // =========================================================
  window.Blog = {
    navigate,
    openPost: (postId, filePath) => openPost(postId, filePath),
  };

  // =========================================================
  // Initial Load
  // =========================================================
  async function init() {
    showLoader();

    try {
      const response = await fetch('pages/home.html');
      if (!response.ok) throw new Error('Cannot load home.html');
      const html = await response.text();
      pageContainer.innerHTML = html;
      afterNavigate('home');
    } catch (err) {
      console.error('Init failed:', err);
      pageContainer.innerHTML = `
        <div style="min-height:80vh;display:flex;align-items:center;justify-content:center;flex-direction:column;color:var(--text-muted);gap:12px;">
          <div style="font-size:4rem;">🚀</div>
          <h2 style="color:var(--accent-cyan);">블로그를 시작하려면 로컬 서버가 필요합니다</h2>
          <p>터미널에서 아래 명령어를 실행하세요:</p>
          <code style="background:rgba(0,212,255,0.08);padding:12px 24px;border-radius:8px;color:var(--accent-cyan);font-size:1.1rem;">
            python -m http.server 8080
          </code>
          <p style="margin-top:8px;">그 다음 <code style="color:var(--accent-cyan)">http://localhost:8080</code> 에서 확인하세요</p>
        </div>
      `;
    } finally {
      setTimeout(hideLoader, 300);
    }
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
