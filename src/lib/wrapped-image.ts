interface RecapGraphic {
  title: string;
  stats: [label: string, value: string][];
  note: string;
}

export async function wrappedImage(recap: RecapGraphic): Promise<File> {
  await document.fonts.ready;
  const artwork = document.createElement('canvas');
  artwork.width = 1080;
  artwork.height = 1080;
  const ctx = artwork.getContext('2d');
  if (!ctx) throw new Error('Could not render the recap image.');
  const styles = getComputedStyle(document.documentElement);
  const color = (token: string) => styles.getPropertyValue(token).trim();
  const display = color('--display');
  const body = color('--body');
  ctx.fillStyle = color('--pine');
  ctx.fillRect(0,0,1080,1080);
  ctx.textBaseline = 'top';
  ctx.fillStyle = color('--butter');
  ctx.font = '750 28px ' + body;
  ctx.fillText('MUTTA PUFFS EVERYWHERE',76,80);
  ctx.fillStyle = color('--cream');
  ctx.font = '650 88px ' + display;
  ctx.fillText(recap.title,76,144,928);
  for (const [index,[label,value]] of recap.stats.entries()) {
    const x = 76 + (index % 2) * 474;
    const y = 316 + Math.floor(index / 2) * 205;
    ctx.strokeStyle = color('--sage');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x,y,453,175,22);
    ctx.stroke();
    ctx.font = '750 28px ' + body;
    ctx.fillText(label,x + 26,y + 24);
    ctx.font = '650 67px ' + display;
    ctx.fillText(value,x + 26,y + 64,395);
  }
  ctx.font = '550 35px ' + body;
  const lines: string[] = [];
  for (const word of recap.note.split(/\s+/)) {
    const current = lines.at(-1) ?? '';
    const candidate = current ? current + ' ' + word : word;
    if (!current || ctx.measureText(candidate).width > 928) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }
  for (const [index,line] of lines.slice(0,3).entries()) ctx.fillText(line,76,780 + index * 48,928);
  ctx.fillStyle = color('--butter');
  ctx.font = '750 24px ' + body;
  ctx.fillText('PUFF PASSPORT',76,991);
  return new Promise((resolve,reject) => {
    artwork.toBlob(blob => {
      if (blob) resolve(new File([blob],'puff-wrapped-' + recap.title.slice(0,4) + '.png',{type:'image/png'}));
      else reject(new Error('Could not save the recap image.'));
    },'image/png');
  });
}
