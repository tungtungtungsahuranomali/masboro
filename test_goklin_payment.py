import urllib.request, json, io, os, sys

# 1. Login
data = json.dumps({'whatsapp': '0812345678', 'password': '123qwe'}).encode()
req = urllib.request.Request('http://localhost/ligat-api/api/login', data=data, headers={'Content-Type': 'application/json'})
r = json.loads(urllib.request.urlopen(req).read())
token = r['data']['token']
print('[1] Login: OK')

# 2. Create order
order_data = json.dumps({
    'durasi': 2, 'harga': 250000,
    'lokasi': 'Jl. Test No. 123',
    'latitude': '-7.250445', 'longitude': '112.768845',
    'jam_pesan': '2026-05-22 10:00:00',
}).encode()
req2 = urllib.request.Request('http://localhost/ligat-api/api/goklin/order', data=order_data, headers={
    'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'
})
r2 = json.loads(urllib.request.urlopen(req2).read())
order_id = r2['data']['id']
kode = r2['data']['kode_order']
print(f'[2] Order created: {kode}')

# 3. Get bank info
req3 = urllib.request.Request('http://localhost/ligat-api/api/goklin/bank-info')
r3 = json.loads(urllib.request.urlopen(req3).read())
bank = r3['data']
print(f'[3] Bank info: {bank["nama_bank"]} {bank["no_rekening"]} a.n {bank["atas_nama"]}')

# 4. Upload payment proof
boundary = '----TestBoundary'
body = b'--' + boundary.encode() + b'\r\n'
body += b'Content-Disposition: form-data; name="bukti_bayar"; filename="test.jpg"\r\n'
body += b'Content-Type: image/jpeg\r\n\r\n'
# Minimal valid JPEG (1x1 pixel)
body += b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x11\x04\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xc4\x00\x1f\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05\x04\x04\x00\x01\x02\x77\x00\x01\x02\x03\x11\x04\x05!1\x06\x12AQ\x07aq\x13"2\x08\x14B\x81\x91\xa1\xb1\xc1\t#3R\x15\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xa1\xf7\xff\xd9'
body += b'\r\n--' + boundary.encode() + b'--\r\n'

req4 = urllib.request.Request(f'http://localhost/ligat-api/api/goklin/order/{order_id}/bayar', data=body, headers={
    'Authorization': f'Bearer {token}',
    'Content-Type': f'multipart/form-data; boundary={boundary}',
})
try:
    r4 = json.loads(urllib.request.urlopen(req4).read())
    print(f'[4] Payment upload: {r4["message"]}')
    print(f'    Status now: {r4["data"]["status"]}')
except urllib.error.HTTPError as e:
    error_body = json.loads(e.read())
    print(f'[4] Payment FAILED: {error_body.get("message", error_body)}')
    sys.exit(1)

print()
print('=== ALL FLOW TESTS PASSED ===')
