/**
* @vue/shared v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function os(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const J = {}, xt = [], ze = () => {
}, io = () => !1, wn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Sn = (e) => e.startsWith("onUpdate:"), ae = Object.assign, is = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, hi = Object.prototype.hasOwnProperty, B = (e, t) => hi.call(e, t), D = Array.isArray, yt = (e) => Yt(e) === "[object Map]", Cn = (e) => Yt(e) === "[object Set]", Ts = (e) => Yt(e) === "[object Date]", V = (e) => typeof e == "function", Q = (e) => typeof e == "string", Be = (e) => typeof e == "symbol", W = (e) => e !== null && typeof e == "object", ro = (e) => (W(e) || V(e)) && V(e.then) && V(e.catch), ao = Object.prototype.toString, Yt = (e) => ao.call(e), mi = (e) => Yt(e).slice(8, -1), lo = (e) => Yt(e) === "[object Object]", rs = (e) => Q(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, $t = /* @__PURE__ */ os(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Tn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, gi = /-\w/g, Ie = Tn(
  (e) => e.replace(gi, (t) => t.slice(1).toUpperCase())
), vi = /\B([A-Z])/g, rt = Tn(
  (e) => e.replace(vi, "-$1").toLowerCase()
), co = Tn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Fn = Tn(
  (e) => e ? `on${co(e)}` : ""
), Le = (e, t) => !Object.is(e, t), ln = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, uo = (e, t, n, s = !1) => {
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
function as(e) {
  if (D(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], o = Q(s) ? _i(s) : as(s);
      if (o)
        for (const i in o)
          t[i] = o[i];
    }
    return t;
  } else if (Q(e) || W(e))
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
function be(e) {
  let t = "";
  if (Q(e))
    t = e;
  else if (D(e))
    for (let n = 0; n < e.length; n++) {
      const s = be(e[n]);
      s && (t += s + " ");
    }
  else if (W(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const wi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Si = /* @__PURE__ */ os(wi);
function fo(e) {
  return !!e || e === "";
}
function Ci(e, t) {
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
  if (n = Be(e), s = Be(t), n || s)
    return e === t;
  if (n = D(e), s = D(t), n || s)
    return n && s ? Ci(e, t) : !1;
  if (n = W(e), s = W(t), n || s) {
    if (!n || !s)
      return !1;
    const o = Object.keys(e).length, i = Object.keys(t).length;
    if (o !== i)
      return !1;
    for (const r in e) {
      const a = e.hasOwnProperty(r), l = t.hasOwnProperty(r);
      if (a && !l || !a && l || !Xt(e[r], t[r]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function Ti(e, t) {
  return e.findIndex((n) => Xt(n, t));
}
const po = (e) => !!(e && e.__v_isRef === !0), H = (e) => Q(e) ? e : e == null ? "" : D(e) || W(e) && (e.toString === ao || !V(e.toString)) ? po(e) ? H(e.value) : JSON.stringify(e, ho, 2) : String(e), ho = (e, t) => po(t) ? ho(e, t.value) : yt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, o], i) => (n[jn(s, i) + " =>"] = o, n),
    {}
  )
} : Cn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => jn(n))
} : Be(t) ? jn(t) : W(t) && !D(t) && !lo(t) ? String(t) : t, jn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Be(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let re;
class Ai {
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
        const o = this.parent.scopes.pop();
        o && o !== this && (this.parent.scopes[this.index] = o, o.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Ei() {
  return re;
}
let X;
const Kn = /* @__PURE__ */ new WeakSet();
class mo {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, re && (re.active ? re.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Kn.has(this) && (Kn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || vo(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Es(this), bo(this);
    const t = X, n = Me;
    X = this, Me = !0;
    try {
      return this.fn();
    } finally {
      xo(this), X = t, Me = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        us(t);
      this.deps = this.depsTail = void 0, Es(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Kn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    qn(this) && this.run();
  }
  get dirty() {
    return qn(this);
  }
}
let go = 0, Ft, jt;
function vo(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = jt, jt = e;
    return;
  }
  e.next = Ft, Ft = e;
}
function ls() {
  go++;
}
function cs() {
  if (--go > 0)
    return;
  if (jt) {
    let t = jt;
    for (jt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Ft; ) {
    let t = Ft;
    for (Ft = void 0; t; ) {
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
function bo(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function xo(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const o = s.prevDep;
    s.version === -1 ? (s === n && (n = o), us(s), Oi(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = o;
  }
  e.deps = t, e.depsTail = n;
}
function qn(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (yo(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function yo(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === zt) || (e.globalVersion = zt, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !qn(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = X, s = Me;
  X = e, Me = !0;
  try {
    bo(e);
    const o = e.fn(e._value);
    (t.version === 0 || Le(o, e._value)) && (e.flags |= 128, e._value = o, t.version++);
  } catch (o) {
    throw t.version++, o;
  } finally {
    X = n, Me = s, xo(e), e.flags &= -3;
  }
}
function us(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: o } = e;
  if (s && (s.nextSub = o, e.prevSub = void 0), o && (o.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      us(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Oi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Me = !0;
const _o = [];
function Qe() {
  _o.push(Me), Me = !1;
}
function et() {
  const e = _o.pop();
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
let zt = 0;
class Ii {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class fs {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!X || !Me || X === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== X)
      n = this.activeLink = new Ii(X, this), X.deps ? (n.prevDep = X.depsTail, X.depsTail.nextDep = n, X.depsTail = n) : X.deps = X.depsTail = n, wo(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = X.depsTail, n.nextDep = void 0, X.depsTail.nextDep = n, X.depsTail = n, X.deps === n && (X.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, zt++, this.notify(t);
  }
  notify(t) {
    ls();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      cs();
    }
  }
}
function wo(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        wo(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Jn = /* @__PURE__ */ new WeakMap(), dt = /* @__PURE__ */ Symbol(
  ""
), Gn = /* @__PURE__ */ Symbol(
  ""
), Bt = /* @__PURE__ */ Symbol(
  ""
);
function ue(e, t, n) {
  if (Me && X) {
    let s = Jn.get(e);
    s || Jn.set(e, s = /* @__PURE__ */ new Map());
    let o = s.get(n);
    o || (s.set(n, o = new fs()), o.map = s, o.key = n), o.track();
  }
}
function Xe(e, t, n, s, o, i) {
  const r = Jn.get(e);
  if (!r) {
    zt++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (ls(), t === "clear")
    r.forEach(a);
  else {
    const l = D(e), d = l && rs(n);
    if (l && n === "length") {
      const f = Number(s);
      r.forEach((v, O) => {
        (O === "length" || O === Bt || !Be(O) && O >= f) && a(v);
      });
    } else
      switch ((n !== void 0 || r.has(void 0)) && a(r.get(n)), d && a(r.get(Bt)), t) {
        case "add":
          l ? d && a(r.get("length")) : (a(r.get(dt)), yt(e) && a(r.get(Gn)));
          break;
        case "delete":
          l || (a(r.get(dt)), yt(e) && a(r.get(Gn)));
          break;
        case "set":
          yt(e) && a(r.get(dt));
          break;
      }
  }
  cs();
}
function gt(e) {
  const t = /* @__PURE__ */ z(e);
  return t === e ? t : (ue(t, "iterate", Bt), /* @__PURE__ */ Ee(e) ? t : t.map(Re));
}
function On(e) {
  return ue(e = /* @__PURE__ */ z(e), "iterate", Bt), e;
}
function Ne(e, t) {
  return /* @__PURE__ */ tt(e) ? Ct(/* @__PURE__ */ ht(e) ? Re(t) : t) : Re(t);
}
const Mi = {
  __proto__: null,
  [Symbol.iterator]() {
    return Vn(this, Symbol.iterator, (e) => Ne(this, e));
  },
  concat(...e) {
    return gt(this).concat(
      ...e.map((t) => D(t) ? gt(t) : t)
    );
  },
  entries() {
    return Vn(this, "entries", (e) => (e[1] = Ne(this, e[1]), e));
  },
  every(e, t) {
    return Je(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Je(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ne(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Je(
      this,
      "find",
      e,
      t,
      (n) => Ne(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Je(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Je(
      this,
      "findLast",
      e,
      t,
      (n) => Ne(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Je(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Je(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Hn(this, "includes", e);
  },
  indexOf(...e) {
    return Hn(this, "indexOf", e);
  },
  join(e) {
    return gt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Hn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Je(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Mt(this, "pop");
  },
  push(...e) {
    return Mt(this, "push", e);
  },
  reduce(e, ...t) {
    return Os(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return Os(this, "reduceRight", e, t);
  },
  shift() {
    return Mt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Je(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Mt(this, "splice", e);
  },
  toReversed() {
    return gt(this).toReversed();
  },
  toSorted(e) {
    return gt(this).toSorted(e);
  },
  toSpliced(...e) {
    return gt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Mt(this, "unshift", e);
  },
  values() {
    return Vn(this, "values", (e) => Ne(this, e));
  }
};
function Vn(e, t, n) {
  const s = On(e), o = s[t]();
  return s !== e && !/* @__PURE__ */ Ee(e) && (o._next = o.next, o.next = () => {
    const i = o._next();
    return i.done || (i.value = n(i.value)), i;
  }), o;
}
const Ri = Array.prototype;
function Je(e, t, n, s, o, i) {
  const r = On(e), a = r !== e && !/* @__PURE__ */ Ee(e), l = r[t];
  if (l !== Ri[t]) {
    const v = l.apply(e, i);
    return a ? Re(v) : v;
  }
  let d = n;
  r !== e && (a ? d = function(v, O) {
    return n.call(this, Ne(e, v), O, e);
  } : n.length > 2 && (d = function(v, O) {
    return n.call(this, v, O, e);
  }));
  const f = l.call(r, d, s);
  return a && o ? o(f) : f;
}
function Os(e, t, n, s) {
  const o = On(e), i = o !== e && !/* @__PURE__ */ Ee(e);
  let r = n, a = !1;
  o !== e && (i ? (a = s.length === 0, r = function(d, f, v) {
    return a && (a = !1, d = Ne(e, d)), n.call(this, d, Ne(e, f), v, e);
  }) : n.length > 3 && (r = function(d, f, v) {
    return n.call(this, d, f, v, e);
  }));
  const l = o[t](r, ...s);
  return a ? Ne(e, l) : l;
}
function Hn(e, t, n) {
  const s = /* @__PURE__ */ z(e);
  ue(s, "iterate", Bt);
  const o = s[t](...n);
  return (o === -1 || o === !1) && /* @__PURE__ */ hs(n[0]) ? (n[0] = /* @__PURE__ */ z(n[0]), s[t](...n)) : o;
}
function Mt(e, t, n = []) {
  Qe(), ls();
  const s = (/* @__PURE__ */ z(e))[t].apply(e, n);
  return cs(), et(), s;
}
const Pi = /* @__PURE__ */ os("__proto__,__v_isRef,__isVue"), So = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Be)
);
function ki(e) {
  Be(e) || (e = String(e));
  const t = /* @__PURE__ */ z(this);
  return ue(t, "has", e), t.hasOwnProperty(e);
}
class Co {
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
      return s === (o ? i ? Li : Oo : i ? Eo : Ao).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const r = D(t);
    if (!o) {
      let l;
      if (r && (l = Mi[n]))
        return l;
      if (n === "hasOwnProperty")
        return ki;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ fe(t) ? t : s
    );
    if ((Be(n) ? So.has(n) : Pi(n)) || (o || ue(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ fe(a)) {
      const l = r && rs(n) ? a : a.value;
      return o && W(l) ? /* @__PURE__ */ Xn(l) : l;
    }
    return W(a) ? o ? /* @__PURE__ */ Xn(a) : /* @__PURE__ */ Wt(a) : a;
  }
}
class To extends Co {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, o) {
    let i = t[n];
    const r = D(t) && rs(n);
    if (!this._isShallow) {
      const d = /* @__PURE__ */ tt(i);
      if (!/* @__PURE__ */ Ee(s) && !/* @__PURE__ */ tt(s) && (i = /* @__PURE__ */ z(i), s = /* @__PURE__ */ z(s)), !r && /* @__PURE__ */ fe(i) && !/* @__PURE__ */ fe(s))
        return d || (i.value = s), !0;
    }
    const a = r ? Number(n) < t.length : B(t, n), l = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ fe(t) ? t : o
    );
    return t === /* @__PURE__ */ z(o) && (a ? Le(s, i) && Xe(t, "set", n, s) : Xe(t, "add", n, s)), l;
  }
  deleteProperty(t, n) {
    const s = B(t, n);
    t[n];
    const o = Reflect.deleteProperty(t, n);
    return o && s && Xe(t, "delete", n, void 0), o;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Be(n) || !So.has(n)) && ue(t, "has", n), s;
  }
  ownKeys(t) {
    return ue(
      t,
      "iterate",
      D(t) ? "length" : dt
    ), Reflect.ownKeys(t);
  }
}
class Di extends Co {
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
const $i = /* @__PURE__ */ new To(), Fi = /* @__PURE__ */ new Di(), ji = /* @__PURE__ */ new To(!0);
const Yn = (e) => e, nn = (e) => Reflect.getPrototypeOf(e);
function Ki(e, t, n) {
  return function(...s) {
    const o = this.__v_raw, i = /* @__PURE__ */ z(o), r = yt(i), a = e === "entries" || e === Symbol.iterator && r, l = e === "keys" && r, d = o[e](...s), f = n ? Yn : t ? Ct : Re;
    return !t && ue(
      i,
      "iterate",
      l ? Gn : dt
    ), ae(
      // inheriting all iterator properties
      Object.create(d),
      {
        // iterator protocol
        next() {
          const { value: v, done: O } = d.next();
          return O ? { value: v, done: O } : {
            value: a ? [f(v[0]), f(v[1])] : f(v),
            done: O
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
function Vi(e, t) {
  const n = {
    get(o) {
      const i = this.__v_raw, r = /* @__PURE__ */ z(i), a = /* @__PURE__ */ z(o);
      e || (Le(o, a) && ue(r, "get", o), ue(r, "get", a));
      const { has: l } = nn(r), d = t ? Yn : e ? Ct : Re;
      if (l.call(r, o))
        return d(i.get(o));
      if (l.call(r, a))
        return d(i.get(a));
      i !== r && i.get(o);
    },
    get size() {
      const o = this.__v_raw;
      return !e && ue(/* @__PURE__ */ z(o), "iterate", dt), o.size;
    },
    has(o) {
      const i = this.__v_raw, r = /* @__PURE__ */ z(i), a = /* @__PURE__ */ z(o);
      return e || (Le(o, a) && ue(r, "has", o), ue(r, "has", a)), o === a ? i.has(o) : i.has(o) || i.has(a);
    },
    forEach(o, i) {
      const r = this, a = r.__v_raw, l = /* @__PURE__ */ z(a), d = t ? Yn : e ? Ct : Re;
      return !e && ue(l, "iterate", dt), a.forEach((f, v) => o.call(i, d(f), d(v), r));
    }
  };
  return ae(
    n,
    e ? {
      add: sn("add"),
      set: sn("set"),
      delete: sn("delete"),
      clear: sn("clear")
    } : {
      add(o) {
        const i = /* @__PURE__ */ z(this), r = nn(i), a = /* @__PURE__ */ z(o), l = !t && !/* @__PURE__ */ Ee(o) && !/* @__PURE__ */ tt(o) ? a : o;
        return r.has.call(i, l) || Le(o, l) && r.has.call(i, o) || Le(a, l) && r.has.call(i, a) || (i.add(l), Xe(i, "add", l, l)), this;
      },
      set(o, i) {
        !t && !/* @__PURE__ */ Ee(i) && !/* @__PURE__ */ tt(i) && (i = /* @__PURE__ */ z(i));
        const r = /* @__PURE__ */ z(this), { has: a, get: l } = nn(r);
        let d = a.call(r, o);
        d || (o = /* @__PURE__ */ z(o), d = a.call(r, o));
        const f = l.call(r, o);
        return r.set(o, i), d ? Le(i, f) && Xe(r, "set", o, i) : Xe(r, "add", o, i), this;
      },
      delete(o) {
        const i = /* @__PURE__ */ z(this), { has: r, get: a } = nn(i);
        let l = r.call(i, o);
        l || (o = /* @__PURE__ */ z(o), l = r.call(i, o)), a && a.call(i, o);
        const d = i.delete(o);
        return l && Xe(i, "delete", o, void 0), d;
      },
      clear() {
        const o = /* @__PURE__ */ z(this), i = o.size !== 0, r = o.clear();
        return i && Xe(
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
function ps(e, t) {
  const n = Vi(e, t);
  return (s, o, i) => o === "__v_isReactive" ? !e : o === "__v_isReadonly" ? e : o === "__v_raw" ? s : Reflect.get(
    B(n, o) && o in s ? n : s,
    o,
    i
  );
}
const Hi = {
  get: /* @__PURE__ */ ps(!1, !1)
}, Ni = {
  get: /* @__PURE__ */ ps(!1, !0)
}, Ui = {
  get: /* @__PURE__ */ ps(!0, !1)
};
const Ao = /* @__PURE__ */ new WeakMap(), Eo = /* @__PURE__ */ new WeakMap(), Oo = /* @__PURE__ */ new WeakMap(), Li = /* @__PURE__ */ new WeakMap();
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
function Wt(e) {
  return /* @__PURE__ */ tt(e) ? e : ds(
    e,
    !1,
    $i,
    Hi,
    Ao
  );
}
// @__NO_SIDE_EFFECTS__
function Wi(e) {
  return ds(
    e,
    !1,
    ji,
    Ni,
    Eo
  );
}
// @__NO_SIDE_EFFECTS__
function Xn(e) {
  return ds(
    e,
    !0,
    Fi,
    Ui,
    Oo
  );
}
function ds(e, t, n, s, o) {
  if (!W(e) || e.__v_raw && !(t && e.__v_isReactive))
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
function z(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ z(t) : e;
}
function qi(e) {
  return !B(e, "__v_skip") && Object.isExtensible(e) && uo(e, "__v_skip", !0), e;
}
const Re = (e) => W(e) ? /* @__PURE__ */ Wt(e) : e, Ct = (e) => W(e) ? /* @__PURE__ */ Xn(e) : e;
// @__NO_SIDE_EFFECTS__
function fe(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function on(e) {
  return Ji(e, !1);
}
function Ji(e, t) {
  return /* @__PURE__ */ fe(e) ? e : new Gi(e, t);
}
class Gi {
  constructor(t, n) {
    this.dep = new fs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ z(t), this._value = n ? t : Re(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ Ee(t) || /* @__PURE__ */ tt(t);
    t = s ? t : /* @__PURE__ */ z(t), Le(t, n) && (this._rawValue = t, this._value = s ? t : Re(t), this.dep.trigger());
  }
}
function I(e) {
  return /* @__PURE__ */ fe(e) ? e.value : e;
}
const Yi = {
  get: (e, t, n) => t === "__v_raw" ? e : I(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const o = e[t];
    return /* @__PURE__ */ fe(o) && !/* @__PURE__ */ fe(n) ? (o.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Io(e) {
  return /* @__PURE__ */ ht(e) ? e : new Proxy(e, Yi);
}
class Xi {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new fs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = zt - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    X !== this)
      return vo(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return yo(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Zi(e, t, n = !1) {
  let s, o;
  return V(e) ? s = e : (s = e.get, o = e.set), new Xi(s, o, n);
}
const rn = {}, fn = /* @__PURE__ */ new WeakMap();
let ft;
function Qi(e, t = !1, n = ft) {
  if (n) {
    let s = fn.get(n);
    s || fn.set(n, s = []), s.push(e);
  }
}
function er(e, t, n = J) {
  const { immediate: s, deep: o, once: i, scheduler: r, augmentJob: a, call: l } = n, d = (P) => o ? P : /* @__PURE__ */ Ee(P) || o === !1 || o === 0 ? Ze(P, 1) : Ze(P);
  let f, v, O, M, L = !1, j = !1;
  if (/* @__PURE__ */ fe(e) ? (v = () => e.value, L = /* @__PURE__ */ Ee(e)) : /* @__PURE__ */ ht(e) ? (v = () => d(e), L = !0) : D(e) ? (j = !0, L = e.some((P) => /* @__PURE__ */ ht(P) || /* @__PURE__ */ Ee(P)), v = () => e.map((P) => {
    if (/* @__PURE__ */ fe(P))
      return P.value;
    if (/* @__PURE__ */ ht(P))
      return d(P);
    if (V(P))
      return l ? l(P, 2) : P();
  })) : V(e) ? t ? v = l ? () => l(e, 2) : e : v = () => {
    if (O) {
      Qe();
      try {
        O();
      } finally {
        et();
      }
    }
    const P = ft;
    ft = f;
    try {
      return l ? l(e, 3, [M]) : e(M);
    } finally {
      ft = P;
    }
  } : v = ze, t && o) {
    const P = v, Z = o === !0 ? 1 / 0 : o;
    v = () => Ze(P(), Z);
  }
  const K = Ei(), G = () => {
    f.stop(), K && K.active && is(K.effects, f);
  };
  if (i && t) {
    const P = t;
    t = (...Z) => {
      P(...Z), G();
    };
  }
  let N = j ? new Array(e.length).fill(rn) : rn;
  const $ = (P) => {
    if (!(!(f.flags & 1) || !f.dirty && !P))
      if (t) {
        const Z = f.run();
        if (o || L || (j ? Z.some((pe, Ce) => Le(pe, N[Ce])) : Le(Z, N))) {
          O && O();
          const pe = ft;
          ft = f;
          try {
            const Ce = [
              Z,
              // pass undefined as the old value when it's changed for the first time
              N === rn ? void 0 : j && N[0] === rn ? [] : N,
              M
            ];
            N = Z, l ? l(t, 3, Ce) : (
              // @ts-expect-error
              t(...Ce)
            );
          } finally {
            ft = pe;
          }
        }
      } else
        f.run();
  };
  return a && a($), f = new mo(v), f.scheduler = r ? () => r($, !1) : $, M = (P) => Qi(P, !1, f), O = f.onStop = () => {
    const P = fn.get(f);
    if (P) {
      if (l)
        l(P, 4);
      else
        for (const Z of P) Z();
      fn.delete(f);
    }
  }, t ? s ? $(!0) : N = f.run() : r ? r($.bind(null, !0), !0) : f.run(), G.pause = f.pause.bind(f), G.resume = f.resume.bind(f), G.stop = G, G;
}
function Ze(e, t = 1 / 0, n) {
  if (t <= 0 || !W(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ fe(e))
    Ze(e.value, t, n);
  else if (D(e))
    for (let s = 0; s < e.length; s++)
      Ze(e[s], t, n);
  else if (Cn(e) || yt(e))
    e.forEach((s) => {
      Ze(s, t, n);
    });
  else if (lo(e)) {
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
  } catch (o) {
    In(o, t, n);
  }
}
function We(e, t, n, s) {
  if (V(e)) {
    const o = Zt(e, t, n, s);
    return o && ro(o) && o.catch((i) => {
      In(i, t, n);
    }), o;
  }
  if (D(e)) {
    const o = [];
    for (let i = 0; i < e.length; i++)
      o.push(We(e[i], t, n, s));
    return o;
  }
}
function In(e, t, n, s = !0) {
  const o = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: r } = t && t.appContext.config || J;
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
      Qe(), Zt(i, null, 10, [
        e,
        l,
        d
      ]), et();
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
const he = [];
let He = -1;
const _t = [];
let ot = null, vt = 0;
const Mo = /* @__PURE__ */ Promise.resolve();
let pn = null;
function Kt(e) {
  const t = pn || Mo;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function nr(e) {
  let t = He + 1, n = he.length;
  for (; t < n; ) {
    const s = t + n >>> 1, o = he[s], i = qt(o);
    i < e || i === e && o.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function ms(e) {
  if (!(e.flags & 1)) {
    const t = qt(e), n = he[he.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= qt(n) ? he.push(e) : he.splice(nr(t), 0, e), e.flags |= 1, Ro();
  }
}
function Ro() {
  pn || (pn = Mo.then(ko));
}
function sr(e) {
  D(e) ? _t.push(...e) : ot && e.id === -1 ? ot.splice(vt + 1, 0, e) : e.flags & 1 || (_t.push(e), e.flags |= 1), Ro();
}
function Is(e, t, n = He + 1) {
  for (; n < he.length; n++) {
    const s = he[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      he.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Po(e) {
  if (_t.length) {
    const t = [...new Set(_t)].sort(
      (n, s) => qt(n) - qt(s)
    );
    if (_t.length = 0, ot) {
      ot.push(...t);
      return;
    }
    for (ot = t, vt = 0; vt < ot.length; vt++) {
      const n = ot[vt];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    ot = null, vt = 0;
  }
}
const qt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function ko(e) {
  try {
    for (He = 0; He < he.length; He++) {
      const t = he[He];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Zt(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; He < he.length; He++) {
      const t = he[He];
      t && (t.flags &= -2);
    }
    He = -1, he.length = 0, Po(), pn = null, (he.length || _t.length) && ko();
  }
}
let Ae = null, Do = null;
function dn(e) {
  const t = Ae;
  return Ae = e, Do = e && e.type.__scopeId || null, t;
}
function or(e, t = Ae, n) {
  if (!t || e._n)
    return e;
  const s = (...o) => {
    s._d && gn(-1);
    const i = dn(t);
    let r;
    try {
      r = e(...o);
    } finally {
      dn(i), s._d && gn(1);
    }
    return r;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function te(e, t) {
  if (Ae === null)
    return e;
  const n = kn(Ae), s = e.dirs || (e.dirs = []);
  for (let o = 0; o < t.length; o++) {
    let [i, r, a, l = J] = t[o];
    i && (V(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && Ze(r), s.push({
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
    l && (Qe(), We(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), et());
  }
}
function ir(e, t) {
  if (me) {
    let n = me.provides;
    const s = me.parent && me.parent.provides;
    s === n && (n = me.provides = Object.create(s)), n[e] = t;
  }
}
function cn(e, t, n = !1) {
  const s = ia();
  if (s || wt) {
    let o = wt ? wt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (o && e in o)
      return o[e];
    if (arguments.length > 1)
      return n && V(t) ? t.call(s && s.proxy) : t;
  }
}
const rr = /* @__PURE__ */ Symbol.for("v-scx"), ar = () => cn(rr);
function Vt(e, t, n) {
  return $o(e, t, n);
}
function $o(e, t, n = J) {
  const { immediate: s, deep: o, flush: i, once: r } = n, a = ae({}, n), l = t && s || !t && i !== "post";
  let d;
  if (Gt) {
    if (i === "sync") {
      const M = ar();
      d = M.__watcherHandles || (M.__watcherHandles = []);
    } else if (!l) {
      const M = () => {
      };
      return M.stop = ze, M.resume = ze, M.pause = ze, M;
    }
  }
  const f = me;
  a.call = (M, L, j) => We(M, f, L, j);
  let v = !1;
  i === "post" ? a.scheduler = (M) => {
    ve(M, f && f.suspense);
  } : i !== "sync" && (v = !0, a.scheduler = (M, L) => {
    L ? M() : ms(M);
  }), a.augmentJob = (M) => {
    t && (M.flags |= 4), v && (M.flags |= 2, f && (M.id = f.uid, M.i = f));
  };
  const O = er(e, t, a);
  return Gt && (d ? d.push(O) : l && O()), O;
}
function lr(e, t, n) {
  const s = this.proxy, o = Q(e) ? e.includes(".") ? Fo(s, e) : () => s[e] : e.bind(s, s);
  let i;
  V(t) ? i = t : (i = t.handler, n = t);
  const r = Qt(this), a = $o(o, i.bind(s), n);
  return r(), a;
}
function Fo(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let o = 0; o < n.length && s; o++)
      s = s[n[o]];
    return s;
  };
}
const cr = /* @__PURE__ */ Symbol("_vte"), ur = (e) => e.__isTeleport, fr = /* @__PURE__ */ Symbol("_leaveCb");
function gs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, gs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Ms(e, t) {
  return V(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    ae({ name: e.name }, t, { setup: e })
  ) : e;
}
function jo(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Rs(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const hn = /* @__PURE__ */ new WeakMap();
function Ht(e, t, n, s, o = !1) {
  if (D(e)) {
    e.forEach(
      (j, K) => Ht(
        j,
        t && (D(t) ? t[K] : t),
        n,
        s,
        o
      )
    );
    return;
  }
  if (Nt(s) && !o) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ht(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? kn(s.component) : s.el, r = o ? null : i, { i: a, r: l } = e, d = t && t.r, f = a.refs === J ? a.refs = {} : a.refs, v = a.setupState, O = /* @__PURE__ */ z(v), M = v === J ? io : (j) => Rs(f, j) ? !1 : B(O, j), L = (j, K) => !(K && Rs(f, K));
  if (d != null && d !== l) {
    if (Ps(t), Q(d))
      f[d] = null, M(d) && (v[d] = null);
    else if (/* @__PURE__ */ fe(d)) {
      const j = t;
      L(d, j.k) && (d.value = null), j.k && (f[j.k] = null);
    }
  }
  if (V(l))
    Zt(l, a, 12, [r, f]);
  else {
    const j = Q(l), K = /* @__PURE__ */ fe(l);
    if (j || K) {
      const G = () => {
        if (e.f) {
          const N = j ? M(l) ? v[l] : f[l] : L() || !e.k ? l.value : f[e.k];
          if (o)
            D(N) && is(N, i);
          else if (D(N))
            N.includes(i) || N.push(i);
          else if (j)
            f[l] = [i], M(l) && (v[l] = f[l]);
          else {
            const $ = [i];
            L(l, e.k) && (l.value = $), e.k && (f[e.k] = $);
          }
        } else j ? (f[l] = r, M(l) && (v[l] = r)) : K && (L(l, e.k) && (l.value = r), e.k && (f[e.k] = r));
      };
      if (r) {
        const N = () => {
          G(), hn.delete(e);
        };
        N.id = -1, hn.set(e, N), ve(N, n);
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
const Nt = (e) => !!e.type.__asyncLoader, Ko = (e) => e.type.__isKeepAlive;
function pr(e, t) {
  Vo(e, "a", t);
}
function dr(e, t) {
  Vo(e, "da", t);
}
function Vo(e, t, n = me) {
  const s = e.__wdc || (e.__wdc = () => {
    let o = n;
    for (; o; ) {
      if (o.isDeactivated)
        return;
      o = o.parent;
    }
    return e();
  });
  if (Mn(t, s, n), n) {
    let o = n.parent;
    for (; o && o.parent; )
      Ko(o.parent.vnode) && hr(s, t, n, o), o = o.parent;
  }
}
function hr(e, t, n, s) {
  const o = Mn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ho(() => {
    is(s[t], o);
  }, n);
}
function Mn(e, t, n = me, s = !1) {
  if (n) {
    const o = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...r) => {
      Qe();
      const a = Qt(n), l = We(t, n, e, r);
      return a(), et(), l;
    });
    return s ? o.unshift(i) : o.push(i), i;
  }
}
const nt = (e) => (t, n = me) => {
  (!Gt || e === "sp") && Mn(e, (...s) => t(...s), n);
}, mr = nt("bm"), gr = nt("m"), vr = nt(
  "bu"
), br = nt("u"), xr = nt(
  "bum"
), Ho = nt("um"), yr = nt(
  "sp"
), _r = nt("rtg"), wr = nt("rtc");
function Sr(e, t = me) {
  Mn("ec", e, t);
}
const Cr = /* @__PURE__ */ Symbol.for("v-ndc");
function an(e, t, n, s) {
  let o;
  const i = n, r = D(e);
  if (r || Q(e)) {
    const a = r && /* @__PURE__ */ ht(e);
    let l = !1, d = !1;
    a && (l = !/* @__PURE__ */ Ee(e), d = /* @__PURE__ */ tt(e), e = On(e)), o = new Array(e.length);
    for (let f = 0, v = e.length; f < v; f++)
      o[f] = t(
        l ? d ? Ct(Re(e[f])) : Re(e[f]) : e[f],
        f,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    o = new Array(e);
    for (let a = 0; a < e; a++)
      o[a] = t(a + 1, a, void 0, i);
  } else if (W(e))
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
const Zn = (e) => e ? ri(e) ? kn(e) : Zn(e.parent) : null, Ut = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ ae(/* @__PURE__ */ Object.create(null), {
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
    $options: (e) => Uo(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      ms(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = Kt.bind(e.proxy)),
    $watch: (e) => lr.bind(e)
  })
), Nn = (e, t) => e !== J && !e.__isScriptSetup && B(e, t), Tr = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: o, props: i, accessCache: r, type: a, appContext: l } = e;
    if (t[0] !== "$") {
      const O = r[t];
      if (O !== void 0)
        switch (O) {
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
        if (Nn(s, t))
          return r[t] = 1, s[t];
        if (o !== J && B(o, t))
          return r[t] = 2, o[t];
        if (B(i, t))
          return r[t] = 3, i[t];
        if (n !== J && B(n, t))
          return r[t] = 4, n[t];
        Qn && (r[t] = 0);
      }
    }
    const d = Ut[t];
    let f, v;
    if (d)
      return t === "$attrs" && ue(e.attrs, "get", ""), d(e);
    if (
      // css module (injected by vue-loader)
      (f = a.__cssModules) && (f = f[t])
    )
      return f;
    if (n !== J && B(n, t))
      return r[t] = 4, n[t];
    if (
      // global properties
      v = l.config.globalProperties, B(v, t)
    )
      return v[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: o, ctx: i } = e;
    return Nn(o, t) ? (o[t] = n, !0) : s !== J && B(s, t) ? (s[t] = n, !0) : B(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: o, props: i, type: r }
  }, a) {
    let l;
    return !!(n[a] || e !== J && a[0] !== "$" && B(e, a) || Nn(t, a) || B(i, a) || B(s, a) || B(Ut, a) || B(o.config.globalProperties, a) || (l = r.__cssModules) && l[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : B(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function ks(e) {
  return D(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let Qn = !0;
function Ar(e) {
  const t = Uo(e), n = e.proxy, s = e.ctx;
  Qn = !1, t.beforeCreate && Ds(t.beforeCreate, e, "bc");
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
    mounted: O,
    beforeUpdate: M,
    updated: L,
    activated: j,
    deactivated: K,
    beforeDestroy: G,
    beforeUnmount: N,
    destroyed: $,
    unmounted: P,
    render: Z,
    renderTracked: pe,
    renderTriggered: Ce,
    errorCaptured: Pe,
    serverPrefetch: mt,
    // public API
    expose: ke,
    inheritAttrs: at,
    // assets
    components: st,
    directives: De,
    filters: At
  } = t;
  if (d && Er(d, s, null), r)
    for (const h in r) {
      const p = r[h];
      V(p) && (s[h] = p.bind(n));
    }
  if (o) {
    const h = o.call(n, n);
    W(h) && (e.data = /* @__PURE__ */ Wt(h));
  }
  if (Qn = !0, i)
    for (const h in i) {
      const p = i[h], T = V(p) ? p.bind(n, n) : V(p.get) ? p.get.bind(n, n) : ze, qe = !V(p) && V(p.set) ? p.set.bind(n) : ze, lt = bt({
        get: T,
        set: qe
      });
      Object.defineProperty(s, h, {
        enumerable: !0,
        configurable: !0,
        get: () => lt.value,
        set: ($e) => lt.value = $e
      });
    }
  if (a)
    for (const h in a)
      No(a[h], s, n, h);
  if (l) {
    const h = V(l) ? l.call(n) : l;
    Reflect.ownKeys(h).forEach((p) => {
      ir(p, h[p]);
    });
  }
  f && Ds(f, e, "c");
  function A(h, p) {
    D(p) ? p.forEach((T) => h(T.bind(n))) : p && h(p.bind(n));
  }
  if (A(mr, v), A(gr, O), A(vr, M), A(br, L), A(pr, j), A(dr, K), A(Sr, Pe), A(wr, pe), A(_r, Ce), A(xr, N), A(Ho, P), A(yr, mt), D(ke))
    if (ke.length) {
      const h = e.exposed || (e.exposed = {});
      ke.forEach((p) => {
        Object.defineProperty(h, p, {
          get: () => n[p],
          set: (T) => n[p] = T,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  Z && e.render === ze && (e.render = Z), at != null && (e.inheritAttrs = at), st && (e.components = st), De && (e.directives = De), mt && jo(e);
}
function Er(e, t, n = ze) {
  D(e) && (e = es(e));
  for (const s in e) {
    const o = e[s];
    let i;
    W(o) ? "default" in o ? i = cn(
      o.from || s,
      o.default,
      !0
    ) : i = cn(o.from || s) : i = cn(o), /* @__PURE__ */ fe(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (r) => i.value = r
    }) : t[s] = i;
  }
}
function Ds(e, t, n) {
  We(
    D(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function No(e, t, n, s) {
  let o = s.includes(".") ? Fo(n, s) : () => n[s];
  if (Q(e)) {
    const i = t[e];
    V(i) && Vt(o, i);
  } else if (V(e))
    Vt(o, e.bind(n));
  else if (W(e))
    if (D(e))
      e.forEach((i) => No(i, t, n, s));
    else {
      const i = V(e.handler) ? e.handler.bind(n) : t[e.handler];
      V(i) && Vt(o, i, e);
    }
}
function Uo(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: o,
    optionsCache: i,
    config: { optionMergeStrategies: r }
  } = e.appContext, a = i.get(t);
  let l;
  return a ? l = a : !o.length && !n && !s ? l = t : (l = {}, o.length && o.forEach(
    (d) => mn(l, d, r, !0)
  ), mn(l, t, r)), W(t) && i.set(t, l), l;
}
function mn(e, t, n, s = !1) {
  const { mixins: o, extends: i } = t;
  i && mn(e, i, n, !0), o && o.forEach(
    (r) => mn(e, r, n, !0)
  );
  for (const r in t)
    if (!(s && r === "expose")) {
      const a = Or[r] || n && n[r];
      e[r] = a ? a(e[r], t[r]) : t[r];
    }
  return e;
}
const Or = {
  data: $s,
  props: Fs,
  emits: Fs,
  // objects
  methods: kt,
  computed: kt,
  // lifecycle
  beforeCreate: de,
  created: de,
  beforeMount: de,
  mounted: de,
  beforeUpdate: de,
  updated: de,
  beforeDestroy: de,
  beforeUnmount: de,
  destroyed: de,
  unmounted: de,
  activated: de,
  deactivated: de,
  errorCaptured: de,
  serverPrefetch: de,
  // assets
  components: kt,
  directives: kt,
  // watch
  watch: Mr,
  // provide / inject
  provide: $s,
  inject: Ir
};
function $s(e, t) {
  return t ? e ? function() {
    return ae(
      V(e) ? e.call(this, this) : e,
      V(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ir(e, t) {
  return kt(es(e), es(t));
}
function es(e) {
  if (D(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function de(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function kt(e, t) {
  return e ? ae(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Fs(e, t) {
  return e ? D(e) && D(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : ae(
    /* @__PURE__ */ Object.create(null),
    ks(e),
    ks(t ?? {})
  ) : t;
}
function Mr(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = ae(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = de(e[s], t[s]);
  return n;
}
function Lo() {
  return {
    app: null,
    config: {
      isNativeTag: io,
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
let Rr = 0;
function Pr(e, t) {
  return function(s, o = null) {
    V(s) || (s = ae({}, s)), o != null && !W(o) && (o = null);
    const i = Lo(), r = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const d = i.app = {
      _uid: Rr++,
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
        return r.has(f) || (f && V(f.install) ? (r.add(f), f.install(d, ...v)) : V(f) && (r.add(f), f(d, ...v))), d;
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
      mount(f, v, O) {
        if (!l) {
          const M = d._ceVNode || se(s, o);
          return M.appContext = i, O === !0 ? O = "svg" : O === !1 && (O = void 0), e(M, f, O), l = !0, d._container = f, f.__vue_app__ = d, kn(M.component);
        }
      },
      onUnmount(f) {
        a.push(f);
      },
      unmount() {
        l && (We(
          a,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(f, v) {
        return i.provides[f] = v, d;
      },
      runWithContext(f) {
        const v = wt;
        wt = d;
        try {
          return f();
        } finally {
          wt = v;
        }
      }
    };
    return d;
  };
}
let wt = null;
const kr = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ie(t)}Modifiers`] || e[`${rt(t)}Modifiers`];
function Dr(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || J;
  let o = n;
  const i = t.startsWith("update:"), r = i && kr(s, t.slice(7));
  r && (r.trim && (o = n.map((f) => Q(f) ? f.trim() : f)), r.number && (o = n.map(An)));
  let a, l = s[a = Fn(t)] || // also try camelCase event handler (#2249)
  s[a = Fn(Ie(t))];
  !l && i && (l = s[a = Fn(rt(t))]), l && We(
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
    e.emitted[a] = !0, We(
      d,
      e,
      6,
      o
    );
  }
}
const $r = /* @__PURE__ */ new WeakMap();
function zo(e, t, n = !1) {
  const s = n ? $r : t.emitsCache, o = s.get(e);
  if (o !== void 0)
    return o;
  const i = e.emits;
  let r = {}, a = !1;
  if (!V(e)) {
    const l = (d) => {
      const f = zo(d, t, !0);
      f && (a = !0, ae(r, f));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !i && !a ? (W(e) && s.set(e, null), null) : (D(i) ? i.forEach((l) => r[l] = null) : ae(r, i), W(e) && s.set(e, r), r);
}
function Rn(e, t) {
  return !e || !wn(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), B(e, t[0].toLowerCase() + t.slice(1)) || B(e, rt(t)) || B(e, t));
}
function js(e) {
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
    data: O,
    setupState: M,
    ctx: L,
    inheritAttrs: j
  } = e, K = dn(e);
  let G, N;
  try {
    if (n.shapeFlag & 4) {
      const P = o || s, Z = P;
      G = Ue(
        d.call(
          Z,
          P,
          f,
          v,
          M,
          O,
          L
        )
      ), N = a;
    } else {
      const P = t;
      G = Ue(
        P.length > 1 ? P(
          v,
          { attrs: a, slots: r, emit: l }
        ) : P(
          v,
          null
        )
      ), N = t.props ? a : Fr(a);
    }
  } catch (P) {
    Lt.length = 0, In(P, e, 1), G = se(it);
  }
  let $ = G;
  if (N && j !== !1) {
    const P = Object.keys(N), { shapeFlag: Z } = $;
    P.length && Z & 7 && (i && P.some(Sn) && (N = jr(
      N,
      i
    )), $ = Tt($, N, !1, !0));
  }
  return n.dirs && ($ = Tt($, null, !1, !0), $.dirs = $.dirs ? $.dirs.concat(n.dirs) : n.dirs), n.transition && gs($, n.transition), G = $, dn(K), G;
}
const Fr = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || wn(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, jr = (e, t) => {
  const n = {};
  for (const s in e)
    (!Sn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
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
      return s ? Ks(s, r, d) : !!r;
    if (l & 8) {
      const f = t.dynamicProps;
      for (let v = 0; v < f.length; v++) {
        const O = f[v];
        if (Bo(r, s, O) && !Rn(d, O))
          return !0;
      }
    }
  } else
    return (o || a) && (!a || !a.$stable) ? !0 : s === r ? !1 : s ? r ? Ks(s, r, d) : !0 : !!r;
  return !1;
}
function Ks(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let o = 0; o < s.length; o++) {
    const i = s[o];
    if (Bo(t, e, i) && !Rn(n, i))
      return !0;
  }
  return !1;
}
function Bo(e, t, n) {
  const s = e[n], o = t[n];
  return n === "style" && W(s) && W(o) ? !Xt(s, o) : s !== o;
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
const Wo = {}, qo = () => Object.create(Wo), Jo = (e) => Object.getPrototypeOf(e) === Wo;
function Hr(e, t, n, s = !1) {
  const o = {}, i = qo();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Go(e, t, o, i);
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
        let O = f[v];
        if (Rn(e.emitsOptions, O))
          continue;
        const M = t[O];
        if (l)
          if (B(i, O))
            M !== i[O] && (i[O] = M, d = !0);
          else {
            const L = Ie(O);
            o[L] = ts(
              l,
              a,
              L,
              M,
              e,
              !1
            );
          }
        else
          M !== i[O] && (i[O] = M, d = !0);
      }
    }
  } else {
    Go(e, t, o, i) && (d = !0);
    let f;
    for (const v in a)
      (!t || // for camelCase
      !B(t, v) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((f = rt(v)) === v || !B(t, f))) && (l ? n && // for camelCase
      (n[v] !== void 0 || // for kebab-case
      n[f] !== void 0) && (o[v] = ts(
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
  d && Xe(e.attrs, "set", "");
}
function Go(e, t, n, s) {
  const [o, i] = e.propsOptions;
  let r = !1, a;
  if (t)
    for (let l in t) {
      if ($t(l))
        continue;
      const d = t[l];
      let f;
      o && B(o, f = Ie(l)) ? !i || !i.includes(f) ? n[f] = d : (a || (a = {}))[f] = d : Rn(e.emitsOptions, l) || (!(l in s) || d !== s[l]) && (s[l] = d, r = !0);
    }
  if (i) {
    const l = /* @__PURE__ */ z(n), d = a || J;
    for (let f = 0; f < i.length; f++) {
      const v = i[f];
      n[v] = ts(
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
function ts(e, t, n, s, o, i) {
  const r = e[n];
  if (r != null) {
    const a = B(r, "default");
    if (a && s === void 0) {
      const l = r.default;
      if (r.type !== Function && !r.skipFactory && V(l)) {
        const { propsDefaults: d } = o;
        if (n in d)
          s = d[n];
        else {
          const f = Qt(o);
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
    ] && (s === "" || s === rt(n)) && (s = !0));
  }
  return s;
}
const Ur = /* @__PURE__ */ new WeakMap();
function Yo(e, t, n = !1) {
  const s = n ? Ur : t.propsCache, o = s.get(e);
  if (o)
    return o;
  const i = e.props, r = {}, a = [];
  let l = !1;
  if (!V(e)) {
    const f = (v) => {
      l = !0;
      const [O, M] = Yo(v, t, !0);
      ae(r, O), M && a.push(...M);
    };
    !n && t.mixins.length && t.mixins.forEach(f), e.extends && f(e.extends), e.mixins && e.mixins.forEach(f);
  }
  if (!i && !l)
    return W(e) && s.set(e, xt), xt;
  if (D(i))
    for (let f = 0; f < i.length; f++) {
      const v = Ie(i[f]);
      Vs(v) && (r[v] = J);
    }
  else if (i)
    for (const f in i) {
      const v = Ie(f);
      if (Vs(v)) {
        const O = i[f], M = r[v] = D(O) || V(O) ? { type: O } : ae({}, O), L = M.type;
        let j = !1, K = !0;
        if (D(L))
          for (let G = 0; G < L.length; ++G) {
            const N = L[G], $ = V(N) && N.name;
            if ($ === "Boolean") {
              j = !0;
              break;
            } else $ === "String" && (K = !1);
          }
        else
          j = V(L) && L.name === "Boolean";
        M[
          0
          /* shouldCast */
        ] = j, M[
          1
          /* shouldCastTrue */
        ] = K, (j || B(M, "default")) && a.push(v);
      }
    }
  const d = [r, a];
  return W(e) && s.set(e, d), d;
}
function Vs(e) {
  return e[0] !== "$" && !$t(e);
}
const vs = (e) => e === "_" || e === "_ctx" || e === "$stable", bs = (e) => D(e) ? e.map(Ue) : [Ue(e)], Lr = (e, t, n) => {
  if (t._n)
    return t;
  const s = or((...o) => bs(t(...o)), n);
  return s._c = !1, s;
}, Xo = (e, t, n) => {
  const s = e._ctx;
  for (const o in e) {
    if (vs(o)) continue;
    const i = e[o];
    if (V(i))
      t[o] = Lr(o, i, s);
    else if (i != null) {
      const r = bs(i);
      t[o] = () => r;
    }
  }
}, Zo = (e, t) => {
  const n = bs(t);
  e.slots.default = () => n;
}, Qo = (e, t, n) => {
  for (const s in t)
    (n || !vs(s)) && (e[s] = t[s]);
}, zr = (e, t, n) => {
  const s = e.slots = qo();
  if (e.vnode.shapeFlag & 32) {
    const o = t._;
    o ? (Qo(s, t, n), n && uo(s, "_", o, !0)) : Xo(t, s);
  } else t && Zo(e, t);
}, Br = (e, t, n) => {
  const { vnode: s, slots: o } = e;
  let i = !0, r = J;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : Qo(o, t, n) : (i = !t.$stable, Xo(t, o)), r = t;
  } else t && (Zo(e, t), r = { default: 1 });
  if (i)
    for (const a in o)
      !vs(a) && r[a] == null && delete o[a];
}, ve = Yr;
function Wr(e) {
  return qr(e);
}
function qr(e, t) {
  const n = En();
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
    nextSibling: O,
    setScopeId: M = ze,
    insertStaticContent: L
  } = e, j = (c, u, g, _ = null, b = null, x = null, C = void 0, S = null, w = !!u.dynamicChildren) => {
    if (c === u)
      return;
    c && !Rt(c, u) && (_ = tn(c), $e(c, b, x, !0), c = null), u.patchFlag === -2 && (w = !1, u.dynamicChildren = null);
    const { type: y, ref: k, shapeFlag: E } = u;
    switch (y) {
      case Pn:
        K(c, u, g, _);
        break;
      case it:
        G(c, u, g, _);
        break;
      case Ln:
        c == null && N(u, g, _, C);
        break;
      case we:
        st(
          c,
          u,
          g,
          _,
          b,
          x,
          C,
          S,
          w
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
          C,
          S,
          w
        ) : E & 6 ? De(
          c,
          u,
          g,
          _,
          b,
          x,
          C,
          S,
          w
        ) : (E & 64 || E & 128) && y.process(
          c,
          u,
          g,
          _,
          b,
          x,
          C,
          S,
          w,
          Ot
        );
    }
    k != null && b ? Ht(k, c && c.ref, x, u || c, !u) : k == null && c && c.ref != null && Ht(c.ref, null, x, c, !0);
  }, K = (c, u, g, _) => {
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
  }, G = (c, u, g, _) => {
    c == null ? s(
      u.el = l(u.children || ""),
      g,
      _
    ) : u.el = c.el;
  }, N = (c, u, g, _) => {
    [c.el, c.anchor] = L(
      c.children,
      u,
      g,
      _,
      c.el,
      c.anchor
    );
  }, $ = ({ el: c, anchor: u }, g, _) => {
    let b;
    for (; c && c !== u; )
      b = O(c), s(c, g, _), c = b;
    s(u, g, _);
  }, P = ({ el: c, anchor: u }) => {
    let g;
    for (; c && c !== u; )
      g = O(c), o(c), c = g;
    o(u);
  }, Z = (c, u, g, _, b, x, C, S, w) => {
    if (u.type === "svg" ? C = "svg" : u.type === "math" && (C = "mathml"), c == null)
      pe(
        u,
        g,
        _,
        b,
        x,
        C,
        S,
        w
      );
    else {
      const y = c.el && c.el._isVueCE ? c.el : null;
      try {
        y && y._beginPatch(), mt(
          c,
          u,
          b,
          x,
          C,
          S,
          w
        );
      } finally {
        y && y._endPatch();
      }
    }
  }, pe = (c, u, g, _, b, x, C, S) => {
    let w, y;
    const { props: k, shapeFlag: E, transition: R, dirs: F } = c;
    if (w = c.el = r(
      c.type,
      x,
      k && k.is,
      k
    ), E & 8 ? f(w, c.children) : E & 16 && Pe(
      c.children,
      w,
      null,
      _,
      b,
      Un(c, x),
      C,
      S
    ), F && ct(c, null, _, "created"), Ce(w, c, c.scopeId, C, _), k) {
      for (const q in k)
        q !== "value" && !$t(q) && i(w, q, null, k[q], x, _);
      "value" in k && i(w, "value", null, k.value, x), (y = k.onVnodeBeforeMount) && Ve(y, _, c);
    }
    F && ct(c, null, _, "beforeMount");
    const U = Jr(b, R);
    U && R.beforeEnter(w), s(w, u, g), ((y = k && k.onVnodeMounted) || U || F) && ve(() => {
      try {
        y && Ve(y, _, c), U && R.enter(w), F && ct(c, null, _, "mounted");
      } finally {
      }
    }, b);
  }, Ce = (c, u, g, _, b) => {
    if (g && M(c, g), _)
      for (let x = 0; x < _.length; x++)
        M(c, _[x]);
    if (b) {
      let x = b.subTree;
      if (u === x || si(x.type) && (x.ssContent === u || x.ssFallback === u)) {
        const C = b.vnode;
        Ce(
          c,
          C,
          C.scopeId,
          C.slotScopeIds,
          b.parent
        );
      }
    }
  }, Pe = (c, u, g, _, b, x, C, S, w = 0) => {
    for (let y = w; y < c.length; y++) {
      const k = c[y] = S ? Ye(c[y]) : Ue(c[y]);
      j(
        null,
        k,
        u,
        g,
        _,
        b,
        x,
        C,
        S
      );
    }
  }, mt = (c, u, g, _, b, x, C) => {
    const S = u.el = c.el;
    let { patchFlag: w, dynamicChildren: y, dirs: k } = u;
    w |= c.patchFlag & 16;
    const E = c.props || J, R = u.props || J;
    let F;
    if (g && ut(g, !1), (F = R.onVnodeBeforeUpdate) && Ve(F, g, u, c), k && ct(u, c, g, "beforeUpdate"), g && ut(g, !0), (E.innerHTML && R.innerHTML == null || E.textContent && R.textContent == null) && f(S, ""), y ? ke(
      c.dynamicChildren,
      y,
      S,
      g,
      _,
      Un(u, b),
      x
    ) : C || p(
      c,
      u,
      S,
      null,
      g,
      _,
      Un(u, b),
      x,
      !1
    ), w > 0) {
      if (w & 16)
        at(S, E, R, g, b);
      else if (w & 2 && E.class !== R.class && i(S, "class", null, R.class, b), w & 4 && i(S, "style", E.style, R.style, b), w & 8) {
        const U = u.dynamicProps;
        for (let q = 0; q < U.length; q++) {
          const Y = U[q], ee = E[Y], oe = R[Y];
          (oe !== ee || Y === "value") && i(S, Y, ee, oe, b, g);
        }
      }
      w & 1 && c.children !== u.children && f(S, u.children);
    } else !C && y == null && at(S, E, R, g, b);
    ((F = R.onVnodeUpdated) || k) && ve(() => {
      F && Ve(F, g, u, c), k && ct(u, c, g, "updated");
    }, _);
  }, ke = (c, u, g, _, b, x, C) => {
    for (let S = 0; S < u.length; S++) {
      const w = c[S], y = u[S], k = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        w.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (w.type === we || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Rt(w, y) || // - In the case of a component, it could contain anything.
        w.shapeFlag & 198) ? v(w.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      j(
        w,
        y,
        k,
        null,
        _,
        b,
        x,
        C,
        !0
      );
    }
  }, at = (c, u, g, _, b) => {
    if (u !== g) {
      if (u !== J)
        for (const x in u)
          !$t(x) && !(x in g) && i(
            c,
            x,
            u[x],
            null,
            b,
            _
          );
      for (const x in g) {
        if ($t(x)) continue;
        const C = g[x], S = u[x];
        C !== S && x !== "value" && i(c, x, S, C, b, _);
      }
      "value" in g && i(c, "value", u.value, g.value, b);
    }
  }, st = (c, u, g, _, b, x, C, S, w) => {
    const y = u.el = c ? c.el : a(""), k = u.anchor = c ? c.anchor : a("");
    let { patchFlag: E, dynamicChildren: R, slotScopeIds: F } = u;
    F && (S = S ? S.concat(F) : F), c == null ? (s(y, g, _), s(k, g, _), Pe(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      g,
      k,
      b,
      x,
      C,
      S,
      w
    )) : E > 0 && E & 64 && R && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    c.dynamicChildren && c.dynamicChildren.length === R.length ? (ke(
      c.dynamicChildren,
      R,
      g,
      b,
      x,
      C,
      S
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || b && u === b.subTree) && ei(
      c,
      u,
      !0
      /* shallow */
    )) : p(
      c,
      u,
      g,
      k,
      b,
      x,
      C,
      S,
      w
    );
  }, De = (c, u, g, _, b, x, C, S, w) => {
    u.slotScopeIds = S, c == null ? u.shapeFlag & 512 ? b.ctx.activate(
      u,
      g,
      _,
      C,
      w
    ) : At(
      u,
      g,
      _,
      b,
      x,
      C,
      w
    ) : en(c, u, w);
  }, At = (c, u, g, _, b, x, C) => {
    const S = c.component = oa(
      c,
      _,
      b
    );
    if (Ko(c) && (S.ctx.renderer = Ot), ra(S, !1, C), S.asyncDep) {
      if (b && b.registerDep(S, A, C), !c.el) {
        const w = S.subTree = se(it);
        G(null, w, u, g), c.placeholder = w.el;
      }
    } else
      A(
        S,
        c,
        u,
        g,
        b,
        x,
        C
      );
  }, en = (c, u, g) => {
    const _ = u.component = c.component;
    if (Kr(c, u, g))
      if (_.asyncDep && !_.asyncResolved) {
        h(_, u, g);
        return;
      } else
        _.next = u, _.update();
    else
      u.el = c.el, _.vnode = u;
  }, A = (c, u, g, _, b, x, C) => {
    const S = () => {
      if (c.isMounted) {
        let { next: E, bu: R, u: F, parent: U, vnode: q } = c;
        {
          const je = ti(c);
          if (je) {
            E && (E.el = q.el, h(c, E, C)), je.asyncDep.then(() => {
              ve(() => {
                c.isUnmounted || y();
              }, b);
            });
            return;
          }
        }
        let Y = E, ee;
        ut(c, !1), E ? (E.el = q.el, h(c, E, C)) : E = q, R && ln(R), (ee = E.props && E.props.onVnodeBeforeUpdate) && Ve(ee, U, E, q), ut(c, !0);
        const oe = js(c), Fe = c.subTree;
        c.subTree = oe, j(
          Fe,
          oe,
          // parent may have changed if it's in a teleport
          v(Fe.el),
          // anchor may have changed if it's in a fragment
          tn(Fe),
          c,
          b,
          x
        ), E.el = oe.el, Y === null && Vr(c, oe.el), F && ve(F, b), (ee = E.props && E.props.onVnodeUpdated) && ve(
          () => Ve(ee, U, E, q),
          b
        );
      } else {
        let E;
        const { el: R, props: F } = u, { bm: U, m: q, parent: Y, root: ee, type: oe } = c, Fe = Nt(u);
        ut(c, !1), U && ln(U), !Fe && (E = F && F.onVnodeBeforeMount) && Ve(E, Y, u), ut(c, !0);
        {
          ee.ce && ee.ce._hasShadowRoot() && ee.ce._injectChildStyle(
            oe,
            c.parent ? c.parent.type : void 0
          );
          const je = c.subTree = js(c);
          j(
            null,
            je,
            g,
            _,
            c,
            b,
            x
          ), u.el = je.el;
        }
        if (q && ve(q, b), !Fe && (E = F && F.onVnodeMounted)) {
          const je = u;
          ve(
            () => Ve(E, Y, je),
            b
          );
        }
        (u.shapeFlag & 256 || Y && Nt(Y.vnode) && Y.vnode.shapeFlag & 256) && c.a && ve(c.a, b), c.isMounted = !0, u = g = _ = null;
      }
    };
    c.scope.on();
    const w = c.effect = new mo(S);
    c.scope.off();
    const y = c.update = w.run.bind(w), k = c.job = w.runIfDirty.bind(w);
    k.i = c, k.id = c.uid, w.scheduler = () => ms(k), ut(c, !0), y();
  }, h = (c, u, g) => {
    u.component = c;
    const _ = c.vnode.props;
    c.vnode = u, c.next = null, Nr(c, u.props, _, g), Br(c, u.children, g), Qe(), Is(c), et();
  }, p = (c, u, g, _, b, x, C, S, w = !1) => {
    const y = c && c.children, k = c ? c.shapeFlag : 0, E = u.children, { patchFlag: R, shapeFlag: F } = u;
    if (R > 0) {
      if (R & 128) {
        qe(
          y,
          E,
          g,
          _,
          b,
          x,
          C,
          S,
          w
        );
        return;
      } else if (R & 256) {
        T(
          y,
          E,
          g,
          _,
          b,
          x,
          C,
          S,
          w
        );
        return;
      }
    }
    F & 8 ? (k & 16 && Et(y, b, x), E !== y && f(g, E)) : k & 16 ? F & 16 ? qe(
      y,
      E,
      g,
      _,
      b,
      x,
      C,
      S,
      w
    ) : Et(y, b, x, !0) : (k & 8 && f(g, ""), F & 16 && Pe(
      E,
      g,
      _,
      b,
      x,
      C,
      S,
      w
    ));
  }, T = (c, u, g, _, b, x, C, S, w) => {
    c = c || xt, u = u || xt;
    const y = c.length, k = u.length, E = Math.min(y, k);
    let R;
    for (R = 0; R < E; R++) {
      const F = u[R] = w ? Ye(u[R]) : Ue(u[R]);
      j(
        c[R],
        F,
        g,
        null,
        b,
        x,
        C,
        S,
        w
      );
    }
    y > k ? Et(
      c,
      b,
      x,
      !0,
      !1,
      E
    ) : Pe(
      u,
      g,
      _,
      b,
      x,
      C,
      S,
      w,
      E
    );
  }, qe = (c, u, g, _, b, x, C, S, w) => {
    let y = 0;
    const k = u.length;
    let E = c.length - 1, R = k - 1;
    for (; y <= E && y <= R; ) {
      const F = c[y], U = u[y] = w ? Ye(u[y]) : Ue(u[y]);
      if (Rt(F, U))
        j(
          F,
          U,
          g,
          null,
          b,
          x,
          C,
          S,
          w
        );
      else
        break;
      y++;
    }
    for (; y <= E && y <= R; ) {
      const F = c[E], U = u[R] = w ? Ye(u[R]) : Ue(u[R]);
      if (Rt(F, U))
        j(
          F,
          U,
          g,
          null,
          b,
          x,
          C,
          S,
          w
        );
      else
        break;
      E--, R--;
    }
    if (y > E) {
      if (y <= R) {
        const F = R + 1, U = F < k ? u[F].el : _;
        for (; y <= R; )
          j(
            null,
            u[y] = w ? Ye(u[y]) : Ue(u[y]),
            g,
            U,
            b,
            x,
            C,
            S,
            w
          ), y++;
      }
    } else if (y > R)
      for (; y <= E; )
        $e(c[y], b, x, !0), y++;
    else {
      const F = y, U = y, q = /* @__PURE__ */ new Map();
      for (y = U; y <= R; y++) {
        const xe = u[y] = w ? Ye(u[y]) : Ue(u[y]);
        xe.key != null && q.set(xe.key, y);
      }
      let Y, ee = 0;
      const oe = R - U + 1;
      let Fe = !1, je = 0;
      const It = new Array(oe);
      for (y = 0; y < oe; y++) It[y] = 0;
      for (y = F; y <= E; y++) {
        const xe = c[y];
        if (ee >= oe) {
          $e(xe, b, x, !0);
          continue;
        }
        let Ke;
        if (xe.key != null)
          Ke = q.get(xe.key);
        else
          for (Y = U; Y <= R; Y++)
            if (It[Y - U] === 0 && Rt(xe, u[Y])) {
              Ke = Y;
              break;
            }
        Ke === void 0 ? $e(xe, b, x, !0) : (It[Ke - U] = y + 1, Ke >= je ? je = Ke : Fe = !0, j(
          xe,
          u[Ke],
          g,
          null,
          b,
          x,
          C,
          S,
          w
        ), ee++);
      }
      const ws = Fe ? Gr(It) : xt;
      for (Y = ws.length - 1, y = oe - 1; y >= 0; y--) {
        const xe = U + y, Ke = u[xe], Ss = u[xe + 1], Cs = xe + 1 < k ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Ss.el || ni(Ss)
        ) : _;
        It[y] === 0 ? j(
          null,
          Ke,
          g,
          Cs,
          b,
          x,
          C,
          S,
          w
        ) : Fe && (Y < 0 || y !== ws[Y] ? lt(Ke, g, Cs, 2) : Y--);
      }
    }
  }, lt = (c, u, g, _, b = null) => {
    const { el: x, type: C, transition: S, children: w, shapeFlag: y } = c;
    if (y & 6) {
      lt(c.component.subTree, u, g, _);
      return;
    }
    if (y & 128) {
      c.suspense.move(u, g, _);
      return;
    }
    if (y & 64) {
      C.move(c, u, g, Ot);
      return;
    }
    if (C === we) {
      s(x, u, g);
      for (let E = 0; E < w.length; E++)
        lt(w[E], u, g, _);
      s(c.anchor, u, g);
      return;
    }
    if (C === Ln) {
      $(c, u, g);
      return;
    }
    if (_ !== 2 && y & 1 && S)
      if (_ === 0)
        S.beforeEnter(x), s(x, u, g), ve(() => S.enter(x), b);
      else {
        const { leave: E, delayLeave: R, afterLeave: F } = S, U = () => {
          c.ctx.isUnmounted ? o(x) : s(x, u, g);
        }, q = () => {
          x._isLeaving && x[fr](
            !0
            /* cancelled */
          ), E(x, () => {
            U(), F && F();
          });
        };
        R ? R(x, U, q) : q();
      }
    else
      s(x, u, g);
  }, $e = (c, u, g, _ = !1, b = !1) => {
    const {
      type: x,
      props: C,
      ref: S,
      children: w,
      dynamicChildren: y,
      shapeFlag: k,
      patchFlag: E,
      dirs: R,
      cacheIndex: F,
      memo: U
    } = c;
    if (E === -2 && (b = !1), S != null && (Qe(), Ht(S, null, g, c, !0), et()), F != null && (u.renderCache[F] = void 0), k & 256) {
      u.ctx.deactivate(c);
      return;
    }
    const q = k & 1 && R, Y = !Nt(c);
    let ee;
    if (Y && (ee = C && C.onVnodeBeforeUnmount) && Ve(ee, u, c), k & 6)
      di(c.component, g, _);
    else {
      if (k & 128) {
        c.suspense.unmount(g, _);
        return;
      }
      q && ct(c, null, u, "beforeUnmount"), k & 64 ? c.type.remove(
        c,
        u,
        g,
        Ot,
        _
      ) : y && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !y.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (x !== we || E > 0 && E & 64) ? Et(
        y,
        u,
        g,
        !1,
        !0
      ) : (x === we && E & 384 || !b && k & 16) && Et(w, u, g), _ && ys(c);
    }
    const oe = U != null && F == null;
    (Y && (ee = C && C.onVnodeUnmounted) || q || oe) && ve(() => {
      ee && Ve(ee, u, c), q && ct(c, null, u, "unmounted"), oe && (c.el = null);
    }, g);
  }, ys = (c) => {
    const { type: u, el: g, anchor: _, transition: b } = c;
    if (u === we) {
      pi(g, _);
      return;
    }
    if (u === Ln) {
      P(c);
      return;
    }
    const x = () => {
      o(g), b && !b.persisted && b.afterLeave && b.afterLeave();
    };
    if (c.shapeFlag & 1 && b && !b.persisted) {
      const { leave: C, delayLeave: S } = b, w = () => C(g, x);
      S ? S(c.el, x, w) : w();
    } else
      x();
  }, pi = (c, u) => {
    let g;
    for (; c !== u; )
      g = O(c), o(c), c = g;
    o(u);
  }, di = (c, u, g) => {
    const { bum: _, scope: b, job: x, subTree: C, um: S, m: w, a: y } = c;
    Hs(w), Hs(y), _ && ln(_), b.stop(), x && (x.flags |= 8, $e(C, c, u, g)), S && ve(S, u), ve(() => {
      c.isUnmounted = !0;
    }, u);
  }, Et = (c, u, g, _ = !1, b = !1, x = 0) => {
    for (let C = x; C < c.length; C++)
      $e(c[C], u, g, _, b);
  }, tn = (c) => {
    if (c.shapeFlag & 6)
      return tn(c.component.subTree);
    if (c.shapeFlag & 128)
      return c.suspense.next();
    const u = O(c.anchor || c.el), g = u && u[cr];
    return g ? O(g) : u;
  };
  let $n = !1;
  const _s = (c, u, g) => {
    let _;
    c == null ? u._vnode && ($e(u._vnode, null, null, !0), _ = u._vnode.component) : j(
      u._vnode || null,
      c,
      u,
      null,
      null,
      null,
      g
    ), u._vnode = c, $n || ($n = !0, Is(_), Po(), $n = !1);
  }, Ot = {
    p: j,
    um: $e,
    m: lt,
    r: ys,
    mt: At,
    mc: Pe,
    pc: p,
    pbc: ke,
    n: tn,
    o: e
  };
  return {
    render: _s,
    hydrate: void 0,
    createApp: Pr(_s)
  };
}
function Un({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function ut({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Jr(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function ei(e, t, n = !1) {
  const s = e.children, o = t.children;
  if (D(s) && D(o))
    for (let i = 0; i < s.length; i++) {
      const r = s[i];
      let a = o[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = o[i] = Ye(o[i]), a.el = r.el), !n && a.patchFlag !== -2 && ei(r, a)), a.type === Pn && (a.patchFlag === -1 && (a = o[i] = Ye(a)), a.el = r.el), a.type === it && !a.el && (a.el = r.el);
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
function ti(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : ti(t);
}
function Hs(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function ni(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? ni(t.subTree) : null;
}
const si = (e) => e.__isSuspense;
function Yr(e, t) {
  t && t.pendingBranch ? D(e) ? t.effects.push(...e) : t.effects.push(e) : sr(e);
}
const we = /* @__PURE__ */ Symbol.for("v-fgt"), Pn = /* @__PURE__ */ Symbol.for("v-txt"), it = /* @__PURE__ */ Symbol.for("v-cmt"), Ln = /* @__PURE__ */ Symbol.for("v-stc"), Lt = [];
let Se = null;
function ye(e = !1) {
  Lt.push(Se = e ? null : []);
}
function Xr() {
  Lt.pop(), Se = Lt[Lt.length - 1] || null;
}
let Jt = 1;
function gn(e, t = !1) {
  Jt += e, e < 0 && Se && t && (Se.hasOnce = !0);
}
function oi(e) {
  return e.dynamicChildren = Jt > 0 ? Se || xt : null, Xr(), Jt > 0 && Se && Se.push(e), e;
}
function Te(e, t, n, s, o, i) {
  return oi(
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
  return oi(
    se(
      e,
      t,
      n,
      s,
      o,
      !0
    )
  );
}
function vn(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Rt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const ii = ({ key: e }) => e ?? null, un = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? Q(e) || /* @__PURE__ */ fe(e) || V(e) ? { i: Ae, r: e, k: t, f: !!n } : e : null);
function m(e, t = null, n = null, s = 0, o = null, i = e === we ? 0 : 1, r = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && ii(t),
    ref: t && un(t),
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
    ctx: Ae
  };
  return a ? (xs(l, n), i & 128 && e.normalize(l)) : n && (l.shapeFlag |= Q(n) ? 8 : 16), Jt > 0 && // avoid a block node from tracking itself
  !r && // has current parent block
  Se && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Se.push(l), l;
}
const se = Qr;
function Qr(e, t = null, n = null, s = 0, o = null, i = !1) {
  if ((!e || e === Cr) && (e = it), vn(e)) {
    const a = Tt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && xs(a, n), Jt > 0 && !i && Se && (a.shapeFlag & 6 ? Se[Se.indexOf(e)] = a : Se.push(a)), a.patchFlag = -2, a;
  }
  if (ua(e) && (e = e.__vccOpts), t) {
    t = ea(t);
    let { class: a, style: l } = t;
    a && !Q(a) && (t.class = be(a)), W(l) && (/* @__PURE__ */ hs(l) && !D(l) && (l = ae({}, l)), t.style = as(l));
  }
  const r = Q(e) ? 1 : si(e) ? 128 : ur(e) ? 64 : W(e) ? 4 : V(e) ? 2 : 0;
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
  return e ? /* @__PURE__ */ hs(e) || Jo(e) ? ae({}, e) : e : null;
}
function Tt(e, t, n = !1, s = !1) {
  const { props: o, ref: i, patchFlag: r, children: a, transition: l } = e, d = t ? ta(o || {}, t) : o, f = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && ii(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? D(i) ? i.concat(un(t)) : [i, un(t)] : un(t)
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
    patchFlag: t && e.type !== we ? r === -1 ? 16 : r | 16 : r,
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
    ssContent: e.ssContent && Tt(e.ssContent),
    ssFallback: e.ssFallback && Tt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && s && gs(
    f,
    l.clone(f)
  ), f;
}
function ce(e = " ", t = 0) {
  return se(Pn, null, e, t);
}
function zn(e = "", t = !1) {
  return t ? (ye(), Zr(it, null, e)) : se(it, null, e);
}
function Ue(e) {
  return e == null || typeof e == "boolean" ? se(it) : D(e) ? se(
    we,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : vn(e) ? Ye(e) : se(Pn, null, String(e));
}
function Ye(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Tt(e);
}
function xs(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (D(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const o = t.default;
      o && (o._c && (o._d = !1), xs(e, o()), o._c && (o._d = !0));
      return;
    } else {
      n = 32;
      const o = t._;
      !o && !Jo(t) ? t._ctx = Ae : o === 3 && Ae && (Ae.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else V(t) ? (t = { default: t, _ctx: Ae }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [ce(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function ta(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const o in s)
      if (o === "class")
        t.class !== s.class && (t.class = be([t.class, s.class]));
      else if (o === "style")
        t.style = as([t.style, s.style]);
      else if (wn(o)) {
        const i = t[o], r = s[o];
        r && i !== r && !(D(i) && i.includes(r)) ? t[o] = i ? [].concat(i, r) : r : r == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Sn(o) && (t[o] = r);
      } else o !== "" && (t[o] = s[o]);
  }
  return t;
}
function Ve(e, t, n, s = null) {
  We(e, t, 7, [
    n,
    s
  ]);
}
const na = Lo();
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
    scope: new Ai(
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
    propsOptions: Yo(s, o),
    emitsOptions: zo(s, o),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: J,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: J,
    data: J,
    props: J,
    attrs: J,
    slots: J,
    refs: J,
    setupState: J,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = Dr.bind(null, i), e.ce && e.ce(i), i;
}
let me = null;
const ia = () => me || Ae;
let bn, ns;
{
  const e = En(), t = (n, s) => {
    let o;
    return (o = e[n]) || (o = e[n] = []), o.push(s), (i) => {
      o.length > 1 ? o.forEach((r) => r(i)) : o[0](i);
    };
  };
  bn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => me = n
  ), ns = t(
    "__VUE_SSR_SETTERS__",
    (n) => Gt = n
  );
}
const Qt = (e) => {
  const t = me;
  return bn(e), e.scope.on(), () => {
    e.scope.off(), bn(t);
  };
}, Ns = () => {
  me && me.scope.off(), bn(null);
};
function ri(e) {
  return e.vnode.shapeFlag & 4;
}
let Gt = !1;
function ra(e, t = !1, n = !1) {
  t && ns(t);
  const { props: s, children: o } = e.vnode, i = ri(e);
  Hr(e, s, i, t), zr(e, o, n || t);
  const r = i ? aa(e, t) : void 0;
  return t && ns(!1), r;
}
function aa(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Tr);
  const { setup: s } = n;
  if (s) {
    Qe();
    const o = e.setupContext = s.length > 1 ? ca(e) : null, i = Qt(e), r = Zt(
      s,
      e,
      0,
      [
        e.props,
        o
      ]
    ), a = ro(r);
    if (et(), i(), (a || e.sp) && !Nt(e) && jo(e), a) {
      if (r.then(Ns, Ns), t)
        return r.then((l) => {
          Us(e, l);
        }).catch((l) => {
          In(l, e, 0);
        });
      e.asyncDep = r;
    } else
      Us(e, r);
  } else
    ai(e);
}
function Us(e, t, n) {
  V(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : W(t) && (e.setupState = Io(t)), ai(e);
}
function ai(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || ze);
  {
    const o = Qt(e);
    Qe();
    try {
      Ar(e);
    } finally {
      et(), o();
    }
  }
}
const la = {
  get(e, t) {
    return ue(e, "get", ""), e[t];
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
function kn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Io(qi(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Ut)
        return Ut[n](e);
    },
    has(t, n) {
      return n in t || n in Ut;
    }
  })) : e.proxy;
}
function ua(e) {
  return V(e) && "__vccOpts" in e;
}
const bt = (e, t) => /* @__PURE__ */ Zi(e, t, Gt);
function ne(e, t, n) {
  try {
    gn(-1);
    const s = arguments.length;
    return s === 2 ? W(t) && !D(t) ? vn(t) ? se(e, null, [t]) : se(e, t) : se(e, null, t) : (s > 3 ? n = Array.prototype.slice.call(arguments, 2) : s === 3 && vn(n) && (n = [n]), se(e, t, n));
  } finally {
    gn(1);
  }
}
const fa = "3.5.34";
/**
* @vue/runtime-dom v3.5.34
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ss;
const Ls = typeof window < "u" && window.trustedTypes;
if (Ls)
  try {
    ss = /* @__PURE__ */ Ls.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const li = ss ? (e) => ss.createHTML(e) : (e) => e, pa = "http://www.w3.org/2000/svg", da = "http://www.w3.org/1998/Math/MathML", Ge = typeof document < "u" ? document : null, zs = Ge && /* @__PURE__ */ Ge.createElement("template"), ha = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const o = t === "svg" ? Ge.createElementNS(pa, e) : t === "mathml" ? Ge.createElementNS(da, e) : n ? Ge.createElement(e, { is: n }) : Ge.createElement(e);
    return e === "select" && s && s.multiple != null && o.setAttribute("multiple", s.multiple), o;
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
  insertStaticContent(e, t, n, s, o, i) {
    const r = n ? n.previousSibling : t.lastChild;
    if (o && (o === i || o.nextSibling))
      for (; t.insertBefore(o.cloneNode(!0), n), !(o === i || !(o = o.nextSibling)); )
        ;
    else {
      zs.innerHTML = li(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = zs.content;
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
const xn = /* @__PURE__ */ Symbol("_vod"), ci = /* @__PURE__ */ Symbol("_vsh"), Bs = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[xn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Pt(e, t);
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
  e.style.display = t ? e[xn] : "none", e[ci] = !t;
}
const va = /* @__PURE__ */ Symbol(""), ba = /(?:^|;)\s*display\s*:/;
function xa(e, t, n) {
  const s = e.style, o = Q(n);
  let i = !1;
  if (n && !o) {
    if (t)
      if (Q(t))
        for (const r of t.split(";")) {
          const a = r.slice(0, r.indexOf(":")).trim();
          n[a] == null && Dt(s, a, "");
        }
      else
        for (const r in t)
          n[r] == null && Dt(s, r, "");
    for (const r in n) {
      r === "display" && (i = !0);
      const a = n[r];
      a != null ? _a(
        e,
        r,
        !Q(t) && t ? t[r] : void 0,
        a
      ) || Dt(s, r, a) : Dt(s, r, "");
    }
  } else if (o) {
    if (t !== n) {
      const r = s[va];
      r && (n += ";" + r), s.cssText = n, i = ba.test(n);
    }
  } else t && e.removeAttribute("style");
  xn in e && (e[xn] = i ? s.display : "", e[ci] && (s.display = "none"));
}
const Ws = /\s*!important$/;
function Dt(e, t, n) {
  if (D(n))
    n.forEach((s) => Dt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = ya(e, t);
    Ws.test(n) ? e.setProperty(
      rt(s),
      n.replace(Ws, ""),
      "important"
    ) : e[s] = n;
  }
}
const qs = ["Webkit", "Moz", "ms"], Bn = {};
function ya(e, t) {
  const n = Bn[t];
  if (n)
    return n;
  let s = Ie(t);
  if (s !== "filter" && s in e)
    return Bn[t] = s;
  s = co(s);
  for (let o = 0; o < qs.length; o++) {
    const i = qs[o] + s;
    if (i in e)
      return Bn[t] = i;
  }
  return t;
}
function _a(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && Q(s) && n === s;
}
const Js = "http://www.w3.org/1999/xlink";
function Gs(e, t, n, s, o, i = Si(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Js, t.slice(6, t.length)) : e.setAttributeNS(Js, t, n) : n == null || i && !fo(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Be(n) ? String(n) : n
  );
}
function Ys(e, t, n, s, o) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? li(n) : n);
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
    a === "boolean" ? n = fo(n) : n == null && a === "string" ? (n = "", r = !0) : a === "number" && (n = 0, r = !0);
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
const Xs = /* @__PURE__ */ Symbol("_vei");
function Sa(e, t, n, s, o = null) {
  const i = e[Xs] || (e[Xs] = {}), r = i[t];
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
const Zs = /(?:Once|Passive|Capture)$/;
function Ca(e) {
  let t;
  if (Zs.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Zs); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : rt(e.slice(2)), t];
}
let Wn = 0;
const Ta = /* @__PURE__ */ Promise.resolve(), Aa = () => Wn || (Ta.then(() => Wn = 0), Wn = Date.now());
function Ea(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    We(
      Oa(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Aa(), n;
}
function Oa(e, t) {
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
const Qs = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Ia = (e, t, n, s, o, i) => {
  const r = o === "svg";
  t === "class" ? ga(e, s, r) : t === "style" ? xa(e, n, s) : wn(t) ? Sn(t) || Sa(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ma(e, t, s, r)) ? (Ys(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Gs(e, t, s, r, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Ra(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !Q(s))) ? Ys(e, Ie(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Gs(e, t, s, r));
};
function Ma(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Qs(t) && V(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const o = e.tagName;
    if (o === "IMG" || o === "VIDEO" || o === "CANVAS" || o === "SOURCE")
      return !1;
  }
  return Qs(t) && Q(n) ? !1 : t in e;
}
function Ra(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Ie(t);
  return Array.isArray(n) ? n.some((o) => Ie(o) === s) : Object.keys(n).some((o) => Ie(o) === s);
}
const yn = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return D(t) ? (n) => ln(t, n) : t;
};
function Pa(e) {
  e.target.composing = !0;
}
function eo(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const St = /* @__PURE__ */ Symbol("_assign");
function to(e, t, n) {
  return t && (e = e.trim()), n && (e = An(e)), e;
}
const le = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, o) {
    e[St] = yn(o);
    const i = s || o.props && o.props.type === "number";
    pt(e, t ? "change" : "input", (r) => {
      r.target.composing || e[St](to(e.value, n, i));
    }), (n || i) && pt(e, "change", () => {
      e.value = to(e.value, n, i);
    }), t || (pt(e, "compositionstart", Pa), pt(e, "compositionend", eo), pt(e, "change", eo));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: o, number: i } }, r) {
    if (e[St] = yn(r), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? An(e.value) : e.value, l = t ?? "";
    if (a === l)
      return;
    const d = e.getRootNode();
    (d instanceof Document || d instanceof ShadowRoot) && d.activeElement === e && e.type !== "range" && (s && t === n || o && e.value.trim() === l) || (e.value = l);
  }
}, no = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    const o = Cn(t);
    pt(e, "change", () => {
      const i = Array.prototype.filter.call(e.options, (r) => r.selected).map(
        (r) => n ? An(_n(r)) : _n(r)
      );
      e[St](
        e.multiple ? o ? new Set(i) : i : i[0]
      ), e._assigning = !0, Kt(() => {
        e._assigning = !1;
      });
    }), e[St] = yn(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    so(e, t);
  },
  beforeUpdate(e, t, n) {
    e[St] = yn(n);
  },
  updated(e, { value: t }) {
    e._assigning || so(e, t);
  }
};
function so(e, t) {
  const n = e.multiple, s = D(t);
  if (!(n && !s && !Cn(t))) {
    for (let o = 0, i = e.options.length; o < i; o++) {
      const r = e.options[o], a = _n(r);
      if (n)
        if (s) {
          const l = typeof a;
          l === "string" || l === "number" ? r.selected = t.some((d) => String(d) === String(a)) : r.selected = Ti(t, a) > -1;
        } else
          r.selected = t.has(a);
      else if (Xt(_n(r), t)) {
        e.selectedIndex !== o && (e.selectedIndex = o);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function _n(e) {
  return "_value" in e ? e._value : e.value;
}
const ka = ["ctrl", "shift", "alt", "meta"], Da = {
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
  exact: (e, t) => ka.some((n) => e[`${n}Key`] && !t.includes(n))
}, ie = (e, t) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = ((o, ...i) => {
    for (let r = 0; r < t.length; r++) {
      const a = Da[t[r]];
      if (a && a(o, t)) return;
    }
    return e(o, ...i);
  }));
}, $a = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, ge = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = ((o) => {
    if (!("key" in o))
      return;
    const i = rt(o.key);
    if (t.some(
      (r) => r === i || $a[r] === i
    ))
      return e(o);
  }));
}, Fa = /* @__PURE__ */ ae({ patchProp: Ia }, ha);
let oo;
function ja() {
  return oo || (oo = Wr(Fa));
}
const Ka = ((...e) => {
  const t = ja().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const o = Ha(s);
    if (!o) return;
    const i = t._component;
    !V(i) && !i.render && !i.template && (i.template = o.innerHTML), o.nodeType === 1 && (o.textContent = "");
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
  return Q(e) ? document.querySelector(e) : e;
}
let Na = 1;
function _e(e) {
  if (e == null) return e;
  try {
    return structuredClone(e);
  } catch {
    return JSON.parse(JSON.stringify(e));
  }
}
function Oe(e) {
  return `${e}-${Date.now().toString(36)}-${Na++}`;
}
function ui(e) {
  const t = _e(e || {});
  return {
    ...t,
    timestamp: { ...t.timestamp || {} },
    scene: { ...t.scene || {} },
    costumes: { ...t.costumes || {} },
    items: { ...t.items || {} },
    deletedItems: Array.isArray(t.deletedItems) ? [...t.deletedItems] : [],
    events: Array.isArray(t.events) ? _e(t.events) : t.event ? [_e(t.event)] : [],
    affection: { ...t.affection || {} },
    npcs: _e(t.npcs || {}),
    agenda: Array.isArray(t.agenda) ? _e(t.agenda) : [],
    deletedAgenda: Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [],
    mood: _e(t.mood || {}),
    relationships: Array.isArray(t.relationships) ? _e(t.relationships) : []
  };
}
function Ua(e) {
  return e && typeof e == "object" ? e.value ?? "" : e ?? "";
}
function Dn(e) {
  const t = String(e || "").trim();
  return t === "悬念" || t === "未解悬念" || t.toLowerCase() === "mystery" ? "悬念" : "计划";
}
function La(e) {
  return Dn(e) === "悬念" ? "未解悬念" : "行动计划";
}
function za(e) {
  return Dn(e) === "悬念" ? "type-suspense" : "type-plan";
}
function Ba(e) {
  switch (e) {
    case "affection":
      return { id: Oe("aff"), name: "", value: 0, editing: !0 };
    case "relationship":
      return { id: Oe("rel"), from: "", to: "", type: "", note: "", editing: !0 };
    case "costume":
      return { id: Oe("costume"), name: "", desc: "", editing: !0 };
    case "item":
      return {
        id: Oe("item"),
        icon: "",
        name: "",
        holder: "",
        location: "",
        description: "",
        importance: "",
        editing: !0
      };
    case "agenda":
      return { id: Oe("agenda"), date: "", type: "悬念", text: "", source: "user", editing: !0 };
    default:
      return { id: Oe("row"), editing: !0 };
  }
}
function fi(e) {
  const t = ui(e), n = t.events[0] || {};
  return {
    baseMeta: _e(t),
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
      id: Oe("aff"),
      name: s,
      value: Ua(o),
      editing: !1
    })),
    relationshipRows: (t.relationships || []).map((s) => ({
      id: Oe("rel"),
      from: s.from || "",
      to: s.to || "",
      type: s.type || "",
      note: s.note || "",
      editing: !1
    })),
    costumeRows: Object.entries(t.costumes || {}).map(([s, o]) => ({
      id: Oe("costume"),
      name: s,
      desc: o,
      editing: !1
    })),
    itemRows: Object.entries(t.items || {}).map(([s, o]) => ({
      id: Oe("item"),
      icon: (o == null ? void 0 : o.icon) || "",
      name: s,
      holder: (o == null ? void 0 : o.holder) || "",
      location: (o == null ? void 0 : o.location) || "",
      description: (o == null ? void 0 : o.description) || "",
      importance: (o == null ? void 0 : o.importance) || "",
      editing: !1
    })),
    agendaRows: (t.agenda || []).map((s) => ({
      id: Oe("agenda"),
      date: s.date || "",
      type: Dn(s.type),
      text: s.text || "",
      source: s.source || "user",
      done: !!s.done,
      editing: !1
    })),
    isSkipped: !!t._skipHorae
  };
}
function Wa(e) {
  const t = ui(e.baseMeta), n = _e(t);
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
      type: Dn(i.type),
      date: String(i.date || "").trim(),
      text: r,
      source: i.source || "user",
      done: !!i.done
    });
  }
  return n.deletedItems = Array.isArray(t.deletedItems) ? [...t.deletedItems] : [], n.deletedAgenda = Array.isArray(t.deletedAgenda) ? [...t.deletedAgenda] : [], n.npcs = _e(t.npcs || {}), n.mood = _e(t.mood || {}), t._skipHorae && (n._skipHorae = !0), t._aiScanned && (n._aiScanned = !0), t._rpgChanges && (n._rpgChanges = _e(t._rpgChanges)), t.tableContributions && (n.tableContributions = _e(t.tableContributions)), n;
}
function qa(e, t) {
  const n = fi(t);
  for (const s of Object.keys(e)) delete e[s];
  Object.assign(e, n);
}
function Ja(e) {
  return Array.isArray(e) ? e.map((t) => String(t || "").trim()).filter(Boolean) : String(e || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
}
const Ga = { class: "toggle-left" }, Ya = { class: "toggle-icon" }, Xa = { class: "toggle-info" }, Za = { class: "toggle-time" }, Qa = {
  key: 0,
  class: "horae-sideplay-badge"
}, el = { class: "toggle-summary" }, tl = { class: "toggle-actions" }, nl = ["title"], sl = ["title"], ol = ["title", "disabled"], il = { class: "horae-panel-content" }, rl = { class: "neo-dashboard" }, al = { class: "neo-tags" }, ll = { class: "neo-chip" }, cl = ["placeholder"], ul = { class: "neo-chip" }, fl = ["placeholder"], pl = { class: "neo-chip" }, dl = ["placeholder"], hl = { class: "event-header" }, ml = { class: "event-badge" }, gl = { class: "action-group-hover" }, vl = { class: "view-mode" }, bl = { class: "event-body-text" }, xl = { class: "edit-mode" }, yl = { value: "" }, _l = { value: "一般" }, wl = { value: "重要" }, Sl = { value: "关键" }, Cl = ["placeholder"], Tl = { class: "neo-inset-section" }, Al = { class: "neo-section-header compact" }, El = { class: "section-title" }, Ol = { class: "aff-grid list-container" }, Il = { class: "view-mode" }, Ml = { class: "t-title" }, Rl = { class: "t-val" }, Pl = { class: "edit-mode" }, kl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Dl = ["onUpdate:modelValue", "placeholder", "onKeydown"], $l = { class: "neo-inset-section" }, Fl = { class: "neo-section-header compact" }, jl = { class: "section-title" }, Kl = { class: "rel-list list-container" }, Vl = { class: "view-mode" }, Hl = { class: "rel-node" }, Nl = { class: "rel-node" }, Ul = { class: "rel-label" }, Ll = { class: "edit-mode" }, zl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Bl = ["onUpdate:modelValue", "placeholder", "onKeydown"], Wl = ["onUpdate:modelValue", "placeholder", "onKeydown"], ql = { class: "neo-inset-section" }, Jl = { class: "neo-section-header" }, Gl = { class: "section-title" }, Yl = { class: "neo-item-list list-container" }, Xl = { class: "view-mode" }, Zl = { class: "item-emoji" }, Ql = { class: "item-info" }, ec = { class: "item-line-top" }, tc = {
  key: 0,
  class: "item-holder-badge"
}, nc = {
  key: 0,
  class: "item-meta"
}, sc = { class: "item-desc" }, oc = { class: "edit-mode item-edit-mode" }, ic = { class: "item-edit-line" }, rc = ["onUpdate:modelValue", "onKeydown"], ac = ["onUpdate:modelValue", "placeholder", "onKeydown"], lc = ["onUpdate:modelValue", "placeholder", "onKeydown"], cc = ["onUpdate:modelValue", "placeholder", "onKeydown"], uc = ["onUpdate:modelValue", "placeholder", "onKeydown"], fc = { class: "neo-inset-section" }, pc = { class: "neo-section-header" }, dc = { class: "section-title" }, hc = { class: "neo-agenda-list list-container" }, mc = { class: "view-mode" }, gc = { class: "agenda-date" }, vc = { class: "agenda-content" }, bc = { class: "agenda-type" }, xc = { class: "agenda-text" }, yc = { class: "edit-mode agenda-edit-mode" }, _c = { class: "agenda-edit-line" }, wc = ["onUpdate:modelValue", "placeholder", "onKeydown"], Sc = ["onUpdate:modelValue", "onKeydown"], Cc = { value: "悬念" }, Tc = { value: "计划" }, Ac = ["onUpdate:modelValue", "placeholder", "onKeydown"], Ec = { class: "neo-footer-actions" }, Oc = { class: "action-group" }, Ic = ["disabled"], Mc = ["disabled"], Rc = { class: "action-group" }, Pc = ["disabled"], kc = ["title"], Dc = {
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
    }, o = bt(() => ({ ...s, ...n.labels })).value, i = bt(() => ({ sideplayMode: !1, ...n.config })).value, r = n.adapter || {}, a = /* @__PURE__ */ on(null), l = /* @__PURE__ */ Wt(fi(n.initialMeta)), d = /* @__PURE__ */ on(!1), f = /* @__PURE__ */ on(!1), v = /* @__PURE__ */ Wt({ save: !1, scan: !1, ai: !1, sideplay: !1 }), O = /* @__PURE__ */ on((l.scene.characters_present || []).join(", "));
    Vt(
      () => l.scene.characters_present,
      (A) => {
        O.value = (A || []).join(", ");
      },
      { deep: !0 }
    ), Vt(
      () => l.isSkipped,
      (A) => {
        var h;
        (h = n.setHostState) == null || h.call(n, { isSkipped: !!A, visible: i.showPanel !== !1 });
      },
      { immediate: !0 }
    );
    const M = bt(() => {
      if (l.isSkipped) return o.noTracking;
      const A = l.timestamp.story_date || "--", h = l.timestamp.story_time ? ` ${l.timestamp.story_time}` : "";
      return `${A}${h}`;
    }), L = bt(() => {
      var p;
      if (l.isSkipped) return o.sideplayTitle;
      const A = l.event.summary || o.noSpecialEvents, h = ((p = l.scene.characters_present) == null ? void 0 : p.length) || 0;
      return h ? `${A} | ${h}${o.characters}` : A;
    }), j = bt(() => `${l.event.level || o.levelNormal}${o.event}`);
    function K() {
      f.value = !0;
    }
    function G(A) {
      A.target.closest("button, input, textarea, select") || (d.value = !d.value);
    }
    function N() {
      l.scene.characters_present = Ja(O.value), K();
    }
    function $(A) {
      A.editing = !A.editing, A.editing || K(), Kt(st);
    }
    function P(A, h) {
      l[A].push(Ba(h)), K(), Kt(st);
    }
    function Z(A, h) {
      const p = l[A], T = p.findIndex((qe) => qe.id === h);
      T >= 0 && (p.splice(T, 1), K());
    }
    function pe(A) {
      qa(l, A || {}), O.value = (l.scene.characters_present || []).join(", "), f.value = !1, Kt(st);
    }
    async function Ce() {
      var A;
      v.save = !0;
      try {
        const h = Wa(l), p = await ((A = r.save) == null ? void 0 : A.call(r, h));
        p ? pe(p) : f.value = !1;
      } finally {
        v.save = !1;
      }
    }
    async function Pe() {
      var A;
      v.scan = !0;
      try {
        const h = await ((A = r.quickScan) == null ? void 0 : A.call(r));
        h && pe(h);
      } finally {
        v.scan = !1;
      }
    }
    async function mt() {
      var A;
      v.scan = !0;
      try {
        const h = await ((A = r.rescan) == null ? void 0 : A.call(r));
        h && pe(h);
      } finally {
        v.scan = !1;
      }
    }
    async function ke() {
      var A;
      v.ai = !0;
      try {
        const h = await ((A = r.aiAnalyze) == null ? void 0 : A.call(r));
        h && pe(h);
      } finally {
        v.ai = !1;
      }
    }
    async function at() {
      var A;
      v.sideplay = !0;
      try {
        const h = await ((A = r.toggleSideplay) == null ? void 0 : A.call(r));
        h && pe(h);
      } finally {
        v.sideplay = !1;
      }
    }
    function st() {
      var A;
      (A = a.value) == null || A.querySelectorAll("textarea").forEach((h) => {
        h.style.height = "auto", h.style.height = `${h.scrollHeight}px`;
      });
    }
    const De = /* @__PURE__ */ Ms({
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
          ne("div", { class: "neo-dict-list list-container" }, A.rows.map((p) => ne("div", { key: p.id, class: ["neo-dict-row editable-block", { "is-editing": p.editing }] }, [
            ne("div", { class: "view-mode dict-view" }, [
              ne("div", { class: "dict-key" }, p.name || A.labels.role),
              ne("div", { class: "dict-value" }, p.desc || A.labels.itemDesc)
            ]),
            ne("div", { class: "edit-mode dict-edit-mode" }, [
              ne("input", {
                class: "neo-input short-key no-enter",
                value: p.name,
                placeholder: A.labels.role,
                onInput: (T) => {
                  p.name = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", p));
                }
              }),
              ne("textarea", {
                class: "neo-textarea no-enter",
                value: p.desc,
                placeholder: A.labels.itemDesc,
                onInput: (T) => {
                  p.desc = T.target.value, h("dirty");
                },
                onKeydown: (T) => {
                  T.key === "Enter" && (T.preventDefault(), h("edit", p));
                }
              })
            ]),
            ne(De, {
              row: p,
              onEdit: () => h("edit", p),
              onDelete: () => h("delete", p.id)
            })
          ])))
        ]);
      }
    });
    function en(A) {
      pe(A);
    }
    return t({ replaceMeta: en }), (A, h) => (ye(), Te("div", {
      ref_key: "panelRoot",
      ref: a,
      class: "horae-message-panel-shell"
    }, [
      m("div", {
        class: "horae-panel-top",
        onClick: G
      }, [
        m("div", Ga, [
          m("div", Ya, [
            m("i", {
              class: be(["fa-regular", l.isSkipped ? "fa-eye-slash" : "fa-clock"])
            }, null, 2)
          ]),
          m("div", Xa, [
            m("div", Za, [
              l.isSkipped ? (ye(), Te("span", Qa, H(I(o).sideplay), 1)) : zn("", !0),
              ce(" " + H(M.value), 1)
            ]),
            m("div", el, H(L.value), 1)
          ])
        ]),
        m("div", tl, [
          te(m("button", {
            class: "neo-btn-icon",
            title: I(o).sideplayTitle,
            onClick: ie(at, ["stop"])
          }, [
            m("i", {
              class: be(["fa-solid", l.isSkipped ? "fa-eye" : "fa-masks-theater"])
            }, null, 2)
          ], 8, nl), [
            [Bs, I(i).sideplayMode]
          ]),
          m("button", {
            class: "neo-btn-icon",
            title: I(o).rescan,
            onClick: ie(mt, ["stop"])
          }, [...h[15] || (h[15] = [
            m("i", { class: "fa-solid fa-arrows-rotate" }, null, -1)
          ])], 8, sl),
          m("button", {
            class: "neo-btn-icon btn-ai-analyze",
            title: I(o).aiAnalyze,
            disabled: v.ai,
            onClick: ie(ke, ["stop"])
          }, [
            m("i", {
              class: be(["fa-solid", v.ai ? "fa-spinner fa-spin" : "fa-magnifying-glass"])
            }, null, 2)
          ], 8, ol)
        ])
      ]),
      te(m("div", il, [
        m("div", rl, [
          m("div", al, [
            m("span", ll, [
              h[16] || (h[16] = m("i", { class: "fa-solid fa-location-dot" }, null, -1)),
              te(m("input", {
                "onUpdate:modelValue": h[0] || (h[0] = (p) => l.scene.location = p),
                class: "neo-chip-input",
                placeholder: I(o).location,
                onInput: K
              }, null, 40, cl), [
                [le, l.scene.location]
              ])
            ]),
            m("span", ul, [
              h[17] || (h[17] = m("i", { class: "fa-solid fa-cloud-moon" }, null, -1)),
              te(m("input", {
                "onUpdate:modelValue": h[1] || (h[1] = (p) => l.scene.atmosphere = p),
                class: "neo-chip-input",
                placeholder: I(o).atmosphere,
                onInput: K
              }, null, 40, fl), [
                [le, l.scene.atmosphere]
              ])
            ]),
            m("span", pl, [
              h[18] || (h[18] = m("i", { class: "fa-solid fa-users" }, null, -1)),
              te(m("input", {
                "onUpdate:modelValue": h[2] || (h[2] = (p) => O.value = p),
                class: "neo-chip-input",
                placeholder: I(o).characters,
                onInput: N
              }, null, 40, dl), [
                [le, O.value]
              ])
            ])
          ]),
          m("div", {
            class: be(["neo-event-card editable-block", { "is-editing": l.event.editing }])
          }, [
            m("div", hl, [
              m("span", ml, [
                h[19] || (h[19] = m("i", { class: "fa-solid fa-bolt" }, null, -1)),
                ce(" " + H(j.value), 1)
              ]),
              m("div", gl, [
                m("button", {
                  class: "action-hover-btn btn-edit",
                  onClick: h[3] || (h[3] = (p) => $(l.event))
                }, [...h[20] || (h[20] = [
                  m("i", { class: "fa-solid fa-pen" }, null, -1)
                ])])
              ])
            ]),
            m("div", vl, [
              m("div", bl, H(l.event.summary || I(o).noSpecialEvents), 1)
            ]),
            m("div", xl, [
              te(m("select", {
                "onUpdate:modelValue": h[4] || (h[4] = (p) => l.event.level = p),
                class: "neo-input event-level-select",
                onChange: K
              }, [
                m("option", yl, H(I(o).levelNone), 1),
                m("option", _l, H(I(o).levelNormal), 1),
                m("option", wl, H(I(o).levelImportant), 1),
                m("option", Sl, H(I(o).levelCritical), 1)
              ], 544), [
                [no, l.event.level]
              ]),
              te(m("textarea", {
                "onUpdate:modelValue": h[5] || (h[5] = (p) => l.event.summary = p),
                class: "neo-textarea lg no-enter",
                rows: "2",
                placeholder: I(o).eventPlaceholder,
                onInput: K,
                onKeydown: h[6] || (h[6] = ge(ie((p) => $(l.event), ["prevent"]), ["enter"]))
              }, null, 40, Cl), [
                [le, l.event.summary]
              ])
            ])
          ], 2),
          m("section", Tl, [
            m("div", Al, [
              m("span", El, [
                h[21] || (h[21] = m("i", { class: "fa-solid fa-heart" }, null, -1)),
                ce(" " + H(I(o).affection), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[7] || (h[7] = (p) => P("affectionRows", "affection"))
              }, [
                h[22] || (h[22] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                ce(" " + H(I(o).add), 1)
              ])
            ]),
            m("div", Ol, [
              (ye(!0), Te(we, null, an(l.affectionRows, (p) => (ye(), Te("div", {
                key: p.id,
                class: be(["aff-chip editable-block", { "is-editing": p.editing }])
              }, [
                m("div", Il, [
                  m("span", Ml, H(p.name || I(o).role), 1),
                  m("span", Rl, H(p.value || 0), 1)
                ]),
                m("div", Pl, [
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.name = T,
                    class: "neo-input no-enter aff-name",
                    placeholder: I(o).role,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, kl), [
                    [le, p.name]
                  ]),
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.value = T,
                    class: "neo-input no-enter aff-value",
                    placeholder: I(o).value,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, Dl), [
                    [le, p.value]
                  ])
                ]),
                se(I(De), {
                  row: p,
                  onEdit: (T) => $(p),
                  onDelete: (T) => Z("affectionRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          m("section", $l, [
            m("div", Fl, [
              m("span", jl, [
                h[23] || (h[23] = m("i", { class: "fa-solid fa-diagram-project" }, null, -1)),
                ce(" " + H(I(o).relationships), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[8] || (h[8] = (p) => P("relationshipRows", "relationship"))
              }, [
                h[24] || (h[24] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                ce(" " + H(I(o).add), 1)
              ])
            ]),
            m("div", Kl, [
              (ye(!0), Te(we, null, an(l.relationshipRows, (p) => (ye(), Te("div", {
                key: p.id,
                class: be(["rel-row editable-block", { "is-editing": p.editing }])
              }, [
                m("div", Vl, [
                  m("span", Hl, H(p.from || I(o).role), 1),
                  h[25] || (h[25] = m("i", { class: "fa-solid fa-arrow-right-long rel-arrow" }, null, -1)),
                  m("span", Nl, H(p.to || I(o).role), 1),
                  m("span", Ul, H(p.type || I(o).relationshipHint), 1)
                ]),
                m("div", Ll, [
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.from = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: I(o).relFrom,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, zl), [
                    [le, p.from]
                  ]),
                  h[26] || (h[26] = m("i", { class: "fa-solid fa-arrow-right-long" }, null, -1)),
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.to = T,
                    class: "neo-input no-enter rel-person",
                    placeholder: I(o).relTo,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, Bl), [
                    [le, p.to]
                  ]),
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.type = T,
                    class: "neo-input no-enter",
                    placeholder: I(o).relType,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, Wl), [
                    [le, p.type]
                  ])
                ]),
                se(I(De), {
                  row: p,
                  onEdit: (T) => $(p),
                  onDelete: (T) => Z("relationshipRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          se(I(At), {
            title: I(o).costumes,
            icon: "fa-shirt",
            rows: l.costumeRows,
            labels: I(o),
            onAdd: h[9] || (h[9] = (p) => P("costumeRows", "costume")),
            onEdit: $,
            onDelete: h[10] || (h[10] = (p) => Z("costumeRows", p)),
            onDirty: K
          }, null, 8, ["title", "rows", "labels"]),
          m("section", ql, [
            m("div", Jl, [
              m("span", Gl, [
                h[27] || (h[27] = m("i", { class: "fa-solid fa-box-open" }, null, -1)),
                ce(" " + H(I(o).items), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[11] || (h[11] = (p) => P("itemRows", "item"))
              }, [
                h[28] || (h[28] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                ce(" " + H(I(o).add), 1)
              ])
            ]),
            m("div", Yl, [
              (ye(!0), Te(we, null, an(l.itemRows, (p) => (ye(), Te("div", {
                key: p.id,
                class: be(["neo-item-card editable-block", { "is-editing": p.editing }])
              }, [
                m("div", Xl, [
                  m("div", Zl, H(p.icon || "📦"), 1),
                  m("div", Ql, [
                    m("div", ec, [
                      m("span", null, H(p.name || I(o).itemName), 1),
                      p.holder ? (ye(), Te("span", tc, H(p.holder), 1)) : zn("", !0)
                    ]),
                    p.location ? (ye(), Te("div", nc, [
                      h[29] || (h[29] = m("i", { class: "fa-solid fa-location-dot" }, null, -1)),
                      ce(" " + H(p.location), 1)
                    ])) : zn("", !0),
                    m("div", sc, H(p.description || I(o).itemDesc), 1)
                  ])
                ]),
                m("div", oc, [
                  m("div", ic, [
                    te(m("input", {
                      "onUpdate:modelValue": (T) => p.icon = T,
                      class: "neo-input no-enter item-icon-input",
                      maxlength: "2",
                      placeholder: "📦",
                      onInput: K,
                      onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                    }, null, 40, rc), [
                      [le, p.icon]
                    ]),
                    te(m("input", {
                      "onUpdate:modelValue": (T) => p.name = T,
                      class: "neo-input no-enter",
                      placeholder: I(o).itemName,
                      onInput: K,
                      onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                    }, null, 40, ac), [
                      [le, p.name]
                    ]),
                    te(m("input", {
                      "onUpdate:modelValue": (T) => p.holder = T,
                      class: "neo-input no-enter item-holder-input",
                      placeholder: I(o).holder,
                      onInput: K,
                      onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                    }, null, 40, lc), [
                      [le, p.holder]
                    ])
                  ]),
                  te(m("input", {
                    "onUpdate:modelValue": (T) => p.location = T,
                    class: "neo-input no-enter",
                    placeholder: I(o).location,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, cc), [
                    [le, p.location]
                  ]),
                  te(m("textarea", {
                    "onUpdate:modelValue": (T) => p.description = T,
                    class: "neo-textarea no-enter",
                    placeholder: I(o).itemDesc,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, uc), [
                    [le, p.description]
                  ])
                ]),
                se(I(De), {
                  row: p,
                  "delete-icon": "fa-trash-can",
                  onEdit: (T) => $(p),
                  onDelete: (T) => Z("itemRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          m("section", fc, [
            m("div", pc, [
              m("span", dc, [
                h[30] || (h[30] = m("i", { class: "fa-solid fa-list-check" }, null, -1)),
                ce(" " + H(I(o).agenda), 1)
              ]),
              m("button", {
                class: "neo-text-btn add",
                onClick: h[12] || (h[12] = (p) => P("agendaRows", "agenda"))
              }, [
                h[31] || (h[31] = m("i", { class: "fa-solid fa-plus" }, null, -1)),
                ce(" " + H(I(o).add), 1)
              ])
            ]),
            m("div", hc, [
              (ye(!0), Te(we, null, an(l.agendaRows, (p) => (ye(), Te("div", {
                key: p.id,
                class: be(["agenda-card editable-block", [I(za)(p.type), { "is-editing": p.editing }]])
              }, [
                m("div", mc, [
                  m("div", gc, H(p.date || I(o).unscheduled), 1),
                  m("div", vc, [
                    m("span", bc, H(I(La)(p.type)), 1),
                    m("span", xc, H(p.text || I(o).agendaText), 1)
                  ])
                ]),
                m("div", yc, [
                  m("div", _c, [
                    te(m("input", {
                      "onUpdate:modelValue": (T) => p.date = T,
                      class: "neo-input no-enter agenda-date-input",
                      placeholder: I(o).date,
                      onInput: K,
                      onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                    }, null, 40, wc), [
                      [le, p.date]
                    ]),
                    te(m("select", {
                      "onUpdate:modelValue": (T) => p.type = T,
                      class: "neo-input no-enter",
                      onChange: K,
                      onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                    }, [
                      m("option", Cc, H(I(o).agendaMystery), 1),
                      m("option", Tc, H(I(o).agendaPlan), 1)
                    ], 40, Sc), [
                      [no, p.type]
                    ])
                  ]),
                  te(m("textarea", {
                    "onUpdate:modelValue": (T) => p.text = T,
                    class: "neo-textarea no-enter",
                    placeholder: I(o).agendaText,
                    onInput: K,
                    onKeydown: ge(ie((T) => $(p), ["prevent"]), ["enter"])
                  }, null, 40, Ac), [
                    [le, p.text]
                  ])
                ]),
                se(I(De), {
                  row: p,
                  onEdit: (T) => $(p),
                  onDelete: (T) => Z("agendaRows", p.id)
                }, null, 8, ["row", "onEdit", "onDelete"])
              ], 2))), 128))
            ])
          ]),
          m("div", Ec, [
            m("div", Oc, [
              m("button", {
                class: "neo-btn-text",
                disabled: v.scan,
                onClick: Pe
              }, [
                m("i", {
                  class: be(["fa-solid", v.scan ? "fa-spinner fa-spin" : "fa-arrows-rotate"])
                }, null, 2),
                ce(" " + H(I(o).quickScan), 1)
              ], 8, Ic),
              m("button", {
                class: "neo-btn-text btn-ai-text",
                disabled: v.ai,
                onClick: ke
              }, [
                m("i", {
                  class: be(["fa-solid", v.ai ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"])
                }, null, 2),
                ce(" " + H(I(o).aiAnalyze), 1)
              ], 8, Mc)
            ]),
            m("div", Rc, [
              m("button", {
                class: "neo-btn-text btn-save-apply",
                disabled: v.save,
                onClick: Ce
              }, [
                m("i", {
                  class: be(["fa-solid", v.save ? "fa-spinner fa-spin" : "fa-check"])
                }, null, 2),
                ce(" " + H(I(o).apply), 1)
              ], 8, Pc),
              m("button", {
                class: "neo-btn-text",
                onClick: h[13] || (h[13] = (p) => d.value = !0)
              }, [
                h[32] || (h[32] = m("i", { class: "fa-solid fa-chevron-up" }, null, -1)),
                ce(" " + H(I(o).collapse), 1)
              ]),
              m("button", {
                class: "neo-btn-text btn-drawer",
                title: I(o).openDrawer,
                onClick: h[14] || (h[14] = (p) => {
                  var T, qe;
                  return (qe = (T = I(r)).openDrawer) == null ? void 0 : qe.call(T);
                })
              }, [...h[33] || (h[33] = [
                m("i", { class: "fa-solid fa-clock-rotate-left" }, null, -1)
              ])], 8, kc)
            ])
          ])
        ])
      ], 512), [
        [Bs, !d.value]
      ])
    ], 512));
  }
}, $c = '.horae-message-panel.horae-message-panel-vue{background:#2b2d31!important;border:0!important;border-radius:20px!important;box-shadow:6px 6px 12px #0006,-4px -4px 10px #ffffff0d!important;color:#b5bac1!important;margin-top:10px!important;margin-bottom:18px!important;overflow:hidden!important;--mp-bg-base: #2b2d31;--mp-text-title: #e3e5e8;--mp-text-main: #b5bac1;--mp-text-muted: #80848e;--mp-accent: #a78bfa;--mp-danger: #fb7185;--mp-success: #34d399;--mp-warning: #fbbf24;--mp-info: #38bdf8;--mp-pink: #f472b6;--mp-light-shadow: rgba(255, 255, 255, .05);--mp-dark-shadow: rgba(0, 0, 0, .4);--mp-neo-drop: 6px 6px 12px var(--mp-dark-shadow), -4px -4px 10px var(--mp-light-shadow);--mp-neo-drop-sm: 4px 4px 8px var(--mp-dark-shadow), -2px -2px 6px var(--mp-light-shadow);--mp-neo-inset: inset 4px 4px 8px var(--mp-dark-shadow), inset -4px -4px 8px var(--mp-light-shadow);--mp-neo-inset-sm: inset 2px 2px 4px var(--mp-dark-shadow), inset -2px -2px 4px var(--mp-light-shadow);--mp-radius-md: 12px;--mp-radius-sm: 8px;--mp-radius-round: 50px}.horae-message-panel.horae-message-panel-vue.horae-light{--mp-bg-base: #eef0f4;--mp-text-title: #20242c;--mp-text-main: #4a5160;--mp-text-muted: #767d8c;--mp-light-shadow: rgba(255, 255, 255, .95);--mp-dark-shadow: rgba(122, 132, 150, .28);color:var(--mp-text-main)!important}.horae-message-panel.horae-message-panel-vue.horae-sideplay{opacity:.72}.horae-message-panel-vue *,.horae-message-panel-vue *:before,.horae-message-panel-vue *:after{box-sizing:border-box}.horae-message-panel-vue button{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;background-image:none!important;box-shadow:none;text-shadow:none!important;font:inherit!important}.horae-message-panel-vue .horae-panel-top{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid rgba(255,255,255,.02);cursor:pointer;transition:background .2s;-webkit-user-select:none;user-select:none}.horae-message-panel-vue .horae-panel-top:hover{background:#ffffff05}.horae-message-panel-vue .toggle-left{flex:1;min-width:0;display:flex;align-items:center;gap:16px}.horae-message-panel-vue .toggle-icon{flex:0 0 auto;font-size:1.1rem;color:var(--mp-accent);display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;box-shadow:var(--mp-neo-drop)}.horae-message-panel-vue .toggle-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.horae-message-panel-vue .toggle-time{color:var(--mp-text-title);font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:8px}.horae-message-panel-vue .toggle-summary{color:var(--mp-text-muted);font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}.horae-message-panel-vue .toggle-actions{flex:0 0 auto;display:flex;gap:12px}.horae-message-panel-vue .neo-btn-icon{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;width:38px;height:38px;border-radius:50%!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;outline:none;padding:0!important}.horae-message-panel-vue .neo-btn-icon:hover{color:var(--mp-accent)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-icon:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .neo-btn-icon:disabled,.horae-message-panel-vue .neo-btn-text:disabled{cursor:wait;opacity:.7}.horae-message-panel-vue .horae-panel-content{padding:16px 24px 24px;background:transparent!important;border-top:0!important}.horae-message-panel-vue .neo-dashboard{display:flex;flex-direction:column;gap:24px}.horae-message-panel-vue .neo-tags{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .neo-chip{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);padding:8px 16px;border-radius:var(--mp-radius-round);font-size:.9rem;display:inline-flex;align-items:center;gap:8px;min-width:min(100%,180px)}.horae-message-panel-vue .neo-chip i{color:var(--mp-accent);opacity:.85}.horae-message-panel-vue .neo-chip-input{width:100%;min-width:80px;background:transparent!important;border:none!important;box-shadow:none!important;color:var(--mp-text-main)!important;padding:0!important;font-size:.9rem!important;outline:none!important}.horae-message-panel-vue .neo-input,.horae-message-panel-vue .neo-textarea{width:100%;background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-title)!important;font-size:.95rem!important;box-shadow:var(--mp-neo-inset)!important;outline:none!important;border-radius:var(--mp-radius-sm)!important;font-family:inherit;transition:box-shadow .2s;line-height:1.5}.horae-message-panel-vue .neo-input{padding:8px 12px!important;height:36px}.horae-message-panel-vue .neo-textarea{padding:10px 14px!important;resize:vertical;min-height:42px;overflow:hidden}.horae-message-panel-vue .neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}.horae-message-panel-vue .neo-input:focus,.horae-message-panel-vue .neo-textarea:focus{box-shadow:var(--mp-neo-inset),0 0 0 1px var(--mp-warning)!important}.horae-message-panel-vue .neo-text-btn{background:transparent!important;border:none!important;color:var(--mp-text-muted)!important;cursor:pointer;font-size:.85rem!important;display:flex;align-items:center;gap:6px;font-weight:500;transition:color .2s;outline:none;padding:0!important}.horae-message-panel-vue .neo-text-btn:hover{color:var(--mp-text-title)!important}.horae-message-panel-vue .neo-text-btn.add:hover{color:var(--mp-accent)!important}.horae-message-panel-vue .neo-inset-section{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset);border-radius:var(--mp-radius-md);padding:16px 20px}.horae-message-panel-vue .neo-section-header{margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}.horae-message-panel-vue .neo-section-header.compact{margin-bottom:12px}.horae-message-panel-vue .section-title{font-size:.85rem;color:var(--mp-text-title);display:flex;align-items:center;gap:8px;font-weight:600;text-transform:uppercase}.horae-message-panel-vue .section-title i{color:var(--mp-accent);opacity:.9}.horae-message-panel-vue .action-group-hover{display:flex;gap:4px;opacity:0;transform:translate(6px);transition:all .2s ease;margin-left:auto;flex:0 0 auto}.horae-message-panel-vue .action-hover-btn{width:28px;height:28px;border-radius:50%!important;border:none!important;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.8rem!important;color:var(--mp-text-muted)!important;background:transparent!important;transition:all .2s ease;outline:none;padding:0!important}.horae-message-panel-vue .action-hover-btn.btn-edit:hover{background:#38bdf81a!important;color:var(--mp-info)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .action-hover-btn.btn-del:hover{background:#fb71851a!important;color:var(--mp-danger)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .is-editing .action-group-hover,.horae-message-panel-vue :hover>.action-group-hover,.horae-message-panel-vue .action-group-hover:hover{opacity:1;transform:translate(0)}.horae-message-panel-vue .is-editing .btn-edit{color:var(--mp-success)!important}.horae-message-panel-vue .is-editing .btn-edit i:before{content:""}.horae-message-panel-vue .view-mode{display:flex;gap:10px;flex:1;min-width:0;align-items:flex-start}.horae-message-panel-vue .edit-mode{display:none;gap:10px;flex:1;min-width:0;align-items:flex-start;flex-wrap:wrap}.horae-message-panel-vue .is-editing .view-mode{display:none!important}.horae-message-panel-vue .is-editing .edit-mode{display:flex!important}.horae-message-panel-vue .neo-event-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop);border-radius:var(--mp-radius-md);padding:18px 20px;border-left:4px solid var(--mp-warning);position:relative}.horae-message-panel-vue .event-header{margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}.horae-message-panel-vue .event-badge{font-size:.85rem;color:var(--mp-warning);font-weight:600;display:flex;align-items:center;gap:6px}.horae-message-panel-vue .event-body-text{font-size:1.02rem;color:var(--mp-text-title);line-height:1.6;word-break:break-word}.horae-message-panel-vue .neo-event-card .action-group-hover{position:absolute;right:20px;top:16px;opacity:1}.horae-message-panel-vue .event-level-select{flex:0 0 110px}.horae-message-panel-vue .aff-grid{display:flex;flex-wrap:wrap;gap:12px}.horae-message-panel-vue .aff-chip{background:#ffffff05;border-radius:var(--mp-radius-sm);padding:6px 12px;display:inline-flex;align-items:center;transition:all .2s ease;position:relative;border:1px solid rgba(255,255,255,.03);min-height:38px}.horae-message-panel-vue .aff-chip:hover{background:#ffffff0a}.horae-message-panel-vue .aff-chip .view-mode{align-items:center;margin:0;gap:10px}.horae-message-panel-vue .aff-chip .t-title{font-weight:600;font-size:.9rem;color:var(--mp-text-title);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.horae-message-panel-vue .aff-chip .t-val{font-weight:700;font-size:.95rem;color:var(--mp-pink);font-family:monospace}.horae-message-panel-vue .aff-chip .edit-mode{align-items:center;gap:6px}.horae-message-panel-vue .aff-name{width:76px!important;min-width:76px}.horae-message-panel-vue .aff-value{width:58px!important;min-width:58px}.horae-message-panel-vue .aff-chip .action-group-hover{position:absolute;right:-8px;top:-14px;background:var(--mp-bg-base);border-radius:20px;box-shadow:var(--mp-neo-drop-sm);padding:2px 4px;z-index:10;margin:0}.horae-message-panel-vue .aff-chip.is-editing .action-group-hover{position:static;background:transparent;box-shadow:none;padding:0;margin-left:2px}.horae-message-panel-vue .rel-list,.horae-message-panel-vue .neo-dict-list,.horae-message-panel-vue .neo-item-list,.horae-message-panel-vue .neo-agenda-list{display:flex;flex-direction:column}.horae-message-panel-vue .rel-list{gap:4px}.horae-message-panel-vue .neo-dict-list{gap:6px}.horae-message-panel-vue .neo-item-list{gap:14px}.horae-message-panel-vue .neo-agenda-list{gap:12px}.horae-message-panel-vue .rel-row,.horae-message-panel-vue .neo-dict-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;margin:0 -10px;border-radius:var(--mp-radius-sm);transition:background .2s;position:relative}.horae-message-panel-vue .rel-row{align-items:center;padding-top:6px;padding-bottom:6px}.horae-message-panel-vue .rel-row:hover,.horae-message-panel-vue .neo-dict-row:hover{background:#ffffff05}.horae-message-panel-vue .rel-row .view-mode{align-items:center;gap:10px;font-size:.9rem;flex-wrap:wrap}.horae-message-panel-vue .rel-node{font-weight:600;color:var(--mp-text-title);background:#0003;padding:2px 8px;border-radius:4px}.horae-message-panel-vue .rel-arrow{color:var(--mp-accent);opacity:.7;font-size:.8rem}.horae-message-panel-vue .rel-label{color:var(--mp-text-main);font-style:italic}.horae-message-panel-vue .rel-person{width:82px!important;flex:0 0 82px!important}.horae-message-panel-vue .dict-view{align-items:flex-start}.horae-message-panel-vue .dict-key{color:var(--mp-accent);font-weight:600;white-space:nowrap;flex:0 0 auto;line-height:1.5}.horae-message-panel-vue .dict-key:after{content:":";color:var(--mp-text-muted);margin-left:2px}.horae-message-panel-vue .dict-value{color:var(--mp-text-main);line-height:1.5;word-break:break-word}.horae-message-panel-vue .dict-edit-mode{align-items:flex-start}.horae-message-panel-vue .short-key{width:100px!important;flex:0 0 100px!important}.horae-message-panel-vue .neo-item-card,.horae-message-panel-vue .agenda-card{background:var(--mp-bg-base);box-shadow:var(--mp-neo-drop-sm);border-radius:var(--mp-radius-sm);padding:12px 14px;display:flex;align-items:flex-start;gap:10px;position:relative}.horae-message-panel-vue .item-emoji{font-size:1.6rem;line-height:1;margin-top:2px}.horae-message-panel-vue .item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-right:2px}.horae-message-panel-vue .item-line-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-weight:600;color:var(--mp-text-title);font-size:1rem}.horae-message-panel-vue .item-holder-badge{background:var(--mp-bg-base);box-shadow:var(--mp-neo-inset-sm);color:var(--mp-accent);font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:400}.horae-message-panel-vue .item-meta{font-size:.8rem;color:var(--mp-text-muted)}.horae-message-panel-vue .item-desc{font-size:.9rem;color:var(--mp-text-main);line-height:1.4;word-break:break-word}.horae-message-panel-vue .item-edit-mode{flex-direction:column}.horae-message-panel-vue .item-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .item-icon-input{width:52px!important;flex:0 0 52px!important;text-align:center}.horae-message-panel-vue .item-holder-input{width:90px!important;flex:0 0 90px!important}.horae-message-panel-vue .agenda-card{border-left:3px solid var(--mp-text-muted)}.horae-message-panel-vue .agenda-card.type-suspense{border-left-color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-suspense .agenda-type{color:var(--mp-accent)}.horae-message-panel-vue .agenda-card.type-plan{border-left-color:var(--mp-info)}.horae-message-panel-vue .agenda-card.type-plan .agenda-type{color:var(--mp-info)}.horae-message-panel-vue .agenda-date{font-size:.8rem;color:var(--mp-text-muted);white-space:nowrap;padding-top:2px;font-family:monospace;width:80px;flex:0 0 80px}.horae-message-panel-vue .agenda-content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.horae-message-panel-vue .agenda-type{font-size:.75rem;font-weight:600}.horae-message-panel-vue .agenda-text{font-size:.95rem;color:var(--mp-text-title);word-break:break-word}.horae-message-panel-vue .agenda-edit-mode{flex-direction:column}.horae-message-panel-vue .agenda-edit-line{display:flex;gap:8px;width:100%}.horae-message-panel-vue .agenda-date-input{width:110px!important;flex:0 0 110px!important}.horae-message-panel-vue .neo-footer-actions{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:12px}.horae-message-panel-vue .action-group{display:flex;gap:12px;align-items:center}.horae-message-panel-vue .neo-btn-text{background:var(--mp-bg-base)!important;border:none!important;color:var(--mp-text-main)!important;padding:10px 20px!important;border-radius:var(--mp-radius-round)!important;box-shadow:var(--mp-neo-drop)!important;cursor:pointer;font-size:.9rem!important;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .2s ease;outline:none;white-space:nowrap}.horae-message-panel-vue .neo-btn-text:hover{color:var(--mp-text-title)!important;box-shadow:var(--mp-neo-drop-sm)!important}.horae-message-panel-vue .neo-btn-text:active{box-shadow:var(--mp-neo-inset)!important}.horae-message-panel-vue .btn-ai-text{color:var(--mp-accent)!important}.horae-message-panel-vue .btn-save-apply{color:var(--mp-success)!important}.horae-message-panel-vue .btn-drawer{padding-left:13px!important;padding-right:13px!important}.horae-message-panel-vue .horae-sideplay-badge{background:var(--mp-text-muted);color:var(--mp-bg-base);font-size:10px;padding:1px 6px;border-radius:3px;font-weight:700}@media(max-width:768px){.horae-message-panel-vue .horae-panel-top,.horae-message-panel-vue .horae-panel-content{padding:16px}.horae-message-panel-vue .toggle-actions{gap:8px}.horae-message-panel-vue .neo-btn-icon{width:34px;height:34px}.horae-message-panel-vue .dict-view,.horae-message-panel-vue .agenda-card .view-mode,.horae-message-panel-vue .agenda-card .edit-mode{flex-direction:column;gap:8px}.horae-message-panel-vue .dict-key:after{content:""}.horae-message-panel-vue .action-group-hover{opacity:.75;transform:none}.horae-message-panel-vue .neo-footer-actions{flex-direction:column;align-items:stretch;gap:12px;margin-top:6px}.horae-message-panel-vue .action-group{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%}.horae-message-panel-vue .neo-btn-text{width:100%;justify-content:center;padding:12px 10px!important;font-size:.85rem!important}.horae-message-panel-vue .btn-drawer{grid-column:1 / -1}}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;max-width:none!important;margin:0!important;border:none!important;border-radius:var(--mp-radius-sm)!important;background:var(--mp-bg-base)!important;color:var(--mp-text-title)!important;font-family:inherit!important;font-size:.95rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:var(--mp-neo-inset)!important;text-shadow:none!important;outline:none!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-input,#chat .mes .horae-message-panel.horae-message-panel-vue select.neo-input{height:36px!important;min-height:36px!important;padding:8px 12px!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea{min-height:42px!important;padding:10px 14px!important;resize:vertical!important;overflow:hidden!important}#chat .mes .horae-message-panel.horae-message-panel-vue textarea.neo-textarea.lg{padding:14px 18px!important;font-size:1.02rem!important}#chat .mes .horae-message-panel.horae-message-panel-vue input.neo-chip-input{-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;width:100%!important;min-width:80px!important;margin:0!important;padding:0!important;border:none!important;border-radius:0!important;background:transparent!important;color:var(--mp-text-main)!important;font-family:inherit!important;font-size:.9rem!important;font-weight:400!important;line-height:1.5!important;letter-spacing:0!important;box-shadow:none!important;text-shadow:none!important;outline:none!important}.horae-message-panel.horae-message-panel-vue .toggle-icon,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon{color:var(--mp-accent)!important}.horae-message-panel.horae-message-panel-vue .toggle-icon i:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,.horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-regular:before,#chat .mes .horae-message-panel.horae-message-panel-vue .toggle-icon .fa-solid:before{color:var(--mp-accent)!important;text-shadow:none!important}.horae-message-panel.horae-message-panel-vue .section-title i:before,.horae-message-panel.horae-message-panel-vue .neo-chip i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .section-title i:before,#chat .mes .horae-message-panel.horae-message-panel-vue .neo-chip i:before{color:var(--mp-accent)!important;text-shadow:none!important}', Fc = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i, jc = "/css/fontawesome.min.css";
function Kc(e) {
  e.style.setProperty("margin-top", "10px", "important"), e.style.setProperty("margin-bottom", "18px", "important"), e.style.setProperty("padding", "0", "important"), e.style.setProperty("background", "transparent", "important"), e.style.setProperty("border", "0", "important"), e.style.setProperty("border-radius", "0", "important"), e.style.setProperty("box-shadow", "none", "important"), e.style.setProperty("overflow", "visible", "important"), e.style.setProperty("opacity", "1", "important"), e.style.setProperty("order", "9999", "important");
}
function Vc(e) {
  if (!e.querySelector("style[data-horae-message-panel-style]")) {
    const n = document.createElement("style");
    n.dataset.horaeMessagePanelStyle = "true", n.textContent = $c, e.append(n);
  }
  const t = /* @__PURE__ */ new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((n) => {
    Fc.test(n.href) && t.add(n.href);
  }), t.size || t.add(jc), t.forEach((n) => {
    if (Array.from(e.querySelectorAll("link[data-horae-fontawesome]")).some((i) => i.href === n)) return;
    const o = document.createElement("link");
    o.dataset.horaeFontawesome = "true", o.rel = "stylesheet", o.href = n, e.append(o);
  });
}
function Hc(e) {
  Kc(e);
  const t = e.shadowRoot || e.attachShadow({ mode: "open" });
  t.textContent = "", Vc(t);
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
function Uc(e, t = {}) {
  if (!e) return null;
  const { panelContainer: n, classObserver: s, syncPanelContainer: o } = Hc(e), i = Ka(Dc, {
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
  Uc as mountMessagePanel
};
