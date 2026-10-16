from pathlib import Path
from datetime import datetime, date
import json, re, unicodedata, hashlib, argparse
from docx import Document
import openpyxl
import pdfplumber

parser = argparse.ArgumentParser()
parser.add_argument('--input', default='/home/ubuntu/upload')
parser.add_argument('--output', default='server/data')
args = parser.parse_args()
root, output = Path(args.input), Path(args.output)
output.mkdir(parents=True, exist_ok=True)

def text(value):
    if value is None: return ''
    if isinstance(value, (datetime, date)): return value.strftime('%d/%m/%Y')
    return re.sub(r'\s+', ' ', str(value)).strip()

def fold(value):
    return ''.join(c for c in unicodedata.normalize('NFD', text(value).lower().replace('đ', 'd')) if unicodedata.category(c) != 'Mn')

def phone_info(value):
    raw = str(value or '').strip().lstrip("' ")
    pieces = re.split(r'[\n;/]+', raw)
    numbers = []
    for piece in pieces:
        compact = re.sub(r'[\s.]', '', piece)
        # A note such as '(Côn Đảo)' is not part of the number.
        compact = re.sub(r'\([^)]*\)', '', compact)
        if re.fullmatch(r'0\d{9}', compact) or re.fullmatch(r'02\d{9}', compact):
            numbers.append(compact)
    display = '; '.join(text(piece) for piece in pieces if text(piece))
    if numbers and len(numbers) == len([p for p in pieces if text(p)]): display = '; '.join(numbers)
    return display, list(dict.fromkeys(numbers)), not bool(numbers)

def record(category, filename, location, order, name, ward, neighborhood='', role='', phone='', birth='', address='', qualification='', occupation='', note=''):
    phone, phones, review = phone_info(phone)
    uid = hashlib.sha256(f'{category}|{filename}|{location}'.encode()).hexdigest()[:24]
    return dict(id=uid, sourceOrder=order, name=text(name), ward=ward, neighborhood=neighborhood,
        area=' · '.join(filter(None, [ward, neighborhood])), detail=text(role), phone=phone, phones=phones,
        birthDate=text(birth), address=text(address), qualification=text(qualification), occupation=text(occupation),
        note=text(note), needsReview=review, source=filename, sourceLocation=location)

def find_file(fragment):
    found = [p for p in root.iterdir() if fragment in p.name]
    assert len(found) == 1, (fragment, found)
    return found[0]

def merged_value(sheet, row, col):
    value = sheet.cell(row, col).value
    if value is not None: return value
    for merged in sheet.merged_cells.ranges:
        if merged.min_row <= row <= merged.max_row and merged.min_col <= col <= merged.max_col:
            return sheet.cell(merged.min_row, merged.min_col).value
    return None

jurors, neighborhoods, sources = [], [], []
f = find_file('.docx')
for row in Document(f).tables[0].rows:
    cells = [text(c.text) for c in row.cells]
    if not cells[0].isdigit(): continue
    number = int(cells[0]); address = cells[3]
    compact = re.sub(r'\s+', '', fold(address))
    ward = next((label for token, label in [
        ('phuocthang', 'Phường Phước Thắng'), ('rachdua', 'Phường Rạch Dừa'),
        ('tamthang', 'Phường Tam Thắng'), ('vungtau', 'Phường Vũng Tàu'),
        ('longson', 'Xã Long Sơn'), ('condao', 'Đặc khu Côn Đảo')
    ] if token in compact), '')
    jurors.append(record('jurors', f.name, f'Table 1 / STT {number}', number, cells[1], ward,
        role='Hội thẩm nhân dân', phone=cells[6], birth=cells[2], address=address,
        qualification=cells[4], occupation=cells[5], note='Nhiệm kỳ 2026–2031'))
assert [r['sourceOrder'] for r in jurors] == list(range(1, 43))
sources.append({'file': f.name, 'category': 'jurors', 'count': len(jurors)})

f = find_file('[PhườngPhướcThắng]'); sh = openpyxl.load_workbook(f, data_only=True)['Sheet1']
start = len(neighborhoods); current_kp = ''
for row in range(12, sh.max_row + 1):
    a,b,c,d,e,fv,g = [sh.cell(row, col).value for col in range(1,8)]
    if re.fullmatch(r'Khu phố \d+', text(a), re.I): current_kp = text(a); continue
    if not text(b): continue
    if re.match(r'Tổ\s+\d+', text(d)):
        neighborhoods.append(record('neighborhoods', f.name, f'Sheet1 / row {row}', row, b,
            'Phường Phước Thắng', current_kp, role=f'Tổ trưởng {text(d).lower()}', phone=e, birth=c,
            note=' · '.join(filter(None, [text(fv), text(g)]))))
    elif re.match(r'Trưởng khu phố\s+\d+', text(d), re.I):
        kp = f'Khu phố {re.search(r"\d+", text(d)).group()}'
        neighborhoods.append(record('neighborhoods', f.name, f'Sheet1 / row {row}', row, b,
            'Phường Phước Thắng', kp, role='Trưởng khu phố', phone=e or fv, birth=c, note=text(g)))
assert len(neighborhoods) - start == 70
sources.append({'file': f.name, 'category': 'neighborhoods', 'count': len(neighborhoods)-start})

f = find_file('[PhườngTamThắng]'); wb = openpyxl.load_workbook(f, data_only=True)
sh = next(s for s in wb if s.title.strip() == 'DS trich ngang')
start = len(neighborhoods)
for row in range(7,32):
    a,b,c,d,e,fv,g,h = [merged_value(sh,row,col) for col in range(1,9)]
    if not text(b): continue
    note = ' · '.join(filter(None, [text(h), f'Trưởng ban công tác MT: {text(g)}' if text(g) else '']))
    neighborhoods.append(record('neighborhoods', f.name, f'{sh.title.strip()} / row {row}', int(a), b,
        'Phường Tam Thắng', text(e), role=text(d), phone=fv, birth=c, note=note))
assert len(neighborhoods) - start == 25
sources.append({'file': f.name, 'category': 'neighborhoods', 'count': len(neighborhoods)-start})

f = find_file('[PhườngVũngTàu]'); sh = openpyxl.load_workbook(f, data_only=True)['Phuong 3']
source_rows, mappings = [], {}; old_ward, section_role = '', ''
for row in range(1, sh.max_row + 1):
    a,b,c,d,e,fv,g = [sh.cell(row,col).value for col in range(1,8)]
    if text(b).startswith('PHƯỜNG '): old_ward=text(b).title(); continue
    if text(a).startswith('III.'): section_role='Trưởng khu phố'; continue
    if text(a).startswith('II.'): section_role='Bí thư chi bộ'; continue
    if text(a).startswith('I.'): section_role='Trưởng ban công tác Mặt trận'; continue
    if not text(b) or not isinstance(a,(int,float)) or not old_ward: continue
    old_kp=re.search(r'\d+',text(fv))
    if not old_kp: continue
    key=(old_ward,old_kp.group()); new_kp=re.search(r'\d+',text(g))
    if new_kp: mappings[key]=int(new_kp.group())
    source_rows.append((row,a,b,c,d,e,key))
start=len(neighborhoods)
for row,a,b,c,d,e,key in source_rows:
    number=mappings.get(key)
    # Only use the explicit KP mới mapping, never map by street address.
    kp=f'Khu phố {number}' if number else f'Khu phố {key[1]} (cũ)'
    note=f'{key[0]} (cũ) · Khu phố {key[1]} (cũ)'
    if not number: note+=' · Nguồn chưa ghi khu phố mới'
    role=text(c)
    if not role:
        # These rows are inside the explicit III. Trưởng khu phố section.
        role='Trưởng khu phố'
    neighborhoods.append(record('neighborhoods',f.name,f'Phuong 3 / row {row}',row,b,
        'Phường Vũng Tàu',kp,role=role,phone=e,address=d,note=note))
assert set(mappings.values()) == set(range(1,43))
sources.append({'file': f.name, 'category': 'neighborhoods', 'count':len(neighborhoods)-start})

f=find_file('[PhườngRạchDừa]');start=len(neighborhoods);current_kp='';heading='';ids=[]
with pdfplumber.open(f) as pdf:
    for page_number,page in enumerate(pdf.pages,1):
        for table in page.extract_tables():
            for row in table:
                if row[0] and 'KHU PHỐ' in row[0]:
                    heading=text(row[0]);numbers=re.findall(r'KHU PHỐ\s+(\d+)',heading,re.I)
                    assert numbers,heading
                    current_kp=f'Khu phố {int(numbers[-1])}';continue
                if not text(row[0]).isdigit(): continue
                assert len(row)==6 and current_kp, (page_number,row)
                number=int(text(row[0])); ids.append(number)
                neighborhoods.append(record('neighborhoods',f.name,f'Page {page_number} / STT {number}',number,
                    row[2],'Phường Rạch Dừa',current_kp,role=row[1],phone=row[5],birth=row[3],address=row[4],note=heading))
assert ids == list(range(1,326)), {'missing':sorted(set(range(1,326))-set(ids)), 'count':len(ids)}
sources.append({'file': f.name,'category':'neighborhoods','count':len(neighborhoods)-start})

all_records=jurors+neighborhoods
assert len({r['id'] for r in all_records})==len(all_records)
for record_item in all_records:
    if not record_item['name']:
        record_item['note'] += ' · Họ tên chưa ghi trong tài liệu nguồn'
        record_item['needsReview'] = True
for kind, rows in [('jurors',jurors),('neighborhoods',neighborhoods)]:
    (output / f'{kind}.json').write_text(json.dumps({'entries':rows,'sources':[s for s in sources if s['category']==kind]},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sources':sources,'jurors':len(jurors),'neighborhoods':len(neighborhoods),
    'phonesNeedReview':sum(r['needsReview'] for r in all_records),
    'missingPhone':sum(not r['phone'] for r in all_records)},ensure_ascii=False,indent=2))
