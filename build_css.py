import re

with open('src/homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if style_match:
    styles = style_match.group(1)
    
    bootstrap_utils = '''
/* BOOTSTRAP UTILITIES EXTRACTED */
.d-flex { display: flex !important; }
.align-items-center { align-items: center !important; }
.align-items-stretch { align-items: stretch !important; }
.justify-content-between { justify-content: space-between !important; }
.justify-content-center { justify-content: center !important; }
.flex-shrink-0 { flex-shrink: 0 !important; }
.flex-grow-1 { flex-grow: 1 !important; }
.col-12 { width: 100%; }
@media (min-width: 768px) {
  .col-md-6 { width: 50%; }
}
@media (min-width: 1200px) {
  .col-xl-4 { width: 33.33333333%; }
}

/* Ensure global box-sizing since homepage resets it */
.homepage-root * {
  box-sizing: border-box;
}
.homepage-root .wrapper {
  background:#f5f8fa;
  color:#1f2937;
  font-family:'Segoe UI',sans-serif;
}
/* END BOOTSTRAP UTILITIES */
'''
    
    with open('src/aayu-home.css', 'w', encoding='utf-8') as f2:
        f2.write('\n\n/* NEW HOMEPAGE STYLES EXTRACTED FROM HTML */\n')
        f2.write(bootstrap_utils)
        f2.write(styles)
    print('Styles successfully extracted and written to aayu-home.css')
else:
    print('Failed to find <style> block')
