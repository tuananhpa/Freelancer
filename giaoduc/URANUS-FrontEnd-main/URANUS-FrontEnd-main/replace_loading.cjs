const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:', 'Users', 'sugoi', 'Desktop', 'URANUS WEB APP', 'URANUS-FrontEnd', 'src');

const pattern = /return\s+<div[^>]*>(Đang tải[^<]*)<\/div>;/g;

function countSlashes(filepath) {
    const relPath = path.relative(srcDir, filepath);
    const depth = relPath.split(path.sep).length - 1;
    if (depth === 0) return './';
    return '../'.repeat(depth);
}

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(srcDir, function(filepath) {
    if (filepath.endsWith('.tsx')) {
        let content = fs.readFileSync(filepath, 'utf8');
        let newContent = content;
        let madeChanges = false;

        if (newContent.includes('fallback={<div') && newContent.includes('Đang tải')) {
            newContent = newContent.replace(/fallback={<div[^>]*>(Đang tải[^<]*)<\/div>}/g, 'fallback={<LoadingOverlay text="$1" />}');
            madeChanges = true;
        }

        if (pattern.test(newContent)) {
            newContent = newContent.replace(pattern, 'return <LoadingOverlay text="$1" />;');
            madeChanges = true;
        }

        if (madeChanges) {
            if (!newContent.includes('LoadingOverlay')) {
                const importPath = countSlashes(filepath) + 'components/ui/LoadingOverlay';
                const importStatement = `import LoadingOverlay from '${importPath.replace(/\\/g, '/')}';\n`;
                const lines = newContent.split('\n');
                let lastImport = 0;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ')) {
                        lastImport = i;
                    }
                }
                lines.splice(lastImport + 1, 0, importStatement);
                newContent = lines.join('\n');
            }
            fs.writeFileSync(filepath, newContent, 'utf8');
            console.log(`Updated: ${filepath}`);
        }
    }
});
