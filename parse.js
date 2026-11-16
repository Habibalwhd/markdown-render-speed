// parse.js — dependency-free ES module, single named export parse(markdown).
// Renders HTML exactly like marked 18.1.3 with default options (GFM on, breaks off).
// Deterministic, no imports, no network. Line-oriented block parser with a container
// stack and column-based tab handling; single-pass inline parser with a delimiter
// stack for emphasis / strikethrough / links.

// ---------------------------------------------------------------- helpers

const NAMED_ENTITIES = {
  'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'", 'nbsp': ' ',
  'copy': '©', 'reg': '®', 'trade': '™', 'hellip': '…', 'mdash': '—', 'ndash': '–',
  'lsquo': '‘', 'rsquo': '’', 'ldquo': '“', 'rdquo': '”', 'laquo': '«', 'raquo': '»',
  'times': '×', 'divide': '÷', 'plusmn': '±', 'deg': '°', 'micro': 'µ', 'para': '¶',
  'sect': '§', 'dagger': '†', 'Dagger': '‡', 'bull': '•', 'middot': '·', 'larr': '←',
  'uarr': '↑', 'rarr': '→', 'darr': '↓', 'harr': '↔', 'crarr': '↵', 'lArr': '⇐',
  'uArr': '⇑', 'rArr': '⇒', 'dArr': '⇓', 'hArr': '⇔', 'forall': '∀', 'part': '∂',
  'exist': '∃', 'empty': '∅', 'nabla': '∇', 'isin': '∈', 'notin': '∉', 'ni': '∋',
  'prod': '∏', 'sum': '∑', 'minus': '−', 'lowast': '∗', 'radic': '√', 'prop': '∝',
  'infin': '∞', 'ang': '∠', 'and': '∧', 'or': '∨', 'cap': '∩', 'cup': '∪',
  'int': '∫', 'there4': '∴', 'sim': '∼', 'cong': '≅', 'asymp': '≈', 'ne': '≠',
  'equiv': '≡', 'le': '≤', 'ge': '≥', 'sub': '⊂', 'sup': '⊃', 'nsub': '⊄',
  'sube': '⊆', 'supe': '⊇', 'oplus': '⊕', 'otimes': '⊗', 'perp': '⊥', 'sdot': '⋅',
  'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ', 'Epsilon': 'Ε', 'Zeta': 'Ζ',
  'Eta': 'Η', 'Theta': 'Θ', 'Iota': 'Ι', 'Kappa': 'Κ', 'Lambda': 'Λ', 'Mu': 'Μ',
  'Nu': 'Ν', 'Xi': 'Ξ', 'Omicron': 'Ο', 'Pi': 'Π', 'Rho': 'Ρ', 'Sigma': 'Σ',
  'Tau': 'Τ', 'Upsilon': 'Υ', 'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω',
  'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'epsilon': 'ε', 'zeta': 'ζ',
  'eta': 'η', 'theta': 'θ', 'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
  'nu': 'ν', 'xi': 'ξ', 'omicron': 'ο', 'pi': 'π', 'rho': 'ρ', 'sigmaf': 'ς',
  'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ', 'chi': 'χ', 'psi': 'ψ',
  'omega': 'ω', 'thetasym': 'ϑ', 'upsih': 'ϒ', 'piv': 'ϖ', 'ensp': ' ', 'emsp': ' ',
  'thinsp': ' ', 'zwnj': '‌', 'zwj': '‍', 'lrm': '‎', 'rlm': '‏', 'sbquo': '‚',
  'bdquo': '„', 'circ': 'ˆ', 'tilde': '˜', 'fnof': 'ƒ', 'Scaron': 'Š', 'scaron': 'š',
  'Yuml': 'Ÿ', 'yuml': 'ÿ', 'OElig': 'Œ', 'oelig': 'œ', 'Yacute': 'Ý', 'yacute': 'ý',
  'THORN': 'Þ', 'thorn': 'þ', 'ETH': 'Ð', 'eth': 'ð', 'Aacute': 'Á', 'aacute': 'á',
  'Acirc': 'Â', 'acirc': 'â', 'Atilde': 'Ã', 'atilde': 'ã', 'Auml': 'Ä', 'auml': 'ä',
  'Aring': 'Å', 'aring': 'å', 'AElig': 'Æ', 'aelig': 'æ', 'Ccedil': 'Ç', 'ccedil': 'ç',
  'Egrave': 'È', 'egrave': 'è', 'Eacute': 'É', 'eacute': 'é', 'Ecirc': 'Ê', 'ecirc': 'ê',
  'Euml': 'Ë', 'euml': 'ë', 'Igrave': 'Ì', 'igrave': 'ì', 'Iacute': 'Í', 'iacute': 'í',
  'Icirc': 'Î', 'icirc': 'î', 'Iuml': 'Ï', 'iuml': 'ï', 'Ntilde': 'Ñ', 'ntilde': 'ñ',
  'Ograve': 'Ò', 'ograve': 'ò', 'Oacute': 'Ó', 'oacute': 'ó', 'Ocirc': 'Ô', 'ocirc': 'ô',
  'Otilde': 'Õ', 'otilde': 'õ', 'Ouml': 'Ö', 'ouml': 'ö', 'Oslash': 'Ø', 'oslash': 'ø',
  'Ugrave': 'Ù', 'ugrave': 'ù', 'Uacute': 'Ú', 'uacute': 'ú', 'Ucirc': 'Û', 'ucirc': 'û',
  'Uuml': 'Ü', 'uuml': 'ü', 'acute': '´', 'cedil': '¸', 'uml': '¨', 'macr': '¯',
  'ordf': 'ª', 'ordm': 'º', 'iexcl': '¡', 'iquest': '¿', 'szlig': 'ß', 'curren': '¤',
  'brvbar': '¦', 'pound': '£', 'yen': '¥', 'cent': '¢', 'euro': '€', 'sup1': '¹',
  'sup2': '²', 'sup3': '³', 'frac14': '¼', 'frac12': '½', 'frac34': '¾', 'not': '¬',
  'shy': '­', 'oline': '‾', 'frasl': '⁄', 'weierp': '℘', 'image': 'ℑ', 'real': 'ℜ',
  'alefsym': 'ℵ', 'lceil': '⌈', 'rceil': '⌉', 'lfloor': '⌊', 'rfloor': '⌋', 'lang': '⟨',
  'rang': '⟩', 'loz': '◊', 'spades': '♠', 'clubs': '♣', 'hearts': '♥', 'diams': '♦',
};

function isSpace(c) { return c === 32 || c === 9; }
function isPunct(c) {
  return (c >= 33 && c <= 47) || (c >= 58 && c <= 64) ||
    (c >= 91 && c <= 96) || (c >= 123 && c <= 126);
}
function isLetter(c) {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
function isDigit(c) { return c >= 48 && c <= 57; }
function isAlnum(c) { return isLetter(c) || isDigit(c); }
// a char that can appear in an email local part (marked's email regex
// is [A-Za-z0-9._+-]+; the broader RFC class is NOT used — e.g. in
// a!b@c.com the email starts at b, not at a). An email can only start at
// a position whose preceding char is NOT one of these.
function isEmailLocalChar(c) {
  return isAlnum(c) || c === 46 || c === 95 || c === 43 || c === 45;
}
function lcCharCode(c) { return (c >= 65 && c <= 90) ? c + 32 : c; }
function isUnicodeWhitespace(c) {
  return c === 32 || c === 9 || c === 10 || c === 11 || c === 12 || c === 13 ||
    c === 0x85 || c === 0xa0 || c === 0x1680 ||
    (c >= 0x2000 && c <= 0x200a) || c === 0x2028 || c === 0x2029 ||
    c === 0x202f || c === 0x205f || c === 0x3000;
}

// decode an entity starting at s[i] === '&'. Returns [decodedString, newIndex]
// or null when no entity is present.
function decodeEntity(s, i) {
  const n = s.length;
  if (i + 1 >= n) return null;
  if (s.charCodeAt(i + 1) === 35) { // # numeric
    let j = i + 2, hex = false;
    if (j < n && (s[j] === 'x' || s[j] === 'X')) { hex = true; j++; }
    const start = j;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (hex ? ((c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70))
              : (c >= 48 && c <= 57)) j++;
      else break;
    }
    if (j === start || j >= n || s[j] !== ';') return null;
    // CommonMark: decimal 1-7 digits, hex 1-6 digits; more digits = not an entity
    if ((hex ? j - start > 6 : j - start > 7)) return null;
    const num = parseInt(s.slice(start, j), hex ? 16 : 10);
    if (isNaN(num)) return null;
    const cp = (num === 0 || num > 0x10FFFF || (num >= 0xD800 && num <= 0xDFFF))
      ? 0xFFFD : num;
    return [String.fromCodePoint(cp), j + 1];
  }
  let j = i + 1;
  while (j < n && j < i + 33) {
    const c = s.charCodeAt(j);
    if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95) j++;
    else break;
  }
  if (j >= n || s[j] !== ';' || j === i + 1) return null;
  const name = s.slice(i + 1, j);
  const val = NAMED_ENTITIES[name];
  if (val === undefined) return [s.slice(i, j + 1), j + 1]; // unknown named entity: pass through verbatim
  return [val, j + 1];
}

// escape text content: & < > " '  (with the entity pass-through rule)
function escapeText(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 38) { // &
      const ent = decodeEntity(s, i);
      if (ent) {
        if (s.charCodeAt(i + 1) === 35) {
          const ch = ent[0];
          if (ch === '"') out += '&quot;';
          else if (ch === "'") out += '&#39;';
          else if (ch === '<') out += '&lt;';
          else if (ch === '>') out += '&gt;';
          else if (ch === '&') out += '&amp;';
          else out += ch;
        }
        else out += s.slice(i, ent[1]);
        i = ent[1] - 1;
      }
      else out += '&amp;';
    } else if (c === 60) out += '&lt;';
    else if (c === 62) out += '&gt;';
    else if (c === 34) out += '&quot;';
    else if (c === 39) out += '&#39;';
    else out += s[i];
  }
  return out;
}

// escape for attribute values (no ' escaping, entity rule applies)
function escapeAttr(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 38) {
      const ent = decodeEntity(s, i);
      if (ent) {
        if (s.charCodeAt(i + 1) === 35) {
          const ch = ent[0];
          if (ch === '"') out += '&quot;';
          else if (ch === '<') out += '&lt;';
          else if (ch === '>') out += '&gt;';
          else if (ch === '&') out += '&amp;';
          else out += ch;
        }
        else out += s.slice(i, ent[1]);
        i = ent[1] - 1;
      }
      else out += '&amp;';
    } else if (c === 60) out += '&lt;';
    else if (c === 62) out += '&gt;';
    else if (c === 34) out += '&quot;';
    else out += s[i];
  }
  return out;
}

// escape code content: all of & < > " ' escaped unconditionally
function escapeCode(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 38) out += '&amp;';
    else if (c === 60) out += '&lt;';
    else if (c === 62) out += '&gt;';
    else if (c === 34) out += '&quot;';
    else if (c === 39) out += '&#39;';
    else out += s[i];
  }
  return out;
}

// encode a URL without decoding backslashes or entities (angle autolinks:
// the href is the raw inner text, URL-encoded as-is)
function rawUrlEncode(s) {
  try { return encodeURI(s).replace(/%25/g, '%'); }
  catch (e) { return s; }
}

// cleanUrl: decode backslash escapes + numeric entities only (named entities
// pass through verbatim), then encodeURI with %25 -> %
function cleanUrl(raw) {
  let s = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    if (c === 92 && i + 1 < raw.length && isPunct(raw.charCodeAt(i + 1))) {
      s += raw[i + 1]; i++;
    } else if (c === 38 && i + 1 < raw.length && raw.charCodeAt(i + 1) === 35) {
      const ent = decodeEntity(raw, i);
      if (ent) { s += ent[0]; i = ent[1] - 1; }
      else s += raw[i];
    } else s += raw[i];
  }
  try { return encodeURI(s).replace(/%25/g, '%'); }
  catch (e) { return s; }
}

// normalize a reference label: collapse whitespace to single space, trim,
// Unicode case-fold.
function normalizeLabel(s) {
  let out = '', lastSpace = false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (isUnicodeWhitespace(c)) {
      if (!lastSpace && out.length > 0) { out += ' '; lastSpace = true; }
    } else { out += s[i]; lastSpace = false; }
  }
  if (out.length > 0 && out[out.length - 1] === ' ') out = out.slice(0, -1);
  // Unicode case folding: sharp s (ß / ẞ) folds to "ss"
  return out.toLowerCase().replace(/ß/g, 'ss');
}

// count columns of leading whitespace (tabs to next multiple of 4)
function wsWidth(s, from, to) {
  let col = 0;
  for (let i = from; i < to; i++) {
    if (s.charCodeAt(i) === 9) col += 4 - (col % 4);
    else col++;
  }
  return col;
}
// Advance over `cols` columns of leading whitespace starting at index `from`
// (whose absolute column is `startCol`). Returns {idx, col, partial} where
// partial is the columns left inside a tab when the target lands inside one
// (same remaining-columns convention as cursorAdvance/matchBlockquote).
function advanceWs(s, from, cols, startCol) {
  let col = startCol || 0, i = from;
  const target = col + cols;
  while (i < s.length && col < target) {
    const c = s.charCodeAt(i);
    if (c === 9) {
      const w = 4 - (col % 4);
      if (col + w > target) return { idx: i, col, partial: col + w - target };
      col += w; i++;
    } else if (c === 32) { col++; i++; }
    else break;
  }
  return { idx: i, col, partial: 0 };
}

// ---------------------------------------------------------------- inline parser

// Node types: 0 text, 1 code, 2 raw html, 3 hard break, 4 delimiter,
// 5 link, 6 soft break.
function txt(s) { return { t: 0, s }; }

function isWhiteBefore(s, i) {
  return i === 0 || isUnicodeWhitespace(s.charCodeAt(i - 1));
}
function isWhiteAfter(s, i) {
  return i >= s.length || isUnicodeWhitespace(s.charCodeAt(i));
}
// Unicode punctuation for flanking: ASCII punctuation plus the Unicode
// general categories P (punctuation) and S (symbol), per CommonMark.
const UNICODE_PUNCT_RE = /[\p{P}\p{S}]/u;
function isUnicodePunct(c) {
  if (c < 128) return isPunct(c);
  return UNICODE_PUNCT_RE.test(String.fromCharCode(c));
}

// flanking for a delimiter run [start, end) in s
function flank(s, start, end) {
  const before = start > 0 ? s.charCodeAt(start - 1) : -1;
  const after = end < s.length ? s.charCodeAt(end) : -1;
  const beforeWS = before < 0 || isUnicodeWhitespace(before);
  const afterWS = after < 0 || isUnicodeWhitespace(after);
  const beforePunct = before >= 0 && isUnicodePunct(before);
  const afterPunct = after >= 0 && isUnicodePunct(after);
  const leftFlanking = !afterWS && (!afterPunct || beforeWS || beforePunct);
  const rightFlanking = !beforeWS && (!beforePunct || afterWS || afterPunct);
  return { left: leftFlanking, right: rightFlanking, before, after, beforePunct, afterPunct };
}

// Try to parse an autolink / raw HTML tag at s[i] === '<'.
// Returns [node, newIndex] or null.
function parseAngle(s, i) {
  const n = s.length;
  // raw HTML tag
  if (i + 1 < n) {
    const c1 = s.charCodeAt(i + 1);
    if (c1 === 33) { // ! comment / CDATA / doctype
      if (s.startsWith('<!--', i)) {
        // <!--> and <!---> are complete (empty) comments
        if (s[i + 4] === '>') return [{ t: 2, s: s.slice(i, i + 5) }, i + 5];
        if (s[i + 4] === '-' && s[i + 5] === '>') return [{ t: 2, s: s.slice(i, i + 6) }, i + 6];
        const end = s.indexOf('-->', i + 4);
        if (end >= 0) return [{ t: 2, s: s.slice(i, end + 3) }, end + 3];
      } else if (s.startsWith('<![CDATA[', i)) {
        const end = s.indexOf(']]>', i + 9);
        if (end >= 0) return [{ t: 2, s: s.slice(i, end + 3) }, end + 3];
      } else if (/^<![A-Z]/.test(s.slice(i, i + 3))) {
        const end = s.indexOf('>', i + 2);
        if (end >= 0) return [{ t: 2, s: s.slice(i, end + 1) }, end + 1];
      }
    } else if (c1 === 63) { // <? ... ?>
      const end = s.indexOf('?>', i + 2);
      if (end >= 0) return [{ t: 2, s: s.slice(i, end + 2) }, end + 2];
    } else if (c1 === 47) { // </tag>
      const m = /^[a-zA-Z][a-zA-Z0-9-]*[ \t\r\n]*\/?>/.exec(s.slice(i + 2));
      if (m) return [{ t: 2, s: s.slice(i, i + 2 + m[0].length) }, i + 2 + m[0].length];
    } else if (isLetter(c1)) {
      const m = /^[a-zA-Z][a-zA-Z0-9-]*(\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*(\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>/.exec(s.slice(i + 1));
      if (m) return [{ t: 2, s: s.slice(i, i + 1 + m[0].length) }, i + 1 + m[0].length];
    }
  }
  // angle autolink <scheme:...> or <email>
  let j = i + 1;
  while (j < n) {
    const c = s.charCodeAt(j);
    if (c === 62) break; // >
    if (c === 32 || c === 10 || c === 60) return null;
    j++;
  }
  if (j >= n || s[j] !== '>') return null;
  const inner = s.slice(i + 1, j);
  if (inner.length === 0) return null;
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^ ]*)$/.exec(inner);
  if (m) {
    const isMailto = /^mailto$/i.test(m[1]);
    return [{ t: 5, href: rawUrlEncode(inner), title: null, children: [txt(inner)], image: false, isAuto: true, mailto: isMailto }, j + 1];
  }
  // email: local@domain with a dot in the domain
  if (/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?\.[A-Za-z0-9._-]+$/.test(inner) && !inner.includes('..') && inner.indexOf('@') === inner.lastIndexOf('@')) {
    const at = inner.indexOf('@');
    const domain = inner.slice(at + 1);
    if (!domain.startsWith('.') && domain.indexOf('.') >= 0 && domain[domain.length - 1] !== '.') {
      return [{ t: 5, href: rawUrlEncode('mailto:' + inner), title: null, children: [txt(inner)], image: false, isAuto: true, mailto: true }, j + 1];
    }
  }
  return null;
}

// Parse a bare email starting at i. Returns {email, end} or null.
// Domain rules mirror the GFM email regex: the domain is a run of
// [A-Za-z0-9._-] labels; the matched domain must end with an alphanumeric,
// contain a dot, have every dot-label end with an alphanumeric, and the
// character after it must not be a word char or '-'. The regex backtracks:
// if the full run fails the lookahead, a shorter domain ending at an
// earlier label boundary is tried. A trailing '-' or '_' is NOT trimmed:
// with nothing after it the email does not match at all (gfm-632/633).
// Exception: trailing '_'s that close an open '_' emphasis delimiter
// (openUnder) are delimiters, not domain chars, so they are excluded and
// the full domain matches.
function parseExtEmail(s, i, openUnder) {
  const n = s.length;
  let j = i;
  // local part bounded to 256 chars (an '@' must appear within that span);
  // marked's email regex local part is [A-Za-z0-9._+-]+ only
  while (j < n && j - i < 256) {
    if (isEmailLocalChar(s.charCodeAt(j))) j++;
    else break;
  }
  if (j === i || j >= n || s[j] !== '@') return null;
  const local = s.slice(i, j);
  let k = j + 1;
  while (k < n) {
    const c = s.charCodeAt(k);
    if (isAlnum(c) || c === 46 || c === 95 || c === 45) k++;
    else break;
  }
  let runEnd = k;
  let trimmedUnder = false;
  // trailing '_'s that close an open '_' emphasis delimiter are not
  // domain chars: exclude them (only when they can close: followed by
  // a non-word char or end of string)
  if (openUnder && runEnd > j + 1) {
    let t = runEnd;
    while (t > j + 1 && s.charCodeAt(t - 1) === 95) t--;
    if (t < runEnd) {
      const after = runEnd < n ? s.charCodeAt(runEnd) : -1;
      if (after === -1 || !isAlnum(after)) {
        runEnd = t;
        trimmedUnder = true;
      }
    }
  }
  const run = s.slice(j + 1, runEnd);
  if (run.length === 0) return null;
  // candidate domain ends, longest first: the end of the run, then just
  // before each '.' (label boundaries)
  const ends = [run.length];
  for (let d = run.length - 1; d > 0; d--) {
    if (run.charCodeAt(d) === 46) ends.push(d);
  }
  for (const e of ends) {
    if (e <= 0 || !isAlnum(run.charCodeAt(e - 1))) continue;
    const cand = run.slice(0, e);
    const lastDot = cand.lastIndexOf('.');
    if (lastDot <= 0 || lastDot >= cand.length - 1) continue;
    if (cand.includes('..') || cand.startsWith('.')) continue;
    let ok = true;
    for (let d = 0; d < cand.length; d++) {
      if (cand.charCodeAt(d) === 46 && (d === 0 || !isAlnum(cand.charCodeAt(d - 1)))) { ok = false; break; }
    }
    if (!ok) continue;
    // lookahead: the char after the candidate must not be a word char or '-'
    if (e === run.length && trimmedUnder) {
      // the '_'s after it are emphasis delimiters: lookahead passes
    } else {
      const afterIdx = j + 1 + e;
      const after = afterIdx < n ? s.charCodeAt(afterIdx) : -1;
      if (after !== -1 && (isAlnum(after) || after === 95 || after === 45)) continue;
    }
    return { email: local + '@' + cand, end: j + 1 + e };
  }
  return null;
}

// Extended autolinks (www. / scheme:// / email), checked at position i.
// Returns [node, newIndex] or null. Only when allowExt.
// Would the ']' at j close the bracket opened at brPos into a link?
// Mirrors the ']' handler: balanced label, then '(' + a valid inline dest,
// '[' + a defined ref label, or a shortcut ref defined for the text.
// first ']' at or after `from` that closes the innermost active bracket
// into a link, or -1. A code span must not cross it: the link is tokenized
// first and its text is parsed separately, so a closing backtick run past
// the ']' is not a match for a run inside the link text.
function linkCloseLimit(s, from, brackets, refs) {
  for (let k = brackets.length - 1; k >= 0; k--) {
    if (brackets[k].active) {
      const brPos = brackets[k].pos;
      for (let j = from; j < s.length; j++) {
        if (s.charCodeAt(j) === 93 && bracketFormsLink(s, brPos, j, refs)) return j;
      }
      return -1;
    }
  }
  return -1;
}

// does a link label contain an unmatched backtick? Mirrors marked's label
// regex: a backtick run is allowed only as part of a complete code span
// within the label (a matching run of the same length, with no backtick in
// between), or as a run of 2+ backticks at the very end of the label
// (immediately before ']'). Otherwise the ']' does not form a link.
function labelBacktickInvalid(label) {
  const n = label.length;
  let i = 0;
  while (i < n) {
    const c = label.charCodeAt(i);
    if (c === 92) { i += 2; continue; } // backslash escape
    if (c === 91) { // nested bracket: skip to its matching ']'
      let depth = 1, j = i + 1;
      while (j < n && depth > 0) {
        const d = label.charCodeAt(j);
        if (d === 92) { j += 2; continue; }
        if (d === 91) depth++;
        else if (d === 93) depth--;
        j++;
      }
      i = j; continue;
    }
    if (c === 96) {
      let j = i;
      while (j < n && label.charCodeAt(j) === 96) j++;
      const run = j - i;
      // the next backtick run closes the code span (marked's label regex
      // does not require equal lengths for the label match)
      let k = j, found = -1;
      while (k < n) {
        if (label.charCodeAt(k) === 96) {
          let m = k;
          while (m < n && label.charCodeAt(m) === 96) m++;
          found = m; break;
        }
        k++;
      }
      if (found >= 0) { i = found; continue; }
      // unmatched: allowed only as 2+ backticks at the very end of the label
      if (run >= 2 && j === n) { i = j; continue; }
      return true;
    }
    i++;
  }
  return false;
}

function bracketFormsLink(s, brPos, j, refs) {
  if (labelBacktickInvalid(s.slice(brPos + 1, j))) return false;
  if (!labelBalanced(s, brPos + 1, j)) return false;
  const n = s.length;
  if (j + 1 < n && s.charCodeAt(j + 1) === 40) {
    if (parseInlineLink(s, j + 1) !== null) return true;
    // a failed '(' still allows a shortcut ref: fall through
  }
  if (j + 1 < n && s.charCodeAt(j + 1) === 91) {
    let k = j + 2, depth = 0, ok = false;
    while (k < n) {
      const cc = s.charCodeAt(k);
      if (cc === 92 && k + 1 < n) { k += 2; continue; }
      if (cc === 91) depth++;
      else if (cc === 93) {
        if (depth === 0) { ok = true; break; }
        depth--;
      }
      k++;
    }
    if (!ok) return false;
    const label = s.slice(j + 2, k);
    const labelText = label.length === 0 ? s.slice(brPos + 1, j) : label;
    return refs.has(normalizeLabel(labelText));
  }
  return refs.has(normalizeLabel(s.slice(brPos + 1, j)));
}

function parseExtAutolink(s, i, allowExt, bracketClose, openUnder) {
  if (!allowExt) return null;
  const n = s.length;
  // mailto: / xmpp: + email (xmpp may have a /resource part).
  // case-insensitive charCode compare (ASCII letters only, no allocation)
  const lc = c => (c >= 65 && c <= 90) ? c + 32 : c;
  {
    let schemeLen = 0, isXmpp = false;
    if (i + 7 <= n && lc(s.charCodeAt(i)) === 109 && lc(s.charCodeAt(i + 1)) === 97 &&
        lc(s.charCodeAt(i + 2)) === 105 && lc(s.charCodeAt(i + 3)) === 108 &&
        lc(s.charCodeAt(i + 4)) === 116 && lc(s.charCodeAt(i + 5)) === 111 &&
        s.charCodeAt(i + 6) === 58) { schemeLen = 7; }
    else if (i + 5 <= n && lc(s.charCodeAt(i)) === 120 && lc(s.charCodeAt(i + 1)) === 109 &&
        lc(s.charCodeAt(i + 2)) === 112 && lc(s.charCodeAt(i + 3)) === 112 &&
        s.charCodeAt(i + 4) === 58) { schemeLen = 5; isXmpp = true; }
    if (schemeLen > 0) {
      const em = parseExtEmail(s, i + schemeLen, openUnder);
      if (em) {
        let end = em.end, text = s.slice(i, end);
        if (isXmpp && end < n && s[end] === '/') {
          let k = end + 1;
          while (k < n) {
            const c = s.charCodeAt(k);
            if (isAlnum(c) || c === 64 || c === 46) k++;
            else break;
          }
          if (k > end + 1) { end = k; text = s.slice(i, end); }
        }
        return [{ t: 5, href: rawUrlEncode(text), title: null, children: [txt(text)], image: false, isAuto: true, ext: true, mailto: !isXmpp }, end];
      }
      return null;
    }
  }
  // scheme:// — only http, https, ftp (marked's protocol regex); other
  // schemes (irc://, made-up-scheme://, ...) are not autolinked
  {
    let schemeLen = 0;
    if (i + 7 <= n && lc(s.charCodeAt(i)) === 104 && lc(s.charCodeAt(i + 1)) === 116 &&
        lc(s.charCodeAt(i + 2)) === 116 && lc(s.charCodeAt(i + 3)) === 112 &&
        s.charCodeAt(i + 4) === 58 && s.charCodeAt(i + 5) === 47 && s.charCodeAt(i + 6) === 47) schemeLen = 7;
    else if (i + 8 <= n && lc(s.charCodeAt(i)) === 104 && lc(s.charCodeAt(i + 1)) === 116 &&
        lc(s.charCodeAt(i + 2)) === 116 && lc(s.charCodeAt(i + 3)) === 112 && lc(s.charCodeAt(i + 4)) === 115 &&
        s.charCodeAt(i + 5) === 58 && s.charCodeAt(i + 6) === 47 && s.charCodeAt(i + 7) === 47) schemeLen = 8;
    else if (i + 6 <= n && lc(s.charCodeAt(i)) === 102 && lc(s.charCodeAt(i + 1)) === 116 &&
        lc(s.charCodeAt(i + 2)) === 112 && s.charCodeAt(i + 3) === 58 &&
        s.charCodeAt(i + 4) === 47 && s.charCodeAt(i + 5) === 47) schemeLen = 6;
    if (schemeLen > 0) {
      const cand = backpedalUrl(s, i + schemeLen, bracketClose);
      if (cand.length > 0) {
        const url = s.slice(i, i + schemeLen) + cand;
        return [{ t: 5, href: rawUrlEncode(url), title: null, children: [txt(url)], image: false, isAuto: true, ext: true }, i + schemeLen + cand.length];
      }
    }
  }
  // www.
  if (s.startsWith('www.', i)) {
    const prev = i === 0 ? -1 : s.charCodeAt(i - 1);
    const okPrev = i === 0 || isUnicodeWhitespace(prev) || prev === 40 || prev === 42 || prev === 95 || prev === 126;
    if (okPrev) {
      const cand = backpedalUrl(s, i + 4, bracketClose);
      if (cand.length > 0) {
        const first = cand.charCodeAt(0);
        if (first !== 46 && first !== 95) {
          const url = 'www.' + cand;
          return [{ t: 5, href: rawUrlEncode('http://' + url), title: null, children: [txt(url)], image: false, isAuto: true, ext: true }, i + 4 + cand.length];
        }
      }
    }
  }
  // email (parseExtEmail scans the local part once and finds the '@')
  {
    const em = parseExtEmail(s, i, openUnder);
    if (em) {
      return [{ t: 5, href: rawUrlEncode('mailto:' + em.email), title: null, children: [txt(em.email)], image: false, isAuto: true, ext: true, mailto: true }, em.end];
    }
  }
  return null;
}

// candidate URL run starting at i: non-whitespace, non-'<' chars; then backpedal.
// limit (>= 0) caps the run, used to stop before a ']' that closes an open
// bracket into a link (see the scan loop).
function backpedalUrl(s, i, limit) {
  const n = s.length;
  const lim = (limit === undefined || limit < 0) ? n : Math.min(limit, n);
  let j = i;
  while (j < lim) {
    const c = s.charCodeAt(j);
    if (c === 32 || c === 10 || c === 60 || c === 9) break;
    j++;
  }
  let cand = s.slice(i, j);
  // marked applies _backpedal in a loop until stable: one application strips
  // at most one trailing punctuation char (the (?!$) backtracks), so repeat
  // until the result stops changing.
  let prev;
  do {
    prev = cand;
    const m = BACKPEDAL_RE.exec(cand);
    cand = m ? m[0] : '';
  } while (cand !== prev);
  return cand;
}

// marked's _backpedal regex, applied left-to-right in one pass: a ')' is
// only dropped when it is the very last char (the (?!$) on the punctuation
// alternative), and a balanced (...) group is consumed whole. A strip-from-
// the-end loop gets this wrong: it removes the final ')' first, which breaks
// a balanced group like (http://z) and then truncates at the '('.
const BACKPEDAL_RE = /^(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/;

// Parse the destination / title after a ']' for an inline link.
// s[pos] === '(' . Returns {dest, title, end} or null.
function parseInlineLink(s, pos) {
  const n = s.length;
  let i = pos + 1;
  // skip whitespace (incl newlines)
  while (i < n && isUnicodeWhitespace(s.charCodeAt(i))) i++;
  if (i >= n) return null;
  let dest = null;
  if (s[i] === '<') {
    let j = i + 1;
    while (j < n && s[j] !== '>') {
      if (s[j] === '\n' || s[j] === '<') return null;
      if (s.charCodeAt(j) === 92 && j + 1 < n) { j += 2; continue; }
      j++;
    }
    if (j >= n) return null;
    dest = s.slice(i + 1, j);
    i = j + 1;
  } else {
    // bare dest: balanced parens, no spaces
    let depth = 0, j = i;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === 92 && j + 1 < n && isPunct(s.charCodeAt(j + 1))) { j += 2; continue; }
      if (c === 40) depth++;
      else if (c === 41) {
        if (depth === 0) break;
        depth--;
      } else if (c <= 32) break;
      j++;
    }
    dest = s.slice(i, j);
    i = j;
  }
  // skip whitespace
  while (i < n && isUnicodeWhitespace(s.charCodeAt(i))) i++;
  let title = null;
  if (i < n && (s[i] === '"' || s[i] === "'" || s[i] === '(')) {
    const q = s[i];
    const close = q === '(' ? ')' : q;
    let j = i + 1, ok = false;
    while (j < n) {
      const c = s.charCodeAt(j);
      if (c === 92 && j + 1 < n && isPunct(s.charCodeAt(j + 1))) { j += 2; continue; }
      if (s[j] === close) { ok = true; break; }
      if (s[j] === '\n' && q === '(') { /* paren title may contain a single \n */ }
      j++;
    }
    if (!ok) return null;
    title = s.slice(i + 1, j);
    // title may not contain a blank line
    if (title.includes('\n\n')) return null;
    // unescape backslash escapes in the title
    let t = '';
    for (let k = 0; k < title.length; k++) {
      if (title.charCodeAt(k) === 92 && k + 1 < title.length && isPunct(title.charCodeAt(k + 1))) { t += title[k + 1]; k++; }
      else t += title[k];
    }
    title = t;
    i = j + 1;
    while (i < n && isUnicodeWhitespace(s.charCodeAt(i))) i++;
  }
  if (i >= n || s[i] !== ')') return null;
  return { dest, title, end: i + 1 };
}


// Main inline tokenizer + emphasis resolver. Returns an HTML string.
// Node types: 0 text, 1 code, 2 raw html, 3 hard break, 4 delimiter,
// 5 link, 6 soft break, 7 em/strong/del wrapper.

// plain text of a node list (used for reference labels)
function nodesPlainText(nodes) {
  let out = '';
  for (const nd of nodes) {
    if (nd.t === 0) out += nd.s;
    else if (nd.t === 1) out += nd.s;
    else if (nd.t === 4) out += String.fromCharCode(nd.ch).repeat(nd.n);
    else if (nd.t === 5 || nd.t === 7) out += nodesPlainText(nd.children);
    else if (nd.t === 3 || nd.t === 6) out += '\n';
  }
  return out;
}

// Is the bracket content in s[start..end) balanced? Depth (counting '[' as
// +1, ']' as -1) must never go below 0 and must end at 0. Backslash escapes
// and code spans are skipped (their brackets do not count).
function labelBalanced(s, start, end) {
  let depth = 0;
  let i = start;
  while (i < end) {
    const c = s.charCodeAt(i);
    if (c === 92) { i += 2; continue; }
    if (c === 96) {
      let j = i;
      while (j < end && s.charCodeAt(j) === 96) j++;
      const run = j - i;
      let k = j, found = -1;
      while (k < end) {
        if (s.charCodeAt(k) === 96) {
          let m = k;
          while (m < end && s.charCodeAt(m) === 96) m++;
          if (m - k === run) { found = m; break; }
          k = m;
        } else k++;
      }
      if (found >= 0) { i = found; continue; }
      i = j; continue;
    }
    if (c === 91) depth++;
    else if (c === 93) { depth--; if (depth < 0) return false; }
    i++;
  }
  return depth === 0;
}

// marked's #n masking (used only for emStrong/del closer search): it
// replaces code spans' inner backticks with '+' (Ot), then replaces links,
// code spans and html tags with '[aaa...]' of the same length (blockSkip).
// A link label with an UNMATCHED backtick run (e.g. `` ``x` ``) is not
// matched by blockSkip's link pattern, so Ot's code-span match spans from
// that run to the next same-length run (usually a later code span's
// opener), and blockSkip then masks the whole span as '[aaa...]'. Any
// emphasis delimiters inside that phantom span are invisible to
// emStrong, so marked leaves them literal. Replicated here: a delimiter
// whose position is masked out (not its own char in the masked source)
// gets canOpen/canClose cleared, so resolveEmphasis treats it as text.
const MASK_OT = /(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\([\p{P}\p{S}])/gu;
const MASK_LINK = /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\([ \t\n]*(?:<[^<>\n]*>|[^\s\\()]|\((?:\\[\s\S]|[^\s\\()])*\))*(?:[ \t\n]+(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\((?:\\[\s\S]|[^)\\])*\)))?[ \t\n]*\)/;
const MASK_CODE = /(?<!`)()(?<b>`+)[^`]+\k<b>(?!`)/;
const MASK_HTML = /<(?! )[^<>]*?>/;
const MASK_BLOCKSKIP = new RegExp(`(?:${MASK_LINK.source})|(?:${MASK_CODE.source})|(?:${MASK_HTML.source})`, 'g');
function maskForEmphasis(text) {
  let t = text.replace(MASK_OT, (m, s, r) => r ? '+'.repeat(m.length) : s ? s + m.slice(s.length, -s.length).replace(/`/g, '+') + s : m);
  t = t.replace(MASK_BLOCKSKIP, (m) => '[' + 'a'.repeat(Math.max(0, m.length - 2)) + ']');
  return t;
}

function inlineParse(text, refs, allowExt, state) {
  const s = text;
  const n = s.length;
  // masked source for emphasis suppression (only when backticks and a
  // delimiter char are present; otherwise no phantom span can form)
  const masked = (s.includes('`') && (s.includes('*') || s.includes('_') || s.includes('~'))) ? maskForEmphasis(s) : null;
  const nodes = [];
  const brackets = []; // {node (the '[' text node), bang (the '!' node or null), image, active}
  let i = 0;
  let textStart = 0;
  // document-wide link context (marked's Lexer.state.inLink): a raw
  // <a ...> tag opens it, </a> closes it; extended autolinks are
  // suppressed while it is open. Shared across all inline runs.
  const inLinkState = state || { inLink: false };
  // unmatched open '_' emphasis delimiters in this inline run (greedy
  // simulation): a trailing '_' after an email domain is an emphasis
  // closer, not a domain char, only when one is open
  let openUnder = 0;
  const flushText = (to) => {
    if (to > textStart) nodes.push(txt(s.slice(textStart, to)));
  };

  while (i < n) {
    const c = s.charCodeAt(i);
    if (c === 92) { // backslash
      if (i + 1 < n) {
        const d = s.charCodeAt(i + 1);
        if (d === 10) {
          flushText(i);
          nodes.push({ t: 3 });
          i += 2;
          // hard break consumes the newline and the next line's leading whitespace
          while (i < n && (s.charCodeAt(i) === 32 || s.charCodeAt(i) === 9)) i++;
          textStart = i;
          continue;
        }
        if (isPunct(d)) {
          flushText(i);
          nodes.push(txt(s[i + 1]));
          i += 2; textStart = i;
          continue;
        }
      }
      i++;
      continue;
    }
    if (c === 10) { // newline: soft / hard break
      let sp = 0, k = i - 1;
      while (k >= textStart && s.charCodeAt(k) === 32) { sp++; k--; }
      if (sp >= 2) {
        flushText(i - sp);
        nodes.push({ t: 3 });
        i++;
        // hard break consumes the newline and the next line's leading whitespace
        while (i < n && (s.charCodeAt(i) === 32 || s.charCodeAt(i) === 9)) i++;
        textStart = i;
      } else {
        flushText(i);
        nodes.push({ t: 6 });
        i++; textStart = i;
      }
      continue;
    }
    if (c === 96) { // code span
      let j = i;
      while (j < n && s.charCodeAt(j) === 96) j++;
      const run = j - i;
      // the closing run must be before any ']' that closes an open bracket
      // into a link (the link is tokenized first; see linkCloseLimit)
      const lc = linkCloseLimit(s, j, brackets, refs);
      const end = lc < 0 ? n : lc;
      let k = j, found = -1, foundEnd = -1;
      while (k < end) {
        if (s.charCodeAt(k) === 96) {
          let m = k;
          while (m < end && s.charCodeAt(m) === 96) m++;
          if (m - k === run) { found = k; foundEnd = m; break; }
          k = m;
        } else k++;
      }
      if (found < 0) { i = j; continue; }
      let content = s.slice(j, found).replace(/\n/g, ' ');
      if (content.length >= 2 && content[0] === ' ' && content[content.length - 1] === ' ' &&
          content.trim().length > 0) content = content.slice(1, -1);
      flushText(i);
      nodes.push({ t: 1, s: content });
      i = foundEnd; textStart = i;
      continue;
    }
    if (c === 60) { // < autolink / html
      const res = parseAngle(s, i);
      if (res) {
        // a raw <a ...> tag opens the link context, </a> closes it
        // (marked's tag tokenizer; persists for the rest of the document)
        if (res[0].t === 2) {
          if (/^<a /i.test(res[0].s)) inLinkState.inLink = true;
          else if (/^<\/a>/i.test(res[0].s)) inLinkState.inLink = false;
        }
        flushText(i);
        nodes.push(res[0]);
        i = res[1]; textStart = i;
        continue;
      }
      i++;
      continue;
    }
    if (c === 91 || (c === 33 && i + 1 < n && s.charCodeAt(i + 1) === 91)) { // [ or ![
      const isImage = c === 33;
      flushText(i);
      let bangNode = null;
      if (isImage) {
        bangNode = txt('!');
        nodes.push(bangNode);
      }
      const brNode = txt('[');
      nodes.push(brNode);
      brackets.push({ node: brNode, bang: bangNode, image: isImage, active: true, pos: isImage ? i + 1 : i });
      i = isImage ? i + 2 : i + 1;
      textStart = i;
      continue;
    }
    if (c === 93) { // ]
      flushText(i);
      let b = -1;
      for (let k = brackets.length - 1; k >= 0; k--) {
        if (brackets[k].active) { b = k; break; }
      }
      if (b < 0) { textStart = i; i++; continue; }
      const br = brackets[b];
      // The ']' only closes this bracket when the content between them is
      // balanced; otherwise it is literal text and the bracket stays open
      // for a later ']'.
      if (!labelBalanced(s, br.pos + 1, i)) { textStart = i; i++; continue; }
      const brPos = nodes.indexOf(br.node);
      if (brPos < 0) { textStart = i; i++; continue; }
      // A label with an unmatched backtick cannot form a link (marked's
      // label regex `re` rejects it): the ']' is literal text and the
      // bracket is used up, exactly as when no '(' / '[' follows.
      if (labelBacktickInvalid(s.slice(br.pos + 1, i))) {
        br.active = false;
        textStart = i;
        i++;
        continue;
      }
      let link = null;
      let endPos = i + 1;
      if (i + 1 < n && s.charCodeAt(i + 1) === 40) {
        const pl = parseInlineLink(s, i + 1);
        if (pl) { link = { dest: pl.dest, title: pl.title }; endPos = pl.end; }
      }
      if (!link) {
        let hasRef = false, label = null, labelEnd = i + 1;
        if (i + 1 < n && s.charCodeAt(i + 1) === 91) {
          let j = i + 2, depth = 0, ok = false;
          while (j < n) {
            const cc = s.charCodeAt(j);
            if (cc === 92 && j + 1 < n) { j += 2; continue; }
            if (cc === 91) depth++;
            else if (cc === 93) {
              if (depth === 0) { ok = true; break; }
              depth--;
            }
            j++;
          }
          if (ok) {
            hasRef = true;
            label = s.slice(i + 2, j);
            labelEnd = j + 1;
          }
        }
        const labelText = (!hasRef || label.length === 0)
          ? s.slice(br.pos + 1, i)
          : label;
        const ref = refs.get(normalizeLabel(labelText));
        if (ref) {
          link = { dest: ref.dest, title: ref.title };
          endPos = hasRef ? labelEnd : i + 1;
        }
      }
      if (link) {
        const children = nodes.splice(brPos + 1);
        // Extended (bare-URL / bare-email / www.) autolinks are not
        // linkified inside link text: unwrap them back to plain text
        // (angle autolinks stay). Do not recurse into nested links or
        // images: an autolink in an image's alt text is allowed.
        if (!br.image) {
          for (let k = 0; k < children.length; k++) {
            const ch = children[k];
            if (ch.t === 5 && ch.isAuto && ch.ext) {
              children.splice(k, 1, ...ch.children);
              k += ch.children.length - 1;
            }
          }
        }
        // remove the '[' node and the '!' node (if any)
        let rm = nodes.indexOf(br.node);
        if (rm >= 0) nodes.splice(rm, 1);
        if (br.bang) {
          rm = nodes.indexOf(br.bang);
          if (rm >= 0) nodes.splice(rm, 1);
        }
        const href = cleanUrl(link.dest);
        nodes.push({
          t: 5, href, title: link.title,
          children: children.length ? children : [txt('')],
          image: br.image, isAuto: false, mailto: false,
        });
        // A non-image link deactivates all other non-image brackets (a link
        // cannot contain a link); an image deactivates nothing (an image
        // may contain a link in its alt text, and a link may contain an
        // image). The forming bracket itself is consumed.
        br.active = false;
        if (!br.image) {
          for (const bk of brackets) if (!bk.image) bk.active = false;
        }
        i = endPos; textStart = i;
        continue;
      }
      // No link formed from this ']' (no '(' / '[' after it, or the dest /
      // ref did not parse): the ']' uses up this bracket.
      br.active = false;
      textStart = i;
      i++;
      continue;
    }
    if (c === 42 || c === 95 || c === 126) { // * _ ~
      let j = i;
      while (j < n && s.charCodeAt(j) === c) j++;
      const run = j - i;
      if (c === 126 && run > 2) { i = j; continue; }
      const f = flank(s, i, j);
      let canOpen, canClose;
      if (c === 95) {
        canOpen = f.left && (!f.right || f.beforePunct);
        canClose = f.right && (!f.left || f.afterPunct);
      } else {
        canOpen = f.left;
        canClose = f.right;
      }
      flushText(i);
      // masked-out delimiter (inside a phantom code span from #n): it is
      // invisible to emStrong, so it can neither open nor close. Only
      // applies at the top level of this inline run: delimiters inside a
      // bracket belong to a (potential) link label, which marked tokenizes
      // recursively with the label's own masked source.
      const inBracket = brackets.some(b => b.active);
      if (masked && !inBracket && masked[i] !== String.fromCharCode(c)) { canOpen = false; canClose = false; }
      nodes.push({ t: 4, ch: c, n: run, canOpen, canClose, pos: i });
      if (c === 95) {
        if (canClose && openUnder > 0) openUnder--;
        else if (canOpen) openUnder++;
      }
      i = j; textStart = i;
      continue;
    }
    if (allowExt && !inLinkState.inLink && (c === 119 || isLetter(c) || isDigit(c))) {
      // Fast gate: an extended autolink can only start here if the text
      // matches one of marked's GFM text-rule stops — http://, https://,
      // ftp:// (any preceding char), www. (preceded by whitespace, (,
      // *, _, ~, or start), mailto:/xmpp: (preceded by a non-alphanumeric
      // char or start), or an email (preceded by a non-email-local char
      // or start). Any other position is mid-word and cannot start one,
      // so skip the bracket scan and the autolink attempt entirely.
      const prev = i === 0 ? -1 : s.charCodeAt(i - 1);
      let canStart = false;
      if (c === 104 || c === 72) { // h: http:// or https://
        if (i + 7 <= n && lcCharCode(s.charCodeAt(i + 1)) === 116 && lcCharCode(s.charCodeAt(i + 2)) === 116 &&
            lcCharCode(s.charCodeAt(i + 3)) === 112 && s.charCodeAt(i + 4) === 58 &&
            s.charCodeAt(i + 5) === 47 && s.charCodeAt(i + 6) === 47) canStart = true;
        else if (i + 8 <= n && lcCharCode(s.charCodeAt(i + 1)) === 116 && lcCharCode(s.charCodeAt(i + 2)) === 116 &&
            lcCharCode(s.charCodeAt(i + 3)) === 112 && lcCharCode(s.charCodeAt(i + 4)) === 115 &&
            s.charCodeAt(i + 5) === 58 && s.charCodeAt(i + 6) === 47 && s.charCodeAt(i + 7) === 47) canStart = true;
      } else if (c === 102 || c === 70) { // f: ftp://
        if (i + 6 <= n && lcCharCode(s.charCodeAt(i + 1)) === 116 && lcCharCode(s.charCodeAt(i + 2)) === 112 &&
            s.charCodeAt(i + 3) === 58 && s.charCodeAt(i + 4) === 47 && s.charCodeAt(i + 5) === 47) canStart = true;
      }
      if (!canStart && c === 119 && i + 4 <= n && s.charCodeAt(i + 1) === 119 &&
          s.charCodeAt(i + 2) === 119 && s.charCodeAt(i + 3) === 46 &&
          (i === 0 || isUnicodeWhitespace(prev) || prev === 40 || prev === 42 || prev === 95 || prev === 126)) canStart = true;
      if (!canStart && (c === 109 || c === 77 || c === 120 || c === 88) && (i === 0 || !isAlnum(prev))) {
        if (c === 109 || c === 77) { // mailto:
          if (i + 7 <= n && lcCharCode(s.charCodeAt(i + 1)) === 97 && lcCharCode(s.charCodeAt(i + 2)) === 105 &&
              lcCharCode(s.charCodeAt(i + 3)) === 108 && lcCharCode(s.charCodeAt(i + 4)) === 116 &&
              lcCharCode(s.charCodeAt(i + 5)) === 111 && s.charCodeAt(i + 6) === 58) canStart = true;
        } else { // xmpp:
          if (i + 5 <= n && lcCharCode(s.charCodeAt(i + 1)) === 109 && lcCharCode(s.charCodeAt(i + 2)) === 112 &&
              lcCharCode(s.charCodeAt(i + 3)) === 112 && s.charCodeAt(i + 4) === 58) canStart = true;
        }
      }
      if (!canStart && (i === 0 || !isEmailLocalChar(prev))) canStart = true;
      if (!canStart) { i++; continue; }
      // If an active bracket is open and a ']' ahead (within this URL's
      // run) would close it into a link, cap the autolink at that ']'
      // so the link can form; link formation then unwraps the autolink
      // (extended autolinks are not linkified inside link text). Without
      // the cap the autolink would swallow the ']' and the link could
      // never form.
      let bracketClose = -1;
      for (let k = brackets.length - 1; k >= 0; k--) {
        if (brackets[k].active) {
          const brPos = brackets[k].pos;
          for (let j = i; j < n; j++) {
            const cc = s.charCodeAt(j);
            if (cc === 32 || cc === 10 || cc === 60 || cc === 9) break;
            if (cc === 93 && bracketFormsLink(s, brPos, j, refs)) { bracketClose = j; break; }
          }
          break;
        }
      }
      const res = parseExtAutolink(s, i, true, bracketClose, openUnder > 0);
      if (res) {
        flushText(i);
        nodes.push(res[0]);
        i = res[1]; textStart = i;
        continue;
      }
    }
    i++;
  }
  flushText(n);
  // second mask pass: delimiters that were inside a bracket at creation
  // time (mask check skipped) but whose bracket never formed a link stay
  // top-level here, so they are subject to the top-level masked source;
  // delimiters inside a formed link are nested in its children and are
  // untouched (the label has its own masked source)
  if (masked) {
    for (const nd of nodes) {
      if (nd.t === 4 && nd.pos !== undefined && masked[nd.pos] !== String.fromCharCode(nd.ch)) {
        nd.canOpen = false; nd.canClose = false;
      }
    }
  }
  return renderInline(nodes, refs, allowExt);
}

// adjacent SOURCE character of a node in a node list: the char immediately
// before/after it in the source text (a code span contributes '`', a link
// contributes ']' before / '[' after it, an em/strong node a delimiter
// char, a break a newline), or '' at the ends
function adjChar(children, pos, dir) {
  const nd = dir < 0 ? children[pos - 1] : children[pos + 1];
  if (!nd) return '';
  if (nd.t === 0) {
    const s = nd.s;
    return s.length ? (dir < 0 ? s[s.length - 1] : s[0]) : '';
  }
  if (nd.t === 1) return '`';
  if (nd.t === 4) return String.fromCharCode(nd.ch);
  if (nd.t === 5) return dir < 0 ? ']' : '[';
  if (nd.t === 7) return '*';
  if (nd.t === 3 || nd.t === 6) return '\n';
  return '';
}

// Emphasis / strong / strikethrough, following marked's emStrong/del
// algorithm (opener-driven scan), not the CommonMark closer-driven one.
// A single left-to-right pass: each opener is tried once, in order, and
// is never retried after a later match (marked's lexer never goes back).
// For an opener run scan forward maintaining m (opener length still to
// match) and f (lengths of rule-of-3-skipped closers): a left-flanking-only
// run adds to m; a right-flanking-only run subtracts (no rule of 3 unless
// R); a both-flanking run is rule-of-3-checked, then subtracts. When m <= 0
// the span is wrapped in em (odd min length) or strong (even), the leftover
// delimiter chars stay INSIDE the wrap (marked's M.slice(use,-use)), and
// the inside is resolved recursively. A '~' closer must have the same
// length as its opener (marked's del).
function resolveEmphasis(children) {
  for (const nd of children) {
    if (nd.t === 5 || nd.t === 7) resolveEmphasis(nd.children);
  }
  let i = 0;
  while (i < children.length) {
    const nd = children[i];
    if (nd.t !== 4 || !nd.canOpen) { i++; continue; }
    const ch = nd.ch;
    const k = nd.n;
    let m = k, f = 0;
    const y = k;
    // R: opener preceded by a non-whitespace char and (followed by a
    // non-whitespace char, or '*' with a non-punct before-char); then
    // even right-flanking-only closers get the rule-of-3 check
    const pCh = adjChar(children, i, -1);
    const dCh = adjChar(children, i, 1);
    const R = pCh !== '' && pCh !== ' ' && pCh !== '\t' && pCh !== '\n' &&
      ((dCh !== '' && dCh !== ' ' && dCh !== '\t' && dCh !== '\n') ||
       (ch === 42 && !isPunct(pCh.charCodeAt(0))));
    let closerPos = -1, closerB = 0;
    for (let j = i + 1; j < children.length; j++) {
      const cn = children[j];
      if (cn.t !== 4) continue;
      if (cn.ch !== ch) {
        // marked's RDelim branch 1: a run of my char inside an opposite-char
        // strong span (e.g. '*' inside '__...__') is not a delimiter for
        // my opener — skip past the span's closing run
        if (cn.canOpen && cn.n >= 2) {
          const opp = cn.ch;
          for (let k = j + 1; k < children.length; k++) {
            const ck = children[k];
            if (ck.t === 4 && ck.ch === opp && ck.canClose && ck.n >= 2) { j = k; break; }
          }
        }
        continue;
      }
      const b = cn.n;
      const canO = cn.canOpen, canC = cn.canClose;
      if (!canO && !canC) continue;
      if (ch === 126 && b !== k) continue; // del: closer length must equal opener
      if (canO && !canC) { m += b; continue; } // left-flanking-only run: opener
      if ((canO && canC) || R) {
        if (y % 3 !== 0 && (y + b) % 3 === 0) { f += b; continue; } // rule of 3
      }
      m -= b;
      if (m > 0) continue;
      closerB = Math.min(b, b + m + f);
      if (closerB < 1) continue;
      closerPos = j;
      break;
    }
    if (closerPos < 0) {
      // failed opener: marked emits ONE delimiter char as literal text and
      // re-tries emStrong at the next char of the run (so '**foo*' yields
      // '*<em>foo</em>'). Split one char off as text and retry the rest:
      // the rest is now preceded by the delimiter char itself (non-space,
      // punct), so its flanking is canOpen = !afterWS, canClose =
      // afterWS || afterPunct.
      if (nd.n > 1) {
        const afterCh = adjChar(children, i, 1);
        const afterWS = afterCh === '' || isUnicodeWhitespace(afterCh.charCodeAt(0));
        const afterPunct = afterCh !== '' && isUnicodePunct(afterCh.charCodeAt(0));
        children.splice(i, 0, txt(String.fromCharCode(ch)));
        nd.n -= 1;
        nd.canOpen = !afterWS;
        nd.canClose = afterWS || afterPunct;
        i++; // now at the shortened run; retry it
        continue;
      }
      i++; // single char: literal, move on
      continue;
    }
    const use = ch === 126 ? k : (Math.min(k, closerB) % 2 === 1 ? 1 : 2);
    const closerNode = children[closerPos];
    const inner = children.slice(i + 1, closerPos);
    // marked's raw match M spans the full opener run but only closerB
    // chars of the closer run: (k - use) opener chars and (closerB - use)
    // closer chars stay INSIDE the wrap; the remaining (b - closerB)
    // closer chars are literal text AFTER the wrap
    const wrapChildren = [];
    if (nd.n - use > 0) wrapChildren.push({ t: 4, ch, n: nd.n - use, canOpen: nd.canOpen, canClose: nd.canClose });
    wrapChildren.push(...inner);
    if (closerB - use > 0) wrapChildren.push({ t: 4, ch, n: closerB - use, canOpen: closerNode.canOpen, canClose: closerNode.canClose });
    const tag = ch === 126 ? 'del' : (use === 2 ? 'strong' : 'em');
    const wrap = { t: 7, tag, children: wrapChildren };
    resolveEmphasis(wrap.children);
    const seg = [wrap];
    if (closerNode.n - closerB > 0) {
      // tail of the closer run: preceded by the delimiter char itself
      // (non-space, punct), followed by the original after-char
      const afterCh = adjChar(children, closerPos, 1);
      const afterWS = afterCh === '' || isUnicodeWhitespace(afterCh.charCodeAt(0));
      const afterPunct = afterCh !== '' && isUnicodePunct(afterCh.charCodeAt(0));
      seg.push({ t: 4, ch, n: closerNode.n - closerB, canOpen: !afterWS, canClose: afterWS || afterPunct });
    }
    children.splice(i, closerPos - i + 1, ...seg);
    i++; // continue after the wrap
  }
}

function renderInline(nodes, refs, allowExt) {
  resolveEmphasis(nodes);
  return renderNodes(nodes, refs, allowExt);
}

function renderNodes(nodes, refs, allowExt) {
  let out = '';
  for (const nd of nodes) out += renderInlineNode(nd, refs, allowExt);
  return out;
}

// plain text of a node list for image alt text: a nested image contributes
// its own alt text (its label's plain text), a link contributes its text.
function plainTextForAlt(nodes) {
  let out = '';
  for (const nd of nodes) {
    if (nd.t === 0 || nd.t === 1) out += nd.s;
    else if (nd.t === 4) out += String.fromCharCode(nd.ch).repeat(nd.n);
    else if (nd.t === 5 || nd.t === 7) out += plainTextForAlt(nd.children);
    else if (nd.t === 3 || nd.t === 6) out += '\n';
  }
  return out;
}

function renderInlineNode(nd, refs, allowExt) {
  switch (nd.t) {
    case 0: return escapeText(nd.s);
    case 1: return '<code>' + escapeCode(nd.s) + '</code>';
    case 2: return nd.s;
    case 3: return '<br>';
    case 6: return '\n';
    case 4: {
      let s = '';
      const ch = String.fromCharCode(nd.ch);
      for (let k = 0; k < nd.n; k++) s += ch;
      return escapeText(s);
    }
    case 7:
      return '<' + nd.tag + '>' + renderNodes(nd.children, refs, allowExt) + '</' + nd.tag + '>';
    case 5: {
      if (nd.image) {
        const alt = plainTextForAlt(nd.children);
        let img = '<img src="' + escapeAttr(nd.href) + '" alt="' + escapeAttr(alt) + '"';
        if (nd.title !== null && nd.title !== undefined) img += ' title="' + escapeAttr(nd.title) + '"';
        return img + '>';
      }
      const href = escapeAttr(nd.href);
      let a = '<a href="' + href + '"';
      if (nd.title !== null && nd.title !== undefined) a += ' title="' + escapeAttr(nd.title) + '"';
      return a + '>' + renderNodes(nd.children, refs, allowExt) + '</a>';
    }
  }
  return '';
}

// ---------------------------------------------------------------- block parser

function splitLines(src) {
  src = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = src.split('\n');
  const lines = [];
  for (let i = 0; i < parts.length; i++) {
    lines.push({ text: parts[i], eol: i < parts.length - 1 });
  }
  // a trailing empty part after the final newline is not a line
  if (parts.length > 1 && parts[parts.length - 1] === '') lines.pop();
  return lines;
}

function isBlankLine(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c !== 32 && c !== 9) return false;
  }
  return true;
}

// cursor into a line: idx (char index), col (column), partial (cols inside a tab)
function makeCursor() { return { idx: 0, col: 0, partial: 0 }; }
function cursorRest(cur, line) {
  if (cur.partial > 0) return ' '.repeat(cur.partial) + line.slice(cur.idx + 1);
  return line.slice(cur.idx);
}
// Absolute column of the first character of cursorRest(cur, s): the remainder
// string restarts at column 0, but a tab inside it still takes its width from
// its absolute column, so callers must carry this start column along.
function restStartCol(cur) {
  if (cur.partial > 0) {
    const w = 4 - (cur.col % 4);
    return cur.col + w - cur.partial;
  }
  return cur.col;
}
// advance over `n` columns of whitespace; false if a non-ws char is hit first
function cursorAdvance(cur, line, n) {
  let col = cur.col, idx = cur.idx, partial = cur.partial;
  // if inside a tab, the remaining columns of the tab come first. col is
  // the tab's START column and partial is what is left of it, so fully
  // consuming the tab lands at start + full width, not start + remainder
  if (partial > 0) {
    const tabW = 4 - (col % 4);
    const take = Math.min(partial, n);
    partial -= take;
    if (partial === 0) { col += tabW; idx++; } else { col += take; }
    n -= take;
    if (n === 0) { cur.idx = idx; cur.col = col; cur.partial = partial; return true; }
  }
  while (n > 0 && idx < line.length) {
    const c = line.charCodeAt(idx);
    if (c === 32) { idx++; col++; n--; }
    else if (c === 9) {
      const w = 4 - (col % 4);
      if (w > n) { cur.idx = idx; cur.col = col; cur.partial = w - n; return true; }
      idx++; col += w; n -= w;
    } else return false;
  }
  cur.idx = idx; cur.col = col; cur.partial = 0;
  return n === 0;
}
// width (columns) of the leading whitespace of s, whose first character sits
// at absolute column `startCol` (0 when s is a whole line). A tab's width
// depends on its absolute column, so a remainder string must pass its start.
function leadingWsWidth(s, startCol) {
  let col = startCol || 0;
  const base = col;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 32) col++;
    else if (c === 9) col += 4 - (col % 4);
    else break;
  }
  return col - base;
}
// Expand the leading tabs of a remainder string to spaces, each tab taking
// its width from its absolute column (`startCol` is the column of s[0]).
// Applied only inside a container: at the top level a leading tab stays
// literal (fenced-code content, paragraph continuations), but once container
// markers have been stripped, marked expands it.
function expandLeadingTabs(s, startCol) {
  let col = startCol || 0, i = 0, out = '';
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (c === 32) { out += ' '; col++; i++; }
    else if (c === 9) { const w = 4 - (col % 4); out += ' '.repeat(w); col += w; i++; }
    else break;
  }
  if (i === 0) return s;
  return out + s.slice(i);
}
// strip `n` columns from the front of s (column-based); a partially consumed
// tab becomes spaces; a tab at the boundary is kept as a tab char.
// `startCol` is the absolute column of s[0] (0 for a whole line).
function stripColumns(s, n, startCol) {
  let col = startCol || 0, i = 0;
  const target = col + n;
  while (i < s.length && col < target) {
    const c = s.charCodeAt(i);
    if (c === 32) { col++; i++; }
    else if (c === 9) {
      const w = 4 - (col % 4);
      if (col + w > target) return ' '.repeat(col + w - target) + s.slice(i + 1);
      col += w; i++;
    } else break;
  }
  return s.slice(i);
}
// marked's fences tokenizer strips the fence indent by CHARACTER count
// (Dt): up to n leading whitespace characters are removed from each content
// line, a tab counting as one character and vanishing entirely. stripColumns
// strips by columns instead, leaving a partial tab as spaces.
function stripFenceIndent(s, n) {
  let i = 0;
  while (i < s.length && i < n && (s.charCodeAt(i) === 32 || s.charCodeAt(i) === 9)) i++;
  return s.slice(i);
}
// marked's indent compensation (Dt) only applies to backtick fences: its
// regex /^(\s+)(?:```)/ never matches a tilde fence, so tilde-fence content
// keeps its full indent.
function fenceContentText(node, text) {
  return node.fenceCh === 96 ? stripFenceIndent(text, node.fenceIndent || 0) : text;
}
// match a blockquote marker at the cursor; returns a new cursor or null
function matchBlockquote(cur, line) {
  let col = cur.col, idx = cur.idx, partial = cur.partial;
  // skip up to 3 columns of whitespace
  let skipped = 0;
  if (partial > 0) {
    const take = Math.min(partial, 3);
    partial -= take; col += take; skipped += take;
    if (partial === 0) idx++;
  }
  while (skipped < 3 && idx < line.length) {
    const c = line.charCodeAt(idx);
    if (c === 32) { idx++; col++; skipped++; }
    else if (c === 9) {
      const w = 4 - (col % 4);
      if (skipped + w > 3) break;
      idx++; col += w; skipped += w;
    } else break;
  }
  if (idx >= line.length || line.charCodeAt(idx) !== 62) return null;
  idx++; col++;
  // fcol: frame column of the next char after the marker separator.
  // marked re-bases each blockquote level, so a tab after '>' expands
  // from the marker's frame (indent + '>'), not the absolute column.
  // The tab itself sits at frame column skipped + 1, so its width is
  // 4 - ((skipped + 1) % 4); consuming one separator column leaves
  // that width minus one.
  const fcol = skipped + 2;
  // consume one following space / tab column
  if (idx < line.length) {
    const c = line.charCodeAt(idx);
    if (c === 32) { idx++; col++; }
    else if (c === 9) {
      const w = 4 - ((skipped + 1) % 4);
      if (w === 1) { idx++; col++; }
      else return { idx, col, partial: w - 1, fcol };
    }
  }
  return { idx, col, partial: 0, fcol };
}

const HTML_BLOCK_STARTS = [
  // [regex, type] type 1..7
  [/^<(script|pre|style|textarea)([\s>]|$)/i, 1],
  [/^<!--/, 2],
  [/^<\?/, 3],
  [/^<![A-Za-z]/, 4],
  [/^<!\[CDATA\[/, 5],
  [/^<\/?(address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)([\s/>]|$)/i, 6],
  // type 7: a complete open tag (attributes allowed) OR a complete closing
  // tag (no attributes) alone on the line
  [/^(?:<[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z_:][A-Za-z0-9_.:-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>|<\/[A-Za-z][A-Za-z0-9-]*\s*>)[ \t]*$/, 7],
];
const HTML_BLOCK_ENDS = {
  1: /<\/(script|pre|style|textarea)>/i,
  2: /-->/,
  3: /\?>/,
  4: />/,
  5: /\]\]>/,
};

function htmlBlockType(line) {
  if (leadingWsWidth(line) > 3) return 0;
  const s = line.replace(/^ +/, '');
  for (const [re, type] of HTML_BLOCK_STARTS) {
    if (re.test(s)) return type;
  }
  return 0;
}

// Does `line` match every container in `stack` (blockquote / item)?
function lineMatchesStack(line, stack) {
  let cur = makeCursor();
  for (let d = 1; d < stack.length; d++) {
    const e = stack[d];
    if (e.kind === 'blockquote') {
      const nc = matchBlockquote(cur, line);
      if (!nc) return false;
      cur = nc;
    } else if (e.kind === 'item') {
      const nc = { idx: cur.idx, col: cur.col, partial: cur.partial };
      if (!cursorAdvance(nc, line, e.contentIndent)) return false;
      cur = nc;
    } else break;
  }
  return true;
}

// Should an HTML block ending after line `nextIdx` keep its trailing newline?
// Kept unless the next line is a blank line at the document level, or the
// next line does not match the block's container stack (container closes).
function htmlTrailNL(nextIdx, stack, inContainer, lines) {
  if (nextIdx >= lines.length) return true;
  const nextLine = lines[nextIdx].text;
  // marked's ge() keeps the HTML block's trailing newline when exactly one
  // \n follows the block. At the top level a blank line that CONTAINS
  // whitespace (spaces or tabs) breaks the newline run, so the newline is
  // kept; a truly empty blank line extends the run to 2+ newlines, so it
  // is dropped. Inside a container the blank line's indent is stripped
  // when the container src is built, so it is empty there and the newline
  // is always dropped.
  if (isBlankLine(nextLine)) return !inContainer && nextLine.length > 0;
  return lineMatchesStack(nextLine, stack);
}

function isThematicBreak(line) {
  // up to 3 leading spaces, then 3+ of the same char (-, _, *) with spaces between
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32 && i < 3) i++;
  if (i >= line.length) return false;
  const c = line.charCodeAt(i);
  if (c !== 45 && c !== 95 && c !== 42) return false;
  let count = 0;
  for (; i < line.length; i++) {
    const ch = line.charCodeAt(i);
    if (ch === c) count++;
    else if (ch !== 32 && ch !== 9) return false;
  }
  return count >= 3;
}

function parseAtx(line) {
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32 && i < 3) i++;
  if (i >= line.length || line.charCodeAt(i) !== 35) return null;
  let j = i;
  while (j < line.length && line.charCodeAt(j) === 35) j++;
  const level = j - i;
  if (level > 6) return null;
  if (j < line.length && line.charCodeAt(j) !== 32 && line.charCodeAt(j) !== 9) return null;
  let text = line.slice(j).replace(/[ \t]+$/, '');
  text = text.replace(/[ \t]+#+[ \t]*$/, '');
  text = text.replace(/^[ \t]+/, '');
  return { level, text };
}

function parseSetext(line) {
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32 && i < 3) i++;
  if (i >= line.length) return 0;
  const c = line.charCodeAt(i);
  if (c !== 61 && c !== 45) return 0;
  let j = i;
  while (j < line.length && line.charCodeAt(j) === c) j++;
  while (j < line.length && (line.charCodeAt(j) === 32 || line.charCodeAt(j) === 9)) j++;
  if (j !== line.length) return 0;
  return c === 61 ? 1 : 2;
}

function parseFence(line) {
  let i = 0;
  while (i < line.length && line.charCodeAt(i) === 32 && i < 3) i++;
  if (i >= line.length) return null;
  const c = line.charCodeAt(i);
  if (c !== 96 && c !== 126) return null;
  let j = i;
  while (j < line.length && line.charCodeAt(j) === c) j++;
  const len = j - i;
  if (len < 3) return null;
  let info = line.slice(j);
  if (c === 96 && info.includes('`')) return null;
  info = info.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '');
  return { ch: c, len, info };
}

// split a table row line into cells: marked's splitPipe (de) exactly.
// Escaped pipes are literal; unescaped pipes get a space inserted before
// them, then the row is split on ' |'. Code spans are NOT respected: an
// unescaped | inside a code span still splits the row. `cols` pads or
// truncates the row to the table's column count (rows only).
function splitTableRow(line, cols) {
  const t = line.replace(/\|/g, (r, o, i) => {
    let l = false, p = o;
    for (; --p >= 0 && i[p] === '\\';) l = !l;
    return l ? '|' : ' |';
  });
  const cells = t.split(/ \|/);
  if (!cells[0].trim()) cells.shift();
  if (cells.length > 0 && !cells[cells.length - 1].trim()) cells.pop();
  if (cols) {
    if (cells.length > cols) cells.splice(cols);
    else for (; cells.length < cols;) cells.push('');
  }
  for (let s = 0; s < cells.length; s++) cells[s] = cells[s].trim().replace(/\\\|/g, '|');
  return cells;
}

function parseTableDelimiter(line) {
  const cells = splitTableRow(line);
  if (cells.length === 0) return null;
  const align = [];
  for (const cell of cells) {
    if (!/^:?-+:?$/.test(cell)) return null;
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    align.push(left && right ? 'center' : right ? 'right' : left ? 'left' : null);
  }
  return align;
}

// Try to parse a link reference definition starting at lines[i].
// `getRemainder(k)` returns the remainder of lines[k] after the current
// container stack matches (or null if it does not match / is blank).
// Returns {consumed, label, dest, title} or null.
function tryRefDef(lines, i, getRemainder) {
  const first = getRemainder(i);
  if (first === null) return null;
  // collect the following lines' remainders (a title may span many lines)
  const rems = [first];
  for (let k = 1; k <= 9; k++) {
    if (i + k >= lines.length) break;
    const r = getRemainder(i + k);
    if (r === null) break;
    rems.push(r);
  }
  const joined = rems.join('\n');
  let p = 0;
  const n = joined.length;
  const skipWs = (allowNewline) => {
    while (p < n && (joined.charCodeAt(p) === 32 || joined.charCodeAt(p) === 9)) p++;
    if (allowNewline && p < n && joined[p] === '\n') {
      p++;
      while (p < n && (joined.charCodeAt(p) === 32 || joined.charCodeAt(p) === 9)) p++;
    }
  };
  // leading spaces (0..3)
  let lead = 0;
  while (p < n && joined.charCodeAt(p) === 32 && lead < 3) { p++; lead++; }
  if (p >= n || joined[p] !== '[') return null;
  p++;
  let label = '';
  while (p < n && joined[p] !== ']') {
    if (joined.charCodeAt(p) === 92 && p + 1 < n && isPunct(joined.charCodeAt(p + 1))) {
      label += joined[p]; label += joined[p + 1]; p += 2; // keep the backslash: labels match raw
    } else if (joined[p] === '[') {
      return null; // unescaped '[' in a label: not a valid ref def
    } else { label += joined[p]; p++; }
  }
  if (p >= n || label.length === 0) return null;
  if (normalizeLabel(label).length === 0) return null;
  p++; // ]
  if (p >= n || joined[p] !== ':') return null;
  p++;
  skipWs(true);
  if (p >= n) return null;
  // destination
  let dest = '';
  if (joined[p] === '<') {
    p++;
    while (p < n && joined[p] !== '>') {
      if (joined[p] === '\n' || joined[p] === '<') return null;
      if (joined.charCodeAt(p) === 92 && p + 1 < n) { dest += joined[p]; dest += joined[p + 1]; p += 2; continue; }
      dest += joined[p]; p++;
    }
    if (p >= n) return null;
    p++;
  } else {
    let depth = 0;
    const start = p;
    while (p < n) {
      const c = joined.charCodeAt(p);
      if (c === 92 && p + 1 < n && isPunct(joined.charCodeAt(p + 1))) { p += 2; continue; }
      if (c === 40) depth++;
      else if (c === 41) {
        if (depth === 0) break;
        depth--;
      } else if (c <= 32) break;
      p++;
    }
    if (p === start) return null;
    dest = joined.slice(start, p);
  }
  // After the dest: a title may follow on this line, or on the next line.
  // Only consume the newline when a title actually follows it.
  const skipSpaces = () => {
    while (p < n && (joined.charCodeAt(p) === 32 || joined.charCodeAt(p) === 9)) p++;
  };
  const pBeforeSkip = p;
  skipSpaces();
  const hadSameLineSpace = p > pBeforeSkip;
  // position right after the dest (for the dest-only fallback)
  const pDestEnd = p;
  let title = null;
  let nextLineTitle = false;
  if (p < n && joined[p] === '\n') {
    let q = p + 1;
    while (q < n && (joined.charCodeAt(q) === 32 || joined.charCodeAt(q) === 9)) q++;
    if (q < n && (joined[q] === '"' || joined[q] === "'" || joined[q] === '(')) { p = q; nextLineTitle = true; }
  }
  if (p < n && (joined[p] === '"' || joined[p] === "'" || joined[p] === '(')) {
    // a title must be separated from the dest by whitespace
    if (!hadSameLineSpace && !nextLineTitle) return null;
    const q = joined[p];
    const close = q === '(' ? ')' : q;
    p++;
    let t = '';
    let ok = false;
    while (p < n) {
      const c = joined.charCodeAt(p);
      if (c === 92 && p + 1 < n && isPunct(joined.charCodeAt(p + 1))) { t += joined[p + 1]; p += 2; continue; }
      if (joined[p] === close) { ok = true; break; }
      t += joined[p]; p++;
    }
    if (!ok) {
      // unterminated title: fall back to dest-only if the title was on the
      // next line, else the whole def is invalid
      if (nextLineTitle) {
        const consumed = joined.slice(0, pDestEnd).split('\n').length;
        return { consumed, label, dest, title: null };
      }
      return null;
    }
    title = t;
    p++;
    skipSpaces();
    if (p < n && joined[p] !== '\n') {
      // trailing junk after the title: same fallback as above
      if (nextLineTitle) {
        const consumed = joined.slice(0, pDestEnd).split('\n').length;
        return { consumed, label, dest, title: null };
      }
      return null;
    }
  }
  // only whitespace to end of line
  skipSpaces();
  if (p < n && joined[p] !== '\n') return null;
  const consumed = joined.slice(0, p).split('\n').length;
  return { consumed, label, dest, title };
}

function parseBlocks(lines, refs) {
  const root = { type: 'document', children: [] };
  // stack entries: {node, kind} kind: 'doc' | 'blockquote' | 'item' | 'leaf'
  // item entries also carry: list, contentIndent
  const stack = [{ node: root, kind: 'doc' }];
  let sawBlank = false;
  let i = 0;

  const top = () => stack[stack.length - 1];
  const parentNode = () => {
    for (let k = stack.length - 1; k >= 0; k--) {
      if (stack[k].kind !== 'leaf') return stack[k].node;
    }
    return root;
  };
  const inContainer = () => {
    for (let k = 1; k < stack.length; k++) {
      if (stack[k].kind === 'blockquote' || stack[k].kind === 'item') return true;
    }
    return false;
  };
  const innermostItem = () => {
    for (let k = stack.length - 1; k >= 0; k--) {
      if (stack[k].kind === 'item') return stack[k];
    }
    return null;
  };
  // mark the enclosing list loose when a blank line separates blocks/items
  const markLooseForBlock = () => {
    const p = parentNode();
    if (p.type !== 'item' || p.children.length === 0) return;
    const e = stack.find(x => x.node === p);
    if (e && e.list) e.list.tight = false;
  };
  const markLooseForItem = (list) => {
    if (list.children.length > 0) list.tight = false;
  };

  // remainder of lines[k] after matching the current container stack
  const remainderFor = (k) => {
    const line = lines[k].text;
    if (isBlankLine(line)) return null;
    let cur = makeCursor();
    for (let d = 1; d < stack.length; d++) {
      const e = stack[d];
      if (e.kind === 'blockquote') {
        const nc = matchBlockquote(cur, line);
        if (!nc) return null;
        cur = nc;
      } else if (e.kind === 'item') {
        const nc = { idx: cur.idx, col: cur.col, partial: cur.partial };
        if (!cursorAdvance(nc, line, e.contentIndent)) return null;
        cur = nc;
      } else break;
    }
    return cursorRest(cur, line);
  };

  while (i < lines.length) {
    const lineObj = lines[i];
    const line = lineObj.text;
    const blank = isBlankLine(line);

    // ---------- blank line ----------
    if (blank) {
      // A whitespace-only line containing a tab is NOT blank to marked's
      // table body regex (its blank lookahead is spaces-only): when the top
      // leaf is a table and no blockquote sits above it, it is a table row
      // of empty cells, and the table continues. (With a '>' marker the
      // line is not blank here and the reprocess loop handles it.)
      const tTopT = top();
      if (tTopT.kind === 'leaf' && tTopT.node.type === 'table' && line.indexOf('\t') >= 0) {
        let hasBQ0 = false;
        for (let k = 1; k < stack.length; k++) if (stack[k].kind === 'blockquote') { hasBQ0 = true; break; }
        if (!hasBQ0) {
          tTopT.node.rows.push(splitTableRow(line, tTopT.node.align.length));
          i++;
          continue;
        }
      }
      // A blank line inside a fenced/indented code block is content, not a
      // separator, so it does not set sawBlank (list looseness) — but a raw
      // blank line closes every open blockquote, and a code block inside
      // one of them is closed by the same line, so it is a separator, not
      // code content. (A code block at top level or inside a list item
      // survives a blank line, so it stays content there.)
      let hasBQ = false;
      for (let k = 1; k < stack.length; k++) if (stack[k].kind === 'blockquote') { hasBQ = true; break; }
      const tTop = top();
      const contentBlank = tTop.kind === 'leaf' && tTop.node.type === 'code' && !hasBQ;
      if (!contentBlank) sawBlank = true;
      // A raw blank line (no container markers) closes any open blockquote
      // and everything inside it, down to the nearest list item / document.
      // (A blank line inside a list item does not close the list.)
      if (hasBQ) {
        // A raw blank line closes every open blockquote (they need a >
        // marker on every line) and everything inside them, but it does
        // not close a list item that CONTAINS the blockquote: pop until
        // the top has no blockquote below it and is not itself one.
        while (stack.length > 1) {
          const t = top();
          let bqBelow = false;
          for (let k = 1; k < stack.length - 1; k++) if (stack[k].kind === 'blockquote') { bqBelow = true; break; }
          if (!bqBelow && t.kind !== 'blockquote') break;
          if (t.kind === 'leaf' && t.node.type === 'html') t.node.trailNL = false;
          stack.pop();
        }
        i++;
        continue;
      }
      const t = top();
      // a blank line closes an empty list item (one with no content yet);
      // the item stays in the list (renders <li></li>) but is popped from
      // the stack so following content goes outside the list
      if (t.kind === 'item' && t.node.children.length === 0) {
        stack.pop();
        i++;
        continue;
      }
      if (t.kind === 'leaf') {
        if (t.node.type === 'paragraph') stack.pop();
        else if (t.node.type === 'code') {
          // fenced: a whitespace-only line keeps its spaces (minus fence indent);
          // indented: a line with >=4 columns of indent is code content
          // (dedented by 4), a shorter blank line is empty
          const txt = t.node.fenced
            ? fenceContentText(t.node, line)
            : (leadingWsWidth(line) >= 4 ? stripColumns(line, 4) : '');
          t.node.lines.push({ text: txt, eol: lineObj.eol });
        }
        else if (t.node.type === 'html') {
          if (t.node.htmlType === 6 || t.node.htmlType === 7) {
            // type 6/7 raw regex swallows trailing blank lines (even
            // whitespace-only ones), so ge() always drops the newline
            t.node.trailNL = false;
            stack.pop();
          } else if (t.node.htmlType >= 1 && t.node.htmlType <= 5 &&
              HTML_BLOCK_ENDS[t.node.htmlType].test(t.node.lines.map(l => l.text).join('\n'))) {
            // block already complete (end marker present): the blank line ends
            // it; trailing newline kept only if inside a container
            t.node.trailNL = htmlTrailNL(i, stack, t.node.inContainer, lines);
            stack.pop();
          } else {
            t.node.lines.push({ text: '', eol: lineObj.eol });
            t.node.endLine = i;
          }
        } else if (t.node.type === 'table') stack.pop();
      }
      i++;
      continue;
    }

    // ---------- container matching ----------
    let cur = makeCursor();
    let depth = 1;
    let failedAt = -1;
    // frame column of the remainder's first char, when the innermost
    // matched container is a blockquote (null otherwise); a list item
    // re-bases nothing, so absolute columns apply past it
    let bqFcol = null;
    while (depth < stack.length) {
      const e = stack[depth];
      if (e.kind === 'blockquote') {
        const nc = matchBlockquote(cur, line);
        if (!nc) { failedAt = depth; break; }
        cur = nc; depth++;
        bqFcol = nc.fcol !== undefined ? nc.fcol : null;
      } else if (e.kind === 'item') {
        // a blank remainder matches a list item (a blank line is allowed
        // inside an item and does not need the content indent)
        if (isBlankLine(cursorRest(cur, line))) { depth++; continue; }
        const nc = { idx: cur.idx, col: cur.col, partial: cur.partial };
        if (!cursorAdvance(nc, line, e.contentIndent)) { failedAt = depth; break; }
        cur = nc; depth++;
        bqFcol = null;
      } else break;
    }

    // ---------- a container failed to match ----------
    if (failedAt >= 0) {
      const t = top();
      // A fenced code block that already has content keeps consuming lines
      // that fail only a LIST ITEM container (cmark rule: the fence's lines
      // need not re-match the item indent once the fence has content); a
      // line that fails a BLOCKQUOTE still closes the fence, and an empty
      // fence closes too. A closing fence on the remainder after the
      // containers that did match still closes the fence (then reprocesses
      // as a new fence at the reduced depth).
      // a blockquote that also fails (deeper in the stack) closes the
      // fence: the line is outside the quote, not fence content
      let bqFails = false;
      for (let k = failedAt; k < stack.length; k++) if (stack[k].kind === 'blockquote') { bqFails = true; break; }
      if (t.kind === 'leaf' && t.node.type === 'code' && t.node.fenced &&
          t.node.lines.length > 0 && stack[failedAt] && stack[failedAt].kind === 'item' && !bqFails) {
        const rem = cursorRest(cur, line);
        const f = parseFence(rem);
        if (!(f && f.ch === t.node.fenceCh && f.len >= t.node.fenceLen && !f.info)) {
          const txt = fenceContentText(t.node, rem);
          t.node.lines.push({ text: txt, eol: lineObj.eol });
          i++;
          continue;
        }
      }
      if (t.kind === 'leaf' && t.node.type === 'html') {
        t.node.trailNL = false;
      }
      const isPara = t.kind === 'leaf' && t.node.type === 'paragraph';
      if (isPara) {
        // lazy continuation? check the remainder after the containers that
        // DID match (not the raw line) — a '>' that matched an outer quote
        // is not an interrupting block
        let rem = cursorRest(cur, line);
        // a leading tab of a lazy line expands exactly as in the
        // all-containers-matched path (from the innermost matched
        // blockquote's frame column, else the absolute column)
        {
          const rc = restStartCol(cur);
          if (rc > 0) rem = expandLeadingTabs(rem, (bqFcol !== null && cur.partial === 0) ? bqFcol : rc);
        }
        // a blank remainder is NOT a lazy continuation: the line is blank
        // within the containers that did match, so it closes the failed
        // containers (and ends the paragraph) instead
        if (isBlankLine(rem)) { /* fall through to close containers */ }
        else {
        const lazyParent = stack.length >= 2 ? stack[stack.length - 2] : null;
        const canInterrupt = startsInterruptBlock(rem, true, !!lazyParent && lazyParent.kind === 'item');
        // if the failed container is a list item, any list marker is a new
        // item in that list (not a lazy continuation), even an empty one
        // or one whose number does not start at 1
        const failedIsItem = failedAt >= 0 && failedAt < stack.length && stack[failedAt].kind === 'item';
        const isListMarker = failedIsItem && parseListMarker(rem) !== null;
        // NB: a setext underline does NOT block lazy continuation — a lazy
        // '=' line is paragraph text, not a heading underline (a '---' line
        // still interrupts via startsInterruptBlock, as a thematic break)
        if (!canInterrupt && !isListMarker) {
          // lazy continuation: strip 4 columns if W >= 4, else keep as-is
          const w = leadingWsWidth(rem, restStartCol(cur));
          let text = w >= 4 ? stripColumns(rem, 4, restStartCol(cur)) : rem;
          // a lazy '=' setext line in a paragraph that already has >=2
          // lines is indented by 4 spaces (cmark quirk, spec ex. 93)
          if (parseSetext(rem) === 1 && t.node.lines.length >= 2) text = '    ' + text;
          t.node.lines.push(text);
          i++;
          continue;
        }
        }
      }
      // close everything down to the last matched container
      while (stack.length > failedAt) stack.pop();
      // re-process this line at the reduced depth (loop without advancing i)
      continue;
    }

    // ---------- all containers matched ----------
    let rem = cursorRest(cur, line);
    // absolute column of rem[0]: tabs inside rem take their width from it
    let remCol = restStartCol(cur);
    // inside a container, a leading tab of the remainder expands to spaces
    // (top-level remainders keep it literal). When the innermost container
    // is a blockquote, expand from its frame column (marker indent + 2),
    // not the absolute column: marked re-bases each quote level.
    const expandCol = (bqFcol !== null && cur.partial === 0) ? bqFcol : remCol;
    if (remCol > 0) rem = expandLeadingTabs(rem, expandCol);
    // process the remainder; may loop (new containers opened, leaves closed)
    let reprocess = true;
    while (reprocess) {
      reprocess = false;
      if (isBlankLine(rem)) {
        // A whitespace-only line containing a tab is NOT blank to marked's
        // table body regex (its blank lookahead is spaces-only): it is a
        // table row of empty cells, and the table continues.
        const t0r = top();
        if (t0r.kind === 'leaf' && t0r.node.type === 'table' && rem.indexOf('\t') >= 0) {
          t0r.node.rows.push(splitTableRow(rem, t0r.node.align.length));
          i++;
          break;
        }
        // A blank line sets sawBlank (list looseness) only when it separates
        // blocks at the list-item level: no blockquote may sit between the
        // innermost list item and the top of the stack (a blank line inside
        // such a blockquote does not separate the item's own children).
        // A blank line inside a code leaf is content, not a separator.
        const t0b = top();
        const codeBlank = t0b.kind === 'leaf' && t0b.node.type === 'code';
        let itemDepth = -1;
        for (let k = stack.length - 1; k >= 1; k--) {
          if (stack[k].kind === 'item') { itemDepth = k; break; }
        }
        let bqAboveItem = false;
        if (itemDepth >= 0) {
          for (let k = itemDepth + 1; k < stack.length; k++) {
            if (stack[k].kind === 'blockquote') { bqAboveItem = true; break; }
          }
        }
        if (!codeBlank && !bqAboveItem) sawBlank = true;
        const t0 = top();
        if (t0.kind === 'leaf') {
          if (t0.node.type === 'paragraph') {
            // a non-empty whitespace remainder (e.g. '>  ' leaves ' ') is a
            // paragraph continuation line, not a blank line
            if (rem.length > 0) t0.node.lines.push(rem);
            else stack.pop();
          }
          else if (t0.node.type === 'code') {
            // fenced: a whitespace-only line keeps its spaces (minus fence indent);
            // indented: a line with >=4 columns of indent is code content
            const txt = t0.node.fenced
              ? fenceContentText(t0.node, rem)
              : (leadingWsWidth(rem, remCol) >= 4 ? stripColumns(rem, 4, remCol) : '');
            t0.node.lines.push({ text: txt, eol: lineObj.eol });
          }
          else if (t0.node.type === 'html') {
            if (t0.node.htmlType === 6 || t0.node.htmlType === 7) {
              t0.node.endedAtBlank = true;
              stack.pop();
            } else { t0.node.lines.push({ text: '', eol: lineObj.eol }); t0.node.endLine = i; }
          } else if (t0.node.type === 'table') stack.pop();
        }
        i++;
        break;
      }
      const t = top();
      const leaf = t.kind === 'leaf' ? t.node : null;

      if (leaf && leaf.type === 'paragraph') {
        // setext?
        const sl = parseSetext(rem);
        if (sl) {
          stack.pop();
          // heading text: paragraph lines joined, with leading whitespace
          // of the first line and trailing whitespace of the last stripped
          const text = leaf.lines.join('\n').replace(/^[ \t]+/, '').replace(/[ \t]+$/, '');
          const par = parentNode();
          par.children.pop();
          par.children.push({ type: 'heading', level: sl, text });
          sawBlank = false;
          i++;
          break;
        }
        // table delimiter? (delimiter row may have at most 3 leading columns)
        const align = leadingWsWidth(rem) <= 3 ? parseTableDelimiter(rem) : null;
        if (align) {
          const linesArr = leaf.lines;
          const headerLine = linesArr[linesArr.length - 1];
          const header = splitTableRow(headerLine);
          if (header.length === align.length) {
            stack.pop();
            const par = parentNode();
            par.children.pop();
            if (linesArr.length > 1) {
              par.children.push({ type: 'paragraph', lines: linesArr.slice(0, -1) });
            }
            const table = { type: 'table', header, align, rows: [] };
            par.children.push(table);
            stack.push({ node: table, kind: 'leaf' });
            sawBlank = false;
            i++;
            break;
          }
        }
        // a block that can interrupt a paragraph?
        const parentEntry = stack.length >= 2 ? stack[stack.length - 2] : null;
        const parentIsItem = !!parentEntry && parentEntry.kind === 'item';
        if (startsInterruptBlock(rem, false, parentIsItem)) {
          stack.pop();
          reprocess = true;
          continue;
        }
        // continuation line: inside a list item, 4+ columns of leading
        // whitespace are stripped (the would-be indented-code indent); in a
        // blockquote or at the top level the spaces are kept as-is
        let text = rem;
        if (parentIsItem) {
          const w = leadingWsWidth(rem, remCol);
          if (w >= 4) text = ' '.repeat(w - 4) + rem.slice(rem.search(/[^ \t]/));
        }
        leaf.lines.push(text);
        i++;
        break;
      }

      if (leaf && leaf.type === 'code' && leaf.fenced) {
        const f = parseFence(rem);
        // closing fence: same char, >= opening length, and NO info string
        if (f && f.ch === leaf.fenceCh && f.len >= leaf.fenceLen && !f.info) {
          stack.pop();
          i++;
          break;
        }
        leaf.lines.push({ text: fenceContentText(leaf, rem), eol: lineObj.eol });
        i++;
        break;
      }

      if (leaf && leaf.type === 'code' && !leaf.fenced) {
        const w = leadingWsWidth(rem, remCol);
        if (w >= 4) {
          leaf.lines.push({ text: stripColumns(rem, 4, remCol), eol: lineObj.eol });
          i++;
          break;
        }
        stack.pop();
        reprocess = true;
        continue;
      }

      if (leaf && leaf.type === 'html') {
        const endRe = HTML_BLOCK_ENDS[leaf.htmlType];
        if (endRe && endRe.test(rem)) {
          leaf.lines.push({ text: rem, eol: lineObj.eol });
          leaf.endLine = i;
          leaf.trailNL = htmlTrailNL(i + 1, stack, leaf.inContainer, lines);
          stack.pop();
          i++;
          break;
        }
        if ((leaf.htmlType === 6 || leaf.htmlType === 7) && isBlankLine(rem)) {
          stack.pop();
          reprocess = true;
          continue;
        }
        leaf.lines.push({ text: rem, eol: lineObj.eol });
        leaf.endLine = i;
        i++;
        break;
      }

      if (leaf && leaf.type === 'table') {
        if (startsInterruptBlock(rem, false) && !isTableRowLine(rem)) {
          stack.pop();
          reprocess = true;
          continue;
        }
        leaf.rows.push(splitTableRow(rem, leaf.align.length));
        i++;
        break;
      }

      // ---------- no leaf: start a new block ----------
      // (leaf is null here, or the leaf was just closed and we reprocess)
      const t2 = top();
      if (t2.kind === 'leaf') { stack.pop(); reprocess = true; continue; }

      // link reference definition?
      const def = tryRefDef(lines, i, remainderFor);
      if (def) {
        if (!refs.has(normalizeLabel(def.label))) {
          refs.set(normalizeLabel(def.label), { dest: def.dest, title: def.title });
        }
        // a ref def after a blank line still separates blocks (looseness)
        if (sawBlank) { markLooseForBlock(); sawBlank = false; }
        i += def.consumed;
        sawBlank = false;
        break;
      }

      // fenced code
      const fence = parseFence(rem);
      if (fence) {
        if (sawBlank) { markLooseForBlock(); sawBlank = false; }
        const code = { type: 'code', fenced: true, fenceCh: fence.ch, fenceLen: fence.len, info: fence.info, fenceIndent: leadingWsWidth(rem), lines: [] };
        parentNode().children.push(code);
        stack.push({ node: code, kind: 'leaf' });
        i++;
        break;
      }
      // ATX heading
      const atx = parseAtx(rem);
      if (atx) {
        if (sawBlank) { markLooseForBlock(); sawBlank = false; }
        parentNode().children.push({ type: 'heading', level: atx.level, text: atx.text });
        i++;
        break;
      }
      // HTML block
      const ht = htmlBlockType(rem);
      if (ht) {
        if (sawBlank) { markLooseForBlock(); sawBlank = false; }
        const html = { type: 'html', htmlType: ht, lines: [{ text: rem, eol: lineObj.eol }], endLine: i, inContainer: inContainer(), trailNL: true };
        parentNode().children.push(html);
        const endRe = HTML_BLOCK_ENDS[ht];
        if (endRe && endRe.test(rem)) {
          // ends on the same line: set trailNL from the following line now,
          // since the block never reaches the stack
          html.trailNL = htmlTrailNL(i + 1, stack, html.inContainer, lines);
          i++;
          break;
        }
        stack.push({ node: html, kind: 'leaf' });
        i++;
        break;
      }
      // thematic break
      if (isThematicBreak(rem)) {
        if (sawBlank) { markLooseForBlock(); sawBlank = false; }
        parentNode().children.push({ type: 'hr' });
        i++;
        break;
      }
      // blockquote
      {
        const bq = matchBlockquote(makeCursor(), rem);
        if (bq) {
          if (sawBlank) { markLooseForBlock(); sawBlank = false; }
          const bqn = { type: 'blockquote', children: [] };
          parentNode().children.push(bqn);
          stack.push({ node: bqn, kind: 'blockquote' });
          remCol += restStartCol(bq);
          rem = cursorRest(bq, rem);
          if (remCol > 0) rem = expandLeadingTabs(rem, remCol);
          reprocess = true;
          continue;
        }
      }
      // list
      const lm = parseListMarker(rem);
      if (lm) {
        // find or create the list
        const parent = parentNode();
        const last = parent.children[parent.children.length - 1];
        let list = null;
        let continuing = false;
        if (last && last.type === 'list' && last.marker === lm.marker &&
            last.ordered === lm.ordered) {
          list = last;
          continuing = true;
        } else {
          list = { type: 'list', ordered: lm.ordered, start: lm.start, marker: lm.marker, tight: true, children: [] };
          parent.children.push(list);
        }
        if (sawBlank) {
          if (continuing) markLooseForItem(list);
          else markLooseForBlock();
          sawBlank = false;
        }
        const item = { type: 'item', children: [] };
        list.children.push(item);
        stack.push({ node: item, kind: 'item', list, contentIndent: lm.contentIndent });
        remCol += lm.restCol;
        rem = lm.rest;
        if (remCol > 0) rem = expandLeadingTabs(rem, remCol);
        // an empty item (no content on the line) has no leaf; continue
        if (rem === '' || isBlankLine(rem)) {
          i++;
          break;
        }
        reprocess = true;
        continue;
      }
      // indented code
      {
        const w = leadingWsWidth(rem, remCol);
        if (w >= 4) {
          if (sawBlank) { markLooseForBlock(); sawBlank = false; }
          const code = { type: 'code', fenced: false, info: null, lines: [{ text: stripColumns(rem, 4, remCol), eol: lineObj.eol }] };
          parentNode().children.push(code);
          stack.push({ node: code, kind: 'leaf' });
          i++;
          break;
        }
      }
      // paragraph (default)
      if (sawBlank) { markLooseForBlock(); sawBlank = false; }
      const para = { type: 'paragraph', lines: [rem] };
      parentNode().children.push(para);
      stack.push({ node: para, kind: 'leaf' });
      i++;
      break;
    }
  }
  finalizeHtml(root, lines);
  return root;
}

// Does `rem` start a block that can interrupt a paragraph?
// `lazy` is true when checking a lazy-continuation candidate (raw line).
// `paraInItem` is true when the paragraph sits directly in a list item:
// there, an ordered list interrupts regardless of its start number (marked
// lexes the item's content on its own); elsewhere an ordered list interrupts
// only when it starts at 1. Tables keep the start-at-1 rule (pass false).
function startsInterruptBlock(rem, lazy, paraInItem) {
  if (parseFence(rem)) return true;
  if (parseAtx(rem)) return true;
  const ht = htmlBlockType(rem);
  if (ht >= 1 && ht <= 6) return true;
  if (isThematicBreak(rem)) return true;
  if (matchBlockquote(makeCursor(), rem)) return true;
  const lm = parseListMarker(rem);
  if (lm && lm.rest !== '' && !isBlankLine(lm.rest) && (!lm.ordered || lm.start === 1 || paraInItem)) return true;
  return false;
}

// A table row line: a non-blank line that does not start a new block.
function isTableRowLine(rem) {
  return !startsInterruptBlock(rem, false) && leadingWsWidth(rem) < 4;
}

// Parse a list marker at the start of `rem`.
// Returns {ordered, start, marker, contentIndent, rest} or null.
function parseListMarker(rem) {
  let i = 0;
  while (i < rem.length && rem.charCodeAt(i) === 32 && i < 3) i++;
  if (i >= rem.length) return null;
  const c = rem.charCodeAt(i);
  let ordered = false, start = 1, marker = '', mlen = 0;
  if (c === 45 || c === 42 || c === 43) {
    marker = rem[i];
    mlen = 1;
  } else if (isDigit(c)) {
    let j = i;
    while (j < rem.length && isDigit(rem.charCodeAt(j)) && j - i < 9) j++;
    if (j - i > 9) return null;
    const d = rem.charCodeAt(j);
    if (d !== 46 && d !== 41) return null;
    if (j === i) return null;
    ordered = true;
    start = parseInt(rem.slice(i, j), 10);
    marker = ordered ? (d === 46 ? '.' : ')') : '';
    mlen = (j - i) + 1;
  } else return null;
  const after = i + mlen;
  // need whitespace or end of line after the marker
  if (after < rem.length) {
    const cc = rem.charCodeAt(after);
    if (cc !== 32 && cc !== 9) return null;
  }
  // content indent: marker + whitespace (1..4 cols); >=5 cols -> marker + 1.
  // wsCols counts the columns actually advanced, including the part of a tab
  // the 5-column cap lands inside (advanceWs stops at the tab's start col).
  let contentIndent = i + mlen + 1;
  let rest = '';
  let restCol = i + mlen + 1;
  if (after >= rem.length) {
    rest = '';
  } else {
    const adv = advanceWs(rem, after, 5, i + mlen);
    const tabW = adv.partial > 0 ? 4 - (adv.col % 4) : 0;
    const wsCols = (adv.col - (i + mlen)) + (adv.partial > 0 ? tabW - adv.partial : 0);
    if (wsCols >= 5) {
      contentIndent = i + mlen + 1;
      const a2 = advanceWs(rem, after, 1, i + mlen);
      rest = cursorRest(a2, rem);
      restCol = i + mlen + 1;
    } else {
      contentIndent = i + mlen + wsCols;
      rest = cursorRest(adv, rem);
      restCol = adv.partial > 0 ? adv.col + tabW - adv.partial : adv.col;
    }
  }
  // an empty item (no content after the marker): the spaces after the
  // marker do not count; content indent is marker width + 1
  if (rest === '' || isBlankLine(rest)) contentIndent = i + mlen + 1;
  return { ordered, start, marker: ordered ? marker : marker, contentIndent, rest, restCol };
}

// ---------------------------------------------------------------- renderer

function codeText(node) {
  const lines = node.lines.slice();
  if (node.fenced) {
    if (lines.length > 0 && lines[lines.length - 1].text === '') lines.pop();
  } else {
    while (lines.length > 0 && lines[lines.length - 1].text === '') lines.pop();
  }
  if (lines.length === 0) return '';
  let out = lines.map(l => l.text).join('\n');
  if (lines[lines.length - 1].eol) out += '\n';
  return out;
}

function htmlText(node) {
  return node.text || '';
}

// After parsing, finalize each HTML block's raw text: lines joined with \n,
// plus a trailing \n iff the last content line had a line ending and the
// following source line is not blank.
function finalizeHtml(node, lines) {
  if (!node) return;
  if (node.type === 'html') {
    let out = node.lines.map(l => l.text).join('\n');
    const lastEol = node.lines.length > 0 && node.lines[node.lines.length - 1].eol;
    if (lastEol && node.trailNL !== false) out += '\n';
    node.text = out;
  }
  if (node.children) {
    for (const c of node.children) finalizeHtml(c, lines);
  }
}

function joinChildren(parts) {
  let out = '';
  for (const p of parts) {
    if (out.length > 0 && !out.endsWith('\n')) out += '\n';
    out += p;
  }
  return out;
}

function renderBlocks(node, refs, state) {
  switch (node.type) {
    case 'document':
      return node.children.map(c => renderBlocks(c, refs, state)).join('');
    case 'paragraph':
      return '<p>' + inlineParse(node.lines.join('\n'), refs, true, state) + '</p>\n';
    case 'heading':
      return '<h' + node.level + '>' + inlineParse(node.text, refs, true, state) + '</h' + node.level + '>\n';
    case 'code': {
      const text = escapeCode(codeText(node));
      if (node.fenced && node.info) {
        const rawLang = node.info.split(/\s+/)[0];
        // decode backslash escapes in the info word (foo\+bar -> foo+bar)
        let lang = '';
        for (let li = 0; li < rawLang.length; li++) {
          if (rawLang.charCodeAt(li) === 92 && li + 1 < rawLang.length && isPunct(rawLang.charCodeAt(li + 1))) { lang += rawLang[li + 1]; li++; }
          else lang += rawLang[li];
        }
        return '<pre><code class="language-' + escapeAttr(lang) + '">' + text + '</code></pre>\n';
      }
      return '<pre><code>' + text + '</code></pre>\n';
    }
    case 'html':
      return htmlText(node);
    case 'hr':
      return '<hr>\n';
    case 'blockquote':
      return '<blockquote>\n' + node.children.map(c => renderBlocks(c, refs, state)).join('') + '</blockquote>\n';
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul';
      const open = node.ordered && node.start !== 1
        ? '<' + tag + ' start="' + node.start + '">\n'
        : '<' + tag + '>\n';
      return open + node.children.map(it => renderItem(it, node, refs, state)).join('') + '</' + tag + '>\n';
    }
    case 'table': {
      let out = '<table>\n<thead>\n<tr>\n';
      for (let k = 0; k < node.header.length; k++) {
        const a = node.align[k];
        out += '<th' + (a ? ' align="' + a + '"' : '') + '>' +
          inlineParse(node.header[k], refs, true, state) + '</th>\n';
      }
      out += '</tr>\n</thead>\n';
      if (node.rows.length > 0) {
        out += '<tbody>';
        for (const row of node.rows) {
          out += '<tr>\n';
          for (let k = 0; k < node.header.length; k++) {
            const a = node.align[k];
            const cell = k < row.length ? row[k] : '';
            out += '<td' + (a ? ' align="' + a + '"' : '') + '>' +
              inlineParse(cell, refs, true, state) + '</td>\n';
          }
          out += '</tr>\n';
        }
        out += '</tbody>';
      }
      out += '</table>\n';
      return out;
    }
  }
  return '';
}

function renderItem(item, list, refs, state) {
  let prefix = '';
  let children = item.children;
  const first = children[0];
  if (first && first.type === 'paragraph' && first.lines.length > 0) {
    const m = /^\[([ xX])\][ \t]/.exec(first.lines[0]);
    if (m) {
      const checked = m[1] === 'x' || m[1] === 'X';
      prefix = checked
        ? '<input checked="" disabled="" type="checkbox">'
        : '<input disabled="" type="checkbox">';
      // strip only the '[ ]' / '[x]' (3 chars); keep the following space
      // so the output reads '<input ...> foo'
      const mod = {
        type: 'paragraph',
        lines: [first.lines[0].slice(3)].concat(first.lines.slice(1)),
      };
      children = [mod].concat(children.slice(1));
    }
  }
  const parts = children.map(c => {
    if (c.type === 'paragraph' && list.tight) {
      return inlineParse(c.lines.join('\n'), refs, true, state);
    }
    return renderBlocks(c, refs, state);
  });
  let body = parts.join('');
  if (prefix) {
    // tight: checkbox precedes the inline text; loose: it goes inside
    // the first <p> (the task paragraph's own paragraph)
    body = list.tight ? prefix + body : body.replace('<p>', '<p>' + prefix);
  }
  return '<li>' + body + '</li>\n';
}

export function parse(markdown) {
  const refs = new Map();
  // document-wide inline lexer state (mirrors marked's Lexer.state):
  // a raw <a ...> tag opens a link context that suppresses extended
  // autolinks until a </a> closes it; it is NOT reset between blocks,
  // so an unclosed <a> poisons the rest of the document.
  const state = { inLink: false };
  const lines = splitLines(markdown);
  const root = parseBlocks(lines, refs);
  return renderBlocks(root, refs, state);
}
