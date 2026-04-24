import { fmtSSN } from './formatters';

const S = 8; // 1mm → 8px  (210×297mm = 1680×2376px, ~200 DPI)
const W = 210 * S;
const H = 297 * S;
const COLS = 2;
const ROWS = 3;

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawImg(ctx, img, x, y, w, h) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w / img.width, h / img.height);
  const dw = img.width * r;
  const dh = img.height * r;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

async function drawCard(ctx, person, x, y, cW, cH) {
  const ip = 3 * S;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, cW, cH);
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, cW, cH);

  const [idImg, licImg] = await Promise.all([
    person.idImage ? loadImage(person.idImage) : Promise.resolve(null),
    person.licenseImage ? loadImage(person.licenseImage) : Promise.resolve(null),
  ]);

  // Images fill card width for maximum clarity
  const imgW = cW - ip * 2;
  const imgH = Math.round(cH * 0.31);
  const imgGap = 2 * S;

  const imgs = [idImg, licImg].filter(Boolean);
  const imgBlockH = imgs.length > 0 ? imgs.length * imgH + (imgs.length - 1) * imgGap : 0;

  // Text
  const fontSize = 4.5 * S;
  ctx.font = `${fontSize}px Pretendard,sans-serif`;
  const maxTW = cW - ip * 2;
  const textLines = [
    person.name || null,
    person.ssn ? fmtSSN(person.ssn) : null,
    person.phone || null,
    person.address
      ? (ctx.measureText(person.address).width > maxTW
          ? person.address.slice(0, 20) + '…'
          : person.address)
      : null,
  ].filter(Boolean);

  const lineH = 6 * S;
  const textBlockH = textLines.length * lineH;
  const sectionGap = imgBlockH > 0 ? 2 * S : 0;
  const totalH = imgBlockH + sectionGap + textBlockH;

  // Bottom-align
  let curY = y + cH - ip - totalH;
  const imgX = x + ip;

  for (let i = 0; i < imgs.length; i++) {
    drawImg(ctx, imgs[i], imgX, curY, imgW, imgH);
    curY += imgH + (i < imgs.length - 1 ? imgGap : 0);
  }

  curY += sectionGap;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#111827';
  const cx = x + cW / 2;
  for (const line of textLines) {
    curY += lineH * 0.78;
    ctx.fillText(line, cx, curY);
    curY += lineH * 0.22;
  }
}

export async function renderA4(people) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  const P = 6 * S;
  const G = 4 * S;
  const cW = (W - P * 2 - G * (COLS - 1)) / COLS;
  const cH = (H - P * 2 - G * (ROWS - 1)) / ROWS;

  for (let i = 0; i < Math.min(people.length, COLS * ROWS); i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = P + col * (cW + G);
    const y = P + row * (cH + G);
    await drawCard(ctx, people[i], x, y, cW, cH);
  }

  return canvas;
}
