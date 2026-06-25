with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix iframe
code = code.replace('referrerpolicy=', 'referrerPolicy=')

# Fix unused imports by correctly referencing them in the img tags
code = code.replace('"icons\\\\Docs.png"', '{Docs}')
code = code.replace('"icons\\\\Screening.png"', '{Screening}')
code = code.replace('"icons\\\\Nearby.png"', '{Nearby}')
code = code.replace('"icons\\\\Nutrition.png"', '{Nutrition}')
code = code.replace('"icons\\\\Family_health.png"', '{FamilyHealth}')
code = code.replace('"icons\\\\Schemes.png"', '{Schemes}')

code = code.replace('"icons/Docs.png"', '{Docs}')
code = code.replace('"icons/Screening.png"', '{Screening}')
code = code.replace('"icons/Nearby.png"', '{Nearby}')
code = code.replace('"icons/Nutrition.png"', '{Nutrition}')
code = code.replace('"icons/Family_health.png"', '{FamilyHealth}')
code = code.replace('"icons/Schemes.png"', '{Schemes}')

code = code.replace('"Hero bg.png"', '{homeHiDoc}')

# Remove unused React and inputValue
code = code.replace('import React, { useState }', 'import { useState }')
code = code.replace('const [inputValue, setInputValue] = useState("");', '')

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Fixed references')
