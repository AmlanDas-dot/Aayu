import re

with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix escaped quotes
code = code.replace("\\'", "'")

# Fix HTML comments
code = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', code)

# Fix mismatched a tags
code = code.replace('<a className="panel-link" href="#">View all</span>', '<span className="panel-link" style={{cursor:\'pointer\'}}>View all</span>')
code = code.replace('<a href="#">View all diseases <i className="fa-solid fa-arrow-right"></i></span>', '<span style={{cursor:\'pointer\'}}>View all diseases <i className="fa-solid fa-arrow-right"></i></span>')

# Fix style attribute in iframe
code = code.replace('style="border:0;"', 'style={{border:0}}')

# Also any other <a href="#">
code = code.replace('<a href="#">', '<span style={{cursor:\'pointer\'}}>')
code = code.replace('</a>', '</span>')

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Fixed JSX errors')
