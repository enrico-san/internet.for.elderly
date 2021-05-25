import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const this_store = new Vuex.Store({
  state: {
    guide: {}  // reactive only:source of truth is preload.js->guide
  },
  actions: {  // store.dispatch(args)
    // ACTION({commit}, payload) { commit('MUTATION', payload) }
    UPDATE_GUIDE({commit}) {
      const guide = window.api.guide()
      commit('SET_GUIDE', guide)
    },
  },
  mutations: {
    // MUTATION(state, payload) {state.var = payload...}
    SET_GUIDE(state, guide) {
      state.guide = guide
    },
  },
  getters: {  // store.getters.<var>
    //<var>(state) { return state.var }
    guide(state) { return state.guide },
  },
})

export default this_store