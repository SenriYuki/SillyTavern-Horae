/**
* @vue/shared v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function is(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const z = {}, vt = [], Be = () => {
}, oi = () => !1, Sn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), wn = (e) => e.startsWith("onUpdate:"), le = Object.assign, os = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ho = Object.prototype.hasOwnProperty, W = (e, t) => ho.call(e, t), $ = Array.isArray, bt = (e) => Yt(e) === "[object Map]", Cn = (e) => Yt(e) === "[object Set]", Ts = (e) => Yt(e) === "[object Date]", H = (e) => typeof e == "function", Q = (e) => typeof e == "string", We = (e) => typeof e == "symbol", q = (e) => e !== null && typeof e == "object", ri = (e) => (q(e) || H(e)) && H(e.then) && H(e.catch), li = Object.prototype.toString, Yt = (e) => li.call(e), go = (e) => Yt(e).slice(8, -1), ci = (e) => Yt(e) === "[object Object]", rs = (e) => Q(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ft = /* @__PURE__ */ is(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Tn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, mo = /-\w/g, Re = Tn(
  (e) => e.replace(mo, (t) => t.slice(1).toUpperCase())
), _o = /\B([A-Z])/g, rt = Tn(
  (e) => e.replace(_o, "-$1").toLowerCase()
), ai = Tn((e) => e.charAt(0).toUpperCase() + e.slice(1)), jn = Tn(
  (e) => e ? `on${ai(e)}` : ""
), ke = (e, t) => !Object.is(e, t), cn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, fi = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, An = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let As;
const En = () => As || (As = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function ls(e) {
  if ($(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = Q(s) ? xo(s) : ls(s);
      if (i)
        for (const o in i)
          t[o] = i[o];
    }
    return t;
  } else if (Q(e) || q(e))
    return e;
}
const yo = /;(?![^(]*\))/g, vo = /:([^]+)/, bo = /\/\*[^]*?\*\//g;
function xo(e) {
  const t = {};
  return e.replace(bo, "").split(yo).forEach((n) => {
    if (n) {
      const s = n.split(vo);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function ye(e) {
  let t = "";
  if (Q(e))
    t = e;
  else if ($(e))
    for (let n = 0; n < e.length; n++) {
      const s = ye(e[n]);
      s && (t += s + " ");
    }
  else if (q(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const So = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", wo = /* @__PURE__ */ is(So);
function ui(e) {
  return !!e || e === "";
}
function Co(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Xt(e[s], t[s]);
  return n;
}
function Xt(e, t) {
  if (e === t) return !0;
  let n = Ts(e), s = Ts(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = We(e), s = We(t), n || s)
    return e === t;
  if (n = $(e), s = $(t), n || s)
    return n && s ? Co(e, t) : !1;
  if (n = q(e), s = q(t), n || s) {
    if (!n || !s)
      return !1;
    const i = Object.keys(e).length, o = Object.keys(t).length;
    if (i !== o)
      return !1;
    for (const r in e) {
      const l = e.hasOwnProperty(r), c = t.hasOwnProperty(r);
      if (l && !c || !l && c || !Xt(e[r], t[r]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function To(e, t) {
  return e.findIndex((n) => Xt(n, t));
}
const di = (e) => !!(e && e.__v_isRef === !0), N = (e) => Q(e) ? e : e == null ? "" : $(e) || q(e) && (e.toString === li || !H(e.toString)) ? di(e) ? N(e.value) : JSON.stringify(e, pi, 2) : String(e), pi = (e, t) => di(t) ? pi(e, t.value) : bt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], o) => (n[Kn(s, o) + " =>"] = i, n),
    {}
  )
} : Cn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => Kn(n))
} : We(t) ? Kn(t) : q(t) && !$(t) && !ci(t) ? String(t) : t, Kn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    We(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let re;
class Ao {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && re && (re.active ? (this.parent = re, this.index = (re.scopes || (re.scopes = [])).push(
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
      const n = re;
      try {
        return re = this, t();
      } finally {
        re = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = re, re = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (re === this)
        re = this.prevScope;
      else {
        let t = re;
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
        const i = this.parent.scopes.pop();
        i && i !== this && (this.parent.scopes[this.index] = i, i.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Eo() {
  return re;
}
let X;
const Vn = /* @__PURE__ */ new WeakSet();
class hi {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, re && (re.active ? re.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Vn.has(this) && (Vn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || mi(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Es(this), _i(this);
    const t = X, n = Me;
    X = this, Me = !0;
    try {
      return this.fn();
    } finally {
      yi(this), X = t, Me = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        fs(t);
      this.deps = this.depsTail = void 0, Es(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Vn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Jn(this) && this.run();
  }
  get dirty() {
    return Jn(this);
  }
}
let gi = 0, jt, Kt;
function mi(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Kt, Kt = e;
    return;
  }
  e.next = jt, jt = e;
}
function cs() {
  gi++;
}
function as() {
  if (--gi > 0)
    return;
  if (Kt) {
    let t = Kt;
    for (Kt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; jt; ) {
    let t = jt;
    for (jt = void 0; t; ) {
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
function _i(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function yi(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const i = s.prevDep;
    s.version === -1 ? (s === n && (n = i), fs(s), Io(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Jn(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (vi(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function vi(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Bt) || (e.globalVersion = Bt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Jn(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = X, s = Me;
  X = e, Me = !0;
  try {
    _i(e);
    const i = e.fn(e._value);
    (t.version === 0 || ke(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    X = n, Me = s, yi(e), e.flags &= -3;
  }
}
function fs(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let o = n.computed.deps; o; o = o.nextDep)
      fs(o, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Io(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Me = !0;
const bi = [];
function Qe() {
  bi.push(Me), Me = !1;
}
function et() {
  const e = bi.pop();
  Me = e === void 0 ? !0 : e;
}
function Es(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = X;
    X = void 0;
    try {
      t();
    } finally {
      X = n;
    }
  }
}
let Bt = 0;
class Ro {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class us {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!X || !Me || X === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== X)
      n = this.activeLink = new Ro(X, this), X.deps ? (n.prevDep = X.depsTail, X.depsTail.nextDep = n, X.depsTail = n) : X.deps = X.depsTail = n, xi(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = X.depsTail, n.nextDep = void 0, X.depsTail.nextDep = n, X.depsTail = n, X.deps === n && (X.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, Bt++, this.notify(t);
  }
  notify(t) {
    cs();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      as();
    }
  }
}
function xi(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        xi(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const zn = /* @__PURE__ */ new WeakMap(), pt = /* @__PURE__ */ Symbol(
  ""
), Gn = /* @__PURE__ */ Symbol(
  ""
), Wt = /* @__PURE__ */ Symbol(
  ""
);
function fe(e, t, n) {
  if (Me && X) {
    let s = zn.get(e);
    s || zn.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new us()), i.map = s, i.key = n), i.track();
  }
}
function Xe(e, t, n, s, i, o) {
  const r = zn.get(e);
  if (!r) {
    Bt++;
    return;
  }
  const l = (c) => {
    c && c.trigger();
  };
  if (cs(), t === "clear")
    r.forEach(l);
  else {
    const c = $(e), p = c && rs(n);
    if (c && n === "length") {
      const u = Number(s);
      r.forEach((_, I) => {
        (I === "length" || I === Wt || !We(I) && I >= u) && l(_);
      });
    } else
      switch ((n !== void 0 || r.has(void 0)) && l(r.get(n)), p && l(r.get(Wt)), t) {
        case "add":
          c ? p && l(r.get("length")) : (l(r.get(pt)), bt(e) && l(r.get(Gn)));
          break;
        case "delete":
          c || (l(r.get(pt)), bt(e) && l(r.get(Gn)));
          break;
        case "set":
          bt(e) && l(r.get(pt));
          break;
      }
  }
  as();
}
function mt(e) {
  const t = /* @__PURE__ */ B(e);
  return t === e ? t : (fe(t, "iterate", Wt), /* @__PURE__ */ Ee(e) ? t : t.map(Oe));
}
function In(e) {
  return fe(e = /* @__PURE__ */ B(e), "iterate", Wt), e;
}
function Ue(e, t) {
  return /* @__PURE__ */ tt(e) ? Ct(/* @__PURE__ */ ht(e) ? Oe(t) : t) : Oe(t);
}
const Mo = {
  __proto__: null,
  [Symbol.iterator]() {
    return Hn(this, Symbol.iterator, (e) => Ue(this, e));
  },
  concat(...e) {
    return mt(this).concat(
      ...e.map((t) => $(t) ? mt(t) : t)
    );
  },
  entries() {
    return Hn(this, "entries", (e) => (e[1] = Ue(this, e[1]), e));
  },
  every(e, t) {
    return ze(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return ze(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ue(this, s)),
      arguments
    );
  },
  find(e, t) {
    return ze(
      this,
      "find",
      e,
      t,
      (n) => Ue(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return ze(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return ze(
      this,
      "findLast",
      e,
      t,
      (n) => Ue(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return ze(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return ze(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Nn(this, "includes", e);
  },
  indexOf(...e) {
    return Nn(this, "indexOf", e);
  },
  join(e) {
    return mt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Nn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return ze(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Mt(this, "pop");
  },
  push(...e) {
    return Mt(this, "push", e);
  },
  reduce(e, ...t) {
    return Is(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Is(this, "reduceRight", e, t);
  },
  shift() {
    return Mt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return ze(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Mt(this, "splice", e);
  },
  toReversed() {
    return mt(this).toReversed();
  },
  toSorted(e) {
    return mt(this).toSorted(e);
  },
  toSpliced(...e) {
    return mt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Mt(this, "unshift", e);
  },
  values() {
    return Hn(this, "values", (e) => Ue(this, e));
  }
};
function Hn(e, t, n) {
  const s = In(e), i = s[t]();
  return s !== e && !/* @__PURE__ */ Ee(e) && (i._next = i.next, i.next = () => {
    const o = i._next();
    return o.done || (o.value = n(o.value)), o;
  }), i;
}
const Oo = Array.prototype;
function ze(e, t, n, s, i, o) {
  const r = In(e), l = r !== e && !/* @__PURE__ */ Ee(e), c = r[t];
  if (c !== Oo[t]) {
    const _ = c.apply(e, o);
    return l ? Oe(_) : _;
  }
  let p = n;
  r !== e && (l ? p = function(_, I) {
    return n.call(this, Ue(e, _), I, e);
  } : n.length > 2 && (p = function(_, I) {
    return n.call(this, _, I, e);
  }));
  const u = c.call(r, p, s);
  return l && i ? i(u) : u;
}
function Is(e, t, n, s) {
  const i = In(e), o = i !== e && !/* @__PURE__ */ Ee(e);
  let r = n, l = !1;
  i !== e && (o ? (l = s.length === 0, r = function(p, u, _) {
    return l && (l = !1, p = Ue(e, p)), n.call(this, p, Ue(e, u), _, e);
  }) : n.length > 3 && (r = function(p, u, _) {
    return n.call(this, p, u, _, e);
  }));
  const c = i[t](r, ...s);
  return l ? Ue(e, c) : c;
}
function Nn(e, t, n) {
  const s = /* @__PURE__ */ B(e);
  fe(s, "iterate", Wt);
  const i = s[t](...n);
  return (i === -1 || i === !1) && /* @__PURE__ */ hs(n[0]) ? (n[0] = /* @__PURE__ */ B(n[0]), s[t](...n)) : i;
}
function Mt(e, t, n = []) {
  Qe(), cs();
  const s = (/* @__PURE__ */ B(e))[t].apply(e, n);
  return as(), et(), s;
}
const Po = /* @__PURE__ */ is("__proto__,__v_isRef,__isVue"), Si = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(We)
);
function Do(e) {
  We(e) || (e = String(e));
  const t = /* @__PURE__ */ B(this);
  return fe(t, "has", e), t.hasOwnProperty(e);
}
class wi {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const i = this._isReadonly, o = this._isShallow;
    if (n === "__v_isReactive")
      return !i;
    if (n === "__v_isReadonly")
      return i;
    if (n === "__v_isShallow")
      return o;
    if (n === "__v_raw")
      return s === (i ? o ? ko : Ei : o ? Ai : Ti).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const r = $(t);
    if (!i) {
      let c;
      if (r && (c = Mo[n]))
        return c;
      if (n === "hasOwnProperty")
        return Do;
    }
    const l = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ue(t) ? t : s
    );
    if ((We(n) ? Si.has(n) : Po(n)) || (i || fe(t, "get", n), o))
      return l;
    if (/* @__PURE__ */ ue(l)) {
      const c = r && rs(n) ? l : l.value;
      return i && q(c) ? /* @__PURE__ */ Xn(c) : c;
    }
    return q(l) ? i ? /* @__PURE__ */ Xn(l) : /* @__PURE__ */ qt(l) : l;
  }
}
class Ci extends wi {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, i) {
    let o = t[n];
    const r = $(t) && rs(n);
    if (!this._isShallow) {
      const p = /* @__PURE__ */ tt(o);
      if (!/* @__PURE__ */ Ee(s) && !/* @__PURE__ */ tt(s) && (o = /* @__PURE__ */ B(o), s = /* @__PURE__ */ B(s)), !r && /* @__PURE__ */ ue(o) && !/* @__PURE__ */ ue(s))
        return p || (o.value = s), !0;
    }
    const l = r ? Number(n) < t.length : W(t, n), c = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ ue(t) ? t : i
    );
    return t === /* @__PURE__ */ B(i) && (l ? ke(s, o) && Xe(t, "set", n, s) : Xe(t, "add", n, s)), c;
  }
  deleteProperty(t, n) {
    const s = W(t, n);
    t[n];
    const i = Reflect.deleteProperty(t, n);
    return i && s && Xe(t, "delete", n, void 0), i;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!We(n) || !Si.has(n)) && fe(t, "has", n), s;
  }
  ownKeys(t) {
    return fe(
      t,
      "iterate",
      $(t) ? "length" : pt
    ), Reflect.ownKeys(t);
  }
}
class $o extends wi {
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
const Fo = /* @__PURE__ */ new Ci(), jo = /* @__PURE__ */ new $o(), Ko = /* @__PURE__ */ new Ci(!0);
const Yn = (e) => e, nn = (e) => Reflect.getPrototypeOf(e);
function Vo(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, o = /* @__PURE__ */ B(i), r = bt(o), l = e === "entries" || e === Symbol.iterator && r, c = e === "keys" && r, p = i[e](...s), u = n ? Yn : t ? Ct : Oe;
    return !t && fe(
      o,
      "iterate",
      c ? Gn : pt
    ), le(
      // inheriting all iterator properties
      Object.create(p),
      {
        // iterator protocol
        next() {
          const { value: _, done: I } = p.next();
          return I ? { value: _, done: I } : {
            value: l ? [u(_[0]), u(_[1])] : u(_),
            done: I
          };
        }
      }
    );
  };
}
function sn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Ho(e, t) {
  const n = {
    get(i) {
      const o = this.__v_raw, r = /* @__PURE__ */ B(o), l = /* @__PURE__ */ B(i);
      e || (ke(i, l) && fe(r, "get", i), fe(r, "get", l));
      const { has: c } = nn(r), p = t ? Yn : e ? Ct : Oe;
      if (c.call(r, i))
        return p(o.get(i));
      if (c.call(r, l))
        return p(o.get(l));
      o !== r && o.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && fe(/* @__PURE__ */ B(i), "iterate", pt), i.size;
    },
    has(i) {
      const o = this.__v_raw, r = /* @__PURE__ */ B(o), l = /* @__PURE__ */ B(i);
      return e || (ke(i, l) && fe(r, "has", i), fe(r, "has", l)), i === l ? o.has(i) : o.has(i) || o.has(l);
    },
    forEach(i, o) {
      const r = this, l = r.__v_raw, c = /* @__PURE__ */ B(l), p = t ? Yn : e ? Ct : Oe;
      return !e && fe(c, "iterate", pt), l.forEach((u, _) => i.call(o, p(u), p(_), r));
    }
  };
  return le(
    n,
    e ? {
      add: sn("add"),
      set: sn("set"),
      delete: sn("delete"),
      clear: sn("clear")
    } : {
      add(i) {
        const o = /* @__PURE__ */ B(this), r = nn(o), l = /* @__PURE__ */ B(i), c = !t && !/* @__PURE__ */ Ee(i) && !/* @__PURE__ */ tt(i) ? l : i;
        return r.has.call(o, c) || ke(i, c) && r.has.call(o, i) || ke(l, c) && r.has.call(o, l) || (o.add(c), Xe(o, "add", c, c)), this;
      },
      set(i, o) {
        !t && !/* @__PURE__ */ Ee(o) && !/* @__PURE__ */ tt(o) && (o = /* @__PURE__ */ B(o));
        const r = /* @__PURE__ */ B(this), { has: l, get: c } = nn(r);
        let p = l.call(r, i);
        p || (i = /* @__PURE__ */ B(i), p = l.call(r, i));
        const u = c.call(r, i);
        return r.set(i, o), p ? ke(o, u) && Xe(r, "set", i, o) : Xe(r, "add", i, o), this;
      },
      delete(i) {
        const o = /* @__PURE__ */ B(this), { has: r, get: l } = nn(o);
        let c = r.call(o, i);
        c || (i = /* @__PURE__ */ B(i), c = r.call(o, i)), l && l.call(o, i);
        const p = o.delete(i);
        return c && Xe(o, "delete", i, void 0), p;
      },
      clear() {
        const i = /* @__PURE__ */ B(this), o = i.size !== 0, r = i.clear();
        return o && Xe(
          i,
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
  ].forEach((i) => {
    n[i] = Vo(i, e, t);
  }), n;
}
function ds(e, t) {
  const n = Ho(e, t);
  return (s, i, o) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    W(n, i) && i in s ? n : s,
    i,
    o
  );
}
const No = {
  get: /* @__PURE__ */ ds(!1, !1)
}, Uo = {
  get: /* @__PURE__ */ ds(!1, !0)
}, Lo = {
  get: /* @__PURE__ */ ds(!0, !1)
};
const Ti = /* @__PURE__ */ new WeakMap(), Ai = /* @__PURE__ */ new WeakMap(), Ei = /* @__PURE__ */ new WeakMap(), ko = /* @__PURE__ */ new WeakMap();
function Bo(e) {
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
function Wo(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Bo(go(e));
}
// @__NO_SIDE_EFFECTS__
function qt(e) {
  return /* @__PURE__ */ tt(e) ? e : ps(
    e,
    !1,
    Fo,
    No,
    Ti
  );
}
// @__NO_SIDE_EFFECTS__
function qo(e) {
  return ps(
    e,
    !1,
    Ko,
    Uo,
    Ai
  );
}
// @__NO_SIDE_EFFECTS__
function Xn(e) {
  return ps(
    e,
    !0,
    jo,
    Lo,
    Ei
  );
}
function ps(e, t, n, s, i) {
  if (!q(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const o = Wo(e);
  if (o === 0)
    return e;
  const r = i.get(e);
  if (r)
    return r;
  const l = new Proxy(
    e,
    o === 2 ? s : n
  );
  return i.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function ht(e) {
  return /* @__PURE__ */ tt(e) ? /* @__PURE__ */ ht(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function tt(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function Ee(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function hs(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function B(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ B(t) : e;
}
function Jo(e) {
  return !W(e, "__v_skip") && Object.isExtensible(e) && fi(e, "__v_skip", !0), e;
}
const Oe = (e) => q(e) ? /* @__PURE__ */ qt(e) : e, Ct = (e) => q(e) ? /* @__PURE__ */ Xn(e) : e;
// @__NO_SIDE_EFFECTS__
function ue(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function on(e) {
  return zo(e, !1);
}
function zo(e, t) {
  return /* @__PURE__ */ ue(e) ? e : new Go(e, t);
}
class Go {
  constructor(t, n) {
    this.dep = new us(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ B(t), this._value = n ? t : Oe(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ Ee(t) || /* @__PURE__ */ tt(t);
    t = s ? t : /* @__PURE__ */ B(t), ke(t, n) && (this._rawValue = t, this._value = s ? t : Oe(t), this.dep.trigger());
  }
}
function R(e) {
  return /* @__PURE__ */ ue(e) ? e.value : e;
}
const Yo = {
  get: (e, t, n) => t === "__v_raw" ? e : R(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return /* @__PURE__ */ ue(i) && !/* @__PURE__ */ ue(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Ii(e) {
  return /* @__PURE__ */ ht(e) ? e : new Proxy(e, Yo);
}
class Xo {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new us(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Bt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    X !== this)
      return mi(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return vi(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Zo(e, t, n = !1) {
  let s, i;
  return H(e) ? s = e : (s = e.get, i = e.set), new Xo(s, i, n);
}
const rn = {}, un = /* @__PURE__ */ new WeakMap();
let ut;
function Qo(e, t = !1, n = ut) {
  if (n) {
    let s = un.get(n);
    s || un.set(n, s = []), s.push(e);
  }
}
function er(e, t, n = z) {
  const { immediate: s, deep: i, once: o, scheduler: r, augmentJob: l, call: c } = n, p = (P) => i ? P : /* @__PURE__ */ Ee(P) || i === !1 || i === 0 ? Ze(P, 1) : Ze(P);
  let u, _, I, M, k = !1, K = !1;
  if (/* @__PURE__ */ ue(e) ? (_ = () => e.value, k = /* @__PURE__ */ Ee(e)) : /* @__PURE__ */ ht(e) ? (_ = () => p(e), k = !0) : $(e) ? (K = !0, k = e.some((P) => /* @__PURE__ */ ht(P) || /* @__PURE__ */ Ee(P)), _ = () => e.map((P) => {
    if (/* @__PURE__ */ ue(P))
      return P.value;
    if (/* @__PURE__ */ ht(P))
      return p(P);
    if (H(P))
      return c ? c(P, 2) : P();
  })) : H(e) ? t ? _ = c ? () => c(e, 2) : e : _ = () => {
    if (I) {
      Qe();
      try {
        I();
      } finally {
        et();
      }
    }
    const P = ut;
    ut = u;
    try {
      return c ? c(e, 3, [M]) : e(M);
    } finally {
      ut = P;
    }
  } : _ = Be, t && i) {
    const P = _, Z = i === !0 ? 1 / 0 : i;
    _ = () => Ze(P(), Z);
  }
  const V = Eo(), G = () => {
    u.stop(), V && V.active && os(V.effects, u);
  };
  if (o && t) {
    const P = t;
    t = (...Z) => {
      P(...Z), G();
    };
  }
  let U = K ? new Array(e.length).fill(rn) : rn;
  const F = (P) => {
    if (!(!(u.flags & 1) || !u.dirty && !P))
      if (t) {
        const Z = u.run();
        if (i || k || (K ? Z.some((de, Ce) => ke(de, U[Ce])) : ke(Z, U))) {
          I && I();
          const de = ut;
          ut = u;
          try {
            const Ce = [
              Z,
              // pass undefined as the old value when it's changed for the first time
              U === rn ? void 0 : K && U[0] === rn ? [] : U,
              M
            ];
            U = Z, c ? c(t, 3, Ce) : (
              // @ts-expect-error
              t(...Ce)
            );
          } finally {
            ut = de;
          }
        }
      } else
        u.run();
  };
  return l && l(F), u = new hi(_), u.scheduler = r ? () => r(F, !1) : F, M = (P) => Qo(P, !1, u), I = u.onStop = () => {
    const P = un.get(u);
    if (P) {
      if (c)
        c(P, 4);
      else
        for (const Z of P) Z();
      un.delete(u);
    }
  }, t ? s ? F(!0) : U = u.run() : r ? r(F.bind(null, !0), !0) : u.run(), G.pause = u.pause.bind(u), G.resume = u.resume.bind(u), G.stop = G, G;
}
function Ze(e, t = 1 / 0, n) {
  if (t <= 0 || !q(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ ue(e))
    Ze(e.value, t, n);
  else if ($(e))
    for (let s = 0; s < e.length; s++)
      Ze(e[s], t, n);
  else if (Cn(e) || bt(e))
    e.forEach((s) => {
      Ze(s, t, n);
    });
  else if (ci(e)) {
    for (const s in e)
      Ze(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && Ze(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Zt(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (i) {
    Rn(i, t, n);
  }
}
function qe(e, t, n, s) {
  if (H(e)) {
    const i = Zt(e, t, n, s);
    return i && ri(i) && i.catch((o) => {
      Rn(o, t, n);
    }), i;
  }
  if ($(e)) {
    const i = [];
    for (let o = 0; o < e.length; o++)
      i.push(qe(e[o], t, n, s));
    return i;
  }
}
function Rn(e, t, n, s = !0) {
  const i = t ? t.vnode : null, { errorHandler: o, throwUnhandledErrorInProduction: r } = t && t.appContext.config || z;
  if (t) {
    let l = t.parent;
    const c = t.proxy, p = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; l; ) {
      const u = l.ec;
      if (u) {
        for (let _ = 0; _ < u.length; _++)
          if (u[_](e, c, p) === !1)
            return;
      }
      l = l.parent;
    }
    if (o) {
      Qe(), Zt(o, null, 10, [
        e,
        c,
        p
      ]), et();
      return;
    }
  }
  tr(e, n, i, s, r);
}
function tr(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const he = [];
let Ne = -1;
const xt = [];
let it = null, _t = 0;
const Ri = /* @__PURE__ */ Promise.resolve();
let dn = null;
function Vt(e) {
  const t = dn || Ri;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function nr(e) {
  let t = Ne + 1, n = he.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = he[s], o = Jt(i);
    o < e || o === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function gs(e) {
  if (!(e.flags & 1)) {
    const t = Jt(e), n = he[he.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Jt(n) ? he.push(e) : he.splice(nr(t), 0, e), e.flags |= 1, Mi();
  }
}
function Mi() {
  dn || (dn = Ri.then(Pi));
}
function sr(e) {
  $(e) ? xt.push(...e) : it && e.id === -1 ? it.splice(_t + 1, 0, e) : e.flags & 1 || (xt.push(e), e.flags |= 1), Mi();
}
function Rs(e, t, n = Ne + 1) {
  for (; n < he.length; n++) {
    const s = he[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      he.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Oi(e) {
  if (xt.length) {
    const t = [...new Set(xt)].sort(
      (n, s) => Jt(n) - Jt(s)
    );
    if (xt.length = 0, it) {
      it.push(...t);
      return;
    }
    for (it = t, _t = 0; _t < it.length; _t++) {
      const n = it[_t];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    it = null, _t = 0;
  }
}
const Jt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Pi(e) {
  try {
    for (Ne = 0; Ne < he.length; Ne++) {
      const t = he[Ne];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Zt(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Ne < he.length; Ne++) {
      const t = he[Ne];
      t && (t.flags &= -2);
    }
    Ne = -1, he.length = 0, Oi(), dn = null, (he.length || xt.length) && Pi();
  }
}
let Ae = null, Di = null;
function pn(e) {
  const t = Ae;
  return Ae = e, Di = e && e.type.__scopeId || null, t;
}
function ir(e, t = Ae, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && mn(-1);
    const o = pn(t);
    let r;
    try {
      r = e(...i);
    } finally {
      pn(o), s._d && mn(1);
    }
    return r;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function te(e, t) {
  if (Ae === null)
    return e;
  const n = Dn(Ae), s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [o, r, l, c = z] = t[i];
    o && (H(o) && (o = {
      mounted: o,
      updated: o
    }), o.deep && Ze(r), s.push({
      dir: o,
      instance: n,
      value: r,
      oldValue: void 0,
      arg: l,
      modifiers: c
    }));
  }
  return e;
}
function at(e, t, n, s) {
  const i = e.dirs, o = t && t.dirs;
  for (let r = 0; r < i.length; r++) {
    const l = i[r];
    o && (l.oldValue = o[r].value);
    let c = l.dir[s];
    c && (Qe(), qe(c, n, 8, [
      e.el,
      l,
      e,
      t
    ]), et());
  }
}
function or(e, t) {
  if (ge) {
    let n = ge.provides;
    const s = ge.parent && ge.parent.provides;
    s === n && (n = ge.provides = Object.create(s)), n[e] = t;
  }
}
function an(e, t, n = !1) {
  const s = ol();
  if (s || St) {
    let i = St ? St._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && H(t) ? t.call(s && s.proxy) : t;
  }
}
const rr = /* @__PURE__ */ Symbol.for("v-scx"), lr = () => an(rr);
function Ht(e, t, n) {
  return $i(e, t, n);
}
function $i(e, t, n = z) {
  const { immediate: s, deep: i, flush: o, once: r } = n, l = le({}, n), c = t && s || !t && o !== "post";
  let p;
  if (Gt) {
    if (o === "sync") {
      const M = lr();
      p = M.__watcherHandles || (M.__watcherHandles = []);
    } else if (!c) {
      const M = () => {
      };
      return M.stop = Be, M.resume = Be, M.pause = Be, M;
    }
  }
  const u = ge;
  l.call = (M, k, K) => qe(M, u, k, K);
  let _ = !1;
  o === "post" ? l.scheduler = (M) => {
    _e(M, u && u.suspense);
  } : o !== "sync" && (_ = !0, l.scheduler = (M, k) => {
    k ? M() : gs(M);
  }), l.augmentJob = (M) => {
    t && (M.flags |= 4), _ && (M.flags |= 2, u && (M.id = u.uid, M.i = u));
  };
  const I = er(e, t, l);
  return Gt && (p ? p.push(I) : c && I()), I;
}
function cr(e, t, n) {
  const s = this.proxy, i = Q(e) ? e.includes(".") ? Fi(s, e) : () => s[e] : e.bind(s, s);
  let o;
  H(t) ? o = t : (o = t.handler, n = t);
  const r = Qt(this), l = $i(i, o.bind(s), n);
  return r(), l;
}
function Fi(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let i = 0; i < n.length && s; i++)
      s = s[n[i]];
    return s;
  };
}
const ar = /* @__PURE__ */ Symbol("_vte"), fr = (e) => e.__isTeleport, ur = /* @__PURE__ */ Symbol("_leaveCb");
function ms(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, ms(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
  return H(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    le({ name: e.name }, t, { setup: e })
  ) : e;
}
function ji(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Os(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const hn = /* @__PURE__ */ new WeakMap();
function Nt(e, t, n, s, i = !1) {
  if ($(e)) {
    e.forEach(
      (K, V) => Nt(
        K,
        t && ($(t) ? t[V] : t),
        n,
        s,
        i
      )
    );
    return;
  }
  if (Ut(s) && !i) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Nt(e, t, n, s.component.subTree);
    return;
  }
  const o = s.shapeFlag & 4 ? Dn(s.component) : s.el, r = i ? null : o, { i: l, r: c } = e, p = t && t.r, u = l.refs === z ? l.refs = {} : l.refs, _ = l.setupState, I = /* @__PURE__ */ B(_), M = _ === z ? oi : (K) => Os(u, K) ? !1 : W(I, K), k = (K, V) => !(V && Os(u, V));
  if (p != null && p !== c) {
    if (Ps(t), Q(p))
      u[p] = null, M(p) && (_[p] = null);
    else if (/* @__PURE__ */ ue(p)) {
      const K = t;
      k(p, K.k) && (p.value = null), K.k && (u[K.k] = null);
    }
  }
  if (H(c))
    Zt(c, l, 12, [r, u]);
  else {
    const K = Q(c), V = /* @__PURE__ */ ue(c);
    if (K || V) {
      const G = () => {
        if (e.f) {
          const U = K ? M(c) ? _[c] : u[c] : k() || !e.k ? c.value : u[e.k];
          if (i)
            $(U) && os(U, o);
          else if ($(U))
            U.includes(o) || U.push(o);
          else if (K)
            u[c] = [o], M(c) && (_[c] = u[c]);
          else {
            const F = [o];
            k(c, e.k) && (c.value = F), e.k && (u[e.k] = F);
          }
        } else K ? (u[c] = r, M(c) && (_[c] = r)) : V && (k(c, e.k) && (c.value = r), e.k && (u[e.k] = r));
      };
      if (r) {
        const U = () => {
          G(), hn.delete(e);
        };
        U.id = -1, hn.set(e, U), _e(U, n);
      } else
        Ps(e), G();
    }
  }
}
function Ps(e) {
  const t = hn.get(e);
  t && (t.flags |= 8, hn.delete(e));
}
En().requestIdleCallback;
En().cancelIdleCallback;
const Ut = (e) => !!e.type.__asyncLoader, Ki = (e) => e.type.__isKeepAlive;
function dr(e, t) {
  Vi(e, "a", t);
}
function pr(e, t) {
  Vi(e, "da", t);
}
function Vi(e, t, n = ge) {
  const s = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (Mn(t, s, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      Ki(i.parent.vnode) && hr(s, t, n, i), i = i.parent;
  }
}
function hr(e, t, n, s) {
  const i = Mn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Hi(() => {
    os(s[t], i);
  }, n);
}
function Mn(e, t, n = ge, s = !1) {
  if (n) {
    const i = n[e] || (n[e] = []), o = t.__weh || (t.__weh = (...r) => {
      Qe();
      const l = Qt(n), c = qe(t, n, e, r);
      return l(), et(), c;
    });
    return s ? i.unshift(o) : i.push(o), o;
  }
}
const nt = (e) => (t, n = ge) => {
  (!Gt || e === "sp") && Mn(e, (...s) => t(...s), n);
}, gr = nt("bm"), mr = nt("m"), _r = nt(
  "bu"
), yr = nt("u"), vr = nt(
  "bum"
), Hi = nt("um"), br = nt(
  "sp"
), xr = nt("rtg"), Sr = nt("rtc");
function wr(e, t = ge) {
  Mn("ec", e, t);
}
const Cr = /* @__PURE__ */ Symbol.for("v-ndc");
function ln(e, t, n, s) {
  let i;
  const o = n, r = $(e);
  if (r || Q(e)) {
    const l = r && /* @__PURE__ */ ht(e);
    let c = !1, p = !1;
    l && (c = !/* @__PURE__ */ Ee(e), p = /* @__PURE__ */ tt(e), e = In(e)), i = new Array(e.length);
    for (let u = 0, _ = e.length; u < _; u++)
      i[u] = t(
        c ? p ? Ct(Oe(e[u])) : Oe(e[u]) : e[u],
        u,
        void 0,
        o
      );
  } else if (typeof e == "number") {
    i = new Array(e);
    for (let l = 0; l < e; l++)
      i[l] = t(l + 1, l, void 0, o);
  } else if (q(e))
    if (e[Symbol.iterator])
      i = Array.from(
        e,
        (l, c) => t(l, c, void 0, o)
      );
    else {
      const l = Object.keys(e);
      i = new Array(l.length);
      for (let c = 0, p = l.length; c < p; c++) {
        const u = l[c];
        i[c] = t(e[u], u, c, o);
      }
    }
  else
    i = [];
  return i;
}
const Zn = (e) => e ? oo(e) ? Dn(e) : Zn(e.parent) : null, Lt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ le(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Zn(e.parent),
    $root: (e) => Zn(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Ui(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      gs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Vt.bind(e.proxy)),
    $watch: (e) => cr.bind(e)
  })
), Un = (e, t) => e !== z && !e.__isScriptSetup && W(e, t), Tr = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: i, props: o, accessCache: r, type: l, appContext: c } = e;
    if (t[0] !== "$") {
      const I = r[t];
      if (I !== void 0)
        switch (I) {
          case 1:
            return s[t];
          case 2:
            return i[t];
          case 4:
            return n[t];
          case 3:
            return o[t];
        }
      else {
        if (Un(s, t))
          return r[t] = 1, s[t];
        if (i !== z && W(i, t))
          return r[t] = 2, i[t];
        if (W(o, t))
          return r[t] = 3, o[t];
        if (n !== z && W(n, t))
          return r[t] = 4, n[t];
        Qn && (r[t] = 0);
      }
    }
    const p = Lt[t];
    let u, _;
    if (p)
      return t === "$attrs" && fe(e.attrs, "get", ""), p(e);
    if (
      // css module (injected by vue-loader)
      (u = l.__cssModules) && (u = u[t])
    )
      return u;
    if (n !== z && W(n, t))
      return r[t] = 4, n[t];
    if (
      // global properties
      _ = c.config.globalProperties, W(_, t)
    )
      return _[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: i, ctx: o } = e;
    return Un(i, t) ? (i[t] = n, !0) : s !== z && W(s, t) ? (s[t] = n, !0) : W(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (o[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, props: o, type: r }
  }, l) {
    let c;
    return !!(n[l] || e !== z && l[0] !== "$" && W(e, l) || Un(t, l) || W(o, l) || W(s, l) || W(Lt, l) || W(i.config.globalProperties, l) || (c = r.__cssModules) && c[l]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : W(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Ds(e) {
  return $(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let Qn = !0;
function Ar(e) {
  const t = Ui(e), n = e.proxy, s = e.ctx;
  Qn = !1, t.beforeCreate && $s(t.beforeCreate, e, "bc");
  const {
    // state
    data: i,
    computed: o,
    methods: r,
    watch: l,
    provide: c,
    inject: p,
    // lifecycle
    created: u,
    beforeMount: _,
    mounted: I,
    beforeUpdate: M,
    updated: k,
    activated: K,
    deactivated: V,
    beforeDestroy: G,
    beforeUnmount: U,
    destroyed: F,
    unmounted: P,
    render: Z,
    renderTracked: de,
    renderTriggered: Ce,
    errorCaptured: Pe,
    serverPrefetch: gt,
    // public API
    expose: De,
    inheritAttrs: lt,
    // assets
    components: st,
    directives: $e,
    filters: At
  } = t;
  if (p && Er(p, s, null), r)
    for (const h in r) {
      const d = r[h];
      H(d) && (s[h] = d.bind(n));
    }
  if (i) {
    const h = i.call(n, n);
    q(h) && (e.data = /* @__PURE__ */ qt(h));
  }
  if (Qn = !0, o)
    for (const h in o) {
      const d = o[h], T = H(d) ? d.bind(n, n) : H(d.get) ? d.get.bind(n, n) : Be, Je = !H(d) && H(d.set) ? d.set.bind(n) : Be, ct = yt({
        get: T,
        set: Je
      });
      Object.defineProperty(s, h, {
        enumerable: !0,
        configurable: !0,
        get: () => ct.value,
        set: (Fe) => ct.value = Fe
      });
    }
  if (l)
    for (const h in l)
      Ni(l[h], s, n, h);
  if (c) {
    const h = H(c) ? c.call(n) : c;
    Reflect.ownKeys(h).forEach((d) => {
      or(d, h[d]);
    });
  }
  u && $s(u, e, "c");
  function A(h, d) {
    $(d) ? d.forEach((T) => h(T.bind(n))) : d && h(d.bind(n));
  }
  if (A(gr, _), A(mr, I), A(_r, M), A(yr, k), A(dr, K), A(pr, V), A(wr, Pe), A(Sr, de), A(xr, Ce), A(vr, U), A(Hi, P), A(br, gt), $(De))
    if (De.length) {
      const h = e.exposed || (e.exposed = {});
      De.forEach((d) => {
        Object.defineProperty(h, d, {
          get: () => n[d],
          set: (T) => n[d] = T,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  Z && e.render === Be && (e.render = Z), lt != null && (e.inheritAttrs = lt), st && (e.components = st), $e && (e.directives = $e), gt && ji(e);
}
function Er(e, t, n = Be) {
  $(e) && (e = es(e));
  for (const s in e) {
    const i = e[s];
    let o;
    q(i) ? "default" in i ? o = an(
      i.from || s,
      i.default,
      !0
    ) : o = an(i.from || s) : o = an(i), /* @__PURE__ */ ue(o) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => o.value,
      set: (r) => o.value = r
    }) : t[s] = o;
  }
}
function $s(e, t, n) {
  qe(
    $(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Ni(e, t, n, s) {
  let i = s.includes(".") ? Fi(n, s) : () => n[s];
  if (Q(e)) {
    const o = t[e];
    H(o) && Ht(i, o);
  } else if (H(e))
    Ht(i, e.bind(n));
  else if (q(e))
    if ($(e))
      e.forEach((o) => Ni(o, t, n, s));
    else {
      const o = H(e.handler) ? e.handler.bind(n) : t[e.handler];
      H(o) && Ht(i, o, e);
    }
}
function Ui(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: i,
    optionsCache: o,
    config: { optionMergeStrategies: r }
  } = e.appContext, l = o.get(t);
  let c;
  return l ? c = l : !i.length && !n && !s ? c = t : (c = {}, i.length && i.forEach(
    (p) => gn(c, p, r, !0)
  ), gn(c, t, r)), q(t) && o.set(t, c), c;
}
function gn(e, t, n, s = !1) {
  const { mixins: i, extends: o } = t;
  o && gn(e, o, n, !0), i && i.forEach(
    (r) => gn(e, r, n, !0)
  );
  for (const r in t)
    if (!(s && r === "expose")) {
      const l = Ir[r] || n && n[r];
      e[r] = l ? l(e[r], t[r]) : t[r];
    }
  return e;
}
const Ir = {
  data: Fs,
  props: js,
  emits: js,
  // objects
  methods: Dt,
  computed: Dt,
  // lifecycle
  beforeCreate: pe,
  created: pe,
  beforeMount: pe,
  mounted: pe,
  beforeUpdate: pe,
  updated: pe,
  beforeDestroy: pe,
  beforeUnmount: pe,
  destroyed: pe,
  unmounted: pe,
  activated: pe,
  deactivated: pe,
  errorCaptured: pe,
  serverPrefetch: pe,
  // assets
  components: Dt,
  directives: Dt,
  // watch
  watch: Mr,
  // provide / inject
  provide: Fs,
  inject: Rr
};
function Fs(e, t) {
  return t ? e ? function() {
    return le(
      H(e) ? e.call(this, this) : e,
      H(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Rr(e, t) {
  return Dt(es(e), es(t));
}
function es(e) {
  if ($(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function pe(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Dt(e, t) {
  return e ? le(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function js(e, t) {
  return e ? $(e) && $(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : le(
    /* @__PURE__ */ Object.create(null),
    Ds(e),
    Ds(t ?? {})
  ) : t;
}
function Mr(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = le(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = pe(e[s], t[s]);
  return n;
}
function Li() {
  return {
    app: null,
    config: {
      isNativeTag: oi,
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
let Or = 0;
function Pr(e, t) {
  return function(s, i = null) {
    H(s) || (s = le({}, s)), i != null && !q(i) && (i = null);
    const o = Li(), r = /* @__PURE__ */ new WeakSet(), l = [];
    let c = !1;
    const p = o.app = {
      _uid: Or++,
      _component: s,
      _props: i,
      _container: null,
      _context: o,
      _instance: null,
      version: ul,
      get config() {
        return o.config;
      },
      set config(u) {
      },
      use(u, ..._) {
        return r.has(u) || (u && H(u.install) ? (r.add(u), u.install(p, ..._)) : H(u) && (r.add(u), u(p, ..._))), p;
      },
      mixin(u) {
        return o.mixins.includes(u) || o.mixins.push(u), p;
      },
      component(u, _) {
        return _ ? (o.components[u] = _, p) : o.components[u];
      },
      directive(u, _) {
        return _ ? (o.directives[u] = _, p) : o.directives[u];
      },
      mount(u, _, I) {
        if (!c) {
          const M = p._ceVNode || se(s, i);
          return M.appContext = o, I === !0 ? I = "svg" : I === !1 && (I = void 0), e(M, u, I), c = !0, p._container = u, u.__vue_app__ = p, Dn(M.component);
        }
      },
      onUnmount(u) {
        l.push(u);
      },
      unmount() {
        c && (qe(
          l,
          p._instance,
          16
        ), e(null, p._container), delete p._container.__vue_app__);
      },
      provide(u, _) {
        return o.provides[u] = _, p;
      },
      runWithContext(u) {
        const _ = St;
        St = p;
        try {
          return u();
        } finally {
          St = _;
        }
      }
    };
    return p;
  };
}
let St = null;
const Dr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Re(t)}Modifiers`] || e[`${rt(t)}Modifiers`];
function $r(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || z;
  let i = n;
  const o = t.startsWith("update:"), r = o && Dr(s, t.slice(7));
  r && (r.trim && (i = n.map((u) => Q(u) ? u.trim() : u)), r.number && (i = n.map(An)));
  let l, c = s[l = jn(t)] || // also try camelCase event handler (#2249)
  s[l = jn(Re(t))];
  !c && o && (c = s[l = jn(rt(t))]), c && qe(
    c,
    e,
    6,
    i
  );
  const p = s[l + "Once"];
  if (p) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[l])
      return;
    e.emitted[l] = !0, qe(
      p,
      e,
      6,
      i
    );
  }
}
const Fr = /* @__PURE__ */ new WeakMap();
function ki(e, t, n = !1) {
  const s = n ? Fr : t.emitsCache, i = s.get(e);
  if (i !== void 0)
    return i;
  const o = e.emits;
  let r = {}, l = !1;
  if (!H(e)) {
    const c = (p) => {
      const u = ki(p, t, !0);
      u && (l = !0, le(r, u));
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  return !o && !l ? (q(e) && s.set(e, null), null) : ($(o) ? o.forEach((c) => r[c] = null) : le(r, o), q(e) && s.set(e, r), r);
}
function On(e, t) {
  return !e || !Sn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), W(e, t[0].toLowerCase() + t.slice(1)) || W(e, rt(t)) || W(e, t));
}
function Ks(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: i,
    propsOptions: [o],
    slots: r,
    attrs: l,
    emit: c,
    render: p,
    renderCache: u,
    props: _,
    data: I,
    setupState: M,
    ctx: k,
    inheritAttrs: K
  } = e, V = pn(e);
  let G, U;
  try {
    if (n.shapeFlag & 4) {
      const P = i || s, Z = P;
      G = Le(
        p.call(
          Z,
          P,
          u,
          _,
          M,
          I,
          k
        )
      ), U = l;
    } else {
      const P = t;
      G = Le(
        P.length > 1 ? P(
          _,
          { attrs: l, slots: r, emit: c }
        ) : P(
          _,
          null
        )
      ), U = t.props ? l : jr(l);
    }
  } catch (P) {
    kt.length = 0, Rn(P, e, 1), G = se(ot);
  }
  let F = G;
  if (U && K !== !1) {
    const P = Object.keys(U), { shapeFlag: Z } = F;
    P.length && Z & 7 && (o && P.some(wn) && (U = Kr(
      U,
      o
    )), F = Tt(F, U, !1, !0));
  }
  return n.dirs && (F = Tt(F, null, !1, !0), F.dirs = F.dirs ? F.dirs.concat(n.dirs) : n.dirs), n.transition && ms(F, n.transition), G = F, pn(V), G;
}
const jr = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Sn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Kr = (e, t) => {
  const n = {};
  for (const s in e)
    (!wn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Vr(e, t, n) {
  const { props: s, children: i, component: o } = e, { props: r, children: l, patchFlag: c } = t, p = o.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && c >= 0) {
    if (c & 1024)
      return !0;
    if (c & 16)
      return s ? Vs(s, r, p) : !!r;
    if (c & 8) {
      const u = t.dynamicProps;
      for (let _ = 0; _ < u.length; _++) {
        const I = u[_];
        if (Bi(r, s, I) && !On(p, I))
          return !0;
      }
    }
  } else
    return (i || l) && (!l || !l.$stable) ? !0 : s === r ? !1 : s ? r ? Vs(s, r, p) : !0 : !!r;
  return !1;
}
function Vs(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let i = 0; i < s.length; i++) {
    const o = s[i];
    if (Bi(t, e, o) && !On(n, o))
      return !0;
  }
  return !1;
}
function Bi(e, t, n) {
  const s = e[n], i = t[n];
  return n === "style" && q(s) && q(i) ? !Xt(s, i) : s !== i;
}
function Hr({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const i = t.subTree;
    if (i.suspense && i.suspense.activeBranch === e && (i.suspense.vnode.el = i.el = s, e = i), i === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const Wi = {}, qi = () => Object.create(Wi), Ji = (e) => Object.getPrototypeOf(e) === Wi;
function Nr(e, t, n, s = !1) {
  const i = {}, o = qi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), zi(e, t, i, o);
  for (const r in e.propsOptions[0])
    r in i || (i[r] = void 0);
  n ? e.props = s ? i : /* @__PURE__ */ qo(i) : e.type.props ? e.props = i : e.props = o, e.attrs = o;
}
function Ur(e, t, n, s) {
  const {
    props: i,
    attrs: o,
    vnode: { patchFlag: r }
  } = e, l = /* @__PURE__ */ B(i), [c] = e.propsOptions;
  let p = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || r > 0) && !(r & 16)
  ) {
    if (r & 8) {
      const u = e.vnode.dynamicProps;
      for (let _ = 0; _ < u.length; _++) {
        let I = u[_];
        if (On(e.emitsOptions, I))
          continue;
        const M = t[I];
        if (c)
          if (W(o, I))
            M !== o[I] && (o[I] = M, p = !0);
          else {
            const k = Re(I);
            i[k] = ts(
              c,
              l,
              k,
              M,
              e,
              !1
            );
          }
        else
          M !== o[I] && (o[I] = M, p = !0);
      }
    }
  } else {
    zi(e, t, i, o) && (p = !0);
    let u;
    for (const _ in l)
      (!t || // for camelCase
      !W(t, _) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((u = rt(_)) === _ || !W(t, u))) && (c ? n && // for camelCase
      (n[_] !== void 0 || // for kebab-case
      n[u] !== void 0) && (i[_] = ts(
        c,
        l,
        _,
        void 0,
        e,
        !0
      )) : delete i[_]);
    if (o !== l)
      for (const _ in o)
        (!t || !W(t, _)) && (delete o[_], p = !0);
  }
  p && Xe(e.attrs, "set", "");
}
function zi(e, t, n, s) {
  const [i, o] = e.propsOptions;
  let r = !1, l;
  if (t)
    for (let c in t) {
      if (Ft(c))
        continue;
      const p = t[c];
      let u;
      i && W(i, u = Re(c)) ? !o || !o.includes(u) ? n[u] = p : (l || (l = {}))[u] = p : On(e.emitsOptions, c) || (!(c in s) || p !== s[c]) && (s[c] = p, r = !0);
    }
  if (o) {
    const c = /* @__PURE__ */ B(n), p = l || z;
    for (let u = 0; u < o.length; u++) {
      const _ = o[u];
      n[_] = ts(
        i,
        c,
        _,
        p[_],
        e,
        !W(p, _)
      );
    }
  }
  return r;
}
function ts(e, t, n, s, i, o) {
  const r = e[n];
  if (r != null) {
    const l = W(r, "default");
    if (l && s === void 0) {
      const c = r.default;
      if (r.type !== Function && !r.skipFactory && H(c)) {
        const { propsDefaults: p } = i;
        if (n in p)
          s = p[n];
        else {
          const u = Qt(i);
          s = p[n] = c.call(
            null,
            t
          ), u();
        }
      } else
        s = c;
      i.ce && i.ce._setProp(n, s);
    }
    r[
      0
      /* shouldCast */
    ] && (o && !l ? s = !1 : r[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === rt(n)) && (s = !0));
  }
  return s;
}
const Lr = /* @__PURE__ */ new WeakMap();
function Gi(e, t, n = !1) {
  const s = n ? Lr : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const o = e.props, r = {}, l = [];
  let c = !1;
  if (!H(e)) {
    const u = (_) => {
      c = !0;
      const [I, M] = Gi(_, t, !0);
      le(r, I), M && l.push(...M);
    };
    !n && t.mixins.length && t.mixins.forEach(u), e.extends && u(e.extends), e.mixins && e.mixins.forEach(u);
  }
  if (!o && !c)
    return q(e) && s.set(e, vt), vt;
  if ($(o))
    for (let u = 0; u < o.length; u++) {
      const _ = Re(o[u]);
      Hs(_) && (r[_] = z);
    }
  else if (o)
    for (const u in o) {
      const _ = Re(u);
      if (Hs(_)) {
        const I = o[u], M = r[_] = $(I) || H(I) ? { type: I } : le({}, I), k = M.type;
        let K = !1, V = !0;
        if ($(k))
          for (let G = 0; G < k.length; ++G) {
            const U = k[G], F = H(U) && U.name;
            if (F === "Boolean") {
              K = !0;
              break;
            } else F === "String" && (V = !1);
          }
        else
          K = H(k) && k.name === "Boolean";
        M[
          0
          /* shouldCast */
        ] = K, M[
          1
          /* shouldCastTrue */
        ] = V, (K || W(M, "default")) && l.push(_);
      }
    }
  const p = [r, l];
  return q(e) && s.set(e, p), p;
}
function Hs(e) {
  return e[0] !== "$" && !Ft(e);
}
const _s = (e) => e === "_" || e === "_ctx" || e === "$stable", ys = (e) => $(e) ? e.map(Le) : [Le(e)], kr = (e, t, n) => {
  if (t._n)
    return t;
  const s = ir((...i) => ys(t(...i)), n);
  return s._c = !1, s;
}, Yi = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (_s(i)) continue;
    const o = e[i];
    if (H(o))
      t[i] = kr(i, o, s);
    else if (o != null) {
      const r = ys(o);
      t[i] = () => r;
    }
  }
}, Xi = (e, t) => {
  const n = ys(t);
  e.slots.default = () => n;
}, Zi = (e, t, n) => {
  for (const s in t)
    (n || !_s(s)) && (e[s] = t[s]);
}, Br = (e, t, n) => {
  const s = e.slots = qi();
  if (e.vnode.shapeFlag & 32) {
    const i = t._;
    i ? (Zi(s, t, n), n && fi(s, "_", i, !0)) : Yi(t, s);
  } else t && Xi(e, t);
}, Wr = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let o = !0, r = z;
  if (s.shapeFlag & 32) {
    const l = t._;
    l ? n && l === 1 ? o = !1 : Zi(i, t, n) : (o = !t.$stable, Yi(t, i)), r = t;
  } else t && (Xi(e, t), r = { default: 1 });
  if (o)
    for (const l in i)
      !_s(l) && r[l] == null && delete i[l];
}, _e = Yr;
function qr(e) {
  return Jr(e);
}
function Jr(e, t) {
  const n = En();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: i,
    patchProp: o,
    createElement: r,
    createText: l,
    createComment: c,
    setText: p,
    setElementText: u,
    parentNode: _,
    nextSibling: I,
    setScopeId: M = Be,
    insertStaticContent: k
  } = e, K = (a, f, m, x = null, y = null, v = null, C = void 0, w = null, S = !!f.dynamicChildren) => {
    if (a === f)
      return;
    a && !Ot(a, f) && (x = tn(a), Fe(a, y, v, !0), a = null), f.patchFlag === -2 && (S = !1, f.dynamicChildren = null);
    const { type: b, ref: D, shapeFlag: E } = f;
    switch (b) {
      case Pn:
        V(a, f, m, x);
        break;
      case ot:
        G(a, f, m, x);
        break;
      case kn:
        a == null && U(f, m, x, C);
        break;
      case Se:
        st(
          a,
          f,
          m,
          x,
          y,
          v,
          C,
          w,
          S
        );
        break;
      default:
        E & 1 ? Z(
          a,
          f,
          m,
          x,
          y,
          v,
          C,
          w,
          S
        ) : E & 6 ? $e(
          a,
          f,
          m,
          x,
          y,
          v,
          C,
          w,
          S
        ) : (E & 64 || E & 128) && b.process(
          a,
          f,
          m,
          x,
          y,
          v,
          C,
          w,
          S,
          It
        );
    }
    D != null && y ? Nt(D, a && a.ref, v, f || a, !f) : D == null && a && a.ref != null && Nt(a.ref, null, v, a, !0);
  }, V = (a, f, m, x) => {
    if (a == null)
      s(
        f.el = l(f.children),
        m,
        x
      );
    else {
      const y = f.el = a.el;
      f.children !== a.children && p(y, f.children);
    }
  }, G = (a, f, m, x) => {
    a == null ? s(
      f.el = c(f.children || ""),
      m,
      x
    ) : f.el = a.el;
  }, U = (a, f, m, x) => {
    [a.el, a.anchor] = k(
      a.children,
      f,
      m,
      x,
      a.el,
      a.anchor
    );
  }, F = ({ el: a, anchor: f }, m, x) => {
    let y;
    for (; a && a !== f; )
      y = I(a), s(a, m, x), a = y;
    s(f, m, x);
  }, P = ({ el: a, anchor: f }) => {
    let m;
    for (; a && a !== f; )
      m = I(a), i(a), a = m;
    i(f);
  }, Z = (a, f, m, x, y, v, C, w, S) => {
    if (f.type === "svg" ? C = "svg" : f.type === "math" && (C = "mathml"), a == null)
      de(
        f,
        m,
        x,
        y,
        v,
        C,
        w,
        S
      );
    else {
      const b = a.el && a.el._isVueCE ? a.el : null;
      try {
        b && b._beginPatch(), gt(
          a,
          f,
          y,
          v,
          C,
          w,
          S
        );
      } finally {
        b && b._endPatch();
      }
    }
  }, de = (a, f, m, x, y, v, C, w) => {
    let S, b;
    const { props: D, shapeFlag: E, transition: O, dirs: j } = a;
    if (S = a.el = r(
      a.type,
      v,
      D && D.is,
      D
    ), E & 8 ? u(S, a.children) : E & 16 && Pe(
      a.children,
      S,
      null,
      x,
      y,
      Ln(a, v),
      C,
      w
    ), j && at(a, null, x, "created"), Ce(S, a, a.scopeId, C, x), D) {
      for (const J in D)
        J !== "value" && !Ft(J) && o(S, J, null, D[J], v, x);
      "value" in D && o(S, "value", null, D.value, v), (b = D.onVnodeBeforeMount) && He(b, x, a);
    }
    j && at(a, null, x, "beforeMount");
    const L = zr(y, O);
    L && O.beforeEnter(S), s(S, f, m), ((b = D && D.onVnodeMounted) || L || j) && _e(() => {
      try {
        b && He(b, x, a), L && O.enter(S), j && at(a, null, x, "mounted");
      } finally {
      }
    }, y);
  }, Ce = (a, f, m, x, y) => {
    if (m && M(a, m), x)
      for (let v = 0; v < x.length; v++)
        M(a, x[v]);
    if (y) {
      let v = y.subTree;
      if (f === v || no(v.type) && (v.ssContent === f || v.ssFallback === f)) {
        const C = y.vnode;
        Ce(
          a,
          C,
          C.scopeId,
          C.slotScopeIds,
          y.parent
        );
      }
    }
  }, Pe = (a, f, m, x, y, v, C, w, S = 0) => {
    for (let b = S; b < a.length; b++) {
      const D = a[b] = w ? Ye(a[b]) : Le(a[b]);
      K(
        null,
        D,
        f,
        m,
        x,
        y,
        v,
        C,
        w
      );
    }
  }, gt = (a, f, m, x, y, v, C) => {
    const w = f.el = a.el;
    let { patchFlag: S, dynamicChildren: b, dirs: D } = f;
    S |= a.patchFlag & 16;
    const E = a.props || z, O = f.props || z;
    let j;
    if (m && ft(m, !1), (j = O.onVnodeBeforeUpdate) && He(j, m, f, a), D && at(f, a, m, "beforeUpdate"), m && ft(m, !0), (E.innerHTML && O.innerHTML == null || E.textContent && O.textContent == null) && u(w, ""), b ? De(
      a.dynamicChildren,
      b,
      w,
      m,
      x,
      Ln(f, y),
      v
    ) : C || d(
      a,
      f,
      w,
      null,
      m,
      x,
      Ln(f, y),
      v,
      !1
    ), S > 0) {
      if (S & 16)
        lt(w, E, O, m, y);
      else if (S & 2 && E.class !== O.class && o(w, "class", null, O.class, y), S & 4 && o(w, "style", E.style, O.style, y), S & 8) {
        const L = f.dynamicProps;
        for (let J = 0; J < L.length; J++) {
          const Y = L[J], ee = E[Y], ie = O[Y];
          (ie !== ee || Y === "value") && o(w, Y, ee, ie, y, m);
        }
      }
      S & 1 && a.children !== f.children && u(w, f.children);
    } else !C && b == null && lt(w, E, O, m, y);
    ((j = O.onVnodeUpdated) || D) && _e(() => {
      j && He(j, m, f, a), D && at(f, a, m, "updated");
    }, x);
  }, De = (a, f, m, x, y, v, C) => {
    for (let w = 0; w < f.length; w++) {
      const S = a[w], b = f[w], D = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        S.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (S.type === Se || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Ot(S, b) || // - In the case of a component, it could contain anything.
        S.shapeFlag & 198) ? _(S.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          m
        )
      );
      K(
        S,
        b,
        D,
        null,
        x,
        y,
        v,
        C,
        !0
      );
    }
  }, lt = (a, f, m, x, y) => {
    if (f !== m) {
      if (f !== z)
        for (const v in f)
          !Ft(v) && !(v in m) && o(
            a,
            v,
            f[v],
            null,
            y,
            x
          );
      for (const v in m) {
        if (Ft(v)) continue;
        const C = m[v], w = f[v];
        C !== w && v !== "value" && o(a, v, w, C, y, x);
      }
      "value" in m && o(a, "value", f.value, m.value, y);
    }
  }, st = (a, f, m, x, y, v, C, w, S) => {
    const b = f.el = a ? a.el : l(""), D = f.anchor = a ? a.anchor : l("");
    let { patchFlag: E, dynamicChildren: O, slotScopeIds: j } = f;
    j && (w = w ? w.concat(j) : j), a == null ? (s(b, m, x), s(D, m, x), Pe(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      f.children || [],
      m,
      D,
      y,
      v,
      C,
      w,
      S
    )) : E > 0 && E & 64 && O && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    a.dynamicChildren && a.dynamicChildren.length === O.length ? (De(
      a.dynamicChildren,
      O,
      m,
      y,
      v,
      C,
      w
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (f.key != null || y && f === y.subTree) && Qi(
      a,
      f,
      !0
      /* shallow */
    )) : d(
      a,
      f,
      m,
      D,
      y,
      v,
      C,
      w,
      S
    );
  }, $e = (a, f, m, x, y, v, C, w, S) => {
    f.slotScopeIds = w, a == null ? f.shapeFlag & 512 ? y.ctx.activate(
      f,
      m,
      x,
      C,
      S
    ) : At(
      f,
      m,
      x,
      y,
      v,
      C,
      S
    ) : en(a, f, S);
  }, At = (a, f, m, x, y, v, C) => {
    const w = a.component = il(
      a,
      x,
      y
    );
    if (Ki(a) && (w.ctx.renderer = It), rl(w, !1, C), w.asyncDep) {
      if (y && y.registerDep(w, A, C), !a.el) {
        const S = w.subTree = se(ot);
        G(null, S, f, m), a.placeholder = S.el;
      }
    } else
      A(
        w,
        a,
        f,
        m,
        y,
        v,
        C
      );
  }, en = (a, f, m) => {
    const x = f.component = a.component;
    if (Vr(a, f, m))
      if (x.asyncDep && !x.asyncResolved) {
        h(x, f, m);
        return;
      } else
        x.next = f, x.update();
    else
      f.el = a.el, x.vnode = f;
  }, A = (a, f, m, x, y, v, C) => {
    const w = () => {
      if (a.isMounted) {
        let { next: E, bu: O, u: j, parent: L, vnode: J } = a;
        {
          const Ke = eo(a);
          if (Ke) {
            E && (E.el = J.el, h(a, E, C)), Ke.asyncDep.then(() => {
              _e(() => {
                a.isUnmounted || b();
              }, y);
            });
            return;
          }
        }
        let Y = E, ee;
        ft(a, !1), E ? (E.el = J.el, h(a, E, C)) : E = J, O && cn(O), (ee = E.props && E.props.onVnodeBeforeUpdate) && He(ee, L, E, J), ft(a, !0);
        const ie = Ks(a), je = a.subTree;
        a.subTree = ie, K(
          je,
          ie,
          // parent may have changed if it's in a teleport
          _(je.el),
          // anchor may have changed if it's in a fragment
          tn(je),
          a,
          y,
          v
        ), E.el = ie.el, Y === null && Hr(a, ie.el), j && _e(j, y), (ee = E.props && E.props.onVnodeUpdated) && _e(
          () => He(ee, L, E, J),
          y
        );
      } else {
        let E;
        const { el: O, props: j } = f, { bm: L, m: J, parent: Y, root: ee, type: ie } = a, je = Ut(f);
        ft(a, !1), L && cn(L), !je && (E = j && j.onVnodeBeforeMount) && He(E, Y, f), ft(a, !0);
        {
          ee.ce && ee.ce._hasShadowRoot() && ee.ce._injectChildStyle(
            ie,
            a.parent ? a.parent.type : void 0
          );
          const Ke = a.subTree = Ks(a);
          K(
            null,
            Ke,
            m,
            x,
            a,
            y,
            v
          ), f.el = Ke.el;
        }
        if (J && _e(J, y), !je && (E = j && j.onVnodeMounted)) {
          const Ke = f;
          _e(
            () => He(E, Y, Ke),
            y
          );
        }
        (f.shapeFlag & 256 || Y && Ut(Y.vnode) && Y.vnode.shapeFlag & 256) && a.a && _e(a.a, y), a.isMounted = !0, f = m = x = null;
      }
    };
    a.scope.on();
    const S = a.effect = new hi(w);
    a.scope.off();
    const b = a.update = S.run.bind(S), D = a.job = S.runIfDirty.bind(S);
    D.i = a, D.id = a.uid, S.scheduler = () => gs(D), ft(a, !0), b();
  }, h = (a, f, m) => {
    f.component = a;
    const x = a.vnode.props;
    a.vnode = f, a.next = null, Ur(a, f.props, x, m), Wr(a, f.children, m), Qe(), Rs(a), et();
  }, d = (a, f, m, x, y, v, C, w, S = !1) => {
    const b = a && a.children, D = a ? a.shapeFlag : 0, E = f.children, { patchFlag: O, shapeFlag: j } = f;
    if (O > 0) {
      if (O & 128) {
        Je(
          b,
          E,
          m,
          x,
          y,
          v,
          C,
          w,
          S
        );
        return;
      } else if (O & 256) {
        T(
          b,
          E,
          m,
          x,
          y,
          v,
          C,
          w,
          S
        );
        return;
      }
    }
    j & 8 ? (D & 16 && Et(b, y, v), E !== b && u(m, E)) : D & 16 ? j & 16 ? Je(
      b,
      E,
      m,
      x,
      y,
      v,
      C,
      w,
      S
    ) : Et(b, y, v, !0) : (D & 8 && u(m, ""), j & 16 && Pe(
      E,
      m,
      x,
      y,
      v,
      C,
      w,
      S
    ));
  }, T = (a, f, m, x, y, v, C, w, S) => {
    a = a || vt, f = f || vt;
    const b = a.length, D = f.length, E = Math.min(b, D);
    let O;
    for (O = 0; O < E; O++) {
      const j = f[O] = S ? Ye(f[O]) : Le(f[O]);
      K(
        a[O],
        j,
        m,
        null,
        y,
        v,
        C,
        w,
        S
      );
    }
    b > D ? Et(
      a,
      y,
      v,
      !0,
      !1,
      E
    ) : Pe(
      f,
      m,
      x,
      y,
      v,
      C,
      w,
      S,
      E
    );
  }, Je = (a, f, m, x, y, v, C, w, S) => {
    let b = 0;
    const D = f.length;
    let E = a.length - 1, O = D - 1;
    for (; b <= E && b <= O; ) {
      const j = a[b], L = f[b] = S ? Ye(f[b]) : Le(f[b]);
      if (Ot(j, L))
        K(
          j,
          L,
          m,
          null,
          y,
          v,
          C,
          w,
          S
        );
      else
        break;
      b++;
    }
    for (; b <= E && b <= O; ) {
      const j = a[E], L = f[O] = S ? Ye(f[O]) : Le(f[O]);
      if (Ot(j, L))
        K(
          j,
          L,
          m,
          null,
          y,
          v,
          C,
          w,
          S
        );
      else
        break;
      E--, O--;
    }
    if (b > E) {
      if (b <= O) {
        const j = O + 1, L = j < D ? f[j].el : x;
        for (; b <= O; )
          K(
            null,
            f[b] = S ? Ye(f[b]) : Le(f[b]),
            m,
            L,
            y,
            v,
            C,
            w,
            S
          ), b++;
      }
    } else if (b > O)
      for (; b <= E; )
        Fe(a[b], y, v, !0), b++;
    else {
      const j = b, L = b, J = /* @__PURE__ */ new Map();
      for (b = L; b <= O; b++) {
        const ve = f[b] = S ? Ye(f[b]) : Le(f[b]);
        ve.key != null && J.set(ve.key, b);
      }
      let Y, ee = 0;
      const ie = O - L + 1;
      let je = !1, Ke = 0;
      const Rt = new Array(ie);
      for (b = 0; b < ie; b++) Rt[b] = 0;
      for (b = j; b <= E; b++) {
        const ve = a[b];
        if (ee >= ie) {
          Fe(ve, y, v, !0);
          continue;
        }
        let Ve;
        if (ve.key != null)
          Ve = J.get(ve.key);
        else
          for (Y = L; Y <= O; Y++)
            if (Rt[Y - L] === 0 && Ot(ve, f[Y])) {
              Ve = Y;
              break;
            }
        Ve === void 0 ? Fe(ve, y, v, !0) : (Rt[Ve - L] = b + 1, Ve >= Ke ? Ke = Ve : je = !0, K(
          ve,
          f[Ve],
          m,
          null,
          y,
          v,
          C,
          w,
          S
        ), ee++);
      }
      const Ss = je ? Gr(Rt) : vt;
      for (Y = Ss.length - 1, b = ie - 1; b >= 0; b--) {
        const ve = L + b, Ve = f[ve], ws = f[ve + 1], Cs = ve + 1 < D ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          ws.el || to(ws)
        ) : x;
        Rt[b] === 0 ? K(
          null,
          Ve,
          m,
          Cs,
          y,
          v,
          C,
          w,
          S
        ) : je && (Y < 0 || b !== Ss[Y] ? ct(Ve, m, Cs, 2) : Y--);
      }
    }
  }, ct = (a, f, m, x, y = null) => {
    const { el: v, type: C, transition: w, children: S, shapeFlag: b } = a;
    if (b & 6) {
      ct(a.component.subTree, f, m, x);
      return;
    }
    if (b & 128) {
      a.suspense.move(f, m, x);
      return;
    }
    if (b & 64) {
      C.move(a, f, m, It);
      return;
    }
    if (C === Se) {
      s(v, f, m);
      for (let E = 0; E < S.length; E++)
        ct(S[E], f, m, x);
      s(a.anchor, f, m);
      return;
    }
    if (C === kn) {
      F(a, f, m);
      return;
    }
    if (x !== 2 && b & 1 && w)
      if (x === 0)
        w.beforeEnter(v), s(v, f, m), _e(() => w.enter(v), y);
      else {
        const { leave: E, delayLeave: O, afterLeave: j } = w, L = () => {
          a.ctx.isUnmounted ? i(v) : s(v, f, m);
        }, J = () => {
          v._isLeaving && v[ur](
            !0
            /* cancelled */
          ), E(v, () => {
            L(), j && j();
          });
        };
        O ? O(v, L, J) : J();
      }
    else
      s(v, f, m);
  }, Fe = (a, f, m, x = !1, y = !1) => {
    const {
      type: v,
      props: C,
      ref: w,
      children: S,
      dynamicChildren: b,
      shapeFlag: D,
      patchFlag: E,
      dirs: O,
      cacheIndex: j,
      memo: L
    } = a;
    if (E === -2 && (y = !1), w != null && (Qe(), Nt(w, null, m, a, !0), et()), j != null && (f.renderCache[j] = void 0), D & 256) {
      f.ctx.deactivate(a);
      return;
    }
    const J = D & 1 && O, Y = !Ut(a);
    let ee;
    if (Y && (ee = C && C.onVnodeBeforeUnmount) && He(ee, f, a), D & 6)
      po(a.component, m, x);
    else {
      if (D & 128) {
        a.suspense.unmount(m, x);
        return;
      }
      J && at(a, null, f, "beforeUnmount"), D & 64 ? a.type.remove(
        a,
        f,
        m,
        It,
        x
      ) : b && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !b.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (v !== Se || E > 0 && E & 64) ? Et(
        b,
        f,
        m,
        !1,
        !0
      ) : (v === Se && E & 384 || !y && D & 16) && Et(S, f, m), x && bs(a);
    }
    const ie = L != null && j == null;
    (Y && (ee = C && C.onVnodeUnmounted) || J || ie) && _e(() => {
      ee && He(ee, f, a), J && at(a, null, f, "unmounted"), ie && (a.el = null);
    }, m);
  }, bs = (a) => {
    const { type: f, el: m, anchor: x, transition: y } = a;
    if (f === Se) {
      uo(m, x);
      return;
    }
    if (f === kn) {
      P(a);
      return;
    }
    const v = () => {
      i(m), y && !y.persisted && y.afterLeave && y.afterLeave();
    };
    if (a.shapeFlag & 1 && y && !y.persisted) {
      const { leave: C, delayLeave: w } = y, S = () => C(m, v);
      w ? w(a.el, v, S) : S();
    } else
      v();
  }, uo = (a, f) => {
    let m;
    for (; a !== f; )
      m = I(a), i(a), a = m;
    i(f);
  }, po = (a, f, m) => {
    const { bum: x, scope: y, job: v, subTree: C, um: w, m: S, a: b } = a;
    Ns(S), Ns(b), x && cn(x), y.stop(), v && (v.flags |= 8, Fe(C, a, f, m)), w && _e(w, f), _e(() => {
      a.isUnmounted = !0;
    }, f);
  }, Et = (a, f, m, x = !1, y = !1, v = 0) => {
    for (let C = v; C < a.length; C++)
      Fe(a[C], f, m, x, y);
  }, tn = (a) => {
    if (a.shapeFlag & 6)
      return tn(a.component.subTree);
    if (a.shapeFlag & 128)
      return a.suspense.next();
    const f = I(a.anchor || a.el), m = f && f[ar];
    return m ? I(m) : f;
  };
  let Fn = !1;
  const xs = (a, f, m) => {
    let x;
    a == null ? f._vnode && (Fe(f._vnode, null, null, !0), x = f._vnode.component) : K(
      f._vnode || null,
      a,
      f,
      null,
      null,
      null,
      m
    ), f._vnode = a, Fn || (Fn = !0, Rs(x), Oi(), Fn = !1);
  }, It = {
    p: K,
    um: Fe,
    m: ct,
    r: bs,
    mt: At,
    mc: Pe,
    pc: d,
    pbc: De,
    n: tn,
    o: e
  };
  return {
    render: xs,
    hydrate: void 0,
    createApp: Pr(xs)
  };
}
function Ln({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function ft({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function zr(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Qi(e, t, n = !1) {
  const s = e.children, i = t.children;
  if ($(s) && $(i))
    for (let o = 0; o < s.length; o++) {
      const r = s[o];
      let l = i[o];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = i[o] = Ye(i[o]), l.el = r.el), !n && l.patchFlag !== -2 && Qi(r, l)), l.type === Pn && (l.patchFlag === -1 && (l = i[o] = Ye(l)), l.el = r.el), l.type === ot && !l.el && (l.el = r.el);
    }
}
function Gr(e) {
  const t = e.slice(), n = [0];
  let s, i, o, r, l;
  const c = e.length;
  for (s = 0; s < c; s++) {
    const p = e[s];
    if (p !== 0) {
      if (i = n[n.length - 1], e[i] < p) {
        t[s] = i, n.push(s);
        continue;
      }
      for (o = 0, r = n.length - 1; o < r; )
        l = o + r >> 1, e[n[l]] < p ? o = l + 1 : r = l;
      p < e[n[o]] && (o > 0 && (t[s] = n[o - 1]), n[o] = s);
    }
  }
  for (o = n.length, r = n[o - 1]; o-- > 0; )
    n[o] = r, r = t[r];
  return n;
}
function eo(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : eo(t);
}
function Ns(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function to(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? to(t.subTree) : null;
}
const no = (e) => e.__isSuspense;
function Yr(e, t) {
  t && t.pendingBranch ? $(e) ? t.effects.push(...e) : t.effects.push(e) : sr(e);
}
const Se = /* @__PURE__ */ Symbol.for("v-fgt"), Pn = /* @__PURE__ */ Symbol.for("v-txt"), ot = /* @__PURE__ */ Symbol.for("v-cmt"), kn = /* @__PURE__ */ Symbol.for("v-stc"), kt = [];
let we = null;
function be(e = !1) {
  kt.push(we = e ? null : []);
}
function Xr() {
  kt.pop(), we = kt[kt.length - 1] || null;
}
let zt = 1;
function mn(e, t = !1) {
  zt += e, e < 0 && we && t && (we.hasOnce = !0);
}
function so(e) {
  return e.dynamicChildren = zt > 0 ? we || vt : null, Xr(), zt > 0 && we && we.push(e), e;
}
function Te(e, t, n, s, i, o) {
  return so(
    g(
      e,
      t,
      n,
      s,
      i,
      o,
      !0
    )
  );
}
function Zr(e, t, n, s, i) {
  return so(
    se(
      e,
      t,
      n,
      s,
      i,
      !0
    )
  );
}
function _n(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Ot(e, t) {
  return e.type === t.type && e.key === t.key;
}
const io = ({ key: e }) => e ?? null, fn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? Q(e) || /* @__PURE__ */ ue(e) || H(e) ? { i: Ae, r: e, k: t, f: !!n } : e : null);
function g(e, t = null, n = null, s = 0, i = null, o = e === Se ? 0 : 1, r = !1, l = !1) {
  const c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && io(t),
    ref: t && fn(t),
    scopeId: Di,
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
    shapeFlag: o,
    patchFlag: s,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: Ae
  };
  return l ? (vs(c, n), o & 128 && e.normalize(c)) : n && (c.shapeFlag |= Q(n) ? 8 : 16), zt > 0 && // avoid a block node from tracking itself
  !r && // has current parent block
  we && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (c.patchFlag > 0 || o & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  c.patchFlag !== 32 && we.push(c), c;
}
const se = Qr;
function Qr(e, t = null, n = null, s = 0, i = null, o = !1) {
  if ((!e || e === Cr) && (e = ot), _n(e)) {
    const l = Tt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && vs(l, n), zt > 0 && !o && we && (l.shapeFlag & 6 ? we[we.indexOf(e)] = l : we.push(l)), l.patchFlag = -2, l;
  }
  if (fl(e) && (e = e.__vccOpts), t) {
    t = el(t);
    let { class: l, style: c } = t;
    l && !Q(l) && (t.class = ye(l)), q(c) && (/* @__PURE__ */ hs(c) && !$(c) && (c = le({}, c)), t.style = ls(c));
  }
  const r = Q(e) ? 1 : no(e) ? 128 : fr(e) ? 64 : q(e) ? 4 : H(e) ? 2 : 0;
  return g(
    e,
    t,
    n,
    s,
    i,
    r,
    o,
    !0
  );
}
function el(e) {
  return e ? /* @__PURE__ */ hs(e) || Ji(e) ? le({}, e) : e : null;
}
function Tt(e, t, n = !1, s = !1) {
  const { props: i, ref: o, patchFlag: r, children: l, transition: c } = e, p = t ? tl(i || {}, t) : i, u = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: p,
    key: p && io(p),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && o ? $(o) ? o.concat(fn(t)) : [o, fn(t)] : fn(t)
    ) : o,
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
    patchFlag: t && e.type !== Se ? r === -1 ? 16 : r | 16 : r,
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
    ssContent: e.ssContent && Tt(e.ssContent),
    ssFallback: e.ssFallback && Tt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return c && s && ms(
    u,
    c.clone(u)
  ), u;
}
function ae(e = " ", t = 0) {
  return se(Pn, null, e, t);
}
function Bn(e = "", t = !1) {
  return t ? (be(), Zr(ot, null, e)) : se(ot, null, e);
}
function Le(e) {
  return e == null || typeof e == "boolean" ? se(ot) : $(e) ? se(
    Se,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : _n(e) ? Ye(e) : se(Pn, null, String(e));
}
function Ye(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Tt(e);
}
function vs(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if ($(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), vs(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !Ji(t) ? t._ctx = Ae : i === 3 && Ae && (Ae.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else H(t) ? (t = { default: t, _ctx: Ae }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [ae(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function tl(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = ye([t.class, s.class]));
      else if (i === "style")
        t.style = ls([t.style, s.style]);
      else if (Sn(i)) {
        const o = t[i], r = s[i];
        r && o !== r && !($(o) && o.includes(r)) ? t[i] = o ? [].concat(o, r) : r : r == null && o == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !wn(i) && (t[i] = r);
      } else i !== "" && (t[i] = s[i]);
  }
  return t;
}
function He(e, t, n, s = null) {
  qe(e, t, 7, [
    n,
    s
  ]);
}
const nl = Li();
let sl = 0;
function il(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || nl, o = {
    uid: sl++,
    vnode: e,
    type: s,
    parent: t,
    appContext: i,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Ao(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(i.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Gi(s, i),
    emitsOptions: ki(s, i),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: z,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: z,
    data: z,
    props: z,
    attrs: z,
    slots: z,
    refs: z,
    setupState: z,
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
  return o.ctx = { _: o }, o.root = t ? t.root : o, o.emit = $r.bind(null, o), e.ce && e.ce(o), o;
}
let ge = null;
const ol = () => ge || Ae;
let yn, ns;
{
  const e = En(), t = (n, s) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(s), (o) => {
      i.length > 1 ? i.forEach((r) => r(o)) : i[0](o);
    };
  };
  yn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ge = n
  ), ns = t(
    "__VUE_SSR_SETTERS__",
    (n) => Gt = n
  );
}
const Qt = (e) => {
  const t = ge;
  return yn(e), e.scope.on(), () => {
    e.scope.off(), yn(t);
  };
}, Us = () => {
  ge && ge.scope.off(), yn(null);
};
function oo(e) {
  return e.vnode.shapeFlag & 4;
}
let Gt = !1;
function rl(e, t = !1, n = !1) {
  t && ns(t);
  const { props: s, children: i } = e.vnode, o = oo(e);
  Nr(e, s, o, t), Br(e, i, n || t);
  const r = o ? ll(e, t) : void 0;
  return t && ns(!1), r;
}
function ll(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Tr);
  const { setup: s } = n;
  if (s) {
    Qe();
    const i = e.setupContext = s.length > 1 ? al(e) : null, o = Qt(e), r = Zt(
      s,
      e,
      0,
      [
        e.props,
        i
      ]
    ), l = ri(r);
    if (et(), o(), (l || e.sp) && !Ut(e) && ji(e), l) {
      if (r.then(Us, Us), t)
        return r.then((c) => {
          Ls(e, c);
        }).catch((c) => {
          Rn(c, e, 0);
        });
      e.asyncDep = r;
    } else
      Ls(e, r);
  } else
    ro(e);
}
function Ls(e, t, n) {
  H(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : q(t) && (e.setupState = Ii(t)), ro(e);
}
function ro(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Be);
  {
    const i = Qt(e);
    Qe();
    try {
      Ar(e);
    } finally {
      et(), i();
    }
  }
}
const cl = {
  get(e, t) {
    return fe(e, "get", ""), e[t];
  }
};
function al(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, cl),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Dn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Ii(Jo(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Lt)
        return Lt[n](e);
    },
    has(t, n) {
      return n in t || n in Lt;
    }
  })) : e.proxy;
}
function fl(e) {
  return H(e) && "__vccOpts" in e;
}
const yt = (e, t) => /* @__PURE__ */ Zo(e, t, Gt);
function ne(e, t, n) {
  try {
    mn(-1);
    const s = arguments.length;
    return s === 2 ? q(t) && !$(t) ? _n(t) ? se(e, null, [t]) : se(e, t) : se(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && _n(n) && (n = [n]), se(e, t, n));
  } finally {
    mn(1);
  }
}
const ul = "3.5.34";
/**
* @vue/runtime-dom v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ss;
const ks = typeof window < "u" && window.trustedTypes;
if (ks)
  try {
    ss = /* @__PURE__ */ ks.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const lo = ss ? (e) => ss.createHTML(e) : (e) => e, dl = "http://www.w3.org/2000/svg", pl = "http://www.w3.org/1998/Math/MathML", Ge = typeof document < "u" ? document : null, Bs = Ge && /* @__PURE__ */ Ge.createElement("template"), hl = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? Ge.createElementNS(dl, e) : t === "mathml" ? Ge.createElementNS(pl, e) : n ? Ge.createElement(e, { is: n }) : Ge.createElement(e);
    return e === "select" && s && s.multiple != null && i.setAttribute("multiple", s.multiple), i;
  },
  createText: (e) => Ge.createTextNode(e),
  createComment: (e) => Ge.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ge.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, i, o) {
    const r = n ? n.previousSibling : t.lastChild;
    if (i && (i === o || i.nextSibling))
      for (; t.insertBefore(i.cloneNode(!0), n), !(i === o || !(i = i.nextSibling)); )
        ;
    else {
      Bs.innerHTML = lo(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const l = Bs.content;
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
      r ? r.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, gl = /* @__PURE__ */ Symbol("_vtc");
function ml(e, t, n) {
  const s = e[gl];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const vn = /* @__PURE__ */ Symbol("_vod"), co = /* @__PURE__ */ Symbol("_vsh"), Ws = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[vn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Pt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Pt(e, !0), s.enter(e)) : s.leave(e, () => {
      Pt(e, !1);
    }) : Pt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Pt(e, t);
  }
};
function Pt(e, t) {
  e.style.display = t ? e[vn] : "none", e[co] = !t;
}
const _l = /* @__PURE__ */ Symbol(""), yl = /(?:^|;)\s*display\s*:/;
function vl(e, t, n) {
  const s = e.style, i = Q(n);
  let o = !1;
  if (n && !i) {
    if (t)
      if (Q(t))
        for (const r of t.split(";")) {
          const l = r.slice(0, r.indexOf(":")).trim();
          n[l] == null && $t(s, l, "");
        }
      else
        for (const r in t)
          n[r] == null && $t(s, r, "");
    for (const r in n) {
      r === "display" && (o = !0);
      const l = n[r];
      l != null ? xl(
        e,
        r,
        !Q(t) && t ? t[r] : void 0,
        l
      ) || $t(s, r, l) : $t(s, r, "");
    }
  } else if (i) {
    if (t !== n) {
      const r = s[_l];
      r && (n += ";" + r), s.cssText = n, o = yl.test(n);
    }
  } else t && e.removeAttribute("style");
  vn in e && (e[vn] = o ? s.display : "", e[co] && (s.display = "none"));
}
const qs = /\s*!important$/;
function $t(e, t, n) {
  if ($(n))
    n.forEach((s) => $t(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = bl(e, t);
    qs.test(n) ? e.setProperty(
      rt(s),
      n.replace(qs, ""),
      "important"
    ) : e[s] = n;
  }
}
const Js = ["Webkit", "Moz", "ms"], Wn = {};
function bl(e, t) {
  const n = Wn[t];
  if (n)
    return n;
  let s = Re(t);
  if (s !== "filter" && s in e)
    return Wn[t] = s;
  s = ai(s);
  for (let i = 0; i < Js.length; i++) {
    const o = Js[i] + s;
    if (o in e)
      return Wn[t] = o;
  }
  return t;
}
function xl(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && Q(s) && n === s;
}
const zs = "http://www.w3.org/1999/xlink";
function Gs(e, t, n, s, i, o = wo(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(zs, t.slice(6, t.length)) : e.setAttributeNS(zs, t, n) : n == null || o && !ui(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    o ? "" : We(n) ? String(n) : n
  );
}
function Ys(e, t, n, s, i) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? lo(n) : n);
    return;
  }
  const o = e.tagName;
  if (t === "value" && o !== "PROGRESS" && // custom elements may use _value internally
  !o.includes("-")) {
    const l = o === "OPTION" ? e.getAttribute("value") || "" : e.value, c = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (l !== c || !("_value" in e)) && (e.value = c), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let r = !1;
  if (n === "" || n == null) {
    const l = typeof e[t];
    l === "boolean" ? n = ui(n) : n == null && l === "string" ? (n = "", r = !0) : l === "number" && (n = 0, r = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  r && e.removeAttribute(i || t);
}
function dt(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Sl(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Xs = /* @__PURE__ */ Symbol("_vei");
function wl(e, t, n, s, i = null) {
  const o = e[Xs] || (e[Xs] = {}), r = o[t];
  if (s && r)
    r.value = s;
  else {
    const [l, c] = Cl(t);
    if (s) {
      const p = o[t] = El(
        s,
        i
      );
      dt(e, l, p, c);
    } else r && (Sl(e, l, r, c), o[t] = void 0);
  }
}
const Zs = /(?:Once|Passive|Capture)$/;
function Cl(e) {
  let t;
  if (Zs.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Zs); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : rt(e.slice(2)), t];
}
let qn = 0;
const Tl = /* @__PURE__ */ Promise.resolve(), Al = () => qn || (Tl.then(() => qn = 0), qn = Date.now());
function El(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    qe(
      Il(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Al(), n;
}
function Il(e, t) {
  if ($(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (s) => (i) => !i._stopped && s && s(i)
    );
  } else
    return t;
}
const Qs = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Rl = (e, t, n, s, i, o) => {
  const r = i === "svg";
  t === "class" ? ml(e, s, r) : t === "style" ? vl(e, n, s) : Sn(t) ? wn(t) || wl(e, t, n, s, o) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ml(e, t, s, r)) ? (Ys(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Gs(e, t, s, r, o, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Ol(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !Q(s))) ? Ys(e, Re(t), s, o, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Gs(e, t, s, r));
};
function Ml(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Qs(t) && H(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return Qs(t) && Q(n) ? !1 : t in e;
}
function Ol(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Re(t);
  return Array.isArray(n) ? n.some((i) => Re(i) === s) : Object.keys(n).some((i) => Re(i) === s);
}
const bn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return $(t) ? (n) => cn(t, n) : t;
};
function Pl(e) {
  e.target.composing = !0;
}
function ei(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const wt = /* @__PURE__ */ Symbol("_assign");
function ti(e, t, n) {
  return t && (e = e.trim()), n && (e = An(e)), e;
}
const ce = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[wt] = bn(i);
    const o = s || i.props && i.props.type === "number";
    dt(e, t ? "change" : "input", (r) => {
      r.target.composing || e[wt](ti(e.value, n, o));
    }), (n || o) && dt(e, "change", () => {
      e.value = ti(e.value, n, o);
    }), t || (dt(e, "compositionstart", Pl), dt(e, "compositionend", ei), dt(e, "change", ei));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: o } }, r) {
    if (e[wt] = bn(r), e.composing) return;
    const l = (o || e.type === "number") && !/^0\d/.test(e.value) ? An(e.value) : e.value, c = t ?? "";
    if (l === c)
      return;
    const p = e.getRootNode();
    (p instanceof Document || p instanceof ShadowRoot) && p.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === c) || (e.value = c);
  }
}, ni = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const i = Cn(t);
    dt(e, "change", () => {
      const o = Array.prototype.filter.call(e.options, (r) => r.selected).map(
        (r) => n ? An(xn(r)) : xn(r)
      );
      e[wt](
        e.multiple ? i ? new Set(o) : o : o[0]
      ), e._assigning = !0, Vt(() => {
        e._assigning = !1;
      });
    }), e[wt] = bn(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    si(e, t);
  },
  beforeUpdate(e, t, n) {
    e[wt] = bn(n);
  },
  updated(e, { value: t }) {
    e._assigning || si(e, t);
  }
};
function si(e, t) {
  const n = e.multiple, s = $(t);
  if (!(n && !s && !Cn(t))) {
    for (let i = 0, o = e.options.length; i < o; i++) {
      const r = e.options[i], l = xn(r);
      if (n)
        if (s) {
          const c = typeof l;
          c === "string" || c === "number" ? r.selected = t.some((p) => String(p) === String(l)) : r.selected = To(t, l) > -1;
        } else
          r.selected = t.has(l);
      else if (Xt(xn(r), t)) {
        e.selectedIndex !== i && (e.selectedIndex = i);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function xn(e) {
  return "_value" in e ? e._value : e.value;
}
const Dl = ["ctrl", "shift", "alt", "meta"], $l = {
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
  exact: (e, t) => Dl.some((n) => e[`${n}Key`] && !t.includes(n))
}, oe = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((i, ...o) => {
    for (let r = 0; r < t.length; r++) {
      const l = $l[t[r]];
      if (l && l(i, t)) return;
    }
    return e(i, ...o);
  }));
}, Fl = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, me = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = ((i) => {
    if (!("key" in i))
      return;
    const o = rt(i.key);
    if (t.some(
      (r) => r === o || Fl[r] === o
    ))
      return e(i);
  }));
}, jl = /* @__PURE__ */ le({ patchProp: Rl }, hl);
let ii;
function Kl() {
  return ii || (ii = qr(jl));
}
const Vl = ((...e) => {
  const t = Kl().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = Nl(s);
    if (!i) return;
    const o = t._component;
    !H(o) && !o.render && !o.template && (o.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const r = n(i, !1, Hl(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), r;
  }, t;
});
function Hl(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Nl(e) {
  return Q(e) ? document.querySelector(e) : e;
}
let Ul = 1;
function xe(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Ie(e) {
  return `${e}-${Date.now().toString(36)}-${Ul++}`;
}
function ao(e) {
  const t = xe(e || {});
  return {
    ...t,
    timestamp: { ...t.timestamp || {} },
    scene: { ...t.scene || {} },
    costumes: { ...t.costumes || {} },
    items: { ...t.items || {} },
    deletedItems: Array.isArray(t.deletedItems) ? [...t.deletedItems] : [],
    events: Array.isArray(t.events) ? xe(t.events) : t.event ? [xe(t.event)] : [],
    affection: { ...t.affection || {} },
    npcs: xe(t.npcs || {}),
    agenda: Array.isArray(t.agenda) ? xe(t.agenda) : [],
    deletedAgenda: Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [],
    mood: xe(t.mood || {}),
    relationships: Array.isArray(t.relationships) ? xe(t.relationships) : []
  };
}
function Ll(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function $n(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function kl(e) {
  return $n(e) === "悬念" ? "未解悬念" : "行动计划";
}
function Bl(e) {
  return $n(e) === "悬念" ? "type-suspense" : "type-plan";
}
function Wl(e) {
  switch (e) {
    case "affection":
      return { id: Ie("aff"), name: "", value: 0, editing: !0 };
    case "relationship":
      return { id: Ie("rel"), from: "", to: "", type: "", note: "", editing: !0 };
    case "costume":
      return { id: Ie("costume"), name: "", desc: "", editing: !0 };
    case "item":
      return {
        id: Ie("item"),
        icon: "",
        name: "",
        holder: "",
        location: "",
        description: "",
        importance: "",
        editing: !0
      };
    case "agenda":
      return { id: Ie("agenda"), date: "", type: "悬念", text: "", source: "user", editing: !0 };
    default:
      return { id: Ie("row"), editing: !0 };
  }
}
function fo(e) {
  const t = ao(e), n = t.events[0] || {};
  return {
    baseMeta: xe(t),
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
    affectionRows: Object.entries(t.affection || {}).map(([s, i]) => ({
      id: Ie("aff"),
      name: s,
      value: Ll(i),
      editing: !1
    })),
    relationshipRows: (t.relationships || []).map((s) => ({
      id: Ie("rel"),
      from: s.from || "",
      to: s.to || "",
      type: s.type || "",
      note: s.note || "",
      editing: !1
    })),
    costumeRows: Object.entries(t.costumes || {}).map(([s, i]) => ({
      id: Ie("costume"),
      name: s,
      desc: i,
      editing: !1
    })),
    itemRows: Object.entries(t.items || {}).map(([s, i]) => ({
      id: Ie("item"),
      icon: (i == null ? void 0 : i.icon) || "",
      name: s,
      holder: (i == null ? void 0 : i.holder) || "",
      location: (i == null ? void 0 : i.location) || "",
      description: (i == null ? void 0 : i.description) || "",
      importance: (i == null ? void 0 : i.importance) || "",
      editing: !1
    })),
    agendaRows: (t.agenda || []).map((s) => ({
      id: Ie("agenda"),
      date: s.date || "",
      type: $n(s.type),
      text: s.text || "",
      source: s.source || "user",
      done: !!s.done,
      editing: !1
    })),
    isSkipped: !!t._skipHorae
  };
}
function ql(e) {
  const t = ao(e.baseMeta), n = xe(t);
  n.timestamp = {
    ...t.timestamp || {},
    story_date: String(e.timestamp.story_date || "").trim(),
    story_time: String(e.timestamp.story_time || "").trim(),
    absolute: (/* @__PURE__ */ new Date()).toISOString()
  }, n.scene = {
    ...t.scene || {},
    location: String(e.scene.location || "").trim(),
    atmosphere: String(e.scene.atmosphere || "").trim(),
    characters_present: Array.isArray(e.scene.characters_present) ? e.scene.characters_present.map((o) => String(o || "").trim()).filter(Boolean) : []
  }, e.scene.scene_desc && (n.scene.scene_desc = e.scene.scene_desc), n.costumes = {};
  for (const o of e.costumeRows || []) {
    const r = String(o.name || "").trim(), l = String(o.desc || "").trim();
    r && l && (n.costumes[r] = l);
  }
  n.items = {};
  for (const o of e.itemRows || []) {
    const r = String(o.name || "").trim();
    r && (n.items[r] = {
      icon: String(o.icon || "").trim() || null,
      importance: o.importance || "",
      holder: String(o.holder || "").trim() || null,
      location: String(o.location || "").trim(),
      description: String(o.description || "").trim()
    });
  }
  n.affection = {};
  for (const o of e.affectionRows || []) {
    const r = String(o.name || "").trim();
    if (!r) continue;
    const l = Number.parseFloat(o.value);
    n.affection[r] = {
      type: "absolute",
      value: Number.isFinite(l) ? l : String(o.value || "").trim()
    };
  }
  n.relationships = [];
  for (const o of e.relationshipRows || []) {
    const r = String(o.from || "").trim(), l = String(o.to || "").trim(), c = String(o.type || "").trim(), p = String(o.note || "").trim();
    r && l && c && n.relationships.push({ from: r, to: l, type: c, note: p });
  }
  const s = String(e.event.summary || "").trim(), i = String(e.event.level || "").trim();
  n.events = s ? [{
    is_important: i === "重要" || i === "关键" || i === "關鍵",
    level: i || "一般",
    summary: s
  }] : [], delete n.event, n.agenda = [];
  for (const o of e.agendaRows || []) {
    const r = String(o.text || "").trim();
    r && n.agenda.push({
      type: $n(o.type),
      date: String(o.date || "").trim(),
      text: r,
      source: o.source || "user",
      done: !!o.done
    });
  }
  return n.deletedItems = Array.isArray(t.deletedItems) ? [...t.deletedItems] : [], n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = xe(t.npcs || {}), n.mood = xe(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = xe(t._rpgChanges)), t.tableContributions && (n.tableContributions = xe(t.tableContributions)), n;
}
function Jl(e, t) {
  const n = fo(t);
  for (const s of Object.keys(e)) delete e[s];
  Object.assign(e, n);
}
function zl(e) {
  return Array.isArray(e) ? e.map((t) => String(t || "").trim()).filter(Boolean) : String(e || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}
const Gl = { class: "toggle-left" }, Yl = { class: "toggle-icon" }, Xl = { class: "toggle-info" }, Zl = { class: "toggle-time" }, Ql = {
  key: 0,
  class: "horae-sideplay-badge"
}, ec = { class: "toggle-summary" }, tc = { class: "toggle-actions" }, nc = ["title"], sc = ["title"], ic = ["title", "disabled"], oc = { class: "horae-panel-content" }, rc = { class: "neo-dashboard" }, lc = { class: "neo-tags" }, cc = { class: "neo-chip" }, ac = ["placeholder"], fc = { class: "neo-chip" }, uc = ["placeholder"], dc = { class: "neo-chip" }, pc = ["placeholder"], hc = { class: "event-header" }, gc = { class: "event-badge" }, mc = { class: "action-group-hover" }, _c = { class: "view-mode" }, yc = { class: "event-body-text" }, vc = { class: "edit-mode" }, bc = { value: "" }, xc = { value: "一般" }, Sc = { value: "重要" }, wc = { value: "关键" }, Cc = ["placeholder"], Tc = { class: "neo-inset-section" }, Ac = { class: "neo-section-header compact" }, Ec = { class: "section-title" }, Ic = { class: "aff-grid list-container" }, Rc = { class: "view-mode" }, Mc = { class: "t-title" }, Oc = { class: "t-val" }, Pc = { class: "edit-mode" }, Dc = ["onUpdate:modelValue", "placeholder", "onKeydown"], $c = ["onUpdate:modelValue", "placeholder", "onKeydown"], Fc = { class: "neo-inset-section" }, jc = { class: "neo-section-header compact" }, Kc = { class: "section-title" }, Vc = { class: "rel-list list-container" }, Hc = { class: "view-mode" }, Nc = { class: "rel-node" }, Uc = { class: "rel-node" }, Lc = { class: "rel-label" }, kc = { class: "edit-mode" }, Bc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Wc = ["onUpdate:modelValue", "placeholder", "onKeydown"], qc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Jc = { class: "neo-inset-section" }, zc = { class: "neo-section-header" }, Gc = { class: "section-title" }, Yc = { class: "neo-item-list list-container" }, Xc = { class: "view-mode" }, Zc = { class: "item-emoji" }, Qc = { class: "item-info" }, ea = { class: "item-line-top" }, ta = {
  key: 0,
  class: "item-holder-badge"
}, na = {
  key: 0,
  class: "item-meta"
}, sa = { class: "item-desc" }, ia = { class: "edit-mode item-edit-mode" }, oa = { class: "item-edit-line" }, ra = ["onUpdate:modelValue", "onKeydown"], la = ["onUpdate:modelValue", "placeholder", "onKeydown"], ca = ["onUpdate:modelValue", "placeholder", "onKeydown"], aa = ["onUpdate:modelValue", "placeholder", "onKeydown"], fa = ["onUpdate:modelValue", "placeholder", "onKeydown"], ua = { class: "neo-inset-section" }, da = { class: "neo-section-header" }, pa = { class: "section-title" }, ha = { class: "neo-agenda-list list-container" }, ga = { class: "view-mode" }, ma = { class: "agenda-date" }, _a = { class: "agenda-content" }, ya = { class: "agenda-type" }, va = { class: "agenda-text" }, ba = { class: "edit-mode agenda-edit-mode" }, xa = { class: "agenda-edit-line" }, Sa = ["onUpdate:modelValue", "placeholder", "onKeydown"], wa = ["onUpdate:modelValue", "onKeydown"], Ca = { value: "悬念" }, Ta = { value: "计划" }, Aa = ["onUpdate:modelValue", "placeholder", "onKeydown"], Ea = { class: "neo-footer-actions" }, Ia = { class: "action-group" }, Ra = ["disabled"], Ma = ["disabled"], Oa = { class: "action-group" }, Pa = ["disabled"], Da = ["title"], $a = {
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
    }, i = yt(() => ({ ...s, ...n.labels })).value, o = yt(() => ({ sideplayMode: !1, ...n.config })).value, r = n.adapter || {}, l = /* @__PURE__ */ on(null), c = /* @__PURE__ */ qt(fo(n.initialMeta)), p = /* @__PURE__ */ on(!1), u = /* @__PURE__ */ on(!1), _ = /* @__PURE__ */ qt({ save: !1, scan: !1, ai: !1, sideplay: !1 }), I = /* @__PURE__ */ on((c.scene.characters_present || []).join(", "));
    Ht(
      () => c.scene.characters_present,
      (A) => {
        I.value = (A || []).join(", ");
      },
      { deep: !0 }
    ), Ht(
      () => c.isSkipped,
      (A) => {
        var h;
        (h = n.setHostState) == null || h.call(n, { isSkipped: !!A, visible: o.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const M = yt(() => {
      if (c.isSkipped) return i.noTracking;
      const A = c.timestamp.story_date || "--", h = c.timestamp.story_time ? ` ${c.timestamp.story_time}` : "";
      return `${A}${h}`;
    }), k = yt(() => {
      var d;
      if (c.isSkipped) return i.sideplayTitle;
      const A = c.event.summary || i.noSpecialEvents, h = ((d = c.scene.characters_present) == null ? void 0 : d.length) || 0;
      return h ? `${A} | ${h}${i.characters}` : A;
    }), K = yt(() => `${c.event.level || i.levelNormal}${i.event}`);
    function V() {
      u.value = !0;
    }
    function G(A) {
      A.target.closest("button, input, textarea, select") || (p.value = !p.value);
    }
    function U() {
      c.scene.characters_present = zl(I.value), V();
    }
    function F(A) {
      A.editing = !A.editing, A.editing || V(), Vt(st);
    }
    function P(A, h) {
      c[A].push(Wl(h)), V(), Vt(st);
    }
    function Z(A, h) {
      const d = c[A], T = d.findIndex((Je) => Je.id === h);
      T >= 0 && (d.splice(T, 1), V());
    }
    function de(A) {
      Jl(c, A || {}), I.value = (c.scene.characters_present || []).join(", "), u.value = !1, Vt(st);
    }
    async function Ce() {
      var A;
      _.save = !0;
      try {
        const h = ql(c), d = await ((A = r.save) == null ? void 0 : A.call(r, h));
        d ? de(d) : u.value = !1;
      } finally {
        _.save = !1;
      }
    }
    async function Pe() {
      var A;
      _.scan = !0;
      try {
        const h = await ((A = r.quickScan) == null ? void 0 : A.call(r));
        h && de(h);
      } finally {
        _.scan = !1;
      }
    }
    async function gt() {
      var A;
      _.scan = !0;
      try {
        const h = await ((A = r.rescan) == null ? void 0 : A.call(r));
        h && de(h);
      } finally {
        _.scan = !1;
      }
    }
    async function De() {
      var A;
      _.ai = !0;
      try {
        const h = await ((A = r.aiAnalyze) == null ? void 0 : A.call(r));
        h && de(h);
      } finally {
        _.ai = !1;
      }
    }
    async function lt() {
      var A;
      _.sideplay = !0;
      try {
        const h = await ((A = r.toggleSideplay) == null ? void 0 : A.call(r));
        h && de(h);
      } finally {
        _.sideplay = !1;
      }
    }
    function st() {
      var A;
      (A = l.value) == null || A.querySelectorAll("textarea").forEach((h) => {
        h.style.height = "auto", h.style.height = `${h.scrollHeight}px`;
      });
    }
    const $e = /* @__PURE__ */ Ms({
      props: {
        row: { type: Object, required: !0 },
        deleteIcon: { type: String, default: "fa-xmark" }
      },
      emits: ["edit", "delete"],
      setup(A, { emit: h }) {
        return () => ne("div", { class: "action-group-hover" }, [
          ne("button", { class: "action-hover-btn btn-edit", onClick: () => h("edit") }, [
            ne("i", { class: "fa-solid fa-pen" })
          ]),
          ne("button", { class: "action-hover-btn btn-del", onClick: () => h("delete") }, [
            ne("i", { class: `fa-solid ${A.deleteIcon}` })
          ])
        ]);
      }
    }), At = /* @__PURE__ */ Ms({
      props: {
        title: { type: String, required: !0 },
        icon: { type: String, required: !0 },
        rows: { type: Array, required: !0 },
        labels: { type: Object, required: !0 }
      },
      emits: ["add", "edit", "delete", "dirty"],
      setup(A, { emit: h }) {
        return () => ne("section", { class: "neo-inset-section" }, [
          ne("div", { class: "neo-section-header" }, [
            ne("span", { class: "section-title" }, [
              ne("i", { class: `fa-solid ${A.icon}` }),
              ` ${A.title}`
            ]),
            ne("button", { class: "neo-text-btn add", onClick: () => h("add") }, [
              ne("i", { class: "fa-solid fa-plus" }),
              ` ${A.labels.add}`
            ])
          ]),
          ne("div", { class: "neo-dict-list list-container" }, A.rows.map((d) => ne("div", { key: d.id, class: ["neo-dict-row editable-block", { "is-editing": d.editing }] }, [
            ne("div", { class: "view-mode dict-view" }, [
              ne("div", { class: "dict-key" }, d.name || A.labels.role),
              ne("div", { class: "dict-value" }, d.desc || A.labels.itemDesc)
            ]),
            ne("div", { class: "edit-mode dict-edit-mode" }, [
              ne("input", {
                class: "neo-input short-key no-enter",
                value: d.name,
                placeholder: A.labels.role,
                onInput: (T) => {
                  d.name = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", d));
                }
              }),
              ne("textarea", {
                class: "neo-textarea no-enter",
                value: d.desc,
                placeholder: A.labels.itemDesc,
                onInput: (T) => {
                  d.desc = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", d));
                }
              })
            ]),
            ne($e, {
              row: d,
              onEdit: () => h("edit", d),
              onDelete: () => h("delete", d.id)
            })
          ])))
        ]);
      }
    });
    function en(A) {
      de(A);
    }
    return t({ replaceMeta: en }), (A, h) => (be(), Te("div", {
      ref_key: "panelRoot",
      ref: l,
      class: "horae-message-panel-shell"
    }, [
      g("div", {
        class: "horae-panel-top",
        onClick: G
      }, [
        g("div", Gl, [
          g("div", Yl, [
            g("i", {
              class: ye(["fa-regular", c.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          g("div", Xl, [
            g("div", Zl, [
              c.isSkipped ? (be(), Te("span", Ql, N(R(i).sideplay), 1)) : Bn("", !0),
              ae(" " + N(M.value), 1)
            ]),
            g("div", ec, N(k.value), 1)
          ])
        ]),
        g("div", tc, [
          te(g("button", {
            class: "neo-btn-icon",
            title: R(i).sideplayTitle,
            onClick: oe(lt, ["stop"])
          }, [
            g("i", {
              class: ye(["fa-solid", c.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, nc), [
            [Ws, R(o).sideplayMode]
          ]),
          g("button", {
            class: "neo-btn-icon",
            title: R(i).rescan,
            onClick: oe(gt, ["stop"])
          }, [...h[15] || (h[15] = [
            g("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, sc),
          g("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: R(i).aiAnalyze,
            disabled: _.ai,
            onClick: oe(De, ["stop"])
          }, [
            g("i", {
              class: ye(["fa-solid", _.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, ic)
        ])
      ]),
      te(g("div", oc, [
        g("div", rc, [
          g("div", lc, [
            g("span", cc, [
              h[16] || (h[16] = g("i", { class: "fa-solid fa-location-dot" }, null, -1)),
              te(g("input", {
                "onUpdate:modelValue": h[0] || (h[0] = (d) => c.scene.location = d),
                class: "neo-chip-input",
                placeholder: R(i).location,
                onInput: V
              }, null, 40, ac), [
                [ce, c.scene.location]
              ])
            ]),
            g("span", fc, [
              h[17] || (h[17] = g("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
              te(g("input", {
                "onUpdate:modelValue": h[1] || (h[1] = (d) => c.scene.atmosphere = d),
                class: "neo-chip-input",
                placeholder: R(i).atmosphere,
                onInput: V
              }, null, 40, uc), [
                [ce, c.scene.atmosphere]
              ])
            ]),
            g("span", dc, [
              h[18] || (h[18] = g("i", { class: "fa-solid fa-users" }, null, -1)),
              te(g("input", {
                "onUpdate:modelValue": h[2] || (h[2] = (d) => I.value = d),
                class: "neo-chip-input",
                placeholder: R(i).characters,
                onInput: U
              }, null, 40, pc), [
                [ce, I.value]
              ])
            ])
          ]),
          g("div", {
            class: ye(["neo-event-card editable-block", { "is-editing": c.event.editing }])
          }, [
            g("div", hc, [
              g("span", gc, [
                h[19] || (h[19] = g("i", { class: "fa-solid fa-bolt" }, null, -1)),
                ae(" " + N(K.value), 1)
              ]),
              g("div", mc, [
                g("button", {
                  class: "action-hover-btn btn-edit",
                  onClick: h[3] || (h[3] = (d) => F(c.event))
                }, [...h[20] || (h[20] = [
                  g("i", { class: "fa-solid fa-pen" }, null, -1)
                ])])
              ])
            ]),
            g("div", _c, [
              g("div", yc, N(c.event.summary || R(i).noSpecialEvents), 1)
            ]),
            g("div", vc, [
              te(g("select", {
                "onUpdate:modelValue": h[4] || (h[4] = (d) => c.event.level = d),
                class: "neo-input event-level-select",
                onChange: V
              }, [
                g("option", bc, N(R(i).levelNone), 1),
                g("option", xc, N(R(i).levelNormal), 1),
                g("option", Sc, N(R(i).levelImportant), 1),
                g("option", wc, N(R(i).levelCritical), 1)
              ], 544), [
                [ni, c.event.level]
              ]),
              te(g("textarea", {
                "onUpdate:modelValue": h[5] || (h[5] = (d) => c.event.summary = d),
                class: "neo-textarea lg no-enter",
                rows: "2",
                placeholder: R(i).eventPlaceholder,
                onInput: V,
                onKeydown: h[6] || (h[6] = me(oe((d) => F(c.event), ["prevent"]), ["enter"]))
              }, null, 40, Cc), [
                [ce, c.event.summary]
              ])
            ])
          ], 2),
          g("section", Tc, [
            g("div", Ac, [
              g("span", Ec, [
                h[21] || (h[21] = g("i", { class: "fa-solid fa-heart" }, null, -1)),
                ae(" " + N(R(i).affection), 1)
              ]),
              g("button", {
                class: "neo-text-btn add",
                onClick: h[7] || (h[7] = (d) => P("affectionRows", "affection"))
              }, [
                h[22] || (h[22] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                ae(" " + N(R(i).add), 1)
              ])
            ]),
            g("div", Ic, [
              (be(!0), Te(Se, null, ln(c.affectionRows, (d) => (be(), Te("div", {
                key: d.id,
                class: ye(["aff-chip editable-block", { "is-editing": d.editing }])
              }, [
                g("div", Rc, [
                  g("span", Mc, N(d.name || R(i).role), 1),
                  g("span", Oc, N(d.value || 0), 1)
                ]),
                g("div", Pc, [
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.name = T,
                    class: "neo-input no-enter aff-name",
                    placeholder: R(i).role,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, Dc), [
                    [ce, d.name]
                  ]),
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.value = T,
                    class: "neo-input no-enter aff-value",
                    placeholder: R(i).value,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, $c), [
                    [ce, d.value]
                  ])
                ]),
                se(R($e), {
                  row: d,
                  onEdit: (T) => F(d),
                  onDelete: (T) => Z("affectionRows", d.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          g("section", Fc, [
            g("div", jc, [
              g("span", Kc, [
                h[23] || (h[23] = g("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                ae(" " + N(R(i).relationships), 1)
              ]),
              g("button", {
                class: "neo-text-btn add",
                onClick: h[8] || (h[8] = (d) => P("relationshipRows", "relationship"))
              }, [
                h[24] || (h[24] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                ae(" " + N(R(i).add), 1)
              ])
            ]),
            g("div", Vc, [
              (be(!0), Te(Se, null, ln(c.relationshipRows, (d) => (be(), Te("div", {
                key: d.id,
                class: ye(["rel-row editable-block", { "is-editing": d.editing }])
              }, [
                g("div", Hc, [
                  g("span", Nc, N(d.from || R(i).role), 1),
                  h[25] || (h[25] = g("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                  g("span", Uc, N(d.to || R(i).role), 1),
                  g("span", Lc, N(d.type || R(i).relationshipHint), 1)
                ]),
                g("div", kc, [
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.from = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: R(i).relFrom,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, Bc), [
                    [ce, d.from]
                  ]),
                  h[26] || (h[26] = g("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.to = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: R(i).relTo,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, Wc), [
                    [ce, d.to]
                  ]),
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.type = T,
                    class: "neo-input no-enter",
                    placeholder: R(i).relType,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, qc), [
                    [ce, d.type]
                  ])
                ]),
                se(R($e), {
                  row: d,
                  onEdit: (T) => F(d),
                  onDelete: (T) => Z("relationshipRows", d.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          se(R(At), {
            title: R(i).costumes,
            icon: "fa-shirt",
            rows: c.costumeRows,
            labels: R(i),
            onAdd: h[9] || (h[9] = (d) => P("costumeRows", "costume")),
            onEdit: F,
            onDelete: h[10] || (h[10] = (d) => Z("costumeRows", d)),
            onDirty: V
          }, null, 8, ["title", "rows", "labels"]),
          g("section", Jc, [
            g("div", zc, [
              g("span", Gc, [
                h[27] || (h[27] = g("i", { class: "fa-solid fa-box-open" }, null, -1)),
                ae(" " + N(R(i).items), 1)
              ]),
              g("button", {
                class: "neo-text-btn add",
                onClick: h[11] || (h[11] = (d) => P("itemRows", "item"))
              }, [
                h[28] || (h[28] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                ae(" " + N(R(i).add), 1)
              ])
            ]),
            g("div", Yc, [
              (be(!0), Te(Se, null, ln(c.itemRows, (d) => (be(), Te("div", {
                key: d.id,
                class: ye(["neo-item-card editable-block", { "is-editing": d.editing }])
              }, [
                g("div", Xc, [
                  g("div", Zc, N(d.icon || "📦"), 1),
                  g("div", Qc, [
                    g("div", ea, [
                      g("span", null, N(d.name || R(i).itemName), 1),
                      d.holder ? (be(), Te("span", ta, N(d.holder), 1)) : Bn("", !0)
                    ]),
                    d.location ? (be(), Te("div", na, [
                      h[29] || (h[29] = g("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                      ae(" " + N(d.location), 1)
                    ])) : Bn("", !0),
                    g("div", sa, N(d.description || R(i).itemDesc), 1)
                  ])
                ]),
                g("div", ia, [
                  g("div", oa, [
                    te(g("input", {
                      "onUpdate:modelValue": (T) => d.icon = T,
                      class: "neo-input no-enter item-icon-input",
                      maxlength: "2",
                      placeholder: "📦",
                      onInput: V,
                      onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                    }, null, 40, ra), [
                      [ce, d.icon]
                    ]),
                    te(g("input", {
                      "onUpdate:modelValue": (T) => d.name = T,
                      class: "neo-input no-enter",
                      placeholder: R(i).itemName,
                      onInput: V,
                      onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                    }, null, 40, la), [
                      [ce, d.name]
                    ]),
                    te(g("input", {
                      "onUpdate:modelValue": (T) => d.holder = T,
                      class: "neo-input no-enter item-holder-input",
                      placeholder: R(i).holder,
                      onInput: V,
                      onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                    }, null, 40, ca), [
                      [ce, d.holder]
                    ])
                  ]),
                  te(g("input", {
                    "onUpdate:modelValue": (T) => d.location = T,
                    class: "neo-input no-enter",
                    placeholder: R(i).location,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, aa), [
                    [ce, d.location]
                  ]),
                  te(g("textarea", {
                    "onUpdate:modelValue": (T) => d.description = T,
                    class: "neo-textarea no-enter",
                    placeholder: R(i).itemDesc,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, fa), [
                    [ce, d.description]
                  ])
                ]),
                se(R($e), {
                  row: d,
                  "delete-icon": "fa-trash-can",
                  onEdit: (T) => F(d),
                  onDelete: (T) => Z("itemRows", d.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          g("section", ua, [
            g("div", da, [
              g("span", pa, [
                h[30] || (h[30] = g("i", { class: "fa-solid fa-list-check" }, null, -1)),
                ae(" " + N(R(i).agenda), 1)
              ]),
              g("button", {
                class: "neo-text-btn add",
                onClick: h[12] || (h[12] = (d) => P("agendaRows", "agenda"))
              }, [
                h[31] || (h[31] = g("i", { class: "fa-solid fa-plus" }, null, -1)),
                ae(" " + N(R(i).add), 1)
              ])
            ]),
            g("div", ha, [
              (be(!0), Te(Se, null, ln(c.agendaRows, (d) => (be(), Te("div", {
                key: d.id,
                class: ye(["agenda-card editable-block", [R(Bl)(d.type), { "is-editing": d.editing }]])
              }, [
                g("div", ga, [
                  g("div", ma, N(d.date || R(i).unscheduled), 1),
                  g("div", _a, [
                    g("span", ya, N(R(kl)(d.type)), 1),
                    g("span", va, N(d.text || R(i).agendaText), 1)
                  ])
                ]),
                g("div", ba, [
                  g("div", xa, [
                    te(g("input", {
                      "onUpdate:modelValue": (T) => d.date = T,
                      class: "neo-input no-enter agenda-date-input",
                      placeholder: R(i).date,
                      onInput: V,
                      onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                    }, null, 40, Sa), [
                      [ce, d.date]
                    ]),
                    te(g("select", {
                      "onUpdate:modelValue": (T) => d.type = T,
                      class: "neo-input no-enter",
                      onChange: V,
                      onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                    }, [
                      g("option", Ca, N(R(i).agendaMystery), 1),
                      g("option", Ta, N(R(i).agendaPlan), 1)
                    ], 40, wa), [
                      [ni, d.type]
                    ])
                  ]),
                  te(g("textarea", {
                    "onUpdate:modelValue": (T) => d.text = T,
                    class: "neo-textarea no-enter",
                    placeholder: R(i).agendaText,
                    onInput: V,
                    onKeydown: me(oe((T) => F(d), ["prevent"]), ["enter"])
                  }, null, 40, Aa), [
                    [ce, d.text]
                  ])
                ]),
                se(R($e), {
                  row: d,
                  onEdit: (T) => F(d),
                  onDelete: (T) => Z("agendaRows", d.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          g("div", Ea, [
            g("div", Ia, [
              g("button", {
                class: "neo-btn-text",
                disabled: _.scan,
                onClick: Pe
              }, [
                g("i", {
                  class: ye(["fa-solid", _.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                }, null, 2),
                ae(" " + N(R(i).quickScan), 1)
              ], 8, Ra),
              g("button", {
                class: "neo-btn-text btn-ai-text",
                disabled: _.ai,
                onClick: De
              }, [
                g("i", {
                  class: ye(["fa-solid", _.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                }, null, 2),
                ae(" " + N(R(i).aiAnalyze), 1)
              ], 8, Ma)
            ]),
            g("div", Oa, [
              g("button", {
                class: "neo-btn-text btn-save-apply",
                disabled: _.save,
                onClick: Ce
              }, [
                g("i", {
                  class: ye(["fa-solid", _.save ? "fa-spinner fa-spin" : "fa-check"])
                }, null, 2),
                ae(" " + N(R(i).apply), 1)
              ], 8, Pa),
              g("button", {
                class: "neo-btn-text",
                onClick: h[13] || (h[13] = (d) => p.value = !0)
              }, [
                h[32] || (h[32] = g("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                ae(" " + N(R(i).collapse), 1)
              ]),
              g("button", {
                class: "neo-btn-text btn-drawer",
                title: R(i).openDrawer,
                onClick: h[14] || (h[14] = (d) => {
                  var T, Je;
                  return (Je = (T = R(r)).openDrawer) == null ? void 0 : Je.call(T);
                })
              }, [...h[33] || (h[33] = [
                g("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
              ])], 8, Da)
            ])
          ])
        ])
      ], 512), [
        [Ws, !p.value]
      ])
    ], 512));
  }
};
function ja(e, t = {}) {
  if (!e) return null;
  const n = Vl($a, {
    ...t,
    setHostState(o = {}) {
      var r;
      e.classList.toggle("horae-sideplay", !!o.isSkipped), typeof o.visible == "boolean" && (e.style.display = o.visible ? "" : "none"), (r = t.setHostState) == null || r.call(t, o);
    }
  }), s = n.mount(e), i = new MutationObserver(() => {
    document.body.contains(e) || (n.unmount(), i.disconnect());
  });
  return i.observe(document.body, { childList: !0, subtree: !0 }), {
    unmount() {
      i.disconnect(), n.unmount();
    },
    updateMeta(o) {
      var r;
      (r = s == null ? void 0 : s.replaceMeta) == null || r.call(s, o);
    }
  };
}
export {
  ja as mountMessagePanel
};
