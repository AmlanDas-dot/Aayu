import re

with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace missing onClicks
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{Docs\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/records\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={Docs}', code)
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{Screening\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/screening\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={Screening}', code)
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{Nearby\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/hospitals\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={Nearby}', code)
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{Nutrition\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/nutrition\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={Nutrition}', code)
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{FamilyHealth\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/family\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={FamilyHealth}', code)
code = re.sub(r'<div className="card col-12 col-md-6 col-xl-4">(\s*)<img className="card-icon" src=\{Schemes\}', r'<div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate(\'/schemes\')} style={{cursor:\'pointer\'}}>\1<img className="card-icon" src={Schemes}', code)

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Cards updated')
