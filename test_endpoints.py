import urllib.request, json, time
def check(msg):
    sid = f"test-{time.time()}"
    req = urllib.request.Request('http://127.0.0.1:8000/chat', data=json.dumps({'message':msg,'language':'en','session_id':sid,'history':[]}).encode(), headers={'Content-Type': 'application/json'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"'{msg}' -> intent: {'screening' if resp.get('screening_mode') else 'chat/other'} | response: {resp.get('response')[:50].replace(chr(10), ' ')}")
    except Exception as e:
        print(f"Error on '{msg}': {e}")

check('hi')
check('I feel dizzy')
check('I want to lose weight')
check('What is Ayushman Bharat?')
