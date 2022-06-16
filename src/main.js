import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "@assets/css/baseLess.less"; //全局初始化样式
import { FormModel,Input } from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

Vue.config.productionTip = false;
// 按需引入antd design
Vue.use(FormModel).use(Input);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");