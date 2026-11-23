(() => {
  const entries = [
    ['Ca', 2, 'Calcium fluoride'], ['Li', 1, 'Lithium fluoride'], ['Al', 3, 'Aluminium fluoride'],
    ['Na', 1, 'Sodium fluoride'], ['Mg', 2, 'Magnesium fluoride'], ['Si', 4, 'Silicon tetrafluoride'],
    ['K', 1, 'Potassium fluoride'], ['B', 3, 'Boron trifluoride'], ['Sr', 2, 'Strontium fluoride'],
    ['C', 4, 'Carbon tetrafluoride'], ['Fe', 2, 'Iron(II) fluoride'], ['Fe', 3, 'Iron(III) fluoride'],
    ['Ba', 2, 'Barium fluoride'], ['P', 5, 'Phosphorus pentafluoride'], ['S', 6, 'Sulfur hexafluoride'],
    ['Zn', 2, 'Zinc fluoride'], ['Rb', 1, 'Rubidium fluoride'], ['Cs', 1, 'Caesium fluoride']
  ];
  const formula = document.querySelector('#formula'), name = document.querySelector('#compound');
  const ratio = document.querySelector('#ratio'), toggle = document.querySelector('#playback');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, running = !motion.matches, interval;
  function render() {
    const [symbol, count, title] = entries[index];
    const ns = 'http://www.w3.org/1998/Math/MathML';
    const part = (tag, text) => {
      const node = document.createElementNS(ns, tag);
      if (text) node.textContent = text;
      if (tag === 'mi') node.setAttribute('mathvariant', 'normal');
      return node;
    };
    const row = part('mrow'), fluorine = part('mi', 'F');
    row.append(part('mi', symbol));
    if (count > 1) {
      const subscript = part('msub');
      subscript.append(fluorine, part('mn', String(count)));
      row.append(subscript);
    } else row.append(fluorine);
    formula.replaceChildren(row);
    formula.setAttribute('aria-label', title);
    name.textContent = title;
    ratio.textContent = '1 '+symbol+' atom · '+count+' F atom'+(count===1?'':'s');
  }
  function next() { index = (index + 1) % entries.length; render(); }
  function sync() {
    clearInterval(interval);
    toggle.textContent = running ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', (running?'Pause':'Play')+' fluoride animation');
    if (running && !document.hidden) interval = setInterval(next, 500);
  }
  toggle.addEventListener('click', () => {running = !running;sync();});
  document.querySelector('#advance').addEventListener('click', () => {running=false;sync();next();});
  motion.addEventListener('change', () => {running=!motion.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  sync();
})();
