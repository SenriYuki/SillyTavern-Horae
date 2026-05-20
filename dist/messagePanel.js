/**
* @vue/shared v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function rs(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const X = {}, wt = [], We = () => {
}, ro = () => !1, Cn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), An = (e) => e.startsWith("onUpdate:"), fe = Object.assign, as = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, hi = Object.prototype.hasOwnProperty, B = (e, t) => hi.call(e, t), D = Array.isArray, St = (e) => Qt(e) === "[object Map]", Tn = (e) => Qt(e) === "[object Set]", Ts = (e) => Qt(e) === "[object Date]", K = (e) => typeof e == "function", se = (e) => typeof e == "string", qe = (e) => typeof e == "symbol", q = (e) => e !== null && typeof e == "object", ao = (e) => (q(e) || K(e)) && K(e.then) && K(e.catch), lo = Object.prototype.toString, Qt = (e) => lo.call(e), mi = (e) => Qt(e).slice(8, -1), co = (e) => Qt(e) === "[object Object]", ls = (e) => se(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Kt = /* @__PURE__ */ rs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), En = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, gi = /-\w/g, $e = En(
  (e) => e.replace(gi, (t) => t.slice(1).toUpperCase())
), vi = /\B([A-Z])/g, at = En(
  (e) => e.replace(vi, "-$1").toLowerCase()
), uo = En((e) => e.charAt(0).toUpperCase() + e.slice(1)), Kn = En(
  (e) => e ? `on${uo(e)}` : ""
), Be = (e, t) => !Object.is(e, t), un = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, fo = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Rn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let Es;
const On = () => Es || (Es = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function cs(e) {
  if (D(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = se(s) ? _i(s) : cs(s);
      if (o)
        for (const i in o)
          t[i] = o[i];
    }
    return t;
  } else if (se(e) || q(e))
    return e;
}
const bi = /;(?![^(]*\))/g, xi = /:([^]+)/, yi = /\/\*[^]*?\*\//g;
function _i(e) {
  const t = {};
  return e.replace(yi, "").split(bi).forEach((n) => {
    if (n) {
      const s = n.split(xi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Ce(e) {
  let t = "";
  if (se(e))
    t = e;
  else if (D(e))
    for (let n = 0; n < e.length; n++) {
      const s = Ce(e[n]);
      s && (t += s + " ");
    }
  else if (q(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const wi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Si = /* @__PURE__ */ rs(wi);
function po(e) {
  return !!e || e === "";
}
function Ci(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = en(e[s], t[s]);
  return n;
}
function en(e, t) {
  if (e === t) return !0;
  let n = Ts(e), s = Ts(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = qe(e), s = qe(t), n || s)
    return e === t;
  if (n = D(e), s = D(t), n || s)
    return n && s ? Ci(e, t) : !1;
  if (n = q(e), s = q(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, i = Object.keys(t).length;
    if (o !== i)
      return !1;
    for (const r in e) {
      const a = e.hasOwnProperty(r), l = t.hasOwnProperty(r);
      if (a && !l || !a && l || !en(e[r], t[r]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function Ai(e, t) {
  return e.findIndex((n) => en(n, t));
}
const ho = (e) => !!(e && e.__v_isRef === !0), V = (e) => se(e) ? e : e == null ? "" : D(e) || q(e) && (e.toString === lo || !K(e.toString)) ? ho(e) ? V(e.value) : JSON.stringify(e, mo, 2) : String(e), mo = (e, t) => ho(t) ? mo(e, t.value) : St(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], i) => (n[Vn(s, i) + " =>"] = o, n),
    {}
  )
} : Tn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Vn(n))
} : qe(t) ? Vn(t) : q(t) && !D(t) && !co(t) ? String(t) : t, Vn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    qe(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ue;
class Ti {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ue && (ue.active ? (this.parent = ue, this.index = (ue.scopes || (ue.scopes = [])).push(
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
      const n = ue;
      try {
        return ue = this, t();
      } finally {
        ue = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ue, ue = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ue === this)
        ue = this.prevScope;
      else {
        let t = ue;
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
function Ei() {
  return ue;
}
let ee;
const Hn = /* @__PURE__ */ new WeakSet();
class go {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ue && (ue.active ? ue.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Hn.has(this) && (Hn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || bo(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Rs(this), xo(this);
    const t = ee, n = De;
    ee = this, De = !0;
    try {
      return this.fn();
    } finally {
      yo(this), ee = t, De = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        ps(t);
      this.deps = this.depsTail = void 0, Rs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Hn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Gn(this) && this.run();
  }
  get dirty() {
    return Gn(this);
  }
}
let vo = 0, Vt, Ht;
function bo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Ht, Ht = e;
    return;
  }
  e.next = Vt, Vt = e;
}
function us() {
  vo++;
}
function fs() {
  if (--vo > 0)
    return;
  if (Ht) {
    let t = Ht;
    for (Ht = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Vt; ) {
    let t = Vt;
    for (Vt = void 0; t; ) {
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
function xo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function yo(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), ps(s), Ri(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function Gn(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (_o(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function _o(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === qt) || (e.globalVersion = qt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Gn(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ee, s = De;
  ee = e, De = !0;
  try {
    xo(e);
    const o = e.fn(e._value);
    (t.version === 0 || Be(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    ee = n, De = s, yo(e), e.flags &= -3;
  }
}
function ps(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      ps(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Ri(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let De = !0;
const wo = [];
function tt() {
  wo.push(De), De = !1;
}
function nt() {
  const e = wo.pop();
  De = e === void 0 ? !0 : e;
}
function Rs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ee;
    ee = void 0;
    try {
      t();
    } finally {
      ee = n;
    }
  }
}
let qt = 0;
class Oi {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class ds {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!ee || !De || ee === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ee)
      n = this.activeLink = new Oi(ee, this), ee.deps ? (n.prevDep = ee.depsTail, ee.depsTail.nextDep = n, ee.depsTail = n) : ee.deps = ee.depsTail = n, So(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ee.depsTail, n.nextDep = void 0, ee.depsTail.nextDep = n, ee.depsTail = n, ee.deps === n && (ee.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, qt++, this.notify(t);
  }
  notify(t) {
    us();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      fs();
    }
  }
}
function So(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        So(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Yn = /* @__PURE__ */ new WeakMap(), dt = /* @__PURE__ */ Symbol(
  ""
), Xn = /* @__PURE__ */ Symbol(
  ""
), Jt = /* @__PURE__ */ Symbol(
  ""
);
function he(e, t, n) {
  if (De && ee) {
    let s = Yn.get(e);
    s || Yn.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new ds()), o.map = s, o.key = n), o.track();
  }
}
function Qe(e, t, n, s, o, i) {
  const r = Yn.get(e);
  if (!r) {
    qt++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (us(), t === "clear")
    r.forEach(a);
  else {
    const l = D(e), d = l && ls(n);
    if (l && n === "length") {
      const f = Number(s);
      r.forEach((v, w) => {
        (w === "length" || w === Jt || !qe(w) && w >= f) && a(v);
      });
    } else
      switch ((n !== void 0 || r.has(void 0)) && a(r.get(n)), d && a(r.get(Jt)), t) {
        case "add":
          l ? d && a(r.get("length")) : (a(r.get(dt)), St(e) && a(r.get(Xn)));
          break;
        case "delete":
          l || (a(r.get(dt)), St(e) && a(r.get(Xn)));
          break;
        case "set":
          St(e) && a(r.get(dt));
          break;
      }
  }
  fs();
}
function xt(e) {
  const t = /* @__PURE__ */ z(e);
  return t === e ? t : (he(t, "iterate", Jt), /* @__PURE__ */ ke(e) ? t : t.map(Fe));
}
function In(e) {
  return he(e = /* @__PURE__ */ z(e), "iterate", Jt), e;
}
function Le(e, t) {
  return /* @__PURE__ */ st(e) ? Et(/* @__PURE__ */ ht(e) ? Fe(t) : t) : Fe(t);
}
const Ii = {
  __proto__: null,
  [Symbol.iterator]() {
    return Nn(this, Symbol.iterator, (e) => Le(this, e));
  },
  concat(...e) {
    return xt(this).concat(
      ...e.map((t) => D(t) ? xt(t) : t)
    );
  },
  entries() {
    return Nn(this, "entries", (e) => (e[1] = Le(this, e[1]), e));
  },
  every(e, t) {
    return Ye(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Ye(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Le(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Ye(
      this,
      "find",
      e,
      t,
      (n) => Le(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Ye(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Ye(
      this,
      "findLast",
      e,
      t,
      (n) => Le(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Ye(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Ye(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Un(this, "includes", e);
  },
  indexOf(...e) {
    return Un(this, "indexOf", e);
  },
  join(e) {
    return xt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Un(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Ye(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return kt(this, "pop");
  },
  push(...e) {
    return kt(this, "push", e);
  },
  reduce(e, ...t) {
    return Os(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Os(this, "reduceRight", e, t);
  },
  shift() {
    return kt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Ye(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return kt(this, "splice", e);
  },
  toReversed() {
    return xt(this).toReversed();
  },
  toSorted(e) {
    return xt(this).toSorted(e);
  },
  toSpliced(...e) {
    return xt(this).toSpliced(...e);
  },
  unshift(...e) {
    return kt(this, "unshift", e);
  },
  values() {
    return Nn(this, "values", (e) => Le(this, e));
  }
};
function Nn(e, t, n) {
  const s = In(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ ke(e) && (o._next = o.next, o.next = () => {
    const i = o._next();
    return i.done || (i.value = n(i.value)), i;
  }), o;
}
const Mi = Array.prototype;
function Ye(e, t, n, s, o, i) {
  const r = In(e), a = r !== e && !/* @__PURE__ */ ke(e), l = r[t];
  if (l !== Mi[t]) {
    const v = l.apply(e, i);
    return a ? Fe(v) : v;
  }
  let d = n;
  r !== e && (a ? d = function(v, w) {
    return n.call(this, Le(e, v), w, e);
  } : n.length > 2 && (d = function(v, w) {
    return n.call(this, v, w, e);
  }));
  const f = l.call(r, d, s);
  return a && o ? o(f) : f;
}
function Os(e, t, n, s) {
  const o = In(e), i = o !== e && !/* @__PURE__ */ ke(e);
  let r = n, a = !1;
  o !== e && (i ? (a = s.length === 0, r = function(d, f, v) {
    return a && (a = !1, d = Le(e, d)), n.call(this, d, Le(e, f), v, e);
  }) : n.length > 3 && (r = function(d, f, v) {
    return n.call(this, d, f, v, e);
  }));
  const l = o[t](r, ...s);
  return a ? Le(e, l) : l;
}
function Un(e, t, n) {
  const s = /* @__PURE__ */ z(e);
  he(s, "iterate", Jt);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ gs(n[0]) ? (n[0] = /* @__PURE__ */ z(n[0]), s[t](...n)) : o;
}
function kt(e, t, n = []) {
  tt(), us();
  const s = (/* @__PURE__ */ z(e))[t].apply(e, n);
  return fs(), nt(), s;
}
const ki = /* @__PURE__ */ rs("__proto__,__v_isRef,__isVue"), Co = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(qe)
);
function Pi(e) {
  qe(e) || (e = String(e));
  const t = /* @__PURE__ */ z(this);
  return he(t, "has", e), t.hasOwnProperty(e);
}
class Ao {
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
      return s === (o ? i ? Li : Oo : i ? Ro : Eo).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const r = D(t);
    if (!o) {
      let l;
      if (r && (l = Ii[n]))
        return l;
      if (n === "hasOwnProperty")
        return Pi;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ me(t) ? t : s
    );
    if ((qe(n) ? Co.has(n) : ki(n)) || (o || he(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ me(a)) {
      const l = r && ls(n) ? a : a.value;
      return o && q(l) ? /* @__PURE__ */ Qn(l) : l;
    }
    return q(a) ? o ? /* @__PURE__ */ Qn(a) : /* @__PURE__ */ Gt(a) : a;
  }
}
class To extends Ao {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let i = t[n];
    const r = D(t) && ls(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ st(i);
      if (!/* @__PURE__ */ ke(s) && !/* @__PURE__ */ st(s) && (i = /* @__PURE__ */ z(i), s = /* @__PURE__ */ z(s)), !r && /* @__PURE__ */ me(i) && !/* @__PURE__ */ me(s))
        return d || (i.value = s), !0;
    }
    const a = r ? Number(n) < t.length : B(t, n), l = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ me(t) ? t : o
    );
    return t === /* @__PURE__ */ z(o) && (a ? Be(s, i) && Qe(t, "set", n, s) : Qe(t, "add", n, s)), l;
  }
  deleteProperty(t, n) {
    const s = B(t, n);
    t[n];
    const o = Reflect.deleteProperty(t, n);
    return o && s && Qe(t, "delete", n, void 0), o;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!qe(n) || !Co.has(n)) && he(t, "has", n), s;
  }
  ownKeys(t) {
    return he(
      t,
      "iterate",
      D(t) ? "length" : dt
    ), Reflect.ownKeys(t);
  }
}
class $i extends Ao {
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
const Di = /* @__PURE__ */ new To(), Fi = /* @__PURE__ */ new $i(), ji = /* @__PURE__ */ new To(!0);
const Zn = (e) => e, rn = (e) => Reflect.getPrototypeOf(e);
function Ki(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, i = /* @__PURE__ */ z(o), r = St(i), a = e === "entries" || e === Symbol.iterator && r, l = e === "keys" && r, d = o[e](...s), f = n ? Zn : t ? Et : Fe;
    return !t && he(
      i,
      "iterate",
      l ? Xn : dt
    ), fe(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: v, done: w } = d.next();
          return w ? { value: v, done: w } : {
            value: a ? [f(v[0]), f(v[1])] : f(v),
            done: w
          };
        }
      }
    );
  };
}
function an(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Vi(e, t) {
  const n = {
    get(o) {
      const i = this.__v_raw, r = /* @__PURE__ */ z(i), a = /* @__PURE__ */ z(o);
      e || (Be(o, a) && he(r, "get", o), he(r, "get", a));
      const { has: l } = rn(r), d = t ? Zn : e ? Et : Fe;
      if (l.call(r, o))
        return d(i.get(o));
      if (l.call(r, a))
        return d(i.get(a));
      i !== r && i.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && he(/* @__PURE__ */ z(o), "iterate", dt), o.size;
    },
    has(o) {
      const i = this.__v_raw, r = /* @__PURE__ */ z(i), a = /* @__PURE__ */ z(o);
      return e || (Be(o, a) && he(r, "has", o), he(r, "has", a)), o === a ? i.has(o) : i.has(o) || i.has(a);
    },
    forEach(o, i) {
      const r = this, a = r.__v_raw, l = /* @__PURE__ */ z(a), d = t ? Zn : e ? Et : Fe;
      return !e && he(l, "iterate", dt), a.forEach((f, v) => o.call(i, d(f), d(v), r));
    }
  };
  return fe(
    n,
    e ? {
      add: an("add"),
      set: an("set"),
      delete: an("delete"),
      clear: an("clear")
    } : {
      add(o) {
        const i = /* @__PURE__ */ z(this), r = rn(i), a = /* @__PURE__ */ z(o), l = !t && !/* @__PURE__ */ ke(o) && !/* @__PURE__ */ st(o) ? a : o;
        return r.has.call(i, l) || Be(o, l) && r.has.call(i, o) || Be(a, l) && r.has.call(i, a) || (i.add(l), Qe(i, "add", l, l)), this;
      },
      set(o, i) {
        !t && !/* @__PURE__ */ ke(i) && !/* @__PURE__ */ st(i) && (i = /* @__PURE__ */ z(i));
        const r = /* @__PURE__ */ z(this), { has: a, get: l } = rn(r);
        let d = a.call(r, o);
        d || (o = /* @__PURE__ */ z(o), d = a.call(r, o));
        const f = l.call(r, o);
        return r.set(o, i), d ? Be(i, f) && Qe(r, "set", o, i) : Qe(r, "add", o, i), this;
      },
      delete(o) {
        const i = /* @__PURE__ */ z(this), { has: r, get: a } = rn(i);
        let l = r.call(i, o);
        l || (o = /* @__PURE__ */ z(o), l = r.call(i, o)), a && a.call(i, o);
        const d = i.delete(o);
        return l && Qe(i, "delete", o, void 0), d;
      },
      clear() {
        const o = /* @__PURE__ */ z(this), i = o.size !== 0, r = o.clear();
        return i && Qe(
          o,
          "clear",
          void 0,
          void 0
        ), r;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((o) => {
    n[o] = Ki(o, e, t);
  }), n;
}
function hs(e, t) {
  const n = Vi(e, t);
  return (s, o, i) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    B(n, o) && o in s ? n : s,
    o,
    i
  );
}
const Hi = {
  get: /* @__PURE__ */ hs(!1, !1)
}, Ni = {
  get: /* @__PURE__ */ hs(!1, !0)
}, Ui = {
  get: /* @__PURE__ */ hs(!0, !1)
};
const Eo = /* @__PURE__ */ new WeakMap(), Ro = /* @__PURE__ */ new WeakMap(), Oo = /* @__PURE__ */ new WeakMap(), Li = /* @__PURE__ */ new WeakMap();
function zi(e) {
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
function Bi(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : zi(mi(e));
}
// @__NO_SIDE_EFFECTS__
function Gt(e) {
  return /* @__PURE__ */ st(e) ? e : ms(
    e,
    !1,
    Di,
    Hi,
    Eo
  );
}
// @__NO_SIDE_EFFECTS__
function Wi(e) {
  return ms(
    e,
    !1,
    ji,
    Ni,
    Ro
  );
}
// @__NO_SIDE_EFFECTS__
function Qn(e) {
  return ms(
    e,
    !0,
    Fi,
    Ui,
    Oo
  );
}
function ms(e, t, n, s, o) {
  if (!q(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const i = Bi(e);
  if (i === 0)
    return e;
  const r = o.get(e);
  if (r)
    return r;
  const a = new Proxy(
    e,
    i === 2 ? s : n
  );
  return o.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function ht(e) {
  return /* @__PURE__ */ st(e) ? /* @__PURE__ */ ht(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function st(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function ke(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function gs(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function z(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ z(t) : e;
}
function qi(e) {
  return !B(e, "__v_skip") && Object.isExtensible(e) && fo(e, "__v_skip", !0), e;
}
const Fe = (e) => q(e) ? /* @__PURE__ */ Gt(e) : e, Et = (e) => q(e) ? /* @__PURE__ */ Qn(e) : e;
// @__NO_SIDE_EFFECTS__
function me(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function Pt(e) {
  return Ji(e, !1);
}
function Ji(e, t) {
  return /* @__PURE__ */ me(e) ? e : new Gi(e, t);
}
class Gi {
  constructor(t, n) {
    this.dep = new ds(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ z(t), this._value = n ? t : Fe(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ ke(t) || /* @__PURE__ */ st(t);
    t = s ? t : /* @__PURE__ */ z(t), Be(t, n) && (this._rawValue = t, this._value = s ? t : Fe(t), this.dep.trigger());
  }
}
function I(e) {
  return /* @__PURE__ */ me(e) ? e.value : e;
}
const Yi = {
  get: (e, t, n) => t === "__v_raw" ? e : I(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ me(o) && !/* @__PURE__ */ me(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Io(e) {
  return /* @__PURE__ */ ht(e) ? e : new Proxy(e, Yi);
}
class Xi {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new ds(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = qt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ee !== this)
      return bo(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return _o(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Zi(e, t, n = !1) {
  let s, o;
  return K(e) ? s = e : (s = e.get, o = e.set), new Xi(s, o, n);
}
const ln = {}, dn = /* @__PURE__ */ new WeakMap();
let ft;
function Qi(e, t = !1, n = ft) {
  if (n) {
    let s = dn.get(n);
    s || dn.set(n, s = []), s.push(e);
  }
}
function er(e, t, n = X) {
  const { immediate: s, deep: o, once: i, scheduler: r, augmentJob: a, call: l } = n, d = (P) => o ? P : /* @__PURE__ */ ke(P) || o === !1 || o === 0 ? et(P, 1) : et(P);
  let f, v, w, O, L = !1, j = !1;
  if (/* @__PURE__ */ me(e) ? (v = () => e.value, L = /* @__PURE__ */ ke(e)) : /* @__PURE__ */ ht(e) ? (v = () => d(e), L = !0) : D(e) ? (j = !0, L = e.some((P) => /* @__PURE__ */ ht(P) || /* @__PURE__ */ ke(P)), v = () => e.map((P) => {
    if (/* @__PURE__ */ me(P))
      return P.value;
    if (/* @__PURE__ */ ht(P))
      return d(P);
    if (K(P))
      return l ? l(P, 2) : P();
  })) : K(e) ? t ? v = l ? () => l(e, 2) : e : v = () => {
    if (w) {
      tt();
      try {
        w();
      } finally {
        nt();
      }
    }
    const P = ft;
    ft = f;
    try {
      return l ? l(e, 3, [O]) : e(O);
    } finally {
      ft = P;
    }
  } : v = We, t && o) {
    const P = v, Z = o === !0 ? 1 / 0 : o;
    v = () => et(P(), Z);
  }
  const ne = Ei(), $ = () => {
    f.stop(), ne && ne.active && as(ne.effects, f);
  };
  if (i && t) {
    const P = t;
    t = (...Z) => {
      P(...Z), $();
    };
  }
  let H = j ? new Array(e.length).fill(ln) : ln;
  const G = (P) => {
    if (!(!(f.flags & 1) || !f.dirty && !P))
      if (t) {
        const Z = f.run();
        if (o || L || (j ? Z.some((ge, U) => Be(ge, H[U])) : Be(Z, H))) {
          w && w();
          const ge = ft;
          ft = f;
          try {
            const U = [
              Z,
              // pass undefined as the old value when it's changed for the first time
              H === ln ? void 0 : j && H[0] === ln ? [] : H,
              O
            ];
            H = Z, l ? l(t, 3, U) : (
              // @ts-expect-error
              t(...U)
            );
          } finally {
            ft = ge;
          }
        }
      } else
        f.run();
  };
  return a && a(G), f = new go(v), f.scheduler = r ? () => r(G, !1) : G, O = (P) => Qi(P, !1, f), w = f.onStop = () => {
    const P = dn.get(f);
    if (P) {
      if (l)
        l(P, 4);
      else
        for (const Z of P) Z();
      dn.delete(f);
    }
  }, t ? s ? G(!0) : H = f.run() : r ? r(G.bind(null, !0), !0) : f.run(), $.pause = f.pause.bind(f), $.resume = f.resume.bind(f), $.stop = $, $;
}
function et(e, t = 1 / 0, n) {
  if (t <= 0 || !q(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ me(e))
    et(e.value, t, n);
  else if (D(e))
    for (let s = 0; s < e.length; s++)
      et(e[s], t, n);
  else if (Tn(e) || St(e))
    e.forEach((s) => {
      et(s, t, n);
    });
  else if (co(e)) {
    for (const s in e)
      et(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && et(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function tn(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (o) {
    Mn(o, t, n);
  }
}
function Je(e, t, n, s) {
  if (K(e)) {
    const o = tn(e, t, n, s);
    return o && ao(o) && o.catch((i) => {
      Mn(i, t, n);
    }), o;
  }
  if (D(e)) {
    const o = [];
    for (let i = 0; i < e.length; i++)
      o.push(Je(e[i], t, n, s));
    return o;
  }
}
function Mn(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: r } = t && t.appContext.config || X;
  if (t) {
    let a = t.parent;
    const l = t.proxy, d = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const f = a.ec;
      if (f) {
        for (let v = 0; v < f.length; v++)
          if (f[v](e, l, d) === !1)
            return;
      }
      a = a.parent;
    }
    if (i) {
      tt(), tn(i, null, 10, [
        e,
        l,
        d
      ]), nt();
      return;
    }
  }
  tr(e, n, o, s, r);
}
function tr(e, t, n, s = !0, o = !1) {
  if (o)
    throw e;
  console.error(e);
}
const be = [];
let Ue = -1;
const Ct = [];
let it = null, yt = 0;
const Mo = /* @__PURE__ */ Promise.resolve();
let hn = null;
function Nt(e) {
  const t = hn || Mo;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function nr(e) {
  let t = Ue + 1, n = be.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = be[s], i = Yt(o);
    i < e || i === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function vs(e) {
  if (!(e.flags & 1)) {
    const t = Yt(e), n = be[be.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Yt(n) ? be.push(e) : be.splice(nr(t), 0, e), e.flags |= 1, ko();
  }
}
function ko() {
  hn || (hn = Mo.then($o));
}
function sr(e) {
  D(e) ? Ct.push(...e) : it && e.id === -1 ? it.splice(yt + 1, 0, e) : e.flags & 1 || (Ct.push(e), e.flags |= 1), ko();
}
function Is(e, t, n = Ue + 1) {
  for (; n < be.length; n++) {
    const s = be[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      be.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Po(e) {
  if (Ct.length) {
    const t = [...new Set(Ct)].sort(
      (n, s) => Yt(n) - Yt(s)
    );
    if (Ct.length = 0, it) {
      it.push(...t);
      return;
    }
    for (it = t, yt = 0; yt < it.length; yt++) {
      const n = it[yt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    it = null, yt = 0;
  }
}
const Yt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function $o(e) {
  try {
    for (Ue = 0; Ue < be.length; Ue++) {
      const t = be[Ue];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), tn(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Ue < be.length; Ue++) {
      const t = be[Ue];
      t && (t.flags &= -2);
    }
    Ue = -1, be.length = 0, Po(), hn = null, (be.length || Ct.length) && $o();
  }
}
let Me = null, Do = null;
function mn(e) {
  const t = Me;
  return Me = e, Do = e && e.type.__scopeId || null, t;
}
function or(e, t = Me, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && bn(-1);
    const i = mn(t);
    let r;
    try {
      r = e(...o);
    } finally {
      mn(i), s._d && bn(1);
    }
    return r;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function ie(e, t) {
  if (Me === null)
    return e;
  const n = Dn(Me), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [i, r, a, l = X] = t[o];
    i && (K(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && et(r), s.push({
      dir: i,
      instance: n,
      value: r,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return e;
}
function ct(e, t, n, s) {
  const o = e.dirs, i = t && t.dirs;
  for (let r = 0; r < o.length; r++) {
    const a = o[r];
    i && (a.oldValue = i[r].value);
    let l = a.dir[s];
    l && (tt(), Je(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), nt());
  }
}
function ir(e, t) {
  if (xe) {
    let n = xe.provides;
    const s = xe.parent && xe.parent.provides;
    s === n && (n = xe.provides = Object.create(s)), n[e] = t;
  }
}
function fn(e, t, n = !1) {
  const s = ia();
  if (s || At) {
    let o = At ? At._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && K(t) ? t.call(s && s.proxy) : t;
  }
}
const rr = /* @__PURE__ */ Symbol.for("v-scx"), ar = () => fn(rr);
function Ut(e, t, n) {
  return Fo(e, t, n);
}
function Fo(e, t, n = X) {
  const { immediate: s, deep: o, flush: i, once: r } = n, a = fe({}, n), l = t && s || !t && i !== "post";
  let d;
  if (Zt) {
    if (i === "sync") {
      const O = ar();
      d = O.__watcherHandles || (O.__watcherHandles = []);
    } else if (!l) {
      const O = () => {
      };
      return O.stop = We, O.resume = We, O.pause = We, O;
    }
  }
  const f = xe;
  a.call = (O, L, j) => Je(O, f, L, j);
  let v = !1;
  i === "post" ? a.scheduler = (O) => {
    Se(O, f && f.suspense);
  } : i !== "sync" && (v = !0, a.scheduler = (O, L) => {
    L ? O() : vs(O);
  }), a.augmentJob = (O) => {
    t && (O.flags |= 4), v && (O.flags |= 2, f && (O.id = f.uid, O.i = f));
  };
  const w = er(e, t, a);
  return Zt && (d ? d.push(w) : l && w()), w;
}
function lr(e, t, n) {
  const s = this.proxy, o = se(e) ? e.includes(".") ? jo(s, e) : () => s[e] : e.bind(s, s);
  let i;
  K(t) ? i = t : (i = t.handler, n = t);
  const r = nn(this), a = Fo(o, i.bind(s), n);
  return r(), a;
}
function jo(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const cr = /* @__PURE__ */ Symbol("_vte"), ur = (e) => e.__isTeleport, fr = /* @__PURE__ */ Symbol("_leaveCb");
function bs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, bs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
  return K(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    fe({ name: e.name }, t, { setup: e })
  ) : e;
}
function Ko(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function ks(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const gn = /* @__PURE__ */ new WeakMap();
function Lt(e, t, n, s, o = !1) {
  if (D(e)) {
    e.forEach(
      (j, ne) => Lt(
        j,
        t && (D(t) ? t[ne] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (zt(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Lt(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Dn(s.component) : s.el, r = o ? null : i, { i: a, r: l } = e, d = t && t.r, f = a.refs === X ? a.refs = {} : a.refs, v = a.setupState, w = /* @__PURE__ */ z(v), O = v === X ? ro : (j) => ks(f, j) ? !1 : B(w, j), L = (j, ne) => !(ne && ks(f, ne));
  if (d != null && d !== l) {
    if (Ps(t), se(d))
      f[d] = null, O(d) && (v[d] = null);
    else if (/* @__PURE__ */ me(d)) {
      const j = t;
      L(d, j.k) && (d.value = null), j.k && (f[j.k] = null);
    }
  }
  if (K(l))
    tn(l, a, 12, [r, f]);
  else {
    const j = se(l), ne = /* @__PURE__ */ me(l);
    if (j || ne) {
      const $ = () => {
        if (e.f) {
          const H = j ? O(l) ? v[l] : f[l] : L() || !e.k ? l.value : f[e.k];
          if (o)
            D(H) && as(H, i);
          else if (D(H))
            H.includes(i) || H.push(i);
          else if (j)
            f[l] = [i], O(l) && (v[l] = f[l]);
          else {
            const G = [i];
            L(l, e.k) && (l.value = G), e.k && (f[e.k] = G);
          }
        } else j ? (f[l] = r, O(l) && (v[l] = r)) : ne && (L(l, e.k) && (l.value = r), e.k && (f[e.k] = r));
      };
      if (r) {
        const H = () => {
          $(), gn.delete(e);
        };
        H.id = -1, gn.set(e, H), Se(H, n);
      } else
        Ps(e), $();
    }
  }
}
function Ps(e) {
  const t = gn.get(e);
  t && (t.flags |= 8, gn.delete(e));
}
On().requestIdleCallback;
On().cancelIdleCallback;
const zt = (e) => !!e.type.__asyncLoader, Vo = (e) => e.type.__isKeepAlive;
function pr(e, t) {
  Ho(e, "a", t);
}
function dr(e, t) {
  Ho(e, "da", t);
}
function Ho(e, t, n = xe) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (kn(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      Vo(o.parent.vnode) && hr(s, t, n, o), o = o.parent;
  }
}
function hr(e, t, n, s) {
  const o = kn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  No(() => {
    as(s[t], o);
  }, n);
}
function kn(e, t, n = xe, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...r) => {
      tt();
      const a = nn(n), l = Je(t, n, e, r);
      return a(), nt(), l;
    });
    return s ? o.unshift(i) : o.push(i), i;
  }
}
const ot = (e) => (t, n = xe) => {
  (!Zt || e === "sp") && kn(e, (...s) => t(...s), n);
}, mr = ot("bm"), gr = ot("m"), vr = ot(
  "bu"
), br = ot("u"), xr = ot(
  "bum"
), No = ot("um"), yr = ot(
  "sp"
), _r = ot("rtg"), wr = ot("rtc");
function Sr(e, t = xe) {
  kn("ec", e, t);
}
const Cr = /* @__PURE__ */ Symbol.for("v-ndc");
function cn(e, t, n, s) {
  let o;
  const i = n, r = D(e);
  if (r || se(e)) {
    const a = r && /* @__PURE__ */ ht(e);
    let l = !1, d = !1;
    a && (l = !/* @__PURE__ */ ke(e), d = /* @__PURE__ */ st(e), e = In(e)), o = new Array(e.length);
    for (let f = 0, v = e.length; f < v; f++)
      o[f] = t(
        l ? d ? Et(Fe(e[f])) : Fe(e[f]) : e[f],
        f,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let a = 0; a < e; a++)
      o[a] = t(a + 1, a, void 0, i);
  } else if (q(e))
    if (e[Symbol.iterator])
      o = Array.from(
        e,
        (a, l) => t(a, l, void 0, i)
      );
    else {
      const a = Object.keys(e);
      o = new Array(a.length);
      for (let l = 0, d = a.length; l < d; l++) {
        const f = a[l];
        o[l] = t(e[f], f, l, i);
      }
    }
  else
    o = [];
  return o;
}
const es = (e) => e ? ai(e) ? Dn(e) : es(e.parent) : null, Bt = (
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
    $parent: (e) => es(e.parent),
    $root: (e) => es(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Lo(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      vs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Nt.bind(e.proxy)),
    $watch: (e) => lr.bind(e)
  })
), Ln = (e, t) => e !== X && !e.__isScriptSetup && B(e, t), Ar = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: i, accessCache: r, type: a, appContext: l } = e;
    if (t[0] !== "$") {
      const w = r[t];
      if (w !== void 0)
        switch (w) {
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
        if (Ln(s, t))
          return r[t] = 1, s[t];
        if (o !== X && B(o, t))
          return r[t] = 2, o[t];
        if (B(i, t))
          return r[t] = 3, i[t];
        if (n !== X && B(n, t))
          return r[t] = 4, n[t];
        ts && (r[t] = 0);
      }
    }
    const d = Bt[t];
    let f, v;
    if (d)
      return t === "$attrs" && he(e.attrs, "get", ""), d(e);
    if (
      // css module (injected by vue-loader)
      (f = a.__cssModules) && (f = f[t])
    )
      return f;
    if (n !== X && B(n, t))
      return r[t] = 4, n[t];
    if (
      // global properties
      v = l.config.globalProperties, B(v, t)
    )
      return v[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: i } = e;
    return Ln(o, t) ? (o[t] = n, !0) : s !== X && B(s, t) ? (s[t] = n, !0) : B(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: i, type: r }
  }, a) {
    let l;
    return !!(n[a] || e !== X && a[0] !== "$" && B(e, a) || Ln(t, a) || B(i, a) || B(s, a) || B(Bt, a) || B(o.config.globalProperties, a) || (l = r.__cssModules) && l[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : B(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function $s(e) {
  return D(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let ts = !0;
function Tr(e) {
  const t = Lo(e), n = e.proxy, s = e.ctx;
  ts = !1, t.beforeCreate && Ds(t.beforeCreate, e, "bc");
  const {
    // state
    data: o,
    computed: i,
    methods: r,
    watch: a,
    provide: l,
    inject: d,
    // lifecycle
    created: f,
    beforeMount: v,
    mounted: w,
    beforeUpdate: O,
    updated: L,
    activated: j,
    deactivated: ne,
    beforeDestroy: $,
    beforeUnmount: H,
    destroyed: G,
    unmounted: P,
    render: Z,
    renderTracked: ge,
    renderTriggered: U,
    errorCaptured: ye,
    serverPrefetch: je,
    // public API
    expose: _e,
    inheritAttrs: lt,
    // assets
    components: mt,
    directives: gt,
    filters: vt
  } = t;
  if (d && Er(d, s, null), r)
    for (const W in r) {
      const J = r[W];
      K(J) && (s[W] = J.bind(n));
    }
  if (o) {
    const W = o.call(n, n);
    q(W) && (e.data = /* @__PURE__ */ Gt(W));
  }
  if (ts = !0, i)
    for (const W in i) {
      const J = i[W], Ge = K(J) ? J.bind(n, n) : K(J.get) ? J.get.bind(n, n) : We, R = !K(J) && K(J.set) ? J.set.bind(n) : We, h = _t({
        get: Ge,
        set: R
      });
      Object.defineProperty(s, W, {
        enumerable: !0,
        configurable: !0,
        get: () => h.value,
        set: (p) => h.value = p
      });
    }
  if (a)
    for (const W in a)
      Uo(a[W], s, n, W);
  if (l) {
    const W = K(l) ? l.call(n) : l;
    Reflect.ownKeys(W).forEach((J) => {
      ir(J, W[J]);
    });
  }
  f && Ds(f, e, "c");
  function ae(W, J) {
    D(J) ? J.forEach((Ge) => W(Ge.bind(n))) : J && W(J.bind(n));
  }
  if (ae(mr, v), ae(gr, w), ae(vr, O), ae(br, L), ae(pr, j), ae(dr, ne), ae(Sr, ye), ae(wr, ge), ae(_r, U), ae(xr, H), ae(No, P), ae(yr, je), D(_e))
    if (_e.length) {
      const W = e.exposed || (e.exposed = {});
      _e.forEach((J) => {
        Object.defineProperty(W, J, {
          get: () => n[J],
          set: (Ge) => n[J] = Ge,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  Z && e.render === We && (e.render = Z), lt != null && (e.inheritAttrs = lt), mt && (e.components = mt), gt && (e.directives = gt), je && Ko(e);
}
function Er(e, t, n = We) {
  D(e) && (e = ns(e));
  for (const s in e) {
    const o = e[s];
    let i;
    q(o) ? "default" in o ? i = fn(
      o.from || s,
      o.default,
      !0
    ) : i = fn(o.from || s) : i = fn(o), /* @__PURE__ */ me(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (r) => i.value = r
    }) : t[s] = i;
  }
}
function Ds(e, t, n) {
  Je(
    D(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Uo(e, t, n, s) {
  let o = s.includes(".") ? jo(n, s) : () => n[s];
  if (se(e)) {
    const i = t[e];
    K(i) && Ut(o, i);
  } else if (K(e))
    Ut(o, e.bind(n));
  else if (q(e))
    if (D(e))
      e.forEach((i) => Uo(i, t, n, s));
    else {
      const i = K(e.handler) ? e.handler.bind(n) : t[e.handler];
      K(i) && Ut(o, i, e);
    }
}
function Lo(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: i,
    config: { optionMergeStrategies: r }
  } = e.appContext, a = i.get(t);
  let l;
  return a ? l = a : !o.length && !n && !s ? l = t : (l = {}, o.length && o.forEach(
    (d) => vn(l, d, r, !0)
  ), vn(l, t, r)), q(t) && i.set(t, l), l;
}
function vn(e, t, n, s = !1) {
  const { mixins: o, extends: i } = t;
  i && vn(e, i, n, !0), o && o.forEach(
    (r) => vn(e, r, n, !0)
  );
  for (const r in t)
    if (!(s && r === "expose")) {
      const a = Rr[r] || n && n[r];
      e[r] = a ? a(e[r], t[r]) : t[r];
    }
  return e;
}
const Rr = {
  data: Fs,
  props: js,
  emits: js,
  // objects
  methods: Ft,
  computed: Ft,
  // lifecycle
  beforeCreate: ve,
  created: ve,
  beforeMount: ve,
  mounted: ve,
  beforeUpdate: ve,
  updated: ve,
  beforeDestroy: ve,
  beforeUnmount: ve,
  destroyed: ve,
  unmounted: ve,
  activated: ve,
  deactivated: ve,
  errorCaptured: ve,
  serverPrefetch: ve,
  // assets
  components: Ft,
  directives: Ft,
  // watch
  watch: Ir,
  // provide / inject
  provide: Fs,
  inject: Or
};
function Fs(e, t) {
  return t ? e ? function() {
    return fe(
      K(e) ? e.call(this, this) : e,
      K(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Or(e, t) {
  return Ft(ns(e), ns(t));
}
function ns(e) {
  if (D(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function ve(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Ft(e, t) {
  return e ? fe(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function js(e, t) {
  return e ? D(e) && D(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : fe(
    /* @__PURE__ */ Object.create(null),
    $s(e),
    $s(t ?? {})
  ) : t;
}
function Ir(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = fe(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = ve(e[s], t[s]);
  return n;
}
function zo() {
  return {
    app: null,
    config: {
      isNativeTag: ro,
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
let Mr = 0;
function kr(e, t) {
  return function(s, o = null) {
    K(s) || (s = fe({}, s)), o != null && !q(o) && (o = null);
    const i = zo(), r = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const d = i.app = {
      _uid: Mr++,
      _component: s,
      _props: o,
      _container: null,
      _context: i,
      _instance: null,
      version: fa,
      get config() {
        return i.config;
      },
      set config(f) {
      },
      use(f, ...v) {
        return r.has(f) || (f && K(f.install) ? (r.add(f), f.install(d, ...v)) : K(f) && (r.add(f), f(d, ...v))), d;
      },
      mixin(f) {
        return i.mixins.includes(f) || i.mixins.push(f), d;
      },
      component(f, v) {
        return v ? (i.components[f] = v, d) : i.components[f];
      },
      directive(f, v) {
        return v ? (i.directives[f] = v, d) : i.directives[f];
      },
      mount(f, v, w) {
        if (!l) {
          const O = d._ceVNode || le(s, o);
          return O.appContext = i, w === !0 ? w = "svg" : w === !1 && (w = void 0), e(O, f, w), l = !0, d._container = f, f.__vue_app__ = d, Dn(O.component);
        }
      },
      onUnmount(f) {
        a.push(f);
      },
      unmount() {
        l && (Je(
          a,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(f, v) {
        return i.provides[f] = v, d;
      },
      runWithContext(f) {
        const v = At;
        At = d;
        try {
          return f();
        } finally {
          At = v;
        }
      }
    };
    return d;
  };
}
let At = null;
const Pr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${$e(t)}Modifiers`] || e[`${at(t)}Modifiers`];
function $r(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || X;
  let o = n;
  const i = t.startsWith("update:"), r = i && Pr(s, t.slice(7));
  r && (r.trim && (o = n.map((f) => se(f) ? f.trim() : f)), r.number && (o = n.map(Rn)));
  let a, l = s[a = Kn(t)] || // also try camelCase event handler (#2249)
  s[a = Kn($e(t))];
  !l && i && (l = s[a = Kn(at(t))]), l && Je(
    l,
    e,
    6,
    o
  );
  const d = s[a + "Once"];
  if (d) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Je(
      d,
      e,
      6,
      o
    );
  }
}
const Dr = /* @__PURE__ */ new WeakMap();
function Bo(e, t, n = !1) {
  const s = n ? Dr : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const i = e.emits;
  let r = {}, a = !1;
  if (!K(e)) {
    const l = (d) => {
      const f = Bo(d, t, !0);
      f && (a = !0, fe(r, f));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !i && !a ? (q(e) && s.set(e, null), null) : (D(i) ? i.forEach((l) => r[l] = null) : fe(r, i), q(e) && s.set(e, r), r);
}
function Pn(e, t) {
  return !e || !Cn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), B(e, t[0].toLowerCase() + t.slice(1)) || B(e, at(t)) || B(e, t));
}
function Ks(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: o,
    propsOptions: [i],
    slots: r,
    attrs: a,
    emit: l,
    render: d,
    renderCache: f,
    props: v,
    data: w,
    setupState: O,
    ctx: L,
    inheritAttrs: j
  } = e, ne = mn(e);
  let $, H;
  try {
    if (n.shapeFlag & 4) {
      const P = o || s, Z = P;
      $ = ze(
        d.call(
          Z,
          P,
          f,
          v,
          O,
          w,
          L
        )
      ), H = a;
    } else {
      const P = t;
      $ = ze(
        P.length > 1 ? P(
          v,
          { attrs: a, slots: r, emit: l }
        ) : P(
          v,
          null
        )
      ), H = t.props ? a : Fr(a);
    }
  } catch (P) {
    Wt.length = 0, Mn(P, e, 1), $ = le(rt);
  }
  let G = $;
  if (H && j !== !1) {
    const P = Object.keys(H), { shapeFlag: Z } = G;
    P.length && Z & 7 && (i && P.some(An) && (H = jr(
      H,
      i
    )), G = Rt(G, H, !1, !0));
  }
  return n.dirs && (G = Rt(G, null, !1, !0), G.dirs = G.dirs ? G.dirs.concat(n.dirs) : n.dirs), n.transition && bs(G, n.transition), $ = G, mn(ne), $;
}
const Fr = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Cn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, jr = (e, t) => {
  const n = {};
  for (const s in e)
    (!An(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Kr(e, t, n) {
  const { props: s, children: o, component: i } = e, { props: r, children: a, patchFlag: l } = t, d = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? Vs(s, r, d) : !!r;
    if (l & 8) {
      const f = t.dynamicProps;
      for (let v = 0; v < f.length; v++) {
        const w = f[v];
        if (Wo(r, s, w) && !Pn(d, w))
          return !0;
      }
    }
  } else
    return (o || a) && (!a || !a.$stable) ? !0 : s === r ? !1 : s ? r ? Vs(s, r, d) : !0 : !!r;
  return !1;
}
function Vs(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const i = s[o];
    if (Wo(t, e, i) && !Pn(n, i))
      return !0;
  }
  return !1;
}
function Wo(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && q(s) && q(o) ? !en(s, o) : s !== o;
}
function Vr({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const o = t.subTree;
    if (o.suspense && o.suspense.activeBranch === e && (o.suspense.vnode.el = o.el = s, e = o), o === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const qo = {}, Jo = () => Object.create(qo), Go = (e) => Object.getPrototypeOf(e) === qo;
function Hr(e, t, n, s = !1) {
  const o = {}, i = Jo();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Yo(e, t, o, i);
  for (const r in e.propsOptions[0])
    r in o || (o[r] = void 0);
  n ? e.props = s ? o : /* @__PURE__ */ Wi(o) : e.type.props ? e.props = o : e.props = i, e.attrs = i;
}
function Nr(e, t, n, s) {
  const {
    props: o,
    attrs: i,
    vnode: { patchFlag: r }
  } = e, a = /* @__PURE__ */ z(o), [l] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || r > 0) && !(r & 16)
  ) {
    if (r & 8) {
      const f = e.vnode.dynamicProps;
      for (let v = 0; v < f.length; v++) {
        let w = f[v];
        if (Pn(e.emitsOptions, w))
          continue;
        const O = t[w];
        if (l)
          if (B(i, w))
            O !== i[w] && (i[w] = O, d = !0);
          else {
            const L = $e(w);
            o[L] = ss(
              l,
              a,
              L,
              O,
              e,
              !1
            );
          }
        else
          O !== i[w] && (i[w] = O, d = !0);
      }
    }
  } else {
    Yo(e, t, o, i) && (d = !0);
    let f;
    for (const v in a)
      (!t || // for camelCase
      !B(t, v) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((f = at(v)) === v || !B(t, f))) && (l ? n && // for camelCase
      (n[v] !== void 0 || // for kebab-case
      n[f] !== void 0) && (o[v] = ss(
        l,
        a,
        v,
        void 0,
        e,
        !0
      )) : delete o[v]);
    if (i !== a)
      for (const v in i)
        (!t || !B(t, v)) && (delete i[v], d = !0);
  }
  d && Qe(e.attrs, "set", "");
}
function Yo(e, t, n, s) {
  const [o, i] = e.propsOptions;
  let r = !1, a;
  if (t)
    for (let l in t) {
      if (Kt(l))
        continue;
      const d = t[l];
      let f;
      o && B(o, f = $e(l)) ? !i || !i.includes(f) ? n[f] = d : (a || (a = {}))[f] = d : Pn(e.emitsOptions, l) || (!(l in s) || d !== s[l]) && (s[l] = d, r = !0);
    }
  if (i) {
    const l = /* @__PURE__ */ z(n), d = a || X;
    for (let f = 0; f < i.length; f++) {
      const v = i[f];
      n[v] = ss(
        o,
        l,
        v,
        d[v],
        e,
        !B(d, v)
      );
    }
  }
  return r;
}
function ss(e, t, n, s, o, i) {
  const r = e[n];
  if (r != null) {
    const a = B(r, "default");
    if (a && s === void 0) {
      const l = r.default;
      if (r.type !== Function && !r.skipFactory && K(l)) {
        const { propsDefaults: d } = o;
        if (n in d)
          s = d[n];
        else {
          const f = nn(o);
          s = d[n] = l.call(
            null,
            t
          ), f();
        }
      } else
        s = l;
      o.ce && o.ce._setProp(n, s);
    }
    r[
      0
      /* shouldCast */
    ] && (i && !a ? s = !1 : r[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === at(n)) && (s = !0));
  }
  return s;
}
const Ur = /* @__PURE__ */ new WeakMap();
function Xo(e, t, n = !1) {
  const s = n ? Ur : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const i = e.props, r = {}, a = [];
  let l = !1;
  if (!K(e)) {
    const f = (v) => {
      l = !0;
      const [w, O] = Xo(v, t, !0);
      fe(r, w), O && a.push(...O);
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  if (!i && !l)
    return q(e) && s.set(e, wt), wt;
  if (D(i))
    for (let f = 0; f < i.length; f++) {
      const v = $e(i[f]);
      Hs(v) && (r[v] = X);
    }
  else if (i)
    for (const f in i) {
      const v = $e(f);
      if (Hs(v)) {
        const w = i[f], O = r[v] = D(w) || K(w) ? { type: w } : fe({}, w), L = O.type;
        let j = !1, ne = !0;
        if (D(L))
          for (let $ = 0; $ < L.length; ++$) {
            const H = L[$], G = K(H) && H.name;
            if (G === "Boolean") {
              j = !0;
              break;
            } else G === "String" && (ne = !1);
          }
        else
          j = K(L) && L.name === "Boolean";
        O[
          0
          /* shouldCast */
        ] = j, O[
          1
          /* shouldCastTrue */
        ] = ne, (j || B(O, "default")) && a.push(v);
      }
    }
  const d = [r, a];
  return q(e) && s.set(e, d), d;
}
function Hs(e) {
  return e[0] !== "$" && !Kt(e);
}
const xs = (e) => e === "_" || e === "_ctx" || e === "$stable", ys = (e) => D(e) ? e.map(ze) : [ze(e)], Lr = (e, t, n) => {
  if (t._n)
    return t;
  const s = or((...o) => ys(t(...o)), n);
  return s._c = !1, s;
}, Zo = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (xs(o)) continue;
    const i = e[o];
    if (K(i))
      t[o] = Lr(o, i, s);
    else if (i != null) {
      const r = ys(i);
      t[o] = () => r;
    }
  }
}, Qo = (e, t) => {
  const n = ys(t);
  e.slots.default = () => n;
}, ei = (e, t, n) => {
  for (const s in t)
    (n || !xs(s)) && (e[s] = t[s]);
}, zr = (e, t, n) => {
  const s = e.slots = Jo();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (ei(s, t, n), n && fo(s, "_", o, !0)) : Zo(t, s);
  } else t && Qo(e, t);
}, Br = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let i = !0, r = X;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : ei(o, t, n) : (i = !t.$stable, Zo(t, o)), r = t;
  } else t && (Qo(e, t), r = { default: 1 });
  if (i)
    for (const a in o)
      !xs(a) && r[a] == null && delete o[a];
}, Se = Yr;
function Wr(e) {
  return qr(e);
}
function qr(e, t) {
  const n = On();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: o,
    patchProp: i,
    createElement: r,
    createText: a,
    createComment: l,
    setText: d,
    setElementText: f,
    parentNode: v,
    nextSibling: w,
    setScopeId: O = We,
    insertStaticContent: L
  } = e, j = (c, u, g, _ = null, b = null, x = null, A = void 0, C = null, S = !!u.dynamicChildren) => {
    if (c === u)
      return;
    c && !$t(c, u) && (_ = on(c), p(c, b, x, !0), c = null), u.patchFlag === -2 && (S = !1, u.dynamicChildren = null);
    const { type: y, ref: k, shapeFlag: E } = u;
    switch (y) {
      case $n:
        ne(c, u, g, _);
        break;
      case rt:
        $(c, u, g, _);
        break;
      case Bn:
        c == null && H(u, g, _, A);
        break;
      case Re:
        mt(
          c,
          u,
          g,
          _,
          b,
          x,
          A,
          C,
          S
        );
        break;
      default:
        E & 1 ? Z(
          c,
          u,
          g,
          _,
          b,
          x,
          A,
          C,
          S
        ) : E & 6 ? gt(
          c,
          u,
          g,
          _,
          b,
          x,
          A,
          C,
          S
        ) : (E & 64 || E & 128) && y.process(
          c,
          u,
          g,
          _,
          b,
          x,
          A,
          C,
          S,
          It
        );
    }
    k != null && b ? Lt(k, c && c.ref, x, u || c, !u) : k == null && c && c.ref != null && Lt(c.ref, null, x, c, !0);
  }, ne = (c, u, g, _) => {
    if (c == null)
      s(
        u.el = a(u.children),
        g,
        _
      );
    else {
      const b = u.el = c.el;
      u.children !== c.children && d(b, u.children);
    }
  }, $ = (c, u, g, _) => {
    c == null ? s(
      u.el = l(u.children || ""),
      g,
      _
    ) : u.el = c.el;
  }, H = (c, u, g, _) => {
    [c.el, c.anchor] = L(
      c.children,
      u,
      g,
      _,
      c.el,
      c.anchor
    );
  }, G = ({ el: c, anchor: u }, g, _) => {
    let b;
    for (; c && c !== u; )
      b = w(c), s(c, g, _), c = b;
    s(u, g, _);
  }, P = ({ el: c, anchor: u }) => {
    let g;
    for (; c && c !== u; )
      g = w(c), o(c), c = g;
    o(u);
  }, Z = (c, u, g, _, b, x, A, C, S) => {
    if (u.type === "svg" ? A = "svg" : u.type === "math" && (A = "mathml"), c == null)
      ge(
        u,
        g,
        _,
        b,
        x,
        A,
        C,
        S
      );
    else {
      const y = c.el && c.el._isVueCE ? c.el : null;
      try {
        y && y._beginPatch(), je(
          c,
          u,
          b,
          x,
          A,
          C,
          S
        );
      } finally {
        y && y._endPatch();
      }
    }
  }, ge = (c, u, g, _, b, x, A, C) => {
    let S, y;
    const { props: k, shapeFlag: E, transition: M, dirs: F } = c;
    if (S = c.el = r(
      c.type,
      x,
      k && k.is,
      k
    ), E & 8 ? f(S, c.children) : E & 16 && ye(
      c.children,
      S,
      null,
      _,
      b,
      zn(c, x),
      A,
      C
    ), F && ct(c, null, _, "created"), U(S, c, c.scopeId, A, _), k) {
      for (const Y in k)
        Y !== "value" && !Kt(Y) && i(S, Y, null, k[Y], x, _);
      "value" in k && i(S, "value", null, k.value, x), (y = k.onVnodeBeforeMount) && Ne(y, _, c);
    }
    F && ct(c, null, _, "beforeMount");
    const N = Jr(b, M);
    N && M.beforeEnter(S), s(S, u, g), ((y = k && k.onVnodeMounted) || N || F) && Se(() => {
      try {
        y && Ne(y, _, c), N && M.enter(S), F && ct(c, null, _, "mounted");
      } finally {
      }
    }, b);
  }, U = (c, u, g, _, b) => {
    if (g && O(c, g), _)
      for (let x = 0; x < _.length; x++)
        O(c, _[x]);
    if (b) {
      let x = b.subTree;
      if (u === x || oi(x.type) && (x.ssContent === u || x.ssFallback === u)) {
        const A = b.vnode;
        U(
          c,
          A,
          A.scopeId,
          A.slotScopeIds,
          b.parent
        );
      }
    }
  }, ye = (c, u, g, _, b, x, A, C, S = 0) => {
    for (let y = S; y < c.length; y++) {
      const k = c[y] = C ? Ze(c[y]) : ze(c[y]);
      j(
        null,
        k,
        u,
        g,
        _,
        b,
        x,
        A,
        C
      );
    }
  }, je = (c, u, g, _, b, x, A) => {
    const C = u.el = c.el;
    let { patchFlag: S, dynamicChildren: y, dirs: k } = u;
    S |= c.patchFlag & 16;
    const E = c.props || X, M = u.props || X;
    let F;
    if (g && ut(g, !1), (F = M.onVnodeBeforeUpdate) && Ne(F, g, u, c), k && ct(u, c, g, "beforeUpdate"), g && ut(g, !0), (E.innerHTML && M.innerHTML == null || E.textContent && M.textContent == null) && f(C, ""), y ? _e(
      c.dynamicChildren,
      y,
      C,
      g,
      _,
      zn(u, b),
      x
    ) : A || J(
      c,
      u,
      C,
      null,
      g,
      _,
      zn(u, b),
      x,
      !1
    ), S > 0) {
      if (S & 16)
        lt(C, E, M, g, b);
      else if (S & 2 && E.class !== M.class && i(C, "class", null, M.class, b), S & 4 && i(C, "style", E.style, M.style, b), S & 8) {
        const N = u.dynamicProps;
        for (let Y = 0; Y < N.length; Y++) {
          const Q = N[Y], oe = E[Q], ce = M[Q];
          (ce !== oe || Q === "value") && i(C, Q, oe, ce, b, g);
        }
      }
      S & 1 && c.children !== u.children && f(C, u.children);
    } else !A && y == null && lt(C, E, M, g, b);
    ((F = M.onVnodeUpdated) || k) && Se(() => {
      F && Ne(F, g, u, c), k && ct(u, c, g, "updated");
    }, _);
  }, _e = (c, u, g, _, b, x, A) => {
    for (let C = 0; C < u.length; C++) {
      const S = c[C], y = u[C], k = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        S.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (S.type === Re || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !$t(S, y) || // - In the case of a component, it could contain anything.
        S.shapeFlag & 198) ? v(S.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      j(
        S,
        y,
        k,
        null,
        _,
        b,
        x,
        A,
        !0
      );
    }
  }, lt = (c, u, g, _, b) => {
    if (u !== g) {
      if (u !== X)
        for (const x in u)
          !Kt(x) && !(x in g) && i(
            c,
            x,
            u[x],
            null,
            b,
            _
          );
      for (const x in g) {
        if (Kt(x)) continue;
        const A = g[x], C = u[x];
        A !== C && x !== "value" && i(c, x, C, A, b, _);
      }
      "value" in g && i(c, "value", u.value, g.value, b);
    }
  }, mt = (c, u, g, _, b, x, A, C, S) => {
    const y = u.el = c ? c.el : a(""), k = u.anchor = c ? c.anchor : a("");
    let { patchFlag: E, dynamicChildren: M, slotScopeIds: F } = u;
    F && (C = C ? C.concat(F) : F), c == null ? (s(y, g, _), s(k, g, _), ye(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      g,
      k,
      b,
      x,
      A,
      C,
      S
    )) : E > 0 && E & 64 && M && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    c.dynamicChildren && c.dynamicChildren.length === M.length ? (_e(
      c.dynamicChildren,
      M,
      g,
      b,
      x,
      A,
      C
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || b && u === b.subTree) && ti(
      c,
      u,
      !0
      /* shallow */
    )) : J(
      c,
      u,
      g,
      k,
      b,
      x,
      A,
      C,
      S
    );
  }, gt = (c, u, g, _, b, x, A, C, S) => {
    u.slotScopeIds = C, c == null ? u.shapeFlag & 512 ? b.ctx.activate(
      u,
      g,
      _,
      A,
      S
    ) : vt(
      u,
      g,
      _,
      b,
      x,
      A,
      S
    ) : sn(c, u, S);
  }, vt = (c, u, g, _, b, x, A) => {
    const C = c.component = oa(
      c,
      _,
      b
    );
    if (Vo(c) && (C.ctx.renderer = It), ra(C, !1, A), C.asyncDep) {
      if (b && b.registerDep(C, ae, A), !c.el) {
        const S = C.subTree = le(rt);
        $(null, S, u, g), c.placeholder = S.el;
      }
    } else
      ae(
        C,
        c,
        u,
        g,
        b,
        x,
        A
      );
  }, sn = (c, u, g) => {
    const _ = u.component = c.component;
    if (Kr(c, u, g))
      if (_.asyncDep && !_.asyncResolved) {
        W(_, u, g);
        return;
      } else
        _.next = u, _.update();
    else
      u.el = c.el, _.vnode = u;
  }, ae = (c, u, g, _, b, x, A) => {
    const C = () => {
      if (c.isMounted) {
        let { next: E, bu: M, u: F, parent: N, vnode: Y } = c;
        {
          const Ve = ni(c);
          if (Ve) {
            E && (E.el = Y.el, W(c, E, A)), Ve.asyncDep.then(() => {
              Se(() => {
                c.isUnmounted || y();
              }, b);
            });
            return;
          }
        }
        let Q = E, oe;
        ut(c, !1), E ? (E.el = Y.el, W(c, E, A)) : E = Y, M && un(M), (oe = E.props && E.props.onVnodeBeforeUpdate) && Ne(oe, N, E, Y), ut(c, !0);
        const ce = Ks(c), Ke = c.subTree;
        c.subTree = ce, j(
          Ke,
          ce,
          // parent may have changed if it's in a teleport
          v(Ke.el),
          // anchor may have changed if it's in a fragment
          on(Ke),
          c,
          b,
          x
        ), E.el = ce.el, Q === null && Vr(c, ce.el), F && Se(F, b), (oe = E.props && E.props.onVnodeUpdated) && Se(
          () => Ne(oe, N, E, Y),
          b
        );
      } else {
        let E;
        const { el: M, props: F } = u, { bm: N, m: Y, parent: Q, root: oe, type: ce } = c, Ke = zt(u);
        ut(c, !1), N && un(N), !Ke && (E = F && F.onVnodeBeforeMount) && Ne(E, Q, u), ut(c, !0);
        {
          oe.ce && oe.ce._hasShadowRoot() && oe.ce._injectChildStyle(
            ce,
            c.parent ? c.parent.type : void 0
          );
          const Ve = c.subTree = Ks(c);
          j(
            null,
            Ve,
            g,
            _,
            c,
            b,
            x
          ), u.el = Ve.el;
        }
        if (Y && Se(Y, b), !Ke && (E = F && F.onVnodeMounted)) {
          const Ve = u;
          Se(
            () => Ne(E, Q, Ve),
            b
          );
        }
        (u.shapeFlag & 256 || Q && zt(Q.vnode) && Q.vnode.shapeFlag & 256) && c.a && Se(c.a, b), c.isMounted = !0, u = g = _ = null;
      }
    };
    c.scope.on();
    const S = c.effect = new go(C);
    c.scope.off();
    const y = c.update = S.run.bind(S), k = c.job = S.runIfDirty.bind(S);
    k.i = c, k.id = c.uid, S.scheduler = () => vs(k), ut(c, !0), y();
  }, W = (c, u, g) => {
    u.component = c;
    const _ = c.vnode.props;
    c.vnode = u, c.next = null, Nr(c, u.props, _, g), Br(c, u.children, g), tt(), Is(c), nt();
  }, J = (c, u, g, _, b, x, A, C, S = !1) => {
    const y = c && c.children, k = c ? c.shapeFlag : 0, E = u.children, { patchFlag: M, shapeFlag: F } = u;
    if (M > 0) {
      if (M & 128) {
        R(
          y,
          E,
          g,
          _,
          b,
          x,
          A,
          C,
          S
        );
        return;
      } else if (M & 256) {
        Ge(
          y,
          E,
          g,
          _,
          b,
          x,
          A,
          C,
          S
        );
        return;
      }
    }
    F & 8 ? (k & 16 && Ot(y, b, x), E !== y && f(g, E)) : k & 16 ? F & 16 ? R(
      y,
      E,
      g,
      _,
      b,
      x,
      A,
      C,
      S
    ) : Ot(y, b, x, !0) : (k & 8 && f(g, ""), F & 16 && ye(
      E,
      g,
      _,
      b,
      x,
      A,
      C,
      S
    ));
  }, Ge = (c, u, g, _, b, x, A, C, S) => {
    c = c || wt, u = u || wt;
    const y = c.length, k = u.length, E = Math.min(y, k);
    let M;
    for (M = 0; M < E; M++) {
      const F = u[M] = S ? Ze(u[M]) : ze(u[M]);
      j(
        c[M],
        F,
        g,
        null,
        b,
        x,
        A,
        C,
        S
      );
    }
    y > k ? Ot(
      c,
      b,
      x,
      !0,
      !1,
      E
    ) : ye(
      u,
      g,
      _,
      b,
      x,
      A,
      C,
      S,
      E
    );
  }, R = (c, u, g, _, b, x, A, C, S) => {
    let y = 0;
    const k = u.length;
    let E = c.length - 1, M = k - 1;
    for (; y <= E && y <= M; ) {
      const F = c[y], N = u[y] = S ? Ze(u[y]) : ze(u[y]);
      if ($t(F, N))
        j(
          F,
          N,
          g,
          null,
          b,
          x,
          A,
          C,
          S
        );
      else
        break;
      y++;
    }
    for (; y <= E && y <= M; ) {
      const F = c[E], N = u[M] = S ? Ze(u[M]) : ze(u[M]);
      if ($t(F, N))
        j(
          F,
          N,
          g,
          null,
          b,
          x,
          A,
          C,
          S
        );
      else
        break;
      E--, M--;
    }
    if (y > E) {
      if (y <= M) {
        const F = M + 1, N = F < k ? u[F].el : _;
        for (; y <= M; )
          j(
            null,
            u[y] = S ? Ze(u[y]) : ze(u[y]),
            g,
            N,
            b,
            x,
            A,
            C,
            S
          ), y++;
      }
    } else if (y > M)
      for (; y <= E; )
        p(c[y], b, x, !0), y++;
    else {
      const F = y, N = y, Y = /* @__PURE__ */ new Map();
      for (y = N; y <= M; y++) {
        const Ae = u[y] = S ? Ze(u[y]) : ze(u[y]);
        Ae.key != null && Y.set(Ae.key, y);
      }
      let Q, oe = 0;
      const ce = M - N + 1;
      let Ke = !1, Ve = 0;
      const Mt = new Array(ce);
      for (y = 0; y < ce; y++) Mt[y] = 0;
      for (y = F; y <= E; y++) {
        const Ae = c[y];
        if (oe >= ce) {
          p(Ae, b, x, !0);
          continue;
        }
        let He;
        if (Ae.key != null)
          He = Y.get(Ae.key);
        else
          for (Q = N; Q <= M; Q++)
            if (Mt[Q - N] === 0 && $t(Ae, u[Q])) {
              He = Q;
              break;
            }
        He === void 0 ? p(Ae, b, x, !0) : (Mt[He - N] = y + 1, He >= Ve ? Ve = He : Ke = !0, j(
          Ae,
          u[He],
          g,
          null,
          b,
          x,
          A,
          C,
          S
        ), oe++);
      }
      const Ss = Ke ? Gr(Mt) : wt;
      for (Q = Ss.length - 1, y = ce - 1; y >= 0; y--) {
        const Ae = N + y, He = u[Ae], Cs = u[Ae + 1], As = Ae + 1 < k ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Cs.el || si(Cs)
        ) : _;
        Mt[y] === 0 ? j(
          null,
          He,
          g,
          As,
          b,
          x,
          A,
          C,
          S
        ) : Ke && (Q < 0 || y !== Ss[Q] ? h(He, g, As, 2) : Q--);
      }
    }
  }, h = (c, u, g, _, b = null) => {
    const { el: x, type: A, transition: C, children: S, shapeFlag: y } = c;
    if (y & 6) {
      h(c.component.subTree, u, g, _);
      return;
    }
    if (y & 128) {
      c.suspense.move(u, g, _);
      return;
    }
    if (y & 64) {
      A.move(c, u, g, It);
      return;
    }
    if (A === Re) {
      s(x, u, g);
      for (let E = 0; E < S.length; E++)
        h(S[E], u, g, _);
      s(c.anchor, u, g);
      return;
    }
    if (A === Bn) {
      G(c, u, g);
      return;
    }
    if (_ !== 2 && y & 1 && C)
      if (_ === 0)
        C.beforeEnter(x), s(x, u, g), Se(() => C.enter(x), b);
      else {
        const { leave: E, delayLeave: M, afterLeave: F } = C, N = () => {
          c.ctx.isUnmounted ? o(x) : s(x, u, g);
        }, Y = () => {
          x._isLeaving && x[fr](
            !0
            /* cancelled */
          ), E(x, () => {
            N(), F && F();
          });
        };
        M ? M(x, N, Y) : Y();
      }
    else
      s(x, u, g);
  }, p = (c, u, g, _ = !1, b = !1) => {
    const {
      type: x,
      props: A,
      ref: C,
      children: S,
      dynamicChildren: y,
      shapeFlag: k,
      patchFlag: E,
      dirs: M,
      cacheIndex: F,
      memo: N
    } = c;
    if (E === -2 && (b = !1), C != null && (tt(), Lt(C, null, g, c, !0), nt()), F != null && (u.renderCache[F] = void 0), k & 256) {
      u.ctx.deactivate(c);
      return;
    }
    const Y = k & 1 && M, Q = !zt(c);
    let oe;
    if (Q && (oe = A && A.onVnodeBeforeUnmount) && Ne(oe, u, c), k & 6)
      di(c.component, g, _);
    else {
      if (k & 128) {
        c.suspense.unmount(g, _);
        return;
      }
      Y && ct(c, null, u, "beforeUnmount"), k & 64 ? c.type.remove(
        c,
        u,
        g,
        It,
        _
      ) : y && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !y.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (x !== Re || E > 0 && E & 64) ? Ot(
        y,
        u,
        g,
        !1,
        !0
      ) : (x === Re && E & 384 || !b && k & 16) && Ot(S, u, g), _ && T(c);
    }
    const ce = N != null && F == null;
    (Q && (oe = A && A.onVnodeUnmounted) || Y || ce) && Se(() => {
      oe && Ne(oe, u, c), Y && ct(c, null, u, "unmounted"), ce && (c.el = null);
    }, g);
  }, T = (c) => {
    const { type: u, el: g, anchor: _, transition: b } = c;
    if (u === Re) {
      bt(g, _);
      return;
    }
    if (u === Bn) {
      P(c);
      return;
    }
    const x = () => {
      o(g), b && !b.persisted && b.afterLeave && b.afterLeave();
    };
    if (c.shapeFlag & 1 && b && !b.persisted) {
      const { leave: A, delayLeave: C } = b, S = () => A(g, x);
      C ? C(c.el, x, S) : S();
    } else
      x();
  }, bt = (c, u) => {
    let g;
    for (; c !== u; )
      g = w(c), o(c), c = g;
    o(u);
  }, di = (c, u, g) => {
    const { bum: _, scope: b, job: x, subTree: A, um: C, m: S, a: y } = c;
    Ns(S), Ns(y), _ && un(_), b.stop(), x && (x.flags |= 8, p(A, c, u, g)), C && Se(C, u), Se(() => {
      c.isUnmounted = !0;
    }, u);
  }, Ot = (c, u, g, _ = !1, b = !1, x = 0) => {
    for (let A = x; A < c.length; A++)
      p(c[A], u, g, _, b);
  }, on = (c) => {
    if (c.shapeFlag & 6)
      return on(c.component.subTree);
    if (c.shapeFlag & 128)
      return c.suspense.next();
    const u = w(c.anchor || c.el), g = u && u[cr];
    return g ? w(g) : u;
  };
  let jn = !1;
  const ws = (c, u, g) => {
    let _;
    c == null ? u._vnode && (p(u._vnode, null, null, !0), _ = u._vnode.component) : j(
      u._vnode || null,
      c,
      u,
      null,
      null,
      null,
      g
    ), u._vnode = c, jn || (jn = !0, Is(_), Po(), jn = !1);
  }, It = {
    p: j,
    um: p,
    m: h,
    r: T,
    mt: vt,
    mc: ye,
    pc: J,
    pbc: _e,
    n: on,
    o: e
  };
  return {
    render: ws,
    hydrate: void 0,
    createApp: kr(ws)
  };
}
function zn({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function ut({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Jr(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function ti(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (D(s) && D(o))
    for (let i = 0; i < s.length; i++) {
      const r = s[i];
      let a = o[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = o[i] = Ze(o[i]), a.el = r.el), !n && a.patchFlag !== -2 && ti(r, a)), a.type === $n && (a.patchFlag === -1 && (a = o[i] = Ze(a)), a.el = r.el), a.type === rt && !a.el && (a.el = r.el);
    }
}
function Gr(e) {
  const t = e.slice(), n = [0];
  let s, o, i, r, a;
  const l = e.length;
  for (s = 0; s < l; s++) {
    const d = e[s];
    if (d !== 0) {
      if (o = n[n.length - 1], e[o] < d) {
        t[s] = o, n.push(s);
        continue;
      }
      for (i = 0, r = n.length - 1; i < r; )
        a = i + r >> 1, e[n[a]] < d ? i = a + 1 : r = a;
      d < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, r = n[i - 1]; i-- > 0; )
    n[i] = r, r = t[r];
  return n;
}
function ni(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : ni(t);
}
function Ns(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function si(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? si(t.subTree) : null;
}
const oi = (e) => e.__isSuspense;
function Yr(e, t) {
  t && t.pendingBranch ? D(e) ? t.effects.push(...e) : t.effects.push(e) : sr(e);
}
const Re = /* @__PURE__ */ Symbol.for("v-fgt"), $n = /* @__PURE__ */ Symbol.for("v-txt"), rt = /* @__PURE__ */ Symbol.for("v-cmt"), Bn = /* @__PURE__ */ Symbol.for("v-stc"), Wt = [];
let Oe = null;
function Te(e = !1) {
  Wt.push(Oe = e ? null : []);
}
function Xr() {
  Wt.pop(), Oe = Wt[Wt.length - 1] || null;
}
let Xt = 1;
function bn(e, t = !1) {
  Xt += e, e < 0 && Oe && t && (Oe.hasOnce = !0);
}
function ii(e) {
  return e.dynamicChildren = Xt > 0 ? Oe || wt : null, Xr(), Xt > 0 && Oe && Oe.push(e), e;
}
function Ie(e, t, n, s, o, i) {
  return ii(
    m(
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
function Zr(e, t, n, s, o) {
  return ii(
    le(
      e,
      t,
      n,
      s,
      o,
      !0
    )
  );
}
function xn(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function $t(e, t) {
  return e.type === t.type && e.key === t.key;
}
const ri = ({ key: e }) => e ?? null, pn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? se(e) || /* @__PURE__ */ me(e) || K(e) ? { i: Me, r: e, k: t, f: !!n } : e : null);
function m(e, t = null, n = null, s = 0, o = null, i = e === Re ? 0 : 1, r = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && ri(t),
    ref: t && pn(t),
    scopeId: Do,
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
    ctx: Me
  };
  return a ? (_s(l, n), i & 128 && e.normalize(l)) : n && (l.shapeFlag |= se(n) ? 8 : 16), Xt > 0 && // avoid a block node from tracking itself
  !r && // has current parent block
  Oe && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Oe.push(l), l;
}
const le = Qr;
function Qr(e, t = null, n = null, s = 0, o = null, i = !1) {
  if ((!e || e === Cr) && (e = rt), xn(e)) {
    const a = Rt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && _s(a, n), Xt > 0 && !i && Oe && (a.shapeFlag & 6 ? Oe[Oe.indexOf(e)] = a : Oe.push(a)), a.patchFlag = -2, a;
  }
  if (ua(e) && (e = e.__vccOpts), t) {
    t = ea(t);
    let { class: a, style: l } = t;
    a && !se(a) && (t.class = Ce(a)), q(l) && (/* @__PURE__ */ gs(l) && !D(l) && (l = fe({}, l)), t.style = cs(l));
  }
  const r = se(e) ? 1 : oi(e) ? 128 : ur(e) ? 64 : q(e) ? 4 : K(e) ? 2 : 0;
  return m(
    e,
    t,
    n,
    s,
    o,
    r,
    i,
    !0
  );
}
function ea(e) {
  return e ? /* @__PURE__ */ gs(e) || Go(e) ? fe({}, e) : e : null;
}
function Rt(e, t, n = !1, s = !1) {
  const { props: o, ref: i, patchFlag: r, children: a, transition: l } = e, d = t ? ta(o || {}, t) : o, f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && ri(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? D(i) ? i.concat(pn(t)) : [i, pn(t)] : pn(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== Re ? r === -1 ? 16 : r | 16 : r,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Rt(e.ssContent),
    ssFallback: e.ssFallback && Rt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && s && bs(
    f,
    l.clone(f)
  ), f;
}
function de(e = " ", t = 0) {
  return le($n, null, e, t);
}
function Wn(e = "", t = !1) {
  return t ? (Te(), Zr(rt, null, e)) : le(rt, null, e);
}
function ze(e) {
  return e == null || typeof e == "boolean" ? le(rt) : D(e) ? le(
    Re,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : xn(e) ? Ze(e) : le($n, null, String(e));
}
function Ze(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Rt(e);
}
function _s(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (D(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), _s(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !Go(t) ? t._ctx = Me : o === 3 && Me && (Me.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else K(t) ? (t = { default: t, _ctx: Me }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [de(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function ta(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = Ce([t.class, s.class]));
      else if (o === "style")
        t.style = cs([t.style, s.style]);
      else if (Cn(o)) {
        const i = t[o], r = s[o];
        r && i !== r && !(D(i) && i.includes(r)) ? t[o] = i ? [].concat(i, r) : r : r == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !An(o) && (t[o] = r);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function Ne(e, t, n, s = null) {
  Je(e, t, 7, [
    n,
    s
  ]);
}
const na = zo();
let sa = 0;
function oa(e, t, n) {
  const s = e.type, o = (t ? t.appContext : e.appContext) || na, i = {
    uid: sa++,
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
    scope: new Ti(
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
    propsOptions: Xo(s, o),
    emitsOptions: Bo(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: X,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: X,
    data: X,
    props: X,
    attrs: X,
    slots: X,
    refs: X,
    setupState: X,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = $r.bind(null, i), e.ce && e.ce(i), i;
}
let xe = null;
const ia = () => xe || Me;
let yn, os;
{
  const e = On(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (i) => {
      o.length > 1 ? o.forEach((r) => r(i)) : o[0](i);
    };
  };
  yn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => xe = n
  ), os = t(
    "__VUE_SSR_SETTERS__",
    (n) => Zt = n
  );
}
const nn = (e) => {
  const t = xe;
  return yn(e), e.scope.on(), () => {
    e.scope.off(), yn(t);
  };
}, Us = () => {
  xe && xe.scope.off(), yn(null);
};
function ai(e) {
  return e.vnode.shapeFlag & 4;
}
let Zt = !1;
function ra(e, t = !1, n = !1) {
  t && os(t);
  const { props: s, children: o } = e.vnode, i = ai(e);
  Hr(e, s, i, t), zr(e, o, n || t);
  const r = i ? aa(e, t) : void 0;
  return t && os(!1), r;
}
function aa(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Ar);
  const { setup: s } = n;
  if (s) {
    tt();
    const o = e.setupContext = s.length > 1 ? ca(e) : null, i = nn(e), r = tn(
      s,
      e,
      0,
      [
        e.props,
        o
      ]
    ), a = ao(r);
    if (nt(), i(), (a || e.sp) && !zt(e) && Ko(e), a) {
      if (r.then(Us, Us), t)
        return r.then((l) => {
          Ls(e, l);
        }).catch((l) => {
          Mn(l, e, 0);
        });
      e.asyncDep = r;
    } else
      Ls(e, r);
  } else
    li(e);
}
function Ls(e, t, n) {
  K(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : q(t) && (e.setupState = Io(t)), li(e);
}
function li(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || We);
  {
    const o = nn(e);
    tt();
    try {
      Tr(e);
    } finally {
      nt(), o();
    }
  }
}
const la = {
  get(e, t) {
    return he(e, "get", ""), e[t];
  }
};
function ca(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, la),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Dn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Io(qi(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Bt)
        return Bt[n](e);
    },
    has(t, n) {
      return n in t || n in Bt;
    }
  })) : e.proxy;
}
function ua(e) {
  return K(e) && "__vccOpts" in e;
}
const _t = (e, t) => /* @__PURE__ */ Zi(e, t, Zt);
function re(e, t, n) {
  try {
    bn(-1);
    const s = arguments.length;
    return s === 2 ? q(t) && !D(t) ? xn(t) ? le(e, null, [t]) : le(e, t) : le(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && xn(n) && (n = [n]), le(e, t, n));
  } finally {
    bn(1);
  }
}
const fa = "3.5.34";
/**
* @vue/runtime-dom v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let is;
const zs = typeof window < "u" && window.trustedTypes;
if (zs)
  try {
    is = /* @__PURE__ */ zs.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const ci = is ? (e) => is.createHTML(e) : (e) => e, pa = "http://www.w3.org/2000/svg", da = "http://www.w3.org/1998/Math/MathML", Xe = typeof document < "u" ? document : null, Bs = Xe && /* @__PURE__ */ Xe.createElement("template"), ha = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? Xe.createElementNS(pa, e) : t === "mathml" ? Xe.createElementNS(da, e) : n ? Xe.createElement(e, { is: n }) : Xe.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
  },
  createText: (e) => Xe.createTextNode(e),
  createComment: (e) => Xe.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Xe.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, o, i) {
    const r = n ? n.previousSibling : t.lastChild;
    if (o && (o === i || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), n), !(o === i || !(o = o.nextSibling)); )
        ;
    else {
      Bs.innerHTML = ci(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = Bs.content;
      if (s === "svg" || s === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      r ? r.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, ma = /* @__PURE__ */ Symbol("_vtc");
function ga(e, t, n) {
  const s = e[ma];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const _n = /* @__PURE__ */ Symbol("_vod"), ui = /* @__PURE__ */ Symbol("_vsh"), Ws = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[_n] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Dt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Dt(e, !0), s.enter(e)) : s.leave(e, () => {
      Dt(e, !1);
    }) : Dt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Dt(e, t);
  }
};
function Dt(e, t) {
  e.style.display = t ? e[_n] : "none", e[ui] = !t;
}
const va = /* @__PURE__ */ Symbol(""), ba = /(?:^|;)\s*display\s*:/;
function xa(e, t, n) {
  const s = e.style, o = se(n);
  let i = !1;
  if (n && !o) {
    if (t)
      if (se(t))
        for (const r of t.split(";")) {
          const a = r.slice(0, r.indexOf(":")).trim();
          n[a] == null && jt(s, a, "");
        }
      else
        for (const r in t)
          n[r] == null && jt(s, r, "");
    for (const r in n) {
      r === "display" && (i = !0);
      const a = n[r];
      a != null ? _a(
        e,
        r,
        !se(t) && t ? t[r] : void 0,
        a
      ) || jt(s, r, a) : jt(s, r, "");
    }
  } else if (o) {
    if (t !== n) {
      const r = s[va];
      r && (n += ";" + r), s.cssText = n, i = ba.test(n);
    }
  } else t && e.removeAttribute("style");
  _n in e && (e[_n] = i ? s.display : "", e[ui] && (s.display = "none"));
}
const qs = /\s*!important$/;
function jt(e, t, n) {
  if (D(n))
    n.forEach((s) => jt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = ya(e, t);
    qs.test(n) ? e.setProperty(
      at(s),
      n.replace(qs, ""),
      "important"
    ) : e[s] = n;
  }
}
const Js = ["Webkit", "Moz", "ms"], qn = {};
function ya(e, t) {
  const n = qn[t];
  if (n)
    return n;
  let s = $e(t);
  if (s !== "filter" && s in e)
    return qn[t] = s;
  s = uo(s);
  for (let o = 0; o < Js.length; o++) {
    const i = Js[o] + s;
    if (i in e)
      return qn[t] = i;
  }
  return t;
}
function _a(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && se(s) && n === s;
}
const Gs = "http://www.w3.org/1999/xlink";
function Ys(e, t, n, s, o, i = Si(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Gs, t.slice(6, t.length)) : e.setAttributeNS(Gs, t, n) : n == null || i && !po(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : qe(n) ? String(n) : n
  );
}
function Xs(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? ci(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? e.getAttribute("value") || "" : e.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in e)) && (e.value = l), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let r = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = po(n) : n == null && a === "string" ? (n = "", r = !0) : a === "number" && (n = 0, r = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  r && e.removeAttribute(o || t);
}
function pt(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function wa(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Zs = /* @__PURE__ */ Symbol("_vei");
function Sa(e, t, n, s, o = null) {
  const i = e[Zs] || (e[Zs] = {}), r = i[t];
  if (s && r)
    r.value = s;
  else {
    const [a, l] = Ca(t);
    if (s) {
      const d = i[t] = Ea(
        s,
        o
      );
      pt(e, a, d, l);
    } else r && (wa(e, a, r, l), i[t] = void 0);
  }
}
const Qs = /(?:Once|Passive|Capture)$/;
function Ca(e) {
  let t;
  if (Qs.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Qs); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : at(e.slice(2)), t];
}
let Jn = 0;
const Aa = /* @__PURE__ */ Promise.resolve(), Ta = () => Jn || (Aa.then(() => Jn = 0), Jn = Date.now());
function Ea(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    Je(
      Ra(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Ta(), n;
}
function Ra(e, t) {
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
const eo = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Oa = (e, t, n, s, o, i) => {
  const r = o === "svg";
  t === "class" ? ga(e, s, r) : t === "style" ? xa(e, n, s) : Cn(t) ? An(t) || Sa(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ia(e, t, s, r)) ? (Xs(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ys(e, t, s, r, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Ma(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !se(s))) ? Xs(e, $e(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ys(e, t, s, r));
};
function Ia(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && eo(t) && K(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return eo(t) && se(n) ? !1 : t in e;
}
function Ma(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = $e(t);
  return Array.isArray(n) ? n.some((o) => $e(o) === s) : Object.keys(n).some((o) => $e(o) === s);
}
const wn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return D(t) ? (n) => un(t, n) : t;
};
function ka(e) {
  e.target.composing = !0;
}
function to(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const Tt = /* @__PURE__ */ Symbol("_assign");
function no(e, t, n) {
  return t && (e = e.trim()), n && (e = Rn(e)), e;
}
const pe = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, o) {
    e[Tt] = wn(o);
    const i = s || o.props && o.props.type === "number";
    pt(e, t ? "change" : "input", (r) => {
      r.target.composing || e[Tt](no(e.value, n, i));
    }), (n || i) && pt(e, "change", () => {
      e.value = no(e.value, n, i);
    }), t || (pt(e, "compositionstart", ka), pt(e, "compositionend", to), pt(e, "change", to));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: i } }, r) {
    if (e[Tt] = wn(r), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? Rn(e.value) : e.value, l = t ?? "";
    if (a === l)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === l) || (e.value = l);
  }
}, so = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const o = Tn(t);
    pt(e, "change", () => {
      const i = Array.prototype.filter.call(e.options, (r) => r.selected).map(
        (r) => n ? Rn(Sn(r)) : Sn(r)
      );
      e[Tt](
        e.multiple ? o ? new Set(i) : i : i[0]
      ), e._assigning = !0, Nt(() => {
        e._assigning = !1;
      });
    }), e[Tt] = wn(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    oo(e, t);
  },
  beforeUpdate(e, t, n) {
    e[Tt] = wn(n);
  },
  updated(e, { value: t }) {
    e._assigning || oo(e, t);
  }
};
function oo(e, t) {
  const n = e.multiple, s = D(t);
  if (!(n && !s && !Tn(t))) {
    for (let o = 0, i = e.options.length; o < i; o++) {
      const r = e.options[o], a = Sn(r);
      if (n)
        if (s) {
          const l = typeof a;
          l === "string" || l === "number" ? r.selected = t.some((d) => String(d) === String(a)) : r.selected = Ai(t, a) > -1;
        } else
          r.selected = t.has(a);
      else if (en(Sn(r), t)) {
        e.selectedIndex !== o && (e.selectedIndex = o);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function Sn(e) {
  return "_value" in e ? e._value : e.value;
}
const Pa = ["ctrl", "shift", "alt", "meta"], $a = {
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
  exact: (e, t) => Pa.some((n) => e[`${n}Key`] && !t.includes(n))
}, te = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((o, ...i) => {
    for (let r = 0; r < t.length; r++) {
      const a = $a[t[r]];
      if (a && a(o, t)) return;
    }
    return e(o, ...i);
  }));
}, Da = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, we = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = ((o) => {
    if (!("key" in o))
      return;
    const i = at(o.key);
    if (t.some(
      (r) => r === i || Da[r] === i
    ))
      return e(o);
  }));
}, Fa = /* @__PURE__ */ fe({ patchProp: Oa }, ha);
let io;
function ja() {
  return io || (io = Wr(Fa));
}
const Ka = ((...e) => {
  const t = ja().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const o = Ha(s);
    if (!o) return;
    const i = t._component;
    !K(i) && !i.render && !i.template && (i.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
    const r = n(o, !1, Va(o));
    return o instanceof Element && (o.removeAttribute("v-cloak"), o.setAttribute("data-v-app", "")), r;
  }, t;
});
function Va(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Ha(e) {
  return se(e) ? document.querySelector(e) : e;
}
let Na = 1;
function Ee(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Pe(e) {
  return `${e}-${Date.now().toString(36)}-${Na++}`;
}
function fi(e) {
  const t = Ee(e || {});
  return {
    ...t,
    timestamp: { ...t.timestamp || {} },
    scene: { ...t.scene || {} },
    costumes: { ...t.costumes || {} },
    items: { ...t.items || {} },
    deletedItems: Array.isArray(t.deletedItems) ? [...t.deletedItems] : [],
    events: Array.isArray(t.events) ? Ee(t.events) : t.event ? [Ee(t.event)] : [],
    affection: { ...t.affection || {} },
    npcs: Ee(t.npcs || {}),
    agenda: Array.isArray(t.agenda) ? Ee(t.agenda) : [],
    deletedAgenda: Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [],
    mood: Ee(t.mood || {}),
    relationships: Array.isArray(t.relationships) ? Ee(t.relationships) : []
  };
}
function Ua(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function Fn(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function La(e) {
  return Fn(e) === "悬念" ? "未解悬念" : "行动计划";
}
function za(e) {
  return Fn(e) === "悬念" ? "type-suspense" : "type-plan";
}
function Ba(e) {
  switch (e) {
    case "affection":
      return { id: Pe("aff"), name: "", value: 0, editing: !0 };
    case "relationship":
      return { id: Pe("rel"), from: "", to: "", type: "", note: "", editing: !0 };
    case "costume":
      return { id: Pe("costume"), name: "", desc: "", editing: !0 };
    case "item":
      return {
        id: Pe("item"),
        icon: "",
        name: "",
        holder: "",
        location: "",
        description: "",
        importance: "",
        editing: !0
      };
    case "agenda":
      return { id: Pe("agenda"), date: "", type: "悬念", text: "", source: "user", editing: !0 };
    default:
      return { id: Pe("row"), editing: !0 };
  }
}
function pi(e) {
  const t = fi(e), n = t.events[0] || {};
  return {
    baseMeta: Ee(t),
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
      id: Pe("aff"),
      name: s,
      value: Ua(o),
      editing: !1
    })),
    relationshipRows: (t.relationships || []).map((s) => ({
      id: Pe("rel"),
      from: s.from || "",
      to: s.to || "",
      type: s.type || "",
      note: s.note || "",
      editing: !1
    })),
    costumeRows: Object.entries(t.costumes || {}).map(([s, o]) => ({
      id: Pe("costume"),
      name: s,
      desc: o,
      editing: !1
    })),
    itemRows: Object.entries(t.items || {}).map(([s, o]) => ({
      id: Pe("item"),
      icon: (o == null ? void 0 : o.icon) || "",
      name: s,
      holder: (o == null ? void 0 : o.holder) || "",
      location: (o == null ? void 0 : o.location) || "",
      description: (o == null ? void 0 : o.description) || "",
      importance: (o == null ? void 0 : o.importance) || "",
      editing: !1
    })),
    agendaRows: (t.agenda || []).map((s) => ({
      id: Pe("agenda"),
      date: s.date || "",
      type: Fn(s.type),
      text: s.text || "",
      source: s.source || "user",
      done: !!s.done,
      editing: !1
    })),
    isSkipped: !!t._skipHorae
  };
}
function Wa(e) {
  const t = fi(e.baseMeta), n = Ee(t);
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
    const r = String(i.name || "").trim(), a = String(i.desc || "").trim();
    r && a && (n.costumes[r] = a);
  }
  n.items = {};
  for (const i of e.itemRows || []) {
    const r = String(i.name || "").trim();
    r && (n.items[r] = {
      icon: String(i.icon || "").trim() || null,
      importance: i.importance || "",
      holder: String(i.holder || "").trim() || null,
      location: String(i.location || "").trim(),
      description: String(i.description || "").trim()
    });
  }
  n.affection = {};
  for (const i of e.affectionRows || []) {
    const r = String(i.name || "").trim();
    if (!r) continue;
    const a = Number.parseFloat(i.value);
    n.affection[r] = {
      type: "absolute",
      value: Number.isFinite(a) ? a : String(i.value || "").trim()
    };
  }
  n.relationships = [];
  for (const i of e.relationshipRows || []) {
    const r = String(i.from || "").trim(), a = String(i.to || "").trim(), l = String(i.type || "").trim(), d = String(i.note || "").trim();
    r && a && l && n.relationships.push({ from: r, to: a, type: l, note: d });
  }
  const s = String(e.event.summary || "").trim(), o = String(e.event.level || "").trim();
  n.events = s ? [{
    is_important: o === "重要" || o === "关键" || o === "關鍵",
    level: o || "一般",
    summary: s
  }] : [], delete n.event, n.agenda = [];
  for (const i of e.agendaRows || []) {
    const r = String(i.text || "").trim();
    r && n.agenda.push({
      type: Fn(i.type),
      date: String(i.date || "").trim(),
      text: r,
      source: i.source || "user",
      done: !!i.done
    });
  }
  return n.deletedItems = Array.isArray(t.deletedItems) ? [...t.deletedItems] : [], n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = Ee(t.npcs || {}), n.mood = Ee(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = Ee(t._rpgChanges)), t.tableContributions && (n.tableContributions = Ee(t.tableContributions)), n;
}
function qa(e, t) {
  const n = pi(t);
  for (const s of Object.keys(e)) delete e[s];
  Object.assign(e, n);
}
function Ja(e) {
  return Array.isArray(e) ? e.map((t) => String(t || "").trim()).filter(Boolean) : String(e || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}
const Ga = { class: "toggle-left" }, Ya = { class: "toggle-icon" }, Xa = { class: "toggle-info" }, Za = { class: "toggle-time" }, Qa = {
  key: 0,
  class: "horae-sideplay-badge"
}, el = { class: "toggle-summary" }, tl = { class: "toggle-actions" }, nl = ["title"], sl = ["title"], ol = ["title", "disabled"], il = { class: "horae-panel-content" }, rl = { class: "neo-dashboard" }, al = { class: "neo-tags" }, ll = { class: "neo-chip" }, cl = ["placeholder"], ul = { class: "neo-chip" }, fl = ["placeholder"], pl = { class: "neo-chip" }, dl = ["placeholder"], hl = { class: "event-header" }, ml = { class: "event-badge" }, gl = { class: "action-group-hover" }, vl = { class: "view-mode" }, bl = { class: "event-body-text" }, xl = { value: "" }, yl = { value: "一般" }, _l = { value: "重要" }, wl = { value: "关键" }, Sl = ["placeholder"], Cl = { class: "neo-inset-section" }, Al = { class: "neo-section-header compact" }, Tl = { class: "section-title" }, El = { class: "aff-grid list-container" }, Rl = ["onClick"], Ol = { class: "view-mode" }, Il = { class: "t-title" }, Ml = { class: "t-val" }, kl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Pl = ["onUpdate:modelValue", "placeholder", "onKeydown"], $l = { class: "neo-inset-section" }, Dl = { class: "neo-section-header compact" }, Fl = { class: "section-title" }, jl = { class: "rel-list list-container" }, Kl = ["onClick"], Vl = { class: "view-mode" }, Hl = { class: "rel-node" }, Nl = { class: "rel-node" }, Ul = { class: "rel-label" }, Ll = ["onUpdate:modelValue", "placeholder", "onKeydown"], zl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Bl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Wl = { class: "neo-inset-section" }, ql = { class: "neo-section-header" }, Jl = { class: "section-title" }, Gl = { class: "neo-item-list list-container" }, Yl = ["onClick"], Xl = { class: "view-mode" }, Zl = { class: "item-emoji" }, Ql = { class: "item-info" }, ec = { class: "item-line-top" }, tc = {
  key: 0,
  class: "item-holder-badge"
}, nc = {
  key: 0,
  class: "item-meta"
}, sc = { class: "item-desc" }, oc = { class: "item-edit-line" }, ic = ["onUpdate:modelValue", "onKeydown"], rc = ["onUpdate:modelValue", "placeholder", "onKeydown"], ac = ["onUpdate:modelValue", "placeholder", "onKeydown"], lc = ["onUpdate:modelValue", "placeholder", "onKeydown"], cc = ["onUpdate:modelValue", "placeholder", "onKeydown"], uc = { class: "neo-inset-section" }, fc = { class: "neo-section-header" }, pc = { class: "section-title" }, dc = { class: "neo-agenda-list list-container" }, hc = ["onClick"], mc = { class: "view-mode" }, gc = { class: "agenda-date" }, vc = { class: "agenda-content" }, bc = { class: "agenda-type" }, xc = { class: "agenda-text" }, yc = { class: "agenda-edit-line" }, _c = ["onUpdate:modelValue", "placeholder", "onKeydown"], wc = ["onUpdate:modelValue", "onKeydown"], Sc = { value: "悬念" }, Cc = { value: "计划" }, Ac = ["onUpdate:modelValue", "placeholder", "onKeydown"], Tc = { class: "neo-footer-actions" }, Ec = { class: "action-group" }, Rc = ["disabled"], Oc = ["disabled"], Ic = { class: "action-group" }, Mc = ["disabled"], kc = ["title"], Pc = {
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
    }, o = _t(() => ({ ...s, ...n.labels })).value, i = _t(() => ({ sideplayMode: !1, ...n.config })).value, r = n.adapter || {}, a = /* @__PURE__ */ Pt(null), l = /* @__PURE__ */ Gt(pi(n.initialMeta)), d = /* @__PURE__ */ Pt(!1), f = /* @__PURE__ */ Pt(!1), v = /* @__PURE__ */ Pt(null), w = /* @__PURE__ */ Gt({ save: !1, scan: !1, ai: !1, sideplay: !1 }), O = /* @__PURE__ */ Pt((l.scene.characters_present || []).join(", "));
    Ut(
      () => l.scene.characters_present,
      (R) => {
        O.value = (R || []).join(", ");
      },
      { deep: !0 }
    ), Ut(
      () => l.isSkipped,
      (R) => {
        var h;
        (h = n.setHostState) == null || h.call(n, { isSkipped: !!R, visible: i.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const L = _t(() => {
      if (l.isSkipped) return o.noTracking;
      const R = l.timestamp.story_date || "--", h = l.timestamp.story_time ? ` ${l.timestamp.story_time}` : "";
      return `${R}${h}`;
    }), j = _t(() => {
      var p;
      if (l.isSkipped) return o.sideplayTitle;
      const R = l.event.summary || o.noSpecialEvents, h = ((p = l.scene.characters_present) == null ? void 0 : p.length) || 0;
      return h ? `${R} | ${h}${o.characters}` : R;
    }), ne = _t(() => `${l.event.level || o.levelNormal}${o.event}`);
    function $() {
      f.value = !0;
    }
    function H(R) {
      R.target.closest("button, input, textarea, select") || (d.value = !d.value);
    }
    function G() {
      l.scene.characters_present = Ja(O.value), $();
    }
    function P(R, h) {
      return `${R}:${(h == null ? void 0 : h.id) || "single"}`;
    }
    function Z(R, h) {
      return v.value === P(R, h);
    }
    function ge(R, h) {
      if (h != null && h.editing) return;
      const p = P(R, h);
      v.value = v.value === p ? null : p;
    }
    function U(R) {
      R.editing = !R.editing, v.value = null, R.editing || $(), Nt(ae);
    }
    function ye(R, h) {
      l[R].push(Ba(h)), v.value = null, $(), Nt(ae);
    }
    function je(R, h) {
      const p = l[R], T = p.findIndex((bt) => bt.id === h);
      T >= 0 && (p.splice(T, 1), v.value = null, $());
    }
    function _e(R) {
      qa(l, R || {}), O.value = (l.scene.characters_present || []).join(", "), v.value = null, f.value = !1, Nt(ae);
    }
    async function lt() {
      var R;
      w.save = !0;
      try {
        const h = Wa(l), p = await ((R = r.save) == null ? void 0 : R.call(r, h));
        p ? _e(p) : f.value = !1;
      } finally {
        w.save = !1;
      }
    }
    async function mt() {
      var R;
      w.scan = !0;
      try {
        const h = await ((R = r.quickScan) == null ? void 0 : R.call(r));
        h && _e(h);
      } finally {
        w.scan = !1;
      }
    }
    async function gt() {
      var R;
      w.scan = !0;
      try {
        const h = await ((R = r.rescan) == null ? void 0 : R.call(r));
        h && _e(h);
      } finally {
        w.scan = !1;
      }
    }
    async function vt() {
      var R;
      w.ai = !0;
      try {
        const h = await ((R = r.aiAnalyze) == null ? void 0 : R.call(r));
        h && _e(h);
      } finally {
        w.ai = !1;
      }
    }
    async function sn() {
      var R;
      w.sideplay = !0;
      try {
        const h = await ((R = r.toggleSideplay) == null ? void 0 : R.call(r));
        h && _e(h);
      } finally {
        w.sideplay = !1;
      }
    }
    function ae() {
      var R;
      (R = a.value) == null || R.querySelectorAll("textarea").forEach((h) => {
        h.style.height = "auto", h.style.height = `${h.scrollHeight}px`;
      });
    }
    const W = /* @__PURE__ */ Ms({
      props: {
        row: { type: Object, required: !0 },
        deleteIcon: { type: String, default: "fa-xmark" }
      },
      emits: ["edit", "delete"],
      setup(R, { emit: h }) {
        return () => re("div", { class: "action-group-hover" }, [
          re("button", {
            class: "action-hover-btn btn-edit",
            onClick: (p) => {
              p.stopPropagation(), h("edit");
            }
          }, [
            re("i", { class: "fa-solid fa-pen" })
          ]),
          re("button", {
            class: "action-hover-btn btn-del",
            onClick: (p) => {
              p.stopPropagation(), h("delete");
            }
          }, [
            re("i", { class: `fa-solid ${R.deleteIcon}` })
          ])
        ]);
      }
    }), J = /* @__PURE__ */ Ms({
      props: {
        title: { type: String, required: !0 },
        icon: { type: String, required: !0 },
        rows: { type: Array, required: !0 },
        labels: { type: Object, required: !0 }
      },
      emits: ["add", "edit", "delete", "dirty"],
      setup(R, { emit: h }) {
        return () => re("section", { class: "neo-inset-section" }, [
          re("div", { class: "neo-section-header" }, [
            re("span", { class: "section-title" }, [
              re("i", { class: `fa-solid ${R.icon}` }),
              ` ${R.title}`
            ]),
            re("button", { class: "neo-text-btn add", onClick: () => h("add") }, [
              re("i", { class: "fa-solid fa-plus" }),
              ` ${R.labels.add}`
            ])
          ]),
          re("div", { class: "neo-dict-list list-container" }, R.rows.map((p) => re("div", {
            key: p.id,
            class: ["neo-dict-row editable-block", {
              "is-editing": p.editing,
              "is-action-open": Z("costumeRows", p)
            }],
            onClick: () => ge("costumeRows", p)
          }, [
            re("div", { class: "view-mode dict-view" }, [
              re("div", { class: "dict-key" }, p.name || R.labels.role),
              re("div", { class: "dict-value" }, p.desc || R.labels.itemDesc)
            ]),
            re("div", {
              class: "edit-mode dict-edit-mode",
              onClick: (T) => T.stopPropagation()
            }, [
              re("input", {
                class: "neo-input short-key no-enter",
                value: p.name,
                placeholder: R.labels.role,
                onInput: (T) => {
                  p.name = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", p));
                }
              }),
              re("textarea", {
                class: "neo-textarea no-enter",
                value: p.desc,
                placeholder: R.labels.itemDesc,
                onInput: (T) => {
                  p.desc = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", p));
                }
              })
            ]),
            re(W, {
              row: p,
              onEdit: () => h("edit", p),
              onDelete: () => h("delete", p.id)
            })
          ])))
        ]);
      }
    });
    function Ge(R) {
      _e(R);
    }
    return t({ replaceMeta: Ge }), (R, h) => (Te(), Ie("div", {
      ref_key: "panelRoot",
      ref: a,
      class: "horae-message-panel-shell"
    }, [
      m("div", {
        class: "horae-panel-top",
        onClick: H
      }, [
        m("div", Ga, [
          m("div", Ya, [
            m("i", {
              class: Ce(["fa-regular", l.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          m("div", Xa, [
            m("div", Za, [
              l.isSkipped ? (Te(), Ie("span", Qa, V(I(o).sideplay), 1)) : Wn("", !0),
              de(" " + V(L.value), 1)
            ]),
            m("div", el, V(j.value), 1)
          ])
        ]),
        m("div", tl, [
          ie(m("button", {
            class: "neo-btn-icon",
            title: I(o).sideplayTitle,
            onClick: te(sn, ["stop"])
          }, [
            m("i", {
              class: Ce(["fa-solid", l.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, nl), [
            [Ws, I(i).sideplayMode]
          ]),
          m("button", {
            class: "neo-btn-icon",
            title: I(o).rescan,
            onClick: te(gt, ["stop"])
          }, [...h[21] || (h[21] = [
            m("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, sl),
          m("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: I(o).aiAnalyze,
            disabled: w.ai,
            onClick: te(vt, ["stop"])
          }, [
            m("i", {
              class: Ce(["fa-solid", w.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, ol)
        ])
      ]),
      ie(m("div", il, [
        m("div", rl, [
          m("div", al, [
            m("span", ll, [
              h[22] || (h[22] = m("i", { class: "fa-solid fa-location-dot" }, null, -1)),
              ie(m("input", {
                "onUpdate:modelValue": h[0] || (h[0] = (p) => l.scene.location = p),
                class: "neo-chip-input",
                placeholder: I(o).location,
                onInput: $
              }, null, 40, cl), [
                [pe, l.scene.location]
              ])
            ]),
            m("span", ul, [
              h[23] || (h[23] = m("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
              ie(m("input", {
                "onUpdate:modelValue": h[1] || (h[1] = (p) => l.scene.atmosphere = p),
                class: "neo-chip-input",
                placeholder: I(o).atmosphere,
                onInput: $
              }, null, 40, fl), [
                [pe, l.scene.atmosphere]
              ])
            ]),
            m("span", pl, [
              h[24] || (h[24] = m("i", { class: "fa-solid fa-users" }, null, -1)),
              ie(m("input", {
                "onUpdate:modelValue": h[2] || (h[2] = (p) => O.value = p),
                class: "neo-chip-input",
                placeholder: I(o).characters,
                onInput: G
              }, null, 40, dl), [
                [pe, O.value]
              ])
            ])
          ]),
          m("div", {
            class: Ce(["neo-event-card editable-block", { "is-editing": l.event.editing, "is-action-open": Z("event", l.event) }]),
            onClick: h[8] || (h[8] = (p) => ge("event", l.event))
          }, [
            m("div", hl, [
              m("span", ml, [
                h[25] || (h[25] = m("i", { class: "fa-solid fa-bolt" }, null, -1)),
                de(" " + V(ne.value), 1)
              ]),
              m("div", gl, [
                m("button", {
                  class: "action-hover-btn btn-edit",
                  onClick: h[3] || (h[3] = te((p) => U(l.event), ["stop"]))
                }, [...h[26] || (h[26] = [
                  m("i", { class: "fa-solid fa-pen" }, null, -1)
                ])])
              ])
            ]),
            m("div", vl, [
              m("div", bl, V(l.event.summary || I(o).noSpecialEvents), 1)
            ]),
            m("div", {
              class: "edit-mode",
              onClick: h[7] || (h[7] = te(() => {
              }, ["stop"]))
            }, [
              ie(m("select", {
                "onUpdate:modelValue": h[4] || (h[4] = (p) => l.event.level = p),
                class: "neo-input event-level-select",
                onChange: $
              }, [
                m("option", xl, V(I(o).levelNone), 1),
                m("option", yl, V(I(o).levelNormal), 1),
                m("option", _l, V(I(o).levelImportant), 1),
                m("option", wl, V(I(o).levelCritical), 1)
              ], 544), [
                [so, l.event.level]
              ]),
              ie(m("textarea", {
                "onUpdate:modelValue": h[5] || (h[5] = (p) => l.event.summary = p),
                class: "neo-textarea lg no-enter",
                rows: "2",
                placeholder: I(o).eventPlaceholder,
                onInput: $,
                onKeydown: h[6] || (h[6] = we(te((p) => U(l.event), ["prevent"]), ["enter"]))
              }, null, 40, Sl), [
                [pe, l.event.summary]
              ])
            ])
          ], 2),
          m("section", Cl, [
            m("div", Al, [
              m("span", Tl, [
                h[27] || (h[27] = m("i", { class: "fa-solid fa-heart" }, null, -1)),
                de(" " + V(I(o).affection), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[9] || (h[9] = (p) => ye("affectionRows", "affection"))
              }, [
                h[28] || (h[28] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                de(" " + V(I(o).add), 1)
              ])
            ]),
            m("div", El, [
              (Te(!0), Ie(Re, null, cn(l.affectionRows, (p) => (Te(), Ie("div", {
                key: p.id,
                class: Ce(["aff-chip editable-block", { "is-editing": p.editing, "is-action-open": Z("affectionRows", p) }]),
                onClick: (T) => ge("affectionRows", p)
              }, [
                m("div", Ol, [
                  m("span", Il, V(p.name || I(o).role), 1),
                  m("span", Ml, V(p.value || 0), 1)
                ]),
                m("div", {
                  class: "edit-mode",
                  onClick: h[10] || (h[10] = te(() => {
                  }, ["stop"]))
                }, [
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.name = T,
                    class: "neo-input no-enter aff-name",
                    placeholder: I(o).role,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, kl), [
                    [pe, p.name]
                  ]),
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.value = T,
                    class: "neo-input no-enter aff-value",
                    placeholder: I(o).value,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, Pl), [
                    [pe, p.value]
                  ])
                ]),
                le(I(W), {
                  row: p,
                  onEdit: (T) => U(p),
                  onDelete: (T) => je("affectionRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 10, Rl))), 128))
            ])
          ]),
          m("section", $l, [
            m("div", Dl, [
              m("span", Fl, [
                h[29] || (h[29] = m("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                de(" " + V(I(o).relationships), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[11] || (h[11] = (p) => ye("relationshipRows", "relationship"))
              }, [
                h[30] || (h[30] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                de(" " + V(I(o).add), 1)
              ])
            ]),
            m("div", jl, [
              (Te(!0), Ie(Re, null, cn(l.relationshipRows, (p) => (Te(), Ie("div", {
                key: p.id,
                class: Ce(["rel-row editable-block", { "is-editing": p.editing, "is-action-open": Z("relationshipRows", p) }]),
                onClick: (T) => ge("relationshipRows", p)
              }, [
                m("div", Vl, [
                  m("span", Hl, V(p.from || I(o).role), 1),
                  h[31] || (h[31] = m("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                  m("span", Nl, V(p.to || I(o).role), 1),
                  m("span", Ul, V(p.type || I(o).relationshipHint), 1)
                ]),
                m("div", {
                  class: "edit-mode",
                  onClick: h[12] || (h[12] = te(() => {
                  }, ["stop"]))
                }, [
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.from = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: I(o).relFrom,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, Ll), [
                    [pe, p.from]
                  ]),
                  h[32] || (h[32] = m("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.to = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: I(o).relTo,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, zl), [
                    [pe, p.to]
                  ]),
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.type = T,
                    class: "neo-input no-enter",
                    placeholder: I(o).relType,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, Bl), [
                    [pe, p.type]
                  ])
                ]),
                le(I(W), {
                  row: p,
                  onEdit: (T) => U(p),
                  onDelete: (T) => je("relationshipRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 10, Kl))), 128))
            ])
          ]),
          le(I(J), {
            title: I(o).costumes,
            icon: "fa-shirt",
            rows: l.costumeRows,
            labels: I(o),
            onAdd: h[13] || (h[13] = (p) => ye("costumeRows", "costume")),
            onEdit: U,
            onDelete: h[14] || (h[14] = (p) => je("costumeRows", p)),
            onDirty: $
          }, null, 8, ["title", "rows", "labels"]),
          m("section", Wl, [
            m("div", ql, [
              m("span", Jl, [
                h[33] || (h[33] = m("i", { class: "fa-solid fa-box-open" }, null, -1)),
                de(" " + V(I(o).items), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[15] || (h[15] = (p) => ye("itemRows", "item"))
              }, [
                h[34] || (h[34] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                de(" " + V(I(o).add), 1)
              ])
            ]),
            m("div", Gl, [
              (Te(!0), Ie(Re, null, cn(l.itemRows, (p) => (Te(), Ie("div", {
                key: p.id,
                class: Ce(["neo-item-card editable-block", { "is-editing": p.editing, "is-action-open": Z("itemRows", p) }]),
                onClick: (T) => ge("itemRows", p)
              }, [
                m("div", Xl, [
                  m("div", Zl, V(p.icon || "📦"), 1),
                  m("div", Ql, [
                    m("div", ec, [
                      m("span", null, V(p.name || I(o).itemName), 1),
                      p.holder ? (Te(), Ie("span", tc, V(p.holder), 1)) : Wn("", !0)
                    ]),
                    p.location ? (Te(), Ie("div", nc, [
                      h[35] || (h[35] = m("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                      de(" " + V(p.location), 1)
                    ])) : Wn("", !0),
                    m("div", sc, V(p.description || I(o).itemDesc), 1)
                  ])
                ]),
                m("div", {
                  class: "edit-mode item-edit-mode",
                  onClick: h[16] || (h[16] = te(() => {
                  }, ["stop"]))
                }, [
                  m("div", oc, [
                    ie(m("input", {
                      "onUpdate:modelValue": (T) => p.icon = T,
                      class: "neo-input no-enter item-icon-input",
                      maxlength: "2",
                      placeholder: "📦",
                      onInput: $,
                      onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                    }, null, 40, ic), [
                      [pe, p.icon]
                    ]),
                    ie(m("input", {
                      "onUpdate:modelValue": (T) => p.name = T,
                      class: "neo-input no-enter",
                      placeholder: I(o).itemName,
                      onInput: $,
                      onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                    }, null, 40, rc), [
                      [pe, p.name]
                    ]),
                    ie(m("input", {
                      "onUpdate:modelValue": (T) => p.holder = T,
                      class: "neo-input no-enter item-holder-input",
                      placeholder: I(o).holder,
                      onInput: $,
                      onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                    }, null, 40, ac), [
                      [pe, p.holder]
                    ])
                  ]),
                  ie(m("input", {
                    "onUpdate:modelValue": (T) => p.location = T,
                    class: "neo-input no-enter",
                    placeholder: I(o).location,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, lc), [
                    [pe, p.location]
                  ]),
                  ie(m("textarea", {
                    "onUpdate:modelValue": (T) => p.description = T,
                    class: "neo-textarea no-enter",
                    placeholder: I(o).itemDesc,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, cc), [
                    [pe, p.description]
                  ])
                ]),
                le(I(W), {
                  row: p,
                  "delete-icon": "fa-trash-can",
                  onEdit: (T) => U(p),
                  onDelete: (T) => je("itemRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 10, Yl))), 128))
            ])
          ]),
          m("section", uc, [
            m("div", fc, [
              m("span", pc, [
                h[36] || (h[36] = m("i", { class: "fa-solid fa-list-check" }, null, -1)),
                de(" " + V(I(o).agenda), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[17] || (h[17] = (p) => ye("agendaRows", "agenda"))
              }, [
                h[37] || (h[37] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                de(" " + V(I(o).add), 1)
              ])
            ]),
            m("div", dc, [
              (Te(!0), Ie(Re, null, cn(l.agendaRows, (p) => (Te(), Ie("div", {
                key: p.id,
                class: Ce(["agenda-card editable-block", [I(za)(p.type), { "is-editing": p.editing, "is-action-open": Z("agendaRows", p) }]]),
                onClick: (T) => ge("agendaRows", p)
              }, [
                m("div", mc, [
                  m("div", gc, V(p.date || I(o).unscheduled), 1),
                  m("div", vc, [
                    m("span", bc, V(I(La)(p.type)), 1),
                    m("span", xc, V(p.text || I(o).agendaText), 1)
                  ])
                ]),
                m("div", {
                  class: "edit-mode agenda-edit-mode",
                  onClick: h[18] || (h[18] = te(() => {
                  }, ["stop"]))
                }, [
                  m("div", yc, [
                    ie(m("input", {
                      "onUpdate:modelValue": (T) => p.date = T,
                      class: "neo-input no-enter agenda-date-input",
                      placeholder: I(o).date,
                      onInput: $,
                      onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                    }, null, 40, _c), [
                      [pe, p.date]
                    ]),
                    ie(m("select", {
                      "onUpdate:modelValue": (T) => p.type = T,
                      class: "neo-input no-enter",
                      onChange: $,
                      onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                    }, [
                      m("option", Sc, V(I(o).agendaMystery), 1),
                      m("option", Cc, V(I(o).agendaPlan), 1)
                    ], 40, wc), [
                      [so, p.type]
                    ])
                  ]),
                  ie(m("textarea", {
                    "onUpdate:modelValue": (T) => p.text = T,
                    class: "neo-textarea no-enter",
                    placeholder: I(o).agendaText,
                    onInput: $,
                    onKeydown: we(te((T) => U(p), ["prevent"]), ["enter"])
                  }, null, 40, Ac), [
                    [pe, p.text]
                  ])
                ]),
                le(I(W), {
                  row: p,
                  onEdit: (T) => U(p),
                  onDelete: (T) => je("agendaRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 10, hc))), 128))
            ])
          ]),
          m("div", Tc, [
            m("div", Ec, [
              m("button", {
                class: "neo-btn-text",
                disabled: w.scan,
                onClick: mt
              }, [
                m("i", {
                  class: Ce(["fa-solid", w.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                }, null, 2),
                de(" " + V(I(o).quickScan), 1)
              ], 8, Rc),
              m("button", {
                class: "neo-btn-text btn-ai-text",
                disabled: w.ai,
                onClick: vt
              }, [
                m("i", {
                  class: Ce(["fa-solid", w.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                }, null, 2),
                de(" " + V(I(o).aiAnalyze), 1)
              ], 8, Oc)
            ]),
            m("div", Ic, [
              m("button", {
                class: "neo-btn-text btn-save-apply",
                disabled: w.save,
                onClick: lt
              }, [
                m("i", {
                  class: Ce(["fa-solid", w.save ? "fa-spinner fa-spin" : "fa-check"])
                }, null, 2),
                de(" " + V(I(o).apply), 1)
              ], 8, Mc),
              m("button", {
                class: "neo-btn-text",
                onClick: h[19] || (h[19] = (p) => d.value = !0)
              }, [
                h[38] || (h[38] = m("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                de(" " + V(I(o).collapse), 1)
              ]),
              m("button", {
                class: "neo-btn-text btn-drawer",
                title: I(o).openDrawer,
                onClick: h[20] || (h[20] = (p) => {
                  var T, bt;
                  return (bt = (T = I(r)).openDrawer) == null ? void 0 : bt.call(T);
                })
              }, [...h[39] || (h[39] = [
                m("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
              ])], 8, kc)
            ])
          ])
        ])
      ], 512), [
        [Ws, !d.value]
      ])
    ], 512));
  }
}, $c = '.horae-message-panel.horae-message-panel-vue{background:#2b2d31!important;border:0!important;border-radius:20px!important;box-shadow:6px 6px 12px #0006,-4px -4px 10px #ffffff0d!important;color:#b5bac1!important;margin-top:10px!important;margin-bottom:18px!important;overflow:hidden!important;--mp-bg-base: #2b2d31;--mp-text-title: #e3e5e8;--mp-text-main: #b5bac1;--mp-text-muted: #80848e;--mp-accent: #a78bfa;--mp-danger: #fb7185;--mp-success: #34d399;--mp-warning: #fbbf24;--mp-info: #38bdf8;--mp-pink: #f472b6;--mp-light-shadow: rgba(255, 255, 255, .05);--mp-dark-shadow: rgba(0, 0, 0, .4);--mp-neo-drop: 6px 6px 12px var(--mp-dark-shadow), -4px -4px 10px var(--mp-light-shadow);--mp-neo-drop-sm: 4px 4px 8px var(--mp-dark-shadow), -2px -2px 6px var(--mp-light-shadow);--mp-neo-inset: inset 4px 4px 8px var(--mp-dark-shadow), inset -4px -4px 8px var(--mp-light-shadow);--mp-neo-inset-sm: inset 2px 2px 4px var(--mp-dark-shadow), inset -2px -2px 4px var(--mp-light-shadow);--mp-radius-md: 12px;--mp-radius-sm: 8px;--mp-radius-round: 50px}.horae-message-panel.horae-message-panel-vue.horae-light{--mp-bg-base: #eef0f4;--mp-text-title: #20242c;--mp-text-main: #4a5160;--mp-text-muted: #767d8c;--mp-light-shadow: rgba(255, 255, 255, .95);--mp-dark-shadow: rgba(122, 132, 150, .28);color:var(--mp-text-main)!important}.horae-message-panel.horae-message-panel-vue.horae-sideplay{opacity:.72}.horae-message-panel-vue *,.horae-message-panel-vue *:before,.horae-message-panel-vue *:after{box-sizing:border-box}.horae-message-panel-vue button{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;box-shadow:none;text-shadow:none!important;font:inherit!important}.horae-message-panel-vue .horae-panel-top{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid rgba(255,255,255,.02);cursor:pointer;transition:background .2s;-webkit-user-select:none;user-select:none}.horae-message-panel-vue .horae-panel-top:hover{background:#ffffff05}.horae-message-panel-vue .toggle-left{flex:1;min-width:0;display:flex;align-items:center;gap:16px}.horae-message-panel-vue .toggle-icon{flex:0 0 auto;font-size:1.1rem;color:var(--mp-accent);display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;box-shadow:var(--mp-neo-drop)}.horae-message-panel-vue .toggle-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.horae-message-panel-vue .toggle-time{color:var(--mp-text-title);font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:8px}.horae-message-panel-vue .toggle-summary{color:var(--mp-text-muted);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.horae-message-panel-vue .toggle-actions{flex:0 0 auto;display:flex;gap:12px}.horae-message-panel-vue .neo-btn-icon{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;width:38px;height:38px;border-radius:50%!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0!important}.horae-message-panel-vue .neo-btn-icon:hover{color:var(--mp-accent)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-icon:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .neo-btn-icon:disabled,.horae-message-panel-vue .neo-btn-text:disabled{cursor:wait;opacity:.7}.horae-message-panel-vue .horae-panel-content{padding:16px 24px 24px;background:transparent!important;border-top:0!important}.horae-message-panel-vue .neo-dashboard{display:flex;flex-direction:column;gap:24px}.horae-message-panel-vue .neo-tags{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .neo-chip{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);padding:8px 16px;border-radius:var(--mp-radius-round);font-size:.9rem;display:inline-flex;align-items:center;gap:8px;min-width:min(100%,180px)}.horae-message-panel-vue .neo-chip i{color:var(--mp-accent);opacity:.85}.horae-message-panel-vue .neo-chip-input{width:100%;min-width:80px;background:transparent!important;border:none!important;box-shadow:none!important;color:var(--mp-text-main)!important;padding:0!important;font-size:.9rem!important;outline:none!important}.horae-message-panel-vue .neo-input,.horae-message-panel-vue .neo-textarea{width:100%;background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-title)!important;font-size:.95rem!important;box-shadow:var(--mp-neo-inset)!important;outline:none!important;border-radius:var(--mp-radius-sm)!important;font-family:inherit;transition:box-shadow .2s;line-height:1.5}.horae-message-panel-vue .neo-input{padding:8px 12px!important;height:36px}.horae-message-panel-vue .neo-textarea{padding:10px 14px!important;resize:vertical;min-height:42px;overflow:hidden}.horae-message-panel-vue .neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}.horae-message-panel-vue .neo-input:focus,.horae-message-panel-vue .neo-textarea:focus{box-shadow:var(--mp-neo-inset),0 0 0 1px var(--mp-warning)!important}.horae-message-panel-vue .neo-text-btn{background:transparent!important;border:none!important;color:var(--mp-text-muted)!important;cursor:pointer;font-size:.85rem!important;display:flex;align-items:center;gap:6px;font-weight:500;transition:color .2s;outline:none;padding:0!important}.horae-message-panel-vue .neo-text-btn:hover{color:var(--mp-text-title)!important}.horae-message-panel-vue .neo-text-btn.add:hover{color:var(--mp-accent)!important}.horae-message-panel-vue .neo-inset-section{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);border-radius:var(--mp-radius-md);padding:16px 20px}.horae-message-panel-vue .neo-section-header{margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.horae-message-panel-vue .neo-section-header.compact{margin-bottom:12px}.horae-message-panel-vue .section-title{font-size:.85rem;color:var(--mp-text-title);display:flex;align-items:center;gap:8px;font-weight:600;text-transform:uppercase}.horae-message-panel-vue .section-title i{color:var(--mp-accent);opacity:.9}.horae-message-panel-vue .action-group-hover{display:flex;gap:4px;opacity:0;transform:translate(6px);transition:all .2s ease;margin-left:auto;flex:0 0 auto;pointer-events:none}.horae-message-panel-vue .action-hover-btn{width:28px;height:28px;border-radius:50%!important;border:none!important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem!important;color:var(--mp-text-muted)!important;background:transparent!important;transition:all .2s ease;outline:none;padding:0!important}.horae-message-panel-vue .action-hover-btn.btn-edit:hover{background:#38bdf81a!important;color:var(--mp-info)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .action-hover-btn.btn-del:hover{background:#fb71851a!important;color:var(--mp-danger)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .is-editing .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .is-editing .btn-edit{color:var(--mp-success)!important}.horae-message-panel-vue .is-editing .btn-edit i:before{content:""}.horae-message-panel-vue .view-mode{display:flex;gap:10px;flex:1;min-width:0;align-items:flex-start}.horae-message-panel-vue .edit-mode{display:none;gap:10px;flex:1;min-width:0;align-items:flex-start;flex-wrap:wrap}.horae-message-panel-vue .is-editing .view-mode{display:none!important}.horae-message-panel-vue .is-editing .edit-mode{display:flex!important}.horae-message-panel-vue .neo-event-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop);border-radius:var(--mp-radius-md);padding:18px 20px;border-left:4px solid var(--mp-warning);position:relative}.horae-message-panel-vue .event-header{margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}.horae-message-panel-vue .event-badge{font-size:.85rem;color:var(--mp-warning);font-weight:600;display:flex;align-items:center;gap:6px}.horae-message-panel-vue .event-body-text{font-size:1.02rem;color:var(--mp-text-title);line-height:1.6;word-break:break-word}.horae-message-panel-vue .neo-event-card .action-group-hover{position:absolute;right:20px;top:16px;opacity:1}.horae-message-panel-vue .event-level-select{flex:0 0 110px}.horae-message-panel-vue .aff-grid{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .aff-chip{background:#ffffff05;border-radius:var(--mp-radius-sm);padding:6px 12px;display:inline-flex;align-items:center;transition:all .2s ease;position:relative;border:1px solid rgba(255,255,255,.03);min-height:38px}.horae-message-panel-vue .aff-chip:hover{background:#ffffff0a}.horae-message-panel-vue .aff-chip .view-mode{align-items:center;margin:0;gap:10px}.horae-message-panel-vue .aff-chip .t-title{font-weight:600;font-size:.9rem;color:var(--mp-text-title);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.horae-message-panel-vue .aff-chip .t-val{font-weight:700;font-size:.95rem;color:var(--mp-pink);font-family:monospace}.horae-message-panel-vue .aff-chip .edit-mode{align-items:center;gap:6px}.horae-message-panel-vue .aff-name{width:76px!important;min-width:76px}.horae-message-panel-vue .aff-value{width:58px!important;min-width:58px}.horae-message-panel-vue .aff-chip .action-group-hover{position:absolute;right:-8px;top:-14px;background:var(--mp-bg-base);border-radius:20px;box-shadow:var(--mp-neo-drop-sm);padding:2px 4px;z-index:10;margin:0}.horae-message-panel-vue .aff-chip.is-editing .action-group-hover{position:static;background:transparent;box-shadow:none;padding:0;margin-left:2px}.horae-message-panel-vue .rel-list,.horae-message-panel-vue .neo-dict-list,.horae-message-panel-vue .neo-item-list,.horae-message-panel-vue .neo-agenda-list{display:flex;flex-direction:column}.horae-message-panel-vue .rel-list{gap:4px}.horae-message-panel-vue .neo-dict-list{gap:6px}.horae-message-panel-vue .neo-item-list{gap:14px}.horae-message-panel-vue .neo-agenda-list{gap:12px}.horae-message-panel-vue .rel-row,.horae-message-panel-vue .neo-dict-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:var(--mp-radius-sm);transition:background .2s;position:relative}.horae-message-panel-vue .rel-row{align-items:center;padding-top:6px;padding-bottom:6px}.horae-message-panel-vue .rel-row:hover,.horae-message-panel-vue .neo-dict-row:hover{background:#ffffff05}.horae-message-panel-vue .rel-row .view-mode{align-items:center;gap:10px;font-size:.9rem;flex-wrap:wrap}.horae-message-panel-vue .rel-node{font-weight:600;color:var(--mp-text-title);background:#0003;padding:2px 8px;border-radius:4px}.horae-message-panel-vue .rel-arrow{color:var(--mp-accent);opacity:.7;font-size:.8rem}.horae-message-panel-vue .rel-label{color:var(--mp-text-main);font-style:italic}.horae-message-panel-vue .rel-person{width:82px!important;flex:0 0 82px!important}.horae-message-panel-vue .dict-view{align-items:flex-start}.horae-message-panel-vue .dict-key{color:var(--mp-accent);font-weight:600;white-space:nowrap;flex:0 0 auto;line-height:1.5}.horae-message-panel-vue .dict-key:after{content:":";color:var(--mp-text-muted);margin-left:2px}.horae-message-panel-vue .dict-value{color:var(--mp-text-main);line-height:1.5;word-break:break-word}.horae-message-panel-vue .dict-edit-mode{align-items:flex-start}.horae-message-panel-vue .short-key{width:100px!important;flex:0 0 100px!important}.horae-message-panel-vue .neo-item-card,.horae-message-panel-vue .agenda-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop-sm);border-radius:var(--mp-radius-sm);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;position:relative}.horae-message-panel-vue .item-emoji{font-size:1.6rem;line-height:1;margin-top:2px}.horae-message-panel-vue .item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-right:2px}.horae-message-panel-vue .item-line-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:600;color:var(--mp-text-title);font-size:1rem}.horae-message-panel-vue .item-holder-badge{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset-sm);color:var(--mp-accent);font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:400}.horae-message-panel-vue .item-meta{font-size:.8rem;color:var(--mp-text-muted)}.horae-message-panel-vue .item-desc{font-size:.9rem;color:var(--mp-text-main);line-height:1.4;word-break:break-word}.horae-message-panel-vue .item-edit-mode{flex-direction:column}.horae-message-panel-vue .item-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .item-icon-input{width:52px!important;flex:0 0 52px!important;text-align:center}.horae-message-panel-vue .item-holder-input{width:90px!important;flex:0 0 90px!important}.horae-message-panel-vue .agenda-card{border-left:3px solid var(--mp-text-muted)}.horae-message-panel-vue .agenda-card.type-suspense{border-left-color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-suspense .agenda-type{color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-plan{border-left-color:var(--mp-info)}.horae-message-panel-vue .agenda-card.type-plan .agenda-type{color:var(--mp-info)}.horae-message-panel-vue .agenda-date{font-size:.8rem;color:var(--mp-text-muted);white-space:nowrap;padding-top:2px;font-family:monospace;width:80px;flex:0 0 80px}.horae-message-panel-vue .agenda-content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.horae-message-panel-vue .agenda-type{font-size:.75rem;font-weight:600}.horae-message-panel-vue .agenda-text{font-size:.95rem;color:var(--mp-text-title);word-break:break-word}.horae-message-panel-vue .agenda-edit-mode{flex-direction:column}.horae-message-panel-vue .agenda-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .agenda-date-input{width:110px!important;flex:0 0 110px!important}.horae-message-panel-vue .neo-footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px}.horae-message-panel-vue .action-group{display:flex;gap:12px;align-items:center}.horae-message-panel-vue .neo-btn-text{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;padding:10px 20px!important;border-radius:var(--mp-radius-round)!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;font-size:.9rem!important;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .2s ease;outline:none;white-space:nowrap}.horae-message-panel-vue .neo-btn-text:hover{color:var(--mp-text-title)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-text:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .btn-ai-text{color:var(--mp-accent)!important}.horae-message-panel-vue .btn-save-apply{color:var(--mp-success)!important}.horae-message-panel-vue .btn-drawer{padding-left:13px!important;padding-right:13px!important}.horae-message-panel-vue .horae-sideplay-badge{background:var(--mp-text-muted);color:var(--mp-bg-base);font-size:10px;padding:1px 6px;border-radius:3px;font-weight:700}@media(max-width:768px){.horae-message-panel-vue .horae-panel-top,.horae-message-panel-vue .horae-panel-content{padding:16px}.horae-message-panel-vue .toggle-actions{gap:8px}.horae-message-panel-vue .neo-btn-icon{width:34px;height:34px}.horae-message-panel-vue .dict-view,.horae-message-panel-vue .agenda-card .view-mode,.horae-message-panel-vue .agenda-card .edit-mode{flex-direction:column;gap:8px}.horae-message-panel-vue .dict-key:after{content:""}.horae-message-panel-vue .action-group-hover,.horae-message-panel-vue .neo-event-card .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:0;transform:translate(6px);pointer-events:none}.horae-message-panel-vue .editable-block.is-action-open>.action-group-hover,.horae-message-panel-vue .editable-block.is-action-open .event-header>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing>.action-group-hover,.horae-message-panel-vue .editable-block.is-editing .event-header>.action-group-hover{opacity:1;transform:translate(0);pointer-events:auto}.horae-message-panel-vue .neo-footer-actions{flex-direction:column;align-items:stretch;gap:12px;margin-top:6px}.horae-message-panel-vue .action-group{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}.horae-message-panel-vue .neo-btn-text{width:100%;justify-content:center;padding:12px 10px!important;font-size:.85rem!important}.horae-message-panel-vue .btn-drawer{grid-column:1 / -1}}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;max-width:none!important;margin:0!important;border:none!important;border-radius:var(--mp-radius-sm)!important;background:var(--mp-bg-base)!important;color:var(--mp-text-title)!important;font-family:inherit!important;font-size:.95rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:var(--mp-neo-inset)!important;text-shadow:none!important;outline:none!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input{height:36px!important;min-height:36px!important;padding:8px 12px!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:42px!important;padding:10px 14px!important;resize:vertical!important;overflow:hidden!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-chip-input{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;min-width:80px!important;margin:0!important;padding:0!important;border:none!important;border-radius:0!important;background:transparent!important;color:var(--mp-text-main)!important;font-family:inherit!important;font-size:.9rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .toggle-icon,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .toggle-icon i:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before{color:var(--mp-accent)!important;text-shadow:none!important}.horae-message-panel.horae-message-panel-vue .section-title i:before,.horae-message-panel.horae-message-panel-vue .neo-chip i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .section-title i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .neo-chip i:before{color:var(--mp-accent)!important;text-shadow:none!important}', Dc = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i, Fc = "/css/fontawesome.min.css";
function jc(e) {
  e.style.setProperty("margin-top", "10px", "important"), e.style.setProperty("margin-bottom", "18px", "important"), e.style.setProperty("padding", "0", "important"), e.style.setProperty("background", "transparent", "important"), e.style.setProperty("border", "0", "important"), e.style.setProperty("border-radius", "0", "important"), e.style.setProperty("box-shadow", "none", "important"), e.style.setProperty("overflow", "visible", "important"), e.style.setProperty("opacity", "1", "important"), e.style.setProperty("order", "9999", "important");
}
function Kc(e) {
  if (!e.querySelector("style[data-horae-message-panel-style]")) {
    const n = document.createElement("style");
    n.dataset.horaeMessagePanelStyle = "true", n.textContent = $c, e.append(n);
  }
  const t = /* @__PURE__ */ new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((n) => {
    Dc.test(n.href) && t.add(n.href);
  }), t.size || t.add(Fc), t.forEach((n) => {
    if (Array.from(e.querySelectorAll("link[data-horae-fontawesome]")).some((i) => i.href === n)) return;
    const o = document.createElement("link");
    o.dataset.horaeFontawesome = "true", o.rel = "stylesheet", o.href = n, e.append(o);
  });
}
function Vc(e) {
  jc(e);
  const t = e.shadowRoot || e.attachShadow({ mode: "open" });
  t.textContent = "", Kc(t);
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
function Nc(e, t = {}) {
  if (!e) return null;
  const { panelContainer: n, classObserver: s, syncPanelContainer: o } = Vc(e), i = Ka(Pc, {
    ...t,
    setHostState(l = {}) {
      var d;
      e.classList.toggle("horae-sideplay", !!l.isSkipped), typeof l.visible == "boolean" && (e.style.display = l.visible ? "" : "none"), o(), (d = t.setHostState) == null || d.call(t, l);
    }
  }), r = i.mount(n), a = new MutationObserver(() => {
    document.body.contains(e) || (i.unmount(), a.disconnect(), s.disconnect());
  });
  return a.observe(document.body, { childList: !0, subtree: !0 }), {
    unmount() {
      a.disconnect(), s.disconnect(), i.unmount();
    },
    updateMeta(l) {
      var d;
      (d = r == null ? void 0 : r.replaceMeta) == null || d.call(r, l);
    }
  };
}
export {
  Nc as mountMessagePanel
};
