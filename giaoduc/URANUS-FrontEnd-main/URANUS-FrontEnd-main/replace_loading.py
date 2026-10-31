import os
import re

src_dir = r"c:\Users\sugoi\Desktop\URANUS WEB APP\URANUS-FrontEnd\src"

pattern = re.compile(r'return\s+<div[^>]*>(Đang tải[^<]*)</div>;')

def count_slashes(filepath):
    # Determine how many '../' we need based on depth from src/
    rel_path = os.path.relpath(filepath, src_dir)
    depth = rel_path.count(os.sep)
    if depth == 0:
        return './'
    return '../' * depth

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            made_changes = False

            # Replace basic 'return <div>Đang tải...</div>;'
            def replacer(match):
                text = match.group(1)
                return f'return <LoadingOverlay text="{text}" />;'
            
            # Special case for App.tsx Suspense fallback
            if "fallback={<div" in new_content and "Đang tải" in new_content:
                new_content = re.sub(r'fallback={<div[^>]*>(Đang tải[^<]*)</div>}', r'fallback={<LoadingOverlay text="\1" />}', new_content)
                made_changes = True

            new_content, count = pattern.subn(replacer, new_content)
            if count > 0:
                made_changes = True

            # Special case for tbody loading row
            if "Đang tải dữ liệu" in new_content and "<td" in new_content:
                # We might not want to replace table row loading with full screen overlay?
                # Actually, the user says "sửa mọi cái đang tải trong hệ thống thành cái đang tải có logo, ở giữa màn hình"
                # If we replace table rows, it will break table structure if we just put <LoadingOverlay /> directly inside <tbody>.
                # LoadingOverlay uses ReactDOM.createPortal so it attaches to document.body, meaning it doesn't break table structure! 
                pass

            if made_changes:
                if 'LoadingOverlay' not in new_content:
                    import_path = count_slashes(filepath) + 'components/ui/LoadingOverlay'
                    import_statement = f"import LoadingOverlay from '{import_path}';\n"
                    # Add import after the last import statement
                    lines = new_content.split('\n')
                    last_import = 0
                    for i, line in enumerate(lines):
                        if line.startswith('import '):
                            last_import = i
                    lines.insert(last_import + 1, import_statement)
                    new_content = '\n'.join(lines)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
