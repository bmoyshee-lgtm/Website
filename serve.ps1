# Small local static server (no Node or Python needed).
#   powershell -ExecutionPolicy Bypass -File serve.ps1 5180
# then open http://localhost:5180
param([int]$Port = 5180)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$types = @{
    '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
    '.svg' = 'image/svg+xml'; '.json' = 'application/json'; '.ttf' = 'font/ttf'; '.png' = 'image/png'
    '.jpg' = 'image/jpeg'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Starlight site on http://localhost:$Port"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
            $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
            if (Test-Path $file -PathType Container) { $file = Join-Path $file 'index.html' }
            $full = [IO.Path]::GetFullPath($file)
            if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
                $bytes = [IO.File]::ReadAllBytes($full)
                $type = $types[[IO.Path]::GetExtension($full).ToLower()]
                if (-not $type) { $type = 'application/octet-stream' }
                $response.ContentType = $type
                $response.Headers.Add('Cache-Control', 'no-cache')
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes('404')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } catch {
            try { $response.StatusCode = 500 } catch {}
        } finally {
            try { $response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
