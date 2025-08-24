# Convert Windows unpacked app to MSIX
# This script should be run on Windows with the Windows App SDK installed

param(
    [string]$AppPath = "dist\win-unpacked",
    [string]$OutputPath = "dist",
    [string]$AppName = "Klyro",
    [string]$Version = "0.2.4.0",
    [string]$Publisher = "CN=Isotryon Team"
)

Write-Host "🚀 Converting Windows app to MSIX..." -ForegroundColor Green

# Check if required tools are available
if (-not (Get-Command "makeappx.exe" -ErrorAction SilentlyContinue)) {
    Write-Error "❌ makeappx.exe not found. Please install the Windows App SDK."
    Write-Host "💡 Download from: https://docs.microsoft.com/en-us/windows/apps/windows-app-sdk/downloads" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command "signtool.exe" -ErrorAction SilentlyContinue)) {
    Write-Harning "⚠️  signtool.exe not found. MSIX will be unsigned (okay for testing)." -ForegroundColor Yellow
}

# Create temporary directory for MSIX packaging
$TempDir = "temp-msix"
if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy app files
Write-Host "📁 Copying application files..." -ForegroundColor Blue
Copy-Item "$AppPath\*" -Destination $TempDir -Recurse -Force

# Create AppX manifest
$ManifestPath = "$TempDir\AppxManifest.xml"
$ManifestContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity Name="IsotryonKlyro"
            Publisher="$Publisher"
            Version="$Version"
            ProcessorArchitecture="x64"
            ResourceId="en-us" />

  <Properties>
    <DisplayName>$AppName</DisplayName>
    <PublisherDisplayName>Isotryon Team</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
    <Description>AI-powered desktop assistant for real-time transcription and conversation</Description>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.19041.0" />
  </Dependencies>

  <Resources>
    <Resource Language="en-us" />
  </Resources>

  <Applications>
    <Application Id="App"
                 Executable="$AppName.exe"
                 EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="$AppName"
        Description="AI-powered desktop assistant for real-time transcription and conversation"
        BackgroundColor="transparent"
        Square150x150Logo="Assets\Square150x150Logo.png"
        Square44x44Logo="Assets\Square44x44Logo.png"
        Square71x71Logo="Assets\Square71x71Logo.png"
        Square310x310Logo="Assets\Square310x310Logo.png"
        Square310x150Logo="Assets\Square310x150Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png" />
        <uap:ShowNameOnTiles>
          <uap:ShowOn Tile="square150x150Logo"/>
          <uap:ShowOn Tile="wide310x150Logo"/>
        </uap:ShowNameOnTiles>
      </uap:VisualElements>
      <Extensions>
        <uap:Extension Category="windows.protocol">
          <uap:Protocol Name="isotryonklyro" />
        </uap:Extension>
      </Extensions>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
    <rescap:Capability Name="allowElevation" />
    <Capability Name="internetClient" />
    <Capability Name="privateNetworkClientServer" />
    <Capability Name="microphone" />
    <Capability Name="picturesLibrary" />
    <Capability Name="videosLibrary" />
    <Capability Name="documentsLibrary" />
  </Capabilities>

</Package>
"@

Set-Content -Path $ManifestPath -Value $ManifestContent -Encoding UTF8

# Create Assets directory and placeholder images (you should replace these with real assets)
$AssetsDir = "$TempDir\Assets"
New-Item -ItemType Directory -Path $AssetsDir | Out-Null

# Create placeholder StoreLogo.png (1x1 transparent pixel)
$PlaceholderImage = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
Set-Content -Path "$AssetsDir\StoreLogo.png" -Value $PlaceholderImage -Encoding Byte

# Copy other placeholder assets
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Square44x44Logo.png"
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Square71x71Logo.png"
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Square150x150Logo.png"
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Square310x150Logo.png"
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Square310x310Logo.png"
Copy-Item "$AssetsDir\StoreLogo.png" -Destination "$AssetsDir\Wide310x150Logo.png"

# Build AppX package
$AppxFile = "$OutputPath\$AppName-$Version.appx"
Write-Host "🔨 Building AppX package..." -ForegroundColor Blue

try {
    & makeappx.exe pack /d $TempDir /p $AppxFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AppX package created successfully: $AppxFile" -ForegroundColor Green
        
        # Try to sign the package if signtool is available
        if (Get-Command "signtool.exe" -ErrorAction SilentlyContinue) {
            Write-Host "🔐 Signing AppX package..." -ForegroundColor Blue
            & signtool.exe sign /fd SHA256 /a $AppxFile
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ AppX package signed successfully" -ForegroundColor Green
            } else {
                Write-Warning "⚠️  Failed to sign AppX package" -ForegroundColor Yellow
            }
        }
        
        # Show file info
        $FileInfo = Get-Item $AppxFile
        Write-Host "📦 Package size: $([math]::Round($FileInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        
        Write-Host "🚀 To install the AppX package:" -ForegroundColor Green
        Write-Host "   Add-AppxPackage -Path `"$AppxFile`"" -ForegroundColor White
        
    } else {
        Write-Error "❌ Failed to create AppX package"
        exit 1
    }
} catch {
    Write-Error "❌ Error building AppX package: $_"
    exit 1
} finally {
    # Cleanup
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}

Write-Host "🎉 MSIX conversion complete!" -ForegroundColor Green
