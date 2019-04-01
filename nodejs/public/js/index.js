
const sock = io('', { path: '/socket.io' });
sock.on('connect', function (data) {
    console.log('connect to socket.io server')
});
sock.on('le-feedback', function (data) {
    log(data)
});
sock.on('exist-certs', function (data) {
    vm.$emit('exist-certs', data);
});
var vm = new Vue({
    el: '.content',
    created: function () {
        this.$root.$on("exist-certs", data => {
            this.certs = data
        });
    },
    data: {
        domain: '',
        email: '',
        certs: []
    },
    methods: {
        req_cert: function () {
            if (!this.domain || !this.email) {
                alert('域名或邮箱不能为空');
            } else {
                sock.emit('req-cert', {
                    domain: this.domain,
                    email: this.email
                })
            }
        }
    }
})
function test_post() {
    $.ajax({
        type: "POST",
        url: '/ajax_relay',
        timeout: 3000,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            url: 'http://ny.cninone.com/index.php?route=api/equipment',
            data: {

            }
        }),
        dataType: "json"
    }).done((resp) => {
        console.log('success', resp);
    }).fail((err) => {
        console.log('failed: ', err);
    })
}

function log(str) {
    $(".logs").prepend(`${moment().format("YYYY-MM-DD HH:mm:ss")}: <i>${str}</i><br>`);
}
