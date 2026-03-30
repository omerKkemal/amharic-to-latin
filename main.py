# main.py
import eel
import unicodedata

# ---------- Transliteration mapping ----------
base_consonants = {
    'ሀ': 'h', 'ለ': 'l', 'ሐ': 'h', 'መ': 'm', 'ሠ': 's',
    'ረ': 'r', 'ሰ': 's', 'ሸ': 'sh', 'ቀ': 'q', 'በ': 'b',
    'ተ': 't', 'ቸ': 'ch', 'ኀ': 'h', 'ነ': 'n', 'ኘ': 'ny',
    'አ': 'ə',   # glottal stop, becomes a vowel
    'ከ': 'k', 'ኸ': 'h', 'ወ': 'w', 'ዐ': 'ə',   # same
    'ዘ': 'z', 'ዠ': 'zh', 'የ': 'y', 'ደ': 'd',
    'ጀ': 'j', 'ገ': 'g', 'ጠ': 't', 'ጨ': 'ch',
    'ጰ': 'p', 'ጸ': 'ts', 'ፀ': 'ts', 'ፈ': 'f', 'ፐ': 'p',
}

vowel_suffixes = ['a', 'u', 'i', 'a', 'e', '', 'o']

amharic_to_sound = {}
for first_order_char, cons in base_consonants.items():
    base_code = ord(first_order_char)
    for order in range(7):
        char_code = base_code + order
        if 0x1200 <= char_code <= 0x137F:
            syllable = chr(char_code)
            try:
                name = unicodedata.name(syllable)
                if 'ETHIOPIC' not in name:
                    continue
            except (ValueError, TypeError):
                continue
            sound = cons + vowel_suffixes[order]
            amharic_to_sound[syllable] = sound

# Labiovelars and extras
extra_mapping = {
    'ቈ': 'qwa', 'ቊ': 'qwi', 'ቋ': 'qwa', 'ቌ': 'qwe', 'ቍ': 'qw',
    'ኈ': 'hwa', 'ኊ': 'hwi', 'ኋ': 'hwa', 'ኌ': 'hwe', 'ኍ': 'hw',
    'ዀ': 'hwa', 'ዂ': 'hwi', 'ዃ': 'hwa', 'ዄ': 'hwe',
    'ጐ': 'gwa', 'ጒ': 'gwi', 'ጓ': 'gwa', 'ጔ': 'gwe', 'ጕ': 'gw',
}
amharic_to_sound.update(extra_mapping)

@eel.expose
def amharic_to_english_sound(text: str) -> str:
    """Convert Amharic text to Latin sound representation."""
    result = []
    for ch in text:
        result.append(amharic_to_sound.get(ch, ch))
    return ''.join(result)

# Start the Eel app
eel.init('ui')
eel.start('index.html', size=(900, 900))