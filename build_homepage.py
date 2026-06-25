import re
import os

with open('src/homepage.html', 'r', encoding='utf-8') as f:
    html = f.read()

body_match = re.search(r'<body>(.*?)</body>', html, re.DOTALL)
if not body_match:
    print('No body found')
    exit(1)
body = body_match.group(1)

body = body.replace('class=', 'className=')
body = re.sub(r'<img([^>]*?)(?<!/)>', r'<img\1 />', body)
body = re.sub(r'<input([^>]*?)(?<!/)>', r'<input\1 />', body)
body = re.sub(r'<br>', r'<br />', body)
body = re.sub(r'<hr>', r'<hr />', body)

body = body.replace('onclick=\"document.getElementById(\'diseaseCarousel\').scrollBy(-200,0)\"', 'onClick={() => document.getElementById(\'diseaseCarousel\')?.scrollBy(-200,0)}')
body = body.replace('onclick=\"document.getElementById(\'diseaseCarousel\').scrollBy(200,0)\"', 'onClick={() => document.getElementById(\'diseaseCarousel\')?.scrollBy(200,0)}')

styles_map = {
    'style=\"text-decoration:none;\"': 'style={{ textDecoration: \'none\' }}',
    'style=\"margin-top:10px;color:#64748b\"': 'style={{ marginTop: \'10px\', color: \'#64748b\' }}',
    'style=\"border:0;\"': 'style={{ border: 0 }}',
    'style=\"display:flex;flex-direction:column;gap:0;min-width:320px;flex:1;align-self:stretch;\"': 'style={{ display: \'flex\', flexDirection: \'column\', gap: 0, minWidth: \'320px\', flex: 1, alignSelf: \'stretch\' }}',
    'style=\"flex:1;border-radius:20px 20px 0 0;\"': 'style={{ flex: 1, borderRadius: \'20px 20px 0 0\' }}',
    'style=\"background:white;border-radius:0 0 20px 20px;border:1px solid #e5e7eb;border-top:none;padding:16px 18px;box-shadow:0 5px 20px rgba(0,0,0,.04);\"': 'style={{ background: \'white\', borderRadius: \'0 0 20px 20px\', border: \'1px solid #e5e7eb\', borderTop: \'none\', padding: \'16px 18px\', boxShadow: \'0 5px 20px rgba(0,0,0,.04)\' }}',
    'style=\"margin-bottom:0;\"': 'style={{ marginBottom: 0 }}',
    'style=\"margin:0 30px 30px;\"': 'style={{ margin: \'0 30px 30px\' }}',
    'style=\"width:48px;height:48px;object-fit:contain;border-radius:8px;\"': 'style={{ width: \'48px\', height: \'48px\', objectFit: \'contain\', borderRadius: \'8px\' }}',
    'allowfullscreen=\"\"': 'allowFullScreen={true}',
}
for k, v in styles_map.items():
    body = body.replace(k, v)

img_map = {
    '\"Aayu Logo.png\"': '{logoHeart}',
    '\"icons/Whatsapp.png\"': '{Whatsapp}',
    '\"Hero bg.png\"': '{homeHiDoc}',
    '\"icons\\\\Docs.png\"': '{Docs}',
    '\"icons\\\\Screening.png\"': '{Screening}',
    '\"icons\\\\Nearby.png\"': '{Nearby}',
    '\"icons\\\\Nutrition.png\"': '{Nutrition}',
    '\"icons\\\\Family_health.png\"': '{FamilyHealth}',
    '\"icons\\\\Schemes.png\"': '{Schemes}',
    '\"icons/step_tell.png\"': '{StepTell}',
    '\"icons/step_questions.png\"': '{StepQuestions}',
    '\"icons/step_guidance.png\"': '{StepGuidance}',
    '\"icons/step_consult.png\"': '{StepConsult}',
    '\"icons/dengue.png\"': '{Dengue}',
    '\"icons/malaria.png\"': '{Malaria}',
    '\"icons/tuberculosis.png\"': '{Tuberculosis}',
    '\"icons/flu.png\"': '{Flu}',
    '\"icons/maternal.png\"': '{Maternal}',
}
for k, v in img_map.items():
    body = body.replace(k, v)

nav_replacements = {
    '<a href=\"homepage.html\" style={{ textDecoration: \'none\' }} className=\"menu-item active\">': '<button onClick={() => navigate(\'/\')} style={{ textDecoration: \'none\', border: \'none\', width: \'100%\', textAlign: \'left\' }} className=\"menu-item active\">',
    '<a href=\"screening.html\" style={{ textDecoration: \'none\' }} className=\"menu-item\">': '<button onClick={() => navigate(\'/screening\')} style={{ textDecoration: \'none\', border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">',
    '<div className=\"menu-item\">\\n                <i className=\"fa-solid fa-seedling\"></i>\\n                <span>Nutrition</span>\\n            </div>': '<button onClick={() => navigate(\'/nutrition\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-solid fa-seedling\"></i>\\n                <span>Nutrition</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-solid fa-file-medical\"></i>\\n                <span>Schemes</span>\\n            </div>': '<button onClick={() => navigate(\'/schemes\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-solid fa-file-medical\"></i>\\n                <span>Schemes</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-solid fa-location-dot\"></i>\\n                <span>Nearby Care</span>\\n            </div>': '<button onClick={() => navigate(\'/hospitals\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-solid fa-location-dot\"></i>\\n                <span>Nearby Care</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-regular fa-file-lines\"></i>\\n                <span>Records</span>\\n            </div>': '<button onClick={() => navigate(\'/records\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-regular fa-file-lines\"></i>\\n                <span>Records</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-solid fa-person-drowning\"></i>\\n                <span>Disaster Aid</span>\\n            </div>': '<button onClick={() => navigate(\'/disaster\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-solid fa-person-drowning\"></i>\\n                <span>Disaster Aid</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-regular fa-bell\"></i>\\n                <span>Alerts & Updates</span>\\n            </div>': '<button onClick={() => navigate(\'/alerts\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-regular fa-bell\"></i>\\n                <span>Alerts & Updates</span>\\n            </button>',
    '<div className=\"menu-item\">\\n                <i className=\"fa-solid fa-user-shield\"></i>\\n                <span>Admin Dashboard</span>\\n            </div>': '<button onClick={() => navigate(\'/admin\')} style={{ border: \'none\', width: \'100%\', textAlign: \'left\', background: \'none\' }} className=\"menu-item\">\\n                <i className=\"fa-solid fa-user-shield\"></i>\\n                <span>Admin Dashboard</span>\\n            </button>',
    '<button className=\"send-btn\">': '<button className=\"send-btn\" onClick={() => navigate(\'/chat\')}>',
    '<button className=\"action-btn\">': '<button className=\"action-btn\" onClick={() => navigate(\'/chat\')}>',
}
for k, v in nav_replacements.items():
    if k in body:
        body = body.replace(k, v)

# Close the modified <button> tags that were originally <a>
body = re.sub(r'<button onClick=\{\(\) => navigate\(\'/\'\)\}(.*?)>(.*?)</a\s*>', r'<button onClick={() => navigate(\'/\')}\1>\2</button>', body, flags=re.DOTALL)
body = re.sub(r'<button onClick=\{\(\) => navigate\(\'/screening\'\)\}(.*?)>(.*?)</a\s*>', r'<button onClick={() => navigate(\'/screening\')}\1>\2</button>', body, flags=re.DOTALL)

body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{Docs\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/records\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={Docs}', body)
body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{Screening\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/screening\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={Screening}', body)
body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{Nearby\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/hospitals\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={Nearby}', body)
body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{Nutrition\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/nutrition\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={Nutrition}', body)
body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{FamilyHealth\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/family\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={FamilyHealth}', body)
body = re.sub(r'<div className=\"card col-12 col-md-6 col-xl-4\">(\s*)<img className=\"card-icon\" src=\{Schemes\}', r'<div className=\"card col-12 col-md-6 col-xl-4\" onClick={() => navigate(\'/schemes\')} style={{cursor:\'pointer\'}}>\1<img className=\"card-icon\" src={Schemes}', body)

component = f"""import React, {{ useState }} from "react";
import {{ useNavigate }} from "react-router-dom";
import "../aayu-home.css";

import logoHeart from "../assets/logo-heart.png";
import homeHiDoc from "../assets/home-hi-doc.png";
import Docs from "../assets/Docs.png";
import Screening from "../assets/Screening.png";
import Nearby from "../assets/Nearby.png";
import Nutrition from "../assets/Nutrition.png";
import FamilyHealth from "../assets/Family_health.png";
import Schemes from "../assets/Schemes.png";
import Dengue from "../assets/dengue.png";
import Malaria from "../assets/malaria.png";
import Tuberculosis from "../assets/tuberculosis.png";
import Flu from "../assets/flu.png";
import Maternal from "../assets/maternal.png";
import Whatsapp from "../assets/whatsapp.png";
import StepTell from "../assets/step_tell.png";
import StepQuestions from "../assets/step_questions.png";
import StepGuidance from "../assets/step_guidance.png";
import StepConsult from "../assets/step_consult.png";

export function HomePage() {{
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");

    return (
        <div className="homepage-root">
            {{/* The HTML content follows */}}
            {body.replace('{', '{{').replace('}', '}}').replace('{{{{', '{{').replace('}}}}', '}}')}
        </div>
    );
}}
"""

# Since body already has JSX {{ }} which we messed up via f-string brace escaping, it's better to construct it differently.
# I'll just concatenate.
component = """import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../aayu-home.css";

import logoHeart from "../assets/logo-heart.png";
import homeHiDoc from "../assets/home-hi-doc.png";
import Docs from "../assets/Docs.png";
import Screening from "../assets/Screening.png";
import Nearby from "../assets/Nearby.png";
import Nutrition from "../assets/Nutrition.png";
import FamilyHealth from "../assets/Family_health.png";
import Schemes from "../assets/Schemes.png";
import Dengue from "../assets/dengue.png";
import Malaria from "../assets/malaria.png";
import Tuberculosis from "../assets/tuberculosis.png";
import Flu from "../assets/flu.png";
import Maternal from "../assets/maternal.png";
import Whatsapp from "../assets/whatsapp.png";
import StepTell from "../assets/step_tell.png";
import StepQuestions from "../assets/step_questions.png";
import StepGuidance from "../assets/step_guidance.png";
import StepConsult from "../assets/step_consult.png";

export function HomePage() {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");

    return (
        <div className="homepage-root">
""" + body + """
        </div>
    );
}
"""

# Clean up remaining a tags and other HTML-specific things
component = component.replace('</a>', '</span>')
component = component.replace('<a class="panel-link" href="#">', '<span className="panel-link" style={{cursor:\'pointer\'}}>')
component = component.replace('<a href="#">', '<span style={{cursor:\'pointer\'}}>')
component = component.replace('style="', '') # Remove stray style attrs if any? Actually don't, it might break things if there are others.

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(component)

print('Done generating HomePage.tsx')
