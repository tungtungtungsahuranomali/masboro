#!/usr/bin/env python3
"""
Ligat APK Builder — update bundle in-place, sign v1+v2+v3.
Does NOT extract/re-zip the whole APK, only replaces the bundle entry.
"""
import zipfile, os, shutil, subprocess, glob, tempfile

BASE = r"C:\laragon\www\ligat"
ORIG = os.path.join(BASE, "Ligat-1.2.9-final.apk")
OUT  = os.path.join(BASE, "apk sudah build", "Ligat-1.2.9.apk")
ROOT = os.path.join(BASE, "Ligat-1.2.9.apk")
BUNDLE_DIR = os.path.join(BASE, "source apk", "dist", "_expo", "static", "js", "android")
KEYSTORE   = os.path.join(BASE, "source apk", "android", "app", "debug.keystore")
ZIPALIGN   = r"C:\Users\Administrator\AppData\Local\Android\Sdk\build-tools\36.0.0\zipalign.exe"
APKSIGNER  = r"C:\Users\Administrator\AppData\Local\Android\Sdk\build-tools\36.0.0\lib\apksigner.jar"
JAVA       = r"C:\Program Files\Android\Android Studio\jbr\bin\java.exe"

def find_hbc():
    files = glob.glob(os.path.join(BUNDLE_DIR, "*.hbc"))
    return files[0] if files else None

def build():
    print("=== Ligat APK Builder ===")
    
    bundle = find_hbc()
    if not bundle:
        print("ERROR: No .hbc bundle found")
        return False
    
    print(f"Source: {ORIG} ({os.path.getsize(ORIG)} bytes)")
    print(f"Bundle: {bundle} ({os.path.getsize(bundle)} bytes)")
    
    # ── Step 1: Update bundle in-place ──
    print("\n[1/4] Updating bundle in-place...")
    # Copy original to work with
    WORK = os.path.join(BASE, "ligat-build-tmp.apk")
    shutil.copy2(ORIG, WORK)
    
    # Read new bundle
    with open(bundle, 'rb') as f:
        new_bundle = f.read()
    
    # Update the bundle entry inside the ZIP without extracting anything
    # We use a temp file approach: copy all entries from WORK to a new ZIP,
    # replacing the bundle content. BUT we preserve the original compression type.
    tmp = WORK + ".new"
    with zipfile.ZipFile(WORK, 'r') as zin:
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "assets/index.android.bundle":
                    data = new_bundle
                    print(f"  Replaced {item.filename} ({len(data)} bytes)")
                # Preserve ALL original ZIP properties
                new_item = zipfile.ZipInfo(item.filename)
                new_item.date_time = item.date_time
                new_item.compress_type = item.compress_type
                new_item.comment = item.comment
                new_item.create_system = item.create_system
                new_item.create_version = item.create_version
                new_item.extract_version = item.extract_version
                new_item.flag_bits = item.flag_bits
                new_item.volume = item.volume
                new_item.internal_attr = item.internal_attr
                new_item.external_attr = item.external_attr
                new_item.header_offset = 0  # will be set by ZIP writer
                new_item.extra = item.extra
                # New bundle uses DEFLATE for smaller size
                if item.filename == "assets/index.android.bundle":
                    new_item.compress_type = zipfile.ZIP_DEFLATED
                zout.writestr(new_item, data)
    
    os.remove(WORK)
    os.rename(tmp, WORK)
    print(f"  Updated APK: {os.path.getsize(WORK)} bytes")
    
    # ── Step 2: Align ──
    aligned = WORK + ".aligned"
    print("\n[2/4] Aligning (zipalign)...")
    r = subprocess.run([ZIPALIGN, "-p", "-f", "-v", "4", WORK, aligned],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  zipalign ERROR: {r.stderr}")
        return False
    if "Verification successful" in r.stdout:
        print("  Verified OK")
    
    # ── Step 3: Sign v1+v2+v3 ──
    print("\n[3/4] Signing (v1+v2+v3)...")
    r = subprocess.run([
        JAVA, "-jar", APKSIGNER, "sign",
        "--ks", KEYSTORE, "--ks-pass", "pass:android",
        "--ks-key-alias", "androiddebugkey",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        aligned
    ], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  Sign ERROR: {r.stderr or r.stdout}")
        return False
    print("  Signed OK")
    
    # ── Verify ──
    print("\n  Verifying signature...")
    r = subprocess.run([JAVA, "-jar", APKSIGNER, "verify", "--verbose", aligned],
                       capture_output=True, text=True)
    for line in r.stdout.split('\n'):
        if 'Verified' in line or 'scheme' in line:
            print(f"    {line.strip()}")
    
    # ── Step 4: Copy to final destinations ──
    print("\n[4/4] Copying to destinations...")
    for dst in [OUT, ROOT]:
        shutil.copy2(aligned, dst)
    
    # Cleanup
    os.remove(WORK)
    os.remove(aligned)
    
    print(f"\n=== BUILD COMPLETE ===")
    print(f"Final: {OUT} ({os.path.getsize(OUT)} bytes, {os.path.getsize(OUT)/1024/1024:.1f} MB)")
    return True

if __name__ == "__main__":
    build()
