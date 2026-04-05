import re, sys

FILE = '/var/www/healthconnect/healthconnect-web/src/components/layout/Topbar.tsx'
content = open(FILE).read()

# Fix 1: 3-level notification response mapping
content = re.sub(
    r"const (list|arr|data|notifs) = r\?\.data\?\.data \?\? r\?\.data \?\? \[\];",
    lambda m: f"const {m.group(1)} = r?.data?.data?.notifications ?? r?.data?.notifications ?? r?.data ?? [];",
    content
)

# Fix 2: check both isRead and read
content = content.replace(
    ".filter((n: any) => !n.isRead)",
    ".filter((n: any) => !n.isRead && !n.read)"
)

# Fix 3: poll every 15s instead of 60s
content = content.replace("60_000", "15_000")
content = content.replace("30_000", "15_000")

# Fix 4: add visibilitychange listener if missing
if 'visibilitychange' not in content and 'setInterval' in content:
    content = content.replace(
        "return () => {\n      if (pollRef.current) clearInterval(pollRef.current);",
        """const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifications(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisible);"""
    )

# Fix 5: markAllRead sets both fields
content = content.replace(
    "isRead: true })))",
    "isRead: true, read: true }))"
)

open(FILE, 'w').write(content)
print("✅ Patient Topbar fixed")
print("  15s poll:", "15_000" in content)
print("  visibilitychange:", "visibilitychange" in content)
print("  both read fields:", "!n.isRead && !n.read" in content)
