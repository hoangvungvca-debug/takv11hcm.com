from pathlib import Path
import json, re

# Transcribed from the image supplied by the user, not inferred or supplemented.
source = '1792120030245_8378643560307434835_8378643560307434835_00c89f30f95b093facc3e6b457cffe51.webp'
rows = [
    ('Ngô Duy Tân', 1, [], ['0984.536.373']),
    ('Phan Tiến Việt', 2, [], ['0345.180.297']),
    ('Trần Trọng Tâm', 4, [], ['0986.577.272']),
    ('Lê Minh Dũng', 5, [], ['0908.157.400']),
    ('Ngô Anh Thắng', 6, [], ['0979.195.228']),
    ('Phạm Anh Tuấn', 7, [], ['0983.404.407']),
    ('Phan Công Dương', 8, [], ['0963.921.919']),
    ('Đinh Bá Vỹ', 9, [], ['0938.897.279']),
    ('Phan Anh Tuấn', 10, [3], ['0937.955.586']),
    ('Nguyễn Vũ Quang Huy', 11, [], ['0762.125.009']),
    ('Trịnh Mạnh Hùng', 12, [], ['0939.717.248']),
    ('Trần Văn Chiến', 13, [], ['0906.393.575']),
    ('Nguyễn Hồng Thắng', 14, [], ['0945.767.778']),
    ('Nguyễn Hữu Tuấn Linh', 15, [], ['0901.555.304']),
    ('Điều Mạnh Tuấn', 16, [], ['0909.202.787', '0909.625.720']),
    ('Lê Anh Tuấn', 18, [], ['0866.232.066']),
    ('Nguyễn Hoàng Thanh Vũ', 19, [20], ['0933.842.626']),
    ('Nguyễn Thị Quỳnh', 21, [], ['0859.388.824']),
    ('Nguyễn Văn Huy', 22, [], ['0927.682.345']),
    ('Phạm Văn Luận', 23, [], ['0972.972.972']),
    ('Nguyễn Thị Hải Yến', 24, [], ['0982.974.526']),
    ('Đặng Tuấn Anh', 25, [17], ['0987.847.823']),
]
entries = []
for order, (name, primary, secondary, raw_phones) in enumerate(rows, 1):
    phones = [re.sub(r'\D', '', p) for p in raw_phones]
    assert all(re.fullmatch(r'0\d{9}', p) for p in phones)
    area = f'Khu phố {primary}'
    areas = [area] + [f'Khu phố {n}' for n in secondary]
    notes = '; '.join(f'Kiêm nhiệm Khu phố {n}' for n in secondary)
    entries.append(dict(
        id=f'police-tam-thang-{order:02d}', sourceOrder=order, name=name, ward='Phường Tam Thắng',
        neighborhood=area, neighborhoods=areas, area='Phường Tam Thắng · ' + ' · '.join(areas),
        detail='Cảnh sát khu vực', phone='; '.join(phones), phones=phones,
        birthDate='', address='', qualification='', occupation='', note=notes,
        needsReview=False, source=source, sourceLocation=f'STT {order}',
        office={'address': 'Số 2 Trương Văn Bang, phường Tam Thắng, TP. Hồ Chí Minh',
            'dutyPhone': '02543585995', 'effectiveDate': '01/07/2026'}))
assert len(entries) == 22
assert set(area for item in entries for area in item['neighborhoods']) == {f'Khu phố {n}' for n in range(1,26)}
Path('server/data/police.json').write_text(json.dumps({'entries':entries,
    'sources':[{'file':source,'category':'police','count':len(entries)}]},ensure_ascii=False,indent=2)+'\n')
print('Đã chuẩn bị 22 Cảnh sát, 25 khu phố, 3 trường hợp kiêm nhiệm và 23 số di động theo ảnh.')
