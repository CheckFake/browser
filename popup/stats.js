import Vue from 'vue';
import App from './app.vue'

let vm = new Vue({
    el: '#vue-app',
    components: {
        App
    },
    render(h) {
        return h('app');
    }
});
