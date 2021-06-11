import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const this_store = new Vuex.Store({
  state: {
    guide: {},
    messages: [],
  },
  actions: {  // store.dispatch(args)
    // ACTION({commit}, payload) { commit('MUTATION', payload) }
    UPDATE_GUIDE({commit}) {
      const guide = window.api.guide()
      commit('SET_GUIDE', guide)
    },
    UPDATE_MESSAGES({commit}, payload) {
      commit('APPEND_MESSAGES', payload)
    },
    MESSAGE_PLAYED({commit}) {
      commit('NEXT_MESSAGE')
    },
  },
  mutations: {
    // MUTATION(state, payload) {state.var = payload...}
    SET_GUIDE(state, guide) {
      state.guide = guide
    },
    APPEND_MESSAGES(state, payload) {
      state.messages.push(...payload)
    },
    NEXT_MESSAGE(state) {
      state.messages.splice(0, 1)
    },
  },
  getters: {  // store.getters.<var>
    //<var>(state) { return state.var }
    guide(state) { return state.guide },
    message(state) { return state.messages[0] || {empty: true} },
    message_count(state) { return state.messages.length },
  },
})

export default this_store