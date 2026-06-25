import re

with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add imports
code = code.replace('import { useNavigate } from "react-router-dom";', 'import { useState } from "react";\nimport { useNavigate } from "react-router-dom";\nimport { AayuSidebar } from "../components/navigation/AayuSidebar";')

# Add state
code = code.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n    const [sidebarOpen, setSidebarOpen] = useState(true);')

# Replace aside block
aside_pattern = re.compile(r'<aside className="sidebar flex-shrink-0">.*?</aside>', re.DOTALL)
code = aside_pattern.sub('<AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />', code)

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('HomePage.tsx updated')
