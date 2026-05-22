/**
* @vue/shared v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function Cs(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Z = {}, Ot = [], Qe = () => {
}, $o = () => !1, Ln = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Nn = (e) => e.startsWith("onUpdate:"), ue = Object.assign, Ts = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ya = Object.prototype.hasOwnProperty, q = (e, t) => Ya.call(e, t), O = Array.isArray, $t = (e) => dn(e) === "[object Map]", jn = (e) => dn(e) === "[object Set]", Us = (e) => dn(e) === "[object Date]", D = (e) => typeof e == "function", ae = (e) => typeof e == "string", et = (e) => typeof e == "symbol", G = (e) => e !== null && typeof e == "object", Do = (e) => (G(e) || D(e)) && D(e.then) && D(e.catch), Fo = Object.prototype.toString, dn = (e) => Fo.call(e), Xa = (e) => dn(e).slice(8, -1), Lo = (e) => dn(e) === "[object Object]", As = (e) => ae(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Xt = /* @__PURE__ */ Cs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Hn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Za = /-\w/g, He = Hn(
  (e) => e.replace(Za, (t) => t.slice(1).toUpperCase())
), Qa = /\B([A-Z])/g, vt = Hn(
  (e) => e.replace(Qa, "-$1").toLowerCase()
), No = Hn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Zn = Hn(
  (e) => e ? `on${No(e)}` : ""
), Ze = (e, t) => !Object.is(e, t), Sn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, jo = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Vn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, er = (e) => {
  const t = ae(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let zs;
const Kn = () => zs || (zs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Es(e) {
  if (O(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = ae(s) ? or(s) : Es(s);
      if (o)
        for (const a in o)
          t[a] = o[a];
    }
    return t;
  } else if (ae(e) || G(e))
    return e;
}
const tr = /;(?![^(]*\))/g, nr = /:([^]+)/, sr = /\/\*[^]*?\*\//g;
function or(e) {
  const t = {};
  return e.replace(sr, "").split(tr).forEach((n) => {
    if (n) {
      const s = n.split(nr);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Re(e) {
  let t = "";
  if (ae(e))
    t = e;
  else if (O(e))
    for (let n = 0; n < e.length; n++) {
      const s = Re(e[n]);
      s && (t += s + " ");
    }
  else if (G(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const ar = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", rr = /* @__PURE__ */ Cs(ar);
function Ho(e) {
  return !!e || e === "";
}
function ir(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = hn(e[s], t[s]);
  return n;
}
function hn(e, t) {
  if (e === t) return !0;
  let n = Us(e), s = Us(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = et(e), s = et(t), n || s)
    return e === t;
  if (n = O(e), s = O(t), n || s)
    return n && s ? ir(e, t) : !1;
  if (n = G(e), s = G(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, a = Object.keys(t).length;
    if (o !== a)
      return !1;
    for (const i in e) {
      const c = e.hasOwnProperty(i), p = t.hasOwnProperty(i);
      if (c && !p || !c && p || !hn(e[i], t[i]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function lr(e, t) {
  return e.findIndex((n) => hn(n, t));
}
const Vo = (e) => !!(e && e.__v_isRef === !0), H = (e) => ae(e) ? e : e == null ? "" : O(e) || G(e) && (e.toString === Fo || !D(e.toString)) ? Vo(e) ? H(e.value) : JSON.stringify(e, Ko, 2) : String(e), Ko = (e, t) => Vo(t) ? Ko(e, t.value) : $t(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], a) => (n[Qn(s, a) + " =>"] = o, n),
    {}
  )
} : jn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Qn(n))
} : et(t) ? Qn(t) : G(t) && !O(t) && !Lo(t) ? String(t) : t, Qn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    et(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let he;
class cr {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && he && (he.active ? (this.parent = he, this.index = (he.scopes || (he.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = he;
      try {
        return he = this, t();
      } finally {
        he = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = he, he = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (he === this)
        he = this.prevScope;
      else {
        let t = he;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, s = this.scopes.length; n < s; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const o = this.parent.scopes.pop();
        o && o !== this && (this.parent.scopes[this.index] = o, o.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function pr() {
  return he;
}
let te;
const es = /* @__PURE__ */ new WeakSet();
class Uo {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, he && (he.active ? he.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, es.has(this) && (es.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Bo(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Bs(this), Wo(this);
    const t = te, n = Ve;
    te = this, Ve = !0;
    try {
      return this.fn();
    } finally {
      qo(this), te = t, Ve = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Ps(t);
      this.deps = this.depsTail = void 0, Bs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? es.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    fs(this) && this.run();
  }
  get dirty() {
    return fs(this);
  }
}
let zo = 0, Zt, Qt;
function Bo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Qt, Qt = e;
    return;
  }
  e.next = Zt, Zt = e;
}
function ks() {
  zo++;
}
function Is() {
  if (--zo > 0)
    return;
  if (Qt) {
    let t = Qt;
    for (Qt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Zt; ) {
    let t = Zt;
    for (Zt = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function Wo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function qo(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), Ps(s), ur(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function fs(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Go(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Go(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === an) || (e.globalVersion = an, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !fs(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = te, s = Ve;
  te = e, Ve = !0;
  try {
    Wo(e);
    const o = e.fn(e._value);
    (t.version === 0 || Ze(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    te = n, Ve = s, qo(e), e.flags &= -3;
  }
}
function Ps(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let a = n.computed.deps; a; a = a.nextDep)
      Ps(a, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function ur(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Ve = !0;
const Jo = [];
function pt() {
  Jo.push(Ve), Ve = !1;
}
function ut() {
  const e = Jo.pop();
  Ve = e === void 0 ? !0 : e;
}
function Bs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = te;
    te = void 0;
    try {
      t();
    } finally {
      te = n;
    }
  }
}
let an = 0;
class fr {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Rs {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!te || !Ve || te === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== te)
      n = this.activeLink = new fr(te, this), te.deps ? (n.prevDep = te.depsTail, te.depsTail.nextDep = n, te.depsTail = n) : te.deps = te.depsTail = n, Yo(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = te.depsTail, n.nextDep = void 0, te.depsTail.nextDep = n, te.depsTail = n, te.deps === n && (te.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, an++, this.notify(t);
  }
  notify(t) {
    ks();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Is();
    }
  }
}
function Yo(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Yo(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const ds = /* @__PURE__ */ new WeakMap(), Et = /* @__PURE__ */ Symbol(
  ""
), hs = /* @__PURE__ */ Symbol(
  ""
), rn = /* @__PURE__ */ Symbol(
  ""
);
function ye(e, t, n) {
  if (Ve && te) {
    let s = ds.get(e);
    s || ds.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new Rs()), o.map = s, o.key = n), o.track();
  }
}
function lt(e, t, n, s, o, a) {
  const i = ds.get(e);
  if (!i) {
    an++;
    return;
  }
  const c = (p) => {
    p && p.trigger();
  };
  if (ks(), t === "clear")
    i.forEach(c);
  else {
    const p = O(e), d = p && As(n);
    if (p && n === "length") {
      const f = Number(s);
      i.forEach((g, x) => {
        (x === "length" || x === rn || !et(x) && x >= f) && c(g);
      });
    } else
      switch ((n !== void 0 || i.has(void 0)) && c(i.get(n)), d && c(i.get(rn)), t) {
        case "add":
          p ? d && c(i.get("length")) : (c(i.get(Et)), $t(e) && c(i.get(hs)));
          break;
        case "delete":
          p || (c(i.get(Et)), $t(e) && c(i.get(hs)));
          break;
        case "set":
          $t(e) && c(i.get(Et));
          break;
      }
  }
  Is();
}
function Pt(e) {
  const t = /* @__PURE__ */ z(e);
  return t === e ? t : (ye(t, "iterate", rn), /* @__PURE__ */ je(e) ? t : t.map(Ke));
}
function Un(e) {
  return ye(e = /* @__PURE__ */ z(e), "iterate", rn), e;
}
function Ye(e, t) {
  return /* @__PURE__ */ ft(e) ? jt(/* @__PURE__ */ kt(e) ? Ke(t) : t) : Ke(t);
}
const dr = {
  __proto__: null,
  [Symbol.iterator]() {
    return ts(this, Symbol.iterator, (e) => Ye(this, e));
  },
  concat(...e) {
    return Pt(this).concat(
      ...e.map((t) => O(t) ? Pt(t) : t)
    );
  },
  entries() {
    return ts(this, "entries", (e) => (e[1] = Ye(this, e[1]), e));
  },
  every(e, t) {
    return ot(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return ot(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ye(this, s)),
      arguments
    );
  },
  find(e, t) {
    return ot(
      this,
      "find",
      e,
      t,
      (n) => Ye(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return ot(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return ot(
      this,
      "findLast",
      e,
      t,
      (n) => Ye(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return ot(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return ot(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return ns(this, "includes", e);
  },
  indexOf(...e) {
    return ns(this, "indexOf", e);
  },
  join(e) {
    return Pt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return ns(this, "lastIndexOf", e);
  },
  map(e, t) {
    return ot(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Vt(this, "pop");
  },
  push(...e) {
    return Vt(this, "push", e);
  },
  reduce(e, ...t) {
    return Ws(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Ws(this, "reduceRight", e, t);
  },
  shift() {
    return Vt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return ot(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Vt(this, "splice", e);
  },
  toReversed() {
    return Pt(this).toReversed();
  },
  toSorted(e) {
    return Pt(this).toSorted(e);
  },
  toSpliced(...e) {
    return Pt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Vt(this, "unshift", e);
  },
  values() {
    return ts(this, "values", (e) => Ye(this, e));
  }
};
function ts(e, t, n) {
  const s = Un(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ je(e) && (o._next = o.next, o.next = () => {
    const a = o._next();
    return a.done || (a.value = n(a.value)), a;
  }), o;
}
const hr = Array.prototype;
function ot(e, t, n, s, o, a) {
  const i = Un(e), c = i !== e && !/* @__PURE__ */ je(e), p = i[t];
  if (p !== hr[t]) {
    const g = p.apply(e, a);
    return c ? Ke(g) : g;
  }
  let d = n;
  i !== e && (c ? d = function(g, x) {
    return n.call(this, Ye(e, g), x, e);
  } : n.length > 2 && (d = function(g, x) {
    return n.call(this, g, x, e);
  }));
  const f = p.call(i, d, s);
  return c && o ? o(f) : f;
}
function Ws(e, t, n, s) {
  const o = Un(e), a = o !== e && !/* @__PURE__ */ je(e);
  let i = n, c = !1;
  o !== e && (a ? (c = s.length === 0, i = function(d, f, g) {
    return c && (c = !1, d = Ye(e, d)), n.call(this, d, Ye(e, f), g, e);
  }) : n.length > 3 && (i = function(d, f, g) {
    return n.call(this, d, f, g, e);
  }));
  const p = o[t](i, ...s);
  return c ? Ye(e, p) : p;
}
function ns(e, t, n) {
  const s = /* @__PURE__ */ z(e);
  ye(s, "iterate", rn);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ $s(n[0]) ? (n[0] = /* @__PURE__ */ z(n[0]), s[t](...n)) : o;
}
function Vt(e, t, n = []) {
  pt(), ks();
  const s = (/* @__PURE__ */ z(e))[t].apply(e, n);
  return Is(), ut(), s;
}
const mr = /* @__PURE__ */ Cs("__proto__,__v_isRef,__isVue"), Xo = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(et)
);
function gr(e) {
  et(e) || (e = String(e));
  const t = /* @__PURE__ */ z(this);
  return ye(t, "has", e), t.hasOwnProperty(e);
}
class Zo {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const o = this._isReadonly, a = this._isShallow;
    if (n === "__v_isReactive")
      return !o;
    if (n === "__v_isReadonly")
      return o;
    if (n === "__v_isShallow")
      return a;
    if (n === "__v_raw")
      return s === (o ? a ? Ar : na : a ? ta : ea).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const i = O(t);
    if (!o) {
      let p;
      if (i && (p = dr[n]))
        return p;
      if (n === "hasOwnProperty")
        return gr;
    }
    const c = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ _e(t) ? t : s
    );
    if ((et(n) ? Xo.has(n) : mr(n)) || (o || ye(t, "get", n), a))
      return c;
    if (/* @__PURE__ */ _e(c)) {
      const p = i && As(n) ? c : c.value;
      return o && G(p) ? /* @__PURE__ */ gs(p) : p;
    }
    return G(c) ? o ? /* @__PURE__ */ gs(c) : /* @__PURE__ */ Dt(c) : c;
  }
}
class Qo extends Zo {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let a = t[n];
    const i = O(t) && As(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ ft(a);
      if (!/* @__PURE__ */ je(s) && !/* @__PURE__ */ ft(s) && (a = /* @__PURE__ */ z(a), s = /* @__PURE__ */ z(s)), !i && /* @__PURE__ */ _e(a) && !/* @__PURE__ */ _e(s))
        return d || (a.value = s), !0;
    }
    const c = i ? Number(n) < t.length : q(t, n), p = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ _e(t) ? t : o
    );
    return t === /* @__PURE__ */ z(o) && (c ? Ze(s, a) && lt(t, "set", n, s) : lt(t, "add", n, s)), p;
  }
  deleteProperty(t, n) {
    const s = q(t, n);
    t[n];
    const o = Reflect.deleteProperty(t, n);
    return o && s && lt(t, "delete", n, void 0), o;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!et(n) || !Xo.has(n)) && ye(t, "has", n), s;
  }
  ownKeys(t) {
    return ye(
      t,
      "iterate",
      O(t) ? "length" : Et
    ), Reflect.ownKeys(t);
  }
}
class vr extends Zo {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const br = /* @__PURE__ */ new Qo(), xr = /* @__PURE__ */ new vr(), yr = /* @__PURE__ */ new Qo(!0);
const ms = (e) => e, yn = (e) => Reflect.getPrototypeOf(e);
function _r(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, a = /* @__PURE__ */ z(o), i = $t(a), c = e === "entries" || e === Symbol.iterator && i, p = e === "keys" && i, d = o[e](...s), f = n ? ms : t ? jt : Ke;
    return !t && ye(
      a,
      "iterate",
      p ? hs : Et
    ), ue(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: g, done: x } = d.next();
          return x ? { value: g, done: x } : {
            value: c ? [f(g[0]), f(g[1])] : f(g),
            done: x
          };
        }
      }
    );
  };
}
function _n(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function wr(e, t) {
  const n = {
    get(o) {
      const a = this.__v_raw, i = /* @__PURE__ */ z(a), c = /* @__PURE__ */ z(o);
      e || (Ze(o, c) && ye(i, "get", o), ye(i, "get", c));
      const { has: p } = yn(i), d = t ? ms : e ? jt : Ke;
      if (p.call(i, o))
        return d(a.get(o));
      if (p.call(i, c))
        return d(a.get(c));
      a !== i && a.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && ye(/* @__PURE__ */ z(o), "iterate", Et), o.size;
    },
    has(o) {
      const a = this.__v_raw, i = /* @__PURE__ */ z(a), c = /* @__PURE__ */ z(o);
      return e || (Ze(o, c) && ye(i, "has", o), ye(i, "has", c)), o === c ? a.has(o) : a.has(o) || a.has(c);
    },
    forEach(o, a) {
      const i = this, c = i.__v_raw, p = /* @__PURE__ */ z(c), d = t ? ms : e ? jt : Ke;
      return !e && ye(p, "iterate", Et), c.forEach((f, g) => o.call(a, d(f), d(g), i));
    }
  };
  return ue(
    n,
    e ? {
      add: _n("add"),
      set: _n("set"),
      delete: _n("delete"),
      clear: _n("clear")
    } : {
      add(o) {
        const a = /* @__PURE__ */ z(this), i = yn(a), c = /* @__PURE__ */ z(o), p = !t && !/* @__PURE__ */ je(o) && !/* @__PURE__ */ ft(o) ? c : o;
        return i.has.call(a, p) || Ze(o, p) && i.has.call(a, o) || Ze(c, p) && i.has.call(a, c) || (a.add(p), lt(a, "add", p, p)), this;
      },
      set(o, a) {
        !t && !/* @__PURE__ */ je(a) && !/* @__PURE__ */ ft(a) && (a = /* @__PURE__ */ z(a));
        const i = /* @__PURE__ */ z(this), { has: c, get: p } = yn(i);
        let d = c.call(i, o);
        d || (o = /* @__PURE__ */ z(o), d = c.call(i, o));
        const f = p.call(i, o);
        return i.set(o, a), d ? Ze(a, f) && lt(i, "set", o, a) : lt(i, "add", o, a), this;
      },
      delete(o) {
        const a = /* @__PURE__ */ z(this), { has: i, get: c } = yn(a);
        let p = i.call(a, o);
        p || (o = /* @__PURE__ */ z(o), p = i.call(a, o)), c && c.call(a, o);
        const d = a.delete(o);
        return p && lt(a, "delete", o, void 0), d;
      },
      clear() {
        const o = /* @__PURE__ */ z(this), a = o.size !== 0, i = o.clear();
        return a && lt(
          o,
          "clear",
          void 0,
          void 0
        ), i;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    n[o] = _r(o, e, t);
  }), n;
}
function Ms(e, t) {
  const n = wr(e, t);
  return (s, o, a) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    q(n, o) && o in s ? n : s,
    o,
    a
  );
}
const Sr = {
  get: /* @__PURE__ */ Ms(!1, !1)
}, Cr = {
  get: /* @__PURE__ */ Ms(!1, !0)
}, Tr = {
  get: /* @__PURE__ */ Ms(!0, !1)
};
const ea = /* @__PURE__ */ new WeakMap(), ta = /* @__PURE__ */ new WeakMap(), na = /* @__PURE__ */ new WeakMap(), Ar = /* @__PURE__ */ new WeakMap();
function Er(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function kr(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Er(Xa(e));
}
// @__NO_SIDE_EFFECTS__
function Dt(e) {
  return /* @__PURE__ */ ft(e) ? e : Os(
    e,
    !1,
    br,
    Sr,
    ea
  );
}
// @__NO_SIDE_EFFECTS__
function Ir(e) {
  return Os(
    e,
    !1,
    yr,
    Cr,
    ta
  );
}
// @__NO_SIDE_EFFECTS__
function gs(e) {
  return Os(
    e,
    !0,
    xr,
    Tr,
    na
  );
}
function Os(e, t, n, s, o) {
  if (!G(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const a = kr(e);
  if (a === 0)
    return e;
  const i = o.get(e);
  if (i)
    return i;
  const c = new Proxy(
    e,
    a === 2 ? s : n
  );
  return o.set(e, c), c;
}
// @__NO_SIDE_EFFECTS__
function kt(e) {
  return /* @__PURE__ */ ft(e) ? /* @__PURE__ */ kt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function ft(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function je(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function $s(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function z(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ z(t) : e;
}
function Pr(e) {
  return !q(e, "__v_skip") && Object.isExtensible(e) && jo(e, "__v_skip", !0), e;
}
const Ke = (e) => G(e) ? /* @__PURE__ */ Dt(e) : e, jt = (e) => G(e) ? /* @__PURE__ */ gs(e) : e;
// @__NO_SIDE_EFFECTS__
function _e(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function Kt(e) {
  return Rr(e, !1);
}
function Rr(e, t) {
  return /* @__PURE__ */ _e(e) ? e : new Mr(e, t);
}
class Mr {
  constructor(t, n) {
    this.dep = new Rs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ z(t), this._value = n ? t : Ke(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ je(t) || /* @__PURE__ */ ft(t);
    t = s ? t : /* @__PURE__ */ z(t), Ze(t, n) && (this._rawValue = t, this._value = s ? t : Ke(t), this.dep.trigger());
  }
}
function E(e) {
  return /* @__PURE__ */ _e(e) ? e.value : e;
}
const Or = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ _e(o) && !/* @__PURE__ */ _e(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function sa(e) {
  return /* @__PURE__ */ kt(e) ? e : new Proxy(e, Or);
}
class $r {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Rs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = an - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    te !== this)
      return Bo(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return Go(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Dr(e, t, n = !1) {
  let s, o;
  return D(e) ? s = e : (s = e.get, o = e.set), new $r(s, o, n);
}
const wn = {}, An = /* @__PURE__ */ new WeakMap();
let Ct;
function Fr(e, t = !1, n = Ct) {
  if (n) {
    let s = An.get(n);
    s || An.set(n, s = []), s.push(e);
  }
}
function Lr(e, t, n = Z) {
  const { immediate: s, deep: o, once: a, scheduler: i, augmentJob: c, call: p } = n, d = (k) => o ? k : /* @__PURE__ */ je(k) || o === !1 || o === 0 ? ct(k, 1) : ct(k);
  let f, g, x, C, F = !1, R = !1;
  if (/* @__PURE__ */ _e(e) ? (g = () => e.value, F = /* @__PURE__ */ je(e)) : /* @__PURE__ */ kt(e) ? (g = () => d(e), F = !0) : O(e) ? (R = !0, F = e.some((k) => /* @__PURE__ */ kt(k) || /* @__PURE__ */ je(k)), g = () => e.map((k) => {
    if (/* @__PURE__ */ _e(k))
      return k.value;
    if (/* @__PURE__ */ kt(k))
      return d(k);
    if (D(k))
      return p ? p(k, 2) : k();
  })) : D(e) ? t ? g = p ? () => p(e, 2) : e : g = () => {
    if (x) {
      pt();
      try {
        x();
      } finally {
        ut();
      }
    }
    const k = Ct;
    Ct = f;
    try {
      return p ? p(e, 3, [C]) : e(C);
    } finally {
      Ct = k;
    }
  } : g = Qe, t && o) {
    const k = g, B = o === !0 ? 1 / 0 : o;
    g = () => ct(k(), B);
  }
  const Q = pr(), I = () => {
    f.stop(), Q && Q.active && Ts(Q.effects, f);
  };
  if (a && t) {
    const k = t;
    t = (...B) => {
      k(...B), I();
    };
  }
  let N = R ? new Array(e.length).fill(wn) : wn;
  const V = (k) => {
    if (!(!(f.flags & 1) || !f.dirty && !k))
      if (t) {
        const B = f.run();
        if (o || F || (R ? B.some((ie, fe) => Ze(ie, N[fe])) : Ze(B, N))) {
          x && x();
          const ie = Ct;
          Ct = f;
          try {
            const fe = [
              B,
              // pass undefined as the old value when it's changed for the first time
              N === wn ? void 0 : R && N[0] === wn ? [] : N,
              C
            ];
            N = B, p ? p(t, 3, fe) : (
              // @ts-expect-error
              t(...fe)
            );
          } finally {
            Ct = ie;
          }
        }
      } else
        f.run();
  };
  return c && c(V), f = new Uo(g), f.scheduler = i ? () => i(V, !1) : V, C = (k) => Fr(k, !1, f), x = f.onStop = () => {
    const k = An.get(f);
    if (k) {
      if (p)
        p(k, 4);
      else
        for (const B of k) B();
      An.delete(f);
    }
  }, t ? s ? V(!0) : N = f.run() : i ? i(V.bind(null, !0), !0) : f.run(), I.pause = f.pause.bind(f), I.resume = f.resume.bind(f), I.stop = I, I;
}
function ct(e, t = 1 / 0, n) {
  if (t <= 0 || !G(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ _e(e))
    ct(e.value, t, n);
  else if (O(e))
    for (let s = 0; s < e.length; s++)
      ct(e[s], t, n);
  else if (jn(e) || $t(e))
    e.forEach((s) => {
      ct(s, t, n);
    });
  else if (Lo(e)) {
    for (const s in e)
      ct(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && ct(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function mn(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (o) {
    zn(o, t, n);
  }
}
function Ue(e, t, n, s) {
  if (D(e)) {
    const o = mn(e, t, n, s);
    return o && Do(o) && o.catch((a) => {
      zn(a, t, n);
    }), o;
  }
  if (O(e)) {
    const o = [];
    for (let a = 0; a < e.length; a++)
      o.push(Ue(e[a], t, n, s));
    return o;
  }
}
function zn(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: a, throwUnhandledErrorInProduction: i } = t && t.appContext.config || Z;
  if (t) {
    let c = t.parent;
    const p = t.proxy, d = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; c; ) {
      const f = c.ec;
      if (f) {
        for (let g = 0; g < f.length; g++)
          if (f[g](e, p, d) === !1)
            return;
      }
      c = c.parent;
    }
    if (a) {
      pt(), mn(a, null, 10, [
        e,
        p,
        d
      ]), ut();
      return;
    }
  }
  Nr(e, n, o, s, i);
}
function Nr(e, t, n, s = !0, o = !1) {
  if (o)
    throw e;
  console.error(e);
}
const Ce = [];
let Ge = -1;
const Ft = [];
let mt = null, Rt = 0;
const oa = /* @__PURE__ */ Promise.resolve();
let En = null;
function Mt(e) {
  const t = En || oa;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function jr(e) {
  let t = Ge + 1, n = Ce.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = Ce[s], a = ln(o);
    a < e || a === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Ds(e) {
  if (!(e.flags & 1)) {
    const t = ln(e), n = Ce[Ce.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= ln(n) ? Ce.push(e) : Ce.splice(jr(t), 0, e), e.flags |= 1, aa();
  }
}
function aa() {
  En || (En = oa.then(ia));
}
function Hr(e) {
  O(e) ? Ft.push(...e) : mt && e.id === -1 ? mt.splice(Rt + 1, 0, e) : e.flags & 1 || (Ft.push(e), e.flags |= 1), aa();
}
function qs(e, t, n = Ge + 1) {
  for (; n < Ce.length; n++) {
    const s = Ce[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      Ce.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function ra(e) {
  if (Ft.length) {
    const t = [...new Set(Ft)].sort(
      (n, s) => ln(n) - ln(s)
    );
    if (Ft.length = 0, mt) {
      mt.push(...t);
      return;
    }
    for (mt = t, Rt = 0; Rt < mt.length; Rt++) {
      const n = mt[Rt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    mt = null, Rt = 0;
  }
}
const ln = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function ia(e) {
  try {
    for (Ge = 0; Ge < Ce.length; Ge++) {
      const t = Ce[Ge];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), mn(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Ge < Ce.length; Ge++) {
      const t = Ce[Ge];
      t && (t.flags &= -2);
    }
    Ge = -1, Ce.length = 0, ra(), En = null, (Ce.length || Ft.length) && ia();
  }
}
let Ne = null, la = null;
function kn(e) {
  const t = Ne;
  return Ne = e, la = e && e.type.__scopeId || null, t;
}
function ca(e, t = Ne, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && Rn(-1);
    const a = kn(t);
    let i;
    try {
      i = e(...o);
    } finally {
      kn(a), s._d && Rn(1);
    }
    return i;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function ce(e, t) {
  if (Ne === null)
    return e;
  const n = Jn(Ne), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [a, i, c, p = Z] = t[o];
    a && (D(a) && (a = {
      mounted: a,
      updated: a
    }), a.deep && ct(i), s.push({
      dir: a,
      instance: n,
      value: i,
      oldValue: void 0,
      arg: c,
      modifiers: p
    }));
  }
  return e;
}
function yt(e, t, n, s) {
  const o = e.dirs, a = t && t.dirs;
  for (let i = 0; i < o.length; i++) {
    const c = o[i];
    a && (c.oldValue = a[i].value);
    let p = c.dir[s];
    p && (pt(), Ue(p, n, 8, [
      e.el,
      c,
      e,
      t
    ]), ut());
  }
}
function Vr(e, t) {
  if (Ee) {
    let n = Ee.provides;
    const s = Ee.parent && Ee.parent.provides;
    s === n && (n = Ee.provides = Object.create(s)), n[e] = t;
  }
}
function Cn(e, t, n = !1) {
  const s = Ka();
  if (s || Lt) {
    let o = Lt ? Lt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && D(t) ? t.call(s && s.proxy) : t;
  }
}
const Kr = /* @__PURE__ */ Symbol.for("v-scx"), Ur = () => Cn(Kr);
function en(e, t, n) {
  return pa(e, t, n);
}
function pa(e, t, n = Z) {
  const { immediate: s, deep: o, flush: a, once: i } = n, c = ue({}, n), p = t && s || !t && a !== "post";
  let d;
  if (un) {
    if (a === "sync") {
      const C = Ur();
      d = C.__watcherHandles || (C.__watcherHandles = []);
    } else if (!p) {
      const C = () => {
      };
      return C.stop = Qe, C.resume = Qe, C.pause = Qe, C;
    }
  }
  const f = Ee;
  c.call = (C, F, R) => Ue(C, f, F, R);
  let g = !1;
  a === "post" ? c.scheduler = (C) => {
    Pe(C, f && f.suspense);
  } : a !== "sync" && (g = !0, c.scheduler = (C, F) => {
    F ? C() : Ds(C);
  }), c.augmentJob = (C) => {
    t && (C.flags |= 4), g && (C.flags |= 2, f && (C.id = f.uid, C.i = f));
  };
  const x = Lr(e, t, c);
  return un && (d ? d.push(x) : p && x()), x;
}
function zr(e, t, n) {
  const s = this.proxy, o = ae(e) ? e.includes(".") ? ua(s, e) : () => s[e] : e.bind(s, s);
  let a;
  D(t) ? a = t : (a = t.handler, n = t);
  const i = gn(this), c = pa(o, a.bind(s), n);
  return i(), c;
}
function ua(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const Br = /* @__PURE__ */ Symbol("_vte"), fa = (e) => e.__isTeleport, Je = /* @__PURE__ */ Symbol("_leaveCb"), Ut = /* @__PURE__ */ Symbol("_enterCb");
function Wr() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  return ya(() => {
    e.isMounted = !0;
  }), _a(() => {
    e.isUnmounting = !0;
  }), e;
}
const Fe = [Function, Array], da = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: Fe,
  onEnter: Fe,
  onAfterEnter: Fe,
  onEnterCancelled: Fe,
  // leave
  onBeforeLeave: Fe,
  onLeave: Fe,
  onAfterLeave: Fe,
  onLeaveCancelled: Fe,
  // appear
  onBeforeAppear: Fe,
  onAppear: Fe,
  onAfterAppear: Fe,
  onAppearCancelled: Fe
}, ha = (e) => {
  const t = e.subTree;
  return t.component ? ha(t.component) : t;
}, qr = {
  name: "BaseTransition",
  props: da,
  setup(e, { slots: t }) {
    const n = Ka(), s = Wr();
    return () => {
      const o = t.default && va(t.default(), !0), a = o && o.length ? ma(o) : (
        // Keep explicit default-slot conditionals on the same transition path
        // as regular v-if branches, which render a comment placeholder.
        n.subTree ? Gt() : void 0
      );
      if (!a)
        return;
      const i = /* @__PURE__ */ z(e), { mode: c } = i;
      if (s.isLeaving)
        return ss(a);
      const p = Gs(a);
      if (!p)
        return ss(a);
      let d = vs(
        p,
        i,
        s,
        n,
        // #11061, ensure enterHooks is fresh after clone
        (g) => d = g
      );
      p.type !== Ae && cn(p, d);
      let f = n.subTree && Gs(n.subTree);
      if (f && f.type !== Ae && !Tt(f, p) && ha(n).type !== Ae) {
        let g = vs(
          f,
          i,
          s,
          n
        );
        if (cn(f, g), c === "out-in" && p.type !== Ae)
          return s.isLeaving = !0, g.afterLeave = () => {
            s.isLeaving = !1, n.job.flags & 8 || n.update(), delete g.afterLeave, f = void 0;
          }, ss(a);
        c === "in-out" && p.type !== Ae ? g.delayLeave = (x, C, F) => {
          const R = ga(
            s,
            f
          );
          R[String(f.key)] = f, x[Je] = () => {
            C(), x[Je] = void 0, delete d.delayedLeave, f = void 0;
          }, d.delayedLeave = () => {
            F(), delete d.delayedLeave, f = void 0;
          };
        } : f = void 0;
      } else f && (f = void 0);
      return a;
    };
  }
};
function ma(e) {
  let t = e[0];
  if (e.length > 1) {
    for (const n of e)
      if (n.type !== Ae) {
        t = n;
        break;
      }
  }
  return t;
}
const Gr = qr;
function ga(e, t) {
  const { leavingVNodes: n } = e;
  let s = n.get(t.type);
  return s || (s = /* @__PURE__ */ Object.create(null), n.set(t.type, s)), s;
}
function vs(e, t, n, s, o) {
  const {
    appear: a,
    mode: i,
    persisted: c = !1,
    onBeforeEnter: p,
    onEnter: d,
    onAfterEnter: f,
    onEnterCancelled: g,
    onBeforeLeave: x,
    onLeave: C,
    onAfterLeave: F,
    onLeaveCancelled: R,
    onBeforeAppear: Q,
    onAppear: I,
    onAfterAppear: N,
    onAppearCancelled: V
  } = t, k = String(e.key), B = ga(n, e), ie = (L, W) => {
    L && Ue(
      L,
      s,
      9,
      W
    );
  }, fe = (L, W) => {
    const ne = W[1];
    ie(L, W), O(L) ? L.every((A) => A.length <= 1) && ne() : L.length <= 1 && ne();
  }, me = {
    mode: i,
    persisted: c,
    beforeEnter(L) {
      let W = p;
      if (!n.isMounted)
        if (a)
          W = Q || p;
        else
          return;
      L[Je] && L[Je](
        !0
        /* cancelled */
      );
      const ne = B[k];
      ne && Tt(e, ne) && ne.el[Je] && ne.el[Je](), ie(W, [L]);
    },
    enter(L) {
      if (B[k] === e) return;
      let W = d, ne = f, A = g;
      if (!n.isMounted)
        if (a)
          W = I || d, ne = N || f, A = V || g;
        else
          return;
      let Y = !1;
      L[Ut] = (ge) => {
        Y || (Y = !0, ge ? ie(A, [L]) : ie(ne, [L]), me.delayedLeave && me.delayedLeave(), L[Ut] = void 0);
      };
      const oe = L[Ut].bind(null, !1);
      W ? fe(W, [L, oe]) : oe();
    },
    leave(L, W) {
      const ne = String(e.key);
      if (L[Ut] && L[Ut](
        !0
        /* cancelled */
      ), n.isUnmounting)
        return W();
      ie(x, [L]);
      let A = !1;
      L[Je] = (oe) => {
        A || (A = !0, W(), oe ? ie(R, [L]) : ie(F, [L]), L[Je] = void 0, B[ne] === e && delete B[ne]);
      };
      const Y = L[Je].bind(null, !1);
      B[ne] = e, C ? fe(C, [L, Y]) : Y();
    },
    clone(L) {
      const W = vs(
        L,
        t,
        n,
        s,
        o
      );
      return o && o(W), W;
    }
  };
  return me;
}
function ss(e) {
  if (Bn(e))
    return e = gt(e), e.children = null, e;
}
function Gs(e) {
  if (!Bn(e))
    return fa(e.type) && e.children ? ma(e.children) : e;
  if (e.component)
    return e.component.subTree;
  const { shapeFlag: t, children: n } = e;
  if (n) {
    if (t & 16)
      return n[0];
    if (t & 32 && D(n.default))
      return n.default();
  }
}
function cn(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, cn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
function va(e, t = !1, n) {
  let s = [], o = 0;
  for (let a = 0; a < e.length; a++) {
    let i = e[a];
    const c = n == null ? i.key : String(n) + String(i.key != null ? i.key : a);
    i.type === Te ? (i.patchFlag & 128 && o++, s = s.concat(
      va(i.children, t, c)
    )) : (t || i.type !== Ae) && s.push(c != null ? gt(i, { key: c }) : i);
  }
  if (o > 1)
    for (let a = 0; a < s.length; a++)
      s[a].patchFlag = -2;
  return s;
}
// @__NO_SIDE_EFFECTS__
function Js(e, t) {
  return D(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    ue({ name: e.name }, t, { setup: e })
  ) : e;
}
function ba(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ys(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const In = /* @__PURE__ */ new WeakMap();
function tn(e, t, n, s, o = !1) {
  if (O(e)) {
    e.forEach(
      (R, Q) => tn(
        R,
        t && (O(t) ? t[Q] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (nn(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && tn(e, t, n, s.component.subTree);
    return;
  }
  const a = s.shapeFlag & 4 ? Jn(s.component) : s.el, i = o ? null : a, { i: c, r: p } = e, d = t && t.r, f = c.refs === Z ? c.refs = {} : c.refs, g = c.setupState, x = /* @__PURE__ */ z(g), C = g === Z ? $o : (R) => Ys(f, R) ? !1 : q(x, R), F = (R, Q) => !(Q && Ys(f, Q));
  if (d != null && d !== p) {
    if (Xs(t), ae(d))
      f[d] = null, C(d) && (g[d] = null);
    else if (/* @__PURE__ */ _e(d)) {
      const R = t;
      F(d, R.k) && (d.value = null), R.k && (f[R.k] = null);
    }
  }
  if (D(p))
    mn(p, c, 12, [i, f]);
  else {
    const R = ae(p), Q = /* @__PURE__ */ _e(p);
    if (R || Q) {
      const I = () => {
        if (e.f) {
          const N = R ? C(p) ? g[p] : f[p] : F() || !e.k ? p.value : f[e.k];
          if (o)
            O(N) && Ts(N, a);
          else if (O(N))
            N.includes(a) || N.push(a);
          else if (R)
            f[p] = [a], C(p) && (g[p] = f[p]);
          else {
            const V = [a];
            F(p, e.k) && (p.value = V), e.k && (f[e.k] = V);
          }
        } else R ? (f[p] = i, C(p) && (g[p] = i)) : Q && (F(p, e.k) && (p.value = i), e.k && (f[e.k] = i));
      };
      if (i) {
        const N = () => {
          I(), In.delete(e);
        };
        N.id = -1, In.set(e, N), Pe(N, n);
      } else
        Xs(e), I();
    }
  }
}
function Xs(e) {
  const t = In.get(e);
  t && (t.flags |= 8, In.delete(e));
}
Kn().requestIdleCallback;
Kn().cancelIdleCallback;
const nn = (e) => !!e.type.__asyncLoader, Bn = (e) => e.type.__isKeepAlive;
function Jr(e, t) {
  xa(e, "a", t);
}
function Yr(e, t) {
  xa(e, "da", t);
}
function xa(e, t, n = Ee) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (Wn(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      Bn(o.parent.vnode) && Xr(s, t, n, o), o = o.parent;
  }
}
function Xr(e, t, n, s) {
  const o = Wn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  wa(() => {
    Ts(s[t], o);
  }, n);
}
function Wn(e, t, n = Ee, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), a = t.__weh || (t.__weh = (...i) => {
      pt();
      const c = gn(n), p = Ue(t, n, e, i);
      return c(), ut(), p;
    });
    return s ? o.unshift(a) : o.push(a), a;
  }
}
const dt = (e) => (t, n = Ee) => {
  (!un || e === "sp") && Wn(e, (...s) => t(...s), n);
}, Zr = dt("bm"), ya = dt("m"), Qr = dt(
  "bu"
), ei = dt("u"), _a = dt(
  "bum"
), wa = dt("um"), ti = dt(
  "sp"
), ni = dt("rtg"), si = dt("rtc");
function oi(e, t = Ee) {
  Wn("ec", e, t);
}
const ai = /* @__PURE__ */ Symbol.for("v-ndc");
function zt(e, t, n, s) {
  let o;
  const a = n, i = O(e);
  if (i || ae(e)) {
    const c = i && /* @__PURE__ */ kt(e);
    let p = !1, d = !1;
    c && (p = !/* @__PURE__ */ je(e), d = /* @__PURE__ */ ft(e), e = Un(e)), o = new Array(e.length);
    for (let f = 0, g = e.length; f < g; f++)
      o[f] = t(
        p ? d ? jt(Ke(e[f])) : Ke(e[f]) : e[f],
        f,
        void 0,
        a
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let c = 0; c < e; c++)
      o[c] = t(c + 1, c, void 0, a);
  } else if (G(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (c, p) => t(c, p, void 0, a)
      );
    else {
      const c = Object.keys(e);
      o = new Array(c.length);
      for (let p = 0, d = c.length; p < d; p++) {
        const f = c[p];
        o[p] = t(e[f], f, p, a);
      }
    }
  else
    o = [];
  return o;
}
const bs = (e) => e ? Ua(e) ? Jn(e) : bs(e.parent) : null, sn = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ ue(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => bs(e.parent),
    $root: (e) => bs(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Ca(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Ds(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Mt.bind(e.proxy)),
    $watch: (e) => zr.bind(e)
  })
), os = (e, t) => e !== Z && !e.__isScriptSetup && q(e, t), ri = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: a, accessCache: i, type: c, appContext: p } = e;
    if (t[0] !== "$") {
      const x = i[t];
      if (x !== void 0)
        switch (x) {
          case 1:
            return s[t];
          case 2:
            return o[t];
          case 4:
            return n[t];
          case 3:
            return a[t];
        }
      else {
        if (os(s, t))
          return i[t] = 1, s[t];
        if (o !== Z && q(o, t))
          return i[t] = 2, o[t];
        if (q(a, t))
          return i[t] = 3, a[t];
        if (n !== Z && q(n, t))
          return i[t] = 4, n[t];
        xs && (i[t] = 0);
      }
    }
    const d = sn[t];
    let f, g;
    if (d)
      return t === "$attrs" && ye(e.attrs, "get", ""), d(e);
    if (
      // css module (injected by vue-loader)
      (f = c.__cssModules) && (f = f[t])
    )
      return f;
    if (n !== Z && q(n, t))
      return i[t] = 4, n[t];
    if (
      // global properties
      g = p.config.globalProperties, q(g, t)
    )
      return g[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: a } = e;
    return os(o, t) ? (o[t] = n, !0) : s !== Z && q(s, t) ? (s[t] = n, !0) : q(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (a[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: a, type: i }
  }, c) {
    let p;
    return !!(n[c] || e !== Z && c[0] !== "$" && q(e, c) || os(t, c) || q(a, c) || q(s, c) || q(sn, c) || q(o.config.globalProperties, c) || (p = i.__cssModules) && p[c]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : q(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Zs(e) {
  return O(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let xs = !0;
function ii(e) {
  const t = Ca(e), n = e.proxy, s = e.ctx;
  xs = !1, t.beforeCreate && Qs(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: a,
    methods: i,
    watch: c,
    provide: p,
    inject: d,
    // lifecycle
    created: f,
    beforeMount: g,
    mounted: x,
    beforeUpdate: C,
    updated: F,
    activated: R,
    deactivated: Q,
    beforeDestroy: I,
    beforeUnmount: N,
    destroyed: V,
    unmounted: k,
    render: B,
    renderTracked: ie,
    renderTriggered: fe,
    errorCaptured: me,
    serverPrefetch: L,
    // public API
    expose: W,
    inheritAttrs: ne,
    // assets
    components: A,
    directives: Y,
    filters: oe
  } = t;
  if (d && li(d, s, null), i)
    for (const J in i) {
      const U = i[J];
      D(U) && (s[J] = U.bind(n));
    }
  if (o) {
    const J = o.call(n, n);
    G(J) && (e.data = /* @__PURE__ */ Dt(J));
  }
  if (xs = !0, a)
    for (const J in a) {
      const U = a[J], tt = D(U) ? U.bind(n, n) : D(U.get) ? U.get.bind(n, n) : Qe, It = !D(U) && D(U.set) ? U.set.bind(n) : Qe, ke = Jt({
        get: tt,
        set: It
      });
      Object.defineProperty(s, J, {
        enumerable: !0,
        configurable: !0,
        get: () => ke.value,
        set: (De) => ke.value = De
      });
    }
  if (c)
    for (const J in c)
      Sa(c[J], s, n, J);
  if (p) {
    const J = D(p) ? p.call(n) : p;
    Reflect.ownKeys(J).forEach((U) => {
      Vr(U, J[U]);
    });
  }
  f && Qs(f, e, "c");
  function j(J, U) {
    O(U) ? U.forEach((tt) => J(tt.bind(n))) : U && J(U.bind(n));
  }
  if (j(Zr, g), j(ya, x), j(Qr, C), j(ei, F), j(Jr, R), j(Yr, Q), j(oi, me), j(si, ie), j(ni, fe), j(_a, N), j(wa, k), j(ti, L), O(W))
    if (W.length) {
      const J = e.exposed || (e.exposed = {});
      W.forEach((U) => {
        Object.defineProperty(J, U, {
          get: () => n[U],
          set: (tt) => n[U] = tt,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  B && e.render === Qe && (e.render = B), ne != null && (e.inheritAttrs = ne), A && (e.components = A), Y && (e.directives = Y), L && ba(e);
}
function li(e, t, n = Qe) {
  O(e) && (e = ys(e));
  for (const s in e) {
    const o = e[s];
    let a;
    G(o) ? "default" in o ? a = Cn(
      o.from || s,
      o.default,
      !0
    ) : a = Cn(o.from || s) : a = Cn(o), /* @__PURE__ */ _e(a) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => a.value,
      set: (i) => a.value = i
    }) : t[s] = a;
  }
}
function Qs(e, t, n) {
  Ue(
    O(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Sa(e, t, n, s) {
  let o = s.includes(".") ? ua(n, s) : () => n[s];
  if (ae(e)) {
    const a = t[e];
    D(a) && en(o, a);
  } else if (D(e))
    en(o, e.bind(n));
  else if (G(e))
    if (O(e))
      e.forEach((a) => Sa(a, t, n, s));
    else {
      const a = D(e.handler) ? e.handler.bind(n) : t[e.handler];
      D(a) && en(o, a, e);
    }
}
function Ca(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: a,
    config: { optionMergeStrategies: i }
  } = e.appContext, c = a.get(t);
  let p;
  return c ? p = c : !o.length && !n && !s ? p = t : (p = {}, o.length && o.forEach(
    (d) => Pn(p, d, i, !0)
  ), Pn(p, t, i)), G(t) && a.set(t, p), p;
}
function Pn(e, t, n, s = !1) {
  const { mixins: o, extends: a } = t;
  a && Pn(e, a, n, !0), o && o.forEach(
    (i) => Pn(e, i, n, !0)
  );
  for (const i in t)
    if (!(s && i === "expose")) {
      const c = ci[i] || n && n[i];
      e[i] = c ? c(e[i], t[i]) : t[i];
    }
  return e;
}
const ci = {
  data: eo,
  props: to,
  emits: to,
  // objects
  methods: qt,
  computed: qt,
  // lifecycle
  beforeCreate: Se,
  created: Se,
  beforeMount: Se,
  mounted: Se,
  beforeUpdate: Se,
  updated: Se,
  beforeDestroy: Se,
  beforeUnmount: Se,
  destroyed: Se,
  unmounted: Se,
  activated: Se,
  deactivated: Se,
  errorCaptured: Se,
  serverPrefetch: Se,
  // assets
  components: qt,
  directives: qt,
  // watch
  watch: ui,
  // provide / inject
  provide: eo,
  inject: pi
};
function eo(e, t) {
  return t ? e ? function() {
    return ue(
      D(e) ? e.call(this, this) : e,
      D(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function pi(e, t) {
  return qt(ys(e), ys(t));
}
function ys(e) {
  if (O(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function Se(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function qt(e, t) {
  return e ? ue(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function to(e, t) {
  return e ? O(e) && O(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : ue(
    /* @__PURE__ */ Object.create(null),
    Zs(e),
    Zs(t ?? {})
  ) : t;
}
function ui(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = ue(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = Se(e[s], t[s]);
  return n;
}
function Ta() {
  return {
    app: null,
    config: {
      isNativeTag: $o,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let fi = 0;
function di(e, t) {
  return function(s, o = null) {
    D(s) || (s = ue({}, s)), o != null && !G(o) && (o = null);
    const a = Ta(), i = /* @__PURE__ */ new WeakSet(), c = [];
    let p = !1;
    const d = a.app = {
      _uid: fi++,
      _component: s,
      _props: o,
      _container: null,
      _context: a,
      _instance: null,
      version: Bi,
      get config() {
        return a.config;
      },
      set config(f) {
      },
      use(f, ...g) {
        return i.has(f) || (f && D(f.install) ? (i.add(f), f.install(d, ...g)) : D(f) && (i.add(f), f(d, ...g))), d;
      },
      mixin(f) {
        return a.mixins.includes(f) || a.mixins.push(f), d;
      },
      component(f, g) {
        return g ? (a.components[f] = g, d) : a.components[f];
      },
      directive(f, g) {
        return g ? (a.directives[f] = g, d) : a.directives[f];
      },
      mount(f, g, x) {
        if (!p) {
          const C = d._ceVNode || pe(s, o);
          return C.appContext = a, x === !0 ? x = "svg" : x === !1 && (x = void 0), e(C, f, x), p = !0, d._container = f, f.__vue_app__ = d, Jn(C.component);
        }
      },
      onUnmount(f) {
        c.push(f);
      },
      unmount() {
        p && (Ue(
          c,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(f, g) {
        return a.provides[f] = g, d;
      },
      runWithContext(f) {
        const g = Lt;
        Lt = d;
        try {
          return f();
        } finally {
          Lt = g;
        }
      }
    };
    return d;
  };
}
let Lt = null;
const hi = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${He(t)}Modifiers`] || e[`${vt(t)}Modifiers`];
function mi(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Z;
  let o = n;
  const a = t.startsWith("update:"), i = a && hi(s, t.slice(7));
  i && (i.trim && (o = n.map((f) => ae(f) ? f.trim() : f)), i.number && (o = n.map(Vn)));
  let c, p = s[c = Zn(t)] || // also try camelCase event handler (#2249)
  s[c = Zn(He(t))];
  !p && a && (p = s[c = Zn(vt(t))]), p && Ue(
    p,
    e,
    6,
    o
  );
  const d = s[c + "Once"];
  if (d) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[c])
      return;
    e.emitted[c] = !0, Ue(
      d,
      e,
      6,
      o
    );
  }
}
const gi = /* @__PURE__ */ new WeakMap();
function Aa(e, t, n = !1) {
  const s = n ? gi : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const a = e.emits;
  let i = {}, c = !1;
  if (!D(e)) {
    const p = (d) => {
      const f = Aa(d, t, !0);
      f && (c = !0, ue(i, f));
    };
    !n && t.mixins.length && t.mixins.forEach(p), e.extends && p(e.extends), e.mixins && e.mixins.forEach(p);
  }
  return !a && !c ? (G(e) && s.set(e, null), null) : (O(a) ? a.forEach((p) => i[p] = null) : ue(i, a), G(e) && s.set(e, i), i);
}
function qn(e, t) {
  return !e || !Ln(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), q(e, t[0].toLowerCase() + t.slice(1)) || q(e, vt(t)) || q(e, t));
}
function no(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: o,
    propsOptions: [a],
    slots: i,
    attrs: c,
    emit: p,
    render: d,
    renderCache: f,
    props: g,
    data: x,
    setupState: C,
    ctx: F,
    inheritAttrs: R
  } = e, Q = kn(e);
  let I, N;
  try {
    if (n.shapeFlag & 4) {
      const k = o || s, B = k;
      I = Xe(
        d.call(
          B,
          k,
          f,
          g,
          C,
          x,
          F
        )
      ), N = c;
    } else {
      const k = t;
      I = Xe(
        k.length > 1 ? k(
          g,
          { attrs: c, slots: i, emit: p }
        ) : k(
          g,
          null
        )
      ), N = t.props ? c : vi(c);
    }
  } catch (k) {
    on.length = 0, zn(k, e, 1), I = pe(Ae);
  }
  let V = I;
  if (N && R !== !1) {
    const k = Object.keys(N), { shapeFlag: B } = V;
    k.length && B & 7 && (a && k.some(Nn) && (N = bi(
      N,
      a
    )), V = gt(V, N, !1, !0));
  }
  return n.dirs && (V = gt(V, null, !1, !0), V.dirs = V.dirs ? V.dirs.concat(n.dirs) : n.dirs), n.transition && cn(V, n.transition), I = V, kn(Q), I;
}
const vi = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Ln(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, bi = (e, t) => {
  const n = {};
  for (const s in e)
    (!Nn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function xi(e, t, n) {
  const { props: s, children: o, component: a } = e, { props: i, children: c, patchFlag: p } = t, d = a.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && p >= 0) {
    if (p & 1024)
      return !0;
    if (p & 16)
      return s ? so(s, i, d) : !!i;
    if (p & 8) {
      const f = t.dynamicProps;
      for (let g = 0; g < f.length; g++) {
        const x = f[g];
        if (Ea(i, s, x) && !qn(d, x))
          return !0;
      }
    }
  } else
    return (o || c) && (!c || !c.$stable) ? !0 : s === i ? !1 : s ? i ? so(s, i, d) : !0 : !!i;
  return !1;
}
function so(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const a = s[o];
    if (Ea(t, e, a) && !qn(n, a))
      return !0;
  }
  return !1;
}
function Ea(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && G(s) && G(o) ? !hn(s, o) : s !== o;
}
function yi({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const ka = {}, Ia = () => Object.create(ka), Pa = (e) => Object.getPrototypeOf(e) === ka;
function _i(e, t, n, s = !1) {
  const o = {}, a = Ia();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Ra(e, t, o, a);
  for (const i in e.propsOptions[0])
    i in o || (o[i] = void 0);
  n ? e.props = s ? o : /* @__PURE__ */ Ir(o) : e.type.props ? e.props = o : e.props = a, e.attrs = a;
}
function wi(e, t, n, s) {
  const {
    props: o,
    attrs: a,
    vnode: { patchFlag: i }
  } = e, c = /* @__PURE__ */ z(o), [p] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || i > 0) && !(i & 16)
  ) {
    if (i & 8) {
      const f = e.vnode.dynamicProps;
      for (let g = 0; g < f.length; g++) {
        let x = f[g];
        if (qn(e.emitsOptions, x))
          continue;
        const C = t[x];
        if (p)
          if (q(a, x))
            C !== a[x] && (a[x] = C, d = !0);
          else {
            const F = He(x);
            o[F] = _s(
              p,
              c,
              F,
              C,
              e,
              !1
            );
          }
        else
          C !== a[x] && (a[x] = C, d = !0);
      }
    }
  } else {
    Ra(e, t, o, a) && (d = !0);
    let f;
    for (const g in c)
      (!t || // for camelCase
      !q(t, g) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((f = vt(g)) === g || !q(t, f))) && (p ? n && // for camelCase
      (n[g] !== void 0 || // for kebab-case
      n[f] !== void 0) && (o[g] = _s(
        p,
        c,
        g,
        void 0,
        e,
        !0
      )) : delete o[g]);
    if (a !== c)
      for (const g in a)
        (!t || !q(t, g)) && (delete a[g], d = !0);
  }
  d && lt(e.attrs, "set", "");
}
function Ra(e, t, n, s) {
  const [o, a] = e.propsOptions;
  let i = !1, c;
  if (t)
    for (let p in t) {
      if (Xt(p))
        continue;
      const d = t[p];
      let f;
      o && q(o, f = He(p)) ? !a || !a.includes(f) ? n[f] = d : (c || (c = {}))[f] = d : qn(e.emitsOptions, p) || (!(p in s) || d !== s[p]) && (s[p] = d, i = !0);
    }
  if (a) {
    const p = /* @__PURE__ */ z(n), d = c || Z;
    for (let f = 0; f < a.length; f++) {
      const g = a[f];
      n[g] = _s(
        o,
        p,
        g,
        d[g],
        e,
        !q(d, g)
      );
    }
  }
  return i;
}
function _s(e, t, n, s, o, a) {
  const i = e[n];
  if (i != null) {
    const c = q(i, "default");
    if (c && s === void 0) {
      const p = i.default;
      if (i.type !== Function && !i.skipFactory && D(p)) {
        const { propsDefaults: d } = o;
        if (n in d)
          s = d[n];
        else {
          const f = gn(o);
          s = d[n] = p.call(
            null,
            t
          ), f();
        }
      } else
        s = p;
      o.ce && o.ce._setProp(n, s);
    }
    i[
      0
      /* shouldCast */
    ] && (a && !c ? s = !1 : i[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === vt(n)) && (s = !0));
  }
  return s;
}
const Si = /* @__PURE__ */ new WeakMap();
function Ma(e, t, n = !1) {
  const s = n ? Si : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const a = e.props, i = {}, c = [];
  let p = !1;
  if (!D(e)) {
    const f = (g) => {
      p = !0;
      const [x, C] = Ma(g, t, !0);
      ue(i, x), C && c.push(...C);
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  if (!a && !p)
    return G(e) && s.set(e, Ot), Ot;
  if (O(a))
    for (let f = 0; f < a.length; f++) {
      const g = He(a[f]);
      oo(g) && (i[g] = Z);
    }
  else if (a)
    for (const f in a) {
      const g = He(f);
      if (oo(g)) {
        const x = a[f], C = i[g] = O(x) || D(x) ? { type: x } : ue({}, x), F = C.type;
        let R = !1, Q = !0;
        if (O(F))
          for (let I = 0; I < F.length; ++I) {
            const N = F[I], V = D(N) && N.name;
            if (V === "Boolean") {
              R = !0;
              break;
            } else V === "String" && (Q = !1);
          }
        else
          R = D(F) && F.name === "Boolean";
        C[
          0
          /* shouldCast */
        ] = R, C[
          1
          /* shouldCastTrue */
        ] = Q, (R || q(C, "default")) && c.push(g);
      }
    }
  const d = [i, c];
  return G(e) && s.set(e, d), d;
}
function oo(e) {
  return e[0] !== "$" && !Xt(e);
}
const Fs = (e) => e === "_" || e === "_ctx" || e === "$stable", Ls = (e) => O(e) ? e.map(Xe) : [Xe(e)], Ci = (e, t, n) => {
  if (t._n)
    return t;
  const s = ca((...o) => Ls(t(...o)), n);
  return s._c = !1, s;
}, Oa = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (Fs(o)) continue;
    const a = e[o];
    if (D(a))
      t[o] = Ci(o, a, s);
    else if (a != null) {
      const i = Ls(a);
      t[o] = () => i;
    }
  }
}, $a = (e, t) => {
  const n = Ls(t);
  e.slots.default = () => n;
}, Da = (e, t, n) => {
  for (const s in t)
    (n || !Fs(s)) && (e[s] = t[s]);
}, Ti = (e, t, n) => {
  const s = e.slots = Ia();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (Da(s, t, n), n && jo(s, "_", o, !0)) : Oa(t, s);
  } else t && $a(e, t);
}, Ai = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let a = !0, i = Z;
  if (s.shapeFlag & 32) {
    const c = t._;
    c ? n && c === 1 ? a = !1 : Da(o, t, n) : (a = !t.$stable, Oa(t, o)), i = t;
  } else t && ($a(e, t), i = { default: 1 });
  if (a)
    for (const c in o)
      !Fs(c) && i[c] == null && delete o[c];
}, Pe = Ri;
function Ei(e) {
  return ki(e);
}
function ki(e, t) {
  const n = Kn();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: o,
    patchProp: a,
    createElement: i,
    createText: c,
    createComment: p,
    setText: d,
    setElementText: f,
    parentNode: g,
    nextSibling: x,
    setScopeId: C = Qe,
    insertStaticContent: F
  } = e, R = (r, l, h, u = null, m = null, b = null, S = void 0, w = null, _ = !!l.dynamicChildren) => {
    if (r === l)
      return;
    r && !Tt(r, l) && (u = nt(r), De(r, m, b, !0), r = null), l.patchFlag === -2 && (_ = !1, l.dynamicChildren = null);
    const { type: y, ref: M, shapeFlag: T } = l;
    switch (y) {
      case Gn:
        Q(r, l, h, u);
        break;
      case Ae:
        I(r, l, h, u);
        break;
      case rs:
        r == null && N(l, h, u, S);
        break;
      case Te:
        A(
          r,
          l,
          h,
          u,
          m,
          b,
          S,
          w,
          _
        );
        break;
      default:
        T & 1 ? B(
          r,
          l,
          h,
          u,
          m,
          b,
          S,
          w,
          _
        ) : T & 6 ? Y(
          r,
          l,
          h,
          u,
          m,
          b,
          S,
          w,
          _
        ) : (T & 64 || T & 128) && y.process(
          r,
          l,
          h,
          u,
          m,
          b,
          S,
          w,
          _,
          xt
        );
    }
    M != null && m ? tn(M, r && r.ref, b, l || r, !l) : M == null && r && r.ref != null && tn(r.ref, null, b, r, !0);
  }, Q = (r, l, h, u) => {
    if (r == null)
      s(
        l.el = c(l.children),
        h,
        u
      );
    else {
      const m = l.el = r.el;
      l.children !== r.children && d(m, l.children);
    }
  }, I = (r, l, h, u) => {
    r == null ? s(
      l.el = p(l.children || ""),
      h,
      u
    ) : l.el = r.el;
  }, N = (r, l, h, u) => {
    [r.el, r.anchor] = F(
      r.children,
      l,
      h,
      u,
      r.el,
      r.anchor
    );
  }, V = ({ el: r, anchor: l }, h, u) => {
    let m;
    for (; r && r !== l; )
      m = x(r), s(r, h, u), r = m;
    s(l, h, u);
  }, k = ({ el: r, anchor: l }) => {
    let h;
    for (; r && r !== l; )
      h = x(r), o(r), r = h;
    o(l);
  }, B = (r, l, h, u, m, b, S, w, _) => {
    if (l.type === "svg" ? S = "svg" : l.type === "math" && (S = "mathml"), r == null)
      ie(
        l,
        h,
        u,
        m,
        b,
        S,
        w,
        _
      );
    else {
      const y = r.el && r.el._isVueCE ? r.el : null;
      try {
        y && y._beginPatch(), L(
          r,
          l,
          m,
          b,
          S,
          w,
          _
        );
      } finally {
        y && y._endPatch();
      }
    }
  }, ie = (r, l, h, u, m, b, S, w) => {
    let _, y;
    const { props: M, shapeFlag: T, transition: P, dirs: $ } = r;
    if (_ = r.el = i(
      r.type,
      b,
      M && M.is,
      M
    ), T & 8 ? f(_, r.children) : T & 16 && me(
      r.children,
      _,
      null,
      u,
      m,
      as(r, b),
      S,
      w
    ), $ && yt(r, null, u, "created"), fe(_, r, r.scopeId, S, u), M) {
      for (const X in M)
        X !== "value" && !Xt(X) && a(_, X, null, M[X], b, u);
      "value" in M && a(_, "value", null, M.value, b), (y = M.onVnodeBeforeMount) && qe(y, u, r);
    }
    $ && yt(r, null, u, "beforeMount");
    const K = Ii(m, P);
    K && P.beforeEnter(_), s(_, l, h), ((y = M && M.onVnodeMounted) || K || $) && Pe(() => {
      try {
        y && qe(y, u, r), K && P.enter(_), $ && yt(r, null, u, "mounted");
      } finally {
      }
    }, m);
  }, fe = (r, l, h, u, m) => {
    if (h && C(r, h), u)
      for (let b = 0; b < u.length; b++)
        C(r, u[b]);
    if (m) {
      let b = m.subTree;
      if (l === b || ja(b.type) && (b.ssContent === l || b.ssFallback === l)) {
        const S = m.vnode;
        fe(
          r,
          S,
          S.scopeId,
          S.slotScopeIds,
          m.parent
        );
      }
    }
  }, me = (r, l, h, u, m, b, S, w, _ = 0) => {
    for (let y = _; y < r.length; y++) {
      const M = r[y] = w ? it(r[y]) : Xe(r[y]);
      R(
        null,
        M,
        l,
        h,
        u,
        m,
        b,
        S,
        w
      );
    }
  }, L = (r, l, h, u, m, b, S) => {
    const w = l.el = r.el;
    let { patchFlag: _, dynamicChildren: y, dirs: M } = l;
    _ |= r.patchFlag & 16;
    const T = r.props || Z, P = l.props || Z;
    let $;
    if (h && _t(h, !1), ($ = P.onVnodeBeforeUpdate) && qe($, h, l, r), M && yt(l, r, h, "beforeUpdate"), h && _t(h, !0), (T.innerHTML && P.innerHTML == null || T.textContent && P.textContent == null) && f(w, ""), y ? W(
      r.dynamicChildren,
      y,
      w,
      h,
      u,
      as(l, m),
      b
    ) : S || U(
      r,
      l,
      w,
      null,
      h,
      u,
      as(l, m),
      b,
      !1
    ), _ > 0) {
      if (_ & 16)
        ne(w, T, P, h, m);
      else if (_ & 2 && T.class !== P.class && a(w, "class", null, P.class, m), _ & 4 && a(w, "style", T.style, P.style, m), _ & 8) {
        const K = l.dynamicProps;
        for (let X = 0; X < K.length; X++) {
          const ee = K[X], le = T[ee], de = P[ee];
          (de !== le || ee === "value") && a(w, ee, le, de, m, h);
        }
      }
      _ & 1 && r.children !== l.children && f(w, l.children);
    } else !S && y == null && ne(w, T, P, h, m);
    (($ = P.onVnodeUpdated) || M) && Pe(() => {
      $ && qe($, h, l, r), M && yt(l, r, h, "updated");
    }, u);
  }, W = (r, l, h, u, m, b, S) => {
    for (let w = 0; w < l.length; w++) {
      const _ = r[w], y = l[w], M = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        _.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (_.type === Te || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Tt(_, y) || // - In the case of a component, it could contain anything.
        _.shapeFlag & 198) ? g(_.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          h
        )
      );
      R(
        _,
        y,
        M,
        null,
        u,
        m,
        b,
        S,
        !0
      );
    }
  }, ne = (r, l, h, u, m) => {
    if (l !== h) {
      if (l !== Z)
        for (const b in l)
          !Xt(b) && !(b in h) && a(
            r,
            b,
            l[b],
            null,
            m,
            u
          );
      for (const b in h) {
        if (Xt(b)) continue;
        const S = h[b], w = l[b];
        S !== w && b !== "value" && a(r, b, w, S, m, u);
      }
      "value" in h && a(r, "value", l.value, h.value, m);
    }
  }, A = (r, l, h, u, m, b, S, w, _) => {
    const y = l.el = r ? r.el : c(""), M = l.anchor = r ? r.anchor : c("");
    let { patchFlag: T, dynamicChildren: P, slotScopeIds: $ } = l;
    $ && (w = w ? w.concat($) : $), r == null ? (s(y, h, u), s(M, h, u), me(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      l.children || [],
      h,
      M,
      m,
      b,
      S,
      w,
      _
    )) : T > 0 && T & 64 && P && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    r.dynamicChildren && r.dynamicChildren.length === P.length ? (W(
      r.dynamicChildren,
      P,
      h,
      m,
      b,
      S,
      w
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (l.key != null || m && l === m.subTree) && Fa(
      r,
      l,
      !0
      /* shallow */
    )) : U(
      r,
      l,
      h,
      M,
      m,
      b,
      S,
      w,
      _
    );
  }, Y = (r, l, h, u, m, b, S, w, _) => {
    l.slotScopeIds = w, r == null ? l.shapeFlag & 512 ? m.ctx.activate(
      l,
      h,
      u,
      S,
      _
    ) : oe(
      l,
      h,
      u,
      m,
      b,
      S,
      _
    ) : ge(r, l, _);
  }, oe = (r, l, h, u, m, b, S) => {
    const w = r.component = ji(
      r,
      u,
      m
    );
    if (Bn(r) && (w.ctx.renderer = xt), Hi(w, !1, S), w.asyncDep) {
      if (m && m.registerDep(w, j, S), !r.el) {
        const _ = w.subTree = pe(Ae);
        I(null, _, l, h), r.placeholder = _.el;
      }
    } else
      j(
        w,
        r,
        l,
        h,
        m,
        b,
        S
      );
  }, ge = (r, l, h) => {
    const u = l.component = r.component;
    if (xi(r, l, h))
      if (u.asyncDep && !u.asyncResolved) {
        J(u, l, h);
        return;
      } else
        u.next = l, u.update();
    else
      l.el = r.el, u.vnode = l;
  }, j = (r, l, h, u, m, b, S) => {
    const w = () => {
      if (r.isMounted) {
        let { next: T, bu: P, u: $, parent: K, vnode: X } = r;
        {
          const Be = La(r);
          if (Be) {
            T && (T.el = X.el, J(r, T, S)), Be.asyncDep.then(() => {
              Pe(() => {
                r.isUnmounted || y();
              }, m);
            });
            return;
          }
        }
        let ee = T, le;
        _t(r, !1), T ? (T.el = X.el, J(r, T, S)) : T = X, P && Sn(P), (le = T.props && T.props.onVnodeBeforeUpdate) && qe(le, K, T, X), _t(r, !0);
        const de = no(r), ze = r.subTree;
        r.subTree = de, R(
          ze,
          de,
          // parent may have changed if it's in a teleport
          g(ze.el),
          // anchor may have changed if it's in a fragment
          nt(ze),
          r,
          m,
          b
        ), T.el = de.el, ee === null && yi(r, de.el), $ && Pe($, m), (le = T.props && T.props.onVnodeUpdated) && Pe(
          () => qe(le, K, T, X),
          m
        );
      } else {
        let T;
        const { el: P, props: $ } = l, { bm: K, m: X, parent: ee, root: le, type: de } = r, ze = nn(l);
        _t(r, !1), K && Sn(K), !ze && (T = $ && $.onVnodeBeforeMount) && qe(T, ee, l), _t(r, !0);
        {
          le.ce && le.ce._hasShadowRoot() && le.ce._injectChildStyle(
            de,
            r.parent ? r.parent.type : void 0
          );
          const Be = r.subTree = no(r);
          R(
            null,
            Be,
            h,
            u,
            r,
            m,
            b
          ), l.el = Be.el;
        }
        if (X && Pe(X, m), !ze && (T = $ && $.onVnodeMounted)) {
          const Be = l;
          Pe(
            () => qe(T, ee, Be),
            m
          );
        }
        (l.shapeFlag & 256 || ee && nn(ee.vnode) && ee.vnode.shapeFlag & 256) && r.a && Pe(r.a, m), r.isMounted = !0, l = h = u = null;
      }
    };
    r.scope.on();
    const _ = r.effect = new Uo(w);
    r.scope.off();
    const y = r.update = _.run.bind(_), M = r.job = _.runIfDirty.bind(_);
    M.i = r, M.id = r.uid, _.scheduler = () => Ds(M), _t(r, !0), y();
  }, J = (r, l, h) => {
    l.component = r;
    const u = r.vnode.props;
    r.vnode = l, r.next = null, wi(r, l.props, u, h), Ai(r, l.children, h), pt(), qs(r), ut();
  }, U = (r, l, h, u, m, b, S, w, _ = !1) => {
    const y = r && r.children, M = r ? r.shapeFlag : 0, T = l.children, { patchFlag: P, shapeFlag: $ } = l;
    if (P > 0) {
      if (P & 128) {
        It(
          y,
          T,
          h,
          u,
          m,
          b,
          S,
          w,
          _
        );
        return;
      } else if (P & 256) {
        tt(
          y,
          T,
          h,
          u,
          m,
          b,
          S,
          w,
          _
        );
        return;
      }
    }
    $ & 8 ? (M & 16 && bt(y, m, b), T !== y && f(h, T)) : M & 16 ? $ & 16 ? It(
      y,
      T,
      h,
      u,
      m,
      b,
      S,
      w,
      _
    ) : bt(y, m, b, !0) : (M & 8 && f(h, ""), $ & 16 && me(
      T,
      h,
      u,
      m,
      b,
      S,
      w,
      _
    ));
  }, tt = (r, l, h, u, m, b, S, w, _) => {
    r = r || Ot, l = l || Ot;
    const y = r.length, M = l.length, T = Math.min(y, M);
    let P;
    for (P = 0; P < T; P++) {
      const $ = l[P] = _ ? it(l[P]) : Xe(l[P]);
      R(
        r[P],
        $,
        h,
        null,
        m,
        b,
        S,
        w,
        _
      );
    }
    y > M ? bt(
      r,
      m,
      b,
      !0,
      !1,
      T
    ) : me(
      l,
      h,
      u,
      m,
      b,
      S,
      w,
      _,
      T
    );
  }, It = (r, l, h, u, m, b, S, w, _) => {
    let y = 0;
    const M = l.length;
    let T = r.length - 1, P = M - 1;
    for (; y <= T && y <= P; ) {
      const $ = r[y], K = l[y] = _ ? it(l[y]) : Xe(l[y]);
      if (Tt($, K))
        R(
          $,
          K,
          h,
          null,
          m,
          b,
          S,
          w,
          _
        );
      else
        break;
      y++;
    }
    for (; y <= T && y <= P; ) {
      const $ = r[T], K = l[P] = _ ? it(l[P]) : Xe(l[P]);
      if (Tt($, K))
        R(
          $,
          K,
          h,
          null,
          m,
          b,
          S,
          w,
          _
        );
      else
        break;
      T--, P--;
    }
    if (y > T) {
      if (y <= P) {
        const $ = P + 1, K = $ < M ? l[$].el : u;
        for (; y <= P; )
          R(
            null,
            l[y] = _ ? it(l[y]) : Xe(l[y]),
            h,
            K,
            m,
            b,
            S,
            w,
            _
          ), y++;
      }
    } else if (y > P)
      for (; y <= T; )
        De(r[y], m, b, !0), y++;
    else {
      const $ = y, K = y, X = /* @__PURE__ */ new Map();
      for (y = K; y <= P; y++) {
        const Me = l[y] = _ ? it(l[y]) : Xe(l[y]);
        Me.key != null && X.set(Me.key, y);
      }
      let ee, le = 0;
      const de = P - K + 1;
      let ze = !1, Be = 0;
      const Ht = new Array(de);
      for (y = 0; y < de; y++) Ht[y] = 0;
      for (y = $; y <= T; y++) {
        const Me = r[y];
        if (le >= de) {
          De(Me, m, b, !0);
          continue;
        }
        let We;
        if (Me.key != null)
          We = X.get(Me.key);
        else
          for (ee = K; ee <= P; ee++)
            if (Ht[ee - K] === 0 && Tt(Me, l[ee])) {
              We = ee;
              break;
            }
        We === void 0 ? De(Me, m, b, !0) : (Ht[We - K] = y + 1, We >= Be ? Be = We : ze = !0, R(
          Me,
          l[We],
          h,
          null,
          m,
          b,
          S,
          w,
          _
        ), le++);
      }
      const Hs = ze ? Pi(Ht) : Ot;
      for (ee = Hs.length - 1, y = de - 1; y >= 0; y--) {
        const Me = K + y, We = l[Me], Vs = l[Me + 1], Ks = Me + 1 < M ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Vs.el || Na(Vs)
        ) : u;
        Ht[y] === 0 ? R(
          null,
          We,
          h,
          Ks,
          m,
          b,
          S,
          w,
          _
        ) : ze && (ee < 0 || y !== Hs[ee] ? ke(We, h, Ks, 2) : ee--);
      }
    }
  }, ke = (r, l, h, u, m = null) => {
    const { el: b, type: S, transition: w, children: _, shapeFlag: y } = r;
    if (y & 6) {
      ke(r.component.subTree, l, h, u);
      return;
    }
    if (y & 128) {
      r.suspense.move(l, h, u);
      return;
    }
    if (y & 64) {
      S.move(r, l, h, xt);
      return;
    }
    if (S === Te) {
      s(b, l, h);
      for (let T = 0; T < _.length; T++)
        ke(_[T], l, h, u);
      s(r.anchor, l, h);
      return;
    }
    if (S === rs) {
      V(r, l, h);
      return;
    }
    if (u !== 2 && y & 1 && w)
      if (u === 0)
        w.beforeEnter(b), s(b, l, h), Pe(() => w.enter(b), m);
      else {
        const { leave: T, delayLeave: P, afterLeave: $ } = w, K = () => {
          r.ctx.isUnmounted ? o(b) : s(b, l, h);
        }, X = () => {
          b._isLeaving && b[Je](
            !0
            /* cancelled */
          ), T(b, () => {
            K(), $ && $();
          });
        };
        P ? P(b, K, X) : X();
      }
    else
      s(b, l, h);
  }, De = (r, l, h, u = !1, m = !1) => {
    const {
      type: b,
      props: S,
      ref: w,
      children: _,
      dynamicChildren: y,
      shapeFlag: M,
      patchFlag: T,
      dirs: P,
      cacheIndex: $,
      memo: K
    } = r;
    if (T === -2 && (m = !1), w != null && (pt(), tn(w, null, h, r, !0), ut()), $ != null && (l.renderCache[$] = void 0), M & 256) {
      l.ctx.deactivate(r);
      return;
    }
    const X = M & 1 && P, ee = !nn(r);
    let le;
    if (ee && (le = S && S.onVnodeBeforeUnmount) && qe(le, l, r), M & 6)
      bn(r.component, h, u);
    else {
      if (M & 128) {
        r.suspense.unmount(h, u);
        return;
      }
      X && yt(r, null, l, "beforeUnmount"), M & 64 ? r.type.remove(
        r,
        l,
        h,
        xt,
        u
      ) : y && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !y.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (b !== Te || T > 0 && T & 64) ? bt(
        y,
        l,
        h,
        !1,
        !0
      ) : (b === Te && T & 384 || !m && M & 16) && bt(_, l, h), u && vn(r);
    }
    const de = K != null && $ == null;
    (ee && (le = S && S.onVnodeUnmounted) || X || de) && Pe(() => {
      le && qe(le, l, r), X && yt(r, null, l, "unmounted"), de && (r.el = null);
    }, h);
  }, vn = (r) => {
    const { type: l, el: h, anchor: u, transition: m } = r;
    if (l === Te) {
      Xn(h, u);
      return;
    }
    if (l === rs) {
      k(r);
      return;
    }
    const b = () => {
      o(h), m && !m.persisted && m.afterLeave && m.afterLeave();
    };
    if (r.shapeFlag & 1 && m && !m.persisted) {
      const { leave: S, delayLeave: w } = m, _ = () => S(h, b);
      w ? w(r.el, b, _) : _();
    } else
      b();
  }, Xn = (r, l) => {
    let h;
    for (; r !== l; )
      h = x(r), o(r), r = h;
    o(l);
  }, bn = (r, l, h) => {
    const { bum: u, scope: m, job: b, subTree: S, um: w, m: _, a: y } = r;
    ao(_), ao(y), u && Sn(u), m.stop(), b && (b.flags |= 8, De(S, r, l, h)), w && Pe(w, l), Pe(() => {
      r.isUnmounted = !0;
    }, l);
  }, bt = (r, l, h, u = !1, m = !1, b = 0) => {
    for (let S = b; S < r.length; S++)
      De(r[S], l, h, u, m);
  }, nt = (r) => {
    if (r.shapeFlag & 6)
      return nt(r.component.subTree);
    if (r.shapeFlag & 128)
      return r.suspense.next();
    const l = x(r.anchor || r.el), h = l && l[Br];
    return h ? x(h) : l;
  };
  let st = !1;
  const xn = (r, l, h) => {
    let u;
    r == null ? l._vnode && (De(l._vnode, null, null, !0), u = l._vnode.component) : R(
      l._vnode || null,
      r,
      l,
      null,
      null,
      null,
      h
    ), l._vnode = r, st || (st = !0, qs(u), ra(), st = !1);
  }, xt = {
    p: R,
    um: De,
    m: ke,
    r: vn,
    mt: oe,
    mc: me,
    pc: U,
    pbc: W,
    n: nt,
    o: e
  };
  return {
    render: xn,
    hydrate: void 0,
    createApp: di(xn)
  };
}
function as({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function _t({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ii(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Fa(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (O(s) && O(o))
    for (let a = 0; a < s.length; a++) {
      const i = s[a];
      let c = o[a];
      c.shapeFlag & 1 && !c.dynamicChildren && ((c.patchFlag <= 0 || c.patchFlag === 32) && (c = o[a] = it(o[a]), c.el = i.el), !n && c.patchFlag !== -2 && Fa(i, c)), c.type === Gn && (c.patchFlag === -1 && (c = o[a] = it(c)), c.el = i.el), c.type === Ae && !c.el && (c.el = i.el);
    }
}
function Pi(e) {
  const t = e.slice(), n = [0];
  let s, o, a, i, c;
  const p = e.length;
  for (s = 0; s < p; s++) {
    const d = e[s];
    if (d !== 0) {
      if (o = n[n.length - 1], e[o] < d) {
        t[s] = o, n.push(s);
        continue;
      }
      for (a = 0, i = n.length - 1; a < i; )
        c = a + i >> 1, e[n[c]] < d ? a = c + 1 : i = c;
      d < e[n[a]] && (a > 0 && (t[s] = n[a - 1]), n[a] = s);
    }
  }
  for (a = n.length, i = n[a - 1]; a-- > 0; )
    n[a] = i, i = t[i];
  return n;
}
function La(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : La(t);
}
function ao(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Na(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Na(t.subTree) : null;
}
const ja = (e) => e.__isSuspense;
function Ri(e, t) {
  t && t.pendingBranch ? O(e) ? t.effects.push(...e) : t.effects.push(e) : Hr(e);
}
const Te = /* @__PURE__ */ Symbol.for("v-fgt"), Gn = /* @__PURE__ */ Symbol.for("v-txt"), Ae = /* @__PURE__ */ Symbol.for("v-cmt"), rs = /* @__PURE__ */ Symbol.for("v-stc"), on = [];
let $e = null;
function be(e = !1) {
  on.push($e = e ? null : []);
}
function Mi() {
  on.pop(), $e = on[on.length - 1] || null;
}
let pn = 1;
function Rn(e, t = !1) {
  pn += e, e < 0 && $e && t && ($e.hasOnce = !0);
}
function Ha(e) {
  return e.dynamicChildren = pn > 0 ? $e || Ot : null, Mi(), pn > 0 && $e && $e.push(e), e;
}
function we(e, t, n, s, o, a) {
  return Ha(
    v(
      e,
      t,
      n,
      s,
      o,
      a,
      !0
    )
  );
}
function Oi(e, t, n, s, o) {
  return Ha(
    pe(
      e,
      t,
      n,
      s,
      o,
      !0
    )
  );
}
function Mn(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Tt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Va = ({ key: e }) => e ?? null, Tn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ae(e) || /* @__PURE__ */ _e(e) || D(e) ? { i: Ne, r: e, k: t, f: !!n } : e : null);
function v(e, t = null, n = null, s = 0, o = null, a = e === Te ? 0 : 1, i = !1, c = !1) {
  const p = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Va(t),
    ref: t && Tn(t),
    scopeId: la,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: a,
    patchFlag: s,
    dynamicProps: o,
    dynamicChildren: null,
    appContext: null,
    ctx: Ne
  };
  return c ? (Ns(p, n), a & 128 && e.normalize(p)) : n && (p.shapeFlag |= ae(n) ? 8 : 16), pn > 0 && // avoid a block node from tracking itself
  !i && // has current parent block
  $e && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (p.patchFlag > 0 || a & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  p.patchFlag !== 32 && $e.push(p), p;
}
const pe = $i;
function $i(e, t = null, n = null, s = 0, o = null, a = !1) {
  if ((!e || e === ai) && (e = Ae), Mn(e)) {
    const c = gt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && Ns(c, n), pn > 0 && !a && $e && (c.shapeFlag & 6 ? $e[$e.indexOf(e)] = c : $e.push(c)), c.patchFlag = -2, c;
  }
  if (zi(e) && (e = e.__vccOpts), t) {
    t = Di(t);
    let { class: c, style: p } = t;
    c && !ae(c) && (t.class = Re(c)), G(p) && (/* @__PURE__ */ $s(p) && !O(p) && (p = ue({}, p)), t.style = Es(p));
  }
  const i = ae(e) ? 1 : ja(e) ? 128 : fa(e) ? 64 : G(e) ? 4 : D(e) ? 2 : 0;
  return v(
    e,
    t,
    n,
    s,
    o,
    i,
    a,
    !0
  );
}
function Di(e) {
  return e ? /* @__PURE__ */ $s(e) || Pa(e) ? ue({}, e) : e : null;
}
function gt(e, t, n = !1, s = !1) {
  const { props: o, ref: a, patchFlag: i, children: c, transition: p } = e, d = t ? Fi(o || {}, t) : o, f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && Va(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && a ? O(a) ? a.concat(Tn(t)) : [a, Tn(t)] : Tn(t)
    ) : a,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: c,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== Te ? i === -1 ? 16 : i | 16 : i,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: p,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && gt(e.ssContent),
    ssFallback: e.ssFallback && gt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return p && s && cn(
    f,
    p.clone(f)
  ), f;
}
function xe(e = " ", t = 0) {
  return pe(Gn, null, e, t);
}
function Gt(e = "", t = !1) {
  return t ? (be(), Oi(Ae, null, e)) : pe(Ae, null, e);
}
function Xe(e) {
  return e == null || typeof e == "boolean" ? pe(Ae) : O(e) ? pe(
    Te,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Mn(e) ? it(e) : pe(Gn, null, String(e));
}
function it(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : gt(e);
}
function Ns(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (O(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), Ns(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !Pa(t) ? t._ctx = Ne : o === 3 && Ne && (Ne.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else D(t) ? (t = { default: t, _ctx: Ne }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [xe(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Fi(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = Re([t.class, s.class]));
      else if (o === "style")
        t.style = Es([t.style, s.style]);
      else if (Ln(o)) {
        const a = t[o], i = s[o];
        i && a !== i && !(O(a) && a.includes(i)) ? t[o] = a ? [].concat(a, i) : i : i == null && a == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Nn(o) && (t[o] = i);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function qe(e, t, n, s = null) {
  Ue(e, t, 7, [
    n,
    s
  ]);
}
const Li = Ta();
let Ni = 0;
function ji(e, t, n) {
  const s = e.type, o = (t ? t.appContext : e.appContext) || Li, a = {
    uid: Ni++,
    vnode: e,
    type: s,
    parent: t,
    appContext: o,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new cr(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(o.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Ma(s, o),
    emitsOptions: Aa(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: Z,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: Z,
    data: Z,
    props: Z,
    attrs: Z,
    slots: Z,
    refs: Z,
    setupState: Z,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return a.ctx = { _: a }, a.root = t ? t.root : a, a.emit = mi.bind(null, a), e.ce && e.ce(a), a;
}
let Ee = null;
const Ka = () => Ee || Ne;
let On, ws;
{
  const e = Kn(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (a) => {
      o.length > 1 ? o.forEach((i) => i(a)) : o[0](a);
    };
  };
  On = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ee = n
  ), ws = t(
    "__VUE_SSR_SETTERS__",
    (n) => un = n
  );
}
const gn = (e) => {
  const t = Ee;
  return On(e), e.scope.on(), () => {
    e.scope.off(), On(t);
  };
}, ro = () => {
  Ee && Ee.scope.off(), On(null);
};
function Ua(e) {
  return e.vnode.shapeFlag & 4;
}
let un = !1;
function Hi(e, t = !1, n = !1) {
  t && ws(t);
  const { props: s, children: o } = e.vnode, a = Ua(e);
  _i(e, s, a, t), Ti(e, o, n || t);
  const i = a ? Vi(e, t) : void 0;
  return t && ws(!1), i;
}
function Vi(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ri);
  const { setup: s } = n;
  if (s) {
    pt();
    const o = e.setupContext = s.length > 1 ? Ui(e) : null, a = gn(e), i = mn(
      s,
      e,
      0,
      [
        e.props,
        o
      ]
    ), c = Do(i);
    if (ut(), a(), (c || e.sp) && !nn(e) && ba(e), c) {
      if (i.then(ro, ro), t)
        return i.then((p) => {
          io(e, p);
        }).catch((p) => {
          zn(p, e, 0);
        });
      e.asyncDep = i;
    } else
      io(e, i);
  } else
    za(e);
}
function io(e, t, n) {
  D(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : G(t) && (e.setupState = sa(t)), za(e);
}
function za(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Qe);
  {
    const o = gn(e);
    pt();
    try {
      ii(e);
    } finally {
      ut(), o();
    }
  }
}
const Ki = {
  get(e, t) {
    return ye(e, "get", ""), e[t];
  }
};
function Ui(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, Ki),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Jn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(sa(Pr(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in sn)
        return sn[n](e);
    },
    has(t, n) {
      return n in t || n in sn;
    }
  })) : e.proxy;
}
function zi(e) {
  return D(e) && "__vccOpts" in e;
}
const Jt = (e, t) => /* @__PURE__ */ Dr(e, t, un);
function re(e, t, n) {
  try {
    Rn(-1);
    const s = arguments.length;
    return s === 2 ? G(t) && !O(t) ? Mn(t) ? pe(e, null, [t]) : pe(e, t) : pe(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && Mn(n) && (n = [n]), pe(e, t, n));
  } finally {
    Rn(1);
  }
}
const Bi = "3.5.34";
/**
* @vue/runtime-dom v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Ss;
const lo = typeof window < "u" && window.trustedTypes;
if (lo)
  try {
    Ss = /* @__PURE__ */ lo.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Ba = Ss ? (e) => Ss.createHTML(e) : (e) => e, Wi = "http://www.w3.org/2000/svg", qi = "http://www.w3.org/1998/Math/MathML", rt = typeof document < "u" ? document : null, co = rt && /* @__PURE__ */ rt.createElement("template"), Gi = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? rt.createElementNS(Wi, e) : t === "mathml" ? rt.createElementNS(qi, e) : n ? rt.createElement(e, { is: n }) : rt.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
  },
  createText: (e) => rt.createTextNode(e),
  createComment: (e) => rt.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => rt.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, o, a) {
    const i = n ? n.previousSibling : t.lastChild;
    if (o && (o === a || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), n), !(o === a || !(o = o.nextSibling)); )
        ;
    else {
      co.innerHTML = Ba(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const c = co.content;
      if (s === "svg" || s === "mathml") {
        const p = c.firstChild;
        for (; p.firstChild; )
          c.appendChild(p.firstChild);
        c.removeChild(p);
      }
      t.insertBefore(c, n);
    }
    return [
      // first
      i ? i.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, ht = "transition", Bt = "animation", fn = /* @__PURE__ */ Symbol("_vtc"), Wa = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: !0
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String
}, Ji = /* @__PURE__ */ ue(
  {},
  da,
  Wa
), Yi = (e) => (e.displayName = "Transition", e.props = Ji, e), Xi = /* @__PURE__ */ Yi(
  (e, { slots: t }) => re(Gr, Zi(e), t)
), wt = (e, t = []) => {
  O(e) ? e.forEach((n) => n(...t)) : e && e(...t);
}, po = (e) => e ? O(e) ? e.some((t) => t.length > 1) : e.length > 1 : !1;
function Zi(e) {
  const t = {};
  for (const A in e)
    A in Wa || (t[A] = e[A]);
  if (e.css === !1)
    return t;
  const {
    name: n = "v",
    type: s,
    duration: o,
    enterFromClass: a = `${n}-enter-from`,
    enterActiveClass: i = `${n}-enter-active`,
    enterToClass: c = `${n}-enter-to`,
    appearFromClass: p = a,
    appearActiveClass: d = i,
    appearToClass: f = c,
    leaveFromClass: g = `${n}-leave-from`,
    leaveActiveClass: x = `${n}-leave-active`,
    leaveToClass: C = `${n}-leave-to`
  } = e, F = Qi(o), R = F && F[0], Q = F && F[1], {
    onBeforeEnter: I,
    onEnter: N,
    onEnterCancelled: V,
    onLeave: k,
    onLeaveCancelled: B,
    onBeforeAppear: ie = I,
    onAppear: fe = N,
    onAppearCancelled: me = V
  } = t, L = (A, Y, oe, ge) => {
    A._enterCancelled = ge, St(A, Y ? f : c), St(A, Y ? d : i), oe && oe();
  }, W = (A, Y) => {
    A._isLeaving = !1, St(A, g), St(A, C), St(A, x), Y && Y();
  }, ne = (A) => (Y, oe) => {
    const ge = A ? fe : N, j = () => L(Y, A, oe);
    wt(ge, [Y, j]), uo(() => {
      St(Y, A ? p : a), at(Y, A ? f : c), po(ge) || fo(Y, s, R, j);
    });
  };
  return ue(t, {
    onBeforeEnter(A) {
      wt(I, [A]), at(A, a), at(A, i);
    },
    onBeforeAppear(A) {
      wt(ie, [A]), at(A, p), at(A, d);
    },
    onEnter: ne(!1),
    onAppear: ne(!0),
    onLeave(A, Y) {
      A._isLeaving = !0;
      const oe = () => W(A, Y);
      at(A, g), A._enterCancelled ? (at(A, x), go(A)) : (go(A), at(A, x)), uo(() => {
        A._isLeaving && (St(A, g), at(A, C), po(k) || fo(A, s, Q, oe));
      }), wt(k, [A, oe]);
    },
    onEnterCancelled(A) {
      L(A, !1, void 0, !0), wt(V, [A]);
    },
    onAppearCancelled(A) {
      L(A, !0, void 0, !0), wt(me, [A]);
    },
    onLeaveCancelled(A) {
      W(A), wt(B, [A]);
    }
  });
}
function Qi(e) {
  if (e == null)
    return null;
  if (G(e))
    return [is(e.enter), is(e.leave)];
  {
    const t = is(e);
    return [t, t];
  }
}
function is(e) {
  return er(e);
}
function at(e, t) {
  t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e[fn] || (e[fn] = /* @__PURE__ */ new Set())).add(t);
}
function St(e, t) {
  t.split(/\s+/).forEach((s) => s && e.classList.remove(s));
  const n = e[fn];
  n && (n.delete(t), n.size || (e[fn] = void 0));
}
function uo(e) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e);
  });
}
let el = 0;
function fo(e, t, n, s) {
  const o = e._endId = ++el, a = () => {
    o === e._endId && s();
  };
  if (n != null)
    return setTimeout(a, n);
  const { type: i, timeout: c, propCount: p } = tl(e, t);
  if (!i)
    return s();
  const d = i + "end";
  let f = 0;
  const g = () => {
    e.removeEventListener(d, x), a();
  }, x = (C) => {
    C.target === e && ++f >= p && g();
  };
  setTimeout(() => {
    f < p && g();
  }, c + 1), e.addEventListener(d, x);
}
function tl(e, t) {
  const n = window.getComputedStyle(e), s = (F) => (n[F] || "").split(", "), o = s(`${ht}Delay`), a = s(`${ht}Duration`), i = ho(o, a), c = s(`${Bt}Delay`), p = s(`${Bt}Duration`), d = ho(c, p);
  let f = null, g = 0, x = 0;
  t === ht ? i > 0 && (f = ht, g = i, x = a.length) : t === Bt ? d > 0 && (f = Bt, g = d, x = p.length) : (g = Math.max(i, d), f = g > 0 ? i > d ? ht : Bt : null, x = f ? f === ht ? a.length : p.length : 0);
  const C = f === ht && /\b(?:transform|all)(?:,|$)/.test(
    s(`${ht}Property`).toString()
  );
  return {
    type: f,
    timeout: g,
    propCount: x,
    hasTransform: C
  };
}
function ho(e, t) {
  for (; e.length < t.length; )
    e = e.concat(e);
  return Math.max(...t.map((n, s) => mo(n) + mo(e[s])));
}
function mo(e) {
  return e === "auto" ? 0 : Number(e.slice(0, -1).replace(",", ".")) * 1e3;
}
function go(e) {
  return (e ? e.ownerDocument : document).body.offsetHeight;
}
function nl(e, t, n) {
  const s = e[fn];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const $n = /* @__PURE__ */ Symbol("_vod"), qa = /* @__PURE__ */ Symbol("_vsh"), vo = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[$n] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Wt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Wt(e, !0), s.enter(e)) : s.leave(e, () => {
      Wt(e, !1);
    }) : Wt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Wt(e, t);
  }
};
function Wt(e, t) {
  e.style.display = t ? e[$n] : "none", e[qa] = !t;
}
const sl = /* @__PURE__ */ Symbol(""), ol = /(?:^|;)\s*display\s*:/;
function al(e, t, n) {
  const s = e.style, o = ae(n);
  let a = !1;
  if (n && !o) {
    if (t)
      if (ae(t))
        for (const i of t.split(";")) {
          const c = i.slice(0, i.indexOf(":")).trim();
          n[c] == null && Yt(s, c, "");
        }
      else
        for (const i in t)
          n[i] == null && Yt(s, i, "");
    for (const i in n) {
      i === "display" && (a = !0);
      const c = n[i];
      c != null ? il(
        e,
        i,
        !ae(t) && t ? t[i] : void 0,
        c
      ) || Yt(s, i, c) : Yt(s, i, "");
    }
  } else if (o) {
    if (t !== n) {
      const i = s[sl];
      i && (n += ";" + i), s.cssText = n, a = ol.test(n);
    }
  } else t && e.removeAttribute("style");
  $n in e && (e[$n] = a ? s.display : "", e[qa] && (s.display = "none"));
}
const bo = /\s*!important$/;
function Yt(e, t, n) {
  if (O(n))
    n.forEach((s) => Yt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = rl(e, t);
    bo.test(n) ? e.setProperty(
      vt(s),
      n.replace(bo, ""),
      "important"
    ) : e[s] = n;
  }
}
const xo = ["Webkit", "Moz", "ms"], ls = {};
function rl(e, t) {
  const n = ls[t];
  if (n)
    return n;
  let s = He(t);
  if (s !== "filter" && s in e)
    return ls[t] = s;
  s = No(s);
  for (let o = 0; o < xo.length; o++) {
    const a = xo[o] + s;
    if (a in e)
      return ls[t] = a;
  }
  return t;
}
function il(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && ae(s) && n === s;
}
const yo = "http://www.w3.org/1999/xlink";
function _o(e, t, n, s, o, a = rr(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(yo, t.slice(6, t.length)) : e.setAttributeNS(yo, t, n) : n == null || a && !Ho(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    a ? "" : et(n) ? String(n) : n
  );
}
function wo(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Ba(n) : n);
    return;
  }
  const a = e.tagName;
  if (t === "value" && a !== "PROGRESS" && // custom elements may use _value internally
  !a.includes("-")) {
    const c = a === "OPTION" ? e.getAttribute("value") || "" : e.value, p = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (c !== p || !("_value" in e)) && (e.value = p), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let i = !1;
  if (n === "" || n == null) {
    const c = typeof e[t];
    c === "boolean" ? n = Ho(n) : n == null && c === "string" ? (n = "", i = !0) : c === "number" && (n = 0, i = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  i && e.removeAttribute(o || t);
}
function At(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function ll(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const So = /* @__PURE__ */ Symbol("_vei");
function cl(e, t, n, s, o = null) {
  const a = e[So] || (e[So] = {}), i = a[t];
  if (s && i)
    i.value = s;
  else {
    const [c, p] = pl(t);
    if (s) {
      const d = a[t] = dl(
        s,
        o
      );
      At(e, c, d, p);
    } else i && (ll(e, c, i, p), a[t] = void 0);
  }
}
const Co = /(?:Once|Passive|Capture)$/;
function pl(e) {
  let t;
  if (Co.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Co); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : vt(e.slice(2)), t];
}
let cs = 0;
const ul = /* @__PURE__ */ Promise.resolve(), fl = () => cs || (ul.then(() => cs = 0), cs = Date.now());
function dl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    Ue(
      hl(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = fl(), n;
}
function hl(e, t) {
  if (O(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (s) => (o) => !o._stopped && s && s(o)
    );
  } else
    return t;
}
const To = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, ml = (e, t, n, s, o, a) => {
  const i = o === "svg";
  t === "class" ? nl(e, s, i) : t === "style" ? al(e, n, s) : Ln(t) ? Nn(t) || cl(e, t, n, s, a) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : gl(e, t, s, i)) ? (wo(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && _o(e, t, s, i, a, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (vl(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !ae(s))) ? wo(e, He(t), s, a, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), _o(e, t, s, i));
};
function gl(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && To(t) && D(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return To(t) && ae(n) ? !1 : t in e;
}
function vl(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = He(t);
  return Array.isArray(n) ? n.some((o) => He(o) === s) : Object.keys(n).some((o) => He(o) === s);
}
const Dn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return O(t) ? (n) => Sn(t, n) : t;
};
function bl(e) {
  e.target.composing = !0;
}
function Ao(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const Nt = /* @__PURE__ */ Symbol("_assign");
function Eo(e, t, n) {
  return t && (e = e.trim()), n && (e = Vn(e)), e;
}
const ve = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, o) {
    e[Nt] = Dn(o);
    const a = s || o.props && o.props.type === "number";
    At(e, t ? "change" : "input", (i) => {
      i.target.composing || e[Nt](Eo(e.value, n, a));
    }), (n || a) && At(e, "change", () => {
      e.value = Eo(e.value, n, a);
    }), t || (At(e, "compositionstart", bl), At(e, "compositionend", Ao), At(e, "change", Ao));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: a } }, i) {
    if (e[Nt] = Dn(i), e.composing) return;
    const c = (a || e.type === "number") && !/^0\d/.test(e.value) ? Vn(e.value) : e.value, p = t ?? "";
    if (c === p)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === p) || (e.value = p);
  }
}, ko = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const o = jn(t);
    At(e, "change", () => {
      const a = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => n ? Vn(Fn(i)) : Fn(i)
      );
      e[Nt](
        e.multiple ? o ? new Set(a) : a : a[0]
      ), e._assigning = !0, Mt(() => {
        e._assigning = !1;
      });
    }), e[Nt] = Dn(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    Io(e, t);
  },
  beforeUpdate(e, t, n) {
    e[Nt] = Dn(n);
  },
  updated(e, { value: t }) {
    e._assigning || Io(e, t);
  }
};
function Io(e, t) {
  const n = e.multiple, s = O(t);
  if (!(n && !s && !jn(t))) {
    for (let o = 0, a = e.options.length; o < a; o++) {
      const i = e.options[o], c = Fn(i);
      if (n)
        if (s) {
          const p = typeof c;
          p === "string" || p === "number" ? i.selected = t.some((d) => String(d) === String(c)) : i.selected = lr(t, c) > -1;
        } else
          i.selected = t.has(c);
      else if (hn(Fn(i), t)) {
        e.selectedIndex !== o && (e.selectedIndex = o);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function Fn(e) {
  return "_value" in e ? e._value : e.value;
}
const xl = ["ctrl", "shift", "alt", "meta"], yl = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => xl.some((n) => e[`${n}Key`] && !t.includes(n))
}, se = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((o, ...a) => {
    for (let i = 0; i < t.length; i++) {
      const c = yl[t[i]];
      if (c && c(o, t)) return;
    }
    return e(o, ...a);
  }));
}, _l = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Ie = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = ((o) => {
    if (!("key" in o))
      return;
    const a = vt(o.key);
    if (t.some(
      (i) => i === a || _l[i] === a
    ))
      return e(o);
  }));
}, wl = /* @__PURE__ */ ue({ patchProp: ml }, Gi);
let Po;
function Sl() {
  return Po || (Po = Ei(wl));
}
const Cl = ((...e) => {
  const t = Sl().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const o = Al(s);
    if (!o) return;
    const a = t._component;
    !D(a) && !a.render && !a.template && (a.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const i = n(o, !1, Tl(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), i;
  }, t;
});
function Tl(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Al(e) {
  return ae(e) ? document.querySelector(e) : e;
}
let El = 1;
function Oe(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Le(e) {
  return `${e}-${Date.now().toString(36)}-${El++}`;
}
function Ga(e) {
  const t = Oe(e || {});
  return {
    ...t,
    timestamp: { ...t.timestamp || {} },
    scene: { ...t.scene || {} },
    costumes: { ...t.costumes || {} },
    items: { ...t.items || {} },
    deletedItems: Array.isArray(t.deletedItems) ? [...t.deletedItems] : [],
    events: Array.isArray(t.events) ? Oe(t.events) : t.event ? [Oe(t.event)] : [],
    affection: { ...t.affection || {} },
    npcs: Oe(t.npcs || {}),
    agenda: Array.isArray(t.agenda) ? Oe(t.agenda) : [],
    deletedAgenda: Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [],
    mood: Oe(t.mood || {}),
    relationships: Array.isArray(t.relationships) ? Oe(t.relationships) : []
  };
}
function kl(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function Yn(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function Il(e) {
  return Yn(e) === "悬念" ? "未解悬念" : "行动计划";
}
function Pl(e) {
  return Yn(e) === "悬念" ? "type-suspense" : "type-plan";
}
function Rl(e) {
  switch (e) {
    case "affection":
      return { id: Le("aff"), name: "", value: 0, editing: !0 };
    case "relationship":
      return { id: Le("rel"), from: "", to: "", type: "", note: "", editing: !0 };
    case "costume":
      return { id: Le("costume"), name: "", desc: "", editing: !0 };
    case "item":
      return {
        id: Le("item"),
        icon: "",
        name: "",
        holder: "",
        location: "",
        description: "",
        importance: "",
        editing: !0
      };
    case "agenda":
      return { id: Le("agenda"), date: "", type: "悬念", text: "", source: "user", editing: !0 };
    default:
      return { id: Le("row"), editing: !0 };
  }
}
function Ja(e) {
  const t = Ga(e), n = t.events[0] || {};
  return {
    baseMeta: Oe(t),
    timestamp: {
      story_date: t.timestamp.story_date || "",
      story_time: t.timestamp.story_time || ""
    },
    scene: {
      location: t.scene.location || "",
      atmosphere: t.scene.atmosphere || "",
      characters_present: Array.isArray(t.scene.characters_present) ? [...t.scene.characters_present] : [],
      scene_desc: t.scene.scene_desc || ""
    },
    event: {
      level: n.level || "",
      summary: n.summary || "",
      editing: !1
    },
    affectionRows: Object.entries(t.affection || {}).map(([s, o]) => ({
      id: Le("aff"),
      name: s,
      value: kl(o),
      editing: !1
    })),
    relationshipRows: (t.relationships || []).map((s) => ({
      id: Le("rel"),
      from: s.from || "",
      to: s.to || "",
      type: s.type || "",
      note: s.note || "",
      editing: !1
    })),
    costumeRows: Object.entries(t.costumes || {}).map(([s, o]) => ({
      id: Le("costume"),
      name: s,
      desc: o,
      editing: !1
    })),
    itemRows: Object.entries(t.items || {}).map(([s, o]) => ({
      id: Le("item"),
      icon: (o == null ? void 0 : o.icon) || "",
      name: s,
      holder: (o == null ? void 0 : o.holder) || "",
      location: (o == null ? void 0 : o.location) || "",
      description: (o == null ? void 0 : o.description) || "",
      importance: (o == null ? void 0 : o.importance) || "",
      editing: !1
    })),
    deletedItemRows: (t.deletedItems || []).map((s) => ({
      id: Le("deleted-item"),
      name: String(s || "").trim()
    })).filter((s) => s.name),
    agendaRows: (t.agenda || []).map((s) => ({
      id: Le("agenda"),
      date: s.date || "",
      type: Yn(s.type),
      text: s.text || "",
      source: s.source || "user",
      done: !!s.done,
      editing: !1
    })),
    isSkipped: !!t._skipHorae
  };
}
function Ml(e) {
  const t = Ga(e.baseMeta), n = Oe(t);
  n.timestamp = {
    ...t.timestamp || {},
    story_date: String(e.timestamp.story_date || "").trim(),
    story_time: String(e.timestamp.story_time || "").trim(),
    absolute: (/* @__PURE__ */ new Date()).toISOString()
  }, n.scene = {
    ...t.scene || {},
    location: String(e.scene.location || "").trim(),
    atmosphere: String(e.scene.atmosphere || "").trim(),
    characters_present: Array.isArray(e.scene.characters_present) ? e.scene.characters_present.map((c) => String(c || "").trim()).filter(Boolean) : []
  }, e.scene.scene_desc && (n.scene.scene_desc = e.scene.scene_desc), n.costumes = {};
  for (const c of e.costumeRows || []) {
    const p = String(c.name || "").trim(), d = String(c.desc || "").trim();
    p && d && (n.costumes[p] = d);
  }
  n.items = {};
  for (const c of e.itemRows || []) {
    const p = String(c.name || "").trim();
    p && (n.items[p] = {
      icon: String(c.icon || "").trim() || null,
      importance: c.importance || "",
      holder: String(c.holder || "").trim() || null,
      location: String(c.location || "").trim(),
      description: String(c.description || "").trim()
    });
  }
  n.affection = {};
  for (const c of e.affectionRows || []) {
    const p = String(c.name || "").trim();
    if (!p) continue;
    const d = Number.parseFloat(c.value);
    n.affection[p] = {
      type: "absolute",
      value: Number.isFinite(d) ? d : String(c.value || "").trim()
    };
  }
  n.relationships = [];
  for (const c of e.relationshipRows || []) {
    const p = String(c.from || "").trim(), d = String(c.to || "").trim(), f = String(c.type || "").trim(), g = String(c.note || "").trim();
    p && d && f && n.relationships.push({ from: p, to: d, type: f, note: g });
  }
  const s = String(e.event.summary || "").trim(), o = String(e.event.level || "").trim();
  n.events = s ? [{
    is_important: o === "重要" || o === "关键" || o === "關鍵",
    level: o || "一般",
    summary: s
  }] : [], delete n.event, n.agenda = [];
  for (const c of e.agendaRows || []) {
    const p = String(c.text || "").trim();
    p && n.agenda.push({
      type: Yn(c.type),
      date: String(c.date || "").trim(),
      text: p,
      source: c.source || "user",
      done: !!c.done
    });
  }
  const a = Array.isArray(e.deletedItemRows) ? e.deletedItemRows.map((c) => c == null ? void 0 : c.name) : t.deletedItems;
  n.deletedItems = [];
  const i = /* @__PURE__ */ new Set();
  for (const c of a || []) {
    const p = String(c || "").trim();
    !p || i.has(p) || (i.add(p), n.deletedItems.push(p));
  }
  return n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = Oe(t.npcs || {}), n.mood = Oe(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = Oe(t._rpgChanges)), t.tableContributions && (n.tableContributions = Oe(t.tableContributions)), n;
}
function Ol(e, t) {
  const n = Ja(t);
  for (const s of Object.keys(e)) delete e[s];
  Object.assign(e, n);
}
function $l(e) {
  return Array.isArray(e) ? e.map((t) => String(t || "").trim()).filter(Boolean) : String(e || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}
const Dl = { class: "toggle-left" }, Fl = { class: "toggle-icon" }, Ll = { class: "toggle-info" }, Nl = { class: "toggle-time" }, jl = {
  key: 0,
  class: "horae-sideplay-badge"
}, Hl = { class: "toggle-summary" }, Vl = { class: "toggle-actions" }, Kl = ["title"], Ul = ["title"], zl = ["title", "disabled"], Bl = { class: "horae-panel-content" }, Wl = { class: "neo-dashboard" }, ql = { class: "neo-tags" }, Gl = { class: "neo-chip" }, Jl = ["placeholder"], Yl = { class: "neo-chip" }, Xl = ["placeholder"], Zl = { class: "neo-chip" }, Ql = ["placeholder"], ec = { class: "event-header" }, tc = { class: "event-badge" }, nc = { class: "action-group-hover" }, sc = { class: "view-mode" }, oc = { class: "event-body-text" }, ac = { value: "" }, rc = { value: "一般" }, ic = { value: "重要" }, lc = { value: "关键" }, cc = ["placeholder"], pc = { class: "neo-inset-section" }, uc = { class: "neo-section-header compact" }, fc = { class: "section-title" }, dc = { class: "aff-grid list-container" }, hc = ["onClick"], mc = { class: "view-mode" }, gc = { class: "t-title" }, vc = { class: "t-val" }, bc = ["onUpdate:modelValue", "placeholder", "onKeydown"], xc = ["onUpdate:modelValue", "placeholder", "onKeydown"], yc = { class: "neo-inset-section" }, _c = { class: "neo-section-header compact" }, wc = { class: "section-title" }, Sc = { class: "rel-list list-container" }, Cc = ["onClick"], Tc = { class: "view-mode" }, Ac = { class: "rel-node" }, Ec = { class: "rel-node" }, kc = { class: "rel-label" }, Ic = ["onUpdate:modelValue", "placeholder", "onKeydown"], Pc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Rc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Mc = { class: "neo-inset-section" }, Oc = { class: "neo-section-header" }, $c = { class: "section-title" }, Dc = { class: "neo-item-list list-container" }, Fc = ["onClick"], Lc = { class: "view-mode" }, Nc = { class: "item-info" }, jc = { class: "item-line-top" }, Hc = { class: "item-title" }, Vc = { class: "item-emoji" }, Kc = { class: "item-name" }, Uc = {
  key: 0,
  class: "item-holder-badge"
}, zc = {
  key: 0,
  class: "item-meta"
}, Bc = { class: "item-desc" }, Wc = { class: "item-edit-line" }, qc = ["onUpdate:modelValue", "onKeydown"], Gc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Jc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Yc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Xc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Zc = ["aria-label"], Qc = ["title", "onClick"], ep = { class: "neo-inset-section" }, tp = { class: "neo-section-header" }, np = { class: "section-title" }, sp = { class: "neo-agenda-list list-container" }, op = ["onClick"], ap = { class: "view-mode" }, rp = { class: "agenda-date" }, ip = { class: "agenda-content" }, lp = { class: "agenda-type" }, cp = { class: "agenda-text" }, pp = { class: "agenda-edit-line" }, up = ["onUpdate:modelValue", "placeholder", "onKeydown"], fp = ["onUpdate:modelValue", "onKeydown"], dp = { value: "悬念" }, hp = { value: "计划" }, mp = ["onUpdate:modelValue", "placeholder", "onKeydown"], gp = { class: "neo-footer-actions" }, vp = { class: "action-group" }, bp = ["disabled"], xp = ["disabled"], yp = { class: "action-group" }, _p = ["disabled"], wp = ["title"], ps = 240, us = 200, Ro = "cubic-bezier(0.22, 1, 0.36, 1)", Mo = "cubic-bezier(0.4, 0, 1, 1)", Sp = {
  __name: "MessagePanel",
  props: {
    messageId: { type: Number, required: !0 },
    initialMeta: { type: Object, default: () => ({}) },
    adapter: { type: Object, default: () => ({}) },
    labels: { type: Object, default: () => ({}) },
    config: { type: Object, default: () => ({}) },
    setHostState: { type: Function, default: null }
  },
  setup(e, { expose: t }) {
    const n = e, s = {
      sideplay: "番外",
      sideplayTitle: "标记为番外",
      noTracking: "不追踪",
      rescan: "重新扫描",
      quickScan: "扫描标签",
      aiAnalyze: "AI分析",
      apply: "应用",
      collapse: "收缩展开",
      add: "添加",
      role: "角色",
      value: "数值",
      location: "地点",
      atmosphere: "氛围",
      characters: "在场",
      event: "事件",
      noSpecialEvents: "无特殊事件",
      eventPlaceholder: "事件摘要",
      levelNone: "无",
      levelNormal: "一般",
      levelImportant: "重要",
      levelCritical: "关键",
      affection: "好感度追踪",
      relationships: "关系网络",
      relationshipHint: "关系简述",
      relFrom: "主",
      relTo: "客",
      relType: "关系",
      costumes: "服装与细节",
      items: "物品状态追踪",
      itemName: "物品名称",
      itemDesc: "物品描述",
      holder: "持有者",
      deletedItems: "物品消耗/删除",
      deleteForever: "彻底移除",
      agenda: "悬念与计划",
      agendaMystery: "未解悬念",
      agendaPlan: "行动计划",
      agendaText: "事项内容",
      date: "时间设定",
      unscheduled: "未定",
      openDrawer: "打开 Horae 面板"
    }, o = Jt(() => ({ ...s, ...n.labels })).value, a = /* @__PURE__ */ Dt({ sideplayMode: !1, showPanel: !0, ...n.config }), i = n.adapter || {}, c = /* @__PURE__ */ Kt(null), p = /* @__PURE__ */ Dt(Ja(n.initialMeta)), d = /* @__PURE__ */ Kt(!0), f = /* @__PURE__ */ Kt(!1), g = /* @__PURE__ */ Kt(null), x = /* @__PURE__ */ Dt({ save: !1, scan: !1, ai: !1, sideplay: !1 }), C = /* @__PURE__ */ Kt((p.scene.characters_present || []).join(", "));
    en(
      () => p.scene.characters_present,
      (r) => {
        C.value = (r || []).join(", ");
      },
      { deep: !0 }
    ), en(
      () => [p.isSkipped, a.showPanel],
      ([r]) => {
        var l;
        (l = n.setHostState) == null || l.call(n, { isSkipped: !!r, visible: a.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const F = Jt(() => {
      if (p.isSkipped) return o.noTracking;
      const r = p.timestamp.story_date || "--", l = p.timestamp.story_time ? ` ${p.timestamp.story_time}` : "";
      return `${r}${l}`;
    }), R = Jt(() => {
      var h;
      if (p.isSkipped) return o.sideplayTitle;
      const r = p.event.summary || o.noSpecialEvents, l = ((h = p.scene.characters_present) == null ? void 0 : h.length) || 0;
      return l ? `${r} | ${l}${o.characters}` : r;
    }), Q = Jt(() => `${p.event.level || o.levelNormal}${o.event}`);
    function I() {
      f.value = !0;
    }
    function N(r) {
      r.target.closest("button, input, textarea, select") || (d.value = !d.value);
    }
    function V() {
      var r;
      return (r = window.matchMedia) == null ? void 0 : r.call(window, "(prefers-reduced-motion: reduce)").matches;
    }
    function k(r) {
      var l;
      (l = r._horaePanelCleanup) == null || l.call(r), r._horaePanelCleanup = null, r.style.height = "", r.style.opacity = "", r.style.transform = "", r.style.transition = "", r.style.overflow = "", r.style.willChange = "";
    }
    function B(r, l, h) {
      let u = !1;
      const m = () => {
        u || (u = !0, S(), r._horaePanelCleanup = null, l());
      }, b = (w) => {
        w.target === r && w.propertyName === "height" && m();
      }, S = () => {
        r.removeEventListener("transitionend", b), r._horaePanelTimer && window.clearTimeout(r._horaePanelTimer), r._horaePanelTimer = null;
      };
      r.addEventListener("transitionend", b), r._horaePanelTimer = window.setTimeout(m, h + 80), r._horaePanelCleanup = S;
    }
    function ie(r) {
      k(r), !V() && (r.style.height = "0px", r.style.opacity = "0", r.style.transform = "translateY(-6px)", r.style.overflow = "hidden", r.style.willChange = "height, opacity, transform");
    }
    function fe(r, l) {
      if (V()) {
        l();
        return;
      }
      r.style.transition = `height ${ps}ms ${Ro}, opacity 180ms ease-out, transform ${ps}ms ${Ro}`, requestAnimationFrame(() => {
        r.style.height = `${r.scrollHeight}px`, r.style.opacity = "1", r.style.transform = "translateY(0)";
      }), B(r, l, ps);
    }
    function me(r) {
      k(r), Mt(nt);
    }
    function L(r) {
      k(r), !V() && (r.style.height = `${r.scrollHeight}px`, r.style.opacity = "1", r.style.transform = "translateY(0)", r.style.overflow = "hidden", r.style.willChange = "height, opacity, transform");
    }
    function W(r, l) {
      if (V()) {
        l();
        return;
      }
      r.offsetHeight, r.style.transition = `height ${us}ms ${Mo}, opacity 140ms ease-in, transform ${us}ms ${Mo}`, requestAnimationFrame(() => {
        r.style.height = "0px", r.style.opacity = "0", r.style.transform = "translateY(-4px)";
      }), B(r, l, us);
    }
    function ne(r) {
      k(r);
    }
    function A() {
      p.scene.characters_present = $l(C.value), I();
    }
    function Y(r, l) {
      return `${r}:${(l == null ? void 0 : l.id) || "single"}`;
    }
    function oe(r, l) {
      return g.value === Y(r, l);
    }
    function ge(r, l) {
      if (l != null && l.editing) return;
      const h = Y(r, l);
      g.value = g.value === h ? null : h;
    }
    function j(r) {
      r.editing = !r.editing, g.value = null, r.editing || I(), Mt(nt);
    }
    function J(r, l) {
      p[r].push(Rl(l)), g.value = null, I(), Mt(nt);
    }
    function U(r, l) {
      const h = p[r], u = h.findIndex((m) => m.id === l);
      u >= 0 && (h.splice(u, 1), g.value = null, I());
    }
    function tt(r) {
      const l = p.itemRows.findIndex((h) => h.id === r);
      l < 0 || (p.itemRows.splice(l, 1), g.value = null, I());
    }
    function It(r) {
      const l = p.deletedItemRows.findIndex((h) => h.id === r);
      l >= 0 && (p.deletedItemRows.splice(l, 1), g.value = null, I());
    }
    function ke(r) {
      Ol(p, r || {}), C.value = (p.scene.characters_present || []).join(", "), g.value = null, f.value = !1, Mt(nt);
    }
    async function De() {
      var r;
      x.save = !0;
      try {
        const l = Ml(p), h = await ((r = i.save) == null ? void 0 : r.call(i, l));
        h ? ke(h) : f.value = !1;
      } finally {
        x.save = !1;
      }
    }
    async function vn() {
      var r;
      x.scan = !0;
      try {
        const l = await ((r = i.quickScan) == null ? void 0 : r.call(i));
        l && ke(l);
      } finally {
        x.scan = !1;
      }
    }
    async function Xn() {
      var r;
      x.scan = !0;
      try {
        const l = await ((r = i.rescan) == null ? void 0 : r.call(i));
        l && ke(l);
      } finally {
        x.scan = !1;
      }
    }
    async function bn() {
      var r;
      x.ai = !0;
      try {
        const l = await ((r = i.aiAnalyze) == null ? void 0 : r.call(i));
        l && ke(l);
      } finally {
        x.ai = !1;
      }
    }
    async function bt() {
      var r;
      x.sideplay = !0;
      try {
        const l = await ((r = i.toggleSideplay) == null ? void 0 : r.call(i));
        l && ke(l);
      } finally {
        x.sideplay = !1;
      }
    }
    function nt() {
      var r;
      (r = c.value) == null || r.querySelectorAll("textarea").forEach((l) => {
        l.style.height = "auto", l.style.height = `${l.scrollHeight}px`;
      });
    }
    const st = /* @__PURE__ */ Js({
      props: {
        row: { type: Object, required: !0 },
        deleteIcon: { type: String, default: "fa-xmark" }
      },
      emits: ["edit", "delete"],
      setup(r, { emit: l }) {
        return () => re("div", { class: "action-group-hover" }, [
          re("button", {
            class: "action-hover-btn btn-edit",
            onClick: (h) => {
              h.stopPropagation(), l("edit");
            }
          }, [
            re("i", { class: "fa-solid fa-pen" })
          ]),
          re("button", {
            class: "action-hover-btn btn-del",
            onClick: (h) => {
              h.stopPropagation(), l("delete");
            }
          }, [
            re("i", { class: `fa-solid ${r.deleteIcon}` })
          ])
        ]);
      }
    }), xn = /* @__PURE__ */ Js({
      props: {
        title: { type: String, required: !0 },
        icon: { type: String, required: !0 },
        rows: { type: Array, required: !0 },
        labels: { type: Object, required: !0 }
      },
      emits: ["add", "edit", "delete", "dirty"],
      setup(r, { emit: l }) {
        return () => re("section", { class: "neo-inset-section" }, [
          re("div", { class: "neo-section-header" }, [
            re("span", { class: "section-title" }, [
              re("i", { class: `fa-solid ${r.icon}` }),
              ` ${r.title}`
            ]),
            re("button", { class: "neo-text-btn add", onClick: () => l("add") }, [
              re("i", { class: "fa-solid fa-plus" }),
              ` ${r.labels.add}`
            ])
          ]),
          re("div", { class: "neo-dict-list list-container" }, r.rows.map((h) => re("div", {
            key: h.id,
            class: ["neo-dict-row editable-block", {
              "is-editing": h.editing,
              "is-action-open": oe("costumeRows", h)
            }],
            onClick: () => ge("costumeRows", h)
          }, [
            re("div", { class: "view-mode dict-view" }, [
              re("div", { class: "dict-key" }, h.name || r.labels.role),
              re("div", { class: "dict-value" }, h.desc || r.labels.itemDesc)
            ]),
            re("div", {
              class: "edit-mode dict-edit-mode",
              onClick: (u) => u.stopPropagation()
            }, [
              re("input", {
                class: "neo-input short-key no-enter",
                value: h.name,
                placeholder: r.labels.role,
                onInput: (u) => {
                  h.name = u.target.value, l("dirty");
                },
                onKeydown: (u) => {
                  u.key === "Enter" && (u.preventDefault(), l("edit", h));
                }
              }),
              re("textarea", {
                class: "neo-textarea no-enter",
                value: h.desc,
                placeholder: r.labels.itemDesc,
                onInput: (u) => {
                  h.desc = u.target.value, l("dirty");
                },
                onKeydown: (u) => {
                  u.key === "Enter" && (u.preventDefault(), l("edit", h));
                }
              })
            ]),
            re(st, {
              row: h,
              onEdit: () => l("edit", h),
              onDelete: () => l("delete", h.id)
            })
          ])))
        ]);
      }
    });
    function xt(r) {
      ke(r);
    }
    function js(r) {
      Object.assign(a, { sideplayMode: !1, showPanel: !0, ...r || {} });
    }
    return t({ replaceMeta: xt, replaceConfig: js }), (r, l) => (be(), we("div", {
      ref_key: "panelRoot",
      ref: c,
      class: "horae-message-panel-shell"
    }, [
      v("div", {
        class: "horae-panel-top",
        onClick: N
      }, [
        v("div", Dl, [
          v("div", Fl, [
            v("i", {
              class: Re(["fa-regular", p.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          v("div", Ll, [
            v("div", Nl, [
              p.isSkipped ? (be(), we("span", jl, H(E(o).sideplay), 1)) : Gt("", !0),
              xe(" " + H(F.value), 1)
            ]),
            v("div", Hl, H(R.value), 1)
          ])
        ]),
        v("div", Vl, [
          ce(v("button", {
            class: "neo-btn-icon",
            title: E(o).sideplayTitle,
            onClick: se(bt, ["stop"])
          }, [
            v("i", {
              class: Re(["fa-solid", p.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, Kl), [
            [vo, a.sideplayMode]
          ]),
          v("button", {
            class: "neo-btn-icon",
            title: E(o).rescan,
            onClick: se(Xn, ["stop"])
          }, [...l[21] || (l[21] = [
            v("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, Ul),
          v("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: E(o).aiAnalyze,
            disabled: x.ai,
            onClick: se(bn, ["stop"])
          }, [
            v("i", {
              class: Re(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, zl)
        ])
      ]),
      pe(Xi, {
        css: !1,
        onBeforeEnter: ie,
        onEnter: fe,
        onAfterEnter: me,
        onBeforeLeave: L,
        onLeave: W,
        onAfterLeave: ne
      }, {
        default: ca(() => {
          var h;
          return [
            ce(v("div", Bl, [
              v("div", Wl, [
                v("div", ql, [
                  v("span", Gl, [
                    l[22] || (l[22] = v("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[0] || (l[0] = (u) => p.scene.location = u),
                      class: "neo-chip-input",
                      placeholder: E(o).location,
                      onInput: I
                    }, null, 40, Jl), [
                      [ve, p.scene.location]
                    ])
                  ]),
                  v("span", Yl, [
                    l[23] || (l[23] = v("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[1] || (l[1] = (u) => p.scene.atmosphere = u),
                      class: "neo-chip-input",
                      placeholder: E(o).atmosphere,
                      onInput: I
                    }, null, 40, Xl), [
                      [ve, p.scene.atmosphere]
                    ])
                  ]),
                  v("span", Zl, [
                    l[24] || (l[24] = v("i", { class: "fa-solid fa-users" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[2] || (l[2] = (u) => C.value = u),
                      class: "neo-chip-input",
                      placeholder: E(o).characters,
                      onInput: A
                    }, null, 40, Ql), [
                      [ve, C.value]
                    ])
                  ])
                ]),
                v("div", {
                  class: Re(["neo-event-card editable-block", { "is-editing": p.event.editing, "is-action-open": oe("event", p.event) }]),
                  onClick: l[8] || (l[8] = (u) => ge("event", p.event))
                }, [
                  v("div", ec, [
                    v("span", tc, [
                      l[25] || (l[25] = v("i", { class: "fa-solid fa-bolt" }, null, -1)),
                      xe(" " + H(Q.value), 1)
                    ]),
                    v("div", nc, [
                      v("button", {
                        class: "action-hover-btn btn-edit",
                        onClick: l[3] || (l[3] = se((u) => j(p.event), ["stop"]))
                      }, [...l[26] || (l[26] = [
                        v("i", { class: "fa-solid fa-pen" }, null, -1)
                      ])])
                    ])
                  ]),
                  v("div", sc, [
                    v("div", oc, H(p.event.summary || E(o).noSpecialEvents), 1)
                  ]),
                  v("div", {
                    class: "edit-mode",
                    onClick: l[7] || (l[7] = se(() => {
                    }, ["stop"]))
                  }, [
                    ce(v("select", {
                      "onUpdate:modelValue": l[4] || (l[4] = (u) => p.event.level = u),
                      class: "neo-input event-level-select",
                      onChange: I
                    }, [
                      v("option", ac, H(E(o).levelNone), 1),
                      v("option", rc, H(E(o).levelNormal), 1),
                      v("option", ic, H(E(o).levelImportant), 1),
                      v("option", lc, H(E(o).levelCritical), 1)
                    ], 544), [
                      [ko, p.event.level]
                    ]),
                    ce(v("textarea", {
                      "onUpdate:modelValue": l[5] || (l[5] = (u) => p.event.summary = u),
                      class: "neo-textarea lg no-enter",
                      rows: "2",
                      placeholder: E(o).eventPlaceholder,
                      onInput: I,
                      onKeydown: l[6] || (l[6] = Ie(se((u) => j(p.event), ["prevent"]), ["enter"]))
                    }, null, 40, cc), [
                      [ve, p.event.summary]
                    ])
                  ])
                ], 2),
                v("section", pc, [
                  v("div", uc, [
                    v("span", fc, [
                      l[27] || (l[27] = v("i", { class: "fa-solid fa-heart" }, null, -1)),
                      xe(" " + H(E(o).affection), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[9] || (l[9] = (u) => J("affectionRows", "affection"))
                    }, [
                      l[28] || (l[28] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", dc, [
                    (be(!0), we(Te, null, zt(p.affectionRows, (u) => (be(), we("div", {
                      key: u.id,
                      class: Re(["aff-chip editable-block", { "is-editing": u.editing, "is-action-open": oe("affectionRows", u) }]),
                      onClick: (m) => ge("affectionRows", u)
                    }, [
                      v("div", mc, [
                        v("span", gc, H(u.name || E(o).role), 1),
                        v("span", vc, H(u.value || 0), 1)
                      ]),
                      v("div", {
                        class: "edit-mode",
                        onClick: l[10] || (l[10] = se(() => {
                        }, ["stop"]))
                      }, [
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.name = m,
                          class: "neo-input no-enter aff-name",
                          placeholder: E(o).role,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, bc), [
                          [ve, u.name]
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.value = m,
                          class: "neo-input no-enter aff-value",
                          placeholder: E(o).value,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, xc), [
                          [ve, u.value]
                        ])
                      ]),
                      pe(E(st), {
                        row: u,
                        onEdit: (m) => j(u),
                        onDelete: (m) => U("affectionRows", u.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, hc))), 128))
                  ])
                ]),
                v("section", yc, [
                  v("div", _c, [
                    v("span", wc, [
                      l[29] || (l[29] = v("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                      xe(" " + H(E(o).relationships), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[11] || (l[11] = (u) => J("relationshipRows", "relationship"))
                    }, [
                      l[30] || (l[30] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", Sc, [
                    (be(!0), we(Te, null, zt(p.relationshipRows, (u) => (be(), we("div", {
                      key: u.id,
                      class: Re(["rel-row editable-block", { "is-editing": u.editing, "is-action-open": oe("relationshipRows", u) }]),
                      onClick: (m) => ge("relationshipRows", u)
                    }, [
                      v("div", Tc, [
                        v("span", Ac, H(u.from || E(o).role), 1),
                        l[31] || (l[31] = v("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                        v("span", Ec, H(u.to || E(o).role), 1),
                        v("span", kc, H(u.type || E(o).relationshipHint), 1)
                      ]),
                      v("div", {
                        class: "edit-mode",
                        onClick: l[12] || (l[12] = se(() => {
                        }, ["stop"]))
                      }, [
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.from = m,
                          class: "neo-input no-enter rel-person",
                          placeholder: E(o).relFrom,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, Ic), [
                          [ve, u.from]
                        ]),
                        l[32] || (l[32] = v("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.to = m,
                          class: "neo-input no-enter rel-person",
                          placeholder: E(o).relTo,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, Pc), [
                          [ve, u.to]
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.type = m,
                          class: "neo-input no-enter",
                          placeholder: E(o).relType,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, Rc), [
                          [ve, u.type]
                        ])
                      ]),
                      pe(E(st), {
                        row: u,
                        onEdit: (m) => j(u),
                        onDelete: (m) => U("relationshipRows", u.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, Cc))), 128))
                  ])
                ]),
                pe(E(xn), {
                  title: E(o).costumes,
                  icon: "fa-shirt",
                  rows: p.costumeRows,
                  labels: E(o),
                  onAdd: l[13] || (l[13] = (u) => J("costumeRows", "costume")),
                  onEdit: j,
                  onDelete: l[14] || (l[14] = (u) => U("costumeRows", u)),
                  onDirty: I
                }, null, 8, ["title", "rows", "labels"]),
                v("section", Mc, [
                  v("div", Oc, [
                    v("span", $c, [
                      l[33] || (l[33] = v("i", { class: "fa-solid fa-box-open" }, null, -1)),
                      xe(" " + H(E(o).items), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[15] || (l[15] = (u) => J("itemRows", "item"))
                    }, [
                      l[34] || (l[34] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", Dc, [
                    (be(!0), we(Te, null, zt(p.itemRows, (u) => (be(), we("div", {
                      key: u.id,
                      class: Re(["neo-item-card editable-block", { "is-editing": u.editing, "is-action-open": oe("itemRows", u) }]),
                      onClick: (m) => ge("itemRows", u)
                    }, [
                      v("div", Lc, [
                        v("div", Nc, [
                          v("div", jc, [
                            v("span", Hc, [
                              v("span", Vc, H(u.icon || "📦"), 1),
                              v("span", Kc, H(u.name || E(o).itemName), 1)
                            ]),
                            u.holder ? (be(), we("span", Uc, H(u.holder), 1)) : Gt("", !0)
                          ]),
                          u.location ? (be(), we("div", zc, [
                            l[35] || (l[35] = v("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                            xe(" " + H(u.location), 1)
                          ])) : Gt("", !0),
                          v("div", Bc, H(u.description || E(o).itemDesc), 1)
                        ])
                      ]),
                      v("div", {
                        class: "edit-mode item-edit-mode",
                        onClick: l[16] || (l[16] = se(() => {
                        }, ["stop"]))
                      }, [
                        v("div", Wc, [
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => u.icon = m,
                            class: "neo-input no-enter item-icon-input",
                            maxlength: "2",
                            placeholder: "📦",
                            onInput: I,
                            onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                          }, null, 40, qc), [
                            [ve, u.icon]
                          ]),
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => u.name = m,
                            class: "neo-input no-enter",
                            placeholder: E(o).itemName,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                          }, null, 40, Gc), [
                            [ve, u.name]
                          ]),
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => u.holder = m,
                            class: "neo-input no-enter item-holder-input",
                            placeholder: E(o).holder,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                          }, null, 40, Jc), [
                            [ve, u.holder]
                          ])
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => u.location = m,
                          class: "neo-input no-enter",
                          placeholder: E(o).location,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, Yc), [
                          [ve, u.location]
                        ]),
                        ce(v("textarea", {
                          "onUpdate:modelValue": (m) => u.description = m,
                          class: "neo-textarea no-enter",
                          placeholder: E(o).itemDesc,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, Xc), [
                          [ve, u.description]
                        ])
                      ]),
                      pe(E(st), {
                        row: u,
                        "delete-icon": "fa-trash-can",
                        onEdit: (m) => j(u),
                        onDelete: (m) => tt(u.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, Fc))), 128))
                  ]),
                  (h = p.deletedItemRows) != null && h.length ? (be(), we("div", {
                    key: 0,
                    class: "deleted-items-zone",
                    "aria-label": E(o).deletedItems
                  }, [
                    (be(!0), we(Te, null, zt(p.deletedItemRows, (u) => (be(), we("div", {
                      key: u.id,
                      class: "deleted-chip"
                    }, [
                      v("span", null, H(u.name), 1),
                      v("button", {
                        type: "button",
                        class: "action-hover-btn btn-del",
                        title: E(o).deleteForever,
                        onClick: se((m) => It(u.id), ["stop"])
                      }, [...l[36] || (l[36] = [
                        v("i", { class: "fa-solid fa-xmark" }, null, -1)
                      ])], 8, Qc)
                    ]))), 128))
                  ], 8, Zc)) : Gt("", !0)
                ]),
                v("section", ep, [
                  v("div", tp, [
                    v("span", np, [
                      l[37] || (l[37] = v("i", { class: "fa-solid fa-list-check" }, null, -1)),
                      xe(" " + H(E(o).agenda), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[17] || (l[17] = (u) => J("agendaRows", "agenda"))
                    }, [
                      l[38] || (l[38] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", sp, [
                    (be(!0), we(Te, null, zt(p.agendaRows, (u) => (be(), we("div", {
                      key: u.id,
                      class: Re(["agenda-card editable-block", [E(Pl)(u.type), { "is-editing": u.editing, "is-action-open": oe("agendaRows", u) }]]),
                      onClick: (m) => ge("agendaRows", u)
                    }, [
                      v("div", ap, [
                        v("div", rp, H(u.date || E(o).unscheduled), 1),
                        v("div", ip, [
                          v("span", lp, H(E(Il)(u.type)), 1),
                          v("span", cp, H(u.text || E(o).agendaText), 1)
                        ])
                      ]),
                      v("div", {
                        class: "edit-mode agenda-edit-mode",
                        onClick: l[18] || (l[18] = se(() => {
                        }, ["stop"]))
                      }, [
                        v("div", pp, [
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => u.date = m,
                            class: "neo-input no-enter agenda-date-input",
                            placeholder: E(o).date,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                          }, null, 40, up), [
                            [ve, u.date]
                          ]),
                          ce(v("select", {
                            "onUpdate:modelValue": (m) => u.type = m,
                            class: "neo-input no-enter",
                            onChange: I,
                            onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                          }, [
                            v("option", dp, H(E(o).agendaMystery), 1),
                            v("option", hp, H(E(o).agendaPlan), 1)
                          ], 40, fp), [
                            [ko, u.type]
                          ])
                        ]),
                        ce(v("textarea", {
                          "onUpdate:modelValue": (m) => u.text = m,
                          class: "neo-textarea no-enter",
                          placeholder: E(o).agendaText,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(u), ["prevent"]), ["enter"])
                        }, null, 40, mp), [
                          [ve, u.text]
                        ])
                      ]),
                      pe(E(st), {
                        row: u,
                        onEdit: (m) => j(u),
                        onDelete: (m) => U("agendaRows", u.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, op))), 128))
                  ])
                ])
              ]),
              v("div", gp, [
                v("div", vp, [
                  v("button", {
                    class: "neo-btn-text",
                    disabled: x.scan,
                    onClick: vn
                  }, [
                    v("i", {
                      class: Re(["fa-solid", x.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                    }, null, 2),
                    xe(" " + H(E(o).quickScan), 1)
                  ], 8, bp),
                  v("button", {
                    class: "neo-btn-text btn-ai-text",
                    disabled: x.ai,
                    onClick: bn
                  }, [
                    v("i", {
                      class: Re(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                    }, null, 2),
                    xe(" " + H(E(o).aiAnalyze), 1)
                  ], 8, xp)
                ]),
                v("div", yp, [
                  v("button", {
                    class: "neo-btn-text btn-save-apply",
                    disabled: x.save,
                    onClick: De
                  }, [
                    v("i", {
                      class: Re(["fa-solid", x.save ? "fa-spinner fa-spin" : "fa-check"])
                    }, null, 2),
                    xe(" " + H(E(o).apply), 1)
                  ], 8, _p),
                  v("button", {
                    class: "neo-btn-text",
                    onClick: l[19] || (l[19] = (u) => d.value = !0)
                  }, [
                    l[39] || (l[39] = v("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                    xe(" " + H(E(o).collapse), 1)
                  ]),
                  v("button", {
                    style: { display: "none" },
                    class: "neo-btn-text btn-drawer",
                    title: E(o).openDrawer,
                    onClick: l[20] || (l[20] = (u) => {
                      var m, b;
                      return (b = (m = E(i)).openDrawer) == null ? void 0 : b.call(m);
                    })
                  }, [...l[40] || (l[40] = [
                    v("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
                  ])], 8, wp)
                ])
              ])
            ], 512), [
              [vo, !d.value]
            ])
          ];
        }),
        _: 1
      })
    ], 512));
  }
}, Cp = '.horae-message-panel.horae-message-panel-vue{width:100%;background:#eef0f4!important;border:0!important;border-radius:20px!important;box-shadow:6px 6px 12px #7a849647,-4px -4px 10px #fffffff2!important;color:#4a5160!important;margin-top:10px!important;margin-bottom:18px!important;overflow:hidden!important;--mp-bg-base: #eef0f4;--mp-text-title: #20242c;--mp-text-main: #4a5160;--mp-text-muted: #767d8c;--mp-accent: #8b5cf6;--mp-danger: #e11d48;--mp-success: #10b981;--mp-warning: #f59e0b;--mp-info: #0ea5e9;--mp-pink: #ec4899;--mp-light-shadow: rgba(255, 255, 255, .95);--mp-dark-shadow: rgba(122, 132, 150, .25);--mp-neo-drop: 6px 6px 12px var(--mp-dark-shadow), -4px -4px 10px var(--mp-light-shadow);--mp-neo-drop-sm: 4px 4px 8px var(--mp-dark-shadow), -2px -2px 6px var(--mp-light-shadow);--mp-neo-inset: inset 4px 4px 8px var(--mp-dark-shadow), inset -4px -4px 8px var(--mp-light-shadow);--mp-neo-inset-sm: inset 2px 2px 4px var(--mp-dark-shadow), inset -2px -2px 4px var(--mp-light-shadow);--mp-radius-md: 12px;--mp-radius-sm: 8px;--mp-radius-round: 50px;--mp-dashboard-height: 500px}.horae-message-panel.horae-message-panel-vue.horae-dark{--mp-bg-base: #2b2d31;--mp-text-title: #e3e5e8;--mp-text-main: #b5bac1;--mp-text-muted: #80848e;--mp-light-shadow: rgba(255, 255, 255, .05);--mp-dark-shadow: rgba(0, 0, 0, .4);color:var(--mp-text-main)!important}.horae-message-panel.horae-message-panel-vue.horae-sideplay{opacity:.72}.horae-message-panel.horae-message-panel-vue *,.horae-message-panel.horae-message-panel-vue *:before,.horae-message-panel.horae-message-panel-vue *:after{box-sizing:border-box}.horae-message-panel.horae-message-panel-vue button{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;box-shadow:none;text-shadow:none!important;font:inherit!important}.horae-message-panel.horae-message-panel-vue .horae-panel-top{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid rgba(0,0,0,.03);cursor:pointer;transition:background .2s;-webkit-user-select:none;user-select:none}.horae-message-panel.horae-message-panel-vue .horae-panel-top:hover{background:#00000005}.horae-message-panel.horae-message-panel-vue .toggle-left{flex:1;min-width:0;display:flex;align-items:center;gap:16px}.horae-message-panel.horae-message-panel-vue .toggle-icon{flex:0 0 auto;font-size:1.1rem;color:var(--mp-accent);display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;box-shadow:var(--mp-neo-drop)}.horae-message-panel.horae-message-panel-vue .toggle-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.horae-message-panel.horae-message-panel-vue .toggle-time{color:var(--mp-text-title);font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:8px}.horae-message-panel.horae-message-panel-vue .toggle-summary{color:var(--mp-text-muted);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.horae-message-panel.horae-message-panel-vue .toggle-actions{flex:0 0 auto;display:flex;gap:12px}.horae-message-panel.horae-message-panel-vue .neo-btn-icon{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;width:38px;height:38px;border-radius:50%!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0!important}.horae-message-panel.horae-message-panel-vue .neo-btn-icon:hover{color:var(--mp-accent)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel.horae-message-panel-vue .neo-btn-icon:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel.horae-message-panel-vue .neo-btn-icon:disabled,.horae-message-panel.horae-message-panel-vue .neo-btn-text:disabled{cursor:wait;opacity:.7}.horae-message-panel.horae-message-panel-vue .horae-panel-content{padding:16px 24px 24px;background:transparent!important;border-top:0!important;box-sizing:border-box;transform-origin:top;display:flex;flex-direction:column}.horae-message-panel.horae-message-panel-vue .neo-dashboard{display:flex;flex-direction:column;gap:24px;height:var(--mp-dashboard-height);flex:0 0 var(--mp-dashboard-height);min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:auto;scrollbar-gutter:stable;padding-right:10px;padding-bottom:16px;scrollbar-width:thin;scrollbar-color:rgba(124,58,237,.52) rgba(122,132,150,.18)}.horae-message-panel.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar{width:12px}.horae-message-panel.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-track{background:#7a84962e;border-radius:999px;box-shadow:var(--mp-neo-inset-sm)}.horae-message-panel.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#7c3aed9e,#0ea5e97a);border:3px solid var(--mp-bg-base);border-radius:999px;box-shadow:0 0 0 1px #20242c0f}.horae-message-panel.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#7c3aedc7,#0ea5e99e)}.horae-message-panel.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-corner{background:transparent}.horae-message-panel.horae-message-panel-vue .neo-tags{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel.horae-message-panel-vue .neo-chip{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);padding:8px 16px;border-radius:var(--mp-radius-round);font-size:.9rem;display:inline-flex;align-items:center;gap:8px;min-width:min(100%,180px)}.horae-message-panel.horae-message-panel-vue .neo-chip i{color:var(--mp-accent);opacity:.85}.horae-message-panel.horae-message-panel-vue .neo-chip-input{width:100%;min-width:80px;background:transparent!important;border:none!important;box-shadow:none!important;color:var(--mp-text-main)!important;padding:0!important;font-size:.9rem!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .neo-input,.horae-message-panel.horae-message-panel-vue .neo-textarea{width:100%;background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-title)!important;font-size:.95rem!important;box-shadow:var(--mp-neo-inset)!important;outline:none!important;border-radius:var(--mp-radius-sm)!important;font-family:inherit;transition:box-shadow .2s;line-height:1.5}.horae-message-panel.horae-message-panel-vue .neo-input{padding:8px 12px!important;height:36px}.horae-message-panel.horae-message-panel-vue .neo-textarea{padding:10px 14px!important;resize:vertical;min-height:42px;overflow:hidden}.horae-message-panel.horae-message-panel-vue .neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}.horae-message-panel.horae-message-panel-vue .neo-input:focus,.horae-message-panel.horae-message-panel-vue .neo-textarea:focus{box-shadow:var(--mp-neo-inset),0 0 0 1px var(--mp-warning)!important}.horae-message-panel.horae-message-panel-vue .neo-text-btn{background:transparent!important;border:none!important;color:var(--mp-text-muted)!important;cursor:pointer;font-size:.85rem!important;display:flex;align-items:center;gap:6px;font-weight:500;transition:color .2s;outline:none;padding:0!important}.horae-message-panel.horae-message-panel-vue .neo-text-btn:hover{color:var(--mp-text-title)!important}.horae-message-panel.horae-message-panel-vue .neo-text-btn.add:hover{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .neo-inset-section{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);border-radius:var(--mp-radius-md);padding:16px 20px}.horae-message-panel.horae-message-panel-vue .neo-section-header{margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.horae-message-panel.horae-message-panel-vue .neo-section-header.compact{margin-bottom:12px}.horae-message-panel.horae-message-panel-vue .section-title{font-size:.85rem;color:var(--mp-text-title);display:flex;align-items:center;gap:8px;font-weight:600;text-transform:uppercase}.horae-message-panel.horae-message-panel-vue .section-title i{color:var(--mp-accent);opacity:.9}.horae-message-panel.horae-message-panel-vue .action-group-hover{display:flex;gap:4px;opacity:0;transform:translate(6px);transition:all .2s ease;margin-left:auto;flex:0 0 auto;pointer-events:none}.horae-message-panel.horae-message-panel-vue .action-hover-btn{width:28px;height:28px;border-radius:50%!important;border:none!important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem!important;color:var(--mp-text-muted)!important;background:transparent!important;transition:all .2s ease;outline:none;padding:0!important}.horae-message-panel.horae-message-panel-vue .action-hover-btn.btn-edit:hover{background:#38bdf826!important;color:var(--mp-info)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel.horae-message-panel-vue .action-hover-btn.btn-del:hover{background:#fb718526!important;color:var(--mp-danger)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel.horae-message-panel-vue .is-editing .action-group-hover,.horae-message-panel.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel.horae-message-panel-vue .action-group-hover:hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel.horae-message-panel-vue .is-editing .btn-edit{color:var(--mp-success)!important}.horae-message-panel.horae-message-panel-vue .is-editing .btn-edit i:before{content:""}.horae-message-panel.horae-message-panel-vue .view-mode{display:flex;gap:10px;flex:1;min-width:0;align-items:flex-start}.horae-message-panel.horae-message-panel-vue .edit-mode{display:none;gap:10px;flex:1;min-width:0;align-items:flex-start;flex-wrap:wrap}.horae-message-panel.horae-message-panel-vue .is-editing .view-mode{display:none!important}.horae-message-panel.horae-message-panel-vue .is-editing .edit-mode{display:flex!important}.horae-message-panel.horae-message-panel-vue .neo-event-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop);border-radius:var(--mp-radius-md);padding:18px 20px;border-left:4px solid var(--mp-warning);position:relative}.horae-message-panel.horae-message-panel-vue .event-header{margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}.horae-message-panel.horae-message-panel-vue .event-badge{font-size:.85rem;color:var(--mp-warning);font-weight:600;display:flex;align-items:center;gap:6px}.horae-message-panel.horae-message-panel-vue .event-body-text{font-size:1.02rem;color:var(--mp-text-title);line-height:1.6;word-break:break-word}.horae-message-panel.horae-message-panel-vue .neo-event-card .action-group-hover{position:absolute;right:20px;top:16px;opacity:1}.horae-message-panel.horae-message-panel-vue .event-level-select{flex:0 0 110px}.horae-message-panel.horae-message-panel-vue .aff-grid{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel.horae-message-panel-vue .aff-chip{background:#ffffff4d;border-radius:var(--mp-radius-sm);padding:6px 12px;display:inline-flex;align-items:center;transition:all .2s ease;position:relative;border:1px solid rgba(255,255,255,.5);min-height:38px}.horae-message-panel.horae-message-panel-vue .aff-chip:hover{background:#fff9}.horae-message-panel.horae-message-panel-vue .aff-chip .view-mode{align-items:center;margin:0;gap:10px}.horae-message-panel.horae-message-panel-vue .aff-chip .t-title{font-weight:600;font-size:.9rem;color:var(--mp-text-title);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.horae-message-panel.horae-message-panel-vue .aff-chip .t-val{font-weight:700;font-size:.95rem;color:var(--mp-pink);font-family:monospace}.horae-message-panel.horae-message-panel-vue .aff-chip .edit-mode{align-items:center;gap:6px}.horae-message-panel.horae-message-panel-vue .aff-name{width:76px!important;min-width:76px}.horae-message-panel.horae-message-panel-vue .aff-value{width:58px!important;min-width:58px}.horae-message-panel.horae-message-panel-vue .aff-chip .action-group-hover{position:absolute;right:-8px;top:-14px;background:var(--mp-bg-base);border-radius:20px;box-shadow:var(--mp-neo-drop-sm);padding:2px 4px;z-index:10;margin:0}.horae-message-panel.horae-message-panel-vue .aff-chip.is-editing .action-group-hover{position:static;background:transparent;box-shadow:none;padding:0;margin-left:2px}.horae-message-panel.horae-message-panel-vue .rel-list,.horae-message-panel.horae-message-panel-vue .neo-dict-list,.horae-message-panel.horae-message-panel-vue .neo-item-list,.horae-message-panel.horae-message-panel-vue .neo-agenda-list{display:flex;flex-direction:column}.horae-message-panel.horae-message-panel-vue .rel-list{gap:4px}.horae-message-panel.horae-message-panel-vue .neo-dict-list{gap:6px}.horae-message-panel.horae-message-panel-vue .neo-item-list{gap:14px}.horae-message-panel.horae-message-panel-vue .neo-agenda-list{gap:12px}.horae-message-panel.horae-message-panel-vue .rel-row,.horae-message-panel.horae-message-panel-vue .neo-dict-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:var(--mp-radius-sm);transition:background .2s;position:relative}.horae-message-panel.horae-message-panel-vue .rel-row{align-items:center;padding-top:6px;padding-bottom:6px}.horae-message-panel.horae-message-panel-vue .rel-row:hover,.horae-message-panel.horae-message-panel-vue .neo-dict-row:hover{background:#00000005}.horae-message-panel.horae-message-panel-vue .rel-row .view-mode{align-items:center;gap:10px;font-size:.9rem;flex-wrap:wrap}.horae-message-panel.horae-message-panel-vue .rel-node{font-weight:600;color:var(--mp-text-title);background:#0000000d;padding:2px 8px;border-radius:4px}.horae-message-panel.horae-message-panel-vue .rel-arrow{color:var(--mp-accent);opacity:.7;font-size:.8rem}.horae-message-panel.horae-message-panel-vue .rel-label{color:var(--mp-text-main);font-style:italic}.horae-message-panel.horae-message-panel-vue .rel-person{width:82px!important;flex:0 0 82px!important}.horae-message-panel.horae-message-panel-vue .dict-view{align-items:flex-start}.horae-message-panel.horae-message-panel-vue .dict-key{color:var(--mp-accent);font-weight:600;white-space:nowrap;flex:0 0 auto;line-height:1.5}.horae-message-panel.horae-message-panel-vue .dict-key:after{content:":";color:var(--mp-text-muted);margin-left:2px}.horae-message-panel.horae-message-panel-vue .dict-value{color:var(--mp-text-main);line-height:1.5;word-break:break-word}.horae-message-panel.horae-message-panel-vue .dict-edit-mode{align-items:flex-start}.horae-message-panel.horae-message-panel-vue .short-key{width:100px!important;flex:0 0 100px!important}.horae-message-panel.horae-message-panel-vue .neo-item-card,.horae-message-panel.horae-message-panel-vue .agenda-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop-sm);border-radius:var(--mp-radius-sm);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;position:relative}.horae-message-panel.horae-message-panel-vue .item-emoji{display:inline-flex;align-items:center;flex:0 0 auto;font-size:1.25rem;line-height:1}.horae-message-panel.horae-message-panel-vue .item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-right:2px}.horae-message-panel.horae-message-panel-vue .item-line-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:600;color:var(--mp-text-title);font-size:1rem}.horae-message-panel.horae-message-panel-vue .item-title{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%}.horae-message-panel.horae-message-panel-vue .item-name{min-width:0;overflow-wrap:anywhere}.horae-message-panel.horae-message-panel-vue .item-holder-badge{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset-sm);color:var(--mp-accent);font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:500}.horae-message-panel.horae-message-panel-vue .item-meta{font-size:.8rem;color:var(--mp-text-muted)}.horae-message-panel.horae-message-panel-vue .item-desc{font-size:.9rem;color:var(--mp-text-main);line-height:1.4;word-break:break-word}.horae-message-panel.horae-message-panel-vue .item-edit-mode{flex-direction:column}.horae-message-panel.horae-message-panel-vue .item-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel.horae-message-panel-vue .item-icon-input{width:52px!important;flex:0 0 52px!important;text-align:center}.horae-message-panel.horae-message-panel-vue .item-holder-input{width:90px!important;flex:0 0 90px!important}.horae-message-panel.horae-message-panel-vue .deleted-items-zone{margin-top:10px;padding-top:12px;border-top:1px dashed rgba(0,0,0,.1);display:flex;flex-wrap:wrap;gap:10px;align-items:center}.horae-message-panel.horae-message-panel-vue .deleted-chip{background:#0000000d;box-shadow:var(--mp-neo-inset-sm);padding:2px 4px 2px 14px;border-radius:var(--mp-radius-round);font-size:.85rem;display:flex;align-items:center;gap:8px;transition:background .2s ease}.horae-message-panel.horae-message-panel-vue .deleted-chip:hover{background:#0000001a}.horae-message-panel.horae-message-panel-vue .deleted-chip span{color:var(--mp-text-muted);text-decoration:line-through;padding-bottom:2px;word-break:break-word}.horae-message-panel.horae-message-panel-vue .deleted-chip .action-hover-btn{width:24px;height:24px;flex:0 0 24px}.horae-message-panel.horae-message-panel-vue .agenda-card{border-left:3px solid var(--mp-text-muted)}.horae-message-panel.horae-message-panel-vue .agenda-card.type-suspense{border-left-color:var(--mp-accent)}.horae-message-panel.horae-message-panel-vue .agenda-card.type-suspense .agenda-type{color:var(--mp-accent)}.horae-message-panel.horae-message-panel-vue .agenda-card.type-plan{border-left-color:var(--mp-info)}.horae-message-panel.horae-message-panel-vue .agenda-card.type-plan .agenda-type{color:var(--mp-info)}.horae-message-panel.horae-message-panel-vue .agenda-date{font-size:.8rem;color:var(--mp-text-muted);white-space:nowrap;padding-top:2px;font-family:monospace;width:80px}.horae-message-panel.horae-message-panel-vue .agenda-content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.horae-message-panel.horae-message-panel-vue .agenda-type{font-size:.75rem;font-weight:600}.horae-message-panel.horae-message-panel-vue .agenda-text{font-size:.95rem;color:var(--mp-text-title);word-break:break-word}.horae-message-panel.horae-message-panel-vue .agenda-edit-mode{flex-direction:column}.horae-message-panel.horae-message-panel-vue .agenda-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel.horae-message-panel-vue .agenda-date-input{width:110px!important;flex:0 0 110px!important}.horae-message-panel.horae-message-panel-vue .neo-footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px;flex:0 0 auto}.horae-message-panel.horae-message-panel-vue .action-group{display:flex;gap:12px;align-items:center}.horae-message-panel.horae-message-panel-vue .neo-btn-text{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;padding:10px 20px!important;border-radius:var(--mp-radius-round)!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;font-size:.9rem!important;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .2s ease;outline:none;white-space:nowrap}.horae-message-panel.horae-message-panel-vue .neo-btn-text:hover{color:var(--mp-text-title)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel.horae-message-panel-vue .neo-btn-text:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel.horae-message-panel-vue .btn-ai-text{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .btn-save-apply{color:var(--mp-success)!important}.horae-message-panel.horae-message-panel-vue .btn-drawer{padding-left:13px!important;padding-right:13px!important}.horae-message-panel.horae-message-panel-vue .horae-sideplay-badge{background:var(--mp-text-muted);color:var(--mp-bg-base);font-size:10px;padding:1px 6px;border-radius:3px;font-weight:700}@media(max-width:768px){.horae-message-panel.horae-message-panel-vue .horae-message-panel-vue{--mp-radius-md: 10px;--mp-radius-sm: 6px}.horae-message-panel.horae-message-panel-vue .horae-panel-top{padding:8px 12px;gap:8px}.horae-message-panel.horae-message-panel-vue .horae-panel-content{padding:12px}.horae-message-panel.horae-message-panel-vue .neo-dashboard{gap:12px;padding-bottom:10px}.horae-message-panel.horae-message-panel-vue .toggle-left{gap:8px}.horae-message-panel.horae-message-panel-vue .toggle-icon{width:28px;height:28px;font-size:.85rem}.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-clock{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.horae-message-panel.horae-message-panel-vue .toggle-info{gap:0;overflow:hidden}.horae-message-panel.horae-message-panel-vue .toggle-time{font-size:.85rem;line-height:1.2;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.horae-message-panel.horae-message-panel-vue .toggle-summary{display:none}.horae-message-panel.horae-message-panel-vue .toggle-actions{gap:6px}.horae-message-panel.horae-message-panel-vue .neo-btn-icon{width:28px;height:28px;font-size:.8rem!important}.horae-message-panel.horae-message-panel-vue .horae-sideplay-badge{font-size:9px;padding:1px 5px}.horae-message-panel.horae-message-panel-vue .section-title{font-size:.75rem}.horae-message-panel.horae-message-panel-vue .neo-inset-section,.horae-message-panel.horae-message-panel-vue .neo-event-card{padding:10px 12px}.horae-message-panel.horae-message-panel-vue .event-body-text{font-size:.9rem;line-height:1.5}.horae-message-panel.horae-message-panel-vue .neo-chip{padding:4px 10px;font-size:.8rem}.horae-message-panel.horae-message-panel-vue .neo-tags,.horae-message-panel.horae-message-panel-vue .aff-grid{gap:8px}.horae-message-panel.horae-message-panel-vue .aff-chip{min-height:30px;padding:4px 8px}.horae-message-panel.horae-message-panel-vue .aff-chip .t-title,.horae-message-panel.horae-message-panel-vue .aff-chip .t-val{font-size:.8rem}.horae-message-panel.horae-message-panel-vue .neo-item-list,.horae-message-panel.horae-message-panel-vue .neo-agenda-list{gap:8px}.horae-message-panel.horae-message-panel-vue .neo-item-card,.horae-message-panel.horae-message-panel-vue .agenda-card{padding:8px 10px;gap:8px}.horae-message-panel.horae-message-panel-vue .item-line-top,.horae-message-panel.horae-message-panel-vue .agenda-text{font-size:.85rem}.horae-message-panel.horae-message-panel-vue .item-desc,.horae-message-panel.horae-message-panel-vue .item-meta,.horae-message-panel.horae-message-panel-vue .agenda-date{font-size:.75rem}.horae-message-panel.horae-message-panel-vue .item-emoji{font-size:1.1rem}.horae-message-panel.horae-message-panel-vue .dict-view,.horae-message-panel.horae-message-panel-vue .agenda-card .view-mode,.horae-message-panel.horae-message-panel-vue .agenda-card .edit-mode{flex-direction:column;gap:6px}.horae-message-panel.horae-message-panel-vue .dict-key:after{content:""}.horae-message-panel.horae-message-panel-vue .action-group-hover,.horae-message-panel.horae-message-panel-vue .neo-event-card .action-group-hover,.horae-message-panel.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel.horae-message-panel-vue .action-group-hover:hover{opacity:0;transform:translate(6px);pointer-events:none}.horae-message-panel.horae-message-panel-vue .editable-block.is-action-open>.action-group-hover,.horae-message-panel.horae-message-panel-vue .editable-block.is-action-open .event-header>.action-group-hover,.horae-message-panel.horae-message-panel-vue .editable-block.is-editing>.action-group-hover,.horae-message-panel.horae-message-panel-vue .editable-block.is-editing .event-header>.action-group-hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel.horae-message-panel-vue .neo-footer-actions{flex-direction:column;align-items:stretch;gap:10px;margin-top:6px}.horae-message-panel.horae-message-panel-vue .action-group{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}.horae-message-panel.horae-message-panel-vue .neo-btn-text{width:100%;justify-content:center;padding:8px 10px!important;font-size:.8rem!important}.horae-message-panel.horae-message-panel-vue .btn-drawer{grid-column:1 / -1}}@media(prefers-reduced-motion:reduce){.horae-message-panel.horae-message-panel-vue .horae-panel-content{transition:none!important;transform:none!important}}.horae-message-panel.horae-message-panel-vue input.neo-input,.horae-message-panel.horae-message-panel-vue select.neo-input,.horae-message-panel.horae-message-panel-vue textarea.neo-textarea{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;max-width:none!important;margin:0!important;border:none!important;border-radius:var(--mp-radius-sm)!important;background:var(--mp-bg-base)!important;color:var(--mp-text-title)!important;font-family:inherit!important;font-size:.95rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:var(--mp-neo-inset)!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue input.neo-input,.horae-message-panel.horae-message-panel-vue select.neo-input{height:36px!important;min-height:36px!important;padding:8px 12px!important}.horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:42px!important;padding:10px 14px!important;resize:vertical!important;overflow:hidden!important}.horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}@media(max-width:768px){.horae-message-panel.horae-message-panel-vue input.neo-input,.horae-message-panel.horae-message-panel-vue select.neo-input{height:30px!important;min-height:30px!important;padding:6px 10px!important;font-size:.85rem!important}.horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:36px!important;padding:8px 10px!important;font-size:.85rem!important}.horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:10px 14px!important;font-size:.9rem!important}}.horae-message-panel.horae-message-panel-vue input.neo-chip-input{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;min-width:80px!important;margin:0!important;padding:0!important;border:none!important;border-radius:0!important;background:transparent!important;color:var(--mp-text-main)!important;font-family:inherit!important;font-size:.9rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .toggle-icon{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .toggle-icon i:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before{color:var(--mp-accent)!important;text-shadow:none!important}.horae-message-panel.horae-message-panel-vue .section-title i:before,.horae-message-panel.horae-message-panel-vue .neo-chip i:before{color:var(--mp-accent)!important;text-shadow:none!important}', Tp = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i, Ap = "/css/fontawesome.min.css";
function Ep(e = {}) {
  return (typeof e.messagePanelThemeCss == "string" ? e.messagePanelThemeCss.trim() : "") || Cp;
}
function kp(e) {
  e.style.setProperty("margin-top", "10px", "important"), e.style.setProperty("margin-bottom", "18px", "important"), e.style.setProperty("padding", "0", "important"), e.style.setProperty("background", "transparent", "important"), e.style.setProperty("border", "0", "important"), e.style.setProperty("border-radius", "0", "important"), e.style.setProperty("box-shadow", "none", "important"), e.style.setProperty("overflow", "visible", "important"), e.style.setProperty("opacity", "1", "important"), e.style.setProperty("order", "9999", "important");
}
function Oo(e, t = {}) {
  let n = e.querySelector("style[data-horae-message-panel-style]");
  n || (n = document.createElement("style"), n.dataset.horaeMessagePanelStyle = "true", e.append(n)), n.textContent = Ep(t);
  const s = /* @__PURE__ */ new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((o) => {
    Tp.test(o.href) && s.add(o.href);
  }), s.size || s.add(Ap), s.forEach((o) => {
    if (Array.from(e.querySelectorAll("link[data-horae-fontawesome]")).some((c) => c.href === o)) return;
    const i = document.createElement("link");
    i.dataset.horaeFontawesome = "true", i.rel = "stylesheet", i.href = o, e.append(i);
  }), e.append(n);
}
function Ip(e, t = {}) {
  kp(e);
  const n = e.shadowRoot || e.attachShadow({ mode: "open" });
  n.textContent = "", Oo(n, t);
  const s = document.createElement("div");
  s.style.setProperty("margin-top", "0", "important"), s.style.setProperty("margin-bottom", "0", "important"), n.append(s);
  const o = () => {
    const i = ["horae-message-panel", "horae-message-panel-vue"];
    e.classList.contains("horae-sideplay") && i.push("horae-sideplay"), s.className = i.join(" "), s.dataset.messageId = e.dataset.messageId || "";
  };
  o();
  const a = new MutationObserver(o);
  return a.observe(e, {
    attributes: !0,
    attributeFilter: ["class", "data-message-id"]
  }), {
    panelContainer: s,
    classObserver: a,
    syncPanelContainer: o,
    updateTheme(i = {}) {
      Oo(n, i);
    }
  };
}
function Pp(e, t = {}) {
  if (!e) return null;
  const { panelContainer: n, classObserver: s, syncPanelContainer: o, updateTheme: a } = Ip(e, t.config), i = Cl(Sp, {
    ...t,
    setHostState(d = {}) {
      var f;
      e.classList.toggle("horae-sideplay", !!d.isSkipped), typeof d.visible == "boolean" && (e.style.display = d.visible ? "" : "none"), o(), (f = t.setHostState) == null || f.call(t, d);
    }
  }), c = i.mount(n), p = new MutationObserver(() => {
    document.body.contains(e) || (i.unmount(), p.disconnect(), s.disconnect());
  });
  return p.observe(document.body, { childList: !0, subtree: !0 }), {
    unmount() {
      p.disconnect(), s.disconnect(), i.unmount();
    },
    updateMeta(d) {
      var f;
      (f = c == null ? void 0 : c.replaceMeta) == null || f.call(c, d);
    },
    updateConfig(d) {
      var f;
      a(d), (f = c == null ? void 0 : c.replaceConfig) == null || f.call(c, d);
    }
  };
}
export {
  Pp as mountMessagePanel
};
