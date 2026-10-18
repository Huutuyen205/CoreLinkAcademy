Add-Type -AssemblyName System.Drawing
[System.IO.Directory]::CreateDirectory('apps/web/public/icons')

function Make-Icon {
    param (
        [int]$Size,
        [string]$OutPath
    )
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $c1 = [System.Drawing.Color]::FromArgb(15, 23, 42)
    $c2 = [System.Drawing.Color]::FromArgb(37, 99, 235)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillRectangle($brush, $rect)

    # CoreLink Accent circle
    $innerPad = [int]($Size * 0.12)
    $innerSize = $Size - ($innerPad * 2)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(96, 165, 250), [float]($Size * 0.04))
    $g.DrawEllipse($pen, $innerPad, $innerPad, $innerSize, $innerSize)

    # Text CL
    $fontFamily = New-Object System.Drawing.FontFamily('Arial')
    $font = New-Object System.Drawing.Font($fontFamily, [float]($Size * 0.38), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rectF = New-Object System.Drawing.RectangleF(0, 0, [float]$Size, [float]$Size)
    $g.DrawString('CL', $font, $textBrush, $rectF, $format)

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose()
    $textBrush.Dispose()
    $brush.Dispose()
    $font.Dispose()
    $fontFamily.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

Make-Icon -Size 192 -OutPath 'apps/web/public/icons/icon-192.png'
Make-Icon -Size 512 -OutPath 'apps/web/public/icons/icon-512.png'
Make-Icon -Size 32  -OutPath 'apps/web/public/favicon.ico'
Write-Host 'Icons created successfully!'
