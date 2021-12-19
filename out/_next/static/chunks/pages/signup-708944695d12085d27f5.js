(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[616],{452:function(e,n,t){"use strict";var r=t(91288);n.Z=r.ZP.img.withConfig({displayName:"LogoImg",componentId:"sc-1whqfa-0"})(["height:25px;vertical-align:bottom;padding-right:15px;border-right:2px solid #aaa;margin-right:15px;"])},5759:function(e,n,t){"use strict";t.d(n,{Z:function(){return N}});var r=t(30266),a=t(809),i=t.n(a),s=t(67294),o=t(66800),c=t(94716),u=t(65850),l=t(48193),d=t(78961),p=t(63255),h=t(24479),f=t(35641),x=t(11163),v=t(43514),_=t(35005),m=t(8635),E=t(66091),Z=t(452),R=t(5567),I=t(15289),S=t(76640),g=t(85893);function N(e){var n=(0,x.useRouter)(),t=(0,s.useState)(!1),a=t[0],N=t[1],b=(0,s.useState)(!1),j=b[0],C=b[1],k=function(){var e=(0,r.Z)(i().mark((function e(t,r){var a,s,o,c,l,d,h;return i().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a=t.email,s=t.passphrase,o=t.confirm,c=r.setFieldError,C(!0),e.prev=3,e.prev=4,(0,f.a_)(f.Pd.USER,{email:a}),e.next=8,(0,p.eF)(a);case 8:e.next=14;break;case 10:throw e.prev=10,e.t0=e.catch(4),c("confirm","".concat(u.Z.UNKNOWN_ERROR," ").concat(e.t0.message)),e.t0;case 14:if(e.prev=14,s!==o){e.next=30;break}return e.next=18,(0,m.dR)(s);case 18:return l=e.sent,d=l.keyAttributes,h=l.masterKey,(0,f.a_)(f.Pd.ORIGINAL_KEY_ATTRIBUTES,d),e.next=24,(0,m.iv)(s,d,h);case 24:return e.next=26,(0,m.K_)(I.Qm.ENCRYPTION_KEY,h);case 26:(0,E.n_)(!0),n.push(S.q5.VERIFY),e.next=31;break;case 30:c("confirm",u.Z.PASSPHRASE_MATCH_ERROR);case 31:e.next=37;break;case 33:throw e.prev=33,e.t1=e.catch(14),c("passphrase",u.Z.PASSWORD_GENERATION_FAILED),e.t1;case 37:e.next=42;break;case 39:e.prev=39,e.t2=e.catch(3),(0,R.H)(e.t2,"signup failed");case 42:C(!1);case 43:case"end":return e.stop()}}),e,null,[[3,39],[4,10],[14,33]])})));return function(n,t){return e.apply(this,arguments)}}();return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsxs)(h.Z.Title,{style:{marginBottom:"32px"},children:[(0,g.jsx)(Z.Z,{src:"/icon.svg"}),u.Z.SIGN_UP]}),(0,g.jsx)(l.J9,{initialValues:{email:"",passphrase:"",confirm:""},validationSchema:d.Ry().shape({email:d.Z_().email(u.Z.EMAIL_ERROR).required(u.Z.REQUIRED),passphrase:d.Z_().required(u.Z.REQUIRED),confirm:d.Z_().required(u.Z.REQUIRED)}),validateOnChange:!1,validateOnBlur:!1,onSubmit:k,children:function(n){var t=n.values,r=n.errors,i=n.touched,s=n.handleChange,l=n.handleSubmit;return(0,g.jsxs)(o.Z,{noValidate:!0,onSubmit:l,children:[(0,g.jsxs)(o.Z.Group,{controlId:"registrationForm.email",children:[(0,g.jsx)(o.Z.Control,{type:"email",placeholder:u.Z.ENTER_EMAIL,value:t.email,onChange:s("email"),isInvalid:Boolean(i.email&&r.email),autoFocus:!0,disabled:j}),(0,g.jsx)(c.Z.Feedback,{type:"invalid",children:r.email})]}),(0,g.jsxs)(o.Z.Group,{children:[(0,g.jsx)(o.Z.Control,{type:"password",placeholder:u.Z.PASSPHRASE_HINT,value:t.passphrase,onChange:s("passphrase"),isInvalid:Boolean(i.passphrase&&r.passphrase),disabled:j}),(0,g.jsx)(o.Z.Control.Feedback,{type:"invalid",children:r.passphrase})]}),(0,g.jsxs)(o.Z.Group,{children:[(0,g.jsx)(o.Z.Control,{type:"password",placeholder:u.Z.RE_ENTER_PASSPHRASE,value:t.confirm,onChange:s("confirm"),isInvalid:Boolean(i.confirm&&r.confirm),disabled:j}),(0,g.jsx)(o.Z.Control.Feedback,{type:"invalid",children:r.confirm})]}),(0,g.jsx)(o.Z.Group,{style:{marginBottom:"0",textAlign:"left"},controlId:"formBasicCheckbox-1",children:(0,g.jsx)(o.Z.Check,{checked:a,onChange:function(e){return N(e.target.checked)},type:"checkbox",label:u.Z.TERMS_AND_CONDITIONS()})}),(0,g.jsx)("br",{}),(0,g.jsx)(v.Z,{buttonText:u.Z.SUBMIT,loading:j,disabled:!a}),(0,g.jsx)("br",{}),(0,g.jsx)(_.Z,{block:!0,variant:"link",onClick:e.login,children:u.Z.ACCOUNT_EXISTS})]})}})]})}},2476:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return h}});var r=t(67294),a=t(11163),i=t(24479),s=t(24118),o=t(89862),c=t(39151),u=t(35641),l=t(5759),d=t(76640),p=t(85893);function h(){var e=(0,a.useRouter)(),n=(0,r.useContext)(s.AppContext),t=(0,r.useState)(!0),h=t[0],f=t[1];(0,r.useEffect)((function(){e.prefetch(d.q5.VERIFY),e.prefetch(d.q5.LOGIN);var t=(0,u.Yu)(u.Pd.USER);null!==t&&void 0!==t&&t.email&&e.push(d.q5.VERIFY),f(!1),n.showNavBar(!1)}),[]);return(0,p.jsx)(o.ZP,{children:h?(0,p.jsx)(c.Z,{}):(0,p.jsx)(i.Z,{style:{minWidth:"320px"},className:"text-center",children:(0,p.jsx)(i.Z.Body,{style:{padding:"40px 30px"},children:(0,p.jsx)(l.Z,{login:function(){e.push(d.q5.LOGIN)}})})})})}},66091:function(e,n,t){"use strict";t.d(n,{aF:function(){return a},Qj:function(){return i},fo:function(){return s},n_:function(){return o}});var r=t(35641),a=function(){var e,n;return null!==(e=null===(n=(0,r.Yu)(r.Pd.IS_FIRST_LOGIN))||void 0===n?void 0:n.status)&&void 0!==e&&e};function i(e){(0,r.a_)(r.Pd.IS_FIRST_LOGIN,{status:e})}var s=function(){var e,n;return null!==(e=null===(n=(0,r.Yu)(r.Pd.JUST_SIGNED_UP))||void 0===n?void 0:n.status)&&void 0!==e&&e};function o(e){(0,r.a_)(r.Pd.JUST_SIGNED_UP,{status:e})}},29474:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/signup",function(){return t(2476)}])}},function(e){e.O(0,[446,279,774,888,179],(function(){return n=29474,e(e.s=n);var n}));var n=e.O();_N_E=n}]);
//# sourceMappingURL=signup-708944695d12085d27f5.js.map