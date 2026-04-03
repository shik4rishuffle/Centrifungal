<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $meta_title ?? $title ?? 'Centrifungal' }}</title>

    <!-- Google Fonts (same as frontend) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet">

    <!-- Frontend stylesheets -->
    <link rel="stylesheet" href="/preview-css/reset.css">
    <link rel="stylesheet" href="/preview-css/design-tokens.css">
    <link rel="stylesheet" href="/preview-css/components.css">
    <link rel="stylesheet" href="/preview-css/homepage.css">
    <link rel="stylesheet" href="/preview-css/pages.css">

    <style>
        .preview-link-tooltip {
            position: fixed;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a2e;
            color: #fff;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s;
            z-index: 9999;
            white-space: nowrap;
        }
        .preview-link-tooltip.visible { opacity: 1; }
    </style>
</head>
<body>
    <div class="preview-link-tooltip" id="link-tooltip"></div>
    <script>
        (function () {
            var tooltip = document.getElementById('link-tooltip');
            document.addEventListener('click', function (e) {
                var link = e.target.closest('a[href]');
                if (link) {
                    e.preventDefault();
                    tooltip.textContent = 'Links to: ' + link.getAttribute('href');
                    tooltip.classList.add('visible');
                    clearTimeout(tooltip._t);
                    tooltip._t = setTimeout(function () {
                        tooltip.classList.remove('visible');
                    }, 2000);
                }
            });
        })();
    </script>
    @yield('content')
</body>
</html>
