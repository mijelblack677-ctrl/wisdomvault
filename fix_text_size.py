import os
import re

# ============================================================
# Fix Hero.astro - Make text BIG and VISIBLE
# ============================================================
hero_path = 'src/components/Hero.astro'

with open(hero_path, 'r') as f:
    content = f.read()

# Make title BIGGER
content = re.sub(
    r'font-size: clamp\(42px, 10vw, 80px\)',
    'font-size: clamp(48px, 12vw, 100px)',
    content
)

# Make description BIGGER
content = re.sub(
    r'font-size: clamp\(16px, 1.3vw, 20px\)',
    'font-size: clamp(18px, 2vw, 26px)',
    content
)

# Make trust badges BIGGER
content = re.sub(
    r'font-size: 13px;',
    'font-size: 16px;',
    content
)

# Make badge text BIGGER
content = re.sub(
    r'font-size: 12px;',
    'font-size: 14px;',
    content
)

# Make sign in button BIGGER
content = re.sub(
    r'font-size: 14px;',
    'font-size: 16px;',
    content
)

# Make stat labels BIGGER
content = re.sub(
    r'font-size: 12px;',
    'font-size: 15px;',
    content
)

with open(hero_path, 'w') as f:
    f.write(content)

print('✅ Hero.astro - Text sizes increased!')

# ============================================================
# Fix WhatInside.astro - Make text BIG and VISIBLE
# ============================================================
what_path = 'src/components/WhatInside.astro'

with open(what_path, 'r') as f:
    content = f.read()

# Make title BIGGER
content = re.sub(
    r'font-size: clamp\(32px, 4vw, 48px\)',
    'font-size: clamp(38px, 5vw, 56px)',
    content
)

# Make card titles BIGGER
content = re.sub(
    r'font-size: 18px;',
    'font-size: 22px;',
    content
)

# Make card descriptions BIGGER
content = re.sub(
    r'font-size: 13px;',
    'font-size: 16px;',
    content
)

# Make badge BIGGER
content = re.sub(
    r'font-size: 12px;',
    'font-size: 14px;',
    content
)

with open(what_path, 'w') as f:
    f.write(content)

print('✅ WhatInside.astro - Text sizes increased!')

# ============================================================
# Fix HowItWorks.astro - Make text BIG and VISIBLE
# ============================================================
how_path = 'src/components/HowItWorks.astro'

with open(how_path, 'r') as f:
    content = f.read()

# Make title BIGGER
content = re.sub(
    r'font-size: clamp\(32px, 4vw, 48px\)',
    'font-size: clamp(38px, 5vw, 56px)',
    content
)

# Make step titles BIGGER
content = re.sub(
    r'font-size: 20px;',
    'font-size: 24px;',
    content
)

# Make step descriptions BIGGER
content = re.sub(
    r'font-size: 14px;',
    'font-size: 17px;',
    content
)

# Make badge BIGGER
content = re.sub(
    r'font-size: 12px;',
    'font-size: 14px;',
    content
)

# Make step numbers BIGGER
content = re.sub(
    r'font-size: 72px;',
    'font-size: 90px;',
    content
)

with open(how_path, 'w') as f:
    f.write(content)

print('✅ HowItWorks.astro - Text sizes increased!')

# ============================================================
# Fix CTAButton.astro - Make button text BIGGER
# ============================================================
cta_path = 'src/components/ui/CTAButton.astro'

with open(cta_path, 'r') as f:
    content = f.read()

# Make button text BIGGER
content = re.sub(
    r'font-size: 14px;',
    'font-size: 18px;',
    content
)

with open(cta_path, 'w') as f:
    f.write(content)

print('✅ CTAButton.astro - Text sizes increased!')

# ============================================================
# Fix Footer.astro - Make text BIGGER
# ============================================================
footer_path = 'src/components/Footer.astro'

if os.path.exists(footer_path):
    with open(footer_path, 'r') as f:
        content = f.read()

    content = re.sub(
        r'font-size: clamp\(13px, 0.85vw, 14px\)',
        'font-size: clamp(15px, 1vw, 18px)',
        content
    )

    content = re.sub(
        r'font-size: 12px;',
        'font-size: 15px;',
        content
    )

    with open(footer_path, 'w') as f:
        f.write(content)

    print('✅ Footer.astro - Text sizes increased!')

print('\n✅ ALL TEXT SIZES INCREASED!')
print('📦 Text is now BIG, BOLD, and VISIBLE!')
