import os
import re

# ============================================================
# Edit 4: Replace CTAButton.astro
# ============================================================
cta_path = 'src/components/ui/CTAButton.astro'
cta_content = """---
export interface Props { 
  href: string; 
  text: string; 
}
const { href, text } = Astro.props;
---
<a href={href} class="cta">
  <span class="cta__text">{text}</span>
  <span class="cta__arrow">→</span>
</a>

<style>
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 16px 36px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.04em;
    text-decoration: none;
    border-radius: 50px;
    background: linear-gradient(135deg, #FFD700, #F5A623);
    color: #0D0A05;
    box-shadow: 0 4px 30px rgba(255, 215, 0, 0.2);
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
  }

  .cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #FFC44A, #FFD700);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .cta::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, transparent, rgba(255, 196, 74, 0.2), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
    filter: blur(8px);
    z-index: -1;
    border-radius: 50px;
  }

  .cta:hover::before { opacity: 1; }
  .cta:hover::after { opacity: 1; }

  .cta:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 50px rgba(255, 215, 0, 0.35);
  }

  .cta__text,
  .cta__arrow {
    position: relative;
    z-index: 1;
  }

  .cta__arrow {
    transition: transform 0.3s ease;
  }

  .cta:hover .cta__arrow {
    transform: translateX(4px);
  }

  @media (max-width: 480px) {
    .cta {
      padding: 14px 28px;
      font-size: 13px;
      justify-content: center;
      width: 100%;
    }
  }
</style>"""

with open(cta_path, 'w') as f:
    f.write(cta_content)
print('✅ Updated CTAButton.astro')

# ============================================================
# Edit 5: Remove Pricing from index.astro
# ============================================================
index_path = 'src/pages/index.astro'

# Read current content
with open(index_path, 'r') as f:
    content = f.read()

# Remove Pricing import and component
content = re.sub(r"import Pricing from '../components/Pricing.astro';\n", '', content)
content = re.sub(r'\s*<Pricing />\n', '', content)

# Also remove any trailing imports
content = re.sub(r'\n\s*\n\s*---', '\n---', content)

with open(index_path, 'w') as f:
    f.write(content)
print('✅ Removed Pricing from index.astro')

# ============================================================
# Also update HowItWorks to be cleaner
# ============================================================
how_path = 'src/components/HowItWorks.astro'
how_content = """---
---
<section class="section how-it-works">
  <div class="container">
    <div class="how-it-works__header">
      <span class="how-it-works__badge">🚀 Simple Steps</span>
      <h2 class="how-it-works__title">
        <span>Get Started in</span>
        <span class="gold-text">3 Easy Steps</span>
      </h2>
    </div>

    <div class="how-it-works__steps">
      <div class="step">
        <div class="step__num">1</div>
        <div class="step__icon">📝</div>
        <h3>Sign Up</h3>
        <p>Create your account in seconds</p>
      </div>

      <div class="step">
        <div class="step__num">2</div>
        <div class="step__icon">🎯</div>
        <h3>Learn</h3>
        <p>Explore courses & content</p>
      </div>

      <div class="step">
        <div class="step__num">3</div>
        <div class="step__icon">💰</div>
        <h3>Earn</h3>
        <p>Share & earn rewards</p>
      </div>
    </div>
  </div>
</section>

<style>
  .how-it-works {
    padding: 70px 0;
    position: relative;
    z-index: 10;
    background: transparent;
  }

  .how-it-works__header {
    text-align: center;
    margin-bottom: 44px;
  }

  .how-it-works__badge {
    display: inline-block;
    padding: 6px 20px;
    background: rgba(255, 215, 0, 0.06);
    border: 1px solid rgba(255, 215, 0, 0.08);
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    color: #FFD700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .how-it-works__title {
    font-weight: 900;
    font-size: clamp(32px, 4vw, 48px);
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: #FFFFFF;
  }

  .gold-text {
    background: linear-gradient(135deg, #FFD700, #F5A623);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .how-it-works__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    max-width: 850px;
    margin: 0 auto;
  }

  @media (max-width: 700px) {
    .how-it-works__steps { grid-template-columns: 1fr; gap: 16px; }
    .how-it-works { padding: 40px 0; }
  }

  .step {
    text-align: center;
    padding: 32px 20px;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.02);
    border-radius: 20px;
    transition: all 0.4s ease;
  }

  .step:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 215, 0, 0.06);
    background: rgba(255, 255, 255, 0.04);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .step__num {
    font-size: 48px;
    font-weight: 900;
    color: rgba(255, 215, 0, 0.04);
    line-height: 1;
    margin-bottom: -8px;
  }

  .step__icon {
    font-size: 40px;
    display: block;
    margin-bottom: 8px;
  }

  .step h3 {
    color: #FFFFFF;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .step p {
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
  }
</style>"""

with open(how_path, 'w') as f:
    f.write(how_content)
print('✅ Updated HowItWorks.astro')

print('\n✅ All edits complete!')
print('📦 Run: git add . && git commit -m "Beautiful landing page updates" && git push')
