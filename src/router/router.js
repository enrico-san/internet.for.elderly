import Vue from 'vue'
import Home from '../components/Home.vue'

import VueRouter from 'vue-router'

Vue.use(VueRouter)

export default new VueRouter({
    mode: process.env.IS_ELECTRON ? 'hash' : 'history',
    routes: [
        {
            name: 'home',
            path: '/',
            component: Home
        },
    ]
})
