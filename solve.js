// solve.js — drop-in yang lebih cepat untuk csv-reader 1.0.0 (MIT, make.fun).
//
// Semantik, urutan error, dan bentuk jawaban sama persis dengan referensi. Yang diubah hanya cara kerja:
//   - teks dipindai sekali dengan loop karakter; field adalah potongan (slice) teks asli;
//   - satu baris data dirangkai sebagai potongan teks mentah lalu di-escape sekali, bukan per field;
//   - jawaban dirangkai langsung sebagai teks JSON (runJson), jadi driver tidak membangun ribuan array
//     baris lalu men-serialize ulang;
//   - run(input) tetap ada sebagai kontraknya: ia mengurai teks JSON yang sama.

/** Karakter yang harus di-escape di dalam string JSON: kutip, backslash, kendali, dan semua surrogate. */
const NEEDS_ESCAPE = /["\\\u0000-\u001f\ud800-\udfff]/;

const END = 3;
const COMMA = 1;
const LINE_BREAK = 2;

/** Jawaban satu kasus sebagai teks JSON. */
export function runJson(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let width = -1;
  let hasColumns = false;
  let columnsJson = 'null';
  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  const pushErr = (code) => {
    errors.push(`{"code":"${code}","line":${recordLine},"row":${recordRow}}`);
  };

  while (pos < n) {
    // Baris tanpa karakter bukan record.
    for (;;) {
      if (pos >= n) break;
      const c = text.charCodeAt(pos);
      if (c === 10) {
        pos += 1;
        line += 1;
      } else if (c === 13 && pos + 1 < n && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line += 1;
      } else break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && !hasColumns ? null : rows.length;

    // Field satu baris: teks mentahnya, dan apakah ia mengandung hal yang perlu di-escape.
    const fields = [];
    let firstQuoted = false;
    let ended;

    for (;;) {
      const isFirst = fields.length === 0;
      const quoted = text.charCodeAt(pos) === 34;
      if (isFirst) firstQuoted = quoted;
      let value = '';
      let junkAdded = 0;

      if (!quoted) {
        let seg = pos;
        for (;;) {
          for (;;) {
            if (pos >= n) break;
            const c = text.charCodeAt(pos);
            if (c === 44 || c === 10 || c === 13) break;
            pos += 1;
          }
          if (pos > seg) value = value === '' ? text.slice(seg, pos) : value + text.slice(seg, pos);
          junkAdded += pos - seg;
          if (pos >= n) {
            ended = END;
            break;
          }
          const c = text.charCodeAt(pos);
          if (c === 44) {
            pos += 1;
            ended = COMMA;
            break;
          }
          if (c === 10) {
            pos += 1;
            line += 1;
            ended = LINE_BREAK;
            break;
          }
          if (pos + 1 < n && text.charCodeAt(pos + 1) === 10) {
            pos += 2;
            line += 1;
            ended = LINE_BREAK;
            break;
          }
          // CR tunggal di luar kutip: dibuang.
          pushErr('stray_cr');
          pos += 1;
          seg = pos;
        }
      } else {
        const open = pos;
        const openLine = line;
        let i = pos + 1;
        let seg = i;
        let closed = false;
        for (;;) {
          if (i >= n) break;
          const c = text.charCodeAt(i);
          if (c === 34) {
            if (i + 1 < n && text.charCodeAt(i + 1) === 34) {
              value = (value === '' ? text.slice(seg, i) : value + text.slice(seg, i)) + '"';
              i += 2;
              seg = i;
              continue;
            }
            value = value === '' ? text.slice(seg, i) : value + text.slice(seg, i);
            i += 1;
            closed = true;
            break;
          }
          if (c === 13) {
            value = (value === '' ? text.slice(seg, i) : value + text.slice(seg, i)) + '\n';
            line += 1;
            i += i + 1 < n && text.charCodeAt(i + 1) === 10 ? 2 : 1;
            seg = i;
            continue;
          }
          if (c === 10) {
            line += 1;
            value = (value === '' ? text.slice(seg, i) : value + text.slice(seg, i)) + '\n';
            i += 1;
            seg = i;
            continue;
          }
          i += 1;
        }

        if (!closed) {
          // Kutip tak pernah menutup: jadi karakter biasa, teks sesudahnya dibaca lagi sebagai tak berkutip.
          pos = open + 1;
          line = openLine;
          pushErr('unterminated_quote');
          let seg2 = pos;
          value = '"';
          for (;;) {
            for (;;) {
              if (pos >= n) break;
              const c = text.charCodeAt(pos);
              if (c === 44 || c === 10 || c === 13) break;
              pos += 1;
            }
            if (pos > seg2) value = value + text.slice(seg2, pos);
            if (pos >= n) {
              ended = END;
              break;
            }
            const c = text.charCodeAt(pos);
            if (c === 44) {
              pos += 1;
              ended = COMMA;
              break;
            }
            if (c === 10) {
              pos += 1;
              line += 1;
              ended = LINE_BREAK;
              break;
            }
            if (pos + 1 < n && text.charCodeAt(pos + 1) === 10) {
              pos += 2;
              line += 1;
              ended = LINE_BREAK;
              break;
            }
            pushErr('stray_cr');
            pos += 1;
            seg2 = pos;
          }
          fields.push(value);
          if (ended !== COMMA) break;
          continue;
        }

        pos = i;
        if (pos >= n) {
          ended = END;
        } else {
          const c = text.charCodeAt(pos);
          if (c === 44) {
            pos += 1;
            ended = COMMA;
          } else if (c === 10) {
            pos += 1;
            line += 1;
            ended = LINE_BREAK;
          } else if (c === 13 && pos + 1 < n && text.charCodeAt(pos + 1) === 10) {
            pos += 2;
            line += 1;
            ended = LINE_BREAK;
          } else {
            // Sisa sesudah kutip penutup ditambahkan apa adanya sampai koma atau akhir baris.
            let seg2 = pos;
            for (;;) {
              for (;;) {
                if (pos >= n) break;
                const c2 = text.charCodeAt(pos);
                if (c2 === 44 || c2 === 10 || c2 === 13) break;
                pos += 1;
              }
              if (pos > seg2) value = value === '' ? text.slice(seg2, pos) : value + text.slice(seg2, pos);
              junkAdded += pos - seg2;
              if (pos >= n) {
                ended = END;
                break;
              }
              const c2 = text.charCodeAt(pos);
              if (c2 === 44) {
                pos += 1;
                ended = COMMA;
                break;
              }
              if (c2 === 10) {
                pos += 1;
                line += 1;
                ended = LINE_BREAK;
                break;
              }
              if (pos + 1 < n && text.charCodeAt(pos + 1) === 10) {
                pos += 2;
                line += 1;
                ended = LINE_BREAK;
                break;
              }
              pushErr('stray_cr');
              pos += 1;
              seg2 = pos;
            }
            if (junkAdded > 0) pushErr('quote_junk');
          }
        }
      }

      fields.push(value);
      if (ended !== COMMA) break;
    }

    if (fields.length === 1 && fields[0] === '' && !firstQuoted) continue;

    if (width < 0) width = fields.length;
    if (header && !hasColumns) {
      columnsJson = '["' + rowJson(fields) + '"]';
      hasColumns = true;
      continue;
    }
    if (fields.length < width) {
      const got = fields.length;
      errors.push(`{"code":"short_row","line":${recordLine},"row":${recordRow},"fields":${got}}`);
      for (let k = got; k < width; k++) fields.push('');
    } else if (fields.length > width) {
      const extra = fields.splice(width);
      errors.push(`{"code":"long_row","line":${recordLine},"row":${recordRow},"extra":["${rowJson(extra)}"]}`);
    }
    rows.push('["' + rowJson(fields) + '"]');
  }

  return (
    '{"columns":' + (header ? (columnsJson === 'null' ? '[]' : columnsJson) : 'null') +
    ',"rows":[' + rows.join(',') + ']' +
    ',"errors":[' + errors.join(',') + ']}'
  );
}

/** Isi satu baris JSON: setiap field di-escape bila perlu, lalu disambung dengan ",". */
function rowJson(fields) {
  const n = fields.length;
  if (n === 0) return '';
  let out = '';
  for (let i = 0; i < n; i++) {
    const f = fields[i];
    const s = NEEDS_ESCAPE.test(f) ? JSON.stringify(f).slice(1, -1) : f;
    out = i === 0 ? s : out + '","' + s;
  }
  return out;
}

/** Kontraknya: jawaban satu kasus sebagai nilai JSON. */
export function run(input) {
  return JSON.parse(runJson(input));
}
