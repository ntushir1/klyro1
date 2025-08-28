# Microsoft Store Tile Assets

This document explains the tile assets created for Microsoft Store compliance and addresses the feedback regarding "On Device Tiles" (Policy 10.1.1.11).

## 📋 **Microsoft Store Feedback**

> **Technical requirement policies 10.1.1.11 On Device Tiles**
> 
> The available product tile icons include a default image. Tile icons must uniquely represent product so users associate icons with the appropriate products and do not confuse one product for another.

## 🎯 **Solution Implemented**

### **Problem**
The previous MSIX workflow was using placeholder 1x1 transparent pixel images for all tile assets, which violates Microsoft Store policy requiring unique, identifiable product tiles.

### **Fix**
Created proper tile assets from the existing Klyro logo (`src/ui/assets/logo.png`) in all required sizes:

## 📐 **Tile Assets Created**

| Asset File | Size | Purpose | Microsoft Store Requirement |
|------------|------|---------|----------------------------|
| `Square44x44Logo.png` | 44×44 | Small tile, taskbar | Required |
| `Square71x71Logo.png` | 71×71 | Medium tile | Recommended |
| `Square150x150Logo.png` | 150×150 | Default tile | Required |
| `Wide310x150Logo.png` | 310×150 | Wide tile | Recommended |
| `LargeTile.png` | 310×310 | Large tile | Recommended |
| `StoreLogo.png` | 50×50 | Store listing | Required |

## 🔧 **Implementation Details**

### **Asset Generation**
All tiles are generated from the main logo using ImageMagick:

```bash
# Created from src/ui/assets/logo.png (1024×1024)
magick src/ui/assets/logo.png -resize 44x44 src/ui/assets/msix-tiles/Square44x44Logo.png
magick src/ui/assets/logo.png -resize 71x71 src/ui/assets/msix-tiles/Square71x71Logo.png
magick src/ui/assets/logo.png -resize 150x150 src/ui/assets/msix-tiles/Square150x150Logo.png
magick src/ui/assets/logo.png -resize 310x150 src/ui/assets/msix-tiles/Wide310x150Logo.png
magick src/ui/assets/logo.png -resize 310x310 src/ui/assets/msix-tiles/LargeTile.png
magick src/ui/assets/logo.png -resize 50x50 src/ui/assets/msix-tiles/StoreLogo.png
```

### **Workflow Integration**
Updated `.github/workflows/build-windows-msix.yml` to:

1. **Copy Real Assets** (instead of placeholders):
   ```powershell
   Copy-Item "src\ui\assets\msix-tiles\StoreLogo.png" -Destination "dist\win-unpacked\Assets\StoreLogo.png"
   Copy-Item "src\ui\assets\msix-tiles\Square44x44Logo.png" -Destination "dist\win-unpacked\Assets\Square44x44Logo.png"
   # ... all tile sizes
   ```

2. **Enhanced Manifest** with proper tile declarations:
   ```xml
   <uap:VisualElements>
     <uap:DefaultTile
       Wide310x150Logo="Assets\Wide310x150Logo.png"
       Square71x71Logo="Assets\Square71x71Logo.png"
       Square310x310Logo="Assets\LargeTile.png"
       ShortName="Klyro">
     </uap:DefaultTile>
   </uap:VisualElements>
   ```

## ✅ **Microsoft Store Compliance**

### **Before (Non-Compliant)**
- ❌ Used 1×1 transparent placeholder images
- ❌ All tiles looked identical (generic)
- ❌ No unique brand representation
- ❌ Violated policy 10.1.1.11

### **After (Compliant)**
- ✅ Uses actual Klyro logo in all tiles
- ✅ Unique, identifiable product representation
- ✅ Consistent branding across all tile sizes
- ✅ Meets Microsoft Store policy requirements

## 🎨 **Brand Consistency**

All tile assets:
- Use the official Klyro logo
- Maintain consistent visual identity
- Are properly sized for their contexts
- Clearly identify the product as "Klyro"
- Help users associate the tiles with the correct product

## 📱 **Tile Behavior**

### **Start Menu Integration**
- **Small Tile** (44×44): Shows in taskbar and small tile view
- **Medium Tile** (71×71): Default Start Menu tile
- **Wide Tile** (310×150): Wide Start Menu tile option
- **Large Tile** (310×310): Large Start Menu tile option

### **Store Listing**
- **Store Logo** (50×50): Used in Microsoft Store search results and listings

## 🔄 **Regenerating Assets**

If the logo changes, regenerate all tiles:

```bash
# Navigate to project root
cd /path/to/klyro

# Regenerate all tile assets
magick src/ui/assets/logo.png -resize 44x44 src/ui/assets/msix-tiles/Square44x44Logo.png
magick src/ui/assets/logo.png -resize 71x71 src/ui/assets/msix-tiles/Square71x71Logo.png
magick src/ui/assets/logo.png -resize 150x150 src/ui/assets/msix-tiles/Square150x150Logo.png
magick src/ui/assets/logo.png -resize 310x150 src/ui/assets/msix-tiles/Wide310x150Logo.png
magick src/ui/assets/logo.png -resize 310x310 src/ui/assets/msix-tiles/LargeTile.png
magick src/ui/assets/logo.png -resize 50x50 src/ui/assets/msix-tiles/StoreLogo.png
```

## 📚 **References**

- [Microsoft Store Policy 10.1.1.11](https://docs.microsoft.com/en-us/windows/uwp/controls-and-patterns/tiles-and-notifications-app-assets)
- [UWP App Assets Guidelines](https://docs.microsoft.com/en-us/windows/uwp/controls-and-patterns/tiles-and-notifications-app-assets)
- [App Icon and Logo Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/app-icons-and-logos)

This implementation ensures full compliance with Microsoft Store tile requirements and provides a professional, branded experience for Klyro users.
