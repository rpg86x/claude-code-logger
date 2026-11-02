# Maakt claude-code-logger.ico: oranje rond vlak met een klok en "prompt"-streepjes
param([string]$Out = "claude-code-logger.ico")
Add-Type -AssemblyName System.Drawing
$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$g.Clear([System.Drawing.Color]::Transparent)
$orange = [System.Drawing.Color]::FromArgb(255, 201, 100, 66)
$g.FillEllipse((New-Object System.Drawing.SolidBrush $orange), 8, 8, 240, 240)
$white = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 18
$white.StartCap = "Round"; $white.EndCap = "Round"
$g.DrawEllipse($white, 52, 52, 152, 152)
$g.DrawLine($white, 128, 128, 128, 80)
$g.DrawLine($white, 128, 128, 162, 146)
$g.Dispose()

# PNG in een ICO-container verpakken
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray()
$fs = [System.IO.File]::Create($Out)
$w = New-Object System.IO.BinaryWriter $fs
$w.Write([UInt16]0); $w.Write([UInt16]1); $w.Write([UInt16]1)
$w.Write([Byte]0); $w.Write([Byte]0); $w.Write([Byte]0); $w.Write([Byte]0)
$w.Write([UInt16]1); $w.Write([UInt16]32); $w.Write([UInt32]$png.Length); $w.Write([UInt32]22)
$w.Write($png)
$w.Close()
