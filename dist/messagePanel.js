/**
* @vue/shared v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function Ts(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const ee = {}, $t = [], nt = () => {
}, Oo = () => !1, Nn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), jn = (e) => e.startsWith("onUpdate:"), de = Object.assign, As = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ji = Object.prototype.hasOwnProperty, J = (e, t) => Ji.call(e, t), D = Array.isArray, Dt = (e) => hn(e) === "[object Map]", Hn = (e) => hn(e) === "[object Set]", Us = (e) => hn(e) === "[object Date]", L = (e) => typeof e == "function", ae = (e) => typeof e == "string", st = (e) => typeof e == "symbol", Y = (e) => e !== null && typeof e == "object", $o = (e) => (Y(e) || L(e)) && L(e.then) && L(e.catch), Do = Object.prototype.toString, hn = (e) => Do.call(e), Yi = (e) => hn(e).slice(8, -1), Fo = (e) => hn(e) === "[object Object]", Es = (e) => ae(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Zt = /* @__PURE__ */ Ts(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Vn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Xi = /-\w/g, Ue = Vn(
  (e) => e.replace(Xi, (t) => t.slice(1).toUpperCase())
), Zi = /\B([A-Z])/g, bt = Vn(
  (e) => e.replace(Zi, "-$1").toLowerCase()
), Lo = Vn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Qn = Vn(
  (e) => e ? `on${Lo(e)}` : ""
), tt = (e, t) => !Object.is(e, t), Sn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, No = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Kn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Qi = (e) => {
  const t = ae(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Bs;
const Un = () => Bs || (Bs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Ps(e) {
  if (D(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = ae(s) ? sr(s) : Ps(s);
      if (o)
        for (const i in o)
          t[i] = o[i];
    }
    return t;
  } else if (ae(e) || Y(e))
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
function Ie(e) {
  let t = "";
  if (ae(e))
    t = e;
  else if (D(e))
    for (let n = 0; n < e.length; n++) {
      const s = Ie(e[n]);
      s && (t += s + " ");
    }
  else if (Y(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const or = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ir = /* @__PURE__ */ Ts(or);
function jo(e) {
  return !!e || e === "";
}
function rr(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = mn(e[s], t[s]);
  return n;
}
function mn(e, t) {
  if (e === t) return !0;
  let n = Us(e), s = Us(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = st(e), s = st(t), n || s)
    return e === t;
  if (n = D(e), s = D(t), n || s)
    return n && s ? rr(e, t) : !1;
  if (n = Y(e), s = Y(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, i = Object.keys(t).length;
    if (o !== i)
      return !1;
    for (const a in e) {
      const l = e.hasOwnProperty(a), c = t.hasOwnProperty(a);
      if (l && !c || !l && c || !mn(e[a], t[a]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function ar(e, t) {
  return e.findIndex((n) => mn(n, t));
}
const Ho = (e) => !!(e && e.__v_isRef === !0), K = (e) => ae(e) ? e : e == null ? "" : D(e) || Y(e) && (e.toString === Do || !L(e.toString)) ? Ho(e) ? K(e.value) : JSON.stringify(e, Vo, 2) : String(e), Vo = (e, t) => Ho(t) ? Vo(e, t.value) : Dt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], i) => (n[es(s, i) + " =>"] = o, n),
    {}
  )
} : Hn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => es(n))
} : st(t) ? es(t) : Y(t) && !D(t) && !Fo(t) ? String(t) : t, es = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    st(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ge;
class lr {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ge && (ge.active ? (this.parent = ge, this.index = (ge.scopes || (ge.scopes = [])).push(
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
      const n = ge;
      try {
        return ge = this, t();
      } finally {
        ge = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ge, ge = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ge === this)
        ge = this.prevScope;
      else {
        let t = ge;
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
  return ge;
}
let se;
const ts = /* @__PURE__ */ new WeakSet();
class Ko {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ge && (ge.active ? ge.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, ts.has(this) && (ts.delete(this), this.trigger()));
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
    const t = se, n = Be;
    se = this, Be = !0;
    try {
      return this.fn();
    } finally {
      Wo(this), se = t, Be = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        ks(t);
      this.deps = this.depsTail = void 0, zs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? ts.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ds(this) && this.run();
  }
  get dirty() {
    return ds(this);
  }
}
let Uo = 0, Qt, en;
function Bo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = en, en = e;
    return;
  }
  e.next = Qt, Qt = e;
}
function Ms() {
  Uo++;
}
function Is() {
  if (--Uo > 0)
    return;
  if (en) {
    let t = en;
    for (en = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Qt; ) {
    let t = Qt;
    for (Qt = void 0; t; ) {
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
    s.version === -1 ? (s === n && (n = o), ks(s), ur(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function ds(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (qo(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function qo(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === an) || (e.globalVersion = an, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ds(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = se, s = Be;
  se = e, Be = !0;
  try {
    zo(e);
    const o = e.fn(e._value);
    (t.version === 0 || tt(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    se = n, Be = s, Wo(e), e.flags &= -3;
  }
}
function ks(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      ks(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function ur(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Be = !0;
const Go = [];
function ft() {
  Go.push(Be), Be = !1;
}
function pt() {
  const e = Go.pop();
  Be = e === void 0 ? !0 : e;
}
function zs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = se;
    se = void 0;
    try {
      t();
    } finally {
      se = n;
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
    if (!se || !Be || se === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== se)
      n = this.activeLink = new fr(se, this), se.deps ? (n.prevDep = se.depsTail, se.depsTail.nextDep = n, se.depsTail = n) : se.deps = se.depsTail = n, Jo(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = se.depsTail, n.nextDep = void 0, se.depsTail.nextDep = n, se.depsTail = n, se.deps === n && (se.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, an++, this.notify(t);
  }
  notify(t) {
    Ms();
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
const hs = /* @__PURE__ */ new WeakMap(), At = /* @__PURE__ */ Symbol(
  ""
), ms = /* @__PURE__ */ Symbol(
  ""
), ln = /* @__PURE__ */ Symbol(
  ""
);
function _e(e, t, n) {
  if (Be && se) {
    let s = hs.get(e);
    s || hs.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new Rs()), o.map = s, o.key = n), o.track();
  }
}
function ct(e, t, n, s, o, i) {
  const a = hs.get(e);
  if (!a) {
    an++;
    return;
  }
  const l = (c) => {
    c && c.trigger();
  };
  if (Ms(), t === "clear")
    a.forEach(l);
  else {
    const c = D(e), p = c && Es(n);
    if (c && n === "length") {
      const f = Number(s);
      a.forEach((h, x) => {
        (x === "length" || x === ln || !st(x) && x >= f) && l(h);
      });
    } else
      switch ((n !== void 0 || a.has(void 0)) && l(a.get(n)), p && l(a.get(ln)), t) {
        case "add":
          c ? p && l(a.get("length")) : (l(a.get(At)), Dt(e) && l(a.get(ms)));
          break;
        case "delete":
          c || (l(a.get(At)), Dt(e) && l(a.get(ms)));
          break;
        case "set":
          Dt(e) && l(a.get(At));
          break;
      }
  }
  Is();
}
function kt(e) {
  const t = /* @__PURE__ */ W(e);
  return t === e ? t : (_e(t, "iterate", ln), /* @__PURE__ */ He(e) ? t : t.map(ze));
}
function Bn(e) {
  return _e(e = /* @__PURE__ */ W(e), "iterate", ln), e;
}
function Qe(e, t) {
  return /* @__PURE__ */ dt(e) ? Ht(/* @__PURE__ */ Et(e) ? ze(t) : t) : ze(t);
}
const pr = {
  __proto__: null,
  [Symbol.iterator]() {
    return ns(this, Symbol.iterator, (e) => Qe(this, e));
  },
  concat(...e) {
    return kt(this).concat(
      ...e.map((t) => D(t) ? kt(t) : t)
    );
  },
  entries() {
    return ns(this, "entries", (e) => (e[1] = Qe(this, e[1]), e));
  },
  every(e, t) {
    return it(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return it(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Qe(this, s)),
      arguments
    );
  },
  find(e, t) {
    return it(
      this,
      "find",
      e,
      t,
      (n) => Qe(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return it(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return it(
      this,
      "findLast",
      e,
      t,
      (n) => Qe(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return it(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return it(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return ss(this, "includes", e);
  },
  indexOf(...e) {
    return ss(this, "indexOf", e);
  },
  join(e) {
    return kt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return ss(this, "lastIndexOf", e);
  },
  map(e, t) {
    return it(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Bt(this, "pop");
  },
  push(...e) {
    return Bt(this, "push", e);
  },
  reduce(e, ...t) {
    return Ws(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Ws(this, "reduceRight", e, t);
  },
  shift() {
    return Bt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return it(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Bt(this, "splice", e);
  },
  toReversed() {
    return kt(this).toReversed();
  },
  toSorted(e) {
    return kt(this).toSorted(e);
  },
  toSpliced(...e) {
    return kt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Bt(this, "unshift", e);
  },
  values() {
    return ns(this, "values", (e) => Qe(this, e));
  }
};
function ns(e, t, n) {
  const s = Bn(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ He(e) && (o._next = o.next, o.next = () => {
    const i = o._next();
    return i.done || (i.value = n(i.value)), i;
  }), o;
}
const dr = Array.prototype;
function it(e, t, n, s, o, i) {
  const a = Bn(e), l = a !== e && !/* @__PURE__ */ He(e), c = a[t];
  if (c !== dr[t]) {
    const h = c.apply(e, i);
    return l ? ze(h) : h;
  }
  let p = n;
  a !== e && (l ? p = function(h, x) {
    return n.call(this, Qe(e, h), x, e);
  } : n.length > 2 && (p = function(h, x) {
    return n.call(this, h, x, e);
  }));
  const f = c.call(a, p, s);
  return l && o ? o(f) : f;
}
function Ws(e, t, n, s) {
  const o = Bn(e), i = o !== e && !/* @__PURE__ */ He(e);
  let a = n, l = !1;
  o !== e && (i ? (l = s.length === 0, a = function(p, f, h) {
    return l && (l = !1, p = Qe(e, p)), n.call(this, p, Qe(e, f), h, e);
  }) : n.length > 3 && (a = function(p, f, h) {
    return n.call(this, p, f, h, e);
  }));
  const c = o[t](a, ...s);
  return l ? Qe(e, c) : c;
}
function ss(e, t, n) {
  const s = /* @__PURE__ */ W(e);
  _e(s, "iterate", ln);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ Ds(n[0]) ? (n[0] = /* @__PURE__ */ W(n[0]), s[t](...n)) : o;
}
function Bt(e, t, n = []) {
  ft(), Ms();
  const s = (/* @__PURE__ */ W(e))[t].apply(e, n);
  return Is(), pt(), s;
}
const hr = /* @__PURE__ */ Ts("__proto__,__v_isRef,__isVue"), Yo = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(st)
);
function mr(e) {
  st(e) || (e = String(e));
  const t = /* @__PURE__ */ W(this);
  return _e(t, "has", e), t.hasOwnProperty(e);
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
    const a = D(t);
    if (!o) {
      let c;
      if (a && (c = pr[n]))
        return c;
      if (n === "hasOwnProperty")
        return mr;
    }
    const l = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ we(t) ? t : s
    );
    if ((st(n) ? Yo.has(n) : hr(n)) || (o || _e(t, "get", n), i))
      return l;
    if (/* @__PURE__ */ we(l)) {
      const c = a && Es(n) ? l : l.value;
      return o && Y(c) ? /* @__PURE__ */ vs(c) : c;
    }
    return Y(l) ? o ? /* @__PURE__ */ vs(l) : /* @__PURE__ */ Ft(l) : l;
  }
}
class Zo extends Xo {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let i = t[n];
    const a = D(t) && Es(n);
    if (!this._isShallow) {
      const p = /* @__PURE__ */ dt(i);
      if (!/* @__PURE__ */ He(s) && !/* @__PURE__ */ dt(s) && (i = /* @__PURE__ */ W(i), s = /* @__PURE__ */ W(s)), !a && /* @__PURE__ */ we(i) && !/* @__PURE__ */ we(s))
        return p || (i.value = s), !0;
    }
    const l = a ? Number(n) < t.length : J(t, n), c = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ we(t) ? t : o
    );
    return t === /* @__PURE__ */ W(o) && (l ? tt(s, i) && ct(t, "set", n, s) : ct(t, "add", n, s)), c;
  }
  deleteProperty(t, n) {
    const s = J(t, n);
    t[n];
    const o = Reflect.deleteProperty(t, n);
    return o && s && ct(t, "delete", n, void 0), o;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!st(n) || !Yo.has(n)) && _e(t, "has", n), s;
  }
  ownKeys(t) {
    return _e(
      t,
      "iterate",
      D(t) ? "length" : At
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
const vr = /* @__PURE__ */ new Zo(), br = /* @__PURE__ */ new gr(), yr = /* @__PURE__ */ new Zo(!0);
const gs = (e) => e, yn = (e) => Reflect.getPrototypeOf(e);
function xr(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, i = /* @__PURE__ */ W(o), a = Dt(i), l = e === "entries" || e === Symbol.iterator && a, c = e === "keys" && a, p = o[e](...s), f = n ? gs : t ? Ht : ze;
    return !t && _e(
      i,
      "iterate",
      c ? ms : At
    ), de(
      // inheriting all iterator properties
      Object.create(p),
      {
        // iterator protocol
        next() {
          const { value: h, done: x } = p.next();
          return x ? { value: h, done: x } : {
            value: l ? [f(h[0]), f(h[1])] : f(h),
            done: x
          };
        }
      }
    );
  };
}
function xn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function _r(e, t) {
  const n = {
    get(o) {
      const i = this.__v_raw, a = /* @__PURE__ */ W(i), l = /* @__PURE__ */ W(o);
      e || (tt(o, l) && _e(a, "get", o), _e(a, "get", l));
      const { has: c } = yn(a), p = t ? gs : e ? Ht : ze;
      if (c.call(a, o))
        return p(i.get(o));
      if (c.call(a, l))
        return p(i.get(l));
      i !== a && i.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && _e(/* @__PURE__ */ W(o), "iterate", At), o.size;
    },
    has(o) {
      const i = this.__v_raw, a = /* @__PURE__ */ W(i), l = /* @__PURE__ */ W(o);
      return e || (tt(o, l) && _e(a, "has", o), _e(a, "has", l)), o === l ? i.has(o) : i.has(o) || i.has(l);
    },
    forEach(o, i) {
      const a = this, l = a.__v_raw, c = /* @__PURE__ */ W(l), p = t ? gs : e ? Ht : ze;
      return !e && _e(c, "iterate", At), l.forEach((f, h) => o.call(i, p(f), p(h), a));
    }
  };
  return de(
    n,
    e ? {
      add: xn("add"),
      set: xn("set"),
      delete: xn("delete"),
      clear: xn("clear")
    } : {
      add(o) {
        const i = /* @__PURE__ */ W(this), a = yn(i), l = /* @__PURE__ */ W(o), c = !t && !/* @__PURE__ */ He(o) && !/* @__PURE__ */ dt(o) ? l : o;
        return a.has.call(i, c) || tt(o, c) && a.has.call(i, o) || tt(l, c) && a.has.call(i, l) || (i.add(c), ct(i, "add", c, c)), this;
      },
      set(o, i) {
        !t && !/* @__PURE__ */ He(i) && !/* @__PURE__ */ dt(i) && (i = /* @__PURE__ */ W(i));
        const a = /* @__PURE__ */ W(this), { has: l, get: c } = yn(a);
        let p = l.call(a, o);
        p || (o = /* @__PURE__ */ W(o), p = l.call(a, o));
        const f = c.call(a, o);
        return a.set(o, i), p ? tt(i, f) && ct(a, "set", o, i) : ct(a, "add", o, i), this;
      },
      delete(o) {
        const i = /* @__PURE__ */ W(this), { has: a, get: l } = yn(i);
        let c = a.call(i, o);
        c || (o = /* @__PURE__ */ W(o), c = a.call(i, o)), l && l.call(i, o);
        const p = i.delete(o);
        return c && ct(i, "delete", o, void 0), p;
      },
      clear() {
        const o = /* @__PURE__ */ W(this), i = o.size !== 0, a = o.clear();
        return i && ct(
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
    n[o] = xr(o, e, t);
  }), n;
}
function Os(e, t) {
  const n = _r(e, t);
  return (s, o, i) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    J(n, o) && o in s ? n : s,
    o,
    i
  );
}
const wr = {
  get: /* @__PURE__ */ Os(!1, !1)
}, Sr = {
  get: /* @__PURE__ */ Os(!1, !0)
}, Cr = {
  get: /* @__PURE__ */ Os(!0, !1)
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
function Ft(e) {
  return /* @__PURE__ */ dt(e) ? e : $s(
    e,
    !1,
    vr,
    wr,
    Qo
  );
}
// @__NO_SIDE_EFFECTS__
function Pr(e) {
  return $s(
    e,
    !1,
    yr,
    Sr,
    ei
  );
}
// @__NO_SIDE_EFFECTS__
function vs(e) {
  return $s(
    e,
    !0,
    br,
    Cr,
    ti
  );
}
function $s(e, t, n, s, o) {
  if (!Y(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const i = Er(e);
  if (i === 0)
    return e;
  const a = o.get(e);
  if (a)
    return a;
  const l = new Proxy(
    e,
    i === 2 ? s : n
  );
  return o.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function Et(e) {
  return /* @__PURE__ */ dt(e) ? /* @__PURE__ */ Et(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function dt(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function He(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Ds(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function W(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ W(t) : e;
}
function Mr(e) {
  return !J(e, "__v_skip") && Object.isExtensible(e) && No(e, "__v_skip", !0), e;
}
const ze = (e) => Y(e) ? /* @__PURE__ */ Ft(e) : e, Ht = (e) => Y(e) ? /* @__PURE__ */ vs(e) : e;
// @__NO_SIDE_EFFECTS__
function we(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function zt(e) {
  return Ir(e, !1);
}
function Ir(e, t) {
  return /* @__PURE__ */ we(e) ? e : new kr(e, t);
}
class kr {
  constructor(t, n) {
    this.dep = new Rs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ W(t), this._value = n ? t : ze(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ He(t) || /* @__PURE__ */ dt(t);
    t = s ? t : /* @__PURE__ */ W(t), tt(t, n) && (this._rawValue = t, this._value = s ? t : ze(t), this.dep.trigger());
  }
}
function M(e) {
  return /* @__PURE__ */ we(e) ? e.value : e;
}
const Rr = {
  get: (e, t, n) => t === "__v_raw" ? e : M(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ we(o) && !/* @__PURE__ */ we(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function ni(e) {
  return /* @__PURE__ */ Et(e) ? e : new Proxy(e, Rr);
}
class Or {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new Rs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = an - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    se !== this)
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
  return L(e) ? s = e : (s = e.get, o = e.set), new Or(s, o, n);
}
const _n = {}, En = /* @__PURE__ */ new WeakMap();
let St;
function Dr(e, t = !1, n = St) {
  if (n) {
    let s = En.get(n);
    s || En.set(n, s = []), s.push(e);
  }
}
function Fr(e, t, n = ee) {
  const { immediate: s, deep: o, once: i, scheduler: a, augmentJob: l, call: c } = n, p = (I) => o ? I : /* @__PURE__ */ He(I) || o === !1 || o === 0 ? ut(I, 1) : ut(I);
  let f, h, x, A, N = !1, O = !1;
  if (/* @__PURE__ */ we(e) ? (h = () => e.value, N = /* @__PURE__ */ He(e)) : /* @__PURE__ */ Et(e) ? (h = () => p(e), N = !0) : D(e) ? (O = !0, N = e.some((I) => /* @__PURE__ */ Et(I) || /* @__PURE__ */ He(I)), h = () => e.map((I) => {
    if (/* @__PURE__ */ we(I))
      return I.value;
    if (/* @__PURE__ */ Et(I))
      return p(I);
    if (L(I))
      return c ? c(I, 2) : I();
  })) : L(e) ? t ? h = c ? () => c(e, 2) : e : h = () => {
    if (x) {
      ft();
      try {
        x();
      } finally {
        pt();
      }
    }
    const I = St;
    St = f;
    try {
      return c ? c(e, 3, [A]) : e(A);
    } finally {
      St = I;
    }
  } : h = nt, t && o) {
    const I = h, q = o === !0 ? 1 / 0 : o;
    h = () => ut(I(), q);
  }
  const te = cr(), R = () => {
    f.stop(), te && te.active && As(te.effects, f);
  };
  if (i && t) {
    const I = t;
    t = (...q) => {
      I(...q), R();
    };
  }
  let H = O ? new Array(e.length).fill(_n) : _n;
  const U = (I) => {
    if (!(!(f.flags & 1) || !f.dirty && !I))
      if (t) {
        const q = f.run();
        if (o || N || (O ? q.some((ce, he) => tt(ce, H[he])) : tt(q, H))) {
          x && x();
          const ce = St;
          St = f;
          try {
            const he = [
              q,
              // pass undefined as the old value when it's changed for the first time
              H === _n ? void 0 : O && H[0] === _n ? [] : H,
              A
            ];
            H = q, c ? c(t, 3, he) : (
              // @ts-expect-error
              t(...he)
            );
          } finally {
            St = ce;
          }
        }
      } else
        f.run();
  };
  return l && l(U), f = new Ko(h), f.scheduler = a ? () => a(U, !1) : U, A = (I) => Dr(I, !1, f), x = f.onStop = () => {
    const I = En.get(f);
    if (I) {
      if (c)
        c(I, 4);
      else
        for (const q of I) q();
      En.delete(f);
    }
  }, t ? s ? U(!0) : H = f.run() : a ? a(U.bind(null, !0), !0) : f.run(), R.pause = f.pause.bind(f), R.resume = f.resume.bind(f), R.stop = R, R;
}
function ut(e, t = 1 / 0, n) {
  if (t <= 0 || !Y(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ we(e))
    ut(e.value, t, n);
  else if (D(e))
    for (let s = 0; s < e.length; s++)
      ut(e[s], t, n);
  else if (Hn(e) || Dt(e))
    e.forEach((s) => {
      ut(s, t, n);
    });
  else if (Fo(e)) {
    for (const s in e)
      ut(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && ut(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function gn(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (o) {
    zn(o, t, n);
  }
}
function We(e, t, n, s) {
  if (L(e)) {
    const o = gn(e, t, n, s);
    return o && $o(o) && o.catch((i) => {
      zn(i, t, n);
    }), o;
  }
  if (D(e)) {
    const o = [];
    for (let i = 0; i < e.length; i++)
      o.push(We(e[i], t, n, s));
    return o;
  }
}
function zn(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: a } = t && t.appContext.config || ee;
  if (t) {
    let l = t.parent;
    const c = t.proxy, p = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; l; ) {
      const f = l.ec;
      if (f) {
        for (let h = 0; h < f.length; h++)
          if (f[h](e, c, p) === !1)
            return;
      }
      l = l.parent;
    }
    if (i) {
      ft(), gn(i, null, 10, [
        e,
        c,
        p
      ]), pt();
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
let Xe = -1;
const Lt = [];
let gt = null, Rt = 0;
const si = /* @__PURE__ */ Promise.resolve();
let Pn = null;
function Ot(e) {
  const t = Pn || si;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Nr(e) {
  let t = Xe + 1, n = Ce.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = Ce[s], i = cn(o);
    i < e || i === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Fs(e) {
  if (!(e.flags & 1)) {
    const t = cn(e), n = Ce[Ce.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= cn(n) ? Ce.push(e) : Ce.splice(Nr(t), 0, e), e.flags |= 1, oi();
  }
}
function oi() {
  Pn || (Pn = si.then(ri));
}
function jr(e) {
  D(e) ? Lt.push(...e) : gt && e.id === -1 ? gt.splice(Rt + 1, 0, e) : e.flags & 1 || (Lt.push(e), e.flags |= 1), oi();
}
function qs(e, t, n = Xe + 1) {
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
  if (Lt.length) {
    const t = [...new Set(Lt)].sort(
      (n, s) => cn(n) - cn(s)
    );
    if (Lt.length = 0, gt) {
      gt.push(...t);
      return;
    }
    for (gt = t, Rt = 0; Rt < gt.length; Rt++) {
      const n = gt[Rt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    gt = null, Rt = 0;
  }
}
const cn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function ri(e) {
  try {
    for (Xe = 0; Xe < Ce.length; Xe++) {
      const t = Ce[Xe];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), gn(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Xe < Ce.length; Xe++) {
      const t = Ce[Xe];
      t && (t.flags &= -2);
    }
    Xe = -1, Ce.length = 0, ii(), Pn = null, (Ce.length || Lt.length) && ri();
  }
}
let je = null, ai = null;
function Mn(e) {
  const t = je;
  return je = e, ai = e && e.type.__scopeId || null, t;
}
function li(e, t = je, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && Rn(-1);
    const i = Mn(t);
    let a;
    try {
      a = e(...o);
    } finally {
      Mn(i), s._d && Rn(1);
    }
    return a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function fe(e, t) {
  if (je === null)
    return e;
  const n = Yn(je), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [i, a, l, c = ee] = t[o];
    i && (L(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && ut(a), s.push({
      dir: i,
      instance: n,
      value: a,
      oldValue: void 0,
      arg: l,
      modifiers: c
    }));
  }
  return e;
}
function yt(e, t, n, s) {
  const o = e.dirs, i = t && t.dirs;
  for (let a = 0; a < o.length; a++) {
    const l = o[a];
    i && (l.oldValue = i[a].value);
    let c = l.dir[s];
    c && (ft(), We(c, n, 8, [
      e.el,
      l,
      e,
      t
    ]), pt());
  }
}
function Hr(e, t) {
  if (Ae) {
    let n = Ae.provides;
    const s = Ae.parent && Ae.parent.provides;
    s === n && (n = Ae.provides = Object.create(s)), n[e] = t;
  }
}
function Cn(e, t, n = !1) {
  const s = Vi();
  if (s || Nt) {
    let o = Nt ? Nt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && L(t) ? t.call(s && s.proxy) : t;
  }
}
const Vr = /* @__PURE__ */ Symbol.for("v-scx"), Kr = () => Cn(Vr);
function tn(e, t, n) {
  return ci(e, t, n);
}
function ci(e, t, n = ee) {
  const { immediate: s, deep: o, flush: i, once: a } = n, l = de({}, n), c = t && s || !t && i !== "post";
  let p;
  if (pn) {
    if (i === "sync") {
      const A = Kr();
      p = A.__watcherHandles || (A.__watcherHandles = []);
    } else if (!c) {
      const A = () => {
      };
      return A.stop = nt, A.resume = nt, A.pause = nt, A;
    }
  }
  const f = Ae;
  l.call = (A, N, O) => We(A, f, N, O);
  let h = !1;
  i === "post" ? l.scheduler = (A) => {
    Me(A, f && f.suspense);
  } : i !== "sync" && (h = !0, l.scheduler = (A, N) => {
    N ? A() : Fs(A);
  }), l.augmentJob = (A) => {
    t && (A.flags |= 4), h && (A.flags |= 2, f && (A.id = f.uid, A.i = f));
  };
  const x = Fr(e, t, l);
  return pn && (p ? p.push(x) : c && x()), x;
}
function Ur(e, t, n) {
  const s = this.proxy, o = ae(e) ? e.includes(".") ? ui(s, e) : () => s[e] : e.bind(s, s);
  let i;
  L(t) ? i = t : (i = t.handler, n = t);
  const a = vn(this), l = ci(o, i.bind(s), n);
  return a(), l;
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
const Br = /* @__PURE__ */ Symbol("_vte"), fi = (e) => e.__isTeleport, Ze = /* @__PURE__ */ Symbol("_leaveCb"), Wt = /* @__PURE__ */ Symbol("_enterCb");
function zr() {
  const e = {
    isMounted: !1,
    isLeaving: !1,
    isUnmounting: !1,
    leavingVNodes: /* @__PURE__ */ new Map()
  };
  return yi(() => {
    e.isMounted = !0;
  }), xi(() => {
    e.isUnmounting = !0;
  }), e;
}
const Le = [Function, Array], pi = {
  mode: String,
  appear: Boolean,
  persisted: Boolean,
  // enter
  onBeforeEnter: Le,
  onEnter: Le,
  onAfterEnter: Le,
  onEnterCancelled: Le,
  // leave
  onBeforeLeave: Le,
  onLeave: Le,
  onAfterLeave: Le,
  onLeaveCancelled: Le,
  // appear
  onBeforeAppear: Le,
  onAppear: Le,
  onAfterAppear: Le,
  onAppearCancelled: Le
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
        n.subTree ? An() : void 0
      );
      if (!i)
        return;
      const a = /* @__PURE__ */ W(e), { mode: l } = a;
      if (s.isLeaving)
        return os(i);
      const c = Gs(i);
      if (!c)
        return os(i);
      let p = bs(
        c,
        a,
        s,
        n,
        // #11061, ensure enterHooks is fresh after clone
        (h) => p = h
      );
      c.type !== Te && un(c, p);
      let f = n.subTree && Gs(n.subTree);
      if (f && f.type !== Te && !Ct(f, c) && di(n).type !== Te) {
        let h = bs(
          f,
          a,
          s,
          n
        );
        if (un(f, h), l === "out-in" && c.type !== Te)
          return s.isLeaving = !0, h.afterLeave = () => {
            s.isLeaving = !1, n.job.flags & 8 || n.update(), delete h.afterLeave, f = void 0;
          }, os(i);
        l === "in-out" && c.type !== Te ? h.delayLeave = (x, A, N) => {
          const O = mi(
            s,
            f
          );
          O[String(f.key)] = f, x[Ze] = () => {
            A(), x[Ze] = void 0, delete p.delayedLeave, f = void 0;
          }, p.delayedLeave = () => {
            N(), delete p.delayedLeave, f = void 0;
          };
        } : f = void 0;
      } else f && (f = void 0);
      return i;
    };
  }
};
function hi(e) {
  let t = e[0];
  if (e.length > 1) {
    for (const n of e)
      if (n.type !== Te) {
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
function bs(e, t, n, s, o) {
  const {
    appear: i,
    mode: a,
    persisted: l = !1,
    onBeforeEnter: c,
    onEnter: p,
    onAfterEnter: f,
    onEnterCancelled: h,
    onBeforeLeave: x,
    onLeave: A,
    onAfterLeave: N,
    onLeaveCancelled: O,
    onBeforeAppear: te,
    onAppear: R,
    onAfterAppear: H,
    onAppearCancelled: U
  } = t, I = String(e.key), q = mi(n, e), ce = (j, G) => {
    j && We(
      j,
      s,
      9,
      G
    );
  }, he = (j, G) => {
    const oe = G[1];
    ce(j, G), D(j) ? j.every((P) => P.length <= 1) && oe() : j.length <= 1 && oe();
  }, ve = {
    mode: a,
    persisted: l,
    beforeEnter(j) {
      let G = c;
      if (!n.isMounted)
        if (i)
          G = te || c;
        else
          return;
      j[Ze] && j[Ze](
        !0
        /* cancelled */
      );
      const oe = q[I];
      oe && Ct(e, oe) && oe.el[Ze] && oe.el[Ze](), ce(G, [j]);
    },
    enter(j) {
      if (q[I] === e) return;
      let G = p, oe = f, P = h;
      if (!n.isMounted)
        if (i)
          G = R || p, oe = H || f, P = U || h;
        else
          return;
      let Z = !1;
      j[Wt] = (be) => {
        Z || (Z = !0, be ? ce(P, [j]) : ce(oe, [j]), ve.delayedLeave && ve.delayedLeave(), j[Wt] = void 0);
      };
      const ie = j[Wt].bind(null, !1);
      G ? he(G, [j, ie]) : ie();
    },
    leave(j, G) {
      const oe = String(e.key);
      if (j[Wt] && j[Wt](
        !0
        /* cancelled */
      ), n.isUnmounting)
        return G();
      ce(x, [j]);
      let P = !1;
      j[Ze] = (ie) => {
        P || (P = !0, G(), ie ? ce(O, [j]) : ce(N, [j]), j[Ze] = void 0, q[oe] === e && delete q[oe]);
      };
      const Z = j[Ze].bind(null, !1);
      q[oe] = e, A ? he(A, [j, Z]) : Z();
    },
    clone(j) {
      const G = bs(
        j,
        t,
        n,
        s,
        o
      );
      return o && o(G), G;
    }
  };
  return ve;
}
function os(e) {
  if (Wn(e))
    return e = vt(e), e.children = null, e;
}
function Gs(e) {
  if (!Wn(e))
    return fi(e.type) && e.children ? hi(e.children) : e;
  if (e.component)
    return e.component.subTree;
  const { shapeFlag: t, children: n } = e;
  if (n) {
    if (t & 16)
      return n[0];
    if (t & 32 && L(n.default))
      return n.default();
  }
}
function un(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, un(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
function gi(e, t = !1, n) {
  let s = [], o = 0;
  for (let i = 0; i < e.length; i++) {
    let a = e[i];
    const l = n == null ? a.key : String(n) + String(a.key != null ? a.key : i);
    a.type === ke ? (a.patchFlag & 128 && o++, s = s.concat(
      gi(a.children, t, l)
    )) : (t || a.type !== Te) && s.push(l != null ? vt(a, { key: l }) : a);
  }
  if (o > 1)
    for (let i = 0; i < s.length; i++)
      s[i].patchFlag = -2;
  return s;
}
// @__NO_SIDE_EFFECTS__
function Js(e, t) {
  return L(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    de({ name: e.name }, t, { setup: e })
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
function nn(e, t, n, s, o = !1) {
  if (D(e)) {
    e.forEach(
      (O, te) => nn(
        O,
        t && (D(t) ? t[te] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (sn(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && nn(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Yn(s.component) : s.el, a = o ? null : i, { i: l, r: c } = e, p = t && t.r, f = l.refs === ee ? l.refs = {} : l.refs, h = l.setupState, x = /* @__PURE__ */ W(h), A = h === ee ? Oo : (O) => Ys(f, O) ? !1 : J(x, O), N = (O, te) => !(te && Ys(f, te));
  if (p != null && p !== c) {
    if (Xs(t), ae(p))
      f[p] = null, A(p) && (h[p] = null);
    else if (/* @__PURE__ */ we(p)) {
      const O = t;
      N(p, O.k) && (p.value = null), O.k && (f[O.k] = null);
    }
  }
  if (L(c))
    gn(c, l, 12, [a, f]);
  else {
    const O = ae(c), te = /* @__PURE__ */ we(c);
    if (O || te) {
      const R = () => {
        if (e.f) {
          const H = O ? A(c) ? h[c] : f[c] : N() || !e.k ? c.value : f[e.k];
          if (o)
            D(H) && As(H, i);
          else if (D(H))
            H.includes(i) || H.push(i);
          else if (O)
            f[c] = [i], A(c) && (h[c] = f[c]);
          else {
            const U = [i];
            N(c, e.k) && (c.value = U), e.k && (f[e.k] = U);
          }
        } else O ? (f[c] = a, A(c) && (h[c] = a)) : te && (N(c, e.k) && (c.value = a), e.k && (f[e.k] = a));
      };
      if (a) {
        const H = () => {
          R(), In.delete(e);
        };
        H.id = -1, In.set(e, H), Me(H, n);
      } else
        Xs(e), R();
    }
  }
}
function Xs(e) {
  const t = In.get(e);
  t && (t.flags |= 8, In.delete(e));
}
Un().requestIdleCallback;
Un().cancelIdleCallback;
const sn = (e) => !!e.type.__asyncLoader, Wn = (e) => e.type.__isKeepAlive;
function Gr(e, t) {
  bi(e, "a", t);
}
function Jr(e, t) {
  bi(e, "da", t);
}
function bi(e, t, n = Ae) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (qn(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      Wn(o.parent.vnode) && Yr(s, t, n, o), o = o.parent;
  }
}
function Yr(e, t, n, s) {
  const o = qn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  _i(() => {
    As(s[t], o);
  }, n);
}
function qn(e, t, n = Ae, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...a) => {
      ft();
      const l = vn(n), c = We(t, n, e, a);
      return l(), pt(), c;
    });
    return s ? o.unshift(i) : o.push(i), i;
  }
}
const ht = (e) => (t, n = Ae) => {
  (!pn || e === "sp") && qn(e, (...s) => t(...s), n);
}, Xr = ht("bm"), yi = ht("m"), Zr = ht(
  "bu"
), Qr = ht("u"), xi = ht(
  "bum"
), _i = ht("um"), ea = ht(
  "sp"
), ta = ht("rtg"), na = ht("rtc");
function sa(e, t = Ae) {
  qn("ec", e, t);
}
const oa = /* @__PURE__ */ Symbol.for("v-ndc");
function wn(e, t, n, s) {
  let o;
  const i = n, a = D(e);
  if (a || ae(e)) {
    const l = a && /* @__PURE__ */ Et(e);
    let c = !1, p = !1;
    l && (c = !/* @__PURE__ */ He(e), p = /* @__PURE__ */ dt(e), e = Bn(e)), o = new Array(e.length);
    for (let f = 0, h = e.length; f < h; f++)
      o[f] = t(
        c ? p ? Ht(ze(e[f])) : ze(e[f]) : e[f],
        f,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let l = 0; l < e; l++)
      o[l] = t(l + 1, l, void 0, i);
  } else if (Y(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (l, c) => t(l, c, void 0, i)
      );
    else {
      const l = Object.keys(e);
      o = new Array(l.length);
      for (let c = 0, p = l.length; c < p; c++) {
        const f = l[c];
        o[c] = t(e[f], f, c, i);
      }
    }
  else
    o = [];
  return o;
}
const ys = (e) => e ? Ki(e) ? Yn(e) : ys(e.parent) : null, on = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ de(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => ys(e.parent),
    $root: (e) => ys(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Si(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Fs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Ot.bind(e.proxy)),
    $watch: (e) => Ur.bind(e)
  })
), is = (e, t) => e !== ee && !e.__isScriptSetup && J(e, t), ia = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: i, accessCache: a, type: l, appContext: c } = e;
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
        if (is(s, t))
          return a[t] = 1, s[t];
        if (o !== ee && J(o, t))
          return a[t] = 2, o[t];
        if (J(i, t))
          return a[t] = 3, i[t];
        if (n !== ee && J(n, t))
          return a[t] = 4, n[t];
        xs && (a[t] = 0);
      }
    }
    const p = on[t];
    let f, h;
    if (p)
      return t === "$attrs" && _e(e.attrs, "get", ""), p(e);
    if (
      // css module (injected by vue-loader)
      (f = l.__cssModules) && (f = f[t])
    )
      return f;
    if (n !== ee && J(n, t))
      return a[t] = 4, n[t];
    if (
      // global properties
      h = c.config.globalProperties, J(h, t)
    )
      return h[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: i } = e;
    return is(o, t) ? (o[t] = n, !0) : s !== ee && J(s, t) ? (s[t] = n, !0) : J(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: i, type: a }
  }, l) {
    let c;
    return !!(n[l] || e !== ee && l[0] !== "$" && J(e, l) || is(t, l) || J(i, l) || J(s, l) || J(on, l) || J(o.config.globalProperties, l) || (c = a.__cssModules) && c[l]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : J(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Zs(e) {
  return D(e) ? e.reduce(
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
    watch: l,
    provide: c,
    inject: p,
    // lifecycle
    created: f,
    beforeMount: h,
    mounted: x,
    beforeUpdate: A,
    updated: N,
    activated: O,
    deactivated: te,
    beforeDestroy: R,
    beforeUnmount: H,
    destroyed: U,
    unmounted: I,
    render: q,
    renderTracked: ce,
    renderTriggered: he,
    errorCaptured: ve,
    serverPrefetch: j,
    // public API
    expose: G,
    inheritAttrs: oe,
    // assets
    components: P,
    directives: Z,
    filters: ie
  } = t;
  if (p && aa(p, s, null), a)
    for (const X in a) {
      const B = a[X];
      L(B) && (s[X] = B.bind(n));
    }
  if (o) {
    const X = o.call(n, n);
    Y(X) && (e.data = /* @__PURE__ */ Ft(X));
  }
  if (xs = !0, i)
    for (const X in i) {
      const B = i[X], Ee = L(B) ? B.bind(n, n) : L(B.get) ? B.get.bind(n, n) : nt, Pt = !L(B) && L(B.set) ? B.set.bind(n) : nt, ot = Yt({
        get: Ee,
        set: Pt
      });
      Object.defineProperty(s, X, {
        enumerable: !0,
        configurable: !0,
        get: () => ot.value,
        set: (Fe) => ot.value = Fe
      });
    }
  if (l)
    for (const X in l)
      wi(l[X], s, n, X);
  if (c) {
    const X = L(c) ? c.call(n) : c;
    Reflect.ownKeys(X).forEach((B) => {
      Hr(B, X[B]);
    });
  }
  f && Qs(f, e, "c");
  function V(X, B) {
    D(B) ? B.forEach((Ee) => X(Ee.bind(n))) : B && X(B.bind(n));
  }
  if (V(Xr, h), V(yi, x), V(Zr, A), V(Qr, N), V(Gr, O), V(Jr, te), V(sa, ve), V(na, ce), V(ta, he), V(xi, H), V(_i, I), V(ea, j), D(G))
    if (G.length) {
      const X = e.exposed || (e.exposed = {});
      G.forEach((B) => {
        Object.defineProperty(X, B, {
          get: () => n[B],
          set: (Ee) => n[B] = Ee,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  q && e.render === nt && (e.render = q), oe != null && (e.inheritAttrs = oe), P && (e.components = P), Z && (e.directives = Z), j && vi(e);
}
function aa(e, t, n = nt) {
  D(e) && (e = _s(e));
  for (const s in e) {
    const o = e[s];
    let i;
    Y(o) ? "default" in o ? i = Cn(
      o.from || s,
      o.default,
      !0
    ) : i = Cn(o.from || s) : i = Cn(o), /* @__PURE__ */ we(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (a) => i.value = a
    }) : t[s] = i;
  }
}
function Qs(e, t, n) {
  We(
    D(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function wi(e, t, n, s) {
  let o = s.includes(".") ? ui(n, s) : () => n[s];
  if (ae(e)) {
    const i = t[e];
    L(i) && tn(o, i);
  } else if (L(e))
    tn(o, e.bind(n));
  else if (Y(e))
    if (D(e))
      e.forEach((i) => wi(i, t, n, s));
    else {
      const i = L(e.handler) ? e.handler.bind(n) : t[e.handler];
      L(i) && tn(o, i, e);
    }
}
function Si(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: i,
    config: { optionMergeStrategies: a }
  } = e.appContext, l = i.get(t);
  let c;
  return l ? c = l : !o.length && !n && !s ? c = t : (c = {}, o.length && o.forEach(
    (p) => kn(c, p, a, !0)
  ), kn(c, t, a)), Y(t) && i.set(t, c), c;
}
function kn(e, t, n, s = !1) {
  const { mixins: o, extends: i } = t;
  i && kn(e, i, n, !0), o && o.forEach(
    (a) => kn(e, a, n, !0)
  );
  for (const a in t)
    if (!(s && a === "expose")) {
      const l = la[a] || n && n[a];
      e[a] = l ? l(e[a], t[a]) : t[a];
    }
  return e;
}
const la = {
  data: eo,
  props: to,
  emits: to,
  // objects
  methods: Jt,
  computed: Jt,
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
  components: Jt,
  directives: Jt,
  // watch
  watch: ua,
  // provide / inject
  provide: eo,
  inject: ca
};
function eo(e, t) {
  return t ? e ? function() {
    return de(
      L(e) ? e.call(this, this) : e,
      L(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function ca(e, t) {
  return Jt(_s(e), _s(t));
}
function _s(e) {
  if (D(e)) {
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
function Jt(e, t) {
  return e ? de(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function to(e, t) {
  return e ? D(e) && D(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : de(
    /* @__PURE__ */ Object.create(null),
    Zs(e),
    Zs(t ?? {})
  ) : t;
}
function ua(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = de(/* @__PURE__ */ Object.create(null), e);
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
    L(s) || (s = de({}, s)), o != null && !Y(o) && (o = null);
    const i = Ci(), a = /* @__PURE__ */ new WeakSet(), l = [];
    let c = !1;
    const p = i.app = {
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
      set config(f) {
      },
      use(f, ...h) {
        return a.has(f) || (f && L(f.install) ? (a.add(f), f.install(p, ...h)) : L(f) && (a.add(f), f(p, ...h))), p;
      },
      mixin(f) {
        return i.mixins.includes(f) || i.mixins.push(f), p;
      },
      component(f, h) {
        return h ? (i.components[f] = h, p) : i.components[f];
      },
      directive(f, h) {
        return h ? (i.directives[f] = h, p) : i.directives[f];
      },
      mount(f, h, x) {
        if (!c) {
          const A = p._ceVNode || pe(s, o);
          return A.appContext = i, x === !0 ? x = "svg" : x === !1 && (x = void 0), e(A, f, x), c = !0, p._container = f, f.__vue_app__ = p, Yn(A.component);
        }
      },
      onUnmount(f) {
        l.push(f);
      },
      unmount() {
        c && (We(
          l,
          p._instance,
          16
        ), e(null, p._container), delete p._container.__vue_app__);
      },
      provide(f, h) {
        return i.provides[f] = h, p;
      },
      runWithContext(f) {
        const h = Nt;
        Nt = p;
        try {
          return f();
        } finally {
          Nt = h;
        }
      }
    };
    return p;
  };
}
let Nt = null;
const da = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ue(t)}Modifiers`] || e[`${bt(t)}Modifiers`];
function ha(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || ee;
  let o = n;
  const i = t.startsWith("update:"), a = i && da(s, t.slice(7));
  a && (a.trim && (o = n.map((f) => ae(f) ? f.trim() : f)), a.number && (o = n.map(Kn)));
  let l, c = s[l = Qn(t)] || // also try camelCase event handler (#2249)
  s[l = Qn(Ue(t))];
  !c && i && (c = s[l = Qn(bt(t))]), c && We(
    c,
    e,
    6,
    o
  );
  const p = s[l + "Once"];
  if (p) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[l])
      return;
    e.emitted[l] = !0, We(
      p,
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
  let a = {}, l = !1;
  if (!L(e)) {
    const c = (p) => {
      const f = Ti(p, t, !0);
      f && (l = !0, de(a, f));
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  return !i && !l ? (Y(e) && s.set(e, null), null) : (D(i) ? i.forEach((c) => a[c] = null) : de(a, i), Y(e) && s.set(e, a), a);
}
function Gn(e, t) {
  return !e || !Nn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), J(e, t[0].toLowerCase() + t.slice(1)) || J(e, bt(t)) || J(e, t));
}
function no(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: o,
    propsOptions: [i],
    slots: a,
    attrs: l,
    emit: c,
    render: p,
    renderCache: f,
    props: h,
    data: x,
    setupState: A,
    ctx: N,
    inheritAttrs: O
  } = e, te = Mn(e);
  let R, H;
  try {
    if (n.shapeFlag & 4) {
      const I = o || s, q = I;
      R = et(
        p.call(
          q,
          I,
          f,
          h,
          A,
          x,
          N
        )
      ), H = l;
    } else {
      const I = t;
      R = et(
        I.length > 1 ? I(
          h,
          { attrs: l, slots: a, emit: c }
        ) : I(
          h,
          null
        )
      ), H = t.props ? l : ga(l);
    }
  } catch (I) {
    rn.length = 0, zn(I, e, 1), R = pe(Te);
  }
  let U = R;
  if (H && O !== !1) {
    const I = Object.keys(H), { shapeFlag: q } = U;
    I.length && q & 7 && (i && I.some(jn) && (H = va(
      H,
      i
    )), U = vt(U, H, !1, !0));
  }
  return n.dirs && (U = vt(U, null, !1, !0), U.dirs = U.dirs ? U.dirs.concat(n.dirs) : n.dirs), n.transition && un(U, n.transition), R = U, Mn(te), R;
}
const ga = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Nn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, va = (e, t) => {
  const n = {};
  for (const s in e)
    (!jn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function ba(e, t, n) {
  const { props: s, children: o, component: i } = e, { props: a, children: l, patchFlag: c } = t, p = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && c >= 0) {
    if (c & 1024)
      return !0;
    if (c & 16)
      return s ? so(s, a, p) : !!a;
    if (c & 8) {
      const f = t.dynamicProps;
      for (let h = 0; h < f.length; h++) {
        const x = f[h];
        if (Ai(a, s, x) && !Gn(p, x))
          return !0;
      }
    }
  } else
    return (o || l) && (!l || !l.$stable) ? !0 : s === a ? !1 : s ? a ? so(s, a, p) : !0 : !!a;
  return !1;
}
function so(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const i = s[o];
    if (Ai(t, e, i) && !Gn(n, i))
      return !0;
  }
  return !1;
}
function Ai(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && Y(s) && Y(o) ? !mn(s, o) : s !== o;
}
function ya({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const Ei = {}, Pi = () => Object.create(Ei), Mi = (e) => Object.getPrototypeOf(e) === Ei;
function xa(e, t, n, s = !1) {
  const o = {}, i = Pi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Ii(e, t, o, i);
  for (const a in e.propsOptions[0])
    a in o || (o[a] = void 0);
  n ? e.props = s ? o : /* @__PURE__ */ Pr(o) : e.type.props ? e.props = o : e.props = i, e.attrs = i;
}
function _a(e, t, n, s) {
  const {
    props: o,
    attrs: i,
    vnode: { patchFlag: a }
  } = e, l = /* @__PURE__ */ W(o), [c] = e.propsOptions;
  let p = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || a > 0) && !(a & 16)
  ) {
    if (a & 8) {
      const f = e.vnode.dynamicProps;
      for (let h = 0; h < f.length; h++) {
        let x = f[h];
        if (Gn(e.emitsOptions, x))
          continue;
        const A = t[x];
        if (c)
          if (J(i, x))
            A !== i[x] && (i[x] = A, p = !0);
          else {
            const N = Ue(x);
            o[N] = ws(
              c,
              l,
              N,
              A,
              e,
              !1
            );
          }
        else
          A !== i[x] && (i[x] = A, p = !0);
      }
    }
  } else {
    Ii(e, t, o, i) && (p = !0);
    let f;
    for (const h in l)
      (!t || // for camelCase
      !J(t, h) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((f = bt(h)) === h || !J(t, f))) && (c ? n && // for camelCase
      (n[h] !== void 0 || // for kebab-case
      n[f] !== void 0) && (o[h] = ws(
        c,
        l,
        h,
        void 0,
        e,
        !0
      )) : delete o[h]);
    if (i !== l)
      for (const h in i)
        (!t || !J(t, h)) && (delete i[h], p = !0);
  }
  p && ct(e.attrs, "set", "");
}
function Ii(e, t, n, s) {
  const [o, i] = e.propsOptions;
  let a = !1, l;
  if (t)
    for (let c in t) {
      if (Zt(c))
        continue;
      const p = t[c];
      let f;
      o && J(o, f = Ue(c)) ? !i || !i.includes(f) ? n[f] = p : (l || (l = {}))[f] = p : Gn(e.emitsOptions, c) || (!(c in s) || p !== s[c]) && (s[c] = p, a = !0);
    }
  if (i) {
    const c = /* @__PURE__ */ W(n), p = l || ee;
    for (let f = 0; f < i.length; f++) {
      const h = i[f];
      n[h] = ws(
        o,
        c,
        h,
        p[h],
        e,
        !J(p, h)
      );
    }
  }
  return a;
}
function ws(e, t, n, s, o, i) {
  const a = e[n];
  if (a != null) {
    const l = J(a, "default");
    if (l && s === void 0) {
      const c = a.default;
      if (a.type !== Function && !a.skipFactory && L(c)) {
        const { propsDefaults: p } = o;
        if (n in p)
          s = p[n];
        else {
          const f = vn(o);
          s = p[n] = c.call(
            null,
            t
          ), f();
        }
      } else
        s = c;
      o.ce && o.ce._setProp(n, s);
    }
    a[
      0
      /* shouldCast */
    ] && (i && !l ? s = !1 : a[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === bt(n)) && (s = !0));
  }
  return s;
}
const wa = /* @__PURE__ */ new WeakMap();
function ki(e, t, n = !1) {
  const s = n ? wa : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const i = e.props, a = {}, l = [];
  let c = !1;
  if (!L(e)) {
    const f = (h) => {
      c = !0;
      const [x, A] = ki(h, t, !0);
      de(a, x), A && l.push(...A);
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  if (!i && !c)
    return Y(e) && s.set(e, $t), $t;
  if (D(i))
    for (let f = 0; f < i.length; f++) {
      const h = Ue(i[f]);
      oo(h) && (a[h] = ee);
    }
  else if (i)
    for (const f in i) {
      const h = Ue(f);
      if (oo(h)) {
        const x = i[f], A = a[h] = D(x) || L(x) ? { type: x } : de({}, x), N = A.type;
        let O = !1, te = !0;
        if (D(N))
          for (let R = 0; R < N.length; ++R) {
            const H = N[R], U = L(H) && H.name;
            if (U === "Boolean") {
              O = !0;
              break;
            } else U === "String" && (te = !1);
          }
        else
          O = L(N) && N.name === "Boolean";
        A[
          0
          /* shouldCast */
        ] = O, A[
          1
          /* shouldCastTrue */
        ] = te, (O || J(A, "default")) && l.push(h);
      }
    }
  const p = [a, l];
  return Y(e) && s.set(e, p), p;
}
function oo(e) {
  return e[0] !== "$" && !Zt(e);
}
const Ls = (e) => e === "_" || e === "_ctx" || e === "$stable", Ns = (e) => D(e) ? e.map(et) : [et(e)], Sa = (e, t, n) => {
  if (t._n)
    return t;
  const s = li((...o) => Ns(t(...o)), n);
  return s._c = !1, s;
}, Ri = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (Ls(o)) continue;
    const i = e[o];
    if (L(i))
      t[o] = Sa(o, i, s);
    else if (i != null) {
      const a = Ns(i);
      t[o] = () => a;
    }
  }
}, Oi = (e, t) => {
  const n = Ns(t);
  e.slots.default = () => n;
}, $i = (e, t, n) => {
  for (const s in t)
    (n || !Ls(s)) && (e[s] = t[s]);
}, Ca = (e, t, n) => {
  const s = e.slots = Pi();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? ($i(s, t, n), n && No(s, "_", o, !0)) : Ri(t, s);
  } else t && Oi(e, t);
}, Ta = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let i = !0, a = ee;
  if (s.shapeFlag & 32) {
    const l = t._;
    l ? n && l === 1 ? i = !1 : $i(o, t, n) : (i = !t.$stable, Ri(t, o)), a = t;
  } else t && (Oi(e, t), a = { default: 1 });
  if (i)
    for (const l in o)
      !Ls(l) && a[l] == null && delete o[l];
}, Me = Ia;
function Aa(e) {
  return Ea(e);
}
function Ea(e, t) {
  const n = Un();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: o,
    patchProp: i,
    createElement: a,
    createText: l,
    createComment: c,
    setText: p,
    setElementText: f,
    parentNode: h,
    nextSibling: x,
    setScopeId: A = nt,
    insertStaticContent: N
  } = e, O = (r, u, m, _ = null, b = null, y = null, T = void 0, C = null, S = !!u.dynamicChildren) => {
    if (r === u)
      return;
    r && !Ct(r, u) && (_ = It(r), Fe(r, b, y, !0), r = null), u.patchFlag === -2 && (S = !1, u.dynamicChildren = null);
    const { type: w, ref: $, shapeFlag: E } = u;
    switch (w) {
      case Jn:
        te(r, u, m, _);
        break;
      case Te:
        R(r, u, m, _);
        break;
      case as:
        r == null && H(u, m, _, T);
        break;
      case ke:
        P(
          r,
          u,
          m,
          _,
          b,
          y,
          T,
          C,
          S
        );
        break;
      default:
        E & 1 ? q(
          r,
          u,
          m,
          _,
          b,
          y,
          T,
          C,
          S
        ) : E & 6 ? Z(
          r,
          u,
          m,
          _,
          b,
          y,
          T,
          C,
          S
        ) : (E & 64 || E & 128) && w.process(
          r,
          u,
          m,
          _,
          b,
          y,
          T,
          C,
          S,
          v
        );
    }
    $ != null && b ? nn($, r && r.ref, y, u || r, !u) : $ == null && r && r.ref != null && nn(r.ref, null, y, r, !0);
  }, te = (r, u, m, _) => {
    if (r == null)
      s(
        u.el = l(u.children),
        m,
        _
      );
    else {
      const b = u.el = r.el;
      u.children !== r.children && p(b, u.children);
    }
  }, R = (r, u, m, _) => {
    r == null ? s(
      u.el = c(u.children || ""),
      m,
      _
    ) : u.el = r.el;
  }, H = (r, u, m, _) => {
    [r.el, r.anchor] = N(
      r.children,
      u,
      m,
      _,
      r.el,
      r.anchor
    );
  }, U = ({ el: r, anchor: u }, m, _) => {
    let b;
    for (; r && r !== u; )
      b = x(r), s(r, m, _), r = b;
    s(u, m, _);
  }, I = ({ el: r, anchor: u }) => {
    let m;
    for (; r && r !== u; )
      m = x(r), o(r), r = m;
    o(u);
  }, q = (r, u, m, _, b, y, T, C, S) => {
    if (u.type === "svg" ? T = "svg" : u.type === "math" && (T = "mathml"), r == null)
      ce(
        u,
        m,
        _,
        b,
        y,
        T,
        C,
        S
      );
    else {
      const w = r.el && r.el._isVueCE ? r.el : null;
      try {
        w && w._beginPatch(), j(
          r,
          u,
          b,
          y,
          T,
          C,
          S
        );
      } finally {
        w && w._endPatch();
      }
    }
  }, ce = (r, u, m, _, b, y, T, C) => {
    let S, w;
    const { props: $, shapeFlag: E, transition: k, dirs: F } = r;
    if (S = r.el = a(
      r.type,
      y,
      $ && $.is,
      $
    ), E & 8 ? f(S, r.children) : E & 16 && ve(
      r.children,
      S,
      null,
      _,
      b,
      rs(r, y),
      T,
      C
    ), F && yt(r, null, _, "created"), he(S, r, r.scopeId, T, _), $) {
      for (const Q in $)
        Q !== "value" && !Zt(Q) && i(S, Q, null, $[Q], y, _);
      "value" in $ && i(S, "value", null, $.value, y), (w = $.onVnodeBeforeMount) && Ye(w, _, r);
    }
    F && yt(r, null, _, "beforeMount");
    const z = Pa(b, k);
    z && k.beforeEnter(S), s(S, u, m), ((w = $ && $.onVnodeMounted) || z || F) && Me(() => {
      try {
        w && Ye(w, _, r), z && k.enter(S), F && yt(r, null, _, "mounted");
      } finally {
      }
    }, b);
  }, he = (r, u, m, _, b) => {
    if (m && A(r, m), _)
      for (let y = 0; y < _.length; y++)
        A(r, _[y]);
    if (b) {
      let y = b.subTree;
      if (u === y || Ni(y.type) && (y.ssContent === u || y.ssFallback === u)) {
        const T = b.vnode;
        he(
          r,
          T,
          T.scopeId,
          T.slotScopeIds,
          b.parent
        );
      }
    }
  }, ve = (r, u, m, _, b, y, T, C, S = 0) => {
    for (let w = S; w < r.length; w++) {
      const $ = r[w] = C ? lt(r[w]) : et(r[w]);
      O(
        null,
        $,
        u,
        m,
        _,
        b,
        y,
        T,
        C
      );
    }
  }, j = (r, u, m, _, b, y, T) => {
    const C = u.el = r.el;
    let { patchFlag: S, dynamicChildren: w, dirs: $ } = u;
    S |= r.patchFlag & 16;
    const E = r.props || ee, k = u.props || ee;
    let F;
    if (m && xt(m, !1), (F = k.onVnodeBeforeUpdate) && Ye(F, m, u, r), $ && yt(u, r, m, "beforeUpdate"), m && xt(m, !0), (E.innerHTML && k.innerHTML == null || E.textContent && k.textContent == null) && f(C, ""), w ? G(
      r.dynamicChildren,
      w,
      C,
      m,
      _,
      rs(u, b),
      y
    ) : T || B(
      r,
      u,
      C,
      null,
      m,
      _,
      rs(u, b),
      y,
      !1
    ), S > 0) {
      if (S & 16)
        oe(C, E, k, m, b);
      else if (S & 2 && E.class !== k.class && i(C, "class", null, k.class, b), S & 4 && i(C, "style", E.style, k.style, b), S & 8) {
        const z = u.dynamicProps;
        for (let Q = 0; Q < z.length; Q++) {
          const ne = z[Q], ue = E[ne], me = k[ne];
          (me !== ue || ne === "value") && i(C, ne, ue, me, b, m);
        }
      }
      S & 1 && r.children !== u.children && f(C, u.children);
    } else !T && w == null && oe(C, E, k, m, b);
    ((F = k.onVnodeUpdated) || $) && Me(() => {
      F && Ye(F, m, u, r), $ && yt(u, r, m, "updated");
    }, _);
  }, G = (r, u, m, _, b, y, T) => {
    for (let C = 0; C < u.length; C++) {
      const S = r[C], w = u[C], $ = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        S.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (S.type === ke || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Ct(S, w) || // - In the case of a component, it could contain anything.
        S.shapeFlag & 198) ? h(S.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          m
        )
      );
      O(
        S,
        w,
        $,
        null,
        _,
        b,
        y,
        T,
        !0
      );
    }
  }, oe = (r, u, m, _, b) => {
    if (u !== m) {
      if (u !== ee)
        for (const y in u)
          !Zt(y) && !(y in m) && i(
            r,
            y,
            u[y],
            null,
            b,
            _
          );
      for (const y in m) {
        if (Zt(y)) continue;
        const T = m[y], C = u[y];
        T !== C && y !== "value" && i(r, y, C, T, b, _);
      }
      "value" in m && i(r, "value", u.value, m.value, b);
    }
  }, P = (r, u, m, _, b, y, T, C, S) => {
    const w = u.el = r ? r.el : l(""), $ = u.anchor = r ? r.anchor : l("");
    let { patchFlag: E, dynamicChildren: k, slotScopeIds: F } = u;
    F && (C = C ? C.concat(F) : F), r == null ? (s(w, m, _), s($, m, _), ve(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      m,
      $,
      b,
      y,
      T,
      C,
      S
    )) : E > 0 && E & 64 && k && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    r.dynamicChildren && r.dynamicChildren.length === k.length ? (G(
      r.dynamicChildren,
      k,
      m,
      b,
      y,
      T,
      C
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || b && u === b.subTree) && Di(
      r,
      u,
      !0
      /* shallow */
    )) : B(
      r,
      u,
      m,
      $,
      b,
      y,
      T,
      C,
      S
    );
  }, Z = (r, u, m, _, b, y, T, C, S) => {
    u.slotScopeIds = C, r == null ? u.shapeFlag & 512 ? b.ctx.activate(
      u,
      m,
      _,
      T,
      S
    ) : ie(
      u,
      m,
      _,
      b,
      y,
      T,
      S
    ) : be(r, u, S);
  }, ie = (r, u, m, _, b, y, T) => {
    const C = r.component = Na(
      r,
      _,
      b
    );
    if (Wn(r) && (C.ctx.renderer = v), ja(C, !1, T), C.asyncDep) {
      if (b && b.registerDep(C, V, T), !r.el) {
        const S = C.subTree = pe(Te);
        R(null, S, u, m), r.placeholder = S.el;
      }
    } else
      V(
        C,
        r,
        u,
        m,
        b,
        y,
        T
      );
  }, be = (r, u, m) => {
    const _ = u.component = r.component;
    if (ba(r, u, m))
      if (_.asyncDep && !_.asyncResolved) {
        X(_, u, m);
        return;
      } else
        _.next = u, _.update();
    else
      u.el = r.el, _.vnode = u;
  }, V = (r, u, m, _, b, y, T) => {
    const C = () => {
      if (r.isMounted) {
        let { next: E, bu: k, u: F, parent: z, vnode: Q } = r;
        {
          const Ge = Fi(r);
          if (Ge) {
            E && (E.el = Q.el, X(r, E, T)), Ge.asyncDep.then(() => {
              Me(() => {
                r.isUnmounted || w();
              }, b);
            });
            return;
          }
        }
        let ne = E, ue;
        xt(r, !1), E ? (E.el = Q.el, X(r, E, T)) : E = Q, k && Sn(k), (ue = E.props && E.props.onVnodeBeforeUpdate) && Ye(ue, z, E, Q), xt(r, !0);
        const me = no(r), qe = r.subTree;
        r.subTree = me, O(
          qe,
          me,
          // parent may have changed if it's in a teleport
          h(qe.el),
          // anchor may have changed if it's in a fragment
          It(qe),
          r,
          b,
          y
        ), E.el = me.el, ne === null && ya(r, me.el), F && Me(F, b), (ue = E.props && E.props.onVnodeUpdated) && Me(
          () => Ye(ue, z, E, Q),
          b
        );
      } else {
        let E;
        const { el: k, props: F } = u, { bm: z, m: Q, parent: ne, root: ue, type: me } = r, qe = sn(u);
        xt(r, !1), z && Sn(z), !qe && (E = F && F.onVnodeBeforeMount) && Ye(E, ne, u), xt(r, !0);
        {
          ue.ce && ue.ce._hasShadowRoot() && ue.ce._injectChildStyle(
            me,
            r.parent ? r.parent.type : void 0
          );
          const Ge = r.subTree = no(r);
          O(
            null,
            Ge,
            m,
            _,
            r,
            b,
            y
          ), u.el = Ge.el;
        }
        if (Q && Me(Q, b), !qe && (E = F && F.onVnodeMounted)) {
          const Ge = u;
          Me(
            () => Ye(E, ne, Ge),
            b
          );
        }
        (u.shapeFlag & 256 || ne && sn(ne.vnode) && ne.vnode.shapeFlag & 256) && r.a && Me(r.a, b), r.isMounted = !0, u = m = _ = null;
      }
    };
    r.scope.on();
    const S = r.effect = new Ko(C);
    r.scope.off();
    const w = r.update = S.run.bind(S), $ = r.job = S.runIfDirty.bind(S);
    $.i = r, $.id = r.uid, S.scheduler = () => Fs($), xt(r, !0), w();
  }, X = (r, u, m) => {
    u.component = r;
    const _ = r.vnode.props;
    r.vnode = u, r.next = null, _a(r, u.props, _, m), Ta(r, u.children, m), ft(), qs(r), pt();
  }, B = (r, u, m, _, b, y, T, C, S = !1) => {
    const w = r && r.children, $ = r ? r.shapeFlag : 0, E = u.children, { patchFlag: k, shapeFlag: F } = u;
    if (k > 0) {
      if (k & 128) {
        Pt(
          w,
          E,
          m,
          _,
          b,
          y,
          T,
          C,
          S
        );
        return;
      } else if (k & 256) {
        Ee(
          w,
          E,
          m,
          _,
          b,
          y,
          T,
          C,
          S
        );
        return;
      }
    }
    F & 8 ? ($ & 16 && Ve(w, b, y), E !== w && f(m, E)) : $ & 16 ? F & 16 ? Pt(
      w,
      E,
      m,
      _,
      b,
      y,
      T,
      C,
      S
    ) : Ve(w, b, y, !0) : ($ & 8 && f(m, ""), F & 16 && ve(
      E,
      m,
      _,
      b,
      y,
      T,
      C,
      S
    ));
  }, Ee = (r, u, m, _, b, y, T, C, S) => {
    r = r || $t, u = u || $t;
    const w = r.length, $ = u.length, E = Math.min(w, $);
    let k;
    for (k = 0; k < E; k++) {
      const F = u[k] = S ? lt(u[k]) : et(u[k]);
      O(
        r[k],
        F,
        m,
        null,
        b,
        y,
        T,
        C,
        S
      );
    }
    w > $ ? Ve(
      r,
      b,
      y,
      !0,
      !1,
      E
    ) : ve(
      u,
      m,
      _,
      b,
      y,
      T,
      C,
      S,
      E
    );
  }, Pt = (r, u, m, _, b, y, T, C, S) => {
    let w = 0;
    const $ = u.length;
    let E = r.length - 1, k = $ - 1;
    for (; w <= E && w <= k; ) {
      const F = r[w], z = u[w] = S ? lt(u[w]) : et(u[w]);
      if (Ct(F, z))
        O(
          F,
          z,
          m,
          null,
          b,
          y,
          T,
          C,
          S
        );
      else
        break;
      w++;
    }
    for (; w <= E && w <= k; ) {
      const F = r[E], z = u[k] = S ? lt(u[k]) : et(u[k]);
      if (Ct(F, z))
        O(
          F,
          z,
          m,
          null,
          b,
          y,
          T,
          C,
          S
        );
      else
        break;
      E--, k--;
    }
    if (w > E) {
      if (w <= k) {
        const F = k + 1, z = F < $ ? u[F].el : _;
        for (; w <= k; )
          O(
            null,
            u[w] = S ? lt(u[w]) : et(u[w]),
            m,
            z,
            b,
            y,
            T,
            C,
            S
          ), w++;
      }
    } else if (w > k)
      for (; w <= E; )
        Fe(r[w], b, y, !0), w++;
    else {
      const F = w, z = w, Q = /* @__PURE__ */ new Map();
      for (w = z; w <= k; w++) {
        const Re = u[w] = S ? lt(u[w]) : et(u[w]);
        Re.key != null && Q.set(Re.key, w);
      }
      let ne, ue = 0;
      const me = k - z + 1;
      let qe = !1, Ge = 0;
      const Ut = new Array(me);
      for (w = 0; w < me; w++) Ut[w] = 0;
      for (w = F; w <= E; w++) {
        const Re = r[w];
        if (ue >= me) {
          Fe(Re, b, y, !0);
          continue;
        }
        let Je;
        if (Re.key != null)
          Je = Q.get(Re.key);
        else
          for (ne = z; ne <= k; ne++)
            if (Ut[ne - z] === 0 && Ct(Re, u[ne])) {
              Je = ne;
              break;
            }
        Je === void 0 ? Fe(Re, b, y, !0) : (Ut[Je - z] = w + 1, Je >= Ge ? Ge = Je : qe = !0, O(
          Re,
          u[Je],
          m,
          null,
          b,
          y,
          T,
          C,
          S
        ), ue++);
      }
      const Hs = qe ? Ma(Ut) : $t;
      for (ne = Hs.length - 1, w = me - 1; w >= 0; w--) {
        const Re = z + w, Je = u[Re], Vs = u[Re + 1], Ks = Re + 1 < $ ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Vs.el || Li(Vs)
        ) : _;
        Ut[w] === 0 ? O(
          null,
          Je,
          m,
          Ks,
          b,
          y,
          T,
          C,
          S
        ) : qe && (ne < 0 || w !== Hs[ne] ? ot(Je, m, Ks, 2) : ne--);
      }
    }
  }, ot = (r, u, m, _, b = null) => {
    const { el: y, type: T, transition: C, children: S, shapeFlag: w } = r;
    if (w & 6) {
      ot(r.component.subTree, u, m, _);
      return;
    }
    if (w & 128) {
      r.suspense.move(u, m, _);
      return;
    }
    if (w & 64) {
      T.move(r, u, m, v);
      return;
    }
    if (T === ke) {
      s(y, u, m);
      for (let E = 0; E < S.length; E++)
        ot(S[E], u, m, _);
      s(r.anchor, u, m);
      return;
    }
    if (T === as) {
      U(r, u, m);
      return;
    }
    if (_ !== 2 && w & 1 && C)
      if (_ === 0)
        C.beforeEnter(y), s(y, u, m), Me(() => C.enter(y), b);
      else {
        const { leave: E, delayLeave: k, afterLeave: F } = C, z = () => {
          r.ctx.isUnmounted ? o(y) : s(y, u, m);
        }, Q = () => {
          y._isLeaving && y[Ze](
            !0
            /* cancelled */
          ), E(y, () => {
            z(), F && F();
          });
        };
        k ? k(y, z, Q) : Q();
      }
    else
      s(y, u, m);
  }, Fe = (r, u, m, _ = !1, b = !1) => {
    const {
      type: y,
      props: T,
      ref: C,
      children: S,
      dynamicChildren: w,
      shapeFlag: $,
      patchFlag: E,
      dirs: k,
      cacheIndex: F,
      memo: z
    } = r;
    if (E === -2 && (b = !1), C != null && (ft(), nn(C, null, m, r, !0), pt()), F != null && (u.renderCache[F] = void 0), $ & 256) {
      u.ctx.deactivate(r);
      return;
    }
    const Q = $ & 1 && k, ne = !sn(r);
    let ue;
    if (ne && (ue = T && T.onVnodeBeforeUnmount) && Ye(ue, u, r), $ & 6)
      Mt(r.component, m, _);
    else {
      if ($ & 128) {
        r.suspense.unmount(m, _);
        return;
      }
      Q && yt(r, null, u, "beforeUnmount"), $ & 64 ? r.type.remove(
        r,
        u,
        m,
        v,
        _
      ) : w && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !w.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (y !== ke || E > 0 && E & 64) ? Ve(
        w,
        u,
        m,
        !1,
        !0
      ) : (y === ke && E & 384 || !b && $ & 16) && Ve(S, u, m), _ && Vt(r);
    }
    const me = z != null && F == null;
    (ne && (ue = T && T.onVnodeUnmounted) || Q || me) && Me(() => {
      ue && Ye(ue, u, r), Q && yt(r, null, u, "unmounted"), me && (r.el = null);
    }, m);
  }, Vt = (r) => {
    const { type: u, el: m, anchor: _, transition: b } = r;
    if (u === ke) {
      Zn(m, _);
      return;
    }
    if (u === as) {
      I(r);
      return;
    }
    const y = () => {
      o(m), b && !b.persisted && b.afterLeave && b.afterLeave();
    };
    if (r.shapeFlag & 1 && b && !b.persisted) {
      const { leave: T, delayLeave: C } = b, S = () => T(m, y);
      C ? C(r.el, y, S) : S();
    } else
      y();
  }, Zn = (r, u) => {
    let m;
    for (; r !== u; )
      m = x(r), o(r), r = m;
    o(u);
  }, Mt = (r, u, m) => {
    const { bum: _, scope: b, job: y, subTree: T, um: C, m: S, a: w } = r;
    io(S), io(w), _ && Sn(_), b.stop(), y && (y.flags |= 8, Fe(T, r, u, m)), C && Me(C, u), Me(() => {
      r.isUnmounted = !0;
    }, u);
  }, Ve = (r, u, m, _ = !1, b = !1, y = 0) => {
    for (let T = y; T < r.length; T++)
      Fe(r[T], u, m, _, b);
  }, It = (r) => {
    if (r.shapeFlag & 6)
      return It(r.component.subTree);
    if (r.shapeFlag & 128)
      return r.suspense.next();
    const u = x(r.anchor || r.el), m = u && u[Br];
    return m ? x(m) : u;
  };
  let Kt = !1;
  const bn = (r, u, m) => {
    let _;
    r == null ? u._vnode && (Fe(u._vnode, null, null, !0), _ = u._vnode.component) : O(
      u._vnode || null,
      r,
      u,
      null,
      null,
      null,
      m
    ), u._vnode = r, Kt || (Kt = !0, qs(_), ii(), Kt = !1);
  }, v = {
    p: O,
    um: Fe,
    m: ot,
    r: Vt,
    mt: ie,
    mc: ve,
    pc: B,
    pbc: G,
    n: It,
    o: e
  };
  return {
    render: bn,
    hydrate: void 0,
    createApp: pa(bn)
  };
}
function rs({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function xt({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Pa(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Di(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (D(s) && D(o))
    for (let i = 0; i < s.length; i++) {
      const a = s[i];
      let l = o[i];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = o[i] = lt(o[i]), l.el = a.el), !n && l.patchFlag !== -2 && Di(a, l)), l.type === Jn && (l.patchFlag === -1 && (l = o[i] = lt(l)), l.el = a.el), l.type === Te && !l.el && (l.el = a.el);
    }
}
function Ma(e) {
  const t = e.slice(), n = [0];
  let s, o, i, a, l;
  const c = e.length;
  for (s = 0; s < c; s++) {
    const p = e[s];
    if (p !== 0) {
      if (o = n[n.length - 1], e[o] < p) {
        t[s] = o, n.push(s);
        continue;
      }
      for (i = 0, a = n.length - 1; i < a; )
        l = i + a >> 1, e[n[l]] < p ? i = l + 1 : a = l;
      p < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
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
function Ia(e, t) {
  t && t.pendingBranch ? D(e) ? t.effects.push(...e) : t.effects.push(e) : jr(e);
}
const ke = /* @__PURE__ */ Symbol.for("v-fgt"), Jn = /* @__PURE__ */ Symbol.for("v-txt"), Te = /* @__PURE__ */ Symbol.for("v-cmt"), as = /* @__PURE__ */ Symbol.for("v-stc"), rn = [];
let De = null;
function Oe(e = !1) {
  rn.push(De = e ? null : []);
}
function ka() {
  rn.pop(), De = rn[rn.length - 1] || null;
}
let fn = 1;
function Rn(e, t = !1) {
  fn += e, e < 0 && De && t && (De.hasOnce = !0);
}
function ji(e) {
  return e.dynamicChildren = fn > 0 ? De || $t : null, ka(), fn > 0 && De && De.push(e), e;
}
function Ne(e, t, n, s, o, i) {
  return ji(
    g(
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
function Ra(e, t, n, s, o) {
  return ji(
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
function On(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Ct(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Hi = ({ key: e }) => e ?? null, Tn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ae(e) || /* @__PURE__ */ we(e) || L(e) ? { i: je, r: e, k: t, f: !!n } : e : null);
function g(e, t = null, n = null, s = 0, o = null, i = e === ke ? 0 : 1, a = !1, l = !1) {
  const c = {
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
    ctx: je
  };
  return l ? (js(c, n), i & 128 && e.normalize(c)) : n && (c.shapeFlag |= ae(n) ? 8 : 16), fn > 0 && // avoid a block node from tracking itself
  !a && // has current parent block
  De && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (c.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  c.patchFlag !== 32 && De.push(c), c;
}
const pe = Oa;
function Oa(e, t = null, n = null, s = 0, o = null, i = !1) {
  if ((!e || e === oa) && (e = Te), On(e)) {
    const l = vt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && js(l, n), fn > 0 && !i && De && (l.shapeFlag & 6 ? De[De.indexOf(e)] = l : De.push(l)), l.patchFlag = -2, l;
  }
  if (Ua(e) && (e = e.__vccOpts), t) {
    t = $a(t);
    let { class: l, style: c } = t;
    l && !ae(l) && (t.class = Ie(l)), Y(c) && (/* @__PURE__ */ Ds(c) && !D(c) && (c = de({}, c)), t.style = Ps(c));
  }
  const a = ae(e) ? 1 : Ni(e) ? 128 : fi(e) ? 64 : Y(e) ? 4 : L(e) ? 2 : 0;
  return g(
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
  return e ? /* @__PURE__ */ Ds(e) || Mi(e) ? de({}, e) : e : null;
}
function vt(e, t, n = !1, s = !1) {
  const { props: o, ref: i, patchFlag: a, children: l, transition: c } = e, p = t ? Da(o || {}, t) : o, f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: p,
    key: p && Hi(p),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? D(i) ? i.concat(Tn(t)) : [i, Tn(t)] : Tn(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: l,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== ke ? a === -1 ? 16 : a | 16 : a,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: c,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && vt(e.ssContent),
    ssFallback: e.ssFallback && vt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return c && s && un(
    f,
    c.clone(f)
  ), f;
}
function xe(e = " ", t = 0) {
  return pe(Jn, null, e, t);
}
function An(e = "", t = !1) {
  return t ? (Oe(), Ra(Te, null, e)) : pe(Te, null, e);
}
function et(e) {
  return e == null || typeof e == "boolean" ? pe(Te) : D(e) ? pe(
    ke,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : On(e) ? lt(e) : pe(Jn, null, String(e));
}
function lt(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : vt(e);
}
function js(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (D(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), js(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !Mi(t) ? t._ctx = je : o === 3 && je && (je.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else L(t) ? (t = { default: t, _ctx: je }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [xe(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Da(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = Ie([t.class, s.class]));
      else if (o === "style")
        t.style = Ps([t.style, s.style]);
      else if (Nn(o)) {
        const i = t[o], a = s[o];
        a && i !== a && !(D(i) && i.includes(a)) ? t[o] = i ? [].concat(i, a) : a : a == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !jn(o) && (t[o] = a);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function Ye(e, t, n, s = null) {
  We(e, t, 7, [
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
    propsOptions: ki(s, o),
    emitsOptions: Ti(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: ee,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: ee,
    data: ee,
    props: ee,
    attrs: ee,
    slots: ee,
    refs: ee,
    setupState: ee,
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
let Ae = null;
const Vi = () => Ae || je;
let $n, Ss;
{
  const e = Un(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (i) => {
      o.length > 1 ? o.forEach((a) => a(i)) : o[0](i);
    };
  };
  $n = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ae = n
  ), Ss = t(
    "__VUE_SSR_SETTERS__",
    (n) => pn = n
  );
}
const vn = (e) => {
  const t = Ae;
  return $n(e), e.scope.on(), () => {
    e.scope.off(), $n(t);
  };
}, ro = () => {
  Ae && Ae.scope.off(), $n(null);
};
function Ki(e) {
  return e.vnode.shapeFlag & 4;
}
let pn = !1;
function ja(e, t = !1, n = !1) {
  t && Ss(t);
  const { props: s, children: o } = e.vnode, i = Ki(e);
  xa(e, s, i, t), Ca(e, o, n || t);
  const a = i ? Ha(e, t) : void 0;
  return t && Ss(!1), a;
}
function Ha(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ia);
  const { setup: s } = n;
  if (s) {
    ft();
    const o = e.setupContext = s.length > 1 ? Ka(e) : null, i = vn(e), a = gn(
      s,
      e,
      0,
      [
        e.props,
        o
      ]
    ), l = $o(a);
    if (pt(), i(), (l || e.sp) && !sn(e) && vi(e), l) {
      if (a.then(ro, ro), t)
        return a.then((c) => {
          ao(e, c);
        }).catch((c) => {
          zn(c, e, 0);
        });
      e.asyncDep = a;
    } else
      ao(e, a);
  } else
    Ui(e);
}
function ao(e, t, n) {
  L(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Y(t) && (e.setupState = ni(t)), Ui(e);
}
function Ui(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || nt);
  {
    const o = vn(e);
    ft();
    try {
      ra(e);
    } finally {
      pt(), o();
    }
  }
}
const Va = {
  get(e, t) {
    return _e(e, "get", ""), e[t];
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
function Yn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(ni(Mr(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in on)
        return on[n](e);
    },
    has(t, n) {
      return n in t || n in on;
    }
  })) : e.proxy;
}
function Ua(e) {
  return L(e) && "__vccOpts" in e;
}
const Yt = (e, t) => /* @__PURE__ */ $r(e, t, pn);
function le(e, t, n) {
  try {
    Rn(-1);
    const s = arguments.length;
    return s === 2 ? Y(t) && !D(t) ? On(t) ? pe(e, null, [t]) : pe(e, t) : pe(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && On(n) && (n = [n]), pe(e, t, n));
  } finally {
    Rn(1);
  }
}
const Ba = "3.5.34";
/**
* @vue/runtime-dom v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Cs;
const lo = typeof window < "u" && window.trustedTypes;
if (lo)
  try {
    Cs = /* @__PURE__ */ lo.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Bi = Cs ? (e) => Cs.createHTML(e) : (e) => e, za = "http://www.w3.org/2000/svg", Wa = "http://www.w3.org/1998/Math/MathML", at = typeof document < "u" ? document : null, co = at && /* @__PURE__ */ at.createElement("template"), qa = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? at.createElementNS(za, e) : t === "mathml" ? at.createElementNS(Wa, e) : n ? at.createElement(e, { is: n }) : at.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
  },
  createText: (e) => at.createTextNode(e),
  createComment: (e) => at.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => at.querySelector(e),
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
      const l = co.content;
      if (s === "svg" || s === "mathml") {
        const c = l.firstChild;
        for (; c.firstChild; )
          l.appendChild(c.firstChild);
        l.removeChild(c);
      }
      t.insertBefore(l, n);
    }
    return [
      // first
      a ? a.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, mt = "transition", qt = "animation", dn = /* @__PURE__ */ Symbol("_vtc"), zi = {
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
}, Ga = /* @__PURE__ */ de(
  {},
  pi,
  zi
), Ja = (e) => (e.displayName = "Transition", e.props = Ga, e), Ya = /* @__PURE__ */ Ja(
  (e, { slots: t }) => le(qr, Xa(e), t)
), _t = (e, t = []) => {
  D(e) ? e.forEach((n) => n(...t)) : e && e(...t);
}, uo = (e) => e ? D(e) ? e.some((t) => t.length > 1) : e.length > 1 : !1;
function Xa(e) {
  const t = {};
  for (const P in e)
    P in zi || (t[P] = e[P]);
  if (e.css === !1)
    return t;
  const {
    name: n = "v",
    type: s,
    duration: o,
    enterFromClass: i = `${n}-enter-from`,
    enterActiveClass: a = `${n}-enter-active`,
    enterToClass: l = `${n}-enter-to`,
    appearFromClass: c = i,
    appearActiveClass: p = a,
    appearToClass: f = l,
    leaveFromClass: h = `${n}-leave-from`,
    leaveActiveClass: x = `${n}-leave-active`,
    leaveToClass: A = `${n}-leave-to`
  } = e, N = Za(o), O = N && N[0], te = N && N[1], {
    onBeforeEnter: R,
    onEnter: H,
    onEnterCancelled: U,
    onLeave: I,
    onLeaveCancelled: q,
    onBeforeAppear: ce = R,
    onAppear: he = H,
    onAppearCancelled: ve = U
  } = t, j = (P, Z, ie, be) => {
    P._enterCancelled = be, wt(P, Z ? f : l), wt(P, Z ? p : a), ie && ie();
  }, G = (P, Z) => {
    P._isLeaving = !1, wt(P, h), wt(P, A), wt(P, x), Z && Z();
  }, oe = (P) => (Z, ie) => {
    const be = P ? he : H, V = () => j(Z, P, ie);
    _t(be, [Z, V]), fo(() => {
      wt(Z, P ? c : i), rt(Z, P ? f : l), uo(be) || po(Z, s, O, V);
    });
  };
  return de(t, {
    onBeforeEnter(P) {
      _t(R, [P]), rt(P, i), rt(P, a);
    },
    onBeforeAppear(P) {
      _t(ce, [P]), rt(P, c), rt(P, p);
    },
    onEnter: oe(!1),
    onAppear: oe(!0),
    onLeave(P, Z) {
      P._isLeaving = !0;
      const ie = () => G(P, Z);
      rt(P, h), P._enterCancelled ? (rt(P, x), go(P)) : (go(P), rt(P, x)), fo(() => {
        P._isLeaving && (wt(P, h), rt(P, A), uo(I) || po(P, s, te, ie));
      }), _t(I, [P, ie]);
    },
    onEnterCancelled(P) {
      j(P, !1, void 0, !0), _t(U, [P]);
    },
    onAppearCancelled(P) {
      j(P, !0, void 0, !0), _t(ve, [P]);
    },
    onLeaveCancelled(P) {
      G(P), _t(q, [P]);
    }
  });
}
function Za(e) {
  if (e == null)
    return null;
  if (Y(e))
    return [ls(e.enter), ls(e.leave)];
  {
    const t = ls(e);
    return [t, t];
  }
}
function ls(e) {
  return Qi(e);
}
function rt(e, t) {
  t.split(/\s+/).forEach((n) => n && e.classList.add(n)), (e[dn] || (e[dn] = /* @__PURE__ */ new Set())).add(t);
}
function wt(e, t) {
  t.split(/\s+/).forEach((s) => s && e.classList.remove(s));
  const n = e[dn];
  n && (n.delete(t), n.size || (e[dn] = void 0));
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
  const { type: a, timeout: l, propCount: c } = el(e, t);
  if (!a)
    return s();
  const p = a + "end";
  let f = 0;
  const h = () => {
    e.removeEventListener(p, x), i();
  }, x = (A) => {
    A.target === e && ++f >= c && h();
  };
  setTimeout(() => {
    f < c && h();
  }, l + 1), e.addEventListener(p, x);
}
function el(e, t) {
  const n = window.getComputedStyle(e), s = (N) => (n[N] || "").split(", "), o = s(`${mt}Delay`), i = s(`${mt}Duration`), a = ho(o, i), l = s(`${qt}Delay`), c = s(`${qt}Duration`), p = ho(l, c);
  let f = null, h = 0, x = 0;
  t === mt ? a > 0 && (f = mt, h = a, x = i.length) : t === qt ? p > 0 && (f = qt, h = p, x = c.length) : (h = Math.max(a, p), f = h > 0 ? a > p ? mt : qt : null, x = f ? f === mt ? i.length : c.length : 0);
  const A = f === mt && /\b(?:transform|all)(?:,|$)/.test(
    s(`${mt}Property`).toString()
  );
  return {
    type: f,
    timeout: h,
    propCount: x,
    hasTransform: A
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
  const s = e[dn];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Dn = /* @__PURE__ */ Symbol("_vod"), Wi = /* @__PURE__ */ Symbol("_vsh"), vo = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[Dn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Gt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Gt(e, !0), s.enter(e)) : s.leave(e, () => {
      Gt(e, !1);
    }) : Gt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Gt(e, t);
  }
};
function Gt(e, t) {
  e.style.display = t ? e[Dn] : "none", e[Wi] = !t;
}
const nl = /* @__PURE__ */ Symbol(""), sl = /(?:^|;)\s*display\s*:/;
function ol(e, t, n) {
  const s = e.style, o = ae(n);
  let i = !1;
  if (n && !o) {
    if (t)
      if (ae(t))
        for (const a of t.split(";")) {
          const l = a.slice(0, a.indexOf(":")).trim();
          n[l] == null && Xt(s, l, "");
        }
      else
        for (const a in t)
          n[a] == null && Xt(s, a, "");
    for (const a in n) {
      a === "display" && (i = !0);
      const l = n[a];
      l != null ? rl(
        e,
        a,
        !ae(t) && t ? t[a] : void 0,
        l
      ) || Xt(s, a, l) : Xt(s, a, "");
    }
  } else if (o) {
    if (t !== n) {
      const a = s[nl];
      a && (n += ";" + a), s.cssText = n, i = sl.test(n);
    }
  } else t && e.removeAttribute("style");
  Dn in e && (e[Dn] = i ? s.display : "", e[Wi] && (s.display = "none"));
}
const bo = /\s*!important$/;
function Xt(e, t, n) {
  if (D(n))
    n.forEach((s) => Xt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = il(e, t);
    bo.test(n) ? e.setProperty(
      bt(s),
      n.replace(bo, ""),
      "important"
    ) : e[s] = n;
  }
}
const yo = ["Webkit", "Moz", "ms"], cs = {};
function il(e, t) {
  const n = cs[t];
  if (n)
    return n;
  let s = Ue(t);
  if (s !== "filter" && s in e)
    return cs[t] = s;
  s = Lo(s);
  for (let o = 0; o < yo.length; o++) {
    const i = yo[o] + s;
    if (i in e)
      return cs[t] = i;
  }
  return t;
}
function rl(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && ae(s) && n === s;
}
const xo = "http://www.w3.org/1999/xlink";
function _o(e, t, n, s, o, i = ir(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(xo, t.slice(6, t.length)) : e.setAttributeNS(xo, t, n) : n == null || i && !jo(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : st(n) ? String(n) : n
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
    const l = i === "OPTION" ? e.getAttribute("value") || "" : e.value, c = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (l !== c || !("_value" in e)) && (e.value = c), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let a = !1;
  if (n === "" || n == null) {
    const l = typeof e[t];
    l === "boolean" ? n = jo(n) : n == null && l === "string" ? (n = "", a = !0) : l === "number" && (n = 0, a = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  a && e.removeAttribute(o || t);
}
function Tt(e, t, n, s) {
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
    const [l, c] = cl(t);
    if (s) {
      const p = i[t] = pl(
        s,
        o
      );
      Tt(e, l, p, c);
    } else a && (al(e, l, a, c), i[t] = void 0);
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
  return [e[2] === ":" ? e.slice(3) : bt(e.slice(2)), t];
}
let us = 0;
const ul = /* @__PURE__ */ Promise.resolve(), fl = () => us || (ul.then(() => us = 0), us = Date.now());
function pl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    We(
      dl(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = fl(), n;
}
function dl(e, t) {
  if (D(t)) {
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
  t === "class" ? tl(e, s, a) : t === "style" ? ol(e, n, s) : Nn(t) ? jn(t) || ll(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : ml(e, t, s, a)) ? (wo(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && _o(e, t, s, a, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (gl(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !ae(s))) ? wo(e, Ue(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), _o(e, t, s, a));
};
function ml(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && To(t) && L(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return To(t) && ae(n) ? !1 : t in e;
}
function gl(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Ue(t);
  return Array.isArray(n) ? n.some((o) => Ue(o) === s) : Object.keys(n).some((o) => Ue(o) === s);
}
const Fn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return D(t) ? (n) => Sn(t, n) : t;
};
function vl(e) {
  e.target.composing = !0;
}
function Ao(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const jt = /* @__PURE__ */ Symbol("_assign");
function Eo(e, t, n) {
  return t && (e = e.trim()), n && (e = Kn(e)), e;
}
const ye = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, o) {
    e[jt] = Fn(o);
    const i = s || o.props && o.props.type === "number";
    Tt(e, t ? "change" : "input", (a) => {
      a.target.composing || e[jt](Eo(e.value, n, i));
    }), (n || i) && Tt(e, "change", () => {
      e.value = Eo(e.value, n, i);
    }), t || (Tt(e, "compositionstart", vl), Tt(e, "compositionend", Ao), Tt(e, "change", Ao));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: i } }, a) {
    if (e[jt] = Fn(a), e.composing) return;
    const l = (i || e.type === "number") && !/^0\d/.test(e.value) ? Kn(e.value) : e.value, c = t ?? "";
    if (l === c)
      return;
    const p = e.getRootNode();
    (p instanceof Document || p instanceof ShadowRoot) && p.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === c) || (e.value = c);
  }
}, Po = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const o = Hn(t);
    Tt(e, "change", () => {
      const i = Array.prototype.filter.call(e.options, (a) => a.selected).map(
        (a) => n ? Kn(Ln(a)) : Ln(a)
      );
      e[jt](
        e.multiple ? o ? new Set(i) : i : i[0]
      ), e._assigning = !0, Ot(() => {
        e._assigning = !1;
      });
    }), e[jt] = Fn(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    Mo(e, t);
  },
  beforeUpdate(e, t, n) {
    e[jt] = Fn(n);
  },
  updated(e, { value: t }) {
    e._assigning || Mo(e, t);
  }
};
function Mo(e, t) {
  const n = e.multiple, s = D(t);
  if (!(n && !s && !Hn(t))) {
    for (let o = 0, i = e.options.length; o < i; o++) {
      const a = e.options[o], l = Ln(a);
      if (n)
        if (s) {
          const c = typeof l;
          c === "string" || c === "number" ? a.selected = t.some((p) => String(p) === String(l)) : a.selected = ar(t, l) > -1;
        } else
          a.selected = t.has(l);
      else if (mn(Ln(a), t)) {
        e.selectedIndex !== o && (e.selectedIndex = o);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function Ln(e) {
  return "_value" in e ? e._value : e.value;
}
const bl = ["ctrl", "shift", "alt", "meta"], yl = {
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
}, re = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((o, ...i) => {
    for (let a = 0; a < t.length; a++) {
      const l = yl[t[a]];
      if (l && l(o, t)) return;
    }
    return e(o, ...i);
  }));
}, xl = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Pe = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = ((o) => {
    if (!("key" in o))
      return;
    const i = bt(o.key);
    if (t.some(
      (a) => a === i || xl[a] === i
    ))
      return e(o);
  }));
}, _l = /* @__PURE__ */ de({ patchProp: hl }, qa);
let Io;
function wl() {
  return Io || (Io = Aa(_l));
}
const Sl = ((...e) => {
  const t = wl().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const o = Tl(s);
    if (!o) return;
    const i = t._component;
    !L(i) && !i.render && !i.template && (i.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
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
  return ae(e) ? document.querySelector(e) : e;
}
let Al = 1;
function $e(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Ke(e) {
  return `${e}-${Date.now().toString(36)}-${Al++}`;
}
function qi(e) {
  const t = $e(e || {});
  return {
    ...t,
    timestamp: { ...t.timestamp || {} },
    scene: { ...t.scene || {} },
    costumes: { ...t.costumes || {} },
    items: { ...t.items || {} },
    deletedItems: Array.isArray(t.deletedItems) ? [...t.deletedItems] : [],
    events: Array.isArray(t.events) ? $e(t.events) : t.event ? [$e(t.event)] : [],
    affection: { ...t.affection || {} },
    npcs: $e(t.npcs || {}),
    agenda: Array.isArray(t.agenda) ? $e(t.agenda) : [],
    deletedAgenda: Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [],
    mood: $e(t.mood || {}),
    relationships: Array.isArray(t.relationships) ? $e(t.relationships) : []
  };
}
function El(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function Xn(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function Pl(e) {
  return Xn(e) === "悬念" ? "未解悬念" : "行动计划";
}
function Ml(e) {
  return Xn(e) === "悬念" ? "type-suspense" : "type-plan";
}
function Il(e) {
  switch (e) {
    case "affection":
      return { id: Ke("aff"), name: "", value: 0, editing: !0 };
    case "relationship":
      return { id: Ke("rel"), from: "", to: "", type: "", note: "", editing: !0 };
    case "costume":
      return { id: Ke("costume"), name: "", desc: "", editing: !0 };
    case "item":
      return {
        id: Ke("item"),
        icon: "",
        name: "",
        holder: "",
        location: "",
        description: "",
        importance: "",
        editing: !0
      };
    case "agenda":
      return { id: Ke("agenda"), date: "", type: "悬念", text: "", source: "user", editing: !0 };
    default:
      return { id: Ke("row"), editing: !0 };
  }
}
function Gi(e) {
  const t = qi(e), n = t.events[0] || {};
  return {
    baseMeta: $e(t),
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
      id: Ke("aff"),
      name: s,
      value: El(o),
      editing: !1
    })),
    relationshipRows: (t.relationships || []).map((s) => ({
      id: Ke("rel"),
      from: s.from || "",
      to: s.to || "",
      type: s.type || "",
      note: s.note || "",
      editing: !1
    })),
    costumeRows: Object.entries(t.costumes || {}).map(([s, o]) => ({
      id: Ke("costume"),
      name: s,
      desc: o,
      editing: !1
    })),
    itemRows: Object.entries(t.items || {}).map(([s, o]) => ({
      id: Ke("item"),
      icon: (o == null ? void 0 : o.icon) || "",
      name: s,
      holder: (o == null ? void 0 : o.holder) || "",
      location: (o == null ? void 0 : o.location) || "",
      description: (o == null ? void 0 : o.description) || "",
      importance: (o == null ? void 0 : o.importance) || "",
      editing: !1
    })),
    agendaRows: (t.agenda || []).map((s) => ({
      id: Ke("agenda"),
      date: s.date || "",
      type: Xn(s.type),
      text: s.text || "",
      source: s.source || "user",
      done: !!s.done,
      editing: !1
    })),
    isSkipped: !!t._skipHorae
  };
}
function kl(e) {
  const t = qi(e.baseMeta), n = $e(t);
  n.timestamp = {
    ...t.timestamp || {},
    story_date: String(e.timestamp.story_date || "").trim(),
    story_time: String(e.timestamp.story_time || "").trim(),
    absolute: (/* @__PURE__ */ new Date()).toISOString()
  }, n.scene = {
    ...t.scene || {},
    location: String(e.scene.location || "").trim(),
    atmosphere: String(e.scene.atmosphere || "").trim(),
    characters_present: Array.isArray(e.scene.characters_present) ? e.scene.characters_present.map((i) => String(i || "").trim()).filter(Boolean) : []
  }, e.scene.scene_desc && (n.scene.scene_desc = e.scene.scene_desc), n.costumes = {};
  for (const i of e.costumeRows || []) {
    const a = String(i.name || "").trim(), l = String(i.desc || "").trim();
    a && l && (n.costumes[a] = l);
  }
  n.items = {};
  for (const i of e.itemRows || []) {
    const a = String(i.name || "").trim();
    a && (n.items[a] = {
      icon: String(i.icon || "").trim() || null,
      importance: i.importance || "",
      holder: String(i.holder || "").trim() || null,
      location: String(i.location || "").trim(),
      description: String(i.description || "").trim()
    });
  }
  n.affection = {};
  for (const i of e.affectionRows || []) {
    const a = String(i.name || "").trim();
    if (!a) continue;
    const l = Number.parseFloat(i.value);
    n.affection[a] = {
      type: "absolute",
      value: Number.isFinite(l) ? l : String(i.value || "").trim()
    };
  }
  n.relationships = [];
  for (const i of e.relationshipRows || []) {
    const a = String(i.from || "").trim(), l = String(i.to || "").trim(), c = String(i.type || "").trim(), p = String(i.note || "").trim();
    a && l && c && n.relationships.push({ from: a, to: l, type: c, note: p });
  }
  const s = String(e.event.summary || "").trim(), o = String(e.event.level || "").trim();
  n.events = s ? [{
    is_important: o === "重要" || o === "关键" || o === "關鍵",
    level: o || "一般",
    summary: s
  }] : [], delete n.event, n.agenda = [];
  for (const i of e.agendaRows || []) {
    const a = String(i.text || "").trim();
    a && n.agenda.push({
      type: Xn(i.type),
      date: String(i.date || "").trim(),
      text: a,
      source: i.source || "user",
      done: !!i.done
    });
  }
  return n.deletedItems = Array.isArray(t.deletedItems) ? [...t.deletedItems] : [], n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = $e(t.npcs || {}), n.mood = $e(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = $e(t._rpgChanges)), t.tableContributions && (n.tableContributions = $e(t.tableContributions)), n;
}
function Rl(e, t) {
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
}, jl = { class: "toggle-summary" }, Hl = { class: "toggle-actions" }, Vl = ["title"], Kl = ["title"], Ul = ["title", "disabled"], Bl = { class: "horae-panel-content" }, zl = { class: "neo-dashboard" }, Wl = { class: "neo-tags" }, ql = { class: "neo-chip" }, Gl = ["placeholder"], Jl = { class: "neo-chip" }, Yl = ["placeholder"], Xl = { class: "neo-chip" }, Zl = ["placeholder"], Ql = { class: "event-header" }, ec = { class: "event-badge" }, tc = { class: "action-group-hover" }, nc = { class: "view-mode" }, sc = { class: "event-body-text" }, oc = { value: "" }, ic = { value: "一般" }, rc = { value: "重要" }, ac = { value: "关键" }, lc = ["placeholder"], cc = { class: "neo-inset-section" }, uc = { class: "neo-section-header compact" }, fc = { class: "section-title" }, pc = { class: "aff-grid list-container" }, dc = ["onClick"], hc = { class: "view-mode" }, mc = { class: "t-title" }, gc = { class: "t-val" }, vc = ["onUpdate:modelValue", "placeholder", "onKeydown"], bc = ["onUpdate:modelValue", "placeholder", "onKeydown"], yc = { class: "neo-inset-section" }, xc = { class: "neo-section-header compact" }, _c = { class: "section-title" }, wc = { class: "rel-list list-container" }, Sc = ["onClick"], Cc = { class: "view-mode" }, Tc = { class: "rel-node" }, Ac = { class: "rel-node" }, Ec = { class: "rel-label" }, Pc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Mc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Ic = ["onUpdate:modelValue", "placeholder", "onKeydown"], kc = { class: "neo-inset-section" }, Rc = { class: "neo-section-header" }, Oc = { class: "section-title" }, $c = { class: "neo-item-list list-container" }, Dc = ["onClick"], Fc = { class: "view-mode" }, Lc = { class: "item-emoji" }, Nc = { class: "item-info" }, jc = { class: "item-line-top" }, Hc = {
  key: 0,
  class: "item-holder-badge"
}, Vc = {
  key: 0,
  class: "item-meta"
}, Kc = { class: "item-desc" }, Uc = { class: "item-edit-line" }, Bc = ["onUpdate:modelValue", "onKeydown"], zc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Wc = ["onUpdate:modelValue", "placeholder", "onKeydown"], qc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Gc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Jc = { class: "neo-inset-section" }, Yc = { class: "neo-section-header" }, Xc = { class: "section-title" }, Zc = { class: "neo-agenda-list list-container" }, Qc = ["onClick"], eu = { class: "view-mode" }, tu = { class: "agenda-date" }, nu = { class: "agenda-content" }, su = { class: "agenda-type" }, ou = { class: "agenda-text" }, iu = { class: "agenda-edit-line" }, ru = ["onUpdate:modelValue", "placeholder", "onKeydown"], au = ["onUpdate:modelValue", "onKeydown"], lu = { value: "悬念" }, cu = { value: "计划" }, uu = ["onUpdate:modelValue", "placeholder", "onKeydown"], fu = { class: "neo-footer-actions" }, pu = { class: "action-group" }, du = ["disabled"], hu = ["disabled"], mu = { class: "action-group" }, gu = ["disabled"], vu = ["title"], fs = 240, ps = 200, ko = "cubic-bezier(0.22, 1, 0.36, 1)", Ro = "cubic-bezier(0.4, 0, 1, 1)", bu = {
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
      agenda: "悬念与计划",
      agendaMystery: "未解悬念",
      agendaPlan: "行动计划",
      agendaText: "事项内容",
      date: "时间设定",
      unscheduled: "未定",
      openDrawer: "打开 Horae 面板"
    }, o = Yt(() => ({ ...s, ...n.labels })).value, i = /* @__PURE__ */ Ft({ sideplayMode: !1, showPanel: !0, ...n.config }), a = n.adapter || {}, l = /* @__PURE__ */ zt(null), c = /* @__PURE__ */ Ft(Gi(n.initialMeta)), p = /* @__PURE__ */ zt(!0), f = /* @__PURE__ */ zt(!1), h = /* @__PURE__ */ zt(null), x = /* @__PURE__ */ Ft({ save: !1, scan: !1, ai: !1, sideplay: !1 }), A = /* @__PURE__ */ zt((c.scene.characters_present || []).join(", "));
    tn(
      () => c.scene.characters_present,
      (v) => {
        A.value = (v || []).join(", ");
      },
      { deep: !0 }
    ), tn(
      () => [c.isSkipped, i.showPanel],
      ([v]) => {
        var d;
        (d = n.setHostState) == null || d.call(n, { isSkipped: !!v, visible: i.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const N = Yt(() => {
      if (c.isSkipped) return o.noTracking;
      const v = c.timestamp.story_date || "--", d = c.timestamp.story_time ? ` ${c.timestamp.story_time}` : "";
      return `${v}${d}`;
    }), O = Yt(() => {
      var r;
      if (c.isSkipped) return o.sideplayTitle;
      const v = c.event.summary || o.noSpecialEvents, d = ((r = c.scene.characters_present) == null ? void 0 : r.length) || 0;
      return d ? `${v} | ${d}${o.characters}` : v;
    }), te = Yt(() => `${c.event.level || o.levelNormal}${o.event}`);
    function R() {
      f.value = !0;
    }
    function H(v) {
      v.target.closest("button, input, textarea, select") || (p.value = !p.value);
    }
    function U() {
      var v;
      return (v = window.matchMedia) == null ? void 0 : v.call(window, "(prefers-reduced-motion: reduce)").matches;
    }
    function I(v) {
      var d;
      (d = v._horaePanelCleanup) == null || d.call(v), v._horaePanelCleanup = null, v.style.height = "", v.style.opacity = "", v.style.transform = "", v.style.transition = "", v.style.overflow = "", v.style.willChange = "";
    }
    function q(v, d, r) {
      let u = !1;
      const m = () => {
        u || (u = !0, b(), v._horaePanelCleanup = null, d());
      }, _ = (y) => {
        y.target === v && y.propertyName === "height" && m();
      }, b = () => {
        v.removeEventListener("transitionend", _), v._horaePanelTimer && window.clearTimeout(v._horaePanelTimer), v._horaePanelTimer = null;
      };
      v.addEventListener("transitionend", _), v._horaePanelTimer = window.setTimeout(m, r + 80), v._horaePanelCleanup = b;
    }
    function ce(v) {
      I(v), !U() && (v.style.height = "0px", v.style.opacity = "0", v.style.transform = "translateY(-6px)", v.style.overflow = "hidden", v.style.willChange = "height, opacity, transform");
    }
    function he(v, d) {
      if (U()) {
        d();
        return;
      }
      v.style.transition = `height ${fs}ms ${ko}, opacity 180ms ease-out, transform ${fs}ms ${ko}`, requestAnimationFrame(() => {
        v.style.height = `${v.scrollHeight}px`, v.style.opacity = "1", v.style.transform = "translateY(0)";
      }), q(v, d, fs);
    }
    function ve(v) {
      I(v), Ot(Mt);
    }
    function j(v) {
      I(v), !U() && (v.style.height = `${v.scrollHeight}px`, v.style.opacity = "1", v.style.transform = "translateY(0)", v.style.overflow = "hidden", v.style.willChange = "height, opacity, transform");
    }
    function G(v, d) {
      if (U()) {
        d();
        return;
      }
      v.offsetHeight, v.style.transition = `height ${ps}ms ${Ro}, opacity 140ms ease-in, transform ${ps}ms ${Ro}`, requestAnimationFrame(() => {
        v.style.height = "0px", v.style.opacity = "0", v.style.transform = "translateY(-4px)";
      }), q(v, d, ps);
    }
    function oe(v) {
      I(v);
    }
    function P() {
      c.scene.characters_present = Ol(A.value), R();
    }
    function Z(v, d) {
      return `${v}:${(d == null ? void 0 : d.id) || "single"}`;
    }
    function ie(v, d) {
      return h.value === Z(v, d);
    }
    function be(v, d) {
      if (d != null && d.editing) return;
      const r = Z(v, d);
      h.value = h.value === r ? null : r;
    }
    function V(v) {
      v.editing = !v.editing, h.value = null, v.editing || R(), Ot(Mt);
    }
    function X(v, d) {
      c[v].push(Il(d)), h.value = null, R(), Ot(Mt);
    }
    function B(v, d) {
      const r = c[v], u = r.findIndex((m) => m.id === d);
      u >= 0 && (r.splice(u, 1), h.value = null, R());
    }
    function Ee(v) {
      Rl(c, v || {}), A.value = (c.scene.characters_present || []).join(", "), h.value = null, f.value = !1, Ot(Mt);
    }
    async function Pt() {
      var v;
      x.save = !0;
      try {
        const d = kl(c), r = await ((v = a.save) == null ? void 0 : v.call(a, d));
        r ? Ee(r) : f.value = !1;
      } finally {
        x.save = !1;
      }
    }
    async function ot() {
      var v;
      x.scan = !0;
      try {
        const d = await ((v = a.quickScan) == null ? void 0 : v.call(a));
        d && Ee(d);
      } finally {
        x.scan = !1;
      }
    }
    async function Fe() {
      var v;
      x.scan = !0;
      try {
        const d = await ((v = a.rescan) == null ? void 0 : v.call(a));
        d && Ee(d);
      } finally {
        x.scan = !1;
      }
    }
    async function Vt() {
      var v;
      x.ai = !0;
      try {
        const d = await ((v = a.aiAnalyze) == null ? void 0 : v.call(a));
        d && Ee(d);
      } finally {
        x.ai = !1;
      }
    }
    async function Zn() {
      var v;
      x.sideplay = !0;
      try {
        const d = await ((v = a.toggleSideplay) == null ? void 0 : v.call(a));
        d && Ee(d);
      } finally {
        x.sideplay = !1;
      }
    }
    function Mt() {
      var v;
      (v = l.value) == null || v.querySelectorAll("textarea").forEach((d) => {
        d.style.height = "auto", d.style.height = `${d.scrollHeight}px`;
      });
    }
    const Ve = /* @__PURE__ */ Js({
      props: {
        row: { type: Object, required: !0 },
        deleteIcon: { type: String, default: "fa-xmark" }
      },
      emits: ["edit", "delete"],
      setup(v, { emit: d }) {
        return () => le("div", { class: "action-group-hover" }, [
          le("button", {
            class: "action-hover-btn btn-edit",
            onClick: (r) => {
              r.stopPropagation(), d("edit");
            }
          }, [
            le("i", { class: "fa-solid fa-pen" })
          ]),
          le("button", {
            class: "action-hover-btn btn-del",
            onClick: (r) => {
              r.stopPropagation(), d("delete");
            }
          }, [
            le("i", { class: `fa-solid ${v.deleteIcon}` })
          ])
        ]);
      }
    }), It = /* @__PURE__ */ Js({
      props: {
        title: { type: String, required: !0 },
        icon: { type: String, required: !0 },
        rows: { type: Array, required: !0 },
        labels: { type: Object, required: !0 }
      },
      emits: ["add", "edit", "delete", "dirty"],
      setup(v, { emit: d }) {
        return () => le("section", { class: "neo-inset-section" }, [
          le("div", { class: "neo-section-header" }, [
            le("span", { class: "section-title" }, [
              le("i", { class: `fa-solid ${v.icon}` }),
              ` ${v.title}`
            ]),
            le("button", { class: "neo-text-btn add", onClick: () => d("add") }, [
              le("i", { class: "fa-solid fa-plus" }),
              ` ${v.labels.add}`
            ])
          ]),
          le("div", { class: "neo-dict-list list-container" }, v.rows.map((r) => le("div", {
            key: r.id,
            class: ["neo-dict-row editable-block", {
              "is-editing": r.editing,
              "is-action-open": ie("costumeRows", r)
            }],
            onClick: () => be("costumeRows", r)
          }, [
            le("div", { class: "view-mode dict-view" }, [
              le("div", { class: "dict-key" }, r.name || v.labels.role),
              le("div", { class: "dict-value" }, r.desc || v.labels.itemDesc)
            ]),
            le("div", {
              class: "edit-mode dict-edit-mode",
              onClick: (u) => u.stopPropagation()
            }, [
              le("input", {
                class: "neo-input short-key no-enter",
                value: r.name,
                placeholder: v.labels.role,
                onInput: (u) => {
                  r.name = u.target.value, d("dirty");
                },
                onKeydown: (u) => {
                  u.key === "Enter" && (u.preventDefault(), d("edit", r));
                }
              }),
              le("textarea", {
                class: "neo-textarea no-enter",
                value: r.desc,
                placeholder: v.labels.itemDesc,
                onInput: (u) => {
                  r.desc = u.target.value, d("dirty");
                },
                onKeydown: (u) => {
                  u.key === "Enter" && (u.preventDefault(), d("edit", r));
                }
              })
            ]),
            le(Ve, {
              row: r,
              onEdit: () => d("edit", r),
              onDelete: () => d("delete", r.id)
            })
          ])))
        ]);
      }
    });
    function Kt(v) {
      Ee(v);
    }
    function bn(v) {
      Object.assign(i, { sideplayMode: !1, showPanel: !0, ...v || {} });
    }
    return t({ replaceMeta: Kt, replaceConfig: bn }), (v, d) => (Oe(), Ne("div", {
      ref_key: "panelRoot",
      ref: l,
      class: "horae-message-panel-shell"
    }, [
      g("div", {
        class: "horae-panel-top",
        onClick: H
      }, [
        g("div", $l, [
          g("div", Dl, [
            g("i", {
              class: Ie(["fa-regular", c.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          g("div", Fl, [
            g("div", Ll, [
              c.isSkipped ? (Oe(), Ne("span", Nl, K(M(o).sideplay), 1)) : An("", !0),
              xe(" " + K(N.value), 1)
            ]),
            g("div", jl, K(O.value), 1)
          ])
        ]),
        g("div", Hl, [
          fe(g("button", {
            class: "neo-btn-icon",
            title: M(o).sideplayTitle,
            onClick: re(Zn, ["stop"])
          }, [
            g("i", {
              class: Ie(["fa-solid", c.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, Vl), [
            [vo, i.sideplayMode]
          ]),
          g("button", {
            class: "neo-btn-icon",
            title: M(o).rescan,
            onClick: re(Fe, ["stop"])
          }, [...d[21] || (d[21] = [
            g("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, Kl),
          g("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: M(o).aiAnalyze,
            disabled: x.ai,
            onClick: re(Vt, ["stop"])
          }, [
            g("i", {
              class: Ie(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, Ul)
        ])
      ]),
      pe(Ya, {
        css: !1,
        onBeforeEnter: ce,
        onEnter: he,
        onAfterEnter: ve,
        onBeforeLeave: j,
        onLeave: G,
        onAfterLeave: oe
      }, {
        default: li(() => [
          fe(g("div", Bl, [
            g("div", zl, [
              g("div", Wl, [
                g("span", ql, [
                  d[22] || (d[22] = g("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                  fe(g("input", {
                    "onUpdate:modelValue": d[0] || (d[0] = (r) => c.scene.location = r),
                    class: "neo-chip-input",
                    placeholder: M(o).location,
                    onInput: R
                  }, null, 40, Gl), [
                    [ye, c.scene.location]
                  ])
                ]),
                g("span", Jl, [
                  d[23] || (d[23] = g("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
                  fe(g("input", {
                    "onUpdate:modelValue": d[1] || (d[1] = (r) => c.scene.atmosphere = r),
                    class: "neo-chip-input",
                    placeholder: M(o).atmosphere,
                    onInput: R
                  }, null, 40, Yl), [
                    [ye, c.scene.atmosphere]
                  ])
                ]),
                g("span", Xl, [
                  d[24] || (d[24] = g("i", { class: "fa-solid fa-users" }, null, -1)),
                  fe(g("input", {
                    "onUpdate:modelValue": d[2] || (d[2] = (r) => A.value = r),
                    class: "neo-chip-input",
                    placeholder: M(o).characters,
                    onInput: P
                  }, null, 40, Zl), [
                    [ye, A.value]
                  ])
                ])
              ]),
              g("div", {
                class: Ie(["neo-event-card editable-block", { "is-editing": c.event.editing, "is-action-open": ie("event", c.event) }]),
                onClick: d[8] || (d[8] = (r) => be("event", c.event))
              }, [
                g("div", Ql, [
                  g("span", ec, [
                    d[25] || (d[25] = g("i", { class: "fa-solid fa-bolt" }, null, -1)),
                    xe(" " + K(te.value), 1)
                  ]),
                  g("div", tc, [
                    g("button", {
                      class: "action-hover-btn btn-edit",
                      onClick: d[3] || (d[3] = re((r) => V(c.event), ["stop"]))
                    }, [...d[26] || (d[26] = [
                      g("i", { class: "fa-solid fa-pen" }, null, -1)
                    ])])
                  ])
                ]),
                g("div", nc, [
                  g("div", sc, K(c.event.summary || M(o).noSpecialEvents), 1)
                ]),
                g("div", {
                  class: "edit-mode",
                  onClick: d[7] || (d[7] = re(() => {
                  }, ["stop"]))
                }, [
                  fe(g("select", {
                    "onUpdate:modelValue": d[4] || (d[4] = (r) => c.event.level = r),
                    class: "neo-input event-level-select",
                    onChange: R
                  }, [
                    g("option", oc, K(M(o).levelNone), 1),
                    g("option", ic, K(M(o).levelNormal), 1),
                    g("option", rc, K(M(o).levelImportant), 1),
                    g("option", ac, K(M(o).levelCritical), 1)
                  ], 544), [
                    [Po, c.event.level]
                  ]),
                  fe(g("textarea", {
                    "onUpdate:modelValue": d[5] || (d[5] = (r) => c.event.summary = r),
                    class: "neo-textarea lg no-enter",
                    rows: "2",
                    placeholder: M(o).eventPlaceholder,
                    onInput: R,
                    onKeydown: d[6] || (d[6] = Pe(re((r) => V(c.event), ["prevent"]), ["enter"]))
                  }, null, 40, lc), [
                    [ye, c.event.summary]
                  ])
                ])
              ], 2),
              g("section", cc, [
                g("div", uc, [
                  g("span", fc, [
                    d[27] || (d[27] = g("i", { class: "fa-solid fa-heart" }, null, -1)),
                    xe(" " + K(M(o).affection), 1)
                  ]),
                  g("button", {
                    class: "neo-text-btn add",
                    onClick: d[9] || (d[9] = (r) => X("affectionRows", "affection"))
                  }, [
                    d[28] || (d[28] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                    xe(" " + K(M(o).add), 1)
                  ])
                ]),
                g("div", pc, [
                  (Oe(!0), Ne(ke, null, wn(c.affectionRows, (r) => (Oe(), Ne("div", {
                    key: r.id,
                    class: Ie(["aff-chip editable-block", { "is-editing": r.editing, "is-action-open": ie("affectionRows", r) }]),
                    onClick: (u) => be("affectionRows", r)
                  }, [
                    g("div", hc, [
                      g("span", mc, K(r.name || M(o).role), 1),
                      g("span", gc, K(r.value || 0), 1)
                    ]),
                    g("div", {
                      class: "edit-mode",
                      onClick: d[10] || (d[10] = re(() => {
                      }, ["stop"]))
                    }, [
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.name = u,
                        class: "neo-input no-enter aff-name",
                        placeholder: M(o).role,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, vc), [
                        [ye, r.name]
                      ]),
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.value = u,
                        class: "neo-input no-enter aff-value",
                        placeholder: M(o).value,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, bc), [
                        [ye, r.value]
                      ])
                    ]),
                    pe(M(Ve), {
                      row: r,
                      onEdit: (u) => V(r),
                      onDelete: (u) => B("affectionRows", r.id)
                    }, null, 8, ["row", "onEdit", "onDelete"])
                  ], 10, dc))), 128))
                ])
              ]),
              g("section", yc, [
                g("div", xc, [
                  g("span", _c, [
                    d[29] || (d[29] = g("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                    xe(" " + K(M(o).relationships), 1)
                  ]),
                  g("button", {
                    class: "neo-text-btn add",
                    onClick: d[11] || (d[11] = (r) => X("relationshipRows", "relationship"))
                  }, [
                    d[30] || (d[30] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                    xe(" " + K(M(o).add), 1)
                  ])
                ]),
                g("div", wc, [
                  (Oe(!0), Ne(ke, null, wn(c.relationshipRows, (r) => (Oe(), Ne("div", {
                    key: r.id,
                    class: Ie(["rel-row editable-block", { "is-editing": r.editing, "is-action-open": ie("relationshipRows", r) }]),
                    onClick: (u) => be("relationshipRows", r)
                  }, [
                    g("div", Cc, [
                      g("span", Tc, K(r.from || M(o).role), 1),
                      d[31] || (d[31] = g("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                      g("span", Ac, K(r.to || M(o).role), 1),
                      g("span", Ec, K(r.type || M(o).relationshipHint), 1)
                    ]),
                    g("div", {
                      class: "edit-mode",
                      onClick: d[12] || (d[12] = re(() => {
                      }, ["stop"]))
                    }, [
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.from = u,
                        class: "neo-input no-enter rel-person",
                        placeholder: M(o).relFrom,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, Pc), [
                        [ye, r.from]
                      ]),
                      d[32] || (d[32] = g("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.to = u,
                        class: "neo-input no-enter rel-person",
                        placeholder: M(o).relTo,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, Mc), [
                        [ye, r.to]
                      ]),
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.type = u,
                        class: "neo-input no-enter",
                        placeholder: M(o).relType,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, Ic), [
                        [ye, r.type]
                      ])
                    ]),
                    pe(M(Ve), {
                      row: r,
                      onEdit: (u) => V(r),
                      onDelete: (u) => B("relationshipRows", r.id)
                    }, null, 8, ["row", "onEdit", "onDelete"])
                  ], 10, Sc))), 128))
                ])
              ]),
              pe(M(It), {
                title: M(o).costumes,
                icon: "fa-shirt",
                rows: c.costumeRows,
                labels: M(o),
                onAdd: d[13] || (d[13] = (r) => X("costumeRows", "costume")),
                onEdit: V,
                onDelete: d[14] || (d[14] = (r) => B("costumeRows", r)),
                onDirty: R
              }, null, 8, ["title", "rows", "labels"]),
              g("section", kc, [
                g("div", Rc, [
                  g("span", Oc, [
                    d[33] || (d[33] = g("i", { class: "fa-solid fa-box-open" }, null, -1)),
                    xe(" " + K(M(o).items), 1)
                  ]),
                  g("button", {
                    class: "neo-text-btn add",
                    onClick: d[15] || (d[15] = (r) => X("itemRows", "item"))
                  }, [
                    d[34] || (d[34] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                    xe(" " + K(M(o).add), 1)
                  ])
                ]),
                g("div", $c, [
                  (Oe(!0), Ne(ke, null, wn(c.itemRows, (r) => (Oe(), Ne("div", {
                    key: r.id,
                    class: Ie(["neo-item-card editable-block", { "is-editing": r.editing, "is-action-open": ie("itemRows", r) }]),
                    onClick: (u) => be("itemRows", r)
                  }, [
                    g("div", Fc, [
                      g("div", Lc, K(r.icon || "📦"), 1),
                      g("div", Nc, [
                        g("div", jc, [
                          g("span", null, K(r.name || M(o).itemName), 1),
                          r.holder ? (Oe(), Ne("span", Hc, K(r.holder), 1)) : An("", !0)
                        ]),
                        r.location ? (Oe(), Ne("div", Vc, [
                          d[35] || (d[35] = g("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                          xe(" " + K(r.location), 1)
                        ])) : An("", !0),
                        g("div", Kc, K(r.description || M(o).itemDesc), 1)
                      ])
                    ]),
                    g("div", {
                      class: "edit-mode item-edit-mode",
                      onClick: d[16] || (d[16] = re(() => {
                      }, ["stop"]))
                    }, [
                      g("div", Uc, [
                        fe(g("input", {
                          "onUpdate:modelValue": (u) => r.icon = u,
                          class: "neo-input no-enter item-icon-input",
                          maxlength: "2",
                          placeholder: "📦",
                          onInput: R,
                          onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                        }, null, 40, Bc), [
                          [ye, r.icon]
                        ]),
                        fe(g("input", {
                          "onUpdate:modelValue": (u) => r.name = u,
                          class: "neo-input no-enter",
                          placeholder: M(o).itemName,
                          onInput: R,
                          onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                        }, null, 40, zc), [
                          [ye, r.name]
                        ]),
                        fe(g("input", {
                          "onUpdate:modelValue": (u) => r.holder = u,
                          class: "neo-input no-enter item-holder-input",
                          placeholder: M(o).holder,
                          onInput: R,
                          onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                        }, null, 40, Wc), [
                          [ye, r.holder]
                        ])
                      ]),
                      fe(g("input", {
                        "onUpdate:modelValue": (u) => r.location = u,
                        class: "neo-input no-enter",
                        placeholder: M(o).location,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, qc), [
                        [ye, r.location]
                      ]),
                      fe(g("textarea", {
                        "onUpdate:modelValue": (u) => r.description = u,
                        class: "neo-textarea no-enter",
                        placeholder: M(o).itemDesc,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, Gc), [
                        [ye, r.description]
                      ])
                    ]),
                    pe(M(Ve), {
                      row: r,
                      "delete-icon": "fa-trash-can",
                      onEdit: (u) => V(r),
                      onDelete: (u) => B("itemRows", r.id)
                    }, null, 8, ["row", "onEdit", "onDelete"])
                  ], 10, Dc))), 128))
                ])
              ]),
              g("section", Jc, [
                g("div", Yc, [
                  g("span", Xc, [
                    d[36] || (d[36] = g("i", { class: "fa-solid fa-list-check" }, null, -1)),
                    xe(" " + K(M(o).agenda), 1)
                  ]),
                  g("button", {
                    class: "neo-text-btn add",
                    onClick: d[17] || (d[17] = (r) => X("agendaRows", "agenda"))
                  }, [
                    d[37] || (d[37] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                    xe(" " + K(M(o).add), 1)
                  ])
                ]),
                g("div", Zc, [
                  (Oe(!0), Ne(ke, null, wn(c.agendaRows, (r) => (Oe(), Ne("div", {
                    key: r.id,
                    class: Ie(["agenda-card editable-block", [M(Ml)(r.type), { "is-editing": r.editing, "is-action-open": ie("agendaRows", r) }]]),
                    onClick: (u) => be("agendaRows", r)
                  }, [
                    g("div", eu, [
                      g("div", tu, K(r.date || M(o).unscheduled), 1),
                      g("div", nu, [
                        g("span", su, K(M(Pl)(r.type)), 1),
                        g("span", ou, K(r.text || M(o).agendaText), 1)
                      ])
                    ]),
                    g("div", {
                      class: "edit-mode agenda-edit-mode",
                      onClick: d[18] || (d[18] = re(() => {
                      }, ["stop"]))
                    }, [
                      g("div", iu, [
                        fe(g("input", {
                          "onUpdate:modelValue": (u) => r.date = u,
                          class: "neo-input no-enter agenda-date-input",
                          placeholder: M(o).date,
                          onInput: R,
                          onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                        }, null, 40, ru), [
                          [ye, r.date]
                        ]),
                        fe(g("select", {
                          "onUpdate:modelValue": (u) => r.type = u,
                          class: "neo-input no-enter",
                          onChange: R,
                          onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                        }, [
                          g("option", lu, K(M(o).agendaMystery), 1),
                          g("option", cu, K(M(o).agendaPlan), 1)
                        ], 40, au), [
                          [Po, r.type]
                        ])
                      ]),
                      fe(g("textarea", {
                        "onUpdate:modelValue": (u) => r.text = u,
                        class: "neo-textarea no-enter",
                        placeholder: M(o).agendaText,
                        onInput: R,
                        onKeydown: Pe(re((u) => V(r), ["prevent"]), ["enter"])
                      }, null, 40, uu), [
                        [ye, r.text]
                      ])
                    ]),
                    pe(M(Ve), {
                      row: r,
                      onEdit: (u) => V(r),
                      onDelete: (u) => B("agendaRows", r.id)
                    }, null, 8, ["row", "onEdit", "onDelete"])
                  ], 10, Qc))), 128))
                ])
              ]),
              g("div", fu, [
                g("div", pu, [
                  g("button", {
                    class: "neo-btn-text",
                    disabled: x.scan,
                    onClick: ot
                  }, [
                    g("i", {
                      class: Ie(["fa-solid", x.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                    }, null, 2),
                    xe(" " + K(M(o).quickScan), 1)
                  ], 8, du),
                  g("button", {
                    class: "neo-btn-text btn-ai-text",
                    disabled: x.ai,
                    onClick: Vt
                  }, [
                    g("i", {
                      class: Ie(["fa-solid", x.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                    }, null, 2),
                    xe(" " + K(M(o).aiAnalyze), 1)
                  ], 8, hu)
                ]),
                g("div", mu, [
                  g("button", {
                    class: "neo-btn-text btn-save-apply",
                    disabled: x.save,
                    onClick: Pt
                  }, [
                    g("i", {
                      class: Ie(["fa-solid", x.save ? "fa-spinner fa-spin" : "fa-check"])
                    }, null, 2),
                    xe(" " + K(M(o).apply), 1)
                  ], 8, gu),
                  g("button", {
                    class: "neo-btn-text",
                    onClick: d[19] || (d[19] = (r) => p.value = !0)
                  }, [
                    d[38] || (d[38] = g("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                    xe(" " + K(M(o).collapse), 1)
                  ]),
                  g("button", {
                    style: { display: "none" },
                    class: "neo-btn-text btn-drawer",
                    title: M(o).openDrawer,
                    onClick: d[20] || (d[20] = (r) => {
                      var u, m;
                      return (m = (u = M(a)).openDrawer) == null ? void 0 : m.call(u);
                    })
                  }, [...d[39] || (d[39] = [
                    g("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
                  ])], 8, vu)
                ])
              ])
            ])
          ], 512), [
            [vo, !p.value]
          ])
        ]),
        _: 1
      })
    ], 512));
  }
}, yu = '.horae-message-panel.horae-message-panel-vue{background:#2b2d31!important;border:0!important;border-radius:20px!important;box-shadow:6px 6px 12px #0006,-4px -4px 10px #ffffff0d!important;color:#b5bac1!important;margin-top:10px!important;margin-bottom:18px!important;overflow:hidden!important;--mp-bg-base: #2b2d31;--mp-text-title: #e3e5e8;--mp-text-main: #b5bac1;--mp-text-muted: #80848e;--mp-accent: #a78bfa;--mp-danger: #fb7185;--mp-success: #34d399;--mp-warning: #fbbf24;--mp-info: #38bdf8;--mp-pink: #f472b6;--mp-light-shadow: rgba(255, 255, 255, .05);--mp-dark-shadow: rgba(0, 0, 0, .4);--mp-neo-drop: 6px 6px 12px var(--mp-dark-shadow), -4px -4px 10px var(--mp-light-shadow);--mp-neo-drop-sm: 4px 4px 8px var(--mp-dark-shadow), -2px -2px 6px var(--mp-light-shadow);--mp-neo-inset: inset 4px 4px 8px var(--mp-dark-shadow), inset -4px -4px 8px var(--mp-light-shadow);--mp-neo-inset-sm: inset 2px 2px 4px var(--mp-dark-shadow), inset -2px -2px 4px var(--mp-light-shadow);--mp-radius-md: 12px;--mp-radius-sm: 8px;--mp-radius-round: 50px}.horae-message-panel.horae-message-panel-vue.horae-light{--mp-bg-base: #eef0f4;--mp-text-title: #20242c;--mp-text-main: #4a5160;--mp-text-muted: #767d8c;--mp-light-shadow: rgba(255, 255, 255, .95);--mp-dark-shadow: rgba(122, 132, 150, .28);color:var(--mp-text-main)!important}.horae-message-panel.horae-message-panel-vue.horae-sideplay{opacity:.72}.horae-message-panel-vue *,.horae-message-panel-vue *:before,.horae-message-panel-vue *:after{box-sizing:border-box}.horae-message-panel-vue button{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;box-shadow:none;text-shadow:none!important;font:inherit!important}.horae-message-panel-vue .horae-panel-top{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid rgba(255,255,255,.02);cursor:pointer;transition:background .2s;-webkit-user-select:none;user-select:none}.horae-message-panel-vue .horae-panel-top:hover{background:#ffffff05}.horae-message-panel-vue .toggle-left{flex:1;min-width:0;display:flex;align-items:center;gap:16px}.horae-message-panel-vue .toggle-icon{flex:0 0 auto;font-size:1.1rem;color:var(--mp-accent);display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;box-shadow:var(--mp-neo-drop)}.horae-message-panel-vue .toggle-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.horae-message-panel-vue .toggle-time{color:var(--mp-text-title);font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:8px}.horae-message-panel-vue .toggle-summary{color:var(--mp-text-muted);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.horae-message-panel-vue .toggle-actions{flex:0 0 auto;display:flex;gap:12px}.horae-message-panel-vue .neo-btn-icon{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;width:38px;height:38px;border-radius:50%!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0!important}.horae-message-panel-vue .neo-btn-icon:hover{color:var(--mp-accent)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-icon:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .neo-btn-icon:disabled,.horae-message-panel-vue .neo-btn-text:disabled{cursor:wait;opacity:.7}.horae-message-panel-vue .horae-panel-content{padding:16px 24px 24px;background:transparent!important;border-top:0!important;box-sizing:border-box;transform-origin:top}.horae-message-panel-vue .neo-dashboard{display:flex;flex-direction:column;gap:24px}.horae-message-panel-vue .neo-tags{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .neo-chip{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);padding:8px 16px;border-radius:var(--mp-radius-round);font-size:.9rem;display:inline-flex;align-items:center;gap:8px;min-width:min(100%,180px)}.horae-message-panel-vue .neo-chip i{color:var(--mp-accent);opacity:.85}.horae-message-panel-vue .neo-chip-input{width:100%;min-width:80px;background:transparent!important;border:none!important;box-shadow:none!important;color:var(--mp-text-main)!important;padding:0!important;font-size:.9rem!important;outline:none!important}.horae-message-panel-vue .neo-input,.horae-message-panel-vue .neo-textarea{width:100%;background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-title)!important;font-size:.95rem!important;box-shadow:var(--mp-neo-inset)!important;outline:none!important;border-radius:var(--mp-radius-sm)!important;font-family:inherit;transition:box-shadow .2s;line-height:1.5}.horae-message-panel-vue .neo-input{padding:8px 12px!important;height:36px}.horae-message-panel-vue .neo-textarea{padding:10px 14px!important;resize:vertical;min-height:42px;overflow:hidden}.horae-message-panel-vue .neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}.horae-message-panel-vue .neo-input:focus,.horae-message-panel-vue .neo-textarea:focus{box-shadow:var(--mp-neo-inset),0 0 0 1px var(--mp-warning)!important}.horae-message-panel-vue .neo-text-btn{background:transparent!important;border:none!important;color:var(--mp-text-muted)!important;cursor:pointer;font-size:.85rem!important;display:flex;align-items:center;gap:6px;font-weight:500;transition:color .2s;outline:none;padding:0!important}.horae-message-panel-vue .neo-text-btn:hover{color:var(--mp-text-title)!important}.horae-message-panel-vue .neo-text-btn.add:hover{color:var(--mp-accent)!important}.horae-message-panel-vue .neo-inset-section{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);border-radius:var(--mp-radius-md);padding:16px 20px}.horae-message-panel-vue .neo-section-header{margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.horae-message-panel-vue .neo-section-header.compact{margin-bottom:12px}.horae-message-panel-vue .section-title{font-size:.85rem;color:var(--mp-text-title);display:flex;align-items:center;gap:8px;font-weight:600;text-transform:uppercase}.horae-message-panel-vue .section-title i{color:var(--mp-accent);opacity:.9}.horae-message-panel-vue .action-group-hover{display:flex;gap:4px;opacity:0;transform:translate(6px);transition:all .2s ease;margin-left:auto;flex:0 0 auto;pointer-events:none}.horae-message-panel-vue .action-hover-btn{width:28px;height:28px;border-radius:50%!important;border:none!important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem!important;color:var(--mp-text-muted)!important;background:transparent!important;transition:all .2s ease;outline:none;padding:0!important}.horae-message-panel-vue .action-hover-btn.btn-edit:hover{background:#38bdf81a!important;color:var(--mp-info)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .action-hover-btn.btn-del:hover{background:#fb71851a!important;color:var(--mp-danger)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .is-editing .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .is-editing .btn-edit{color:var(--mp-success)!important}.horae-message-panel-vue .is-editing .btn-edit i:before{content:""}.horae-message-panel-vue .view-mode{display:flex;gap:10px;flex:1;min-width:0;align-items:flex-start}.horae-message-panel-vue .edit-mode{display:none;gap:10px;flex:1;min-width:0;align-items:flex-start;flex-wrap:wrap}.horae-message-panel-vue .is-editing .view-mode{display:none!important}.horae-message-panel-vue .is-editing .edit-mode{display:flex!important}.horae-message-panel-vue .neo-event-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop);border-radius:var(--mp-radius-md);padding:18px 20px;border-left:4px solid var(--mp-warning);position:relative}.horae-message-panel-vue .event-header{margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}.horae-message-panel-vue .event-badge{font-size:.85rem;color:var(--mp-warning);font-weight:600;display:flex;align-items:center;gap:6px}.horae-message-panel-vue .event-body-text{font-size:1.02rem;color:var(--mp-text-title);line-height:1.6;word-break:break-word}.horae-message-panel-vue .neo-event-card .action-group-hover{position:absolute;right:20px;top:16px;opacity:1}.horae-message-panel-vue .event-level-select{flex:0 0 110px}.horae-message-panel-vue .aff-grid{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .aff-chip{background:#ffffff05;border-radius:var(--mp-radius-sm);padding:6px 12px;display:inline-flex;align-items:center;transition:all .2s ease;position:relative;border:1px solid rgba(255,255,255,.03);min-height:38px}.horae-message-panel-vue .aff-chip:hover{background:#ffffff0a}.horae-message-panel-vue .aff-chip .view-mode{align-items:center;margin:0;gap:10px}.horae-message-panel-vue .aff-chip .t-title{font-weight:600;font-size:.9rem;color:var(--mp-text-title);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.horae-message-panel-vue .aff-chip .t-val{font-weight:700;font-size:.95rem;color:var(--mp-pink);font-family:monospace}.horae-message-panel-vue .aff-chip .edit-mode{align-items:center;gap:6px}.horae-message-panel-vue .aff-name{width:76px!important;min-width:76px}.horae-message-panel-vue .aff-value{width:58px!important;min-width:58px}.horae-message-panel-vue .aff-chip .action-group-hover{position:absolute;right:-8px;top:-14px;background:var(--mp-bg-base);border-radius:20px;box-shadow:var(--mp-neo-drop-sm);padding:2px 4px;z-index:10;margin:0}.horae-message-panel-vue .aff-chip.is-editing .action-group-hover{position:static;background:transparent;box-shadow:none;padding:0;margin-left:2px}.horae-message-panel-vue .rel-list,.horae-message-panel-vue .neo-dict-list,.horae-message-panel-vue .neo-item-list,.horae-message-panel-vue .neo-agenda-list{display:flex;flex-direction:column}.horae-message-panel-vue .rel-list{gap:4px}.horae-message-panel-vue .neo-dict-list{gap:6px}.horae-message-panel-vue .neo-item-list{gap:14px}.horae-message-panel-vue .neo-agenda-list{gap:12px}.horae-message-panel-vue .rel-row,.horae-message-panel-vue .neo-dict-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:var(--mp-radius-sm);transition:background .2s;position:relative}.horae-message-panel-vue .rel-row{align-items:center;padding-top:6px;padding-bottom:6px}.horae-message-panel-vue .rel-row:hover,.horae-message-panel-vue .neo-dict-row:hover{background:#ffffff05}.horae-message-panel-vue .rel-row .view-mode{align-items:center;gap:10px;font-size:.9rem;flex-wrap:wrap}.horae-message-panel-vue .rel-node{font-weight:600;color:var(--mp-text-title);background:#0003;padding:2px 8px;border-radius:4px}.horae-message-panel-vue .rel-arrow{color:var(--mp-accent);opacity:.7;font-size:.8rem}.horae-message-panel-vue .rel-label{color:var(--mp-text-main);font-style:italic}.horae-message-panel-vue .rel-person{width:82px!important;flex:0 0 82px!important}.horae-message-panel-vue .dict-view{align-items:flex-start}.horae-message-panel-vue .dict-key{color:var(--mp-accent);font-weight:600;white-space:nowrap;flex:0 0 auto;line-height:1.5}.horae-message-panel-vue .dict-key:after{content:":";color:var(--mp-text-muted);margin-left:2px}.horae-message-panel-vue .dict-value{color:var(--mp-text-main);line-height:1.5;word-break:break-word}.horae-message-panel-vue .dict-edit-mode{align-items:flex-start}.horae-message-panel-vue .short-key{width:100px!important;flex:0 0 100px!important}.horae-message-panel-vue .neo-item-card,.horae-message-panel-vue .agenda-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop-sm);border-radius:var(--mp-radius-sm);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;position:relative}.horae-message-panel-vue .item-emoji{font-size:1.6rem;line-height:1;margin-top:2px}.horae-message-panel-vue .item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-right:2px}.horae-message-panel-vue .item-line-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:600;color:var(--mp-text-title);font-size:1rem}.horae-message-panel-vue .item-holder-badge{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset-sm);color:var(--mp-accent);font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:400}.horae-message-panel-vue .item-meta{font-size:.8rem;color:var(--mp-text-muted)}.horae-message-panel-vue .item-desc{font-size:.9rem;color:var(--mp-text-main);line-height:1.4;word-break:break-word}.horae-message-panel-vue .item-edit-mode{flex-direction:column}.horae-message-panel-vue .item-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .item-icon-input{width:52px!important;flex:0 0 52px!important;text-align:center}.horae-message-panel-vue .item-holder-input{width:90px!important;flex:0 0 90px!important}.horae-message-panel-vue .agenda-card{border-left:3px solid var(--mp-text-muted)}.horae-message-panel-vue .agenda-card.type-suspense{border-left-color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-suspense .agenda-type{color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-plan{border-left-color:var(--mp-info)}.horae-message-panel-vue .agenda-card.type-plan .agenda-type{color:var(--mp-info)}.horae-message-panel-vue .agenda-date{font-size:.8rem;color:var(--mp-text-muted);white-space:nowrap;padding-top:2px;font-family:monospace;width:80px;flex:0 0 80px}.horae-message-panel-vue .agenda-content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.horae-message-panel-vue .agenda-type{font-size:.75rem;font-weight:600}.horae-message-panel-vue .agenda-text{font-size:.95rem;color:var(--mp-text-title);word-break:break-word}.horae-message-panel-vue .agenda-edit-mode{flex-direction:column}.horae-message-panel-vue .agenda-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .agenda-date-input{width:110px!important;flex:0 0 110px!important}.horae-message-panel-vue .neo-footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px}.horae-message-panel-vue .action-group{display:flex;gap:12px;align-items:center}.horae-message-panel-vue .neo-btn-text{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;padding:10px 20px!important;border-radius:var(--mp-radius-round)!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;font-size:.9rem!important;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .2s ease;outline:none;white-space:nowrap}.horae-message-panel-vue .neo-btn-text:hover{color:var(--mp-text-title)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-text:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .btn-ai-text{color:var(--mp-accent)!important}.horae-message-panel-vue .btn-save-apply{color:var(--mp-success)!important}.horae-message-panel-vue .btn-drawer{padding-left:13px!important;padding-right:13px!important}.horae-message-panel-vue .horae-sideplay-badge{background:var(--mp-text-muted);color:var(--mp-bg-base);font-size:10px;padding:1px 6px;border-radius:3px;font-weight:700}@media(max-width:768px){.horae-message-panel-vue .horae-panel-top,.horae-message-panel-vue .horae-panel-content{padding:16px}.horae-message-panel-vue .toggle-actions{gap:8px}.horae-message-panel-vue .neo-btn-icon{width:34px;height:34px}.horae-message-panel-vue .dict-view,.horae-message-panel-vue .agenda-card .view-mode,.horae-message-panel-vue .agenda-card .edit-mode{flex-direction:column;gap:8px}.horae-message-panel-vue .dict-key:after{content:""}.horae-message-panel-vue .action-group-hover,.horae-message-panel-vue .neo-event-card .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:0;transform:translate(6px);pointer-events:none}.horae-message-panel-vue .editable-block.is-action-open>.action-group-hover,.horae-message-panel-vue .editable-block.is-action-open .event-header>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing .event-header>.action-group-hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .neo-footer-actions{flex-direction:column;align-items:stretch;gap:12px;margin-top:6px}.horae-message-panel-vue .action-group{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}.horae-message-panel-vue .neo-btn-text{width:100%;justify-content:center;padding:12px 10px!important;font-size:.85rem!important}.horae-message-panel-vue .btn-drawer{grid-column:1 / -1}}@media(prefers-reduced-motion:reduce){.horae-message-panel-vue .horae-panel-content{transition:none!important;transform:none!important}}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;max-width:none!important;margin:0!important;border:none!important;border-radius:var(--mp-radius-sm)!important;background:var(--mp-bg-base)!important;color:var(--mp-text-title)!important;font-family:inherit!important;font-size:.95rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:var(--mp-neo-inset)!important;text-shadow:none!important;outline:none!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input{height:36px!important;min-height:36px!important;padding:8px 12px!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:42px!important;padding:10px 14px!important;resize:vertical!important;overflow:hidden!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-chip-input{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;min-width:80px!important;margin:0!important;padding:0!important;border:none!important;border-radius:0!important;background:transparent!important;color:var(--mp-text-main)!important;font-family:inherit!important;font-size:.9rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .toggle-icon,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .toggle-icon i:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before{color:var(--mp-accent)!important;text-shadow:none!important}.horae-message-panel.horae-message-panel-vue .section-title i:before,.horae-message-panel.horae-message-panel-vue .neo-chip i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .section-title i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .neo-chip i:before{color:var(--mp-accent)!important;text-shadow:none!important}', xu = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i, _u = "/css/fontawesome.min.css";
function wu(e) {
  e.style.setProperty("margin-top", "10px", "important"), e.style.setProperty("margin-bottom", "18px", "important"), e.style.setProperty("padding", "0", "important"), e.style.setProperty("background", "transparent", "important"), e.style.setProperty("border", "0", "important"), e.style.setProperty("border-radius", "0", "important"), e.style.setProperty("box-shadow", "none", "important"), e.style.setProperty("overflow", "visible", "important"), e.style.setProperty("opacity", "1", "important"), e.style.setProperty("order", "9999", "important");
}
function Su(e) {
  if (!e.querySelector("style[data-horae-message-panel-style]")) {
    const n = document.createElement("style");
    n.dataset.horaeMessagePanelStyle = "true", n.textContent = yu, e.append(n);
  }
  const t = /* @__PURE__ */ new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((n) => {
    xu.test(n.href) && t.add(n.href);
  }), t.size || t.add(_u), t.forEach((n) => {
    if (Array.from(e.querySelectorAll("link[data-horae-fontawesome]")).some((i) => i.href === n)) return;
    const o = document.createElement("link");
    o.dataset.horaeFontawesome = "true", o.rel = "stylesheet", o.href = n, e.append(o);
  });
}
function Cu(e) {
  wu(e);
  const t = e.shadowRoot || e.attachShadow({ mode: "open" });
  t.textContent = "", Su(t);
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
function Tu(e, t = {}) {
  if (!e) return null;
  const { panelContainer: n, classObserver: s, syncPanelContainer: o } = Cu(e), i = Sl(bu, {
    ...t,
    setHostState(c = {}) {
      var p;
      e.classList.toggle("horae-sideplay", !!c.isSkipped), typeof c.visible == "boolean" && (e.style.display = c.visible ? "" : "none"), o(), (p = t.setHostState) == null || p.call(t, c);
    }
  }), a = i.mount(n), l = new MutationObserver(() => {
    document.body.contains(e) || (i.unmount(), l.disconnect(), s.disconnect());
  });
  return l.observe(document.body, { childList: !0, subtree: !0 }), {
    unmount() {
      l.disconnect(), s.disconnect(), i.unmount();
    },
    updateMeta(c) {
      var p;
      (p = a == null ? void 0 : a.replaceMeta) == null || p.call(a, c);
    },
    updateConfig(c) {
      var p;
      (p = a == null ? void 0 : a.replaceConfig) == null || p.call(a, c);
    }
  };
}
export {
  Tu as mountMessagePanel
};
