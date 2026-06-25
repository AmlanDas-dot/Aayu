import glob
import re

css_map = {
    "search-page": "p-[28px_24px] max-w-[1000px] mx-auto",
    "search-hero": "mb-6",
    "search-hero-title": "text-[1.8rem] font-extrabold text-slate-800 mb-1.5",
    "search-hero-sub": "text-slate-500 text-[0.9rem]",
    "search-bar-wrap": "mb-6",
    "search-bar": "flex gap-0 border-[1.5px] border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-3",
    "search-input": "flex-1 border-none outline-none p-[14px_16px] text-[0.95rem] text-slate-800",
    "search-collection-select": "border-none border-l border-slate-200 outline-none px-4 text-[0.85rem] bg-slate-50 text-slate-800 cursor-pointer",
    "search-submit-btn": "border-none border-l border-slate-200 bg-gradient-to-br from-teal-600 to-teal-800 text-white px-6 text-[0.9rem] font-semibold cursor-pointer transition-colors hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed",
    "search-suggestions": "flex gap-2 flex-wrap",
    "suggestion-chip": "bg-white border border-slate-200 rounded-full py-1.5 px-3.5 text-[0.78rem] cursor-pointer text-slate-500 transition-colors hover:border-teal-600 hover:text-teal-600",
    "search-error": "bg-red-100 border border-red-300 text-red-700 rounded-xl p-[12px_16px] text-[0.85rem] mb-5",
    "search-loading": "text-center p-12 text-slate-500",
    "loading-spinner": "w-9 h-9 border-[3px] border-slate-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3",
    "search-empty": "text-center py-16 px-5 text-slate-500",
    "search-placeholder": "text-center py-16 px-5 text-slate-500",
    "empty-icon": "text-[3rem] block mb-3",
    "placeholder-icon": "text-[3rem] block mb-3",
    "results-count": "text-slate-500 text-[0.85rem] mb-4",
    "results-grid": "flex flex-col gap-3",
    "search-result-card": "bg-white border-[1.5px] border-slate-200 rounded-2xl p-[18px_20px] shadow-sm transition-all hover:border-teal-600 hover:shadow-md hover:-translate-y-[1px]",
    "card-header": "flex justify-between items-start gap-4 mb-2.5",
    "card-title": "text-[1rem] font-bold text-slate-800 mb-1",
    "card-category": "bg-teal-50 text-teal-800 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold capitalize",
    "card-content": "text-[0.875rem] text-slate-500 leading-relaxed mb-3",
    "card-footer": "flex justify-between items-center flex-wrap gap-2",
    "card-tags": "flex gap-1.5 flex-wrap",
    "tag-chip": "bg-slate-100 text-slate-500 rounded-md px-2 py-0.5 text-[0.7rem]",
    "card-source": "text-[0.72rem] text-slate-500",
    "score-bar-wrap": "flex items-center gap-2 shrink-0",
    "score-bar-track": "w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden",
    "score-bar-fill": "h-full rounded-full transition-all duration-500",
    "score-label": "text-[0.75rem] font-bold min-w-[34px] text-right",
    
    "settings-page": "p-[28px_24px] max-w-[900px] mx-auto",
    "settings-title": "text-[1.8rem] font-extrabold text-slate-800 mb-6",
    "settings-grid": "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6",
    "settings-card": "bg-white border-[1.5px] border-slate-200 rounded-2xl p-5 shadow-sm",
    "settings-section-title": "text-[0.95rem] font-bold text-slate-800 mb-2",
    "settings-desc": "text-[0.82rem] text-slate-500 leading-relaxed mb-3.5",
    "lang-options": "flex gap-2 flex-wrap",
    "lang-option-btn": "border-[1.5px] border-slate-200 rounded-xl py-2 px-4 text-[0.85rem] cursor-pointer bg-white text-slate-800 transition-colors hover:border-teal-600",
    "lang-option-active": "border-teal-600 bg-teal-50 text-teal-800 font-semibold",
    "status-row": "flex justify-between items-center text-[0.85rem] mb-2.5",
    "status-dot": "text-[0.82rem] font-semibold",
    "settings-refresh-btn": "bg-transparent border border-slate-200 rounded-xl py-1.5 px-3.5 text-[0.8rem] cursor-pointer text-slate-500 mt-2.5 transition-colors hover:border-teal-600 hover:text-teal-600",
    "privacy-list": "list-none flex flex-col gap-2 p-0",
    "about-pipeline": "bg-slate-800 rounded-xl p-[10px_14px] mt-2.5",
    "settings-save-btn": "bg-gradient-to-br from-teal-600 to-teal-800 border-none rounded-xl py-3 px-8 text-white text-[0.95rem] font-semibold cursor-pointer shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg",
}

files = glob.glob('src/pages/*.tsx') + glob.glob('src/components/**/*.tsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Handle composite classes like "status-dot ok" -> "status-dot text-green-600"
    content = content.replace('status-dot ok', 'text-[0.82rem] font-semibold text-green-600')
    content = content.replace('status-dot error', 'text-[0.82rem] font-semibold text-red-600')
    content = content.replace('status-dot checking', 'text-[0.82rem] font-semibold text-slate-500')
    
    # Replace single classes
    for old_cls, new_cls in css_map.items():
        if " " not in old_cls: # Skip already replaced ones
            # Replace complete word match of old_cls
            content = re.sub(r'\b' + re.escape(old_cls) + r'\b', new_cls, content)
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated classes in {file}")

print("Done")
