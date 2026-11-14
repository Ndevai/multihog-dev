# A remote ZIP read by explicit byte ranges (GitHub's file host refuses suffix ranges): the end record, the central directory,
# then each wanted member's local header and data. Stored or deflated members.
import struct, zlib, requests
class RangeZip:
    def __init__(self, url):
        self.url = url; r = requests.get(url, headers={'Range': 'bytes=0-0'}, timeout=60); self.size = int(r.headers['Content-Range'].split('/')[1])
        tail = self.get(max(0, self.size - 65536), self.size - 1); i = tail.rfind(b'PK\x05\x06')
        cd_size, cd_off = struct.unpack('<II', tail[i + 12:i + 20])
        if cd_off == 0xFFFFFFFF or cd_size == 0xFFFFFFFF:      # ZIP64: the locator and the ZIP64 end record
            j = tail.rfind(b'PK\x06\x07'); z64 = struct.unpack('<Q', tail[j + 8:j + 16])[0]; rec = self.get(z64, z64 + 55)
            cd_size, cd_off = struct.unpack('<QQ', rec[40:56])
        cd = self.get(cd_off, cd_off + cd_size - 1); self.members = {}; p = 0
        while cd[p:p + 4] == b'PK\x01\x02':
            meth, = struct.unpack('<H', cd[p + 10:p + 12]); csize, usize = struct.unpack('<II', cd[p + 20:p + 28]); nl, el, cl = struct.unpack('<HHH', cd[p + 28:p + 34]); off, = struct.unpack('<I', cd[p + 42:p + 46])
            name = cd[p + 46:p + 46 + nl].decode('utf8', 'replace'); extra = cd[p + 46 + nl:p + 46 + nl + el]
            vals = [csize, usize, off]; q = 0
            while q + 4 <= len(extra):                         # ZIP64 extra field: the 0xFFFFFFFF values in order (usize, csize, offset)
                hid, hl = struct.unpack('<HH', extra[q:q + 4])
                if hid == 1:
                    data = extra[q + 4:q + 4 + hl]; k = 0
                    if usize == 0xFFFFFFFF: vals[1] = struct.unpack('<Q', data[k:k + 8])[0]; k += 8
                    if csize == 0xFFFFFFFF: vals[0] = struct.unpack('<Q', data[k:k + 8])[0]; k += 8
                    if off == 0xFFFFFFFF: vals[2] = struct.unpack('<Q', data[k:k + 8])[0]; k += 8
                q += 4 + hl
            self.members[name] = (meth, *vals); p += 46 + nl + el + cl
    def get(self, a, b):
        r = requests.get(self.url, headers={'Range': f'bytes={a}-{b}'}, timeout=300); r.raise_for_status(); return r.content
    def read(self, name):
        meth, csize, usize, off = self.members[name]; h = self.get(off, off + 29); nl, el = struct.unpack('<HH', h[26:30])
        data = self.get(off + 30 + nl + el, off + 30 + nl + el + csize - 1)
        return data if meth == 0 else zlib.decompress(data, -15)
if __name__ == '__main__':
    z = RangeZip('https://github.com/facebookresearch/ears_dataset/releases/download/dataset/p002.zip')
    emo = sorted(n for n in z.members if 'emo_' in n and 'freeform' in n)
    print(len(z.members), 'members;', len(emo), 'emotional free speech:', [(n, round(z.members[n][2] / 1e6, 1)) for n in emo[:6]])

def read_pcm_slice(z, name, start_s, seconds):
    """A stored (uncompressed) WAV member's samples from start_s for `seconds`, by range: its header, then only those bytes."""
    import numpy as np
    meth, csize, usize, off = z.members[name]
    if meth != 0: raise ValueError('compressed member')
    h = z.get(off, off + 29); nl, el = struct.unpack('<HH', h[26:30]); base = off + 30 + nl + el
    head = z.get(base, base + 4095); p = 12; fmt = None
    while p + 8 <= len(head):
        cid, size = head[p:p + 4], struct.unpack('<I', head[p + 4:p + 8])[0]
        if cid == b'fmt ': fmt = struct.unpack('<HHIIHH', head[p + 8:p + 24])
        if cid == b'data': data0 = base + p + 8; break
        p += 8 + size + (size & 1)
    tag, ch, fs, bits = fmt[0], fmt[1], fmt[2], fmt[5]; bpf = ch * bits // 8
    a = data0 + int(start_s * fs) * bpf; b = a + int(seconds * fs) * bpf - 1; raw = z.get(a, b)
    if tag == 3 or (tag == 0xFFFE and bits == 32 and False): x = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    elif bits == 16: x = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768
    elif bits == 24:
        u = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3).astype(np.int32); v = u[:, 0] | (u[:, 1] << 8) | (u[:, 2] << 16); v = np.where(v >= 1 << 23, v - (1 << 24), v); x = v.astype(np.float64) / (1 << 23)
    elif bits == 32: x = np.frombuffer(raw, dtype='<i4').astype(np.float64) / 2 ** 31
    else: raise ValueError(f'{bits}-bit')
    return (x.reshape(-1, ch).mean(1) if ch > 1 else x), fs, (bits, tag)
