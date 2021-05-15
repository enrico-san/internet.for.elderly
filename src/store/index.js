import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
  },
  actions: {  // store.dispatch(args)
    // ACTION({commit}, payload) { commit('MUTATION', payload) }
  },
  mutations: {
    // MUTATION(state, payload) {state.var = payload...}
  },
  getters: {  // store.getters.<var>
    //<var>(state) { return state.var }
    channels() { return window.api.list() },
  },
})