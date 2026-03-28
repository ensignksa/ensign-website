param(
    [string]$SrcPath,
    [string]$OutDir
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($SrcPath)
Write-Host "Original size: $($img.Width)x$($img.Height)"

$srcRatio = $img.Width / $img.Height

function Save-CroppedImage {
    param($Width, $Height, $OutPath, $Quality)

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $dstRatio = $Width / $Height
    if ($srcRatio -gt $dstRatio) {
        $srcH = $img.Height
        $srcW = [int]($img.Height * $dstRatio)
        $srcX = [int](($img.Width - $srcW) / 2)
        $srcY = 0
    } else {
        $srcW = $img.Width
        $srcH = [int]($img.Width / $dstRatio)
        $srcX = 0
        $srcY = [int](($img.Height - $srcH) / 2)
    }

    $srcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $srcW, $srcH)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    $bmp.Save($OutPath, $encoder, $encoderParams)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved: $OutPath ($Width x $Height)"
}

# Featured 1200x750
Save-CroppedImage -Width 1200 -Height 750 -OutPath "$OutDir/ai-reshaping-digital-marketing-featured.jpg" -Quality 85

# OG 1200x630
Save-CroppedImage -Width 1200 -Height 630 -OutPath "$OutDir/ai-reshaping-digital-marketing-og.jpg" -Quality 85

$img.Dispose()
Write-Host "All images processed!"
