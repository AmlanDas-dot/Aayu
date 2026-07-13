import os

def analyze_dir(path):
    print(f"--- Analyzing {path} ---")
    for root, dirs, files in os.walk(path):
        if 'node_modules' in root or '.git' in root or 'dist' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith(('.tsx', '.ts', '.py', '.css')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    lines = content.split('\n')
                    is_fake = "export {}" in content or len(lines) < 5
                    has_api = "fetch(" in content or "axios" in content or "api.get" in content or "api.post" in content
                    has_state = "useState" in content or "useReducer" in content
                    
                    if file.endswith('.tsx') or file.endswith('.ts'):
                        print(f"Frontend: {file} - Fake: {is_fake}, API: {has_api}, State: {has_state}, Lines: {len(lines)}")
                    elif file.endswith('.py'):
                        is_stub = "pass" in content and len(lines) < 20
                        has_route = "@app" in content or "@router" in content
                        print(f"Backend: {file} - Stub: {is_stub}, Route: {has_route}, Lines: {len(lines)}")
                except Exception as e:
                    pass

analyze_dir("d:\\Aayu\\src")
analyze_dir("d:\\Aayu\\backend\\app")
