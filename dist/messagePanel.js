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
}, Oo = () => !1, Ln = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Nn = (e) => e.startsWith("onUpdate:"), fe = Object.assign, Ts = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ji = Object.prototype.hasOwnProperty, q = (e, t) => Ji.call(e, t), O = Array.isArray, $t = (e) => dn(e) === "[object Map]", jn = (e) => dn(e) === "[object Set]", Us = (e) => dn(e) === "[object Date]", D = (e) => typeof e == "function", ie = (e) => typeof e == "string", et = (e) => typeof e == "symbol", G = (e) => e !== null && typeof e == "object", $o = (e) => (G(e) || D(e)) && D(e.then) && D(e.catch), Do = Object.prototype.toString, dn = (e) => Do.call(e), Yi = (e) => dn(e).slice(8, -1), Fo = (e) => dn(e) === "[object Object]", As = (e) => ie(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Xt = /* @__PURE__ */ Cs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Hn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Xi = /-\w/g, He = Hn(
  (e) => e.replace(Xi, (t) => t.slice(1).toUpperCase())
), Zi = /\B([A-Z])/g, vt = Hn(
  (e) => e.replace(Zi, "-$1").toLowerCase()
), Lo = Hn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Zn = Hn(
  (e) => e ? `on${Lo(e)}` : ""
), Ze = (e, t) => !Object.is(e, t), Sn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, No = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Vn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Qi = (e) => {
  const t = ie(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Bs;
const Kn = () => Bs || (Bs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Es(e) {
  if (O(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = ie(s) ? sr(s) : Es(s);
      if (o)
        for (const i in o)
          t[i] = o[i];
    }
    return t;
  } else if (ie(e) || G(e))
    return e;
}
const er = /;(?![^(]*\))/g, tr = /:([^]+)/, nr = /\/\*[^]*?\*\//g;
function sr(e) {
  const t = {};
  return e.replace(nr, "").split(er).forEach((n) => {
    if (n) {
      const s = n.split(tr);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Pe(e) {
  let t = "";
  if (ie(e))
    t = e;
  else if (O(e))
    for (let n = 0; n < e.length; n++) {
      const s = Pe(e[n]);
      s && (t += s + " ");
    }
  else if (G(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const or = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ir = /* @__PURE__ */ Cs(or);
function jo(e) {
  return !!e || e === "";
}
function rr(e, t) {
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
    return n && s ? rr(e, t) : !1;
  if (n = G(e), s = G(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, i = Object.keys(t).length;
    if (o !== i)
      return !1;
    for (const a in e) {
      const c = e.hasOwnProperty(a), u = t.hasOwnProperty(a);
      if (c && !u || !c && u || !hn(e[a], t[a]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function ar(e, t) {
  return e.findIndex((n) => hn(n, t));
}
const Ho = (e) => !!(e && e.__v_isRef === !0), H = (e) => ie(e) ? e : e == null ? "" : O(e) || G(e) && (e.toString === Do || !D(e.toString)) ? Ho(e) ? H(e.value) : JSON.stringify(e, Vo, 2) : String(e), Vo = (e, t) => Ho(t) ? Vo(e, t.value) : $t(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], i) => (n[Qn(s, i) + " =>"] = o, n),
    {}
  )
} : jn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Qn(n))
} : et(t) ? Qn(t) : G(t) && !O(t) && !Fo(t) ? String(t) : t, Qn = (e, t = "") => {
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
class lr {
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
function cr() {
  return he;
}
let te;
const es = /* @__PURE__ */ new WeakSet();
class Ko {
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
    this.flags |= 2, zs(this), zo(this);
    const t = te, n = Ve;
    te = this, Ve = !0;
    try {
      return this.fn();
    } finally {
      Wo(this), te = t, Ve = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Rs(t);
      this.deps = this.depsTail = void 0, zs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? es.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ps(this) && this.run();
  }
  get dirty() {
    return ps(this);
  }
}
let Uo = 0, Zt, Qt;
function Bo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Qt, Qt = e;
    return;
  }
  e.next = Zt, Zt = e;
}
function ks() {
  Uo++;
}
function Is() {
  if (--Uo > 0)
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
function zo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Wo(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), Rs(s), ur(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function ps(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (qo(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function qo(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === rn) || (e.globalVersion = rn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ps(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = te, s = Ve;
  te = e, Ve = !0;
  try {
    zo(e);
    const o = e.fn(e._value);
    (t.version === 0 || Ze(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    te = n, Ve = s, Wo(e), e.flags &= -3;
  }
}
function Rs(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      Rs(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function ur(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Ve = !0;
const Go = [];
function ut() {
  Go.push(Ve), Ve = !1;
}
function ft() {
  const e = Go.pop();
  Ve = e === void 0 ? !0 : e;
}
function zs(e) {
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
let rn = 0;
class fr {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Ps {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!te || !Ve || te === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== te)
      n = this.activeLink = new fr(te, this), te.deps ? (n.prevDep = te.depsTail, te.depsTail.nextDep = n, te.depsTail = n) : te.deps = te.depsTail = n, Jo(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = te.depsTail, n.nextDep = void 0, te.depsTail.nextDep = n, te.depsTail = n, te.deps === n && (te.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, rn++, this.notify(t);
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
function Jo(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Jo(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const ds = /* @__PURE__ */ new WeakMap(), Et = /* @__PURE__ */ Symbol(
  ""
), hs = /* @__PURE__ */ Symbol(
  ""
), an = /* @__PURE__ */ Symbol(
  ""
);
function ye(e, t, n) {
  if (Ve && te) {
    let s = ds.get(e);
    s || ds.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new Ps()), o.map = s, o.key = n), o.track();
  }
}
function lt(e, t, n, s, o, i) {
  const a = ds.get(e);
  if (!a) {
    rn++;
    return;
  }
  const c = (u) => {
    u && u.trigger();
  };
  if (ks(), t === "clear")
    a.forEach(c);
  else {
    const u = O(e), d = u && As(n);
    if (u && n === "length") {
      const p = Number(s);
      a.forEach((g, x) => {
        (x === "length" || x === an || !et(x) && x >= p) && c(g);
      });
    } else
      switch ((n !== void 0 || a.has(void 0)) && c(a.get(n)), d && c(a.get(an)), t) {
        case "add":
          u ? d && c(a.get("length")) : (c(a.get(Et)), $t(e) && c(a.get(hs)));
          break;
        case "delete":
          u || (c(a.get(Et)), $t(e) && c(a.get(hs)));
          break;
        case "set":
          $t(e) && c(a.get(Et));
          break;
      }
  }
  Is();
}
function Rt(e) {
  const t = /* @__PURE__ */ B(e);
  return t === e ? t : (ye(t, "iterate", an), /* @__PURE__ */ je(e) ? t : t.map(Ke));
}
function Un(e) {
  return ye(e = /* @__PURE__ */ B(e), "iterate", an), e;
}
function Ye(e, t) {
  return /* @__PURE__ */ pt(e) ? jt(/* @__PURE__ */ kt(e) ? Ke(t) : t) : Ke(t);
}
const pr = {
  __proto__: null,
  [Symbol.iterator]() {
    return ts(this, Symbol.iterator, (e) => Ye(this, e));
  },
  concat(...e) {
    return Rt(this).concat(
      ...e.map((t) => O(t) ? Rt(t) : t)
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
    return Rt(this).join(e);
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
    return Rt(this).toReversed();
  },
  toSorted(e) {
    return Rt(this).toSorted(e);
  },
  toSpliced(...e) {
    return Rt(this).toSpliced(...e);
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
    const i = o._next();
    return i.done || (i.value = n(i.value)), i;
  }), o;
}
const dr = Array.prototype;
function ot(e, t, n, s, o, i) {
  const a = Un(e), c = a !== e && !/* @__PURE__ */ je(e), u = a[t];
  if (u !== dr[t]) {
    const g = u.apply(e, i);
    return c ? Ke(g) : g;
  }
  let d = n;
  a !== e && (c ? d = function(g, x) {
    return n.call(this, Ye(e, g), x, e);
  } : n.length > 2 && (d = function(g, x) {
    return n.call(this, g, x, e);
  }));
  const p = u.call(a, d, s);
  return c && o ? o(p) : p;
}
function Ws(e, t, n, s) {
  const o = Un(e), i = o !== e && !/* @__PURE__ */ je(e);
  let a = n, c = !1;
  o !== e && (i ? (c = s.length === 0, a = function(d, p, g) {
    return c && (c = !1, d = Ye(e, d)), n.call(this, d, Ye(e, p), g, e);
  }) : n.length > 3 && (a = function(d, p, g) {
    return n.call(this, d, p, g, e);
  }));
  const u = o[t](a, ...s);
  return c ? Ye(e, u) : u;
}
function ns(e, t, n) {
  const s = /* @__PURE__ */ B(e);
  ye(s, "iterate", an);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ $s(n[0]) ? (n[0] = /* @__PURE__ */ B(n[0]), s[t](...n)) : o;
}
function Vt(e, t, n = []) {
  ut(), ks();
  const s = (/* @__PURE__ */ B(e))[t].apply(e, n);
  return Is(), ft(), s;
}
const hr = /* @__PURE__ */ Cs("__proto__,__v_isRef,__isVue"), Yo = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(et)
);
function mr(e) {
  et(e) || (e = String(e));
  const t = /* @__PURE__ */ B(this);
  return ye(t, "has", e), t.hasOwnProperty(e);
}
class Xo {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const o = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !o;
    if (n === "__v_isReadonly")
      return o;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return s === (o ? i ? Tr : ti : i ? ei : Qo).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const a = O(t);
    if (!o) {
      let u;
      if (a && (u = pr[n]))
        return u;
      if (n === "hasOwnProperty")
        return mr;
    }
    const c = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ _e(t) ? t : s
    );
    if ((et(n) ? Yo.has(n) : hr(n)) || (o || ye(t, "get", n), i))
      return c;
    if (/* @__PURE__ */ _e(c)) {
      const u = a && As(n) ? c : c.value;
      return o && G(u) ? /* @__PURE__ */ gs(u) : u;
    }
    return G(c) ? o ? /* @__PURE__ */ gs(c) : /* @__PURE__ */ Dt(c) : c;
  }
}
class Zo extends Xo {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let i = t[n];
    const a = O(t) && As(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ pt(i);
      if (!/* @__PURE__ */ je(s) && !/* @__PURE__ */ pt(s) && (i = /* @__PURE__ */ B(i), s = /* @__PURE__ */ B(s)), !a && /* @__PURE__ */ _e(i) && !/* @__PURE__ */ _e(s))
        return d || (i.value = s), !0;
    }
    const c = a ? Number(n) < t.length : q(t, n), u = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ _e(t) ? t : o
    );
    return t === /* @__PURE__ */ B(o) && (c ? Ze(s, i) && lt(t, "set", n, s) : lt(t, "add", n, s)), u;
  }
  deleteProperty(t, n) {
    const s = q(t, n);
    t[n];
    const o = Reflect.deleteProperty(t, n);
    return o && s && lt(t, "delete", n, void 0), o;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!et(n) || !Yo.has(n)) && ye(t, "has", n), s;
  }
  ownKeys(t) {
    return ye(
      t,
      "iterate",
      O(t) ? "length" : Et
    ), Reflect.ownKeys(t);
  }
}
class gr extends Xo {
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
const vr = /* @__PURE__ */ new Zo(), br = /* @__PURE__ */ new gr(), xr = /* @__PURE__ */ new Zo(!0);
const ms = (e) => e, yn = (e) => Reflect.getPrototypeOf(e);
function yr(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, i = /* @__PURE__ */ B(o), a = $t(i), c = e === "entries" || e === Symbol.iterator && a, u = e === "keys" && a, d = o[e](...s), p = n ? ms : t ? jt : Ke;
    return !t && ye(
      i,
      "iterate",
      u ? hs : Et
    ), fe(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: g, done: x } = d.next();
          return x ? { value: g, done: x } : {
            value: c ? [p(g[0]), p(g[1])] : p(g),
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
function _r(e, t) {
  const n = {
    get(o) {
      const i = this.__v_raw, a = /* @__PURE__ */ B(i), c = /* @__PURE__ */ B(o);
      e || (Ze(o, c) && ye(a, "get", o), ye(a, "get", c));
      const { has: u } = yn(a), d = t ? ms : e ? jt : Ke;
      if (u.call(a, o))
        return d(i.get(o));
      if (u.call(a, c))
        return d(i.get(c));
      i !== a && i.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && ye(/* @__PURE__ */ B(o), "iterate", Et), o.size;
    },
    has(o) {
      const i = this.__v_raw, a = /* @__PURE__ */ B(i), c = /* @__PURE__ */ B(o);
      return e || (Ze(o, c) && ye(a, "has", o), ye(a, "has", c)), o === c ? i.has(o) : i.has(o) || i.has(c);
    },
    forEach(o, i) {
      const a = this, c = a.__v_raw, u = /* @__PURE__ */ B(c), d = t ? ms : e ? jt : Ke;
      return !e && ye(u, "iterate", Et), c.forEach((p, g) => o.call(i, d(p), d(g), a));
    }
  };
  return fe(
    n,
    e ? {
      add: _n("add"),
      set: _n("set"),
      delete: _n("delete"),
      clear: _n("clear")
    } : {
      add(o) {
        const i = /* @__PURE__ */ B(this), a = yn(i), c = /* @__PURE__ */ B(o), u = !t && !/* @__PURE__ */ je(o) && !/* @__PURE__ */ pt(o) ? c : o;
        return a.has.call(i, u) || Ze(o, u) && a.has.call(i, o) || Ze(c, u) && a.has.call(i, c) || (i.add(u), lt(i, "add", u, u)), this;
      },
      set(o, i) {
        !t && !/* @__PURE__ */ je(i) && !/* @__PURE__ */ pt(i) && (i = /* @__PURE__ */ B(i));
        const a = /* @__PURE__ */ B(this), { has: c, get: u } = yn(a);
        let d = c.call(a, o);
        d || (o = /* @__PURE__ */ B(o), d = c.call(a, o));
        const p = u.call(a, o);
        return a.set(o, i), d ? Ze(i, p) && lt(a, "set", o, i) : lt(a, "add", o, i), this;
      },
      delete(o) {
        const i = /* @__PURE__ */ B(this), { has: a, get: c } = yn(i);
        let u = a.call(i, o);
        u || (o = /* @__PURE__ */ B(o), u = a.call(i, o)), c && c.call(i, o);
        const d = i.delete(o);
        return u && lt(i, "delete", o, void 0), d;
      },
      clear() {
        const o = /* @__PURE__ */ B(this), i = o.size !== 0, a = o.clear();
        return i && lt(
          o,
          "clear",
          void 0,
          void 0
        ), a;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    n[o] = yr(o, e, t);
  }), n;
}
function Ms(e, t) {
  const n = _r(e, t);
  return (s, o, i) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    q(n, o) && o in s ? n : s,
    o,
    i
  );
}
const wr = {
  get: /* @__PURE__ */ Ms(!1, !1)
}, Sr = {
  get: /* @__PURE__ */ Ms(!1, !0)
}, Cr = {
  get: /* @__PURE__ */ Ms(!0, !1)
};
const Qo = /* @__PURE__ */ new WeakMap(), ei = /* @__PURE__ */ new WeakMap(), ti = /* @__PURE__ */ new WeakMap(), Tr = /* @__PURE__ */ new WeakMap();
function Ar(e) {
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
function Er(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Ar(Yi(e));
}
// @__NO_SIDE_EFFECTS__
function Dt(e) {
  return /* @__PURE__ */ pt(e) ? e : Os(
    e,
    !1,
    vr,
    wr,
    Qo
  );
}
// @__NO_SIDE_EFFECTS__
function kr(e) {
  return Os(
    e,
    !1,
    xr,
    Sr,
    ei
  );
}
// @__NO_SIDE_EFFECTS__
function gs(e) {
  return Os(
    e,
    !0,
    br,
    Cr,
    ti
  );
}
function Os(e, t, n, s, o) {
  if (!G(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const i = Er(e);
  if (i === 0)
    return e;
  const a = o.get(e);
  if (a)
    return a;
  const c = new Proxy(
    e,
    i === 2 ? s : n
  );
  return o.set(e, c), c;
}
// @__NO_SIDE_EFFECTS__
function kt(e) {
  return /* @__PURE__ */ pt(e) ? /* @__PURE__ */ kt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function pt(e) {
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
function B(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ B(t) : e;
}
function Ir(e) {
  return !q(e, "__v_skip") && Object.isExtensible(e) && No(e, "__v_skip", !0), e;
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
  return /* @__PURE__ */ _e(e) ? e : new Pr(e, t);
}
class Pr {
  constructor(t, n) {
    this.dep = new Ps(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ B(t), this._value = n ? t : Ke(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ je(t) || /* @__PURE__ */ pt(t);
    t = s ? t : /* @__PURE__ */ B(t), Ze(t, n) && (this._rawValue = t, this._value = s ? t : Ke(t), this.dep.trigger());
  }
}
function E(e) {
  return /* @__PURE__ */ _e(e) ? e.value : e;
}
const Mr = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ _e(o) && !/* @__PURE__ */ _e(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function ni(e) {
  return /* @__PURE__ */ kt(e) ? e : new Proxy(e, Mr);
}
class Or {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Ps(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = rn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
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
    return qo(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function $r(e, t, n = !1) {
  let s, o;
  return D(e) ? s = e : (s = e.get, o = e.set), new Or(s, o, n);
}
const wn = {}, An = /* @__PURE__ */ new WeakMap();
let Ct;
function Dr(e, t = !1, n = Ct) {
  if (n) {
    let s = An.get(n);
    s || An.set(n, s = []), s.push(e);
  }
}
function Fr(e, t, n = Z) {
  const { immediate: s, deep: o, once: i, scheduler: a, augmentJob: c, call: u } = n, d = (k) => o ? k : /* @__PURE__ */ je(k) || o === !1 || o === 0 ? ct(k, 1) : ct(k);
  let p, g, x, C, F = !1, P = !1;
  if (/* @__PURE__ */ _e(e) ? (g = () => e.value, F = /* @__PURE__ */ je(e)) : /* @__PURE__ */ kt(e) ? (g = () => d(e), F = !0) : O(e) ? (P = !0, F = e.some((k) => /* @__PURE__ */ kt(k) || /* @__PURE__ */ je(k)), g = () => e.map((k) => {
    if (/* @__PURE__ */ _e(k))
      return k.value;
    if (/* @__PURE__ */ kt(k))
      return d(k);
    if (D(k))
      return u ? u(k, 2) : k();
  })) : D(e) ? t ? g = u ? () => u(e, 2) : e : g = () => {
    if (x) {
      ut();
      try {
        x();
      } finally {
        ft();
      }
    }
    const k = Ct;
    Ct = p;
    try {
      return u ? u(e, 3, [C]) : e(C);
    } finally {
      Ct = k;
    }
  } : g = Qe, t && o) {
    const k = g, z = o === !0 ? 1 / 0 : o;
    g = () => ct(k(), z);
  }
  const Q = cr(), I = () => {
    p.stop(), Q && Q.active && Ts(Q.effects, p);
  };
  if (i && t) {
    const k = t;
    t = (...z) => {
      k(...z), I();
    };
  }
  let N = P ? new Array(e.length).fill(wn) : wn;
  const V = (k) => {
    if (!(!(p.flags & 1) || !p.dirty && !k))
      if (t) {
        const z = p.run();
        if (o || F || (P ? z.some((ae, pe) => Ze(ae, N[pe])) : Ze(z, N))) {
          x && x();
          const ae = Ct;
          Ct = p;
          try {
            const pe = [
              z,
              // pass undefined as the old value when it's changed for the first time
              N === wn ? void 0 : P && N[0] === wn ? [] : N,
              C
            ];
            N = z, u ? u(t, 3, pe) : (
              // @ts-expect-error
              t(...pe)
            );
          } finally {
            Ct = ae;
          }
        }
      } else
        p.run();
  };
  return c && c(V), p = new Ko(g), p.scheduler = a ? () => a(V, !1) : V, C = (k) => Dr(k, !1, p), x = p.onStop = () => {
    const k = An.get(p);
    if (k) {
      if (u)
        u(k, 4);
      else
        for (const z of k) z();
      An.delete(p);
    }
  }, t ? s ? V(!0) : N = p.run() : a ? a(V.bind(null, !0), !0) : p.run(), I.pause = p.pause.bind(p), I.resume = p.resume.bind(p), I.stop = I, I;
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
  else if (Fo(e)) {
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
    Bn(o, t, n);
  }
}
function Ue(e, t, n, s) {
  if (D(e)) {
    const o = mn(e, t, n, s);
    return o && $o(o) && o.catch((i) => {
      Bn(i, t, n);
    }), o;
  }
  if (O(e)) {
    const o = [];
    for (let i = 0; i < e.length; i++)
      o.push(Ue(e[i], t, n, s));
    return o;
  }
}
function Bn(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: a } = t && t.appContext.config || Z;
  if (t) {
    let c = t.parent;
    const u = t.proxy, d = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; c; ) {
      const p = c.ec;
      if (p) {
        for (let g = 0; g < p.length; g++)
          if (p[g](e, u, d) === !1)
            return;
      }
      c = c.parent;
    }
    if (i) {
      ut(), mn(i, null, 10, [
        e,
        u,
        d
      ]), ft();
      return;
    }
  }
  Lr(e, n, o, s, a);
}
function Lr(e, t, n, s = !0, o = !1) {
  if (o)
    throw e;
  console.error(e);
}
const Ce = [];
let Ge = -1;
const Ft = [];
let mt = null, Pt = 0;
const si = /* @__PURE__ */ Promise.resolve();
let En = null;
function Mt(e) {
  const t = En || si;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Nr(e) {
  let t = Ge + 1, n = Ce.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = Ce[s], i = ln(o);
    i < e || i === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Ds(e) {
  if (!(e.flags & 1)) {
    const t = ln(e), n = Ce[Ce.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= ln(n) ? Ce.push(e) : Ce.splice(Nr(t), 0, e), e.flags |= 1, oi();
  }
}
function oi() {
  En || (En = si.then(ri));
}
function jr(e) {
  O(e) ? Ft.push(...e) : mt && e.id === -1 ? mt.splice(Pt + 1, 0, e) : e.flags & 1 || (Ft.push(e), e.flags |= 1), oi();
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
function ii(e) {
  if (Ft.length) {
    const t = [...new Set(Ft)].sort(
      (n, s) => ln(n) - ln(s)
    );
    if (Ft.length = 0, mt) {
      mt.push(...t);
      return;
    }
    for (mt = t, Pt = 0; Pt < mt.length; Pt++) {
      const n = mt[Pt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    mt = null, Pt = 0;
  }
}
const ln = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function ri(e) {
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
    Ge = -1, Ce.length = 0, ii(), En = null, (Ce.length || Ft.length) && ri();
  }
}
let Ne = null, ai = null;
function kn(e) {
  const t = Ne;
  return Ne = e, ai = e && e.type.__scopeId || null, t;
}
function li(e, t = Ne, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && Pn(-1);
    const i = kn(t);
    let a;
    try {
      a = e(...o);
    } finally {
      kn(i), s._d && Pn(1);
    }
    return a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function ce(e, t) {
  if (Ne === null)
    return e;
  const n = Jn(Ne), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [i, a, c, u = Z] = t[o];
    i && (D(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && ct(a), s.push({
      dir: i,
      instance: n,
      value: a,
      oldValue: void 0,
      arg: c,
      modifiers: u
    }));
  }
  return e;
}
function yt(e, t, n, s) {
  const o = e.dirs, i = t && t.dirs;
  for (let a = 0; a < o.length; a++) {
    const c = o[a];
    i && (c.oldValue = i[a].value);
    let u = c.dir[s];
    u && (ut(), Ue(u, n, 8, [
      e.el,
      c,
      e,
      t
    ]), ft());
  }
}
function Hr(e, t) {
  if (Ee) {
    let n = Ee.provides;
    const s = Ee.parent && Ee.parent.provides;
    s === n && (n = Ee.provides = Object.create(s)), n[e] = t;
  }
}
function Cn(e, t, n = !1) {
  const s = Vi();
  if (s || Lt) {
    let o = Lt ? Lt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && D(t) ? t.call(s && s.proxy) : t;
  }
}
const Vr = /* @__PURE__ */ Symbol.for("v-scx"), Kr = () => Cn(Vr);
function en(e, t, n) {
  return ci(e, t, n);
}
function ci(e, t, n = Z) {
  const { immediate: s, deep: o, flush: i, once: a } = n, c = fe({}, n), u = t && s || !t && i !== "post";
  let d;
  if (fn) {
    if (i === "sync") {
      const C = Kr();
      d = C.__watcherHandles || (C.__watcherHandles = []);
    } else if (!u) {
      const C = () => {
      };
      return C.stop = Qe, C.resume = Qe, C.pause = Qe, C;
    }
  }
  const p = Ee;
  c.call = (C, F, P) => Ue(C, p, F, P);
  let g = !1;
  i === "post" ? c.scheduler = (C) => {
    Re(C, p && p.suspense);
  } : i !== "sync" && (g = !0, c.scheduler = (C, F) => {
    F ? C() : Ds(C);
  }), c.augmentJob = (C) => {
    t && (C.flags |= 4), g && (C.flags |= 2, p && (C.id = p.uid, C.i = p));
  };
  const x = Fr(e, t, c);
  return fn && (d ? d.push(x) : u && x()), x;
}
function Ur(e, t, n) {
  const s = this.proxy, o = ie(e) ? e.includes(".") ? ui(s, e) : () => s[e] : e.bind(s, s);
  let i;
  D(t) ? i = t : (i = t.handler, n = t);
  const a = gn(this), c = ci(o, i.bind(s), n);
  return a(), c;
}
function ui(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const Br = /* @__PURE__ */ Symbol("_vte"), fi = (e) => e.__isTeleport, Je = /* @__PURE__ */ Symbol("_leaveCb"), Ut = /* @__PURE__ */ Symbol("_enterCb");
function zr() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  return xi(() => {
    e.isMounted = !0;
  }), yi(() => {
    e.isUnmounting = !0;
  }), e;
}
const Fe = [Function, Array], pi = {
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
}, di = (e) => {
  const t = e.subTree;
  return t.component ? di(t.component) : t;
}, Wr = {
  name: "BaseTransition",
  props: pi,
  setup(e, { slots: t }) {
    const n = Vi(), s = zr();
    return () => {
      const o = t.default && gi(t.default(), !0), i = o && o.length ? hi(o) : (
        // Keep explicit default-slot conditionals on the same transition path
        // as regular v-if branches, which render a comment placeholder.
        n.subTree ? Gt() : void 0
      );
      if (!i)
        return;
      const a = /* @__PURE__ */ B(e), { mode: c } = a;
      if (s.isLeaving)
        return ss(i);
      const u = Gs(i);
      if (!u)
        return ss(i);
      let d = vs(
        u,
        a,
        s,
        n,
        // #11061, ensure enterHooks is fresh after clone
        (g) => d = g
      );
      u.type !== Ae && cn(u, d);
      let p = n.subTree && Gs(n.subTree);
      if (p && p.type !== Ae && !Tt(p, u) && di(n).type !== Ae) {
        let g = vs(
          p,
          a,
          s,
          n
        );
        if (cn(p, g), c === "out-in" && u.type !== Ae)
          return s.isLeaving = !0, g.afterLeave = () => {
            s.isLeaving = !1, n.job.flags & 8 || n.update(), delete g.afterLeave, p = void 0;
          }, ss(i);
        c === "in-out" && u.type !== Ae ? g.delayLeave = (x, C, F) => {
          const P = mi(
            s,
            p
          );
          P[String(p.key)] = p, x[Je] = () => {
            C(), x[Je] = void 0, delete d.delayedLeave, p = void 0;
          }, d.delayedLeave = () => {
            F(), delete d.delayedLeave, p = void 0;
          };
        } : p = void 0;
      } else p && (p = void 0);
      return i;
    };
  }
};
function hi(e) {
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
const qr = Wr;
function mi(e, t) {
  const { leavingVNodes: n } = e;
  let s = n.get(t.type);
  return s || (s = /* @__PURE__ */ Object.create(null), n.set(t.type, s)), s;
}
function vs(e, t, n, s, o) {
  const {
    appear: i,
    mode: a,
    persisted: c = !1,
    onBeforeEnter: u,
    onEnter: d,
    onAfterEnter: p,
    onEnterCancelled: g,
    onBeforeLeave: x,
    onLeave: C,
    onAfterLeave: F,
    onLeaveCancelled: P,
    onBeforeAppear: Q,
    onAppear: I,
    onAfterAppear: N,
    onAppearCancelled: V
  } = t, k = String(e.key), z = mi(n, e), ae = (L, W) => {
    L && Ue(
      L,
      s,
      9,
      W
    );
  }, pe = (L, W) => {
    const ne = W[1];
    ae(L, W), O(L) ? L.every((A) => A.length <= 1) && ne() : L.length <= 1 && ne();
  }, me = {
    mode: a,
    persisted: c,
    beforeEnter(L) {
      let W = u;
      if (!n.isMounted)
        if (i)
          W = Q || u;
        else
          return;
      L[Je] && L[Je](
        !0
        /* cancelled */
      );
      const ne = z[k];
      ne && Tt(e, ne) && ne.el[Je] && ne.el[Je](), ae(W, [L]);
    },
    enter(L) {
      if (z[k] === e) return;
      let W = d, ne = p, A = g;
      if (!n.isMounted)
        if (i)
          W = I || d, ne = N || p, A = V || g;
        else
          return;
      let Y = !1;
      L[Ut] = (ge) => {
        Y || (Y = !0, ge ? ae(A, [L]) : ae(ne, [L]), me.delayedLeave && me.delayedLeave(), L[Ut] = void 0);
      };
      const oe = L[Ut].bind(null, !1);
      W ? pe(W, [L, oe]) : oe();
    },
    leave(L, W) {
      const ne = String(e.key);
      if (L[Ut] && L[Ut](
        !0
        /* cancelled */
      ), n.isUnmounting)
        return W();
      ae(x, [L]);
      let A = !1;
      L[Je] = (oe) => {
        A || (A = !0, W(), oe ? ae(P, [L]) : ae(F, [L]), L[Je] = void 0, z[ne] === e && delete z[ne]);
      };
      const Y = L[Je].bind(null, !1);
      z[ne] = e, C ? pe(C, [L, Y]) : Y();
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
  if (zn(e))
    return e = gt(e), e.children = null, e;
}
function Gs(e) {
  if (!zn(e))
    return fi(e.type) && e.children ? hi(e.children) : e;
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
function gi(e, t = !1, n) {
  let s = [], o = 0;
  for (let i = 0; i < e.length; i++) {
    let a = e[i];
    const c = n == null ? a.key : String(n) + String(a.key != null ? a.key : i);
    a.type === Te ? (a.patchFlag & 128 && o++, s = s.concat(
      gi(a.children, t, c)
    )) : (t || a.type !== Ae) && s.push(c != null ? gt(a, { key: c }) : a);
  }
  if (o > 1)
    for (let i = 0; i < s.length; i++)
      s[i].patchFlag = -2;
  return s;
}
// @__NO_SIDE_EFFECTS__
function Js(e, t) {
  return D(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    fe({ name: e.name }, t, { setup: e })
  ) : e;
}
function vi(e) {
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
      (P, Q) => tn(
        P,
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
  const i = s.shapeFlag & 4 ? Jn(s.component) : s.el, a = o ? null : i, { i: c, r: u } = e, d = t && t.r, p = c.refs === Z ? c.refs = {} : c.refs, g = c.setupState, x = /* @__PURE__ */ B(g), C = g === Z ? Oo : (P) => Ys(p, P) ? !1 : q(x, P), F = (P, Q) => !(Q && Ys(p, Q));
  if (d != null && d !== u) {
    if (Xs(t), ie(d))
      p[d] = null, C(d) && (g[d] = null);
    else if (/* @__PURE__ */ _e(d)) {
      const P = t;
      F(d, P.k) && (d.value = null), P.k && (p[P.k] = null);
    }
  }
  if (D(u))
    mn(u, c, 12, [a, p]);
  else {
    const P = ie(u), Q = /* @__PURE__ */ _e(u);
    if (P || Q) {
      const I = () => {
        if (e.f) {
          const N = P ? C(u) ? g[u] : p[u] : F() || !e.k ? u.value : p[e.k];
          if (o)
            O(N) && Ts(N, i);
          else if (O(N))
            N.includes(i) || N.push(i);
          else if (P)
            p[u] = [i], C(u) && (g[u] = p[u]);
          else {
            const V = [i];
            F(u, e.k) && (u.value = V), e.k && (p[e.k] = V);
          }
        } else P ? (p[u] = a, C(u) && (g[u] = a)) : Q && (F(u, e.k) && (u.value = a), e.k && (p[e.k] = a));
      };
      if (a) {
        const N = () => {
          I(), In.delete(e);
        };
        N.id = -1, In.set(e, N), Re(N, n);
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
const nn = (e) => !!e.type.__asyncLoader, zn = (e) => e.type.__isKeepAlive;
function Gr(e, t) {
  bi(e, "a", t);
}
function Jr(e, t) {
  bi(e, "da", t);
}
function bi(e, t, n = Ee) {
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
      zn(o.parent.vnode) && Yr(s, t, n, o), o = o.parent;
  }
}
function Yr(e, t, n, s) {
  const o = Wn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  _i(() => {
    Ts(s[t], o);
  }, n);
}
function Wn(e, t, n = Ee, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...a) => {
      ut();
      const c = gn(n), u = Ue(t, n, e, a);
      return c(), ft(), u;
    });
    return s ? o.unshift(i) : o.push(i), i;
  }
}
const dt = (e) => (t, n = Ee) => {
  (!fn || e === "sp") && Wn(e, (...s) => t(...s), n);
}, Xr = dt("bm"), xi = dt("m"), Zr = dt(
  "bu"
), Qr = dt("u"), yi = dt(
  "bum"
), _i = dt("um"), ea = dt(
  "sp"
), ta = dt("rtg"), na = dt("rtc");
function sa(e, t = Ee) {
  Wn("ec", e, t);
}
const oa = /* @__PURE__ */ Symbol.for("v-ndc");
function Bt(e, t, n, s) {
  let o;
  const i = n, a = O(e);
  if (a || ie(e)) {
    const c = a && /* @__PURE__ */ kt(e);
    let u = !1, d = !1;
    c && (u = !/* @__PURE__ */ je(e), d = /* @__PURE__ */ pt(e), e = Un(e)), o = new Array(e.length);
    for (let p = 0, g = e.length; p < g; p++)
      o[p] = t(
        u ? d ? jt(Ke(e[p])) : Ke(e[p]) : e[p],
        p,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let c = 0; c < e; c++)
      o[c] = t(c + 1, c, void 0, i);
  } else if (G(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (c, u) => t(c, u, void 0, i)
      );
    else {
      const c = Object.keys(e);
      o = new Array(c.length);
      for (let u = 0, d = c.length; u < d; u++) {
        const p = c[u];
        o[u] = t(e[p], p, u, i);
      }
    }
  else
    o = [];
  return o;
}
const bs = (e) => e ? Ki(e) ? Jn(e) : bs(e.parent) : null, sn = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ fe(/* @__PURE__ */ Object.create(null), {
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
    $options: (e) => Si(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Ds(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Mt.bind(e.proxy)),
    $watch: (e) => Ur.bind(e)
  })
), os = (e, t) => e !== Z && !e.__isScriptSetup && q(e, t), ia = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: i, accessCache: a, type: c, appContext: u } = e;
    if (t[0] !== "$") {
      const x = a[t];
      if (x !== void 0)
        switch (x) {
          case 1:
            return s[t];
          case 2:
            return o[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (os(s, t))
          return a[t] = 1, s[t];
        if (o !== Z && q(o, t))
          return a[t] = 2, o[t];
        if (q(i, t))
          return a[t] = 3, i[t];
        if (n !== Z && q(n, t))
          return a[t] = 4, n[t];
        xs && (a[t] = 0);
      }
    }
    const d = sn[t];
    let p, g;
    if (d)
      return t === "$attrs" && ye(e.attrs, "get", ""), d(e);
    if (
      // css module (injected by vue-loader)
      (p = c.__cssModules) && (p = p[t])
    )
      return p;
    if (n !== Z && q(n, t))
      return a[t] = 4, n[t];
    if (
      // global properties
      g = u.config.globalProperties, q(g, t)
    )
      return g[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: i } = e;
    return os(o, t) ? (o[t] = n, !0) : s !== Z && q(s, t) ? (s[t] = n, !0) : q(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: i, type: a }
  }, c) {
    let u;
    return !!(n[c] || e !== Z && c[0] !== "$" && q(e, c) || os(t, c) || q(i, c) || q(s, c) || q(sn, c) || q(o.config.globalProperties, c) || (u = a.__cssModules) && u[c]);
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
function ra(e) {
  const t = Si(e), n = e.proxy, s = e.ctx;
  xs = !1, t.beforeCreate && Qs(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: i,
    methods: a,
    watch: c,
    provide: u,
    inject: d,
    // lifecycle
    created: p,
    beforeMount: g,
    mounted: x,
    beforeUpdate: C,
    updated: F,
    activated: P,
    deactivated: Q,
    beforeDestroy: I,
    beforeUnmount: N,
    destroyed: V,
    unmounted: k,
    render: z,
    renderTracked: ae,
    renderTriggered: pe,
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
  if (d && aa(d, s, null), a)
    for (const J in a) {
      const U = a[J];
      D(U) && (s[J] = U.bind(n));
    }
  if (o) {
    const J = o.call(n, n);
    G(J) && (e.data = /* @__PURE__ */ Dt(J));
  }
  if (xs = !0, i)
    for (const J in i) {
      const U = i[J], tt = D(U) ? U.bind(n, n) : D(U.get) ? U.get.bind(n, n) : Qe, It = !D(U) && D(U.set) ? U.set.bind(n) : Qe, ke = Jt({
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
      wi(c[J], s, n, J);
  if (u) {
    const J = D(u) ? u.call(n) : u;
    Reflect.ownKeys(J).forEach((U) => {
      Hr(U, J[U]);
    });
  }
  p && Qs(p, e, "c");
  function j(J, U) {
    O(U) ? U.forEach((tt) => J(tt.bind(n))) : U && J(U.bind(n));
  }
  if (j(Xr, g), j(xi, x), j(Zr, C), j(Qr, F), j(Gr, P), j(Jr, Q), j(sa, me), j(na, ae), j(ta, pe), j(yi, N), j(_i, k), j(ea, L), O(W))
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
  z && e.render === Qe && (e.render = z), ne != null && (e.inheritAttrs = ne), A && (e.components = A), Y && (e.directives = Y), L && vi(e);
}
function aa(e, t, n = Qe) {
  O(e) && (e = ys(e));
  for (const s in e) {
    const o = e[s];
    let i;
    G(o) ? "default" in o ? i = Cn(
      o.from || s,
      o.default,
      !0
    ) : i = Cn(o.from || s) : i = Cn(o), /* @__PURE__ */ _e(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (a) => i.value = a
    }) : t[s] = i;
  }
}
function Qs(e, t, n) {
  Ue(
    O(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function wi(e, t, n, s) {
  let o = s.includes(".") ? ui(n, s) : () => n[s];
  if (ie(e)) {
    const i = t[e];
    D(i) && en(o, i);
  } else if (D(e))
    en(o, e.bind(n));
  else if (G(e))
    if (O(e))
      e.forEach((i) => wi(i, t, n, s));
    else {
      const i = D(e.handler) ? e.handler.bind(n) : t[e.handler];
      D(i) && en(o, i, e);
    }
}
function Si(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: i,
    config: { optionMergeStrategies: a }
  } = e.appContext, c = i.get(t);
  let u;
  return c ? u = c : !o.length && !n && !s ? u = t : (u = {}, o.length && o.forEach(
    (d) => Rn(u, d, a, !0)
  ), Rn(u, t, a)), G(t) && i.set(t, u), u;
}
function Rn(e, t, n, s = !1) {
  const { mixins: o, extends: i } = t;
  i && Rn(e, i, n, !0), o && o.forEach(
    (a) => Rn(e, a, n, !0)
  );
  for (const a in t)
    if (!(s && a === "expose")) {
      const c = la[a] || n && n[a];
      e[a] = c ? c(e[a], t[a]) : t[a];
    }
  return e;
}
const la = {
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
  watch: ua,
  // provide / inject
  provide: eo,
  inject: ca
};
function eo(e, t) {
  return t ? e ? function() {
    return fe(
      D(e) ? e.call(this, this) : e,
      D(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function ca(e, t) {
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
  return e ? fe(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function to(e, t) {
  return e ? O(e) && O(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : fe(
    /* @__PURE__ */ Object.create(null),
    Zs(e),
    Zs(t ?? {})
  ) : t;
}
function ua(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = fe(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = Se(e[s], t[s]);
  return n;
}
function Ci() {
  return {
    app: null,
    config: {
      isNativeTag: Oo,
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
let fa = 0;
function pa(e, t) {
  return function(s, o = null) {
    D(s) || (s = fe({}, s)), o != null && !G(o) && (o = null);
    const i = Ci(), a = /* @__PURE__ */ new WeakSet(), c = [];
    let u = !1;
    const d = i.app = {
      _uid: fa++,
      _component: s,
      _props: o,
      _container: null,
      _context: i,
      _instance: null,
      version: Ba,
      get config() {
        return i.config;
      },
      set config(p) {
      },
      use(p, ...g) {
        return a.has(p) || (p && D(p.install) ? (a.add(p), p.install(d, ...g)) : D(p) && (a.add(p), p(d, ...g))), d;
      },
      mixin(p) {
        return i.mixins.includes(p) || i.mixins.push(p), d;
      },
      component(p, g) {
        return g ? (i.components[p] = g, d) : i.components[p];
      },
      directive(p, g) {
        return g ? (i.directives[p] = g, d) : i.directives[p];
      },
      mount(p, g, x) {
        if (!u) {
          const C = d._ceVNode || ue(s, o);
          return C.appContext = i, x === !0 ? x = "svg" : x === !1 && (x = void 0), e(C, p, x), u = !0, d._container = p, p.__vue_app__ = d, Jn(C.component);
        }
      },
      onUnmount(p) {
        c.push(p);
      },
      unmount() {
        u && (Ue(
          c,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(p, g) {
        return i.provides[p] = g, d;
      },
      runWithContext(p) {
        const g = Lt;
        Lt = d;
        try {
          return p();
        } finally {
          Lt = g;
        }
      }
    };
    return d;
  };
}
let Lt = null;
const da = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${He(t)}Modifiers`] || e[`${vt(t)}Modifiers`];
function ha(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Z;
  let o = n;
  const i = t.startsWith("update:"), a = i && da(s, t.slice(7));
  a && (a.trim && (o = n.map((p) => ie(p) ? p.trim() : p)), a.number && (o = n.map(Vn)));
  let c, u = s[c = Zn(t)] || // also try camelCase event handler (#2249)
  s[c = Zn(He(t))];
  !u && i && (u = s[c = Zn(vt(t))]), u && Ue(
    u,
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
const ma = /* @__PURE__ */ new WeakMap();
function Ti(e, t, n = !1) {
  const s = n ? ma : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const i = e.emits;
  let a = {}, c = !1;
  if (!D(e)) {
    const u = (d) => {
      const p = Ti(d, t, !0);
      p && (c = !0, fe(a, p));
    };
    !n && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u);
  }
  return !i && !c ? (G(e) && s.set(e, null), null) : (O(i) ? i.forEach((u) => a[u] = null) : fe(a, i), G(e) && s.set(e, a), a);
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
    propsOptions: [i],
    slots: a,
    attrs: c,
    emit: u,
    render: d,
    renderCache: p,
    props: g,
    data: x,
    setupState: C,
    ctx: F,
    inheritAttrs: P
  } = e, Q = kn(e);
  let I, N;
  try {
    if (n.shapeFlag & 4) {
      const k = o || s, z = k;
      I = Xe(
        d.call(
          z,
          k,
          p,
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
          { attrs: c, slots: a, emit: u }
        ) : k(
          g,
          null
        )
      ), N = t.props ? c : ga(c);
    }
  } catch (k) {
    on.length = 0, Bn(k, e, 1), I = ue(Ae);
  }
  let V = I;
  if (N && P !== !1) {
    const k = Object.keys(N), { shapeFlag: z } = V;
    k.length && z & 7 && (i && k.some(Nn) && (N = va(
      N,
      i
    )), V = gt(V, N, !1, !0));
  }
  return n.dirs && (V = gt(V, null, !1, !0), V.dirs = V.dirs ? V.dirs.concat(n.dirs) : n.dirs), n.transition && cn(V, n.transition), I = V, kn(Q), I;
}
const ga = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Ln(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, va = (e, t) => {
  const n = {};
  for (const s in e)
    (!Nn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function ba(e, t, n) {
  const { props: s, children: o, component: i } = e, { props: a, children: c, patchFlag: u } = t, d = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && u >= 0) {
    if (u & 1024)
      return !0;
    if (u & 16)
      return s ? so(s, a, d) : !!a;
    if (u & 8) {
      const p = t.dynamicProps;
      for (let g = 0; g < p.length; g++) {
        const x = p[g];
        if (Ai(a, s, x) && !qn(d, x))
          return !0;
      }
    }
  } else
    return (o || c) && (!c || !c.$stable) ? !0 : s === a ? !1 : s ? a ? so(s, a, d) : !0 : !!a;
  return !1;
}
function so(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const i = s[o];
    if (Ai(t, e, i) && !qn(n, i))
      return !0;
  }
  return !1;
}
function Ai(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && G(s) && G(o) ? !hn(s, o) : s !== o;
}
function xa({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const Ei = {}, ki = () => Object.create(Ei), Ii = (e) => Object.getPrototypeOf(e) === Ei;
function ya(e, t, n, s = !1) {
  const o = {}, i = ki();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Ri(e, t, o, i);
  for (const a in e.propsOptions[0])
    a in o || (o[a] = void 0);
  n ? e.props = s ? o : /* @__PURE__ */ kr(o) : e.type.props ? e.props = o : e.props = i, e.attrs = i;
}
function _a(e, t, n, s) {
  const {
    props: o,
    attrs: i,
    vnode: { patchFlag: a }
  } = e, c = /* @__PURE__ */ B(o), [u] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || a > 0) && !(a & 16)
  ) {
    if (a & 8) {
      const p = e.vnode.dynamicProps;
      for (let g = 0; g < p.length; g++) {
        let x = p[g];
        if (qn(e.emitsOptions, x))
          continue;
        const C = t[x];
        if (u)
          if (q(i, x))
            C !== i[x] && (i[x] = C, d = !0);
          else {
            const F = He(x);
            o[F] = _s(
              u,
              c,
              F,
              C,
              e,
              !1
            );
          }
        else
          C !== i[x] && (i[x] = C, d = !0);
      }
    }
  } else {
    Ri(e, t, o, i) && (d = !0);
    let p;
    for (const g in c)
      (!t || // for camelCase
      !q(t, g) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((p = vt(g)) === g || !q(t, p))) && (u ? n && // for camelCase
      (n[g] !== void 0 || // for kebab-case
      n[p] !== void 0) && (o[g] = _s(
        u,
        c,
        g,
        void 0,
        e,
        !0
      )) : delete o[g]);
    if (i !== c)
      for (const g in i)
        (!t || !q(t, g)) && (delete i[g], d = !0);
  }
  d && lt(e.attrs, "set", "");
}
function Ri(e, t, n, s) {
  const [o, i] = e.propsOptions;
  let a = !1, c;
  if (t)
    for (let u in t) {
      if (Xt(u))
        continue;
      const d = t[u];
      let p;
      o && q(o, p = He(u)) ? !i || !i.includes(p) ? n[p] = d : (c || (c = {}))[p] = d : qn(e.emitsOptions, u) || (!(u in s) || d !== s[u]) && (s[u] = d, a = !0);
    }
  if (i) {
    const u = /* @__PURE__ */ B(n), d = c || Z;
    for (let p = 0; p < i.length; p++) {
      const g = i[p];
      n[g] = _s(
        o,
        u,
        g,
        d[g],
        e,
        !q(d, g)
      );
    }
  }
  return a;
}
function _s(e, t, n, s, o, i) {
  const a = e[n];
  if (a != null) {
    const c = q(a, "default");
    if (c && s === void 0) {
      const u = a.default;
      if (a.type !== Function && !a.skipFactory && D(u)) {
        const { propsDefaults: d } = o;
        if (n in d)
          s = d[n];
        else {
          const p = gn(o);
          s = d[n] = u.call(
            null,
            t
          ), p();
        }
      } else
        s = u;
      o.ce && o.ce._setProp(n, s);
    }
    a[
      0
      /* shouldCast */
    ] && (i && !c ? s = !1 : a[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === vt(n)) && (s = !0));
  }
  return s;
}
const wa = /* @__PURE__ */ new WeakMap();
function Pi(e, t, n = !1) {
  const s = n ? wa : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const i = e.props, a = {}, c = [];
  let u = !1;
  if (!D(e)) {
    const p = (g) => {
      u = !0;
      const [x, C] = Pi(g, t, !0);
      fe(a, x), C && c.push(...C);
    };
    !n && t.mixins.length && t.mixins.forEach(p), e.extends && p(e.extends), e.mixins && e.mixins.forEach(p);
  }
  if (!i && !u)
    return G(e) && s.set(e, Ot), Ot;
  if (O(i))
    for (let p = 0; p < i.length; p++) {
      const g = He(i[p]);
      oo(g) && (a[g] = Z);
    }
  else if (i)
    for (const p in i) {
      const g = He(p);
      if (oo(g)) {
        const x = i[p], C = a[g] = O(x) || D(x) ? { type: x } : fe({}, x), F = C.type;
        let P = !1, Q = !0;
        if (O(F))
          for (let I = 0; I < F.length; ++I) {
            const N = F[I], V = D(N) && N.name;
            if (V === "Boolean") {
              P = !0;
              break;
            } else V === "String" && (Q = !1);
          }
        else
          P = D(F) && F.name === "Boolean";
        C[
          0
          /* shouldCast */
        ] = P, C[
          1
          /* shouldCastTrue */
        ] = Q, (P || q(C, "default")) && c.push(g);
      }
    }
  const d = [a, c];
  return G(e) && s.set(e, d), d;
}
function oo(e) {
  return e[0] !== "$" && !Xt(e);
}
const Fs = (e) => e === "_" || e === "_ctx" || e === "$stable", Ls = (e) => O(e) ? e.map(Xe) : [Xe(e)], Sa = (e, t, n) => {
  if (t._n)
    return t;
  const s = li((...o) => Ls(t(...o)), n);
  return s._c = !1, s;
}, Mi = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (Fs(o)) continue;
    const i = e[o];
    if (D(i))
      t[o] = Sa(o, i, s);
    else if (i != null) {
      const a = Ls(i);
      t[o] = () => a;
    }
  }
}, Oi = (e, t) => {
  const n = Ls(t);
  e.slots.default = () => n;
}, $i = (e, t, n) => {
  for (const s in t)
    (n || !Fs(s)) && (e[s] = t[s]);
}, Ca = (e, t, n) => {
  const s = e.slots = ki();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? ($i(s, t, n), n && No(s, "_", o, !0)) : Mi(t, s);
  } else t && Oi(e, t);
}, Ta = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let i = !0, a = Z;
  if (s.shapeFlag & 32) {
    const c = t._;
    c ? n && c === 1 ? i = !1 : $i(o, t, n) : (i = !t.$stable, Mi(t, o)), a = t;
  } else t && (Oi(e, t), a = { default: 1 });
  if (i)
    for (const c in o)
      !Fs(c) && a[c] == null && delete o[c];
}, Re = Ra;
function Aa(e) {
  return Ea(e);
}
function Ea(e, t) {
  const n = Kn();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: o,
    patchProp: i,
    createElement: a,
    createText: c,
    createComment: u,
    setText: d,
    setElementText: p,
    parentNode: g,
    nextSibling: x,
    setScopeId: C = Qe,
    insertStaticContent: F
  } = e, P = (r, l, h, f = null, m = null, b = null, S = void 0, w = null, _ = !!l.dynamicChildren) => {
    if (r === l)
      return;
    r && !Tt(r, l) && (f = nt(r), De(r, m, b, !0), r = null), l.patchFlag === -2 && (_ = !1, l.dynamicChildren = null);
    const { type: y, ref: M, shapeFlag: T } = l;
    switch (y) {
      case Gn:
        Q(r, l, h, f);
        break;
      case Ae:
        I(r, l, h, f);
        break;
      case rs:
        r == null && N(l, h, f, S);
        break;
      case Te:
        A(
          r,
          l,
          h,
          f,
          m,
          b,
          S,
          w,
          _
        );
        break;
      default:
        T & 1 ? z(
          r,
          l,
          h,
          f,
          m,
          b,
          S,
          w,
          _
        ) : T & 6 ? Y(
          r,
          l,
          h,
          f,
          m,
          b,
          S,
          w,
          _
        ) : (T & 64 || T & 128) && y.process(
          r,
          l,
          h,
          f,
          m,
          b,
          S,
          w,
          _,
          xt
        );
    }
    M != null && m ? tn(M, r && r.ref, b, l || r, !l) : M == null && r && r.ref != null && tn(r.ref, null, b, r, !0);
  }, Q = (r, l, h, f) => {
    if (r == null)
      s(
        l.el = c(l.children),
        h,
        f
      );
    else {
      const m = l.el = r.el;
      l.children !== r.children && d(m, l.children);
    }
  }, I = (r, l, h, f) => {
    r == null ? s(
      l.el = u(l.children || ""),
      h,
      f
    ) : l.el = r.el;
  }, N = (r, l, h, f) => {
    [r.el, r.anchor] = F(
      r.children,
      l,
      h,
      f,
      r.el,
      r.anchor
    );
  }, V = ({ el: r, anchor: l }, h, f) => {
    let m;
    for (; r && r !== l; )
      m = x(r), s(r, h, f), r = m;
    s(l, h, f);
  }, k = ({ el: r, anchor: l }) => {
    let h;
    for (; r && r !== l; )
      h = x(r), o(r), r = h;
    o(l);
  }, z = (r, l, h, f, m, b, S, w, _) => {
    if (l.type === "svg" ? S = "svg" : l.type === "math" && (S = "mathml"), r == null)
      ae(
        l,
        h,
        f,
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
  }, ae = (r, l, h, f, m, b, S, w) => {
    let _, y;
    const { props: M, shapeFlag: T, transition: R, dirs: $ } = r;
    if (_ = r.el = a(
      r.type,
      b,
      M && M.is,
      M
    ), T & 8 ? p(_, r.children) : T & 16 && me(
      r.children,
      _,
      null,
      f,
      m,
      is(r, b),
      S,
      w
    ), $ && yt(r, null, f, "created"), pe(_, r, r.scopeId, S, f), M) {
      for (const X in M)
        X !== "value" && !Xt(X) && i(_, X, null, M[X], b, f);
      "value" in M && i(_, "value", null, M.value, b), (y = M.onVnodeBeforeMount) && qe(y, f, r);
    }
    $ && yt(r, null, f, "beforeMount");
    const K = ka(m, R);
    K && R.beforeEnter(_), s(_, l, h), ((y = M && M.onVnodeMounted) || K || $) && Re(() => {
      try {
        y && qe(y, f, r), K && R.enter(_), $ && yt(r, null, f, "mounted");
      } finally {
      }
    }, m);
  }, pe = (r, l, h, f, m) => {
    if (h && C(r, h), f)
      for (let b = 0; b < f.length; b++)
        C(r, f[b]);
    if (m) {
      let b = m.subTree;
      if (l === b || Ni(b.type) && (b.ssContent === l || b.ssFallback === l)) {
        const S = m.vnode;
        pe(
          r,
          S,
          S.scopeId,
          S.slotScopeIds,
          m.parent
        );
      }
    }
  }, me = (r, l, h, f, m, b, S, w, _ = 0) => {
    for (let y = _; y < r.length; y++) {
      const M = r[y] = w ? at(r[y]) : Xe(r[y]);
      P(
        null,
        M,
        l,
        h,
        f,
        m,
        b,
        S,
        w
      );
    }
  }, L = (r, l, h, f, m, b, S) => {
    const w = l.el = r.el;
    let { patchFlag: _, dynamicChildren: y, dirs: M } = l;
    _ |= r.patchFlag & 16;
    const T = r.props || Z, R = l.props || Z;
    let $;
    if (h && _t(h, !1), ($ = R.onVnodeBeforeUpdate) && qe($, h, l, r), M && yt(l, r, h, "beforeUpdate"), h && _t(h, !0), (T.innerHTML && R.innerHTML == null || T.textContent && R.textContent == null) && p(w, ""), y ? W(
      r.dynamicChildren,
      y,
      w,
      h,
      f,
      is(l, m),
      b
    ) : S || U(
      r,
      l,
      w,
      null,
      h,
      f,
      is(l, m),
      b,
      !1
    ), _ > 0) {
      if (_ & 16)
        ne(w, T, R, h, m);
      else if (_ & 2 && T.class !== R.class && i(w, "class", null, R.class, m), _ & 4 && i(w, "style", T.style, R.style, m), _ & 8) {
        const K = l.dynamicProps;
        for (let X = 0; X < K.length; X++) {
          const ee = K[X], le = T[ee], de = R[ee];
          (de !== le || ee === "value") && i(w, ee, le, de, m, h);
        }
      }
      _ & 1 && r.children !== l.children && p(w, l.children);
    } else !S && y == null && ne(w, T, R, h, m);
    (($ = R.onVnodeUpdated) || M) && Re(() => {
      $ && qe($, h, l, r), M && yt(l, r, h, "updated");
    }, f);
  }, W = (r, l, h, f, m, b, S) => {
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
      P(
        _,
        y,
        M,
        null,
        f,
        m,
        b,
        S,
        !0
      );
    }
  }, ne = (r, l, h, f, m) => {
    if (l !== h) {
      if (l !== Z)
        for (const b in l)
          !Xt(b) && !(b in h) && i(
            r,
            b,
            l[b],
            null,
            m,
            f
          );
      for (const b in h) {
        if (Xt(b)) continue;
        const S = h[b], w = l[b];
        S !== w && b !== "value" && i(r, b, w, S, m, f);
      }
      "value" in h && i(r, "value", l.value, h.value, m);
    }
  }, A = (r, l, h, f, m, b, S, w, _) => {
    const y = l.el = r ? r.el : c(""), M = l.anchor = r ? r.anchor : c("");
    let { patchFlag: T, dynamicChildren: R, slotScopeIds: $ } = l;
    $ && (w = w ? w.concat($) : $), r == null ? (s(y, h, f), s(M, h, f), me(
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
    )) : T > 0 && T & 64 && R && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    r.dynamicChildren && r.dynamicChildren.length === R.length ? (W(
      r.dynamicChildren,
      R,
      h,
      m,
      b,
      S,
      w
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (l.key != null || m && l === m.subTree) && Di(
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
  }, Y = (r, l, h, f, m, b, S, w, _) => {
    l.slotScopeIds = w, r == null ? l.shapeFlag & 512 ? m.ctx.activate(
      l,
      h,
      f,
      S,
      _
    ) : oe(
      l,
      h,
      f,
      m,
      b,
      S,
      _
    ) : ge(r, l, _);
  }, oe = (r, l, h, f, m, b, S) => {
    const w = r.component = Na(
      r,
      f,
      m
    );
    if (zn(r) && (w.ctx.renderer = xt), ja(w, !1, S), w.asyncDep) {
      if (m && m.registerDep(w, j, S), !r.el) {
        const _ = w.subTree = ue(Ae);
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
    const f = l.component = r.component;
    if (ba(r, l, h))
      if (f.asyncDep && !f.asyncResolved) {
        J(f, l, h);
        return;
      } else
        f.next = l, f.update();
    else
      l.el = r.el, f.vnode = l;
  }, j = (r, l, h, f, m, b, S) => {
    const w = () => {
      if (r.isMounted) {
        let { next: T, bu: R, u: $, parent: K, vnode: X } = r;
        {
          const ze = Fi(r);
          if (ze) {
            T && (T.el = X.el, J(r, T, S)), ze.asyncDep.then(() => {
              Re(() => {
                r.isUnmounted || y();
              }, m);
            });
            return;
          }
        }
        let ee = T, le;
        _t(r, !1), T ? (T.el = X.el, J(r, T, S)) : T = X, R && Sn(R), (le = T.props && T.props.onVnodeBeforeUpdate) && qe(le, K, T, X), _t(r, !0);
        const de = no(r), Be = r.subTree;
        r.subTree = de, P(
          Be,
          de,
          // parent may have changed if it's in a teleport
          g(Be.el),
          // anchor may have changed if it's in a fragment
          nt(Be),
          r,
          m,
          b
        ), T.el = de.el, ee === null && xa(r, de.el), $ && Re($, m), (le = T.props && T.props.onVnodeUpdated) && Re(
          () => qe(le, K, T, X),
          m
        );
      } else {
        let T;
        const { el: R, props: $ } = l, { bm: K, m: X, parent: ee, root: le, type: de } = r, Be = nn(l);
        _t(r, !1), K && Sn(K), !Be && (T = $ && $.onVnodeBeforeMount) && qe(T, ee, l), _t(r, !0);
        {
          le.ce && le.ce._hasShadowRoot() && le.ce._injectChildStyle(
            de,
            r.parent ? r.parent.type : void 0
          );
          const ze = r.subTree = no(r);
          P(
            null,
            ze,
            h,
            f,
            r,
            m,
            b
          ), l.el = ze.el;
        }
        if (X && Re(X, m), !Be && (T = $ && $.onVnodeMounted)) {
          const ze = l;
          Re(
            () => qe(T, ee, ze),
            m
          );
        }
        (l.shapeFlag & 256 || ee && nn(ee.vnode) && ee.vnode.shapeFlag & 256) && r.a && Re(r.a, m), r.isMounted = !0, l = h = f = null;
      }
    };
    r.scope.on();
    const _ = r.effect = new Ko(w);
    r.scope.off();
    const y = r.update = _.run.bind(_), M = r.job = _.runIfDirty.bind(_);
    M.i = r, M.id = r.uid, _.scheduler = () => Ds(M), _t(r, !0), y();
  }, J = (r, l, h) => {
    l.component = r;
    const f = r.vnode.props;
    r.vnode = l, r.next = null, _a(r, l.props, f, h), Ta(r, l.children, h), ut(), qs(r), ft();
  }, U = (r, l, h, f, m, b, S, w, _ = !1) => {
    const y = r && r.children, M = r ? r.shapeFlag : 0, T = l.children, { patchFlag: R, shapeFlag: $ } = l;
    if (R > 0) {
      if (R & 128) {
        It(
          y,
          T,
          h,
          f,
          m,
          b,
          S,
          w,
          _
        );
        return;
      } else if (R & 256) {
        tt(
          y,
          T,
          h,
          f,
          m,
          b,
          S,
          w,
          _
        );
        return;
      }
    }
    $ & 8 ? (M & 16 && bt(y, m, b), T !== y && p(h, T)) : M & 16 ? $ & 16 ? It(
      y,
      T,
      h,
      f,
      m,
      b,
      S,
      w,
      _
    ) : bt(y, m, b, !0) : (M & 8 && p(h, ""), $ & 16 && me(
      T,
      h,
      f,
      m,
      b,
      S,
      w,
      _
    ));
  }, tt = (r, l, h, f, m, b, S, w, _) => {
    r = r || Ot, l = l || Ot;
    const y = r.length, M = l.length, T = Math.min(y, M);
    let R;
    for (R = 0; R < T; R++) {
      const $ = l[R] = _ ? at(l[R]) : Xe(l[R]);
      P(
        r[R],
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
      f,
      m,
      b,
      S,
      w,
      _,
      T
    );
  }, It = (r, l, h, f, m, b, S, w, _) => {
    let y = 0;
    const M = l.length;
    let T = r.length - 1, R = M - 1;
    for (; y <= T && y <= R; ) {
      const $ = r[y], K = l[y] = _ ? at(l[y]) : Xe(l[y]);
      if (Tt($, K))
        P(
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
    for (; y <= T && y <= R; ) {
      const $ = r[T], K = l[R] = _ ? at(l[R]) : Xe(l[R]);
      if (Tt($, K))
        P(
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
      T--, R--;
    }
    if (y > T) {
      if (y <= R) {
        const $ = R + 1, K = $ < M ? l[$].el : f;
        for (; y <= R; )
          P(
            null,
            l[y] = _ ? at(l[y]) : Xe(l[y]),
            h,
            K,
            m,
            b,
            S,
            w,
            _
          ), y++;
      }
    } else if (y > R)
      for (; y <= T; )
        De(r[y], m, b, !0), y++;
    else {
      const $ = y, K = y, X = /* @__PURE__ */ new Map();
      for (y = K; y <= R; y++) {
        const Me = l[y] = _ ? at(l[y]) : Xe(l[y]);
        Me.key != null && X.set(Me.key, y);
      }
      let ee, le = 0;
      const de = R - K + 1;
      let Be = !1, ze = 0;
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
          for (ee = K; ee <= R; ee++)
            if (Ht[ee - K] === 0 && Tt(Me, l[ee])) {
              We = ee;
              break;
            }
        We === void 0 ? De(Me, m, b, !0) : (Ht[We - K] = y + 1, We >= ze ? ze = We : Be = !0, P(
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
      const Hs = Be ? Ia(Ht) : Ot;
      for (ee = Hs.length - 1, y = de - 1; y >= 0; y--) {
        const Me = K + y, We = l[Me], Vs = l[Me + 1], Ks = Me + 1 < M ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Vs.el || Li(Vs)
        ) : f;
        Ht[y] === 0 ? P(
          null,
          We,
          h,
          Ks,
          m,
          b,
          S,
          w,
          _
        ) : Be && (ee < 0 || y !== Hs[ee] ? ke(We, h, Ks, 2) : ee--);
      }
    }
  }, ke = (r, l, h, f, m = null) => {
    const { el: b, type: S, transition: w, children: _, shapeFlag: y } = r;
    if (y & 6) {
      ke(r.component.subTree, l, h, f);
      return;
    }
    if (y & 128) {
      r.suspense.move(l, h, f);
      return;
    }
    if (y & 64) {
      S.move(r, l, h, xt);
      return;
    }
    if (S === Te) {
      s(b, l, h);
      for (let T = 0; T < _.length; T++)
        ke(_[T], l, h, f);
      s(r.anchor, l, h);
      return;
    }
    if (S === rs) {
      V(r, l, h);
      return;
    }
    if (f !== 2 && y & 1 && w)
      if (f === 0)
        w.beforeEnter(b), s(b, l, h), Re(() => w.enter(b), m);
      else {
        const { leave: T, delayLeave: R, afterLeave: $ } = w, K = () => {
          r.ctx.isUnmounted ? o(b) : s(b, l, h);
        }, X = () => {
          b._isLeaving && b[Je](
            !0
            /* cancelled */
          ), T(b, () => {
            K(), $ && $();
          });
        };
        R ? R(b, K, X) : X();
      }
    else
      s(b, l, h);
  }, De = (r, l, h, f = !1, m = !1) => {
    const {
      type: b,
      props: S,
      ref: w,
      children: _,
      dynamicChildren: y,
      shapeFlag: M,
      patchFlag: T,
      dirs: R,
      cacheIndex: $,
      memo: K
    } = r;
    if (T === -2 && (m = !1), w != null && (ut(), tn(w, null, h, r, !0), ft()), $ != null && (l.renderCache[$] = void 0), M & 256) {
      l.ctx.deactivate(r);
      return;
    }
    const X = M & 1 && R, ee = !nn(r);
    let le;
    if (ee && (le = S && S.onVnodeBeforeUnmount) && qe(le, l, r), M & 6)
      bn(r.component, h, f);
    else {
      if (M & 128) {
        r.suspense.unmount(h, f);
        return;
      }
      X && yt(r, null, l, "beforeUnmount"), M & 64 ? r.type.remove(
        r,
        l,
        h,
        xt,
        f
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
      ) : (b === Te && T & 384 || !m && M & 16) && bt(_, l, h), f && vn(r);
    }
    const de = K != null && $ == null;
    (ee && (le = S && S.onVnodeUnmounted) || X || de) && Re(() => {
      le && qe(le, l, r), X && yt(r, null, l, "unmounted"), de && (r.el = null);
    }, h);
  }, vn = (r) => {
    const { type: l, el: h, anchor: f, transition: m } = r;
    if (l === Te) {
      Xn(h, f);
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
    const { bum: f, scope: m, job: b, subTree: S, um: w, m: _, a: y } = r;
    io(_), io(y), f && Sn(f), m.stop(), b && (b.flags |= 8, De(S, r, l, h)), w && Re(w, l), Re(() => {
      r.isUnmounted = !0;
    }, l);
  }, bt = (r, l, h, f = !1, m = !1, b = 0) => {
    for (let S = b; S < r.length; S++)
      De(r[S], l, h, f, m);
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
    let f;
    r == null ? l._vnode && (De(l._vnode, null, null, !0), f = l._vnode.component) : P(
      l._vnode || null,
      r,
      l,
      null,
      null,
      null,
      h
    ), l._vnode = r, st || (st = !0, qs(f), ii(), st = !1);
  }, xt = {
    p: P,
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
    createApp: pa(xn)
  };
}
function is({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function _t({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function ka(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Di(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (O(s) && O(o))
    for (let i = 0; i < s.length; i++) {
      const a = s[i];
      let c = o[i];
      c.shapeFlag & 1 && !c.dynamicChildren && ((c.patchFlag <= 0 || c.patchFlag === 32) && (c = o[i] = at(o[i]), c.el = a.el), !n && c.patchFlag !== -2 && Di(a, c)), c.type === Gn && (c.patchFlag === -1 && (c = o[i] = at(c)), c.el = a.el), c.type === Ae && !c.el && (c.el = a.el);
    }
}
function Ia(e) {
  const t = e.slice(), n = [0];
  let s, o, i, a, c;
  const u = e.length;
  for (s = 0; s < u; s++) {
    const d = e[s];
    if (d !== 0) {
      if (o = n[n.length - 1], e[o] < d) {
        t[s] = o, n.push(s);
        continue;
      }
      for (i = 0, a = n.length - 1; i < a; )
        c = i + a >> 1, e[n[c]] < d ? i = c + 1 : a = c;
      d < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, a = n[i - 1]; i-- > 0; )
    n[i] = a, a = t[a];
  return n;
}
function Fi(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Fi(t);
}
function io(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Li(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Li(t.subTree) : null;
}
const Ni = (e) => e.__isSuspense;
function Ra(e, t) {
  t && t.pendingBranch ? O(e) ? t.effects.push(...e) : t.effects.push(e) : jr(e);
}
const Te = /* @__PURE__ */ Symbol.for("v-fgt"), Gn = /* @__PURE__ */ Symbol.for("v-txt"), Ae = /* @__PURE__ */ Symbol.for("v-cmt"), rs = /* @__PURE__ */ Symbol.for("v-stc"), on = [];
let $e = null;
function be(e = !1) {
  on.push($e = e ? null : []);
}
function Pa() {
  on.pop(), $e = on[on.length - 1] || null;
}
let un = 1;
function Pn(e, t = !1) {
  un += e, e < 0 && $e && t && ($e.hasOnce = !0);
}
function ji(e) {
  return e.dynamicChildren = un > 0 ? $e || Ot : null, Pa(), un > 0 && $e && $e.push(e), e;
}
function we(e, t, n, s, o, i) {
  return ji(
    v(
      e,
      t,
      n,
      s,
      o,
      i,
      !0
    )
  );
}
function Ma(e, t, n, s, o) {
  return ji(
    ue(
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
const Hi = ({ key: e }) => e ?? null, Tn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ie(e) || /* @__PURE__ */ _e(e) || D(e) ? { i: Ne, r: e, k: t, f: !!n } : e : null);
function v(e, t = null, n = null, s = 0, o = null, i = e === Te ? 0 : 1, a = !1, c = !1) {
  const u = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Hi(t),
    ref: t && Tn(t),
    scopeId: ai,
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
    shapeFlag: i,
    patchFlag: s,
    dynamicProps: o,
    dynamicChildren: null,
    appContext: null,
    ctx: Ne
  };
  return c ? (Ns(u, n), i & 128 && e.normalize(u)) : n && (u.shapeFlag |= ie(n) ? 8 : 16), un > 0 && // avoid a block node from tracking itself
  !a && // has current parent block
  $e && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (u.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  u.patchFlag !== 32 && $e.push(u), u;
}
const ue = Oa;
function Oa(e, t = null, n = null, s = 0, o = null, i = !1) {
  if ((!e || e === oa) && (e = Ae), Mn(e)) {
    const c = gt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && Ns(c, n), un > 0 && !i && $e && (c.shapeFlag & 6 ? $e[$e.indexOf(e)] = c : $e.push(c)), c.patchFlag = -2, c;
  }
  if (Ua(e) && (e = e.__vccOpts), t) {
    t = $a(t);
    let { class: c, style: u } = t;
    c && !ie(c) && (t.class = Pe(c)), G(u) && (/* @__PURE__ */ $s(u) && !O(u) && (u = fe({}, u)), t.style = Es(u));
  }
  const a = ie(e) ? 1 : Ni(e) ? 128 : fi(e) ? 64 : G(e) ? 4 : D(e) ? 2 : 0;
  return v(
    e,
    t,
    n,
    s,
    o,
    a,
    i,
    !0
  );
}
function $a(e) {
  return e ? /* @__PURE__ */ $s(e) || Ii(e) ? fe({}, e) : e : null;
}
function gt(e, t, n = !1, s = !1) {
  const { props: o, ref: i, patchFlag: a, children: c, transition: u } = e, d = t ? Da(o || {}, t) : o, p = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && Hi(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? O(i) ? i.concat(Tn(t)) : [i, Tn(t)] : Tn(t)
    ) : i,
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
    patchFlag: t && e.type !== Te ? a === -1 ? 16 : a | 16 : a,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: u,
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
  return u && s && cn(
    p,
    u.clone(p)
  ), p;
}
function xe(e = " ", t = 0) {
  return ue(Gn, null, e, t);
}
function Gt(e = "", t = !1) {
  return t ? (be(), Ma(Ae, null, e)) : ue(Ae, null, e);
}
function Xe(e) {
  return e == null || typeof e == "boolean" ? ue(Ae) : O(e) ? ue(
    Te,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Mn(e) ? at(e) : ue(Gn, null, String(e));
}
function at(e) {
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
      !o && !Ii(t) ? t._ctx = Ne : o === 3 && Ne && (Ne.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else D(t) ? (t = { default: t, _ctx: Ne }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [xe(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Da(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = Pe([t.class, s.class]));
      else if (o === "style")
        t.style = Es([t.style, s.style]);
      else if (Ln(o)) {
        const i = t[o], a = s[o];
        a && i !== a && !(O(i) && i.includes(a)) ? t[o] = i ? [].concat(i, a) : a : a == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Nn(o) && (t[o] = a);
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
const Fa = Ci();
let La = 0;
function Na(e, t, n) {
  const s = e.type, o = (t ? t.appContext : e.appContext) || Fa, i = {
    uid: La++,
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
    scope: new lr(
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
    propsOptions: Pi(s, o),
    emitsOptions: Ti(s, o),
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = ha.bind(null, i), e.ce && e.ce(i), i;
}
let Ee = null;
const Vi = () => Ee || Ne;
let On, ws;
{
  const e = Kn(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (i) => {
      o.length > 1 ? o.forEach((a) => a(i)) : o[0](i);
    };
  };
  On = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ee = n
  ), ws = t(
    "__VUE_SSR_SETTERS__",
    (n) => fn = n
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
function Ki(e) {
  return e.vnode.shapeFlag & 4;
}
let fn = !1;
function ja(e, t = !1, n = !1) {
  t && ws(t);
  const { props: s, children: o } = e.vnode, i = Ki(e);
  ya(e, s, i, t), Ca(e, o, n || t);
  const a = i ? Ha(e, t) : void 0;
  return t && ws(!1), a;
}
function Ha(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ia);
  const { setup: s } = n;
  if (s) {
    ut();
    const o = e.setupContext = s.length > 1 ? Ka(e) : null, i = gn(e), a = mn(
      s,
      e,
      0,
      [
        e.props,
        o
      ]
    ), c = $o(a);
    if (ft(), i(), (c || e.sp) && !nn(e) && vi(e), c) {
      if (a.then(ro, ro), t)
        return a.then((u) => {
          ao(e, u);
        }).catch((u) => {
          Bn(u, e, 0);
        });
      e.asyncDep = a;
    } else
      ao(e, a);
  } else
    Ui(e);
}
function ao(e, t, n) {
  D(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : G(t) && (e.setupState = ni(t)), Ui(e);
}
function Ui(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Qe);
  {
    const o = gn(e);
    ut();
    try {
      ra(e);
    } finally {
      ft(), o();
    }
  }
}
const Va = {
  get(e, t) {
    return ye(e, "get", ""), e[t];
  }
};
function Ka(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, Va),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Jn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(ni(Ir(e.exposed)), {
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
function Ua(e) {
  return D(e) && "__vccOpts" in e;
}
const Jt = (e, t) => /* @__PURE__ */ $r(e, t, fn);
function re(e, t, n) {
  try {
    Pn(-1);
    const s = arguments.length;
    return s === 2 ? G(t) && !O(t) ? Mn(t) ? ue(e, null, [t]) : ue(e, t) : ue(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && Mn(n) && (n = [n]), ue(e, t, n));
  } finally {
    Pn(1);
  }
}
const Ba = "3.5.34";
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
const Bi = Ss ? (e) => Ss.createHTML(e) : (e) => e, za = "http://www.w3.org/2000/svg", Wa = "http://www.w3.org/1998/Math/MathML", rt = typeof document < "u" ? document : null, co = rt && /* @__PURE__ */ rt.createElement("template"), qa = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? rt.createElementNS(za, e) : t === "mathml" ? rt.createElementNS(Wa, e) : n ? rt.createElement(e, { is: n }) : rt.createElement(e);
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
  insertStaticContent(e, t, n, s, o, i) {
    const a = n ? n.previousSibling : t.lastChild;
    if (o && (o === i || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), n), !(o === i || !(o = o.nextSibling)); )
        ;
    else {
      co.innerHTML = Bi(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const c = co.content;
      if (s === "svg" || s === "mathml") {
        const u = c.firstChild;
        for (; u.firstChild; )
          c.appendChild(u.firstChild);
        c.removeChild(u);
      }
      t.insertBefore(c, n);
    }
    return [
      // first
      a ? a.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, ht = "transition", zt = "animation", pn = /* @__PURE__ */ Symbol("_vtc"), zi = {
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
}, Ga = /* @__PURE__ */ fe(
  {},
  pi,
  zi
), Ja = (e) => (e.displayName = "Transition", e.props = Ga, e), Ya = /* @__PURE__ */ Ja(
  (e, { slots: t }) => re(qr, Xa(e), t)
), wt = (e, t = []) => {
  O(e) ? e.forEach((n) => n(...t)) : e && e(...t);
}, uo = (e) => e ? O(e) ? e.some((t) => t.length > 1) : e.length > 1 : !1;
function Xa(e) {
  const t = {};
  for (const A in e)
    A in zi || (t[A] = e[A]);
  if (e.css === !1)
    return t;
  const {
    name: n = "v",
    type: s,
    duration: o,
    enterFromClass: i = `${n}-enter-from`,
    enterActiveClass: a = `${n}-enter-active`,
    enterToClass: c = `${n}-enter-to`,
    appearFromClass: u = i,
    appearActiveClass: d = a,
    appearToClass: p = c,
    leaveFromClass: g = `${n}-leave-from`,
    leaveActiveClass: x = `${n}-leave-active`,
    leaveToClass: C = `${n}-leave-to`
  } = e, F = Za(o), P = F && F[0], Q = F && F[1], {
    onBeforeEnter: I,
    onEnter: N,
    onEnterCancelled: V,
    onLeave: k,
    onLeaveCancelled: z,
    onBeforeAppear: ae = I,
    onAppear: pe = N,
    onAppearCancelled: me = V
  } = t, L = (A, Y, oe, ge) => {
    A._enterCancelled = ge, St(A, Y ? p : c), St(A, Y ? d : a), oe && oe();
  }, W = (A, Y) => {
    A._isLeaving = !1, St(A, g), St(A, C), St(A, x), Y && Y();
  }, ne = (A) => (Y, oe) => {
    const ge = A ? pe : N, j = () => L(Y, A, oe);
    wt(ge, [Y, j]), fo(() => {
      St(Y, A ? u : i), it(Y, A ? p : c), uo(ge) || po(Y, s, P, j);
    });
  };
  return fe(t, {
    onBeforeEnter(A) {
      wt(I, [A]), it(A, i), it(A, a);
    },
    onBeforeAppear(A) {
      wt(ae, [A]), it(A, u), it(A, d);
    },
    onEnter: ne(!1),
    onAppear: ne(!0),
    onLeave(A, Y) {
      A._isLeaving = !0;
      const oe = () => W(A, Y);
      it(A, g), A._enterCancelled ? (it(A, x), go(A)) : (go(A), it(A, x)), fo(() => {
        A._isLeaving && (St(A, g), it(A, C), uo(k) || po(A, s, Q, oe));
      }), wt(k, [A, oe]);
    },
    onEnterCancelled(A) {
      L(A, !1, void 0, !0), wt(V, [A]);
    },
    onAppearCancelled(A) {
      L(A, !0, void 0, !0), wt(me, [A]);
    },
    onLeaveCancelled(A) {
      W(A), wt(z, [A]);
    }
  });
}
function Za(e) {
  if (e == null)
    return null;
  if (G(e))
    return [as(e.enter), as(e.leave)];
  {
    const t = as(e);
    return [t, t];
  }
}
function as(e) {
  return Qi(e);
}
function it(e, t) {
  t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e[pn] || (e[pn] = /* @__PURE__ */ new Set())).add(t);
}
function St(e, t) {
  t.split(/\s+/).forEach((s) => s && e.classList.remove(s));
  const n = e[pn];
  n && (n.delete(t), n.size || (e[pn] = void 0));
}
function fo(e) {
  requestAnimationFrame(() => {
    requestAnimationFrame(e);
  });
}
let Qa = 0;
function po(e, t, n, s) {
  const o = e._endId = ++Qa, i = () => {
    o === e._endId && s();
  };
  if (n != null)
    return setTimeout(i, n);
  const { type: a, timeout: c, propCount: u } = el(e, t);
  if (!a)
    return s();
  const d = a + "end";
  let p = 0;
  const g = () => {
    e.removeEventListener(d, x), i();
  }, x = (C) => {
    C.target === e && ++p >= u && g();
  };
  setTimeout(() => {
    p < u && g();
  }, c + 1), e.addEventListener(d, x);
}
function el(e, t) {
  const n = window.getComputedStyle(e), s = (F) => (n[F] || "").split(", "), o = s(`${ht}Delay`), i = s(`${ht}Duration`), a = ho(o, i), c = s(`${zt}Delay`), u = s(`${zt}Duration`), d = ho(c, u);
  let p = null, g = 0, x = 0;
  t === ht ? a > 0 && (p = ht, g = a, x = i.length) : t === zt ? d > 0 && (p = zt, g = d, x = u.length) : (g = Math.max(a, d), p = g > 0 ? a > d ? ht : zt : null, x = p ? p === ht ? i.length : u.length : 0);
  const C = p === ht && /\b(?:transform|all)(?:,|$)/.test(
    s(`${ht}Property`).toString()
  );
  return {
    type: p,
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
function tl(e, t, n) {
  const s = e[pn];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const $n = /* @__PURE__ */ Symbol("_vod"), Wi = /* @__PURE__ */ Symbol("_vsh"), vo = {
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
  e.style.display = t ? e[$n] : "none", e[Wi] = !t;
}
const nl = /* @__PURE__ */ Symbol(""), sl = /(?:^|;)\s*display\s*:/;
function ol(e, t, n) {
  const s = e.style, o = ie(n);
  let i = !1;
  if (n && !o) {
    if (t)
      if (ie(t))
        for (const a of t.split(";")) {
          const c = a.slice(0, a.indexOf(":")).trim();
          n[c] == null && Yt(s, c, "");
        }
      else
        for (const a in t)
          n[a] == null && Yt(s, a, "");
    for (const a in n) {
      a === "display" && (i = !0);
      const c = n[a];
      c != null ? rl(
        e,
        a,
        !ie(t) && t ? t[a] : void 0,
        c
      ) || Yt(s, a, c) : Yt(s, a, "");
    }
  } else if (o) {
    if (t !== n) {
      const a = s[nl];
      a && (n += ";" + a), s.cssText = n, i = sl.test(n);
    }
  } else t && e.removeAttribute("style");
  $n in e && (e[$n] = i ? s.display : "", e[Wi] && (s.display = "none"));
}
const bo = /\s*!important$/;
function Yt(e, t, n) {
  if (O(n))
    n.forEach((s) => Yt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = il(e, t);
    bo.test(n) ? e.setProperty(
      vt(s),
      n.replace(bo, ""),
      "important"
    ) : e[s] = n;
  }
}
const xo = ["Webkit", "Moz", "ms"], ls = {};
function il(e, t) {
  const n = ls[t];
  if (n)
    return n;
  let s = He(t);
  if (s !== "filter" && s in e)
    return ls[t] = s;
  s = Lo(s);
  for (let o = 0; o < xo.length; o++) {
    const i = xo[o] + s;
    if (i in e)
      return ls[t] = i;
  }
  return t;
}
function rl(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && ie(s) && n === s;
}
const yo = "http://www.w3.org/1999/xlink";
function _o(e, t, n, s, o, i = ir(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(yo, t.slice(6, t.length)) : e.setAttributeNS(yo, t, n) : n == null || i && !jo(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : et(n) ? String(n) : n
  );
}
function wo(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? Bi(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const c = i === "OPTION" ? e.getAttribute("value") || "" : e.value, u = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (c !== u || !("_value" in e)) && (e.value = u), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let a = !1;
  if (n === "" || n == null) {
    const c = typeof e[t];
    c === "boolean" ? n = jo(n) : n == null && c === "string" ? (n = "", a = !0) : c === "number" && (n = 0, a = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  a && e.removeAttribute(o || t);
}
function At(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function al(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const So = /* @__PURE__ */ Symbol("_vei");
function ll(e, t, n, s, o = null) {
  const i = e[So] || (e[So] = {}), a = i[t];
  if (s && a)
    a.value = s;
  else {
    const [c, u] = cl(t);
    if (s) {
      const d = i[t] = pl(
        s,
        o
      );
      At(e, c, d, u);
    } else a && (al(e, c, a, u), i[t] = void 0);
  }
}
const Co = /(?:Once|Passive|Capture)$/;
function cl(e) {
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
function pl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    Ue(
      dl(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = fl(), n;
}
function dl(e, t) {
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
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, hl = (e, t, n, s, o, i) => {
  const a = o === "svg";
  t === "class" ? tl(e, s, a) : t === "style" ? ol(e, n, s) : Ln(t) ? Nn(t) || ll(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : ml(e, t, s, a)) ? (wo(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && _o(e, t, s, a, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (gl(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !ie(s))) ? wo(e, He(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), _o(e, t, s, a));
};
function ml(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && To(t) && D(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return To(t) && ie(n) ? !1 : t in e;
}
function gl(e, t) {
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
function vl(e) {
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
    const i = s || o.props && o.props.type === "number";
    At(e, t ? "change" : "input", (a) => {
      a.target.composing || e[Nt](Eo(e.value, n, i));
    }), (n || i) && At(e, "change", () => {
      e.value = Eo(e.value, n, i);
    }), t || (At(e, "compositionstart", vl), At(e, "compositionend", Ao), At(e, "change", Ao));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: i } }, a) {
    if (e[Nt] = Dn(a), e.composing) return;
    const c = (i || e.type === "number") && !/^0\d/.test(e.value) ? Vn(e.value) : e.value, u = t ?? "";
    if (c === u)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === u) || (e.value = u);
  }
}, ko = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const o = jn(t);
    At(e, "change", () => {
      const i = Array.prototype.filter.call(e.options, (a) => a.selected).map(
        (a) => n ? Vn(Fn(a)) : Fn(a)
      );
      e[Nt](
        e.multiple ? o ? new Set(i) : i : i[0]
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
    for (let o = 0, i = e.options.length; o < i; o++) {
      const a = e.options[o], c = Fn(a);
      if (n)
        if (s) {
          const u = typeof c;
          u === "string" || u === "number" ? a.selected = t.some((d) => String(d) === String(c)) : a.selected = ar(t, c) > -1;
        } else
          a.selected = t.has(c);
      else if (hn(Fn(a), t)) {
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
const bl = ["ctrl", "shift", "alt", "meta"], xl = {
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
  exact: (e, t) => bl.some((n) => e[`${n}Key`] && !t.includes(n))
}, se = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((o, ...i) => {
    for (let a = 0; a < t.length; a++) {
      const c = xl[t[a]];
      if (c && c(o, t)) return;
    }
    return e(o, ...i);
  }));
}, yl = {
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
    const i = vt(o.key);
    if (t.some(
      (a) => a === i || yl[a] === i
    ))
      return e(o);
  }));
}, _l = /* @__PURE__ */ fe({ patchProp: hl }, qa);
let Ro;
function wl() {
  return Ro || (Ro = Aa(_l));
}
const Sl = ((...e) => {
  const t = wl().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const o = Tl(s);
    if (!o) return;
    const i = t._component;
    !D(i) && !i.render && !i.template && (i.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const a = n(o, !1, Cl(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), a;
  }, t;
});
function Cl(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Tl(e) {
  return ie(e) ? document.querySelector(e) : e;
}
let Al = 1;
function Oe(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Le(e) {
  return `${e}-${Date.now().toString(36)}-${Al++}`;
}
function qi(e) {
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
function El(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function Yn(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function kl(e) {
  return Yn(e) === "悬念" ? "未解悬念" : "行动计划";
}
function Il(e) {
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
function Gi(e) {
  const t = qi(e), n = t.events[0] || {};
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
      value: El(o),
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
function Pl(e) {
  const t = qi(e.baseMeta), n = Oe(t);
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
    const u = String(c.name || "").trim(), d = String(c.desc || "").trim();
    u && d && (n.costumes[u] = d);
  }
  n.items = {};
  for (const c of e.itemRows || []) {
    const u = String(c.name || "").trim();
    u && (n.items[u] = {
      icon: String(c.icon || "").trim() || null,
      importance: c.importance || "",
      holder: String(c.holder || "").trim() || null,
      location: String(c.location || "").trim(),
      description: String(c.description || "").trim()
    });
  }
  n.affection = {};
  for (const c of e.affectionRows || []) {
    const u = String(c.name || "").trim();
    if (!u) continue;
    const d = Number.parseFloat(c.value);
    n.affection[u] = {
      type: "absolute",
      value: Number.isFinite(d) ? d : String(c.value || "").trim()
    };
  }
  n.relationships = [];
  for (const c of e.relationshipRows || []) {
    const u = String(c.from || "").trim(), d = String(c.to || "").trim(), p = String(c.type || "").trim(), g = String(c.note || "").trim();
    u && d && p && n.relationships.push({ from: u, to: d, type: p, note: g });
  }
  const s = String(e.event.summary || "").trim(), o = String(e.event.level || "").trim();
  n.events = s ? [{
    is_important: o === "重要" || o === "关键" || o === "關鍵",
    level: o || "一般",
    summary: s
  }] : [], delete n.event, n.agenda = [];
  for (const c of e.agendaRows || []) {
    const u = String(c.text || "").trim();
    u && n.agenda.push({
      type: Yn(c.type),
      date: String(c.date || "").trim(),
      text: u,
      source: c.source || "user",
      done: !!c.done
    });
  }
  const i = Array.isArray(e.deletedItemRows) ? e.deletedItemRows.map((c) => c == null ? void 0 : c.name) : t.deletedItems;
  n.deletedItems = [];
  const a = /* @__PURE__ */ new Set();
  for (const c of i || []) {
    const u = String(c || "").trim();
    !u || a.has(u) || (a.add(u), n.deletedItems.push(u));
  }
  return n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = Oe(t.npcs || {}), n.mood = Oe(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = Oe(t._rpgChanges)), t.tableContributions && (n.tableContributions = Oe(t.tableContributions)), n;
}
function Ml(e, t) {
  const n = Gi(t);
  for (const s of Object.keys(e)) delete e[s];
  Object.assign(e, n);
}
function Ol(e) {
  return Array.isArray(e) ? e.map((t) => String(t || "").trim()).filter(Boolean) : String(e || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}
const $l = { class: "toggle-left" }, Dl = { class: "toggle-icon" }, Fl = { class: "toggle-info" }, Ll = { class: "toggle-time" }, Nl = {
  key: 0,
  class: "horae-sideplay-badge"
}, jl = { class: "toggle-summary" }, Hl = { class: "toggle-actions" }, Vl = ["title"], Kl = ["title"], Ul = ["title", "disabled"], Bl = { class: "horae-panel-content" }, zl = { class: "neo-dashboard" }, Wl = { class: "neo-tags" }, ql = { class: "neo-chip" }, Gl = ["placeholder"], Jl = { class: "neo-chip" }, Yl = ["placeholder"], Xl = { class: "neo-chip" }, Zl = ["placeholder"], Ql = { class: "event-header" }, ec = { class: "event-badge" }, tc = { class: "action-group-hover" }, nc = { class: "view-mode" }, sc = { class: "event-body-text" }, oc = { value: "" }, ic = { value: "一般" }, rc = { value: "重要" }, ac = { value: "关键" }, lc = ["placeholder"], cc = { class: "neo-inset-section" }, uc = { class: "neo-section-header compact" }, fc = { class: "section-title" }, pc = { class: "aff-grid list-container" }, dc = ["onClick"], hc = { class: "view-mode" }, mc = { class: "t-title" }, gc = { class: "t-val" }, vc = ["onUpdate:modelValue", "placeholder", "onKeydown"], bc = ["onUpdate:modelValue", "placeholder", "onKeydown"], xc = { class: "neo-inset-section" }, yc = { class: "neo-section-header compact" }, _c = { class: "section-title" }, wc = { class: "rel-list list-container" }, Sc = ["onClick"], Cc = { class: "view-mode" }, Tc = { class: "rel-node" }, Ac = { class: "rel-node" }, Ec = { class: "rel-label" }, kc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Ic = ["onUpdate:modelValue", "placeholder", "onKeydown"], Rc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Pc = { class: "neo-inset-section" }, Mc = { class: "neo-section-header" }, Oc = { class: "section-title" }, $c = { class: "neo-item-list list-container" }, Dc = ["onClick"], Fc = { class: "view-mode" }, Lc = { class: "item-info" }, Nc = { class: "item-line-top" }, jc = { class: "item-title" }, Hc = { class: "item-emoji" }, Vc = { class: "item-name" }, Kc = {
  key: 0,
  class: "item-holder-badge"
}, Uc = {
  key: 0,
  class: "item-meta"
}, Bc = { class: "item-desc" }, zc = { class: "item-edit-line" }, Wc = ["onUpdate:modelValue", "onKeydown"], qc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Gc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Jc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Yc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Xc = ["aria-label"], Zc = ["title", "onClick"], Qc = { class: "neo-inset-section" }, eu = { class: "neo-section-header" }, tu = { class: "section-title" }, nu = { class: "neo-agenda-list list-container" }, su = ["onClick"], ou = { class: "view-mode" }, iu = { class: "agenda-date" }, ru = { class: "agenda-content" }, au = { class: "agenda-type" }, lu = { class: "agenda-text" }, cu = { class: "agenda-edit-line" }, uu = ["onUpdate:modelValue", "placeholder", "onKeydown"], fu = ["onUpdate:modelValue", "onKeydown"], pu = { value: "悬念" }, du = { value: "计划" }, hu = ["onUpdate:modelValue", "placeholder", "onKeydown"], mu = { class: "neo-footer-actions" }, gu = { class: "action-group" }, vu = ["disabled"], bu = ["disabled"], xu = { class: "action-group" }, yu = ["disabled"], _u = ["title"], us = 240, fs = 200, Po = "cubic-bezier(0.22, 1, 0.36, 1)", Mo = "cubic-bezier(0.4, 0, 1, 1)", wu = {
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
    }, o = Jt(() => ({ ...s, ...n.labels })).value, i = /* @__PURE__ */ Dt({ sideplayMode: !1, showPanel: !0, ...n.config }), a = n.adapter || {}, c = /* @__PURE__ */ Kt(null), u = /* @__PURE__ */ Dt(Gi(n.initialMeta)), d = /* @__PURE__ */ Kt(!0), p = /* @__PURE__ */ Kt(!1), g = /* @__PURE__ */ Kt(null), x = /* @__PURE__ */ Dt({ save: !1, scan: !1, ai: !1, sideplay: !1 }), C = /* @__PURE__ */ Kt((u.scene.characters_present || []).join(", "));
    en(
      () => u.scene.characters_present,
      (r) => {
        C.value = (r || []).join(", ");
      },
      { deep: !0 }
    ), en(
      () => [u.isSkipped, i.showPanel],
      ([r]) => {
        var l;
        (l = n.setHostState) == null || l.call(n, { isSkipped: !!r, visible: i.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const F = Jt(() => {
      if (u.isSkipped) return o.noTracking;
      const r = u.timestamp.story_date || "--", l = u.timestamp.story_time ? ` ${u.timestamp.story_time}` : "";
      return `${r}${l}`;
    }), P = Jt(() => {
      var h;
      if (u.isSkipped) return o.sideplayTitle;
      const r = u.event.summary || o.noSpecialEvents, l = ((h = u.scene.characters_present) == null ? void 0 : h.length) || 0;
      return l ? `${r} | ${l}${o.characters}` : r;
    }), Q = Jt(() => `${u.event.level || o.levelNormal}${o.event}`);
    function I() {
      p.value = !0;
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
    function z(r, l, h) {
      let f = !1;
      const m = () => {
        f || (f = !0, S(), r._horaePanelCleanup = null, l());
      }, b = (w) => {
        w.target === r && w.propertyName === "height" && m();
      }, S = () => {
        r.removeEventListener("transitionend", b), r._horaePanelTimer && window.clearTimeout(r._horaePanelTimer), r._horaePanelTimer = null;
      };
      r.addEventListener("transitionend", b), r._horaePanelTimer = window.setTimeout(m, h + 80), r._horaePanelCleanup = S;
    }
    function ae(r) {
      k(r), !V() && (r.style.height = "0px", r.style.opacity = "0", r.style.transform = "translateY(-6px)", r.style.overflow = "hidden", r.style.willChange = "height, opacity, transform");
    }
    function pe(r, l) {
      if (V()) {
        l();
        return;
      }
      r.style.transition = `height ${us}ms ${Po}, opacity 180ms ease-out, transform ${us}ms ${Po}`, requestAnimationFrame(() => {
        r.style.height = `${r.scrollHeight}px`, r.style.opacity = "1", r.style.transform = "translateY(0)";
      }), z(r, l, us);
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
      r.offsetHeight, r.style.transition = `height ${fs}ms ${Mo}, opacity 140ms ease-in, transform ${fs}ms ${Mo}`, requestAnimationFrame(() => {
        r.style.height = "0px", r.style.opacity = "0", r.style.transform = "translateY(-4px)";
      }), z(r, l, fs);
    }
    function ne(r) {
      k(r);
    }
    function A() {
      u.scene.characters_present = Ol(C.value), I();
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
      u[r].push(Rl(l)), g.value = null, I(), Mt(nt);
    }
    function U(r, l) {
      const h = u[r], f = h.findIndex((m) => m.id === l);
      f >= 0 && (h.splice(f, 1), g.value = null, I());
    }
    function tt(r) {
      const l = u.itemRows.findIndex((h) => h.id === r);
      l < 0 || (u.itemRows.splice(l, 1), g.value = null, I());
    }
    function It(r) {
      const l = u.deletedItemRows.findIndex((h) => h.id === r);
      l >= 0 && (u.deletedItemRows.splice(l, 1), g.value = null, I());
    }
    function ke(r) {
      Ml(u, r || {}), C.value = (u.scene.characters_present || []).join(", "), g.value = null, p.value = !1, Mt(nt);
    }
    async function De() {
      var r;
      x.save = !0;
      try {
        const l = Pl(u), h = await ((r = a.save) == null ? void 0 : r.call(a, l));
        h ? ke(h) : p.value = !1;
      } finally {
        x.save = !1;
      }
    }
    async function vn() {
      var r;
      x.scan = !0;
      try {
        const l = await ((r = a.quickScan) == null ? void 0 : r.call(a));
        l && ke(l);
      } finally {
        x.scan = !1;
      }
    }
    async function Xn() {
      var r;
      x.scan = !0;
      try {
        const l = await ((r = a.rescan) == null ? void 0 : r.call(a));
        l && ke(l);
      } finally {
        x.scan = !1;
      }
    }
    async function bn() {
      var r;
      x.ai = !0;
      try {
        const l = await ((r = a.aiAnalyze) == null ? void 0 : r.call(a));
        l && ke(l);
      } finally {
        x.ai = !1;
      }
    }
    async function bt() {
      var r;
      x.sideplay = !0;
      try {
        const l = await ((r = a.toggleSideplay) == null ? void 0 : r.call(a));
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
              onClick: (f) => f.stopPropagation()
            }, [
              re("input", {
                class: "neo-input short-key no-enter",
                value: h.name,
                placeholder: r.labels.role,
                onInput: (f) => {
                  h.name = f.target.value, l("dirty");
                },
                onKeydown: (f) => {
                  f.key === "Enter" && (f.preventDefault(), l("edit", h));
                }
              }),
              re("textarea", {
                class: "neo-textarea no-enter",
                value: h.desc,
                placeholder: r.labels.itemDesc,
                onInput: (f) => {
                  h.desc = f.target.value, l("dirty");
                },
                onKeydown: (f) => {
                  f.key === "Enter" && (f.preventDefault(), l("edit", h));
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
      Object.assign(i, { sideplayMode: !1, showPanel: !0, ...r || {} });
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
        v("div", $l, [
          v("div", Dl, [
            v("i", {
              class: Pe(["fa-regular", u.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          v("div", Fl, [
            v("div", Ll, [
              u.isSkipped ? (be(), we("span", Nl, H(E(o).sideplay), 1)) : Gt("", !0),
              xe(" " + H(F.value), 1)
            ]),
            v("div", jl, H(P.value), 1)
          ])
        ]),
        v("div", Hl, [
          ce(v("button", {
            class: "neo-btn-icon",
            title: E(o).sideplayTitle,
            onClick: se(bt, ["stop"])
          }, [
            v("i", {
              class: Pe(["fa-solid", u.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, Vl), [
            [vo, i.sideplayMode]
          ]),
          v("button", {
            class: "neo-btn-icon",
            title: E(o).rescan,
            onClick: se(Xn, ["stop"])
          }, [...l[21] || (l[21] = [
            v("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, Kl),
          v("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: E(o).aiAnalyze,
            disabled: x.ai,
            onClick: se(bn, ["stop"])
          }, [
            v("i", {
              class: Pe(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, Ul)
        ])
      ]),
      ue(Ya, {
        css: !1,
        onBeforeEnter: ae,
        onEnter: pe,
        onAfterEnter: me,
        onBeforeLeave: L,
        onLeave: W,
        onAfterLeave: ne
      }, {
        default: li(() => {
          var h;
          return [
            ce(v("div", Bl, [
              v("div", zl, [
                v("div", Wl, [
                  v("span", ql, [
                    l[22] || (l[22] = v("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[0] || (l[0] = (f) => u.scene.location = f),
                      class: "neo-chip-input",
                      placeholder: E(o).location,
                      onInput: I
                    }, null, 40, Gl), [
                      [ve, u.scene.location]
                    ])
                  ]),
                  v("span", Jl, [
                    l[23] || (l[23] = v("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[1] || (l[1] = (f) => u.scene.atmosphere = f),
                      class: "neo-chip-input",
                      placeholder: E(o).atmosphere,
                      onInput: I
                    }, null, 40, Yl), [
                      [ve, u.scene.atmosphere]
                    ])
                  ]),
                  v("span", Xl, [
                    l[24] || (l[24] = v("i", { class: "fa-solid fa-users" }, null, -1)),
                    ce(v("input", {
                      "onUpdate:modelValue": l[2] || (l[2] = (f) => C.value = f),
                      class: "neo-chip-input",
                      placeholder: E(o).characters,
                      onInput: A
                    }, null, 40, Zl), [
                      [ve, C.value]
                    ])
                  ])
                ]),
                v("div", {
                  class: Pe(["neo-event-card editable-block", { "is-editing": u.event.editing, "is-action-open": oe("event", u.event) }]),
                  onClick: l[8] || (l[8] = (f) => ge("event", u.event))
                }, [
                  v("div", Ql, [
                    v("span", ec, [
                      l[25] || (l[25] = v("i", { class: "fa-solid fa-bolt" }, null, -1)),
                      xe(" " + H(Q.value), 1)
                    ]),
                    v("div", tc, [
                      v("button", {
                        class: "action-hover-btn btn-edit",
                        onClick: l[3] || (l[3] = se((f) => j(u.event), ["stop"]))
                      }, [...l[26] || (l[26] = [
                        v("i", { class: "fa-solid fa-pen" }, null, -1)
                      ])])
                    ])
                  ]),
                  v("div", nc, [
                    v("div", sc, H(u.event.summary || E(o).noSpecialEvents), 1)
                  ]),
                  v("div", {
                    class: "edit-mode",
                    onClick: l[7] || (l[7] = se(() => {
                    }, ["stop"]))
                  }, [
                    ce(v("select", {
                      "onUpdate:modelValue": l[4] || (l[4] = (f) => u.event.level = f),
                      class: "neo-input event-level-select",
                      onChange: I
                    }, [
                      v("option", oc, H(E(o).levelNone), 1),
                      v("option", ic, H(E(o).levelNormal), 1),
                      v("option", rc, H(E(o).levelImportant), 1),
                      v("option", ac, H(E(o).levelCritical), 1)
                    ], 544), [
                      [ko, u.event.level]
                    ]),
                    ce(v("textarea", {
                      "onUpdate:modelValue": l[5] || (l[5] = (f) => u.event.summary = f),
                      class: "neo-textarea lg no-enter",
                      rows: "2",
                      placeholder: E(o).eventPlaceholder,
                      onInput: I,
                      onKeydown: l[6] || (l[6] = Ie(se((f) => j(u.event), ["prevent"]), ["enter"]))
                    }, null, 40, lc), [
                      [ve, u.event.summary]
                    ])
                  ])
                ], 2),
                v("section", cc, [
                  v("div", uc, [
                    v("span", fc, [
                      l[27] || (l[27] = v("i", { class: "fa-solid fa-heart" }, null, -1)),
                      xe(" " + H(E(o).affection), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[9] || (l[9] = (f) => J("affectionRows", "affection"))
                    }, [
                      l[28] || (l[28] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", pc, [
                    (be(!0), we(Te, null, Bt(u.affectionRows, (f) => (be(), we("div", {
                      key: f.id,
                      class: Pe(["aff-chip editable-block", { "is-editing": f.editing, "is-action-open": oe("affectionRows", f) }]),
                      onClick: (m) => ge("affectionRows", f)
                    }, [
                      v("div", hc, [
                        v("span", mc, H(f.name || E(o).role), 1),
                        v("span", gc, H(f.value || 0), 1)
                      ]),
                      v("div", {
                        class: "edit-mode",
                        onClick: l[10] || (l[10] = se(() => {
                        }, ["stop"]))
                      }, [
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.name = m,
                          class: "neo-input no-enter aff-name",
                          placeholder: E(o).role,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, vc), [
                          [ve, f.name]
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.value = m,
                          class: "neo-input no-enter aff-value",
                          placeholder: E(o).value,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, bc), [
                          [ve, f.value]
                        ])
                      ]),
                      ue(E(st), {
                        row: f,
                        onEdit: (m) => j(f),
                        onDelete: (m) => U("affectionRows", f.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, dc))), 128))
                  ])
                ]),
                v("section", xc, [
                  v("div", yc, [
                    v("span", _c, [
                      l[29] || (l[29] = v("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                      xe(" " + H(E(o).relationships), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[11] || (l[11] = (f) => J("relationshipRows", "relationship"))
                    }, [
                      l[30] || (l[30] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", wc, [
                    (be(!0), we(Te, null, Bt(u.relationshipRows, (f) => (be(), we("div", {
                      key: f.id,
                      class: Pe(["rel-row editable-block", { "is-editing": f.editing, "is-action-open": oe("relationshipRows", f) }]),
                      onClick: (m) => ge("relationshipRows", f)
                    }, [
                      v("div", Cc, [
                        v("span", Tc, H(f.from || E(o).role), 1),
                        l[31] || (l[31] = v("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                        v("span", Ac, H(f.to || E(o).role), 1),
                        v("span", Ec, H(f.type || E(o).relationshipHint), 1)
                      ]),
                      v("div", {
                        class: "edit-mode",
                        onClick: l[12] || (l[12] = se(() => {
                        }, ["stop"]))
                      }, [
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.from = m,
                          class: "neo-input no-enter rel-person",
                          placeholder: E(o).relFrom,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, kc), [
                          [ve, f.from]
                        ]),
                        l[32] || (l[32] = v("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.to = m,
                          class: "neo-input no-enter rel-person",
                          placeholder: E(o).relTo,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, Ic), [
                          [ve, f.to]
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.type = m,
                          class: "neo-input no-enter",
                          placeholder: E(o).relType,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, Rc), [
                          [ve, f.type]
                        ])
                      ]),
                      ue(E(st), {
                        row: f,
                        onEdit: (m) => j(f),
                        onDelete: (m) => U("relationshipRows", f.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, Sc))), 128))
                  ])
                ]),
                ue(E(xn), {
                  title: E(o).costumes,
                  icon: "fa-shirt",
                  rows: u.costumeRows,
                  labels: E(o),
                  onAdd: l[13] || (l[13] = (f) => J("costumeRows", "costume")),
                  onEdit: j,
                  onDelete: l[14] || (l[14] = (f) => U("costumeRows", f)),
                  onDirty: I
                }, null, 8, ["title", "rows", "labels"]),
                v("section", Pc, [
                  v("div", Mc, [
                    v("span", Oc, [
                      l[33] || (l[33] = v("i", { class: "fa-solid fa-box-open" }, null, -1)),
                      xe(" " + H(E(o).items), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[15] || (l[15] = (f) => J("itemRows", "item"))
                    }, [
                      l[34] || (l[34] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", $c, [
                    (be(!0), we(Te, null, Bt(u.itemRows, (f) => (be(), we("div", {
                      key: f.id,
                      class: Pe(["neo-item-card editable-block", { "is-editing": f.editing, "is-action-open": oe("itemRows", f) }]),
                      onClick: (m) => ge("itemRows", f)
                    }, [
                      v("div", Fc, [
                        v("div", Lc, [
                          v("div", Nc, [
                            v("span", jc, [
                              v("span", Hc, H(f.icon || "📦"), 1),
                              v("span", Vc, H(f.name || E(o).itemName), 1)
                            ]),
                            f.holder ? (be(), we("span", Kc, H(f.holder), 1)) : Gt("", !0)
                          ]),
                          f.location ? (be(), we("div", Uc, [
                            l[35] || (l[35] = v("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                            xe(" " + H(f.location), 1)
                          ])) : Gt("", !0),
                          v("div", Bc, H(f.description || E(o).itemDesc), 1)
                        ])
                      ]),
                      v("div", {
                        class: "edit-mode item-edit-mode",
                        onClick: l[16] || (l[16] = se(() => {
                        }, ["stop"]))
                      }, [
                        v("div", zc, [
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => f.icon = m,
                            class: "neo-input no-enter item-icon-input",
                            maxlength: "2",
                            placeholder: "📦",
                            onInput: I,
                            onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                          }, null, 40, Wc), [
                            [ve, f.icon]
                          ]),
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => f.name = m,
                            class: "neo-input no-enter",
                            placeholder: E(o).itemName,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                          }, null, 40, qc), [
                            [ve, f.name]
                          ]),
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => f.holder = m,
                            class: "neo-input no-enter item-holder-input",
                            placeholder: E(o).holder,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                          }, null, 40, Gc), [
                            [ve, f.holder]
                          ])
                        ]),
                        ce(v("input", {
                          "onUpdate:modelValue": (m) => f.location = m,
                          class: "neo-input no-enter",
                          placeholder: E(o).location,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, Jc), [
                          [ve, f.location]
                        ]),
                        ce(v("textarea", {
                          "onUpdate:modelValue": (m) => f.description = m,
                          class: "neo-textarea no-enter",
                          placeholder: E(o).itemDesc,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, Yc), [
                          [ve, f.description]
                        ])
                      ]),
                      ue(E(st), {
                        row: f,
                        "delete-icon": "fa-trash-can",
                        onEdit: (m) => j(f),
                        onDelete: (m) => tt(f.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, Dc))), 128))
                  ]),
                  (h = u.deletedItemRows) != null && h.length ? (be(), we("div", {
                    key: 0,
                    class: "deleted-items-zone",
                    "aria-label": E(o).deletedItems
                  }, [
                    (be(!0), we(Te, null, Bt(u.deletedItemRows, (f) => (be(), we("div", {
                      key: f.id,
                      class: "deleted-chip"
                    }, [
                      v("span", null, H(f.name), 1),
                      v("button", {
                        type: "button",
                        class: "action-hover-btn btn-del",
                        title: E(o).deleteForever,
                        onClick: se((m) => It(f.id), ["stop"])
                      }, [...l[36] || (l[36] = [
                        v("i", { class: "fa-solid fa-xmark" }, null, -1)
                      ])], 8, Zc)
                    ]))), 128))
                  ], 8, Xc)) : Gt("", !0)
                ]),
                v("section", Qc, [
                  v("div", eu, [
                    v("span", tu, [
                      l[37] || (l[37] = v("i", { class: "fa-solid fa-list-check" }, null, -1)),
                      xe(" " + H(E(o).agenda), 1)
                    ]),
                    v("button", {
                      class: "neo-text-btn add",
                      onClick: l[17] || (l[17] = (f) => J("agendaRows", "agenda"))
                    }, [
                      l[38] || (l[38] = v("i", { class: "fa-solid fa-plus" }, null, -1)),
                      xe(" " + H(E(o).add), 1)
                    ])
                  ]),
                  v("div", nu, [
                    (be(!0), we(Te, null, Bt(u.agendaRows, (f) => (be(), we("div", {
                      key: f.id,
                      class: Pe(["agenda-card editable-block", [E(Il)(f.type), { "is-editing": f.editing, "is-action-open": oe("agendaRows", f) }]]),
                      onClick: (m) => ge("agendaRows", f)
                    }, [
                      v("div", ou, [
                        v("div", iu, H(f.date || E(o).unscheduled), 1),
                        v("div", ru, [
                          v("span", au, H(E(kl)(f.type)), 1),
                          v("span", lu, H(f.text || E(o).agendaText), 1)
                        ])
                      ]),
                      v("div", {
                        class: "edit-mode agenda-edit-mode",
                        onClick: l[18] || (l[18] = se(() => {
                        }, ["stop"]))
                      }, [
                        v("div", cu, [
                          ce(v("input", {
                            "onUpdate:modelValue": (m) => f.date = m,
                            class: "neo-input no-enter agenda-date-input",
                            placeholder: E(o).date,
                            onInput: I,
                            onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                          }, null, 40, uu), [
                            [ve, f.date]
                          ]),
                          ce(v("select", {
                            "onUpdate:modelValue": (m) => f.type = m,
                            class: "neo-input no-enter",
                            onChange: I,
                            onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                          }, [
                            v("option", pu, H(E(o).agendaMystery), 1),
                            v("option", du, H(E(o).agendaPlan), 1)
                          ], 40, fu), [
                            [ko, f.type]
                          ])
                        ]),
                        ce(v("textarea", {
                          "onUpdate:modelValue": (m) => f.text = m,
                          class: "neo-textarea no-enter",
                          placeholder: E(o).agendaText,
                          onInput: I,
                          onKeydown: Ie(se((m) => j(f), ["prevent"]), ["enter"])
                        }, null, 40, hu), [
                          [ve, f.text]
                        ])
                      ]),
                      ue(E(st), {
                        row: f,
                        onEdit: (m) => j(f),
                        onDelete: (m) => U("agendaRows", f.id)
                      }, null, 8, ["row", "onEdit", "onDelete"])
                    ], 10, su))), 128))
                  ])
                ])
              ]),
              v("div", mu, [
                v("div", gu, [
                  v("button", {
                    class: "neo-btn-text",
                    disabled: x.scan,
                    onClick: vn
                  }, [
                    v("i", {
                      class: Pe(["fa-solid", x.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                    }, null, 2),
                    xe(" " + H(E(o).quickScan), 1)
                  ], 8, vu),
                  v("button", {
                    class: "neo-btn-text btn-ai-text",
                    disabled: x.ai,
                    onClick: bn
                  }, [
                    v("i", {
                      class: Pe(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                    }, null, 2),
                    xe(" " + H(E(o).aiAnalyze), 1)
                  ], 8, bu)
                ]),
                v("div", xu, [
                  v("button", {
                    class: "neo-btn-text btn-save-apply",
                    disabled: x.save,
                    onClick: De
                  }, [
                    v("i", {
                      class: Pe(["fa-solid", x.save ? "fa-spinner fa-spin" : "fa-check"])
                    }, null, 2),
                    xe(" " + H(E(o).apply), 1)
                  ], 8, yu),
                  v("button", {
                    class: "neo-btn-text",
                    onClick: l[19] || (l[19] = (f) => d.value = !0)
                  }, [
                    l[39] || (l[39] = v("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                    xe(" " + H(E(o).collapse), 1)
                  ]),
                  v("button", {
                    style: { display: "none" },
                    class: "neo-btn-text btn-drawer",
                    title: E(o).openDrawer,
                    onClick: l[20] || (l[20] = (f) => {
                      var m, b;
                      return (b = (m = E(a)).openDrawer) == null ? void 0 : b.call(m);
                    })
                  }, [...l[40] || (l[40] = [
                    v("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
                  ])], 8, _u)
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
}, Su = '.horae-message-panel.horae-message-panel-vue{background:#2b2d31!important;border:0!important;border-radius:20px!important;box-shadow:6px 6px 12px #0006,-4px -4px 10px #ffffff0d!important;color:#b5bac1!important;margin-top:10px!important;margin-bottom:18px!important;overflow:hidden!important;--mp-bg-base: #2b2d31;--mp-text-title: #e3e5e8;--mp-text-main: #b5bac1;--mp-text-muted: #80848e;--mp-accent: #a78bfa;--mp-danger: #fb7185;--mp-success: #34d399;--mp-warning: #fbbf24;--mp-info: #38bdf8;--mp-pink: #f472b6;--mp-light-shadow: rgba(255, 255, 255, .05);--mp-dark-shadow: rgba(0, 0, 0, .4);--mp-neo-drop: 6px 6px 12px var(--mp-dark-shadow), -4px -4px 10px var(--mp-light-shadow);--mp-neo-drop-sm: 4px 4px 8px var(--mp-dark-shadow), -2px -2px 6px var(--mp-light-shadow);--mp-neo-inset: inset 4px 4px 8px var(--mp-dark-shadow), inset -4px -4px 8px var(--mp-light-shadow);--mp-neo-inset-sm: inset 2px 2px 4px var(--mp-dark-shadow), inset -2px -2px 4px var(--mp-light-shadow);--mp-radius-md: 12px;--mp-radius-sm: 8px;--mp-radius-round: 50px;--mp-dashboard-height: 500px}.horae-message-panel.horae-message-panel-vue.horae-light{--mp-bg-base: #eef0f4;--mp-text-title: #20242c;--mp-text-main: #4a5160;--mp-text-muted: #767d8c;--mp-light-shadow: rgba(255, 255, 255, .95);--mp-dark-shadow: rgba(122, 132, 150, .28);color:var(--mp-text-main)!important}.horae-message-panel.horae-message-panel-vue.horae-sideplay{opacity:.72}.horae-message-panel-vue *,.horae-message-panel-vue *:before,.horae-message-panel-vue *:after{box-sizing:border-box}.horae-message-panel-vue button{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;box-shadow:none;text-shadow:none!important;font:inherit!important}.horae-message-panel-vue .horae-panel-top{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid rgba(255,255,255,.02);cursor:pointer;transition:background .2s;-webkit-user-select:none;user-select:none}.horae-message-panel-vue .horae-panel-top:hover{background:#ffffff05}.horae-message-panel-vue .toggle-left{flex:1;min-width:0;display:flex;align-items:center;gap:16px}.horae-message-panel-vue .toggle-icon{flex:0 0 auto;font-size:1.1rem;color:var(--mp-accent);display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;box-shadow:var(--mp-neo-drop)}.horae-message-panel-vue .toggle-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.horae-message-panel-vue .toggle-time{color:var(--mp-text-title);font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:8px}.horae-message-panel-vue .toggle-summary{color:var(--mp-text-muted);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.horae-message-panel-vue .toggle-actions{flex:0 0 auto;display:flex;gap:12px}.horae-message-panel-vue .neo-btn-icon{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;width:38px;height:38px;border-radius:50%!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0!important}.horae-message-panel-vue .neo-btn-icon:hover{color:var(--mp-accent)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-icon:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .neo-btn-icon:disabled,.horae-message-panel-vue .neo-btn-text:disabled{cursor:wait;opacity:.7}.horae-message-panel-vue .horae-panel-content{padding:16px 24px 24px;background:transparent!important;border-top:0!important;box-sizing:border-box;transform-origin:top;display:flex;flex-direction:column}.horae-message-panel-vue .neo-dashboard{display:flex;flex-direction:column;gap:24px;height:var(--mp-dashboard-height);flex:0 0 var(--mp-dashboard-height);min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:auto;scrollbar-gutter:stable;padding-right:4px;padding-bottom:16px}.horae-message-panel-vue .neo-dashboard{padding-right:10px;scrollbar-width:thin;scrollbar-color:#4A4D55 rgba(0,0,0,.16)}.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar{width:12px}.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-track{background:#00000029;border-radius:999px;box-shadow:var(--mp-neo-inset-sm)}.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#a78bfab8,#38bdf875);border:3px solid var(--mp-bg-base);border-radius:999px;box-shadow:0 0 0 1px #ffffff0a}.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#a78bfae6,#38bdf8a8)}.horae-message-panel-vue .neo-dashboard::-webkit-scrollbar-corner{background:transparent}.horae-message-panel.horae-message-panel-vue.horae-light .neo-dashboard{scrollbar-color:rgba(124,58,237,.52) rgba(122,132,150,.18)}.horae-message-panel.horae-message-panel-vue.horae-light .neo-dashboard::-webkit-scrollbar-track{background:#7a84962e}.horae-message-panel.horae-message-panel-vue.horae-light .neo-dashboard::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#7c3aed9e,#0ea5e97a);border-color:var(--mp-bg-base);box-shadow:0 0 0 1px #20242c0f}.horae-message-panel.horae-message-panel-vue.horae-light .neo-dashboard::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#7c3aedc7,#0ea5e99e)}.horae-message-panel-vue .neo-tags{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .neo-chip{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);padding:8px 16px;border-radius:var(--mp-radius-round);font-size:.9rem;display:inline-flex;align-items:center;gap:8px;min-width:min(100%,180px)}.horae-message-panel-vue .neo-chip i{color:var(--mp-accent);opacity:.85}.horae-message-panel-vue .neo-chip-input{width:100%;min-width:80px;background:transparent!important;border:none!important;box-shadow:none!important;color:var(--mp-text-main)!important;padding:0!important;font-size:.9rem!important;outline:none!important}.horae-message-panel-vue .neo-input,.horae-message-panel-vue .neo-textarea{width:100%;background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-title)!important;font-size:.95rem!important;box-shadow:var(--mp-neo-inset)!important;outline:none!important;border-radius:var(--mp-radius-sm)!important;font-family:inherit;transition:box-shadow .2s;line-height:1.5}.horae-message-panel-vue .neo-input{padding:8px 12px!important;height:36px}.horae-message-panel-vue .neo-textarea{padding:10px 14px!important;resize:vertical;min-height:42px;overflow:hidden}.horae-message-panel-vue .neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}.horae-message-panel-vue .neo-input:focus,.horae-message-panel-vue .neo-textarea:focus{box-shadow:var(--mp-neo-inset),0 0 0 1px var(--mp-warning)!important}.horae-message-panel-vue .neo-text-btn{background:transparent!important;border:none!important;color:var(--mp-text-muted)!important;cursor:pointer;font-size:.85rem!important;display:flex;align-items:center;gap:6px;font-weight:500;transition:color .2s;outline:none;padding:0!important}.horae-message-panel-vue .neo-text-btn:hover{color:var(--mp-text-title)!important}.horae-message-panel-vue .neo-text-btn.add:hover{color:var(--mp-accent)!important}.horae-message-panel-vue .neo-inset-section{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);border-radius:var(--mp-radius-md);padding:16px 20px}.horae-message-panel-vue .neo-section-header{margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.horae-message-panel-vue .neo-section-header.compact{margin-bottom:12px}.horae-message-panel-vue .section-title{font-size:.85rem;color:var(--mp-text-title);display:flex;align-items:center;gap:8px;font-weight:600;text-transform:uppercase}.horae-message-panel-vue .section-title i{color:var(--mp-accent);opacity:.9}.horae-message-panel-vue .action-group-hover{display:flex;gap:4px;opacity:0;transform:translate(6px);transition:all .2s ease;margin-left:auto;flex:0 0 auto;pointer-events:none}.horae-message-panel-vue .action-hover-btn{width:28px;height:28px;border-radius:50%!important;border:none!important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem!important;color:var(--mp-text-muted)!important;background:transparent!important;transition:all .2s ease;outline:none;padding:0!important}.horae-message-panel-vue .action-hover-btn.btn-edit:hover{background:#38bdf81a!important;color:var(--mp-info)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .action-hover-btn.btn-del:hover{background:#fb71851a!important;color:var(--mp-danger)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .is-editing .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .is-editing .btn-edit{color:var(--mp-success)!important}.horae-message-panel-vue .is-editing .btn-edit i:before{content:""}.horae-message-panel-vue .view-mode{display:flex;gap:10px;flex:1;min-width:0;align-items:flex-start}.horae-message-panel-vue .edit-mode{display:none;gap:10px;flex:1;min-width:0;align-items:flex-start;flex-wrap:wrap}.horae-message-panel-vue .is-editing .view-mode{display:none!important}.horae-message-panel-vue .is-editing .edit-mode{display:flex!important}.horae-message-panel-vue .neo-event-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop);border-radius:var(--mp-radius-md);padding:18px 20px;border-left:4px solid var(--mp-warning);position:relative}.horae-message-panel-vue .event-header{margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}.horae-message-panel-vue .event-badge{font-size:.85rem;color:var(--mp-warning);font-weight:600;display:flex;align-items:center;gap:6px}.horae-message-panel-vue .event-body-text{font-size:1.02rem;color:var(--mp-text-title);line-height:1.6;word-break:break-word}.horae-message-panel-vue .neo-event-card .action-group-hover{position:absolute;right:20px;top:16px;opacity:1}.horae-message-panel-vue .event-level-select{flex:0 0 110px}.horae-message-panel-vue .aff-grid{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .aff-chip{background:#ffffff05;border-radius:var(--mp-radius-sm);padding:6px 12px;display:inline-flex;align-items:center;transition:all .2s ease;position:relative;border:1px solid rgba(255,255,255,.03);min-height:38px}.horae-message-panel-vue .aff-chip:hover{background:#ffffff0a}.horae-message-panel-vue .aff-chip .view-mode{align-items:center;margin:0;gap:10px}.horae-message-panel-vue .aff-chip .t-title{font-weight:600;font-size:.9rem;color:var(--mp-text-title);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.horae-message-panel-vue .aff-chip .t-val{font-weight:700;font-size:.95rem;color:var(--mp-pink);font-family:monospace}.horae-message-panel-vue .aff-chip .edit-mode{align-items:center;gap:6px}.horae-message-panel-vue .aff-name{width:76px!important;min-width:76px}.horae-message-panel-vue .aff-value{width:58px!important;min-width:58px}.horae-message-panel-vue .aff-chip .action-group-hover{position:absolute;right:-8px;top:-14px;background:var(--mp-bg-base);border-radius:20px;box-shadow:var(--mp-neo-drop-sm);padding:2px 4px;z-index:10;margin:0}.horae-message-panel-vue .aff-chip.is-editing .action-group-hover{position:static;background:transparent;box-shadow:none;padding:0;margin-left:2px}.horae-message-panel-vue .rel-list,.horae-message-panel-vue .neo-dict-list,.horae-message-panel-vue .neo-item-list,.horae-message-panel-vue .neo-agenda-list{display:flex;flex-direction:column}.horae-message-panel-vue .rel-list{gap:4px}.horae-message-panel-vue .neo-dict-list{gap:6px}.horae-message-panel-vue .neo-item-list{gap:14px}.horae-message-panel-vue .neo-agenda-list{gap:12px}.horae-message-panel-vue .rel-row,.horae-message-panel-vue .neo-dict-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:var(--mp-radius-sm);transition:background .2s;position:relative}.horae-message-panel-vue .rel-row{align-items:center;padding-top:6px;padding-bottom:6px}.horae-message-panel-vue .rel-row:hover,.horae-message-panel-vue .neo-dict-row:hover{background:#ffffff05}.horae-message-panel-vue .rel-row .view-mode{align-items:center;gap:10px;font-size:.9rem;flex-wrap:wrap}.horae-message-panel-vue .rel-node{font-weight:600;color:var(--mp-text-title);background:#0003;padding:2px 8px;border-radius:4px}.horae-message-panel-vue .rel-arrow{color:var(--mp-accent);opacity:.7;font-size:.8rem}.horae-message-panel-vue .rel-label{color:var(--mp-text-main);font-style:italic}.horae-message-panel-vue .rel-person{width:82px!important;flex:0 0 82px!important}.horae-message-panel-vue .dict-view{align-items:flex-start}.horae-message-panel-vue .dict-key{color:var(--mp-accent);font-weight:600;white-space:nowrap;flex:0 0 auto;line-height:1.5}.horae-message-panel-vue .dict-key:after{content:":";color:var(--mp-text-muted);margin-left:2px}.horae-message-panel-vue .dict-value{color:var(--mp-text-main);line-height:1.5;word-break:break-word}.horae-message-panel-vue .dict-edit-mode{align-items:flex-start}.horae-message-panel-vue .short-key{width:100px!important;flex:0 0 100px!important}.horae-message-panel-vue .neo-item-card,.horae-message-panel-vue .agenda-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop-sm);border-radius:var(--mp-radius-sm);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;position:relative}.horae-message-panel-vue .item-emoji{display:inline-flex;align-items:center;flex:0 0 auto;font-size:1.25rem;line-height:1}.horae-message-panel-vue .item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-right:2px}.horae-message-panel-vue .item-line-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:600;color:var(--mp-text-title);font-size:1rem}.horae-message-panel-vue .item-title{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%}.horae-message-panel-vue .item-name{min-width:0;overflow-wrap:anywhere}.horae-message-panel-vue .item-holder-badge{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset-sm);color:var(--mp-accent);font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:400}.horae-message-panel-vue .item-meta{font-size:.8rem;color:var(--mp-text-muted)}.horae-message-panel-vue .item-desc{font-size:.9rem;color:var(--mp-text-main);line-height:1.4;word-break:break-word}.horae-message-panel-vue .item-edit-mode{flex-direction:column}.horae-message-panel-vue .item-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .item-icon-input{width:52px!important;flex:0 0 52px!important;text-align:center}.horae-message-panel-vue .item-holder-input{width:90px!important;flex:0 0 90px!important}.horae-message-panel-vue .deleted-items-zone{margin-top:10px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.05);display:flex;flex-wrap:wrap;gap:10px;align-items:center}.horae-message-panel-vue .deleted-chip{background:#00000026;box-shadow:var(--mp-neo-inset-sm);padding:2px 4px 2px 14px;border-radius:var(--mp-radius-round);font-size:.85rem;display:flex;align-items:center;gap:8px;transition:background .2s ease}.horae-message-panel-vue .deleted-chip:hover{background:#0000004d}.horae-message-panel-vue .deleted-chip span{color:var(--mp-text-muted);text-decoration:line-through;padding-bottom:2px;word-break:break-word}.horae-message-panel-vue .deleted-chip .action-hover-btn{width:24px;height:24px;flex:0 0 24px}.horae-message-panel-vue .agenda-card{border-left:3px solid var(--mp-text-muted)}.horae-message-panel-vue .agenda-card.type-suspense{border-left-color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-suspense .agenda-type{color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-plan{border-left-color:var(--mp-info)}.horae-message-panel-vue .agenda-card.type-plan .agenda-type{color:var(--mp-info)}.horae-message-panel-vue .agenda-date{font-size:.8rem;color:var(--mp-text-muted);white-space:nowrap;padding-top:2px;font-family:monospace;width:80px}.horae-message-panel-vue .agenda-content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.horae-message-panel-vue .agenda-type{font-size:.75rem;font-weight:600}.horae-message-panel-vue .agenda-text{font-size:.95rem;color:var(--mp-text-title);word-break:break-word}.horae-message-panel-vue .agenda-edit-mode{flex-direction:column}.horae-message-panel-vue .agenda-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .agenda-date-input{width:110px!important;flex:0 0 110px!important}.horae-message-panel-vue .neo-footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px;flex:0 0 auto}.horae-message-panel-vue .action-group{display:flex;gap:12px;align-items:center}.horae-message-panel-vue .neo-btn-text{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;padding:10px 20px!important;border-radius:var(--mp-radius-round)!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;font-size:.9rem!important;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .2s ease;outline:none;white-space:nowrap}.horae-message-panel-vue .neo-btn-text:hover{color:var(--mp-text-title)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-text:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .btn-ai-text{color:var(--mp-accent)!important}.horae-message-panel-vue .btn-save-apply{color:var(--mp-success)!important}.horae-message-panel-vue .btn-drawer{padding-left:13px!important;padding-right:13px!important}.horae-message-panel-vue .horae-sideplay-badge{background:var(--mp-text-muted);color:var(--mp-bg-base);font-size:10px;padding:1px 6px;border-radius:3px;font-weight:700}@media(max-width:768px){.horae-message-panel-vue .horae-panel-top{padding:10px 12px;gap:10px}.horae-message-panel-vue .horae-panel-content{padding:16px}.horae-message-panel-vue .toggle-left{gap:10px}.horae-message-panel-vue .toggle-icon{width:30px;height:30px;font-size:.92rem}.horae-message-panel-vue .toggle-info{gap:0;overflow:hidden}.horae-message-panel-vue .toggle-time{font-size:.92rem;line-height:1.2;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.horae-message-panel-vue .toggle-summary{display:none}.horae-message-panel-vue .toggle-actions{gap:6px}.horae-message-panel-vue .neo-btn-icon{width:30px;height:30px;font-size:.82rem!important}.horae-message-panel-vue .horae-sideplay-badge{font-size:9px;padding:1px 5px}.horae-message-panel-vue .dict-view,.horae-message-panel-vue .agenda-card .view-mode,.horae-message-panel-vue .agenda-card .edit-mode{flex-direction:column;gap:8px}.horae-message-panel-vue .dict-key:after{content:""}.horae-message-panel-vue .action-group-hover,.horae-message-panel-vue .neo-event-card .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:0;transform:translate(6px);pointer-events:none}.horae-message-panel-vue .editable-block.is-action-open>.action-group-hover,.horae-message-panel-vue .editable-block.is-action-open .event-header>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing .event-header>.action-group-hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .neo-footer-actions{flex-direction:column;align-items:stretch;gap:12px;margin-top:6px}.horae-message-panel-vue .action-group{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}.horae-message-panel-vue .neo-btn-text{width:100%;justify-content:center;padding:12px 10px!important;font-size:.85rem!important}.horae-message-panel-vue .btn-drawer{grid-column:1 / -1}}@media(prefers-reduced-motion:reduce){.horae-message-panel-vue .horae-panel-content{transition:none!important;transform:none!important}}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;max-width:none!important;margin:0!important;border:none!important;border-radius:var(--mp-radius-sm)!important;background:var(--mp-bg-base)!important;color:var(--mp-text-title)!important;font-family:inherit!important;font-size:.95rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:var(--mp-neo-inset)!important;text-shadow:none!important;outline:none!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input{height:36px!important;min-height:36px!important;padding:8px 12px!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:42px!important;padding:10px 14px!important;resize:vertical!important;overflow:hidden!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-chip-input{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;min-width:80px!important;margin:0!important;padding:0!important;border:none!important;border-radius:0!important;background:transparent!important;color:var(--mp-text-main)!important;font-family:inherit!important;font-size:.9rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .toggle-icon,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .toggle-icon i:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before{color:var(--mp-accent)!important;text-shadow:none!important}.horae-message-panel.horae-message-panel-vue .section-title i:before,.horae-message-panel.horae-message-panel-vue .neo-chip i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .section-title i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .neo-chip i:before{color:var(--mp-accent)!important;text-shadow:none!important}', Cu = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i, Tu = "/css/fontawesome.min.css";
function Au(e) {
  e.style.setProperty("margin-top", "10px", "important"), e.style.setProperty("margin-bottom", "18px", "important"), e.style.setProperty("padding", "0", "important"), e.style.setProperty("background", "transparent", "important"), e.style.setProperty("border", "0", "important"), e.style.setProperty("border-radius", "0", "important"), e.style.setProperty("box-shadow", "none", "important"), e.style.setProperty("overflow", "visible", "important"), e.style.setProperty("opacity", "1", "important"), e.style.setProperty("order", "9999", "important");
}
function Eu(e) {
  if (!e.querySelector("style[data-horae-message-panel-style]")) {
    const n = document.createElement("style");
    n.dataset.horaeMessagePanelStyle = "true", n.textContent = Su, e.append(n);
  }
  const t = /* @__PURE__ */ new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((n) => {
    Cu.test(n.href) && t.add(n.href);
  }), t.size || t.add(Tu), t.forEach((n) => {
    if (Array.from(e.querySelectorAll("link[data-horae-fontawesome]")).some((i) => i.href === n)) return;
    const o = document.createElement("link");
    o.dataset.horaeFontawesome = "true", o.rel = "stylesheet", o.href = n, e.append(o);
  });
}
function ku(e) {
  Au(e);
  const t = e.shadowRoot || e.attachShadow({ mode: "open" });
  t.textContent = "", Eu(t);
  const n = document.createElement("div");
  n.style.setProperty("margin-top", "0", "important"), n.style.setProperty("margin-bottom", "0", "important"), t.append(n);
  const s = () => {
    n.className = e.className, n.dataset.messageId = e.dataset.messageId || "";
  };
  s();
  const o = new MutationObserver(s);
  return o.observe(e, {
    attributes: !0,
    attributeFilter: ["class", "data-message-id"]
  }), { panelContainer: n, classObserver: o, syncPanelContainer: s };
}
function Iu(e, t = {}) {
  if (!e) return null;
  const { panelContainer: n, classObserver: s, syncPanelContainer: o } = ku(e), i = Sl(wu, {
    ...t,
    setHostState(u = {}) {
      var d;
      e.classList.toggle("horae-sideplay", !!u.isSkipped), typeof u.visible == "boolean" && (e.style.display = u.visible ? "" : "none"), o(), (d = t.setHostState) == null || d.call(t, u);
    }
  }), a = i.mount(n), c = new MutationObserver(() => {
    document.body.contains(e) || (i.unmount(), c.disconnect(), s.disconnect());
  });
  return c.observe(document.body, { childList: !0, subtree: !0 }), {
    unmount() {
      c.disconnect(), s.disconnect(), i.unmount();
    },
    updateMeta(u) {
      var d;
      (d = a == null ? void 0 : a.replaceMeta) == null || d.call(a, u);
    },
    updateConfig(u) {
      var d;
      (d = a == null ? void 0 : a.replaceConfig) == null || d.call(a, u);
    }
  };
}
export {
  Iu as mountMessagePanel
};
