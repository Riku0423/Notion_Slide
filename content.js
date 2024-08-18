class NotionSlideshow {
  constructor() {
    this.slideshow = null;
    this.currentSlide = 0;
    this.slides = [];
    this.isFullscreen = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.colorMode = 'light'; // デフォルトはライトモード
  }

  setColorMode(mode) {
    this.colorMode = mode;
    if (this.slideshow) {
      this.slideshow.setAttribute('data-color-mode', mode);
    }
  }

  async init(mode) {
    this.setColorMode(mode);
    try {
      const callouts = this.getCallouts();
      if (callouts.length === 0) {
        this.showNotification('このページにコールアウトが見つかりませんでした。');
        return;
      }
      await this.createSlideshow(callouts);
      this.addEventListeners();
      this.showNotification(`スライドショーを開始しました。全${this.slides.length}枚のスライドがあります。`);
    } catch (error) {
      console.error('スライドショーの初期化中にエラーが発生しました:', error);
      this.showNotification('スライドショーの開始中にエラーが発生しました。');
    }
  }

  getCallouts() {
    const callouts = Array.from(document.querySelectorAll('.notion-callout-block'));
    return callouts.filter(callout => !callout.closest('.notion-callout-block .notion-callout-block'));
  }

  async createSlideshow(callouts) {
    this.slideshow = document.createElement('div');
    this.slideshow.id = 'notion-slideshow';
    this.slideshow.setAttribute('role', 'dialog');
    this.slideshow.setAttribute('aria-label', 'Notionスライドショー');
    this.slideshow.setAttribute('data-color-mode', this.colorMode);
    
    const slideContainer = document.createElement('div');
    slideContainer.classList.add('slide-container');
    
    for (const [index, callout] of callouts.entries()) {
      const slide = this.createSlide(callout, index);
      this.slides.push(slide);
      slideContainer.appendChild(slide);
    }

    this.slideshow.appendChild(slideContainer);
    this.slideshow.appendChild(this.createControls(this.slides.length));

    document.body.appendChild(this.slideshow);
    this.preloadImages();
    
    setTimeout(() => this.slideshow.classList.add('visible'), 50);
  }

  createSlide(callout, index) {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    slide.innerHTML = callout.outerHTML;
    slide.style.display = index === 0 ? 'block' : 'none';
    this.processVideos(slide);
    return slide;
  }

  processVideos(slide) {
    const videos = slide.querySelectorAll('video');
    videos.forEach(video => {
      video.controls = true;
      video.autoplay = false;
      video.style.maxWidth = '100%';
      video.style.height = 'auto';
    });
  }

  createControls(totalSlides) {
    const controls = document.createElement('div');
    controls.classList.add('slideshow-controls');
    controls.innerHTML = `
      <button id="prev-slide" aria-label="前のスライド">◀</button>
      <span id="slide-counter" aria-live="polite">1/${totalSlides}</span>
      <button id="next-slide" aria-label="次のスライド">▶</button>
      <button id="fullscreen-toggle" aria-label="フルスクリーン切替">⤢</button>
      <button id="close-slideshow" aria-label="スライドショーを閉じる">✕</button>
    `;
    return controls;
  }

  addEventListeners() {
    document.getElementById('prev-slide').addEventListener('click', () => this.changeSlide(-1));
    document.getElementById('next-slide').addEventListener('click', () => this.changeSlide(1));
    document.getElementById('fullscreen-toggle').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('close-slideshow').addEventListener('click', () => this.close());
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    this.slideshow.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    this.slideshow.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
  }

  async changeSlide(direction) {
    if (this.slides.length === 0) {
      console.error('スライドが存在しません。');
      return;
    }

    const newIndex = (this.currentSlide + direction + this.slides.length) % this.slides.length;
    const currentSlide = this.slides[this.currentSlide];
    const nextSlide = this.slides[newIndex];

    if (!currentSlide || !nextSlide) {
      console.error('スライドの切り替えに失敗しました。');
      return;
    }

    currentSlide.classList.add(direction > 0 ? 'prev' : 'next');
    nextSlide.classList.add(direction > 0 ? 'next' : 'prev');
    nextSlide.style.display = 'block';

    void nextSlide.offsetWidth;

    currentSlide.classList.remove('prev', 'next');
    nextSlide.classList.remove('prev', 'next');

    await new Promise(resolve => setTimeout(resolve, 500));

    currentSlide.style.display = 'none';
    this.currentSlide = newIndex;
    this.updateCounter();
  }

  updateCounter() {
    const counter = document.getElementById('slide-counter');
    if (counter) {
      counter.textContent = `${this.currentSlide + 1}/${this.slides.length}`;
    }
  }

  handleKeydown(e) {
    switch(e.key) {
      case 'ArrowLeft':
        this.changeSlide(-1);
        break;
      case 'ArrowRight':
        this.changeSlide(1);
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].screenX;
    if (this.touchStartX - this.touchEndX > 50) {
      this.changeSlide(1);
    } else if (this.touchEndX - this.touchStartX > 50) {
      this.changeSlide(-1);
    }
  }

  async toggleFullscreen() {
    if (document.hidden) {
      console.warn('ドキュメントがアクティブでないため、フルスクリーンの切り替えをスキップします。');
      return;
    }
  
    try {
      if (!this.isFullscreen) {
        if (this.slideshow.requestFullscreen) {
          await this.slideshow.requestFullscreen();
        } else if (this.slideshow.webkitRequestFullscreen) {
          await this.slideshow.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
      this.isFullscreen = !this.isFullscreen;
    } catch (error) {
      console.error('フルスクリーンモードの切り替えに失敗しました:', error);
    }
  }

  preloadImages() {
    const images = this.slideshow.querySelectorAll('img');
    images.forEach(img => {
      if (img.dataset.src) {
        const preloadLink = document.createElement('link');
        preloadLink.href = img.dataset.src;
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        document.head.appendChild(preloadLink);
      }
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10001;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  close() {
    if (this.slideshow) {
      this.slideshow.classList.remove('visible');
      setTimeout(() => {
        this.slideshow.remove();
        this.slideshow = null;
        this.slides = [];
        this.currentSlide = 0;
        this.showNotification('スライドショーを終了しました。');
      }, 300);
    }
  }
}

const notionSlideshow = new NotionSlideshow();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSlideshow") {
    notionSlideshow.init(request.mode);
  }
});