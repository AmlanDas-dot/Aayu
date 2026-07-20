import os
p = 'src/types/Jurisdiction.ts'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('type: string;', 'type?: string;')
c = c.replace('families: number;', 'families?: number;')
c = c.replace('healthScore: number;', 'healthScore?: number;')
with open(p, 'w', encoding='utf-8') as f:
    f.write(c)
