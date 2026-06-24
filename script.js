// ============================================================
//  SCRIPT.JS – Frontend Logic
// ============================================================
(function() {
  // ---------- CONFIGURATION ----------
  // 🔥 CHANGE THIS: Your backend URL when hosted
  const BACKEND_URL = 'https://nbc-backend-1.onrender.com';

  // ---------- STATE ----------
let collapsedState = {};
let catagories = []

fetch(`${BACKEND_URL}/a pi/categories`)
.then(response => response.json())
.then(categories => {categories.forEach(cat => { collapsedState[cat.name] = true; });
});
  let selectedProducts = new Set();
  let selectedAttributes = new Set();
  let currentGeneratedReview = "";
  let currentSelection = { products: [], attributes: [] };
  let isGenerating = false;

  // ---------- BUILD THE PROMPT ----------
  function buildPrompt(prods, attrs) {
    const business = businessInfo;
    
    let productList = '';
    if (prods.length === 1) {
      productList = prods[0];
    } else if (prods.length === 2) {
      productList = `${prods[0]} and ${prods[1]}`;
    } else {
      const last = prods[prods.length - 1];
      const rest = prods.slice(0, -1);
      productList = `${rest.join(", ")} and ${last}`;
    }

    let attrDescriptions = [];
    attrs.forEach(id => {
      const attr = attributes.find(a => a.id === id);
      if (attr) attrDescriptions.push(attr.label.toLowerCase());
    });
    const attrText = attrDescriptions.length > 0 
      ? `they also loved the ${attrDescriptions.join(', ')}` 
      : 'they really enjoyed the overall experience';

    const prompt = `You are a friendly, enthusiastic customer writing a genuine review for a business.

BUSINESS: ${business.name} (${business.tagline})
LOCATION: ${business.location} 
FOUNDERS: ${business.founders || 'the founders'}
UNIQUE SELLING POINT: ${business.uniqueSellingPoint || 'great quality'}

The customer selected: ${productList}.
Additionally, ${attrText}.

Write a natural, human-sounding review (3-4 sentences) that:
- Sounds like a real customer wrote it (not robotic or salesy)
- Naturally mentions the products they tried
- Mentions the positive attributes they appreciated
- Is conversational and enthusiastic
- Ends with a positive closing statement

Write ONLY the review text. No explanations, no formatting. Just the review.`;

    return prompt;
  }

  // ---------- CALL YOUR BACKEND ----------
  async function generateWithBackend(prods, attrs, shopCode) {
    const prompt = buildPrompt(prods, attrs);
    
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          shopCode: shopCode,
          businessName: businessInfo.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend Error:', errorData);
        return null;
      }

      const data = await response.json();
      if (data.review) {
        return data.review;
      }
      return null;
    } catch (error) {
      console.error('Backend Error:', error);
      return null;
    }
  }

  // ---------- MAIN GENERATION FUNCTION ----------
  async function generateReview(prods, attrs) {
    if (prods.length === 0) return "Please select at least one product.";

    const shopCode = document.getElementById('shopCodeInput')?.value || 'unknown';

    try {
      const review = await generateWithBackend(prods, attrs, shopCode);
      if (review) {
        return review;
      }
      return "⚠️ AI service is currently unavailable. Please try again later.";
    } catch (error) {
      console.error('Generation error:', error);
      return "⚠️ Something went wrong. Please try again.";
    }
  }

  // ---------- DOM REFS ----------
  const step1Div = document.getElementById('step1Container');
  const step2Div = document.getElementById('step2Container');
  const step3Div = document.getElementById('step3Container');
  const categoriesContainer = document.getElementById('categoriesContainer');
  const attributesContainer = document.getElementById('attributesContainer');
  const selectedPreviewSpan = document.getElementById('selectedPreview');
  const step1GenerateBtn = document.getElementById('step1GenerateBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const generatedReviewText = document.getElementById('generatedReviewText');
  const copyReviewBtn = document.getElementById('copyReviewBtn');
  const nextToStep3Btn = document.getElementById('nextToStep3Btn');
  const copyFeedbackMsg = document.getElementById('copyFeedbackMsg');
  const finalReviewTextDisplay = document.getElementById('finalReviewTextDisplay');
  const openGoogleReviewLink = document.getElementById('openGoogleReviewLink');
  const copyFinalBtn = document.getElementById('copyFinalBtn');
  const restartFromStep1 = document.getElementById('restartFromStep1');
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  const backToStep2Btn = document.getElementById('backToStep2Btn');
  const bizName = document.getElementById('bizName');
  const bizMeta = document.getElementById('bizMeta');
  const modeIndicator = document.getElementById('modeIndicator');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const shopCodeInput = document.getElementById('shopCodeInput');
  const saveShopCodeBtn = document.getElementById('saveShopCodeBtn');
  const shopCodeStatus = document.getElementById('shopCodeStatus');

  // ---------- INIT HEADER ----------
  bizName.textContent = businessInfo.name;
  bizMeta.textContent = `⭐ ${businessInfo.rating} ★ (${businessInfo.reviewCount}+ reviews) • ${businessInfo.tagline} • Since ${businessInfo.since}`;

  // ---------- SHOP CODE MANAGEMENT ----------
  const SHOP_CODE_KEY = 'shop_code';
  let savedShopCode = localStorage.getItem(SHOP_CODE_KEY) || '';
  if (savedShopCode) {
    shopCodeInput.value = savedShopCode;
    shopCodeStatus.innerHTML = `✅ Shop Code: "${savedShopCode}" saved.`;
    shopCodeStatus.style.color = 'var(--success-green)';
  }

  saveShopCodeBtn.addEventListener('click', () => {
    const code = shopCodeInput.value.trim();
    if (code) {
      localStorage.setItem(SHOP_CODE_KEY, code);
      shopCodeStatus.innerHTML = `✅ Shop Code: "${code}" saved!`;
      shopCodeStatus.style.color = 'var(--success-green)';
    } else {
      localStorage.removeItem(SHOP_CODE_KEY);
      shopCodeStatus.innerHTML = 'ℹ️ Shop code cleared.';
      shopCodeStatus.style.color = 'var(--text-tertiary)';
    }
  });

  // ---------- RENDER FUNCTIONS ----------
  function renderCategories() {
    categoriesContainer.innerHTML = '';
    categories.forEach(cat => {
      const section = document.createElement('div');
      section.className = 'category-section';
      const isCollapsed = collapsedState[cat.name] === true;
      
      const header = document.createElement('div');
      header.className = `category-header ${isCollapsed ? 'collapsed' : ''}`;
      header.innerHTML = `
        <span><span class="toggle-icon">▼</span> ${cat.name}</span>
        <span>${isCollapsed ? '+' : '−'}</span>
      `;
      header.addEventListener('click', () => {
        collapsedState[cat.name] = !collapsedState[cat.name];
        renderCategories();
      });
      
      const productListDiv = document.createElement('div');
      productListDiv.className = 'product-list';
      if (!isCollapsed) {
        cat.products.forEach(product => {
          const chip = document.createElement('button');
          chip.className = `product-chip ${selectedProducts.has(product) ? 'selected' : ''}`;
          chip.innerText = product;
          chip.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedProducts.has(product)) {
              selectedProducts.delete(product);
            } else {
              selectedProducts.add(product);
            }
            renderCategories();
            updateSelectedPreview();
          });
          productListDiv.appendChild(chip);
        });
      } else {
        productListDiv.style.display = 'none';
      }
      section.appendChild(header);
      section.appendChild(productListDiv);
      categoriesContainer.appendChild(section);
    });
  }

  function renderAttributes() {
    attributesContainer.innerHTML = '';
    attributes.forEach(attr => {
      const chip = document.createElement('button');
      chip.className = `product-chip attribute-chip ${selectedAttributes.has(attr.id) ? 'selected' : ''}`;
      chip.innerText = attr.label;
      chip.addEventListener('click', () => {
        if (selectedAttributes.has(attr.id)) {
          selectedAttributes.delete(attr.id);
        } else {
          selectedAttributes.add(attr.id);
        }
        renderAttributes();
        updateSelectedPreview();
      });
      attributesContainer.appendChild(chip);
    });
  }

  function updateSelectedPreview() {
    const productCount = selectedProducts.size;
    const attrCount = selectedAttributes.size;
    if (productCount === 0 && attrCount === 0) {
      selectedPreviewSpan.innerHTML = '✨ No items selected yet. Tap some products and attributes.';
    } else {
      let parts = [];
      if (productCount > 0) {
        const names = Array.from(selectedProducts);
        let display = names.join(', ');
        if (display.length > 40) display = display.slice(0, 37) + '…';
        parts.push(`☕ ${productCount} product${productCount>1?'s':''}: ${display}`);
      }
      if (attrCount > 0) {
        const labels = attributes.filter(a => selectedAttributes.has(a.id)).map(a => a.label);
        let display = labels.join(', ');
        if (display.length > 30) display = display.slice(0, 27) + '…';
        parts.push(`✨ ${display}`);
      }
      selectedPreviewSpan.innerHTML = parts.join(' • ');
    }
  }

  // ---------- UI FLOW ----------
  async function generateAndShow() {
    if (isGenerating) return;
    
    const prods = Array.from(selectedProducts);
    const attrs = Array.from(selectedAttributes);
    if (prods.length === 0) {
      alert("Please select at least one product.");
      return;
    }

    isGenerating = true;
    loadingIndicator.style.display = 'block';
    generatedReviewText.innerText = '⏳ Generating review...';
    modeIndicator.textContent = '🤖 AI Generating...';
    
    currentSelection.products = prods;
    currentSelection.attributes = attrs;

    const review = await generateReview(prods, attrs);
    currentGeneratedReview = review;
    generatedReviewText.innerText = review;
    
    loadingIndicator.style.display = 'none';
    isGenerating = false;
    
    modeIndicator.textContent = '✅ AI Generated';
    showStep(2);
  }

  async function regenerateReview() {
    if (isGenerating) return;
    if (currentSelection.products.length === 0) return;

    isGenerating = true;
    loadingIndicator.style.display = 'block';
    generatedReviewText.innerText = '⏳ Regenerating...';
    modeIndicator.textContent = '🤖 AI Regenerating...';
    
    const review = await generateReview(currentSelection.products, currentSelection.attributes);
    currentGeneratedReview = review;
    generatedReviewText.innerText = review;
    
    loadingIndicator.style.display = 'none';
    isGenerating = false;

    modeIndicator.textContent = '✅ AI Generated';
  }

  function goToStep3() {
    if (!currentGeneratedReview) return;
    finalReviewTextDisplay.innerText = currentGeneratedReview;
    const query = encodeURIComponent(`${businessInfo.name} review`);
    openGoogleReviewLink.href = `https://www.google.com/search?q=${query}`;
    showStep(3);
  }

  async function copyReview() {
    if (!currentGeneratedReview) return;
    try {
      await navigator.clipboard.writeText(currentGeneratedReview);
      copyFeedbackMsg.innerHTML = '<div class="copy-feedback">✅ Review copied to clipboard!</div>';
      setTimeout(() => copyFeedbackMsg.innerHTML = '', 2500);
    } catch {
      copyFeedbackMsg.innerHTML = '<div class="copy-feedback">❌ Please copy manually.</div>';
    }
  }

  async function copyFinal() {
    if (!currentGeneratedReview) return;
    try {
      await navigator.clipboard.writeText(currentGeneratedReview);
      const msg = document.createElement('div');
      msg.className = 'copy-feedback';
      msg.innerText = '📋 Review copied! Now paste into Google.';
      document.getElementById('step3Container').appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    } catch(e) { alert("Copy manually"); }
  }

  function restart() {
    selectedProducts.clear();
    selectedAttributes.clear();
    currentGeneratedReview = "";
    currentSelection = { products: [], attributes: [] };
    categories.forEach(cat => { collapsedState[cat.name] = true; });
    renderCategories();
    renderAttributes();
    updateSelectedPreview();
    showStep(1);
  }

  function backToStep1() { showStep(1); }
  function backToStep2From3() {
    if (currentGeneratedReview) generatedReviewText.innerText = currentGeneratedReview;
    showStep(2);
  }

  function showStep(step) {
    step1Div.style.display = 'none';
    step2Div.style.display = 'none';
    step3Div.style.display = 'none';
    if (step === 1) step1Div.style.display = 'block';
    if (step === 2) step2Div.style.display = 'block';
    if (step === 3) step3Div.style.display = 'block';
  }

  // ---------- STICKY BUTTON PADDING ----------
  function adjustStickyPadding() {
    const wrap = document.querySelector('.sticky-generate-wrapper');
    if (wrap && window.innerHeight) {
      const bottomSafe = window.innerHeight - document.documentElement.clientHeight;
      if (bottomSafe > 0) wrap.style.paddingBottom = (28 + bottomSafe) + 'px';
    }
  }
  window.addEventListener('resize', adjustStickyPadding);
  adjustStickyPadding();

  // ---------- EVENT LISTENERS ----------
  step1GenerateBtn.addEventListener('click', generateAndShow);
  regenerateBtn.addEventListener('click', regenerateReview);
  copyReviewBtn.addEventListener('click', copyReview);
  nextToStep3Btn.addEventListener('click', goToStep3);
  copyFinalBtn.addEventListener('click', copyFinal);
  restartFromStep1.addEventListener('click', restart);
  backToStep1Btn.addEventListener('click', backToStep1);
  backToStep2Btn.addEventListener('click', backToStep2From3);

  // ---------- INIT ----------
  renderCategories();
  renderAttributes();
  updateSelectedPreview();
  showStep(1);

  console.log('📝 Frontend loaded. Backend URL:', BACKEND_URL);
  console.log('🏪 Business:', businessInfo.name);
})();