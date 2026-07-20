import re

with open('d:/Aayu/src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the existing right-panel completely
content = re.sub(r'\{/\*\s*RIGHT SIDE\s*\*/\}.*?</aside>', '', content, flags=re.DOTALL)

content = content.replace('                        </div>\n\n                    </div>\n\n                    {/*  AI SCREENING & GUIDANCE  */}', '                        {/*  AI SCREENING & GUIDANCE  */}')
content = content.replace('                        </div>\n\n                        {/*  RIGHT SIDE  */}', '')
content = content.replace('                    </div>\n\n                    {/*  AI SCREENING & GUIDANCE  */}', '                    {/*  AI SCREENING & GUIDANCE  */}')
content = content.replace('                        </div>\n                    </div>\n\n                    {/*  CONNECT ON WHATSAPP  */}', '                        {/*  CONNECT ON WHATSAPP  */}')

new_bottom = """
                        {/* END OF MAIN CONTENT */}
                        </div>

                        {/* NEW RIGHT SIDEBAR */}
                        <aside className="right-panel">
                            <LiveAlertsSidebar />
                        </aside>
                    </div>
                </main>
"""
content = content.replace('                </main>', new_bottom)

import_stmt = 'import { LiveAlertsSidebar } from "@/components/dashboard/LiveAlertsSidebar";\n'
content = content.replace('import { AayuSidebar }', import_stmt + 'import { AayuSidebar }')

with open('d:/Aayu/src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('HomePage refactored.')
