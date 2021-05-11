import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
const x = require('../list.json')

export default new Vuex.Store({
    state: {
      tmp: x
    },
    actions: {
      DO({ commit }) {
        commit('DODO');
    },
},
    mutations: {
      DODO(state) {
        state.tmp[0]['title'] = '************'
      }
    },
    getters: {
        channels(state) {
            return window.api ? window.api.list() :state.tmp
        }
    },
})