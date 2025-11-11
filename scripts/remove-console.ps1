# Remove all console statements from TypeScript/JavaScript files
# This script removes console.log, console.error, console.warn, console.info, console.debug

$projectPath = "c:\Users\Sahil Sukhdeve\Downloads\egs\project"

# Files to process
$patterns = @(
    "src/**/*.tsx",
    "src/**/*.ts",
    "server/**/*.js",
    "simple-server.cjs"
)

Write-Host "🧹 Removing console statements from project..." -ForegroundColor Cyan
Write-Host ""

$totalRemoved = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $projectPath -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        
        # Remove console.log statements (including multiline)
        $content = $content -replace "console\.log\([^;]*\);?", ""
        
        # Remove console.error statements
        $content = $content -replace "console\.error\([^;]*\);?", ""
        
        # Remove console.warn statements
        $content = $content -replace "console\.warn\([^;]*\);?", ""
        
        # Remove console.info statements
        $content = $content -replace "console\.info\([^;]*\);?", ""
        
        # Remove console.debug statements
        $content = $content -replace "console\.debug\([^;]*\);?", ""
        
        # Clean up extra blank lines (max 2 consecutive blank lines)
        $content = $content -replace "(\r?\n){3,}", "`n`n"
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $linesRemoved = ($originalContent -split "console\." | Measure-Object).Count - 1
            $totalRemoved += $linesRemoved
            Write-Host "✅ $($file.Name) - Removed $linesRemoved console statements" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "✨ Complete! Removed $totalRemoved console statements total." -ForegroundColor Green
