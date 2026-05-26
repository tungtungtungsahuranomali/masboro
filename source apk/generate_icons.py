from PIL import Image
import os

src = "assets/icon.png"
if not os.path.exists(src):
    src = "icon.png"

icon = Image.open(src)
print(f"Source: {src} | Size: {icon.size} | Mode: {icon.mode}")

# 1. FAVICON (48x48)
fav = icon.resize((48, 48), Image.LANCZOS)
fav.save("assets/favicon.png")
print(f"favicon.png: 48x48 ({os.path.getsize('assets/favicon.png')/1024:.1f} KB)")

# 2. SPLASH ICON (512x512 centered on 1024x1024)
splash = icon.resize((512, 512), Image.LANCZOS)
bg = Image.new("RGBA", (1024, 1024), (255, 255, 255, 0))
x = (1024 - 512) // 2
y = (1024 - 512) // 2
bg.paste(splash, (x, y), splash if splash.mode == "RGBA" else None)
bg.save("assets/splash-icon.png")
print(f"splash-icon.png: 1024x1024 ({os.path.getsize('assets/splash-icon.png')/1024:.1f} KB)")

# 3. ADAPTIVE ICON FOREGROUND (scale to ~66% safe zone)
target_size = int(1024 * 0.66)
fgr = icon.resize((target_size, target_size), Image.LANCZOS)
fg_bg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
x = (1024 - target_size) // 2
y = (1024 - target_size) // 2
fg_bg.paste(fgr, (x, y), fgr if fgr.mode == "RGBA" else None)
fg_bg.save("assets/android-icon-foreground.png")
print(f"android-icon-foreground.png: 1024x1024 ({os.path.getsize('assets/android-icon-foreground.png')/1024:.1f} KB)")

# 4. ADAPTIVE ICON BACKGROUND (solid color #E6F4FE)
bg_color = Image.new("RGBA", (1024, 1024), (230, 244, 254, 255))
bg_color.save("assets/android-icon-background.png")
print(f"android-icon-background.png: 1024x1024 ({os.path.getsize('assets/android-icon-background.png')/1024:.1f} KB) color #E6F4FE")

# 5. ADAPTIVE ICON MONOCHROME
if icon.mode == "RGBA":
    r, g, b, a = icon.split()
    mono_rgba = Image.new("RGBA", icon.size, (255, 255, 255, 255))
    mono_rgba.putalpha(a)
    mono_resized = mono_rgba.resize((target_size, target_size), Image.LANCZOS)
    mono_bg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    x = (1024 - target_size) // 2
    y = (1024 - target_size) // 2
    mono_bg.paste(mono_resized, (x, y), mono_resized)
    mono_bg.save("assets/android-icon-monochrome.png")
    print(f"android-icon-monochrome.png: 1024x1024 ({os.path.getsize('assets/android-icon-monochrome.png')/1024:.1f} KB)")
else:
    print("Cannot generate monochrome: icon is not RGBA")

print("\nAll icon files generated!")
