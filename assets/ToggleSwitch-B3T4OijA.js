import{j as t}from"./index-s2CBF-ye.js";import{J as x,X as h}from"./ui-C6cEPXW8.js";const d=({checked:e=!1,onChange:a,size:l="sm",disabled:s=!1,className:o="",ariaLabel:i="",activeColor:c="peer-checked:bg-primary-600",inactiveColor:m="bg-gray-200 dark:bg-gray-700"})=>{const n={sm:{track:"w-10 h-5",thumb:"h-4 w-4",icon:"h-2.5 w-2.5",translateOn:"translate-x-5 rtl:-translate-x-5"},md:{track:"w-12 h-6",thumb:"h-5 w-5",icon:"h-3 w-3",translateOn:"translate-x-6 rtl:-translate-x-6"},lg:{track:"w-14 h-7",thumb:"h-6 w-6",icon:"h-3.5 w-3.5",translateOn:"translate-x-7 rtl:-translate-x-7"}},r=n[l]||n.sm;return t.jsxs("label",{className:`inline-flex items-center ${s?"cursor-not-allowed opacity-50":"cursor-pointer"} ${o}`,children:[t.jsx("input",{type:"checkbox",checked:e,onChange:u=>!s&&(a==null?void 0:a(u.target.checked)),disabled:s,className:"sr-only peer","aria-label":i}),t.jsx("div",{className:`
          relative ${r.track} rounded-full
          ${m}
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-700
          ${c}
          transition-colors duration-200
        `,children:t.jsx("span",{className:`
            absolute top-0.5 start-0.5
            ${r.thumb} rounded-full bg-white shadow-md
            flex items-center justify-center
            transition-transform duration-200 ease-in-out
            ${e?r.translateOn:"translate-x-0"}
          `,children:e?t.jsx(x,{className:`${r.icon} text-green-600`,strokeWidth:3}):t.jsx(h,{className:`${r.icon} text-gray-400`,strokeWidth:2.5})})})]})};export{d as T};
//# sourceMappingURL=ToggleSwitch-B3T4OijA.js.map
