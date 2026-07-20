import os

# Fix Jurisdiction.ts
p = 'src/types/Jurisdiction.ts'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
if 'lastAshaVisit?: string;' not in c:
    c = c.replace('commonSymptoms?: string[];', 'commonSymptoms?: string[];\n  lastAshaVisit?: string;')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

# Fix SchemeCard.tsx
p = 'src/features/schemes/components/SchemeCard.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('scheme.state ===', 'scheme.location ===')
c = c.replace('scheme.state}', 'scheme.location}')
c = c.replace('scheme.official_link', 'scheme.official_website')
with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

# Fix TopSchemes.tsx
p = 'src/features/schemes/components/TopSchemes.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
if 'import { type EvaluatedScheme }' not in c:
    c = 'import { type EvaluatedScheme } from "@/services/schemeService";\n' + c
with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

# Fix schemeService.ts
p = 'src/services/schemeService.ts'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('const rank = {', 'const rank: Record<string, number> = {')
c = c.replace('import { collection, doc, getDoc, getDocs, setDoc, query, serverTimestamp } from', 'import { doc, setDoc, serverTimestamp } from')
with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

# Fix SchemesPage.tsx
p = 'src/pages/SchemesPage.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
if 'const [ageGroup, setAgeGroup]' not in c:
    c = c.replace('const [triggerFetch, setTriggerFetch] = useState(0);', 
    '''const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [userState, setUserState] = useState("");
  const [triggerFetch, setTriggerFetch] = useState(0);''')
c = c.replace('userProfile.age', '(userProfile as any).age')
c = c.replace('const [aiEvaluating, setAiEvaluating] = useState(false);', '')
c = c.replace('setAiEvaluating(true);', '')
c = c.replace('setAiEvaluating(false);', '')
with open(p, 'w', encoding='utf-8') as f:
    f.write(c)
