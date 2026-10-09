# Assembles the 5 static pages from src/layout.html + src/pages/*.html.
# Stand-in for what Next.js does with its layout and the CMS: one header, one footer,
# per-page title/description, and an optional decorative layer switched on per page.
#   powershell -ExecutionPolicy Bypass -File build.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding $false
$layout = [IO.File]::ReadAllText("$root\src\layout.html", $utf8)

$glassHead = @'
<!-- DECORATIVE LAYER (optional): remove these two tags and the canvas to switch it off -->
<link rel="stylesheet" href="/glass/glass.css">
<script type="importmap">
{ "imports": { "three": "/glass/vendor/three.module.js", "three/examples/jsm/loaders/SVGLoader.js": "/glass/vendor/SVGLoader.js" } }
</script>
'@

foreach ($file in Get-ChildItem "$root\src\pages\*.html") {
    $source = [IO.File]::ReadAllText($file.FullName, $utf8)
    if ($source -notmatch '(?s)^\s*<!--(.*?)-->') { throw "$($file.Name): missing front matter" }
    $meta = @{}
    foreach ($line in $Matches[1] -split "`n") {
        if ($line -match '^\s*(\w+):\s*(.+?)\s*$') { $meta[$Matches[1]] = $Matches[2] }
    }
    $content = ($source -replace '(?s)^\s*<!--.*?-->\s*', '')
    $escape = { param($text) $text.Replace('&', '&amp;').Replace('"', '&quot;') }

    $html = $layout
    $html = $html.Replace('{{TITLE}}', (& $escape $meta.title))
    $html = $html.Replace('{{DESCRIPTION}}', (& $escape $meta.description))
    $html = $html.Replace('{{PATH}}', $meta.path)
    $html = $html.Replace('{{CONTENT}}', $content.TrimEnd())
    if ($meta.glass -and $meta.glass -ne 'none') {
        $html = $html.Replace('{{GLASS_HEAD}}', $glassHead)
        $html = $html.Replace('{{GLASS_FOOT}}', "<canvas id=`"webgl`" data-glass-mode=`"$($meta.glass)`" aria-hidden=`"true`"></canvas>`n<script src=`"/glass/glass-loader.js`" defer></script>")
    } else {
        $html = $html.Replace("{{GLASS_HEAD}}`r`n", '').Replace("{{GLASS_HEAD}}`n", '')
        $html = $html.Replace("{{GLASS_FOOT}}`r`n", '').Replace("{{GLASS_FOOT}}`n", '')
    }
    # current page in the navigation
    $html = $html.Replace(" data-nav=`"$($meta.path)`"", ' aria-current="page"')
    $html = [regex]::Replace($html, ' data-nav="[^"]*"', '')

    $target = Join-Path $root ($meta.path.Trim('/'))
    New-Item -ItemType Directory -Force $target | Out-Null
    [IO.File]::WriteAllText((Join-Path $target 'index.html'), $html, $utf8)
    "built $($meta.path)"
}
