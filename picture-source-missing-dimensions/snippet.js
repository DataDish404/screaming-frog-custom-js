const rows = [];
let trueGaps = 0;

document.querySelectorAll('picture').forEach(function (picture) {
  const img = picture.querySelector('img');
  const imgHasDims = !!img && img.hasAttribute('width') && img.hasAttribute('height');
  const imgDims = img ? (img.getAttribute('width') + 'x' + img.getAttribute('height')) : 'no img';

  picture.querySelectorAll('source').forEach(function (source) {
    const hasDims = source.hasAttribute('width') && source.hasAttribute('height');
    if (!hasDims) {
      rows.push(
        (source.getAttribute('type') || 'no type') +
        ' | ' + (source.getAttribute('srcset') || 'no srcset') +
        ' | img_covers:' + imgHasDims +
        ' | img_dims:' + imgDims
      );
      if (!imgHasDims) trueGaps++;
    }
  });
});

return seoSpider.data([rows.length, trueGaps, rows.join(' || ') || 'none']);
