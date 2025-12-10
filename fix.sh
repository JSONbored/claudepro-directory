#!/bin/bash
PLIST="/Library/Preferences/com.apple.networkextension.plist’
BACKUP="$PLIST.bak’

echo ‘📦 Create backup...’
[ -e ‘$BACKUP’ ] || cp ‘$PLIST’ ‘$BACKUP’ && echo ‘✅ Backup created: $BACKUP’

echo ‘📖 Search plist for NextDNS...’
/usr/libexec/PlistBuddy -c ‘Print’ ‘$PLIST’ 2>/dev/null | grep -i nextdns | while read -r line; do
    key=$(echo ‘$line’ | awk -F= ‘{print $1}’ | xargs)
    echo ‘🗑️ Remove key: $key’
    /usr/libexec/PlistBuddy -c ‘Delete :$key’ ‘$PLIST’ 2>/dev/null
done

sudo launchctl kickstart -k system/com.apple.nehelper
echo ‘✅ Done.’
