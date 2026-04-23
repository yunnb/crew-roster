import { maskSSN } from './formatters';

const S = 3; // 1mm → 3px  (210mm × 297mm = 630 × 891 px)
const W = 210 * S;
const H = 297 * S;
const COLS = 2;
const ROWS = 3;

function drawImageOnCanvas(ctx, src, x, y, w, h, placeholder) {
  return new Promise(resolve => {
    const drawPlaceholder = () => {
      ctx.fillStyle = '#F2F4F6';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 2 * S);
      ctx.fill();
      ctx.fillStyle = '#CDD3DA';
      ctx.font = `${3.5 * S}px Pretendard,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(placeholder, x + w / 2, y + h / 2 + S);
      resolve();
    };

    if (!src) { drawPlaceholder(); return; }

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 2 * S);
      ctx.clip();
      const r = Math.max(w / img.width, h / img.height);
      const dw = img.width * r;
      const dh = img.height * r;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
      resolve();
    };
    img.onerror = drawPlaceholder;
    img.src = src;
  });
}

async function drawCard(ctx, person, x, y, cW, cH) {
  const ip = 4 * S;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(x, y, cW, cH, 3 * S);
  ctx.fill();
  ctx.strokeStyle = '#E5E8EB';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  const imgW = cW - ip * 2;
  const imgH = Math.round(cH * 0.32);
  await drawImageOnCanvas(ctx, person.idImage, x + ip, y + ip, imgW, imgH, '신분증 없음');

  let ty = y + ip + imgH + 4 * S;
  const cx = x + cW / 2;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#191F28';
  ctx.font = `bold ${6 * S}px Pretendard,sans-serif`;
  ctx.fillText(person.name, cx, ty + 5 * S);
  ty += 9 * S;

  ctx.fillStyle = '#4E5968';
  ctx.font = `${4 * S}px Pretendard,sans-serif`;

  const addLine = text => {
    if (!text) return;
    ctx.fillText(text, cx, ty + 4 * S);
    ty += 7 * S;
  };

  addLine(maskSSN(person.ssn));
  addLine(person.phone);

  if (person.address) {
    const maxW = cW - ip * 2;
    const displayed = ctx.measureText(person.address).width > maxW
      ? person.address.slice(0, 22) + '…'
      : person.address;
    addLine(displayed);
  }
}

export async function renderA4(people, pageIdx = 1, totalPages = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Header
  const headerH = 18 * S;
  const P = 7 * S;

  ctx.fillStyle = '#191F28';
  ctx.font = `bold ${6 * S}px Pretendard,sans-serif`;
  ctx.textAlign = 'left';
  // ctx.fillText('인력 명단', P, headerH / 2 + 5 * S);

  ctx.fillStyle = '#8B95A1';
  ctx.font = `${4 * S}px Pretendard,sans-serif`;
  ctx.textAlign = 'right';
  // ctx.fillText(`${pageIdx} / ${totalPages} 페이지`, W - P, headerH / 2 + 5 * S);

  ctx.strokeStyle = '#E5E8EB';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(P, headerH + 2);
  ctx.lineTo(W - P, headerH + 2);
  // ctx.stroke();

  // Grid layout
  const G = 4 * S;
  const contentTop = headerH + P;
  const contentH = H - contentTop - P;
  const cW = (W - P * 2 - G * (COLS - 1)) / COLS;
  const cH = (contentH - G * (ROWS - 1)) / ROWS;

  for (let i = 0; i < Math.min(people.length, COLS * ROWS); i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = P + col * (cW + G);
    const y = contentTop + row * (cH + G);
    await drawCard(ctx, people[i], x, y, cW, cH);
  }

  return canvas;
}
