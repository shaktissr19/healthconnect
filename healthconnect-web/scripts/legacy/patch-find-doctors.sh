#!/bin/bash
# Patch FindDoctorsLandingPage.tsx — change blue hero + specialist cards to warm grey
# Run from /var/www/healthconnect/healthconnect-web

FILE="src/components/dashboard/pages/FindDoctorsLandingPage.tsx"

# 1. Hero background: dark navy → warm white card
sed -i "s/background: \`linear-gradient(135deg, #0D3349 0%, #0F4C6B 60%, #1A3A6B 100%)\`/background: '#FDFCFB'/g" $FILE
sed -i "s/background:'linear-gradient(135deg, #0D3349 0%, #0F4C6B 60%, #1A3A6B 100%)'/background:'#FDFCFB'/g" $FILE

# 2. Hero text: white → dark
sed -i "s/color:'#FFFFFF', fontSize:22/color:'#1E293B', fontSize:22/g" $FILE
sed -i "s/color:'rgba(200,225,255/color:'rgba(100,116,139/g" $FILE
sed -i "s/color:'rgba(168,200,255/color:'rgba(100,116,139/g" $FILE

# 3. Specialist cards: light blue bg (#DBEAFE / EAF0F8) → warm grey
sed -i "s/background: '#DBEAFE'/background: '#F5F4F0'/g" $FILE
sed -i "s/background:'#DBEAFE'/background:'#F5F4F0'/g" $FILE
sed -i "s/background: 'rgba(219,234,254/background: 'rgba(245,244,240/g" $FILE
sed -i "s/background:'rgba(219,234,254/background:'rgba(245,244,240/g" $FILE
sed -i "s/#EAF0F8/#F5F4F0/g" $FILE
sed -i "s/#EBF4FF/#F5F4F0/g" $FILE
sed -i "s/#DBEAFE/#F5F4F0/g" $FILE

# 4. Card borders: blue tint → warm neutral
sed -i "s/border:'1px solid #C8DFF0'/border:'1px solid #E8E6DF'/g" $FILE
sed -i "s/border: '1px solid #C8DFF0'/border: '1px solid #E8E6DF'/g" $FILE
sed -i "s/#BFDBFE/#E8E6DF/g" $FILE

# 5. Stat cards: white + blue border → warm
sed -i "s/background:'#FFFFFF', border:'1px solid #C8DFF0'/background:'#FDFCFB', border:'1px solid #E8E6DF'/g" $FILE
sed -i "s/background: '#FFFFFF', border: '1px solid #C8DFF0'/background: '#FDFCFB', border: '1px solid #E8E6DF'/g" $FILE

echo "✅ FindDoctorsLandingPage patched"
