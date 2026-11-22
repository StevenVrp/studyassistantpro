/* Neutral atom configurations and angular orbital models. No external dependencies. */
(() => {
  "use strict";

  const order = "1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p".split(" ");
  const kinds = "spdf";
  const superscripts = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const nist = "https://www.nist.gov/system/files/documents/2024/06/25/NIST_periodictable_June24_iupac.pdf";
  const rsc = "https://periodic-table.rsc.org/element/";
  const nobleCores = [[86, "Rn"], [54, "Xe"], [36, "Kr"], [18, "Ar"], [10, "Ne"], [2, "He"]];
  // Only deviations from the diagonal filling sequence are stored.
  const overrides = {
    24: {"3d":5,"4s":1}, 29: {"3d":10,"4s":1},
    41: {"4d":4,"5s":1}, 42: {"4d":5,"5s":1}, 44: {"4d":7,"5s":1},
    45: {"4d":8,"5s":1}, 46: {"4d":10,"5s":0}, 47: {"4d":10,"5s":1},
    57: {"4f":0,"5d":1}, 58: {"4f":1,"5d":1}, 64: {"4f":7,"5d":1},
    78: {"5d":9,"6s":1}, 79: {"5d":10,"6s":1},
    89: {"5f":0,"6d":1}, 90: {"5f":0,"6d":2}, 91: {"5f":2,"6d":1},
    92: {"5f":3,"6d":1}, 93: {"5f":4,"6d":1}, 96: {"5f":7,"6d":1},
    103: {"6d":0,"7p":1},
    // RSC convention; other published predictions for Ds and Rg retain 7s².
    110: {"6d":9,"7s":1}, 111: {"6d":10,"7s":1}
  };

  function expected(z) {
    let left = Number(z);
    if (!Number.isInteger(left) || left < 1 || left > 118) throw new RangeError("Choose an element from 1 to 118.");
    const result = {};
    for (const key of order) {
      const capacity = 2 * (2 * kinds.indexOf(key[1]) + 1);
      result[key] = Math.min(left, capacity);
      left -= result[key];
      if (!left) break;
    }
    return result;
  }

  function configuration(z) {
    const result = Object.assign(expected(z), overrides[z]);
    return Object.fromEntries(order.filter(key => result[key] > 0).map(key => [key, result[key]]));
  }
  const isException = z => Object.hasOwn(overrides, z);
  const isPredicted = z => Number(z) >= 104;
  const superNumber = n => String(n).split("").map(c => superscripts[c]).join("");

  function format(z, condensed = true, occupancies = configuration(z)) {
    const core = condensed && nobleCores.find(([number]) => number < z);
    const inner = core ? expected(core[0]) : {};
    const suffix = Object.keys(occupancies).filter(key => occupancies[key] && !inner[key])
      .sort((a, b) => Number(a[0]) - Number(b[0]) || kinds.indexOf(a[1]) - kinds.indexOf(b[1]))
      .map(key => key + superNumber(occupancies[key]));
    return [...(core ? ["[" + core[1] + "]"] : []), ...suffix].join(" ");
  }

  // Real spherical harmonics on a unit sphere, with scale factors omitted.
  // The common scale for each rendered orbital is set by its own maximum.
  const shapes = {
    s: [["s", () => 1]],
    p: [["pₓ", x => x], ["pᵧ", (x, y) => y], ["p_z", (x, y, z) => z]],
    d: [
      ["d_xy", (x, y) => x*y], ["d_yz", (x, y, z) => y*z], ["d_xz", (x, y, z) => x*z],
      ["d_(x²−y²)", (x, y) => x*x - y*y], ["d_z²", (x, y, z) => 3*z*z - 1]
    ],
    f: [
      ["f_xyz", (x, y, z) => x*y*z], ["f_z(x²−y²)", (x, y, z) => z*(x*x-y*y)],
      ["f_x(5z²−r²)", (x, y, z) => x*(5*z*z-1)], ["f_y(5z²−r²)", (x, y, z) => y*(5*z*z-1)],
      ["f_x(x²−3y²)", (x, y) => x*(x*x-3*y*y)], ["f_y(3x²−y²)", (x, y) => y*(3*x*x-y*y)],
      ["f_z(5z²−3r²)", (x, y, z) => z*(5*z*z-3)]
    ]
  };
  const readableName = key => key.replace("_", " ");
  function mesh(harmonic) {
    const points = [], faces = [];
    const bands = 42, sectors = 80;
    let max = 0;
    for (let i = 0; i <= bands; i++) {
      const theta = Math.PI*i/bands;
      for (let j = 0; j < sectors; j++) {
        const phi = 2*Math.PI*j/sectors;
        const x = Math.sin(theta)*Math.cos(phi), y = Math.sin(theta)*Math.sin(phi), z = Math.cos(theta);
        const a = harmonic(x,y,z);
        const radius = Math.abs(a);
        max = Math.max(max, radius);
        points.push([x*radius,y*radius,z*radius,a]);
      }
    }
    for (let i = 0; i < bands; i++) {
      for (let j = 0; j < sectors; j++) {
        const next = (j+1)%sectors, start = i*sectors;
        const ids = [start+j,start+next,start+sectors+next,start+sectors+j];
        faces.push({ids, positive: ids.reduce((v,k) => v+points[k][3],0) >= 0});
      }
    }
    return {points, faces, max};
  }

  const colors = {positive: [31,178,167], negative: [176,126,231]};
  function draw(canvas, surface, yaw, pitch) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2;
    const radius = .355*h, cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    function project(x,y,z) {
      const horizontal = x*cosY - y*sinY, depth = x*sinY+y*cosY;
      return [cx + radius*horizontal, cy - radius*(z*cosP - depth*sinP), depth*cosP + z*sinP];
    }
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 1.4;
    ctx.font = '16px system-ui';
    const axes = [[1,0,0,"x"],[0,1,0,"y"],[0,0,1,"z"]];
    for (const [x,y,z,label] of axes) {
      const start = project(-1.18*x,-1.18*y,-1.18*z), end = project(1.18*x,1.18*y,1.18*z);
      ctx.strokeStyle = "#416265"; ctx.fillStyle = "#a8c8c7";
      ctx.beginPath(); ctx.moveTo(start[0],start[1]); ctx.lineTo(end[0],end[1]); ctx.stroke();
      ctx.fillText(label, end[0]+4,end[1]-2);
    }
    const vertices = surface.points.map(([x,y,z]) => project(x/surface.max,y/surface.max,z/surface.max));
    const faces = surface.faces.map(face => {
      const [a,b,c,d] = face.ids.map(i => vertices[i]);
      const ux = c[0]-a[0], uy = c[1]-a[1], uz = (c[2]-a[2])*radius;
      const vx = d[0]-b[0], vy = d[1]-b[1], vz = (d[2]-b[2])*radius;
      const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx;
      const light = (nx*(-.40)+ny*(-.65)+nz*.64)/(Math.hypot(nx,ny,nz)||1);
      return {a,b,c,d,depth:(a[2]+b[2]+c[2]+d[2])/4,
        light: .60 + .42*Math.max(0, light*Math.sign(nz)), positive:face.positive};
    }).sort((a,b) => a.depth-b.depth);
    ctx.lineWidth = .72;
    for (const f of faces) {
      const base = f.positive ? colors.positive : colors.negative;
      const color = "rgb("+base.map(c => Math.round(c*f.light)).join(",")+")";
      ctx.fillStyle = color; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(f.a[0],f.a[1]); ctx.lineTo(f.b[0],f.b[1]);
      ctx.lineTo(f.c[0],f.c[1]); ctx.lineTo(f.d[0],f.d[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  function render(container,z) {
    const occupied = configuration(z);
    let shell = order.filter(key => occupied[key]).at(-1);
    // An open f subshell is usually the most informative first view for these rows.
    if ((z >= 58 && z <= 69) || (z >= 91 && z <= 101)) shell = z < 70 ? "4f" : "5f";
    const predicted = isPredicted(z), exception = isException(z);
    const source = predicted ? rsc+z+"/" : nist;
    const root = document.createElement("section");
    root.className = "orbital-lab";
    root.setAttribute("aria-label","Atomic orbitals");
    root.innerHTML = `
      <h3>Atomic orbitals</h3>
      <div class="ol-comparison">
        <div><small>${predicted ? "Predicted ground state" : "Ground state"}</small><strong>${format(z)}</strong></div>
        ${exception ? '<div><small>Diagonal filling rule</small><strong>'+format(z,true,expected(z))+'</strong></div>' : ''}
      </div>
      ${exception ? '<p class="ol-explainer">'+(predicted ? 'Predicted exception in the RSC configuration.' : 'Exception to the diagonal filling rule.')+' The occupied subshells differ from the simple filling sequence.</p>' : ''}
      ${z === 110 || z === 111 ? '<p class="ol-explainer">Published predictions differ. An alternative assigns 6d'+superNumber(z===110?8:9)+' 7s². <a href="https://pubchem.ncbi.nlm.nih.gov/element/'+z+'" target="_blank" rel="noopener">PubChem</a></p>':''}
      <label class="ol-selector">Occupied subshell <select></select></label>
      <div class="ol-boxes" role="group" aria-label="Choose an orbital"></div>
      <p class="ol-caption ol-occupancy"></p>
      <div class="ol-plot"><canvas width="640" height="344" role="img" tabindex="0"></canvas>
        <div class="ol-legend" aria-hidden="true"><i>+</i> phase <i>−</i> phase</div>
      </div>
      <div class="ol-controls"><span>Drag or use arrow keys to rotate.</span><button type="button" class="ol-reset">Reset view</button></div>
      <p class="ol-model"></p>
      <details><summary>Reading this diagram</summary><p>Each box represents one spatial orbital. Arrows show electron spins. Electrons occupy separate orbitals of equal energy before pairing. The order of equivalent boxes is conventional.</p>
      <p>Distance from the center represents the magnitude of a real spherical harmonic. The two colors show opposite signs of the wavefunction. This angular model omits radial structure and uses one common display scale.</p></details>
      <a class="ol-source" href="${source}" target="_blank" rel="noopener">${predicted ? "Royal Society of Chemistry · predicted configuration" : "NIST · neutral-atom configuration"}</a>`;
    container.replaceChildren(root);
    const select = root.querySelector("select"), boxes = root.querySelector(".ol-boxes"), canvas = root.querySelector("canvas");
    const caption = root.querySelector(".ol-occupancy"), model = root.querySelector(".ol-model");
    const startYaw = -.62, startPitch = .34;
    let index = 0, yaw = startYaw, pitch = startPitch, surface, frame = 0, dragging;
    for (const key of order.filter(key => occupied[key])) {
      select.add(new Option(key+superNumber(occupied[key]),key,false,key===shell));
    }
    function requestDraw() {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (root.isConnected) draw(canvas,surface,yaw,pitch); });
    }
    function updateOrbital() {
      const kind = shell[1], choices = shapes[kind], count = occupied[shell];
      for (let i=0; i<boxes.children.length; i++) boxes.children[i].setAttribute("aria-pressed",i===index);
      const [name, harmonic] = choices[index], prettyName = readableName(name);
      const n = Number(shell[0]), l = kinds.indexOf(kind), radial = n-l-1;
      model.textContent = `${n}${prettyName} · ${l} angular ${l === 1 ? "node" : "nodes"} · ${radial} radial ${radial === 1 ? "node" : "nodes"} in the hydrogen-like model.`;
      canvas.setAttribute("aria-label",`Rotatable angular shape of ${n}${prettyName}. ${model.textContent} Use arrow keys to rotate.`);
      const unpaired = Math.min(count,2*choices.length-count);
      caption.textContent = `${shell}${superNumber(count)} · ${count} ${count===1 ? "electron" : "electrons"} · ${unpaired} unpaired in this subshell`;
      surface = mesh(harmonic);
      requestDraw();
    }
    function updateShell() {
      shell = select.value; index = 0; boxes.replaceChildren();
      const options = shapes[shell[1]], count = occupied[shell];
      options.forEach(([name],i) => {
        const spins = Number(i<count)+Number(i<count-options.length);
        const b = document.createElement("button");
        b.type="button"; b.textContent=["·","↑","↑↓"][spins];
        b.title = readableName(name) + " · " + ["empty","one electron","two electrons"][spins];
        b.setAttribute("aria-label",b.title);
        b.addEventListener("click",() => { index=i; updateOrbital(); });
        boxes.append(b);
      });
      updateOrbital();
    }
    function turn(dx,dy) {
      yaw += dx;
      pitch = Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch+dy));
      requestDraw();
    }
    select.addEventListener("change",updateShell);
    canvas.addEventListener("pointerdown",event => {
      if (dragging || event.button !== 0) return;
      canvas.setPointerCapture(event.pointerId);
      dragging = {x:event.clientX,y:event.clientY,id:event.pointerId};
    });
    canvas.addEventListener("pointermove",event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      turn((event.clientX-dragging.x)*.014,(event.clientY-dragging.y)*.014);
      dragging.x = event.clientX; dragging.y = event.clientY;
    });
    canvas.addEventListener("lostpointercapture",() => { dragging=null; });
    canvas.addEventListener("keydown",event => {
      const steps = {ArrowLeft:[-.14,0],ArrowRight:[.14,0],ArrowUp:[0,-.14],ArrowDown:[0,.14]};
      if (steps[event.key]) { event.preventDefault(); turn(...steps[event.key]); }
    });
    root.querySelector(".ol-reset").addEventListener("click",() => {yaw=startYaw; pitch=startPitch; requestDraw();});
    updateShell();
  }

  window.OrbitalLab = Object.freeze({expected, configuration, isException, isPredicted, format, render});
})();
