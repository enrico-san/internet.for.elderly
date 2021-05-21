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
      // setInterval(() => {
      //   retrieve_guide()
      // }, 60*5*1000)
    },
    UPDATE_CURRENT_TIME({commit}, payload) {  // [channel, time, playlist index]
      commit('SET_CURRENT_TIME', payload)
      window.api.update_current_time(...payload)
    },
  },
  mutations: {
    // MUTATION(state, payload) {state.var = payload...}
    SET_GUIDE(state, guide) {
      state.guide = guide
    },
    SET_CURRENT_TIME(state, [num, time]) {
      state.guide[num].currentTime = time
    }
  },
  getters: {  // store.getters.<var>
    //<var>(state) { return state.var }
    guide(state) { return state.guide },
  },
})

export default this_store