import 'material-design-icons-iconfont/dist/material-design-icons.css'
import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex';
import vuetify from './plugins/vuetify';
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import store from './store/index';
import router from './router/router';
import VueCompositionApi from '@vue/composition-api';
import youtube from './plugins/youtube'
import {eventBus} from './eventBus'

Vue.use(VueCompositionApi);
Vue.use(Vuetify)
Vue.use(Vuex)
Vue.use(youtube)

Vue.config.productionTip = false

const ws = new WebSocket('ws://localhost:8081');
Vue.prototype.$ws = ws
ws.onmessage = e => {
  const data = JSON.parse(e.data)
  console.log(data)
  store.dispatch('UPDATE_MESSAGES', data)
  eventBus.$emit('messages')
}
ws.onopen = () => console.log('ws connected')


const app = new Vue({
  vuetify,
  render: h => h(App),
  store,
  router,
})

app.$mount('#app')
