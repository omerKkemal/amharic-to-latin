import eel
import unicodedata
import os
import json
import base64
import shutil
from pathlib import Path
from PIL import Image
import io
from docx import Document
from docx.shared import Inches, Cm
from screeninfo import get_monitors

# ---------- Transliteration mapping ----------
base_consonants = {
    'ሀ': 'h', 'ለ': 'l', 'ሐ': 'h', 'መ': 'm', 'ሠ': 's',
    'ረ': 'r', 'ሰ': 's', 'ሸ': 'sh', 'ቀ': 'q', 'በ': 'b',
    'ተ': 't', 'ቸ': 'ch', 'ኀ': 'h', 'ነ': 'n', 'ኘ': 'ny',
    'አ': 'ə',
    'ከ': 'k', 'ኸ': 'h', 'ወ': 'w', 'ዐ': 'ə',
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

extra_mapping = {
    'ቈ': 'qwa', 'ቊ': 'qwi', 'ቋ': 'qwa', 'ቌ': 'qwe', 'ቍ': 'qw',
    'ኈ': 'hwa', 'ኊ': 'hwi', 'ኋ': 'hwa', 'ኌ': 'hwe', 'ኍ': 'hw',
    'ዀ': 'hwa', 'ዂ': 'hwi', 'ዃ': 'hwa', 'ዄ': 'hwe',
    'ጐ': 'gwa', 'ጒ': 'gwi', 'ጓ': 'gwa', 'ጔ': 'gwe', 'ጕ': 'gw',
}
amharic_to_sound.update(extra_mapping)

@eel.expose
def amharic_to_english_sound(text: str) -> str:
    result = []
    for ch in text:
        result.append(amharic_to_sound.get(ch, ch))
    return ''.join(result)

# ---------- Project Management ----------
PROJECTS_DIR = Path(__file__).parent / "projects"
PROJECTS_DIR.mkdir(exist_ok=True)

def _get_project_path(name: str) -> Path:
    if not name:
        raise ValueError("Project name cannot be empty or None")
    safe_name = "".join(c for c in str(name) if c.isalnum() or c in " ._-")
    if not safe_name.strip():
        safe_name = "unnamed"
    project_path = PROJECTS_DIR / safe_name
    project_path.mkdir(exist_ok=True)
    return project_path

def _get_metadata_path(project_path: Path) -> Path:
    return project_path / "metadata.json"

def _load_metadata(project_path: Path) -> dict:
    meta_path = _get_metadata_path(project_path)
    if meta_path.exists():
        with open(meta_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"converted_text": "", "photos": []}

def _save_metadata(project_path: Path, data: dict):
    meta_path = _get_metadata_path(project_path)
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@eel.expose
def list_projects():
    projects = []
    for item in PROJECTS_DIR.iterdir():
        if item.is_dir() and _get_metadata_path(item).exists():
            projects.append(item.name)
    return projects

@eel.expose
def create_project(name: str) -> bool:
    if not name:
        return False
    try:
        project_path = _get_project_path(name)
        if _get_metadata_path(project_path).exists():
            return False
        _save_metadata(project_path, {"converted_text": "", "photos": []})
        return True
    except Exception:
        return False

@eel.expose
def delete_project(project_name: str) -> bool:
    if not project_name:
        return False
    try:
        project_path = _get_project_path(project_name)
        if project_path.exists():
            shutil.rmtree(project_path)
            return True
        return False
    except Exception:
        return False

@eel.expose
def get_project_data(project_name: str):
    if not project_name:
        return {"converted_text": "", "photos": []}
    try:
        project_path = _get_project_path(project_name)
        metadata = _load_metadata(project_path)
        converted_text = metadata.get("converted_text", "")
        photos = []
        for photo_rel in metadata.get("photos", []):
            photo_path = project_path / photo_rel
            if photo_path.exists():
                try:
                    with Image.open(photo_path) as img:
                        img.thumbnail((200, 200))
                        buffered = io.BytesIO()
                        img.save(buffered, format="JPEG" if img.format != 'PNG' else "PNG")
                        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                        mime = "image/jpeg" if img.format != 'PNG' else "image/png"
                        photos.append({
                            "name": photo_rel,
                            "thumb": f"data:{mime};base64,{img_base64}"
                        })
                except Exception:
                    photos.append({"name": photo_rel, "thumb": ""})
            else:
                photos.append({"name": photo_rel, "thumb": ""})
        return {"converted_text": converted_text, "photos": photos}
    except Exception as e:
        print(f"Error in get_project_data: {e}")
        return {"converted_text": "", "photos": []}

@eel.expose
def upload_photos(project_name: str, photo_data_list: list):
    if not project_name:
        return []
    try:
        project_path = _get_project_path(project_name)
        metadata = _load_metadata(project_path)
        saved_names = []
        for item in photo_data_list:
            filename = item.get('name', '')
            if not filename:
                continue
            safe_filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
            if not safe_filename:
                continue
            data_url = item.get('data', '')
            if ',' in data_url:
                base64_data = data_url.split(',', 1)[1]
            else:
                base64_data = data_url
            try:
                img_data = base64.b64decode(base64_data)
                file_path = project_path / safe_filename
                # Avoid duplicate names
                counter = 1
                original_path = file_path
                while file_path.exists():
                    stem = original_path.stem
                    suffix = original_path.suffix
                    file_path = original_path.parent / f"{stem}_{counter}{suffix}"
                    counter += 1
                with open(file_path, 'wb') as f:
                    f.write(img_data)
                saved_names.append(file_path.name)
            except Exception:
                continue
        
        # Preserve order: append new photos to the end of existing list
        existing_photos = metadata.get("photos", [])
        for name in saved_names:
            if name not in existing_photos:
                existing_photos.append(name)
        metadata["photos"] = existing_photos
        _save_metadata(project_path, metadata)
        return saved_names
    except Exception:
        return []

@eel.expose
def save_converted_text(project_name: str, text: str):
    if not project_name:
        return False
    try:
        project_path = _get_project_path(project_name)
        metadata = _load_metadata(project_path)
        metadata["converted_text"] = text
        _save_metadata(project_path, metadata)
        return True
    except Exception:
        return False

@eel.expose
def export_project_to_docx(project_name: str) -> str:
    if not project_name:
        return ""
    try:
        project_path = _get_project_path(project_name)
        metadata = _load_metadata(project_path)
        doc = Document()
        
        # Title
        doc.add_heading(f"Project: {project_name}", 0)
        
        # Converted text section
        doc.add_heading("Converted Text (Latin Harari)", level=1)
        doc.add_paragraph(metadata.get("converted_text", "") or "(No text saved)")
        
        # Photos section with grid layout (3 columns)
        photos = metadata.get("photos", [])
        if photos:
            doc.add_heading("Photos", level=1)
            
            cols = 3
            rows = (len(photos) + cols - 1) // cols
            
            # Create a table with rows and cols
            table = doc.add_table(rows=rows, cols=cols)
            table.style = 'Table Grid'
            table.autofit = False
            
            # Set column widths (equal)
            for cell in table.columns:
                cell.width = Cm(5.5)
            
            # Fill table with photos
            for idx, photo_rel in enumerate(photos):
                row = idx // cols
                col = idx % cols
                cell = table.cell(row, col)
                cell.paragraphs[0].clear()  # Remove default empty paragraph
                
                photo_path = project_path / photo_rel
                if photo_path.exists():
                    try:
                        run = cell.paragraphs[0].add_run()
                        run.add_picture(str(photo_path), width=Cm(5.0))
                        cell.add_paragraph(photo_rel, style='Caption')
                    except Exception:
                        cell.text = f"[Could not embed: {photo_rel}]"
                else:
                    cell.text = f"[Missing: {photo_rel}]"
        else:
            doc.add_paragraph("No photos attached to this project.")
        
        export_path = project_path / f"{project_name}_export.docx"
        doc.save(str(export_path))
        return str(export_path)
    except Exception as e:
        print(f"Export error: {e}")
        return ""

# ---------- Start the app ----------
eel.init('ui')

try:
    screen = get_monitors()[0]
    screen_width = screen.width - screen.width * 0.1
    screen_height = screen.height - screen.height * 0.1
except:
    screen_width = 1200
    screen_height = 800

eel.start('index.html', size=(int(screen_width), int(screen_height)))