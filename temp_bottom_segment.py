# -*- coding: utf-8 -*-
from pathlib import Path
text = Path(r'C:\Users\fower\Desktop\meridesignhouse\src\components\layout\BottomTabBar.tsx').read_text(encoding='utf-8')
start = text.index('// Scroll detection for navbar shrinking')
end = text.index('// Load cart and favorite counts')
print(text[start:end])
