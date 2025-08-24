# Building MSIX Package for Microsoft Store

This guide explains how to build an MSIX package for Klyro that can be submitted to the Microsoft Store.

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)
1. Push your code to GitHub
2. Go to Actions tab
3. Run "Build Windows AppX Package" workflow
4. Download the `.appx` file from artifacts

### Option 2: Local Windows Build
```bash
# On Windows machine
npm install
npm run build:msix
```

### Option 3: Convert Unpacked App
```bash
# Build unpacked app on any platform
npm run build:win

# Then convert to MSIX on Windows
.\scripts\convert-to-msix.ps1
```

## 📋 Prerequisites

### For Local Windows Build:
- Windows 10/11
- Node.js 18+
- Windows App SDK (for makeappx.exe)
- Visual Studio Build Tools (for signtool.exe)

### For GitHub Actions:
- No setup required - runs automatically on Windows runners

## 🔧 Configuration

The MSIX configuration is in `electron-builder.yml`:

```yaml
win:
  target:
    - target: appx
      arch: x64

appx:
  identityName: "IsotryonKlyro"
  publisher: "CN=Isotryon Team"
  displayName: "Klyro"
  backgroundColor: "transparent"
  languages: "en-us"
  customManifestPath: "appxmanifest.xml"
```

## 📁 Custom Manifest

The `appxmanifest.xml` file defines:
- App identity and publisher
- Required capabilities (microphone, file access, etc.)
- Protocol support (`isotryonklyro://`)
- Visual elements and tiles

## 🎯 Build Commands

```bash
# Build everything including MSIX
npm run build:msix

# Build only renderer
npm run build:renderer

# Build unpacked Windows app
npm run build:win
```

## 📦 Output Files

After building, you'll find in `dist/`:
- `Klyro 0.2.4.appx` - MSIX package for Store submission
- `win-unpacked/` - Unpacked Windows application
- `Klyro-Setup-0.2.4.exe` - Traditional NSIS installer

## 🏪 Microsoft Store Submission

### 1. Prepare Your Package
- Ensure the `.appx` file is properly signed
- Test the package locally before submission

### 2. Submit to Store
- Go to [Partner Center](https://partner.microsoft.com/)
- Create new app submission
- Upload your `.appx` file
- Microsoft will automatically sign it during review

### 3. Store Requirements
- App must comply with Store policies
- Package will be reviewed by Microsoft
- Automatic updates through Store

## 🔐 Signing

### Development/Testing:
- Unsigned packages work for local testing
- Use `Add-AppxPackage -AllowUnsigned` for installation

### Store Submission:
- Microsoft automatically signs your package
- No certificate management required
- Ensures trust and automatic updates

## 🧪 Testing

### Install Locally:
```powershell
# Install AppX package
Add-AppxPackage -Path "dist\Klyro 0.2.4.appx"

# Run the app
Start-Process "shell:AppsFolder\IsotryonKlyro_0.2.4.0_x64__IsotryonTeam!App"

# Remove test installation
Remove-AppxPackage -Package "IsotryonKlyro_0.2.4.0_x64__IsotryonTeam"
```

### Test Protocol Handling:
```bash
# Test deep linking
start isotryonklyro://personalize?theme=dark
```

## 🐛 Troubleshooting

### Build Errors:
- Ensure you're on Windows for AppX builds
- Check that all dependencies are installed
- Verify manifest file syntax

### Installation Issues:
- Check Windows version (requires 1809+)
- Ensure developer mode is enabled
- Check for conflicting app installations

### Store Issues:
- Verify app identity matches Store listing
- Check capability requirements
- Ensure protocol registration is correct

## 📚 Resources

- [MSIX Documentation](https://docs.microsoft.com/en-us/windows/msix/)
- [AppX Packaging](https://docs.microsoft.com/en-us/windows/msix/package/create-app-package-with-makeappx-tool)
- [Store Policies](https://docs.microsoft.com/en-us/windows/uwp/publish/store-policies)
- [Partner Center](https://partner.microsoft.com/)

## 🔄 Updates

To update the MSIX package:
1. Increment version in `package.json`
2. Update version in `appxmanifest.xml`
3. Rebuild the package
4. Submit new version to Store

## 📝 Notes

- MSIX packages provide better security and reliability
- Automatic updates through Microsoft Store
- Better user experience with modern Windows features
- No need to manage certificates for Store distribution

---

**Need help?** Check the GitHub Issues or create a new one with your build logs.
